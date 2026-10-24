package catalog

import (
	"context"
	"encoding/json"
	"github.com/mula/mula/internal/domain/invitation"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"
)

const repoCatalog = "../../../catalog"

// fixture copies the repo catalog into a temp dir so a test can break one thing.
func fixture(t *testing.T) string {
	t.Helper()
	dst := t.TempDir()
	err := filepath.Walk(repoCatalog, func(p string, info os.FileInfo, err error) error {
		if err != nil || info.IsDir() {
			return err
		}
		rel, _ := filepath.Rel(repoCatalog, p)
		b, err := os.ReadFile(p)
		if err != nil {
			return err
		}
		out := filepath.Join(dst, rel)
		_ = os.MkdirAll(filepath.Dir(out), 0o755)
		return os.WriteFile(out, b, 0o644)
	})
	if err != nil {
		t.Fatal(err)
	}
	return dst
}

// edit rewrites a JSON file in dir through fn.
func edit(t *testing.T, dir, rel string, fn func(m map[string]any)) {
	t.Helper()
	p := filepath.Join(dir, rel)
	b, err := os.ReadFile(p)
	if err != nil {
		t.Fatal(err)
	}
	var m map[string]any
	if err := json.Unmarshal(b, &m); err != nil {
		t.Fatal(err)
	}
	fn(m)
	b, _ = json.MarshalIndent(m, "", "  ")
	if err := os.WriteFile(p, b, 0o644); err != nil {
		t.Fatal(err)
	}
}

func validate(t *testing.T, dir string) []string {
	t.Helper()
	c, ps := Load(dir)
	ps = append(ps, c.Validate(Options{WebDir: "../../../web"})...)
	out := make([]string, len(ps))
	for i, p := range ps {
		out[i] = p.String()
	}
	return out
}

func mustContain(t *testing.T, got []string, want string) {
	t.Helper()
	for _, g := range got {
		if strings.Contains(g, want) {
			return
		}
	}
	t.Fatalf("want a problem containing %q, got %v", want, got)
}

func TestRepoCatalogIsValid(t *testing.T) {
	if got := validate(t, repoCatalog); len(got) != 0 {
		t.Fatalf("repo catalog has problems: %v", got)
	}
}

func TestManifestRules(t *testing.T) {
	const man = "templates/gilded-seal/manifest.json"
	tokens := func(m map[string]any) map[string]any { return m["tokens"].(map[string]any) }
	cases := []struct {
		name string
		fn   func(m map[string]any)
		want string
	}{
		{"unknown key fails with a path", func(m map[string]any) { m["bogus"] = 1 }, "$.bogus: unknown key"},
		{"bad slug", func(m map[string]any) { m["slug"] = "Gilded Seal" }, "$.slug"},
		{"slug must match folder", func(m map[string]any) { m["slug"] = "other-slug" }, "must equal its folder name"},
		{"newer manifest version refused", func(m map[string]any) { m["manifestVersion"] = 2 }, "$.manifestVersion: must be 1"},
		{"unknown section type", func(m map[string]any) {
			m["sections"] = append(m["sections"].([]any), map[string]any{"type": "faq"})
		}, "$.sections[10].type"},
		{"duplicate section type", func(m map[string]any) {
			m["sections"] = append(m["sections"].([]any), map[string]any{"type": "hero"})
		}, "duplicate section type"},
		{"coded needs renderer", func(m map[string]any) { delete(m, "renderer") }, "needs a renderer"},
		{"renderer file must exist", func(m map[string]any) { m["renderer"] = "gilded-seal/Nope" }, "Nope.tsx not found"},
		{"coded forbids layout", func(m map[string]any) {
			m["layout"] = []any{map[string]any{"block": "hero"}}
		}, "cannot have a layout"},
		{"themed needs layout", func(m map[string]any) { m["kind"] = "themed"; delete(m, "renderer") }, "needs a layout"},
		{"unknown capability key", func(m map[string]any) { m["capabilities"].(map[string]any)["telepathy"] = true }, "capabilities.telepathy: unknown key"},
		{"missing colour role", func(m map[string]any) { delete(tokens(m)["color"].(map[string]any), "ink") }, "$.tokens.color.ink: is required"},
		{"low contrast text pair", func(m map[string]any) { tokens(m)["color"].(map[string]any)["ink"] = "#EEE8DD" }, "ink #EEE8DD on bg"},
		{"low contrast onAccent", func(m map[string]any) { tokens(m)["color"].(map[string]any)["onAccent"] = "#FFFFFF" }, "onAccent #FFFFFF on accent"},
		{"unknown font family", func(m map[string]any) { tokens(m)["font"].(map[string]any)["body"] = "comic" }, `unknown font family "comic"`},
		{"unknown default palette", func(m map[string]any) { m["palette"] = "nope" }, `unknown palette "nope"`},
		{"customizable palette must exist", func(m map[string]any) {
			m["customizable"].(map[string]any)["palette"] = []any{"nope"}
		}, `unknown palette "nope"`},
		{"customizable pairing must exist", func(m map[string]any) {
			m["customizable"].(map[string]any)["fontPairings"] = []any{"nope"}
		}, `unknown font pairing "nope"`},
		{"customizable token must exist", func(m map[string]any) {
			m["customizable"].(map[string]any)["tokens"] = []any{"sparkle"}
		}, `"sparkle" is not a token`},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			dir := fixture(t)
			edit(t, dir, man, tc.fn)
			mustContain(t, validate(t, dir), tc.want)
		})
	}

	t.Run("valid customizable passes", func(t *testing.T) {
		dir := fixture(t)
		edit(t, dir, man, func(m map[string]any) {
			c := m["customizable"].(map[string]any)
			c["palette"] = []any{"rose-linen", "sage-parchment"}
			c["fontPairings"] = []any{"classic-serif"}
			c["tokens"] = []any{"accent", "eyebrow"}
			c["motion"] = []any{"full", "calm"}
		})
		if got := validate(t, dir); len(got) != 0 {
			t.Fatalf("got %v", got)
		}
	})
}

