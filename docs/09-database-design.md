# 09 — Database Design

PostgreSQL. Only entities the product needs (per `07`). UUID primary keys (`gen_random_uuid()`), `created_at`/`updated_at timestamptz`, soft-delete (`deleted_at`) where recovery matters. JSONB for flexible section/content payloads. FKs `on delete cascade` from event-scoped children to `events`, except catalog tables.

Deferred domains (seating, thank-you composer, realtime) are **not** tabled yet.

---

## Entities

### users
| col | type | notes |
| --- | --- | --- |
| id | uuid pk | |
| email | citext unique not null | |
| password_hash | text not null | argon2id |
| name | text | |
| avatar_url | text | |
| email_verified_at | timestamptz null | |
| created_at / updated_at | timestamptz | |

### user_preferences
`user_id uuid pk fk→users`, `locale text default 'en'`, `theme text default 'system'`, `notifications jsonb default '{}'`.

### verification_tokens / password_reset_tokens
`id uuid pk`, `user_id fk`, `token text unique not null`, `expires_at timestamptz`, `used_at timestamptz null`. Index on `token`.

### sessions (if server-side sessions)
`id uuid pk`, `user_id fk`, `expires_at`, `user_agent`, `ip`. (Or stateless JWT — see `10`.)

### events
| col | type | notes |
| --- | --- | --- |
| id | uuid pk | |
| owner_id | uuid fk→users | |
| type | text not null | wedding, etc. (adapts wording) |
| couple_a / couple_b | text | partner names |
| event_date | timestamptz null | |
| venue | text null | |
| status | text not null default 'draft' | draft \| published |
| public_token | text unique null | minted on publish |
| created_at / updated_at / deleted_at | timestamptz | |

Index: `owner_id`, unique `public_token`.

### event_members
| col | type | notes |
| --- | --- | --- |
| id | uuid pk | |
| event_id | uuid fk→events | |
| user_id | uuid fk→users null | null until invite accepted |
| email | citext | invited email |
| role | text not null | owner \| cohost \| planner \| family \| usher |
| invited_at / accepted_at | timestamptz | |

Unique `(event_id, user_id)` and `(event_id, email)`. This table is the authorization backbone.

### invitations
`id uuid pk`, `event_id uuid unique fk→events`, `template_id uuid fk→templates null`, `palette text`, `content_language text default 'en'`, `published_at timestamptz null`, timestamps. 1:1 with event.

### invitation_sections
`id uuid pk`, `invitation_id fk`, `type text` (hero, story, schedule, gift, rsvp, …), `position int`, `visible boolean default true`, `content jsonb`, timestamps. Index `(invitation_id, position)`.

### templates (catalog)
`id uuid pk`, `slug text unique`, `name text`, `preview_media jsonb`, `palette text`, `section_defaults jsonb`, `featured boolean default false`, timestamps. Public read.

### guest_groups
`id uuid pk`, `event_id fk`, `name text`, timestamps. Unique `(event_id, name)`.

### guests
| col | type | notes |
| --- | --- | --- |
| id | uuid pk | |
| event_id | uuid fk→events | |
| group_id | uuid fk→guest_groups null | |
| name | text not null | |
| email / phone | text null | |
| plus_ones | int default 0 | |
| vip | boolean default false | feeds VIP segment |
| token | text unique null | per-guest public link + open tracking |
| opened_at | timestamptz null | first invitation view |
| created_at / updated_at / deleted_at | | |

Index: `event_id`, unique `token`.

### rsvps
`id uuid pk`, `guest_id uuid unique fk→guests`, `status text default 'pending'` (pending/yes/no), `party_size int`, `meal text null`, `note text null`, `responded_at timestamptz null`, timestamps.

### schedule_items
`id uuid pk`, `event_id fk`, `starts_at timestamptz null`, `title text`, `venue text null`, `position int`, timestamps. Index `(event_id, position)`.

### tasks
`id uuid pk`, `event_id fk`, `title text`, `priority text default 'normal'` (low/normal/high), `done boolean default false`, `due_at timestamptz null`, `position int`, timestamps.

### note_dismissals
`id uuid pk`, `event_id fk`, `user_id fk`, `note_key text`, `dismissed_at`. (Notes themselves are computed, not stored.)

### media
`id uuid pk`, `event_id fk`, `kind text` (image/photo/cover), `storage_key text`, `url text`, `content_type text`, `size_bytes bigint`, `meta jsonb`, `uploaded_by fk→users`, timestamps.

### checkins
`id uuid pk`, `event_id fk`, `guest_id fk→guests`, `checked_in_at timestamptz`, `by_user_id fk→users`. Unique `(event_id, guest_id)`.

### usher_assignments
`id uuid pk`, `event_id fk`, `member_id fk→event_members`, `area text`, `notes text`.

### live_config
`event_id uuid pk fk→events`, `provider text`, `stream_url text`, `status text default 'offline'`, timestamps.

### gifts
`id uuid pk`, `event_id fk`, `title text`, `description text`, `target_amount numeric null`, `url text null`, `position int`, timestamps.

