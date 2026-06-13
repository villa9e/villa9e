-- ============================================================
-- Migration 054: Video mission score cache
-- ============================================================
-- Caches Claude's 0-100 relevance score for a (video, action) pair so
-- the same combination is never re-scored. Shared across all users —
-- the score is a property of the content/action match, not the viewer.

CREATE TABLE IF NOT EXISTS video_mission_scores (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id    text NOT NULL,
  action_key  text NOT NULL,   -- normalized (lowercased, trimmed) action title
  score       smallint NOT NULL,
  label       text,            -- 'green' | 'amber' | null (below threshold)
  created_at  timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS video_mission_scores_video_action_idx
  ON video_mission_scores (video_id, action_key);

ALTER TABLE video_mission_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone can read mission scores" ON video_mission_scores;
CREATE POLICY "anyone can read mission scores" ON video_mission_scores
  FOR SELECT USING (true);
-- Inserts come from the server (service role) via /api/workshop/score-video.

NOTIFY pgrst, 'reload schema';
