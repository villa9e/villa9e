-- ViCo Merchant Network
-- Migration: 039_merchant_network.sql
-- Creates: merchant_accounts, merchant_verification_documents,
--          merchant_payment_links, merchant_invoices, merchant_transactions

-- ── merchant_accounts ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS merchant_accounts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  merchant_handle       TEXT UNIQUE NOT NULL,
  business_name         TEXT NOT NULL,
  business_type         TEXT NOT NULL CHECK (business_type IN ('creator','retail','service','events','food','other')),
  category              TEXT,
  description           TEXT,
  location_type         TEXT NOT NULL DEFAULT 'online' CHECK (location_type IN ('physical','online')),
  address               TEXT,
  city                  TEXT,
  state                 TEXT,
  country               TEXT DEFAULT 'US',
  lat                   DOUBLE PRECISION,
  lng                   DOUBLE PRECISION,
  business_hours        TEXT,
  website               TEXT,
  logo_url              TEXT,
  -- Payout
  payout_preference     TEXT NOT NULL DEFAULT 'hold' CHECK (payout_preference IN ('hold','convert','split')),
  payout_split_vico_pct INTEGER NOT NULL DEFAULT 100 CHECK (payout_split_vico_pct BETWEEN 0 AND 100),
  payout_threshold_vico NUMERIC(18,6) DEFAULT 50,
  bank_account_last4    TEXT,
  -- Verification
  is_verified           BOOLEAN NOT NULL DEFAULT FALSE,
  verification_submitted_at TIMESTAMPTZ,
  verification_approved_at  TIMESTAMPTZ,
  -- Linked eStore
  estore_id             UUID REFERENCES estores(id) ON DELETE SET NULL,
  -- Status
  status                TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','deactivated','closed')),
  -- Stats (denormalized for perf)
  total_vico_received   NUMERIC(18,6) NOT NULL DEFAULT 0,
  total_usd_converted   NUMERIC(10,2) NOT NULL DEFAULT 0,
  transaction_count     INTEGER NOT NULL DEFAULT 0,
  unique_customers      INTEGER NOT NULL DEFAULT 0,
  -- Tax
  ein_encrypted         TEXT,
  default_tax_rate      NUMERIC(5,2) DEFAULT 0,
  -- Notification prefs (JSONB)
  notification_prefs    JSONB NOT NULL DEFAULT '{"per_payment":true,"daily":true,"weekly":false,"invoice_due":true,"new_customer":false}'::JSONB,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_merchant_accounts_user_id ON merchant_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_merchant_accounts_handle ON merchant_accounts(merchant_handle);
CREATE INDEX IF NOT EXISTS idx_merchant_accounts_lat_lng ON merchant_accounts(lat, lng) WHERE lat IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_merchant_accounts_status ON merchant_accounts(status);
CREATE INDEX IF NOT EXISTS idx_merchant_accounts_verified ON merchant_accounts(is_verified);

-- ── merchant_verification_documents ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS merchant_verification_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id     UUID NOT NULL REFERENCES merchant_accounts(id) ON DELETE CASCADE,
  document_type   TEXT NOT NULL CHECK (document_type IN ('registration','license','tax','social')),
  file_url        TEXT,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewing','approved','rejected')),
  rejection_note  TEXT,
  uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_merchant_docs_merchant_id ON merchant_verification_documents(merchant_id);

