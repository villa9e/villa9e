import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';

// Create a Stripe Checkout session for a crowdfunding contribution
export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const admin    = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });

  const { campaign_id, amount_cents } = await req.json();
  if (!campaign_id || !amount_cents || amount_cents < 100) {
    return NextResponse.json({ error: 'Invalid amount (minimum $1)' }, { status: 400 });
  }

  const { data: campaign } = await admin.from('crowdfunding_campaigns').select('title, user_id').eq('id', campaign_id).single();
  if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

  const { data: profile } = await supabase.from('profiles').select('email').eq('id', user.id).single();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://villa9e.app';

  // Create Stripe Checkout session
  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      'mode': 'payment',
      'line_items[0][price_data][currency]': 'usd',
      'line_items[0][price_data][unit_amount]': String(amount_cents),
      'line_items[0][price_data][product_data][name]': `Back: ${campaign.title}`,
      'line_items[0][price_data][product_data][description]': 'villa9e Crowdfunding — 0% platform fee',
      'line_items[0][quantity]': '1',
      'customer_email': profile?.email ?? '',
      'metadata[campaign_id]': campaign_id,
      'metadata[backer_id]': user.id,
      'metadata[campaign_owner_id]': campaign.user_id,
      'success_url': `${appUrl}/village/bank/crowdfunding?success=1&campaign=${campaign_id}`,
      'cancel_url': `${appUrl}/village/bank/crowdfunding`,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    return NextResponse.json({ error: err.error?.message ?? 'Stripe error' }, { status: 500 });
  }

  const session = await res.json();

  // Pre-create contribution record (will be confirmed via webhook)
  await (admin as any).from('crowdfunding_contributions').insert({
    campaign_id,
    backer_id: user.id,
    amount: amount_cents / 100,
    currency: 'USD',
    stripe_charge_id: session.id,
  });

  return NextResponse.json({ checkout_url: session.url });
}
