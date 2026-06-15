import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { GOVERNANCE_RULES, displayStatus } from '@/lib/vico/constants';

export const dynamic = 'force-dynamic';

// GET /api/vico/proposals/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient();
  const admin = createAdminClient() as any;
  const { id } = params;

  if (!id) return NextResponse.json({ error: 'Missing proposal id' }, { status: 400 });

  const { data: proposal, error } = await admin
    .from('vico_governance_proposals')
    .select('*, profiles(username, display_name, avatar_url)')
    .eq('id', id)
    .maybeSingle();

  if (error || !proposal) {
    return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
  }

  const { data: comments } = await admin
    .from('vico_governance_comments')
    .select('*, profiles(username, display_name, avatar_url)')
    .eq('proposal_id', id)
    .order('oowop_count', { ascending: false })
    .limit(50);

  const { data: { user } } = await (supabase as any).auth.getUser();

  let userVote: string | null = null;
  let userStaked = 0;
  let oowopedCommentIds: string[] = [];

  if (user) {
    const [{ data: vote }, { data: wallet }] = await Promise.all([
      admin.from('vico_votes').select('vote').eq('proposal_id', id).eq('user_id', user.id).maybeSingle(),
      admin.from('village_wallets').select('vico_staked').eq('user_id', user.id).maybeSingle(),
    ]);

    userVote = vote?.vote ?? null;
    userStaked = Number(wallet?.vico_staked ?? 0);

    if ((comments ?? []).length > 0) {
      const { data: oowops } = await admin
        .from('vico_governance_comment_oowops')
        .select('comment_id')
        .eq('user_id', user.id)
        .in('comment_id', (comments ?? []).map((c: any) => c.id));
      oowopedCommentIds = (oowops ?? []).map((o: any) => o.comment_id);
    }
  }

  return NextResponse.json({
    ...proposal,
    display_status: displayStatus(proposal),
    comments: comments ?? [],
    user_vote: userVote,
    user_staked: userStaked,
    can_vote: userStaked >= GOVERNANCE_RULES.MIN_STAKE_TO_VOTE,
    can_comment: userStaked >= GOVERNANCE_RULES.ELDER_STAKE,
    oowoped_comment_ids: oowopedCommentIds,
  });
}

// POST /api/vico/proposals/[id] — cast a vote, auth required
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient();
  const admin = createAdminClient() as any;

  const { data: { user } } = await (supabase as any).auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = params;
  if (!id) return NextResponse.json({ error: 'Missing proposal id' }, { status: 400 });

  const { vote } = await req.json();
  if (!['for', 'against', 'abstain'].includes(vote)) {
    return NextResponse.json({ error: "vote must be 'for', 'against', or 'abstain'" }, { status: 400 });
  }

  const { data: proposal } = await admin
    .from('vico_governance_proposals')
    .select('id, status, voting_starts_at, voting_ends_at, votes_for, votes_against')
    .eq('id', id)
    .maybeSingle();

  if (!proposal) return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
  if (displayStatus(proposal) !== 'active') {
    return NextResponse.json({ error: 'This proposal is not open for voting' }, { status: 403 });
  }

  const { data: wallet } = await admin
    .from('village_wallets')
    .select('vico_staked')
    .eq('user_id', user.id)
    .maybeSingle();

  const staked = Number(wallet?.vico_staked ?? 0);
  if (staked < GOVERNANCE_RULES.MIN_STAKE_TO_VOTE) {
    return NextResponse.json({
      error: `You need at least ${GOVERNANCE_RULES.MIN_STAKE_TO_VOTE.toLocaleString()} $VICO staked to vote`,
    }, { status: 403 });
  }

  const { data: existingVote } = await admin
    .from('vico_votes')
    .select('id')
    .eq('proposal_id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingVote) {
    return NextResponse.json({ error: 'You have already voted on this proposal' }, { status: 409 });
  }

  const { error: voteError } = await admin
    .from('vico_votes')
    .insert({
      proposal_id: id,
      user_id: user.id,
      vote,
      voting_power: staked,
    });

  if (voteError) return NextResponse.json({ error: voteError.message }, { status: 500 });

  const { data: updated } = await admin
    .from('vico_governance_proposals')
    .select('votes_for, votes_against, votes_abstain')
    .eq('id', id)
    .maybeSingle();

  return NextResponse.json({ success: true, vote, tally: updated });
}
