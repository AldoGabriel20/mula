# 08 — API Specification

The contract between the Go backend and the Next.js frontend. Base path `/api/v1`. The authoritative artifact is an **OpenAPI 3.1 document** (`docs/openapi.yaml`, authored during implementation) from which the frontend TypeScript client is generated with **orval** (already a dependency). This document specifies the shape; the OpenAPI file is the machine source.

---

## Conventions

- **Versioning:** URL prefix `/api/v1`.
- **Auth:** session via `httpOnly; Secure; SameSite=Lax` cookie (preferred) — bearer `Authorization: Bearer <jwt>` also accepted for non-browser clients. CSRF protection (double-submit token) on cookie-auth mutations.
- **Content type:** `application/json`; file upload `multipart/form-data`.
- **IDs:** UUID (server-generated). Public tokens are opaque random strings.
- **Timestamps:** RFC 3339 UTC.
- **Pagination:** cursor-based — `?limit=&cursor=`; response `{ data: [...], next_cursor }`. Lists capped (default 50, max 200).
- **Filtering/sorting:** `?filter[field]=&sort=field|-field` (e.g. `sort=-created_at`).
- **Errors:** uniform envelope
  ```json
  { "error": { "code": "validation_error", "message": "…", "fields": { "email": "required" }, "request_id": "…" } }
  ```
- **Status codes:** `200/201/204` success; `400` validation; `401` unauthenticated; `403` forbidden (role); `404` not found / not owned; `409` conflict; `422` business rule; `429` rate limited; `5xx` server.
- **Rate limiting:** per-IP on auth + public endpoints; per-user on writes. `429` + `Retry-After`.
- **Authorization:** every `/events/{eventId}/*` verifies membership + role server-side. Foreign/unknown id → `404`.
- No internal DB columns exposed; responses are explicit DTOs.

---

## Endpoints (summary)

Format per endpoint: method, path, auth, authz, notes. Request/response bodies live in the OpenAPI file; representative shapes shown for the core resources.

### Auth
| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| POST | `/auth/register` | public | `{email,password,name}` → creates user, sends verification |
| POST | `/auth/login` | public | `{email,password}` → sets session cookie |
| POST | `/auth/logout` | auth | clears session |
| POST | `/auth/verify` | public | `{token}` → marks email verified |
| POST | `/auth/verify/resend` | public | `{email}` |
| POST | `/auth/password/forgot` | public | `{email}` → emails reset token |
| POST | `/auth/password/reset` | public | `{token,password}` |

