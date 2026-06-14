-- ============================================================
-- Migration 063: Foundation — values/purpose editor + morning
-- intention (WELLNESS layer 7: "Spiritual and intentional living")
-- Safe to re-run (all ADD COLUMN IF NOT EXISTS)
-- ============================================================

-- Values & purpose are persistent, user-edited statements (not daily).
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS values_statement TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS purpose_statement TEXT;

-- Morning intention is a daily entry, same lifecycle as gratitude.
ALTER TABLE wellness_logs ADD COLUMN IF NOT EXISTS morning_intention TEXT;
