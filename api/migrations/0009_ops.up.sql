-- Check-in + live config (docs/09). usher_assignments is added with the team/usher task.
CREATE TABLE checkins (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  guest_id      uuid NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  checked_in_at timestamptz NOT NULL DEFAULT now(),
  by_user_id    uuid REFERENCES users(id) ON DELETE SET NULL
);
CREATE UNIQUE INDEX uq_checkins_guest ON checkins(event_id, guest_id);

CREATE TABLE live_config (
  event_id   uuid PRIMARY KEY REFERENCES events(id) ON DELETE CASCADE,
  provider   text NOT NULL DEFAULT '',
  stream_url text NOT NULL DEFAULT '',
  status     text NOT NULL DEFAULT 'offline', -- offline | scheduled | live
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
