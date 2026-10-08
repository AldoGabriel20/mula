package invitation

import (
	"reflect"
	"testing"
)

// sanitize is the only defence for section content that guests see: it must reach into
// nested objects and arrays, not just top-level strings.
func TestSanitizeDeep(t *testing.T) {
	in := map[string]any{
		"title": "<script>alert(1)</script>Hi",
		"nested": map[string]any{
			"deeper": map[string]any{"x": "<img src=x onerror=alert(1)>"},
			"list":   []any{"<b>a</b>", map[string]any{"k": "<i>v</i>"}, 7, true, nil},
		},
		"n":    42,
		"flag": true,
		"none": nil,
	}
	got := sanitize(in)
	want := map[string]any{
		"title": "scriptalert(1)/scriptHi",
		"nested": map[string]any{
			"deeper": map[string]any{"x": "img src=x onerror=alert(1)"},
			"list":   []any{"ba/b", map[string]any{"k": "iv/i"}, 7, true, nil},
		},
		"n":    42,
		"flag": true,
		"none": nil,
	}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("got  %#v\nwant %#v", got, want)
	}
	// no angle bracket survives anywhere
	var walk func(v any)
	walk = func(v any) {
		switch x := v.(type) {
		case string:
			for _, r := range x {
				if r == '<' || r == '>' {
					t.Fatalf("angle bracket survived in %q", x)
				}
			}
		case map[string]any:
			for _, e := range x {
				walk(e)
			}
		case []any:
			for _, e := range x {
				walk(e)
			}
		}
	}
	walk(got)
}

func TestSanitizeNilAndEmpty(t *testing.T) {
	if got := sanitize(nil); got == nil || len(got) != 0 {
		t.Fatalf("nil input must yield an empty non-nil map, got %#v", got)
	}
}
