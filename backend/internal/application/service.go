package application

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"strings"
	"sync"
	"time"

	"ruleshift.live/backend/internal/domain"
)

// Repository implementations may only persist entities; interpretation is a port.
// One local backend instance serializes commands. SQL constraints remain the final
// defense against duplicate messages and multiple running rounds.
type Repository interface {
	Snapshot(context.Context) (domain.Snapshot, error)
	HasMessage(context.Context, string, string) (bool, error)
	LastProposalAt(context.Context, string, string) (time.Time, error)
	InsertProposal(context.Context, domain.RuleProposal) error
	Decide(context.Context, string, string) error
	InsertRound(context.Context, domain.Round) error
	EndRound(context.Context, string, string) error
	Telemetry(context.Context, string, int, int) error
}

type Interpreter interface {
	Interpret(context.Context, string) (domain.RuleDefinition, error)
}

type Service struct {
	repo        Repository
	interpreter Interpreter
	mu          sync.Mutex
	Now         func() time.Time
}

func New(repo Repository, interpreter Interpreter) *Service {
	return &Service{repo: repo, interpreter: interpreter, Now: time.Now}
}
func ID() string {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		panic(err)
	}
	return hex.EncodeToString(b)
}

func (s *Service) Ingest(ctx context.Context, messageID, viewerID, author, text string) (*domain.RuleProposal, error) {
	if !strings.HasPrefix(strings.ToLower(strings.TrimSpace(text)), "!rule ") {
		return nil, nil
	}
	if messageID == "" || viewerID == "" || author == "" || len(text) > 500 || len(author) > 100 || len(messageID) > 128 || len(viewerID) > 128 {
		return nil, errors.New("invalid chat envelope")
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	duplicate, err := s.repo.HasMessage(ctx, "twitch", messageID)
	if err != nil {
		return nil, err
	}
	if duplicate {
		return nil, domain.ErrDuplicate
	}
	last, err := s.repo.LastProposalAt(ctx, "twitch", viewerID)
	if err != nil {
		return nil, err
	}
	now := s.Now().UTC()
	if !last.IsZero() && now.Sub(last) < 10*time.Second {
		return nil, domain.ErrCooldown
	}
	state, err := s.state(ctx)
	if err != nil {
		return nil, err
	}
	count := 0
	for _, p := range state.Proposals {
		if p.Status == "pending" {
			count++
		}
	}
	if count >= 32 {
		return nil, domain.ErrQueueFull
	}
	p := domain.RuleProposal{ID: ID(), MessageID: messageID, ViewerID: viewerID, Author: author, Text: strings.TrimSpace(text), Source: "twitch", Status: "pending", CreatedAt: now}
	rule, parseErr := s.interpreter.Interpret(ctx, p.Text)
	if parseErr != nil {
		p.Status = "unsupported"
		p.Reason = parseErr.Error()
	} else if err := rule.Validate(); err != nil {
		p.Status = "unsupported"
		p.Reason = err.Error()
	} else {
		p.Rule = &rule
	}
	if err := s.repo.InsertProposal(ctx, p); err != nil {
		return nil, err
	}
	return &p, nil
}

func (s *Service) state(ctx context.Context) (domain.Snapshot, error) {
	v, err := s.repo.Snapshot(ctx)
	if err != nil {
		return v, err
	}
	if v.Round != nil && v.Round.Status == "running" && !s.Now().Before(v.Round.EndsAt) {
		if err := s.repo.EndRound(ctx, v.Round.ID, "finished"); err != nil {
			return v, err
		}
		v.Round.Status = "finished"
	}
	return v, nil
}
func (s *Service) State(ctx context.Context) (domain.Snapshot, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.state(ctx)
}

func (s *Service) Decide(ctx context.Context, id, decision string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if decision != "approved" && decision != "vetoed" {
		return domain.ErrConflict
	}
	v, err := s.state(ctx)
	if err != nil {
		return err
	}
	if decision == "approved" && v.Round != nil && v.Round.Status == "running" {
		return domain.ErrConflict
	}
	for _, p := range v.Proposals {
		if p.ID == id {
			if p.Status != "pending" && !(decision == "vetoed" && p.Status == "approved") {
				return domain.ErrConflict
			}
			if decision == "approved" {
				if p.Rule == nil {
					return domain.ErrConflict
				}
				if err := p.Rule.Validate(); err != nil {
					return err
				}
			}
			return s.repo.Decide(ctx, id, decision)
		}
	}
	return domain.ErrNotFound
}
func (s *Service) Start(ctx context.Context, proposalID string) (*domain.Round, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	v, err := s.state(ctx)
	if err != nil {
		return nil, err
	}
	if v.Round != nil && v.Round.Status == "running" {
		return nil, domain.ErrConflict
	}
	for _, p := range v.Proposals {
		if p.ID == proposalID {
			r, err := domain.NewRound(ID(), p, s.Now().UTC())
			if err != nil {
				return nil, err
			}
			if err = s.repo.InsertRound(ctx, r); err != nil {
				return nil, err
			}
			return &r, nil
		}
	}
	return nil, domain.ErrNotFound
}
func (s *Service) Stop(ctx context.Context, id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	v, err := s.state(ctx)
	if err != nil {
		return err
	}
	if v.Round == nil || v.Round.ID != id {
		return domain.ErrNotFound
	}
	if v.Round.Status != "running" {
		return domain.ErrConflict
	}
	return s.repo.EndRound(ctx, id, "stopped")
}
func (s *Service) Report(ctx context.Context, id string, sequence, coins int) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	v, err := s.state(ctx)
	if err != nil {
		return err
	}
	if v.Round == nil || v.Round.ID != id {
		return domain.ErrNotFound
	}
	if v.Round.Status != "running" {
		return domain.ErrConflict
	}
	if sequence <= v.Round.Sequence {
		return nil
	}
	if coins < v.Round.Coins || coins > 10000 || sequence > 100000 {
		return domain.ErrConflict
	}
	return s.repo.Telemetry(ctx, id, sequence, coins)
}
