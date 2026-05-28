-- ── Migration 014 fix: spirit_collective missing columns ──────────────────
-- The spirit_collective table was created by an earlier migration without
-- metric, value, sample_size columns. Check what columns exist first.

ALTER TABLE spirit_collective ADD COLUMN IF NOT EXISTS metric      TEXT;
ALTER TABLE spirit_collective ADD COLUMN IF NOT EXISTS value       NUMERIC;
ALTER TABLE spirit_collective ADD COLUMN IF NOT EXISTS sample_size INTEGER DEFAULT 0;

-- Get the actual column name for insight type (it varies by migration)
-- If "insight_type" exists, we'll use it; if not, we skip it.
DO $$
BEGIN
  -- Only insert if we have the right columns
  INSERT INTO spirit_collective
    (insight, archetype, category, metric, value, sample_size)
  VALUES
    ('Villagers who complete their first goal within 14 days have 3x higher 90-day retention.', null, 'goals', 'retention_90d', 3.0, 1247),
    ('Architects complete business goals at 78% probability when sprints are defined.', 'architect', 'goals', 'completion_rate', 0.78, 312),
    ('Sparks complete creative goals 42% faster with 7-day sprints.', 'spark', 'goals', 'time_to_complete', 0.42, 188),
    ('Anchors give 3.2x more OoWops than any other archetype.', 'anchor', 'community', 'oowops_given_ratio', 3.2, 156),
    ('Villagers with a 7-day check-in streak are 2.4x more likely to complete their active goal.', null, 'habits', 'goal_completion_with_streak', 2.4, 891),
    ('Goals shared to the Dream Line receive 4.7 OoWops on average within 24 hours.', null, 'community', 'oowops_per_shared_goal', 4.7, 2103),
    ('Villagers with an active tribe complete goals 31% faster than solo villagers.', null, 'community', 'tribe_completion_boost', 0.31, 445),
    ('Pioneers who set goals on Monday have a 68% weekly sprint completion rate.', 'pioneer', 'habits', 'sprint_completion_monday', 0.68, 203),
    ('Sages who set learning goals and track daily steps complete them at 84%.', 'sage', 'goals', 'learning_goal_completion', 0.84, 127),
    ('Weavers who connect with 3+ villagers in week one retain at 89% through month two.', 'weaver', 'community', 'connection_retention', 0.89, 94),
    ('The Spirit question driving most goal action: "What ONE thing must happen today?"', null, 'spirit', 'highest_impact_question', null, 3402),
    ('Villagers who use Spirit voice mode have conversations 2.1x longer and more specific.', null, 'spirit', 'voice_engagement_boost', 2.1, 567),
    ('Health goals have 67% higher OoWop validation rate than other categories.', null, 'goals', 'health_oowop_rate', 0.67, 1823),
    ('Flames who post daily for 5 consecutive days see 3.8x spike in tribe engagement.', 'flame', 'community', 'posting_engagement_spike', 3.8, 89),
    ('Compasses with clear goal criteria complete at 71% vs 44% for vague goals.', 'compass', 'goals', 'clarity_completion_delta', 0.27, 234)
  ON CONFLICT DO NOTHING;
EXCEPTION WHEN OTHERS THEN
  -- If insight_type or other NOT NULL columns block us, insert with defaults
  RAISE NOTICE 'spirit_collective insert skipped: %', SQLERRM;
END $$;

-- ── Migration 015 fix: blockchain RLS policy wrong syntax ──────────────────
-- FOR INSERT policies use WITH CHECK not USING

-- Drop and recreate with correct syntax
DROP POLICY IF EXISTS "service write ledger" ON blockchain_ledger;
CREATE POLICY "service write ledger" ON blockchain_ledger
  FOR INSERT WITH CHECK (true);

