-- ============================================================
-- VILLA9E MIGRATION 003 — Dream Line Algorithm + Video Analysis
-- Run this in Supabase SQL editor
-- ============================================================

-- Dream Line algorithm config (admin-controlled)
CREATE TABLE IF NOT EXISTS dreamline_config (
  id                    INT PRIMARY KEY DEFAULT 1,
  algorithm             TEXT NOT NULL DEFAULT 'mission_scored',
  -- algorithm options: 'chronological' | 'engagement' | 'mission_scored' | 'hybrid'
  mission_score_minimum INT NOT NULL DEFAULT 50,
  -- posts below this score are hidden from feed (shown to author only)
  boost_keywords        TEXT[] DEFAULT '{}',
  -- keywords that boost post ranking
  suppress_keywords     TEXT[] DEFAULT '{}',
  -- keywords that suppress post ranking (but don't hide)
  auto_hide_below       INT NOT NULL DEFAULT 20,
  -- posts scoring below this are auto-hidden pending review
  require_video_check   BOOLEAN NOT NULL DEFAULT FALSE,
  -- run Video Intelligence on all video links before showing
  oowop_weight          NUMERIC(3,2) DEFAULT 0.4,
  -- 0-1 weight for OoWop count in hybrid ranking
  recency_weight        NUMERIC(3,2) DEFAULT 0.3,
  -- 0-1 weight for recency in hybrid ranking
  mission_weight        NUMERIC(3,2) DEFAULT 0.3,
  -- 0-1 weight for mission alignment in hybrid ranking
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by            UUID REFERENCES profiles(id)
);

-- Seed default config
INSERT INTO dreamline_config (id) VALUES (1) ON CONFLICT DO NOTHING;

-- Dream Line post mission scoring
ALTER TABLE dream_line_posts ADD COLUMN IF NOT EXISTS mission_score INT DEFAULT 75;
-- 0-100: how well this post aligns with villa9e's mission
ALTER TABLE dream_line_posts ADD COLUMN IF NOT EXISTS mission_labels TEXT[] DEFAULT '{}';
-- Video Intelligence labels if post contains a video URL
ALTER TABLE dream_line_posts ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;
-- Admin-hidden or auto-hidden by score threshold
ALTER TABLE dream_line_posts ADD COLUMN IF NOT EXISTS hidden_reason TEXT;
ALTER TABLE dream_line_posts ADD COLUMN IF NOT EXISTS video_url TEXT;
-- Extracted video URL from post content for analysis
ALTER TABLE dream_line_posts ADD COLUMN IF NOT EXISTS video_analyzed BOOLEAN DEFAULT FALSE;

-- Content review queue (posts flagged for low mission alignment)
CREATE TABLE IF NOT EXISTS content_review_queue (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id         UUID NOT NULL REFERENCES dream_line_posts(id) ON DELETE CASCADE,
  mission_score   INT NOT NULL,
  reason          TEXT,
  status          TEXT NOT NULL DEFAULT 'pending',
  -- pending | approved | rejected
  reviewed_by     UUID REFERENCES profiles(id),
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE content_review_queue ENABLE ROW LEVEL SECURITY;
-- Only admin can see the review queue (handled by app-level check)
CREATE POLICY "Admin only review queue" ON content_review_queue FOR ALL USING (true);
