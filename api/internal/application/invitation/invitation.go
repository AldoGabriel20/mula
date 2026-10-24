// Package invitation orchestrates the invitation editor: content + sections CRUD,
// reorder, visibility, and publish/unpublish (which mints the public token).
package invitation

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"strings"

	"github.com/mula/mula/internal/domain/invitation"
)

// DefaultSections seeds a new invitation (docs/09 section types).
var DefaultSections = []string{"hero", "story", "schedule", "gift", "rsvp"}

type UpdatePatch struct {
	Palette         *string
	ContentLanguage *string
	TemplateID      *string
	RSVPDeadline    *string           // RFC 3339; "" clears; nil = unchanged
	Theme           *invitation.Theme // replaces the whole theme; an empty one clears it; nil = unchanged
}
type SectionPatch struct {
	Type    *string
	Visible *bool
	Content map[string]any
}

type Repo interface {
	GetByEvent(ctx context.Context, eventID string) (*invitation.Invitation, error) // ErrNotFound
	Create(ctx context.Context, eventID string, sectionTypes []string) (*invitation.Invitation, error)
	Update(ctx context.Context, invID string, p UpdatePatch) error
	AddSection(ctx context.Context, invID, typ string, content map[string]any) (*invitation.Section, error)
	UpdateSection(ctx context.Context, invID, sid string, p SectionPatch) error // ErrSectionNotFound
	DeleteSection(ctx context.Context, invID, sid string) error
	Reorder(ctx context.Context, invID string, sids []string) error
	Publish(ctx context.Context, eventID, invID, token string) error
	Unpublish(ctx context.Context, eventID, invID string) error
	PublicToken(ctx context.Context, eventID string) (string, error)
	ListTemplates(ctx context.Context) ([]invitation.Template, error)
	TemplateBySlug(ctx context.Context, slug string) (*invitation.Template, error) // ErrBadTemplate
	// TemplateSpec reads the template's synced manifest (sections, required, hiddenUntilFilled); ErrBadTemplate.
	TemplateSpec(ctx context.Context, templateID string) (*invitation.TemplateSpec, error)
	// MediaOwned returns the subset of ids that are media rows of the event.
	MediaOwned(ctx context.Context, eventID string, ids []string) (map[string]bool, error)
}

// ContentSchema checks a section's content shape (catalog/sections.schema.json) and the catalog-backed
// values (music track). It is optional: a nil schema accepts any content (unit tests, tools).
type ContentSchema interface {
	// Check returns field path -> message; galleryMax caps gallery.photos (0 = the schema's own cap).
	Check(typ string, content map[string]any, galleryMax int) map[string]string
}

// ThemeSchema checks a host's theme against the template's manifest and the palette catalog (docs/17 §10.2).
// It returns the theme in its stored form and field path -> message. Optional like ContentSchema.
type ThemeSchema interface {
	Check(manifestJSON []byte, t invitation.Theme) (invitation.Theme, map[string]string)
}

type Service struct {
	repo   Repo
	schema ContentSchema
	themes ThemeSchema
}

func NewService(r Repo) *Service { return &Service{repo: r} }

// WithThemeSchema turns on theme validation. Without it a theme patch is accepted as is (unit tests, tools).
func (s *Service) WithThemeSchema(t ThemeSchema) *Service { s.themes = t; return s }

// WithContentSchema turns on section content validation (docs/17 §10.3).
func (s *Service) WithContentSchema(c ContentSchema) *Service { s.schema = c; return s }

// Get returns the event's invitation, creating a default one on first access (1:1).
func (s *Service) Get(ctx context.Context, eventID string) (*invitation.Invitation, error) {
	inv, err := s.repo.GetByEvent(ctx, eventID)
	if errors.Is(err, invitation.ErrNotFound) {
		return s.repo.Create(ctx, eventID, DefaultSections)
	}
	return inv, err
}

func (s *Service) Update(ctx context.Context, eventID string, p UpdatePatch) (*invitation.Invitation, error) {
	inv, err := s.Get(ctx, eventID)
	if err != nil {
		return nil, err
	}
	if err := s.prepareTheme(ctx, inv, &p); err != nil {
		return nil, err
	}
	if err := s.repo.Update(ctx, inv.ID, p); err != nil {
		return nil, err
	}
	if p.TemplateID != nil {
		if err := s.ensureTemplateSections(ctx, eventID, inv.ID, *p.TemplateID); err != nil {
			return nil, err
		}
	}
	return s.repo.GetByEvent(ctx, eventID)
}

