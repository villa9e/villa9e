import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/send';
import { EMAIL_TEMPLATES } from '@/lib/email/templates';

// Mark an entire goal as completed manually (when all steps done or user declares it)
export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const admin = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { goal_id } = await req.json();
  if (!goal_id) return NextResponse.json({ error: 'Missing goal_id' }, { status: 400 });

  const { data: goal } = await supabase.from('goals').select('title, probability_score, status, user_id').eq('id', goal_id).single();
  if (!goal || goal.user_id !== user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (goal.status === 'completed') return NextResponse.json({ alreadyComplete: true });

  const probScore = goal.probability_score ?? 50;
  const medalType = probScore >= 80 ? 'GOLD' : probScore >= 60 ? 'SILVER' : 'BRONZE';
  const medalVlg  = probScore >= 80 ? 200 : probScore >= 60 ? 150 : 100;

  // Mark complete
  await admin.from('goals').update({
    status: 'completed',
    completed_at: new Date().toISOString(),
    medal_type: medalType,
    progress_percentage: 100,
  }).eq('id', goal_id);

  // Award VLG + score
  await admin.rpc('award_village_score', {
    p_user_id: user.id,
    p_points: 50,
    p_vlg: medalVlg,
    p_reason: `COMPLETE_GOAL_${medalType}`,
    p_reference_id: goal_id,
  });

  // Share achievement to Dream Line
  await admin.from('dream_line_posts').insert({
    user_id: user.id,
    goal_id,
    content: `🏆 Goal achieved! "${goal.title}" — ${medalType} medal earned. It takes a village. ✊`,
    visibility: 'public',
    is_milestone: true,
    milestone_type: 'goal_completed',
    mission_score: 95,
  });

  // Notify goal team members
  const { data: team } = await admin.from('goal_team_members')
    .select('user_id').eq('goal_id', goal_id).eq('status', 'accepted').neq('user_id', user.id);

  if (team?.length) {
    await admin.from('notifications').insert(
      team.map((m: any) => ({
        user_id: m.user_id,
        type: 'medal',
        title: `🏆 Goal Completed!`,
        body: `"${goal.title}" was just completed. ${medalType} medal earned!`,
        reference_id: goal_id,
        reference_type: 'goal',
      }))
    );
  }

  // Send goal completion email (non-blocking)
  try {
    const { data: authUser } = await (admin as any).auth.admin.getUserById(user.id);
    const { data: profile } = await admin.from('profiles').select('display_name, username, village_score, checkin_streak').eq('id', user.id).single();
    if (authUser?.user?.email) {
      const t = EMAIL_TEMPLATES.goalComplete({
        name:       profile?.display_name || profile?.username || 'Villager',
        goalTitle:  goal.title,
        score:      medalVlg,
        streak:     profile?.checkin_streak ?? 0,
      });
      sendEmail(authUser.user.email, t.subject, t.html).catch(() => {});
    }
  } catch { /* non-blocking */ }

  return NextResponse.json({ ok: true, medal: medalType, vlg_earned: medalVlg });
}
