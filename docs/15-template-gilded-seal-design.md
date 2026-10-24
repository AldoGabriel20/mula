# 15 — Template "Gilded Seal": System Design

Production design for porting `docs/mula-sample-template-prototype/Mula Wedding Invitation v3.dc.html`
into Mula as a selectable invitation template, wired to the existing database, guest API, admin
dashboard and landing page.

Companion task plan: `docs/16-template-gilded-seal-tasks.md`.

> **Name.** The prototype has no product name. This doc uses **Gilded Seal** / slug `gilded-seal`,
> after its wax-seal envelope opening and gilded date ring. The name lives in one migration row
> (`templates`), one landing entry (`components/landing/data.ts`), one admin catalog row
> (`components/admin/logic.ts`) and the registry key. Rename those four places before GS-001 merges
> if product picks another name.

---

## 0. Scope and non-goals

**In scope**

- Render a published invitation whose `invitations.template_id` points at `gilded-seal` with the
  full prototype experience: loading veil, three.js envelope cover, layered CSS-3D hero, album
  stack, scroll-scrubbed statement, gilded ring countdown, 3D event carousel, venue slider, 3D
  gallery corridor, gift card, flipping RSVP card, wishes deck, closing, music, lightbox.
- Real data: couple names, date, timezone, moments (schedule), venues, photos, gift methods,
  RSVP (personal link), wishes (list + post), music track, guest name.
- Admin: pick the template, fill the content the template reads, preview the draft.
- Landing: list the template in `/templates`, detail page, and a live, full-screen demo.

**Non-goals (v1)**

- No redesign of the admin dashboard or landing page. Only additive fields/entries.
- No visual editor for template-specific layout (template is art-directed, palette is fixed).
- No custom audio upload (curated track catalog only — see §7.9).
- No translation of the template's fixed UI copy (English, as in the prototype). Dates follow
  `invitations.content_language` (`en` → `en-GB`, `id` → `id-ID`).
- No OG/share image, no "Add to calendar" button (neither exists in the prototype).

---

## 1. Prototype inventory (source of truth for the experience)

File: `Mula Wedding Invitation v3.dc.html` (1 868 lines). Structure:

| Part | Lines (proto) | What it is |
|---|---|---|
| `<helmet>` | 11–32 | Google Fonts (Cormorant Garamond 300/400/500 + italics, Manrope 400/500/600, Pinyon Script), global CSS (selection, focus ring, Lenis classes, reduced-motion) |
| Markup | 33–606 | `dc` template language: `{{ }}` bindings, `<sc-if>`, `<sc-for>`, `style-hover`, `style-focus`, `<image-slot>` |
| Logic | 608–1866 | One class `Component extends DCLogic` (React class component underneath) |

`support.js` (dc runtime) and `image-slot.js` (design-tool photo placeholder) are **not** ported.
`uploads/claude_agent_prompt.txt` is unrelated (another project) — ignore it.

### 1.1 Section order (DOM order = guest scroll order)

```
fixed  grain overlay            z 300   (SVG fractal noise, opacity .8, pointer-events none)
fixed  Loading veil             z 220   (unmounts after lift)
fixed  Opening cover            z 100   (three.js canvas + DOM layer; unmounts after open)
main#invitation (inert until opened)
  div.stack (bg #231D18)
    L1 sticky z0   Hero                 100svh  — layered CSS-3D world
    L2 sticky z10  Opening statement    100svh  — scroll-scrubbed words
    L3 sticky z20  Our story            auto
    z30 (not sticky) Save the date      auto    — gilded ring + countdown
  #details    The celebration (event carousel + dress code)
  #venue      The venue (photo slider + info card)
  #gallery    Gallery (460svh, sticky 3D corridor)
  #gift       Wedding gift (only when an account exists)
  #rsvp       RSVP card (flips on success)
  #wishes     Kind words (deck + composer)
  closing     Closing + footer
fixed  Music button             z 90
fixed  Lightbox                 z 400
```

### 1.2 Prototype configuration surface (`WEDDING_CONFIG` + props)

| Key | Default | Production source (§5) |
|---|---|---|
| `partnerOne`, `partnerTwo` | Adrian, Isabella | `events.couple_a`, `events.couple_b` |
| `weddingDate` | `2027-06-12T10:00:00+07:00` | `events.event_date` + `events.timezone` (new) |
| `guestName` | Our Beloved Guest | personal link → `guest.name`; generic link → `?to=` (≤60 chars) → default |
| `openingTitle`, `openingSubtitle`, `statement` | see proto | section `opening` content |
| `heroLine` | see proto | section `hero.line` |
| `story`, `chapters[]` | see proto | section `story.body`, `story.chapters` |
| `events[]` (label, title, date, time, endTime, description, venue, address, mapUrl, venueNote) | 2 events | `schedule_items` (+ new cols `label`, `map_url`, `venue_note`, `media_id`) |
| `dressCode` | Formal attire | `schedule` section `dress_code` override → first non-empty `schedule_items.dress_code` |
| `locationUrl` | "" | not ported (per-moment `map_url` covers it) |
| `gift.{bankName,accountName,accountNumber,note}` | empty | `gift_methods` (type bank/wallet) + section `gift.body` |
| `rsvpBy` | "" | `invitations.rsvp_deadline` |
| `maxGuests` | 4 | `guest.max_party` (1 + `guests.plus_ones`) |
| `rsvpEndpoint` | "" (preview mode) | `POST /api/v1/invite/{token}/rsvp` |
| `wishes.endpoint` | "" (preview mode) | `GET/POST /api/v1/invite/{token}/wishes` (§6.3) |
| `wishes.samples` | 4 samples | demo mode only |
| `music` | `music/wedding-music.mp3` | section `music.track` → curated catalog |
| `closingMessage` | see proto | section `closing.body` |
| `galleryAlts[8]` | see proto | section `gallery.photos[].alt` |
| prop `introSpeed` | cinematic | constant `cinematic` (k = 1). `brisk` (k = .62) kept as code constant for QA |
| prop `sampleWishes` | true | demo mode only |

Photo slots (`<image-slot id>`): `hero-couple`, `story-1`, `story-2`, `event-{n}`, `venue-photo` /
`venue-{n}`, `gallery-1..8`, `closing-photo`. All map to `media` rows (§5.3).

### 1.3 Prototype states and copy that must survive the port

- RSVP status machine: `idle → sending → sent | error`, plus `demo` (preview). Final copy comes from
  `extraVals()` (it overrides `renderVals()` because it is spread last): submit label
  `Send my reply` / `Sending your reply…`; done text yes → `We cannot wait to celebrate with you[, all N of you].`;
  no → `We will miss you on the day, and we are grateful for your kind reply.`
- Wish status: `idle | sending | sent | local | error`, messages in `extraVals().wishMsg`.
- Wishes viewer: `loading | error (Try again) | empty | any`.
- Music: `idle | loading | playing | paused | error`; never auto-resumes after an explicit pause;
  pauses on `visibilitychange` hidden and resumes only if it paused it.
- Countdown: `running` vs `ended` (`The celebration has begun…` / `The date will be announced soon.`).
- Cover: WebGL path, software-GL/three-failure fallback card, 10 s failsafe.

---

## 2. Current system touchpoints (as built today)

| Area | Today | Gap for this template |
|---|---|---|
| `templates` table (`0014_ui_alignment`) | 8 catalog rows, `invitations.template_id` FK | add `gilded-seal` row |
| `invitations` + `invitation_sections` (jsonb `content`) | default sections `hero, story, schedule, gift, rsvp` | template needs `opening, gallery, wishes, music, closing` too |
| `events` | `event_date timestamptz`, no timezone | dates render in UTC today (`InvitationView` uses `timeZone:"UTC"`) → wrong day/hour for WIB guests near midnight. Add `events.timezone` |
| `schedule_items` | title, starts/ends, venue, address, dress_code, description, visibility | no label, map link, venue note, photo. **Not exposed on the public page at all** |
| `media` + signed URLs | upload/strip EXIF, `/api/v1/media/{id}/file?sig=` (TTL 15 min) | public page has no way to reference/sign photos |
| `wishes` | public POST only (201, no body); host list + approve | no public list; POST returns nothing to prepend |
| `rsvps` | personal link only; party ≤ 1+plus_ones; note ≤ 300 | fits; template must adapt (note 300, name read-only) |
| `gift_methods` | bank/wallet/physical, `title/detail/copy_value` | fits (title = bank, detail = account name, copy_value = number) |
| Public API `GET /api/v1/invite/{token}` | DTO without template slug, timezone, schedule, media | extend (additive) |
| `web/app/invite/[token]/page.tsx` | always `InvitationView` (generic card) | switch on template slug |
| Admin `/app/design` | catalog hardcoded in `logic.ts` (`dl`), `useDesign` maps name → `templatesRaw` id and PATCHes `template_id` | add one row |
| Admin `/app/invitations/edit` | sections nav `cover, main, story, events, gallery, rsvp, wishes, gift, live, music, closing`; API-backed only for `cover/story/events/rsvp/gift` (`SEC` map in `patch.ts`); gallery "Upload photos" is a toast; "Replace cover photo" is inert | wire remaining sections + photo fields |
| Admin `/app/schedule` | edit form has an **unwired** "Map link" input | wire it, add label/note/photo |
| Landing `/templates`, `/templates/[slug]` | static `TEMPLATES` in `components/landing/data.ts`; preview = phone mock modal | add entry + link to live demo |
| `next.config.js` | `X-Frame-Options: DENY` | previews open in a new tab, never in an iframe |
| Root layout | global `<Grain/>` overlay on every route | template has its own grain → hide the global one on this template |
| Deps | `three@^0.186` installed, no Lenis | add `lenis` (pinned) |

