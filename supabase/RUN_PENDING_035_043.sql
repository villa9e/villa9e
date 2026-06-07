-- ============================================================
-- VILLA9E — RUN PENDING MIGRATIONS 035-043
-- Paste this ENTIRE file into Supabase SQL Editor and run once.
-- Generated 2026-06-07 — covers Bank, Data Locker, Office/DMs, Tasks, Governance, Merchant Network, Ads, Village Platform
-- ============================================================

-- ════════════════ MIGRATION 035: 035_messaging_journal_crowdfunding.sql ════════════════
-- ============================================================
-- Migration 035: Messaging, Journal, Crowdfunding tables
-- Safe to re-run (all IF NOT EXISTS / ADD COLUMN IF NOT EXISTS)
-- ============================================================

-- ── 1. Journal Entries (Zen Journal) ────────────────────────
CREATE TABLE IF NOT EXISTS journal_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title           TEXT,
  content         TEXT NOT NULL,
  mood            TEXT,
  tags            TEXT[] DEFAULT '{}',
  ai_prompt_used  TEXT,
  is_private      BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "journal_own" ON journal_entries;
CREATE POLICY "journal_own" ON journal_entries FOR ALL USING (user_id = auth.uid());

-- ── 2. Conversations ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_type     TEXT DEFAULT 'direct',
  reference_id          UUID,
  participant_ids       UUID[] NOT NULL,
  last_message_at       TIMESTAMPTZ,
  last_message_preview  TEXT,
  unread_counts         JSONB DEFAULT '{}',
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "conversations_participant" ON conversations;
CREATE POLICY "conversations_participant" ON conversations FOR ALL
  USING (auth.uid() = ANY(participant_ids));

-- ── 3. Messages ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content         TEXT,
  media_url       TEXT,
  media_type      TEXT,
  status          TEXT DEFAULT 'sent',
  is_deleted      BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "messages_participant" ON messages;
CREATE POLICY "messages_participant" ON messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND auth.uid() = ANY(c.participant_ids)
    )
  );

-- ── 4. Crowdfunding Campaigns ────────────────────────────────
CREATE TABLE IF NOT EXISTS crowdfunding_campaigns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  goal_id         UUID REFERENCES goals(id),
  title           TEXT NOT NULL,
  description     TEXT,
  cover_image_url TEXT,
  goal_amount     DECIMAL(12,2) NOT NULL DEFAULT 0,
  raised_amount   DECIMAL(12,2) DEFAULT 0.00,
  backer_count    INT DEFAULT 0,
  status          TEXT DEFAULT 'active',
  deadline        TIMESTAMPTZ,
  currency        TEXT DEFAULT 'USD',
  perks           JSONB DEFAULT '[]',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE crowdfunding_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "campaigns_public_view" ON crowdfunding_campaigns;
CREATE POLICY "campaigns_public_view" ON crowdfunding_campaigns FOR SELECT USING (status = 'active');
DROP POLICY IF EXISTS "campaigns_own_manage" ON crowdfunding_campaigns;
CREATE POLICY "campaigns_own_manage" ON crowdfunding_campaigns FOR ALL USING (user_id = auth.uid());

-- ── 5. Crowdfunding Contributions ───────────────────────────
CREATE TABLE IF NOT EXISTS crowdfunding_contributions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id    UUID NOT NULL REFERENCES crowdfunding_campaigns(id) ON DELETE CASCADE,
  backer_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount         DECIMAL(12,2) NOT NULL,
  currency       TEXT DEFAULT 'USD',
  stripe_payment_id TEXT,
  status         TEXT DEFAULT 'pending',
  perk_label     TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE crowdfunding_contributions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "contributions_own" ON crowdfunding_contributions;
CREATE POLICY "contributions_own" ON crowdfunding_contributions FOR ALL
  USING (backer_id = auth.uid() OR EXISTS (
    SELECT 1 FROM crowdfunding_campaigns c WHERE c.id = campaign_id AND c.user_id = auth.uid()
  ));

-- ── 6. Studio videos oowop_count column ─────────────────────
ALTER TABLE studio_videos ADD COLUMN IF NOT EXISTS oowop_count INT DEFAULT 0;

