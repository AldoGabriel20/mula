# 07 — Backend Requirements

Backend domains inferred from the UI, user flows, and the dynamic data in `06`. Only domains the product actually needs are included. Each carries ownership and authorization rules — the backend is the sole authority on access (never the frontend).

Stack decision (see `10`): **Go** HTTP API, PostgreSQL, modular (`internal/domain|application|infrastructure|transport`). OpenAPI spec is the contract consumed by the frontend via `orval`.

---

## Cross-cutting rules

- **Ownership:** every event-scoped resource belongs to an owner `user`; access is granted via event membership (owner + collaborators with roles). All `/events/{id}/*` requests verify the caller is a member with a sufficient role. Unknown/foreign id → `404` (don't leak existence).
- **Auth:** email/password with verification; sessions via httpOnly secure cookie (preferred) or bearer token. Password reset by emailed token.
- **Validation:** server validates all input (mirrors zod schemas); never trust client.
- **Audit/timestamps:** `created_at`, `updated_at` everywhere; soft-delete where recovery matters (guests, invitations).

---

## Domains

### 1. Authentication
- Purpose: register, login, logout, verify email, reset password.
- Entities: `User`, `Session`/token, `VerificationToken`, `PasswordResetToken`.
- Rules: unique email; password hashed (argon2id/bcrypt); verification required before publishing (ASSUMPTION — configurable); reset token single-use, expiring.
- Authz: public endpoints; rate-limited.

### 2. Users & Profiles
- Purpose: profile, preferences (locale, theme, notifications), referral.
- Entities: `User` (name, email, avatar), `UserPreference`, `Referral`.
- CRUD: read/update self only.
- Authz: self-scoped.

### 3. Events (Celebrations)
- Purpose: the top-level container a host manages; supports multiple per user.
- Entities: `Event` (couple names, type, date/time, venue, status, slug/token), `EventMember` (user↔event + role).
- Roles: `owner`, `cohost`, `planner`, `family`, `usher` (from Team UI). Role → permission matrix enforced per endpoint.
- CRUD: create (becomes owner), update, delete (owner only), list my events.
- Business: a user's "current event" is a client concern; server scopes by `eventId` path param.

### 4. Invitation & Content
- Purpose: the designed invitation — sections, content, template, palette, language, visibility.
- Entities: `Invitation` (1:1 Event), `InvitationSection` (ordered, type, content JSON, visible), `TemplateRef`, `Palette`.
- CRUD: read/update by members with edit rights; reorder sections; toggle visibility.
- Business: publish transitions status draft→published and mints a public token; content language per invitation.

### 5. Templates
- Purpose: catalog of designs for marketing gallery + design picker.
- Entities: `Template` (slug, name, preview media, palette, section defaults, featured flag).
- CRUD: read public; write admin-only (out of scope for host app).
- Authz: public read.

### 6. Guests & RSVP
- Purpose: guest list, groups, segments, RSVP, open tracking.
- Entities: `Guest` (name, contact, group, plus-ones, optional per-guest token), `Rsvp` (status, party size, meal, note), `GuestGroup`.
- Computed: segments (Not opened / Opened·no reply / VIP / Plus-ones / Needs follow-up), counts, guest-journey stages.
- CRUD: host CRUD guests; guest submits RSVP via public token.
- Business: open/delivery tracking recorded on invitation view (feature-flagged); RSVP editable until a cutoff (ASSUMPTION).
- Authz: host endpoints member-scoped; public RSVP token-scoped to one guest/event.

### 7. Schedule
- Purpose: event-day agenda / timeline.
- Entities: `ScheduleItem` (time, title, venue, order).
- CRUD: member edit; reorder. Add-to-calendar is client-side `.ics`.

### 8. Tasks
- Purpose: host checklist feeding readiness + timeline.
- Entities: `Task` (title, priority, done, due).
- CRUD: member edit; toggle done; counts computed.

### 9. Readiness & Notes (assistant)
- Purpose: compute the nine-part readiness score and generate Mula Notes suggestions.
- Entities: none persisted beyond `NoteDismissal` (which notes a user dismissed).
- Computed: readiness derived from invitation/guests/RSVP/schedule/gift/seating/checkin/live/final-checks; notes are rule-based over the same data.
- Authz: member read.
- **ASSUMPTION:** v1 "Mula AI" = deterministic rule engine, not an LLM. Flag for future.

### 10. Media
- Purpose: image/photo upload for invitation and memories.
- Entities: `Media` (owner event, url/key, kind, meta).
- CRUD: upload (validated type/size, virus/extension checks), delete.
- Authz: member-scoped; served via signed URLs or public for published invitation assets.
- Security: validate content type & size; store outside web root / object storage; strip EXIF where appropriate.

### 11. Publishing & Public Invitation
- Purpose: expose the published invitation to guests by token.
- Entities: reuse `Invitation` + `Event` + per-guest token.
- Rules: only published invitations are publicly readable; token maps to event (+ optional guest for personalisation & open tracking); unpublish revokes.
- Authz: public by token; no session; returns only published, guest-safe fields.

### 12. Check-in / Event-day / Live
- Purpose: operational day-of features.
- Entities: `Checkin` (guest, time, by), `UsherAssignment`, `LiveConfig` (stream url/status), `Alert`.
- CRUD: staff/member actions; presence/alerts may be realtime (SSE/websocket — deferred, poll at launch).
- Authz: member-scoped; check-in staff role.

### 13. Gift & Transactions
- Purpose: registry + received gifts.
- Entities: `Gift` (registry item), `Transaction` (amount, from, status) linked to payment provider.
- Authz: member read; transactions sourced from payments.

### 14. Memories
- Purpose: wishes (pre/post) + post-event photos.
- Entities: `Wish` (author, message, from guest or host), reuse `Media`.
- CRUD: guest creates wish via token; host moderates.

### 15. Billing & Packages
- Purpose: subscription, package/add-on purchase, invoices, referral.
- Entities: `Package`, `Addon`, `Subscription`, `Invoice`, `Purchase`.
- External: payment provider (EXTERNAL). Server stores status + references; provider holds card data.
- Authz: self/owner-scoped.

### 16. Notifications
- Purpose: in-app updates ("Updates"), reminders.
- Entities: `Notification` (user, kind, payload, read).
- CRUD: list, mark read. Delivery channels (email/push) deferred.

---

## Domains deliberately deferred (YAGNI for v1)

- Seating planner (needs table data not yet modeled — per review doc).
- Thank-you composer (post-event messaging).
- Realtime presence/websockets (poll first).
- LLM-based assistant (rule engine first).

Recorded as future work; not built in the initial implementation.
