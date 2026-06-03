-- 038_vico_governance.sql
-- ViCo Governance: proposals, votes, comments, treasury

-- Proposals
CREATE TABLE IF NOT EXISTS vico_governance_proposals (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vip_number            INTEGER NOT NULL UNIQUE,
  proposer_user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title                 TEXT NOT NULL,
  category              TEXT NOT NULL CHECK (category IN ('earnings','treasury','goal-category','feature','policy','other')),
  description           TEXT NOT NULL,
  execution_plan        TEXT NOT NULL,
  supporting_url        TEXT,
  status                TEXT NOT NULL DEFAULT 'discussion' CHECK (status IN ('discussion','active','passed','rejected','executed')),
  discussion_starts_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  voting_starts_at      TIMESTAMPTZ NOT NULL,
  voting_ends_at        TIMESTAMPTZ NOT NULL,
  votes_for             INTEGER NOT NULL DEFAULT 0,
  votes_against         INTEGER NOT NULL DEFAULT 0,
  votes_abstain         INTEGER NOT NULL DEFAULT 0,
  total_eligible_voters INTEGER NOT NULL DEFAULT 0,
  on_chain_proposal_id  TEXT,
  execution_tx_hash     TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Votes
CREATE TABLE IF NOT EXISTS vico_votes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id       UUID NOT NULL REFERENCES vico_governance_proposals(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address    TEXT,
  vote              TEXT NOT NULL CHECK (vote IN ('for','against','abstain')),
  voting_power      BIGINT NOT NULL DEFAULT 0,
  on_chain_tx_hash  TEXT,
  voted_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (proposal_id, user_id)
);

-- Comments
CREATE TABLE IF NOT EXISTS vico_governance_comments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id  UUID NOT NULL REFERENCES vico_governance_proposals(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content      TEXT NOT NULL,
  oowop_count  INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comment OoWops (likes)
CREATE TABLE IF NOT EXISTS vico_governance_comment_oowops (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id  UUID NOT NULL REFERENCES vico_governance_comments(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (comment_id, user_id)
);

-- Treasury allocations (weekly snapshot)
CREATE TABLE IF NOT EXISTS vico_treasury_allocations (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_ending               DATE NOT NULL UNIQUE,
  community_grants_balance  BIGINT NOT NULL DEFAULT 0,
  staking_rewards_balance   BIGINT NOT NULL DEFAULT 0,
  liquidity_balance         BIGINT NOT NULL DEFAULT 0,
  total_balance             BIGINT NOT NULL DEFAULT 0,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Treasury transactions
CREATE TABLE IF NOT EXISTS vico_treasury_transactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type  TEXT NOT NULL,
  description       TEXT NOT NULL,
  amount            BIGINT NOT NULL,
  direction         TEXT NOT NULL CHECK (direction IN ('in','out')),
  vip_number        INTEGER,
  chain_tx_hash     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vico_proposals_status ON vico_governance_proposals(status);
CREATE INDEX IF NOT EXISTS idx_vico_proposals_voting_ends ON vico_governance_proposals(voting_ends_at);
CREATE INDEX IF NOT EXISTS idx_vico_votes_proposal ON vico_votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_vico_votes_user ON vico_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_vico_comments_proposal ON vico_governance_comments(proposal_id);
CREATE INDEX IF NOT EXISTS idx_vico_comments_oowop ON vico_governance_comments(oowop_count DESC);
CREATE INDEX IF NOT EXISTS idx_vico_treasury_txns_date ON vico_treasury_transactions(created_at DESC);

-- RLS
ALTER TABLE vico_governance_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE vico_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vico_governance_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vico_governance_comment_oowops ENABLE ROW LEVEL SECURITY;
ALTER TABLE vico_treasury_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vico_treasury_transactions ENABLE ROW LEVEL SECURITY;

-- Proposals: public read, authenticated create
CREATE POLICY "proposals_public_read" ON vico_governance_proposals FOR SELECT USING (true);
CREATE POLICY "proposals_auth_insert" ON vico_governance_proposals FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Votes: public read, own insert/update
CREATE POLICY "votes_public_read" ON vico_votes FOR SELECT USING (true);
CREATE POLICY "votes_own_insert" ON vico_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Comments: public read, authenticated insert
CREATE POLICY "comments_public_read" ON vico_governance_comments FOR SELECT USING (true);
CREATE POLICY "comments_auth_insert" ON vico_governance_comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Comment OoWops: public read, authenticated insert
CREATE POLICY "comment_oowops_public_read" ON vico_governance_comment_oowops FOR SELECT USING (true);
CREATE POLICY "comment_oowops_auth_insert" ON vico_governance_comment_oowops FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comment_oowops_own_delete" ON vico_governance_comment_oowops FOR DELETE USING (auth.uid() = user_id);

-- Treasury: public read
CREATE POLICY "treasury_allocations_public_read" ON vico_treasury_allocations FOR SELECT USING (true);
CREATE POLICY "treasury_transactions_public_read" ON vico_treasury_transactions FOR SELECT USING (true);