### transactions
`id uuid pk`, `event_id fk`, `gift_id fk→gifts null`, `provider_ref text`, `amount numeric`, `currency text`, `from_name text`, `status text`, `created_at`. Sourced from payment webhooks.

### wishes
`id uuid pk`, `event_id fk`, `guest_id fk→guests null`, `author_name text`, `message text`, `phase text default 'pre'` (pre/post), `approved boolean default true`, `created_at`.

### packages / addons (catalog)
`id uuid pk`, `slug unique`, `name`, `price numeric`, `currency`, `features jsonb`, `active boolean`. Public read.

### subscriptions
`id uuid pk`, `user_id fk`, `package_id fk→packages`, `provider_ref text`, `status text`, `current_period_end timestamptz`, timestamps.

### invoices / purchases
`id uuid pk`, `user_id fk`, `provider_ref text`, `amount numeric`, `currency`, `status text`, `issued_at`, `pdf_url text null`.

### notifications
`id uuid pk`, `user_id fk`, `kind text`, `payload jsonb`, `read_at timestamptz null`, `created_at`. Index `(user_id, read_at)`.

### contact_messages
`id uuid pk`, `name`, `email`, `message text`, `created_at`. (From public contact form.)

---

## Migration 0015 — Gilded Seal template (additive)

Design: `15-template-gilded-seal-design.md` §4. File: `api/migrations/0015_gilded_seal.{up,down}.sql`.

| table | change | notes |
| --- | --- | --- |
| events | `timezone text not null default 'Asia/Jakarta'` | IANA zone; every date the invitation prints is rendered in it. Validated in the app (`time.LoadLocation`). Existing rows get the default |
| schedule_items | `label text not null default ''` | eyebrow above the moment title, e.g. "The Ceremony" (≤40, app-validated) |
| schedule_items | `map_url text not null default ''` | exact maps link; empty or `https://` only, ≤500 (app-validated) |
| schedule_items | `venue_note text not null default ''` | short location description (≤160, app-validated) |
| schedule_items | `media_id uuid null fk→media on delete set null` | moment photo; must belong to the same event (app-validated) |
| templates | row `gilded-seal` / "Gilded Seal" / Wedding / `Elegant · Cinematic` / Ivory / position 8 | `on conflict (slug) do nothing`; down migration deletes it (`invitations.template_id` → NULL) |

No new indexes.

---

## Migration 0016 — Template Kit (additive)

Design: `17-template-kit-design.md` §9.1. File: `api/migrations/0016_template_kit.{up,down}.sql`.

| table | change | notes |
| --- | --- | --- |
| templates | `kind text not null default 'coded'` | `coded` \| `themed` (CHECK) |
| templates | `status text not null default 'published'` | `draft` \| `published` \| `retired` (CHECK). A manifest removed from the repo becomes `retired`, never deleted |
| templates | `access text not null default 'free'` | `free` \| `premium` (CHECK); enforcement is a product decision |
| templates | `version int not null default 1` | bumped by `cmd/templates sync` on an additive manifest change |
| templates | `manifest jsonb not null default '{}'` | the full manifest; written only by `cmd/templates sync`. Sections, required and hidden-until-filled come from here |
| templates | `owner_id uuid null`, `parent_id uuid null fk→templates on delete set null` | phase 4 (host-made); nothing writes them yet. `owner_id` has no FK until phase 4 adds `fk→users on delete cascade` (a FK to users would make `TRUNCATE users CASCADE` wipe the catalog in the integration tests) |
| templates | `updated_at timestamptz not null default now()` | touched by sync only when the manifest changed |
| invitations | `theme jsonb not null default '{}'` | `{palette?, fontPairing?, motion?, tokens?}`; validated against the manifest |

Index `idx_templates_owner` (partial, `owner_id is not null`). `templates.active` stays; sync keeps it equal to `status = 'published'`.

---

## Relationships (ER summary)

```
users 1─* events (owner)
users *─* events  via event_members (role)            ← authorization
events 1─1 invitations 1─* invitation_sections
templates 1─* invitations
events 1─* guests *─? guest_groups
guests 1─1 rsvps
guests 1─? checkins
events 1─* schedule_items / tasks / media / gifts / wishes / notes_dismissals
gifts 1─* transactions
events 1─1 live_config
users 1─* subscriptions / invoices / notifications
packages 1─* subscriptions ; addons (catalog)
```

## Indexing & integrity highlights
- Unique: `users.email`, `events.public_token`, `guests.token`, `(event_members.event_id,user_id)`, `(guest_groups.event_id,name)`, `(checkins.event_id,guest_id)`.
- Hot lookups: `guests.event_id`, `invitation_sections(invitation_id,position)`, `tasks/schedule(event_id,position)`, `notifications(user_id,read_at)`, `events.owner_id`.
- All event-scoped children `on delete cascade` from `events`.
- Ownership queries always join through `event_members` for non-owner access.
- `citext` for emails (case-insensitive uniqueness). Enable `pgcrypto` for `gen_random_uuid()`.
