// Package event orchestrates event CRUD and membership/role resolution.
package event

import (
	"context"
	"strings"

	"github.com/mula/mula/internal/domain/event"
)

type Service struct {
	events  EventRepo
	members MemberRepo
	mail    Mailer
	baseURL string
}

// WithMailer enables invite emails; baseURL is the public web origin.
func (s *Service) WithMailer(m Mailer, baseURL string) *Service {
	s.mail, s.baseURL = m, strings.TrimRight(baseURL, "/")
	return s
}

func NewService(e EventRepo, m MemberRepo) *Service {
	return &Service{events: e, members: m}
}

func (s *Service) Create(ctx context.Context, ownerID, ownerEmail string, in CreateInput) (*event.Event, error) {
	return s.events.CreateWithOwner(ctx, ownerID, ownerEmail, in)
}

func (s *Service) List(ctx context.Context, userID string) ([]event.Event, error) {
	return s.events.ListForUser(ctx, userID)
}

func (s *Service) Get(ctx context.Context, id string) (*event.Event, error) {
	return s.events.Get(ctx, id)
}

func (s *Service) Update(ctx context.Context, id string, p Patch) (*event.Event, error) {
	return s.events.Update(ctx, id, p)
}

func (s *Service) Delete(ctx context.Context, id string) error {
	return s.events.SoftDelete(ctx, id)
}

// RoleFor backs the authz middleware.
func (s *Service) RoleFor(ctx context.Context, eventID, userID string) (event.Role, error) {
	return s.members.RoleFor(ctx, eventID, userID)
}

func (s *Service) Members(ctx context.Context, eventID string) ([]event.Member, error) {
	return s.members.List(ctx, eventID)
}
func (s *Service) Member(ctx context.Context, id string) (*event.Member, error) {
	return s.members.Get(ctx, id)
}

// Invite adds a pending member (email is lower-cased; the role must be one an owner may grant).
func (s *Service) Invite(ctx context.Context, eventID, email string, role event.Role, eventLabel string) (*event.Member, error) {
	if !role.Invitable() {
		return nil, event.ErrBadRole
	}
	m, err := s.members.Add(ctx, eventID, strings.ToLower(strings.TrimSpace(email)), role)
	if err != nil {
		return nil, err
	}
	if s.mail != nil {
		// Best-effort: the seat exists either way; a mail failure must not roll back the invite.
		_ = s.mail.SendTeamInvite(ctx, m.Email, eventLabel, string(role), s.baseURL+"/login")
	}
	return m, nil
}

// ChangeRole refuses to touch the owner row or to grant owner.
func (s *Service) ChangeRole(ctx context.Context, m *event.Member, role event.Role) (*event.Member, error) {
	if m.Role == event.RoleOwner {
		return nil, event.ErrOwnerImmutable
	}
	if !role.Invitable() {
		return nil, event.ErrBadRole
	}
	return s.members.SetRole(ctx, m.ID, role)
}

func (s *Service) RemoveMember(ctx context.Context, m *event.Member) error {
	if m.Role == event.RoleOwner {
		return event.ErrOwnerImmutable
	}
	return s.members.Remove(ctx, m.ID)
}

// AcceptInvites attaches pending invites to a verified account (the email match is the proof).
func (s *Service) AcceptInvites(ctx context.Context, userID, email string) error {
	return s.members.AcceptInvites(ctx, userID, strings.ToLower(strings.TrimSpace(email)))
}
