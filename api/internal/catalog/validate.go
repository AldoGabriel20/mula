package catalog

import (
	"math"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
)

// Options tune Validate. WebDir (the web/ folder) turns on the checks that need the renderer and
// font files on disk; empty skips them.
type Options struct{ WebDir string }

// AAText is the WCAG AA contrast ratio for body text; docs/17 §5.3 and §6.4 require it for text pairs.
const AAText = 4.5

// textPairs are the foreground/background role pairs that must reach AAText in a template's defaults,
// in every palette it lists, and in any host theme (docs/17 §6.4).
var TextPairs = [][2]string{{"ink", "bg"}, {"inkSoft", "bg"}, {"muted", "bg"}, {"onAccent", "accent"}}

var (
	slugRE = regexp.MustCompile(`^[a-z][a-z0-9-]{1,40}$`)
	hexRE  = regexp.MustCompile(`^#[0-9A-Fa-f]{6}$`)
)

// Validate runs the manifest schema and the cross-reference rules of docs/17 §5.3 over the whole catalog.
func (c *Catalog) Validate(o Options) []Problem {
	var ps []Problem
	add := func(p ...Problem) { ps = append(ps, p...) }

	// ---- libraries -------------------------------------------------------------------------------
	ids := map[string]bool{}
	names := map[string]string{} // id or alias -> palette id
	for i, p := range c.Palettes {
		at := "$.palettes[" + strconv.Itoa(i) + "]"
		if !regexp.MustCompile(`^[a-z][a-z0-9-]*$`).MatchString(p.ID) {
			add(errf("palettes.json", at+".id", "must be a lowercase id"))
		}
		if ids[p.ID] {
			add(errf("palettes.json", at+".id", "duplicate palette id %q", p.ID))
		}
		ids[p.ID] = true
		for _, n := range append([]string{p.ID}, p.Aliases...) {
			if other, dup := names[n]; dup && other != p.ID {
				add(errf("palettes.json", at+".aliases", "%q is already used by palette %q", n, other))
			}
			names[n] = p.ID
		}
		if len(p.Swatch) != 3 {
			add(errf("palettes.json", at+".swatch", "must list 3 colours"))
		}
		for _, s := range p.Swatch {
			if !hexRE.MatchString(s) {
				add(errf("palettes.json", at+".swatch", "%q is not #RRGGBB", s))
			}
		}
		for role, v := range p.Color {
			if !isCoreRole(role) {
				add(errf("palettes.json", at+".color."+role, "unknown colour role"))
			}
			if !hexRE.MatchString(v) {
				add(errf("palettes.json", at+".color."+role, "%q is not #RRGGBB", v))
			}
		}
		for role, v := range p.Extra {
			if !hexRE.MatchString(v) {
				add(errf("palettes.json", at+".extra."+role, "%q is not #RRGGBB", v))
			}
		}
	}
	for id, f := range c.Fonts.Families {
		at := "$.families." + id
		if f.License == "" {
			add(errf("fonts.json", at+".license", "is required"))
		}
		if len(f.Files) == 0 {
			add(errf("fonts.json", at+".files", "needs at least one file"))
		}
		for _, ff := range f.Files {
			if o.WebDir != "" {
				if _, err := os.Stat(filepath.Join(o.WebDir, "public", ff.Src)); err != nil {
					add(errf("fonts.json", at+".files", "%s: file not found under web/public", ff.Src))
				}
			}
		}
	}
	pairings := map[string]bool{}
	for i, pr := range c.Fonts.Pairings {
		at := "$.pairings[" + strconv.Itoa(i) + "]"
		pairings[pr.ID] = true
		for role, fam := range map[string]string{"display": pr.Display, "body": pr.Body, "script": pr.Script} {
			if _, ok := c.Fonts.Families[fam]; !ok {
				add(errf("fonts.json", at+"."+role, "unknown font family %q", fam))
			}
		}
	}
	keys := map[string]bool{}
	for i, t := range c.Tracks {
		at := "$.tracks[" + strconv.Itoa(i) + "]"
		if t.License == "" {
			add(errf("music.json", at+".license", "is required"))
		}
		if t.Key == "" || t.Src == "" {
			add(errf("music.json", at, "key and src are required"))
		}
		if keys[t.Key] {
			add(errf("music.json", at+".key", "duplicate track key %q", t.Key))
		}
		keys[t.Key] = true
	}
	if c.Sections != nil {
		for _, typ := range SectionTypes {
			if c.Sections.Def(typ) == nil {
				add(errf("sections.schema.json", "$.$defs."+typ, "no content schema for section type"))
			}
		}
	}

	// ---- manifests -------------------------------------------------------------------------------
	seen := map[string]bool{}
	for _, t := range c.Templates {
		m, f := &t.Manifest, t.File
		if c.manifest != nil {
			for _, p := range c.manifest.Validate(t.Raw) {
				p.File = f
				ps = append(ps, p)
			}
		}
		if !slugRE.MatchString(m.Slug) {
			continue // the schema already reported it; the rest of the rules need a usable slug
		}
		if want := filepath.Base(filepath.Dir(filepath.Join(c.Dir, f))); want != m.Slug {
			add(errf(f, "$.slug", "%q must equal its folder name %q", m.Slug, want))
		}
		if seen[m.Slug] {
			add(errf(f, "$.slug", "duplicate slug %q", m.Slug))
		}
		seen[m.Slug] = true

		types := map[string]bool{}
		for i, s := range m.Sections {
			if types[s.Type] {
				add(errf(f, "$.sections["+strconv.Itoa(i)+"].type", "duplicate section type %q", s.Type))
			}
			types[s.Type] = true
			if s.Required && s.HiddenUntilFilled {
				add(errf(f, "$.sections["+strconv.Itoa(i)+"]", "a required section cannot be hiddenUntilFilled"))
			}
		}
		switch m.Kind {
		case "coded":
			if m.Renderer == "" {
				add(errf(f, "$.renderer", "a coded template needs a renderer"))
			} else if o.WebDir != "" {
				if _, err := os.Stat(filepath.Join(o.WebDir, "components", "templates", m.Renderer+".tsx")); err != nil {
					add(errf(f, "$.renderer", "web/components/templates/%s.tsx not found", m.Renderer))
				}
			}
			if len(m.Layout) > 0 {
				add(errf(f, "$.layout", "a coded template cannot have a layout"))
			}
		case "themed":
			if len(m.Layout) == 0 {
				add(errf(f, "$.layout", "a themed template needs a layout"))
			}
			if m.Renderer != "" {
				add(errf(f, "$.renderer", "a themed template has no renderer"))
			}
		}
		for i, b := range m.Layout {
			if !types[b.Block] {
				add(errf(f, "$.layout["+strconv.Itoa(i)+"].block", "%q is not one of the template's sections", b.Block))
			}
		}
		if c.PaletteByID(m.Palette) == nil {
			add(errf(f, "$.palette", "unknown palette %q", m.Palette))
		}
		for role, fam := range m.Tokens.Font {
			if _, ok := c.Fonts.Families[fam]; !ok {
				add(errf(f, "$.tokens.font."+role, "unknown font family %q", fam))
			}
		}
		for _, pair := range TextPairs {
			add(pairProblem(f, "$.tokens.color", m.Tokens.Color, pair)...)
		}
		for _, id := range m.Customizable.Palette {
			p := c.PaletteByID(id)
			if p == nil {
				add(errf(f, "$.customizable.palette", "unknown palette %q", id))
				continue
			}
			merged := mergeColors(m.Tokens.Color, p.Color)
			for _, pair := range TextPairs {
				add(pairProblem(f, "$.customizable.palette."+id, merged, pair)...)
			}
		}
		for _, id := range m.Customizable.FontPairings {
			if !pairings[id] {
				add(errf(f, "$.customizable.fontPairings", "unknown font pairing %q", id))
			}
		}
		for _, r := range m.Customizable.Tokens {
			if _, core := m.Tokens.Color[r]; !core {
				if _, extra := m.Tokens.Extra[r]; !extra {
					add(errf(f, "$.customizable.tokens", "%q is not a token of this template", r))
				}
			}
		}
		if m.Capabilities.Gallery.Max > 0 {
			for _, s := range m.Sections {
				if s.Type == "gallery" && s.Max > 0 && s.Max != m.Capabilities.Gallery.Max {
					add(errf(f, "$.sections.gallery.max", "%d disagrees with capabilities.gallery.max %d", s.Max, m.Capabilities.Gallery.Max))
				}
			}
		}
	}
	return ps
}

