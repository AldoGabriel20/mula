// Package catalog loads and checks the template catalog (repo-root `catalog/`, docs/17): manifests,
// palettes, font pairings and music tracks. It is the one implementation shared by the CLI
// (`cmd/templates validate|sync|gen-web`) and the API (section content validation).
package catalog

import (
	"bytes"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

// CoreRoles are the colour roles every manifest defines (docs/17 §6.1).
var CoreRoles = []string{"bg", "surface", "ink", "inkSoft", "muted", "accent", "accentSoft", "line", "danger", "onAccent"}

// SectionTypes are the section types of the shared content model (docs/17 §7.6).
var SectionTypes = []string{"hero", "opening", "story", "schedule", "gallery", "gift", "rsvp", "wishes", "music", "closing"}

type Manifest struct {
	ManifestVersion int          `json:"manifestVersion"`
	Slug            string       `json:"slug"`
	Name            string       `json:"name"`
	Kind            string       `json:"kind"`
	Renderer        string       `json:"renderer,omitempty"`
	Status          string       `json:"status"`
	Access          string       `json:"access"`
	Category        string       `json:"category"`
	EventTypes      []string     `json:"eventTypes"`
	Tags            []string     `json:"tags"`
	Position        int          `json:"position"`
	Palette         string       `json:"palette"`
	Marketing       Marketing    `json:"marketing"`
	Sections        []SectionDef `json:"sections"`
	Capabilities    Capabilities `json:"capabilities"`
	Tokens          Tokens       `json:"tokens"`
	Customizable    Customizable `json:"customizable"`
	Layout          []Block      `json:"layout,omitempty"`
	Thumbnail       string       `json:"thumbnail"`
	ThumbnailMobile string       `json:"thumbnailMobile,omitempty"`
	Budget          *Budget      `json:"budget,omitempty"`
}

type Marketing struct {
	Desc  string `json:"desc"`
	Style string `json:"style"`
	Mood  string `json:"mood"`
	Demo  *Demo  `json:"demo,omitempty"`
}
type Demo struct {
	Route string `json:"route"`
}
type SectionDef struct {
	Type              string `json:"type"`
	Required          bool   `json:"required,omitempty"`
	HiddenUntilFilled bool   `json:"hiddenUntilFilled,omitempty"`
	Max               int    `json:"max,omitempty"`
}
type Capabilities struct {
	Music         bool     `json:"music"`
	Gallery       Max      `json:"gallery"`
	Wishes        bool     `json:"wishes"`
	RSVP          bool     `json:"rsvp"`
	Gift          bool     `json:"gift"`
	Timezone      bool     `json:"timezone"`
	MultiMoment   Max      `json:"multiMoment"`
	Languages     []string `json:"languages"`
	NeedsWebGL    bool     `json:"needsWebGL"`
	ReducedMotion string   `json:"reducedMotion"`
}
type Max struct {
	Max int `json:"max"`
}
type Tokens struct {
	Color  map[string]string `json:"color"`
	Font   map[string]string `json:"font"`
	Motion Motion            `json:"motion"`
	Extra  map[string]string `json:"extra,omitempty"`
}
type Motion struct {
	Level         string  `json:"level"`
	DurationScale float64 `json:"durationScale,omitempty"`
}
type Customizable struct {
	Palette      []string `json:"palette"`
	FontPairings []string `json:"fontPairings"`
	Tokens       []string `json:"tokens"`
	Motion       []string `json:"motion"`
}
type Block struct {
	Block       string `json:"block"`
	Variant     string `json:"variant,omitempty"`
	VisibleWhen string `json:"visibleWhen,omitempty"`
}
type Budget struct {
	JSGzKb int `json:"jsGzKb"`
}

type Palette struct {
	ID      string            `json:"id"`
	Name    string            `json:"name"`
	Swatch  []string          `json:"swatch"`
	Color   map[string]string `json:"color"`
	Extra   map[string]string `json:"extra,omitempty"`
	Aliases []string          `json:"aliases"`
}

type FontFile struct {
	Src    string `json:"src"`
	Style  string `json:"style"`
	Weight string `json:"weight"`
}
type FontFamily struct {
	Name     string     `json:"name"`
	License  string     `json:"license"`
	Fallback string     `json:"fallback"`
	Files    []FontFile `json:"files"`
}
type Pairing struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	Display string `json:"display"`
	Body    string `json:"body"`
	Script  string `json:"script"`
	Mono    string `json:"mono,omitempty"`
}
type Fonts struct {
	Families map[string]FontFamily `json:"families"`
	Pairings []Pairing             `json:"pairings"`
}

type Track struct {
	Key        string `json:"key"`
	Title      string `json:"title"`
	Credit     string `json:"credit"`
	Src        string `json:"src"`
	License    string `json:"license"`
	DurationMs int    `json:"durationMs"`
}

