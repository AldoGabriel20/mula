# 06 — UI Data Requirements

Every dynamic-looking element classified. The dashboard prototype binds `{{ }}` placeholders, so most dashboard values are dynamic.

Classification: `STATIC` (hard-coded copy), `USER_GENERATED` (host/guest input), `SERVER_GENERATED` (server-owned e.g. ids, tokens, timestamps), `COMPUTED` (derived server-side or client-side from other data), `EXTERNAL` (third party, e.g. payments).

---

## Marketing

| UI Element | Page | Data Type | Source | Mutable | API |
| --- | --- | --- | --- | --- | --- |
| Hero copy, features, how-it-works | `/`, `/features`, `/how-it-works` | STATIC | code/i18n | no | — |
| Template list + cards | `/templates` | SERVER_GENERATED | templates | admin-only | `GET /templates` |
| Template detail/preview | `/templates/[slug]` | SERVER_GENERATED | templates | admin-only | `GET /templates/{slug}` |
| Pricing tiers | `/pricing` | SERVER_GENERATED | packages | admin-only | `GET /packages` (static OK at launch) |
| Tips/inspiration content | `/tips`, `/inspiration` | STATIC/SERVER | CMS or code | — | optional |
| Contact submission | `/contact` | USER_GENERATED | guest | create | `POST /contact` |

## Auth / user

| UI Element | Page | Data Type | Source | Mutable | API |
| --- | --- | --- | --- | --- | --- |
| Email, password | login/register | USER_GENERATED | user | create | `POST /auth/*` |
| Session / token | all app | SERVER_GENERATED | server | — | auth |
| Name, avatar, locale, theme pref | settings | USER_GENERATED | user | yes | `GET/PATCH /me`, `/me/preferences` |

## Event (celebration)

| UI Element | Page | Data Type | Source | Mutable | API |
| --- | --- | --- | --- | --- | --- |
| Celebration list (switcher) | shell | SERVER_GENERATED | events | create/delete | `GET /events` |
| Bride/partner names | design/overview | USER_GENERATED | host | yes | invitation |
| Wedding date & time | design/overview/schedule | USER_GENERATED | host | yes | event |
| Venue(s) | design/schedule | USER_GENERATED | host | yes | event |
| Event type (adapts wording) | onboarding | USER_GENERATED | host | yes | event |
| Invitation URL / token | design/publish | SERVER_GENERATED | server | regenerate | invitation |
| Invitation status (draft/published) | overview/design | COMPUTED/SERVER | server | via publish | invitation |

## Overview (signature sections)

| UI Element | Data Type | Source | Mutable | API |
| --- | --- | --- | --- | --- |
| Readiness score (nine parts) | COMPUTED | server (from invitation/guests/RSVP/schedule/gift/seating/checkin/live/final) | derived | `GET …/overview` |
| Each readiness part + link | COMPUTED | server | derived | overview |
| Mula Notes suggestions | COMPUTED/SERVER | server (rules over data) | dismiss/act | overview |
| Guest-journey counts (Sent/Opened/Replied/Reminder/Event-day/Thank-you) | COMPUTED | server | derived | overview |
| Smart segments (counts + action) | COMPUTED | server | derived | overview/guests |
| Timeline items | COMPUTED | server (tasks+event) | derived | overview/schedule |

## Guests & RSVP

| UI Element | Data Type | Source | Mutable | API |
| --- | --- | --- | --- | --- |
| Guest name, contact, group, plus-ones | USER_GENERATED | host | CRUD | guests |
| RSVP status / party size / meal | USER_GENERATED | guest (public) or host | yes | guests, invite rsvp |
| Guest count, RSVP count | COMPUTED | server | derived | overview/guests |
| Open/delivery status | SERVER_GENERATED | server (view tracking) | derived | guests (hidden if unsupported) |
| Segment membership | COMPUTED | server | derived | segments |

## Design / invitation

| UI Element | Data Type | Source | Mutable | API |
| --- | --- | --- | --- | --- |
| Invitation sections + order | USER_GENERATED | host | CRUD/reorder | invitation |
| Section content (text, images) | USER_GENERATED | host | yes | invitation, media |
| Per-section visibility toggle | USER_GENERATED | host | yes | invitation |
| Content language | USER_GENERATED | host | yes | invitation |
| Selected template / palette | USER_GENERATED | host | yes | invitation/templates |
| Uploaded media | USER_GENERATED | host | CRUD | media |

## Schedule / tasks / team

| UI Element | Data Type | Source | Mutable | API |
| --- | --- | --- | --- | --- |
| Schedule items (time, title, venue) | USER_GENERATED | host | CRUD/reorder | schedule |
| Tasks (title, priority, done) | USER_GENERATED | host | CRUD/toggle | tasks |
| `done of total` counter | COMPUTED | client/server | derived | tasks |
| Team members, roles | USER_GENERATED | host | CRUD | members |
| Presence / activity | SERVER_GENERATED | server | realtime | members |

## Operational (checkin / eventday / live)

| UI Element | Data Type | Source | Mutable | API |
| --- | --- | --- | --- | --- |
| Arrivals / check-in state | USER_GENERATED | staff | create | checkin |
| Usher assignments, alerts | SERVER/USER | server | yes | eventday |
| Stream status/config | USER_GENERATED | host | yes | live |
| Rehearsal simulation | COMPUTED | client | ephemeral | — |

## Gift / memories

| UI Element | Data Type | Source | Mutable | API |
| --- | --- | --- | --- | --- |
| Gift registry items | USER_GENERATED | host | CRUD | gifts |
| Transactions | SERVER/EXTERNAL | payment provider | read | transactions |
| Wishes | USER_GENERATED | guest | create | wishes |
| Post-event photos | USER_GENERATED | host/guest | CRUD | media |

## Billing / packages

| UI Element | Data Type | Source | Mutable | API |
| --- | --- | --- | --- | --- |
| Packages / add-ons | SERVER_GENERATED | catalog | admin | packages/addons |
| Subscription status | SERVER/EXTERNAL | payment provider | via checkout | billing |
| Invoices / purchases | SERVER/EXTERNAL | payment provider | read | billing |
| Referral code/stats | SERVER_GENERATED | server | derived | me/referral |

---

**Rule honored:** no dynamic element left unidentified. Anything not listed is STATIC copy or chrome. Open/delivery tracking is SERVER_GENERATED and may be feature-flagged off if the backend cannot record views at launch (per the review doc).
