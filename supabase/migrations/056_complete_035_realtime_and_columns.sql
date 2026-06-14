-- ============================================================
-- Migration 056: Finish applying 035 (columns + realtime publication)
-- ============================================================
-- 035 was only partially applied in production: the new tables
-- (journal_entries, conversations, messages, crowdfunding_campaigns)
-- exist, but the trailing ALTER/UPDATE/publication statements never
-- ran. This picks up the missing pieces. Safe to re-run.

ALTER TABLE studio_videos ADD COLUMN IF NOT EXISTS oowop_count INT DEFAULT 0;

ALTER TABLE crowdfunding_campaigns ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
-- ADD COLUMN backfills the 'active' default onto existing rows, so correct
-- those to 'inactive' based on the legacy is_active flag.
UPDATE crowdfunding_campaigns SET status = 'inactive' WHERE is_active = FALSE AND status = 'active';

ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