---

## 3. Architecture overview

```
                        ┌──────────────────────── Next.js (web/) ────────────────────────┐
 Guest (WhatsApp link)  │ app/invite/[token]/page.tsx  (RSC, force-dynamic, noindex)      │
 ─────────────────────▶ │   fetchInvite(token) ──▶ Invite (+template,+timezone,+schedule, │
                        │                              +media,+preview)                   │
                        │   registry[invite.template] ?? InvitationView                   │
                        │        │                                                        │
                        │        ▼  next/dynamic (code-split per template)                │
                        │ components/templates/gilded-seal/GildedSeal.tsx  ("use client") │
                        │   mapInvite(invite) ─▶ WeddingConfig (same shape as prototype)  │
                        │   Engine (one rAF ticker + Lenis) ─▶ sections / WebGL layers     │
                        │   three.js cover (dynamic import, disposed after open)          │
                        │                                                                 │
 Marketing visitor ───▶ │ app/demo/[slug]/page.tsx  ─▶ same component, mode="demo",      │
                        │                               DEMO_CONFIG, nothing is sent       │
 Host (dashboard) ────▶ │ app/preview/[eventId]/page.tsx ─▶ mode="preview", draft data    │
                        └──────────────┬──────────────────────────────────────────────────┘
                                       │ /api/v1/* (Next rewrite, same origin)
                        ┌──────────────▼────────────── Go API (api/) ────────────────────┐
                        │ GET  /invite/{token}            publicinvite.Get  (+sign media) │
                        │ POST /invite/{token}/rsvp       publicinvite.RSVP               │
                        │ GET  /invite/{token}/wishes     publicinvite.Wishes   (NEW)     │
                        │ POST /invite/{token}/wish(es)   publicinvite.Wish (returns item)│
                        │ GET  /events/{id}/invitation/preview  (NEW, member)             │
                        │ GET  /media/{mid}/file?sig=     signed blob (existing)          │
                        └──────────────┬──────────────────────────────────────────────────┘
                                       ▼
                         Postgres: events(+timezone) · invitations · invitation_sections
                         schedule_items(+label,map_url,venue_note,media_id) · media
                         guests · rsvps · wishes · gift_methods · templates(+gilded-seal)
```

Principles:

1. **Backend stays template-agnostic.** It exposes data (sections, moments, media, methods,
   wishes). Only two template-aware bits exist: the template's section set (§5.2) and the catalog
   row. Everything visual is frontend.
2. **One renderer, three modes.** `live` (guest token), `preview` (host draft, nothing sent),
   `demo` (landing, prototype defaults, nothing sent). The prototype already has "preview mode"
   semantics when endpoints are empty — we keep them.
3. **Port the prototype logic, not reinvent it.** Numbers, easings, timelines and shaders are
   copied verbatim (§8). Structure is split by section so each task is reviewable.
4. **Additive changes only** to DB, API, admin and landing. No breaking DTO changes.

---

## 4. Database design

One additive migration: `api/migrations/0015_gilded_seal.up.sql` / `.down.sql`.

```sql
-- 0015 — Gilded Seal template support. All additive.

-- Local wall-clock for every date the invitation prints (moments are stored as instants).
ALTER TABLE events ADD COLUMN timezone text NOT NULL DEFAULT 'Asia/Jakarta';

-- Moment details the template prints.
ALTER TABLE schedule_items
  ADD COLUMN label      text NOT NULL DEFAULT '',   -- eyebrow, e.g. "The Ceremony"
  ADD COLUMN map_url    text NOT NULL DEFAULT '',   -- exact maps link (https only, validated in app)
  ADD COLUMN venue_note text NOT NULL DEFAULT '',   -- short location description
  ADD COLUMN media_id   uuid REFERENCES media(id) ON DELETE SET NULL; -- moment photo

INSERT INTO templates (slug, name, category, tags, palette, position)
VALUES ('gilded-seal', 'Gilded Seal', 'Wedding', 'Elegant · Cinematic', 'Ivory', 8)
ON CONFLICT (slug) DO NOTHING;
```

Down:

```sql
DELETE FROM templates WHERE slug = 'gilded-seal';   -- invitations.template_id → NULL (FK SET NULL)
ALTER TABLE schedule_items DROP COLUMN media_id, DROP COLUMN venue_note, DROP COLUMN map_url, DROP COLUMN label;
ALTER TABLE events DROP COLUMN timezone;
```

Notes:

- `events.timezone` default `Asia/Jakarta` matches the market (IDR pricing, WIB). Validated with
  `time.LoadLocation` on create/patch. Existing rows get the default.
- No index changes: public wishes paginate on the existing `idx_wishes_event (event_id, created_at DESC)`
  with `id` as tie-breaker.
- No jsonb schema constraint on `invitation_sections.content` (current convention). Read-time
  clamping in the renderer + read-time media ownership check (§6.2) keep it safe.

### 4.1 Section content schemas (`invitation_sections.content`, per `type`)

The existing editor already writes `title` (heading) and `body` (text) for generic sections, and
`title`/`line` for `hero`. Schemas reuse those keys so today's editor keeps working.

| `type` | Keys (all optional) | Limits (renderer clamps) | Template use |
|---|---|---|---|
| `hero` | `title` (eyebrow), `line`, `photo_id` | line ≤160 | Cover/hero eyebrow "The Wedding Of", hero line, couple portrait |
| `opening` **new** | `title`, `statement`, `subtitle` | statement ≤90 (≈12 words) | Statement section + 3D card text |
| `story` | `title`, `body`, `chapters:[{title,text}]`, `photo_ids:[id,id]` | body ≤1200, ≤5 chapters, title ≤40, text ≤120 | Our Story |
| `schedule` | `title`, `dress_code` | dress ≤60 | Celebration heading override, dress code override |
| `gallery` **new** | `title`, `photos:[{id,alt}]` | ≤12 photos, alt ≤80 | 3D corridor |
| `gift` | `title`, `body` | body ≤300 | Gift note |
| `rsvp` | `title`, `body` | body ≤200 | RSVP heading/intro override (default uses deadline) |
| `wishes` **new** | `title` | — | visibility toggle |
| `music` **new** | `track` | catalog key | background music |
| `closing` **new** | `title`, `body`, `photo_id` | body ≤200 | Closing message + arch photo |

Heading override rule (`title`): when set, render it as the h2 with its **last word** wrapped in
the template's `<em>` accent (e.g. "How it began" → `How it <em>began</em>`). Empty → prototype
default heading.

---

## 5. Backend design

### 5.1 Event timezone

- `domain/event.Event.Timezone string`; create/patch accept `timezone` (IANA). Invalid → 400
  `{"timezone":"unknown time zone"}`. Default on create: request value or `Asia/Jakarta`.
- Admin onboarding sends `Intl.DateTimeFormat().resolvedOptions().timeZone` (one field in
  `patch.ts` `obNext`).

### 5.2 Template section set

`application/invitation`:

```go
// TemplateSections lists the section types a template renders. Picking a template adds the
// missing ones (visible, empty content) so the editor shows them; nothing is ever removed.
var TemplateSections = map[string][]string{
    "gilded-seal": {"hero", "opening", "story", "schedule", "gallery", "gift", "rsvp", "wishes", "music", "closing"},
}
```

`Service.Update`: when `TemplateID` changes, resolve the slug (repo `TemplateSlug(ctx, id)`), and
`AddSection` each missing type at the end. Idempotent. Positions keep the template order
(`Reorder` once after adding, using the slice above, unknown/extra sections appended).

Visibility defaults: `gallery`, `music` start **hidden** until content exists (the editor already
tells hosts "Guests won’t see this section until it has photos"); the renderer additionally hides
any section whose essential content is missing (§7.2).

### 5.3 Schedule extras

- `domain/schedule.Item` gains `Label, MapURL, VenueNote string; MediaID *string`.
- Validation in `scheduleFields`: `label ≤ 40`, `venue_note ≤ 160`, `map_url` empty or
  `^https://` and ≤ 500 (blocks `javascript:` hrefs), `media_id` must be a media row of the same
  event (`repo.MediaBelongs(ctx, eventID, id)` → else 400).
- Admin and API DTO expose the four fields.

### 5.4 Public page projection (extends `GET /api/v1/invite/{token}`)

`domain/invitation.PublicView` gains `Template *string`, `Timezone string`;
`PublicPage` gains `Schedule []PublicMoment`, `Media map[string]string`, `Preview bool`.

```go
type PublicMoment struct {
    Label, Title, Address, MapURL, VenueNote, DressCode, Description string
    Venue            *string
    StartsAt, EndsAt *time.Time
    PhotoID          *string
}
```

