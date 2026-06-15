import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { GOVERNANCE_RULES } from '@/lib/vico/constants';

export const dynamic = 'force-dynamic';

// POST /api/vico/comments — auth required, Elder tier (10,000+ staked $VICO)
export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const admin = createAdminClient() as any;

  const { data: { user } } = await (supabase as any).auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { proposalId, content } = await req.json();
  if (!proposalId || !content?.trim()) {
    return NextResponse.json({ error: 'Missing required fields: proposalId, content' }, { status: 400 });
  }
  if (content.trim().length > 2000) {
    return NextResponse.json({ error: 'Comment exceeds 2000 character limit' }, { status: 400 });
  }

  const { data: wallet } = await admin
    .from('village_wallets')
    .select('vico_staked')
    .eq('user_id', user.id)
    .maybeSingle();

  if (Number(wallet?.vico_staked ?? 0) < GOVERNANCE_RULES.ELDER_STAKE) {
    return NextResponse.json({
      error: `Village Elders (${GOVERNANCE_RULES.ELDER_STAKE.toLocaleString()}+ staked $VICO) can post in governance discussions`,
    }, { status: 403 });
  }

  const { data: proposal } = await admin
    .from('vico_governance_proposals')
    .select('id')
    .eq('id', proposalId)
    .maybeSingle();

  if (!proposal) return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });

  const { data: comment, error } = await admin
    .from('vico_governance_comments')
    .insert({
      proposal_id: proposalId,
      user_id: user.id,
      content: content.trim(),
      oowop_count: 0,
    })
    .select('*, profiles(username, display_name, avatar_url)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(comment, { status: 201 });
}
