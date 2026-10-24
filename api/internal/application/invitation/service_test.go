package invitation

import (
	"context"
	"errors"
	"reflect"
	"testing"

	"github.com/mula/mula/internal/domain/invitation"
)

// fakeRepo implements only what the tests below call; the embedded nil interface panics on anything else.
type fakeRepo struct {
	Repo
	inv   *invitation.Invitation
	spec  *invitation.TemplateSpec
	owned map[string]bool
	asked []string
}

func (f *fakeRepo) GetByEvent(context.Context, string) (*invitation.Invitation, error) {
	return f.inv, nil
}
func (f *fakeRepo) TemplateSpec(context.Context, string) (*invitation.TemplateSpec, error) {
	return f.spec, nil
}
func (f *fakeRepo) MediaOwned(_ context.Context, _ string, ids []string) (map[string]bool, error) {
	f.asked = ids
	return f.owned, nil
}
func (f *fakeRepo) Publish(context.Context, string, string, string) error { return nil }
func (f *fakeRepo) PublicToken(context.Context, string) (string, error)   { return "tok", nil }
func (f *fakeRepo) AddSection(_ context.Context, _ string, typ string, c map[string]any) (*invitation.Section, error) {
	return &invitation.Section{ID: "new", Type: typ, Content: c}, nil
}

type fakeSchema struct {
	fields     map[string]string
	galleryMax int
}

func (f *fakeSchema) Check(_ string, _ map[string]any, galleryMax int) map[string]string {
	f.galleryMax = galleryMax
	return f.fields
}

func TestPublishUsesTheTemplatesRequiredSections(t *testing.T) {
	tid := "t1"
	inv := &invitation.Invitation{ID: "i", TemplateID: &tid, Sections: []invitation.Section{
		{Type: "hero", Visible: true}, {Type: "rsvp", Visible: true}, {Type: "closing", Visible: false},
	}}
	repo := &fakeRepo{inv: inv, spec: &invitation.TemplateSpec{Slug: "x", Sections: []invitation.SectionRule{
		{Type: "hero", Required: true}, {Type: "closing", Required: true}, {Type: "rsvp", Required: true},
	}}}
	svc := NewService(repo)

	_, err := svc.Publish(context.Background(), "e", true)
	var inc *invitation.IncompleteError
	if !errors.As(err, &inc) || !reflect.DeepEqual(inc.Missing, []string{"closing"}) {
		t.Fatalf("hidden required section must block publishing: %v", err)
	}

	inv.Sections[2].Visible = true
	if tok, err := svc.Publish(context.Background(), "e", true); err != nil || tok != "tok" {
		t.Fatalf("publish: %q %v", tok, err)
	}

	// a template that declares nothing, or no template at all, falls back to hero + rsvp
	repo.spec = &invitation.TemplateSpec{Slug: "x"}
	inv.Sections = []invitation.Section{{Type: "hero", Visible: true}}
	if _, err = svc.Publish(context.Background(), "e", true); !errors.As(err, &inc) || !reflect.DeepEqual(inc.Missing, []string{"rsvp"}) {
		t.Fatalf("fallback: %v", err)
	}
	inv.TemplateID = nil
	if _, err = svc.Publish(context.Background(), "e", true); !errors.As(err, &inc) || !reflect.DeepEqual(inc.Missing, []string{"rsvp"}) {
		t.Fatalf("no template: %v", err)
	}
}

func TestContentIsCheckedAgainstSchemaAndOwnMedia(t *testing.T) {
	tid := "t1"
	inv := &invitation.Invitation{ID: "i", TemplateID: &tid}
	repo := &fakeRepo{inv: inv, owned: map[string]bool{"mine": true}, spec: &invitation.TemplateSpec{Slug: "x", Sections: []invitation.SectionRule{{Type: "gallery", Max: 6}}}}
	schema := &fakeSchema{}
	svc := NewService(repo).WithContentSchema(schema)
	ctx := context.Background()

	if _, err := svc.AddSection(ctx, "e", "hero", map[string]any{"photo_id": "mine"}); err != nil {
		t.Fatalf("own photo: %v", err)
	}
	_, err := svc.AddSection(ctx, "e", "story", map[string]any{"photo_ids": []any{"mine", "theirs"}})
	var ce *invitation.ContentError
	if !errors.As(err, &ce) || ce.Fields["content.media"] == "" {
		t.Fatalf("foreign photo must be rejected: %v", err)
	}

	schema.fields = map[string]string{"content.line": "must be at most 160 characters"}
	if _, err = svc.AddSection(ctx, "e", "hero", map[string]any{"line": "x"}); !errors.As(err, &ce) || ce.Fields["content.line"] == "" {
		t.Fatalf("schema errors surface as field errors: %v", err)
	}

	// the gallery cap comes from the picked template's manifest
	schema.fields = nil
	if _, err = svc.AddSection(ctx, "e", "gallery", map[string]any{}); err != nil || schema.galleryMax != 6 {
		t.Fatalf("gallery cap = %d err=%v", schema.galleryMax, err)
	}

	// no schema wired: anything goes (unit tests, tools)
	if _, err = NewService(repo).AddSection(ctx, "e", "story", map[string]any{"photo_ids": []any{"theirs"}}); err != nil {
		t.Fatalf("no schema: %v", err)
	}
}