func TestLibraryRules(t *testing.T) {
	cases := []struct {
		name, file string
		fn         func(m map[string]any)
		want       string
	}{
		{"font licence required", "fonts.json", func(m map[string]any) {
			m["families"].(map[string]any)["manrope"].(map[string]any)["license"] = ""
		}, "license: is required"},
		{"font file must exist", "fonts.json", func(m map[string]any) {
			m["families"].(map[string]any)["manrope"].(map[string]any)["files"] = []any{map[string]any{"src": "/fonts/none.woff2", "style": "normal", "weight": "400"}}
		}, "file not found"},
		{"pairing family must exist", "fonts.json", func(m map[string]any) {
			m["pairings"].([]any)[0].(map[string]any)["display"] = "nope"
		}, `unknown font family "nope"`},
		{"track licence required", "music.json", func(m map[string]any) {
			m["tracks"].([]any)[0].(map[string]any)["license"] = ""
		}, "license: is required"},
		{"duplicate track key", "music.json", func(m map[string]any) {
			tr := m["tracks"].([]any)
			m["tracks"] = append(tr, tr[0])
		}, "duplicate track key"},
		{"palette colour must be hex", "palettes.json", func(m map[string]any) {
			m["palettes"].([]any)[1].(map[string]any)["color"].(map[string]any)["bg"] = "url(x)"
		}, "not #RRGGBB"},
		{"palette alias must be unique", "palettes.json", func(m map[string]any) {
			ps := m["palettes"].([]any)
			ps[1].(map[string]any)["aliases"] = []any{"Ivory"}
		}, `"Ivory" is already used`},
		{"palette role must be core", "palettes.json", func(m map[string]any) {
			m["palettes"].([]any)[1].(map[string]any)["color"].(map[string]any)["sparkle"] = "#FFFFFF"
		}, "unknown colour role"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			dir := fixture(t)
			edit(t, dir, tc.file, tc.fn)
			mustContain(t, validate(t, dir), tc.want)
		})
	}
}

func TestEveryPaletteKeepsTextReadable(t *testing.T) {
	c, ps := Load(repoCatalog)
	if len(ps) > 0 {
		t.Fatal(ps)
	}
	base := c.Template("gilded-seal").Tokens.Color
	for _, p := range c.Palettes {
		merged := mergeColors(base, p.Color)
		for _, pair := range TextPairs {
			if r := Contrast(merged[pair[0]], merged[pair[1]]); r < AAText {
				t.Errorf("palette %s: %s on %s = %.2f", p.ID, pair[0], pair[1], r)
			}
		}
	}
}