Repo `Page()` additions (same transaction-free style as today):

1. Join `templates` for the slug: `LEFT JOIN templates t ON t.id = i.template_id` → `t.slug`.
2. Select `e.timezone`.
3. Moments — only when a visible `schedule` section exists:
   `WHERE event_id=$1 AND visibility = ANY($2) ORDER BY position`, where `$2` =
   `{everyone}` on the generic link and `{everyone, invite_only}` on a personal link.
   `family_only` is never public in v1 (no family↔guest mapping exists yet — §11 D4).
4. Media: collect ids from `hero.photo_id`, `story.photo_ids[]`, `gallery.photos[].id`,
   `closing.photo_id`, and `PublicMoment.PhotoID`; keep only valid UUIDs; then
   `SELECT id FROM media WHERE event_id=$1 AND id = ANY($2)`. **Only owned ids are signed.**
   A foreign/unknown id in content is silently dropped (renderer shows the gradient placeholder).
5. Signing happens in the service (repo returns ids): `publicinvite.Service` gets the
   `*storage.Signer`; `PublicMediaTTL = 6 * time.Hour` (a guest keeps the page open; 15 min is
   too short for the lightbox). URL format identical to `GiftHandler.mediaDTO`.

DTO (additive; existing clients ignore unknown fields):

```jsonc
{
  "event_type": "wedding", "couple_a": "Adrian", "couple_b": "Isabella",
  "event_date": "2027-06-12T03:00:00Z", "venue": "…", "palette": "Ivory", "language": "en",
  "template": "gilded-seal",            // NEW, null when none
  "timezone": "Asia/Jakarta",           // NEW
  "sections": [{ "type": "hero", "content": { "title": "The Wedding Of", "line": "…", "photo_id": "…" } }],
  "schedule": [{                        // NEW, [] when schedule hidden
    "label": "The Ceremony", "title": "Akad Nikah",
    "starts_at": "2027-06-12T03:00:00Z", "ends_at": null,
    "venue": "Ceremony Venue", "address": "…", "map_url": "", "venue_note": "",
    "dress_code": "Formal attire", "description": "…", "photo_id": null }],
  "media": { "<uuid>": "/api/v1/media/<uuid>/file?sig=…" },   // NEW, signed, owned only
  "gifts": [], "gift_methods": [{ "type": "bank", "title": "BCA", "detail": "Adrian P.", "copy_value": "1234567890" }],
  "live": null, "rsvp_deadline": null,
  "guest": { "name": "Sarah Wijaya", "rsvp_status": "pending", "party_size": 0, "max_party": 3 },
  "preview": false                       // NEW
}
```

Headers unchanged: `Cache-Control: private, no-store`.

### 5.5 Public wishes

```
GET  /api/v1/invite/{token}/wishes?limit=20&cursor=<opaque>
200 { "items": [{ "id": "uuid", "name": "Nadia", "message": "…" }],
      "next_cursor": "opaque|null", "total": 42 }
```

- Approved only (`approved = true`), both phases, newest first, keyset
  `(created_at, id) < (cursor_ts, cursor_id)`; cursor = base64url(`<RFC3339Nano>|<uuid>`).
  Malformed cursor → 400. `limit` 1–50, default 20.
- `total` = count of approved wishes for the event (cheap, indexed).
- Works on generic and personal links (both see the guestbook). `authRL` rate limit.
  `Cache-Control: private, max-age=15`.
- Existing `POST /api/v1/invite/{token}/wish` keeps its path and request; **response becomes**
  `201 {"id","name","message"}` (previously empty). `WishForm` ignores bodies, so this is
  backward compatible. `AddWish` returns the inserted id via `RETURNING id`.

Relation line ("Friend of the bride") has no data source → not rendered for real wishes (the
prototype already treats it as optional).

### 5.6 Host draft preview

```
GET /api/v1/events/{id}/invitation/preview      (needAuth, member tier)
200 <same DTO as §5.4> with "preview": true, "guest": null
```

- Builds the page from the event id (no published predicate): repo `ResolveEvent(ctx, eventID)`
  then the same `Page()`. Moments use the generic-link visibility (`everyone`) so hosts see what
  a stranger sees.
- Add `"GET /api/v1/events/{id}/invitation/preview": tMember` to `authz_matrix_test.go` `policy`.

### 5.7 Contract + docs

- `api/openapi.yaml`: add the public invite schema (+new fields), wishes list, wish POST response,
  preview endpoint. `web/lib/api/invite.ts` types updated by hand (the public client is not
  orval-generated today).
- `docs/08-api-specification.md`, `docs/09-database-design.md`: append the changes.

---

## 6. Security and privacy

| Risk | Control |
|---|---|
| Section content references another event's media id | Read-time ownership filter; only owned ids signed (§5.4). Test with a foreign id. |
| `map_url` with `javascript:`/`data:` | Write validation `^https://`; renderer also only uses `https://` hrefs, else falls back to a Google Maps search URL built with `encodeURIComponent`. |
| Guest name from `?to=` on generic links | Display only; `slice(0,60)`; React text nodes / canvas `fillText` (no HTML). Never sent to the API. |
| Wish author spoofing on personal link | Already handled: server uses guest name. Composer shows it read-only. |
| XSS via content | Content rendered as text only; no `dangerouslySetInnerHTML` anywhere in the template. Server strips `<>` already. |
| Token leakage via Referer | Keep `referrer: "no-referrer"` metadata on `/invite/*`; external links `rel="noopener noreferrer"`. |
| Media URL lifetime | 6 h TTL, `private, max-age=300` on blobs (existing). |
| Wishes list scraping | Token-scoped + `authRL`. Approved-only. |
| Preview endpoint | Member auth + event scope middleware (same chain as `GET /invitation`). |
| Clickjacking | `X-Frame-Options: DENY` stays; previews open in a new tab. |

---

## 7. Frontend design

### 7.1 File layout

```
web/components/templates/
  registry.ts                        slug → next/dynamic renderer ("gilded-seal" only)
  types.ts                           TemplateProps = { invite: Invite; token?: string; mode: "live"|"preview"|"demo" }
  gilded-seal/
    GildedSeal.tsx                   client root: phases, scroll lock, inert, engine wiring, composition
    gilded-seal.module.css           globals (selection, focus, Lenis), hover/focus states, keyframes
    fonts.ts                         next/font/google: Cormorant Garamond, Manrope, Pinyon Script (+ .style.fontFamily for canvas)
    config.ts                        WeddingConfig type, DEMO_CONFIG (= prototype WEDDING_CONFIG), mapInvite()
    derive.ts                        port of cfg(): names, initials, dates (tz + locale), time12, events, venue grouping
    layout.ts                        port of heroLayout(), carousel geometry, wish slot ring, gallery corridor table
    engine/
      ticker.ts                      shared rAF loop (tick/untick/interval), steps Lenis first
      spring.ts                      Spring class + spring() → CSS linear() string
      ease.ts                        EASE (css) + ease (js) + clamp/lerp/hash
      reveals.ts                     data-reveal IntersectionObserver + WAAPI (paused → play)
      stack.ts                       album stack (setup/layout/apply)
      parallax.ts                    [data-speed]
      useEngine.ts                   StrictMode-safe lifecycle: build once, dispose everything
    gl/
      shaders.ts                     VERT, FRAG_CONTOUR, FRAG_BURN (verbatim)
      layer.ts                       makeLayer() raw WebGL2 full-screen triangle
      detect.ts                      detectLowGL()
      cover.ts                       buildCover(THREE, ctx) — the three.js envelope scene (verbatim port)
      coverTextures.ts               procedural canvas textures (paper, card, envelope, flap, liner, linen, reply, petal, dot, seal)
    sections/
      Veil.tsx  Cover.tsx  Hero.tsx  Statement.tsx  Story.tsx  DateRing.tsx  Celebration.tsx
      Venue.tsx  Gallery.tsx  Gift.tsx  Rsvp.tsx  Wishes.tsx  Closing.tsx  MusicButton.tsx  Lightbox.tsx
    parts/
      Photo.tsx                      replaces <image-slot>: <img> when url, else nothing (parent gradient shows)
      Sprig.tsx                      the botanical SVG (variants: leaves count, berries, rotation)
      WaxSeal.tsx                    CSS wax seal with initials (RSVP back, closing)
      Eyebrow.tsx, Rule.tsx          tiny typographic atoms
      useSwipe.ts, useArrowKeys.ts   carousel input (port of swipeFor/arrowKeys)
    music.ts                         curated track catalog
web/app/demo/[slug]/page.tsx         landing live demo (outside (marketing) chrome)
web/app/preview/[eventId]/page.tsx   host draft preview (client fetch, cookies)
web/public/templates/gilded-seal/music/*.mp3   licensed tracks (asset dependency)
```

Conventions match the repo: inline `style={{…}}` objects copied from the prototype (as the admin
and landing ports did), CSS module only for what inline styles cannot express
(`style-hover` → `:hover`, `style-focus` → `:focus`, `::selection`, Lenis classes, reduced motion).

### 7.2 Data mapping (`mapInvite(invite, mode, search)` → `WeddingConfig`)

