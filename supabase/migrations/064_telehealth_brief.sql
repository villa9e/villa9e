-- ============================================================
-- Migration 064: Telehealth pre-visit AI brief
-- Safe to re-run (ADD COLUMN IF NOT EXISTS)
-- ============================================================

ALTER TABLE provider_sessions ADD COLUMN IF NOT EXISTS pre_visit_brief TEXT;
ALTER TABLE provider_sessions ADD COLUMN IF NOT EXISTS brief_generated_at TIMESTAMPTZ;
