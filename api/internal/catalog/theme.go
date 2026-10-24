package catalog

import (
	"encoding/json"
	"fmt"
	"sort"

	"github.com/mula/mula/internal/domain/invitation"
)

// maxThemeBytes bounds one invitation's stored theme (docs/17 §10.2).
const maxThemeBytes = 2 << 10

// ThemeChecker validates a host's theme against the picked template's manifest and the palette catalog
// (docs/17 §6.4, §10.2).
type ThemeChecker struct{ c *Catalog }

// ThemeChecker builds a checker over the loaded catalog.
func (c *Catalog) ThemeChecker() *ThemeChecker { return &ThemeChecker{c: c} }

// Check returns the theme in its stored form (a legacy palette label becomes its id) and field path -> message.
// manifestJSON is templates.manifest ("{}" for a row that was never synced: such a design cannot be customised).
func (k *ThemeChecker) Check(manifestJSON []byte, t invitation.Theme) (invitation.Theme, map[string]string) {
	if t.IsZero() {
		return invitation.Theme{}, nil
	}
	var m Manifest
	_ = json.Unmarshal(manifestJSON, &m)
	if len(m.Tokens.Color) == 0 {
		return t, map[string]string{"theme": "this design cannot be customised"}
	}
	f := map[string]string{}
	out := invitation.Theme{Tokens: map[string]string{}}
	can := m.Customizable
	colors := mergeColors(m.Tokens.Color, nil)
	for k, v := range m.Tokens.Extra {
		colors[k] = v
	}
	paletteApplied := false

	if t.Palette != "" {
		p := k.c.PaletteByID(t.Palette)
		switch {
		case p == nil || !contains(can.Palette, p.ID):
			f["theme.palette"] = "not available for this design"
		default:
			out.Palette = p.ID
			colors = mergeColors(colors, p.Color)
			colors = mergeColors(colors, p.Extra)
			paletteApplied = true
		}
	}
	if t.FontPairing != "" {
		if !contains(can.FontPairings, t.FontPairing) {
			f["theme.fontPairing"] = "not available for this design"
		} else {
			out.FontPairing = t.FontPairing
		}
	}
	if t.Motion != "" {
		if !contains(can.Motion, t.Motion) {
			f["theme.motion"] = "not available for this design"
		} else {
			out.Motion = t.Motion
		}
	}
	roles := make([]string, 0, len(t.Tokens))
	for r := range t.Tokens {
		roles = append(roles, r)
	}
	sort.Strings(roles)
	for _, role := range roles {
		v := t.Tokens[role]
		switch {
		case !contains(can.Tokens, role):
			f["theme.tokens."+role] = "this colour cannot be changed on this design"
		case !hexRE.MatchString(v):
			f["theme.tokens."+role] = "must be a #RRGGBB colour"
		default:
			out.Tokens[role] = v
			colors[role] = v
		}
	}
	if len(out.Tokens) == 0 {
		out.Tokens = nil
	}
	if b, _ := json.Marshal(t); len(b) > maxThemeBytes {
		f["theme"] = fmt.Sprintf("must be at most %d KB", maxThemeBytes>>10)
	}
	if len(f) == 0 {
		for _, pair := range TextPairs {
			fg, bg := colors[pair[0]], colors[pair[1]]
			if !hexRE.MatchString(fg) || !hexRE.MatchString(bg) {
				continue
			}
			if r := Contrast(fg, bg); r < AAText {
				path := "theme.tokens"
				if paletteApplied && len(out.Tokens) == 0 {
					path = "theme.palette"
				}
				f[path] = fmt.Sprintf("%s %s on %s %s is %.2f:1, needs %.1f:1", pair[0], fg, pair[1], bg, r, AAText)
				break
			}
		}
	}
	if len(f) > 0 {
		return t, f
	}
	return out, nil
}

func contains(list []string, s string) bool {
	for _, x := range list {
		if x == s {
			return true
		}
	}
	return false
}
