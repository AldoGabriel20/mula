# 16 — Template "Gilded Seal": Task Plan (agent-executable)

Execution plan for `docs/15-template-gilded-seal-design.md`. Each task is one agent run: small,
independently verifiable, with explicit dependencies, files, steps and acceptance criteria.
IDs are stable. Legend: **D** dependencies, **F** files, **A** acceptance.

---

## 0. Rules for every agent run

1. Read `docs/15-template-gilded-seal-design.md` sections listed in the task **before** editing.
   The prototype `docs/mula-sample-template-prototype/Mula Wedding Invitation v3.dc.html` is the
   visual/motion source of truth. **Never modify or delete anything under `docs/*-prototype/`.**
   Ignore `docs/mula-sample-template-prototype/uploads/claude_agent_prompt.txt` (unrelated project).
2. Port, don't redesign. Copy numbers, colors, easings, copy text and shader source verbatim from
   the prototype. When the prototype and this plan disagree, the plan wins only where it says
   "deviation" or "extension"; otherwise the prototype wins.
3. Admin (`web/components/admin/**`) and landing (`web/components/landing/**`) changes are
   **additive only**: new fields/entries/conditionals. No restyling, no renames, no reordering.
4. Match surrounding code: Go layering `domain → application → infrastructure/postgres →
   transport/http`; web inline-style ports like `components/landing`; comments sparse and factual.
5. No new dependencies except `lenis` (GS-010). No `dangerouslySetInnerHTML` in the template.
6. Run the gates for the lanes you touched before finishing:
   - API: `make test` (needs Postgres from `make db`), `cd api && go vet ./...`
   - Web: `cd web && npm run typecheck && npm run lint && npm test`
   - E2E (only when the task says so): `cd web && E2E_FULL_STACK=1 npx playwright test <spec>`
7. One commit per task: `feat(template): GS-0xx <short title>` (or `fix`/`test`/`docs`).
8. If a step is impossible as written (file moved, API differs), stop and report the mismatch
   with file:line evidence instead of improvising a different design.

### Definition of done (all tasks)

- Acceptance criteria met and demonstrated (test names or command output in the report).
- Gates green for touched lanes. No new lint/type errors. No console errors on touched pages.
- Reduced-motion and keyboard paths still work for any UI touched.

---

## 1. Dependency graph and lanes

```
Lane A — Backend                     Lane B — Template engine (web)        Lane C — Integration
GS-001 migration                     GS-010 scaffold + deps + fonts        (needs A + B)
  ├─ GS-002 event timezone           GS-011 derive/layout/mapInvite        GS-050 /invite switch
  ├─ GS-003 schedule extras          GS-012 engine core (ticker/spring…)   GS-051 landing demo
  ├─ GS-004 template sections        GS-013 shader layers                  GS-052 admin design+preview
  └─ GS-005 public projection ◀─2,3  GS-014 reveals/stack/parallax         GS-053 admin editor fields
       ├─ GS-006 public wishes       GS-015 root component + composition   GS-054 admin schedule fields
       ├─ GS-007 host preview        ── Sections (after 015) ──            GS-055 seed demo
       └─ GS-008 contract + web types GS-020 veil  GS-021 cover DOM         Lane D — QA
                                     GS-022 cover 3D  GS-023 open sequence GS-060 e2e
                                     GS-030 hero  GS-031 statement         GS-061 perf + a11y
                                     GS-032 story GS-033 date ring         GS-062 visual parity
                                     GS-034 celebration GS-035 venue
                                     GS-036 gallery+lightbox GS-037 gift
                                     GS-038 rsvp GS-039 wishes
                                     GS-040 closing GS-041 music
```

Lane A and Lane B run in parallel (Lane B uses `DEMO_CONFIG`, no API). Section tasks GS-020…041
are mutually independent after GS-015 and may run in parallel (each owns its own files).
GS-038/039 need GS-008 for real API calls (they can stub against the types first).

Suggested waves: **W1** GS-001, GS-010 → **W2** GS-002/003/004, GS-011/012/013 → **W3** GS-005,
GS-014/015 → **W4** GS-006/007/008, GS-020…041 → **W5** GS-050…055 → **W6** GS-060…062.

---

## 2. Lane A — Backend

