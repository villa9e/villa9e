import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { callClaude } from '@/lib/claude/client';

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { goal_id } = await req.json();

  const { data: goal }  = await supabase.from('goals').select('*, goal_steps(*), goal_financing(*), goal_team_members(*)').eq('id', goal_id).single();
  const { data: skills } = await supabase.from('user_skills').select('skill_name,rating').eq('user_id', user.id);

  if (!goal) return NextResponse.json({ error: 'Goal not found' }, { status: 404 });

  const completedSteps = goal.goal_steps?.filter((s: any) => s.status === 'completed').length ?? 0;
  const totalSteps     = goal.goal_steps?.length ?? 1;
  const teamSize       = goal.goal_team_members?.length ?? 0;
  const rolesNeeded    = goal.ai_analysis?.roles_needed?.length ?? 0;
  const roleFill       = rolesNeeded > 0 ? Math.min(1, teamSize / rolesNeeded) : 1;
  const userSkillMatch = skills?.filter(s => s.rating >= 7).length ?? 0;

  const prompt = `Recalculate the Goal GPS Probability Score (0–100).

Goal: "${goal.title}"
Progress: ${completedSteps}/${totalSteps} steps completed (${Math.round((completedSteps/totalSteps)*100)}%)
Team fill: ${teamSize}/${rolesNeeded} roles filled (${Math.round(roleFill*100)}%)
Budget: ${goal.goal_financing?.length ? 'has financing' : 'no financing set'}
Weekly hours committed: ${goal.weekly_hours ?? 5}h
User skillsets: ${userSkillMatch} strong skills
Due date: ${goal.target_date ?? 'not set'}

Return JSON ONLY: {"probability_score": 72, "delta": +5, "reasoning": "one sentence", "next_action": "the single most important thing to do next"}`;

  const result = await callClaude(prompt);
  const score  = result.probability_score ?? goal.probability_score;

  // Update in DB
  await supabase.from('goals').update({ probability_score: score }).eq('id', goal_id);
  await supabase.from('goal_probability_log').insert({ goal_id, score, factors: result });

  return NextResponse.json(result);
}
