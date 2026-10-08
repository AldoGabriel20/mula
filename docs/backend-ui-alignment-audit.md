# Backend ↔ UI alignment audit

Scope: align the existing Go API (`api/`) with the latest approved dashboard UI (`web/components/admin`, a port of
`docs/dashboard-admin-prototype`, "Mula Admin v3") and the public invitation. Evolution of an existing system, not a rewrite.

## 1. System as found

| Layer | Finding |
| --- | --- |
| Frontend | Next.js 14 App Router, React Query, one fetch wrapper (`web/lib/api/fetcher.ts`: credentials, CSRF header, error envelope, 401 → `/login`). Dashboard = `web/components/admin` (prototype logic + views; `useAdminData.ts` loads, `mappers.ts` maps, `patch.ts` overlays real handlers). Browser calls same-origin `/api/v1/*`, proxied by `next.config.js` to the API. |
| Backend | Go 1.25, stdlib `ServeMux`, pgx pool, golang-migrate. Layers: `domain/*` (entities, errors) → `application/*` (services + repo ports) → `infrastructure/postgres/*` (repos) → `transport/http/*` (handlers, DTOs, middleware). Router: `transport/http/router.go`. |
| Auth | Server-side sessions (`sessions` table), `httpOnly` cookie, double-submit CSRF on every mutation, per-user write limiter folded into the `csrf` middleware, per-IP limiter on anonymous routes. Event access: `requireEventRole` (member / editor / staff / owner); foreign event → 404, wrong role → 403. |
| Authorization tests | `authz_matrix_test.go` fails the build when an event-scoped route is registered without a role tier, and replays every route as anonymous / stranger / each role. |
| Schema | 13 migrations. Event-scoped tables cascade from `events`; soft delete on users/events/guests. `event_members` (roles `owner/cohost/planner/family/usher`) and `sessions` already exist. |
| Tests | `make test` (own `mula_test` DB, tables truncated). Baseline before this work: all Go packages green (HTTP integration suite ≈ 13 s). Vitest 39 tests, Playwright specs (`web/tests/e2e`). |
| Seeds | `api/cmd/seed` — demo user `demo@mula.test`, one published wedding (3 guests, 2 tasks, 1 invitation), idempotent, refuses outside `APP_ENV=dev`. |

## 2. UI → API feature inventory

Legend: **A** supported · **B** endpoint needs change · **C** missing endpoint · **D** frontend gap · **E** data-model gap · **F** ambiguity.
"Before" = state at the start of this task.

### Overview (`/app/overview`)
| UI feature | Frontend call | Endpoint | Before | Result |
| --- | --- | --- | --- | --- |
| Hero (names, date, days, readiness %) | `events`, `overview` | `GET /events`, `GET /events/{id}/overview` | A | reused |
| Readiness parts, Mula notes (+ "Later") | `overview`, dismiss | `GET …/overview`, `POST …/notes/{key}/dismiss` | A | reused |
| Guest response bar, journey, schedule list | derived from guests/overview/schedule | existing | A | reused |
| "Around the workspace" feed | **synthesised client-side** from guests/tasks | — | C | `GET /events/{id}/activity` |
| Online avatars / team presence | prototype mock | — | C | `GET /events/{id}/members` |

### Guests (`/app/guests`)
| UI feature | Endpoint | Before | Result |
| --- | --- | --- | --- |
| List, search, sort, segments, add, RSVP change, bulk delete, CSV import | `GET/POST …/guests`, `PATCH/DELETE …/guests/{gid}`, `POST …/guests/import`, `GET …/guests/segments`, `…/groups` | A | reused |
| Table column / seating, guest notes (drawer) | — | E | `guests.table_label`, `guests.notes` |
| "Resend invitation" (single + bulk) | **toast only, nothing sent** | C | `POST …/guests/{gid}/resend` (mail port; no email → 422 `no_email`) |
| Journey "Invitation sent" date | none | E | `guests.invited_at` |

### Schedule (`/app/schedule`)
Moment name, start, venue = A. End time, address, dress code, visibility, description (edit form) = E → new columns on `schedule_items`; `PATCH/POST …/schedule` extended (B).

### Tasks (`/app/tasks`)
CRUD/toggle = A. Category chips (Invitation, Design, Guests, Gift, Schedule, Event day) = E → `tasks.category`.

### Invitations list / editor / design (`/app/invitations*`, `/app/design`)
| UI feature | Before | Result |
| --- | --- | --- |
| Single invitation: palette, section visibility, publish/unpublish | A | reused |
| Cover title/line, story, closing text | D | wired to `PATCH …/invitation/sections/{sid}` content |
| RSVP "Reply by" deadline | E (cut-off hard-coded to event day + 24 h) | `invitations.rsvp_deadline`, enforced in `publicinvite` |
| Design templates ("Use this design") | E (`template_id` uuid with no table) | `templates` table + `GET /templates`; `PATCH …/invitation {template_id}` validated |
| **Several invitations per event** (names, audiences, languages, paths, limits, translation %) | — | **F / BLOCKER** — see gap analysis |

### Gifts (`/app/gift`)
| UI feature | Before | Result |
| --- | --- | --- |
| Registry title/description/price/url | A | reused |
| Registry quantity + "gifted" count | E | `gifts.quantity`, `gifts.claimed`; `PATCH …/gifts/{gid}` |
| "Ways to give" (bank, e-wallet, physical gift + copy value) | D (local state, lost on reload) / C | `gift_methods` table + `…/gift-methods` CRUD; shown on the public invitation |

### Memories, Event day, Check-in, Live
Wishes + approve, arrivals, event-day counters, check-in = A. Live: `starts_at`, "show on invitation" = E. Ushers list = C (members with role `usher`). Usher permission toggles (scan / lookup / seat / offline) = F (not enforced anywhere; role check already restricts check-in).

### Team (`/app/team`)
`docs/08` already specified `/events/{id}/members[/{mid}]`; never built → C. Invite by **email**; phone invites = F (no channel).

### Purchases (`/app/billing`, `/app/packages`, `/app/addons`, `/app/cart`)
Packages/invoices/subscription/checkout (package) = A. Add-on purchase = B/E (`checkout` accepts a package slug only; no entitlement record). Payment method per invoice = E (shown "—"). Invoice PDF = D (browser print of the receipt).

### Settings (`/app/settings`)
Name, password, language, theme, notifications, referral code = A. Phone = E (`users.phone`). "Signed in on" device list = C (`sessions` rows exist). Two-step verification = F (out of scope, toggle removed from scope list). Referral history = F (no attribution table; privacy decision needed).

### Not backend-backed by design
Global search (client-side over loaded data), print layouts (browser print), QR codes (client-rendered from the guest link), **Mula AI** drafting (needs an LLM provider → F), guide articles (static content).

## 3. Cross-cutting findings
1. **Misleading success toasts** in the new dashboard for features with no API (resend, team invite, gift methods). Fixed by building the APIs or removing the claim (`patch.ts`).
2. IDs: prototype logic needs numeric ids; the frontend keeps a uuid ↔ number map (`useAdminData.ts`). No API change needed.
3. Event access for **pending team members**: `event_members.user_id` is null until accepted, but nothing ever accepts. Fixed by linking pending memberships (verified email match) when the user lists events.
4. All new event-scoped routes must be added to the authz policy table (`authz_matrix_test.go`) — enforced by the existing test.
