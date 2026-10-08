// Package guest holds guest/group/RSVP entities and segment logic.
package guest

import (
	"errors"
	"time"
)

type Guest struct {
	ID         string
	EventID    string
	GroupID    *string
	GroupName  *string
	Name       string
	Email      *string
	Phone      *string
	PlusOnes   int
	VIP        bool
	OpenedAt   *time.Time
	Token      *string // per-guest public link token (nil for legacy rows until backfilled)
	RSVPStatus string  // pending | yes | no
	PartySize  int
	TableLabel *string    // seating label shown on lists and the check-in sheet
	Notes      string     // host-only notes (diet, seating wishes)
	InvitedAt  *time.Time // last time the invitation was sent to this guest
	CreatedAt  time.Time
	UpdatedAt  time.Time
}

type Group struct {
	ID   string
	Name string
}

// Segments are the smart-segment counts shown on overview + guests (docs/07).
type Segments struct {
	NotOpened int `json:"not_opened"`
	NoReply   int `json:"no_reply"`
	VIP       int `json:"vip"`
	PlusOnes  int `json:"plus_ones"`
	FollowUp  int `json:"follow_up"`
}

var (
	ErrNotFound = errors.New("guest not found")
	ErrNoEmail  = errors.New("guest has no email address")
)

// ValidRSVP reports whether s is a stored reply status.
func ValidRSVP(s string) bool { return s == "pending" || s == "yes" || s == "no" }
