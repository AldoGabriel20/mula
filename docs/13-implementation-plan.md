# 13 — Implementation Plan

Execution source of truth. Tasks are small and independently shippable, with explicit dependencies, files, requirements, and acceptance criteria. IDs are stable. Ordering follows `14-implementation-order` (dependency-aware).

Prototypes stay in `docs/*-prototype/` as visual reference and are never modified or deleted. Production frontend lives in `web/`, backend in `api/`.

Legend: **F** files, **D** dependencies, **A** acceptance.

---

## FOUNDATION

### FND-001 — Frontend project scaffold
D: none
F: `web/package.json`, `tsconfig.json`, `next.config.js`, `.eslintrc`, `vitest.config.ts`, `playwright.config.ts`, `app/layout.tsx`, `app/globals.css`
Requirements: Next 14 App Router + TS strict; deps from `11`; scripts `dev/build/start/lint/test/typecheck/test:e2e`; `next/font` Newsreader + Instrument Sans; providers (React Query, Theme, Locale) in root layout.
A: `pnpm dev` serves a blank themed page; `typecheck`, `lint`, `test` run clean; fonts load with no layout shift.

### FND-002 — Backend project scaffold
D: none
F: `api/go.mod`, `api/cmd/api/main.go`, `api/internal/platform/{config,logging,errors}`, `api/internal/transport/http/{router,middleware}`, `api/cmd/migrate/main.go`, `migrations/0001_init.sql`
Requirements: chi/stdlib router; `slog`; config from env; `/healthz`,`/readyz`; recover+reqid+cors middleware; golang-migrate wired.
A: `go run ./cmd/api` serves `/healthz 200`; migrate up/down works against local Postgres.

### FND-003 — OpenAPI contract + client generation
D: FND-001, FND-002
F: `api/openapi.yaml` (skeleton of `08`), `web/orval.config.ts`, `web/lib/api/` (generated), fetch wrapper
Requirements: author OpenAPI skeleton; orval generates typed React Query hooks; fetch wrapper adds credentials, CSRF, error-envelope normalization, 401 redirect.
A: `orval` generates without error; a sample `GET /healthz`-style typed hook compiles; `orval --check` gate in CI.

---

## DESIGN SYSTEM

### DS-001 — Tokens + theming
D: FND-001
F: `app/globals.css`, `lib/theme/*`, `components/ui/ThemeToggle.tsx`
Requirements: all tokens from `03` as CSS vars (`:root` light, `:root[data-theme=dark]`, reduced-motion block); ThemeToggle persists to `localStorage` + `data-theme`; default follows `prefers-color-scheme`.
A: toggling switches light/dark live and survives reload; values match `03` exactly; reduced-motion disables animations.

### DS-002 — UI primitives
D: DS-001
F: `components/ui/{Button,Input,Textarea,Select,Chip,Modal,Toast,Dropdown,Tooltip,Skeleton,EmptyState,ErrorState}.tsx` + `.module.css`
Requirements: reproduce recovered `ds_*` CSS exactly; variants per `05`; a11y (focus ring, roles, labels, ESC/overlay close for Modal).
A: a `/dev` showcase renders all primitives in both themes; matches prototype; axe shows no critical a11y violations.

### DS-003 — Brand + motion primitives
D: DS-002
F: `components/ui/{ArchMeter,Dot,Logo}.tsx`, `lib/motion/{MotionProvider,Reveal,Magnetic,Tilt,grain}.ts(x)`
Requirements: ArchMeter animated arch (0–100, segmented); theme-aware Logo; motion layer per `04` (reduced-motion + pointer-fine gating, grain overlay, section grading hook).
A: Reveal fires on scroll; magnetic/tilt only on fine pointer; all disabled under reduced-motion; ArchMeter animates to value.

---

## SHARED / BACKEND CORE

### BE-001 — Users & auth
D: FND-002, FND-003
F: `internal/domain/user`, `internal/application/auth`, `internal/infrastructure/postgres/user*`, handlers `auth`, `me`, migrations `users`,`*_tokens`,`sessions`
Requirements: register/login/logout/verify/reset per `08`; argon2id; httpOnly session cookie + CSRF; rate limiting; email via mail interface (dev logger).
A: full auth flow passes integration tests; wrong password → 401; duplicate email → 409; reset token single-use.

