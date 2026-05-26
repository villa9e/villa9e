import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { fetchSpiritContext, buildSpiritSystemPrompt, storeMemory } from '@/lib/claude/spirit';
import { claude, CLAUDE_MODEL } from '@/lib/claude/client';

// Called when a user marks a step as complete — Spirit verifies and confirms
// or asks a clarifying question before the OoWop validation begins
export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { step_id, goal_id, evidence = '', notes = '' } = await req.json();

  const admin = createAdminClient();

  // Get the step and goal context
  const [{ data: step }, { data: goal }] = await Promise.all([
    (admin as any).from('goal_steps').select('title, description, estimated_hours, status').eq('id', step_id).single(),
    (admin as any).from('goals').select('title, progress_percentage, probability_score').eq('id', goal_id).single(),
  ]);

  if (!step || !goal) return NextResponse.json({ error: 'Step not found' }, { status: 404 });
  if (step.status === 'completed') return NextResponse.json({ verified: true, message: 'Already completed' });

  // Fetch Spirit context for personalized verification
  const ctx    = await fetchSpiritContext(user.id);
  const system = buildSpiritSystemPrompt(ctx);

  const prompt = `${ctx.displayName} says they completed this GPS action.

Goal: "${goal.title}" (${goal.progress_percentage}% complete)
Action: "${step.title}"
Action description: "${step.description ?? 'not specified'}"
What they shared: "${evidence || notes || 'no evidence provided'}"

Your job: Briefly acknowledge their completion. Be real — celebrate what they did.
If they provided evidence, affirm it specifically. If not, ask ONE simple question to confirm they did it (don't be gatekeeping — just caring).
Also tell them what the NEXT step is and recalibrate their momentum.

Return JSON:
{
  "verified": true,
  "spirit_message": "Your warm, personal verification message — 2-3 sentences max. Reference the step specifically. Celebrate.",
  "next_step_hint": "One sentence pointing toward their next action — make it feel achievable",
  "momentum_score": 85,
  "needs_evidence": false
}

If they clearly did not complete it (step says something specific they haven't mentioned at all), set "verified": false and "needs_evidence": true — and ask gently.`;

  const message = await claude.messages.create({
    model: CLAUDE_MODEL, max_tokens: 400, system,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '{}';

  try {
    const result = JSON.parse(text);

    // If Spirit confirms, store the verification as a memory
    if (result.verified) {
      storeMemory(
        user.id,
        'step_completed',
        `Completed and verified: "${step.title}" in goal "${goal.title}"`,
        { step_id, goal_id, spirit_message: result.spirit_message },
        7
      ).catch(() => {});
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ verified: true, spirit_message: text, next_step_hint: 'Keep going — you\'re on track.', momentum_score: 75 });
  }
}
