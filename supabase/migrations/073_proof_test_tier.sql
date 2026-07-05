-- 3-tier proof verification: AI direct → Spirit proof test → DreamLine social proof
-- Adds test-tier columns to action_verifications so Spirit can challenge the user
-- with a specific question/task before escalating to social proof.

ALTER TABLE action_verifications
  ADD COLUMN IF NOT EXISTS verification_tier   INT  NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS proof_test_type     TEXT CHECK (proof_test_type IN ('text', 'image', 'video')),
  ADD COLUMN IF NOT EXISTS proof_test_prompt   TEXT,  -- Spirit's challenge question/instruction
  ADD COLUMN IF NOT EXISTS proof_test_response TEXT,  -- User's answer (text or proof URL)
  ADD COLUMN IF NOT EXISTS proof_test_confidence INT,
  ADD COLUMN IF NOT EXISTS proof_test_message  TEXT;

-- Update the status check to include the proof-test waiting state
ALTER TABLE action_verifications
  DROP CONSTRAINT IF EXISTS action_verifications_status_check;
ALTER TABLE action_verifications
  ADD CONSTRAINT action_verifications_status_check
  CHECK (status IN ('pending', 'proof_test_required', 'proof_test_submitted', 'verified', 'rejected'));