func TestLegacyPaletteAliases(t *testing.T) {
	c, _ := Load(repoCatalog)
	for alias, id := range map[string]string{"Ivory": "gold-ivory", "Stone": "stone-linen", "Blush": "rose-linen", "Forest": "sage-parchment", "Midnight": "midnight-gold"} {
		p := c.PaletteByID(alias)
		if p == nil || p.ID != id {
			t.Errorf("alias %s -> %v want %s", alias, p, id)
		}
	}
	if c.PaletteByID("nope") != nil {
		t.Error("unknown palette resolved")
	}
	if got := c.LegacyPalette("gold-ivory"); got != "Ivory" {
		t.Errorf("legacy label = %q", got)
	}
}

func TestContrast(t *testing.T) {
	if r := Contrast("#000000", "#FFFFFF"); r < 20.9 || r > 21.1 {
		t.Fatalf("black/white = %v", r)
	}
	if r := Contrast("#777777", "#777777"); r != 1 {
		t.Fatalf("same colour = %v", r)
	}
}

func TestBreakingChanges(t *testing.T) {
	load := func(f func(m map[string]any)) map[string]any {
		b, _ := os.ReadFile(filepath.Join(repoCatalog, "templates/gilded-seal/manifest.json"))
		var m map[string]any
		_ = json.Unmarshal(b, &m)
		if f != nil {
			f(m)
		}
		return m
	}
	old := load(nil)
	if got := BreakingChanges(old, load(nil)); len(got) != 0 {
		t.Fatalf("identical = %v", got)
	}
	if got := BreakingChanges(map[string]any{}, old); len(got) != 0 {
		t.Fatalf("empty old = %v", got)
	}
	added := load(func(m map[string]any) {
		m["sections"] = append(m["sections"].([]any), map[string]any{"type": "faq"})
		m["tokens"].(map[string]any)["extra"].(map[string]any)["newOne"] = "#000000"
	})
	if got := BreakingChanges(old, added); len(got) != 0 {
		t.Fatalf("additive = %v", got)
	}
	removed := load(func(m map[string]any) {
		m["sections"] = m["sections"].([]any)[1:]
		delete(m["tokens"].(map[string]any)["color"].(map[string]any), "danger")
		delete(m["tokens"].(map[string]any)["extra"].(map[string]any), "eyebrow")
		m["kind"] = "themed"
	})
	got := strings.Join(BreakingChanges(old, removed), "|")
	for _, want := range []string{`section type "hero" removed`, "token color.danger removed", "token extra.eyebrow removed", "kind changed"} {
		if !strings.Contains(got, want) {
			t.Errorf("missing %q in %s", want, got)
		}
	}
}

func TestSchemaValidator(t *testing.T) {
	sc, err := ParseSchema([]byte(`{"type":"object","required":["a"],"additionalProperties":false,
		"properties":{"a":{"type":"string","maxLength":3,"pattern":"^[a-z]+$"},"n":{"type":"integer","minimum":1},"l":{"type":"array","maxItems":1,"items":{"$ref":"#/$defs/x"}}},
		"$defs":{"x":{"enum":["p","q"]}}}`))
	if err != nil {
		t.Fatal(err)
	}
	var doc any
	_ = json.Unmarshal([]byte(`{"a":"ABCD","n":0.5,"l":["p","z"],"extra":1}`), &doc)
	got := ""
	for _, p := range sc.Validate(doc) {
		got += p.String() + "\n"
	}
	for _, want := range []string{"$.a: must be at most 3 characters", "$.a: does not match", "$.n: must be integer", "$.l: must have at most 1 items", "$.l[1]: must be one of p, q", "$.extra: unknown key"} {
		if !strings.Contains(got, want) {
			t.Errorf("missing %q in\n%s", want, got)
		}
	}
	_ = json.Unmarshal([]byte(`{}`), &doc)
	if ps := sc.Validate(doc); len(ps) != 1 || ps[0].Path != "$.a" {
		t.Errorf("required = %v", ps)
	}
}