-- ── 7. Crowdfunding: add status column (old schema had is_active) ──
ALTER TABLE crowdfunding_campaigns ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
-- Back-fill: rows with is_active=true get status='active', others get 'inactive'
UPDATE crowdfunding_campaigns SET status = CASE WHEN is_active = TRUE THEN 'active' ELSE 'inactive' END WHERE status IS NULL OR status = 'active';

-- ── 7. Realtime enable ───────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ════════════════ MIGRATION 036: 036_village_platform.sql ════════════════
-- ============================================================
-- 036_village_platform.sql
-- Deals, eStore products, office meetings/messages, Tribe connections upgrade
-- Safe to run multiple times (IF NOT EXISTS everywhere)
-- ============================================================

-- ── Deals ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS deals (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  hook            TEXT NOT NULL,
  industry        TEXT,
  deal_type       TEXT,
  seeking         TEXT,
  raise_amount    NUMERIC(18,2),
  deal_length     TEXT,
  elevator_pitch  TEXT,
  projected_roi   TEXT,
  irr             TEXT,
  annual_yield    TEXT,
  unit_economics  TEXT,
  financial_model_url TEXT,
  team_members    JSONB DEFAULT '[]',
  founder_equity  TEXT,
  founder_investment TEXT,
  tam             TEXT,
  competitive_moat TEXT,
  customer_traction TEXT,
  market_report_url TEXT,
  downside_protection TEXT,
  primary_exit    TEXT,
  secondary_exit  TEXT,
  exit_timeline   TEXT,
  valuation       TEXT,
  structure       TEXT,
  min_investment  NUMERIC(18,2),
  legal_protections TEXT,
  media_urls      JSONB DEFAULT '[]',
  status          TEXT DEFAULT 'draft', -- draft | active | closed | funded
  view_count      INTEGER DEFAULT 0,
  match_count     INTEGER DEFAULT 0,
  pass_count      INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS deal_swipes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id     UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  investor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  direction   TEXT NOT NULL, -- 'match' | 'pass'
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(deal_id, investor_id)
);

