// Package schedule holds schedule items for an event.
package schedule

import (
	"errors"
	"time"
)

type Item struct {
	ID          string
	EventID     string
	StartsAt    *time.Time
	EndsAt      *time.Time
	Title       string
	Venue       *string
	Address     string
	DressCode   string
	Description string
	Visibility  string  // everyone | invite_only | family_only
	Label       string  // eyebrow above the title, e.g. "The Ceremony"
	MapURL      string  // "" or an https:// link
	VenueNote   string  // short location description
	MediaID     *string // moment photo (a media row of the same event)
	Position    int
}

// ValidVisibility reports whether v is a known visibility.
func ValidVisibility(v string) bool {
	return v == "everyone" || v == "invite_only" || v == "family_only"
}

// ErrBadMedia: media_id is not a photo of this event.
var ErrBadMedia = errors.New("unknown photo")

var ErrBadRange = errors.New("schedule item ends before it starts")

var ErrNotFound = errors.New("schedule item not found")