func TestGenerateWebIsDeterministic(t *testing.T) {
	c, _ := Load(repoCatalog)
	a, b := t.TempDir(), t.TempDir()
	if _, err := GenerateWeb(c, a); err != nil {
		t.Fatal(err)
	}
	if _, err := GenerateWeb(c, b); err != nil {
		t.Fatal(err)
	}
	files, _ := filepath.Glob(filepath.Join(a, "lib/kit/generated/*.ts"))
	if len(files) != 7 {
		t.Fatalf("files = %v", files)
	}
	for _, f := range files {
		x, _ := os.ReadFile(f)
		y, _ := os.ReadFile(filepath.Join(b, "lib/kit/generated", filepath.Base(f)))
		if string(x) != string(y) || !strings.HasPrefix(string(x), genHeader) {
			t.Errorf("%s differs between runs or lacks the header", filepath.Base(f))
		}
	}
	reg, _ := os.ReadFile(filepath.Join(a, "lib/kit/generated/registry.ts"))
	if strings.Contains(string(reg), "\nimport ") {
		t.Error("registry.ts must stay server-safe (no imports)")
	}
}

// ---- Sync (needs TEST_DATABASE_URL; every test rolls its transaction back) -------------------------------

func syncTx(t *testing.T) (DB, func()) {
	t.Helper()
	dsn := os.Getenv("TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("TEST_DATABASE_URL not set")
	}
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		t.Fatal(err)
	}
	tx, err := pool.Begin(ctx)
	if err != nil {
		t.Fatal(err)
	}
	return tx, func() { _ = tx.Rollback(ctx); pool.Close() }
}

func TestSync(t *testing.T) {
	db, done := syncTx(t)
	defer done()
	ctx := context.Background()
	dir := fixture(t)

	// a second template, so the first run exercises an insert
	b, _ := os.ReadFile(filepath.Join(dir, "templates/gilded-seal/manifest.json"))
	var m map[string]any
	_ = json.Unmarshal(b, &m)
	m["slug"], m["name"], m["position"] = "kit-test-twin", "Kit Test Twin", 99
	_ = os.MkdirAll(filepath.Join(dir, "templates/kit-test-twin"), 0o755)
	nb, _ := json.Marshal(m)
	_ = os.WriteFile(filepath.Join(dir, "templates/kit-test-twin/manifest.json"), nb, 0o644)

	cat, ps := Load(dir)
	if len(ps) > 0 {
		t.Fatal(ps)
	}
	var gsID string
	_ = db.QueryRow(ctx, `SELECT id::text FROM templates WHERE slug='gilded-seal'`).Scan(&gsID)

	rep, err := Sync(ctx, db, cat)
	if err != nil {
		t.Fatal(err)
	}
	if len(rep.Inserted) != 1 || rep.Inserted[0] != "kit-test-twin" {
		t.Fatalf("first run inserted = %v", rep.Inserted)
	}
	var id2, tags string
	var version int
	var raw []byte
	_ = db.QueryRow(ctx, `SELECT id::text, tags, version, manifest FROM templates WHERE slug='gilded-seal'`).Scan(&id2, &tags, &version, &raw)
	if id2 != gsID {
		t.Fatalf("gilded-seal row changed id: %s -> %s", gsID, id2)
	}
	if tags != "Elegant · Cinematic" || len(raw) < 100 {
		t.Fatalf("tags=%q manifest=%d bytes", tags, len(raw))
	}

	var stamp1 string
	_ = db.QueryRow(ctx, `SELECT updated_at::text FROM templates WHERE slug='kit-test-twin'`).Scan(&stamp1)
	rep, err = Sync(ctx, db, cat)
	if err != nil {
		t.Fatal(err)
	}
	if len(rep.Inserted)+len(rep.Updated)+len(rep.Retired) != 0 || len(rep.Unchanged) != 3 {
		t.Fatalf("second run must be a no-op: %s", rep)
	}
	var stamp2 string
	_ = db.QueryRow(ctx, `SELECT updated_at::text FROM templates WHERE slug='kit-test-twin'`).Scan(&stamp2)
	if stamp1 != stamp2 {
		t.Fatalf("no-op run touched updated_at: %s -> %s", stamp1, stamp2)
	}

	// additive change: updated, version bumped
	edit(t, dir, "templates/kit-test-twin/manifest.json", func(m map[string]any) {
		m["marketing"].(map[string]any)["desc"] = "Changed copy."
	})
	cat, _ = Load(dir)
	rep, err = Sync(ctx, db, cat)
	if err != nil || len(rep.Updated) != 1 {
		t.Fatalf("additive change: %v %s", err, rep)
	}
	var v int
	_ = db.QueryRow(ctx, `SELECT version FROM templates WHERE slug='kit-test-twin'`).Scan(&v)
	if v != 2 {
		t.Fatalf("version = %d want 2", v)
	}

	// breaking change refused, nothing written
	edit(t, dir, "templates/kit-test-twin/manifest.json", func(m map[string]any) {
		m["sections"] = m["sections"].([]any)[1:]
	})
	cat, _ = Load(dir)
	if _, err = Sync(ctx, db, cat); err == nil || !strings.Contains(err.Error(), `section type "hero" removed`) {
		t.Fatalf("breaking change must be refused: %v", err)
	}

	// a legacy row that never had a manifest is not ours to retire
	if _, err := db.Exec(ctx, `INSERT INTO templates (slug, name, category, tags, palette, position) VALUES ('kit-legacy','Legacy','Wedding','','Ivory',98)`); err != nil {
		t.Fatal(err)
	}

	// a slug that left the repo is retired, never deleted
	if err := os.RemoveAll(filepath.Join(dir, "templates/kit-test-twin")); err != nil {
		t.Fatal(err)
	}
	cat, _ = Load(dir)
	rep, err = Sync(ctx, db, cat)
	if err != nil || len(rep.Retired) != 1 {
		t.Fatalf("retire: %v %s", err, rep)
	}
	var status string
	var active bool
	if err := db.QueryRow(ctx, `SELECT status, active FROM templates WHERE slug='kit-test-twin'`).Scan(&status, &active); err != nil || status != "retired" || active {
		t.Fatalf("retired row: %v %s %v", err, status, active)
	}
	if err := db.QueryRow(ctx, `SELECT status, active FROM templates WHERE slug='kit-legacy'`).Scan(&status, &active); err != nil || status != "published" || !active {
		t.Fatalf("legacy row must stay published: %v %s %v", err, status, active)
	}
}

