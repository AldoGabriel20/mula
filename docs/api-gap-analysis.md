# API gap analysis

Method: every feature in `docs/backend-ui-alignment-audit.md §2` was traced UI → frontend call → route → service → table.
Categories: **A** supported · **B** change endpoint · **C** missing endpoint · **D** frontend gap · **E** data-model gap · **F** ambiguity.
Status column is updated at the end of the task (✔ done · ◐ partly · ✖ not done).

| # | Feature (UI) | Cat | Current behaviour | Expected behaviour | Change | Depends on | Acceptance | Status |
| - | --- | --- | --- | --- | --- | --- | --- | --- |
| G1 | Schedule: end time, address, dress code, visibility, description | B+E | Only title/start/venue stored; extra form fields silently dropped | Persist and return all edit-form fields | migration `schedule_items` cols; extend `POST/PATCH …/schedule`; DTO | — | PATCH then GET returns the values; bad visibility → 400; end before start → 400 | ✔ API + UI (the "Map link" input has no column: see G23) |
| G2 | Guests: table label, notes | B+E | Not stored (table "—", notes lost) | `table_label`, `notes` on create/patch/import and in list DTO | migration; `guest` svc/repo/DTO | — | round-trip; notes ≤ 1000 chars | ✔ API + UI (notes editable in the drawer; table label shown, editable via API/CSV import only: G24) |
| G3 | Guests: "Resend invitation" | C | Toast only | Emails the personal link, stamps `invited_at` | `POST …/guests/{gid}/resend`; mail port | G2 | 204; no email → 422 `no_email`; foreign guest → 404; editor only | ✔ API + UI (single and bulk) |
| G4 | Tasks: category | B+E | Not stored | `category` on create/patch/list | migration; task svc/repo/DTO | — | round-trip | ✔ |
| G5 | Registry: quantity, gifted count | B+E | Not stored; "mark gifted" local | `quantity` ≥ 1, `claimed` 0..quantity | migration + CHECK; extend gift create/patch | — | claimed > quantity → 400 | ✔ |
| G6 | Gifts: "Ways to give" (bank / wallet / physical) | C+E | Local state only | Persisted per event; ordered; shown on public invitation | `gift_methods` table; `…/gift-methods` CRUD + reorder; public payload | — | CRUD + authz matrix + appears on `GET /invite/{token}` | ✔ (UI Edit uses sequential prompts: the approved layout has no inline form) |
| G7 | Live: start time, show-on-invitation | B+E | status/provider/url only | `starts_at`, `show_on_invitation` | migration; extend `…/live` | — | PATCH/GET round-trip | ✔ API + UI |
| G8 | Team: list, invite, change role, remove | C | spec'd in docs/08, not built | Members CRUD; pending invites link to the user on verified login | `…/members` routes; auto-link in event list | — | owner-only writes; cannot remove/demote owner; duplicate email → 409 | ◐ API complete; UI lists + invites (role change/remove controls are not in the approved layout) |
| G9 | Overview feed / notification panel | C | Synthesised client-side | Real recent activity (replies, wishes, check-ins, completed tasks, new guests) | `GET …/activity` (read-only UNION over existing tables) | — | newest first, `limit` ≤ 50, event-scoped | ✔ |
| G10 | Settings: phone | B+E | Input not persisted | `users.phone` via `PATCH /me` | migration; `me` svc/DTO | — | round-trip; length ≤ 32 | ✔ |
| G11 | Settings: "Signed in on" | C | Mock rows | List sessions, revoke one | `GET /me/sessions`, `DELETE /me/sessions/{id}` | — | only own sessions; current flagged; foreign id → 404 | ✔ |
| G12 | RSVP "Reply by" | B+E | Closes event day + 24 h | Optional explicit deadline | `invitations.rsvp_deadline`; `PATCH …/invitation`; `publicinvite` uses it | — | reply after deadline → 422 `rsvp_closed` | ✔ |
| G13 | Design templates | C+E | `template_id` has no table; UI list static | Catalog + validated selection | `templates` table + seed; `GET /templates`; FK | — | unknown template → 400 | ✔ |
| G14 | Add-on purchase | B+E | Checkout = package only; "Available soon" | `POST /billing/checkout {addons:[…]}`; owned add-ons returned | `user_addons`; extend checkout/settle/subscription | — | price from DB; replay-safe; owned list | ✔ |
| G15 | Cover/story/closing text, RSVP settings in the editor | D | Inputs uncontrolled | Controlled, saved through section content | frontend only | G12 | reload shows values | ◐ cover, generic sections (story, moments, gift, closing…) and the RSVP deadline persist; "Main information" (host names, opening message, kind) and "Most people per invitation" / reminder toggles have no API and stay local |
| G16 | Several invitations per event | F | One invitation per event | — | **BLOCKER** (see below) | — | — | ✖ documented |
| G17 | Invoice payment method | E | "—" | provider-reported method | — (provider is a dev stub; value unknown) | real provider | — | ✖ documented |
| G18 | Usher permissions (scan/lookup/seat/offline) | F | Not enforced | — | UI toggles stay session-local; role already gates check-in | product | — | ✖ documented |
| G19 | Two-step verification | F | — | — | out of scope | product | — | ✖ documented |
| G20 | Referral history list | F | Count only | — | needs attribution table + privacy decision | product | — | ✖ documented |
| G21 | Mula AI drafting | F | — | — | needs LLM provider + cost/abuse policy | product | — | ✖ documented |
| G23 | Moment "Map link" | E | Input exists, nothing stored | `map_url` on schedule_items (http/https only) | not built | — | — | ✖ documented |
| G24 | Guest table label editor | D | Table label has no input in the drawer | Add an input (approved layout has none) | not built | G2 | — | ✖ documented |
| G25 | Payment method select in checkout / promo codes | E | Select + `MULA10` were client-only | Provider-driven | select ignored; promo says "not available yet" | real provider | — | ✖ documented |
| G22 | Team invite by phone | F | — | — | no delivery channel; email only | product | — | ✖ documented |

## Ambiguities / blockers

* **G16 BLOCKER — several invitations per event.** The prototype lists invitations ("Family & friends", "Colleagues", …) each with its own audience, language, design, URL path and translation progress, limited by package (3 / 10). The backend models exactly one `invitations` row per event (`UNIQUE(event_id)`), guest links are `/invite/{token}` bound to the event, and `docs/07` says nothing about audiences. Decisions needed before building: (1) is an invitation a *variant of the same event* or a separate event? (2) which invitation does a guest's personal link open (needs `guests.invitation_id`)? (3) does the path (`mula.id/<slug>/<path>`) replace the opaque token? (4) per-language content storage (sections × languages). Until decided the dashboard shows **one real invitation**; the other cards are session-only previews (unchanged from the previous task).
* **G17** — invoice "method" cannot be known until a real payment provider replaces `payment.DevProvider`.
* **G18/G19/G20/G21/G22** — product decisions, not API work.

## Assumptions made (non-critical)

* Roles `cohost/planner/family/usher` map from the UI's Co-host / Planner / Family / Usher. Co-host "everything except billing" is already true: billing endpoints are user-scoped, not event-scoped.
* Pending team invites are attached to an account when **the verified email** matches, at `GET /events`.
* `visibility` values: `everyone | invite_only | family_only` (the UI's three options).
* Registry `claimed` is host-maintained (no guest-side claim flow exists in the UI).
