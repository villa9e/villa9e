import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { GOVERNANCE_RULES } from '@/lib/vico/constants';

export const dynamic = 'force-dynamic';

// GET /api/vico/elders — Village Elder leaderboard
export async function GET() {
  const admin = createAdminClient() as any;

  const [{ data: config }, { data: elders }, { data: proposals }, { data: votes }] = await Promise.all([
    admin.from('vico_supply_config').select('voting_power_cap').eq('id', 1).maybeSingle(),
    admin.from('village_wallets')
      .select('user_id, vico_staked, profiles(username, display_name, avatar_url)')
      .gte('vico_staked', GOVERNANCE_RULES.ELDER_STAKE)
      .order('vico_staked', { ascending: false })
      .limit(50),
    admin.from('vico_governance_proposals').select('proposer_user_id, voting_ends_at'),
    admin.from('vico_votes').select('user_id'),
  ]);

  const votingCap = Number(config?.voting_power_cap ?? 100000);
  const now = Date.now();
  const concludedProposals = (proposals ?? []).filter((p: any) =>
    new Date(p.voting_ends_at).getTime() < now).length;

  const proposalCounts = new Map<string, number>();
  for (const p of proposals ?? []) {
    if (!p.proposer_user_id) continue;
    proposalCounts.set(p.proposer_user_id, (proposalCounts.get(p.proposer_user_id) ?? 0) + 1);
  }

  const voteCounts = new Map<string, number>();
  for (const v of votes ?? []) {
    voteCounts.set(v.user_id, (voteCounts.get(v.user_id) ?? 0) + 1);
  }

  const leaderboard = (elders ?? []).map((e: any) => {
    const staked = Number(e.vico_staked);
    const username = e.profiles?.display_name || e.profiles?.username || 'Village Member';
    const initials = username.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
    const votesCast = voteCounts.get(e.user_id) ?? 0;

    return {
      id: e.user_id,
      username,
      initials,
      staked,
      cap_applied: staked > votingCap,
      proposals: proposalCounts.get(e.user_id) ?? 0,
      participation: concludedProposals > 0
        ? Math.round((votesCast / concludedProposals) * 1000) / 10
        : 100,
    };
  });

  return NextResponse.json({ elders: leaderboard, voting_power_cap: votingCap });
}
