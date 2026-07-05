-- ============================================================
-- Migration 072: Spirit conversation threads + messages
-- ============================================================

CREATE TABLE IF NOT EXISTS spirit_threads (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS spirit_threads_user_idx ON spirit_threads (user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS spirit_messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id  uuid NOT NULL REFERENCES spirit_threads(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       text NOT NULL CHECK (role IN ('user', 'spirit')),
  content    text NOT NULL,
  metadata   jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS spirit_messages_thread_idx ON spirit_messages (thread_id, created_at ASC);
CREATE INDEX IF NOT EXISTS spirit_messages_user_idx   ON spirit_messages (user_id, created_at DESC);

ALTER TABLE spirit_threads  ENABLE ROW LEVEL SECURITY;
ALTER TABLE spirit_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own_threads"   ON spirit_threads;
DROP POLICY IF EXISTS "own_messages"  ON spirit_messages;

CREATE POLICY "own_threads"  ON spirit_threads  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_messages" ON spirit_messages FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Auto-update thread updated_at when a message is inserted
CREATE OR REPLACE FUNCTION update_thread_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE spirit_threads SET updated_at = now() WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS spirit_msg_updates_thread ON spirit_messages;
CREATE TRIGGER spirit_msg_updates_thread
  AFTER INSERT ON spirit_messages
  FOR EACH ROW EXECUTE FUNCTION update_thread_timestamp();

NOTIFY pgrst, 'reload schema';
