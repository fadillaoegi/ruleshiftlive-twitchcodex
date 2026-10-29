// Package unavailable fails closed when PostgreSQL is not configured. It is
// deliberately not an in-memory persistence replacement.
package unavailable

import (
	"context"
	"ruleshift.live/backend/internal/domain"
	"time"
)

type Repository struct{}

func (Repository) RoundByID(context.Context, string) (domain.Round, error) {
	return domain.Round{}, domain.ErrUnavailable
}
func (Repository) FinalizeRound(context.Context, string, string, int, int) error {
	return domain.ErrUnavailable
}

func (Repository) Snapshot(context.Context) (domain.Snapshot, error) {
	return domain.Snapshot{Proposals: []domain.RuleProposal{}}, domain.ErrUnavailable
}
func (Repository) HasMessage(context.Context, string, string) (bool, error) {
	return false, domain.ErrUnavailable
}
func (Repository) LastProposalAt(context.Context, string, string) (time.Time, error) {
	return time.Time{}, domain.ErrUnavailable
}
func (Repository) InsertProposal(context.Context, domain.RuleProposal) error {
	return domain.ErrUnavailable
}
func (Repository) Decide(context.Context, string, string) error      { return domain.ErrUnavailable }
func (Repository) InsertRound(context.Context, domain.Round) error   { return domain.ErrUnavailable }
func (Repository) EndRound(context.Context, string, string) error    { return domain.ErrUnavailable }
func (Repository) Telemetry(context.Context, string, int, int) error { return domain.ErrUnavailable }
