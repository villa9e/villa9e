import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/governance/proposals/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient() as any;
  const { id } = params;

  if (!id) return NextResponse.json({ error: 'Missing proposal id' }, { status: 400 });

  const { data: proposal, error } = await supabase
    .from('vico_governance_proposals')
    .select('*, profiles(username, display_name, avatar_url)')
    .eq('id', id)
    .maybeSingle();

  if (error || !proposal) {
    // Return mock fallback for known mock IDs
    if (id.startsWith('mock-')) {
      return NextResponse.json({ error: 'Mock proposals do not have detail pages yet' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
  }

  // Fetch comments sorted by oowop_count desc
  const { data: comments } = await supabase
    .from('vico_governance_comments')
    .select('*, profiles(username, display_name, avatar_url)')
    .eq('proposal_id', id)
    .order('oowop_count', { ascending: false })
    .limit(50);

  return NextResponse.json({ ...proposal, comments: comments ?? [] });
}

// POST /api/governance/proposals/[id] — vote, auth required
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = params;
  if (!id) return NextResponse.json({ error: 'Missing proposal id' }, { status: 400 });

  const body = await req.json();
  const { vote } = body; // 'for' | 'against' | 'abstain'

  if (!['for', 'against', 'abstain'].includes(vote)) {
    return NextResponse.json({ error: "vote must be 'for', 'against', or 'abstain'" }, { status: 400 });
  }

  // Elder check: allow if vlg_balance >= 2000 OR staking_tier = 'elder'
  const { data: profile } = await supabase
    .from('profiles')
    .select('staking_tier, vlg_balance')
    .eq('id', user.id)
    .maybeSingle();

  const isElder =
    profile?.staking_tier === 'elder' ||
    (profile?.vlg_balance ?? 0) >= 2000;

  // For now: allow all authenticated users to vote (as per spec "just allow for now")
  // Uncomment to enforce Elder tier:
  // if (!isElder) return NextResponse.json({ error: 'Elder tier required to vote' }, { status: 403 });

  // Check if user already voted
  const { data: existingVote } = await supabase
    .from('vico_votes')
    .select('id')
    .eq('proposal_id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingVote) {
    return NextResponse.json({ error: 'You have already voted on this proposal' }, { status: 409 });
  }

  // Fetch current tally
  const { data: proposal } = await supabase
    .from('vico_governance_proposals')
    .select('votes_for, votes_against, votes_abstain')
    .eq('id', id)
    .maybeSingle();

  if (!proposal) {
    return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
  }

  // Insert vote row
  const { error: voteError } = await supabase
    .from('vico_votes')
    .insert({
      proposal_id: id,
      user_id:     user.id,
      vote:        vote,
      created_at:  new Date().toISOString(),
    });

  if (voteError) {
    console.error('Vote insert error:', voteError.message);
    return NextResponse.json({ error: voteError.message }, { status: 500 });
  }

  // Update proposal tally
  const updates: any = {};
  if (vote === 'for')      updates.votes_for     = (proposal.votes_for     ?? 0) + 1;
  if (vote === 'against')  updates.votes_against = (proposal.votes_against ?? 0) + 1;
  if (vote === 'abstain')  updates.votes_abstain = (proposal.votes_abstain ?? 0) + 1;

  await supabase
    .from('vico_governance_proposals')
    .update(updates)
    .eq('id', id);

  const newTally = {
    votes_for:     vote === 'for'     ? (proposal.votes_for     ?? 0) + 1 : (proposal.votes_for     ?? 0),
    votes_against: vote === 'against' ? (proposal.votes_against ?? 0) + 1 : (proposal.votes_against ?? 0),
    votes_abstain: vote === 'abstain' ? (proposal.votes_abstain ?? 0) + 1 : (proposal.votes_abstain ?? 0),
  };

  return NextResponse.json({
    success:        true,
    newTally,
    onChainTxHash: 'mock-vote-' + Date.now(),
  });
}
