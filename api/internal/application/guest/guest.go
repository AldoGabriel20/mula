// Package guest orchestrates guest/group/RSVP CRUD, import and segments.
package guest

import (
	"context"
	"strings"

	"github.com/mula/mula/internal/domain/guest"
)

type GuestInput struct {
	Name       string
	Email      *string
	Phone      *string
	GroupID    *string
	PlusOnes   int
	VIP        bool
	TableLabel *string
	Notes      string
}

// Patch — nil fields unchanged. RSVPStatus upserts the rsvp row when non-nil.
type GuestPatch struct {
	Name       *string
	Email      *string
	Phone      *string
	GroupID    *string
	PlusOnes   *int
	VIP        *bool
	RSVPStatus *string
	PartySize  *int
	TableLabel *string // "" clears
	Notes      *string
}

type Repo interface {
	List(ctx context.Context, eventID string) ([]guest.Guest, error)
	Get(ctx context.Context, id string) (*guest.Guest, error)
	Create(ctx context.Context, eventID string, in GuestInput) (*guest.Guest, error)
	Update(ctx context.Context, id string, p GuestPatch) (*guest.Guest, error)
	Delete(ctx context.Context, id string) error
	Import(ctx context.Context, eventID string, in []GuestInput) (int, error)
	Segments(ctx context.Context, eventID string) (guest.Segments, error)
	ListGroups(ctx context.Context, eventID string) ([]guest.Group, error)
	CreateGroup(ctx context.Context, eventID, name string) (*guest.Group, error)
	MarkInvited(ctx context.Context, id string) error
}

// Mailer sends the invitation email (the dev mailer logs it).
type Mailer interface {
	SendInvitation(ctx context.Context, to, guestName, eventLabel, link string) error
}

type Service struct {
	repo    Repo
	mail    Mailer
	baseURL string
}

func NewService(r Repo) *Service { return &Service{repo: r} }

// WithMailer enables Resend. baseURL is the public web origin the personal link is built on.
func (s *Service) WithMailer(m Mailer, baseURL string) *Service {
	s.mail, s.baseURL = m, strings.TrimRight(baseURL, "/")
	return s
}

// Resend emails the guest their personal link and stamps invited_at. A guest without an email
// address, or a guest whose link was never minted, cannot be sent anything (ErrNoEmail).
func (s *Service) Resend(ctx context.Context, g *guest.Guest, eventLabel string) error {
	if g.Email == nil || strings.TrimSpace(*g.Email) == "" || g.Token == nil || s.mail == nil {
		return guest.ErrNoEmail
	}
	if err := s.mail.SendInvitation(ctx, *g.Email, g.Name, eventLabel, s.baseURL+"/invite/"+*g.Token); err != nil {
		return err
	}
	return s.repo.MarkInvited(ctx, g.ID)
}

func (s *Service) List(ctx context.Context, eventID string) ([]guest.Guest, error) {
	return s.repo.List(ctx, eventID)
}
func (s *Service) Get(ctx context.Context, id string) (*guest.Guest, error) {
	return s.repo.Get(ctx, id)
}
func (s *Service) Create(ctx context.Context, eventID string, in GuestInput) (*guest.Guest, error) {
	return s.repo.Create(ctx, eventID, in)
}
func (s *Service) Update(ctx context.Context, id string, p GuestPatch) (*guest.Guest, error) {
	return s.repo.Update(ctx, id, p)
}
func (s *Service) Delete(ctx context.Context, id string) error { return s.repo.Delete(ctx, id) }
func (s *Service) Import(ctx context.Context, eventID string, in []GuestInput) (int, error) {
	return s.repo.Import(ctx, eventID, in)
}
func (s *Service) Segments(ctx context.Context, eventID string) (guest.Segments, error) {
	return s.repo.Segments(ctx, eventID)
}
func (s *Service) ListGroups(ctx context.Context, eventID string) ([]guest.Group, error) {
	return s.repo.ListGroups(ctx, eventID)
}
func (s *Service) CreateGroup(ctx context.Context, eventID, name string) (*guest.Group, error) {
	return s.repo.CreateGroup(ctx, eventID, name)
}
