import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getSpiritTool } from '@/lib/claude/spirit-tools';

// POST /api/spirit/tick — Spirit OS Phase 4 (proactive perception).
// Called by Vercel Cron once a day. Perceives sprints that are about to end
// with an unscheduled action, then Executes (Tier 1, auto) by blocking time
// on the user's villa9e calendar for it and notifying them.
//
// Perceive  → active sprints ending within 2 days with an incomplete,
//             unscheduled (day_of_week is null) next action
// Reason    → that action is the critical path item before the sprint closes
// Orchestrate → pick tomorrow 9-10am as the block (simple default for v1)
// Execute   → create_calendar_event (Tier 1), mark the action's day_of_week
//             so this doesn't repeat, log to spirit_actions, push a notice

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient() as any;
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const in2Days = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const { data: sprints } = await admin
    .from('sprints')
    .select('id, user_id, goal_id, title, week_end, sprint_actions(id, title, completed, day_of_week, order_index)')
    .eq('status', 'active')
    .gte('week_end', today)
    .lte('week_end', in2Days);

  const tomorrow9 = new Date(now);
  tomorrow9.setDate(tomorrow9.getDate() + 1);
  tomorrow9.setHours(9, 0, 0, 0);
  const tomorrow10 = new Date(tomorrow9);
  tomorrow10.setHours(10, 0, 0, 0);
  const tomorrowDow = ((tomorrow9.getDay() + 6) % 7) + 1; // JS 0=Sun → our 1=Mon..7=Sun

  const tool = getSpiritTool('create_calendar_event')!;
  let processed = 0;

  for (const sprint of sprints ?? []) {
    const incomplete = (sprint.sprint_actions ?? [])
      .filter((a: any) => !a.completed)
      .sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0));

    const next = incomplete[0];
    if (!next || next.day_of_week !== null) continue; // nothing to do, or already scheduled

    const input = {
      title: `Sprint: ${next.title}`,
      description: `Spirit blocked this time — "${sprint.title}" wraps up soon and this step wasn't on the calendar yet.`,
      start_time: tomorrow9.toISOString(),
      end_time: tomorrow10.toISOString(),
      goal_id: sprint.goal_id,
    };

    const result = await tool.handler(admin, sprint.user_id, input);
    await admin.from('spirit_actions').insert({
      user_id: sprint.user_id,
      tool_name: tool.name,
      tier: tool.tier,
      input,
      result,
      status: result.ok ? 'completed' : 'failed',
      confirmed_at: new Date().toISOString(),
    });

    if (!result.ok) continue;

    // Mark this action scheduled so future ticks don't repeat it
    await admin.from('sprint_actions').update({ day_of_week: tomorrowDow }).eq('id', next.id);

    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/push/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        external_user_ids: [sprint.user_id],
        title: '🌀 Spirit blocked time for you',
        body: `"${sprint.title}" wraps up soon, so I put "${next.title}" on your calendar for 9am tomorrow.`,
        url: '/village/hut',
      }),
    }).catch(() => {});

    processed++;
  }

  return NextResponse.json({ ok: true, processed, sprints_checked: sprints?.length ?? 0 });
}

// GET — health check
export async function GET() {
  return NextResponse.json({ ok: true, message: 'Spirit tick (proactive perception) endpoint active' });
}
