package domain

import (
	"errors"
	"fmt"
	"time"
)

var (
	ErrUnavailable = errors.New("PostgreSQL is unavailable; live controls are disabled")
	ErrNotFound    = errors.New("proposal or round not found")
	ErrConflict    = errors.New("action is not allowed in the current state")
	ErrDuplicate   = errors.New("message was already received")
	ErrCooldown    = errors.New("please wait 10 seconds before another proposal")
	ErrQueueFull   = errors.New("proposal queue is full")
)

// RuleDefinition is the shared wire contract. No chat text is executable.
type RuleDefinition struct {
	Version int     `json:"version"`
	Trigger Trigger `json:"trigger"`
	Effect  Effect  `json:"effect"`
}
type Trigger struct {
	Kind  string `json:"kind"`
	Every int    `json:"every"`
}
type Effect struct {
	Kind       string `json:"kind"`
	DurationMS int    `json:"duration_ms"`
}

func (r RuleDefinition) Validate() error {
	if r.Version != 1 || r.Trigger.Kind != "coin_collected" || r.Effect.Kind != "gravity_flip" {
		return errors.New("milestone one supports only coin_collected → gravity_flip, schema version 1")
	}
	if r.Trigger.Every < 2 || r.Trigger.Every > 10 || r.Effect.DurationMS < 1000 || r.Effect.DurationMS > 6000 || r.Effect.DurationMS%1000 != 0 {
		return errors.New("use every 2–10 coins and a whole duration of 1–6 seconds")
	}
	return nil
}

func (r RuleDefinition) Summary() string {
	return fmt.Sprintf("Every %d coins, gravity reverses for %d seconds.", r.Trigger.Every, r.Effect.DurationMS/1000)
}

type RuleProposal struct {
	ID        string          `json:"id"`
	MessageID string          `json:"message_id"`
	ViewerID  string          `json:"-"`
	Author    string          `json:"author"`
	Text      string          `json:"text"`
	Source    string          `json:"source"`
	Status    string          `json:"status"`
	Rule      *RuleDefinition `json:"rule"`
	Reason    string          `json:"reason,omitempty"`
	CreatedAt time.Time       `json:"created_at"`
}

const RoundDuration = 75 * time.Second

type Round struct {
	ID          string         `json:"id"`
	ProposalID  string         `json:"proposal_id"`
	MessageID   string         `json:"message_id"`
	Author      string         `json:"author"`
	Source      string         `json:"source"`
	Rule        RuleDefinition `json:"rule"`
	Status      string         `json:"status"`
	StartedAt   time.Time      `json:"started_at"`
	EndsAt      time.Time      `json:"ends_at"`
	Coins       int            `json:"coins"`
	Sequence    int            `json:"sequence"`
	ResultSaved bool           `json:"result_saved"`
}

type Snapshot struct {
	Proposals []RuleProposal `json:"proposals"`
	Round     *Round         `json:"round"`
}

func NewRound(id string, p RuleProposal, now time.Time) (Round, error) {
	if p.Status != "approved" || p.Rule == nil {
		return Round{}, ErrConflict
	}
	if err := p.Rule.Validate(); err != nil {
		return Round{}, err
	}
	return Round{ID: id, ProposalID: p.ID, MessageID: p.MessageID, Author: p.Author, Source: p.Source, Rule: *p.Rule, Status: "running", StartedAt: now, EndsAt: now.Add(RoundDuration)}, nil
}
