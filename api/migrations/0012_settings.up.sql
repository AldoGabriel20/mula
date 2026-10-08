-- Settings support.
-- DATABASE SPECIFICATION GAP: docs/09 defines user_preferences (already in 0002) but no
-- referral storage. Minimal addition: a per-user, unique, server-generated referral code.
-- Referral attribution/credit ("referrals" rows) is deferred until signup-with-code exists.
ALTER TABLE users ADD COLUMN referral_code text UNIQUE;
