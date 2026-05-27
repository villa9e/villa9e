import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { checkAndAwardAchievements } from '@/lib/village/achievements';
import { claude, CLAUDE_MODEL } from '@/lib/claude/client';
import { fetchSpiritContext, buildSpiritSystemPrompt } from '@/lib/claude/spirit';

// GET /api/sprints?goal_id=xxx  — active sprint for a goal
// GET /api/sprints               — all sprints for the user
export async function GET(req: NextRequest) {
  const supabase = createServerClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const goalId = req.nextUrl.searchParams.get('goal_id');
  let query = supabase
    .from('sprints')
    .select('*, sprint_actions(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (goalId) query = query.eq('goal_id', goalId).eq('status', 'active').limit(1);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(goalId ? (data?.[0] ?? null) : (data ?? []));
}

// POST /api/sprints — create a sprint
export async function POST(req: NextRequest) {
  const supabase = createServerClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { goal_id, title, focus_intention, actions } = body;

  // Create sprint
  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const { data: sprint, error: sprintErr } = await supabase
    .from('sprints')
    .insert({
      user_id: user.id,
      goal_id,
      title,
      focus_intention,
      week_start: weekStart.toISOString().slice(0, 10),
      week_end:   weekEnd.toISOString().slice(0, 10),
      status: 'active',
    })
    .select()
    .single();

  if (sprintErr) return NextResponse.json({ error: sprintErr.message }, { status: 500 });

  // Create actions
  if (actions?.length) {
    const rows = actions.map((a: any, i: number) => ({
      sprint_id:    sprint.id,
      goal_step_id: a.goal_step_id ?? null,
      title:        a.title,
      day_of_week:  a.day_of_week ?? null,
      order_index:  i,
    }));
    await supabase.from('sprint_actions').insert(rows);
  }

  // Get Spirit to generate an opening sprint note
  try {
    const ctx    = await fetchSpiritContext(user.id);
    const system = buildSpiritSystemPrompt(ctx);
    const msg    = await claude.messages.create({
      model: CLAUDE_MODEL, max_tokens: 120, system,
      messages: [{ role: 'user', content: `The user just started a weekly sprint titled "${title}". Their intention: "${focus_intention}". Give them ONE sentence of real encouragement — specific, not generic. No preamble.` }],
    });
    const note = msg.content[0].type === 'text' ? msg.content[0].text : '';
    await supabase.from('sprints').update({ spirit_note: note }).eq('id', sprint.id);
  } catch { /* non-blocking */ }

  await checkAndAwardAchievements(user.id);
  const { data: full } = await supabase.from('sprints').select('*, sprint_actions(*)').eq('id', sprint.id).single();
  return NextResponse.json(full);
}

// PATCH /api/sprints — complete an action or finish a sprint
export async function PATCH(req: NextRequest) {
  const supabase = createServerClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();

  // Complete a single action
  if (body.action_id) {
    await supabase.from('sprint_actions').update({
      completed:    true,
      completed_at: new Date().toISOString(),
    }).eq('id', body.action_id);

    // Check if all actions done → auto-complete sprint
    const { data: sprint } = await supabase
      .from('sprint_actions')
      .select('completed, sprint_id')
      .eq('id', body.action_id)
      .single();

    if (sprint) {
      const { data: allActions } = await supabase
        .from('sprint_actions')
        .select('completed')
        .eq('sprint_id', sprint.sprint_id);

      if (allActions?.every((a: any) => a.completed)) {
        await supabase.from('sprints').update({ status: 'completed' }).eq('id', sprint.sprint_id);
        await supabase.rpc('award_village_score', { p_user_id: user.id, p_points: 50, p_reason: 'Sprint completed' });
        await checkAndAwardAchievements(user.id);
      }
    }
    return NextResponse.json({ ok: true });
  }

  // Manually complete a sprint
  if (body.sprint_id) {
    await supabase.from('sprints').update({ status: 'completed' }).eq('id', body.sprint_id).eq('user_id', user.id);
    await supabase.rpc('award_village_score', { p_user_id: user.id, p_points: 50, p_reason: 'Sprint completed' });
    await checkAndAwardAchievements(user.id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'No action_id or sprint_id' }, { status: 400 });
}
