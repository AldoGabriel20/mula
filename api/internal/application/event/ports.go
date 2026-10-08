package event

import (
	"context"

	"github.com/mula/mula/internal/domain/event"
)

// Input for creating an event.
type CreateInput struct {
	Type      string
	CoupleA   *string
	CoupleB   *string
	EventDate *string // RFC3339; parsed in the repo
	Venue     *string
}

// Patch carries only the fields present in a PATCH (nil = leave unchanged).
type Patch struct {
	Type      *string
	CoupleA   *string
	CoupleB   *string
	EventDate *string
	Venue     *string
}

type EventRepo interface {
	// CreateWithOwner inserts the event and the owner's event_members row atomically.
	CreateWithOwner(ctx context.Context, ownerID, ownerEmail string, in CreateInput) (*event.Event, error)
	ListForUser(ctx context.Context, userID string) ([]event.Event, error)
	Get(ctx context.Context, id string) (*event.Event, error) // event.ErrNotFound
	Update(ctx context.Context, id string, p Patch) (*event.Event, error)
	SoftDelete(ctx context.Context, id string) error
}

type MemberRepo interface {
	// RoleFor returns the caller's role on an existing, non-deleted event, or
	// event.ErrNotFound if the event is unknown OR the caller is not a member.
	RoleFor(ctx context.Context, eventID, userID string) (event.Role, error)
	List(ctx context.Context, eventID string) ([]event.Member, error)
	Get(ctx context.Context, id string) (*event.Member, error)                              // event.ErrMemberNotFound
	Add(ctx context.Context, eventID, email string, role event.Role) (*event.Member, error) // event.ErrMemberExists
	SetRole(ctx context.Context, id string, role event.Role) (*event.Member, error)
	Remove(ctx context.Context, id string) error
	// AcceptInvites links pending invites for this (verified) email to the account.
	AcceptInvites(ctx context.Context, userID, email string) error
}

// Mailer notifies an invitee (the dev mailer logs it).
type Mailer interface {
	SendTeamInvite(ctx context.Context, to, eventLabel, role, link string) error
}
