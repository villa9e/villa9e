-- $VLG ledger: wallet_transactions already exists (id, wallet_id, user_id,
-- transaction_type, token_type, amount, direction, balance_after,
-- reference_id uuid, reference_type, description, created_at) but nothing
-- ever wrote to it — /api/vlg/earn was inserting into tables/columns that
-- don't exist, so it silently no-op'd and the VLG Wallet transaction
-- history + total_earned_vlg were always empty.
--
-- source_id values passed to /api/vlg/earn aren't always UUIDs (e.g. studio
-- card ids like "cur-<id>"), so reference_id (uuid) can't be the dedup key.
-- Add a generic text key for that.
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS source_key TEXT;

-- NULLs are distinct under UNIQUE, so this only blocks repeat earns that
-- carry a real source_key (e.g. the same OoWop, sprint, or goal can only
-- pay out once per user) while leaving keyless earns unaffected.
ALTER TABLE wallet_transactions
  ADD CONSTRAINT wallet_tx_dedup UNIQUE (user_id, transaction_type, source_key);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_user_created ON wallet_transactions(user_id, created_at DESC);
