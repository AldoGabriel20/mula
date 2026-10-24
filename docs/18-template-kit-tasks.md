# 18 — Template Kit: task plan (agent-executable)

Execution plan for `17-template-kit-design.md`. Each task is one agent run: small, independently
verifiable, explicit dependencies, files and acceptance. IDs are stable (`TK-0xx`).
Legend: **D** dependencies, **F** files, **A** acceptance, **S** size (S ≤ half a day, M ≈ 1 day, L ≈ 2 days).

---

## 0. Rules for every agent run

1. Read the sections of `17-template-kit-design.md` named in the task **before** editing.
2. **Behaviour-neutral unless the task says otherwise.** Gilded Seal must look and behave exactly
   as before: unit (141), e2e `gilded-seal` (33 × 3 projects) and, for font/token tasks, the parity
   spec (`GS_PARITY=1`) stay green.
3. Never touch `docs/*-prototype/`. Admin (`web/components/admin/**`) and landing
   (`web/components/landing/**`) changes are additive, except where a task says "replace".
4. Match surrounding code: Go layering `domain → application → infrastructure/postgres →
   transport/http`; web inline-style ports; sparse, factual comments.
5. No new runtime dependency unless the task names it. No `dangerouslySetInnerHTML`.
6. Gates for lanes touched:
   - API: `make test` (needs `make db`), `cd api && go vet ./...`
   - Web: `cd web && npm run typecheck && npm run lint && npm test`
   - E2E: `cd web && E2E_WEB_URL=http://localhost:<port> npx playwright test <spec>` (never point
     it at another project's server; `E2E_FULL_STACK=1` plus the API env for live specs)
7. One commit per task: `feat(kit): TK-0xx <title>` (or `refactor`/`test`/`docs`/`chore`).
8. If a step is impossible as written, stop and report the mismatch with `file:line` evidence.

### Definition of done (all tasks)

Acceptance met and shown (test names or command output), gates green for touched lanes, no new
console errors, reduced-motion and keyboard paths intact for any UI touched, docs updated when a
contract changed (`docs/08`, `docs/09`, `api/openapi.yaml`, `docs/17`).

---

## 1. Lanes and dependency graph

```
Lane A  Foundation       TK-001 → 002 → 003 → 004 → 005 → 006
Lane B  Catalog libs     TK-010 palettes   TK-011 fonts   TK-012 music        (after 001)
Lane C  Runtime kit      TK-020 KitRoot/tokens (after 003,010,011)
                         TK-021 audit  → TK-022 motion move → TK-023 gl move
                         TK-024 model split   TK-025..029 behaviours
Lane D  Backend          TK-030 migration → 031 manifest-driven sections → 032 theme API
                         → 033 section validation → 034 catalog endpoints
Lane E  Admin + landing  TK-040 catalog picker → 041 theme panel → 042 thumbnails
                         TK-043 landing catalog   TK-044 generic editor → 045 delete GsEditor
Lane F  Gilded Seal      TK-050 manifest + registry → 051 fonts → 052 tokens → (022..029)
Lane G  Quality          TK-060 contract suite   TK-061 docs + how-to
Lane H  Themed tier      TK-070 blocks → 071 BlockRenderer → 072 layouts for catalog rows
Lane I  Host-made        TK-080 … TK-084   (only when product confirms, §18.3 of docs/17)
```

Phase 1 (core) = Lane A, B, D, E (040–043), F (050), G (061) and TK-020.
Phase 2 (extract) = TK-021…029, 044, 045, 051, 052, 060.
Phase 3 = Lane H. Phase 4 = Lane I.

---

## 2. Lane A: Foundation (manifest, sync, codegen)

### TK-001 — `catalog/` skeleton and manifest JSON Schema
D: none · S: M · Design: §4, §5
F: `catalog/manifest.schema.json`, `catalog/templates/gilded-seal/manifest.json`
Steps:
1. Create the JSON Schema for manifest v1 (§5.2 shape; `additionalProperties: false` everywhere;
   `kind`, `status`, `access` enums; `slug` pattern; `sections[].type` enum of the 10 current types).
2. Write `gilded-seal/manifest.json` mirroring today's behaviour exactly: sections from
   `TemplateSections["gilded-seal"]`, `hiddenUntilFilled` on `gallery`/`music`, `required: hero, rsvp`,
   tokens from docs/15 §8.15, `capabilities` as §5.2, `customizable` empty for now.
A: A schema test (Go, TK-002) validates the manifest; a deliberately broken copy fails with a path.

### TK-002 — Go `cmd/templates validate`
D: TK-001 · S: M · Design: §5.3, §9.2
F: `api/cmd/templates/main.go`, `api/internal/catalog/` (loader, validator), tests
Steps:
1. Loader reads `catalog/**` (path from flag, default `../catalog`).
2. Validate against the schema (use a vetted Go JSON Schema library already acceptable to the repo,
   or hand-rolled checks if none is vendored; justify in the commit) plus cross-reference rules of
   §5.3 (palette/pairing/track ids, kind↔layout, required sections present, contrast of default
   token pairs).
3. Exit non-zero with one line per problem: `file: json.path: message`.
A: Table-driven tests cover each rule in §5.3 (valid + invalid case). `go run ./cmd/templates validate` passes on the repo.

### TK-003 — Go `cmd/templates sync` (needs TK-030)
D: TK-002, TK-030 · S: M · Design: §9.2, §5.5
F: `api/cmd/templates/sync.go`, `api/internal/catalog/sync.go`, tests (use `TEST_DATABASE_URL`)
Steps:
1. Upsert platform rows by `slug`: `name, category, tags, palette, position, kind, status, access,
   version, manifest`.
2. Refuse breaking changes (§5.5): removed section type, removed token role, changed `slug`/`kind`.
   Additive changes bump `version`.
3. A slug present in DB but absent from the repo → `status = 'retired'`, never delete.
4. Idempotent: a second run changes nothing (`updated_at` untouched when the manifest is identical).
A: Tests: first run inserts; second run is a no-op; breaking change refused; removed manifest retires the row; existing `gilded-seal` row keeps its `id`.

### TK-004 — `gen-web`: generated types and registry
D: TK-002 · S: M · Design: §3.2, §8
F: `api/cmd/templates/genweb.go`, `web/lib/kit/generated/{manifests.ts,registry.ts,palettes.ts,fonts.ts,music.ts}`
Steps:
1. Emit TS types for `Manifest` from the schema (hand-written template in Go; no new npm dependency).
2. Emit `registry.ts`: server-safe `TEMPLATE_SLUGS`, `hasLiveTemplate`, and a **separate client file**
   `registry.client.ts` with `slug → dynamic(() => import("@/components/templates/<slug>/…"), { ssr:false, loading })`.
   The renderer path comes from the manifest (`renderer` field, add it to the schema, required for `coded`).
3. Header comment `// generated by cmd/templates gen-web; do not edit`.
A: Output is deterministic (running twice gives zero diff). `web` typechecks. `registry.ts` contains no component imports.

### TK-005 — Wire `registry.ts` / `TemplateHost` to the generated files
D: TK-004 · S: S · Design: §8
F: `web/components/templates/registry.ts`, `TemplateHost.tsx`, tests referencing `LIVE_SLUGS`
Steps: re-export from generated files; delete the hand-written `LIVE_SLUGS` and `TEMPLATES` map; keep the public names (`hasLiveTemplate`, `TemplateHost`).
A: Unit + e2e gilded-seal green; `rg "LIVE_SLUGS"` returns nothing outside generated code.

### TK-006 — `make templates` + CI freshness check
D: TK-002, TK-003, TK-004 · S: S
F: `Makefile`, `.github/workflows/ci.yml`
Steps: `make templates` = validate → sync (skipped with `SKIP_SYNC=1`) → gen-web. CI runs validate + gen-web then `git diff --exit-code web/lib/kit/generated catalog`.
A: A stale generated file makes CI fail; documented in `README`/`docs/17 §17`.

---

## 3. Lane B: Catalog libraries

### TK-010 — Palettes
D: TK-001 · S: M · Design: §7.1, §6
F: `catalog/palettes.json`, schema fragment, `web/lib/kit/generated/palettes.ts`, unit test
Steps:
1. Define ≥ 6 palettes. Include the 5 legacy labels as `aliases` (`Ivory, Stone, Blush, Forest, Midnight`) so stored values stay valid.
2. Each palette: `id, name, swatch[3], color{partial roles}, aliases[]`.
3. Unit test: every palette merged over the Gilded Seal defaults gives `ink/bg` and `onAccent/accent` ≥ 4.5:1.
A: Test passes; alias lookup resolves every legacy value; adding a palette needs no code change.

### TK-011 — Font catalog and files
D: TK-001 · S: M · Design: §7.2
F: `catalog/fonts.json`, `web/public/fonts/<family>/*.woff2` (moved from `components/landing/fonts`), `web/lib/kit/fonts.tsx`
Steps:
1. Move landing's woff2 files (Cormorant, Manrope, Pinyon, Bodoni, Italiana, Unbounded) to `public/fonts/`; update landing's `next/font/local` paths. **Same bytes** (verify with `sha256sum` before/after).
2. `fonts.json`: families (name, licence, fallback, files) and pairings. Licence is mandatory; validator rejects missing.
3. `<KitFonts pairing>`: emits `@font-face` for the pairing's families only, `font-display: swap`, a size-adjusted fallback, and `<link rel="preload" as="font" type="font/woff2" crossorigin>` for the first file of each.
A: Landing renders identically (visual spot check + its tests); unit test snapshots `<KitFonts>` output for one pairing; no request for a family outside the pairing (Playwright network assertion).

### TK-012 — Music catalog
D: TK-001 · S: S · Design: §7.4
F: `catalog/music.json`, `web/lib/kit/generated/music.ts`, `web/components/templates/gilded-seal/music.ts` (becomes a thin re-export until TK-029)
Steps: move the one track entry (+ `license`, `durationMs` fields, `license` mandatory). Do **not** invent audio files.
A: `trackByKey` behaviour unchanged; validator fails on a track without licence.

---

## 4. Lane C: Runtime kit

### TK-020 — `KitRoot`, tokens, theme resolution
D: TK-003 (types), TK-010, TK-011 · S: L · Design: §6, §8
F: `web/lib/kit/{tokens.ts,KitRoot.tsx,useTheme.ts}`, tests
Steps:
1. `resolveTheme(manifest, palettes, theme)` implementing the order of §6.3, returning `{ vars, colors, fonts, motion }`. Pure and unit-tested (precedence, alias lookup, hex validation, ignoring non-customizable roles).
2. `KitRoot` applies `vars` as inline CSS variables on its root element only, renders `<KitFonts>`, provides `useTheme()`, owns mount/unmount cleanup hooks for engine, GL and audio (register/unregister API).
3. `TemplateHost` wraps every renderer in `KitRoot`; loading wash colour comes from `manifest.tokens.color.bg`.
A: With default tokens the Gilded Seal DOM is unchanged except for the wrapper; unit tests for `resolveTheme`; a test proves `:root` is never mutated.

### TK-021 — Audit the engine for prototype-specific code
D: none · S: S · Design: §1.2, §7.3
F: `docs/17-template-kit-design.md` §7.3 table (update), no code
Steps: read `engine/{engine,reveals,stack}.ts`; list every constant or selector tied to Gilded Seal (ids like `#hero`, section names, fixed px). Decide per file: move as is / move with parameters / stay.
A: Decision table committed in the doc; no code change.

### TK-022 — Move motion primitives to `lib/kit/motion`
D: TK-021 · S: M
F: `web/lib/kit/motion/*`, imports in `gilded-seal/**`, `web/tests/gilded-seal-engine.test.ts` (rename/move)
Steps: `git mv` the files marked "move" by TK-021; add `motion/policy.ts` with `useMotionPolicy()` (design §7.3 table) and replace the scattered reduced-motion checks in Gilded Seal sections with it (same results).
A: Unit + e2e gilded-seal green, reduced-motion spec green; `rg "gilded-seal/engine"` shows only `stack.ts` consumers.

### TK-023 — Move GL layer and detection
D: TK-022 · S: S
F: `web/lib/kit/gl/{layer,detect}.ts`, imports, `gilded-seal-gl.test.ts`
A: Unit + e2e green; `three` still loaded only on the GPU path (bundle check as in docs/15 §13.4).

### TK-024 — Split `mapInvite` into model + template defaults
D: TK-022 · S: L · Design: §7.8
F: `web/lib/kit/model/*`, `gilded-seal/config.ts`, `derive.ts`, `web/tests/gilded-seal-derive.test.ts`
Steps: move time-zone date formatting, heading-override rule, guest/`?to`, RSVP state, gift methods, media map to `buildInviteModel`; `mapInvite` = `buildInviteModel` + Gilded Seal copy/placeholders (including the preview/demo placeholders).
A: All 141 unit tests pass unchanged in meaning (imports may move); new tests for the model run without any Gilded Seal import.

### TK-025 — `useRsvp`
### TK-026 — `useWishes`
### TK-027 — `useMusic` (+ `MusicButton` consumes it)
### TK-028 — `useLightbox`
### TK-029 — `useCountdown` + `useGuest`
D: TK-024 (and TK-012 for 027) · S: M each · Design: §7.7
F: `web/lib/kit/behaviors/<hook>.ts`, the matching `gilded-seal/sections/*.tsx`, hook tests
Steps per task: move state/network/mode logic out of the section into the hook; the section keeps markup and motion only. `preview` and `demo` never send a request (assert in the hook test with a mocked fetch).
A: Section renders identically (existing section tests and e2e green); hook has its own unit tests including `live` vs `preview` vs `demo`.

---

## 5. Lane D: Backend

### TK-030 — Migration `0016_template_kit`
D: none · S: S · Design: §9.1
F: `api/migrations/0016_template_kit.{up,down}.sql`, `docs/09-database-design.md`
Steps: the SQL of §9.1 (`templates` columns, `invitations.theme`). Down drops them.
A: Up/down/up works on a scratch DB; existing rows get defaults; `make test` green.

### TK-031 — Manifest-driven section set and required sections
D: TK-003, TK-030 · S: M · Design: §10.2
F: `api/internal/application/invitation/invitation.go`, `ports.go`, repo, tests, `docs/08`
Steps:
1. Repo returns the template's `sections` from `templates.manifest`.
2. Delete `TemplateSections` and `hiddenUntilFilled`; `ensureTemplateSections` reads the manifest. Keep the rules (never remove, reorder only when something was added, hidden until filled).
3. `MissingRequired` uses the manifest's `required` (fallback `hero`, `rsvp`).
A: Existing `template_sections_test.go` passes with the manifest loaded from a fixture; picking `gilded-seal` yields the same sections as today.

### TK-032 — Theme in the invitation API and projection
D: TK-030, TK-010 · S: M · Design: §6.4, §10.2, §10.4
F: `domain/invitation`, `application/invitation`, `infrastructure/postgres/invitation_repo.go`, `transport/http` (dto, handlers), `api/openapi.yaml`, `docs/08`, `web/lib/api/invite.ts`, regenerated `generated.ts`
Steps: validation of §10.2 (palette id/alias, pairing, motion, tokens subset, hex, contrast, ≤ 2 KB); persist; expose `theme` + `template_version` in the public projection.
A: Table tests per rejection (400 with field path); authz matrix test updated (`theme` is editable only by editors, readable by guests only via the projection).

### TK-033 — Section content validation
D: TK-031 · S: L · Design: §10.3
F: `api/internal/domain/invitation/content.go` (or schema-driven validator), tests, `docs/08`
Steps: per-type validation (lengths, array caps, `photo_id` belongs to event, `track` ∈ catalog, gallery cap from `capabilities.gallery.max`). Unknown keys kept but size-capped; `sanitize` stays.
A: Invalid shapes → 400 with path; every content fixture used by the seed and e2e still passes; no regression in the editor flows.

### TK-034 — Catalog endpoints
D: TK-003, TK-030 · S: S · Design: §10.1
F: `transport/http/invitation_handlers.go` (`Templates`), new `Template(slug)` handler, router, openapi, `docs/08`
A: `GET /templates` adds `kind, status, access, version, thumbnail, customizable, capabilities, marketing`; excludes `retired`; `GET /templates/{slug}` returns the manifest; both public, cacheable.

---

## 6. Lane E: Admin and landing

### TK-040 — Admin design picker reads the catalog
D: TK-034, TK-010 · S: M · Design: §11.1
F: `web/components/admin/logic.ts` (`dl`, `pals`), `mappers.ts` (`PROTO_TO_PALETTE`), `patch.ts`
Steps: build the design list from `D.templatesRaw` (by slug); swatches from the palette catalog; save writes the palette **id**. Keep the existing look.
A: Picker shows the same cards for the same data; picking a template/palette persists and survives reload; legacy palette labels still display correctly; no name-matching left (`rg "x\[0\] === S.design"` style lookups gone).

### TK-041 — Theme panel
D: TK-032, TK-040, TK-020 · S: L · Design: §11.3
F: `web/components/admin/views/ThemePanel.tsx` (new), `Design` page wiring, e2e
Steps: render only controls listed in `manifest.customizable`; palette swatches, pairing select, accent colour input with live contrast message, motion toggle; write `theme` via the invitation PATCH; preview refreshes.
A: e2e: change palette + accent → `/preview/{id}` shows new CSS variables; invalid contrast shows the message and does not save; template with empty `customizable` shows no panel.

### TK-042 — Thumbnail generator
D: TK-005 · S: M · Design: §7.5
F: `web/scripts/template-thumbs.ts`, `package.json` script `templates:thumbs`, `catalog/templates/*/thumb.webp`
Steps: Playwright (reduced motion, fixed viewport 1280×800 and 390×844) opens `/demo/<slug>`, waits for the veil, captures the hero, writes `thumb.webp` (≤ 60 KB each). `thumbnail` path comes from the manifest.
A: Deterministic enough to commit (documented tolerance); admin and landing cards use it (TK-043).

### TK-043 — Landing reads the catalog
D: TK-034, TK-042 · S: M · Design: §12
F: `web/components/landing/data.ts` (`TEMPLATES` becomes generated/merged), `TemplatePage.tsx`, `/templates` pages
Steps: for slugs that exist as manifests use `marketing` + thumbnail; entries without a manifest keep the phone mock until product decides (§18.3.1). `live` derived.
A: `/templates` and `/templates/gilded-seal` show the real thumbnail/demo; no hand-set `live` flags remain; landing tests green.

### TK-044 — Generic section editor driven by schema
D: TK-033, TK-031 · S: L · Design: §11.2
F: `web/components/admin/views/SectionForm.tsx` (new), `InvitationEditor.tsx`
Steps: render a form per section type from its schema fragment and manifest limits (text, textarea with counter, array of items, media picker, track select); reuse the editor's classes.
A: Editing every Gilded Seal section through the generic form produces the same stored content as `GsEditor` does today (compare JSON in an e2e).

### TK-045 — Remove `GsEditor` and `isGs`
D: TK-044 · S: S
F: `GsEditor.tsx`, `patch.ts`
A: `rg "isGs|GsEditor"` is empty; admin e2e green; bespoke photo tiles preserved by the generic media picker.

---

## 7. Lane F: Gilded Seal on the kit

### TK-050 — Manifest-driven registration
D: TK-005 · S: S
F: `catalog/templates/gilded-seal/manifest.json` (`renderer`), generated registry
A: Covered by TK-005 acceptance; Gilded Seal opens at `/demo/gilded-seal` and a live link.

### TK-051 — Fonts through `KitFonts` (with parity run)
D: TK-011, TK-020 · S: M · Design: §15 step 3
F: `gilded-seal/fonts.ts` (deleted), `GildedSeal.tsx`, canvas font names (`FONT` object) from `useTheme().fonts`
A: `GS_PARITY=1` parity spec: no new diffs vs docs/15 §13.5; CLS ≤ 0.01; canvas cover text still rendered with the real families.

### TK-052 — Token adoption for the §6.5 roles
D: TK-020, TK-051 · S: L · Design: §6.5, §15 step 4
F: `gilded-seal/**` (CSS and inline literals for page bg, ink family, gold accent, paper, danger), `manifest.json` `tokens.extra`
Steps: replace literals for the bounded set only; defaults equal to today's values; GL colours read `useTheme().colors` at scene build.
A: No overrides → parity pixel-neutral; with `theme` override (accent only) the gold elements change and contrast holds; unit tests for the engine untouched.

---

## 8. Lane G: Quality and docs

### TK-060 — Template contract suite
D: TK-005, TK-020 · S: L · Design: §16
F: `web/tests/e2e/template-contract.spec.ts`, `web/tests/template-manifest.test.ts`, `playwright.config.ts`
Steps: iterate every manifest at test time; run the §16 checks (console errors, no writes in preview/demo, reduced motion, keyboard, 44 px, axe, no horizontal scroll, theme override renders). Reuse helpers from `gilded-seal*.spec.ts`; keep the Gilded Seal-specific specs for bespoke interaction only.
A: Suite passes for Gilded Seal on desktop/tablet/mobile; adding a trivial valid manifest and renderer makes it run for the new slug with no test edits.

### TK-061 — Docs and "add a template" guide
D: TK-006 · S: S
F: `docs/17-template-kit-design.md` (status → accepted, §17 verified by actually following it once with a throwaway template), `README.md` section, `docs/11-frontend-architecture.md` pointer
A: A fresh checkout follows §17 and gets a working second template from a copy of the Gilded Seal manifest and a stub renderer in under an hour (record the time in the PR).

---

## 9. Lane H: Themed tier (phase 3)

### TK-070 — Block library
D: TK-024, TK-025..029 · S: L · Design: §7.6
F: `web/lib/kit/blocks/*` (one component per section type and variant), `catalog/sections.schema.json`
A: Each block renders from the section schema and tokens; unit + a11y tests per block; storybook-style demo route `/demo/_blocks` (dev only).

### TK-071 — `BlockRenderer` and the Tier 2 path
D: TK-070, TK-020 · S: M · Design: §3.1, §8
F: `web/lib/kit/blocks/BlockRenderer.tsx`, `TemplateHost.tsx`, registry generator (themed manifests map to `BlockRenderer`)
A: A themed manifest renders in `demo`, `preview`, `live`; contract suite passes for it.

### TK-072 — Layouts for the catalog rows
D: TK-071, product decision §18.3.1 · S: L
F: `catalog/templates/<slug>/manifest.json` for each chosen row (`linen-vow`, `golden-hour`, … ), thumbnails
A: Each chosen row shows its own look through `/preview` and a live link; `InvitationView` is only the fallback.

---

## 10. Lane I: Host-made templates (phase 4, gated by product)

Do not start before the decisions of `docs/17 §18.3.4` are made.

| ID | Title | D | Summary |
|---|---|---|---|
| TK-080 | Fork API | TK-030, TK-071 | `POST /templates/{id}/fork`, `PATCH /templates/{id}` (layout only), owner scoping, per-user cap, layout validation against the block registry |
| TK-081 | Authz and projection | TK-080 | owner-only list/read; public projection returns the resolved layout of the invitation's own template; authz matrix tests |
| TK-082 | Block editor | TK-080 | drag reorder, variant select, hide/show, live preview iframe; keyboard-operable reordering |
| TK-083 | Entitlement | TK-080 + product | tie to the "Premium themes" add-on if decided |
| TK-084 | Abuse limits | TK-080 | rate limit, size caps, audit log of layout changes |

---

## 11. Suggested first sprint (phase 1)

TK-001 → 002 → 030 → 003 → 004 → 005 → 006, then in parallel TK-010, 011, 012, 034, 031, then
TK-020, 032, 040, 042, 043, 050, 061. Gate at the end of the sprint: the whole contract of
`docs/17 §17` works with Gilded Seal as the only template, the admin and landing read the catalog,
and nothing the guests see has changed.

---

## 12. Status

Phases 1 and 2 are built. Phase 3 (Lane H) and phase 4 (Lane I) are not: they wait for the product decisions of `docs/17 §18.3`.
Gates: Go (`make test`, `go vet`, `gofmt`), web (`typecheck`, `lint`, `npm test`), e2e (`gilded-seal`, `gilded-seal-a11y`, `template-contract`, `section-form`, `theme`, the dashboard specs).

| Task | State | Note |
|---|---|---|
| TK-001 manifest schema + gilded-seal manifest | done | `catalog/manifest.schema.json`; GS `onAccent` is `#271F19` (the §8.15 `#FCF9F3` is 3.26:1 on the gold; the dark ink is 4.73:1) |
| TK-002 `cmd/templates validate` | done | hand-rolled JSON Schema subset (`internal/catalog/schema.go`): go.mod has no schema library |
| TK-003 `sync` | done | deviation: a row that **never had a manifest** (the eight 0014 rows) is not retired when absent from the repo; it waits for its phase-3 layout |
| TK-004 `gen-web` | done | adds `sections.ts` (content schemas for the admin form) |
| TK-005 registry/TemplateHost on generated files | done | `LIVE_SLUGS` replaced by `TEMPLATE_SLUGS`; `Waiting.tsx` reads the manifest |
| TK-006 `make templates` + CI | done | `make migrate` and `make test` also sync; CI fails on stale generated files |
| TK-010 palettes, TK-011 fonts, TK-012 music | done | fonts moved with identical sha256; landing paths updated |
| TK-020 `KitRoot`, tokens, `useTheme` | done | |
| TK-021…023 audit, motion + GL move | done | §7.3.1; the policy's `durationScale` and `parallaxScale` are read by reveals and parallax |
| TK-024 model split | done | `lib/kit/model` has its own tests and imports no template |
| TK-025…029 behaviour hooks | done | `useRsvp`, `useWishes`, `useMusic`, `useLightbox`, `useCountdown`, `useGuest` |
| TK-030 migration 0016 | done | `owner_id` has no FK to users until phase 4 (a FK would make the tests' `TRUNCATE users CASCADE` wipe the catalog) |
| TK-031 manifest-driven sections + required | done | Go maps deleted |
| TK-032 theme in the API and the projection | done | validation per docs/17 §10.2 (`theme.<path>` field errors); a design switch drops the theme; guests get `theme` (sanitised) and `template_version`; `docs/08`, `openapi.yaml`, regenerated `generated.ts` |
| TK-033 section content validation | done | schema + own-media + track + gallery cap |
| TK-034 catalog endpoints | done | `GET /templates` (+ manifest facts, `thumbnail`, `thumbnail_mobile`), `GET /templates/{slug}`; retired and owned rows are not listed |
| TK-040 admin picker reads the catalog | done | cards by slug; swatches from `catalog/palettes.json` (the prototype's six palette slots are the catalog's first six); saving writes the palette id; `paletteOf` understands ids and legacy labels |
| TK-041 theme panel | done | `ThemePanel.tsx`; the Gilded Seal manifest now lists five light palettes, the accent colour and Full/Calm motion (the dark palette stays out: the template's literal paper gradients would clash); one font pairing is no choice, so no select |
| TK-042 thumbnail generator | done | `npm run templates:thumbs` (Node 22.18+); two `webp` per template under 10 KB |
| TK-043 landing reads the catalog | done | marketing copy, category, palette label, thumbnails and `live` come from the manifest; `TemplateShot` shows the real thumbnail, the phone mock stays for designs without a manifest |
| TK-044, TK-045 generic section form, `GsEditor`/`isGs` removed | done | `SectionForm.tsx` |
| TK-050 manifest-driven registration | done | with TK-005 |
| TK-051 fonts through `KitFonts` | done | no `next/font` in the template; canvas reads `useTheme().fonts` |
| TK-052 token adoption | done, bounded | 13 role colours in markup and module CSS, contour-line colours of the shaders; **not** themed: the 3D cover's canvas textures, the shader backdrops (`uBase`, `uGlow`), page chrome in `gilded-seal.global.css` |
| TK-060 contract suite | done | `template-contract.spec.ts` (demo mode; preview mode needs a session and is covered by `gilded-seal.spec.ts` and `theme.spec.ts`) + `template-manifest.test.ts` |
| TK-061 docs and "add a template" guide | done | `docs/17 §17`, verified with a throwaway template; README |
| **Not built** | | phase 3 (TK-070…072) and phase 4 (TK-080…084) |