-- ── merchant_payment_links ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS merchant_payment_links (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id     UUID NOT NULL REFERENCES merchant_accounts(id) ON DELETE CASCADE,
  link_id         TEXT UNIQUE NOT NULL,       -- short slug, e.g. lnk001
  description     TEXT NOT NULL,
  amount          NUMERIC(18,6),              -- NULL = customer enters amount
  currency        TEXT NOT NULL DEFAULT 'VICO' CHECK (currency IN ('VICO','USD')),
  is_one_time     BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at      TIMESTAMPTZ,
  use_count       INTEGER NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deactivated_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payment_links_merchant_id ON merchant_payment_links(merchant_id);
CREATE INDEX IF NOT EXISTS idx_payment_links_link_id ON merchant_payment_links(link_id);

-- ── merchant_invoices ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS merchant_invoices (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id       UUID NOT NULL REFERENCES merchant_accounts(id) ON DELETE CASCADE,
  invoice_number    TEXT NOT NULL,            -- e.g. INV-2026-001
  -- Customer (Village user or guest)
  customer_user_id  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_handle   TEXT,                     -- @handle
  customer_email    TEXT,
  -- Amounts
  subtotal          NUMERIC(18,6) NOT NULL DEFAULT 0,
  tax_rate          NUMERIC(5,2) NOT NULL DEFAULT 0,
  tax_amount        NUMERIC(18,6) NOT NULL DEFAULT 0,
  total             NUMERIC(18,6) NOT NULL,
  currency          TEXT NOT NULL DEFAULT 'VICO' CHECK (currency IN ('VICO','USD')),
  usd_equiv_at_creation NUMERIC(10,2),        -- USD equiv locked at creation time
  -- Line items (JSONB array)
  line_items        JSONB NOT NULL DEFAULT '[]'::JSONB,
  -- Dates
  issued_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_at            TIMESTAMPTZ NOT NULL,
  paid_at           TIMESTAMPTZ,
  -- Status
  status            TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid','paid','overdue','cancelled','refunded')),
  notes             TEXT,
  -- Reminders
  reminder_sent_1   BOOLEAN NOT NULL DEFAULT FALSE,  -- at due_at
  reminder_sent_2   BOOLEAN NOT NULL DEFAULT FALSE,  -- at due_at + 7 days
  -- Payment tx
  payment_tx_id     UUID,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_merchant_number ON merchant_invoices(merchant_id, invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_merchant_id ON merchant_invoices(merchant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_email ON merchant_invoices(customer_email);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON merchant_invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_at ON merchant_invoices(due_at);

-- ── merchant_transactions ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS merchant_transactions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id           UUID NOT NULL REFERENCES merchant_accounts(id) ON DELETE CASCADE,
  -- Customer
  customer_user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_handle       TEXT,                 -- @handle or NULL for guest
  customer_display_name TEXT,
  -- Amounts
  vico_amount           NUMERIC(18,6) NOT NULL,
  usd_at_time           NUMERIC(10,2),        -- USD equiv at transaction time
  vico_rate_usd         NUMERIC(10,6),        -- VICO/USD rate used
  -- Description & method
  description           TEXT,
  payment_method        TEXT NOT NULL DEFAULT 'qr' CHECK (payment_method IN ('qr','web_button','payment_link','invoice','estore')),
  payment_link_id       UUID REFERENCES merchant_payment_links(id) ON DELETE SET NULL,
  invoice_id            UUID REFERENCES merchant_invoices(id) ON DELETE SET NULL,
  -- Payout
  payout_action         TEXT NOT NULL DEFAULT 'held' CHECK (payout_action IN ('held','converted','split')),
  vico_held             NUMERIC(18,6) DEFAULT 0,
  usd_converted         NUMERIC(10,2) DEFAULT 0,
  -- On-chain
  chain_tx_hash         TEXT,
  chain_block_number    BIGINT,
  chain_network         TEXT DEFAULT 'village-l2',
  -- Status
  status                TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','failed','refunded')),
  refunded_at           TIMESTAMPTZ,
  refund_tx_hash        TEXT,
  -- Timestamps
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at          TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_merchant_tx_merchant_id ON merchant_transactions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_tx_customer_user ON merchant_transactions(customer_user_id);
CREATE INDEX IF NOT EXISTS idx_merchant_tx_status ON merchant_transactions(status);
CREATE INDEX IF NOT EXISTS idx_merchant_tx_created_at ON merchant_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_merchant_tx_payment_method ON merchant_transactions(payment_method);
CREATE INDEX IF NOT EXISTS idx_merchant_tx_chain_hash ON merchant_transactions(chain_tx_hash) WHERE chain_tx_hash IS NOT NULL;

-- ── Row-Level Security ──────────────────────────────────────────────────────────
ALTER TABLE merchant_accounts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_verification_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_payment_links          ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_invoices               ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_transactions           ENABLE ROW LEVEL SECURITY;

-- merchant_accounts: owners see their own
CREATE POLICY "merchant_accounts_owner" ON merchant_accounts
  FOR ALL USING (auth.uid() = user_id);

-- Public can read active verified merchants (for map/discovery)
CREATE POLICY "merchant_accounts_public_read" ON merchant_accounts
  FOR SELECT USING (status = 'active');

-- Verification docs: owner only
CREATE POLICY "merchant_docs_owner" ON merchant_verification_documents
  FOR ALL USING (
    merchant_id IN (SELECT id FROM merchant_accounts WHERE user_id = auth.uid())
  );

-- Payment links: owner full access; public can read active links
CREATE POLICY "payment_links_owner" ON merchant_payment_links
  FOR ALL USING (
    merchant_id IN (SELECT id FROM merchant_accounts WHERE user_id = auth.uid())
  );
CREATE POLICY "payment_links_public_read" ON merchant_payment_links
  FOR SELECT USING (is_active = TRUE);

-- Invoices: owner full access; customer can read their invoices
CREATE POLICY "invoices_owner" ON merchant_invoices
  FOR ALL USING (
    merchant_id IN (SELECT id FROM merchant_accounts WHERE user_id = auth.uid())
  );
CREATE POLICY "invoices_customer_read" ON merchant_invoices
  FOR SELECT USING (customer_user_id = auth.uid());

-- Transactions: owner full access; customer can read their transactions
CREATE POLICY "transactions_owner" ON merchant_transactions
  FOR ALL USING (
    merchant_id IN (SELECT id FROM merchant_accounts WHERE user_id = auth.uid())
  );
CREATE POLICY "transactions_customer_read" ON merchant_transactions
  FOR SELECT USING (customer_user_id = auth.uid());

-- ── update_updated_at trigger helper ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER merchant_accounts_updated_at
  BEFORE UPDATE ON merchant_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER merchant_invoices_updated_at
  BEFORE UPDATE ON merchant_invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
