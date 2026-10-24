package invitation

import (
	"testing"
	"time"
)

func TestMissingRequired(t *testing.T) {
	sec := func(typ string, vis bool) Section { return Section{Type: typ, Visible: vis} }
	cases := []struct {
		name string
		in   []Section
		want []string
	}{
		{"all present+visible", []Section{sec("hero", true), sec("rsvp", true), sec("story", true)}, nil},
		{"no sections", nil, []string{"hero", "rsvp"}},
		{"hero hidden", []Section{sec("hero", false), sec("rsvp", true)}, []string{"hero"}},
		{"rsvp missing", []Section{sec("hero", true), sec("story", true)}, []string{"rsvp"}},
		{"both hidden", []Section{sec("hero", false), sec("rsvp", false)}, []string{"hero", "rsvp"}},
		{"hidden dup + visible dup counts as present", []Section{sec("hero", false), sec("hero", true), sec("rsvp", true)}, nil},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			got := (&Invitation{Sections: c.in}).MissingRequired(DefaultRequired)
			if len(got) != len(c.want) {
				t.Fatalf("got %v want %v", got, c.want)
			}
			for i := range got {
				if got[i] != c.want[i] {
					t.Fatalf("got %v want %v", got, c.want)
				}
			}
		})
	}
}

func TestRSVPOpen(t *testing.T) {
	event := time.Date(2027, 4, 12, 9, 0, 0, 0, time.UTC)
	cases := []struct {
		name string
		date *time.Time
		now  time.Time
		want bool
	}{
		{"no date → never closes", nil, time.Date(2099, 1, 1, 0, 0, 0, 0, time.UTC), true},
		{"well before", &event, event.AddDate(0, -2, 0), true},
		{"day of the event", &event, event, true},
		{"23h59 after start still open", &event, event.Add(24*time.Hour - time.Minute), true},
		{"exactly 24h after → closed", &event, event.Add(24 * time.Hour), false},
		{"long after", &event, event.AddDate(1, 0, 0), false},
	}
	for _, c := range cases {
		if got := RSVPOpen(c.date, c.now); got != c.want {
			t.Errorf("%s: got %v want %v", c.name, got, c.want)
		}
	}
}

func TestTemplateSpecRequired(t *testing.T) {
	var none *TemplateSpec
	if got := none.RequiredTypes(); len(got) != 2 || got[0] != "hero" || got[1] != "rsvp" {
		t.Fatalf("no template: %v", got)
	}
	if got := (&TemplateSpec{Slug: "x"}).RequiredTypes(); len(got) != 2 {
		t.Fatalf("unsynced template falls back to hero+rsvp: %v", got)
	}
	spec := &TemplateSpec{Slug: "x", Sections: []SectionRule{{Type: "hero", Required: true}, {Type: "story"}, {Type: "closing", Required: true}}}
	if got := spec.RequiredTypes(); len(got) != 2 || got[1] != "closing" {
		t.Fatalf("manifest required: %v", got)
	}
	if got := spec.Types(); len(got) != 3 || got[1] != "story" {
		t.Fatalf("types: %v", got)
	}
	if r, ok := spec.Rule("story"); !ok || r.Required {
		t.Fatalf("rule: %v %v", r, ok)
	}
	if _, ok := spec.Rule("music"); ok {
		t.Fatal("unlisted type has no rule")
	}
}

func TestThemeSanitized(t *testing.T) {
	got := Theme{Palette: "rose-linen", FontPairing: "bad id!", Motion: "calm", Tokens: map[string]string{"accent": "#C9A27A", "bg": "url(x)", "bad key": "#000000", "ink": "#12"}}.Sanitized()
	if got.Palette != "rose-linen" || got.FontPairing != "" || got.Motion != "calm" || len(got.Tokens) != 1 || got.Tokens["accent"] != "#C9A27A" {
		t.Fatalf("%+v", got)
	}
	if (Theme{Motion: "wild", Palette: "<script>"}).Sanitized().IsZero() == false {
		t.Fatal("markup and unknown levels must vanish")
	}
	if !(Theme{}).IsZero() || (Theme{Motion: "full"}).IsZero() {
		t.Fatal("IsZero")
	}
}
