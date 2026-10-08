// Package invitation holds the invitation + section entities.
package invitation

import (
	"errors"
	"time"
)

type Invitation struct {
	ID              string
	EventID         string
	TemplateID      *string
	Palette         string
	ContentLanguage string
	PublishedAt     *time.Time
	RSVPDeadline    *time.Time // nil = replies close the day after the event
	Sections        []Section
}

// Template is one entry of the design catalog.
type Template struct {
	ID       string
	Slug     string
	Name     string
	Category string
	Tags     string
	Palette  string
}

func (i *Invitation) Published() bool { return i.PublishedAt != nil }

type Section struct {
	ID       string
	Type     string
	Position int
	Visible  bool
	Content  map[string]any
}

var (
	ErrNotFound        = errors.New("invitation not found")
	ErrBadTemplate     = errors.New("unknown template")
	ErrSectionNotFound = errors.New("section not found")
	ErrNotVerified     = errors.New("email must be verified before publishing")
)

// RequiredSections must be present AND visible for an invitation to be published
// (ASSUMPTION: docs say "required sections" without listing them — hero + rsvp).
var RequiredSections = []string{"hero", "rsvp"}

// IncompleteError lists the required sections that are missing or hidden (→ HTTP 422).
type IncompleteError struct{ Missing []string }

func (e *IncompleteError) Error() string { return "invitation is missing required sections" }

// MissingRequired returns the required section types that are absent or not visible.
func (i *Invitation) MissingRequired() []string {
	have := map[string]bool{}
	for _, s := range i.Sections {
		if s.Visible {
			have[s.Type] = true
		}
	}
	var missing []string
	for _, r := range RequiredSections {
		if !have[r] {
			missing = append(missing, r)
		}
	}
	return missing
}

// PublicView is the guest-safe projection of a published invitation. It is an explicit
// allowlist: no owner/member info, no emails, no host-only section content beyond what the
// page renders. Anything not listed here can never reach a guest by construction.
type PublicView struct {
	EventType string
	CoupleA   *string
	CoupleB   *string
	EventDate *time.Time
	Venue     *string
	Palette   string
	Language  string
	Sections  []PublicSection
}

type PublicSection struct {
	Type    string
	Content map[string]any
}
