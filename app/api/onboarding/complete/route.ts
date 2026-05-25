import { NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';

export async function POST() {
  const supabase = createServerClient();
  const admin    = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Check if onboarding already complete (prevent double awards)
  const { data: profile } = await supabase.from('profiles').select('onboarding_complete').eq('id', user.id).single();
  if (profile?.onboarding_complete) return NextResponse.json({ alreadyComplete: true });

  // Mark complete
  await admin.from('profiles').update({ onboarding_complete: true, onboarding_step: 99 }).eq('id', user.id);

  // Check founding villager
  const { data: counter } = await admin.from('founding_villager_counter').select('count,max_count').eq('id', 1).single();
  let isFoundingVillager = false;
  if (counter && counter.count < counter.max_count) {
    const newCount = counter.count + 1;
    await admin.from('founding_villager_counter').update({ count: newCount, updated_at: new Date().toISOString() }).eq('id', 1);
    await admin.from('profiles').update({
      is_founding_villager: true,
      founding_villager_number: newCount,
      village_score: 100,
      score_tier: 'grower',
    }).eq('id', user.id);
    isFoundingVillager = true;
  }

  // Award onboarding bonus
  await admin.rpc('award_village_score', {
    p_user_id:      user.id,
    p_points:       isFoundingVillager ? 0 : 10,
    p_vlg:          50,
    p_reason:       'COMPLETE_ONBOARDING',
    p_reference_id: null,
  });

  return NextResponse.json({ ok: true, isFoundingVillager });
}
