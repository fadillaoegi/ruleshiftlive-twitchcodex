package domain

import (
	"testing"
	"time"
)

func TestRoundRequiresApprovalAndSupportedSchema(t *testing.T) {
	r := RuleDefinition{Version: 1, Trigger: Trigger{Kind: "coin_collected", Every: 3}, Effect: Effect{Kind: "gravity_flip", DurationMS: 4000}}
	p := RuleProposal{ID: "p", Status: "pending", Rule: &r}
	if _, err := NewRound("r", p, time.Now()); err == nil {
		t.Fatal("unapproved proposal started")
	}
	p.Status = "approved"
	round, err := NewRound("r", p, time.Now())
	if err != nil {
		t.Fatal(err)
	}
	if round.EndsAt.Sub(round.StartedAt) != 75*time.Second {
		t.Fatal("round must last 75 seconds")
	}
	r.Effect.Kind = "execute_code"
	if _, err = NewRound("r", p, time.Now()); err == nil {
		t.Fatal("unsupported schema started")
	}
}
