import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/send';
import { EMAIL_TEMPLATES } from '@/lib/email/templates';

// POST /api/email/weekly-cron
// Vercel Cron: every Monday at 9am UTC
export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = createAdminClient() as any;
  const oneWeekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();

  // Get all users who have been active in the last 30 days
  const { data: users } = await db
    .from('profiles')
    .select('id, username, display_name, checkin_streak, longest_streak')
    .gt('updated_at', new Date(Date.now() - 30 * 86_400_000).toISOString())
    .limit(500);

  if (!users?.length) return NextResponse.json({ ok: true, sent: 0 });

  let sent = 0;
  for (const user of users) {
    try {
      // Get user's email
      const { data: authUser } = await db.auth.admin.getUserById(user.id);
      const email = authUser?.user?.email;
      if (!email) continue;

      // Gather week stats
      const [
        { count: completedSteps },
        { count: oowopsGiven },
        { count: oowopsReceived },
        { count: activeGoals },
        { data: topGoalData },
      ] = await Promise.all([
        db.from('goal_steps').select('id', { count: 'exact', head: true })
          .eq('user_id', user.id).eq('status', 'completed').gt('completed_at', oneWeekAgo),
        db.from('oowops').select('id', { count: 'exact', head: true })
          .eq('giver_id', user.id).gt('created_at', oneWeekAgo),
        db.from('oowops').select('id', { count: 'exact', head: true })
          .eq('receiver_id', user.id).gt('created_at', oneWeekAgo),
        db.from('goals').select('id', { count: 'exact', head: true })
          .eq('user_id', user.id).eq('status', 'active'),
        db.from('goals').select('title').eq('user_id', user.id).eq('status', 'active')
          .order('progress_percentage', { ascending: false }).limit(1),
      ]);

      const template = EMAIL_TEMPLATES.weeklyDigest({
        name:           user.display_name || user.username,
        streak:         user.checkin_streak ?? 0,
        completedSteps: completedSteps ?? 0,
        oowopsGiven:    oowopsGiven    ?? 0,
        oowopsReceived: oowopsReceived ?? 0,
        activeGoals:    activeGoals    ?? 0,
        topGoal:        topGoalData?.[0]?.title,
      });

      await sendEmail(email, template.subject, template.html);
      sent++;
    } catch { /* non-blocking */ }
  }

  return NextResponse.json({ ok: true, sent });
}