| Config | From | Fallback |
|---|---|---|
| p1/p2 | `couple_a/couple_b` (trim) | `"Partner"`; initials = first char upper |
| date ISO + tz | `event_date`, `timezone` | invalid → "Date to be announced" path |
| guest | `guest.name` → `?to`/`?guest` (≤60) → `"Our Beloved Guest"` | |
| openingTitle/subtitle/statement | `opening` content | prototype defaults |
| heroLine | `hero.line` | prototype default |
| story/chapters/photos | `story` content | live: section hidden if `body` empty. Preview: the prototype's sample story, 3 chapters and 8 empty gallery frames stand in so the host sees the whole design; real content always wins |
| events | `schedule[]` → `{label, title, date(tz), time, endTime, description, venue, address, mapUrl, venueNote, photo}` | no moments → one event from `event_date` + `venue` labelled "The Celebration" |
| dressCode | `schedule.dress_code` → first non-empty moment `dress_code` | hide the dress-code block |
| gift | first `bank` method, then `wallet` (one card per method, stacked) | section hidden when no bank/wallet method (prototype `giftReady`) |
| note | `gift.body` | prototype default note |
| rsvpBy | `rsvp_deadline` formatted in tz + locale | "Kindly reply at your earliest convenience…" |
| maxGuests | `guest.max_party` | 1 (stepper hidden) |
| music | `music.track` → catalog src | button hidden |
| closingMessage | `closing.body` | prototype default |
| gallery | `gallery.photos[]` with signed urls | live: section hidden when 0 photos. Preview and demo: 8 placeholder frames |
| photos | `invite.media[id]` | gradient placeholder (prototype background) |

Date formatting: replace the prototype's `"en-GB"` + `timeZone:"UTC"` trick with
`Intl.DateTimeFormat(locale, { timeZone: invite.timezone, … })`, `locale = language === "id" ? "id-ID" : "en-GB"`.
`dateDots` uses the tz-local Y/M/D parts. Countdown target = the absolute instant (`Date.parse`).

Section rendering order is fixed by the template (not by `position`), but `visible:false` hides
the block. Hidden stack layers are simply not rendered — `stack.ts` discovers layers from the DOM.

### 7.3 Modes

| | live | preview | demo |
|---|---|---|---|
| Data | `/invite/{token}` | `/events/{id}/invitation/preview` | `DEMO_CONFIG` |
| RSVP submit | API | prototype `demo` status ("This invitation is a preview…") | same as preview |
| Wishes | API list + post | API list (read), post stays local | samples + local |
| Generic link RSVP | front of card shows "Please open the personal link your hosts sent you to reply." instead of the form | form (demo) | form (demo) |
| Already replied guest | card starts flipped (done), "Change my reply" flips back | — | — |
| Sections with missing content | hidden | hidden | all shown (prototype defaults) |

### 7.4 Component / engine model

The prototype is one class with refs, a shared ticker and ~40 refs. Port shape:

- `GildedSeal.tsx` owns React state that drives markup (phase flags, RSVP/wish/carousel state,
  music state, lightbox, viewport `vw/vh`, `now` for the countdown).
- Everything per-frame lives in a non-React **engine** created in `useEngine()` (one per mount):
  ticker, Lenis, springs, stack, reveals, shader layers, cover scene, petals. Sections register
  frame callbacks by ref (`engine.tick(fn, intervalMs)`), mirroring `world()`.
- Per-frame writes are direct `element.style` mutations (never `setState` per frame), exactly as
  in the prototype.
- **StrictMode:** `reactStrictMode: true` mounts effects twice in dev. `useEngine` must fully
  dispose on cleanup: `cancelAnimationFrame`, clear `subs`, `clearInterval/clearTimeout`,
  disconnect observers, `lenis.destroy()`, `cover3d.dispose()` + `forceContextLoss()`,
  shader `WEBGL_lose_context`, remove listeners, unlock scroll. A second mount must work.
- **Hydration:** server renders with `vw=1280, vh=800`; the first client effect sets the real
  viewport before the veil lifts (veil covers any layout jump). Never read `window` during render.

### 7.5 Fonts

`gilded-seal/fonts.ts` (pattern of `lib/three/fonts.ts`):

```ts
import { Cormorant_Garamond, Manrope, Pinyon_Script } from "next/font/google";
export const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["300","400","500"], style: ["normal","italic"], display: "swap", variable: "--gs-serif" });
export const manrope = Manrope({ subsets: ["latin"], weight: ["400","500","600"], display: "swap", variable: "--gs-sans" });
export const pinyon = Pinyon_Script({ subsets: ["latin"], weight: "400", display: "swap", variable: "--gs-script" });
export const FONT = { serif: cormorant.style.fontFamily, sans: manrope.style.fontFamily, script: pinyon.style.fontFamily };
```

Inline styles replace `'Cormorant Garamond',serif` → `var(--gs-serif)`, `'Manrope',sans-serif` →
`var(--gs-sans)`, `'Pinyon Script',cursive` → `var(--gs-script)`. Canvas text (cover card,
envelope, reply card, seal) uses `FONT.*`, and the veil's `document.fonts.load(...)` list uses the
same family strings with the prototype's weights (`300 120px`, `italic 400 120px`, `italic 500 120px`,
`600 40px`, `500 40px`, `400 80px`).

### 7.6 Dependencies

- `three` — already installed (`^0.186`). Prototype targets r170; APIs used (`NeutralToneMapping`,
  `scene.environmentIntensity`, `PMREMGenerator.fromScene`, `MeshPhysicalMaterial` sheen/clearcoat,
  `LatheGeometry`, `CatmullRomCurve3`, `renderer.compile`) all exist in r186; physical light units
  are already the r170 default, so intensities carry over unchanged. Loaded with
  `await import("three")` inside the cover only.
- `lenis` — **add**, exact pin (`"lenis": "1.3.x"` resolved to an exact version, prototype used
  1.3.26). Options `{ smoothWheel: true, anchors: true, autoRaf: false }`; stepped by the ticker.
  Not created under reduced motion.
- No other dependency.

### 7.7 Device policy (deliberate deviation from docs/04 landing policy)

Landing keeps "phones get a poster". This template is opened mostly on phones from WhatsApp, and
the prototype was built for that: the cover runs on mobile at `pixelRatio 1`, texture size 1024,
30 dust motes, 33 ms tick, plus a watchdog. Fallback to the static cover card when:
`detectLowGL()` (software renderers), three import/scene failure, the 10 s failsafe, or
`navigator.connection.saveData` / effective type `2g` (added; not in the prototype).

### 7.8 Global grain

Root layout renders `<Grain/>` everywhere. The template brings its own grain (prototype layer,
opacity .8). In `gilded-seal.module.css`:
`:global(body:has([data-template="gilded-seal"]) [data-testid="grain"]) { display: none; }`.

### 7.9 Music catalog

`music.ts`: `[{ key: "satie-gymnopedie-1", title: "Gymnopédie No. 1", src: "/templates/gilded-seal/music/satie-gymnopedie-1.mp3" }, …]`.
Asset dependency: product supplies licensed/public-domain recordings (§11 D3). Missing file →
`<audio>` error → button shows the error state (prototype behaviour), never blocks the page.

---

## 8. Motion and 3D specification (verbatim from the prototype)

All durations in ms. `k` = intro speed factor (`cinematic` 1, `brisk` .62). CSS easings:
`out = cubic-bezier(.22,1,.36,1)`, `inOut = cubic-bezier(.65,0,.35,1)`, `in = cubic-bezier(.55,0,.75,.2)`.
`spring(s,d)` = damped spring (mass 1) sampled at 1/120 s into a 49-stop CSS `linear()` easing (N = 48)
(fallback `out` when `linear()` unsupported). JS `Spring` = tension/friction integrator in 1 ms
sub-steps (≤64 per frame).

### 8.1 Loading veil

- Background `radial-gradient(70% 60% at 50% 42%, #FBF6EE 0%, #EDE3D4 100%)`; monogram
  `I&I` outline stroke `rgba(168,135,72,.6)`; fill layer gold gradient
  `linear-gradient(170deg,#EBDDB6 0%,#B08E52 52%,#8A6C3E 100%)` revealed bottom-up via
  `clip-path: inset((1-v)·100% 0 0 0)`; 3 px bar `scaleX(v)` `#B08E52` on `rgba(199,166,106,.18)`.
- Progress: fonts +.3 (raced with a 4 s timeout), three import +.3, scene built +.3.
- Spring `(10, 30)` toward `min(.9, progress + .08)`; when loaded → `(170, 26)` toward 1;
  at `v > .985` → lift. Failsafe at 10 000 → loaded + fallback cover.
- Lift: `coverRiseStart = now + 300`. Monogram → `opacity 0, translateY(-26px) scale(.96)` 700 inOut.
  Veil `clip-path inset(0) → inset(0 0 100% 0)` 1150, delay 280, inOut, then unmount.
  Cover head/foot `opacity 0, translateY(20px) → none` 1400, delay 1000 / 1220, out (fill backwards).

### 8.2 Cover — three.js scene (`buildCover`)

