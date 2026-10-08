// Package event holds the event entity, roles, and domain errors.
package event

import (
	"errors"
	"time"
)

type Event struct {
	ID        string
	OwnerID   string
	Type      string
	CoupleA   *string
	CoupleB   *string
	EventDate *time.Time
	Venue     *string
	Status    string
	CreatedAt time.Time
	UpdatedAt time.Time
}

// Roles (docs/09). "editor" and "member" are capability sets, not stored values.
type Role string

const (
	RoleOwner   Role = "owner"
	RoleCohost  Role = "cohost"
	RolePlanner Role = "planner"
	RoleFamily  Role = "family"
	RoleUsher   Role = "usher"
)

// Editors may mutate event content; everyone listed is a member (can read).
func (r Role) IsEditor() bool {
	return r == RoleOwner || r == RoleCohost || r == RolePlanner
}
func (r Role) IsOwner() bool { return r == RoleOwner }

// Staff run the event day (check-in): editors plus ushers.
func (r Role) IsStaff() bool { return r.IsEditor() || r == RoleUsher }

// Member is a row of event_members: the owner, accepted members, and pending invites
// (UserID nil until the invited email verifies an account).
type Member struct {
	ID         string
	EventID    string
	UserID     *string
	Name       string // account name, "" while the invite is pending
	Email      string
	Role       Role
	InvitedAt  time.Time
	AcceptedAt *time.Time
}

// Invitable are the roles an owner may hand out (never owner).
func (r Role) Invitable() bool {
	return r == RoleCohost || r == RolePlanner || r == RoleFamily || r == RoleUsher
}

var (
	ErrMemberNotFound = errors.New("member not found")
	ErrMemberExists   = errors.New("already a member or invited")
	ErrOwnerImmutable = errors.New("the owner's membership cannot be changed")
	ErrBadRole        = errors.New("invalid role")
)

// ErrNotFound covers both unknown events and events the caller can't see — the
// handler returns 404 for both so existence never leaks (docs/08).
var ErrNotFound = errors.New("event not found")