### Me / profile
| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/me` | auth | current user |
| PATCH | `/me` | auth | name, avatar |
| POST | `/me/password` | auth | `{current,new}` |
| GET/PATCH | `/me/preferences` | auth | locale, theme, notifications |
| GET | `/me/referral` | auth | code + stats |

### Events
| Method | Path | Auth | Authz | Notes |
| --- | --- | --- | --- | --- |
| GET | `/events` | auth | member | list my events |
| POST | `/events` | auth | — | create (caller = owner) |
| GET | `/events/{id}` | auth | member | |
| PATCH | `/events/{id}` | auth | editor | names, type, date, venue |
| DELETE | `/events/{id}` | auth | owner | |
| GET | `/events/{id}/overview` | auth | member | readiness + notes + journey + segments + timeline |

### Invitation
| Method | Path | Auth | Authz |
| --- | --- | --- | --- |
| GET | `/events/{id}/invitation` | auth | member |
| PATCH | `/events/{id}/invitation` | auth | editor |
| GET/POST/PATCH/DELETE | `/events/{id}/invitation/sections[/{sid}]` | auth | editor |
| POST | `/events/{id}/invitation/sections/reorder` | auth | editor |
| POST | `/events/{id}/invitation/publish` | auth | owner/editor |
| POST | `/events/{id}/invitation/unpublish` | auth | owner/editor |

### Guests / RSVP / segments
| Method | Path | Auth | Authz |
| --- | --- | --- | --- |
| GET/POST | `/events/{id}/guests` | auth | member/editor |
| GET/PATCH/DELETE | `/events/{id}/guests/{gid}` | auth | editor |
| POST | `/events/{id}/guests/import` | auth | editor |
| POST | `/events/{id}/guests/{gid}/resend` | auth | editor — emails the personal link, sets `invited_at`; 422 `no_email` |
| GET | `/events/{id}/guests/segments` | auth | member |
| GET/POST | `/events/{id}/groups` | auth | editor |

### Schedule / tasks / team
| Method | Path | Auth | Authz |
| --- | --- | --- | --- |
| GET/POST | `/events/{id}/schedule` | auth | member/editor |
| PATCH/DELETE | `/events/{id}/schedule/{sid}` | auth | editor |
| POST | `/events/{id}/schedule/reorder` | auth | editor |
| GET/POST | `/events/{id}/tasks` | auth | member/editor |
| PATCH/DELETE | `/events/{id}/tasks/{tid}` | auth | editor |
| GET | `/events/{id}/members` | auth | member |
| POST | `/events/{id}/members` | auth | owner — `{email, role: cohost\|planner\|family\|usher}`; 409 duplicate |
| PATCH/DELETE | `/events/{id}/members/{mid}` | auth | owner — owner row immutable (422) |
| GET | `/events/{id}/activity?limit=` | auth | member — `{data:[{kind,actor,text,at}]}`, newest first, limit ≤ 50 |

### Operational / media / gift / memories
| Method | Path | Auth | Authz |
| --- | --- | --- | --- |
| GET/POST | `/events/{id}/checkin` | auth | staff |
| GET | `/events/{id}/eventday` | auth | member |
| GET/PATCH | `/events/{id}/live` | auth | editor |
| GET/POST/DELETE | `/events/{id}/media` | auth | editor |
| GET | `/events/{id}/gifts` | auth | member |
| POST/PATCH/DELETE | `/events/{id}/gifts[/{gid}]` | auth | editor — `quantity` ≥ 1, `claimed` 0..quantity |
| GET | `/events/{id}/gift-methods` | auth | member |
| POST | `/events/{id}/gift-methods`, `/gift-methods/reorder` | auth | editor — `{type: bank\|wallet\|physical, title, detail, copy_value}` |
| PATCH/DELETE | `/events/{id}/gift-methods/{mid}` | auth | editor |
| GET | `/events/{id}/transactions` | auth | member |
| GET | `/events/{id}/wishes` | auth | member |

### Billing / catalog
| Method | Path | Auth |
| --- | --- | --- |
| GET | `/me/sessions` | auth — own sessions, `current` flagged |
| DELETE | `/me/sessions/{id}` | auth — own session only (foreign → 404); current → cookie cleared |
| GET | `/packages`, `/addons` | public |
| GET | `/billing/subscription`, `/billing/invoices` | auth |
| POST | `/billing/checkout` | auth (→ provider) — `{package?: slug, addons?: [slug]}`, at least one, price summed server-side |
| POST | `/billing/webhook` | provider (signed) |

### Templates / content (public)
| Method | Path | Auth |
| --- | --- | --- |
| GET | `/templates` | public — `{data:[{id,slug,name,category,tags,palette}]}` (`/templates/{slug}` not built) |
| GET | `/tips`, `/tips/{slug}` | public (optional) |
| POST | `/contact` | public (rate-limited) |

### Public invitation (guest, token-scoped)
| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/invite/{token}` | guest | published, guest-safe invitation (`gift_methods`, `live` when shown and not offline, `rsvp_deadline`); records open if enabled |
| POST | `/invite/{token}/rsvp` | guest | `{status,party_size,meal,note}`; 422 `rsvp_closed` after `rsvp_deadline` (or event day + 24 h when none) |
| POST | `/invite/{token}/wish` | guest | `{name,message}` |

---

## Representative DTOs

```jsonc
// Event
{ "id":"uuid","couple":{"a":"…","b":"…"},"type":"wedding","date":"2026-11-20T10:00:00Z",
  "venue":"…","status":"draft|published","public_url":"https://…/invite/<token>",
  "created_at":"…","updated_at":"…" }

// Overview (computed)
{ "readiness":{"score":72,"parts":[{"key":"invitation","label":"Invitation","value":100,"href":"/app/design"}, …9]},
  "notes":[{"id":"…","text":"18 guests opened but haven't replied.","action":{"label":"Send reminder","kind":"rsvp_reminder"}}],
  "journey":{"sent":120,"opened":90,"replied":64,"reminder":12,"eventday":0,"thankyou":0},
  "segments":[{"key":"opened_no_reply","label":"Opened · no reply","count":26,"action":{…}}],
  "timeline":[{"date":"…","title":"…","done":true}] }

// Guest
{ "id":"uuid","name":"…","group":"family","plus_ones":1,"contact":{"email":"…","phone":"…"},
  "rsvp":{"status":"pending|yes|no","party_size":2,"meal":"…"},"opened_at":"…|null" }

// Public invitation (guest-safe subset)
{ "event":{"couple":{…},"date":"…","venue":"…"},"template":"…","palette":"…",
  "sections":[{"type":"hero","content":{…},"visible":true}, …],
  "guest":{"name":"…"}|null }
```

Business rules (publish requires verified email + required sections present; RSVP cutoff; token single event) are annotated on the relevant OpenAPI operations.


## Changes from the UI-alignment task (migration 0014)

See `docs/api-change-plan.md` for the full list, payloads and security notes. Additive fields: schedule (`ends_at`, `address`, `dress_code`, `description`, `visibility`), guests (`table_label`, `notes`, read-only `invited_at`), tasks (`category`), gifts (`quantity`, `claimed`), live (`starts_at`, `show_on_invitation`), `/me` (`phone`), invitation (`rsvp_deadline`, validated `template_id`), subscription (`addons`).
