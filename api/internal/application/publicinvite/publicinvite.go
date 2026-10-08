// Package publicinvite is the guest-facing side: read a published invitation, record opens,
// submit an RSVP, leave a wish. Everything is capability-token scoped — there is no session.
package publicinvite

import (
	"context"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/mula/mula/internal/domain/invitation"
)

const (
	maxWishLen = 500
	maxNameLen = 80
	maxNoteLen = 300
	maxMealLen = 80
)

// Resolved is the result of resolving a token: which event, and (for a personal link) which guest.
type Resolved struct {
	EventID      string
	EventDate    *time.Time
	RSVPDeadline *time.Time
	GuestID      string // "" on the generic event link
	GuestName    string
}

type Repo interface {
	// Resolve maps a token (event public_token OR guests.token) to its published event.
	// Unknown/unpublished/deleted → invitation.ErrNotFound.
	Resolve(ctx context.Context, token string) (*Resolved, error)
	Page(ctx context.Context, token string, res *Resolved) (*invitation.PublicPage, error)
	// MarkOpened sets guests.opened_at on the FIRST view only (idempotent).
	MarkOpened(ctx context.Context, guestID string) error
	// SubmitRSVP upserts the guest's reply (party size capped by 1+plus_ones).
	SubmitRSVP(ctx context.Context, guestID string, in invitation.RSVPInput) error
	AddWish(ctx context.Context, eventID string, guestID *string, author, message string) error
}

type Service struct {
	repo Repo
	now  func() time.Time
}

func NewService(r Repo) *Service { return &Service{repo: r, now: time.Now} }

// Get returns the page and, for a personal link, records the open (first view only).
func (s *Service) Get(ctx context.Context, token string) (*invitation.PublicPage, error) {
	if token == "" {
		return nil, invitation.ErrNotFound
	}
	res, err := s.repo.Resolve(ctx, token)
	if err != nil {
		return nil, err
	}
	page, err := s.repo.Page(ctx, token, res)
	if err != nil {
		return nil, err
	}
	if res.GuestID != "" {
		// Best-effort: a tracking failure must never break the guest's page.
		_ = s.repo.MarkOpened(ctx, res.GuestID)
	}
	return page, nil
}

// Exists reports whether the token maps to a published event (any link kind). Handlers call
// it BEFORE parsing a request body so an invalid token is always the same 404, regardless of
// what the body looks like.
func (s *Service) Exists(ctx context.Context, token string) error {
	if token == "" {
		return invitation.ErrNotFound
	}
	_, err := s.repo.Resolve(ctx, token)
	return err
}

// RSVP requires a PERSONAL link (a generic link has no guest identity to attach a reply to).
func (s *Service) RSVP(ctx context.Context, token string, in invitation.RSVPInput) error {
	res, err := s.repo.Resolve(ctx, token)
	if err != nil {
		return err
	}
	if res.GuestID == "" {
		return invitation.ErrRSVPNeedsGuest
	}
	if !invitation.RSVPOpenAt(res.EventDate, res.RSVPDeadline, s.now()) {
		return invitation.ErrRSVPClosed
	}
	in.Status = strings.ToLower(strings.TrimSpace(in.Status))
	if in.Status != "yes" && in.Status != "no" {
		return invitation.ErrBadRSVP
	}
	if in.Status == "no" {
		in.PartySize = 0
	} else if in.PartySize < 1 {
		return invitation.ErrBadRSVP
	}
	in.Meal = clip(in.Meal, maxMealLen)
	in.Note = clip(in.Note, maxNoteLen)
	return s.repo.SubmitRSVP(ctx, res.GuestID, in)
}

// Wish: a personal link attributes it to that guest (name taken from the guest, not the
// request); a generic link needs a name. Text is length-capped and stripped of angle brackets.
func (s *Service) Wish(ctx context.Context, token, name, message string) error {
	res, err := s.repo.Resolve(ctx, token)
	if err != nil {
		return err
	}
	message = sanitizeText(message)
	if message == "" || utf8.RuneCountInString(message) > maxWishLen {
		return invitation.ErrBadRSVP
	}
	var guestID *string
	author := sanitizeText(name)
	if res.GuestID != "" {
		guestID = &res.GuestID
		author = res.GuestName // never trust a client-supplied name on a personal link
	}
	if author == "" || utf8.RuneCountInString(author) > maxNameLen {
		return invitation.ErrBadRSVP
	}
	return s.repo.AddWish(ctx, res.EventID, guestID, author, message)
}

func sanitizeText(s string) string {
	return strings.TrimSpace(strings.NewReplacer("<", "", ">", "").Replace(s))
}

func clip(p *string, max int) *string {
	if p == nil {
		return nil
	}
	v := sanitizeText(*p)
	if v == "" {
		return nil
	}
	if r := []rune(v); len(r) > max {
		v = string(r[:max])
	}
	return &v
}
