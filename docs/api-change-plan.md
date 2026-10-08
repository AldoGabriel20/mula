# API change plan

Conventions reused (no second convention): base `/api/v1`; list responses `{ "data": [...] }`; single resources are bare objects;
errors `{ "error": { "code", "message", "fields", "request_id" } }`; mutations behind `needAuth` + `csrf` (+ per-user write limit);
event routes behind `requireEventRole` (`member` / `editor` / `staff` / `owner`); foreign event → 404, wrong role → 403.
Compatibility: **every change is additive** (new nullable/defaulted columns, new optional JSON fields, new routes). Nothing is removed or renamed.

Order of work follows dependencies: migration `0014` → schedule/guests/tasks/gifts/live (columns only) → gift methods → members → activity →
sessions/phone → invitation (rsvp deadline, templates) → add-ons → frontend → seed → docs/tests.

## Migration `0014_ui_alignment`

```sql
ALTER TABLE schedule_items ADD COLUMN ends_at timestamptz, ADD COLUMN address text NOT NULL DEFAULT '',
  ADD COLUMN dress_code text NOT NULL DEFAULT '', ADD COLUMN description text NOT NULL DEFAULT '',
  ADD COLUMN visibility text NOT NULL DEFAULT 'everyone' CHECK (visibility IN ('everyone','invite_only','family_only')),
  ADD CONSTRAINT chk_schedule_range CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at >= starts_at);
ALTER TABLE guests ADD COLUMN table_label text, ADD COLUMN notes text NOT NULL DEFAULT '', ADD COLUMN invited_at timestamptz;
ALTER TABLE tasks ADD COLUMN category text NOT NULL DEFAULT '';
ALTER TABLE gifts ADD COLUMN quantity int NOT NULL DEFAULT 1 CHECK (quantity >= 1), ADD COLUMN claimed int NOT NULL DEFAULT 0,
  ADD CONSTRAINT chk_gift_claimed CHECK (claimed >= 0 AND claimed <= quantity);
ALTER TABLE live_config ADD COLUMN starts_at timestamptz, ADD COLUMN show_on_invitation boolean NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN phone text;
ALTER TABLE invitations ADD COLUMN rsvp_deadline timestamptz;
CREATE TABLE gift_methods (…);   CREATE TABLE templates (…) + seed;   CREATE TABLE user_addons (…);
```
Down migration drops exactly these. Indexes: `gift_methods(event_id, position)`, `user_addons(user_id)`, `user_addons(provider_ref)`.

## Endpoints

Auth tiers: **M** member · **E** editor (owner/cohost/planner) · **S** staff (editor + usher) · **O** owner.

### Modified
| Endpoint | Tier | Change |
| --- | --- | --- |
| `POST/PATCH /events/{id}/schedule[/{sid}]`, `GET …/schedule` | E / M | + `ends_at`, `address`, `dress_code`, `description`, `visibility`. 400 on bad visibility / `ends_at < starts_at`. |
| `GET/POST/PATCH /events/{id}/guests…`, import | M / E | + `table_label`, `notes` (≤ 1000), read-only `invited_at`. |
| `POST/PATCH /events/{id}/tasks[/{tid}]`, list | E / M | + `category` (≤ 40). |
| `POST/PATCH /events/{id}/gifts[/{gid}]`, list | E / M | + `quantity` (≥ 1), `claimed` (0..quantity). 400 otherwise. |
| `GET/PATCH /events/{id}/live` | E | + `starts_at` (RFC 3339 or null), `show_on_invitation`. |
| `PATCH /me`, `GET /me` | auth | + `phone` (≤ 32, digits/space/+/-/()). |
| `GET/PATCH /events/{id}/invitation` | M / E | + `rsvp_deadline`; `template_id` must exist in `templates` (400 otherwise). |
| `GET /invite/{token}` | public | + `gift_methods` (type/title/detail/copy_value), live `starts_at` when `show_on_invitation`. RSVP honours `rsvp_deadline`. |
| `GET /events` | auth | side effect: pending `event_members` rows whose email matches the **verified** caller are linked (`user_id`, `accepted_at`). |
| `POST /billing/checkout` | auth | body `{ "package"?: slug, "addons"?: [slug] }`, at least one; price summed server-side. |
| `GET /billing/subscription` | auth | + `addons: [{ slug, status }]`. |

