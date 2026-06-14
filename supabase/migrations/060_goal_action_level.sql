-- Persist the user's chosen action level (1=Wayfinder, 2=Pathfinder, 3=Trailblazer)
-- on the goal itself, so the Workshop feed can filter content format
-- (Wayfinder prefers >10min step-by-step videos, Trailblazer prefers <8min quick hits).
ALTER TABLE goals ADD COLUMN IF NOT EXISTS action_level SMALLINT DEFAULT 1 CHECK (action_level IN (1, 2, 3));
