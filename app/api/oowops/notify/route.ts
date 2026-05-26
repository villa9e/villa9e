import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// Called by Supabase webhook or directly after OoWop insert
export async function POST(req: NextRequest) {
  const admin = createAdminClient();
  const { post_id, giver_id, receiver_id, step_id, oowop_count } = await req.json();

  // Notify the receiver
  const { data: giver } = await admin.from('profiles').select('username').eq('id', giver_id).single();
  const giverName = giver?.username ?? 'A villager';

  await admin.from('notifications').insert({
    user_id:        receiver_id,
    type:           'oowop',
    title:          `${giverName} OoWop'd you! ✊`,
    body:           oowop_count >= 3 ? 'Your step is validated — the village believes in you! 🔥' : `${oowop_count}/3 OoWops — keep going!`,
    reference_id:   post_id ?? step_id,
    reference_type: step_id ? 'goal_step' : 'dream_line_post',
  });

  // If step validated (3 OoWops), also award the receiver
  if (oowop_count >= 3 && step_id) {
    await admin.rpc('award_village_score', {
      p_user_id:      receiver_id,
      p_points:       10,
      p_vlg:          30,
      p_reason:       'STEP_VALIDATED',
      p_reference_id: step_id,
    });
  } else {
    // Award per-OoWop received
    await admin.rpc('award_village_score', {
      p_user_id:      receiver_id,
      p_points:       3,
      p_vlg:          10,
      p_reason:       'RECEIVE_OOWOP',
      p_reference_id: post_id,
    });
  }

  return NextResponse.json({ ok: true });
}