func TestMediaRefs(t *testing.T) {
	got := MediaRefs(map[string]any{
		"photo_id":  "a",
		"photo_ids": []any{"b", "a", ""},
		"photos":    []any{map[string]any{"id": "c"}, map[string]any{"id": 7}, "junk"},
	})
	if !reflect.DeepEqual(got, []string{"a", "b", "c"}) {
		t.Fatalf("refs = %v", got)
	}
	if len(MediaRefs(map[string]any{"title": "x"})) != 0 {
		t.Fatal("no media keys, no refs")
	}
}

type fakeTheme struct {
	fields map[string]string
	seen   invitation.Theme
}

func (f *fakeTheme) Check(_ []byte, t invitation.Theme) (invitation.Theme, map[string]string) {
	f.seen = t
	if f.fields != nil {
		return t, f.fields
	}
	t.Palette = "norm-" + t.Palette
	return t, nil
}

type themeRepo struct {
	fakeRepo
	got *UpdatePatch
}

func (r *themeRepo) Update(_ context.Context, _ string, p UpdatePatch) error { r.got = &p; return nil }

func TestThemePatch(t *testing.T) {
	ctx := context.Background()
	tid, other := "t1", "t2"
	mk := func(cur *string, theme invitation.Theme) (*themeRepo, *Service, *fakeTheme) {
		r := &themeRepo{fakeRepo: fakeRepo{inv: &invitation.Invitation{ID: "i", TemplateID: cur, Theme: theme}, spec: &invitation.TemplateSpec{Slug: "x", Manifest: []byte(`{"a":1}`)}}}
		ft := &fakeTheme{}
		return r, NewService(r).WithThemeSchema(ft), ft
	}

	r, s, ft := mk(&tid, invitation.Theme{})
	if _, err := s.Update(ctx, "e", UpdatePatch{Theme: &invitation.Theme{Palette: "rose"}}); err != nil {
		t.Fatal(err)
	}
	if r.got.Theme == nil || r.got.Theme.Palette != "norm-rose" || ft.seen.Palette != "rose" {
		t.Fatalf("the stored form is the checker's: %+v", r.got.Theme)
	}

	_, s, ft = mk(&tid, invitation.Theme{})
	ft.fields = map[string]string{"theme.palette": "no"}
	_, err := s.Update(ctx, "e", UpdatePatch{Theme: &invitation.Theme{Palette: "x"}})
	var ce *invitation.ContentError
	if !errors.As(err, &ce) || ce.Fields["theme.palette"] == "" {
		t.Fatalf("checker errors surface as field errors: %v", err)
	}

	_, s, _ = mk(nil, invitation.Theme{})
	if _, err = s.Update(ctx, "e", UpdatePatch{Theme: &invitation.Theme{Palette: "x"}}); !errors.As(err, &ce) || ce.Fields["theme"] == "" {
		t.Fatalf("a theme needs a design: %v", err)
	}

	// clearing never needs a design or a check
	r, s, _ = mk(nil, invitation.Theme{Palette: "old"})
	if _, err = s.Update(ctx, "e", UpdatePatch{Theme: &invitation.Theme{}}); err != nil || r.got.Theme == nil || !r.got.Theme.IsZero() {
		t.Fatalf("clear: %v %+v", err, r.got)
	}

	// switching design without a theme drops the old one; re-picking the same design keeps it; an untouched patch leaves it
	r, s, _ = mk(&tid, invitation.Theme{Palette: "old"})
	if _, err = s.Update(ctx, "e", UpdatePatch{TemplateID: &other}); err != nil || r.got.Theme == nil || !r.got.Theme.IsZero() {
		t.Fatalf("switch must clear: %v %+v", err, r.got.Theme)
	}
	r, s, _ = mk(&tid, invitation.Theme{Palette: "old"})
	_, _ = s.Update(ctx, "e", UpdatePatch{TemplateID: &tid})
	if r.got.Theme != nil {
		t.Fatalf("re-pick must keep the theme: %+v", r.got.Theme)
	}
	r, s, _ = mk(&tid, invitation.Theme{Palette: "old"})
	_, _ = s.Update(ctx, "e", UpdatePatch{Palette: ptrS("Ivory")})
	if r.got.Theme != nil {
		t.Fatalf("a palette-label patch leaves the theme alone")
	}
}

func ptrS(s string) *string { return &s }
