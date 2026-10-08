// Package ops orchestrates check-in, the event-day read model, and live config.
package ops

import (
	"context"

	"github.com/mula/mula/internal/domain/ops"
)

type LivePatch struct {
	Provider         *string
	StreamURL        *string
	Status           *string
	StartsAt         *string // RFC 3339; "" clears; nil = unchanged
	ShowOnInvitation *bool
}

type EventDay struct {
	Expected  int            `json:"expected"`   // guests on the list
	CheckedIn int            `json:"checked_in"` // arrived
	Attending int            `json:"attending"`  // RSVP yes
	Remaining int            `json:"remaining"`  // expected - checked in
	Live      ops.LiveConfig `json:"live"`
}

type Repo interface {
	// CheckIn records an arrival idempotently (re-check-in keeps the original time).
	CheckIn(ctx context.Context, eventID, guestID, byUserID string) error // ErrGuestNotFound
	Arrivals(ctx context.Context, eventID string) ([]ops.Arrival, error)
	Stats(ctx context.Context, eventID string) (expected, checkedIn, attending int, err error)
	GetLive(ctx context.Context, eventID string) (ops.LiveConfig, error)
	UpdateLive(ctx context.Context, eventID string, p LivePatch) (ops.LiveConfig, error)
}

type Service struct{ repo Repo }

func NewService(r Repo) *Service { return &Service{repo: r} }

func (s *Service) CheckIn(ctx context.Context, eventID, guestID, by string) error {
	return s.repo.CheckIn(ctx, eventID, guestID, by)
}
func (s *Service) Arrivals(ctx context.Context, eventID string) ([]ops.Arrival, error) {
	return s.repo.Arrivals(ctx, eventID)
}
func (s *Service) GetLive(ctx context.Context, eventID string) (ops.LiveConfig, error) {
	return s.repo.GetLive(ctx, eventID)
}
func (s *Service) UpdateLive(ctx context.Context, eventID string, p LivePatch) (ops.LiveConfig, error) {
	if p.Status != nil && !ops.ValidLiveStatus(*p.Status) {
		return ops.LiveConfig{}, ops.ErrBadStatus
	}
	return s.repo.UpdateLive(ctx, eventID, p)
}

func (s *Service) EventDay(ctx context.Context, eventID string) (*EventDay, error) {
	expected, checked, attending, err := s.repo.Stats(ctx, eventID)
	if err != nil {
		return nil, err
	}
	live, err := s.repo.GetLive(ctx, eventID)
	if err != nil {
		return nil, err
	}
	return &EventDay{Expected: expected, CheckedIn: checked, Attending: attending, Remaining: expected - checked, Live: live}, nil
}
