import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';

// POST — save goal as a public template
export async function POST(req: NextRequest) {
  const supabase = createServerClient() as any;
  const admin    = createAdminClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { goalId } = await req.json();
  if (!goalId) return NextResponse.json({ error: 'Missing goalId' }, { status: 400 });

  // Load the goal and its steps
  const [{ data: goal }, { data: steps }, { data: sprints }] = await Promise.all([
    supabase.from('goals').select('title, description, category, estimated_weeks, ai_analysis').eq('id', goalId).eq('user_id', user.id).single(),
    supabase.from('goal_steps').select('title, description, step_number, week_number, estimated_days, milestone_type').eq('goal_id', goalId).order('step_number'),
    supabase.from('sprints').select('title, focus_intention, week_start, week_end, spirit_note').eq('goal_id', goalId),
  ]);

  if (!goal) return NextResponse.json({ error: 'Goal not found' }, { status: 404 });

  // Check if template already exists for this goal
  const { data: existing } = await supabase.from('goal_templates').select('id').eq('goal_id', goalId).single();
  if (existing) return NextResponse.json({ templateId: existing.id, alreadyExists: true });

  // Create the template
  const { data: template, error } = await supabase.from('goal_templates').insert({
    creator_id:      user.id,
    goal_id:         goalId,
    title:           goal.title,
    description:     goal.description,
    category:        goal.category,
    estimated_weeks: goal.estimated_weeks,
    steps:           (steps ?? []).map((s: any) => ({
      title:          s.title,
      description:    s.description,
      step_number:    s.step_number,
      week_number:    s.week_number,
      estimated_days: s.estimated_days,
      milestone_type: s.milestone_type,
    })),
    sprints:         (sprints ?? []).map((sp: any) => ({
      title:           sp.title,
      focus_intention: sp.focus_intention,
      week_start:      sp.week_start,
      week_end:        sp.week_end,
      spirit_note:     sp.spirit_note,
    })),
    skills_needed:   goal.ai_analysis?.skills ?? [],
    success_metrics: goal.ai_analysis?.successMetrics ?? [],
    is_public:       true,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Award VLG for sharing knowledge
  await admin.rpc('award_village_score', {
    p_user_id:      user.id,
    p_points:       15,
    p_vlg:          5,
    p_reason:       'SHARE_GOAL_TEMPLATE',
    p_reference_id: template.id,
  }).catch(() => {});

  // Post to Dream Line as achievement
  await admin.from('dream_line_posts').insert({
    user_id:         user.id,
    goal_id:         goalId,
    content:         `📋 Just shared my "${goal.title}" goal plan as a template — clone it and make it yours. ${steps?.length ?? 0} steps, ready to go. ✊`,
    visibility:      'public',
    is_milestone:    true,
    milestone_type:  'template_shared',
  }).catch(() => {});

  return NextResponse.json({ templateId: template.id, success: true });
}

// GET — list public templates (browse)
export async function GET(req: NextRequest) {
  const supabase  = createServerClient() as any;
  const { searchParams } = new URL(req.url);
  const category  = searchParams.get('category');
  const limit     = parseInt(searchParams.get('limit') ?? '20');

  let q = supabase
    .from('goal_templates')
    .select('*, profiles!creator_id(username, avatar_url, score_tier)')
    .eq('is_public', true)
    .order('clone_count', { ascending: false })
    .limit(limit);

  if (category && category !== 'All') q = q.eq('category', category);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
