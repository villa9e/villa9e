-- ============================================================
-- Migration 048: Spirit goal-chat threads (free-form history)
-- ============================================================
-- Persists each Spirit goal-building conversation so users can
-- see previous threads and pick up where they left off (and
-- modify the resulting goal). Free-form, ChatGPT-style: a thread
-- may or may not have produced a goal yet.

CREATE TABLE IF NOT EXISTS spirit_chat_threads (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title           text DEFAULT 'New chat',
  goal_id         uuid,                       -- set once a goal is created from this thread
  messages        jsonb DEFAULT '[]'::jsonb,  -- [{ role, content, ts }]
  phase           text DEFAULT 'discovery',
  last_message_at timestamptz DEFAULT now(),
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS spirit_chat_threads_user_idx
  ON spirit_chat_threads (user_id, last_message_at DESC);

ALTER TABLE spirit_chat_threads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own threads select" ON spirit_chat_threads;
DROP POLICY IF EXISTS "own threads insert" ON spirit_chat_threads;
DROP POLICY IF EXISTS "own threads update" ON spirit_chat_threads;
DROP POLICY IF EXISTS "own threads delete" ON spirit_chat_threads;

CREATE POLICY "own threads select" ON spirit_chat_threads
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own threads insert" ON spirit_chat_threads
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own threads update" ON spirit_chat_threads
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own threads delete" ON spirit_chat_threads
  FOR DELETE USING (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
