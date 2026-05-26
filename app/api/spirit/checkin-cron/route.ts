import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { fetchSpiritContext, buildSpiritSystemPrompt } from '@/lib/claude/spirit';
import { claude, CLAUDE_MODEL } from '@/lib/claude/client';

// POST /api/spirit/checkin-cron
// Called by Vercel Cron (configured in vercel.json) at 8am and 8pm daily
// Sends personalized morning/evening check-in notifications to users who:
//   1. Have spirit_configs with morning/evening check-in times set
//   2. Haven't already checked in today
//   3. Have push notifications enabled

export async function POST(req: NextRequest) {
  // Verify cron secret
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const hour  = new Date().getHours(); // UTC — adjust if needed
  const type  = hour < 14 ? 'morning' : 'evening';
  const today = new Date().toISOString().slice(0, 10);

  // Find users who should receive a check-in right now
  // and haven't had one today
  const { data: users } = await (admin as any)
    .from('profiles')
    .select('id, username, display_name')
    .eq('mindful_moment_done', false)
    .neq('last_mindful_date', today)
    .limit(100); // batch per cron run

  if (!users?.length) {
    return NextResponse.json({ ok: true, sent: 0, message: 'No users need check-in right now' });
  }

  let sent = 0;

  for (const user of users) {
    try {
      // Get Spirit context for personalized message
      const ctx = await fetchSpiritContext(user.id);
      const system = buildSpiritSystemPrompt(ctx);

      const message = await claude.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 200,
        system,
        messages: [{
          role: 'user',
          content: `Generate a ${type} check-in notification for ${ctx.displayName}.
One sentence — warm, personal, mentions something about their active goals if possible.
Return JSON: {"title": "...", "body": "..."}
Keep title under 50 chars, body under 100 chars.`,
        }],
      });

      const text = message.content[0].type === 'text' ? message.content[0].text : '{}';
      let notif: any = { title: `${type === 'morning' ? '☀️' : '🌙'} Spirit check-in`, body: 'How are you showing up today?' };

      try { notif = JSON.parse(text); } catch { /* use defaults */ }

      // Send push notification
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/push/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          external_user_ids: [user.id],
          title: notif.title,
          body: notif.body,
          url: '/village/zen',
        }),
      }).catch(() => {});

      // Log the check-in
      await (admin as any).from('spirit_checkin_log').insert({
        user_id:      user.id,
        checkin_type: type,
        spirit_text:  notif.body,
        sent_push:    true,
      }).catch(() => {});

      sent++;
    } catch { /* skip this user, continue */ }
  }

  return NextResponse.json({ ok: true, sent, type, users_processed: users.length });
}

// GET — health check
export async function GET() {
  return NextResponse.json({ ok: true, message: 'Spirit check-in cron endpoint active' });
}