### BE-002 — Events + membership + authz middleware
D: BE-001
F: `internal/domain/event`, `event_member`, authz middleware, handlers `events`, migrations `events`,`event_members`
Requirements: CRUD events; owner on create; membership/role resolution middleware for `/events/{id}/*`; foreign id → 404.
A: non-member GET/PATCH of another user's event → 404; owner-only delete enforced; role matrix tested.

---

## FRONTEND SHELL

### MKT-000 — Marketing shell
D: DS-003
F: `app/(marketing)/layout.tsx`, `components/marketing/{MarketingShell,MarketingHeader,MarketingFooter}.tsx`
Requirements: sticky blurred header (tokens), skip-link, footer, CTAs → auth; responsive nav.
A: matches prototype header/footer at desktop/tablet/mobile; no console errors.

### APP-000 — Dashboard shell
D: DS-003, BE-002
F: `app/app/layout.tsx`, `components/app/{AppShell,Sidebar,Topbar,CelebrationSwitcher}.tsx`
Requirements: sidebar grouped nav with active dot; celebration switcher from `GET /events`; topbar (search, Mula AI, theme, updates, locale, profile, preview button); session-gated layout (redirect to login); responsive sidebar + mobile nav.
A: desktop/tablet/mobile match prototype; unauthenticated → redirect; switching celebration rescopes; transitions present.

---

## AUTHENTICATION (frontend)

### AUTH-001 — Auth pages & forms
D: APP-000 (shell not required), DS-002, BE-001
F: `app/(auth)/{login,register,forgot,reset,verify}/page.tsx`, `components/auth/*`, `lib/validation/auth.ts`
Requirements: react-hook-form + zod; bind field errors from `400`; 401 handling; `next` redirect after login; verify/reset via token query.
A: register→verify→login→reach `/app`; invalid inputs show inline errors; e2e covers happy + failure paths.

---

## LANDING PAGE

### LAND-001 — Hero + 3D invitation
D: MKT-000, DS-003
F: `app/(marketing)/page.tsx`, `components/marketing/{Hero,InvitationCanvas}.tsx`, `lib/three/*`
Requirements: hero layout per prototype; lazy three.js invitation (`04`) with poster fallback + reduced-motion/no-WebGL path; `onPhase` syncs copy.
A: hero matches prototype desktop; mobile shows poster; no WebGL → poster; Lighthouse no severe perf regressions.

### LAND-002 — Marketing sections & subpages
D: LAND-001
F: `components/marketing/{FeatureShowcase,TemplateShowcase,TemplateCard,TemplateDetail,PricingTable,ArticleList,ArticleDetail,InspirationGallery,CTA,ContactForm}.tsx`, routes `features,pricing,templates,templates/[slug],inspiration,tips,tips/[slug],about,faq,help,contact,privacy,terms`
Requirements: reproduce prototype sections; templates from `GET /templates`; contact → `POST /contact`; SEO metadata; `robots.txt`/`sitemap.xml` handlers.
A: all routes render and match prototype responsively; template gallery filters; contact submits.

---

## DASHBOARD + FEATURES (each page = backend slice + frontend page)

For every feature below: **BE** task (domain+repo+handlers+migration) then **FE** task (page+components+query hooks), sharing the generated client.

### OVR — Overview
- BE-OVR: compute readiness (9 parts), journey counts, segments, timeline, notes (rule engine), note dismissals. F: `internal/application/overview`, handler `GET /events/{id}/overview`. A: deterministic readiness from seeded data; segments correct.
- FE-OVR: `app/app/overview/page.tsx`, `ReadinessArch`, `MulaNotes`, `GuestJourney`, `SmartSegments`, `EventTimeline`. D: APP-000, DS-003, BE-OVR. A: matches prototype; arch animates; notes actions call API; loading/empty states.

### GST — Guests & RSVP
- BE-GST: guests/groups/RSVP/segments CRUD + import; open tracking hook. Migrations `guests,guest_groups,rsvps`.
- FE-GST: `app/app/guests/page.tsx`, `GuestTable`,`GuestEditor`,`SmartSegments`. Optimistic select/group; search/sort/paginate. A: CRUD + segments; counts feed overview on invalidate.

