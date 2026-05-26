import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { fetchSpiritContext, buildSpiritSystemPrompt, storeMemory } from '@/lib/claude/spirit';
import { claude, CLAUDE_MODEL } from '@/lib/claude/client';

// Spirit GPS Recalibration — called when:
// 1. A step is missed (overdue)
// 2. A user manually asks Spirit to recalibrate
// 3. A sprint milestone is passed without completion
//
// Spirit does what a GPS does: doesn't scold you for missing a turn.
// It recalculates. It finds the fastest new path from where you actually are.
export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { goal_id, reason = 'user_request', missed_step_id = null } = await req.json();

  const admin = createAdminClient();

  // Get full goal state
  const [{ data: goal }, { data: steps }] = await Promise.all([
    (admin as any).from('goals').select('title, probability_score, progress_percentage, estimated_weeks, created_at').eq('id', goal_id).single(),
    (admin as any).from('goal_steps').select('*').eq('goal_id', goal_id).order('step_number'),
  ]);

  if (!goal || !steps) return NextResponse.json({ error: 'Goal not found' }, { status: 404 });

  const completed = (steps as any[]).filter(s => s.status === 'completed');
  const pending   = (steps as any[]).filter(s => s.status === 'pending');
  const overdue   = (steps as any[]).filter(s => {
    if (s.status !== 'pending') return false;
    if (!s.due_date) return false;
    return new Date(s.due_date) < new Date();
  });

  const weeksElapsed = Math.floor((Date.now() - new Date(goal.created_at).getTime()) / (1000 * 60 * 60 * 24 * 7));
  const ctx = await fetchSpiritContext(user.id);
  const system = buildSpiritSystemPrompt(ctx);

  const prompt = `${ctx.displayName}'s GPS needs recalibration.

Goal: "${goal.title}"
Progress: ${goal.progress_percentage}% complete
${completed.length} of ${steps.length} actions done
Weeks elapsed: ${weeksElapsed} of ${goal.estimated_weeks ?? '?'} planned
Reason for recalibration: ${reason === 'missed_step' ? 'A step was missed/delayed' : reason === 'overdue' ? 'Steps are overdue' : 'User requested recalibration'}
${overdue.length > 0 ? `Overdue actions: ${overdue.map((s: any) => `"${s.title}"`).join(', ')}` : ''}

Remaining actions:
${pending.map((s: any, i: number) => `${i + 1}. ${s.title}`).join('\n')}

You are the GPS. You don't scold. You don't replay the missed turn. You recalculate.
Find the fastest constructive path from where they ARE, not where they should be.
If they're behind, adjust the timeline realistically. If some steps need to be resequenced, do it.
If the goal probability has changed, update it honestly.

Return JSON:
{
  "spirit_message": "2-3 sentences — warm recalibration. Acknowledge the gap without shame. Show the new path with clarity and confidence.",
  "new_probability_score": 68,
  "recalibrated_steps": [
    {"title": "...", "priority": "immediate|this_week|next_week", "estimated_hours": 3, "why_now": "One sentence on why this comes first"}
  ],
  "new_estimated_weeks": 14,
  "recalibration_insight": "One key insight about what caused the gap and how to prevent it — not a lecture, just honest clarity",
  "momentum_action": "The single most important thing they can do TODAY to get back on track"
}`;

  const message = await claude.messages.create({
    model: CLAUDE_MODEL, max_tokens: 800, system,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '{}';

  try {
    const result = JSON.parse(text);

    // Update goal's probability score if recalibrated
    if (result.new_probability_score) {
      await (admin as any).from('goals').update({
        probability_score: result.new_probability_score,
        estimated_weeks:   result.new_estimated_weeks ?? goal.estimated_weeks,
      }).eq('id', goal_id);
    }

    // Store recalibration as a Spirit memory
    storeMemory(
      user.id,
      'pattern',
      `GPS recalibrated for "${goal.title}": ${result.recalibration_insight ?? 'course correction'}`,
      { goal_id, reason, new_probability: result.new_probability_score },
      8
    ).catch(() => {});

    // Send a notification
    await (admin as any).from('notifications').insert({
      user_id:        user.id,
      type:           'goal_step',
      title:          '🗺️ Spirit recalibrated your GPS',
      body:           result.momentum_action ?? 'Your route has been updated. Check your next step.',
      reference_id:   goal_id,
      reference_type: 'goal',
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ spirit_message: text, recalibrated_steps: pending.slice(0, 3), new_probability_score: goal.probability_score });
  }
}
