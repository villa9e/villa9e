import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { title, ai_analysis, estimated_weeks, target_date, weekly_hours = 5 } = body;

  if (!title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 });

  // Check if this is their first goal → award bonus
  const { count: existingGoals } = await supabase
    .from('goals')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const isFirstGoal = (existingGoals ?? 0) === 0;

  // Insert goal
  const { data: goal, error } = await supabase
    .from('goals')
    .insert({
      user_id:          user.id,
      title:            title.trim(),
      status:           'active',
      ai_analysis:      ai_analysis ?? {},
      estimated_weeks:  estimated_weeks ?? null,
      target_date:      target_date ?? null,
      weekly_hours,
      probability_score: ai_analysis?.probability_score ?? 0,
      total_steps:      ai_analysis?.steps?.length ?? 0,
      is_public:        true,
    })
    .select()
    .single();

  if (error || !goal) return NextResponse.json({ error: error?.message ?? 'Failed to save goal' }, { status: 500 });

  // Insert steps from AI analysis
  if (ai_analysis?.steps?.length) {
    const stepRows = ai_analysis.steps.map((step: any, i: number) => ({
      goal_id:           goal.id,
      user_id:           user.id,
      step_number:       i + 1,
      title:             step.title,
      description:       step.description ?? null,
      estimated_hours:   step.estimated_hours ?? null,
      resource_category: step.resource_category ?? null,
      oowops_needed:     3,
    }));
    await supabase.from('goal_steps').insert(stepRows);
  }

  // Award VLG + score via RPC
  if (isFirstGoal) {
    await supabase.rpc('award_village_score', {
      p_user_id:      user.id,
      p_points:       5,
      p_vlg:          25,
      p_reason:       'CREATE_FIRST_GOAL',
      p_reference_id: goal.id,
    });
  }

  return NextResponse.json({ goal, isFirstGoal });
}
