-- 0015 — "Gilded Seal" template support (docs/15-template-gilded-seal-design.md §4). All additive.

-- Local wall-clock for every date the invitation prints (moments are stored as instants).
ALTER TABLE events ADD COLUMN timezone text NOT NULL DEFAULT 'Asia/Jakarta';

-- Moment details the template prints.
ALTER TABLE schedule_items
  ADD COLUMN label      text NOT NULL DEFAULT '',   -- eyebrow, e.g. "The Ceremony"
  ADD COLUMN map_url    text NOT NULL DEFAULT '',   -- exact maps link (https only, validated in app)
  ADD COLUMN venue_note text NOT NULL DEFAULT '',   -- short location description
  ADD COLUMN media_id   uuid REFERENCES media(id) ON DELETE SET NULL; -- moment photo

INSERT INTO templates (slug, name, category, tags, palette, position)
VALUES ('gilded-seal', 'Gilded Seal', 'Wedding', 'Elegant · Cinematic', 'Ivory', 8)
ON CONFLICT (slug) DO NOTHING;
