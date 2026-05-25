import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const admin    = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { step_id, goal_id, share_to_dreamline = true } = await req.json();

  // Mark step complete
  const { data: step, error } = await admin.from('goal_steps').update({
    status:         'completed',
    completed_date: new Date().toISOString(),
  }).eq('id', step_id).eq('user_id', user.id).select().single();

  if (error || !step) return NextResponse.json({ error: 'Failed to complete step' }, { status: 400 });

  // Auto-create a Dream Line post for this step so OoWops can validate it
  let postId: string | null = null;
  if (share_to_dreamline) {
    const { data: post } = await admin.from('dream_line_posts').insert({
      user_id:          user.id,
      goal_id:          goal_id,
      step_id:          step_id,
      content:          `✅ Just completed: "${step.title}"`,
      visibility:       'public',
      is_milestone:     true,
      milestone_type:   'step_completed',
    }).select('id').single();
    postId = post?.id ?? null;
  }

  // Update goal progress
  const { data: allSteps } = await admin.from('goal_steps').select('status').eq('goal_id', goal_id);
  const done  = allSteps?.filter(s => s.status === 'completed').length ?? 0;
  const total = allSteps?.length ?? 1;
  const pct   = Math.round((done / total) * 100);

  await admin.from('goals').update({ progress_percentage: pct, current_step_index: done }).eq('id', goal_id);

  // Award VLG
  await admin.rpc('award_village_score', {
    p_user_id:      user.id,
    p_points:       2,
    p_vlg:          10,
    p_reason:       'COMPLETE_GOAL_STEP',
    p_reference_id: step_id,
  });

  // Send in-app notification to goal team members
  const { data: teamMembers } = await admin.from('goal_team_members').select('user_id').eq('goal_id', goal_id).neq('user_id', user.id).eq('status', 'accepted');
  if (teamMembers?.length) {
    await admin.from('notifications').insert(
      teamMembers.map(m => ({
        user_id:        m.user_id,
        type:           'goal_step',
        title:          'Teammate completed a step!',
        body:           `A villager on your goal just completed: "${step.title}"`,
        reference_id:   goal_id,
        reference_type: 'goal',
      }))
    );
  }

  return NextResponse.json({ ok: true, post_id: postId, progress: pct });
}
