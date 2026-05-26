import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const admin = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { goal_id, invitee_username, role } = await req.json();
  if (!goal_id || !invitee_username) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  // Verify the inviter owns the goal
  const { data: goal } = await supabase.from('goals').select('title, user_id').eq('id', goal_id).single();
  if (!goal || goal.user_id !== user.id) {
    return NextResponse.json({ error: 'Not authorized to invite to this goal' }, { status: 403 });
  }

  // Look up invitee
  const { data: invitee } = await supabase.from('profiles').select('id, username').eq('username', invitee_username.replace('@', '')).single();
  if (!invitee) return NextResponse.json({ error: 'Villager not found' }, { status: 404 });

  // Check not already a member
  const { data: existing } = await supabase.from('goal_team_members')
    .select('id, status').eq('goal_id', goal_id).eq('user_id', invitee.id).single();
  if (existing) return NextResponse.json({ error: 'Already a team member', status: existing.status }, { status: 409 });

  // Add pending team member
  await admin.from('goal_team_members').insert({
    goal_id,
    user_id: invitee.id,
    role: role || 'collaborator',
    status: 'pending',
  });

  // Notify the invitee
  const { data: inviterProfile } = await supabase.from('profiles').select('username').eq('id', user.id).single();
  await admin.from('notifications').insert({
    user_id: invitee.id,
    type: 'goal_invite',
    title: `@${inviterProfile?.username} invited you to a goal`,
    body: `Join the goal: "${goal.title}" — tap to accept or decline.`,
    reference_id: goal_id,
    reference_type: 'goal',
  });

  return NextResponse.json({ ok: true, invitee: invitee.username });
}

export async function PATCH(req: NextRequest) {
  // Accept or decline a goal team invite
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { goal_id, action } = await req.json();
  if (!goal_id || !['accept', 'decline'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  await supabase.from('goal_team_members')
    .update({ status: action === 'accept' ? 'accepted' : 'declined' })
    .eq('goal_id', goal_id)
    .eq('user_id', user.id);

  if (action === 'accept') {
    // Award VLG for joining a team
    await supabase.rpc('award_village_score', {
      p_user_id: user.id, p_points: 5, p_vlg: 15,
      p_reason: 'JOIN_GOAL_TEAM', p_reference_id: goal_id,
    });
  }

  return NextResponse.json({ ok: true });
}