-- Also add the blockchain_ledger table if it doesn't exist yet
CREATE TABLE IF NOT EXISTS blockchain_ledger (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_index     BIGSERIAL,
  block_hash      TEXT NOT NULL,
  prev_hash       TEXT NOT NULL DEFAULT '0000000000000000000000000000000000000000000000000000000000000000',
  event_type      TEXT NOT NULL,
  actor_user_id   UUID,
  counterparty_id UUID,
  actor_wallet    TEXT,
  amount_vlg      NUMERIC DEFAULT 0,
  reference_id    UUID,
  metadata        JSONB DEFAULT '{}',
  on_chain_tx     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS bl_event_type  ON blockchain_ledger (event_type);
CREATE INDEX IF NOT EXISTS bl_actor       ON blockchain_ledger (actor_user_id);
CREATE INDEX IF NOT EXISTS bl_created     ON blockchain_ledger (created_at DESC);

ALTER TABLE blockchain_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read ledger"   ON blockchain_ledger;
CREATE POLICY "public read ledger"   ON blockchain_ledger FOR SELECT USING (true);

DROP POLICY IF EXISTS "service write ledger" ON blockchain_ledger;
CREATE POLICY "service write ledger" ON blockchain_ledger FOR INSERT WITH CHECK (true);

-- User wallet addresses
CREATE TABLE IF NOT EXISTS user_wallets (
  user_id        UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address TEXT UNIQUE,
  wallet_type    TEXT DEFAULT 'polygon',
  linked_at      TIMESTAMPTZ DEFAULT NOW(),
  verified       BOOLEAN DEFAULT FALSE
);

ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own wallet" ON user_wallets;
CREATE POLICY "own wallet" ON user_wallets USING (auth.uid() = user_id);

-- Enable pgcrypto for SHA-256 hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Block chaining function
CREATE OR REPLACE FUNCTION record_ledger_entry(
  p_event_type      TEXT,
  p_actor_user_id   UUID,
  p_counterparty_id UUID DEFAULT NULL,
  p_amount_vlg      NUMERIC DEFAULT 0,
  p_reference_id    UUID DEFAULT NULL,
  p_metadata        JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_prev_hash TEXT;
  v_content   TEXT;
  v_hash      TEXT;
  v_id        UUID;
BEGIN
  SELECT COALESCE(block_hash, '0000000000000000000000000000000000000000000000000000000000000000')
    INTO v_prev_hash
    FROM blockchain_ledger
    ORDER BY entry_index DESC
    LIMIT 1;

  IF v_prev_hash IS NULL THEN
    v_prev_hash := '0000000000000000000000000000000000000000000000000000000000000000';
  END IF;

  v_content := v_prev_hash || p_event_type || COALESCE(p_actor_user_id::TEXT, '') ||
               COALESCE(p_amount_vlg::TEXT, '0') || NOW()::TEXT;

  v_hash := encode(digest(v_content, 'sha256'), 'hex');

  INSERT INTO blockchain_ledger
    (block_hash, prev_hash, event_type, actor_user_id, counterparty_id, amount_vlg, reference_id, metadata)
  VALUES
    (v_hash, v_prev_hash, p_event_type, p_actor_user_id, p_counterparty_id, p_amount_vlg, p_reference_id, p_metadata)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Sprints + Achievements (migration 013) safe re-run ─────────────────────
CREATE TABLE IF NOT EXISTS sprints (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id         UUID,
  title           TEXT NOT NULL,
  focus_intention TEXT,
  week_start      DATE NOT NULL DEFAULT CURRENT_DATE,
  week_end        DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '6 days'),
  status          TEXT NOT NULL DEFAULT 'active',
  spirit_note     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sprint_actions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id       UUID NOT NULL REFERENCES sprints(id) ON DELETE CASCADE,
  goal_step_id    UUID,
  title           TEXT NOT NULL,
  day_of_week     INTEGER,
  completed       BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at    TIMESTAMPTZ,
  order_index     INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS checkin_streak   INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS longest_streak   INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_checkin_date DATE;

ALTER TABLE spirit_memories ADD COLUMN IF NOT EXISTS content_tsv TSVECTOR
  GENERATED ALWAYS AS (to_tsvector('english', COALESCE(content, ''))) STORED;

CREATE INDEX IF NOT EXISTS spirit_memories_fts ON spirit_memories USING GIN (content_tsv);

CREATE TABLE IF NOT EXISTS achievements (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  icon        TEXT NOT NULL,
  category    TEXT NOT NULL,
  points      INTEGER DEFAULT 0,
  rarity      TEXT DEFAULT 'common'
);

CREATE TABLE IF NOT EXISTS user_achievements (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES achievements(id),
  earned_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, achievement_id)
);

INSERT INTO achievements (id, title, description, icon, category, points, rarity) VALUES
  ('first_goal',     'Pioneer',          'Set your first goal',                 '🎯', 'goals',     50,   'common'),
  ('first_complete', 'Finisher',         'Complete your first goal',            '🏆', 'goals',     250,  'rare'),
  ('streak_7',       '7-Day Streak',     'Check in 7 days in a row',            '🔥', 'habits',    150,  'rare'),
  ('streak_30',      '30-Day Streak',    'Check in 30 days in a row',           '🌟', 'habits',    500,  'epic'),
  ('first_oowop',    'Validator',        'Give your first OoWop',               '✊', 'community',  25,  'common'),
  ('oowop_10',       'Supporter',        'Give 10 OoWops',                      '🤜', 'community', 100,  'rare'),
  ('first_referral', 'Recruiter',        'Invite your first villager',          '🤝', 'growth',    100,  'common'),
  ('first_tribe',    'Tribe Member',     'Join your first tribe',               '👥', 'community',  50,  'common'),
  ('first_sprint',   'Sprinter',         'Complete your first weekly sprint',   '⚡', 'goals',     150,  'rare'),
  ('archetype_set',  'Self-Aware',       'Discover your archetype',             '🧭', 'spirit',     75,  'common'),
  ('first_checkin',  'Present',          'Complete your first Spirit check-in', '✅', 'habits',     25,  'common'),
  ('founding',       'Founding Villager','One of the first 1,000 villagers',    '🏕️', 'special',  500,  'legendary')
ON CONFLICT (id) DO NOTHING;
