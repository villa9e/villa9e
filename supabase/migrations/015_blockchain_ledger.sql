-- Village Blockchain Ledger — mirrors on-chain events in Supabase
-- until full blockchain deployment. Each row gets a SHA-256 hash
-- chained to the previous row, creating a tamper-evident local ledger.

CREATE TABLE IF NOT EXISTS blockchain_ledger (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_index     BIGSERIAL,          -- monotonic sequence
  block_hash      TEXT NOT NULL,      -- SHA-256(prev_hash + content)
  prev_hash       TEXT NOT NULL DEFAULT '0000000000000000000000000000000000000000000000000000000000000000',
  event_type      TEXT NOT NULL,      -- OOWOP | GOAL_COMPLETE | DEAL | DATA_CONSENT | CHECKIN | EARN | TRANSFER
  actor_user_id   UUID,               -- primary actor (Supabase user ID)
  counterparty_id UUID,               -- secondary party if applicable
  actor_wallet    TEXT,               -- ETH/Polygon wallet address (if linked)
  amount_vlg      NUMERIC DEFAULT 0,
  reference_id    UUID,               -- goal_id, deal_id, step_id etc.
  metadata        JSONB DEFAULT '{}', -- extra event-specific data
  on_chain_tx     TEXT,               -- real blockchain tx hash when deployed
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast explorer queries
CREATE INDEX IF NOT EXISTS bl_event_type  ON blockchain_ledger (event_type);
CREATE INDEX IF NOT EXISTS bl_actor       ON blockchain_ledger (actor_user_id);
CREATE INDEX IF NOT EXISTS bl_created     ON blockchain_ledger (created_at DESC);
CREATE INDEX IF NOT EXISTS bl_entry_index ON blockchain_ledger (entry_index);

-- Public ledger — anyone can audit
ALTER TABLE blockchain_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read ledger" ON blockchain_ledger FOR SELECT USING (true);
CREATE POLICY "service write ledger" ON blockchain_ledger FOR INSERT USING (true);

-- User wallet addresses (ETH/Polygon)
CREATE TABLE IF NOT EXISTS user_wallets (
  user_id       UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address TEXT UNIQUE,
  wallet_type    TEXT DEFAULT 'polygon',  -- polygon | ethereum
  linked_at      TIMESTAMPTZ DEFAULT NOW(),
  verified       BOOLEAN DEFAULT FALSE
);

ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own wallet" ON user_wallets USING (auth.uid() = user_id);

-- Helper: record a ledger entry with auto-chaining
CREATE OR REPLACE FUNCTION record_ledger_entry(
  p_event_type      TEXT,
  p_actor_user_id   UUID,
  p_counterparty_id UUID DEFAULT NULL,
  p_amount_vlg      NUMERIC DEFAULT 0,
  p_reference_id    UUID DEFAULT NULL,
  p_metadata        JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_prev_hash TEXT;
  v_content   TEXT;
  v_hash      TEXT;
  v_id        UUID;
BEGIN
  -- Get previous block hash
  SELECT COALESCE(block_hash, '0000000000000000000000000000000000000000000000000000000000000000')
    INTO v_prev_hash
    FROM blockchain_ledger
    ORDER BY entry_index DESC
    LIMIT 1;

  IF v_prev_hash IS NULL THEN
    v_prev_hash := '0000000000000000000000000000000000000000000000000000000000000000';
  END IF;

  -- Build content string to hash
  v_content := v_prev_hash || p_event_type || COALESCE(p_actor_user_id::TEXT,'') ||
               COALESCE(p_amount_vlg::TEXT,'0') || NOW()::TEXT;

  -- SHA-256 hash
  v_hash := encode(digest(v_content, 'sha256'), 'hex');

  INSERT INTO blockchain_ledger
    (block_hash, prev_hash, event_type, actor_user_id, counterparty_id, amount_vlg, reference_id, metadata)
  VALUES
    (v_hash, v_prev_hash, p_event_type, p_actor_user_id, p_counterparty_id, p_amount_vlg, p_reference_id, p_metadata)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable pgcrypto for hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;
