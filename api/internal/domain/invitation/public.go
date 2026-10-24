package invitation

import (
	"encoding/base64"
	"errors"
	"regexp"
	"strings"
	"time"
)

// Public-facing errors. Everything a guest can trigger that "doesn't exist or isn't yours"
// collapses to ErrNotFound so tokens can't be probed.
var (
	ErrRSVPNeedsGuest = errors.New("this link is not personal; open your own invitation link to reply")
	ErrRSVPClosed     = errors.New("rsvp is closed for this event")
	ErrBadRSVP        = errors.New("invalid rsvp")
	ErrBadCursor      = errors.New("invalid cursor")
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
	// Schedule is the moments this link may see (empty when the schedule section is hidden).
	Schedule []PublicMoment
	// MediaIDs are the photos the page references that belong to the event (repo output).
	MediaIDs []string
	// Media maps each of MediaIDs to a signed, session-less URL (service output).
	Media map[string]string
	// Preview marks a host's draft view (never set on a guest link).
	Preview bool
}

// PublicWish is a guestbook entry as any guest may read it (approved wishes only).
type PublicWish struct {
	ID        string
	Name      string
	Message   string
	CreatedAt time.Time // list position only; never sent to guests
}

// WishCursor is the keyset position of the last wish a page ended on (wishes are listed
// newest first, ties broken by id). It travels as an opaque base64url string.
type WishCursor struct {
	At time.Time
	ID string
}

func (c WishCursor) String() string {
	return base64.RawURLEncoding.EncodeToString([]byte(c.At.UTC().Format(time.RFC3339Nano) + "|" + c.ID))
}

// ParseWishCursor decodes a cursor; anything that is not exactly what String produced is ErrBadCursor.
func ParseWishCursor(s string) (WishCursor, error) {
	raw, err := base64.RawURLEncoding.DecodeString(s)
	if err != nil {
		return WishCursor{}, ErrBadCursor
	}
	at, id, ok := strings.Cut(string(raw), "|")
	if !ok || !uuidRe.MatchString(id) {
		return WishCursor{}, ErrBadCursor
	}
	t, err := time.Parse(time.RFC3339Nano, at)
	if err != nil {
		return WishCursor{}, ErrBadCursor
	}
	return WishCursor{At: t, ID: id}, nil
}

// PublicMoment is the allowlisted projection of a schedule item.
type PublicMoment struct {
	Label, Title, Address, MapURL, VenueNote, DressCode, Description string
	Venue                                                            *string
	StartsAt, EndsAt                                                 *time.Time
	PhotoID                                                          *string
}

var uuidRe = regexp.MustCompile(`^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$`)

// MediaRefs lists the distinct, well-formed photo ids that section content and moments point at:
// hero.photo_id, story.photo_ids[], gallery.photos[].id, closing.photo_id and each moment's photo.
// Content is host-authored free-form JSON, so these are only CANDIDATES; the repo keeps the ones
// that belong to the event before anything is signed.
func MediaRefs(sections []PublicSection, moments []PublicMoment) []string {
	seen := map[string]bool{}
	var out []string
	add := func(v any) {
		s, ok := v.(string)
		if !ok || !uuidRe.MatchString(s) || seen[s] {
			return
		}
		seen[s] = true
		out = append(out, s)
	}
	for _, sec := range sections {
		switch sec.Type {
		case "hero", "closing":
			add(sec.Content["photo_id"])
		case "story":
			if l, ok := sec.Content["photo_ids"].([]any); ok {
				for _, v := range l {
					add(v)
				}
			}
		case "gallery":
			if l, ok := sec.Content["photos"].([]any); ok {
				for _, v := range l {
					if m, ok := v.(map[string]any); ok {
						add(m["id"])
					}
				}
			}
		}
	}
	for _, m := range moments {
		if m.PhotoID != nil {
			add(*m.PhotoID)
		}
	}
	return out
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
