-- 041_onboarding_completed.sql
-- Add onboarding_completed column to profiles so we can track first-run flow

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Backfill: mark existing users as completed so they don't see onboarding again
UPDATE profiles
  SET onboarding_completed = true
  WHERE onboarding_completed IS NULL OR onboarding_completed = false;
