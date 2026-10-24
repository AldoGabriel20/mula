package invitation

import (
	"reflect"
	"testing"

	"github.com/mula/mula/internal/domain/invitation"
)

// gildedSeal is the section list of catalog/templates/gilded-seal/manifest.json as the repo returns it.
var gildedSeal = &invitation.TemplateSpec{Slug: "gilded-seal", Sections: []invitation.SectionRule{
	{Type: "hero", Required: true}, {Type: "opening"}, {Type: "story"}, {Type: "schedule"},
	{Type: "gallery", HiddenUntilFilled: true, Max: 12}, {Type: "gift"}, {Type: "rsvp", Required: true},
	{Type: "wishes"}, {Type: "music", HiddenUntilFilled: true}, {Type: "closing"},
}}

func secs(types ...string) []invitation.Section {
	out := make([]invitation.Section, len(types))
	for i, t := range types {
		out[i] = invitation.Section{ID: "id-" + string(rune('a'+i)), Type: t, Position: i}
	}
	return out
}

func TestMissingSections(t *testing.T) {
	want := gildedSeal.Types()
	got := missingSections(secs("hero", "story", "schedule", "gift", "rsvp"), want)
	if exp := []string{"opening", "gallery", "wishes", "music", "closing"}; !reflect.DeepEqual(got, exp) {
		t.Fatalf("missing = %v want %v", got, exp)
	}
	if got := missingSections(secs(want...), want); len(got) != 0 {
		t.Fatalf("complete set reports missing %v", got)
	}
	// a duplicate or extra type neither counts as missing nor hides a missing one
	if got := missingSections(secs("hero", "hero", "map"), []string{"hero", "rsvp"}); !reflect.DeepEqual(got, []string{"rsvp"}) {
		t.Fatalf("missing = %v", got)
	}
}

func TestTemplateOrder(t *testing.T) {
	s := secs("hero", "map", "story", "hero", "rsvp") // an extra type and a duplicate
	got := templateOrder(s, []string{"hero", "story", "rsvp", "closing"})
	// wanted order first (first of each type), then the rest in current order: map (b), duplicate hero (d)
	if exp := []string{"id-a", "id-c", "id-e", "id-b", "id-d"}; !reflect.DeepEqual(got, exp) {
		t.Fatalf("order = %v want %v", got, exp)
	}
	if len(templateOrder(nil, gildedSeal.Types())) != 0 {
		t.Fatal("empty input must give empty order")
	}
}
