// Package invitation orchestrates the invitation editor: content + sections CRUD,
// reorder, visibility, and publish/unpublish (which mints the public token).
package invitation

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"strings"

	"github.com/mula/mula/internal/domain/invitation"
)

// DefaultSections seeds a new invitation (docs/09 section types).
var DefaultSections = []string{"hero", "story", "schedule", "gift", "rsvp"}

type UpdatePatch struct {
	Palette         *string
	ContentLanguage *string
	TemplateID      *string
	RSVPDeadline    *string // RFC 3339; "" clears; nil = unchanged
}
type SectionPatch struct {
	Type    *string
	Visible *bool
	Content map[string]any
}

type Repo interface {
	GetByEvent(ctx context.Context, eventID string) (*invitation.Invitation, error) // ErrNotFound
	Create(ctx context.Context, eventID string, sectionTypes []string) (*invitation.Invitation, error)
	Update(ctx context.Context, invID string, p UpdatePatch) error
	AddSection(ctx context.Context, invID, typ string, content map[string]any) (*invitation.Section, error)
	UpdateSection(ctx context.Context, invID, sid string, p SectionPatch) error // ErrSectionNotFound
	DeleteSection(ctx context.Context, invID, sid string) error
	Reorder(ctx context.Context, invID string, sids []string) error
	Publish(ctx context.Context, eventID, invID, token string) error
	Unpublish(ctx context.Context, eventID, invID string) error
	PublicToken(ctx context.Context, eventID string) (string, error)
	ListTemplates(ctx context.Context) ([]invitation.Template, error)
}

type Service struct{ repo Repo }

func NewService(r Repo) *Service { return &Service{repo: r} }

// Get returns the event's invitation, creating a default one on first access (1:1).
func (s *Service) Get(ctx context.Context, eventID string) (*invitation.Invitation, error) {
	inv, err := s.repo.GetByEvent(ctx, eventID)
	if errors.Is(err, invitation.ErrNotFound) {
		return s.repo.Create(ctx, eventID, DefaultSections)
	}
	return inv, err
}

func (s *Service) Update(ctx context.Context, eventID string, p UpdatePatch) (*invitation.Invitation, error) {
	inv, err := s.Get(ctx, eventID)
	if err != nil {
		return nil, err
	}
	if err := s.repo.Update(ctx, inv.ID, p); err != nil {
		return nil, err
	}
	return s.repo.GetByEvent(ctx, eventID)
}

func (s *Service) AddSection(ctx context.Context, eventID, typ string, content map[string]any) (*invitation.Invitation, error) {
	inv, err := s.Get(ctx, eventID)
	if err != nil {
		return nil, err
	}
	if _, err := s.repo.AddSection(ctx, inv.ID, typ, sanitize(content)); err != nil {
		return nil, err
	}
	return s.repo.GetByEvent(ctx, eventID)
}

func (s *Service) UpdateSection(ctx context.Context, eventID, sid string, p SectionPatch) (*invitation.Invitation, error) {
	inv, err := s.Get(ctx, eventID)
	if err != nil {
		return nil, err
	}
	if p.Content != nil {
		p.Content = sanitize(p.Content)
	}
	if err := s.repo.UpdateSection(ctx, inv.ID, sid, p); err != nil {
		return nil, err
	}
	return s.repo.GetByEvent(ctx, eventID)
}

func (s *Service) DeleteSection(ctx context.Context, eventID, sid string) (*invitation.Invitation, error) {
	inv, err := s.Get(ctx, eventID)
	if err != nil {
		return nil, err
	}
	if err := s.repo.DeleteSection(ctx, inv.ID, sid); err != nil {
		return nil, err
	}
	return s.repo.GetByEvent(ctx, eventID)
}

func (s *Service) Reorder(ctx context.Context, eventID string, sids []string) (*invitation.Invitation, error) {
	inv, err := s.Get(ctx, eventID)
	if err != nil {
		return nil, err
	}
	if err := s.repo.Reorder(ctx, inv.ID, sids); err != nil {
		return nil, err
	}
	return s.repo.GetByEvent(ctx, eventID)
}

// Publish enforces the business rules, then mints a public token and marks the event
// published. `verified` is the caller's email-verification state, taken from the
// authenticated session (never from the request). Rules (docs/08, docs/14):
//   - email must be verified            → ErrNotVerified          (HTTP 422)
//   - required sections present+visible → *IncompleteError       (HTTP 422)
//
// Re-publishing keeps the existing token (stable link).
func (s *Service) Publish(ctx context.Context, eventID string, verified bool) (string, error) {
	if !verified {
		return "", invitation.ErrNotVerified
	}
	inv, err := s.Get(ctx, eventID)
	if err != nil {
		return "", err
	}
	if missing := inv.MissingRequired(); len(missing) > 0 {
		return "", &invitation.IncompleteError{Missing: missing}
	}
	token := publicToken()
	if err := s.repo.Publish(ctx, eventID, inv.ID, token); err != nil {
		return "", err
	}
	// the repo keeps an existing token (COALESCE); return the one actually in force
	return s.repo.PublicToken(ctx, eventID)
}

func (s *Service) Unpublish(ctx context.Context, eventID string) error {
	inv, err := s.Get(ctx, eventID)
	if err != nil {
		return err
	}
	return s.repo.Unpublish(ctx, eventID, inv.ID)
}

func publicToken() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	return base64.RawURLEncoding.EncodeToString(b)
}

// sanitize strips angle brackets from string values (the content renders publicly,
// so no raw HTML is stored). ponytail: allowlist-escape, not a full HTML sanitizer —
// the frontend still treats content as text, never dangerouslySetInnerHTML.
func sanitize(in map[string]any) map[string]any {
	out := make(map[string]any, len(in))
	for k, v := range in {
		out[k] = sanitizeVal(v)
	}
	return out
}
func sanitizeVal(v any) any {
	switch t := v.(type) {
	case string:
		return strings.NewReplacer("<", "", ">", "").Replace(t)
	case map[string]any:
		return sanitize(t)
	case []any:
		for i := range t {
			t[i] = sanitizeVal(t[i])
		}
		return t
	default:
		return v
	}
}

// Templates is the design catalog (public: it carries no event data).
func (s *Service) Templates(ctx context.Context) ([]invitation.Template, error) {
	return s.repo.ListTemplates(ctx)
}
