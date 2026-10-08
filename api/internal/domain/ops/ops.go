// Package ops holds event-day entities: check-ins and live-stream config.
package ops

import (
	"errors"
	"time"
)

type Arrival struct {
	GuestID     string
	GuestName   string
	GroupName   *string
	PartySize   int
	CheckedInAt time.Time
}

type LiveConfig struct {
	Provider         string     `json:"provider"`
	StreamURL        string     `json:"stream_url"`
	Status           string     `json:"status"` // offline | scheduled | live
	StartsAt         *time.Time `json:"starts_at"`
	ShowOnInvitation bool       `json:"show_on_invitation"`
}

var (
	ErrGuestNotFound = errors.New("guest not found for check-in")
	ErrBadStatus     = errors.New("invalid live status")
)

func ValidLiveStatus(s string) bool { return s == "offline" || s == "scheduled" || s == "live" }
