// Package testsupport contains a persistence double for automated tests only.
// The runnable application never imports this package.
package testsupport

import (
	"context"
	"encoding/json"
	"ruleshift.live/backend/internal/domain"
	"sync"
	"time"
)

type Repository struct {
	mu        sync.Mutex
	proposals []domain.RuleProposal
	round     *domain.Round
	history   map[string]domain.Round
}

func (r *Repository) Snapshot(context.Context) (domain.Snapshot, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	v := domain.Snapshot{Proposals: append([]domain.RuleProposal{}, r.proposals...), Round: r.round}
	b, _ := json.Marshal(v)
	var copy domain.Snapshot
	json.Unmarshal(b, &copy)
	return copy, nil
}
func (r *Repository) HasMessage(_ context.Context, source, id string) (bool, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	for _, p := range r.proposals {
		if p.Source == source && p.MessageID == id {
			return true, nil
		}
	}
	return false, nil
}
func (r *Repository) LastProposalAt(_ context.Context, source, viewer string) (time.Time, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	var latest time.Time
	for _, p := range r.proposals {
		if p.Source == source && p.ViewerID == viewer && p.CreatedAt.After(latest) {
			latest = p.CreatedAt
		}
	}
	return latest, nil
}
func (r *Repository) InsertProposal(_ context.Context, p domain.RuleProposal) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	for _, existing := range r.proposals {
		if existing.Source == p.Source && existing.MessageID == p.MessageID {
			return domain.ErrDuplicate
		}
	}
	r.proposals = append(r.proposals, p)
	return nil
}
func (r *Repository) Decide(_ context.Context, id, status string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	for i, p := range r.proposals {
		if p.ID == id {
			if status == "approved" {
				for j := range r.proposals {
					if r.proposals[j].Status == "approved" {
						r.proposals[j].Status = "pending"
					}
				}
			}
			r.proposals[i].Status = status
			return nil
		}
	}
	return domain.ErrNotFound
}
func (r *Repository) InsertRound(_ context.Context, v domain.Round) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if r.round != nil && r.round.Status == "running" {
		return domain.ErrConflict
	}
	if r.history == nil {
		r.history = map[string]domain.Round{}
	}
	if r.round != nil {
		r.history[r.round.ID] = *r.round
	}
	r.round = &v
	for i := range r.proposals {
		if r.proposals[i].ID == v.ProposalID {
			r.proposals[i].Status = "used"
		}
	}
	return nil
}
func (r *Repository) RoundByID(_ context.Context, id string) (domain.Round, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if r.round != nil && r.round.ID == id {
		return *r.round, nil
	}
	if v, ok := r.history[id]; ok {
		return v, nil
	}
	return domain.Round{}, domain.ErrNotFound
}
func (r *Repository) FinalizeRound(_ context.Context, id, status string, sequence, coins int) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	var v domain.Round
	if r.round != nil && r.round.ID == id {
		v = *r.round
	} else {
		var ok bool
		v, ok = r.history[id]
		if !ok {
			return domain.ErrNotFound
		}
	}
	if v.ResultSaved || sequence <= v.Sequence || coins < v.Coins {
		return domain.ErrConflict
	}
	v.Status = status
	v.Sequence = sequence
	v.Coins = coins
	v.ResultSaved = true
	if r.round != nil && r.round.ID == id {
		*r.round = v
	} else {
		r.history[id] = v
	}
	return nil
}
func (r *Repository) EndRound(_ context.Context, id, status string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if r.round == nil || r.round.ID != id {
		return domain.ErrNotFound
	}
	r.round.Status = status
	return nil
}
func (r *Repository) Telemetry(_ context.Context, id string, sequence, coins int) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if r.round == nil || r.round.ID != id {
		return domain.ErrNotFound
	}
	if sequence > r.round.Sequence {
		r.round.Sequence = sequence
		r.round.Coins = coins
	}
	return nil
}