// prepareTheme validates a theme patch against the template that will be in force and normalises it. Picking a
// different template without sending a theme drops the old one (its palette and colours were checked against
// another design). A theme needs a template with a manifest to be customised.
func (s *Service) prepareTheme(ctx context.Context, inv *invitation.Invitation, p *UpdatePatch) error {
	tplID := inv.TemplateID
	if p.TemplateID != nil {
		tplID = p.TemplateID
		if p.Theme == nil && (inv.TemplateID == nil || *inv.TemplateID != *p.TemplateID) && !inv.Theme.IsZero() {
			p.Theme = &invitation.Theme{}
		}
	}
	if p.Theme == nil || s.themes == nil {
		return nil
	}
	if p.Theme.IsZero() {
		p.Theme = &invitation.Theme{}
		return nil
	}
	if tplID == nil {
		return &invitation.ContentError{Fields: map[string]string{"theme": "pick a design before customising it"}}
	}
	spec, err := s.repo.TemplateSpec(ctx, *tplID)
	if err != nil {
		return err
	}
	norm, fields := s.themes.Check(spec.Manifest, *p.Theme)
	if len(fields) > 0 {
		return &invitation.ContentError{Fields: fields}
	}
	p.Theme = &norm
	return nil
}

// ensureTemplateSections adds the template's missing section types and, only when it added any,
// puts the template's sections in its order (others keep their relative order after them).
// Re-picking the same template changes nothing, so a host's own ordering survives. Not atomic:
// a failure part-way leaves a subset, and picking the template again completes it.
func (s *Service) ensureTemplateSections(ctx context.Context, eventID, invID, templateID string) error {
	spec, err := s.repo.TemplateSpec(ctx, templateID)
	if err != nil {
		return err
	}
	want := spec.Types()
	if len(want) == 0 {
		return nil
	}
	inv, err := s.repo.GetByEvent(ctx, eventID)
	if err != nil {
		return err
	}
	missing := missingSections(inv.Sections, want)
	if len(missing) == 0 {
		return nil
	}
	for _, typ := range missing {
		sec, err := s.repo.AddSection(ctx, invID, typ, map[string]any{})
		if err != nil {
			return err
		}
		if rule, _ := spec.Rule(typ); rule.HiddenUntilFilled {
			hide := false
			if err := s.repo.UpdateSection(ctx, invID, sec.ID, SectionPatch{Visible: &hide}); err != nil {
				return err
			}
		}
	}
	inv, err = s.repo.GetByEvent(ctx, eventID)
	if err != nil {
		return err
	}
	return s.repo.Reorder(ctx, invID, templateOrder(inv.Sections, want))
}

// missingSections returns the wanted types with no section yet, in wanted order.
func missingSections(have []invitation.Section, want []string) []string {
	got := map[string]bool{}
	for _, s := range have {
		got[s.Type] = true
	}
	var out []string
	for _, w := range want {
		if !got[w] {
			out = append(out, w)
		}
	}
	return out
}

// templateOrder returns every section id: the first section of each wanted type in wanted order,
// then all remaining sections (extra types, duplicates) in their current position order.
func templateOrder(secs []invitation.Section, want []string) []string {
	used := map[string]bool{}
	var out []string
	for _, w := range want {
		for _, s := range secs {
			if s.Type == w && !used[s.ID] {
				used[s.ID] = true
				out = append(out, s.ID)
				break
			}
		}
	}
	for _, s := range secs {
		if !used[s.ID] {
			out = append(out, s.ID)
		}
	}
	return out
}

func (s *Service) AddSection(ctx context.Context, eventID, typ string, content map[string]any) (*invitation.Invitation, error) {
	inv, err := s.Get(ctx, eventID)
	if err != nil {
		return nil, err
	}
	content = sanitize(content)
	if err := s.checkContent(ctx, eventID, inv, typ, content); err != nil {
		return nil, err
	}
	if _, err := s.repo.AddSection(ctx, inv.ID, typ, content); err != nil {
		return nil, err
	}
	return s.repo.GetByEvent(ctx, eventID)
}

func (s *Service) UpdateSection(ctx context.Context, eventID, sid string, p SectionPatch) (*invitation.Invitation, error) {
	inv, err := s.Get(ctx, eventID)
	if err != nil {
		return nil, err
	}
	if p.Content != nil {
		p.Content = sanitize(p.Content)
		typ := ""
		for _, sec := range inv.Sections {
			if sec.ID == sid {
				typ = sec.Type
			}
		}
		if p.Type != nil {
			typ = *p.Type
		}
		if typ != "" { // an unknown section id falls through to the repo's ErrSectionNotFound
			if err := s.checkContent(ctx, eventID, inv, typ, p.Content); err != nil {
				return nil, err
			}
		}
	}
	if err := s.repo.UpdateSection(ctx, inv.ID, sid, p); err != nil {
		return nil, err
	}
	return s.repo.GetByEvent(ctx, eventID)
}

func (s *Service) DeleteSection(ctx context.Context, eventID, sid string) (*invitation.Invitation, error) {
	inv, err := s.Get(ctx, eventID)
	if err != nil {
		return nil, err
	}
	if err := s.repo.DeleteSection(ctx, inv.ID, sid); err != nil {
		return nil, err
	}
	return s.repo.GetByEvent(ctx, eventID)
}

