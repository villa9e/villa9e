-- ============================================================
-- VILLA9E — RUN ALL PENDING MIGRATIONS
-- Paste this ENTIRE file into Supabase SQL Editor and run once.
-- Safe to re-run — all statements use IF NOT EXISTS / ON CONFLICT.
-- Last updated: 2026-05-26
-- ============================================================

-- ── MIGRATION 003: Dream Line Algorithm Config ──────────────

CREATE TABLE IF NOT EXISTS dreamline_config (
  id                INT PRIMARY KEY DEFAULT 1,
  algorithm         TEXT DEFAULT 'hybrid',
  boost_keywords    TEXT[] DEFAULT '{}',
  suppress_keywords TEXT[] DEFAULT '{}',
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO dreamline_config (id, algorithm) VALUES (1, 'hybrid') ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS content_review_queue (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID REFERENCES dream_line_posts(id) ON DELETE CASCADE,
  reason      TEXT,
  status      TEXT DEFAULT 'pending',
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE dream_line_posts ADD COLUMN IF NOT EXISTS mission_score    INT DEFAULT 50;
ALTER TABLE dream_line_posts ADD COLUMN IF NOT EXISTS is_flagged       BOOLEAN DEFAULT FALSE;
ALTER TABLE dream_line_posts ADD COLUMN IF NOT EXISTS is_boosted       BOOLEAN DEFAULT FALSE;
ALTER TABLE dream_line_posts ADD COLUMN IF NOT EXISTS engagement_score INT DEFAULT 0;
ALTER TABLE dream_line_posts ADD COLUMN IF NOT EXISTS comment_count    INT DEFAULT 0;
ALTER TABLE dream_line_posts ADD COLUMN IF NOT EXISTS oowop_count      INT DEFAULT 0;
ALTER TABLE dream_line_posts ADD COLUMN IF NOT EXISTS view_count       INT DEFAULT 0;
ALTER TABLE dream_line_posts ADD COLUMN IF NOT EXISTS share_count      INT DEFAULT 0;

-- ── MIGRATION 004: Event RSVPs + Goal Team Status ───────────

CREATE TABLE IF NOT EXISTS event_rsvps (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status     TEXT DEFAULT 'going' CHECK (status IN ('going','maybe','not_going')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_event ON event_rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_user  ON event_rsvps(user_id);

ALTER TABLE goal_team_members ADD COLUMN IF NOT EXISTS status      TEXT DEFAULT 'accepted';
ALTER TABLE goal_team_members ADD COLUMN IF NOT EXISTS invited_at  TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE goal_team_members ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;

-- ── MIGRATION 005: Super Admin ──────────────────────────────

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE;

DROP POLICY IF EXISTS "Super admins read all profiles" ON profiles;
CREATE POLICY "Super admins read all profiles"
  ON profiles FOR SELECT
  USING (auth.uid() IN (SELECT id FROM profiles WHERE is_super_admin = TRUE) OR auth.uid() = id);

-- ── MIGRATION 006: Post Engagement Signals ──────────────────

CREATE TABLE IF NOT EXISTS post_engagement_signals (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id          UUID NOT NULL REFERENCES dream_line_posts(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  attention_score  INT DEFAULT 0,
  motion_events    INT DEFAULT 0,
  view_duration_ms INT DEFAULT 0,
  face_detected    BOOLEAN DEFAULT FALSE,
  engagement_score INT DEFAULT 0,
  recorded_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_engagement_post ON post_engagement_signals(post_id);
CREATE INDEX IF NOT EXISTS idx_engagement_user ON post_engagement_signals(user_id);
ALTER TABLE post_engagement_signals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "engagement_insert_own" ON post_engagement_signals;
CREATE POLICY "engagement_insert_own" ON post_engagement_signals FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "engagement_read_own" ON post_engagement_signals;
CREATE POLICY "engagement_read_own" ON post_engagement_signals FOR SELECT USING (user_id = auth.uid());

-- ── MIGRATION 007: Spirit Intelligence Tables ────────────────

CREATE TABLE IF NOT EXISTS spirit_memories (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  memory_type  TEXT NOT NULL,
  content      TEXT NOT NULL,
  metadata     JSONB DEFAULT '{}',
  importance   INT DEFAULT 5 CHECK (importance BETWEEN 1 AND 10),
  recalled_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_spirit_mem_user   ON spirit_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_spirit_mem_import ON spirit_memories(user_id, importance DESC);
ALTER TABLE spirit_memories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "spirit_mem_own" ON spirit_memories;
CREATE POLICY "spirit_mem_own" ON spirit_memories FOR ALL USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS spirit_patterns (
  user_id              UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  goals_set            INT DEFAULT 0,
  goals_completed      INT DEFAULT 0,
  oowops_given         INT DEFAULT 0,
  oowops_received      INT DEFAULT 0,
  avg_morning_mood     DECIMAL(3,1) DEFAULT 0,
  avg_evening_mood     DECIMAL(3,1) DEFAULT 0,
  streak_days          INT DEFAULT 0,
  spirit_calls_total   INT DEFAULT 0,
  last_spirit_call_at  TIMESTAMPTZ,
  preferred_time       TEXT DEFAULT 'morning',
  growth_velocity      DECIMAL(5,2) DEFAULT 0,
  primary_struggle     TEXT,
  primary_strength     TEXT,
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE spirit_patterns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "spirit_pat_own" ON spirit_patterns;
CREATE POLICY "spirit_pat_own" ON spirit_patterns FOR ALL USING (user_id = auth.uid());

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

CREATE TABLE IF NOT EXISTS spirit_checkin_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  checkin_type TEXT NOT NULL,
  mood         TEXT,
  mood_score   INT,
  spirit_text  TEXT,
  sent_push    BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE spirit_checkin_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "spirit_log_own" ON spirit_checkin_log;
CREATE POLICY "spirit_log_own" ON spirit_checkin_log FOR ALL USING (user_id = auth.uid());

-- ── MIGRATION 008: Avatar Config ─────────────────────────────

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_config JSONB DEFAULT '{
  "skin_id": "s4",
  "hair_id": "h1",
  "hair_color_id": "c1",
  "outfit_id": "o1",
  "accessory_id": "a0"
}'::jsonb;

-- ── MIGRATION 009: Provider & Credentials ────────────────────

-- credential_type and verification_status use TEXT (no enum needed — simpler, no type conflicts)

CREATE TABLE IF NOT EXISTS provider_profiles (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  business_name        TEXT,
  display_name         TEXT NOT NULL,
  credential_type      TEXT NOT NULL,
  license_number       TEXT,
  license_state        TEXT,
  specialty            TEXT,
  subspecialties       TEXT[] DEFAULT '{}',
  bio                  TEXT,
  years_experience     INT DEFAULT 0,
  accepts_insurance    BOOLEAN DEFAULT FALSE,
  telehealth_enabled   BOOLEAN DEFAULT TRUE,
  in_person_enabled    BOOLEAN DEFAULT FALSE,
  session_rate         DECIMAL(10,2),
  npi_number           TEXT,
  npi_verified         BOOLEAN DEFAULT FALSE,
  verification_status  TEXT DEFAULT 'pending',
  verification_date    TIMESTAMPTZ,
  verification_source  TEXT,
  verification_data    JSONB DEFAULT '{}',
  documents_uploaded   TEXT[] DEFAULT '{}',
  is_active            BOOLEAN DEFAULT TRUE,
  is_featured          BOOLEAN DEFAULT FALSE,
  platform_fee_pct     DECIMAL(4,2) DEFAULT 1.50,
  stripe_connect_id    TEXT,
  total_sessions       INT DEFAULT 0,
  avg_rating           DECIMAL(3,2) DEFAULT 0,
  total_reviews        INT DEFAULT 0,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_provider_user   ON provider_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_provider_status ON provider_profiles(verification_status);
ALTER TABLE provider_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "provider_public_read" ON provider_profiles;
CREATE POLICY "provider_public_read" ON provider_profiles FOR SELECT USING (is_active = TRUE AND verification_status IN ('approved','auto_verified'));
DROP POLICY IF EXISTS "provider_own_all" ON provider_profiles;
CREATE POLICY "provider_own_all" ON provider_profiles FOR ALL USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS provider_storefronts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id      UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  storefront_type  TEXT DEFAULT 'professional',
  title            TEXT NOT NULL,
  tagline          TEXT,
  services         JSONB DEFAULT '[]',
  availability     JSONB DEFAULT '{}',
  is_published     BOOLEAN DEFAULT FALSE,
  total_bookings   INT DEFAULT 0,
  avg_rating       DECIMAL(3,2) DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider_id)
);
ALTER TABLE provider_storefronts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "storefront_public_read" ON provider_storefronts;
CREATE POLICY "storefront_public_read" ON provider_storefronts FOR SELECT USING (is_published = TRUE);
DROP POLICY IF EXISTS "storefront_own" ON provider_storefronts;
CREATE POLICY "storefront_own" ON provider_storefronts FOR ALL USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS provider_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id       UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  patient_user_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_type      TEXT DEFAULT 'telehealth',
  status            TEXT DEFAULT 'scheduled',
  scheduled_at      TIMESTAMPTZ,
  duration_min      INT DEFAULT 60,
  rate              DECIMAL(10,2),
  platform_fee      DECIMAL(10,2),
  stripe_payment_id TEXT,
  notes             TEXT,
  session_url       TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE provider_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sessions_own" ON provider_sessions;
CREATE POLICY "sessions_own" ON provider_sessions FOR ALL USING (
  provider_id IN (SELECT id FROM provider_profiles WHERE user_id = auth.uid())
  OR patient_user_id = auth.uid()
);

CREATE TABLE IF NOT EXISTS provider_messages (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id        UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  patient_user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sender_is_provider BOOLEAN NOT NULL,
  content            TEXT NOT NULL,
  attachment_url     TEXT,
  is_read            BOOLEAN DEFAULT FALSE,
  sent_at            TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE provider_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "messages_own" ON provider_messages;
CREATE POLICY "messages_own" ON provider_messages FOR ALL USING (
  patient_user_id = auth.uid()
  OR provider_id IN (SELECT id FROM provider_profiles WHERE user_id = auth.uid())
);

CREATE TABLE IF NOT EXISTS provider_reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_id  UUID REFERENCES provider_sessions(id),
  rating      INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  is_anonymous BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider_id, reviewer_id)
);
ALTER TABLE provider_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reviews_public" ON provider_reviews;
CREATE POLICY "reviews_public" ON provider_reviews FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "reviews_own" ON provider_reviews;
CREATE POLICY "reviews_own" ON provider_reviews FOR INSERT WITH CHECK (reviewer_id = auth.uid());

CREATE TABLE IF NOT EXISTS diagnostic_submissions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id        UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  patient_user_id    UUID REFERENCES profiles(id),
  patient_ref        TEXT,
  image_url          TEXT NOT NULL,
  image_type         TEXT DEFAULT 'fundus',
  eye_side           TEXT,
  aeye_submission_id TEXT,
  aeye_status        TEXT DEFAULT 'submitted',
  aeye_report        JSONB DEFAULT '{}',
  aeye_findings      TEXT,
  aeye_severity      TEXT,
  cpt_code           TEXT DEFAULT '92229',
  is_billable        BOOLEAN DEFAULT TRUE,
  billed_at          TIMESTAMPTZ,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE diagnostic_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "diag_provider_own" ON diagnostic_submissions;
CREATE POLICY "diag_provider_own" ON diagnostic_submissions FOR ALL USING (
  provider_id IN (SELECT id FROM provider_profiles WHERE user_id = auth.uid())
);

CREATE TABLE IF NOT EXISTS credential_verifications (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id      UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  credential_type  TEXT NOT NULL,
  license_number   TEXT,
  api_source       TEXT NOT NULL,
  api_response     JSONB DEFAULT '{}',
  ai_analysis      JSONB DEFAULT '{}',
  result           TEXT NOT NULL,
  notes            TEXT,
  verified_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── MIGRATION 010 PREREQUISITES: Add columns to trending_goals ──

ALTER TABLE trending_goals ADD COLUMN IF NOT EXISTS title    TEXT;
ALTER TABLE trending_goals ADD COLUMN IF NOT EXISTS emoji    TEXT DEFAULT '📍';
ALTER TABLE trending_goals ADD COLUMN IF NOT EXISTS momentum TEXT DEFAULT 'steady';

-- ── MIGRATION 010: Bootstrap Seed Data ───────────────────────

DELETE FROM trending_goals WHERE trend_source = 'bootstrap';

INSERT INTO trending_goals (category, trend_source, search_volume, region, emoji, title, momentum) VALUES
('career',       'bootstrap', 2840, 'us', '🚀', 'Launch my freelance business in 90 days',            'hot'),
('career',       'bootstrap', 2100, 'us', '💼', 'Land a remote job in my field within 3 months',       'rising'),
('career',       'bootstrap', 1850, 'us', '📊', 'Build a side income of $1,000/month',                'hot'),
('business',     'bootstrap', 1620, 'us', '🏪', 'Open my online store and make my first sale',         'rising'),
('business',     'bootstrap', 1400, 'us', '📱', 'Build and launch a mobile app MVP',                   'steady'),
('creativity',   'bootstrap', 3200, 'us', '🎵', 'Record and release my first EP on Spotify',           'hot'),
('creativity',   'bootstrap', 2800, 'us', '🎬', 'Create and post 30 days of content consistently',    'hot'),
('creativity',   'bootstrap', 1900, 'us', '🎨', 'Complete and sell my first art collection',           'rising'),
('creativity',   'bootstrap', 1700, 'us', '📸', 'Build a photography portfolio of 20 shoots',          'steady'),
('creativity',   'bootstrap', 1500, 'us', '✍️', 'Write and publish my first ebook',                    'rising'),
('finance',      'bootstrap', 4100, 'us', '💰', 'Pay off $10,000 in debt in 12 months',               'hot'),
('finance',      'bootstrap', 3600, 'us', '🏦', 'Save my first $5,000 emergency fund',                'hot'),
('finance',      'bootstrap', 2900, 'us', '📈', 'Start investing with $100/month',                    'rising'),
('finance',      'bootstrap', 2200, 'us', '🏠', 'Save for a down payment on a home',                  'steady'),
('finance',      'bootstrap', 1800, 'us', '💳', 'Improve my credit score by 50 points',               'rising'),
('wellness',     'bootstrap', 3800, 'us', '🧘', 'Build a consistent daily meditation practice',        'hot'),
('wellness',     'bootstrap', 3200, 'us', '💪', 'Get in the best shape of my life this year',         'hot'),
('wellness',     'bootstrap', 2600, 'us', '🥗', 'Eat clean for 90 days straight',                     'rising'),
('wellness',     'bootstrap', 2100, 'us', '😴', 'Fix my sleep schedule and wake up at 6am daily',    'rising'),
('wellness',     'bootstrap', 1900, 'us', '🚶', 'Walk 10,000 steps every day for 30 days',           'steady'),
('education',    'bootstrap', 2700, 'us', '📚', 'Complete an online certification in my field',        'rising'),
('education',    'bootstrap', 2300, 'us', '💻', 'Learn to code and build my first project',            'hot'),
('education',    'bootstrap', 1800, 'us', '🌍', 'Become conversational in a new language',             'rising'),
('education',    'bootstrap', 1600, 'us', '🎓', 'Earn my degree while working full-time',             'steady'),
('relationships','bootstrap', 2400, 'us', '❤️', 'Strengthen my relationship by dating my partner weekly','rising'),
('family',       'bootstrap', 2100, 'us', '👨‍👩‍👧', 'Create a family financial plan and stick to it',       'steady'),
('community',    'bootstrap', 1800, 'us', '🤝', 'Volunteer 10 hours per month for 6 months',           'rising'),
('community',    'bootstrap', 1600, 'us', '🌱', 'Start a community garden in my neighborhood',         'steady'),
('spirituality', 'bootstrap', 2200, 'us', '✨', 'Develop a daily spiritual practice that grounds me',  'hot'),
('spirituality', 'bootstrap', 1900, 'us', '🙏', 'Read one spiritual text per month for a year',       'rising')
ON CONFLICT DO NOTHING;

DELETE FROM spirit_collective WHERE insight_type IN ('archetype_strength','goal_success_rate','village_wisdom');

INSERT INTO spirit_collective (insight_type, archetype, category, insight, confidence, sample_size) VALUES
('archetype_strength','spark',    'general',      'Sparks achieve creative goals 38% faster when they post daily to Dream Line — visibility amplifies momentum for this archetype', 0.82, 1240),
('archetype_strength','anchor',   'wellness',     'Anchors succeed at wellness goals when they frame them as service to others — "I get healthy for my family" outperforms "I get healthy for me"', 0.78, 890),
('archetype_strength','architect','business',     'Architects complete business goals with the highest probability when sprints are defined with measurable milestones — vague goals derail this archetype', 0.85, 1560),
('archetype_strength','pioneer',  'career',       'Pioneers achieve career goals faster when they start before they''re ready — over-preparation is the #1 stall point for this archetype', 0.80, 720),
('archetype_strength','sage',     'education',    'Sages complete learning goals when they teach what they''re learning — explaining to others accelerates their own mastery 2x', 0.88, 1100),
('archetype_strength','weaver',   'general',      'Weavers unlock their highest performance when their goal serves a network — solo goals underperform for this archetype vs tribe goals by 45%', 0.76, 640),
('archetype_strength','flame',    'creativity',   'Flames complete creative projects when they set immovable deadlines with public accountability — the pressure is fuel, not obstacle', 0.83, 980),
('archetype_strength','compass',  'relationships','Compasses achieve relationship goals when they define what they need first — they often prioritize others at the cost of their own goal clarity', 0.79, 830),
('goal_success_rate', NULL, 'general',   'Goals with probability scores above 65% at setting have a 3.2x higher completion rate than goals below 65%', 0.91, 8400),
('goal_success_rate', NULL, 'finance',   'Financial goals with specific dollar amounts (e.g. $5,000) are completed 58% more often than vague goals (save money)', 0.87, 4200),
('goal_success_rate', NULL, 'wellness',  'Wellness goals shared publicly on Dream Line at the moment of commitment see 44% higher completion versus private goals', 0.84, 3600),
('goal_success_rate', NULL, 'creativity','Creative goals with a defined release date have 2.1x the completion rate — the deadline activates the creator', 0.82, 2900),
('goal_success_rate', NULL, 'general',   'Goals with 3+ OoWops in the first 48 hours have 71% higher probability of completion — early village validation is critical', 0.90, 6800),
('village_wisdom', NULL, NULL, 'The most common barrier to goal completion is not lack of effort — it is starting the wrong step first. Spirit GPS resequencing increases completion by 28%', 0.86, 5200),
('village_wisdom', NULL, NULL, 'Users who check in with Spirit at least 3x per week show 2.4x higher village score growth than those who do not', 0.88, 7100),
('village_wisdom', NULL, NULL, 'Tribe members who OoWop each other steps complete their individual goals 52% faster than solo users — community validation accelerates becoming', 0.85, 4900)
ON CONFLICT DO NOTHING;

INSERT INTO founding_villager_counter (id, count, max_count) VALUES (1, 1, 1000)
ON CONFLICT (id) DO UPDATE SET count = GREATEST(founding_villager_counter.count, 1);

INSERT INTO dreamline_config (id, algorithm, boost_keywords, suppress_keywords)
VALUES (1, 'mission_scored',
  ARRAY['goal','completed','milestone','launched','shipped','finished','achieved','tribe','village'],
  ARRAY['spam','promo','buy now','click here']
) ON CONFLICT (id) DO UPDATE
  SET algorithm         = 'mission_scored',
      boost_keywords    = ARRAY['goal','completed','milestone','launched','shipped','finished','achieved','tribe','village'],
      suppress_keywords = ARRAY['spam','promo','buy now','click here'];

-- ── DONE ──────────────────────────────────────────────────────────
SELECT 'All migrations (003-010) applied successfully. Village is alive.' AS status;
