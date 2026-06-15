-- Wires the existing 038 VICO governance schema (vico_governance_proposals,
-- vico_votes, vico_governance_comments, vico_treasury_transactions) to real
-- data: wallet balances/staking, live supply config, vote-tally sync, and an
-- auto-mint from $VLG activity. Replaces lib/vico/mockData.ts entirely.

-- ─── Wallet columns (staking → tier → voting power) ──────────────────
ALTER TABLE village_wallets ADD COLUMN IF NOT EXISTS vico_balance NUMERIC NOT NULL DEFAULT 500;
ALTER TABLE village_wallets ADD COLUMN IF NOT EXISTS vico_staked  NUMERIC NOT NULL DEFAULT 0;

-- ─── Supply / treasury config (singleton) ────────────────────────────
CREATE TABLE IF NOT EXISTS vico_supply_config (
  id                SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  total_supply      NUMERIC NOT NULL DEFAULT 33000000,
  burned            NUMERIC NOT NULL DEFAULT 0,
  community_pool    NUMERIC NOT NULL DEFAULT 6700000,
  price_usd         NUMERIC NOT NULL DEFAULT 0.08,
  voting_power_cap  NUMERIC NOT NULL DEFAULT 100000,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO vico_supply_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE vico_supply_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public read vico supply config" ON vico_supply_config;
CREATE POLICY "public read vico supply config" ON vico_supply_config FOR SELECT USING (true);

-- ─── Burns shrink total supply; grants drain the community pool ──────
CREATE OR REPLACE FUNCTION apply_vico_treasury_effect() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.transaction_type = 'burn' THEN
    UPDATE vico_supply_config SET burned = burned + NEW.amount, updated_at = now() WHERE id = 1;
  ELSIF NEW.transaction_type = 'grant' AND NEW.direction = 'out' THEN
    UPDATE vico_supply_config SET community_pool = GREATEST(community_pool - NEW.amount, 0), updated_at = now() WHERE id = 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_vico_treasury_effect ON vico_treasury_transactions;
CREATE TRIGGER trg_vico_treasury_effect
  AFTER INSERT ON vico_treasury_transactions
  FOR EACH ROW EXECUTE FUNCTION apply_vico_treasury_effect();

-- ─── Keep proposal vote tallies + eligible-voter count live ──────────
CREATE OR REPLACE FUNCTION sync_vico_proposal_votes() RETURNS TRIGGER AS $$
DECLARE
  v_for INT; v_against INT; v_abstain INT; v_eligible INT;
BEGIN
  SELECT count(*) FILTER (WHERE vote = 'for'),
         count(*) FILTER (WHERE vote = 'against'),
         count(*) FILTER (WHERE vote = 'abstain')
    INTO v_for, v_against, v_abstain
    FROM vico_votes WHERE proposal_id = NEW.proposal_id;

  SELECT count(*) INTO v_eligible FROM village_wallets WHERE vico_balance + vico_staked > 0;

  UPDATE vico_governance_proposals
    SET votes_for = v_for, votes_against = v_against, votes_abstain = v_abstain,
        total_eligible_voters = GREATEST(v_eligible, 1), updated_at = now()
    WHERE id = NEW.proposal_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_vico_votes ON vico_votes;
CREATE TRIGGER trg_sync_vico_votes
  AFTER INSERT OR UPDATE ON vico_votes
  FOR EACH ROW EXECUTE FUNCTION sync_vico_proposal_votes();

-- ─── Stake / unstake $VICO (atomic, drives tier + voting power) ──────
CREATE OR REPLACE FUNCTION vico_stake(p_amount NUMERIC, p_action TEXT) RETURNS void AS $$
DECLARE v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'invalid amount'; END IF;

  IF p_action = 'stake' THEN
    UPDATE village_wallets SET vico_balance = vico_balance - p_amount, vico_staked = vico_staked + p_amount
      WHERE user_id = v_uid AND vico_balance >= p_amount;
  ELSIF p_action = 'unstake' THEN
    UPDATE village_wallets SET vico_balance = vico_balance + p_amount, vico_staked = vico_staked - p_amount
      WHERE user_id = v_uid AND vico_staked >= p_amount;
  ELSE
    RAISE EXCEPTION 'invalid action';
  END IF;

  IF NOT FOUND THEN RAISE EXCEPTION 'insufficient balance'; END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION vico_stake(NUMERIC, TEXT) TO authenticated;

-- ─── Auto-mint $VICO from $VLG activity (5% of every earn) ───────────
CREATE OR REPLACE FUNCTION mint_vico_on_vlg_earn() RETURNS TRIGGER AS $$
DECLARE v_amount NUMERIC;
BEGIN
  v_amount := GREATEST(ROUND(NEW.amount * 0.05), 1);

  UPDATE village_wallets SET vico_balance = vico_balance + v_amount WHERE user_id = NEW.user_id;

  INSERT INTO wallet_transactions
    (wallet_id, user_id, transaction_type, token_type, amount, direction, reference_id, reference_type, description, source_key)
  VALUES
    (NEW.wallet_id, NEW.user_id, 'vico_mint', 'VICO', v_amount, 'credit', NEW.id, 'wallet_transaction',
     'Governance reward from $VLG activity', 'vico_mint:' || NEW.id::text)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_mint_vico_on_vlg_earn ON wallet_transactions;
CREATE TRIGGER trg_mint_vico_on_vlg_earn
  AFTER INSERT ON wallet_transactions
  FOR EACH ROW
  WHEN (NEW.token_type = 'VLG' AND NEW.direction = 'credit' AND NEW.amount > 0)
  EXECUTE FUNCTION mint_vico_on_vlg_earn();

-- ─── Genesis seed (real rows; only inserted once) ────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vico_treasury_transactions) THEN
    INSERT INTO vico_treasury_transactions (transaction_type, description, amount, direction, created_at) VALUES
      ('liquidity',      'Initial liquidity provision',          2148320, 'in',  now() - interval '60 days'),
      ('revenue',        'Ad revenue inflow — genesis epoch',     12400,  'in',  now() - interval '14 days'),
      ('staking-reward', 'Staking rewards paid — genesis epoch',  45000,  'out', now() - interval '7 days');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM vico_governance_proposals) THEN
    INSERT INTO vico_governance_proposals
      (vip_number, title, category, description, execution_plan, status, discussion_starts_at, voting_starts_at, voting_ends_at)
    VALUES
      (1, 'Allocate 50,000 $VICO from treasury for ecosystem grants', 'treasury',
       'Allocate 50,000 $VICO from the Community Grants allocation to fund the first round of Village Ecosystem Grants. Grants support builders creating tools, content, and infrastructure that benefits Village members.',
       'Transfer from the community pool to a grants ledger entry. Grant committee (elected Elders) reviews applications over a 30-day window. Disbursements tracked in the Treasury ledger.',
       'executed', now() - interval '50 days', now() - interval '47 days', now() - interval '40 days'),
      (2, 'Add Real Estate Investing as GPS goal category', 'goal-category',
       'Add "Real Estate Investing" as an official GPS goal category so the GPS engine can surface relevant content, mentors, and milestone templates for this path.',
       'Add "real-estate-investing" to the goal categories used by the GPS engine and ship a starter template set. Rollout within 72 hours of vote confirmation.',
       'passed', now() - interval '21 days', now() - interval '18 days', now() - interval '11 days'),
      (3, 'Increase OoWop earning rate from 5 to 8 $VLG', 'earnings',
       'Increase the $VLG earning rate per OoWop from 5 to 8 tokens. As Village activity grows, the current rate undervalues community curation — increasing it rewards active members and strengthens the link between engagement and governance participation.',
       'If passed: update the OoWop earn rate from 5 to 8 $VLG, effective at the start of the next weekly epoch (Monday 00:00 UTC). No external dependencies — rate is read from config by the reward engine.',
       'discussion', now() - interval '1 days', now() + interval '2 days', now() + interval '9 days');
  END IF;
END $$;
