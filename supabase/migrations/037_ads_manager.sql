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