func (s *Service) Reorder(ctx context.Context, eventID string, sids []string) (*invitation.Invitation, error) {
	inv, err := s.Get(ctx, eventID)
	if err != nil {
		return nil, err
	}
	if err := s.repo.Reorder(ctx, inv.ID, sids); err != nil {
		return nil, err
	}
	return s.repo.GetByEvent(ctx, eventID)
}

// Publish enforces the business rules, then mints a public token and marks the event
// published. `verified` is the caller's email-verification state, taken from the
// authenticated session (never from the request). Rules (docs/08, docs/14):
//   - email must be verified            → ErrNotVerified          (HTTP 422)
//   - required sections present+visible → *IncompleteError       (HTTP 422)
//
// Re-publishing keeps the existing token (stable link).
func (s *Service) Publish(ctx context.Context, eventID string, verified bool) (string, error) {
	if !verified {
		return "", invitation.ErrNotVerified
	}
	inv, err := s.Get(ctx, eventID)
	if err != nil {
		return "", err
	}
	var spec *invitation.TemplateSpec
	if inv.TemplateID != nil {
		if spec, err = s.repo.TemplateSpec(ctx, *inv.TemplateID); err != nil {
			return "", err
		}
	}
	if missing := inv.MissingRequired(spec.RequiredTypes()); len(missing) > 0 {
		return "", &invitation.IncompleteError{Missing: missing}
	}
	token := publicToken()
	if err := s.repo.Publish(ctx, eventID, inv.ID, token); err != nil {
		return "", err
	}
	// the repo keeps an existing token (COALESCE); return the one actually in force
	return s.repo.PublicToken(ctx, eventID)
}

func (s *Service) Unpublish(ctx context.Context, eventID string) error {
	inv, err := s.Get(ctx, eventID)
	if err != nil {
		return err
	}
	return s.repo.Unpublish(ctx, eventID, inv.ID)
}

func publicToken() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	return base64.RawURLEncoding.EncodeToString(b)
}

// checkContent validates content against the section's schema and the event's own media (docs/17 §10.3).
// A photo id that is not a media row of this event is rejected, so a section can never point at someone
// else's upload. The gallery cap comes from the picked template's manifest.
func (s *Service) checkContent(ctx context.Context, eventID string, inv *invitation.Invitation, typ string, content map[string]any) error {
	if s.schema == nil {
		return nil
	}
	galleryMax := 0
	if typ == "gallery" && inv.TemplateID != nil {
		spec, err := s.repo.TemplateSpec(ctx, *inv.TemplateID)
		if err != nil {
			return err
		}
		if r, ok := spec.Rule("gallery"); ok {
			galleryMax = r.Max
		}
	}
	fields := s.schema.Check(typ, content, galleryMax)
	if ids := MediaRefs(content); len(ids) > 0 {
		owned, err := s.repo.MediaOwned(ctx, eventID, ids)
		if err != nil {
			return err
		}
		for _, id := range ids {
			if !owned[id] {
				if fields == nil {
					fields = map[string]string{}
				}
				fields["content.media"] = "photo " + id + " does not belong to this event"
			}
		}
	}
	if len(fields) > 0 {
		return &invitation.ContentError{Fields: fields}
	}
	return nil
}

// MediaRefs lists the media ids a section's content points at: photo_id, photo_ids[] and photos[].id.
func MediaRefs(content map[string]any) []string {
	seen := map[string]bool{}
	var out []string
	add := func(v any) {
		if id, ok := v.(string); ok && id != "" && !seen[id] {
			seen[id] = true
			out = append(out, id)
		}
	}
	add(content["photo_id"])
	if ids, ok := content["photo_ids"].([]any); ok {
		for _, v := range ids {
			add(v)
		}
	}
	if ps, ok := content["photos"].([]any); ok {
		for _, v := range ps {
			if m, ok := v.(map[string]any); ok {
				add(m["id"])
			}
		}
	}
	return out
}

// sanitize strips angle brackets from string values (the content renders publicly,
// so no raw HTML is stored). ponytail: allowlist-escape, not a full HTML sanitizer —
// the frontend still treats content as text, never dangerouslySetInnerHTML.
func sanitize(in map[string]any) map[string]any {
	out := make(map[string]any, len(in))
	for k, v := range in {
		out[k] = sanitizeVal(v)
	}
	return out
}
func sanitizeVal(v any) any {
	switch t := v.(type) {
	case string:
		return strings.NewReplacer("<", "", ">", "").Replace(t)
	case map[string]any:
		return sanitize(t)
	case []any:
		for i := range t {
			t[i] = sanitizeVal(t[i])
		}
		return t
	default:
		return v
	}
}

// Template returns one catalog entry by slug (ErrBadTemplate when unknown or retired).
func (s *Service) Template(ctx context.Context, slug string) (*invitation.Template, error) {
	return s.repo.TemplateBySlug(ctx, slug)
}

// Templates is the design catalog (public: it carries no event data).
func (s *Service) Templates(ctx context.Context) ([]invitation.Template, error) {
	return s.repo.ListTemplates(ctx)
}
