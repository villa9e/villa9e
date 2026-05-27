import { createAdminClient } from '@/lib/supabase/server';

/**
 * Check and award any newly-earned achievements for a user.
 * Call after any significant action (goal complete, OoWop given, check-in, etc.)
 * Returns array of newly-awarded achievement IDs.
 */
export async function checkAndAwardAchievements(userId: string): Promise<string[]> {
  const db = createAdminClient() as any;
  const awarded: string[] = [];

  // Load what the user already has
  const { data: existing } = await db
    .from('user_achievements')
    .select('achievement_id')
    .eq('user_id', userId);
  const have = new Set((existing ?? []).map((r: any) => r.achievement_id));

  async function award(id: string) {
    if (have.has(id)) return;
    const { error } = await db.from('user_achievements').insert({ user_id: userId, achievement_id: id });
    if (!error) {
      awarded.push(id);
      // Fetch points for this achievement and add to village score
      const { data: ach } = await db.from('achievements').select('points').eq('id', id).single();
      if (ach?.points) {
        await db.rpc('award_village_score', { p_user_id: userId, p_points: ach.points, p_reason: `Achievement: ${id}` });
      }
    }
  }

  // Parallel stats fetch
  const [
    { count: goalCount },
    { count: completedGoals },
    { count: oowopCount },
    { count: referralCount },
    { count: tribeCount },
    { count: spiritCount },
    { count: sprintCount },
    { data: profile },
  ] = await Promise.all([
    db.from('goals').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    db.from('goals').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'completed'),
    db.from('oowops').select('id', { count: 'exact', head: true }).eq('giver_id', userId),
    db.from('referrals').select('id', { count: 'exact', head: true }).eq('referrer_id', userId),
    db.from('tribe_members').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    db.from('spirit_memories').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('memory_type', 'conversation'),
    db.from('sprints').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'completed'),
    db.from('profiles').select('checkin_streak, longest_streak, personality_type, is_founding_villager').eq('id', userId).single(),
  ]);

  const g  = goalCount      ?? 0;
  const gc = completedGoals ?? 0;
  const o  = oowopCount     ?? 0;
  const r  = referralCount  ?? 0;
  const t  = tribeCount     ?? 0;
  const s  = spiritCount    ?? 0;
  const sp = sprintCount    ?? 0;
  const streak = profile?.checkin_streak ?? 0;

  // Goals
  if (g  >= 1)  await award('first_goal');
  if (g  >= 10) await award('goals_10');
  if (gc >= 1)  await award('first_complete');
  if (gc >= 3)  await award('goals_3_done');

  // Streaks
  if (streak >= 1)  await award('first_checkin');
  if (streak >= 3)  await award('streak_3');
  if (streak >= 7)  await award('streak_7');
  if (streak >= 30) await award('streak_30');
  if (streak >= 100) await award('streak_100');

  // OoWops
  if (o >= 1)   await award('first_oowop');
  if (o >= 10)  await award('oowop_10');
  if (o >= 50)  await award('oowop_50');
  if (o >= 100) await award('oowop_100');

  // Referrals
  if (r >= 1)  await award('first_referral');
  if (r >= 5)  await award('referral_5');
  if (r >= 10) await award('referral_10');

  // Community
  if (t >= 1) await award('first_tribe');

  // Spirit
  if (s >= 10) await award('spirit_10');
  if (profile?.personality_type) await award('archetype_set');

  // Sprints
  if (sp >= 1) await award('first_sprint');
  if (sp >= 4) await award('sprint_streak_4');

  // Special
  if (profile?.is_founding_villager) await award('founding');

  return awarded;
}
