-- ============================================================
-- MIGRATION 044 — Sustainability lens for goal data model
-- Phase 5.6: every goal built by Spirit carries a regenerative
-- loop field describing what its output feeds back into the world.
-- ============================================================

-- Regenerative loop: what does this goal's output feed into?
-- Stored as JSONB so the shape can evolve without further migrations.
-- Schema: {
--   giveBack: string,          -- what this goal gives back to the system/community
--   wasteOutputs: string[],    -- things produced with no current home (design flaws to fix)
--   cascadeConnections: string[], -- how outputs could feed the user's other goals
--   regenerativeScore: number, -- 0-100
--   badge: 'regenerative' | 'sustainable' | 'standard'
-- }
ALTER TABLE goals ADD COLUMN IF NOT EXISTS regenerative_loop JSONB;

-- Index for fast badge-level queries (dashboard filtering by regenerative badge)
CREATE INDEX IF NOT EXISTS idx_goals_regen_badge
  ON goals ((regenerative_loop->>'badge'))
  WHERE regenerative_loop IS NOT NULL;
