// Shared helper — resolve a user's current GPS Sprint Action (if any).
// Used to attach action context + mission scoring to content feeds outside
// the main Workshop feed (e.g. Skill Stream).
import type { SupabaseClient } from '@supabase/supabase-js';

export interface CurrentAction {
  goalId: string;
  goalTitle?: string;
  goalCategory?: string;
  sprintNumber: number;
  sprintTitle: string;
  actionTitle: string;
  actionDescription?: string;
}

export async function getCurrentAction(supabase: SupabaseClient, userId: string): Promise<CurrentAction | null> {
  const { data: goals } = await (supabase as any)
    .from('goals')
    .select('id, title, category')
    .eq('user_id', userId).eq('status', 'active')
    .order('created_at', { ascending: false }).limit(1)
    .then((r: any) => r).catch(() => ({ data: [] }));

  const primaryGoal = goals?.[0];
  if (!primaryGoal) return null;

  const { data: sp } = await (supabase as any)
    .from('sprints')
    .select('id, title, sprint_actions(id, title, description, completed, order_index)')
    .eq('goal_id', primaryGoal.id)
    .order('created_at', { ascending: true })
    .then((r: any) => r).catch(() => ({ data: [] }));

  let current: { sprintNumber: number; sprintTitle: string; title: string; description?: string } | null = null;
  (sp ?? []).forEach((s: any, i: number) => {
    if (current) return;
    const action = (s.sprint_actions ?? [])
      .slice().sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0))
      .find((a: any) => !a.completed);
    if (action) current = { sprintNumber: i + 1, sprintTitle: s.title, title: action.title, description: action.description };
  });

  if (!current) {
    const { data: steps } = await (supabase as any)
      .from('goal_steps')
      .select('title, status, step_number, week_number, description')
      .eq('goal_id', primaryGoal.id).order('step_number', { ascending: true })
      .then((r: any) => r).catch(() => ({ data: [] }));
    const action = (steps ?? []).find((st: any) => st.status !== 'completed');
    if (action) current = { sprintNumber: action.week_number ?? 1, sprintTitle: `Sprint ${action.week_number ?? 1}`, title: action.title, description: action.description };
  }

  if (!current) return null;

  return {
    goalId: primaryGoal.id, goalTitle: primaryGoal.title, goalCategory: primaryGoal.category,
    sprintNumber: current.sprintNumber, sprintTitle: current.sprintTitle,
    actionTitle: current.title, actionDescription: current.description,
  };
}
