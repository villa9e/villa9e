-- ============================================================
-- Migration 007: Spirit Intelligence — Memory, Patterns, Collective
-- The "personal LLM" layer for each user's Spirit
-- ============================================================

-- Per-user Spirit memory bank
-- Each row = one memory embedding (goal, completion, conversation, insight)
CREATE TABLE IF NOT EXISTS spirit_memories (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  memory_type  TEXT NOT NULL CHECK (memory_type IN (
    'goal_set', 'step_completed', 'goal_achieved',
    'check_in', 'conversation', 'oowop_received',
    'insight', 'struggle', 'celebration', 'pattern'
  )),
  content      TEXT NOT NULL,               -- human-readable summary
  metadata     JSONB DEFAULT '{}',          -- raw data (goal_id, score, mood, etc.)
  embedding    vector(1536),                -- pgvector for similarity search
  importance   INT DEFAULT 5 CHECK (importance BETWEEN 1 AND 10),
  recalled_at  TIMESTAMPTZ,                -- last time this was pulled into context
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_spirit_memories_user   ON spirit_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_spirit_memories_type   ON spirit_memories(memory_type);
CREATE INDEX IF NOT EXISTS idx_spirit_memories_import ON spirit_memories(user_id, importance DESC);

-- Per-user Spirit pattern summary (updated weekly by cron)
CREATE TABLE IF NOT EXISTS spirit_patterns (
  user_id               UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  -- Goal behavior
  goals_set             INT DEFAULT 0,
  goals_completed       INT DEFAULT 0,
  avg_completion_days   INT DEFAULT 0,
  favorite_category     TEXT,
  strongest_step_type   TEXT,
  -- Social behavior
  oowops_given          INT DEFAULT 0,
  oowops_received       INT DEFAULT 0,
  avg_oowops_per_post   DECIMAL(5,2) DEFAULT 0,
  -- Wellness
  avg_morning_mood      DECIMAL(3,1) DEFAULT 0,
  avg_evening_mood      DECIMAL(3,1) DEFAULT 0,
  streak_days           INT DEFAULT 0,
  -- Spirit interaction
  spirit_calls_total    INT DEFAULT 0,
  last_spirit_call_at   TIMESTAMPTZ,
  preferred_time        TEXT DEFAULT 'morning',  -- when they most use Spirit
  -- Growth
  growth_velocity       DECIMAL(5,2) DEFAULT 0,  -- village score gained per week
  primary_struggle      TEXT,                    -- what they most often need help with
  primary_strength      TEXT,                    -- where they shine
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Anonymized collective intelligence (aggregated from all users, no PII)
-- Feeds back into every Spirit call as "village wisdom"
CREATE TABLE IF NOT EXISTS spirit_collective (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_type   TEXT NOT NULL,   -- e.g. 'goal_success_rate', 'archetype_strength'
  archetype      TEXT,            -- if archetype-specific
  category       TEXT,            -- goal category if applicable
  insight        TEXT NOT NULL,   -- the wisdom (e.g. "Sparks complete fitness goals 40% faster when they post daily")
  confidence     DECIMAL(4,2),    -- 0-1 how much data supports this
  sample_size    INT DEFAULT 0,
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Spirit check-in schedule (when to send morning/evening nudges)
CREATE TABLE IF NOT EXISTS spirit_checkin_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  checkin_type TEXT NOT NULL CHECK (checkin_type IN ('morning', 'evening', 'goal_nudge', 'celebration')),
  mood         TEXT,
  mood_score   INT,
  spirit_text  TEXT,             -- what Spirit said
  sent_push    BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_checkin_user ON spirit_checkin_log(user_id);
CREATE INDEX IF NOT EXISTS idx_checkin_created ON spirit_checkin_log(created_at DESC);

-- RLS
ALTER TABLE spirit_memories     ENABLE ROW LEVEL SECURITY;
ALTER TABLE spirit_patterns     ENABLE ROW LEVEL SECURITY;
ALTER TABLE spirit_checkin_log  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "spirit_mem_own"   ON spirit_memories;
DROP POLICY IF EXISTS "spirit_pat_own"   ON spirit_patterns;
DROP POLICY IF EXISTS "spirit_log_own"   ON spirit_checkin_log;

CREATE POLICY "spirit_mem_own"   ON spirit_memories    FOR ALL USING (user_id = auth.uid());
CREATE POLICY "spirit_pat_own"   ON spirit_patterns    FOR ALL USING (user_id = auth.uid());
CREATE POLICY "spirit_log_own"   ON spirit_checkin_log FOR ALL USING (user_id = auth.uid());

-- spirit_collective is public read
ALTER TABLE spirit_collective ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "collective_read" ON spirit_collective;
CREATE POLICY "collective_read" ON spirit_collective FOR SELECT USING (TRUE);

SELECT 'Migration 007 complete — Spirit Intelligence tables created.' AS status;
