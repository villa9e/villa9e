-- Action proof verification: when a user submits photo/video proof of a GPS
-- action and Spirit (Claude vision) can't confidently verify it right away,
-- the action stays incomplete and a verification request is posted to the
-- user's DreamLine. Once >=3 villagers confirm, the action completes and
-- $VLG is awarded; if >=3 reject, the request is closed so the user can
-- resubmit proof.

CREATE TABLE IF NOT EXISTS action_verifications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id         UUID NOT NULL REFERENCES sprint_actions(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  proof_url         TEXT NOT NULL,
  proof_type        TEXT NOT NULL CHECK (proof_type IN ('image', 'video')),
  ai_confidence     INT,
  ai_message        TEXT,
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  votes_required    INT NOT NULL DEFAULT 3,
  votes_confirm     INT NOT NULL DEFAULT 0,
  votes_reject      INT NOT NULL DEFAULT 0,
  dreamline_post_id UUID REFERENCES dream_line_posts(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  resolved_at       TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS action_verification_votes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id UUID NOT NULL REFERENCES action_verifications(id) ON DELETE CASCADE,
  voter_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vote            TEXT NOT NULL CHECK (vote IN ('confirm', 'reject')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (verification_id, voter_id)
);

CREATE INDEX IF NOT EXISTS idx_action_verifications_action ON action_verifications(action_id);
CREATE INDEX IF NOT EXISTS idx_action_verifications_post   ON action_verifications(dreamline_post_id);
CREATE INDEX IF NOT EXISTS idx_action_verification_votes_v ON action_verification_votes(verification_id);

ALTER TABLE action_verifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_verification_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "verifications visible to all" ON action_verifications;
CREATE POLICY "verifications visible to all" ON action_verifications FOR SELECT USING (true);

DROP POLICY IF EXISTS "votes visible to all" ON action_verification_votes;
CREATE POLICY "votes visible to all" ON action_verification_votes FOR SELECT USING (true);

DROP POLICY IF EXISTS "users cast their own vote" ON action_verification_votes;
CREATE POLICY "users cast their own vote" ON action_verification_votes
  FOR INSERT WITH CHECK (auth.uid() = voter_id);

-- Storage bucket for action proof photos/videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('action-proofs', 'action-proofs', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "action proofs public read" ON storage.objects;
CREATE POLICY "action proofs public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'action-proofs');

DROP POLICY IF EXISTS "action proofs authenticated upload" ON storage.objects;
CREATE POLICY "action proofs authenticated upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'action-proofs' AND auth.role() = 'authenticated');