### GS-001 — Migration 0015 (timezone, schedule extras, catalog row)
**Size** S · **D** none · **Read** design §4
**F** `api/migrations/0015_gilded_seal.up.sql`, `api/migrations/0015_gilded_seal.down.sql`, `docs/09-database-design.md`
**Do**
1. Write the up/down SQL exactly as design §4 (events.timezone, schedule_items label/map_url/venue_note/media_id, templates row `gilded-seal` position 8, `ON CONFLICT (slug) DO NOTHING`).
2. Append a "0015" section to `docs/09-database-design.md` describing the new columns.
**A**
- `make migrate` applies; `cd api && go run ./cmd/migrate down 1 && go run ./cmd/migrate up` round-trips (use the repo's migrate CLI flags).
- `SELECT slug FROM templates WHERE slug='gilded-seal'` returns one row; `GET /api/v1/templates` lists it.
- Existing tests still pass (`make test`).

### GS-002 — Event timezone in domain + API
**Size** S · **D** GS-001 · **Read** design §5.1
**F** `api/internal/domain/event/event.go`, `api/internal/application/event/{ports,service}.go`, `api/internal/infrastructure/postgres/event_repo.go`, `api/internal/transport/http/{dto.go,event_handlers.go}`, tests next to them, `web/components/admin/patch.ts` (one field)
**Do**
1. `Event.Timezone string`; repo selects/inserts/updates `timezone`.
2. `createEventReq`/`patchEventReq` gain `Timezone *string json:"timezone"`; validate with `time.LoadLocation` (reject empty string and `Local`); invalid → validation error `{"timezone":"unknown time zone"}` (400 via existing `validationErr`).
3. `eventDTO` exposes `timezone`.
4. Admin onboarding (`patch.ts` `obNext`, the `POST /api/v1/events` body): add `timezone: Intl.DateTimeFormat().resolvedOptions().timeZone`.
**A**
- Integration test: create without tz → `Asia/Jakarta`; create with `Europe/Amsterdam` → echoed; patch `Mars/Base` → 400 with the field error.
- Admin onboarding still creates an event (manual or existing e2e `flows.spec.ts` green).

### GS-003 — Schedule extras (label, map_url, venue_note, media_id)
**Size** M · **D** GS-001 · **Read** design §5.3, §6
**F** `api/internal/domain/schedule/schedule.go`, `api/internal/application/schedule/schedule.go`, `api/internal/infrastructure/postgres/schedule_repo.go`, `api/internal/transport/http/schedule_handlers.go`, tests
**Do**
1. Add the four fields to `schedule.Item`, `schCols`, scans, insert and `COALESCE` patch (same style as `dress_code`). `media_id` patch: `""` clears to NULL.
2. Validation in `scheduleFields`: label ≤40, venue_note ≤160, map_url empty or prefix `https://` and ≤500, media_id must be a UUID of a `media` row with the same `event_id` (add `MediaBelongs(ctx, eventID, mediaID) (bool, error)` to the schedule repo) → else field error.
3. DTO in/out: `label`, `map_url`, `venue_note`, `media_id`.
**A**
- Tests: `javascript:alert(1)` map_url → 400; `http://` → 400; `https://maps.app.goo.gl/x` ok; media id of another event → 400; clearing media id works; list returns new fields.

### GS-004 — Template section set on template change
**Size** S · **D** GS-001 · **Read** design §5.2
**F** `api/internal/application/invitation/invitation.go`, `api/internal/infrastructure/postgres/invitation_repo.go` (`TemplateSlug`), tests (`sanitize_test.go` neighbour or new `template_sections_test.go`)
**Do**
1. Add `TemplateSections` map (design §5.2) and repo `TemplateSlug(ctx, templateID) (string, error)`.
2. In `Service.Update`, when `p.TemplateID` is set and resolves to a slug in the map, add missing section types (content `{}`; `gallery` and `music` with `visible=false`, others visible) then `Reorder` to template order with any other existing sections appended in their current order.
3. Unknown template id keeps today's behaviour (`ErrBadTemplate` path unchanged).
**A**
- Unit/integration test: invitation with default 5 sections → PATCH `template_id` = gilded-seal → 10 sections in template order, `gallery`/`music` hidden; repeating the PATCH adds nothing; switching to another template removes nothing.

### GS-005 — Public page projection (template, timezone, moments, signed media)
**Size** L · **D** GS-002, GS-003, GS-004 · **Read** design §5.4, §6
**F** `api/internal/domain/invitation/{invitation.go,public.go}`, `api/internal/application/publicinvite/publicinvite.go`, `api/internal/infrastructure/postgres/publicinvite_repo.go`, `api/internal/transport/http/public_handlers.go`, `api/cmd/api/main.go`, `api/internal/transport/http/integration_test.go` (wiring + tests)
**Do**
1. Domain: `PublicView.Template *string`, `PublicView.Timezone string`; `PublicPage.Schedule []PublicMoment`, `PublicPage.MediaIDs []string` (repo output), `PublicPage.Media map[string]string` (service output), `PublicPage.Preview bool`.
2. Repo `Page()`: `LEFT JOIN templates` for slug, select `e.timezone`; moments only when a visible `schedule` section exists, filtered by visibility set (`{everyone}` generic, `{everyone,invite_only}` personal); collect candidate media ids from section content keys listed in design §5.4 + moment `media_id`, keep valid UUIDs, filter with `SELECT id FROM media WHERE event_id=$1 AND id = ANY($2)`.
3. Service: `NewService(r Repo, sg *storage.Signer)`; `PublicMediaTTL = 6 * time.Hour`; build `Media` as `/api/v1/media/<id>/file?sig=<token>` using the same signer scheme `gift.Service.SignMedia` uses (resource id = media id) so `ServeSignedMedia` verifies it unchanged. Nil signer → empty map (seed/tests).
4. Wire `main.go` (`storage.NewSigner(mediaSecret)`, reuse the same instance as Gift) and the integration test deps (`testSigner`).
5. Handler DTO: `template`, `timezone`, `schedule[]` (RFC 3339 UTC instants), `media`, `preview`.
**A**
- Integration tests: (a) DTO has `template:"gilded-seal"` after selecting it, `null` otherwise; (b) timezone echoed; (c) generic link hides `invite_only` and `family_only` moments, personal link shows `invite_only`, never `family_only`; (d) hero `photo_id` of own media → signed URL that `GET /api/v1/media/{id}/file?sig=` serves 200; (e) **foreign event media id in content is absent from `media`**; (f) schedule section hidden → `schedule: []`; (g) existing `TestPublicInvite` unchanged and green.

### GS-006 — Public wishes list + wish POST returns the item
**Size** M · **D** GS-005 · **Read** design §5.5
**F** `publicinvite.go`, `publicinvite_repo.go`, `public_handlers.go`, `router.go`, tests
**Do**
1. Repo `ListWishes(ctx, eventID string, limit int, before *Cursor) (items []PublicWish, total int, err)`; approved only; order `created_at DESC, id DESC`; keyset on `(created_at, id)`.
2. Cursor = base64url(`<RFC3339Nano>|<uuid>`); malformed → `ErrBadRSVP`-style 400 (add `ErrBadCursor` mapped to 400 in `writeErr`).
3. Route `GET /api/v1/invite/{token}/wishes` with `authRL`; `Exists` check first (uniform 404); `limit` default 20, clamp 1–50; header `Cache-Control: private, max-age=15`; body `{items:[{id,name,message}], next_cursor, total}`.
4. `AddWish` → `RETURNING id`; handler returns `201 {"id","name","message"}` (name = stored author).
**A**
- Tests: unapproved wish excluded; 25 wishes → page 1 = 20 + cursor, page 2 = 5 + `next_cursor:null`; wishes of another event never appear; bad cursor 400; unknown token 404; POST body contains the stored author (personal link → guest name even if request sends another name).
- `web/components/invite/WishForm.tsx` behaviour unchanged (it ignores the body).

### GS-007 — Host draft preview endpoint
**Size** S · **D** GS-005 · **Read** design §5.6
**F** `publicinvite.go` (`Preview(ctx, eventID)`), `publicinvite_repo.go` (`ResolveEvent`), `invitation_handlers.go` or `public_handlers.go`, `router.go`, `authz_matrix_test.go`, tests
**Do**
1. `ResolveEvent(ctx, eventID)` = event id/date/deadline without the published predicate (deleted events → not found).
2. `Preview()` reuses `Page()` with generic-link visibility, `Preview=true`, `Guest=nil`, media signed.
3. Route `GET /api/v1/events/{id}/invitation/preview` with `needAuth, member` (same chain as `GET /invitation`); add to `policy` as `tMember`.
**A**
- Authz matrix test passes (route declared). Member gets 200 on an **unpublished** event with `preview:true`; stranger 404; anonymous 401.

### GS-008 — Contract, docs and web client types
**Size** S · **D** GS-005, GS-006, GS-007 · **Read** design §5.4–5.7
**F** `api/openapi.yaml`, `docs/08-api-specification.md`, `web/lib/api/invite.ts`
**Do**
1. OpenAPI: public invite response schema (all fields incl. new), wishes list, wish POST 201 body, preview endpoint.
2. `invite.ts`: extend `Invite` (`template`, `timezone`, `schedule: InviteMoment[]`, `media: Record<string,string>`, `preview`), add `InviteMoment`, `InviteWish`, `listWishes(token, cursor?)`, `fetchPreview(eventId)` (browser, same-origin, credentials include), make `submitWish` return `InviteWish`.
**A**
- `npm run typecheck` green; existing `InvitationView`, `RsvpForm`, `WishForm` compile unchanged.
- `docs/08` lists the 3 changes.

---

## 3. Lane B — Template engine (web)

### GS-010 — Scaffold, dependency, fonts, registry
**Size** S · **D** none · **Read** design §7.1, §7.5, §7.6, §7.8
**F** `web/package.json` (+lock), `web/components/templates/{registry.ts,types.ts}`, `web/components/templates/gilded-seal/{fonts.ts,gilded-seal.module.css,music.ts}`, `web/public/templates/gilded-seal/music/.gitkeep`
**Do**
1. `npm install lenis@<exact 1.3.x>` (prefer 1.3.26 as in the prototype); commit lockfile.
2. `fonts.ts` per design §7.5 (`next/font/google`, variables `--gs-serif/--gs-sans/--gs-script`, `FONT` family strings for canvas).
3. CSS module: prototype `<helmet>` rules scoped under `[data-template="gilded-seal"]` (box-sizing, selection, focus-visible, link colors, placeholder), Lenis classes (`html.lenis…`), the global-grain hide rule (design §7.8), and empty class hooks for hover/focus states used later.
4. `types.ts`: `TemplateMode`, `TemplateProps`. `registry.ts`: `LIVE_TEMPLATES: Record<string, ComponentType<TemplateProps>>` using `next/dynamic(() => import("./gilded-seal/GildedSeal"))` (file created in GS-015; until then export a placeholder component).
5. `music.ts`: catalog type + one entry pointing at `/templates/gilded-seal/music/satie-gymnopedie-1.mp3` (asset added by product; see design D3).
**A**
- Typecheck/lint/test green. `npm ls lenis` shows the exact version. No change to other routes' bundles (registry not imported anywhere yet).

### GS-011 — Pure derivation: config, derive, layout, mapInvite
**Size** M · **D** GS-010 (GS-008 types optional: define a local `Invite` import; if GS-008 not merged, extend types in a local `types.ts` and switch later) · **Read** design §1.2, §7.2, §7.3, §8.4, §8.9–8.12
**F** `gilded-seal/{config.ts,derive.ts,layout.ts}`, `web/tests/gilded-seal-derive.test.ts`, `web/tests/gilded-seal-layout.test.ts`
**Do**
1. `config.ts`: `WeddingConfig` type = prototype `WEDDING_CONFIG` shape + `timezone`, `language`, `photos` (`hero`, `story[2]`, `closing`, per-event, per-venue, gallery `{url,alt}[]`), `guest`, `rsvp` capability (`personal`, `status`, `partySize`, `maxParty`, `deadlinePassed`), `live`, `visible` flags per section. `DEMO_CONFIG` = prototype defaults verbatim (incl. 4 sample wishes, 8 gallery alts, timezone `Asia/Jakarta`).
2. `derive.ts`: port `cfg()` with design §7.2 date rules (Intl with `timeZone` + locale), `time12`, `timeRange`, roman numerals, venue grouping key `lower(venue|address)`, map href rules (https only else search URL), `rsvpByText`, `dateDots`, `split` chars with delays, `statementWords`, heading override (`headingParts(title, fallback)` → `[lead, emWord]`).
3. `layout.ts`: `heroLayout(vw,vh,c)`, `eventGeometry(vw,i,active,reduced)`, `venueGeometry`, `wishSlots(all, wishV, wide)` (5-slot ring), `galleryFigures(n)` (table cycle, `z_i`, `camZMax`, section height), `TICKS`.
4. `mapInvite(invite, mode, search)` per design §7.2 table incl. hide rules.
**A**
- Unit tests cover: WIB 06:00 event shows correct local day (regression for the UTC bug); `id` locale month names; `time12("18:00") === "6.00 PM"`; two moments same venue → one venue with 2 lines; `javascript:` map url → search URL; wish ring buffer keeps ≤5 slots and correct `d` values for n=1,2,7; gallery n=8 → height 460 (svh) and camZMax 6850; every §7.2 fallback row; generic link → `rsvp.personal=false`.

### GS-012 — Engine core: ticker, springs, easing, Lenis, lifecycle
**Size** M · **D** GS-010 · **Read** design §7.4, §8 intro
**F** `gilded-seal/engine/{ticker.ts,spring.ts,ease.ts,useEngine.ts}`, `web/tests/gilded-seal-spring.test.ts`
**Do**
1. `ticker.ts`: port `tick/untick/frame` (Map of subs with interval + last, dt clamp 64, Lenis `raf(time)` first, error isolation, auto-stop when idle).
2. `spring.ts`: `Spring` class and `spring(stiffness, damping)` → `linear(...)` with `CSS.supports` fallback (verbatim).
3. `ease.ts`: `EASE`, `ease`, `clamp`, `lerp`, `hash`.
4. `useEngine.ts`: creates `{ ticker, lenis?, timers, observers, disposers }` once per mount, exposes `later(ms, fn)`, `addDisposer(fn)`, `lockScroll/unlockScroll`; Lenis init (dynamic import, skipped when reduced) with `{smoothWheel:true, anchors:true, autoRaf:false}` and `stop()` until opened. Cleanup disposes everything (design §7.4 StrictMode list).
**A**
- Tests: `spring(120,18)` returns a `linear(` string starting `0,` ending `,1)` with 49 stops (or `EASE.out` when unsupported in jsdom — test both branches by stubbing `CSS.supports`); `Spring` settles (`rest`) toward target; ticker respects intervals (fake rAF).
- Mount/unmount twice in a test harness leaves no rAF/interval/listener alive (spy counts).

### GS-013 — WebGL shader layers + low-GL detection
**Size** S · **D** GS-012 · **Read** design §8.14
**F** `gilded-seal/gl/{shaders.ts,layer.ts,detect.ts}`
**Do**
1. Copy `VERT`, `FRAG_CONTOUR`, `FRAG_BURN` verbatim.
2. `makeLayer(canvas, frag, uniforms, dpr)` verbatim (WebGL2, full-screen triangle, uniform cache, resize to `clientWidth·min(2, dpr·scale)`, `destroy()` loses context).
3. `detectLowGL()` verbatim + `saveData`/`2g` check (design §7.7) exported separately as `preferLite()`.
**A**
- Typecheck green; a tiny vitest asserts `makeLayer(null)` → null and that shaders start with `#version 300 es`. Manual: GS-030 shows the contour.

### GS-014 — Reveals, album stack, parallax
**Size** M · **D** GS-012 · **Read** design §8.5, §8.13
**F** `gilded-seal/engine/{reveals.ts,stack.ts,parallax.ts}`
**Do**
1. `reveals.ts`: port `prepareReveals` (all six kinds, paused WAAPI, play on IO, unobserve, cancel on finish) with `start()` called after the cover opens; no-op under reduced motion.
2. `stack.ts`: port `setupStack/layoutStack/applyStack` (ResizeObserver, shrink 0 under 640, shade, visibility).
3. `parallax.ts`: port `parallaxFrame` for `[data-speed]`.
**A**
- Unit test with jsdom stubs: `applyStack` computes `scale(.93)` and shade `.55` at p=1 for vw ≥ 640, no scale under 640. Reveal map entries are created per kind.

### GS-015 — Root component and composition
**Size** L · **D** GS-011, GS-012, GS-013, GS-014 · **Read** design §1.1, §7.2–7.4, §8.3 (`finishOpen`)
**F** `gilded-seal/GildedSeal.tsx`, `registry.ts` (real import), `web/app/demo/[slug]/page.tsx`
**Do**
1. Client component `GildedSeal({ invite?, config?, token?, mode })`: `config = mode==="demo" ? DEMO_CONFIG(+?to) : mapInvite(...)`. Root `div[data-template="gilded-seal"]` with font variables, page bg `#F7F2E9`, `overflow-x: clip`, grain overlay (prototype data-URI SVG, z 300).
2. State: `showVeil, showCover, coverFallback, opening, now (1 s interval), vw, vh, car{ev,ven}, music, lb, rsvp…, wish…` (React state only for markup-driving values).
3. Mount sequence (port `componentDidMount`): reduced/fine detection, `scrollRestoration=manual`, `scrollTo(0)`, lock scroll, `main.inert = true` via ref, setup stack, reveals or `flattenGallery`, visibility IO (`hero, statement, date, gallery, closing`, rootMargin 15%), `tick(world)`, idle → `detectLowGL` → shaders → cover, Lenis, music init, initial wishes load, failsafe 10 s, listeners (pointer, keydown, resize with mobile URL-bar guard: ignore height deltas < 140 when width unchanged on coarse pointers).
4. `world()` port: stack, hero (if not covered), statement, date, gallery, closing, parallax, gallery buttons sync (900 ms).
5. `open/skip/finishOpen` orchestration API passed to Cover/Hero (sections implement their parts).
6. Compose sections in design §1.1 order; stack layers L1–L3 + date wrapper with exact z-index/sticky wrappers (`data-stack-layer`, `data-stack-inner`, `data-stack-shade`). Hidden sections not rendered.
7. Until section tasks land, render each section as a placeholder `<section id=… style={{minHeight:"100svh"}}/>` so the page works end to end.
8. Create `app/demo/[slug]/page.tsx` now (every section task develops against it): server page, `generateStaticParams` from `LIVE_TEMPLATES` keys, `notFound()` otherwise, renders `<T mode="demo" />` (the component reads `?to` client-side), metadata `title: "Gilded Seal — live demo · Mula"`, outside the `(marketing)` chrome.
**A**
- `/demo/gilded-seal` mounts with no console errors, unmounts cleanly under StrictMode (no leaked rAF: verify `ticker` subs size 0 after unmount in a test).
- Keyboard: `Esc` during opening calls skip; `Esc`/arrows reach the lightbox handler (stubbed).

---

## 4. Lane B — Sections (each after GS-015; parallelizable)

Every section task: port markup from the prototype lines listed, convert `{{ }}` to props, `sc-if`
to conditionals, `sc-for` to `map` with stable keys, `style-hover`/`style-focus` to CSS-module
classes, `<image-slot>` to `<Photo url alt/>`, fonts to `var(--gs-*)`. Keep every `aria-*`, `role`,
`tabIndex`, label and live region. Provide the section's frame callback to the engine when needed.

### GS-020 — Loading veil
**D** GS-015 · **Read** §8.1 · **Proto** markup 35–45, logic `veilFrame`, `liftVeil`
**F** `sections/Veil.tsx` (+ hooks into GildedSeal progress)
**A** Veil fills bottom-up with the spring, lifts with clip-path, cover head/foot fade in after; reduced motion: veil disappears without animation; failsafe path shows fallback cover at 10 s with three blocked (devtools request block).

### GS-021 — Cover DOM layer + fallback card
**D** GS-015 · **Read** §8.2 (DOM parts), §8.3 · **Proto** markup 47–86
**F** `sections/Cover.tsx`, `parts/Sprig.tsx`
**A** Head (eyebrow, names with Pinyon `&`, date rules), foot ("Open Invitation" button + "or tap the envelope"), vignette, light shaft, two blurred sprigs, skip button while opening, `role="dialog" aria-modal`. Fallback card (3:2, inset frame, initials, "Dear {guest}") when `coverFallback`. Clicking the button calls `open()`.

### GS-022 — Cover three.js scene
**Size** L · **D** GS-013, GS-021 · **Read** §8.2 · **Proto** logic `buildCover` (HTML lines ~968–1195)
**F** `gl/cover.ts`, `gl/coverTextures.ts`
**Do**
1. `buildCover(THREE, { canvas, config, fine, reduced, fgEls, getState })` → `{ update(time, dt), resize, hover(x,y), dispose, degrade }`, verbatim port. Replace prototype `self.*` reads with `getState()` (`pointer`, `coverRiseStart`, `openT0`, `openK`, `reduced`, `fine`).
2. Textures in `coverTextures.ts` (pure canvas functions), fonts via `FONT.*` (design §7.5). Guest name and couple names come from config (auto-shrink loops intact).
3. Dispose: traverse geometries/materials, textures, PMREM, renderer, `forceContextLoss`.
**A** Matches `shots/01-cover.jpg` composition at 1440×900 (envelope centred, reply card left, ribbon right, petals, seal with monogram); pointer lean + seal hover on desktop; mobile (390×844, coarse) renders at dpr 1 with 30 dust motes; `dispose()` leaves `renderer.info.memory` at 0 geometries/textures.

### GS-023 — Cover loading + opening sequence + watchdog
**D** GS-022, GS-020 · **Read** §8.1 progress, §8.2 watchdog, §8.3
**F** `sections/Cover.tsx`, `GildedSeal.tsx` (open/skip/finish)
**Do** Port `initCover` (fonts race 4 s, progress steps, lowGL → fallback, three dynamic import, scene build, cover tick interval 0/33/120), `coverFrame` watchdog, `open()` DOM WAAPI timeline + `openT0`, `skip()`, `finishOpen()` (design §8.3 list), music `playMusic()` inside the click.
**A** Full timeline plays in ~4.25 s and lands on the hero with focus on `h1`; skip at any moment finishes cleanly; `Esc` skips; reduced motion uses the 600 ms fade path; throttled CPU (6×) triggers `degrade()` (log once in dev); the three.js chunk is requested only after the veil starts (network panel).

### GS-030 — Hero (layered CSS-3D world)
**Size** L · **D** GS-015, GS-013 · **Read** §8.4 · **Proto** markup 88–145, logic `heroLayout`, `playHero`, `heroFrame`, `spawnPetals`, `petalFrame`
**F** `sections/Hero.tsx`
**A** Wide and narrow layouts match `shots/02-b.jpg` / mobile shot; entrance timings per §8.4; burn dissolve reveals the photo once; contour background animates and follows the pointer; petals fall; dolly while the statement layer slides over; scroll cue loops; "Kindly RSVP" → `#rsvp`, "The Celebration" → `#details`.

### GS-031 — Opening statement (scroll-scrubbed)
**D** GS-015, GS-014 · **Read** §8.6 · **Proto** markup 148–160, `statementFrame`
**F** `sections/Statement.tsx`
**A** Words light one by one while layer 1 is covered; halo rotates; ornament draws; reduced motion shows all words lit.

### GS-032 — Our story
**D** GS-015, GS-014 · **Read** §8.7 · **Proto** markup 162–190
**F** `sections/Story.tsx`
**A** Mask reveals with inner zoom, inset photo parallax, sticky text column on wide, chapters with roman numerals and staggered reveal; heading override rule works; hidden when `story.body` empty (live/preview).

### GS-033 — Save the date (ring, seams, countdown)
**Size** M · **D** GS-015, GS-013 · **Read** §8.8 · **Proto** markup 192–229, `dateFrame`, `drawSeam`, `ringFrame`, `TICKS`
**F** `sections/DateRing.tsx`
**A** Seams dissolve in/out with scroll; ring lap runs once on entry then tracks seconds; ticks light/decay; countdown updates each second with tabular numbers; ended state text; date parts in event timezone (verify a WIB-midnight fixture).

### GS-034 — The celebration (event carousel + dress code + live strip)
**Size** M · **D** GS-015 · **Read** §8.9 · **Proto** markup 231–283, `extraVals().ev`, `swipeFor`, `arrowKeys`, `goCar`
**F** `sections/Celebration.tsx`, `parts/{useSwipe.ts,useArrowKeys.ts}`
**A** 3D coverflow on wide, slide on narrow, reduced-motion translate only; tabs/progress/prev/next; swipe and arrow keys; inactive slide click selects it; "See the venue" selects the venue and scrolls; 1 moment → no controls; live strip only when `live` present (extension).

### GS-035 — The venue
**D** GS-015, GS-034 (`useSwipe`) · **Read** §8.10 · **Proto** markup 285–334, `extraVals().vn`
**F** `sections/Venue.tsx`
**A** Clip-path wipe + zoom settle between venues; info crossfade; counter; "Open in Maps" opens `map_url` or search URL in a new tab with `noopener noreferrer`; note shown when present.

### GS-036 — Gallery corridor + lightbox
**Size** M · **D** GS-015 · **Read** §8.11 · **Proto** markup 336–361, 591–605, `galleryFrame`, `flattenGallery`, lightbox handlers
**F** `sections/Gallery.tsx`, `sections/Lightbox.tsx`
**A** Scroll drives the camera through n figures (1–12) with fade in/out, counter and bar; expand buttons only for photos with URLs; lightbox keyboard + focus management + scroll lock; reduced motion → flat grid; section hidden with 0 photos (non-demo).

### GS-037 — Wedding gift
**D** GS-015 · **Read** §8.12 Gift · **Proto** markup 363–380, `copyAccount`
**F** `sections/Gift.tsx`
**A** One card per bank/wallet method; copy works (secure context) and falls back; status live region; hidden without methods.

### GS-038 — RSVP card (real API)
**Size** M · **D** GS-015, GS-008 · **Read** §7.3, §8.12 RSVP · **Proto** markup 382–456, RSVP handlers, `extraVals` RSVP values
**F** `sections/Rsvp.tsx`
**Do** Port the card, decorative under-cards, flip, validation copy, stepper; live mode calls `submitRsvp(token, {status, party_size, note})`; personal name read-only; generic link notice; pre-replied guest starts on the back; preview/demo → `demo` status; error mapping per design §8.12.
**A** Live: reply persists (re-open the link → card shows back with the right copy); "Change my reply" returns to the form with previous answers; closed deadline shows the closed message; generic link shows the notice and no form; focus moves to the thank-you heading after the flip.

### GS-039 — Kind words (wishes deck + composer, real API)
**Size** M · **D** GS-015, GS-008 · **Read** §8.12 Wishes · **Proto** markup 458–533, wishes logic
**F** `sections/Wishes.tsx`
**Do** Port viewer (5-slot deck, sizes, line clamps, swipe/keys, counter, live region) and composer; live: `listWishes` initial + load-more when < 4 remain (dedupe by id, cap 200 in memory), POST via `submitWish` → prepend returned item + pulse; personal link name read-only; preview: list from API, post local; demo: samples + local.
**A** Loading / error (Try again) / empty / list states render; new wish appears first after POST; paging loads more near the end; counter shows `i of total`.

### GS-040 — Closing
**D** GS-015, GS-013 · **Read** §8.12 Closing · **Proto** markup 535–565, `closingFrame`
**F** `sections/Closing.tsx`, `parts/WaxSeal.tsx`
**A** Arch tilts up into place with scroll, char reveal of names, date dots, footer copy, parallax sprigs, contour background.

### GS-041 — Music button
**D** GS-015, GS-010 · **Read** §7.9, §8.12 Music · **Proto** markup 567–589, music logic
**F** `sections/MusicButton.tsx`, `GildedSeal.tsx` (audio lifecycle)
**A** Starts only from the open gesture (or button), fades in to .6, never resumes after a user pause, pauses when the tab is hidden and resumes only if it paused it, error state on a missing file, hidden when no track.

---

## 5. Lane C — Integration

### GS-050 — Guest route switches on template
**Size** S · **D** GS-005, GS-015 · **Read** design §3, §7.1
**F** `web/app/invite/[token]/page.tsx`
**Do** After `fetchInvite`, `const T = invite.template ? LIVE_TEMPLATES[invite.template] : undefined; if (T) return <T invite={invite} token={params.token} mode="live" />;` else today's `InvitationView`. Keep `dynamic="force-dynamic"`, metadata (`noindex`, `no-referrer`).
**A** Seeded generic invite (no template) renders exactly as before (existing e2e green); an invite with `gilded-seal` renders the template; unknown slug falls back to `InvitationView`.

### GS-051 — Landing: catalog entry + link to the live demo
**Size** S · **D** GS-015 (demo route) · **Read** design §10
**F** `web/components/landing/data.ts`, `web/components/landing/pages/TemplatePage.tsx`
**Do**
1. Add the `gilded-seal` entry (design §10) and optional `live?: boolean` on `Template`.
2. `TemplatePage`: when `t.live`, "Preview invitation" button and the phone mock open `/demo/${t.slug}?to=${encodeURIComponent(guest)}` in a new tab; otherwise unchanged.
**A** `/templates` shows Gilded Seal under Wedding/Elegant/Ivory filters; `/templates/gilded-seal` renders the existing page layout with the new data; "Preview invitation" opens the demo; demo RSVP/wish never hit the network (assert in e2e); sitemap includes the slug.

### GS-052 — Admin: design catalog row + host preview
**Size** M · **D** GS-007, GS-015 · **Read** design §9
**F** `web/components/admin/logic.ts` (one `dl` row), `web/components/admin/patch.ts` (`openPreview` branch), `web/app/preview/[eventId]/page.tsx`
**Do**
1. Add the `dl` row (design §9).
2. In `patch.ts`, compute `isGs = templatesRaw.find(t => t.id === invitation.template_id)?.slug === "gilded-seal"`; wrap `v.openPreview`: when `isGs`, `window.open(`/preview/${D.id}`, "_blank", "noopener")`, else original.
3. `app/preview/[eventId]/page.tsx`: client page, `fetchPreview(eventId)` (cookies), loading/error states using `components/ui` `Skeleton`/`ErrorState`, 401 → `/login?next=…`, renders the registry template with `mode="preview"`; `robots noindex`.
**A** "Use this design" on Gilded Seal sets `template_id` (network PATCH) and the editor shows the new sections after refresh; Preview opens a new tab with the draft (works before publishing); other designs keep the phone-mock preview; no visual change elsewhere in admin.

### GS-053 — Admin: invitation editor fields for Gilded Seal
**Size** L · **D** GS-004, GS-052 · **Read** design §4.1, §9
**F** `web/components/admin/views/InvitationEditor.tsx`, `web/components/admin/patch.ts`
**Do**
1. `SEC` map additions (design §9). Expose `V.gs` (bool) and current section content to the view.
2. Upload helper in `patch.ts`: `upload(file, kind) → media id` via `D.mut("POST", `${base}/media`, formData)`; client checks type `image/*` and ≤5 MiB before upload (server is the authority); toast on error.
3. Fields when `V.gs` (existing classes only):
   - Cover: file input replacing the inert "Replace cover photo" tile (same tile look) → `hero.photo_id`.
   - Main: "Opening line" (`opening.title`), "Opening message" (`opening.statement`, existing textarea gets `data-f`), "Invitation line" (`opening.subtitle`).
   - Story: chapters editor (≤5 rows title/text, add/remove), two photo pickers → `story.photo_ids`.
   - Gallery: wire "Upload photos" (multi, ≤12 total) → `gallery.photos` (+ alt input per photo, remove), auto-set section visible when ≥1 photo.
   - Music: track `<select>` from `music.ts` (+ "No music") → `music.track`, section visible when chosen.
   - Closing: photo picker → `closing.photo_id` (message uses existing generic body).
4. `saveInv`: PATCH the touched section contents (merge with existing content).
**A** Each field round-trips (save → reload editor → values shown); the public/preview page shows them; non-Gilded-Seal invitations show the editor exactly as before (snapshot/DOM check of the default editor unchanged).

### GS-054 — Admin: schedule fields
**Size** S · **D** GS-003 · **Read** design §9
**F** `web/components/admin/views/Schedule.tsx`, `web/components/admin/patch.ts` (`evSave`), `web/components/admin/mappers.ts`
**Do** Add `data-f="map"` to the existing "Map link" input (defaultValue `e.map`), add "Small heading" (`label`) and "About the place" (`venue_note`) inputs in the same grid, optional photo picker (upload helper from GS-053, or plain file input if GS-053 not merged); map in `mappers.ts`; send in `evSave`. Client hint for invalid map links (must start with `https://`); show the API field error via the existing toast.
**A** Values persist and appear in the template's celebration/venue; a `javascript:` link is rejected with a visible message.

### GS-055 — Seed: demo celebration on Gilded Seal
**Size** S · **D** GS-002…GS-004 · **Read** design §4.1
**F** `api/cmd/seed/main.go`
**Do** Only for newly created demo events (idempotency rules unchanged): set `template_id` to `gilded-seal`, fill `opening`, `story` (body + 3 chapters), `closing` body, `schedule` moments with labels, one bank gift method, 3 approved wishes. No media (photos fall back to gradients).
**A** `make db-reset` (dev) → the printed guest link renders Gilded Seal with all sections except gallery/music; re-running `make seed` changes nothing.

---

## 6. Lane D — QA

### GS-060 — End-to-end specs
**Size** M · **D** GS-050…GS-055 · **Read** design §12
**F** `web/tests/e2e/gilded-seal.spec.ts`, `web/tests/e2e/helpers.ts` (if a helper for template selection is needed)
**Do** Specs: demo flow (veil → open → h1 focused → scroll to RSVP → submit → back face visible → wish local appears); skip intro with `Esc`; reduced-motion project (`reducedMotion: "reduce"`): no cover WebGL request, flat gallery; full-stack: user with event (`go run ./cmd/seed e2e-user … --with-event`), select template via API, publish, open personal token → RSVP persists after reload; wish appears in `GET …/wishes`; generic token → RSVP notice; mobile viewport project; axe scan after opening; fail on any `console.error`.
**A** `E2E_FULL_STACK=1 npx playwright test gilded-seal` green on desktop/tablet/mobile projects.

### GS-061 — Performance and accessibility pass
**Size** S · **D** GS-060
**F** `web/lighthouserc.mobile.json` (add `/demo/gilded-seal` URL), fixes in template files only
**A** Budgets from design §12 met or deviations documented with numbers; axe: no critical/serious; every interactive element ≥44 px; focus visible on all controls; `prefers-reduced-motion` honoured everywhere.

### GS-062 — Visual parity review
**Size** S · **D** GS-060
**F** `docs/15-template-gilded-seal-design.md` (append "Parity notes" with screenshots paths under `web/test-results/`)
**A** Side-by-side captures at 1440×900, 768×1024, 390×844 for cover, hero, statement, story, date, celebration, venue, gallery, gift, RSVP (front/back), wishes, closing; every difference either fixed or listed with a reason.

---

## 7. Traceability (prototype feature → task)

| Prototype feature | Task |
|---|---|
| Loading veil, progress spring | GS-020 |
| Envelope scene, textures, lights, seal, flecks, dust | GS-022 |
| Open/skip timeline, watchdog, fallback | GS-021, GS-023 |
| Hero layers, burn shader, petals, pointer camera | GS-030, GS-013 |
| Album stack | GS-014 |
| Statement scrub + halo | GS-031 |
| Story masks + parallax | GS-032, GS-014 |
| Gilded ring, seams, countdown | GS-033 |
| Event coverflow carousel, dress code | GS-034 |
| Venue slider | GS-035 |
| 3D gallery corridor, lightbox | GS-036 |
| Gift copy card | GS-037 |
| RSVP flip card | GS-038 (+ API GS-005) |
| Wishes deck + composer | GS-039 (+ API GS-006) |
| Closing arch | GS-040 |
| Music | GS-041 |
| Scroll reveals | GS-014 |
| Lenis smooth scroll, shared ticker | GS-012 |
| Guest personalisation (`?to=`) | GS-011, GS-022 |
| Real couple/date/timezone | GS-002, GS-005, GS-011 |
| Template selection (admin) | GS-004, GS-052 |
| Template content editing (admin) | GS-053, GS-054 |
| Landing listing + live demo | GS-051 |
