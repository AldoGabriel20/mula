# 17 — Template Kit: design

Status: **built through phase 2 and the rest of phase 1** (phases 3 and 4 are gated on product decisions; see `18-template-kit-tasks.md` §12). Companion task plan: `18-template-kit-tasks.md`.
Builds on `15-template-gilded-seal-design.md` (the first coded template) and `11-frontend-architecture.md`.

Goal in one sentence: **adding the 10th template must cost one folder and one manifest, not edits in
eight places, and a host must be able to restyle a template (colours, fonts, motion, section set)
without a deploy.**

---

## 0. Scope, non-goals, short answers

### 0.1 In scope

1. A **manifest** per template: the single source of truth for what a template is (name, sections,
   customisable tokens, capabilities, marketing copy, thumbnail).
2. A **catalog** (`catalog/`): shared libraries of palettes, font pairings and music tracks, all
   self-hosted.
3. A **runtime kit** (`web/lib/kit/`): design tokens → CSS variables, the motion engine and policy,
   the invite view-model, headless behaviours (RSVP, wishes, music, lightbox, countdown), the
   template registry.
4. **Host customisation** stored as data (`invitations.theme`), validated against the manifest.
5. A path to **host-made templates** (forks of a themed template, composed from a fixed block
   library). Designed now, built last.

### 0.2 Non-goals

- Hosts uploading arbitrary HTML, CSS, JS or fonts. Not now, probably never (§13.4 explains why).
- A drag-and-drop page builder. The editor picks blocks and variants; it does not place pixels.
- Redesigning the admin dashboard or the landing page. Changes there are additive (a generic
  panel replaces a hand-written one only where the tasks say so).
- Billing or entitlement rules for premium templates. The manifest carries an `access` field; the
  enforcement is a product decision tracked in §18.3.
- Rewriting Gilded Seal. It adopts the kit incrementally under a parity guard (§15).

### 0.3 Short answers to the questions that started this document

| Question | Answer |
|---|---|
| Can the system take many more templates? | Backend and routes already can. What does not scale is the *process*: a template is defined in 8 separate places today (§1.1). The kit collapses that to one manifest. |
| Can a host create their own template? | Not today. After the kit: a host can **customise** any template (Tier 3) within guardrails. A host-made *layout* (Tier 3 fork of a themed template) is phase 4. Free-form code is out of scope. |
| Is there a font / colour / motion library? | No. Fonts live in one template's `fonts.ts`, colours are literals inside components, motion code lives in `gilded-seal/engine/`. The kit creates the library (§7). |
| Third party or ours? | **Ours for everything a guest's browser loads** (fonts, audio, images, code). Third party only for infrastructure (S3-compatible object storage + CDN). Detail in §14. |
| Are templates in the database? | Only the catalog row (slug, name, category, tags, palette label). The look is in code. After the kit the catalog row also carries the manifest, synced from the repo. |

---

## 1. Audit: how a template works today

All of this was verified against the repository, not assumed.

### 1.1 Where a template is "defined" (the 8 places)

| # | Place | What it holds | Example |
|---|---|---|---|
| 1 | `api/migrations/0014`, `0015` | Catalog row: `slug, name, category, tags, palette, position` | `gilded-seal` row inserted by a migration |
| 2 | `api/internal/application/invitation/invitation.go` `TemplateSections` | Which section types the template renders, in order | `"gilded-seal": {"hero","opening",…}` |
| 3 | same file, `hiddenUntilFilled` | Which sections start hidden | `gallery`, `music` (global, not per template) |
| 4 | `web/components/templates/registry.ts` `LIVE_SLUGS` | Which slugs have a renderer (server-safe) | `["gilded-seal"]` |
| 5 | `web/components/templates/TemplateHost.tsx` `TEMPLATES` | slug → lazy component | `dynamic(() => import("./gilded-seal/GildedSeal"))` |
| 6 | `web/components/landing/data.ts` `TEMPLATES` | Marketing card + phone-mock data, **15 entries with their own slugs** (`serenity`, `arunika`, …). Only `gilded-seal` matches the DB | `live: true` flag |
| 7 | `web/components/admin/logic.ts` `dl` (+ `pals`, `PROTO_TO_PALETTE` in `mappers.ts`) | Hard-coded design list of 9 names, mapped to DB rows **by name**; palettes by array index | `['Gilded Seal','Wedding','Elegant · Cinematic',0,'Adrian & Isabella']` |
| 8 | `web/components/admin/patch.ts` (`isGs`), `views/GsEditor.tsx` | Template-specific editor, switched on `slug === "gilded-seal"` | |

Consequences found while building Gilded Seal:

- **Three catalogs disagree.** The DB has 9 slugs (`linen-vow`, `golden-hour`, … `gilded-seal`), the
  landing has 15 different slugs, the admin has 9 display names. Nothing links them except the name
  string in the admin and the one slug that was aligned by hand.
- **8 of the 9 DB rows have no renderer.** A host who picks "Linen Vow" gets the generic
  `InvitationView` card, whose only theming is a palette *label* mapped to one of 5 gradients
  (`components/marketing/paletteSwatch.ts`).
- **Gilded Seal ignores `invitations.palette` entirely.** Its colours are literals.

### 1.2 What in Gilded Seal is generic vs template-specific

`web/components/templates/` is ~5,100 lines, of which `gilded-seal/` is almost all.

