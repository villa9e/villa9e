import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { GOVERNANCE_RULES, displayStatus } from '@/lib/vico/constants';

const CATEGORIES = ['earnings', 'treasury', 'goal-category', 'feature', 'policy', 'other'];

export const dynamic = 'force-dynamic';

export async function GET() {
  const admin = createAdminClient() as any;

  const { data: proposals, error } = await admin
    .from('vico_governance_proposals')
    .select('*')
    .order('vip_number', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const enriched = (proposals ?? []).map((p: any) => ({ ...p, display_status: displayStatus(p) }));
  return NextResponse.json({ proposals: enriched });
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const admin = createAdminClient() as any;

  const { data: { user } } = await (supabase as any).auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { title, category, description, execution_plan, supporting_url } = await req.json();
  if (!title?.trim() || !description?.trim() || !execution_plan?.trim()) {
    return NextResponse.json({ error: 'Title, description, and execution plan are required' }, { status: 400 });
  }
  if (!CATEGORIES.includes(category)) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
  }

  const { data: wallet } = await admin
    .from('village_wallets')
    .select('vico_staked')
    .eq('user_id', user.id)
    .maybeSingle();

  if (Number(wallet?.vico_staked ?? 0) < GOVERNANCE_RULES.MIN_STAKE_TO_PROPOSE) {
    return NextResponse.json({
      error: `You need at least ${GOVERNANCE_RULES.MIN_STAKE_TO_PROPOSE.toLocaleString()} $VICO staked to submit a proposal`,
    }, { status: 403 });
  }

  const { data: maxRow } = await admin
    .from('vico_governance_proposals')
    .select('vip_number')
    .order('vip_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  const vipNumber = (maxRow?.vip_number ?? 0) + 1;
  const discussionStartsAt = new Date();
  const votingStartsAt = new Date(discussionStartsAt.getTime() + GOVERNANCE_RULES.DISCUSSION_DAYS * 24 * 60 * 60 * 1000);
  const votingEndsAt = new Date(votingStartsAt.getTime() + GOVERNANCE_RULES.VOTING_DAYS * 24 * 60 * 60 * 1000);

  const { data: proposal, error } = await admin
    .from('vico_governance_proposals')
    .insert({
      vip_number: vipNumber,
      proposer_user_id: user.id,
      title: title.trim(),
      category,
      description: description.trim(),
      execution_plan: execution_plan.trim(),
      supporting_url: supporting_url?.trim() || null,
      status: 'discussion',
      discussion_starts_at: discussionStartsAt.toISOString(),
      voting_starts_at: votingStartsAt.toISOString(),
      voting_ends_at: votingEndsAt.toISOString(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ proposal });
}
