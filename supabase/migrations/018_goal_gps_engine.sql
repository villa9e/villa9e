-- ── Goal GPS Engine tables ──────────────────────────────────────────────────

-- Extended goal_steps to support video sourcing
ALTER TABLE goal_steps ADD COLUMN IF NOT EXISTS youtube_videos  JSONB DEFAULT '[]';
ALTER TABLE goal_steps ADD COLUMN IF NOT EXISTS app_videos      JSONB DEFAULT '[]';
ALTER TABLE goal_steps ADD COLUMN IF NOT EXISTS week_number     INTEGER DEFAULT 1;
ALTER TABLE goal_steps ADD COLUMN IF NOT EXISTS estimated_days  INTEGER DEFAULT 7;
ALTER TABLE goal_steps ADD COLUMN IF NOT EXISTS milestone_type  TEXT DEFAULT 'action';

-- Extended goals for GPS metadata
ALTER TABLE goals ADD COLUMN IF NOT EXISTS estimated_cost    NUMERIC DEFAULT 0;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS requires_funding  BOOLEAN DEFAULT FALSE;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS target_date       DATE;

-- Tribe requests (pairing users with teammates from Trading Post)
CREATE TABLE IF NOT EXISTS tribe_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id       UUID,
  skills_needed TEXT[],
  goal_title    TEXT,
  status        TEXT DEFAULT 'open',
  matched_users UUID[],
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE tribe_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tribe_req_own" ON tribe_requests;
CREATE POLICY "tribe_req_own" ON tribe_requests USING (auth.uid() = user_id);

-- Mentor requests (Dreamline pairing)
CREATE TABLE IF NOT EXISTS mentor_requests (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id        UUID,
  category       TEXT,
  mentor_profile TEXT,
  status         TEXT DEFAULT 'seeking',
  mentor_id      UUID,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE mentor_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mentor_req_own" ON mentor_requests;
CREATE POLICY "mentor_req_own" ON mentor_requests USING (auth.uid() = user_id);

-- Studio videos (app-created content, prioritized over YouTube)
CREATE TABLE IF NOT EXISTS studio_videos (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id     UUID REFERENCES auth.users(id),
  title          TEXT NOT NULL,
  description    TEXT,
  video_url      TEXT,
  thumbnail_url  TEXT,
  category       TEXT,
  tags           TEXT[],
  watch_count    INTEGER DEFAULT 0,
  likes          INTEGER DEFAULT 0,
  is_affiliate   BOOLEAN DEFAULT FALSE,
  affiliate_url  TEXT,
  is_published   BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE studio_videos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "studio_read" ON studio_videos;
CREATE POLICY "studio_read" ON studio_videos FOR SELECT USING (is_published = TRUE);
DROP POLICY IF EXISTS "studio_own_write" ON studio_videos;
CREATE POLICY "studio_own_write" ON studio_videos FOR ALL USING (auth.uid() = creator_id);
