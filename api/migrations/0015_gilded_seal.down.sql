DELETE FROM templates WHERE slug = 'gilded-seal'; -- invitations.template_id → NULL (FK ON DELETE SET NULL)
ALTER TABLE schedule_items
  DROP COLUMN IF EXISTS media_id, DROP COLUMN IF EXISTS venue_note, DROP COLUMN IF EXISTS map_url, DROP COLUMN IF EXISTS label;
ALTER TABLE events DROP COLUMN IF EXISTS timezone;