Renderer: antialias, `pixelRatio min(dpr, mobile ? 1 : 1.5)`, sRGB output,
`NeutralToneMapping` (fallback ACES), exposure .96, PCF soft shadows. `mobile = !fine || innerWidth < 760`.
Background + fog `#E9E2D7`, fog near/far = `D+3 / D+22`.

Environment: PMREM from a scene of a `#C9C2B8` back-sphere + three softboxes
(`10×6 @(-6,9,5) #FFF8F0×3.2`, `6×4 @(7,5,-3) #FFF0E6×1.5`, `12×3 @(0,2,10) #F6F0E8×1.1`), sigma .04,
`environmentIntensity .6`.

Lights: hemisphere `#FFFCF7/#D6CBBE` .78; key directional `#FFF5EA` 1.85 at `(-3.4,7.5,3.2)`,
shadow map 1024², ortho ±4.5, near 1 far 24, bias −.0004, normalBias .02, radius 4; fill `#FFF2EA`
.6 at `(5,3,6)`.

Procedural canvas textures (`R = mobile ? 1024 : 1536`, `HC = round(R·2/3)`): paper = base fill +
overlay noise (256² random) + up to 500 fibres. Invitation card (color + ORM + bump variants) with
double gold frame, corner diamonds, monogram circle, opening title (spaced caps), names
(auto-shrink to 80 % width, `&` in Pinyon), subtitle, rule + diamond, date dots. Envelope front
(`#F2E8D8`, flap shadow triangles, "DEAR" + guest name auto-shrink). Flap (`#F4EBDD`), liner
(`#D2ADA4` lattice + gold edge), generic/inside paper, linen (`#E7DFD3` weave, repeat 14), reply
card (`KINDLY RESPOND`, 3 rules), petal (radial `#F3DDD6→#C9978D`), dot sprite, seal bump map
(monogram, 200 px italic 500).

Objects:

| Object | Geometry | Material | Placement |
|---|---|---|---|
| Table | Plane 40×40 | linen, roughness .96 | rot.x −π/2, receives shadow |
| Reply card | Box 1.7×.006×2.3 | reply texture top | (−1.35,.003,.62) rot.y .32 |
| Satin ribbon | Plane .2×1, 140 segs along CatmullRom `(1.1,0,1.3)…(6.2,0,−.4)` with twist `sin(u·9)·.35` | Physical `#DDC2BA` rough .38 sheen 1 `#FFF1EA` | lies on table |
| 11 petals | Plane .2×.25 | petal alphaTest .35 | ring r 2.1–4.5 (hash-seeded) |
| Envelope base | Box 3×.02×2 | inside/generic | env group y .012 |
| Card | Box 2.76×.008×1.84 | card color/roughness/metalness(ORM)/bump .5 | (0,.025,0) |
| Front pocket | Shape `(-1.5,-1)(1.5,-1)(1.5,1)(0,-.08)(-1.5,1)` | front texture | y .03 |
| Flap | Shape triangle `(-1.5,0)(1.5,0)(0,-1.12)`, outer + liner (BackSide) | flap / liner | pivot (0,.046,−1) |
| Wax seal | Lathe profile 72 segs, rim wobble `1+.045 sin(5a+1.3)+.028 sin(11a+.4)` + top disc r .245 bump 2.2 | Physical `#8F564E` clearcoat .7 | (0,.05,.1) |
| Gold flecks | 40 points size .05 additive `#F0D9A0` | dot sprite | seal origin |
| Dust | 70 (30 mobile) points size .045 additive `#FFF4DE` op .5 | dot sprite | volume 9×3.4×8 |

Camera: perspective fov 30, near .05 far 80. Fit: `frac = asp<.8 ? .84 : asp<1.25 ? .66 : .48`;
`D = max(3.3/(frac·2·tan15°·asp), 2.3/(.44·2·tan15°))`; `el0 = asp<.8 ? 60 : 50`;
`dF = min(1.84/(2·tan15°), 2.76/(2·tan15°·asp))·.9`.

Idle (before open): `rise = outQuad((t − coverRiseStart)/2000)` → distance `D·1.25→D`,
elevation `el0−10 → el0`, target y `−.15 → 0`. Fine pointer: azimuth spring (40,16) → `pointer.x·4°`,
elevation spring → `−pointer.y·2.5°`; DOM sprigs translate `(−az·7·side px, el·6 px)`.
Raycast hover on base/front/flap/seal → hover spring (200,18): seal lifts `.014`, scales 1.04,
canvas cursor pointer. Key light x drifts `−3.4 + sin(t·.00021)·.35`. Dust drifts on slow sines.
Tick interval: 0 (fine) / 33 (coarse) / 120 (reduced).

Watchdog: record `max(cost, dt)` of the first 20 frames; if the median > 50 → `degrade()`
(pixelRatio 1, key shadows off, shadow map frozen) and 33 ms tick.

### 8.3 Opening sequence (`open()`; `ot = (now − openT0)/k`)

Triggered by the button or a click on the canvas. Starts music inside the gesture.

| ot | Track | Value |
|---|---|---|
| 0–1000 | push-in `s1 = outCubic` | distance ×(1→.86), elevation +6°, key 1.85→2.30, hemi .78→.86 |
| 0–700 | DOM head/foot | fade out, ∓18 px |
| 0–1900 | DOM sprigs | `translate(−side·14vw, side·12vh) scale(1.6)`, fade (inOut) |
| 120–280 | seal press | `scaleY 1 − .18·press` (outCubic) |
| 280–1230 | seal fly | pos `(1.5f, .05+1.05f, .1+.55f)`, rot `(−2.4f, 1.8f, 1.2f)` (outCubic) |
| 330–1630 | flecks | ballistic `x=vx·bt·.8, y=.12+vy·bt−1.6bt², z=.1+vz·bt·.8`, opacity `.9(1−bt/1.3)` |
| 600–2000 | light shaft | fade out |
| 650–1700 | flap | `rot.x = −π·.985·inOutCubic` |
| 720–1150 | seal fade | linear opacity → 0, then hidden |
| 1500–2850 | card rise `raw4` | tilt `th = 1.25·inOutCubic(raw4/.6)`; z `.92→−.9` (raw4/.55); y `.025+.72·inOutCubic((raw4−.3)/.7)`; pos `(0, y+.92 sin th, z−.92 cos th)` |
| 1500–2850 | camera `s4` | distance ×.8, elevation → 30°, target → `(0,.95,−.9)` |
| 2700–4000 | `s5 = inOutQuart` | camera → card front at `dF`; card → `(0,1.25,−.95)`, `rot.x → π/2` (fills screen) |
| 3450·k | hero | `playHero` starts (§8.4) |
| 3600–4200 | DOM cover | opacity → 0 (linear) |
| 4250·k | finish | `finishOpen()` |

Skip intro (button top-right while opening, or `Esc`): finish every WAAPI animation, jump burn to
done, petals on, `finishOpen()`.
Reduced motion or no 3D: cover fades 600, `playHero(200k)`, finish at 650k.

`finishOpen()`: stop cover tick, dispose three.js, unlock scroll, `main.inert = false`, unmount
cover, `scrollTo(0)` + Lenis start, start reveal observation, scroll-cue loop
(`translateY(-14px)→46px`, opacity 0→1@30 %→0, 2200 inOut infinite, delay 600), layout stack,
focus `h1` (`preventScroll`).

### 8.4 Hero (stack layer 1)

Layout (`heroLayout(vw, vh)`): wide (≥880): photo `pH = min(.78vh, 900)`, `pW = min(.36vw, .74pH)`,
right-aligned at `.91vw`; text column left `.075vw`; name size `min(.085vw, 150, tW/(maxLen·.5))`;
left-aligned; ampersand indented. Narrow: photo centered `pW = min(.78vw, 380)`, `pH = 1.3pW`
(shrinks to fit), text overlaps photo bottom by 70 px, centered, hero line hidden, fade gradient on.

Depth layers inside `perspective:1100px` camera: far arches `translateZ(-700) scale(1.64)`,
initials `translate3d(-50%,-54%,-320px) scale(1.29)` 38vw `rgba(199,166,106,.12)`, photo arch
(radius `999px 999px 3px 3px`) with shadow `-40`, outline `-90 scale(1.082)`, silk band `130 rotate(-8)`
blur 16, text `60 scale(.945)`, petals container, foreground sprigs `380 scale(.655)` blur 5 /
`300 scale(.727)` blur 4.

Entrance `playHero(delay)` (WAAPI, `out` unless noted, `sp = spring(95,15)`):
contour canvas 0→1 1800; far `translateY(70px)` 2600; initials `scale(.88)` 2600 +200;
photo `translate3d(0,60px,-280px) rotateY(-14deg) rotateX(5deg)` 2400; image `scale(1.18)` 3000;
outline `scale(.92)` 1900 +700; silk `translateX(-22%)` 3000 +800; sprigs
`translate(∓26%, ±26%) scale(1.2)` → opacity .9, 2600 +100; `[data-hero=up]` `.6em` 1300 sp
(first +300, then +1000+i·120); name chars `.3em` 1200 sp +420+i·45; ampersand
`scale(.6) rotate(-14deg)` 1500 sp +800 and gold sheen `background-position 100%→0%` 2600 inOut +1000;
scroll cue 1200 +1800. Burn shader from `delay+250` for 2600, then destroyed. Petals on at `delay+900`.

