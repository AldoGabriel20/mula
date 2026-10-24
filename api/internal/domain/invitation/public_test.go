package invitation

import (
	"encoding/base64"
	"reflect"
	"testing"
	"time"
)

func TestMediaRefs(t *testing.T) {
	const a, b, c, d = "11111111-1111-1111-1111-111111111111", "22222222-2222-2222-2222-222222222222", "33333333-3333-3333-3333-333333333333", "44444444-4444-4444-4444-444444444444"
	secs := []PublicSection{
		{Type: "hero", Content: map[string]any{"photo_id": a}},
		{Type: "story", Content: map[string]any{"photo_ids": []any{b, a, "nope", 7, nil}}},
		{Type: "gallery", Content: map[string]any{"photos": []any{map[string]any{"id": c}, map[string]any{"id": "../etc/passwd"}, "x", map[string]any{"id": 5}}}},
		{Type: "closing", Content: map[string]any{"photo_id": "not-a-uuid"}},
		{Type: "gift", Content: map[string]any{"photo_id": d}}, // only the listed section types are read
	}
	moment := d
	got := MediaRefs(secs, []PublicMoment{{PhotoID: &moment}, {}})
	if want := []string{a, b, c, d}; !reflect.DeepEqual(got, want) {
		t.Fatalf("MediaRefs = %v want %v", got, want)
	}
	if got := MediaRefs(nil, nil); len(got) != 0 {
		t.Fatalf("empty = %v", got)
	}
}

func TestWishCursor(t *testing.T) {
	at := time.Date(2026, 10, 16, 8, 30, 15, 123456000, time.FixedZone("WIB", 7*3600))
	c := WishCursor{At: at, ID: "11111111-1111-1111-1111-111111111111"}
	got, err := ParseWishCursor(c.String())
	if err != nil || !got.At.Equal(at) || got.ID != c.ID {
		t.Fatalf("round trip: %+v %v", got, err)
	}
	enc := func(s string) string { return base64.RawURLEncoding.EncodeToString([]byte(s)) }
	for name, bad := range map[string]string{
		"not base64":     "!!!",
		"no separator":   enc("2026-10-16T08:30:15Z"),
		"bad time":       enc("yesterday|11111111-1111-1111-1111-111111111111"),
		"bad id":         enc("2026-10-16T08:30:15Z|1; DROP TABLE wishes"),
		"empty":          "",
		"padded base64":  c.String() + "=",
		"standard b64 +": enc("2026-10-16T08:30:15Z|11111111-1111-1111-1111-11111111111?") + "+",
	} {
		if _, err := ParseWishCursor(bad); err != ErrBadCursor {
			t.Errorf("%s: err = %v, want ErrBadCursor", name, err)
		}
	}
}
