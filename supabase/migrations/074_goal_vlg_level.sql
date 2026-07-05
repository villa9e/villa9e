-- Goal VLG Level — calculated at goal save, drives per-action VLG rewards
-- Level 1-5 based on duration; multiplied by difficulty (inverse of probability)
-- so harder, longer goals pay more VLG per action verified.

ALTER TABLE goals
  ADD COLUMN IF NOT EXISTS goal_level           INT NOT NULL DEFAULT 1
    CHECK (goal_level BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS vlg_per_action       INT NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS vlg_total_potential  INT NOT NULL DEFAULT 0;