// Template is one manifest plus where it came from.
type Template struct {
	Manifest Manifest
	Raw      map[string]any // the file as decoded, stored verbatim in templates.manifest
	File     string
}

type Catalog struct {
	Dir       string
	Templates []Template // sorted by slug
	Palettes  []Palette
	Fonts     Fonts
	Tracks    []Track
	Sections  *Schema // sections.schema.json: $defs per section type
	manifest  *Schema
}

// Load reads every file under dir. Files that cannot be read or decoded are returned as problems;
// the schema checks and cross-reference rules run in Validate.
func Load(dir string) (*Catalog, []Problem) {
	c := &Catalog{Dir: dir}
	var ps []Problem
	fail := func(file, msg string) { ps = append(ps, Problem{File: file, Path: "$", Msg: msg}) }

	if b, err := os.ReadFile(filepath.Join(dir, "manifest.schema.json")); err != nil {
		fail("manifest.schema.json", err.Error())
	} else if c.manifest, err = ParseSchema(b); err != nil {
		fail("manifest.schema.json", err.Error())
	}
	if b, err := os.ReadFile(filepath.Join(dir, "sections.schema.json")); err != nil {
		fail("sections.schema.json", err.Error())
	} else if c.Sections, err = ParseSchema(b); err != nil {
		fail("sections.schema.json", err.Error())
	}
	var pal struct {
		Palettes []Palette `json:"palettes"`
	}
	readStrict(dir, "palettes.json", &pal, &ps)
	c.Palettes = pal.Palettes
	readStrict(dir, "fonts.json", &c.Fonts, &ps)
	var mus struct {
		Tracks []Track `json:"tracks"`
	}
	readStrict(dir, "music.json", &mus, &ps)
	c.Tracks = mus.Tracks

	matches, _ := filepath.Glob(filepath.Join(dir, "templates", "*", "manifest.json"))
	sort.Strings(matches)
	for _, m := range matches {
		rel, _ := filepath.Rel(dir, m)
		b, err := os.ReadFile(m)
		if err != nil {
			fail(rel, err.Error())
			continue
		}
		raw, err := decodeJSON(b)
		if err != nil {
			fail(rel, err.Error())
			continue
		}
		rm, ok := raw.(map[string]any)
		if !ok {
			fail(rel, "manifest must be a JSON object")
			continue
		}
		t := Template{Raw: rm, File: rel}
		// Decode into the typed form leniently: the schema pass reports unknown keys and wrong types by path.
		_ = json.Unmarshal(b, &t.Manifest)
		c.Templates = append(c.Templates, t)
	}
	sort.Slice(c.Templates, func(i, j int) bool { return c.Templates[i].Manifest.Slug < c.Templates[j].Manifest.Slug })
	return c, ps
}

func readStrict(dir, name string, into any, ps *[]Problem) {
	b, err := os.ReadFile(filepath.Join(dir, name))
	if err != nil {
		*ps = append(*ps, Problem{File: name, Path: "$", Msg: err.Error()})
		return
	}
	dec := json.NewDecoder(bytes.NewReader(b))
	dec.DisallowUnknownFields()
	if err := dec.Decode(into); err != nil {
		*ps = append(*ps, Problem{File: name, Path: "$", Msg: err.Error()})
	}
}

func decodeJSON(b []byte) (any, error) {
	var v any
	if err := json.Unmarshal(b, &v); err != nil {
		return nil, err
	}
	return v, nil
}

// Template returns the manifest for slug.
func (c *Catalog) Template(slug string) *Manifest {
	for i := range c.Templates {
		if c.Templates[i].Manifest.Slug == slug {
			return &c.Templates[i].Manifest
		}
	}
	return nil
}

// PaletteByID resolves an id or a legacy alias (case-sensitive, as stored in invitations.palette).
func (c *Catalog) PaletteByID(idOrAlias string) *Palette {
	for i := range c.Palettes {
		p := &c.Palettes[i]
		if p.ID == idOrAlias {
			return p
		}
		for _, a := range p.Aliases {
			if a == idOrAlias {
				return p
			}
		}
	}
	return nil
}

// TrackKeys lists the music catalog keys.
func (c *Catalog) TrackKeys() []string {
	out := make([]string, len(c.Tracks))
	for i, t := range c.Tracks {
		out[i] = t.Key
	}
	return out
}

// LegacyPalette is the value kept in templates.palette / invitations.palette for a palette id.
func (c *Catalog) LegacyPalette(id string) string {
	p := c.PaletteByID(id)
	if p == nil {
		return id
	}
	if len(p.Aliases) > 0 {
		return p.Aliases[0]
	}
	return p.Name
}

// TagsLabel renders manifest tags the way templates.tags stores them ("Elegant · Cinematic").
func TagsLabel(tags []string) string { return strings.Join(tags, " · ") }

func errf(file, path, format string, a ...any) Problem {
	return Problem{File: file, Path: path, Msg: fmt.Sprintf(format, a...)}
}