### DSN — Invitation editor
- BE-DSN: invitation + sections CRUD, reorder, visibility, publish/unpublish (mints token). Migrations `invitations,invitation_sections`. Content sanitized on write.
- FE-DSN: `app/app/design/page.tsx`, `InvitationEditor`,`SectionEditor`,`PalettePicker`,`TemplateChooser`,`PreviewPanel`. Optimistic reorder/visibility. A: edits persist; publish returns public URL; preview reflects edits.

### SCH — Schedule
- BE-SCH / FE-SCH: schedule CRUD + reorder; `ScheduleEditor`, add-to-calendar (`.ics`). A: reorder optimistic; `.ics` downloads.

### TSK — Tasks
- BE-TSK / FE-TSK: tasks CRUD + toggle + counter; `TaskList`. A: done toggle optimistic; counter + readiness update.

### TEAM — Team
- BE-TEAM / FE-TEAM: members + roles + invite; `TeamMembers`. A: invite by email; role enforced server-side; owner-only writes.

### OPS — Check-in / Event day / Live
- BE-OPS / FE-OPS: checkin, eventday read, live config; `CheckinBoard`,`EventDayConsole`,`LivePanel`. A: check-in records; live status toggles; rehearsal is client-only.

### GIFT — Gift & Memories
- BE-GIFT / FE-GIFT: gifts, transactions (read), wishes, media; `GiftRegistry`,`TransactionList`,`MemoriesBoard`. A: registry CRUD; wishes list; media upload validated.

### BILL — Packages/Addons/Billing
- BE-BILL / FE-BILL: catalog + subscription + invoices + payment adapter + webhook; `PackageGrid`,`AddonGrid`,`BillingPanel`. A: checkout initiates provider; webhook updates subscription; invoices listed.

### SET — Settings
- BE-SET / FE-SET: `/me`, preferences, password, referral; `SettingsSections`. A: profile/appearance/language/notifications/security/purchases/referral all persist.

### ONB — Onboarding
- FE-ONB (+ reuses events/invitation BE): `app/app/onboarding/page.tsx`, `OnboardingFlow`; progressive build, event-type adaptive wording; `/app` redirects here when no event. A: completing onboarding creates event+draft invitation and lands on overview.

### MED — Media service
- BE-MED: storage interface (local/S3), upload validation (MIME+magic+size), signed URLs, EXIF strip. Used by DSN/GIFT. A: invalid type rejected; signed URL serves; oversized rejected.

---

## PUBLISHING & PUBLIC INVITATION

### PUB-001 — Publish pipeline
D: DSN, MED
F: publish/unpublish handlers, token minting, guest-safe DTO whitelist
A: only published invitations are publicly readable; unpublish revokes; required sections enforced (422 otherwise).

### PUB-002 — Public invitation page
D: PUB-001, DS-003, LAND-001 (3D)
F: `app/invite/[token]/page.tsx`, `components/invite/{InvitationView,RsvpForm,WishForm,AddToCalendar,GiftInfo}.tsx`
Requirements: ISR shell; shared renderer with host preview; RSVP + wish mutations (token-scoped); open tracking; personalisation when per-guest token.
A: guest sees published invitation; RSVP submits + updates host journey; foreign/unpublished token → 404.

---

## INTEGRATION / QA / HARDENING

### INT-001 — End-to-end wiring & seed
D: all FE/BE slices
F: seed script, docker-compose (Postgres), `.env.example`
A: fresh env → migrate + seed → full flow (register→onboard→design→publish→RSVP) works locally.

### QA-001 — Test suite (per `14-testing-strategy`)
D: all
A: unit + component + API + e2e for critical flows green in CI; coverage on auth/authz/publish/RSVP.

### PERF-001 — Performance pass
D: QA-001
A: lazy three.js verified; code-split per group; images/fonts optimized; mobile disables heavy effects; no layout thrashing; Lighthouse targets met.

### SEC-001 — Security review
D: QA-001
A: IDOR checks on every event-scoped resource; authz role matrix; input validation; upload security; rate limits; CSRF; secrets externalized. Checklist in `10` all satisfied.

---

## Notes
- Each task leaves a runnable check behind (unit/component/api/e2e) — no untested non-trivial logic.
- BE and FE slices for a feature can proceed in parallel against the OpenAPI contract (orval mock if needed) then integrate.
- Open questions / assumptions from earlier docs are resolved or flagged in the relevant task before build.