| Part | Files | Verdict |
|---|---|---|
| Spring, ease, ticker, parallax, scroll reveals | `engine/{spring,ease,ticker,parallax,reveals,useEngine,engine}.ts` | **Generic.** Move to kit. `engine.ts` and `reveals.ts` need an audit for prototype-specific constants (task TK-021). |
| Album stack | `engine/stack.ts`, `parts/StackLayer.tsx` | Template-specific (the hero→story→date pinned stack). Stays. |
| WebGL layer, capability detect | `gl/layer.ts`, `gl/detect.ts` | **Generic** (one canvas, DPR cap, context-loss). Move. |
| Cover scene, shaders, canvas textures | `gl/{cover,shaders,coverTextures}.ts` | Template-specific. Stays. |
| Date/time formatting in a time zone, "last word in accent italic" titles, guest-name-from-URL, RSVP state, gift methods, signed media map | inside `config.ts` (`mapInvite`) and `derive.ts` | **Generic logic wrapped in template defaults.** Split: model → kit, defaults and copy → template. |
| RSVP submit/optimistic state, wish list + post, music fade, lightbox focus trap, countdown | inside `sections/{Rsvp,Wishes,MusicButton,Lightbox,DateRing}.tsx` | **Behaviour is generic, markup is not.** Extract hooks, keep markup. |
| Music catalog | `music.ts` (one track, **audio file not yet supplied**: `public/templates/gilded-seal/music/` is empty) | Catalog → kit. The licensing/asset gap is a product dependency (§18.3). |
| Fonts | `fonts.ts` (`next/font/local`, three families, exact woff2 files shared with landing) | Template-specific today; the *files* are a shared asset (§7.2). |
| Section markup and motion | `sections/*` | Template-specific. This is the template. |
| Section content schemas (`hero.line`, `story.chapters`, `gallery.photos`, …) | `docs/15 §4.1` | **Shared across templates by design.** Keep as the common content model (§7.6). |

### 1.3 Problems the kit has to solve

| ID | Problem | Evidence |
|---|---|---|
| P1 | No single source of truth; adding a template touches 8 files | §1.1 |
| P2 | Catalog drift between DB, landing and admin | §1.1 |
| P3 | No theming contract: a template cannot be restyled by data | colours are literals; `palette` is a label |
| P4 | Fonts cannot be chosen per invitation (`next/font/local` needs static, module-scope declarations) | `fonts.ts` |
| P5 | Section set and defaults are in Go code, not per-template data | `TemplateSections`, `hiddenUntilFilled` |
| P6 | Editors are hand-written per template | `GsEditor.tsx`, `isGs` |
| P7 | Shared behaviour (RSVP, wishes, music) is copy-bound to one template's markup | §1.2 |
| P8 | Server does not validate section content shape (renderer clamps) | `Service.sanitize` only strips `<>` |
| P9 | Thumbnails are generic mocks, not the real template | admin design cards, landing `/templates` |

---

## 2. Principles

1. **Manifest first.** If something differs between templates, it is a manifest field, a token or a
   template file. It is never a `slug ===` check in shared code.
2. **Data for looks, code for experiences.** Colours, fonts, section order, copy, motion *level* are
   data (hosts can change them). Choreography (the 3D cover, the album stack) is code (the team
   ships it).
3. **Extract on second use.** Anything already used by two templates moves into the kit. Anything
   used by one stays in that template. Exception: the pieces listed as generic in §1.2, which are
   mechanical moves that define the contract.
4. **Self-host what guests load.** No runtime request to a font, audio or script CDN we do not
   control (§14).
5. **Guardrails over freedom.** A host's overrides are validated against the manifest: allowed
   token set, allowed font pairings, minimum contrast, section whitelist.
6. **Accessibility and performance are part of the contract**, not per-template goodwill: reduced
   motion, 44 px targets, keyboard path, CLS, bundle budget are checked by one shared test suite
   that every template must pass (§16).
7. **A template never breaks another.** Own chunk, own CSS scope, no global side effects beyond
   what `KitRoot` sets up and tears down.

---

## 3. Architecture overview

### 3.1 Three tiers

```
                       authored by      stored as                    needs deploy?  host can change
Tier 1  Coded          the team         React code + manifest.json   yes            tokens, fonts, motion level,
        (Gilded Seal)                                                               section visibility/order, copy
Tier 2  Themed         the team         manifest.json + layout JSON  no (row sync)  same as Tier 1
        (the 8 catalog rows,                                                         
        future simple designs)
Tier 3  Host-made      the host         templates row, owner_id set, no              layout of blocks, variants,
        (a fork of a Tier 2)            layout JSON (+ theme)        (data only)    tokens, fonts
```

- **Tier 1** is what Gilded Seal is. Bespoke markup and motion, built with kit primitives.
- **Tier 2** is rendered by one shared `BlockRenderer` from a declarative layout. It replaces the
  generic `InvitationView` and gives the 8 catalog rows a real look without 8 hand-written
  templates. Cheap to author: a JSON file and a thumbnail.
- **Tier 3** is a host's private copy of a Tier 2 layout, edited in a block editor. This is what
  "the user can create their own template" honestly means: composing and styling vetted blocks,
  not writing code.

All three tiers share the same manifest shape, the same tokens, the same section content model,
the same behaviours and the same publish pipeline. The tier only changes *who renders*.

### 3.2 Data flow

```
catalog/templates/<slug>/manifest.json ──┐
catalog/palettes.json  fonts.json  music.json
                                         │  make templates   (validate → sync → codegen)
                  ┌──────────────────────┴─────────────────────────┐
                  ▼                                                ▼
 Postgres `templates` row (manifest jsonb)            web/lib/kit/generated/*.ts
   ▲  GET /api/v1/templates[/{slug}]                    (types, registry, palette/font tables)
   │                                                                │
 admin design picker, landing (ISR) ◄── catalog JSON                ▼
                                              <TemplateHost slug …> → renderer
 invitation: template_id + theme (jsonb) ──► public projection ──► KitRoot sets CSS vars
```

Runtime source of truth is the DB row (API serves it; invitations FK to it). Repo source of truth
is the manifest file. The sync tool is idempotent and runs wherever `migrate` runs. The codegen
output is committed and CI fails when it is stale (`git diff --exit-code`), so the web build never
needs the network.

---

## 4. Repository layout

