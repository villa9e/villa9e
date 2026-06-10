-- ============================================================
-- Migration 047: Fix Workshop feed query errors
-- ============================================================
-- app/village/workshop/page.tsx loadFeed() queries goal_templates
-- with .eq('is_public', true) but that column never existed (42703),
-- and queries studio_videos with profiles!creator_id(...) but the
-- only FK on studio_videos.creator_id pointed to auth.users, not
-- profiles, so PostgREST couldn't resolve the embed (PGRST200).

ALTER TABLE goal_templates ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true;

ALTER TABLE studio_videos
  ADD CONSTRAINT studio_videos_creator_id_profiles_fkey
  FOREIGN KEY (creator_id) REFERENCES profiles(id) ON DELETE CASCADE;

NOTIFY pgrst, 'reload schema';
