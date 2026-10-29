package postgres

import (
	"context"
	"embed"
	"encoding/json"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"ruleshift.live/backend/internal/domain"
)

//go:embed migrations/*.sql
var migrations embed.FS

type Repository struct{ Pool *pgxpool.Pool }

func Open(ctx context.Context, url string) (*Repository, error) {
	pool, err := pgxpool.New(ctx, url)
	if err != nil {
		return nil, err
	}
	if err = pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, err
	}
	r := &Repository{Pool: pool}
	if err = r.Migrate(ctx); err != nil {
		pool.Close()
		return nil, err
	}
	return r, nil
}
func (r *Repository) Migrate(ctx context.Context) error {
	sql, err := migrations.ReadFile("migrations/001_initial.sql")
	if err != nil {
		return err
	}
	tx, err := r.Pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	// Idempotent initial migration, serialized against another startup.
	if _, err = tx.Exec(ctx, "SELECT pg_advisory_xact_lock(7275341)"); err != nil {
		return err
	}
	if _, err = tx.Exec(ctx, string(sql)); err != nil {
		return err
	}
	return tx.Commit(ctx)
}
func (r *Repository) Snapshot(ctx context.Context) (domain.Snapshot, error) {
	v := domain.Snapshot{Proposals: []domain.RuleProposal{}}
	// Always include all actionable proposals; bound the historical tail.
	rows, err := r.Pool.Query(ctx, `SELECT id,message_id,viewer_id,author,body,source,status,rule,reason,created_at FROM proposals WHERE status IN ('pending','approved') OR id IN (SELECT id FROM proposals WHERE status NOT IN ('pending','approved') ORDER BY created_at DESC LIMIT 20) ORDER BY created_at DESC`)
	if err != nil {
		return v, err
	}
	defer rows.Close()
	for rows.Next() {
		var p domain.RuleProposal
		var rule []byte
		if err = rows.Scan(&p.ID, &p.MessageID, &p.ViewerID, &p.Author, &p.Text, &p.Source, &p.Status, &rule, &p.Reason, &p.CreatedAt); err != nil {
			return v, err
		}
		if rule != nil {
			if err = json.Unmarshal(rule, &p.Rule); err != nil {
				return v, err
			}
		}
		v.Proposals = append(v.Proposals, p)
	}
	if err = rows.Err(); err != nil {
		return v, err
	}
	var round domain.Round
	var rule []byte
	err = r.Pool.QueryRow(ctx, `SELECT id,proposal_id,author,source,rule,status,started_at,ends_at,coins,sequence FROM rounds ORDER BY (status='running') DESC, started_at DESC, id DESC LIMIT 1`).Scan(&round.ID, &round.ProposalID, &round.Author, &round.Source, &rule, &round.Status, &round.StartedAt, &round.EndsAt, &round.Coins, &round.Sequence)
	if errors.Is(err, pgx.ErrNoRows) {
		return v, nil
	}
	if err != nil {
		return v, err
	}
	if err = json.Unmarshal(rule, &round.Rule); err != nil {
		return v, err
	}
	v.Round = &round
	return v, nil
}
func (r *Repository) HasMessage(ctx context.Context, source, id string) (bool, error) {
	var found bool
	err := r.Pool.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM proposals WHERE source=$1 AND message_id=$2)", source, id).Scan(&found)
	return found, err
}
func (r *Repository) LastProposalAt(ctx context.Context, source, viewer string) (time.Time, error) {
	var t time.Time
	err := r.Pool.QueryRow(ctx, "SELECT created_at FROM proposals WHERE source=$1 AND viewer_id=$2 ORDER BY created_at DESC LIMIT 1", source, viewer).Scan(&t)
	if errors.Is(err, pgx.ErrNoRows) {
		return time.Time{}, nil
	}
	return t, err
}
func (r *Repository) InsertProposal(ctx context.Context, p domain.RuleProposal) error {
	var rule any
	if p.Rule != nil {
		b, err := json.Marshal(p.Rule)
		if err != nil {
			return err
		}
		rule = b
	}
	_, err := r.Pool.Exec(ctx, `INSERT INTO proposals (id,message_id,source,viewer_id,author,body,status,rule,reason,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, p.ID, p.MessageID, p.Source, p.ViewerID, p.Author, p.Text, p.Status, rule, p.Reason, p.CreatedAt)
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "23505" {
		return domain.ErrDuplicate
	}
	return err
}
func (r *Repository) Decide(ctx context.Context, id, status string) error {
	tx, err := r.Pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	if status == "approved" {
		if _, err = tx.Exec(ctx, "UPDATE proposals SET status='pending' WHERE status='approved'"); err != nil {
			return err
		}
	}
	result, err := tx.Exec(ctx, "UPDATE proposals SET status=$2 WHERE id=$1 AND (status='pending' OR (status='approved' AND $2='vetoed'))", id, status)
	if err != nil {
		return err
	}
	if result.RowsAffected() != 1 {
		return domain.ErrConflict
	}
	return tx.Commit(ctx)
}
func (r *Repository) InsertRound(ctx context.Context, v domain.Round) error {
	tx, err := r.Pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	result, err := tx.Exec(ctx, "UPDATE proposals SET status='used' WHERE id=$1 AND status='approved'", v.ProposalID)
	if err != nil {
		return err
	}
	if result.RowsAffected() != 1 {
		return domain.ErrConflict
	}
	rule, err := json.Marshal(v.Rule)
	if err != nil {
		return err
	}
	_, err = tx.Exec(ctx, `INSERT INTO rounds(id,proposal_id,author,source,rule,status,started_at,ends_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8)`, v.ID, v.ProposalID, v.Author, v.Source, rule, v.Status, v.StartedAt, v.EndsAt)
	if err != nil {
		return err
	}
	return tx.Commit(ctx)
}
func (r *Repository) EndRound(ctx context.Context, id, status string) error {
	_, err := r.Pool.Exec(ctx, "UPDATE rounds SET status=$2 WHERE id=$1 AND status='running'", id, status)
	return err
}
func (r *Repository) Telemetry(ctx context.Context, id string, sequence, coins int) error {
	_, err := r.Pool.Exec(ctx, "UPDATE rounds SET sequence=$2,coins=$3 WHERE id=$1 AND status='running' AND sequence<$2", id, sequence, coins)
	return err
}