### New
| Endpoint | Tier | Purpose |
| --- | --- | --- |
| `POST /events/{id}/guests/{gid}/resend` | E | Send the personal link by email; sets `invited_at`. 204 / 422 `no_email`. |
| `GET /events/{id}/gift-methods` | M | List ordered methods. |
| `POST /events/{id}/gift-methods` | E | `{type: bank\|wallet\|physical, title, detail, copy_value}`. |
| `PATCH /events/{id}/gift-methods/{mid}` · `DELETE …` | E | Edit / remove (scoped to the event). |
| `POST /events/{id}/gift-methods/reorder` | E | `{order:[ids]}`. |
| `GET /events/{id}/members` | M | Owner + members: `{id, user_id, name, email, role, status: active\|invited}`. |
| `POST /events/{id}/members` | O | `{email, role: cohost\|planner\|family\|usher}` → 201; duplicate → 409. |
| `PATCH /events/{id}/members/{mid}` | O | `{role}`; owner row immutable (422). |
| `DELETE /events/{id}/members/{mid}` | O | Owner row cannot be removed (422). |
| `GET /events/{id}/activity?limit=` | M | Recent activity: `{data:[{kind, actor, text, at}]}` newest first, limit ≤ 50 (default 12). |
| `GET /me/sessions` | auth | `{data:[{id, user_agent, ip, created_at, current}]}` |
| `DELETE /me/sessions/{id}` | auth | Revoke one of **own** sessions (foreign → 404); current session → 204 + cookie cleared. |
| `GET /templates` | public | Catalog `{data:[{id, slug, name, category, tags, palette}]}`. |

### Representative payloads

```jsonc
// GET /events/{id}/schedule → data[0]
{ "id":"…","title":"Reception","starts_at":"2027-01-07T11:00:00Z","ends_at":"2027-01-07T15:00:00Z","venue":"The Ballroom",
  "address":"Jl. Jend. Sudirman 5","dress_code":"Black tie optional","visibility":"everyone","description":"Dinner and toasts","position":1 }
// POST /events/{id}/members   {"email":"cilla@example.com","role":"cohost"}  → 201
{ "id":"…","user_id":null,"name":"","email":"cilla@example.com","role":"cohost","status":"invited" }
// GET /events/{id}/activity?limit=2
{ "data":[ {"kind":"rsvp","actor":"Sarah Wijaya","text":"confirmed attendance for 2","at":"2026-10-07T10:02:11Z"},
           {"kind":"wish","actor":"Budi Santoso","text":"sent a wish","at":"2026-10-07T09:40:00Z"} ] }
// POST /billing/checkout  {"addons":["live-stream","gallery"]} → 201 {"ref":"dev_…","url":"…"}
```

## Security notes per change
* Every handler derives the event from the path **and** checks the child row belongs to that event (existing `scoped()` pattern) → no cross-event IDOR.
* Members: owner-only writes, owner row immutable, email normalised (citext), no user enumeration (invite never reveals whether the email has an account).
* Pending-invite linking requires `email_verified_at IS NOT NULL` on the caller (otherwise anyone could register an invited address and take the seat).
* Sessions: query is `WHERE user_id = <caller>`; ids from the client are never trusted for ownership.
* Add-ons: amounts come from the DB; webhook settle stays signature-verified and idempotent.
* `resend` is a write behind `csrf` (per-user write limiter) and additionally the heavy limiter (outbound mail).
* New routes are registered in `authz_matrix_test.go` `policy` (the build fails otherwise).

## Tests (Go, existing harness)
Per slice in `internal/transport/http/integration_test.go`: happy path, validation (400), unauthenticated (401), wrong role (403), foreign event/child (404), conflict (409) where relevant. Authz matrix rows for every new event route. `make test` must stay green; frontend: `vitest`, `next lint`, Playwright flows.

## Frontend changes
`web/components/admin/{mappers,useAdminData,patch}.ts` + views: schedule form fields, guest notes/resend, task category, registry quantity/claimed, gift methods, live start, team page, activity/notifications, sessions, phone, RSVP deadline, design templates, add-on checkout, `cover/story/closing` editor wiring. Public invitation (`web/components/invite`) renders gift methods.

## Seeds
`api/cmd/seed` extended (idempotent): moments with details, guest notes/table labels, task categories, registry quantities, two gift methods, a pending team invite, templates are in the migration seed.
