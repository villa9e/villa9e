-- User-submitted credentials for Hut > Verifications page
-- (distinct from credential_verifications which is provider-only AI-verified licenses)

CREATE TABLE IF NOT EXISTS user_credentials (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_type text NOT NULL,
  issuing_body    text,
  issue_date      date,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','failed')),
  notes           text,
  document_url    text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_credentials_user ON user_credentials(user_id, created_at DESC);

ALTER TABLE user_credentials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own credentials" ON user_credentials;
CREATE POLICY "Users manage own credentials" ON user_credentials
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
