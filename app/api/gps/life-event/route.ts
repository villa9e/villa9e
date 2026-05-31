// GPS V2 — Life Event Logger + Auto-Recalibration
// User logs real-world events (job loss, new teammate, skill gained, etc.)
// System recalibrates the GPS and notifies the user of probability/timeline deltas.
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { runRecalibration, RecalibrationEvent, GPSSprint } from '@/lib/claude/gps';
import { fetchSpiritContext } from '@/lib/claude/spirit';

export const maxDuration = 60;

const EVENT_TYPE_MAP: Record<string, RecalibrationEvent> = {
  skill_acquired:      { type: 'life_event', description: 'User completed a skill', impact: 'positive', magnitude: 'moderate', dimension: 'skills' },
  team_member_joined:  { type: 'life_event', description: 'New team member joined via Trading Post', impact: 'positive', magnitude: 'moderate', dimension: 'team' },
  funding_secured:     { type: 'life_event', description: 'Funding source secured', impact: 'positive', magnitude: 'moderate', dimension: 'funding' },
  funding_lost:        { type: 'life_event', description: 'Funding source lost or reduced', impact: 'negative', magnitude: 'major', dimension: 'funding' },
  mentor_connected:    { type: 'life_event', description: 'Mentor connected from Dreamline', impact: 'positive', magnitude: 'moderate', dimension: 'general' },
  schedule_change_pos: { type: 'life_event', description: 'User gained more available time', impact: 'positive', magnitude: 'minor', dimension: 'time' },
  schedule_change_neg: { type: 'life_event', description: 'User lost available time', impact: 'negative', magnitude: 'moderate', dimension: 'time' },
  health_setback:      { type: 'life_event', description: 'Health setback affecting capacity', impact: 'negative', magnitude: 'major', dimension: 'health' },
  life_obstacle:       { type: 'life_event', description: 'Life obstacle encountered', impact: 'negative', magnitude: 'major', dimension: 'general' },
  positive_windfall:   { type: 'life_event', description: 'Positive windfall — funding, opportunity, or resource', impact: 'positive', magnitude: 'moderate', dimension: 'general' },
  new_resource:        { type: 'life_event', description: 'New tool or resource discovered', impact: 'positive', magnitude: 'minor', dimension: 'general' },
  scope_change:        { type: 'life_event', description: 'Goal scope has changed', impact: 'neutral', magnitude: 'major', dimension: 'scope' },
  action_missed:       { type: 'action_missed', description: 'An action was missed or skipped', impact: 'negative', magnitude: 'minor', dimension: 'general' },
  sprint_missed:       { type: 'sprint_missed', description: 'A sprint milestone was missed', impact: 'negative', magnitude: 'moderate', dimension: 'general' },
};

