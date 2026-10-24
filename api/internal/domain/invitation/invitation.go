// Package invitation holds the invitation + section entities.
package invitation

import (
	"errors"
	"regexp"
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
	Theme           Theme      // the host's visual overrides; zero = the template's own look
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
	Kind     string         // coded | themed
	Status   string         // published | draft (retired rows are not listed)
	Access   string         // free | premium
	Version  int            // bumped by `cmd/templates sync` on an additive manifest change
	Manifest map[string]any // the synced manifest; empty for a row that was never synced
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

// DefaultRequired must be present AND visible for an invitation to be published when its template
// declares no required sections of its own (manifest `required`, docs/17 §10.2). No template: hero + rsvp.
var DefaultRequired = []string{"hero", "rsvp"}

// SectionRule is one entry of a template's manifest `sections`.
type SectionRule struct {
	Type              string
	Required          bool // must be present and visible to publish
	HiddenUntilFilled bool // added hidden when the template is picked
	Max               int  // 0 = unset
}

// Theme is a host's visual customisation of a template (invitations.theme, docs/17 §6, §9.1). Every field is
// optional; what a host may set is bounded by the template's manifest `customizable` (checked on write).
type Theme struct {
	Palette     string            `json:"palette,omitempty"` // catalog palette id (a legacy label is accepted and stored as its id)
	FontPairing string            `json:"fontPairing,omitempty"`
	Motion      string            `json:"motion,omitempty"` // full | calm | off
	Tokens      map[string]string `json:"tokens,omitempty"` // colour role -> #RRGGBB
}

// IsZero reports whether the theme changes nothing.
func (t Theme) IsZero() bool {
	return t.Palette == "" && t.FontPairing == "" && t.Motion == "" && len(t.Tokens) == 0
}

var (
	themeIDRE  = regexp.MustCompile(`^[A-Za-z][A-Za-z0-9-]{0,40}$`)
	themeHexRE = regexp.MustCompile(`^#[0-9A-Fa-f]{6}$`)
	themeKeyRE = regexp.MustCompile(`^[a-zA-Z]{1,30}$`)
)

// Sanitized drops anything that is not a plain id, a known motion level or a #RRGGBB colour. The guest page
// serves it through this even though writes are validated: a theme can never carry markup or CSS to a guest.
func (t Theme) Sanitized() Theme {
	out := Theme{}
	if themeIDRE.MatchString(t.Palette) {
		out.Palette = t.Palette
	}
	if themeIDRE.MatchString(t.FontPairing) {
		out.FontPairing = t.FontPairing
	}
	switch t.Motion {
	case "full", "calm", "off":
		out.Motion = t.Motion
	}
	for k, v := range t.Tokens {
		if themeKeyRE.MatchString(k) && themeHexRE.MatchString(v) {
			if out.Tokens == nil {
				out.Tokens = map[string]string{}
			}
			out.Tokens[k] = v
		}
	}
	return out
}

// TemplateSpec is what the invitation service needs from a template's synced manifest.
type TemplateSpec struct {
	Slug     string
	Version  int
	Sections []SectionRule // in the template's order; empty when the template was never synced
	Manifest []byte        // the synced manifest JSON ("{}" when never synced); theme rules read it
}

// Types lists the section types in the template's order.
func (t *TemplateSpec) Types() []string {
	out := make([]string, len(t.Sections))
	for i, s := range t.Sections {
		out[i] = s.Type
	}
	return out
}

// Rule returns the rule for a section type, if the template lists it.
func (t *TemplateSpec) Rule(typ string) (SectionRule, bool) {
	for _, s := range t.Sections {
		if s.Type == typ {
			return s, true
		}
	}
	return SectionRule{}, false
}

// RequiredTypes returns the template's required section types, or DefaultRequired when it has none.
func (t *TemplateSpec) RequiredTypes() []string {
	if t != nil {
		var out []string
		for _, s := range t.Sections {
			if s.Required {
				out = append(out, s.Type)
			}
		}
		if len(out) > 0 {
			return out
		}
	}
	return DefaultRequired
}

// ContentError carries per-field problems of a section's content (→ HTTP 400, field paths as keys).
type ContentError struct{ Fields map[string]string }

func (e *ContentError) Error() string { return "invalid section content" }

// IncompleteError lists the required sections that are missing or hidden (→ HTTP 422).
type IncompleteError struct{ Missing []string }

func (e *IncompleteError) Error() string { return "invitation is missing required sections" }

// MissingRequired returns those of the required section types that are absent or not visible.
func (i *Invitation) MissingRequired(required []string) []string {
	have := map[string]bool{}
	for _, s := range i.Sections {
		if s.Visible {
			have[s.Type] = true
		}
	}
	var missing []string
	for _, r := range required {
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
	Template  *string // template slug, nil = none picked
	Timezone  string  // IANA zone the invitation prints dates in
	EventType string
	CoupleA   *string
	CoupleB   *string
	EventDate *time.Time
	Venue     *string
	Palette   string
	Language  string
	Theme     Theme // sanitised host overrides
	// TemplateVersion is templates.version of the picked template (0 = none).
	TemplateVersion int
	Sections        []PublicSection
}

type PublicSection struct {
	Type    string
	Content map[string]any
}
