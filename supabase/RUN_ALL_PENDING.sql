-- ============================================================
-- VILLA9E — RUN ALL PENDING MIGRATIONS
-- Paste this entire file into Supabase SQL Editor and run.
-- Safe to run multiple times (all use IF NOT EXISTS / ON CONFLICT).
-- ============================================================

-- ── MIGRATION 003: Dream Line Algorithm Config ──────────────

CREATE TABLE IF NOT EXISTS dreamline_config (
  id              INT PRIMARY KEY DEFAULT 1,
  algorithm       TEXT DEFAULT 'hybrid',
  boost_keywords  TEXT[] DEFAULT '{}',
  suppress_keywords TEXT[] DEFAULT '{}',
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO dreamline_config (id, algorithm) VALUES (1, 'hybrid') ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS content_review_queue (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID REFERENCES dream_line_posts(id) ON DELETE CASCADE,
  reason      TEXT,
  status      TEXT DEFAULT 'pending',
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to dream_line_posts
ALTER TABLE dream_line_posts ADD COLUMN IF NOT EXISTS mission_score    INT DEFAULT 50;
ALTER TABLE dream_line_posts ADD COLUMN IF NOT EXISTS is_flagged        BOOLEAN DEFAULT FALSE;
ALTER TABLE dream_line_posts ADD COLUMN IF NOT EXISTS is_boosted        BOOLEAN DEFAULT FALSE;
ALTER TABLE dream_line_posts ADD COLUMN IF NOT EXISTS engagement_score  INT DEFAULT 0;
ALTER TABLE dream_line_posts ADD COLUMN IF NOT EXISTS comment_count     INT DEFAULT 0;
ALTER TABLE dream_line_posts ADD COLUMN IF NOT EXISTS oowop_count       INT DEFAULT 0;
ALTER TABLE dream_line_posts ADD COLUMN IF NOT EXISTS view_count        INT DEFAULT 0;
ALTER TABLE dream_line_posts ADD COLUMN IF NOT EXISTS share_count       INT DEFAULT 0;

-- ── MIGRATION 004: Event RSVPs + Goal Team Status ───────────

CREATE TABLE IF NOT EXISTS event_rsvps (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   UUID NOT NULL REFERENCES spaces_events(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status     TEXT DEFAULT 'going' CHECK (status IN ('going','maybe','not_going')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_rsvps_event ON event_rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_user  ON event_rsvps(user_id);

ALTER TABLE goal_team_members ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'accepted';
ALTER TABLE goal_team_members ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE goal_team_members ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;

-- ── MIGRATION 005: Super Admin + Admin User ─────────────────

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE;

-- Create the admin@villa9e.app user
-- NOTE: Run this block AFTER deploying the app.
-- Then call POST https://villa9e.app/api/setup/admin with:
-- {"secret":"9b1e3642fc90970d32556d0ad55a263ff80012e0a9256ecf92c28bded70033a5"}
-- This will create admin@villa9e.app with password Jupiter2433!

DROP POLICY IF EXISTS "Super admins read all profiles" ON profiles;
CREATE POLICY "Super admins read all profiles"
  ON profiles FOR SELECT
  USING (
    auth.uid() IN (SELECT id FROM profiles WHERE is_super_admin = TRUE)
    OR auth.uid() = id
  );

-- ── MIGRATION 006: Post Engagement Signals ──────────────────

CREATE TABLE IF NOT EXISTS post_engagement_signals (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id          UUID NOT NULL REFERENCES dream_line_posts(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  attention_score  INT DEFAULT 0 CHECK (attention_score BETWEEN 0 AND 100),
  motion_events    INT DEFAULT 0,
  view_duration_ms INT DEFAULT 0,
  face_detected    BOOLEAN DEFAULT FALSE,
  engagement_score INT DEFAULT 0 CHECK (engagement_score BETWEEN 0 AND 100),
  recorded_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_engagement_post ON post_engagement_signals(post_id);
CREATE INDEX IF NOT EXISTS idx_engagement_user ON post_engagement_signals(user_id);

ALTER TABLE post_engagement_signals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "engagement_insert_own" ON post_engagement_signals;
CREATE POLICY "engagement_insert_own" ON post_engagement_signals
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "engagement_read_own" ON post_engagement_signals;
CREATE POLICY "engagement_read_own" ON post_engagement_signals
  FOR SELECT USING (user_id = auth.uid());

-- ── MIGRATION 007: Spirit Intelligence Tables ───────────────

CREATE TABLE IF NOT EXISTS spirit_memories (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  memory_type  TEXT NOT NULL,
  content      TEXT NOT NULL,
  metadata     JSONB DEFAULT '{}',
  importance   INT DEFAULT 5 CHECK (importance BETWEEN 1 AND 10),
  recalled_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_spirit_mem_user   ON spirit_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_spirit_mem_import ON spirit_memories(user_id, importance DESC);
ALTER TABLE spirit_memories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "spirit_mem_own" ON spirit_memories;
CREATE POLICY "spirit_mem_own" ON spirit_memories FOR ALL USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS spirit_patterns (
  user_id               UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  goals_set             INT DEFAULT 0,
  goals_completed       INT DEFAULT 0,
  oowops_given          INT DEFAULT 0,
  oowops_received       INT DEFAULT 0,
  avg_morning_mood      DECIMAL(3,1) DEFAULT 0,
  avg_evening_mood      DECIMAL(3,1) DEFAULT 0,
  streak_days           INT DEFAULT 0,
  spirit_calls_total    INT DEFAULT 0,
  last_spirit_call_at   TIMESTAMPTZ,
  preferred_time        TEXT DEFAULT 'morning',
  growth_velocity       DECIMAL(5,2) DEFAULT 0,
  primary_struggle      TEXT,
  primary_strength      TEXT,
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE spirit_patterns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "spirit_pat_own" ON spirit_patterns;
CREATE POLICY "spirit_pat_own" ON spirit_patterns FOR ALL USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS spirit_collective (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_type TEXT NOT NULL,
  archetype    TEXT,
  category     TEXT,
  insight      TEXT NOT NULL,
  confidence   DECIMAL(4,2),
  sample_size  INT DEFAULT 0,
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE spirit_collective ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "collective_read" ON spirit_collective;
CREATE POLICY "collective_read" ON spirit_collective FOR SELECT USING (TRUE);

CREATE TABLE IF NOT EXISTS spirit_checkin_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  checkin_type TEXT NOT NULL,
  mood         TEXT,
  mood_score   INT,
  spirit_text  TEXT,
  sent_push    BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_checkin_user ON spirit_checkin_log(user_id);
ALTER TABLE spirit_checkin_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "spirit_log_own" ON spirit_checkin_log;
CREATE POLICY "spirit_log_own" ON spirit_checkin_log FOR ALL USING (user_id = auth.uid());

-- ── DONE ────────────────────────────────────────────────────
SELECT 'All pending migrations (003–007) applied successfully.' AS status;
