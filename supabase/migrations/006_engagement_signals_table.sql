-- ============================================================
-- Migration 006: Post Engagement Signals Table
-- For Dream Line algorithm training from device sensor data
-- ============================================================

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

-- Users can insert their own signals, admins can read all
CREATE POLICY "engagement_insert_own" ON post_engagement_signals
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "engagement_read_own" ON post_engagement_signals
  FOR SELECT USING (user_id = auth.uid());