func TestContentChecker(t *testing.T) {
	c, ps := Load(repoCatalog)
	if len(ps) > 0 {
		t.Fatal(ps)
	}
	k := c.ContentChecker()
	uuid := "0a1b2c3d-0000-4000-8000-000000000001"
	long := func(n int) string { return strings.Repeat("x", n) }
	photos := func(n int) []any {
		out := make([]any, n)
		for i := range out {
			out[i] = map[string]any{"id": uuid, "alt": "a"}
		}
		return out
	}
	cases := []struct {
		name       string
		typ        string
		content    map[string]any
		galleryMax int
		want       string // "" = accepted
	}{
		{"hero ok", "hero", map[string]any{"title": "The wedding of", "line": "Join us", "photo_id": uuid}, 0, ""},
		{"hero cleared photo", "hero", map[string]any{"photo_id": ""}, 0, ""},
		{"hero line too long", "hero", map[string]any{"line": long(161)}, 0, "content.line"},
		{"hero photo not a uuid", "hero", map[string]any{"photo_id": "nope"}, 0, "content.photo_id"},
		{"hero title wrong type", "hero", map[string]any{"title": 5}, 0, "content.title"},
		{"opening statement ≤ 90", "opening", map[string]any{"statement": long(91)}, 0, "content.statement"},
		{"story 5 chapters ok", "story", map[string]any{"chapters": []any{map[string]any{"title": "a", "text": "b"}, map[string]any{}, map[string]any{}, map[string]any{}, map[string]any{}}}, 0, ""},
		{"story 6 chapters", "story", map[string]any{"chapters": make([]any, 6)}, 0, "content.chapters"},
		{"story chapter title ≤ 40", "story", map[string]any{"chapters": []any{map[string]any{"title": long(41)}}}, 0, "content.chapters[0].title"},
		{"story 3 photos", "story", map[string]any{"photo_ids": []any{uuid, uuid, uuid}}, 0, "content.photo_ids"},
		{"gallery ok", "gallery", map[string]any{"photos": photos(12)}, 12, ""},
		{"gallery over template cap", "gallery", map[string]any{"photos": photos(7)}, 6, "content.photos"},
		{"gallery over schema cap", "gallery", map[string]any{"photos": photos(13)}, 0, "content.photos"},
		{"gallery alt ≤ 80", "gallery", map[string]any{"photos": []any{map[string]any{"id": uuid, "alt": long(81)}}}, 0, "content.photos[0].alt"},
		{"gallery photo needs id", "gallery", map[string]any{"photos": []any{map[string]any{"alt": "x"}}}, 0, "content.photos[0].id"},
		{"gift body ≤ 300", "gift", map[string]any{"body": long(301)}, 0, "content.body"},
		{"rsvp body ≤ 200", "rsvp", map[string]any{"body": long(201)}, 0, "content.body"},
		{"music known track", "music", map[string]any{"track": "satie-gymnopedie-1"}, 0, ""},
		{"music cleared", "music", map[string]any{"track": ""}, 0, ""},
		{"music unknown track", "music", map[string]any{"track": "nope"}, 0, "content.track"},
		{"schedule dress ≤ 60", "schedule", map[string]any{"dress_code": long(61)}, 0, "content.dress_code"},
		{"unknown key kept", "closing", map[string]any{"future": "small"}, 0, ""},
		{"unknown key capped", "closing", map[string]any{"future": long(3000)}, 0, "content.future"},
		{"whole section capped", "closing", map[string]any{"a": long(2000), "b": long(2000), "c": long(2000), "d": long(2000), "e": long(2000), "f": long(2000), "g": long(2000), "h": long(2000), "i": long(2000), "j": long(2000), "k": long(2000), "l": long(2000), "m": long(2000), "n": long(2000), "o": long(2000), "p": long(2000), "q": long(2000)}, 0, "content"},
		{"type outside the shared model", "map", map[string]any{"anything": "goes"}, 0, ""},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := k.Check(tc.typ, tc.content, tc.galleryMax)
			if tc.want == "" {
				if len(got) != 0 {
					t.Fatalf("want accepted, got %v", got)
				}
				return
			}
			if got[tc.want] == "" {
				t.Fatalf("want a %q error, got %v", tc.want, got)
			}
		})
	}
}

