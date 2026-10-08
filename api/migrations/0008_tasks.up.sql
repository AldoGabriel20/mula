-- Host checklist tasks (docs/09).
CREATE TABLE tasks (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title      text NOT NULL,
  priority   text NOT NULL DEFAULT 'normal', -- low | normal | high
  done       boolean NOT NULL DEFAULT false,
  due_at     timestamptz,
  position   int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_tasks_pos ON tasks(event_id, position);
