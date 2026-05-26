import { NextRequest, NextResponse } from 'next/server';
import { callClaude } from '@/lib/claude/client';
import { createServerClient } from '@/lib/supabase/server';
import { rateLimit, rateLimitResponse } from '@/lib/ratelimit';

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Rate limit: 5 goal analyses per minute per user
  if (!rateLimit(`goal-analysis:${user.id}`, 5, 60_000)) return rateLimitResponse();

  const { goal, user_skills = [], budget = null } = await req.json();

  const prompt = `Analyze this goal and return a detailed GPS plan as JSON.

GOAL: "${goal}"
USER SKILLS: ${user_skills.join(', ') || 'not specified'}
BUDGET: ${budget ? `$${budget}` : 'not specified'}

Return ONLY valid JSON with this exact structure:
{
  "steps": [
    {"title": "Step title", "description": "What to do", "estimated_hours": 5, "resource_category": "research"}
  ],
  "resources": [
    {"name": "Resource name", "category": "tool/service/material", "estimated_cost": 100}
  ],
  "roles_needed": ["Role 1", "Role 2"],
  "estimated_weeks": 12,
  "estimated_cost": 2500,
  "goal_type": "short_term or long_term",
  "probability_score": 72,
  "probability_reason": "One sentence explaining the score",
  "is_smart": true,
  "weekly_hours_needed": 10
}

Be realistic. Steps should be concrete and actionable. Max 8 steps for Phase 1.`;

  try {
    const result = await callClaude(prompt);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