export async function POST(req: NextRequest) {
  const supabase = createServerClient() as any;
  const admin    = createAdminClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const {
    goal_id,
    event_type,
    title,
    description: eventDesc,
    reference_type,
    reference_id,
    metadata = {},
  } = await req.json();

  // Load goal + active sprints + spirit context in parallel
  const [{ data: goal }, sprintRes, ctx] = await Promise.all([
    admin.from('goals').select('*').eq('id', goal_id).single(),
    admin.from('sprints').select('*, sprint_actions(*)').eq('goal_id', goal_id).eq('user_id', user.id).order('created_at'),
    fetchSpiritContext(user.id),
  ]);

  if (!goal) return NextResponse.json({ error: 'Goal not found' }, { status: 404 });

  const sprints: GPSSprint[] = (sprintRes.data ?? []).map((s: any) => ({
    title:                  s.title,
    milestone:              s.focus_intention ?? '',
    direction:              s.focus_intention ?? '',
    durationWeeks:          1,
    actions:                (s.sprint_actions ?? []).map((a: any) => ({ id: a.id, title: a.title, description: '', estimatedHours: 2, resourceCategory: 'creation', canRunInParallel: false, dependsOn: [], aiCanAssist: false })),
    probabilityContribution: 5,
    dependsOnSprints:       [],
    canRunParallelWith:     [],
  }));

  const baseEvent = EVENT_TYPE_MAP[event_type] ?? { type: 'life_event' as const, description: eventDesc ?? event_type, impact: 'neutral' as const, magnitude: 'minor' as const, dimension: 'general' as const };
  const event: RecalibrationEvent = { ...baseEvent, description: eventDesc ?? baseEvent.description };

  const userProfile = {
    id:           user.id,
    displayName:  ctx.displayName,
    archetype:    ctx.archetype,
    skills:       [],
    weeklyAvailableHours: goal.weekly_hours_available ?? 10,
    financialProfile:     { plaidConnected: false, estimatedMonthlyBudget: 200, crowdfundCapacity: 0 },
    completionRate:       0.65,
  };

  // Run recalibration engine
  const recalibration = await runRecalibration(
    { id: goal.id, title: goal.title, probability_score: goal.probability_score ?? 70, estimated_weeks: goal.estimated_weeks ?? 12 },
    sprints,
    event,
    userProfile
  );

  // Log the life event
  const { data: lifeEvent } = await admin.from('goal_life_events').insert({
    goal_id,
    user_id:          user.id,
    event_type,
    title,
    description:      eventDesc,
    probability_delta: recalibration.probabilityDelta,
    time_delta_days:  recalibration.timelineDeltaWeeks * 7,
    reference_type,
    reference_id,
    metadata,
    triggered_recalibration: true,
  }).select().single();

  // Save recalibration record
  const { data: recalibRecord } = await admin.from('goal_recalibrations').insert({
    goal_id,
    user_id:              user.id,
    reason:               event_type,
    life_event_id:        lifeEvent?.id,
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
    recalibrated_sprints: recalibration.recalibratedSprints,
    is_on_track:          recalibration.isOnTrack,
  }).select().single();

  // Update life event with recalibration ID
  if (lifeEvent && recalibRecord) {
    await admin.from('goal_life_events').update({ recalibration_id: recalibRecord.id }).eq('id', lifeEvent.id);
  }

  // Determine new GPS stage
  const newStage = recalibration.newProbability >= 95
    ? (goal.gps_stage === 'active' ? 'active' : 'ready')
    : (goal.gps_stage === 'active' ? 'active' : 'gap_filling');

  // Update goal
  await admin.from('goals').update({
    probability_score:      recalibration.newProbability,
    estimated_weeks:        recalibration.newTimelineWeeks,
    last_recalibrated_at:   new Date().toISOString(),
    recalibration_count:    (goal.recalibration_count ?? 0) + 1,
    gps_stage:              newStage,
  }).eq('id', goal_id);

  // Log probability
  await admin.from('goal_probability_log').insert({
    goal_id,
    score:   recalibration.newProbability,
    factors: { reason: event_type, delta: recalibration.probabilityDelta, event_title: title },
  }).catch(() => {});

  // Build notification with delta info
  const probChange = recalibration.probabilityDelta !== 0
    ? ` Probability ${recalibration.probabilityDelta > 0 ? '+' : ''}${recalibration.probabilityDelta}%.`
    : '';
  const timeChange = recalibration.timelineDeltaWeeks !== 0
    ? ` Timeline ${recalibration.timelineDeltaWeeks > 0 ? '+' : ''}${recalibration.timelineDeltaWeeks} week${Math.abs(recalibration.timelineDeltaWeeks) !== 1 ? 's' : ''}.`
    : '';

  await admin.from('notifications').insert({
    user_id:        user.id,
    type:           'goal_step',
    title:          '🗺️ GPS Recalibrated',
    body:           `${recalibration.spiritMessage}${probChange}${timeChange}`,
    reference_id:   goal_id,
    reference_type: 'goal',
  }).catch(() => {});

  return NextResponse.json({
    recalibration,
    lifeEventId:     lifeEvent?.id,
    recalibrationId: recalibRecord?.id,
    newStage,
    deltas: {
      probability: {
        before: goal.probability_score,
        after:  recalibration.newProbability,
        delta:  recalibration.probabilityDelta,
        explainer: recalibration.probabilityExplainer,
      },
      timeline: {
        before:   goal.estimated_weeks,
        after:    recalibration.newTimelineWeeks,
        delta:    recalibration.timelineDeltaWeeks,
        explainer: recalibration.timelineDeltaExplainer,
      },
    },
  });
}