```
catalog/                              # NEW, authoring source of truth (no code)
  manifest.schema.json                # JSON Schema for manifests (§5.3)
  palettes.json                       # §7.1
  fonts.json                          # §7.2 (families, pairings, files, licences)
  music.json                          # §7.4
  templates/
    gilded-seal/
      manifest.json
      thumb.webp                      # generated by `npm run templates:thumbs` (§11.4)
    linen-vow/
      manifest.json                   # Tier 2: also holds `layout` (§7.6)
      thumb.webp

web/
  public/fonts/<family>/*.woff2       # NEW, self-hosted, OFL (§7.2); landing's files move here
  public/audio/<track>.mp3            # NEW, curated tracks (§7.4)
  lib/kit/
    index.ts
    manifest.ts                       # Manifest types + runtime validator (ajv or zod, see §5.4)
    tokens.ts                         # resolveTheme(manifest, palette, theme) → CSS variables
    KitRoot.tsx                       # sets vars, fonts, motion policy, mode; cleans up
    fonts.tsx                         # <KitFonts pairing> emits @font-face + preload
    model/                            # invite → InviteModel (dates in tz, titles, guest, rsvp, gifts, media)
    behaviors/                        # useRsvp, useWishes, useMusic, useLightbox, useCountdown
    motion/                           # ease, spring, ticker, parallax, reveals, policy (moved from gilded-seal/engine)
    gl/                               # layer, detect (moved)
    blocks/                           # Tier 2 block library + BlockRenderer (phase 3)
    generated/                        # codegen output, committed
  components/templates/
    registry.ts                       # server-safe, now derived from generated manifest list
    TemplateHost.tsx                  # unchanged contract, registry from generated map
    gilded-seal/…                     # Tier 1 renderer (unchanged layout, thinner config.ts)
```

Naming: `catalog/` is deliberately not `templates/` so nobody confuses data with
`web/components/templates/` (renderers).

---

## 5. The manifest

### 5.1 Responsibilities

A manifest answers every question shared code might ask about a template. If shared code has to
guess, the field is missing.

### 5.2 Example (Gilded Seal, v1)

```jsonc
{
  "manifestVersion": 1,
  "slug": "gilded-seal",
  "name": "Gilded Seal",
  "kind": "coded",                       // "coded" | "themed"
  "status": "published",                 // "draft" hides it from every picker
  "access": "free",                      // "free" | "premium" (enforcement is not part of this doc)
  "category": "Wedding",
  "eventTypes": ["wedding"],
  "tags": ["Elegant", "Cinematic"],
  "position": 8,

  "marketing": {
    "desc": "A wax-sealed cover, a slow reveal, a gold ring that counts the days.",
    "style": "Cinematic", "mood": "Romantic",
    "demo": { "route": "/demo/gilded-seal" }
  },

  "sections": [                          // order = default order; also the section whitelist
    { "type": "hero",     "required": true },
    { "type": "opening" },
    { "type": "story" },
    { "type": "schedule" },
    { "type": "gallery",  "hiddenUntilFilled": true, "max": 12 },
    { "type": "gift" },
    { "type": "rsvp",     "required": true },
    { "type": "wishes" },
    { "type": "music",    "hiddenUntilFilled": true },
    { "type": "closing" }
  ],

  "capabilities": {
    "music": true, "gallery": { "max": 12 }, "wishes": true, "rsvp": true, "gift": true,
    "timezone": true, "multiMoment": { "max": 10 }, "languages": ["en", "id"],
    "needsWebGL": false,                 // WebGL is enhancement; a static path always exists
    "reducedMotion": "static"            // what reduced motion does: "static" | "calm"
  },

  "tokens": {                            // the template's default theme
    "color": {
      "bg": "#F7F2E9", "surface": "#FCF9F3", "ink": "#302720", "inkSoft": "#4A3E35",
      "muted": "#6B5D52", "accent": "#A98545", "accentSoft": "#E8D7AD", "line": "#B08E52",
      "danger": "#8E4A43", "onAccent": "#FCF9F3"
    },
    "font": { "display": "cormorant", "body": "manrope", "script": "pinyon" },
    "motion": { "level": "full" }
  },

  "customizable": {                      // what a host may change (guardrails)
    "palette": ["gold-ivory", "rose-linen", "sage-parchment"],   // palette ids from palettes.json
    "fontPairings": ["classic-serif"],                           // pairing ids from fonts.json
    "tokens": ["accent"],                                        // free hex, contrast-checked
    "motion": ["full", "calm"]
  },

  "thumbnail": "thumb.webp"
}
```

### 5.3 Rules (enforced by `catalog/manifest.schema.json` + `go run ./cmd/templates validate`)

| Rule | Why |
|---|---|
| `slug`: `^[a-z][a-z0-9-]{1,40}$`, unique, **immutable** once published (invitations reference the row, public URLs reference the slug) | stability |
| every `sections[].type` is a known section type (§7.6) | the content model is shared |
| `required` sections must be present in `sections` and cannot be hidden by hosts (publish rule `MissingRequired` becomes per-template) | replaces global `RequiredSections` |
| `tokens.color` defines every role in §6.1; every `ink`/`bg`, `onAccent`/`accent` pair meets WCAG AA 4.5:1 | a template cannot ship unreadable |
| every id in `customizable.*` exists in the catalog files | no dangling references |
| `kind: "themed"` requires `layout` (§7.6); `kind: "coded"` forbids it and requires a renderer in the registry | a manifest cannot lie about its renderer |
| `capabilities` keys must be recognised (unknown key = error) | typos fail loudly |
| `manifestVersion` is an integer; the tool refuses a manifest newer than it understands | forward compatibility |

### 5.4 Validation split

- Authoring-time (CI, `make templates`): full JSON Schema + the cross-reference rules above. Go
  tool, so the API and CI share one implementation.
- Runtime (web): a thin type guard on the generated types. No schema engine in the browser bundle.
- Runtime (API): section content validation per type (§10.3), driven by the same schema
  fragments. This closes P8.

### 5.5 Versioning

`templates.version` increments when a published manifest changes. An invitation never silently
changes meaning: only **additive** manifest changes may apply to published invitations (new
optional token, new optional section). Removing or renaming a section type or token requires a new
slug (`gilded-seal-2`). The sync tool enforces this by diffing against the DB row.

---

## 6. Design tokens

### 6.1 Roles

Semantic roles, not literal names, so any palette can fill them.

| Group | Roles |
|---|---|
| Colour | `bg` page, `surface` cards/papers, `ink` primary text, `inkSoft` body, `muted` captions, `accent` interactive/emphasis, `accentSoft` tints and selection, `line` rules/borders, `danger`, `onAccent` text on accent |
| Type | `display`, `body`, `script`, `mono` (font ids → resolved to families by `fonts.json`); scale `sm/md/lg/xl/display` as clamp() strings owned by the template |
| Motion | `level` (`full`, `calm`, `off`), `durationScale` (0.6–1.4), named easings (`out`, `inOut`, `spring`) |
| Shape | `radius` (`sm/md/lg`), `frame` (`none`, `arch`, `rect`, `oval`) |