Per frame: pointer springs (60,20) (fine) or idle drift `x = sin(t·.00028)·.45, y = cos(t·.00021)·.3`
(touch); camera `translateZ(dolly·260px) rotateX(−y·2.4°) rotateY(x·3.4°)`, `dolly = stack[0].p`.
Contour shader at ~30 fps. Petals: 8 (fine) / 4 (coarse), SVG gradient `#F1DAD3→#C99A90`, size 14–30,
z −250…400 with depth blur, fall `vy .00004–.00009/ms`, sway ±40 px, `rotateX ±60°`, spin, fade-in 1500.

### 8.5 Album stack (layers 1–3 + date)

Each layer `position:sticky; top = min(0, vh − height)`. Progress `p = clamp(1 − next.top/vh)`.
Inner `scale(1 − .07p)` (no shrink under 640 px), origin `50% (−top + vh/2)px`; shade `#15110E`
opacity `.55p`; inner hidden at `p ≥ .999`. Re-layout on resize (ResizeObserver).
Each following layer: `border-radius 28px 28px 0 0`, `box-shadow 0 -40px 60px -20px rgba(30,22,16,.28)`.

### 8.6 Opening statement (layer 2)

Words split on spaces. `a = stack[0].p`, `wp = clamp((a−.1)/.8)·(N+1)`, per word
`lit = clamp(wp − i)` quantised to 1/200: opacity `.13+.87·lit`, `translateY((1−lit)·.18em)`,
`blur((1−lit)·3px)`. Halo SVG (dotted r292, r252, cardinal ticks) rotates `a·24 + stack[1].p·30` deg.
Reveals: eyebrow fade, ornament draw (3 paths, centre diamond +200), subtitle up +500.

### 8.7 Our story (layer 3)

Two-column auto-fit grid (min 360). Main photo 84 % width 4:5 mask reveal; inset photo 46 % 3:4
with paper border, `data-speed=-0.09` parallax, mask reveal +300. Text column sticky `top:12vh`:
eyebrow, h2 "How it *began*", body (max 42ch), chapters list (roman numerals, reveal delay
`150 + i·110`).

### 8.8 Save the date (z 30)

Dark radial `#3A2F27 → #2A221C → #211A15`. Contour shader (25 fps). Two seam canvases (top 30svh,
bottom 24svh): chequered diamond dissolve, cell 22 (16 under 640), threshold `1 − p·1.4` with
per-cell hash jitter; top colour `#FCF9F3`, `pTop = clamp(1 − (rect.top + .12vh)/vh)`; bottom
colour `#F7F2E9`, `pBot = clamp((rect.bottom − .3vh)/(.7vh))`; redraw only when p moves > .003.

Ring `min(86vw, 64svh, 600px)` square, container units: 60 ticks (major every 5, r1 284/290→300),
faint circles r276/r240 dashed, glow arc (blur 5) and gold arc `#C7A66A` 1.6 on r276
(circumference 1734.16), head (glow r13 + core r3.4). Lap starts when ring top < .75vh: 5200 ms
`inOutSine` with wobble `−.028·sin(e·8π)`, glow length `160·sin(π·min(1, 1.15t)) + 20`, head opacity
`min(1, 6t)`; ticks light when passed then decay `exp(−Δ/800)` to base (.55 major / .3 minor). After
the lap the head tracks real seconds (`(Date.now() % 60000)/60000`), glow 70, ticks glow by angular
proximity `base + .65·exp(−d²/.0005)`. Centre: weekday, month (italic), day (36cqw gold gradient),
year. Countdown grid (days/hours/minutes/seconds, tabular nums, 1 s interval) or ended text.

### 8.9 The celebration (event carousel)

Card `w = wide ? min(900, .7vw) : vw − 36`, `h = wide ? 500 : 620`; wide grid `42% | 1fr`, arch photo
inset 18 px; narrow photo row 220 px. Slide transform wide:
`translate3d(d·w·.74px, 0, −|d|·300px) rotateY(−d·26deg)`; narrow `translate3d(d·(w+16)px,0,0) scale(.94)`;
opacity 1 / .5 (|d|=1) / 0; `transition transform 1s out, opacity .8s`. Inactive slides are click
targets. Controls (when >1): prev/next 48 px circles, title+time tabs, progress `scaleX((i+1)/n)`
.9s out. Swipe: lock after 8 px on the dominant axis, rubber-band `dx·.3`, step at 44 px, snap back
`translate .6s out`. Arrow keys on the focused region. Roman numerals I–X on photos.
Dress code block below. "See the venue" jumps to `#venue` and selects that venue.

Extension (not in prototype): when `invite.live` exists, a one-line strip under the dress code
("Watch the ceremony live" + provider + link), same typographic tokens. Keeps the existing live
stream feature available on this template.

### 8.10 The venue

Venues = moments grouped by `lower(venue + "|" + address)`; label = joined moment titles with
" & "; moments listed with `date · time range`. Photo = the first moment's photo in the group
(simplification: the prototype had separate venue slots; upgrade = `venue_media_id`). Wide: 12-col
grid, photo cols 1–8 (`max(520, min(.8vh, 720))` tall), info card cols 8–13 overlapping. Narrow:
photo `min(1.05vw, 460)`, info card pulled up 56 px. Slide change: clip-path wipe
(`inset(0 100% 0 0)` / `inset(0 0 0 100%)` → `inset(0)`) 1.25s inOut, photo `scale(1.14→1)` 2s out,
info crossfade .7s with `translateY(16px)` .9s, delay .25s. "Open in Maps" → `map_url` or
`https://www.google.com/maps/search/?api=1&query=` + encoded `venue, address`.

### 8.11 Gallery corridor

Section height `100svh + n·45svh` (prototype n=8 → 460svh). Sticky stage, `perspective:900px`.
Figure `i`: width `min(60vw, 44svh)` 4:5, `z_i = −500 − 950i`, x/y/rotY from the table (cycled for
i ≥ 8): `(−21vw,−3svh,11°) (20,4,−11) (−17,−6,9) (23,2,−12) (−23,5,12) (18,−4,−10) (−19,3,10) (0,0,0)`;
last figure always `(0,0,0)`. `g = clamp(−rect.top/(height − vh))`, `camZ = g·(|z_last| − 300)`
(prototype 6850). Camera `rotateY(−x·2.2°) rotateX(y·1.6°) translateZ(camZ)` with springs (50,20)
on fine pointers. Figure opacity `clamp((d+5200)/2600)·(1 − clamp((d−120)/380))`, `d = z + camZ`,
hidden at ≤ .001. Counter = figure nearest `d = −300`; bar `scaleX(g)`. Expand button only on
figures with a photo. Reduced motion → flat responsive grid (`flattenGallery`).
Lightbox: dark `rgba(26,21,18,.95)`, prev/next/close 48 px, counter `NN / NN · alt`, `Esc`/arrows,
focus close on open, restore focus on close, scroll locked, backdrop click closes.

### 8.12 Gift, RSVP, wishes, closing, music

- **Gift**: hidden without a bank/wallet method. Card per method: bank (`title`), number
  (`copy_value`, `user-select:all`), holder (`detail`); copy button (`Copy account number` →
  `Copied` 2600 ms; clipboard API in secure contexts, `execCommand` fallback; failure text).
- **RSVP**: `map` reveal (`perspective(900) rotateX(58deg) translateY(40px) scale(.9)` → flat, 1800).
  Two decorative under-cards (rotated −3° blush, +1.8° paper). Card flips `rotateY(180deg)` 1.3s inOut
  with visibility swap at .65s. Name input (personal link: guest name, read-only), Yes/No radio cards
  (on: `#FFFDF8` bg, `#302720` border, shadow), guests stepper (yes and `max_party > 1`,
  1…max_party, hint `Including yourself, up to N`), note (≤300, server limit), submit. Back: wax
  seal, "Thank you, *first name*", done text, preview note, "Change my reply". Thank-you heading
  focused 750 ms after flip. API mapping: `{status: attend, party_size: yes ? guests : 0, note}`.
  Errors: `rsvp_closed` → "Replies for this celebration are now closed."; 404 → "This invitation is
  no longer available."; else prototype retry copy (answers kept).
- **Wishes**: viewer height 400/440, 5 DOM slots max (ring buffer by `wishV mod 5`), active card
  font size by length (wide 29/23/19, narrow 24/21/18), line clamp computed from card height;
  previous card flies `translate3d(-115%,-10px,40px) rotate(-8deg)`; queued cards
  `translate3d(0, d·16px, −d·70px) rotate(±1/1.2deg)` opacity .75/.45; .9s out. Load more when < 4
  remain. Live region "Wish i of n, from name". Composer: name (≤60; read-only guest name on a
  personal link), wish (≤300, counter), validation copy from the prototype, success pulses the deck
  (`opacity .3, translateY(14px)` → none, 800).
