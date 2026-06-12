import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';

const VOTER_VLG_REWARD = 1;
const OWNER_VLG_REWARD = 10;

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient() as any;
  const admin    = createAdminClient() as any;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { vote } = await req.json();
  if (vote !== 'confirm' && vote !== 'reject') {
    return NextResponse.json({ error: 'vote must be "confirm" or "reject"' }, { status: 400 });
  }

  const { data: verification, error: verErr } = await admin
    .from('action_verifications').select('*').eq('id', params.id).maybeSingle();
  if (verErr || !verification) return NextResponse.json({ error: 'Verification not found' }, { status: 404 });

  if (verification.user_id === user.id) {
    return NextResponse.json({ error: 'You cannot verify your own proof' }, { status: 403 });
  }
  if (verification.status !== 'pending') {
    return NextResponse.json({ error: 'This verification has already been resolved', status: verification.status }, { status: 409 });
  }

  const { error: voteErr } = await admin.from('action_verification_votes').insert({
    verification_id: params.id, voter_id: user.id, vote,
  });
  if (voteErr) {
    if (voteErr.code === '23505') {
      return NextResponse.json({ error: 'You already voted on this proof' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Could not record vote' }, { status: 500 });
  }

  const votesConfirm = verification.votes_confirm + (vote === 'confirm' ? 1 : 0);
  const votesReject  = verification.votes_reject  + (vote === 'reject'  ? 1 : 0);
  const votesRequired = verification.votes_required ?? 3;

  let status = verification.status;
  let sprintCompleted = false;
  let resolvedAt: string | null = null;

  if (votesConfirm >= votesRequired) {
    status = 'verified';
    resolvedAt = new Date().toISOString();

    await admin.from('sprint_actions').update({
      completed: true, completed_at: resolvedAt,
    }).eq('id', verification.action_id);

    const { data: action } = await admin.from('sprint_actions').select('sprint_id').eq('id', verification.action_id).maybeSingle();
    if (action?.sprint_id) {
      const { data: allActions } = await admin
        .from('sprint_actions').select('id, completed').eq('sprint_id', action.sprint_id);
      const updated = (allActions ?? []).map((a: any) => a.id === verification.action_id ? { ...a, completed: true } : a);
      sprintCompleted = updated.every((a: any) => a.completed === true);
      if (sprintCompleted) {
        await admin.from('sprints').update({ status: 'complete', completed_at: resolvedAt }).eq('id', action.sprint_id);
      }
    }

    await awardVlg(admin, verification.user_id, verification.action_id, OWNER_VLG_REWARD, 'action_verified');
  } else if (votesReject >= votesRequired) {
    status = 'rejected';
    resolvedAt = new Date().toISOString();
  }

  await admin.from('action_verifications').update({
    votes_confirm: votesConfirm, votes_reject: votesReject, status,
    ...(resolvedAt ? { resolved_at: resolvedAt } : {}),
  }).eq('id', params.id);

  // Thank-you $VLG to the voter for helping verify
  await awardVlg(admin, user.id, params.id, VOTER_VLG_REWARD, 'verification_vote');

  return NextResponse.json({
    status, votesConfirm, votesReject, votesRequired, sprintCompleted,
    resolved: status !== 'pending',
  });
}

async function awardVlg(admin: any, userId: string, sourceId: string, amount: number, reason: string) {
  try {
    const { data: profile } = await admin.from('profiles').select('vlg_balance').eq('id', userId).maybeSingle();
    const current = parseFloat(profile?.vlg_balance ?? '0') || 0;
    await admin.from('profiles').update({ vlg_balance: current + amount }).eq('id', userId);
    try {
      await admin.from('vlg_transactions').insert({ user_id: userId, amount, reason, source_id: sourceId });
    } catch { /* non-blocking */ }
  } catch { /* silent */ }
}
