-- 042_bank_full_schema.sql
-- Complete Bank section tables — makes Bank fully functional without Unit BaaS
-- Safe to re-run (IF NOT EXISTS everywhere)

-- Bank accounts per user
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  account_type TEXT NOT NULL DEFAULT 'checking', -- checking|savings|investment|credit
  account_name TEXT NOT NULL DEFAULT 'Village Checking',
  balance NUMERIC(14,2) DEFAULT 0.00,
  available_balance NUMERIC(14,2) DEFAULT 0.00,
  currency TEXT DEFAULT 'USD',
  routing_number TEXT DEFAULT '021000021',
  account_number TEXT DEFAULT '',
  is_primary BOOLEAN DEFAULT FALSE,
  is_fdic_insured BOOLEAN DEFAULT TRUE,
  institution_name TEXT DEFAULT 'Village Bank (via Unit)',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bank transactions
CREATE TABLE IF NOT EXISTS bank_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  account_id UUID REFERENCES bank_accounts(id),
  transaction_type TEXT NOT NULL, -- debit|credit|transfer|payment|deposit|withdraw
  category TEXT DEFAULT 'Other', -- Food|Transport|Shopping|Bills|Income|Transfer|Investment|Health
  merchant_name TEXT,
  description TEXT,
  amount NUMERIC(12,2) NOT NULL,
  direction TEXT NOT NULL DEFAULT 'debit', -- debit|credit
  status TEXT DEFAULT 'posted', -- pending|posted|failed
  method TEXT DEFAULT 'ach', -- ach|rtp|card|wire|internal
  recipient_user_id UUID REFERENCES profiles(id),
  recipient_wallet TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Investments portfolio
CREATE TABLE IF NOT EXISTS investments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL DEFAULT 'stock', -- stock|crypto|etf|bond
  ticker TEXT NOT NULL,
  name TEXT NOT NULL,
  quantity NUMERIC(18,8) NOT NULL DEFAULT 0,
  avg_cost NUMERIC(12,4) NOT NULL DEFAULT 0,
  current_price NUMERIC(12,4) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  exchange TEXT DEFAULT 'NYSE',
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Watchlist
CREATE TABLE IF NOT EXISTS investment_watchlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL,
  name TEXT NOT NULL,
  asset_type TEXT DEFAULT 'stock',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, ticker)
);

-- Financial goals (savings pockets)
CREATE TABLE IF NOT EXISTS financial_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  goal_name TEXT NOT NULL,
  goal_category TEXT DEFAULT 'savings', -- savings|emergency|business|travel|education|home|vehicle
  target_amount NUMERIC(12,2) NOT NULL,
  current_amount NUMERIC(12,2) DEFAULT 0,
  monthly_contribution NUMERIC(10,2) DEFAULT 0,
  target_date DATE,
  automation_enabled BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Loan applications and active loans
CREATE TABLE IF NOT EXISTS loans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  loan_type TEXT NOT NULL DEFAULT 'personal', -- personal|business|crypto_backed|credit_builder
  status TEXT DEFAULT 'pending', -- pending|approved|active|paid_off|rejected
  principal NUMERIC(12,2) NOT NULL,
  outstanding NUMERIC(12,2),
  apr NUMERIC(6,4) NOT NULL,
  term_months INT NOT NULL,
  monthly_payment NUMERIC(10,2),
  next_payment_date DATE,
  collateral_vico NUMERIC(30,18),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Direct deposit records
CREATE TABLE IF NOT EXISTS direct_deposits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source TEXT NOT NULL, -- employer name or source
  amount NUMERIC(12,2) NOT NULL,
  account_id UUID REFERENCES bank_accounts(id),
  status TEXT DEFAULT 'processed', -- processing|processed|failed
  deposit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Financial network connections (the social layer)
CREATE TABLE IF NOT EXISTS financial_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  connected_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  credential_category TEXT, -- CFA|CFP|CPA|Series7|MBA|other
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, connected_user_id)
);

-- Seed default bank accounts for existing users
INSERT INTO bank_accounts (user_id, account_type, account_name, balance, available_balance, is_primary)
SELECT id, 'checking', 'Village Checking', 0.00, 0.00, TRUE
FROM profiles
WHERE NOT EXISTS (
  SELECT 1 FROM bank_accounts WHERE bank_accounts.user_id = profiles.id AND account_type = 'checking'
);

-- RLS
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bank_accounts_own" ON bank_accounts;
CREATE POLICY "bank_accounts_own" ON bank_accounts FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS "bank_transactions_own" ON bank_transactions;
CREATE POLICY "bank_transactions_own" ON bank_transactions FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS "investments_own" ON investments;
CREATE POLICY "investments_own" ON investments FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS "watchlist_own" ON investment_watchlist;
CREATE POLICY "watchlist_own" ON investment_watchlist FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS "financial_goals_own" ON financial_goals;
CREATE POLICY "financial_goals_own" ON financial_goals FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS "loans_own" ON loans;
CREATE POLICY "loans_own" ON loans FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS "direct_deposits_own" ON direct_deposits;
CREATE POLICY "direct_deposits_own" ON direct_deposits FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS "fin_connections_own" ON financial_connections;
CREATE POLICY "fin_connections_own" ON financial_connections FOR ALL USING (user_id = auth.uid());

SELECT '042_bank_full_schema applied' AS result;
