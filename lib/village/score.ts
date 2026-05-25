import { createClient } from '@/lib/supabase/client';

// VLG earned per action (Phase 1 — points only, not tradeable)
export const VLG_REWARDS = {
  COMPLETE_ONBOARDING:    50,
  CREATE_FIRST_GOAL:      25,
  COMPLETE_GOAL_STEP:     10,
  RECEIVE_OOWOP:          10,
  STEP_VALIDATED:         30,
  GIVE_OOWOP:              7,
  HIGH_QUALITY_COMMENT:   15,
  COMPLETE_GOAL_GOLD:    200,
  EARN_PLATINUM:         500,
  COMPLETE_DEAL:          50,
  DAILY_MINDFUL_MOMENT:    5,
  DREAM_LINE_POST:        10,
  REFER_VILLAGER:        100,
  TRIBE_TASK_ON_TIME:     15,
  WORKSHOP_CONTENT:       50,
  HOSPITAL_REVIEW:        10,
} as const;

// Village score points per action
export const SCORE_POINTS = {
  COMPLETE_ONBOARDING:    10,
  CREATE_FIRST_GOAL:       5,
  COMPLETE_GOAL_STEP:      2,
  RECEIVE_OOWOP:           3,
  STEP_VALIDATED:         10,
  GIVE_OOWOP:              2,
  HIGH_QUALITY_COMMENT:    5,
  COMPLETE_GOAL_GOLD:     50,
  EARN_PLATINUM:         100,
  COMPLETE_DEAL:          15,
  DAILY_MINDFUL_MOMENT:    1,
  DREAM_LINE_POST:         2,
  REFER_VILLAGER:         20,
  TRIBE_TASK_ON_TIME:      4,
  WORKSHOP_CONTENT:       15,
  HOSPITAL_REVIEW:         2,
} as const;

export type ScoreAction = keyof typeof VLG_REWARDS;

// Call this from any client component to award score + VLG
export async function awardScore(action: ScoreAction, referenceId?: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const points = SCORE_POINTS[action];
  const vlg    = VLG_REWARDS[action];

  await supabase.rpc('award_village_score', {
    p_user_id:      user.id,
    p_points:       points,
    p_vlg:          vlg,
    p_reason:       action,
    p_reference_id: referenceId ?? null,
  });

  return { points, vlg };
}

// Score tier labels
export function getScoreTier(score: number): { tier: string; label: string; color: string; next: number } {
  if (score >= 2500) return { tier: 'legend',  label: '🏆 Legend',  color: 'text-amber-600',  next: Infinity };
  if (score >= 1000) return { tier: 'elder',   label: '⚡ Elder',   color: 'text-purple-600', next: 2500 };
  if (score >= 500)  return { tier: 'builder', label: '🏗️ Builder', color: 'text-blue-600',   next: 1000 };
  if (score >= 100)  return { tier: 'grower',  label: '🌱 Grower',  color: 'text-green-600',  next: 500  };
  return               { tier: 'seedling', label: '🌾 Seedling', color: 'text-gray-500',   next: 100  };
}
