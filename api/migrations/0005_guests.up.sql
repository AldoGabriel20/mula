-- Guests, groups, RSVP (docs/09).
CREATE TABLE guest_groups (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_guest_groups_name ON guest_groups(event_id, name);

CREATE TABLE guests (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  group_id   uuid REFERENCES guest_groups(id) ON DELETE SET NULL,
  name       text NOT NULL,
  email      text,
  phone      text,
  plus_ones  int NOT NULL DEFAULT 0,
  vip        boolean NOT NULL DEFAULT false,
  token      text UNIQUE,
  opened_at  timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX idx_guests_event ON guests(event_id);

CREATE TABLE rsvps (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id     uuid UNIQUE NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  status       text NOT NULL DEFAULT 'pending', -- pending | yes | no
  party_size   int NOT NULL DEFAULT 0,
  meal         text,
  note         text,
  responded_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
