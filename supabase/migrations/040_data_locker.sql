-- 040_data_locker.sql
-- Village Data Locker — all tables for data ownership, earnings, sharing, audit, deletion
-- All share_* columns DEFAULT false (locked by default — privacy first)

-- ─── Data Sharing Preferences ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS data_sharing_preferences (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 12 data categories — all locked by default
  share_gps_goals                   boolean NOT NULL DEFAULT false,
  share_content_engagement          boolean NOT NULL DEFAULT false,
  share_location                    boolean NOT NULL DEFAULT false,
  share_wellness_metrics            boolean NOT NULL DEFAULT false,
  share_financial_behavior          boolean NOT NULL DEFAULT false,
  share_commerce_behavior           boolean NOT NULL DEFAULT false,
  share_social_graph                boolean NOT NULL DEFAULT false,
  share_goal_content_interests      boolean NOT NULL DEFAULT false,
  share_entertainment               boolean NOT NULL DEFAULT false,
  share_behavioral_patterns         boolean NOT NULL DEFAULT false,
  share_vlg_patterns                boolean NOT NULL DEFAULT false,
  share_communication_patterns      boolean NOT NULL DEFAULT false,

  -- Consent timestamps — set when user toggles on, cleared when toggled off
  consent_gps_goals_at              timestamptz,
  consent_content_engagement_at     timestamptz,
  consent_location_at               timestamptz,
  consent_wellness_metrics_at       timestamptz,
  consent_financial_behavior_at     timestamptz,
  consent_commerce_behavior_at      timestamptz,
  consent_social_graph_at           timestamptz,
  consent_goal_content_interests_at timestamptz,
  consent_entertainment_at          timestamptz,
  consent_behavioral_patterns_at    timestamptz,
  consent_vlg_patterns_at           timestamptz,
  consent_communication_patterns_at timestamptz,

  -- Payout preference: usd = Village Bank, vico = ViCo wallet (+15% bonus)
  payout_preference    text NOT NULL DEFAULT 'usd' CHECK (payout_preference IN ('usd','vico')),

  -- Data minimization mode: Spirit AI selects optimal sharing config
  data_minimization_mode boolean NOT NULL DEFAULT false,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dsp_user_id ON data_sharing_preferences(user_id);


-- ─── Approved Data Buyers ───────────────────────────────────────────────────
-- Village pre-verifies all buyers; buyer identity is INTERNAL ONLY, never shown to users
CREATE TABLE IF NOT EXISTS approved_data_buyers (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_internal_id   text NOT NULL UNIQUE,     -- internal reference, never shown to users
  buyer_category      text NOT NULL,            -- "Productivity software company", etc.
  use_case_approved   text[] NOT NULL DEFAULT '{}',
  use_case_prohibited text[] NOT NULL DEFAULT '{}',
  gdpr_compliant      boolean NOT NULL DEFAULT false,
  ccpa_compliant      boolean NOT NULL DEFAULT false,
  active              boolean NOT NULL DEFAULT true,
  verified_at         timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now()
);


-- ─── Data Sales ────────────────────────────────────────────────────────────
-- Represents a single data sale event (one buyer request, many users contributed)
CREATE TABLE IF NOT EXISTS data_sales (
  id                           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id                     uuid NOT NULL REFERENCES approved_data_buyers(id),
  buyer_category               text NOT NULL,          -- denormalized for audit display
  data_categories              text[] NOT NULL,        -- which of the 12 categories
  targeting_criteria           jsonb,                   -- anonymized criteria used
  total_revenue_usd            numeric(12,2) NOT NULL DEFAULT 0,
  village_share_usd            numeric(12,2) NOT NULL DEFAULT 0, -- 30%
  user_pool_usd                numeric(12,2) NOT NULL DEFAULT 0, -- 70%
  eligible_user_count          integer NOT NULL DEFAULT 0,
  per_user_share_usd           numeric(10,4),
  anonymization_stage_completed integer NOT NULL DEFAULT 0 CHECK (anonymization_stage_completed BETWEEN 0 AND 3),
  k_anonymity_threshold        integer NOT NULL DEFAULT 1000,
  differential_privacy_applied boolean NOT NULL DEFAULT false,
  sale_date                    timestamptz NOT NULL DEFAULT now(),
  payout_date                  timestamptz,
  created_at                   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ds_buyer_id   ON data_sales(buyer_id);
CREATE INDEX IF NOT EXISTS idx_ds_sale_date  ON data_sales(sale_date);


-- ─── Data Earnings ─────────────────────────────────────────────────────────
-- Per-user earnings record for each data sale they participated in
CREATE TABLE IF NOT EXISTS data_earnings (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sale_id                  uuid NOT NULL REFERENCES data_sales(id),
  amount_usd               numeric(10,4) NOT NULL DEFAULT 0,
  amount_vico              numeric(18,8),                   -- populated if payout_preference = vico
  vico_bonus_applied       boolean NOT NULL DEFAULT false,
  vico_bonus_pct           numeric(4,2) NOT NULL DEFAULT 15.00,
  categories_contributed   text[] NOT NULL DEFAULT '{}',
  payout_status            text NOT NULL DEFAULT 'pending' CHECK (payout_status IN ('pending','deposited','failed','carried_forward')),
  payout_date              timestamptz,
  payout_destination       text NOT NULL DEFAULT 'village_bank' CHECK (payout_destination IN ('village_bank','vico_wallet')),
  created_at               timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_de_user_id  ON data_earnings(user_id);
CREATE INDEX IF NOT EXISTS idx_de_sale_id  ON data_earnings(sale_id);
CREATE INDEX IF NOT EXISTS idx_de_status   ON data_earnings(payout_status);


-- ─── Data Access Audit ─────────────────────────────────────────────────────
-- Immutable log of every access to user data — both platform and buyer
CREATE TABLE IF NOT EXISTS data_access_audit (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  accessor_type   text NOT NULL CHECK (accessor_type IN ('platform','buyer')),
  accessor_name   text NOT NULL,     -- "Spirit AI", "Village content algorithm", "Approved buyer: category"
  data_category   text NOT NULL,     -- one of the 12 categories
  access_purpose  text NOT NULL,
  legal_basis     text NOT NULL,     -- "Platform operation" or "User consent (date)"
  sale_id         uuid REFERENCES data_sales(id),   -- null for platform operation
  accessed_at     timestamptz NOT NULL DEFAULT now()
);

-- Audit log must be append-only — no UPDATE or DELETE allowed via RLS
CREATE INDEX IF NOT EXISTS idx_daa_user_id    ON data_access_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_daa_accessed   ON data_access_audit(accessed_at);
CREATE INDEX IF NOT EXISTS idx_daa_type       ON data_access_audit(accessor_type);
CREATE INDEX IF NOT EXISTS idx_daa_category   ON data_access_audit(data_category);


-- ─── Data Deletion Requests ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS data_deletion_requests (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  categories_to_delete  text[],             -- null = all categories
  delete_account        boolean NOT NULL DEFAULT false,
  status                text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
  gdpr_reference        text UNIQUE,        -- issued on request creation, e.g. GDPR-2026-XXXXX
  requested_at          timestamptz NOT NULL DEFAULT now(),
  completed_at          timestamptz,
  notes                 text
);

CREATE INDEX IF NOT EXISTS idx_ddr_user_id ON data_deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_ddr_status  ON data_deletion_requests(status);


-- ─── Row Level Security ────────────────────────────────────────────────────
ALTER TABLE data_sharing_preferences  ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_earnings             ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_access_audit         ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_deletion_requests    ENABLE ROW LEVEL SECURITY;
ALTER TABLE approved_data_buyers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sales                ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their own preferences
CREATE POLICY "dsp_owner" ON data_sharing_preferences
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can only read their own earnings
CREATE POLICY "de_owner_read" ON data_earnings
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only read their own audit log (never delete — append-only)
CREATE POLICY "daa_owner_read" ON data_access_audit
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only read their own deletion requests
CREATE POLICY "ddr_owner_read" ON data_deletion_requests
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own deletion requests
CREATE POLICY "ddr_owner_insert" ON data_deletion_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Approved buyers table: read-only for all authenticated users (category names for display)
CREATE POLICY "adb_authenticated_read" ON approved_data_buyers
  FOR SELECT USING (auth.role() = 'authenticated');

-- Data sales: read-only for all authenticated users (for marketplace display)
CREATE POLICY "ds_authenticated_read" ON data_sales
  FOR SELECT USING (auth.role() = 'authenticated');


-- ─── Helper function: generate GDPR reference ──────────────────────────────
CREATE OR REPLACE FUNCTION generate_gdpr_reference()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  ref text;
BEGIN
  ref := 'GDPR-' || to_char(now(), 'YYYY') || '-' || upper(substring(gen_random_uuid()::text, 1, 8));
  RETURN ref;
END;
$$;

-- Auto-assign GDPR reference on deletion request insert
CREATE OR REPLACE FUNCTION set_gdpr_reference()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.gdpr_reference IS NULL THEN
    NEW.gdpr_reference := generate_gdpr_reference();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_gdpr_reference
  BEFORE INSERT ON data_deletion_requests
  FOR EACH ROW EXECUTE FUNCTION set_gdpr_reference();


-- ─── Updated_at trigger for preferences ────────────────────────────────────
CREATE OR REPLACE FUNCTION update_dsp_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_dsp_updated_at
  BEFORE UPDATE ON data_sharing_preferences
  FOR EACH ROW EXECUTE FUNCTION update_dsp_timestamp();