func pairProblem(file, path string, color map[string]string, pair [2]string) []Problem {
	fg, bg := color[pair[0]], color[pair[1]]
	if !hexRE.MatchString(fg) || !hexRE.MatchString(bg) {
		return nil // reported by the schema
	}
	if r := Contrast(fg, bg); r < AAText {
		return []Problem{errf(file, path, "%s %s on %s %s is %.2f:1, needs %.1f:1", pair[0], fg, pair[1], bg, r, AAText)}
	}
	return nil
}

func isCoreRole(r string) bool {
	for _, c := range CoreRoles {
		if c == r {
			return true
		}
	}
	return false
}

// mergeColors returns base with over applied on top.
func mergeColors(base, over map[string]string) map[string]string {
	out := make(map[string]string, len(base))
	for k, v := range base {
		out[k] = v
	}
	for k, v := range over {
		out[k] = v
	}
	return out
}

// Contrast is the WCAG 2.x contrast ratio of two #RRGGBB colours (1..21).
func Contrast(a, b string) float64 {
	la, lb := luminance(a), luminance(b)
	if la < lb {
		la, lb = lb, la
	}
	return (la + 0.05) / (lb + 0.05)
}

func luminance(hex string) float64 {
	ch := func(i int) float64 {
		n, _ := strconv.ParseUint(hex[i:i+2], 16, 8)
		c := float64(n) / 255
		if c <= 0.03928 {
			return c / 12.92
		}
		return math.Pow((c+0.055)/1.055, 2.4)
	}
	return 0.2126*ch(1) + 0.7152*ch(3) + 0.0722*ch(5)
}
