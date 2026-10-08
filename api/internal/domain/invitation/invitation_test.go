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
			got := (&Invitation{Sections: c.in}).MissingRequired()
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