- **Closing**: contour shader (25 fps), two parallax sprigs (±.06), arch photo with outline
  (`data-speed .03`) and wax-seal medallion, per-frame arch
  `perspective(1200px) translateY((1−rp)·150px) rotateX((1−rp)·18deg) scale(.92+.08rp)`,
  `rp = outCubic(clamp((vh − rect.top)/(.95vh)))`; message up-reveal; names char reveal
  (45 ms stagger, second name +380, `&` at 320); date dots fade +600; footer
  "With love, A & B · A Mula invitation".
- **Music button**: fixed bottom-right 52 px, visible after the cover; states bars (4 bars WAAPI
  `scaleY .25↔1`, 480+i·140 ms alternate), play, loading spinner, error. Volume fades 0 → .6 over
  1800 ms. `preload="none"`, loop.

### 8.13 Scroll reveal system

`[data-reveal]` + optional `data-delay`. Animations created paused at mount, played once on
intersection (`threshold .12`, `rootMargin 0px 0px -6% 0px`), observation starts after the cover
opens, cancelled on finish (no lingering fills):

| kind | from → to | duration / easing |
|---|---|---|
| `up` | `opacity 0, translateY(34px)` | 1200 out |
| `char` | `opacity 0, translateY(.3em)` | 1100 spring(120,18) |
| `fade` | `opacity 0` | 1400 out |
| `map` | `perspective(900px) rotateX(58deg) translateY(40px) scale(.9)` | 1800 out |
| `mask` | `clip-path inset(100% 0 0 0)` (+ inner `scale(1.22)` 2200) | 1500 inOut |
| `draw` | `stroke-dashoffset len → 0` | 1600 inOut, +200 |

`[data-speed]` parallax: `translate: 0 ((parentCenter − vh/2)·speed)px` for elements within 200 px
of the viewport.

### 8.14 Shaders

`FRAG_CONTOUR` (field of four sines, warped, iso-lines via `fract` + `fwidth`, pointer glow,
vignette) with these uniforms:

| Layer | uBase | uLine | uAlpha | uGlow | uGlowAmt | uScale | uVig | dpr | fps |
|---|---|---|---|---|---|---|---|---|---|
| hero | .961,.933,.890 | .69,.55,.33 | .17 | 1,.985,.95 | .6 | 3.4 | .1 | .7 | 30 |
| date | .18,.145,.12 | .91,.84,.68 | .09 | .55,.42,.25 | .45 | 3 | .35 | .6 | 25 |
| closing | .953,.918,.875 | .70,.52,.49 | .2 | 1,.97,.94 | .5 | 3.2 | .1 | .6 | 25 |

`FRAG_BURN` (fbm noise front, top → bottom, gold glow `uGold .88,.72,.42` over paper
`uPaper .961,.933,.89`, `uP 0→1`). Layers render only while their section is within
`rootMargin 15%` (IntersectionObserver `vis` map). Software GL → shader canvases hidden, hero canvas
opacity 1 (static paper).

### 8.15 Design tokens

Colors: page `#F7F2E9`, ink `#302720`, ink-strong `#271F19`/`#2B221C`, body `#4A3E35`/`#54473D`,
muted `#5E5046`/`#6B5D52`, eyebrow `#6E5730`/`#7E6436`, gold `#B08E52`/`#A98545`/`#C7A66A`,
gold light `#E8D7AD`, rose accent `#8C6B67`, paper `#FCF9F3`, error `#8E4A43`, sage sprig
`#7F8466` fill `rgba(143,146,116,.55)`, wax `#AE7A73` radial, dark `#231D18`/`#15110E`.
Selection `#E8D7AD` on `#211D1A`; focus ring `2px solid #A98545`, offset 3.

Type: display Cormorant Garamond 300 (h2 `clamp(46px,5.6vw,82px)` lh 1 ls −.015em; italic `em`
rose), script Pinyon Script (ampersands), eyebrows Manrope 600 10–11px `letter-spacing .3–.42em`
uppercase, body Manrope 14–17px lh 1.6–1.8.

Breakpoints: `880` (hero/carousels wide), `760` + coarse pointer (cover mobile path), `640`
(stack shrink, seam cell). Touch targets ≥ 44 px everywhere (prototype already complies).

---

## 9. Admin dashboard changes (additive only)

| Where | Change |
|---|---|
| `components/admin/logic.ts` (`dl` list) | add `['Gilded Seal','Wedding','Elegant · Cinematic',0,'Adrian & Isabella']` — appears in "More designs", searchable, "Use this design" already PATCHes `template_id` via `patch.ts` name lookup |
| `patch.ts` `useDesign` | unchanged; after success the API adds the template's sections (§5.2); refresh `invitation` |
| `patch.ts` `openPreview` | when the current design is `gilded-seal` (from `templatesRaw` + `invitation.template_id`), open `/preview/{eventId}` in a new tab instead of the phone mock |
| `patch.ts` `SEC` map | add `main → opening`, `gallery → gallery`, `wishes → wishes`, `music → music`, `closing → closing` so the existing toggle + heading/body editor persist them |
| `views/InvitationEditor.tsx` | only when the template is `gilded-seal` (`V.gs`): cover "Replace cover photo" becomes a file input (upload `kind=cover` → `hero.photo_id`); main "Opening message" saves `opening.statement` (+ two inputs: opening line, subtitle); story adds chapter rows (≤5, title + text) and two photo pickers; gallery "Upload photos" uploads (≤12) into `gallery.photos` with alt text + remove; music shows a track `<select>`; closing adds a photo picker. Reuse existing classes (`f`, `inp`, `btn`, `tog`) |
| `views/Schedule.tsx` + `patch.ts evSave` + `mappers.ts` | wire the existing "Map link" input (`data-f="map"` → `map_url`), add "Small heading" (`label`), "About the place" (`venue_note`), photo picker (`media_id`) |
| `patch.ts obNext` | send `timezone` on event create |
| Upload helper | `D.mut("POST", `${base}/media`, formData)` (fetcher already supports `FormData`) |

No layout, navigation, style or copy changes beyond those fields.

---

## 10. Landing page changes (additive only)

| Where | Change |
|---|---|
| `components/landing/data.ts` | add `TEMPLATES` entry `gilded-seal` (cat Wedding, style Elegant, mood Romantic, color Ivory, `live: true`, desc, `d: { bg:"#F5EEE3", fg:"#271F19", accent:"#B08E52", font:"'Cormorant Garamond', serif", weight:300, size:13, eyebrow:"The Wedding Of", title:"Adrian & Isabella", variant:"arch", photo: PHOTOS.blush, date:"Saturday · 12 June 2027" }`). `Template` type gains optional `live?: boolean` |
| `components/landing/pages/TemplatePage.tsx` | when `t.live`: "Preview invitation" and the phone mock link to `/demo/{slug}?to={guest}` (new tab) instead of opening the mock modal. Everything else unchanged |
| `app/demo/[slug]/page.tsx` (new, built in GS-015) | full-screen live demo, outside the `(marketing)` chrome; renders the registry component with `mode="demo"`; 404 for slugs without a live renderer; metadata `title: "Gilded Seal — live demo · Mula"` |
| `/templates` grid, filters, "More like", sitemap | automatic via `TEMPLATES` |

---

## 11. Decisions and open questions

| # | Decision (default taken) | Change if… |
|---|---|---|
| D1 | Template name "Gilded Seal" | product names it otherwise (rename 4 places) |
| D2 | Template copy (headings, buttons) English, dates localised | Indonesian copy is required at launch → add a `copy.ts` dictionary keyed by `language` |
| D3 | Music from a curated catalog, assets provided by product | custom upload needed → extend media allowlist with audio + size cap |
| D4 | Public moments: generic `everyone`; personal `everyone+invite_only`; `family_only` never | guest groups gain a "family" flag |
| D5 | Venue photo = first moment photo of the venue | venues become first-class (table) |
| D6 | 3D cover on phones (prototype policy) with fallbacks | Lighthouse mobile perf fails the budget (§12) → poster on coarse pointers |
| D7 | Palette picker has no effect on this template | product wants palette variants → map palette → token set |
| D8 | Wishes show immediately (`approved` default true, existing) | moderation-first → default false + host approval UI already exists |

---

## 12. Quality gates

- **Go**: `make test` green; new tests for timezone validation, template section ensure,
  schedule extras validation (map_url scheme, media ownership), public page (template slug,
  timezone, moment visibility per link kind, media signed only when owned), public wishes
  (approved only, keyset pagination, foreign event isolation, bad cursor 400), wish POST body,
  preview endpoint auth (matrix covers it).
- **Web unit** (`npm test`): `derive.ts` (tz/locale formatting, time12, venue grouping, initials,
  fallbacks), `layout.ts` (hero layout both modes, wish slot ring buffer, gallery z/camZ), `spring()`
  output, `mapInvite` (each fallback row of §7.2).
- **E2E** (`E2E_FULL_STACK=1`): `/demo/gilded-seal` (veil → open → hero focus → RSVP demo flip →
  wish local), skip intro via `Esc`, reduced-motion project (no cover animation, flat gallery),
  live invite with personal token (RSVP persists, wish appears in list), generic token (RSVP notice),
  mobile viewport, axe (no critical violations), no console errors, StrictMode remount in dev.
