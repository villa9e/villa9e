-- Live stream comments for village/live/[userId] viewer page
-- Realtime enabled so comments propagate instantly to all viewers

CREATE TABLE IF NOT EXISTS live_stream_comments (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewer_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  username       text NOT NULL DEFAULT 'viewer',
  text           text NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_live_stream_comments_stream ON live_stream_comments(stream_user_id, created_at DESC);

ALTER TABLE live_stream_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone logged in can read live comments" ON live_stream_comments;
CREATE POLICY "Anyone logged in can read live comments" ON live_stream_comments
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Logged in users can post comments" ON live_stream_comments;
CREATE POLICY "Logged in users can post comments" ON live_stream_comments
  FOR INSERT WITH CHECK (auth.uid() = viewer_user_id OR auth.uid() IS NOT NULL);

ALTER PUBLICATION supabase_realtime ADD TABLE live_stream_comments;
