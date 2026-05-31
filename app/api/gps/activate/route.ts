// GPS V2 — Sprint Activation (Wave 3)
// Only generates sprints if goal probability >= 95%.
// Blocks below threshold and returns pathTo95 guidance instead.
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { runGPSPipeline, UserGPSProfile, GoalInput } from '@/lib/claude/gps';

export const maxDuration = 90;

export async function POST(req: NextRequest) {
  const supabase = createServerClient() as any;
  const admin    = createAdminClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { goal_id } = await req.json();

  const [{ data: goal }, { data: profile }, { data: skills }, { data: circumstances }] = await Promise.all([
    admin.from('goals').select('*').eq('id', goal_id).single(),
    admin.from('profiles').select('username, display_name, archetype, weekly_hours_available').eq('id', user.id).single(),
    admin.from('user_skills').select('skill_name, rating').eq('user_id', user.id),
    admin.from('goal_circumstances').select('*').eq('goal_id', goal_id).single(),
  ]);

  if (!goal) return NextResponse.json({ error: 'Goal not found' }, { status: 404 });

  // Hard gate: if probability < 95, block sprint generation
  if ((goal.probability_score ?? 0) < 95) {
    const { data: gapAnalysis } = await admin.from('goal_gap_analysis').select('*').eq('goal_id', goal_id).single();
    return NextResponse.json({
      blocked: true,
      currentProbability: goal.probability_score ?? 0,
      threshold: 95,
      pathTo95: (goal.gps_plan as any)?.probability?.pathTo95 ?? 'Fill the identified gaps to reach the 95% threshold.',
      gapAnalysis: gapAnalysis ?? null,
      message: 'Sprint activation requires 95% probability. Complete gap-filling steps first.',
    }, { status: 200 });
  }

  const goalInput: GoalInput = {
    title:         goal.title,
    description:   goal.description,
    category:      goal.category,
    targetDate:    goal.target_date,
    estimatedCost: goal.estimated_cost,
  };

  const userProfile: UserGPSProfile = {
    id:           user.id,
    displayName:  profile?.display_name ?? profile?.username ?? 'Villager',
    archetype:    profile?.archetype,
    skills:       skills ?? [],
    weeklyAvailableHours: goal.weekly_hours_available ?? profile?.weekly_hours_available ?? 10,
    financialProfile: {
      plaidConnected:          false,
      estimatedMonthlyBudget:  200,
      crowdfundCapacity:       0,
    },
    completionRate: 0.65,
  };

  // Run pipeline with sprint generation enabled
  const plan = await runGPSPipeline(goalInput, userProfile, { generateSprints: true });

  // Save sprints to the sprints table
  const sprintInserts = await Promise.all(
    (plan.sprints ?? []).map(async (sprint, idx) => {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() + (idx * sprint.durationWeeks * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + (sprint.durationWeeks * 7) - 1);

      const { data: savedSprint, error } = await admin.from('sprints').insert({
        user_id:         user.id,
        goal_id:         goal_id,
        title:           sprint.title,
        focus_intention: sprint.direction,
        week_start:      weekStart.toISOString().slice(0, 10),
        week_end:        weekEnd.toISOString().slice(0, 10),
        status:          idx === 0 ? 'active' : 'pending',
      }).select().single();

      if (error || !savedSprint) return null;

      // Save sprint actions
      if (sprint.actions?.length) {
        await admin.from('sprint_actions').insert(
          sprint.actions.map((action, aIdx) => ({
            sprint_id:   savedSprint.id,
            title:       action.title,
            description: action.description,
            order_index: aIdx,
            completed:   false,
            metadata: {
              estimatedHours:       action.estimatedHours,
              resourceCategory:     action.resourceCategory,
              canRunInParallel:     action.canRunInParallel,
              dependsOn:            action.dependsOn,
              villageResourceNeeded: action.villageResourceNeeded,
              aiCanAssist:          action.aiCanAssist,
              aiAssistanceNotes:    action.aiAssistanceNotes,
            },
          }))
        ).catch(() => {});
      }

      return { ...savedSprint, actions: sprint.actions, milestone: sprint.milestone };
    })
  );

  const validSprints = sprintInserts.filter(Boolean);

  // Update goal to active GPS stage
  await admin.from('goals').update({
    gps_stage:       'active',
    estimated_weeks: plan.totalWeeks,
    gps_plan:        { ...goal.gps_plan, sprints: plan.sprints, criticalPath: plan.criticalPath },
  }).eq('id', goal_id);

  // Award village score for activating GPS
  await admin.rpc('award_village_score', {
    p_user_id:      user.id,
    p_points:       50,
    p_vlg:          20,
    p_reason:       'GPS_ACTIVATED',
    p_reference_id: goal_id,
  }).catch(() => {});

  return NextResponse.json({
    activated:    true,
    sprints:      validSprints,
    totalWeeks:   plan.totalWeeks,
    criticalPath: plan.criticalPath,
  });
}