CREATE TABLE IF NOT EXISTS deal_feedback (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id         UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  hashed_user_id  TEXT NOT NULL,
  rating          SMALLINT CHECK (rating BETWEEN 1 AND 5),
  reason          TEXT,
  comment         TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS deal_matches (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id     UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  investor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  creator_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status      TEXT DEFAULT 'active', -- active | in_contract | funded | closed
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(deal_id, investor_id)
);

-- ── eStore / Market ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS estores (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  store_name      TEXT NOT NULL,
  tagline         TEXT,
  about           TEXT,
  banner_url      TEXT,
  verified        BOOLEAN DEFAULT FALSE,
  credentials     JSONB DEFAULT '[]',
  product_types   JSONB DEFAULT '[]', -- ['courses','coaching','services','products','gigs','tickets']
  rating          NUMERIC(3,2) DEFAULT 0,
  follower_count  INTEGER DEFAULT 0,
  product_count   INTEGER DEFAULT 0,
  status          TEXT DEFAULT 'active',
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS estore_products (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id        UUID NOT NULL REFERENCES estores(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_type    TEXT NOT NULL, -- 'course'|'coaching'|'service'|'product'|'gig'|'ticket'
  name            TEXT NOT NULL,
  description     TEXT,
  price           NUMERIC(10,2),
  price_label     TEXT,
  currency        TEXT DEFAULT 'USD',
  cover_url       TEXT,
  media_urls      JSONB DEFAULT '[]',
  metadata        JSONB DEFAULT '{}',
  status          TEXT DEFAULT 'active',
  purchase_count  INTEGER DEFAULT 0,
  rating          NUMERIC(3,2) DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS estore_follows (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id    UUID NOT NULL REFERENCES estores(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(store_id, user_id)
);

-- ── Office — Meetings & Messages ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS office_meetings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  scheduled_at    TIMESTAMPTZ NOT NULL,
  duration_min    INTEGER DEFAULT 30,
  format          TEXT DEFAULT 'video', -- video | in-person | async
  jitsi_room      TEXT,
  attendee_ids    JSONB DEFAULT '[]',
  notes           TEXT,
  action_items    JSONB DEFAULT '[]',
  context_type    TEXT, -- 'deal'|'store'|'tribe'
  context_id      UUID,
  status          TEXT DEFAULT 'scheduled', -- scheduled | active | completed | cancelled
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS office_threads (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_ids JSONB NOT NULL DEFAULT '[]',
  context_type    TEXT,
  context_id      UUID,
  context_label   TEXT,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS office_messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id   UUID NOT NULL REFERENCES office_threads(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  file_url    TEXT,
  read_by     JSONB DEFAULT '[]',
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ── Connections upgrade (add role + context) ──────────────────────────────────
ALTER TABLE connections ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE connections ADD COLUMN IF NOT EXISTS context_type TEXT;
ALTER TABLE connections ADD COLUMN IF NOT EXISTS context_label TEXT;
ALTER TABLE connections ADD COLUMN IF NOT EXISTS pending BOOLEAN DEFAULT TRUE;

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE estores ENABLE ROW LEVEL SECURITY;
ALTER TABLE estore_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE estore_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE office_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE office_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE office_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deals_public_view"    ON deals;
DROP POLICY IF EXISTS "deals_own"            ON deals;
DROP POLICY IF EXISTS "swipes_own"           ON deal_swipes;
DROP POLICY IF EXISTS "feedback_own"         ON deal_feedback;
DROP POLICY IF EXISTS "matches_own"          ON deal_matches;
DROP POLICY IF EXISTS "estores_public"       ON estores;
DROP POLICY IF EXISTS "estores_own"          ON estores;
DROP POLICY IF EXISTS "products_public"      ON estore_products;
DROP POLICY IF EXISTS "products_own"         ON estore_products;
DROP POLICY IF EXISTS "follows_own"          ON estore_follows;
DROP POLICY IF EXISTS "meetings_own"         ON office_meetings;
DROP POLICY IF EXISTS "threads_participant"  ON office_threads;
DROP POLICY IF EXISTS "messages_participant" ON office_messages;

CREATE POLICY "deals_public_view"    ON deals           FOR SELECT USING (status = 'active');
CREATE POLICY "deals_own"            ON deals           FOR ALL    USING (user_id = auth.uid());
CREATE POLICY "swipes_own"           ON deal_swipes     FOR ALL    USING (investor_id = auth.uid());
CREATE POLICY "feedback_own"         ON deal_feedback   FOR ALL    USING (TRUE);
CREATE POLICY "matches_own"          ON deal_matches    FOR SELECT USING (investor_id = auth.uid() OR creator_id = auth.uid());
CREATE POLICY "estores_public"       ON estores         FOR SELECT USING (status = 'active');
CREATE POLICY "estores_own"          ON estores         FOR ALL    USING (user_id = auth.uid());
CREATE POLICY "products_public"      ON estore_products FOR SELECT USING (status = 'active');
CREATE POLICY "products_own"         ON estore_products FOR ALL    USING (user_id = auth.uid());
CREATE POLICY "follows_own"          ON estore_follows  FOR ALL    USING (user_id = auth.uid());
CREATE POLICY "meetings_own"         ON office_meetings FOR ALL    USING (creator_id = auth.uid());
CREATE POLICY "threads_participant"  ON office_threads  FOR ALL    USING (participant_ids::jsonb ? auth.uid()::text);
CREATE POLICY "messages_participant" ON office_messages FOR ALL    USING (sender_id = auth.uid());

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);
CREATE INDEX IF NOT EXISTS idx_deals_user ON deals(user_id);
CREATE INDEX IF NOT EXISTS idx_estore_products_store ON estore_products(store_id);
CREATE INDEX IF NOT EXISTS idx_estore_products_type ON estore_products(product_type);
CREATE INDEX IF NOT EXISTS idx_office_messages_thread ON office_messages(thread_id, created_at);

SELECT '036_village_platform applied' AS result;

-- ════════════════ MIGRATION 037: 037_ads_manager.sql ════════════════
-- Village Ads Manager tables
-- Migration: 037_ads_manager.sql

CREATE TABLE IF NOT EXISTS ad_campaigns (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  objective      TEXT NOT NULL DEFAULT 'awareness',
  status         TEXT NOT NULL DEFAULT 'draft',
  daily_budget   NUMERIC,
  lifetime_budget NUMERIC,
  start_date     DATE,
  end_date       DATE,
  cbo            BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ad_sets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id     UUID REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'active',
  budget          NUMERIC,
  audience_type   TEXT,
  audience_config JSONB,
  placements      JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_set_id       UUID REFERENCES ad_sets(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  format          TEXT,
  creative_url    TEXT,
  primary_text    TEXT,
  headline        TEXT,
  cta             TEXT,
  destination_url TEXT,
  status          TEXT NOT NULL DEFAULT 'draft',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ad_pixels (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL DEFAULT 'Village Pixel',
  pixel_id   TEXT UNIQUE DEFAULT substr(md5(random()::text), 1, 16),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_sets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads          ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_pixels    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own campaigns" ON ad_campaigns
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own ad sets" ON ad_sets
  FOR ALL USING (
    campaign_id IN (SELECT id FROM ad_campaigns WHERE user_id = auth.uid())
  );

CREATE POLICY "Users manage own ads" ON ads
  FOR ALL USING (
    ad_set_id IN (
      SELECT s.id FROM ad_sets s
      JOIN ad_campaigns c ON c.id = s.campaign_id
      WHERE c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users manage own pixels" ON ad_pixels
  FOR ALL USING (auth.uid() = user_id);

-- ════════════════ MIGRATION 038: 038_vico_governance.sql ════════════════
-- 038_vico_governance.sql
-- ViCo Governance: proposals, votes, comments, treasury

-- Proposals
CREATE TABLE IF NOT EXISTS vico_governance_proposals (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vip_number            INTEGER NOT NULL UNIQUE,
  proposer_user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title                 TEXT NOT NULL,
  category              TEXT NOT NULL CHECK (category IN ('earnings','treasury','goal-category','feature','policy','other')),
  description           TEXT NOT NULL,
  execution_plan        TEXT NOT NULL,
  supporting_url        TEXT,
  status                TEXT NOT NULL DEFAULT 'discussion' CHECK (status IN ('discussion','active','passed','rejected','executed')),
  discussion_starts_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  voting_starts_at      TIMESTAMPTZ NOT NULL,
  voting_ends_at        TIMESTAMPTZ NOT NULL,
  votes_for             INTEGER NOT NULL DEFAULT 0,
  votes_against         INTEGER NOT NULL DEFAULT 0,
  votes_abstain         INTEGER NOT NULL DEFAULT 0,
  total_eligible_voters INTEGER NOT NULL DEFAULT 0,
  on_chain_proposal_id  TEXT,
  execution_tx_hash     TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Votes
CREATE TABLE IF NOT EXISTS vico_votes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id       UUID NOT NULL REFERENCES vico_governance_proposals(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address    TEXT,
  vote              TEXT NOT NULL CHECK (vote IN ('for','against','abstain')),
  voting_power      BIGINT NOT NULL DEFAULT 0,
  on_chain_tx_hash  TEXT,
  voted_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (proposal_id, user_id)
);

-- Comments
CREATE TABLE IF NOT EXISTS vico_governance_comments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id  UUID NOT NULL REFERENCES vico_governance_proposals(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content      TEXT NOT NULL,
  oowop_count  INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comment OoWops (likes)
CREATE TABLE IF NOT EXISTS vico_governance_comment_oowops (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id  UUID NOT NULL REFERENCES vico_governance_comments(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (comment_id, user_id)
);

-- Treasury allocations (weekly snapshot)
CREATE TABLE IF NOT EXISTS vico_treasury_allocations (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_ending               DATE NOT NULL UNIQUE,
  community_grants_balance  BIGINT NOT NULL DEFAULT 0,
  staking_rewards_balance   BIGINT NOT NULL DEFAULT 0,
  liquidity_balance         BIGINT NOT NULL DEFAULT 0,
  total_balance             BIGINT NOT NULL DEFAULT 0,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Treasury transactions
CREATE TABLE IF NOT EXISTS vico_treasury_transactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type  TEXT NOT NULL,
  description       TEXT NOT NULL,
  amount            BIGINT NOT NULL,
  direction         TEXT NOT NULL CHECK (direction IN ('in','out')),
  vip_number        INTEGER,
  chain_tx_hash     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vico_proposals_status ON vico_governance_proposals(status);
CREATE INDEX IF NOT EXISTS idx_vico_proposals_voting_ends ON vico_governance_proposals(voting_ends_at);
CREATE INDEX IF NOT EXISTS idx_vico_votes_proposal ON vico_votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_vico_votes_user ON vico_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_vico_comments_proposal ON vico_governance_comments(proposal_id);
CREATE INDEX IF NOT EXISTS idx_vico_comments_oowop ON vico_governance_comments(oowop_count DESC);
CREATE INDEX IF NOT EXISTS idx_vico_treasury_txns_date ON vico_treasury_transactions(created_at DESC);

-- RLS
ALTER TABLE vico_governance_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE vico_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vico_governance_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vico_governance_comment_oowops ENABLE ROW LEVEL SECURITY;
ALTER TABLE vico_treasury_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vico_treasury_transactions ENABLE ROW LEVEL SECURITY;

-- Proposals: public read, authenticated create
CREATE POLICY "proposals_public_read" ON vico_governance_proposals FOR SELECT USING (true);
CREATE POLICY "proposals_auth_insert" ON vico_governance_proposals FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Votes: public read, own insert/update
CREATE POLICY "votes_public_read" ON vico_votes FOR SELECT USING (true);
CREATE POLICY "votes_own_insert" ON vico_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Comments: public read, authenticated insert
CREATE POLICY "comments_public_read" ON vico_governance_comments FOR SELECT USING (true);
CREATE POLICY "comments_auth_insert" ON vico_governance_comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Comment OoWops: public read, authenticated insert
CREATE POLICY "comment_oowops_public_read" ON vico_governance_comment_oowops FOR SELECT USING (true);
CREATE POLICY "comment_oowops_auth_insert" ON vico_governance_comment_oowops FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comment_oowops_own_delete" ON vico_governance_comment_oowops FOR DELETE USING (auth.uid() = user_id);

-- Treasury: public read
CREATE POLICY "treasury_allocations_public_read" ON vico_treasury_allocations FOR SELECT USING (true);
CREATE POLICY "treasury_transactions_public_read" ON vico_treasury_transactions FOR SELECT USING (true);

-- ════════════════ MIGRATION 039: 039_merchant_network.sql ════════════════
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

-- ════════════════ MIGRATION 040: 040_data_locker.sql ════════════════
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

-- ════════════════ MIGRATION 041: 041_onboarding_completed.sql ════════════════
-- 041_onboarding_completed.sql
-- Add onboarding_completed column to profiles so we can track first-run flow

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Backfill: mark existing users as completed so they don't see onboarding again
UPDATE profiles
  SET onboarding_completed = true
  WHERE onboarding_completed IS NULL OR onboarding_completed = false;

-- ════════════════ MIGRATION 042: 042_bank_full_schema.sql ════════════════
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

-- ════════════════ MIGRATION 043: 043_all_missing_tables.sql ════════════════
-- 043_all_missing_tables.sql
-- All remaining tables needed for full functionality
-- Covers: Saves, Office DMs, Tasks, Testimonials, Data Locker prefs, Saved content

-- Saved cards (Workshop + DreamLine saves)
CREATE TABLE IF NOT EXISTS saved_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  card_id TEXT NOT NULL,
  card_type TEXT NOT NULL, -- video|template|goal|post|content
  card_title TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, card_id)
);

-- Testimonials
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  rating SMALLINT DEFAULT 5,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks (Spaces section)
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending', -- pending|in_progress|done
  due_date DATE,
  project_id UUID,
  priority TEXT DEFAULT 'normal', -- low|normal|high
  source TEXT DEFAULT 'manual', -- manual|spaces|office|workshop
  source_id UUID,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects (Spaces / Office)
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  collaborator_ids JSONB DEFAULT '[]',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data sharing preferences (Data Locker)
CREATE TABLE IF NOT EXISTS data_sharing_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  share_gps_goals BOOLEAN DEFAULT FALSE,
  share_content_engagement BOOLEAN DEFAULT FALSE,
  share_location BOOLEAN DEFAULT FALSE,
  share_wellness BOOLEAN DEFAULT FALSE,
  share_financial_behavior BOOLEAN DEFAULT FALSE,
  share_commerce_behavior BOOLEAN DEFAULT FALSE,
  share_social_graph BOOLEAN DEFAULT FALSE,
  share_goal_content_interests BOOLEAN DEFAULT FALSE,
  share_entertainment BOOLEAN DEFAULT FALSE,
  share_behavioral_patterns BOOLEAN DEFAULT FALSE,
  share_vlg_patterns BOOLEAN DEFAULT FALSE,
  share_communication_patterns BOOLEAN DEFAULT FALSE,
  payout_preference TEXT DEFAULT 'usd',
  data_minimization_mode BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data access audit log
CREATE TABLE IF NOT EXISTS data_access_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  accessor_type TEXT NOT NULL, -- village_internal|approved_buyer|spirit_ai|analytics
  accessor_name TEXT NOT NULL,
  data_category TEXT NOT NULL,
  access_purpose TEXT,
  legal_basis TEXT DEFAULT 'platform_operation',
  accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data earnings
CREATE TABLE IF NOT EXISTS data_earnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount_usd NUMERIC(10,4) NOT NULL,
  categories_contributed TEXT[] DEFAULT '{}',
  payout_status TEXT DEFAULT 'pending',
  payout_date DATE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Favorites / Bookmarks (unified)
CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL, -- post|video|template|store|deal|event
  item_id TEXT NOT NULL,
  item_title TEXT,
  item_thumbnail TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_type, item_id)
);

-- Post comments (unified)
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES dream_line_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  oowop_count INT DEFAULT 0,
  parent_id UUID REFERENCES post_comments(id),
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Story views tracking
ALTER TABLE stories ADD COLUMN IF NOT EXISTS view_count INT DEFAULT 0;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS viewers JSONB DEFAULT '[]';

-- Profile enhancements
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_live BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS testimonial_count INT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deal_count INT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS success_count INT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_count INT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS link_in_bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pronouns TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS highlights JSONB DEFAULT '[]';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pinned_post_ids TEXT[] DEFAULT '{}';

-- Office messages enhancement
ALTER TABLE office_messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
ALTER TABLE office_threads ADD COLUMN IF NOT EXISTS last_message_preview TEXT;
ALTER TABLE office_threads ADD COLUMN IF NOT EXISTS unread_count INT DEFAULT 0;

-- RLS
ALTER TABLE saved_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sharing_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_access_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "saved_cards_own" ON saved_cards;
CREATE POLICY "saved_cards_own" ON saved_cards FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS "testimonials_view" ON testimonials;
CREATE POLICY "testimonials_view" ON testimonials FOR SELECT USING (is_public = TRUE OR recipient_user_id = auth.uid() OR author_user_id = auth.uid());
DROP POLICY IF EXISTS "testimonials_write" ON testimonials;
CREATE POLICY "testimonials_write" ON testimonials FOR INSERT WITH CHECK (author_user_id = auth.uid());
DROP POLICY IF EXISTS "tasks_own" ON tasks;
CREATE POLICY "tasks_own" ON tasks FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS "projects_own" ON projects;
CREATE POLICY "projects_own" ON projects FOR ALL USING (creator_id = auth.uid());
DROP POLICY IF EXISTS "data_prefs_own" ON data_sharing_preferences;
CREATE POLICY "data_prefs_own" ON data_sharing_preferences FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS "data_audit_own" ON data_access_audit;
CREATE POLICY "data_audit_own" ON data_access_audit FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "data_earnings_own" ON data_earnings;
CREATE POLICY "data_earnings_own" ON data_earnings FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "favorites_own" ON user_favorites;
CREATE POLICY "favorites_own" ON user_favorites FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS "post_comments_view" ON post_comments;
CREATE POLICY "post_comments_view" ON post_comments FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "post_comments_write" ON post_comments;
CREATE POLICY "post_comments_write" ON post_comments FOR INSERT WITH CHECK (user_id = auth.uid());

SELECT '043_all_missing_tables applied' AS result;
