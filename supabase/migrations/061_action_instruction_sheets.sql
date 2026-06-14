-- ============================================================
-- Migration 061: Wayfinder instruction sheet cache
-- ============================================================
-- Caches a Claude-generated, step-by-step "do exactly this" guide for a
-- given sprint action / goal step (spec WORKSHOP_SPEC §7.1 — "word for
-- word, what to wear, how to fill out documents"). One row per action;
-- generated once on first request from the GPS Wayfinder panel.

CREATE TABLE IF NOT EXISTS action_instruction_sheets (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id   uuid NOT NULL UNIQUE,
  content     text NOT NULL,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE action_instruction_sheets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone can read instruction sheets" ON action_instruction_sheets;
CREATE POLICY "anyone can read instruction sheets" ON action_instruction_sheets
  FOR SELECT USING (true);
-- Inserts come from the server (service role) via /api/workshop/action-instructions.

NOTIFY pgrst, 'reload schema';
