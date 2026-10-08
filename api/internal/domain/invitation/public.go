package invitation

import (
	"errors"
	"time"
)

// Public-facing errors. Everything a guest can trigger that "doesn't exist or isn't yours"
// collapses to ErrNotFound so tokens can't be probed.
var (
	ErrRSVPNeedsGuest = errors.New("this link is not personal; open your own invitation link to reply")
	ErrRSVPClosed     = errors.New("rsvp is closed for this event")
	ErrBadRSVP        = errors.New("invalid rsvp")
)

// GuestInfo is what a PERSONAL link may reveal about its own guest (and only that guest).
type GuestInfo struct {
	Name       string
	RSVPStatus string // pending | yes | no
	PartySize  int
	MaxParty   int // 1 + plus-ones the host allowed
}

// PublicPage = the guest-safe invitation plus, for a personal link, that guest's own info.
type PublicPage struct {
	View  *PublicView
	Guest *GuestInfo // nil on the generic event link
	// GiftNote is the host's public gift guidance (bank/e-wallet text), shown to guests.
	Gifts []PublicGift
	// Methods are the host's "ways to give" (bank / e-wallet / physical), shown with the gift section.
	Methods []PublicMethod
	// Live is set only when the host shows the live stream on the invitation and it is not offline.
	Live *PublicLive
	// RSVPDeadline is the host's explicit reply-by instant (nil = event-day cut-off).
	RSVPDeadline *time.Time
}

// PublicMethod is the allowlisted projection of a gift method.
type PublicMethod struct {
	Type      string
	Title     string
	Detail    string
	CopyValue string
}

// PublicLive is what a guest may see of the live stream.
type PublicLive struct {
	Provider  string
	StreamURL string
	Status    string
	StartsAt  *time.Time
}

// PublicGift is the allowlisted projection of a registry item (no ids/amounts raised).
type PublicGift struct {
	Title        string
	Description  string
	URL          *string
	TargetAmount *float64
}

// RSVPInput is a guest's reply.
type RSVPInput struct {
	Status    string // yes | no
	PartySize int
	Meal      *string
	Note      *string
}

// RSVPCutoff: replies close the day AFTER the event ends (ASSUMPTION — docs/07 says
// "RSVP editable until a cutoff"). No event date = never closes.
func RSVPOpen(eventDate *time.Time, now time.Time) bool { return RSVPOpenAt(eventDate, nil, now) }

// RSVPOpenAt is RSVPOpen with the host's explicit deadline: when set it wins over the event-day
// cut-off (the host may close earlier, or keep replies open past the event).
func RSVPOpenAt(eventDate, deadline *time.Time, now time.Time) bool {
	if deadline != nil {
		return now.Before(*deadline)
	}
	if eventDate == nil {
		return true
	}
	return now.Before(eventDate.Add(24 * time.Hour))
}
