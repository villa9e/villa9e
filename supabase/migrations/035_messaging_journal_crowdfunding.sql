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

-- ── 7. Realtime enable ───────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