- **Performance** (`lighthouserc.mobile.json` on `/demo/gilded-seal`): CLS < .05; JS for
  `/invite/*` without three ≤ 120 KB gz (three only after veil); cover watchdog engaged on throttled
  CPU; no long task > 200 ms after open on a mid-range profile.
- **Visual parity**: side-by-side with `docs/mula-sample-template-prototype/shots/*` at 1440×900,
  768×1024, 390×844 — cover, hero, statement, story, date, celebration, venue, gallery, RSVP,
  wishes, closing.

---

## 13. QA results (GS-060 … GS-062)

### 13.1 How to run

| What | Command |
|---|---|
| Template e2e + a11y (desktop, tablet, mobile) | `E2E_FULL_STACK=1 npx playwright test gilded-seal` (API + Postgres up; set `DEV_AUTH_RATE_PER_MIN=6000` for the API, see 13.3) |
| Visual parity capture | `GS_PARITY=1 npx playwright test gilded-seal-parity --project=desktop --workers=2` → `web/test-results/gilded-seal-parity/<viewport>/<shot>-{app,proto}.png` + `index.html`. Playwright empties `test-results/` at the start of every run, so run it once, in full, and read it before the next run |
| Lighthouse (mobile preset, as LHCI) | `lighthouserc.mobile.json` now includes `/demo/gilded-seal` |

Specs: `tests/e2e/gilded-seal.spec.ts` (demo flow, Esc skip, section order and carousels, no horizontal overflow, axe, reduced motion, live personal / generic link, template-less fallback, host preview), `gilded-seal-a11y.spec.ts` (44 px targets, focus indicators, no animation under reduced motion), `gilded-seal-parity.spec.ts` (capture only). Every test fails on a `console.error` (the missing music file and the login page's signed-out `/me` probe are the two allowed exceptions). 33 tests × 3 projects green in 3 consecutive full runs.

### 13.2 Defects the QA pass found, and what changed

| Found | Fix |
|---|---|
| **CLS 0.91** on a throttled phone: the server renders the page for a 1280×800 window, the first client effect lays it out for the real one, and the jump showed through the veil. | `<main>` is `visibility:hidden` until the cover starts to open; the album stack no longer forces `visibility:visible` on its layers (it inherits); the template is client-only (`TemplateHost`, `ssr:false`) with a same-colour wash as the loading state. CLS now 0.001; the HTML dropped from 104 KB to 3 KB and first paint from 2.7 s to 1.4 s. |
| axe `aria-prohibited-attr` (serious): `aria-label` on the statement `<p>` and the closing names `<div>`. | Visually-hidden text plus `aria-hidden` animated pieces. |
| Three carousel regions had no visible focus ring (inline `outline:none`). | Removed; the template's `:focus-visible` ring applies. |
| Reduced motion still created WebGL contexts (probe, cover, shaders) and downloaded three.js for a still picture. | Reduced motion takes the static route: card cover, plain backgrounds, no WebGL context at all. A global `prefers-reduced-motion` rule also zeroes CSS transitions (the RSVP card and carousels change state instantly). |
| **Fonts**: `next/font/google` serves other builds of Cormorant Garamond and Manrope than the prototype loads (Manrope's "0" is 9 px, not 10, at 16 px), which re-wrapped paragraphs and shifted every `ch` width. | The template uses the landing page's own woff2 files (`next/font/local`). Measured glyph advances now match the prototype exactly (Manrope "0" 10 px, sentence 323 px; Cormorant "0" 8 px). |
| Under parallel runs, requests from one IP hit the 30/min guest rate limit (429). | `DEV_AUTH_RATE_PER_MIN` / `DEV_AUTH_RATE_BURST`, honoured only when `APP_ENV=dev`; set in the CI e2e job. |

### 13.3 Finding for the product team (not changed here)

Guest pages call the API **from the Next.js server** (`fetchInvite`), and the per-IP limit on `GET /invite/{token}` is 30/min, burst 10 (`authRL`). Unless the API trusts a forwarded client address, every guest shares the web server's IP: the 31st guest to open an invitation inside a minute gets a 429 and the page errors. The same applies to a wedding hall's shared Wi-Fi for browser-side calls (wishes, RSVP). Suggested fix: forward `X-Forwarded-For` from the incoming request in `fetchInvite` and set `TRUSTED_PROXIES` to the web tier; consider a higher per-IP limit (or a per-token limit) for read-only guest endpoints.

### 13.4 Budgets (design §12) vs measured

Lighthouse 12, mobile preset (simulated slow 4G, 4× CPU), `/demo/gilded-seal`, 3 runs, production build, software GL (so the 3D cover is replaced by the card; GPU devices add the three.js chunks below).

| Budget | Target | Measured | Verdict |
|---|---|---|---|
| CLS | < .05 (LHCI error ≤ .1) | **0.001** | met |
| Accessibility score | ≥ .95 (LHCI error) | **1.00** | met |
| axe (wcag2a/aa) | no critical/serious | none, 3 viewports | met |
| Targets / focus / reduced motion | ≥ 44 px, visible focus, honoured | pass (a11y spec, 3 viewports) | met |
| JS, without three | ≤ 120 KB gz | **150 KB**: framework 94 KB (shared by every page of the site) + template 47 KB + Lenis 5 KB | **not met as written**. Template-attributable JS is 52 KB; the framework baseline alone is 88–94 KB. Re-state the budget as "template-attributable ≤ 60 KB gz" (met) |
| three.js | only after the veil, never on phones that opt out | 2 chunks, 88 + 100 KB gz, requested only on the GPU path after the veil; never on reduced motion, data-saver, 2g or software GL | met |
| Performance score | ≥ .85 (LHCI warn) | 0.69 – 0.74 | **below** |
| LCP | ≤ 2.5 s (warn) | 4.1 – 4.4 s (median 4.25 s) | **above** |
| TBT | ≤ 200 ms (warn) | 354 – 474 ms (median 417 ms) | **above** |
| FCP | — | 1.43 s (was 2.7 s before client-only) | — |

Why the three warn-level numbers miss: 297 KB of web fonts (Cormorant ×2 faces, Manrope, Pinyon) are fetched before the veil's monogram can settle, and the template's first render plus Lenis and the stack setup happen in one ~300 ms task on the 4× throttled CPU. The loading veil is the LCP element by design. Options if these need to hit target: subset fonts further (drop Cormorant 500 italic and the 700 range), preload only the two faces the veil uses, and split `GildedSeal`'s mount work across frames.

### 13.5 Visual parity (production vs prototype)

Captured with the same fake-GPU shim on both so each takes its 3D path (software GL renders it). Prototype run from `file://` in the same browser. Side-by-side: `web/test-results/gilded-seal-parity/index.html`; per shot `web/test-results/gilded-seal-parity/{1440x900,768x1024,390x844}/<shot>-{app,proto}.png` for `cover, opening, hero, statement, story, date, details, venue, gallery, gift, rsvp-front, rsvp-back, wishes, closing`.

| Shot | Result |
|---|---|
| cover (1440, 768, 390) | Identical composition: envelope, wax seal, reply card, ribbon, petals, sprigs, "Our Beloved Guest". |
| opening | Same sequence (card rises, flap, camera flight). Frames differ only by timing: they are different instants of a 4 s animation. |
| hero | Identical layout, spring entrance, burn dissolve and contour sheet at all three widths. The prototype shows the design tool's "Couple portrait" upload box where there is no photo; production shows the plain gradient (expected). |
| statement | Identical text, rules and word reveal. **Listed:** the halo rings. |
| story | Identical (the unmasked photo is at the same reveal stage in both). Paragraph wrap now matches after the font change. |
| date | Identical ring, ticks, numerals, countdown. **Listed:** ring line weights. |
| details / venue | Identical card, coverflow, tabs, info card, sprig. The prototype shows the upload box in empty photo slots. |
| gallery | Identical corridor, counter and progress bar; the prototype prints "Gallery photo N" slot labels on the frames. |
| gift | **Listed:** absent in the prototype (it renders only when an account number is configured). The demo shows it with a sample bank account so every section can be seen. |
| rsvp front / back | Identical. Submit button sits 3 px lower in production (error-line reserve), no visible effect. |
| wishes | Identical deck and composer; the demo samples now carry the prototype's "relation" line ("Friend of the bride", "University friend"). |
| closing | Identical arch, seal, message, names, footer; foliage sits at a different parallax phase. |

Deliberate differences:

1. **SVG presentation attributes.** The prototype writes `strokeWidth`, `strokeDasharray`, `strokeLinecap` in camelCase inside plain HTML; browsers ignore them, so its rings are 1 px solid lines, the date ring's glow is a 1 px blur and its 60 ticks are all one weight. Production applies the evident intent (dotted outer halo ring, 6 px glow trail, heavier every-fifth tick, round stem caps). Switching to the literal render means deleting those props in `Statement.tsx`, `DateRing.tsx`, `Sprig.tsx` and `ui.tsx`.
2. **Reduced motion** shows the static card cover instead of the 3D scene (13.2).
3. **Template is client-only**: the loading state is a plain ivory wash until the chunk arrives (13.2).
4. **Preview wishes**: the host's draft shows no guestbook (a preview has no guest token); the demo and live modes do.
