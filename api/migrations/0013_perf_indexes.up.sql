-- Foreign-key columns that cascades / joins actually scan (PERF-001 audit). Deliberately NOT
-- indexed: verification/reset tokens (tiny, looked up by token), note_dismissals.user_id,
-- checkins.by_user_id, media.uploaded_by, subscriptions.package_id (2-row catalog).
CREATE INDEX IF NOT EXISTS idx_guests_group     ON guests(group_id)       WHERE group_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_checkins_guest   ON checkins(guest_id);
CREATE INDEX IF NOT EXISTS idx_wishes_guest     ON wishes(guest_id)       WHERE guest_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_gift ON transactions(gift_id) WHERE gift_id IS NOT NULL;
