import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { storeMemory } from '@/lib/claude/spirit';

export async function POST(req: NextRequest) {
  const admin = createAdminClient();
  const { post_id, giver_id, receiver_id, step_id, oowop_count } = await req.json();

  // Fetch giver's score multiplier — Platinum holders give 1.25× weighted OoWops
  const { data: giver } = await admin
    .from('profiles')
    .select('username, score_multiplier, score_tier')
    .eq('id', giver_id)
    .single();

  const giverName   = giver?.username ?? 'A villager';
  const rawWeight   = parseFloat(giver?.score_multiplier ?? '1.0');
  // Platinum = score_multiplier >= 1.25 (set by score tier logic)
  const giverWeight = rawWeight >= 1.25 ? 1.25 : 1.0;
  const isPlatinum  = giverWeight > 1.0;

  // Weighted OoWop count: for threshold purposes, 1 Platinum OoWop = 1.25 OoWops
  const weightedCount = Math.floor(oowop_count + (isPlatinum ? 0.25 : 0));

  // Notification
  await admin.from('notifications').insert({
    user_id:        receiver_id,
    type:           'oowop',
    title:          `${giverName}${isPlatinum ? ' 👑' : ''} OoWop'd you! ✊`,
    body:           oowop_count >= 3
      ? 'Your step is validated — the village believes in you! 🔥'
      : `${oowop_count}/3 OoWops${isPlatinum ? ' (Platinum weight ✦)' : ''} — keep going!`,
    reference_id:   post_id ?? step_id,
    reference_type: step_id ? 'goal_step' : 'dream_line_post',
  });

  // Award based on validated or per-OoWop
  if (weightedCount >= 3 && step_id) {
    await admin.rpc('award_village_score', {
      p_user_id: receiver_id, p_points: 10, p_vlg: 30,
      p_reason: 'STEP_VALIDATED', p_reference_id: step_id,
    });
    // Store Spirit memory for the receiver
    storeMemory(
      receiver_id,
      'oowop_received',
      `Step validated with ${oowop_count} OoWops${isPlatinum ? ' including a Platinum OoWop' : ''}`,
      { post_id, step_id, oowop_count, platinum: isPlatinum },
      8
    ).catch(() => {});
  } else {
    // Per-OoWop award — Platinum givers award slightly more
    const vlgAward = isPlatinum ? 13 : 10;
    await admin.rpc('award_village_score', {
      p_user_id: receiver_id, p_points: 3, p_vlg: vlgAward,
      p_reason: 'RECEIVE_OOWOP', p_reference_id: post_id,
    });
  }

  // Award giver for giving
  await admin.rpc('award_village_score', {
    p_user_id: giver_id, p_points: 1, p_vlg: 5,
    p_reason: 'GIVE_OOWOP', p_reference_id: post_id ?? step_id,
  }).catch(() => {});

  // Push notification
  fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/push/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      external_user_ids: [receiver_id],
      title: `${giverName} OoWop'd you! ✊`,
      body: oowop_count >= 3
        ? 'Your step is validated — the village believes in you! 🔥'
        : `${oowop_count}/3 OoWops — keep going!`,
      url: step_id ? '/village/workshop' : '/village/dreamline',
    }),
  }).catch(() => {});

  return NextResponse.json({ ok: true, giver_weight: giverWeight });
}
