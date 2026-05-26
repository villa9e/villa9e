-- Migration 011: Add missing columns to trending_goals + fix schema gaps

-- trending_goals was missing title, emoji, momentum
ALTER TABLE trending_goals ADD COLUMN IF NOT EXISTS title    TEXT;
ALTER TABLE trending_goals ADD COLUMN IF NOT EXISTS emoji    TEXT DEFAULT '📍';
ALTER TABLE trending_goals ADD COLUMN IF NOT EXISTS momentum TEXT DEFAULT 'steady'
  CHECK (momentum IN ('hot', 'rising', 'steady'));

-- spirit_collective table (needed by Spirit memory system)
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

-- spirit_memories (needed by Spirit intelligence)
CREATE TABLE IF NOT EXISTS spirit_memories (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  memory_type  TEXT NOT NULL,
  content      TEXT NOT NULL,
  metadata     JSONB DEFAULT '{}',
  importance   INT DEFAULT 5,
  recalled_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_spirit_mem_user ON spirit_memories(user_id);
ALTER TABLE spirit_memories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "spirit_mem_own" ON spirit_memories;
CREATE POLICY "spirit_mem_own" ON spirit_memories FOR ALL USING (user_id = auth.uid());

-- spirit_patterns
CREATE TABLE IF NOT EXISTS spirit_patterns (
  user_id             UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  goals_set           INT DEFAULT 0,
  goals_completed     INT DEFAULT 0,
  oowops_given        INT DEFAULT 0,
  oowops_received     INT DEFAULT 0,
  streak_days         INT DEFAULT 0,
  spirit_calls_total  INT DEFAULT 0,
  last_spirit_call_at TIMESTAMPTZ,
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE spirit_patterns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "spirit_pat_own" ON spirit_patterns;
CREATE POLICY "spirit_pat_own" ON spirit_patterns FOR ALL USING (user_id = auth.uid());

-- avatar_config column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_config JSONB DEFAULT '{
  "skin_id": "s4",
  "hair_id": "h1",
  "hair_color_id": "c1",
  "outfit_id": "o1",
  "accessory_id": "a0"
}'::jsonb;

-- provider_profiles (credential system)
-- (safe to re-run — uses CREATE TABLE IF NOT EXISTS)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'provider_profiles') THEN
    CREATE TYPE IF NOT EXISTS credential_type AS ENUM (
      'npi_medical','npi_mental_health','npi_allied_health',
      'bar_license','paralegal','mediator',
      'finra_broker','cfa','cfp','fiduciary_ria','cpa_accountant',
      'insurance_producer','insurance_adjuster',
      'real_estate_agent','real_estate_broker','mortgage_broker',
      'reiki_master','herbalist','sound_healer','yoga_therapist',
      'naturopath','homeopath','acupuncturist',
      'personal_trainer','life_coach','nutritionist','dietitian',
      'social_worker','cpa_accountant','other'
    );
  END IF;
END $$;

SELECT 'Migration 011 complete — all missing columns added.' AS status;
