package catalog

import (
	"fmt"
	"math"
	"regexp"
	"sort"
	"strings"
)

// Problem is one validation finding: where, and what is wrong.
type Problem struct {
	File string // file the document came from; set by the caller
	Path string // JSON path inside the document, e.g. $.tokens.color.bg
	Msg  string
}

func (p Problem) String() string {
	if p.File == "" {
		return fmt.Sprintf("%s: %s", p.Path, p.Msg)
	}
	return fmt.Sprintf("%s: %s: %s", p.File, p.Path, p.Msg)
}

// Schema is a JSON Schema document decoded into generic values. Only the subset the catalog files use is
// implemented (type, enum, const, pattern, min/max length/items/value, required, properties,
// additionalProperties, items, $ref into #/$defs); a keyword outside it is ignored, so keep the schema inside it.
// ponytail: hand-rolled because go.mod carries no JSON Schema library and the subset is ~100 lines;
// swap in a vetted library if schemas ever need oneOf/allOf.
type Schema struct{ root map[string]any }

// ParseSchema decodes a schema document.
func ParseSchema(b []byte) (*Schema, error) {
	v, err := decodeJSON(b)
	if err != nil {
		return nil, err
	}
	m, ok := v.(map[string]any)
	if !ok {
		return nil, fmt.Errorf("schema must be a JSON object")
	}
	return &Schema{root: m}, nil
}

// Validate checks doc (a value from encoding/json) against the root schema.
func (s *Schema) Validate(doc any) []Problem { return s.validate(s.root, doc, "$", nil) }

// ValidateDef checks doc against the named entry of $defs (the section content schemas use this).
func (s *Schema) ValidateDef(name string, doc any) []Problem {
	defs, _ := s.root["$defs"].(map[string]any)
	d, ok := defs[name].(map[string]any)
	if !ok {
		return []Problem{{Path: "$", Msg: "no schema for " + name}}
	}
	return s.validate(d, doc, "$", nil)
}

// Def returns the named $defs entry, or nil.
func (s *Schema) Def(name string) map[string]any {
	defs, _ := s.root["$defs"].(map[string]any)
	d, _ := defs[name].(map[string]any)
	return d
}

func (s *Schema) validate(sc map[string]any, v any, path string, out []Problem) []Problem {
	if ref, ok := sc["$ref"].(string); ok {
		name := strings.TrimPrefix(ref, "#/$defs/")
		d := s.Def(name)
		if d == nil {
			return append(out, Problem{Path: path, Msg: "unresolved schema reference " + ref})
		}
		return s.validate(d, v, path, out)
	}
	if c, ok := sc["const"]; ok && !jsonEqual(c, v) {
		return append(out, Problem{Path: path, Msg: fmt.Sprintf("must be %v", c)})
	}
	if en, ok := sc["enum"].([]any); ok {
		found := false
		for _, e := range en {
			if jsonEqual(e, v) {
				found = true
				break
			}
		}
		if !found {
			return append(out, Problem{Path: path, Msg: fmt.Sprintf("must be one of %s", joinAny(en))})
		}
	}
	if t, ok := sc["type"].(string); ok && !typeOK(t, v) {
		return append(out, Problem{Path: path, Msg: fmt.Sprintf("must be %s", t)})
	}
	switch x := v.(type) {
	case string:
		n := len([]rune(x))
		if m, ok := num(sc["minLength"]); ok && float64(n) < m {
			out = append(out, Problem{Path: path, Msg: fmt.Sprintf("must be at least %d characters", int(m))})
		}
		if m, ok := num(sc["maxLength"]); ok && float64(n) > m {
			out = append(out, Problem{Path: path, Msg: fmt.Sprintf("must be at most %d characters", int(m))})
		}
		if p, ok := sc["pattern"].(string); ok && !regexp.MustCompile(p).MatchString(x) {
			out = append(out, Problem{Path: path, Msg: "does not match " + p})
		}
	case float64:
		if m, ok := num(sc["minimum"]); ok && x < m {
			out = append(out, Problem{Path: path, Msg: fmt.Sprintf("must be at least %v", m)})
		}
		if m, ok := num(sc["maximum"]); ok && x > m {
			out = append(out, Problem{Path: path, Msg: fmt.Sprintf("must be at most %v", m)})
		}
	case []any:
		if m, ok := num(sc["minItems"]); ok && float64(len(x)) < m {
			out = append(out, Problem{Path: path, Msg: fmt.Sprintf("must have at least %d items", int(m))})
		}
		if m, ok := num(sc["maxItems"]); ok && float64(len(x)) > m {
			out = append(out, Problem{Path: path, Msg: fmt.Sprintf("must have at most %d items", int(m))})
		}
		if it, ok := sc["items"].(map[string]any); ok {
			for i, e := range x {
				out = s.validate(it, e, fmt.Sprintf("%s[%d]", path, i), out)
			}
		}
	case map[string]any:
		props, _ := sc["properties"].(map[string]any)
		if req, ok := sc["required"].([]any); ok {
			for _, r := range req {
				if k, _ := r.(string); k != "" {
					if _, has := x[k]; !has {
						out = append(out, Problem{Path: path + "." + k, Msg: "is required"})
					}
				}
			}
		}
		keys := make([]string, 0, len(x))
		for k := range x {
			keys = append(keys, k)
		}
		sort.Strings(keys)
		for _, k := range keys {
			if ps, ok := props[k].(map[string]any); ok {
				out = s.validate(ps, x[k], path+"."+k, out)
				continue
			}
			switch ap := sc["additionalProperties"].(type) {
			case bool:
				if !ap {
					out = append(out, Problem{Path: path + "." + k, Msg: "unknown key"})
				}
			case map[string]any:
				out = s.validate(ap, x[k], path+"."+k, out)
			}
		}
	}
	return out
}

func typeOK(t string, v any) bool {
	switch t {
	case "object":
		_, ok := v.(map[string]any)
		return ok
	case "array":
		_, ok := v.([]any)
		return ok
	case "string":
		_, ok := v.(string)
		return ok
	case "boolean":
		_, ok := v.(bool)
		return ok
	case "number":
		_, ok := v.(float64)
		return ok
	case "integer":
		f, ok := v.(float64)
		return ok && f == math.Trunc(f)
	}
	return true
}

func num(v any) (float64, bool) { f, ok := v.(float64); return f, ok }

func jsonEqual(a, b any) bool { return fmt.Sprint(a) == fmt.Sprint(b) }

func joinAny(a []any) string {
	s := make([]string, len(a))
	for i, v := range a {
		s[i] = fmt.Sprint(v)
	}
	return strings.Join(s, ", ")
}