Templates may declare **extra roles** under `tokens.extra` (Gilded Seal: `wax`, `sprig`, `dark`).
Extras are never host-editable unless listed in `customizable.tokens`.

### 6.2 Output

`resolveTheme(manifest, palette, theme)` returns a flat map, emitted by `KitRoot` on the template
root only (never `:root`, so the admin chrome is untouched):

```
--k-bg --k-surface --k-ink --k-ink-soft --k-muted --k-accent --k-accent-soft --k-line --k-danger --k-on-accent
--k-font-display --k-font-body --k-font-script --k-font-mono
--k-radius-sm --k-radius-md --k-radius-lg
--k-motion-scale
```

Canvas/WebGL code cannot read CSS variables per frame cheaply. `KitRoot` also exposes the resolved
colours as a typed object (`useTheme()`) read once at scene build.

### 6.3 Resolution order (later wins)

1. Manifest `tokens` (template default)
2. Palette (`invitations.theme.palette`, else legacy `invitations.palette` label)
3. Host overrides (`invitations.theme.tokens`), only for roles in `customizable.tokens`
4. Motion policy (device and `prefers-reduced-motion` always win over the host's motion choice)

### 6.4 Guardrails

- Custom colours are `#RRGGBB` only (no `url()`, no `var()`, no CSS injection).
- API rejects a theme where `ink` on `bg` or `onAccent` on `accent` is below 4.5:1 (400 with the
  failing pair named).
- Unknown token role, unknown palette id or pairing id not in `customizable` → 400.

### 6.5 Gilded Seal adoption

Tokenising the prototype's hundreds of inline hex values would risk parity for little gain. The
plan is bounded: map **page background, ink family, gold accent, paper, danger** and the three
fonts to tokens (the §8.15 table of docs/15), leave decorative one-offs (wax gradient, sprig
fills) as `extra` tokens with their current values as defaults. Parity is guarded by the existing
`gilded-seal-parity` spec: with no overrides the pixels must not change (§15).

---

## 7. Libraries

### 7.1 Palettes (`catalog/palettes.json`)

A palette is a named subset of colour tokens that any template whose `customizable.palette`
lists it can wear.

```json
{ "id": "sage-parchment", "name": "Sage & Parchment",
  "swatch": ["#E2E5D9", "#2F3A2E", "#7D8C72"],
  "color": { "bg": "#F1F2EA", "surface": "#FAFAF5", "ink": "#2F3A2E", "accent": "#6B7B5E", "...": "..." },
  "aliases": ["Forest"] }
```

- Replaces three things: the admin's `pals` array (index-addressed), `PROTO_TO_PALETTE`
  (`mappers.ts`), and the marketing `PALETTE` label→gradient table.
- `aliases` keep legacy `invitations.palette` values (`Ivory`, `Stone`, `Blush`, `Forest`,
  `Midnight`) valid. **No data migration of existing invitations.**
- A palette that omits a role inherits it from the template default, so adding a palette is a
  10-line JSON edit.

### 7.2 Fonts (`catalog/fonts.json` + `web/public/fonts/`)

Why not `next/font`: `next/font/local` must be called at module scope with literal paths, so the
set of fonts is fixed at build time per module. Per-invitation choice needs fonts that can be
selected at request time. So the kit self-hosts static `woff2` files and emits `@font-face` itself.

```json
{
  "families": {
    "cormorant": { "name": "Cormorant Garamond", "license": "OFL-1.1", "fallback": "Georgia, serif",
      "files": [
        { "src": "/fonts/cormorant/normal.woff2", "style": "normal", "weight": "300 700" },
        { "src": "/fonts/cormorant/italic.woff2", "style": "italic", "weight": "300 700" } ] },
    "manrope": { "...": "..." }
  },
  "pairings": [
    { "id": "classic-serif", "name": "Classic serif", "display": "cormorant", "body": "manrope", "script": "pinyon" }
  ]
}
```

- `<KitFonts pairing>` renders `@font-face` rules and `<link rel="preload" as="font" crossorigin>`
  **only** for the selected pairing. Every family keeps `font-display: swap` and a size-adjusted
  system fallback to keep CLS near zero (budget in §16).
- Licence gate: only OFL / Apache / similarly redistributable fonts; `license` is required and the
  validator rejects a missing value. Files come from the upstream release, committed once, not
  fetched at runtime.
- **Gilded Seal must keep using the exact same woff2 files it uses now** (landing's files). A
  different build of the same family changes glyph advances by up to 10 % (found in docs/15 §7.5).
  Moving the files to `public/fonts/` is a rename, not a re-download, and is covered by the parity
  spec.
- Host-uploaded fonts are a non-goal (licensing, performance, sanitising binary input).

### 7.3 Motion and engine (`web/lib/kit/motion`, `web/lib/kit/gl`)

Moves out of `gilded-seal/engine` and `gilded-seal/gl`: `ease`, `spring`, `ticker`, `parallax`,
`reveals`, `useEngine`, `engine` (after the TK-021 audit), `gl/layer`, `gl/detect`.

Single **motion policy** (`useMotionPolicy()`), replacing ad-hoc checks in each section:

| Input | Effect |
|---|---|
| `prefers-reduced-motion: reduce` | level `off`; no WebGL, no smooth scroll, instant interactions (current Gilded Seal behaviour) |
| theme `motion: "calm"` | durations × 1.4, parallax amplitude × 0.5, no WebGL cover |
| device policy (`gl/detect`: no WebGL, low memory, coarse pointer rules) | falls back to the template's static path |
| manifest `capabilities.reducedMotion` | `"static"` (frozen end state) or `"calm"` |

Named motion presets (`easings`, `durations`) live in tokens so a Tier 2 block and a Tier 1
section animate with the same vocabulary.

### 7.3.1 Audit of the extracted code (TK-021, decided and done)

| File (was `gilded-seal/…`) | Verdict | Why |
|---|---|---|
| `engine/ease.ts`, `spring.ts`, `ticker.ts` | **moved as is** → `lib/kit/motion/` | pure; no selector or constant tied to a template |
| `engine/engine.ts`, `engine/useEngine.ts` | **moved, with parameters** | `caps()` became `policy()` (the motion policy below); `Engine` takes `{ themeLevel, durationScale }`; nothing else was template-specific |
| `engine/reveals.ts` | **moved as is** | works on any `[data-reveal]` / `data-delay` / `data-reveal-inner` markup; the six kinds are the shared vocabulary |
| `engine/parallax.ts` | **moved as is** | any `[data-speed]` element |
| `engine/stack.ts` | **stays** | the hero → story → date album stack (`[data-stack-*]`, 640 px shrink, .55 shade): bespoke choreography |
| `gl/layer.ts` | **moved**, minus `LAYERS` | `makeLayer`, `VERT`: generic. The per-layer uniforms (`LAYERS`, `LAYER_DPR`, `themedLayers`) stay in `gilded-seal/gl/layers.ts` |
| `gl/detect.ts` | **moved as is** | software-GL and data-saver detection |
| `gl/{cover,coverTextures,shaders}.ts` | **stay** | the envelope scene and the contour/burn shaders |
| `music.ts` | **moved** → `lib/kit/music.ts` + `catalog/music.json` | catalog data |
| `fonts.ts` | **deleted** | `KitFonts` + `catalog/fonts.json` |
| `config.ts` `mapInvite` | **split** | `lib/kit/model` (`buildInviteModel`) + the template's copy and placeholders |
| `derive.ts` | **split** | zone formatting, roman numerals, `mapHref`, heading-override rule and `countdown` moved to `lib/kit/model`; the venue/derived strings stay |

### 7.4 Audio (`catalog/music.json`, `web/public/audio/`)

```json
{ "key": "satie-gymnopedie-1", "title": "Gymnopédie No. 1", "credit": "Erik Satie",
  "src": "/audio/satie-gymnopedie-1.mp3", "license": "public-domain-recording", "durationMs": 187000 }
```

- Replaces `gilded-seal/music.ts`; `invitation_sections.content.track` already stores a key, so no
  data change.
- `useMusic()` owns fade in/out (`MUSIC_VOLUME 0.6`, `1800 ms`), autoplay-policy handling, error
  state, `Media Session` metadata. Templates only render the button.
- **Product dependency:** the audio files are not in the repo yet (the directory is empty). The
  button already degrades to an error state. Someone has to license or record tracks; this is not
  an engineering task.
- Host-uploaded music is a non-goal in v1 (copyright exposure).

### 7.5 Media and assets

Unchanged pipeline: `media` table + `Storage` interface (`Local` in dev, S3-compatible planned),
signed expiring URLs in the public projection. The kit adds:

- Manifest `capabilities.gallery.max` is enforced by the API (today the editor limit and the
  renderer clamp are the only guards).
- A **thumbnail pipeline** (`npm run templates:thumbs`): Playwright opens `/demo/<slug>` at three
  viewports, writes `catalog/templates/<slug>/thumb.webp`. The admin design card and the landing
  card use it. This is what makes the admin/landing preview the *real* template (problem P9).
- Later (not v1): resized image variants for gallery thumbnails; today the original is served.

### 7.6 Section content model and the block library

Section types and their `content` shapes are **template-independent** (docs/15 §4.1). The kit
promotes that table to `catalog/sections.schema.json` (one JSON Schema fragment per type) and
generates TS types and the Go validator from it.

| Type | Content (summary) | Block (Tier 2) variants |
|---|---|---|
| `hero` | `title, line, photo_id` | `arch`, `full-bleed`, `split`, `minimal` |
| `opening` | `title, statement, subtitle` | `centered`, `quote` |
| `story` | `title, body, chapters[], photo_ids[]` | `chapters`, `single`, `timeline` |
| `schedule` | `title, dress_code` + schedule items | `list`, `carousel`, `cards` |
| `gallery` | `title, photos[]` | `grid`, `masonry`, `strip` |
| `gift` | `title, body` + gift methods | `cards`, `list` |
| `rsvp` | `title, body` | `card`, `inline` |
| `wishes` | `title` | `list`, `deck` |
| `music` | `track` | `floating`, `inline` |
| `closing` | `title, body, photo_id` | `arch`, `plain` |

Adding a section type (e.g. `faq`, `accommodation`) = one schema fragment + a Tier 2 block + editor
form generated from the schema. Tier 1 templates opt in by listing it in their manifest.

Tier 2 `layout`:

```jsonc
"layout": [
  { "block": "hero",    "variant": "arch" },
  { "block": "opening", "variant": "centered" },
  { "block": "story",   "variant": "chapters", "visibleWhen": "filled" },
  { "block": "schedule","variant": "cards" },
  { "block": "rsvp",    "variant": "card" }
]
```

`visibleWhen: "filled"` is how a themed template reproduces `hiddenUntilFilled` and the
"hide empty sections on live pages" rule already implemented for Gilded Seal.

### 7.7 Headless behaviours (`web/lib/kit/behaviors`)

Each hook owns state, network and mode handling; the template owns markup.

| Hook | Owns | Mode handling |
|---|---|---|
| `useRsvp(model)` | status, party size, optimistic update, submit, error, persisted state after reload | `live` → API; `preview`/`demo` → local only, nothing sent |
| `useWishes(model)` | list fetch, post, optimistic insert, moderation message, sample wishes in demo | same |
| `useMusic(track)` | audio element, fade, autoplay unlock, error, media session | all |
| `useLightbox(items)` | open index, focus trap, Escape, swipe, restore focus | all |
| `useCountdown(date, tz)` | days/hours/minutes, "already happened" state | all |
| `useGuest(search)` | guest name from the personal link, `?to=` on generic links, 60-char cap | all |

Effect: every template gets the same safe preview/demo behaviour (nothing is ever sent from
preview) and the same a11y semantics for the interactive parts, for free.

### 7.8 Invite model (`web/lib/kit/model`)

`buildInviteModel(invite, { mode, search })` returns the normalised, template-neutral object:
couple names and initials, event instant + zone, per-moment dates formatted with
`Intl.DateTimeFormat(locale, { timeZone })`, heading override rule ("last word in the accent
`<em>`"), guest, RSVP state, gift methods, signed media map, sections-by-type with visibility,
language. Gilded Seal's `mapInvite` becomes `model + template defaults` (copy, placeholder
chapters, 8 gallery frames in preview/demo, §7.2 of docs/15).

---

## 8. Template runtime contract

```ts
// web/lib/kit/manifest.ts
export type TemplateModule = {
  manifest: Manifest;                    // generated, same as catalog JSON
  Component: ComponentType<TemplateProps>;   // Tier 1 only; Tier 2 uses BlockRenderer
};
export type TemplateProps = { invite?: Invite; token?: string; mode: "live" | "preview" | "demo" };
```

- **Registry is generated.** `npm run templates:gen` writes `lib/kit/generated/registry.ts`:
  the server-safe slug list (replaces `LIVE_SLUGS`) and the `slug → dynamic(() => import(...))`
  map (replaces the hand-written `TEMPLATES`). Dynamic imports must be literal for webpack, hence
  codegen, not a glob. `prebuild` runs it; CI checks it is committed.
- **`TemplateHost`** keeps its current role: client-only chunk per template, ivory loading wash.
  The wash colour comes from the manifest `bg`, not a literal.
- **`KitRoot`** wraps every template: CSS variables, `KitFonts`, motion policy, mode context,
  grain/global side effects opt-in, and *cleanup* on unmount (Lenis, GL context, audio).
- **Tier 2** manifests resolve to the shared `BlockRenderer` component; there is no per-slug code.
- **Fallback.** Unknown slug or a failed chunk → the generic `InvitationView` (kept as the last
  resort, restyled with tokens). A guest never sees a blank page.

---

## 9. Data model and migrations

### 9.1 `0016_template_kit` (additive)

```sql
ALTER TABLE templates
  ADD COLUMN kind        text    NOT NULL DEFAULT 'coded' CHECK (kind IN ('coded','themed')),
  ADD COLUMN status      text    NOT NULL DEFAULT 'published' CHECK (status IN ('draft','published','retired')),
  ADD COLUMN access      text    NOT NULL DEFAULT 'free'  CHECK (access IN ('free','premium')),
  ADD COLUMN version     int     NOT NULL DEFAULT 1,
  ADD COLUMN manifest    jsonb   NOT NULL DEFAULT '{}',   -- full manifest (sections, tokens, customizable, layout…)
  ADD COLUMN owner_id    uuid    NULL REFERENCES users(id) ON DELETE CASCADE,   -- NULL = platform template (Tier 3 only)
  ADD COLUMN parent_id   uuid    NULL REFERENCES templates(id) ON DELETE SET NULL,
  ADD COLUMN updated_at  timestamptz NOT NULL DEFAULT now();
CREATE INDEX idx_templates_owner ON templates(owner_id) WHERE owner_id IS NOT NULL;

ALTER TABLE invitations
  ADD COLUMN theme jsonb NOT NULL DEFAULT '{}';   -- {palette?, fontPairing?, motion?, tokens?:{role:#hex}}
```

- `templates.palette/tags/category/name/position/active` stay (existing API and admin read them).
  The sync tool keeps them in step with the manifest; `active` maps to `status`.
- `invitations.palette` stays and keeps working (legacy label). `theme.palette` wins when set.
- `owner_id`, `parent_id` are created now (cheap, nullable) so phase 4 needs no further schema
  change to the catalog, but **nothing writes them before phase 4**.
- Down migration drops the added columns; platform rows are re-created by the sync tool.

### 9.2 Sync tool (`api/cmd/templates`)

```
go run ./cmd/templates validate     # schema + cross-reference rules; CI
go run ./cmd/templates sync         # upsert by slug (platform rows only); refuses breaking changes
go run ./cmd/templates gen-web      # writes web/lib/kit/generated/*
```

`sync` never deletes a row (invitations may reference it): a manifest removed from the repo sets
`status = 'retired'`. Retired templates stay renderable but disappear from pickers.

---

## 10. API changes

All additive; existing fields and status codes are unchanged.

### 10.1 Catalog

`GET /api/v1/templates` (public, cacheable 300 s) gains: `kind, status, access, version, thumbnail,
customizable, capabilities, marketing`. List excludes `retired`, and Tier 3 rows unless
`owner_id = caller`. New `GET /api/v1/templates/{slug}` returns the full manifest (needed by the
generic editor and landing detail page).

### 10.2 Invitation

- `PATCH /events/{id}/invitation` accepts `theme` (object). Validation (400 with a field path):
  palette id ∈ `customizable.palette` (or legacy alias); `fontPairing` ∈ `customizable.fontPairings`;
  `motion` ∈ `customizable.motion`; `tokens` keys ⊆ `customizable.tokens`; hex format; contrast
  rule of §6.4; total size ≤ 2 KB.
- Picking a template (`template_id`) applies the manifest instead of the Go maps: adds missing
  sections from `manifest.sections` (hidden when `hiddenUntilFilled`), same "never remove, order
  only when something was added" rule as `ensureTemplateSections` today. `TemplateSections` and
  `hiddenUntilFilled` in Go are deleted.
- Publish check `MissingRequired` reads `required` from the manifest, falling back to
  `hero`+`rsvp` when the template has none.

### 10.3 Section content validation (closes P8)

`POST/PATCH …/sections` validates `content` against the section's schema fragment (type, max
lengths, array caps, `photo_id` belongs to the event, `track` ∈ catalog, `gallery.photos` ≤
`capabilities.gallery.max`). Unknown keys are **kept** (forward compatibility) but size-capped.
Today only `<>` stripping exists; stripping stays as defence in depth.

### 10.4 Public projection

`GET /invite/{token}` adds `theme` (resolved against validation, never raw trust) and
`template_version`. The explicit allowlist rule (docs/09, `PublicView`) is kept: `theme` is
host-written visual data, safe to expose; nothing else is added.

### 10.5 OpenAPI and docs

`api/openapi.yaml`, `docs/08`, `docs/09`, regenerated `web/lib/api/generated.ts`, as in Lane A of
docs/16.

---

## 11. Admin dashboard

Additive, per the project rule. Four changes:

1. **Design picker reads the catalog** from the API instead of the hard-coded `dl` array, mapping
   by `slug` (not by name). Palette swatches come from `palettes.json`. The 6-index `pals` and
   `PROTO_TO_PALETTE` go away; the stored `palette` value becomes a palette id (legacy labels
   still resolve through `aliases`).
2. **Generic section editor.** Forms for every section type are generated from
   `catalog/sections.schema.json` plus manifest limits. `GsEditor.tsx` stays for its bespoke
   photo tiles until the generic form covers them (TK-045), then is deleted; `isGs` is replaced by
   `manifest.capabilities`.
3. **Theme panel** (new, in the existing Design page): palette swatches, font pairing, accent
   colour (with live contrast warning), motion (Full/Calm). Writes `theme`. Only the controls the
   manifest lists in `customizable` are rendered, so a template with nothing customisable shows
   no panel.
4. **Real thumbnails.** Design cards and the invitation preview use `thumb.webp` and the real
   `/preview/{eventId}` render. This also fixes problem P9 on the admin side.

---

## 12. Landing page

1. `TEMPLATES` in `landing/data.ts` is generated from the manifests' `marketing` block plus the
   thumbnail. The 15 marketing slugs are reconciled with the DB catalog: either each becomes a
   manifest (Tier 2 for the 14 prototype designs) or is explicitly marked marketing-only. That
   reconciliation is a **product decision** (§18.3), not an engineering one.
2. `live` is derived (`kind` with a renderer), not hand-set.
3. Card and detail hero use the thumbnail/real demo (fixes P9 on the landing side). The phone
   mock stays only for entries without a renderer.

---

## 13. Host-made templates (Tier 3), designed now, built last

### 13.1 What a host can do

- Start from a Tier 2 template ("Duplicate and edit"). A fork is a `templates` row with
  `owner_id`, `parent_id`, `kind: "themed"`, its own `manifest.layout` and `theme` defaults.
- Reorder and hide blocks, pick a **variant** per block, pick palette/font pairing/accent/motion
  from the platform libraries (the same guardrails as §6.4).
- Reuse the fork on their other events. Not visible to other users.

### 13.2 What a host cannot do

HTML, CSS, JS, SVG upload, custom fonts, custom audio, custom block types.

### 13.3 Editor

A block list with drag handle, variant dropdown and a live preview iframe of
`/preview/{eventId}`. State is the `layout` array; save = `PATCH /templates/{id}` with the whole
layout. No canvas, no free positioning.

### 13.4 Why not free-form

| Risk | Free-form HTML/CSS/JS | Fixed blocks + tokens |
|---|---|---|
| XSS on a page guests open from a private link | real | none: no markup from hosts |
| Performance (LCP, CLS, bundle) | unbounded | each block is budgeted and tested |
| Accessibility (contrast, focus, reduced motion) | host's burden | enforced by tokens and shared tests |
| Support load | high | low |
| Moderation | needed | not needed (only existing text fields) |

### 13.5 Guardrails

- Layout validated server-side against the block registry JSON Schema (known blocks, known
  variants, ≤ 20 blocks, required sections present).
- `GET /templates` filters by owner; the public projection returns the resolved layout for *that
  invitation's* template only.
- Rate limit and per-user cap (e.g. 10 forks).
- Entitlement: tied to the "Premium themes" add-on if the product wants it (decision, §18.3).

---

## 14. Third party vs ours

| Asset | Decision | Reason |
|---|---|---|
| Fonts | **Ours.** Static OFL woff2 under `public/fonts`, `font-display: swap` | no Google Fonts runtime call (privacy, one fewer DNS+TLS, no metric drift: docs/15 §7.5); we already ship exactly these files |
| Colour/palette data | **Ours.** JSON in `catalog/` | tiny, versioned with code |
| Motion code | **Ours** on top of `three` and `lenis` (npm, bundled) | already the case |
| Audio | **Ours.** Curated, licensed tracks served from our origin/CDN | host-uploaded music = copyright exposure; streaming embeds (Spotify/YouTube) need consent banners and break autoplay rules |
| Host images | **Ours via `Storage`.** S3-compatible object store (R2, S3, MinIO) is the one third-party *infrastructure* dependency; CDN in front for the public gallery | already designed (`Storage` interface, docs/10) |
| Host custom fonts / code | **Not offered** | §13.4 |
| Template thumbnails | **Ours.** Generated by Playwright from the real demo | exact, never stale |

Rule of thumb: a guest's browser should talk to our origin (and our CDN alias) only, apart from
links the host chose to put on the page (maps, bank links).

---

## 15. Migrating Gilded Seal onto the kit (parity guard)

Order matters; each step is behaviour-neutral and verified by existing gates:

1. Add manifest + generated registry; `TemplateHost`/`registry.ts` read it. (No pixel change.)
2. Move `engine/*` (generic subset) and `gl/{layer,detect}` to `lib/kit`. Fix every import in the same commit (no re-export shims): the tree is small and the
   type checker plus the existing tests catch a miss.
3. Move font files to `public/fonts`, swap `next/font/local` for `KitFonts` **in the same commit
   as the parity run**, because metrics are the risk.
4. Introduce `KitRoot` + token variables with defaults equal to today's literals; replace literals
   for the §6.5 roles only.
5. Split `mapInvite` into `model` + defaults; extract behaviour hooks section by section
   (RSVP, wishes, music, lightbox, countdown), one commit each.

**Exit criteria for the migration:** unit (141) + e2e `gilded-seal` (33 × 3 projects) green;
`gilded-seal-parity` (`GS_PARITY=1`) shows no new diff beyond the documented ones in
docs/15 §13.5; Lighthouse budgets of docs/15 §13.4 not worse (CLS ≤ 0.01, JS gz not larger by
more than 3 KB).

---

## 16. Quality gates (every template, every tier)

A **template contract suite** (`web/tests/template-contract.spec.ts` + e2e) runs against every
manifest in `catalog/` automatically:

| Check | How |
|---|---|
| Manifest valid, cross-references resolve | `go run ./cmd/templates validate` |
| Renders in `demo` and `preview` without console errors | Playwright, per template |
| Sends no network write in `preview` and `demo` | request interception |
| Reduced motion: no WebGL context, no running animations after settle | existing assertions generalised |
| Keyboard: every control reachable, focus visible, no trap | generalised from `gilded-seal-a11y` |
| Touch targets ≥ 44 px | generalised |
| axe: no serious/critical | generalised |
| No horizontal scroll at 375 / 768 / 1280 | generalised |
| CLS ≤ 0.01, own chunk gz within manifest `budget` | Lighthouse CI per demo route |
| Contrast pairs of default tokens and **every listed palette** ≥ 4.5:1 | unit test over `palettes.json` |
| Theme override (palette + accent + calm) renders and keeps contrast | one e2e per template |

A new template that cannot pass this suite does not ship. This is the mechanism that keeps
"many templates" from becoming "many different quality levels".

---

## 17. How to add a template (the payoff)

**Verified** by following it once with a throwaway coded template (`kit-demo`: a copy of the Gilded Seal manifest
with two sections and a 20-line renderer): 2 minutes 36 seconds from the first file to a green contract run
(32 tests: desktop, tablet, mobile), most of it two `next build`s. The only test edit it needed was making the
contract's "open the cover" step optional for a template without a cover. The throwaway was then deleted.

**Tier 1 (coded)**, a renderer plus a manifest:

1. `catalog/templates/<slug>/manifest.json`: copy `gilded-seal`'s, change `slug`, `name`, `position`, `renderer`
   (`<slug>/<Component>`), `marketing` (with `demo.route` = `/demo/<slug>`), `sections` (what the renderer shows;
   `required` ones must be visible to publish), `tokens` (every colour role; the text pairs must reach 4.5:1) and
   `customizable` (leave the lists empty until the renderer reads the tokens it exposes).
2. `web/components/templates/<slug>/<Component>.tsx`, default-exporting a `TemplateProps` component:
   - the root element carries `data-template="<slug>"`; the sections have `id`s (the contract scrolls to them);
   - colours and fonts come from the kit: `var(--k-bg)`, `var(--k-ink)`, `var(--k-accent)`… and
     `useTheme().fonts`; RSVP, wishes, music, lightbox, countdown from `lib/kit/behaviors`; the invitation as
     `buildInviteModel(invite, mode)` from `lib/kit/model`; motion from `lib/kit/motion` and `useMotionPolicy()`;
   - controls are at least 44 px and show a focus indicator; reduced motion shows a still page.
3. `make templates` (validate → sync → regenerate `web/lib/kit/generated/`). A coded manifest without its renderer
   file fails validation. Commit the manifest, the renderer and the generated files.
4. `E2E_WEB_URL=… npm run templates:thumbs <slug>` writes the two thumbnails the admin and the landing show
   (commit them). `npm run test:e2e -- template-contract` runs the contract against every manifest, yours included.
   Add a spec of your own only for interactions that are specific to the template.

**Tier 2 (themed)** needs the block library (phase 3); it is the same steps with `"kind": "themed"` and a `layout`,
and no renderer.

Files touched outside the template's own folders: **zero** (the generated files and the thumbnails are outputs).

**Second real template: We Do** (`catalog/templates/we-do`, `web/components/templates/we-do`), a monochrome, story-first
design from a single-file HTML mock (`docs/undangan-we-do.html`). Following the steps above it needed, outside its own
folders, only: the libraries it introduces (three fonts and one pairing in `catalog/fonts.json` + `web/public/fonts/`, the
`noir-gold` palette in `catalog/palettes.json`), one `RAW_TEMPLATES` entry in `web/components/landing/data.ts` (the phone-mock
fallback card still needs hand-written colours), and the two tests that counted the catalog. Everything else (landing card,
`/demo/we-do`, admin picker and theme panel, contract suite) came from the manifest. The mock's built-in WebAudio melody and
its non-working shuffle/previous/next buttons were not ported: music is the catalog track the host picks (`useMusic`).

---

## 18. Roadmap, risks, decisions

### 18.1 Phases

| Phase | Content | Size | Value | Build when |
|---|---|---|---|---|
| **1 Core** | Manifest, schema, sync, codegen registry, catalog unification (admin by slug), palettes + fonts + music catalogs, `KitRoot`/tokens, thumbnails, Go maps removed, section validation | L | Fixes P1–P5, P8, P9 | now |
| **2 Extract** | Motion/GL move, model split, behaviour hooks, generic section editor, contract test suite | L | Fixes P6, P7; makes template #2 cheap | with template #2 |
| **3 Themed** | Block library, `BlockRenderer`, the 8 catalog rows get layouts, `InvitationView` retired to fallback | L | Real looks for the 8 empty rows without 8 renderers | when product wants those rows live |
| **4 Host-made** | Fork/edit/layout API, block editor, per-user caps | L | "Users create their own" | when product commits to it |

Phase 1 alone answers most of the original concerns. **Recommendation: do phase 1 now, and take
phase 2 as the first part of template #2**, so the extraction is driven by a real second consumer
and the kit is not designed in a vacuum (principle 3).

### 18.2 Risks

| Risk | Mitigation |
|---|---|
| Tokenising Gilded Seal changes pixels | bounded scope (§6.5), parity spec in the gate, defaults equal current literals |
| Font swap shifts metrics | same woff2 files, `KitFonts` swap lands with a parity run (§15 step 3) |
| Manifest becomes a dumping ground | schema rejects unknown keys; new key = schema change reviewed |
| Two sources of truth (file + DB) | one-way sync, DB row is derived; CI fails on a stale generated registry |
| Over-building Tiers 2/3 before they are needed | phases 3–4 are gated on a product decision; nothing in phases 1–2 depends on them except nullable columns |
| Contrast validation too strict for artistic palettes | rule is AA 4.5:1 for text roles only; decorative roles are exempt |

### 18.3 Decisions needed from the product owner

1. **Marketing slugs vs DB catalog.** The landing shows 14 designs that are not templates yet
   (`serenity`, `arunika`, …). Which become real templates (Tier 2), which stay marketing-only, and
   which are dropped? This decides the size of phase 3.
2. **Premium templates.** Is `access: "premium"` tied to the "Premium themes" add-on, or is
   everything free for now?
3. **Music.** Who supplies licensed tracks and how many? (The one current track has no audio file.)
4. **Host-made templates.** Is phase 4 on the roadmap, and should it be a paid capability?
5. **Languages.** `capabilities.languages` currently lists `en`, `id`. Is `ms` (the admin already
   has it) required for templates?

### 18.4 Out of scope, recorded for later

Resized image variants, per-template analytics, A/B of themes, import of external invitation
designs, a public template marketplace (would reopen the XSS question of §13.4).
