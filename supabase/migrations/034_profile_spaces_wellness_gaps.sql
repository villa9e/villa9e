-- ============================================================
-- Migration 034: Fill profile, spaces, and wellness gaps
-- Safe to re-run (all IF NOT EXISTS / ADD COLUMN IF NOT EXISTS)
-- ============================================================

-- ── 1. Profile columns ──────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS link_in_bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pronouns TEXT;

-- ── 2. Dream line posts ─────────────────────────────────────
ALTER TABLE dream_line_posts ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE dream_line_posts ADD COLUMN IF NOT EXISTS audio_track TEXT;

-- ── 3. Testimonials ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS testimonials (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  giver_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  rating      INT CHECK (rating BETWEEN 1 AND 5),
  is_public   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(giver_id, receiver_id)
);

ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "testimonials_public_view" ON testimonials;
CREATE POLICY "testimonials_public_view" ON testimonials FOR SELECT USING (is_public = TRUE OR receiver_id = auth.uid() OR giver_id = auth.uid());
DROP POLICY IF EXISTS "testimonials_insert" ON testimonials;
CREATE POLICY "testimonials_insert" ON testimonials FOR INSERT WITH CHECK (giver_id = auth.uid());

-- ── 4. Profile highlights ────────────────────────────────────
CREATE TABLE IF NOT EXISTS profile_highlights (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  icon          TEXT DEFAULT '📁',
  thumbnail_url TEXT,
  post_ids      UUID[] DEFAULT '{}',
  display_order INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profile_highlights ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "highlights_public_view" ON profile_highlights;
CREATE POLICY "highlights_public_view" ON profile_highlights FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "highlights_own_manage" ON profile_highlights;
CREATE POLICY "highlights_own_manage" ON profile_highlights FOR ALL USING (user_id = auth.uid());

-- ── 5. Spaces tasks ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS spaces_tasks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  text          TEXT NOT NULL,
  done          BOOLEAN DEFAULT FALSE,
  due_date      DATE,
  project       TEXT,
  display_order INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE spaces_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tasks_own" ON spaces_tasks;
CREATE POLICY "tasks_own" ON spaces_tasks FOR ALL USING (user_id = auth.uid());

-- ── 6. Calendar events: Spaces/Trigger fields ────────────────
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS energy_type TEXT DEFAULT 'focused';
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS trigger_min INT DEFAULT 10;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS trigger_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS affirmation TEXT;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS trigger_playlist TEXT;

-- ── 7. Wellness daily logs ───────────────────────────────────
CREATE TABLE IF NOT EXISTS wellness_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  log_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  readiness      DECIMAL(3,1),
  mood           TEXT,
  energy         INT CHECK (energy BETWEEN 1 AND 5),
  stress         INT CHECK (stress BETWEEN 1 AND 5),
  focus          INT CHECK (focus BETWEEN 1 AND 5),
  gratitude      TEXT,
  ai_insight     TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, log_date)
);

ALTER TABLE wellness_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "wellness_own" ON wellness_logs;
CREATE POLICY "wellness_own" ON wellness_logs FOR ALL USING (user_id = auth.uid());

-- ── 8. Gratitude log ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gratitude_log (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  entry      TEXT NOT NULL,
  log_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE gratitude_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "gratitude_own" ON gratitude_log;
CREATE POLICY "gratitude_own" ON gratitude_log FOR ALL USING (user_id = auth.uid());

-- ── 9. Trigger profiles ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS trigger_profiles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  energy_type  TEXT NOT NULL,
  affirmation  TEXT,
  playlist     TEXT,
  movement     TEXT,
  breathwork   TEXT,
  environment  TEXT,
  duration_min INT DEFAULT 10,
  is_default   BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE trigger_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "trigger_profiles_own" ON trigger_profiles;
CREATE POLICY "trigger_profiles_own" ON trigger_profiles FOR ALL USING (user_id = auth.uid());
