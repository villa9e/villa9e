import { NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { TIER_BREAKDOWN, tierFor } from '@/lib/vico/constants';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createServerClient();
  const admin = createAdminClient() as any;

  const { data: { user } } = await (supabase as any).auth.getUser();

  const [{ data: config }, { data: treasuryTxns }, { data: proposals }] = await Promise.all([
    admin.from('vico_supply_config').select('*').eq('id', 1).maybeSingle(),
    admin.from('vico_treasury_transactions').select('amount, direction'),
    admin.from('vico_governance_proposals').select('voting_starts_at, voting_ends_at'),
  ]);

  const totalSupply   = Number(config?.total_supply ?? 33000000);
  const burned        = Number(config?.burned ?? 0);
  const communityPool = Number(config?.community_pool ?? 6700000);
  const priceUsd      = Number(config?.price_usd ?? 0.08);
  const votingCap     = Number(config?.voting_power_cap ?? 100000);

  const treasuryBalance = (treasuryTxns ?? []).reduce((sum: number, t: any) =>
    sum + (t.direction === 'in' ? Number(t.amount) : -Number(t.amount)), 0);

  const now = Date.now();
  const activeProposals = (proposals ?? []).filter((p: any) =>
    new Date(p.voting_starts_at).getTime() <= now && now <= new Date(p.voting_ends_at).getTime()).length;
  const concludedProposals = (proposals ?? []).filter((p: any) =>
    new Date(p.voting_ends_at).getTime() < now).length;

  const [{ count: elderCount }, { count: totalVotes }, ...tierCounts] = await Promise.all([
    admin.from('village_wallets').select('user_id', { count: 'exact', head: true }).gte('vico_staked', 10000),
    admin.from('vico_votes').select('id', { count: 'exact', head: true }),
    ...TIER_BREAKDOWN.map(t =>
      admin.from('village_wallets').select('user_id', { count: 'exact', head: true })
        .gte('vico_staked', t.min).lte('vico_staked', t.max)
    ),
  ]);

  const tierBreakdown = TIER_BREAKDOWN.map((t, i) => ({
    label: t.label,
    key: t.key,
    range: t.range,
    color: t.color,
    users: tierCounts[i]?.count ?? 0,
  }));

  const stats = {
    active_proposals: activeProposals,
    village_elders: elderCount ?? 0,
    total_votes_cast: totalVotes ?? 0,
    treasury_vico: treasuryBalance,
    treasury_usd: Math.round(treasuryBalance * priceUsd),
  };

  const supply = {
    total: totalSupply,
    circulating: Math.max(totalSupply - burned - communityPool, 0),
    burned,
    community_pool: communityPool,
    price_usd: priceUsd,
  };

  let governance = null;
  if (user) {
    const { data: wallet } = await admin
      .from('village_wallets')
      .select('vico_balance, vico_staked')
      .eq('user_id', user.id)
      .maybeSingle();

    const staked = Number(wallet?.vico_staked ?? 0);
    const balance = Number(wallet?.vico_balance ?? 0);
    const tier = tierFor(staked);

    const [{ count: submitted }, { count: votesCast }] = await Promise.all([
      admin.from('vico_governance_proposals').select('id', { count: 'exact', head: true }).eq('proposer_user_id', user.id),
      admin.from('vico_votes').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    ]);

    governance = {
      vico_balance: balance,
      staked_vico: staked,
      tier: tier.key,
      tier_label: tier.label,
      voting_power: Math.min(staked, votingCap),
      voting_power_cap: votingCap,
      cap_applied: staked > votingCap,
      proposals_submitted: submitted ?? 0,
      votes_cast: votesCast ?? 0,
      participation_rate: concludedProposals > 0
        ? Math.round(((votesCast ?? 0) / concludedProposals) * 100)
        : 100,
    };
  }

  return NextResponse.json({ stats, supply, governance, tier_breakdown: tierBreakdown });
}
