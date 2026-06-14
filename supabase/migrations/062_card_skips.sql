-- ============================================================
-- Migration 062: Card skip tracking for feed algorithm
-- ============================================================
-- Per-user, per-card skip counts (WORKSHOP_SPEC §5.3 "Skip" signal).
-- 1-2 skips de-prioritize a card (~30% exclusion chance per skip);
-- 3+ skips hide the card from that user's feed entirely.

CREATE TABLE IF NOT EXISTS card_skips (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id     text NOT NULL,
  skip_count  smallint NOT NULL DEFAULT 1,
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (user_id, card_id)
);

ALTER TABLE card_skips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users manage own card skips" ON card_skips;
CREATE POLICY "users manage own card skips" ON card_skips
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
