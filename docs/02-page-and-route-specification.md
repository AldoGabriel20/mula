# 02 — Page & Route Specification

Route inventory derived from the prototypes and corroborated by the recovered Next.js App Router manifest (`web/.next`). The app uses App Router route groups: `(marketing)`, `(auth)`, and `app/`.

Legend — **Auth**: `public` (no session), `guest` (public invitation viewer, token-scoped), `auth` (host session required). **API**: endpoints from `08-api-specification.md`.

---

## Public — marketing `(marketing)`

| Route | Purpose | Auth | Data Required | API Required |
| --- | --- | --- | --- | --- |
| `/` | Home / hero + 3D invitation, how-it-works, features teaser, template teaser, pricing teaser | public | Static + featured templates | `GET /templates?featured=true` (optional, can be static) |
| `/features` | Feature showcase | public | Static | — |
| `/how-it-works` | Process explainer | public | Static | — |
| `/pricing` | Plan tiers | public | Plans/packages | `GET /packages` (can be static at launch) |
| `/templates` | Template gallery (filterable) | public | Template list | `GET /templates` |
| `/templates/[slug]` | Template detail / preview | public | One template | `GET /templates/{slug}` |
| `/inspiration` | Editorial gallery | public | Static/CMS | — |
| `/tips` | Article list | public | Article list | static or `GET /tips` |
| `/tips/[slug]` | Article detail | public | One article | static or `GET /tips/{slug}` |
| `/about` | About | public | Static | — |
| `/faq` | FAQ | public | Static | — |
| `/help` | Help centre | public | Static | — |
| `/contact` | Contact form | public | — | `POST /contact` |
| `/privacy` | Privacy policy | public | Static | — |
| `/terms` | Terms | public | Static | — |
| `/robots.txt`, `/sitemap.xml` | SEO route handlers | public | Generated | — |

## Auth `(auth)`

| Route | Purpose | Auth | Data Required | API Required |
| --- | --- | --- | --- | --- |
| `/login` | Sign in | public | — | `POST /auth/login` |
| `/register` | Sign up | public | — | `POST /auth/register` |
| `/forgot` | Request password reset | public | — | `POST /auth/password/forgot` |
| `/reset` | Set new password (token) | public | reset token (query) | `POST /auth/password/reset` |
| `/verify` | Email verification (token) | public | verify token (query) | `POST /auth/verify` |

## App — authenticated dashboard `app/`

All require `auth`. Most are scoped to the currently selected celebration/event (`eventId`), chosen via the sidebar celebration switcher.

| Route | Purpose | Data Required | API Required |
| --- | --- | --- | --- |
| `/app` | Entry → redirects to `/app/overview` (or `/app/onboarding` if no event) | current user, events | `GET /me`, `GET /events` |
| `/app/onboarding` | Live onboarding; builds the invitation from answers | event draft | `POST /events`, `PATCH /events/{id}`, `GET /templates` |
| `/app/overview` | Readiness Arch, Mula Notes, guest journey, segments, timeline | event summary, readiness, notes, counts | `GET /events/{id}/overview` |
| `/app/guests` | Guest list, groups, segments, actions | guests, groups, RSVP | `GET/POST/PATCH/DELETE /events/{id}/guests`, `GET …/segments` |
| `/app/design` | Invitation editor (sections, palette, content, template) | invitation, sections, templates, media | `GET/PATCH /events/{id}/invitation`, `GET /templates`, media endpoints |
| `/app/schedule` | Event timeline / agenda | schedule items | `GET/POST/PATCH/DELETE /events/{id}/schedule` |
| `/app/tasks` | Task checklist | tasks | `GET/POST/PATCH/DELETE /events/{id}/tasks` |
| `/app/team` | Collaborators & roles | members, invites, presence | `GET/POST/DELETE /events/{id}/members` |
| `/app/checkin` | Guest check-in (operational) | guests, check-in state | `GET/POST /events/{id}/checkin` |
| `/app/eventday` | Event-day control + rehearsal | arrivals, ushers, alerts | `GET /events/{id}/eventday` |
| `/app/live` | Live stream status | stream config/status | `GET/PATCH /events/{id}/live` |
| `/app/gift` | Gift registry / transactions | gifts, transactions | `GET /events/{id}/gifts`, `GET …/transactions` |
| `/app/memories` | Wishes + post-event photos | wishes, media | `GET …/wishes`, `GET …/media` |
| `/app/print` | Printable outputs | invitation, guests | `GET /events/{id}/invitation`, export endpoints |
| `/app/packages` | Package selection | packages | `GET /packages` |
| `/app/addons` | Add-on purchases | addons | `GET /addons` |
| `/app/billing` | Subscription & purchases | subscription, invoices | `GET /billing/subscription`, `GET /billing/invoices` |
| `/app/settings` | Appearance, language, notifications, profile, security, purchases, referral | user, preferences | `GET/PATCH /me`, `GET/PATCH /me/preferences`, `POST /me/password` |

## Public invitation (guest-facing)

| Route | Purpose | Auth | Data Required | API Required |
| --- | --- | --- | --- | --- |
| `/invite/[token]` | Published wedding invitation seen by guests; RSVP, wishes, gift, add-to-calendar | guest (token) | published invitation, per-guest personalisation | `GET /invite/{token}`, `POST /invite/{token}/rsvp`, `POST /invite/{token}/wish` |

The `token` is per-event (and optionally per-guest for personalisation + open tracking). Viewing records an open event when the backend supports it (feeds Sent/Opened in the guest journey).

---

## Route classification

- **Public:** all `(marketing)` + `(auth)` routes, `/invite/[token]`, SEO handlers.
- **Authenticated:** all `/app/*`.
- **Protected resources:** every `/events/{id}/*` resource is ownership-checked server-side (see Security in `07`/`10`). The frontend never decides authorization.
- **Dynamic routes:** `/templates/[slug]`, `/tips/[slug]`, `/invite/[token]`.
- **Redirects:** `/app` → `/app/overview` (or `/app/onboarding` when the user has no event).

## Middleware

Edge middleware (recovered in build) handles locale (next-intl) and gates `/app/*`: no session → redirect to `/login?next=…`. Matcher excludes static assets and public routes. Authorization (ownership) is enforced in the API, not middleware.
