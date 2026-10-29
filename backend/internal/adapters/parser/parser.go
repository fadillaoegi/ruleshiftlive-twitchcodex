// Package parser deliberately implements a constrained grammar, not AI inference.
package parser

import (
	"context"
	"errors"
	"regexp"
	"ruleshift.live/backend/internal/domain"
	"strconv"
	"strings"
)

type Parser struct{}

var grammar = regexp.MustCompile(`(?i)^!rule every (third|[0-9]+)(?: coins?| coin) flips gravity for ([0-9]+) seconds?\.?$`)

func (Parser) Interpret(_ context.Context, text string) (domain.RuleDefinition, error) {
	m := grammar.FindStringSubmatch(strings.TrimSpace(text))
	if m == nil {
		return domain.RuleDefinition{}, errors.New("Supported format: !rule Every third coin flips gravity for 4 seconds")
	}
	every := 3
	if strings.ToLower(m[1]) != "third" {
		var err error
		every, err = strconv.Atoi(m[1])
		if err != nil {
			return domain.RuleDefinition{}, errors.New("coin frequency is out of bounds")
		}
	}
	seconds, err := strconv.Atoi(m[2])
	if err != nil || seconds < 1 || seconds > 6 {
		return domain.RuleDefinition{}, errors.New("duration must be 1–6 whole seconds")
	}
	r := domain.RuleDefinition{Version: 1, Trigger: domain.Trigger{Kind: "coin_collected", Every: every}, Effect: domain.Effect{Kind: "gravity_flip", DurationMS: seconds * 1000}}
	return r, r.Validate()
}
