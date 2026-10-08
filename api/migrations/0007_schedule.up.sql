-- Schedule items (docs/09).
CREATE TABLE schedule_items (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  starts_at  timestamptz,
  title      text NOT NULL,
  venue      text,
  position   int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_schedule_items_pos ON schedule_items(event_id, position);
