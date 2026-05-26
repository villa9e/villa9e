import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { rateLimit, rateLimitResponse } from '@/lib/ratelimit';
import { fetchSpiritContext, buildSpiritSystemPrompt, storeMemory } from '@/lib/claude/spirit';
import { claude, CLAUDE_MODEL } from '@/lib/claude/client';

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!(await rateLimit(`goal-analysis:${user.id}`, 5, 60_000))) return rateLimitResponse();

  const { goal, user_skills = [], budget = null, from_onboarding = false } = await req.json();

  // Fetch full Spirit context so GPS is personalized
  const ctx = await fetchSpiritContext(user.id);
  const system = buildSpiritSystemPrompt(ctx);

  const prompt = `${ctx.displayName} wants to achieve this goal: "${goal}"

Their skills: ${user_skills.length > 0 ? user_skills.join(', ') : 'not yet specified'}
Budget: ${budget ? `$${budget}` : 'flexible'}
Their archetype: ${ctx.archetype ?? 'unknown'}

A goal is made of SPRINTS. A sprint is a focused push toward a milestone, made of ACTIONS woven together.
Think: Goal → 3–5 Sprints → each Sprint has 3–5 Actions.

Build using this GPS structure:
- Sprints are themed bursts (e.g. "Sprint 1: Foundation", "Sprint 2: Build", "Sprint 3: Launch")
- Each sprint has a clear milestone — what exists when this sprint is complete?
- Actions are concrete, daily-level tasks
- Think in full cycles: what does each sprint CREATE beyond the goal itself?
- Who else benefits? What byproducts (skills, connections, content) get created?
- Design for sustainability — this person should not be depleted

Return ONLY valid JSON:
{
  "sprints": [
    {
      "title": "Sprint 1: Foundation",
      "milestone": "What exists when this sprint is done",
      "duration_weeks": 2,
      "steps": [
        {"title": "Action title", "description": "Concrete task", "estimated_hours": 5, "resource_category": "research|creation|outreach|learning|production"}
      ]
    }
  ],
  "steps": [],
  "resources": [{"name": "...", "category": "tool|service|material|person", "estimated_cost": 100}],
  "roles_needed": ["..."],
  "estimated_weeks": 12,
  "estimated_cost": 2500,
  "goal_type": "short_term|long_term|lifestyle",
  "probability_score": 72,
  "probability_reason": "One honest sentence",
  "is_smart": true,
  "weekly_hours_needed": 10,
  "circular_impact": {
    "skills_built": ["Skills they'll gain that they can offer the village"],
    "village_benefit": "How their success ripples into the community",
    "byproducts": ["What gets created along the way"],
    "planet_note": "Any environmental consideration — even small ones"
  }
}

After generating sprints, also flatten all steps into the "steps" array (for backward compatibility).
Be honest about probability. Max 4 sprints, 4 actions each.`;

  try {
    const message = await claude.messages.create({
      model:      CLAUDE_MODEL,
      max_tokens: 2048,
      system,
      messages:   [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '{}';
    const result = JSON.parse(text);

    // Store goal-setting as a Spirit memory
    storeMemory(
      user.id,
      'goal_set',
      `Set goal: "${goal}" — ${result.estimated_weeks ?? '?'}w timeline, ${result.probability_score ?? '?'}% probability`,
      { goal, probability: result.probability_score, weeks: result.estimated_weeks },
      8  // high importance
    ).catch(() => {});

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
