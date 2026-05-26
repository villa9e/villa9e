import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// Stripe sends events here — verify signature and update DB
export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const body = await req.text();
  const sig  = req.headers.get('stripe-signature') ?? '';

  // Verify Stripe signature
  if (webhookSecret) {
    try {
      const { createHmac } = await import('crypto');
      const elements  = sig.split(',').reduce((acc: Record<string,string>, el) => {
        const [k, v] = el.split('=');
        acc[k] = v;
        return acc;
      }, {});
      const timestamp = elements['t'];
      const payload   = `${timestamp}.${body}`;
      const expected  = createHmac('sha256', webhookSecret).update(payload).digest('hex');
      const received  = elements['v1'];
      if (expected !== received) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    } catch {
      return NextResponse.json({ error: 'Signature error' }, { status: 401 });
    }
  }

  const event = JSON.parse(body);
  const admin = createAdminClient();

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const campaignId  = session.metadata?.campaign_id;
    const backerId    = session.metadata?.backer_id;
    const ownerId     = session.metadata?.campaign_owner_id;
    const amountPaid  = (session.amount_total ?? 0) / 100;

    if (campaignId && backerId) {
      // Update campaign totals
      const { data: campaign } = await admin
        .from('crowdfunding_campaigns')
        .select('raised_amount, backer_count')
        .eq('id', campaignId)
        .single();

      if (campaign) {
        await admin.from('crowdfunding_campaigns').update({
          raised_amount: (campaign.raised_amount ?? 0) + amountPaid,
          backer_count: (campaign.backer_count ?? 0) + 1,
        }).eq('id', campaignId);
      }

      // Confirm the contribution record
      await (admin as any).from('crowdfunding_contributions').update({
        stripe_charge_id: session.payment_intent,
      }).eq('stripe_charge_id', session.id);

      // Award VLG to backer for supporting
      await admin.rpc('award_village_score', {
        p_user_id: backerId,
        p_points: 5,
        p_vlg: 15,
        p_reason: 'CROWDFUND_CONTRIBUTION',
        p_reference_id: campaignId,
      });

      // Notify campaign owner
      if (ownerId) {
        await admin.from('notifications').insert({
          user_id: ownerId,
          type: 'deal',
          title: `💰 New backer! $${amountPaid.toFixed(2)} received`,
          body: `Someone just backed your campaign. Keep sharing!`,
          reference_id: campaignId,
          reference_type: 'crowdfunding_campaign',
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
