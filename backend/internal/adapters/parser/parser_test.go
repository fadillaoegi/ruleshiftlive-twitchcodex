package parser

import (
	"context"
	"encoding/json"
	"os"
	"testing"
)

func TestSharedRuleContract(t *testing.T) {
	b, err := os.ReadFile("../../../../docs/rule-contract-cases.json")
	if err != nil {
		t.Fatal(err)
	}
	var cases []struct {
		Text       string
		Valid      bool
		Every      int
		DurationMS int `json:"duration_ms"`
	}
	if err = json.Unmarshal(b, &cases); err != nil {
		t.Fatal(err)
	}
	for _, c := range cases {
		t.Run(c.Text, func(t *testing.T) {
			r, err := (Parser{}).Interpret(context.Background(), c.Text)
			if (err == nil) != c.Valid {
				t.Fatalf("valid=%v error=%v", c.Valid, err)
			}
			if c.Valid && (r.Trigger.Every != c.Every || r.Effect.DurationMS != c.DurationMS) {
				t.Fatalf("wrong interpretation: %+v", r)
			}
		})
	}
}
