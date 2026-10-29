package postgres

import (
	"context"
	"errors"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"net/url"
	"os"
	"ruleshift.live/backend/internal/adapters/parser"
	"ruleshift.live/backend/internal/application"
	"ruleshift.live/backend/internal/domain"
	"strings"
	"testing"
	"time"
)

func TestPostgreSQLIntegration(t *testing.T) {
	raw := os.Getenv("TEST_DATABASE_URL")
	if raw == "" {
		t.Skip("PENDING real PostgreSQL: set TEST_DATABASE_URL to a dedicated database ending in _test")
	}
	u, err := url.Parse(raw)
	if err != nil || !strings.HasSuffix(u.Path, "_test") {
		t.Fatal("integration database URL must name a dedicated database ending in _test")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()
	admin, err := pgxpool.New(ctx, raw)
	if err != nil {
		t.Fatal(err)
	}
	defer admin.Close()
	info, err := Inspect(ctx, raw)
	if err != nil {
		t.Fatal("PostgreSQL 18 preflight failed (connection details withheld)")
	}
	if info.Major != 18 {
		t.Fatal("integration test must use PostgreSQL 18")
	}
	schema := "ruleshift_test_" + application.ID()
	quoted := pgx.Identifier{schema}.Sanitize()
	if _, err = admin.Exec(ctx, "CREATE SCHEMA "+quoted); err != nil {
		t.Fatal(err)
	}
	defer func() {
		cleanup, done := context.WithTimeout(context.Background(), 5*time.Second)
		defer done()
		if _, err := admin.Exec(cleanup, "DROP SCHEMA "+quoted+" CASCADE"); err != nil {
			t.Error("test schema cleanup failed", err)
		}
	}()
	q := u.Query()
	q.Set("search_path", schema)
	u.RawQuery = q.Encode()
	repo, err := Open(ctx, u.String())
	if err != nil {
		t.Fatal(err)
	}
	defer repo.Pool.Close()
	if err = repo.Migrate(ctx); err != nil {
		t.Fatal("migration not idempotent", err)
	}
	app := application.New(repo, parser.Parser{})
	p, err := app.Ingest(ctx, "fixture-message", "fixture-viewer", "Fixture viewer", "!rule Every third coin flips gravity for 4 seconds")
	if err != nil {
		t.Fatal(err)
	}
	if err = repo.InsertProposal(ctx, *p); !errors.Is(err, domain.ErrDuplicate) {
		t.Fatal("database duplicate constraint failed", err)
	}
	// A new service/repository must see the persisted queue and cooldown.
	reopened, err := Open(ctx, u.String())
	if err != nil {
		t.Fatal(err)
	}
	defer reopened.Pool.Close()
	second := application.New(reopened, parser.Parser{})
	if _, err = second.Ingest(ctx, "second-message", "fixture-viewer", "Fixture viewer", "!rule Every third coin flips gravity for 4 seconds"); !errors.Is(err, domain.ErrCooldown) {
		t.Fatal("cooldown did not persist", err)
	}
	if err = second.Decide(ctx, p.ID, "approved"); err != nil {
		t.Fatal(err)
	}
	r, err := second.Start(ctx, p.ID)
	if err != nil {
		t.Fatal(err)
	}
	if err = second.Report(ctx, r.ID, 1, 3); err != nil {
		t.Fatal(err)
	}
	v, err := app.State(ctx)
	if err != nil || v.Round == nil || v.Round.Coins != 3 || v.Proposals[0].Status != "used" {
		t.Fatalf("round not persisted %+v %v", v, err)
	}
	if err = second.Stop(ctx, r.ID); err != nil {
		t.Fatal(err)
	}
	v, _ = app.State(ctx)
	if v.Round.Status != "stopped" {
		t.Fatal("stop not persisted")
	}
}
