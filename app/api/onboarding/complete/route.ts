import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { sendEmail, welcomeEmail } from '@/lib/email/send';

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const admin    = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Read optional referrer from body
  const body = await req.json().catch(() => ({}));
  const referrerUsername = body?.referrer ?? null;

  // Check if onboarding already complete (prevent double awards)
  const { data: profile } = await supabase.from('profiles').select('onboarding_complete').eq('id', user.id).single();
  if (profile?.onboarding_complete) return NextResponse.json({ alreadyComplete: true });

  // Mark complete
  await admin.from('profiles').update({ onboarding_complete: true, onboarding_step: 99 }).eq('id', user.id);

  // Record referral if referred by someone
  if (referrerUsername) {
    const { data: referrer } = await admin.from('profiles').select('id').eq('username', referrerUsername).single();
    if (referrer) {
      const { error: refError } = await (admin as any).from('referrals').insert({
        referrer_id: referrer.id,
        referred_id: user.id,
        vlg_awarded: false,
      });

      if (!refError) {
        // Award both sides
        await Promise.all([
          admin.rpc('award_village_score', {
            p_user_id: referrer.id, p_points: 15, p_vlg: 100, p_reason: 'REFER_VILLAGER', p_reference_id: user.id,
          }),
          admin.rpc('award_village_score', {
            p_user_id: user.id, p_points: 10, p_vlg: 100, p_reason: 'JOIN_VIA_REFERRAL', p_reference_id: referrer.id,
          }),
        ]);
        await (admin as any).from('referrals').update({ vlg_awarded: true }).eq('referred_id', user.id);

        // Notify referrer
        await admin.from('notifications').insert({
          user_id: referrer.id,
          type: 'referral',
          title: 'A new villager joined! 👥',
          body: `Someone joined via your referral link. You earned +100 $VLG!`,
          reference_type: 'referral',
        });
      }
    }
  }

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

  // Send welcome email
  const { data: userRecord } = await admin.auth.admin.getUserById(user.id);
  const { data: welcomeProfile } = await admin.from('profiles').select('username, founding_villager_number').eq('id', user.id).single();
  if (userRecord?.user?.email && welcomeProfile?.username) {
    await sendEmail({
      to: userRecord.user.email,
      subject: isFoundingVillager ? `👑 Welcome to villa9e, Founding Villager #${welcomeProfile.founding_villager_number}!` : 'Welcome to villa9e — Your village is ready',
      html: welcomeEmail(welcomeProfile.username, isFoundingVillager, welcomeProfile.founding_villager_number ?? undefined),
    });
  }

  return NextResponse.json({ ok: true, isFoundingVillager });
}
