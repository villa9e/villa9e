-- ============================================================
-- Migration 009: Professional Credential Verification System
-- Powers both the Hospital provider portal AND Trading Post storefronts
-- Covers: Medical, Legal, Financial, Insurance, Real Estate,
--         Mental Health, Alternative/Holistic, Fitness, and any
--         profession verifiable via AI or public registry
-- ============================================================

-- Credential type enum
CREATE TYPE credential_type AS ENUM (
  -- Medical
  'npi_medical', 'npi_mental_health', 'npi_allied_health',
  -- Legal
  'bar_license', 'paralegal',
  -- Financial
  'finra_broker', 'cfa', 'cfp', 'fiduciary_ria',
  -- Insurance
  'insurance_producer', 'insurance_adjuster',
  -- Real Estate
  'real_estate_agent', 'real_estate_broker', 'mortgage_broker',
  -- Alternative / Holistic
  'reiki_master', 'herbalist', 'sound_healer', 'yoga_therapist',
  'naturopath', 'homeopath', 'acupuncturist',
  -- Fitness & Coaching
  'personal_trainer', 'life_coach', 'nutritionist', 'dietitian',
  -- Other verified
  'social_worker', 'mediator', 'cpa_accountant', 'other'
);

-- Verification status
CREATE TYPE verification_status AS ENUM (
  'pending', 'auto_verified', 'manual_review', 'approved', 'rejected', 'expired'
);

