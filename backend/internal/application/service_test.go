package application_test

import (
	"context"
	"errors"
	"fmt"
	"ruleshift.live/backend/internal/adapters/parser"
	"ruleshift.live/backend/internal/application"
	"ruleshift.live/backend/internal/domain"
	"ruleshift.live/backend/internal/testsupport"
	"sync"
	"testing"
	"time"
)

const command = "!rule Every third coin flips gravity for 4 seconds"

func fixture() (*application.Service, *testsupport.Repository, *time.Time) {
	repo := &testsupport.Repository{}
	s := application.New(repo, parser.Parser{})
	now := time.Date(2026, 10, 29, 12, 0, 0, 0, time.UTC)
	s.Now = func() time.Time { return now }
	return s, repo, &now
}
func TestIntakeDedupCooldownAndUnsupported(t *testing.T) {
	s, _, now := fixture()
	ctx := context.Background()
	p, err := s.Ingest(ctx, "m1", "v1", "Viewer", command)
	if err != nil || p.Status != "pending" {
		t.Fatalf("%+v %v", p, err)
	}
	if _, err = s.Ingest(ctx, "m1", "v1", "Viewer", command); !errors.Is(err, domain.ErrDuplicate) {
		t.Fatal(err)
	}
	if _, err = s.Ingest(ctx, "m2", "v1", "Viewer", command); !errors.Is(err, domain.ErrCooldown) {
		t.Fatal(err)
	}
	*now = now.Add(10 * time.Second)
	p, err = s.Ingest(ctx, "m3", "v1", "Viewer", "!rule run arbitrary code")
	if err != nil || p.Status != "unsupported" || p.Rule != nil {
		t.Fatalf("%+v %v", p, err)
	}
	if err = s.Decide(ctx, p.ID, "approved"); !errors.Is(err, domain.ErrConflict) {
		t.Fatal("unsupported proposal was approved")
	}
	if p, err = s.Ingest(ctx, "m4", "v1", "Viewer", "hello"); p != nil || err != nil {
		t.Fatal("ordinary chat entered queue")
	}
}
func TestApprovalActivationVetoTelemetryAndExpiry(t *testing.T) {
	s, _, now := fixture()
	ctx := context.Background()
	p, _ := s.Ingest(ctx, "m1", "v1", "Viewer", command)
	if _, err := s.Start(ctx, p.ID); !errors.Is(err, domain.ErrConflict) {
		t.Fatal("unapproved round started")
	}
	if err := s.Decide(ctx, p.ID, "approved"); err != nil {
		t.Fatal(err)
	}
	r, err := s.Start(ctx, p.ID)
	if err != nil {
		t.Fatal(err)
	}
	if _, err = s.Start(ctx, p.ID); !errors.Is(err, domain.ErrConflict) {
		t.Fatal("multiple rounds running")
	}
	if err = s.Report(ctx, r.ID, 2, 3); err != nil {
		t.Fatal(err)
	}
	s.Report(ctx, r.ID, 1, 0)
	v, _ := s.State(ctx)
	if v.Round.Coins != 3 {
		t.Fatal("out-of-order telemetry changed coins")
	}
	if err = s.Report(ctx, r.ID, 3, 2); !errors.Is(err, domain.ErrConflict) {
		t.Fatal("score decreased")
	}
	*now = now.Add(domain.RoundDuration)
	v, err = s.State(ctx)
	if err != nil || v.Round.Status != "finished" {
		t.Fatal("round did not auto-finish")
	}
	if err = s.Report(ctx, r.ID, 4, 4); !errors.Is(err, domain.ErrConflict) {
		t.Fatal("finished round accepted telemetry")
	}
	p2, _ := s.Ingest(ctx, "m2", "v2", "Other", command)
	if err = s.Decide(ctx, p2.ID, "vetoed"); err != nil {
		t.Fatal(err)
	}
	if _, err = s.Start(ctx, p2.ID); !errors.Is(err, domain.ErrConflict) {
		t.Fatal("vetoed proposal activated")
	}
	p3, _ := s.Ingest(ctx, "m3", "v3", "Third", command)
	s.Decide(ctx, p3.ID, "approved")
	r, err = s.Start(ctx, p3.ID)
	if err != nil {
		t.Fatal(err)
	}
	if err = s.Stop(ctx, r.ID); err != nil {
		t.Fatal(err)
	}
	v, _ = s.State(ctx)
	if v.Round.Status != "stopped" {
		t.Fatal("veto failed to stop active round")
	}
}
func TestQueueBoundAndConcurrentDuplicate(t *testing.T) {
	s, _, _ := fixture()
	ctx := context.Background()
	var wg sync.WaitGroup
	for range 16 {
		wg.Add(1)
		go func() { defer wg.Done(); s.Ingest(ctx, "same", "same", "Viewer", command) }()
	}
	wg.Wait()
	v, _ := s.State(ctx)
	if len(v.Proposals) != 1 {
		t.Fatal("duplicate race created multiple proposals")
	}
	for i := 1; i < 32; i++ {
		if _, err := s.Ingest(ctx, fmt.Sprint(i), fmt.Sprint(i), "Viewer", command); err != nil {
			t.Fatal(err)
		}
	}
	if _, err := s.Ingest(ctx, "overflow", "overflow", "Viewer", command); !errors.Is(err, domain.ErrQueueFull) {
		t.Fatal("queue exceeded bound")
	}
}
func TestSingleApprovedRule(t *testing.T) {
	s, _, _ := fixture()
	ctx := context.Background()
	a, _ := s.Ingest(ctx, "a", "a", "A", command)
	b, _ := s.Ingest(ctx, "b", "b", "B", command)
	s.Decide(ctx, a.ID, "approved")
	s.Decide(ctx, b.ID, "approved")
	v, _ := s.State(ctx)
	count := 0
	for _, p := range v.Proposals {
		if p.Status == "approved" {
			count++
			if p.ID != b.ID {
				t.Fatal("old rule remained approved")
			}
		}
	}
	if count != 1 {
		t.Fatal(count)
	}
}
