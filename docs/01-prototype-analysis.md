# 01 — Prototype Analysis

Reverse engineering of the two Claude Design prototypes that are the visual source of truth.

- `docs/landing-page-prototype/` — public marketing site.
- `docs/dashboard-admin-prototype/` — authenticated host dashboard ("app").

Both are static HTML (`*.dc.html` component files + full-page `*.html`) plus shared JavaScript. The dashboard HTML uses `{{ … }}` mustache-style bindings against mock data (an Alpine-style runtime), confirming most of its content is intended to become dynamic. Theme (light/dark) is persisted in `localStorage` and applied via `data-theme` on the root.

---

## Repository inspection (Phase 0 findings)

| Area | Finding |
| --- | --- |
| Prototype HTML files | Landing: `Mula Home.html` (full page, 5.1 MB incl. inlined assets) + component files (`Home`, `Features`, `Pricing`, `Templates`, `Template`, `Inspiration`, `Tips`, `InviteScreen`, `MulaNav`, `MulaFooter`). Dashboard: `Mula Admin.html` + `Mula Admin.dc.html` (v1), `Mula Admin v2.dc.html`, `Mula Admin v3.dc.html` (newest, 1,690 lines). |
| Shared JS | `mula-core.js` (72 KB — component/runtime + data), `mula-fx.js` (motion layer), `mula-3d.js` (three.js invitation object), `support.js` (shared helper, present in both prototypes). |
| Libraries | three.js `0.160.0` (loaded from unpkg in prototype), otherwise no framework — hand-written runtime. Fonts **Newsreader** (serif/display) and **Instrument Sans** (body). |
| Animation | Custom motion layer (`mula-fx.js`): film grain, custom cursor, page transitions, scroll reveals, magnetic buttons, tilt, section colour grading. |
| 3D | `mula-3d.js` builds a gold-foil paper invitation card as a WebGL mesh with procedurally generated colour/ORM/bump/mask textures (paper fibre noise + gold gradient). |
| Mock data / API | No network calls. Dashboard binds `{{ }}` placeholders to in-file mock data; landing is static copy. |
| Shared components | `MulaNav`, `MulaFooter`, logo lockups, button/input/chip/modal/skeleton primitives (recovered as `ds_*` CSS-module classes in the prior build). |
| Design tokens | Full light + dark token set defined as CSS custom properties in the prototype `:root` (see `03-design-system.md`). Shared across both prototypes. |

The `web/` directory contains an earlier Next.js 14 build output (`web/.next`) whose source has since been removed. The build fossil (route manifests, compiled CSS modules, dependency list) is used here as corroborating evidence for routes and the frontend stack; it is **not** the design source of truth — the prototypes are.

---

## Landing page

### Page structure & sections
Single-page marketing site with in-page anchor navigation plus standalone sub-pages:
- **Hero** — two-column on desktop (`min-width:900px`), copy + the 3D invitation object (`mountInvitation(canvas, { mode:'hero' })`). CTA routes to the app (`#app` in prototype → `/register` / `/app` in production).
- **How it works** (`#how`).
- **Features** — feature showcase.
- **Templates** — filterable template gallery; each card links to a template detail page.
- **Inspiration** — editorial gallery.
- **Tips** — article list + article detail.
- **Pricing** — plan tiers.
- **Footer** (`MulaFooter`) — links, legal, brand lockup.

### Navigation
Sticky, blurred header (`backdrop-filter:blur(8px)`), translucent background. Includes a "Skip to content" (`#main`) accessibility link. Primary CTAs point into the app.

### Motion / 3D (high level, detailed in `04`)
- 3D invitation card in hero (and a floating variant elsewhere), three.js.
- Film grain overlay, custom cursor (fine-pointer only), magnetic buttons, element tilt, scroll-triggered reveals, section colour grading, page transitions.
- All effects respect `prefers-reduced-motion` and disable on coarse pointers.

### Responsive
Hero collapses to single column below 900px. Grids use `repeat(auto-fill, minmax(14rem, 1fr))`. Section padding `3rem 1.25rem`, max width `72rem`.

### Typography / colour / gradients
Display: Newsreader serif, `clamp(1.75rem, 4vw, 2.5rem)`. Body: Instrument Sans. Ivory background, ink text, taupe accent. Gold gradient reserved for the 3D foil card.

### Forms / auth entry points
Landing itself has no data-collection forms beyond CTAs. Auth entry points: header "Log in" / "Get started" → `/login`, `/register`.

---

## Admin dashboard ("app")

### Routes / pages (recovered)
`overview, guests, design, schedule, tasks, team, checkin, eventday, live, gift, memories, print, packages, addons, billing, settings, onboarding` (all under `/app/*`). These map directly to the product ideas in `dashboard-admin-prototype/Mula v2 — Review & Ideas.md`.

### Shell
- **Sidebar** — brand lockup (→ overview), celebration switcher ("Switch celebration" — multi-event), grouped navigation organised by what the host is doing (not by system module), active item marked with the brand **dot**.
- **Topbar** — search, "Working on this now", Mula AI assistant, light/dark toggle, updates, language switcher, profile menu, "Open invitation preview".

### Signature dashboard sections
- **Readiness Arch** — single readiness score from nine parts (invitation, guests, RSVP, schedule, gift, seating, check-in, live stream, final checks); animated arch meter; each part links to its fix.
- **Mula Notes** — plain-language event-assistant suggestions with one-tap actions.
- **Guest journey** — Sent → Opened → Replied → Reminder → Event day → Thank you, with counts and arched connectors.
- **Smart segments** — Not opened / Opened·no reply / VIP / Plus-ones / Needs follow-up, each with an action.
- **Event timeline** — today → event → after; completed tasks land on the line.

### Feature pages
- **Guests** — searchable/sortable list, selection, groups, segments, per-guest actions.
- **Design** — invitation editor: section list, palette picker, content language, per-section toggles, template chooser, live preview.
- **Schedule** — event timeline, reorder (move earlier/later), add-to-calendar.
- **Tasks** — todo list with priority, done/undone, add/remove, `done of total` counter.
- **Team** — co-host / planner / family / usher roles, presence, activity.
- **Check-in / Event day / Live** — operational/immersive modes: arrivals, ushers, stream status, alerts, rehearsal simulation.
- **Gift** — registry / transactions.
- **Memories** — wishes now; photos + attendance after the event.
- **Print** — printable outputs.
- **Packages / Add-ons / Billing** — subscription, purchases, referral.
- **Settings** — subsections `appearance, language, notifications, profile, security, purchases, referral`.
- **Onboarding** — live onboarding: invitation builds itself as the host answers; wording adapts to event type.

### Dynamic vs static
Nearly all dashboard content is dynamic (bound via `{{ }}`). Static: labels, section scaffolding, legal/marketing copy. Dynamic data is enumerated in `06-ui-data-requirements.md`.

---

## Open questions / assumptions

- **ASSUMPTION:** The three dashboard prototype versions supersede one another; **v3 is authoritative**. v1/v2 and the review markdown are treated as history/rationale.
- **ASSUMPTION:** `#app` / `#*` anchors in the landing prototype become real app routes in production.
- **OPEN QUESTION:** Delivery/open tracking (Sent/Opened) requires the backend to record invitation views. If unavailable at launch, those states are hidden (per the review doc). Resolved in `07`/`08` as a first-class capability.
- **OPEN QUESTION:** "Mula AI" assistant scope (suggestions only vs. generative). Treated as server-generated suggestions for v1; see `06`.
