-- ============================================================
-- Migration 057: Investor Deals, eStore/Market, Office — replaces 036
-- ============================================================
-- 036_village_platform.sql was never applied. Its `deals` table name
-- collided with the pre-existing Trading Post trade-deals table
-- (requester_id/provider_id/pay_amount — used by hut & discover pages
-- for peer-to-peer skill/service trades). The investor-pitch concept
-- from 036 (name/hook/raise_amount/elevator_pitch — used by
-- trading-post/deals/*, discover, tribe) is renamed to
-- `investor_deals` here to avoid the collision. estores/office_* are
-- brand new (no collision). Safe to re-run.

-- ── Investor Deals (renamed from 036's `deals`) ────────────────────────────────
CREATE TABLE IF NOT EXISTS investor_deals (
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
  deal_id     UUID NOT NULL REFERENCES investor_deals(id) ON DELETE CASCADE,
  investor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  direction   TEXT NOT NULL, -- 'match' | 'pass'
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(deal_id, investor_id)
);

CREATE TABLE IF NOT EXISTS deal_feedback (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id         UUID NOT NULL REFERENCES investor_deals(id) ON DELETE CASCADE,
  hashed_user_id  TEXT NOT NULL,
  rating          SMALLINT CHECK (rating BETWEEN 1 AND 5),
  reason          TEXT,
  comment         TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS deal_matches (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id     UUID NOT NULL REFERENCES investor_deals(id) ON DELETE CASCADE,
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
  last_message_preview TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS office_messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id   UUID NOT NULL REFERENCES office_threads(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  file_url    TEXT,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ── Connections upgrade (add role + context) ──────────────────────────────────
ALTER TABLE connections ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE connections ADD COLUMN IF NOT EXISTS context_type TEXT;
ALTER TABLE connections ADD COLUMN IF NOT EXISTS context_label TEXT;
ALTER TABLE connections ADD COLUMN IF NOT EXISTS pending BOOLEAN DEFAULT TRUE;

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE investor_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE estores ENABLE ROW LEVEL SECURITY;
ALTER TABLE estore_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE estore_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE office_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE office_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE office_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "investor_deals_public_view" ON investor_deals;
DROP POLICY IF EXISTS "investor_deals_own"         ON investor_deals;
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

CREATE POLICY "investor_deals_public_view" ON investor_deals FOR SELECT USING (status = 'active');
CREATE POLICY "investor_deals_own"         ON investor_deals FOR ALL    USING (user_id = auth.uid());
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
CREATE INDEX IF NOT EXISTS idx_investor_deals_status ON investor_deals(status);
CREATE INDEX IF NOT EXISTS idx_investor_deals_user ON investor_deals(user_id);
CREATE INDEX IF NOT EXISTS idx_estore_products_store ON estore_products(store_id);
CREATE INDEX IF NOT EXISTS idx_estore_products_type ON estore_products(product_type);
CREATE INDEX IF NOT EXISTS idx_office_messages_thread ON office_messages(thread_id, created_at);
