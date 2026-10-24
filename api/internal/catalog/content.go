package catalog

import (
	"encoding/json"
	"fmt"
	"strings"
)

const (
	maxContentBytes = 32 << 10 // a whole section
	maxExtraBytes   = 2 << 10  // one key the schema does not know
)

// ContentChecker validates section content (docs/17 §10.3): the shape from sections.schema.json, the
// gallery cap from the template, the music track against the catalog. Keys the schema does not list are
// kept (forward compatibility) but size-capped. Media ownership is checked by the service (needs the DB).
type ContentChecker struct {
	schema *Schema
	tracks map[string]bool
}

// ContentChecker builds a checker over the loaded catalog.
func (c *Catalog) ContentChecker() *ContentChecker {
	k := &ContentChecker{schema: c.Sections, tracks: map[string]bool{}}
	for _, t := range c.Tracks {
		k.tracks[t.Key] = true
	}
	return k
}

// Check returns field path -> message, nil when the content is acceptable. galleryMax caps
// gallery.photos below the schema's own cap (the picked template's capability); 0 leaves it.
func (k *ContentChecker) Check(typ string, content map[string]any, galleryMax int) map[string]string {
	fields := map[string]string{}
	if b, _ := json.Marshal(content); len(b) > maxContentBytes {
		fields["content"] = fmt.Sprintf("must be at most %d KB", maxContentBytes>>10)
	}
	def := k.schema.Def(typ)
	if def == nil {
		return nilIfEmpty(fields) // not a type of the shared model: nothing to check beyond the size
	}
	props, _ := def["properties"].(map[string]any)
	for key, v := range content {
		if _, known := props[key]; !known {
			if b, _ := json.Marshal(v); len(b) > maxExtraBytes {
				fields["content."+key] = fmt.Sprintf("must be at most %d KB", maxExtraBytes>>10)
			}
		}
	}
	// validate only the keys the schema lists, so unknown keys stay allowed
	known := map[string]any{}
	for key, v := range content {
		if _, ok := props[key]; ok {
			known[key] = v
		}
	}
	for _, p := range k.schema.ValidateDef(typ, known) {
		fields["content"+strings.TrimPrefix(p.Path, "$")] = p.Msg
	}
	if typ == "gallery" && galleryMax > 0 {
		if photos, ok := content["photos"].([]any); ok && len(photos) > galleryMax {
			fields["content.photos"] = fmt.Sprintf("must have at most %d photos", galleryMax)
		}
	}
	if typ == "music" {
		if tr, ok := content["track"].(string); ok && tr != "" && !k.tracks[tr] {
			fields["content.track"] = "unknown track"
		}
	}
	return nilIfEmpty(fields)
}

func nilIfEmpty(m map[string]string) map[string]string {
	if len(m) == 0 {
		return nil
	}
	return m
}
