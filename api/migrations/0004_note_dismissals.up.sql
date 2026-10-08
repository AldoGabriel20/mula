-- Mula Notes dismissals (docs/09). Notes themselves are computed, not stored.
CREATE TABLE note_dismissals (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  note_key     text NOT NULL,
  dismissed_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_note_dismissals ON note_dismissals(event_id, user_id, note_key);
