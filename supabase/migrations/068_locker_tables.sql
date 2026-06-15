-- Data Locker: sharing preferences, access audit, earnings, deletion requests
-- (referenced by /api/locker/* routes; tables never existed in prior migrations)

CREATE TABLE IF NOT EXISTS data_sharing_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  share_gps_goals boolean NOT NULL DEFAULT false,
  share_content_engagement boolean NOT NULL DEFAULT false,
  share_location boolean NOT NULL DEFAULT false,
  share_wellness_metrics boolean NOT NULL DEFAULT false,
  share_financial_behavior boolean NOT NULL DEFAULT false,
  share_commerce_behavior boolean NOT NULL DEFAULT false,
  share_social_graph boolean NOT NULL DEFAULT false,
  share_goal_content_interests boolean NOT NULL DEFAULT false,
  share_entertainment boolean NOT NULL DEFAULT false,
  share_behavioral_patterns boolean NOT NULL DEFAULT false,
  share_vlg_patterns boolean NOT NULL DEFAULT false,
  share_communication_patterns boolean NOT NULL DEFAULT false,
  data_minimization_mode boolean NOT NULL DEFAULT false,
  payout_preference text NOT NULL DEFAULT 'usd' CHECK (payout_preference IN ('usd','vico')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS data_access_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  accessor_type text NOT NULL,
  accessor_name text NOT NULL,
  data_category text NOT NULL,
  access_purpose text NOT NULL,
  legal_basis text NOT NULL,
  accessed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_data_access_audit_user ON data_access_audit(user_id, accessed_at DESC);

CREATE TABLE IF NOT EXISTS data_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_usd numeric(10,2) NOT NULL DEFAULT 0,
  categories_contributed text[] NOT NULL DEFAULT '{}',
  payout_status text NOT NULL DEFAULT 'pending' CHECK (payout_status IN ('pending','paid')),
  payout_date date,
  description text,
  period_start date,
  period_end date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_data_earnings_user ON data_earnings(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS data_deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reference_number text NOT NULL UNIQUE,
  scope text NOT NULL CHECK (scope IN ('category','full_account')),
  category text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','cancelled')),
  requested_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_user ON data_deletion_requests(user_id, requested_at DESC);

ALTER TABLE data_sharing_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_access_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_deletion_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own sharing preferences" ON data_sharing_preferences;
CREATE POLICY "Users manage own sharing preferences" ON data_sharing_preferences
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users view own access audit" ON data_access_audit;
CREATE POLICY "Users view own access audit" ON data_access_audit
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users view own earnings" ON data_earnings;
CREATE POLICY "Users view own earnings" ON data_earnings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own deletion requests" ON data_deletion_requests;
CREATE POLICY "Users manage own deletion requests" ON data_deletion_requests
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
