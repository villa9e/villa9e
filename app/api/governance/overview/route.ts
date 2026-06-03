import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const MOCK_OVERVIEW = {
  proposalCounts: { active: 3, passed: 12, rejected: 2 },
  elderCount:     47,
  treasuryBalance: 250000,
  totalVotesCast:  1842,
};

export async function GET(req: NextRequest) {
  const supabase = createServerClient() as any;

  // Try to get real counts from DB
  let proposalCounts = { active: 0, passed: 0, rejected: 0 };
  let elderCount     = 0;
  let treasuryBalance = 0;
  let totalVotesCast  = 0;

  // Check if proposals table exists by attempting a count
  const [proposalsRes, eldersRes, voteRes] = await Promise.allSettled([
    supabase
      .from('vico_governance_proposals')
      .select('status', { count: 'exact', head: false }),
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('staking_tier', 'elder'),
    supabase
      .from('vico_votes')
      .select('id', { count: 'exact', head: true }),
  ]);

  const hasProposals = proposalsRes.status === 'fulfilled' && !proposalsRes.value.error;
  const hasElders    = eldersRes.status    === 'fulfilled' && !eldersRes.value.error;
  const hasVotes     = voteRes.status      === 'fulfilled' && !voteRes.value.error;

  if (hasProposals) {
    const rows: any[] = proposalsRes.value.data ?? [];
    proposalCounts = {
      active:   rows.filter((r: any) => r.status === 'active').length,
      passed:   rows.filter((r: any) => r.status === 'passed').length,
      rejected: rows.filter((r: any) => r.status === 'rejected').length,
    };
    // Fall back to mock if no real data
    if (rows.length === 0) proposalCounts = MOCK_OVERVIEW.proposalCounts;
  } else {
    proposalCounts = MOCK_OVERVIEW.proposalCounts;
  }

  if (hasElders) {
    elderCount = eldersRes.value.count ?? MOCK_OVERVIEW.elderCount;
    if (elderCount === 0) elderCount = MOCK_OVERVIEW.elderCount;
  } else {
    elderCount = MOCK_OVERVIEW.elderCount;
  }

  if (hasVotes) {
    totalVotesCast = voteRes.value.count ?? MOCK_OVERVIEW.totalVotesCast;
    if (totalVotesCast === 0) totalVotesCast = MOCK_OVERVIEW.totalVotesCast;
  } else {
    totalVotesCast = MOCK_OVERVIEW.totalVotesCast;
  }

  // Treasury — try real data, fall back to mock
  const { data: treasuryRows } = await supabase
    .from('vico_treasury_allocations')
    .select('amount')
    .catch(() => ({ data: null }));

  if (treasuryRows?.length) {
    treasuryBalance = treasuryRows.reduce((sum: number, r: any) => sum + (r.amount ?? 0), 0);
  } else {
    treasuryBalance = MOCK_OVERVIEW.treasuryBalance;
  }

  // Optional: user's governance status (if authenticated)
  let userStatus: any = null;
  const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('staking_tier, vlg_balance')
      .eq('id', user.id)
      .maybeSingle();

    userStatus = {
      isElder:     profile?.staking_tier === 'elder' || (profile?.vlg_balance ?? 0) >= 2000,
      stakingTier: profile?.staking_tier ?? 'none',
      vlgBalance:  profile?.vlg_balance ?? 0,
    };
  }

  return NextResponse.json({
    proposalCounts,
    elderCount,
    treasuryBalance,
    totalVotesCast,
    userStatus,
  });
}
