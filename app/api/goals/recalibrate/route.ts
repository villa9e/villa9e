// GPS Recalibration — routes to GPS V2 life-event engine
// Handles: missed steps, overdue sprints, user-requested recalibration
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { runRecalibration, RecalibrationEvent, GPSSprint } from '@/lib/claude/gps';
import { fetchSpiritContext, storeMemory } from '@/lib/claude/spirit';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { goal_id, reason = 'user_request', missed_step_id = null } = await req.json();
  const admin = createAdminClient();

  const [{ data: goal }, { data: steps }, { data: sprints }, ctx] = await Promise.all([
    (admin as any).from('goals').select('*').eq('id', goal_id).single(),
    (admin as any).from('goal_steps').select('*').eq('goal_id', goal_id).order('step_number'),
    (admin as any).from('sprints').select('*, sprint_actions(*)').eq('goal_id', goal_id).eq('user_id', user.id).order('created_at'),
    fetchSpiritContext(user.id),
  ]);

  if (!goal) return NextResponse.json({ error: 'Goal not found' }, { status: 404 });

  const pending = ((steps ?? []) as any[]).filter((s: any) => s.status === 'pending');
  const overdue = ((steps ?? []) as any[]).filter((s: any) => {
    if (s.status !== 'pending' || !s.due_date) return false;
    return new Date(s.due_date) < new Date();
  });

  // Map old reason codes to new event system
  const eventMap: Record<string, RecalibrationEvent> = {
    missed_step:    { type: 'action_missed',  description: `Action missed${missed_step_id ? '' : ' (overdue)'}`, impact: 'negative', magnitude: 'minor',    dimension: 'general' },
    overdue:        { type: 'action_missed',  description: `${overdue.length} action(s) overdue`,                impact: 'negative', magnitude: 'moderate', dimension: 'general' },
    user_request:   { type: 'user_request',   description: 'User requested recalibration',                       impact: 'neutral',  magnitude: 'minor',    dimension: 'general' },
    sprint_missed:  { type: 'sprint_missed',  description: 'Sprint milestone not reached',                       impact: 'negative', magnitude: 'moderate', dimension: 'general' },
  };

  const event: RecalibrationEvent = eventMap[reason] ?? eventMap.user_request;

  const currentSprints: GPSSprint[] = ((sprints ?? []) as any[]).map((s: any) => ({
    title:                  s.title,
    milestone:              s.focus_intention ?? '',
    direction:              s.focus_intention ?? '',
    durationWeeks:          1,
    actions:                (s.sprint_actions ?? []).map((a: any) => ({
      id: a.id, title: a.title, description: a.description ?? '', estimatedHours: 2,
      resourceCategory: 'creation' as const, canRunInParallel: false, dependsOn: [], aiCanAssist: false,
    })),
    probabilityContribution: 5,
    dependsOnSprints: [],
    canRunParallelWith: [],
  }));

  const userProfile = {
    id: user.id,
    displayName: ctx.displayName,
    archetype: ctx.archetype ?? undefined,
    skills: [],
    weeklyAvailableHours: goal.weekly_hours_available ?? 10,
    financialProfile: { plaidConnected: false, estimatedMonthlyBudget: 200, crowdfundCapacity: 0 },
    completionRate: 0.65,
  };

  const recalibration = await runRecalibration(
    { id: goal.id, title: goal.title, probability_score: goal.probability_score ?? 70, estimated_weeks: goal.estimated_weeks ?? 12 },
    currentSprints,
    event,
    userProfile
  );

  // Save recalibration record
  await (admin as any).from('goal_recalibrations').insert({
    goal_id,
    user_id:              user.id,
    reason,
    probability_before:   goal.probability_score,
    probability_after:    recalibration.newProbability,
    probability_delta:    recalibration.probabilityDelta,
    timeline_weeks_before: goal.estimated_weeks,
    timeline_weeks_after: recalibration.newTimelineWeeks,
    timeline_delta_weeks: recalibration.timelineDeltaWeeks,
    spirit_message:       recalibration.spiritMessage,
    momentum_action:      recalibration.momentumAction,
    recalibration_insight: recalibration.recalibrationInsight,
    timeline_explainer:   recalibration.timelineDeltaExplainer,
    probability_explainer: recalibration.probabilityExplainer,
    is_on_track:          recalibration.isOnTrack,
  }).catch(() => {});

  // Update goal
  await (admin as any).from('goals').update({
    probability_score:    recalibration.newProbability,
    estimated_weeks:      recalibration.newTimelineWeeks,
    last_recalibrated_at: new Date().toISOString(),
    recalibration_count:  (goal.recalibration_count ?? 0) + 1,
  }).eq('id', goal_id);

  storeMemory(
    user.id, 'pattern',
    `GPS recalibrated for "${goal.title}": ${recalibration.recalibrationInsight}`,
    { goal_id, reason, new_probability: recalibration.newProbability }, 8
  ).catch(() => {});

  await (admin as any).from('notifications').insert({
    user_id:        user.id,
    type:           'goal_step',
    title:          '🗺️ GPS Recalibrated',
    body:           recalibration.momentumAction,
    reference_id:   goal_id,
    reference_type: 'goal',
  }).catch(() => {});

  // Return in both old format (backward compat) and new format
  return NextResponse.json({
    // Legacy fields
    spirit_message:       recalibration.spiritMessage,
    new_probability_score: recalibration.newProbability,
    new_estimated_weeks:  recalibration.newTimelineWeeks,
    momentum_action:      recalibration.momentumAction,
    recalibration_insight: recalibration.recalibrationInsight,
    recalibrated_steps:   pending.slice(0, 5).map((s: any) => ({
      title: s.title, priority: 'this_week', estimated_hours: 2, why_now: 'Next in sequence',
    })),
    // New GPS V2 fields
    recalibration,
    deltas: {
      probability: { before: goal.probability_score, after: recalibration.newProbability, delta: recalibration.probabilityDelta },
      timeline:    { before: goal.estimated_weeks, after: recalibration.newTimelineWeeks, delta: recalibration.timelineDeltaWeeks },
    },
  });
}
