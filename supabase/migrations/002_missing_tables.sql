-- ============================================================
-- VILLA9E MIGRATION 002 — Missing tables from Phase 1 build
-- Run this in Supabase SQL editor after schema.sql
-- ============================================================

-- Add source_template_id to goals (nullable FK back-compat)
ALTER TABLE goals ADD COLUMN IF NOT EXISTS source_template_id UUID REFERENCES goal_templates(id);

-- Crowdfunding contributions
CREATE TABLE IF NOT EXISTS crowdfunding_contributions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id     UUID NOT NULL REFERENCES crowdfunding_campaigns(id) ON DELETE CASCADE,
  backer_id       UUID NOT NULL REFERENCES profiles(id),
  amount          NUMERIC(10,2) NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'USD',
  perk_tier       TEXT,
  stripe_charge_id TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Advertising placements (for Legaci to sell)
CREATE TABLE IF NOT EXISTS ad_placements (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  advertiser_id    UUID REFERENCES profiles(id),
  title            TEXT NOT NULL,
  body             TEXT NOT NULL,
  cta              TEXT NOT NULL,
  url              TEXT NOT NULL,
  icon             TEXT DEFAULT '📢',
  target_categories TEXT[] NOT NULL DEFAULT '{All}',
  bid_amount       NUMERIC(10,4) NOT NULL DEFAULT 0.01,
  budget           NUMERIC(10,2),
  spent            NUMERIC(10,2) DEFAULT 0,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  starts_at        TIMESTAMPTZ,
  ends_at          TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ad impressions log (for billing + analytics)
CREATE TABLE IF NOT EXISTS ad_impressions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ad_id          UUID NOT NULL REFERENCES ad_placements(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES profiles(id),
  goal_category  TEXT,
  step_title     TEXT,
  step_index     INT,
  clicked        BOOLEAN DEFAULT FALSE,
  clicked_at     TIMESTAMPTZ,
  shown_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Goal DNA: add steps_preview JSON column if missing
ALTER TABLE goal_templates ADD COLUMN IF NOT EXISTS steps_preview JSONB DEFAULT '[]';
ALTER TABLE goal_templates ADD COLUMN IF NOT EXISTS use_count INT NOT NULL DEFAULT 0;
ALTER TABLE goal_templates ADD COLUMN IF NOT EXISTS rating NUMERIC(3,1) DEFAULT 4.5;
ALTER TABLE goal_templates ADD COLUMN IF NOT EXISTS estimated_weeks INT;
ALTER TABLE goal_templates ADD COLUMN IF NOT EXISTS steps_count INT;
ALTER TABLE goal_templates ADD COLUMN IF NOT EXISTS probability_score INT DEFAULT 70;

-- RLS policies
ALTER TABLE crowdfunding_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_impressions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Backers see own contributions" ON crowdfunding_contributions FOR SELECT USING (backer_id = auth.uid());
CREATE POLICY "Anyone can contribute" ON crowdfunding_contributions FOR INSERT WITH CHECK (backer_id = auth.uid());
CREATE POLICY "Anyone can see active ads" ON ad_placements FOR SELECT USING (is_active = true);
CREATE POLICY "Users see own impressions" ON ad_impressions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "System logs impressions" ON ad_impressions FOR INSERT WITH CHECK (user_id = auth.uid());
