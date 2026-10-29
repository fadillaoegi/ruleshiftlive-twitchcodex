package application_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"ruleshift.live/backend/internal/domain"
)

func TestFinalScoreAfterServerExpiryIsSavedOnce(t *testing.T) {
	s, _, now := fixture()
	ctx := context.Background()
	p, _ := s.Ingest(ctx, "m1", "v1", "Viewer", command)
	s.Decide(ctx, p.ID, "approved")
	r, err := s.Start(ctx, p.ID)
	if err != nil {
		t.Fatal(err)
	}
	if r.MessageID != "m1" {
		t.Fatal("round lost its originating chat message")
	}
	s.Report(ctx, r.ID, 1, 2)
	if _, err = s.Finish(ctx, r.ID, 2, 3); !errors.Is(err, domain.ErrConflict) {
		t.Fatal("client finished before server deadline")
	}
	*now = now.Add(domain.RoundDuration)
	v, _ := s.State(ctx)
	if v.Round.Status != "finished" || v.Round.ResultSaved {
		t.Fatal("server expiry must preserve an unconfirmed final score")
	}
	final, err := s.Finish(ctx, r.ID, 2, 3)
	if err != nil {
		t.Fatal(err)
	}
	if final.Coins != 3 || !final.ResultSaved || final.Status != "finished" {
		t.Fatal("last coin was lost")
	}
	if _, err = s.Finish(ctx, r.ID, 2, 3); err != nil {
		t.Fatal("identical final report must be retryable", err)
	}
	if _, err = s.Finish(ctx, r.ID, 3, 4); !errors.Is(err, domain.ErrConflict) {
		t.Fatal("closed score was changed")
	}
	if err = s.Report(ctx, r.ID, 3, 4); !errors.Is(err, domain.ErrConflict) {
		t.Fatal("regular telemetry altered a closed round")
	}
}

func TestStopAtomicallyClosesWithLastScore(t *testing.T) {
	s, _, _ := fixture()
	ctx := context.Background()
	p, _ := s.Ingest(ctx, "m1", "v1", "Viewer", command)
	s.Decide(ctx, p.ID, "approved")
	r, _ := s.Start(ctx, p.ID)
	s.Report(ctx, r.ID, 1, 2)
	final, err := s.StopWithResult(ctx, r.ID, 2, 3)
	if err != nil {
		t.Fatal(err)
	}
	if final.Status != "stopped" || final.Coins != 3 || !final.ResultSaved {
		t.Fatal("stop lost the final score")
	}
	if _, err = s.StopWithResult(ctx, r.ID, 2, 3); err != nil {
		t.Fatal("lost stop acknowledgement cannot be retried", err)
	}
	if err = s.Stop(ctx, r.ID); err != nil {
		t.Fatal("legacy stop should be idempotent on a closed round", err)
	}
	if _, err = s.StopWithResult(ctx, r.ID, 3, 99); !errors.Is(err, domain.ErrConflict) {
		t.Fatal("stopped result changed")
	}
}

func TestOldFinalReportDoesNotAlterNewRound(t *testing.T) {
	s, repo, now := fixture()
	ctx := context.Background()
	p, _ := s.Ingest(ctx, "m1", "v1", "Viewer", command)
	s.Decide(ctx, p.ID, "approved")
	old, _ := s.Start(ctx, p.ID)
	*now = now.Add(domain.RoundDuration)
	s.State(ctx)
	p2, _ := s.Ingest(ctx, "m2", "v2", "Next", command)
	s.Decide(ctx, p2.ID, "approved")
	next, _ := s.Start(ctx, p2.ID)
	if _, err := s.Finish(ctx, old.ID, 1, 3); err != nil {
		t.Fatal("late old-round score could not be saved", err)
	}
	v, _ := s.State(ctx)
	if v.Round.ID != next.ID || v.Round.Status != "running" || v.Round.Coins != 0 {
		t.Fatal("old report altered new round")
	}
	persisted, err := repo.RoundByID(ctx, old.ID)
	if err != nil || !persisted.ResultSaved || persisted.Coins != 3 {
		t.Fatal("old result was not persisted", err)
	}
}

func TestFinalReportBoundsAndRecoveryWindow(t *testing.T) {
	s, _, now := fixture()
	ctx := context.Background()
	p, _ := s.Ingest(ctx, "m1", "v1", "Viewer", command)
	s.Decide(ctx, p.ID, "approved")
	r, _ := s.Start(ctx, p.ID)
	s.Report(ctx, r.ID, 1, 2)
	for _, report := range [][2]int{{0, 3}, {1, 3}, {2, -1}, {2, 1}, {2, 10001}, {100001, 3}} {
		if _, err := s.StopWithResult(ctx, r.ID, report[0], report[1]); !errors.Is(err, domain.ErrConflict) {
			t.Fatal("invalid final report accepted", report, err)
		}
	}
	*now = now.Add(domain.RoundDuration + 31*time.Second)
	if _, err := s.Finish(ctx, r.ID, 2, 3); !errors.Is(err, domain.ErrConflict) {
		t.Fatal("stale final report accepted")
	}
}

func TestDeadlineWinsWhenStopRacesExpiry(t *testing.T) {
	s, _, now := fixture()
	ctx := context.Background()
	p, _ := s.Ingest(ctx, "m1", "v1", "Viewer", command)
	s.Decide(ctx, p.ID, "approved")
	r, _ := s.Start(ctx, p.ID)
	*now = now.Add(domain.RoundDuration)
	final, err := s.StopWithResult(ctx, r.ID, 1, 3)
	if err != nil {
		t.Fatal(err)
	}
	if final.Status != "finished" {
		t.Fatal("stop replaced authoritative expiry")
	}
}
