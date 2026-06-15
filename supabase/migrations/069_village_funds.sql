-- Village Funds: member-owned pooled investment groups (Bank > Village Fund)

CREATE TABLE IF NOT EXISTS village_funds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  focus text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS village_fund_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fund_id uuid NOT NULL REFERENCES village_funds(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('creator','member')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(fund_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_village_fund_members_user ON village_fund_members(user_id);
CREATE INDEX IF NOT EXISTS idx_village_fund_members_fund ON village_fund_members(fund_id);

CREATE TABLE IF NOT EXISTS village_fund_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fund_id uuid NOT NULL REFERENCES village_funds(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_village_fund_contributions_fund ON village_fund_contributions(fund_id, created_at);

-- Helper (SECURITY DEFINER) to avoid recursive RLS on village_fund_members
CREATE OR REPLACE FUNCTION is_village_fund_member(p_fund_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM village_fund_members
    WHERE fund_id = p_fund_id AND user_id = auth.uid()
  );
$$;

ALTER TABLE village_funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE village_fund_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE village_fund_contributions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view own fund" ON village_funds;
CREATE POLICY "Members view own fund" ON village_funds
  FOR SELECT USING (is_village_fund_member(id));

DROP POLICY IF EXISTS "Users create funds" ON village_funds;
CREATE POLICY "Users create funds" ON village_funds
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Members view fund members" ON village_fund_members;
CREATE POLICY "Members view fund members" ON village_fund_members
  FOR SELECT USING (is_village_fund_member(fund_id));

DROP POLICY IF EXISTS "Users join as member" ON village_fund_members;
CREATE POLICY "Users join as member" ON village_fund_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Members view contributions" ON village_fund_contributions;
CREATE POLICY "Members view contributions" ON village_fund_contributions
  FOR SELECT USING (is_village_fund_member(fund_id));

DROP POLICY IF EXISTS "Members add own contributions" ON village_fund_contributions;
CREATE POLICY "Members add own contributions" ON village_fund_contributions
  FOR INSERT WITH CHECK (auth.uid() = user_id AND is_village_fund_member(fund_id));