func TestThemeChecker(t *testing.T) {
	c, ps := Load(repoCatalog)
	if len(ps) > 0 {
		t.Fatal(ps)
	}
	raw, _ := os.ReadFile(filepath.Join(repoCatalog, "templates/gilded-seal/manifest.json"))
	k := c.ThemeChecker()
	th := func(p, f, m string, tok map[string]string) invitation.Theme {
		return invitation.Theme{Palette: p, FontPairing: f, Motion: m, Tokens: tok}
	}
	bad := []struct {
		name  string
		theme invitation.Theme
		field string
	}{
		{"palette outside the template's list", th("midnight-gold", "", "", nil), "theme.palette"},
		{"unknown palette", th("nope", "", "", nil), "theme.palette"},
		{"pairing not listed", th("", "nope", "", nil), "theme.fontPairing"},
		{"motion not listed", th("", "", "off", nil), "theme.motion"},
		{"role not customizable", th("", "", "", map[string]string{"bg": "#000000"}), "theme.tokens.bg"},
		{"not a hex colour", th("", "", "", map[string]string{"accent": "url(x)"}), "theme.tokens.accent"},
		{"named colour", th("", "", "", map[string]string{"accent": "red"}), "theme.tokens.accent"},
		{"accent too light for the dark text on it", th("", "", "", map[string]string{"accent": "#222222"}), "theme.tokens"},
	}
	for _, tc := range bad {
		t.Run(tc.name, func(t *testing.T) {
			_, f := k.Check(raw, tc.theme)
			if f[tc.field] == "" {
				t.Fatalf("want a %q error, got %v", tc.field, f)
			}
		})
	}

	t.Run("a legacy label is stored as its id", func(t *testing.T) {
		got, f := k.Check(raw, th("Blush", "classic-serif", "calm", map[string]string{"accent": "#C9A27A"}))
		if len(f) > 0 {
			t.Fatal(f)
		}
		if got.Palette != "rose-linen" || got.FontPairing != "classic-serif" || got.Motion != "calm" || got.Tokens["accent"] != "#C9A27A" {
			t.Fatalf("stored form = %+v", got)
		}
	})
	t.Run("an empty theme is fine and a design without a manifest cannot be customised", func(t *testing.T) {
		if got, f := k.Check(raw, invitation.Theme{}); f != nil || !got.IsZero() {
			t.Fatalf("%v %v", got, f)
		}
		if _, f := k.Check([]byte("{}"), th("rose-linen", "", "", nil)); f["theme"] == "" {
			t.Fatalf("unsynced row: %v", f)
		}
	})
	t.Run("too big", func(t *testing.T) {
		_, f := k.Check(raw, th(strings.Repeat("a", 3000), "", "", nil))
		if f["theme"] == "" {
			t.Fatalf("a 2 KB cap must apply: %v", f)
		}
	})
}