-- ── Provider profiles (any verified professional) ──────────────────
CREATE TABLE IF NOT EXISTS provider_profiles (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  business_name         TEXT,
  display_name          TEXT NOT NULL,
  credential_type       credential_type NOT NULL,
  license_number        TEXT,             -- NPI, bar#, FINRA CRD, etc.
  license_state         TEXT,             -- 2-letter state code
  license_jurisdiction  TEXT,             -- for non-US
  specialty             TEXT,             -- e.g. 'Retinal Imaging', 'Family Law'
  subspecialties        TEXT[] DEFAULT '{}',
  bio                   TEXT,
  years_experience      INT DEFAULT 0,
  accepts_insurance     BOOLEAN DEFAULT FALSE,
  insurance_networks    TEXT[] DEFAULT '{}',
  telehealth_enabled    BOOLEAN DEFAULT TRUE,
  in_person_enabled     BOOLEAN DEFAULT FALSE,
  session_rate          DECIMAL(10,2),    -- per session/hour
  npi_number            TEXT,             -- National Provider Identifier
  npi_verified          BOOLEAN DEFAULT FALSE,
  verification_status   verification_status DEFAULT 'pending',
  verification_date     TIMESTAMPTZ,
  verification_source   TEXT,             -- 'nppes_api', 'finra_api', 'ai_document', etc.
  verification_data     JSONB DEFAULT '{}',  -- raw API response stored
  documents_uploaded    TEXT[] DEFAULT '{}', -- Cloudinary URLs
  is_active             BOOLEAN DEFAULT TRUE,
  is_featured           BOOLEAN DEFAULT FALSE,
  platform_fee_pct      DECIMAL(4,2) DEFAULT 1.50,  -- villa9e takes 1.5%
  stripe_connect_id     TEXT,
  total_sessions        INT DEFAULT 0,
  avg_rating            DECIMAL(3,2) DEFAULT 0,
  total_reviews         INT DEFAULT 0,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_provider_user       ON provider_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_provider_cred_type  ON provider_profiles(credential_type);
CREATE INDEX IF NOT EXISTS idx_provider_status     ON provider_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_provider_npi        ON provider_profiles(npi_number);
CREATE INDEX IF NOT EXISTS idx_provider_active     ON provider_profiles(is_active);

-- ── Credential verification log ────────────────────────────────────
CREATE TABLE IF NOT EXISTS credential_verifications (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id        UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  user_id            UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  credential_type    credential_type NOT NULL,
  license_number     TEXT,
  api_source         TEXT NOT NULL,       -- which API was queried
  api_response       JSONB DEFAULT '{}',  -- raw verification response
  ai_analysis        JSONB DEFAULT '{}',  -- Claude's analysis of document
  result             verification_status NOT NULL,
  notes              TEXT,
  verified_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── Provider storefronts (extends Trading Post) ────────────────────
-- When a provider is verified, they get a storefront
CREATE TABLE IF NOT EXISTS provider_storefronts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id       UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  storefront_type   TEXT DEFAULT 'professional',
  title             TEXT NOT NULL,
  tagline           TEXT,
  services          JSONB DEFAULT '[]',   -- [{name, description, rate, duration_min}]
  availability      JSONB DEFAULT '{}',   -- {mon:[{start,end}], tue:...}
  is_published      BOOLEAN DEFAULT FALSE,
  total_bookings    INT DEFAULT 0,
  avg_rating        DECIMAL(3,2) DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── HIPAA-compliant provider-patient sessions ──────────────────────
CREATE TABLE IF NOT EXISTS provider_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id       UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  patient_user_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_type      TEXT DEFAULT 'telehealth',  -- telehealth, in_person, async_message
  status            TEXT DEFAULT 'scheduled',   -- scheduled, completed, cancelled, no_show
  scheduled_at      TIMESTAMPTZ,
  duration_min      INT DEFAULT 60,
  rate              DECIMAL(10,2),
  platform_fee      DECIMAL(10,2),
  stripe_payment_id TEXT,
  notes             TEXT,                        -- clinical notes (encrypted at app level)
  session_url       TEXT,                        -- Doxy.me or similar
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── Diagnostic imaging (for medical providers using AEYE Health) ───
CREATE TABLE IF NOT EXISTS diagnostic_submissions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id        UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  patient_user_id    UUID REFERENCES profiles(id),  -- null if external patient
  patient_ref        TEXT,              -- external patient reference (EHR ID)
  image_url          TEXT NOT NULL,     -- Cloudinary secure URL
  image_type         TEXT DEFAULT 'fundus', -- fundus, macular, peripheral
  eye_side           TEXT,              -- 'OD' (right), 'OS' (left), 'OU' (both)
  aeye_submission_id TEXT,             -- AEYE Health API submission ID
  aeye_status        TEXT DEFAULT 'submitted',  -- submitted, processing, complete, failed
  aeye_report        JSONB DEFAULT '{}',        -- full AEYE Health diagnostic report
  aeye_findings      TEXT,             -- summary of findings
  aeye_severity      TEXT,             -- none, mild, moderate, severe, proliferative
  cpt_code           TEXT DEFAULT '92229',
  is_billable        BOOLEAN DEFAULT TRUE,
  billed_at          TIMESTAMPTZ,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_diag_provider ON diagnostic_submissions(provider_id);
CREATE INDEX IF NOT EXISTS idx_diag_status   ON diagnostic_submissions(aeye_status);

-- ── Provider reviews ────────────────────────────────────────────────
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

-- ── HIPAA-compliant provider-patient messaging ─────────────────────
CREATE TABLE IF NOT EXISTS provider_messages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id      UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  patient_user_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sender_is_provider BOOLEAN NOT NULL,
  content          TEXT NOT NULL,   -- should be encrypted in prod (Phase 2)
  attachment_url   TEXT,
  is_read          BOOLEAN DEFAULT FALSE,
  sent_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prov_msg_provider ON provider_messages(provider_id);
CREATE INDEX IF NOT EXISTS idx_prov_msg_patient  ON provider_messages(patient_user_id);

-- ── RLS ────────────────────────────────────────────────────────────
ALTER TABLE provider_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_storefronts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_sessions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_reviews       ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE credential_verifications ENABLE ROW LEVEL SECURITY;

-- Public can read active, approved providers
DROP POLICY IF EXISTS "provider_public_read"   ON provider_profiles;
CREATE POLICY "provider_public_read" ON provider_profiles
  FOR SELECT USING (is_active = TRUE AND verification_status = 'approved');

DROP POLICY IF EXISTS "provider_own_all"       ON provider_profiles;
CREATE POLICY "provider_own_all" ON provider_profiles
  FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "storefront_public_read" ON provider_storefronts;
CREATE POLICY "storefront_public_read" ON provider_storefronts
  FOR SELECT USING (is_published = TRUE);

DROP POLICY IF EXISTS "storefront_own"         ON provider_storefronts;
CREATE POLICY "storefront_own" ON provider_storefronts
  FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "sessions_own"           ON provider_sessions;
CREATE POLICY "sessions_own" ON provider_sessions
  FOR ALL USING (provider_id IN (SELECT id FROM provider_profiles WHERE user_id = auth.uid()) OR patient_user_id = auth.uid());

DROP POLICY IF EXISTS "diag_provider_own"      ON diagnostic_submissions;
CREATE POLICY "diag_provider_own" ON diagnostic_submissions
  FOR ALL USING (provider_id IN (SELECT id FROM provider_profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "reviews_public"         ON provider_reviews;
CREATE POLICY "reviews_public" ON provider_reviews FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "reviews_own"            ON provider_reviews;
CREATE POLICY "reviews_own" ON provider_reviews
  FOR INSERT WITH CHECK (reviewer_id = auth.uid());

DROP POLICY IF EXISTS "messages_own"           ON provider_messages;
CREATE POLICY "messages_own" ON provider_messages
  FOR ALL USING (patient_user_id = auth.uid() OR
    provider_id IN (SELECT id FROM provider_profiles WHERE user_id = auth.uid()));

SELECT 'Migration 009 complete — Provider & Credential system ready.' AS status;
