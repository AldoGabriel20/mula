package catalog

import (
	"context"
	"encoding/json"
	"fmt"
	"reflect"
	"sort"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

// DB is the slice of pgx that Sync needs; a pgx.Tx satisfies it (the CLI commits it, tests roll it back).
type DB interface {
	Exec(ctx context.Context, sql string, args ...any) (pgconn.CommandTag, error)
	Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
}

// Report says what Sync did, by slug.
type Report struct{ Inserted, Updated, Retired, Unchanged []string }

func (r Report) String() string {
	return fmt.Sprintf("templates: %d inserted %v, %d updated %v, %d retired %v, %d unchanged",
		len(r.Inserted), r.Inserted, len(r.Updated), r.Updated, len(r.Retired), r.Retired, len(r.Unchanged))
}

// row is the catalog columns Sync owns.
type row struct {
	Name, Category, Tags, Palette, Kind, Status, Access string
	Position, Version                                   int
	Active                                              bool
	Manifest                                            map[string]any
}

func desired(c *Catalog, t Template) row {
	m := t.Manifest
	return row{
		Name: m.Name, Category: m.Category, Tags: TagsLabel(m.Tags), Palette: c.LegacyPalette(m.Palette),
		Kind: m.Kind, Status: m.Status, Access: m.Access, Position: m.Position, Active: m.Status == "published",
		Manifest: t.Raw,
	}
}

// Sync upserts every platform template by slug (docs/17 §9.2, §5.5). In one transaction (the caller's):
//   - a new slug is inserted;
//   - a changed manifest is written and, if the row already held a manifest, its version bumped;
//   - a change that removes a section type, a token role or changes the kind is refused (nothing is written);
//   - a platform row whose manifest left the repo becomes status 'retired' (never deleted: invitations reference it).
//     Rows that never had a manifest (the catalog rows of migration 0014, waiting for their phase-3 layout) are left alone;
//   - an unchanged template is not touched (updated_at stays).
func Sync(ctx context.Context, db DB, c *Catalog) (Report, error) {
	var rep Report
	have := map[string]row{}
	rows, err := db.Query(ctx, `SELECT slug, name, category, tags, palette, kind, status, access, position, version, active, manifest FROM templates WHERE owner_id IS NULL`)
	if err != nil {
		return rep, err
	}
	for rows.Next() {
		var slug string
		var r row
		var raw []byte
		if err := rows.Scan(&slug, &r.Name, &r.Category, &r.Tags, &r.Palette, &r.Kind, &r.Status, &r.Access, &r.Position, &r.Version, &r.Active, &raw); err != nil {
			rows.Close()
			return rep, err
		}
		_ = json.Unmarshal(raw, &r.Manifest)
		have[slug] = r
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return rep, err
	}

	var refused []string
	for _, t := range c.Templates {
		if old, ok := have[t.Manifest.Slug]; ok {
			for _, b := range BreakingChanges(old.Manifest, t.Raw) {
				refused = append(refused, t.Manifest.Slug+": "+b)
			}
		}
	}
	if len(refused) > 0 {
		return rep, fmt.Errorf("refusing breaking manifest changes (use a new slug, docs/17 §5.5):\n  %s", strings.Join(refused, "\n  "))
	}

	inRepo := map[string]bool{}
	for _, t := range c.Templates {
		slug := t.Manifest.Slug
		inRepo[slug] = true
		want := desired(c, t)
		manifest, _ := json.Marshal(t.Raw)
		old, ok := have[slug]
		if !ok {
			want.Version = 1
			_, err := db.Exec(ctx, `INSERT INTO templates (slug, name, category, tags, palette, position, active, kind, status, access, version, manifest)
				VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
				slug, want.Name, want.Category, want.Tags, want.Palette, want.Position, want.Active, want.Kind, want.Status, want.Access, want.Version, manifest)
			if err != nil {
				return rep, fmt.Errorf("insert %s: %w", slug, err)
			}
			rep.Inserted = append(rep.Inserted, slug)
			continue
		}
		manifestChanged := !reflect.DeepEqual(old.Manifest, t.Raw)
		want.Version = old.Version
		if manifestChanged && len(old.Manifest) > 0 {
			want.Version = old.Version + 1 // additive change (breaking ones were refused above)
		}
		old.Manifest, want.Manifest = nil, nil
		if !manifestChanged && reflect.DeepEqual(old, want) {
			rep.Unchanged = append(rep.Unchanged, slug)
			continue
		}
		_, err := db.Exec(ctx, `UPDATE templates SET name=$2, category=$3, tags=$4, palette=$5, position=$6, active=$7, kind=$8, status=$9, access=$10,
			version=$11, manifest=$12, updated_at=now() WHERE slug=$1 AND owner_id IS NULL`,
			slug, want.Name, want.Category, want.Tags, want.Palette, want.Position, want.Active, want.Kind, want.Status, want.Access, want.Version, manifest)
		if err != nil {
			return rep, fmt.Errorf("update %s: %w", slug, err)
		}
		rep.Updated = append(rep.Updated, slug)
	}

	var gone []string
	for slug, r := range have {
		if !inRepo[slug] && r.Status != "retired" && len(r.Manifest) > 0 {
			gone = append(gone, slug)
		}
	}
	sort.Strings(gone)
	for _, slug := range gone {
		if _, err := db.Exec(ctx, `UPDATE templates SET status='retired', active=false, updated_at=now() WHERE slug=$1 AND owner_id IS NULL`, slug); err != nil {
			return rep, fmt.Errorf("retire %s: %w", slug, err)
		}
		rep.Retired = append(rep.Retired, slug)
	}
	return rep, nil
}

// BreakingChanges lists what going from old to next would break for published invitations:
// a changed kind, a removed section type, a removed colour/extra/font token role. An empty old
// manifest (a row created by a migration, never synced) breaks nothing.
func BreakingChanges(old, next map[string]any) []string {
	if len(old) == 0 {
		return nil
	}
	var out []string
	if o, n := str(old["kind"]), str(next["kind"]); o != n {
		out = append(out, fmt.Sprintf("kind changed %q -> %q", o, n))
	}
	nextTypes := sectionTypes(next)
	for typ := range sectionTypes(old) {
		if !nextTypes[typ] {
			out = append(out, fmt.Sprintf("section type %q removed", typ))
		}
	}
	for _, group := range []string{"color", "extra", "font"} {
		oldRoles, nextRoles := tokenRoles(old, group), tokenRoles(next, group)
		for role := range oldRoles {
			if !nextRoles[role] {
				out = append(out, fmt.Sprintf("token %s.%s removed", group, role))
			}
		}
	}
	sort.Strings(out)
	return out
}

func str(v any) string { s, _ := v.(string); return s }

func sectionTypes(m map[string]any) map[string]bool {
	out := map[string]bool{}
	secs, _ := m["sections"].([]any)
	for _, s := range secs {
		if sm, ok := s.(map[string]any); ok {
			out[str(sm["type"])] = true
		}
	}
	return out
}

func tokenRoles(m map[string]any, group string) map[string]bool {
	out := map[string]bool{}
	toks, _ := m["tokens"].(map[string]any)
	g, _ := toks[group].(map[string]any)
	for k := range g {
		out[k] = true
	}
	return out
}
