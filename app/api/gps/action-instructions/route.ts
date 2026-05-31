// GPS — Pace-level action instructions
// Generates step-by-step guidance for a specific action at the user's pace level:
// 1 = Wayfinder (full breakdown, no assumptions, verify everything)
// 2 = Pathfinder (guided, support on request, checkpoint verify)
// 3 = Trailblazer (high-level, upload + quality review)
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { claude, CLAUDE_MODEL } from '@/lib/claude/client';

export const maxDuration = 45;

const PACE_CONTEXTS: Record<number, string> = {
  1: `WAYFINDER PACE — Full guidance, zero assumptions.
- Break this action into the smallest possible steps. Assume the user has NEVER done this before.
- Never use acronyms without defining them first. No jargon.
- Each step must be self-contained — completing it shouldn't require knowledge from another step.
- Include: what to do, how to do it, why it matters, what "done" looks like.
- Add a verification question at the end of each step so the user knows they've done it correctly.
- If there's a tool or platform involved, walk them through opening it, finding the right section, and what to click.
- Treat this like you're explaining to someone who has never used a computer for a professional purpose.`,

  2: `PATHFINDER PACE — Guided support, assumes basics.
- Assume the user understands common tasks (building a document, using email, basic software).
- Group related micro-steps together under clear headings.
- At key checkpoints, ask a verification question so they can confirm they're on track.
- Offer an optional "need more help?" note for complex sub-steps.
- Don't over-explain common tools, but do give context for anything unfamiliar.
- Each step should have a clear deliverable they can check off.`,

  3: `TRAILBLAZER PACE — High-level, self-directed.
- Give the action as a clear directive with context on WHY it matters.
- List 3–5 quality benchmarks they should hit when they're done.
- Tell them what to upload or share as proof of completion.
- You'll review their submission and give specific improvement recommendations.
- Skip step-by-step — they know how to get there. Focus on quality standards.`,
};

export async function POST(req: NextRequest) {
  const supabase = createServerClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { action_title, action_description, goal_title, goal_category, pace_level = 2, sprint_title, resources = [] } = await req.json();

  const paceContext = PACE_CONTEXTS[pace_level] ?? PACE_CONTEXTS[2];

  const msg = await claude.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: `You are Spirit — villa9e's AI goal coach generating action instructions.

Goal: "${goal_title}" (${goal_category})
Sprint: "${sprint_title}"
Action: "${action_title}"
${action_description ? `Action context: ${action_description}` : ''}
${resources.length > 0 ? `Resources available: ${resources.join(', ')}` : ''}

${paceContext}

Generate action instructions for this specific action. Be practical and specific to THIS goal and action — not generic.

Return ONLY valid JSON:
{
  "steps": [
    {
      "stepNumber": 1,
      "instruction": "Exactly what to do — specific, actionable, no jargon",
      "why": "Why this step matters (one sentence — omit at Trailblazer pace)",
      "howToKnowItsDone": "What 'complete' looks like for this step",
      "estimatedMinutes": 20,
      "toolOrPlatform": "Specific app or tool needed (null if none)",
      "verifyQuestion": "Question to confirm this was done correctly (Wayfinder/Pathfinder only)"
    }
  ],
  "resourcesNeeded": ["specific item or tool needed"],
  "completionCriteria": "What the finished action looks like — what can they show/upload",
  "spiritNote": "One short encouraging note about this specific action — make it real, not generic",
  "estimatedTotalMinutes": 45,
  "aiCanHelp": true,
  "aiHelpNote": "Specific way Claude or another AI tool can assist with this action"
}

${pace_level === 1 ? 'Steps should be very granular — 6–12 steps minimum. Never combine multiple actions in one step.' : ''}
${pace_level === 2 ? 'Steps should be clear but not micro-granular — 4–8 steps.' : ''}
${pace_level === 3 ? 'Steps should be high-level benchmarks — 3–5 quality checkpoints.' : ''}`,
    }],
  });

  const txt = msg.content[0].type === 'text' ? msg.content[0].text : '{}';
  try {
    const result = JSON.parse(txt.match(/\{[\s\S]+\}/)?.[0] ?? '{}');
    return NextResponse.json({ ...result, paceLevel: pace_level });
  } catch {
    return NextResponse.json({ error: 'Failed to generate instructions', raw: txt }, { status: 500 });
  }
}
