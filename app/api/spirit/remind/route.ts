import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { callClaude } from '@/lib/claude/client';

// Called by a cron job or Vercel cron — sends morning/evening Spirit reminders
// Set up in vercel.json crons or call from external cron (e.g. cron-job.org)
export async function POST(req: NextRequest) {
  // Verify this is a legitimate internal call
  const auth = req.headers.get('x-cron-secret');
  if (auth !== process.env.CRON_SECRET && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { type } = await req.json(); // 'morning' or 'evening'
  const admin = createAdminClient();

  const hour = new Date().getUTCHours();
  const checkInField = type === 'morning' ? 'morning_check_in_time' : 'evening_check_in_time';

  // Get users who have Spirit notifications enabled and have their check-in time set
  const { data: configs } = await admin
    .from('spirit_configs')
    .select('user_id, do_not_disturb, morning_check_in_time, evening_check_in_time')
    .eq('do_not_disturb', false);

  if (!configs?.length) return NextResponse.json({ sent: 0 });

  // Generate Spirit message
  const prompt = `Write a short ${type === 'morning' ? 'morning motivation' : 'evening reflection'} message for villa9e users.
It should be warm, specific, culturally aware, and tie back to achieving goals.
Under 100 words. Return plain text only.`;

  let spiritMsg = type === 'morning'
    ? 'Good morning, Villager. Your goals are waiting. One step today changes everything tomorrow.'
    : 'How did you show up today? Rest well — tomorrow is a new opportunity to move forward.';

  try {
    spiritMsg = await callClaude(prompt, { returnRaw: true });
  } catch { /* use default */ }

  // Send push to eligible users
  const userIds = configs.map((c: any) => c.user_id);
  const onesignalKey = process.env.ONESIGNAL_REST_API_KEY;
  const onesignalApp = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

  let sent = 0;
  if (onesignalKey && onesignalApp && userIds.length > 0) {
    // Send in batches of 2000 (OneSignal limit)
    for (let i = 0; i < userIds.length; i += 2000) {
      const batch = userIds.slice(i, i + 2000);
      const res = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${onesignalKey}` },
        body: JSON.stringify({
          app_id: onesignalApp,
          include_external_user_ids: batch,
          headings: { en: type === 'morning' ? '🌅 Good morning, Villager' : '🌙 Evening check-in' },
          contents: { en: spiritMsg.slice(0, 150) },
          url: 'https://villa9e.app/village/zen',
          data: { type: 'spirit_reminder', session_type: type },
        }),
      });
      if (res.ok) sent += batch.length;
    }
  }

  return NextResponse.json({ ok: true, sent, message: spiritMsg });
}
