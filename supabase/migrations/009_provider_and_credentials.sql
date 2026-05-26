-- ============================================================
-- Migration 009: Professional Credential Verification System
-- All type columns use TEXT (not ENUM) for zero migration conflicts
-- ============================================================

CREATE TABLE IF NOT EXISTS provider_profiles (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  business_name        TEXT,
  display_name         TEXT NOT NULL,
  credential_type      TEXT NOT NULL,
  license_number       TEXT,
  license_state        TEXT,
  license_jurisdiction TEXT,
  specialty            TEXT,
  subspecialties       TEXT[] DEFAULT '{}',
  bio                  TEXT,
  years_experience     INT DEFAULT 0,
  accepts_insurance    BOOLEAN DEFAULT FALSE,
  insurance_networks   TEXT[] DEFAULT '{}',
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
CREATE INDEX IF NOT EXISTS idx_provider_npi    ON provider_profiles(npi_number);
CREATE INDEX IF NOT EXISTS idx_provider_active ON provider_profiles(is_active);

CREATE TABLE IF NOT EXISTS credential_verifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id     UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  credential_type TEXT NOT NULL,
  license_number  TEXT,
  api_source      TEXT NOT NULL,
  api_response    JSONB DEFAULT '{}',
  ai_analysis     JSONB DEFAULT '{}',
  result          TEXT NOT NULL,
  notes           TEXT,
  verified_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS provider_storefronts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id     UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  storefront_type TEXT DEFAULT 'professional',
  title           TEXT NOT NULL,
  tagline         TEXT,
  services        JSONB DEFAULT '[]',
  availability    JSONB DEFAULT '{}',
  is_published    BOOLEAN DEFAULT FALSE,
  total_bookings  INT DEFAULT 0,
  avg_rating      DECIMAL(3,2) DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider_id)
);

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
CREATE INDEX IF NOT EXISTS idx_diag_provider ON diagnostic_submissions(provider_id);
CREATE INDEX IF NOT EXISTS idx_diag_status   ON diagnostic_submissions(aeye_status);

CREATE TABLE IF NOT EXISTS provider_reviews (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id  UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  reviewer_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_id   UUID REFERENCES provider_sessions(id),
  rating       INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text  TEXT,
  is_anonymous BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider_id, reviewer_id)
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
CREATE INDEX IF NOT EXISTS idx_prov_msg_provider ON provider_messages(provider_id);
CREATE INDEX IF NOT EXISTS idx_prov_msg_patient  ON provider_messages(patient_user_id);

-- RLS
ALTER TABLE provider_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_storefronts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_sessions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_reviews       ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE credential_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "provider_public_read" ON provider_profiles;
CREATE POLICY "provider_public_read" ON provider_profiles
  FOR SELECT USING (is_active = TRUE AND verification_status IN ('approved','auto_verified'));

DROP POLICY IF EXISTS "provider_own_all" ON provider_profiles;
CREATE POLICY "provider_own_all" ON provider_profiles FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "storefront_public_read" ON provider_storefronts;
CREATE POLICY "storefront_public_read" ON provider_storefronts FOR SELECT USING (is_published = TRUE);

DROP POLICY IF EXISTS "storefront_own" ON provider_storefronts;
CREATE POLICY "storefront_own" ON provider_storefronts FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "sessions_own" ON provider_sessions;
CREATE POLICY "sessions_own" ON provider_sessions FOR ALL USING (
  provider_id IN (SELECT id FROM provider_profiles WHERE user_id = auth.uid())
  OR patient_user_id = auth.uid()
);

DROP POLICY IF EXISTS "diag_provider_own" ON diagnostic_submissions;
CREATE POLICY "diag_provider_own" ON diagnostic_submissions FOR ALL USING (
  provider_id IN (SELECT id FROM provider_profiles WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "reviews_public" ON provider_reviews;
CREATE POLICY "reviews_public" ON provider_reviews FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "reviews_own" ON provider_reviews;
CREATE POLICY "reviews_own" ON provider_reviews FOR INSERT WITH CHECK (reviewer_id = auth.uid());

DROP POLICY IF EXISTS "messages_own" ON provider_messages;
CREATE POLICY "messages_own" ON provider_messages FOR ALL USING (
  patient_user_id = auth.uid()
  OR provider_id IN (SELECT id FROM provider_profiles WHERE user_id = auth.uid())
);

SELECT 'Migration 009 complete.' AS status;
