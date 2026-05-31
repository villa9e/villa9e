// GPS V2 — Circumstances Assessment
// Runs 5 parallel agents (Wave 1) + gap analysis + probability (Wave 2)
// Returns full assessment. Sprints are NOT generated here — use /api/gps/activate for that.
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

  // Load goal + user profile in parallel
  const [goalRes, profileRes, skillsRes, plaidRes] = await Promise.allSettled([
    admin.from('goals').select('*').eq('id', goal_id).single(),
    admin.from('profiles').select('username, display_name, personality_type, weekly_hours_available').eq('id', user.id).single(),
    admin.from('user_skills').select('skill_name, rating').eq('user_id', user.id),
    admin.from('plaid_connections').select('id').eq('user_id', user.id).limit(1),
  ]);

  const goal    = goalRes.status === 'fulfilled' ? goalRes.value.data : null;
  const profile = profileRes.status === 'fulfilled' ? profileRes.value.data : null;
  const skills  = skillsRes.status === 'fulfilled' ? skillsRes.value.data : [];
  const plaid   = plaidRes.status === 'fulfilled' ? plaidRes.value.data : [];

  if (!goal) return NextResponse.json({ error: 'Goal not found' }, { status: 404 });

  // Mark goal as assessing
  await admin.from('goals').update({ gps_stage: 'assessing' }).eq('id', goal_id);

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
    archetype:    profile?.personality_type,
    skills:       skills ?? [],
    weeklyAvailableHours: goal.weekly_hours_available ?? profile?.weekly_hours_available ?? 10,
    financialProfile: {
      plaidConnected:          (plaid ?? []).length > 0,
      estimatedMonthlyBudget:  200,
      crowdfundCapacity:       0,
    },
    completionRate: 0.65,
  };

  // Run full pipeline (no sprint generation at this stage)
  const plan = await runGPSPipeline(goalInput, userProfile, { generateSprints: false });

  // Determine new GPS stage
  const newStage = plan.probability.meetsThreshold ? 'ready' : 'gap_filling';

  // Upsert circumstances
  const { data: existing } = await admin.from('goal_circumstances').select('id').eq('goal_id', goal_id).single();
  const circumstanceData = {
    goal_id,
    user_id:                  user.id,
    skills_required:          plan.circumstances.skills.required,
    skills_user_has:          plan.circumstances.skills.userHas,
    skills_gap:               plan.circumstances.skills.gap,
    skills_severity:          plan.circumstances.skills.severity,
    skills_workshop_courses:  plan.circumstances.skills.workshopCourses,
    skills_weeks_to_fill:     plan.circumstances.skills.estimatedWeeksToFill,
    funding_total_estimated:  plan.circumstances.funding.totalEstimated,
    funding_user_available:   plan.circumstances.funding.userAvailable,
    funding_gap:              plan.circumstances.funding.gap,
    funding_severity:         plan.circumstances.funding.severity,
    funding_strategies:       plan.circumstances.funding.strategies,
    funding_can_self_fund:    plan.circumstances.funding.canFundWithCurrentResources,
    team_roles_needed:        plan.circumstances.team.rolesNeeded,
    team_can_solo:            plan.circumstances.team.canSoloOrPartiallyComplete,
    team_severity:            plan.circumstances.team.severity,
    time_hours_week_needed:   plan.circumstances.time.hoursPerWeekNeeded,
    time_hours_week_available: plan.circumstances.time.hoursPerWeekAvailable,
    time_deficit_hours:       plan.circumstances.time.deficit,
    time_severity:            plan.circumstances.time.severity,
    time_accelerators:        plan.circumstances.time.canAccelerateWith,
    time_realistic_weeks:     plan.circumstances.time.realisticTimelineWeeks,
    ai_tools:                 plan.circumstances.aiResources.applicableTools,
    ai_acceleration_factor:   plan.circumstances.aiResources.totalAccelerationFactor,
    ai_can_replace:           plan.circumstances.aiResources.aiCanReplace,
    updated_at:               new Date().toISOString(),
  };

  if (existing) {
    await admin.from('goal_circumstances').update(circumstanceData).eq('id', existing.id);
  } else {
    await admin.from('goal_circumstances').insert(circumstanceData);
  }

  // Upsert gap analysis
  const { data: existingGap } = await admin.from('goal_gap_analysis').select('id').eq('goal_id', goal_id).single();
  const gapData = {
    goal_id,
    user_id:                         user.id,
    gaps:                            plan.gapAnalysis.gaps,
    prob_without_gaps:               plan.gapAnalysis.probWithoutGapsFilled,
    prob_with_all_gaps_filled:       plan.gapAnalysis.probWithAllGapsFilled,
    prob_with_recommended_gaps:      plan.gapAnalysis.probWithRecommendedGapsFilled,
    recommended_gap_order:           plan.gapAnalysis.recommendedGapOrder,
    village_routes_needed:           plan.gapAnalysis.villageRoutesNeeded,
    analysis_text:                   plan.gapAnalysis.analysisText,
    can_reach_95:                    plan.gapAnalysis.canReach95,
    updated_at:                      new Date().toISOString(),
  };

  if (existingGap) {
    await admin.from('goal_gap_analysis').update(gapData).eq('id', existingGap.id);
  } else {
    await admin.from('goal_gap_analysis').insert(gapData);
  }

  // Update goal
  await admin.from('goals').update({
    gps_stage:              newStage,
    circumstances_assessed: true,
    probability_score:      plan.probability.score,
    estimated_weeks:        plan.totalWeeks,
    gps_plan:               plan,
  }).eq('id', goal_id);

  // Log probability
  await admin.from('goal_probability_log').insert({
    goal_id,
    score:   plan.probability.score,
    factors: plan.probability.factors,
  }).catch(() => {});

  // Notify user if ready for sprints
  if (plan.probability.meetsThreshold) {
    await admin.from('notifications').insert({
      user_id:        user.id,
      type:           'goal_step',
      title:          'Your GPS is ready — 95% probability reached',
      body:           'Activate your sprints and get moving.',
      reference_id:   goal_id,
      reference_type: 'goal',
    }).catch(() => {});
  }

  return NextResponse.json({
    stage:         newStage,
    probability:   plan.probability,
    circumstances: plan.circumstances,
    gapAnalysis:   plan.gapAnalysis,
    scenarioImpacts: plan.scenarioImpacts,
    totalWeeks:    plan.totalWeeks,
  });
}
