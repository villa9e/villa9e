import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', { apiVersion: '2024-04-10' });

export async function POST(req: NextRequest) {
  const supabase = createServerClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { listing_id, hours = 1 } = await req.json();
  if (!listing_id) return NextResponse.json({ error: 'Missing listing_id' }, { status: 400 });

  const { data: listing } = await supabase
    .from('trading_post_listings')
    .select('*, profiles(username, display_name)')
    .eq('id', listing_id)
    .single();

  if (!listing || !listing.hourly_rate) {
    return NextResponse.json({ error: 'Listing not found or no rate set' }, { status: 404 });
  }

  const amount = Math.round(listing.hourly_rate * hours * 100); // cents
  const platformFee = Math.round(amount * 0.015);               // 1.5% villa9e fee

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${listing.skill_offered} — @${listing.profiles?.username}`,
            description: `${hours} hour${hours > 1 ? 's' : ''} · villa9e Trading Post · 1.5% platform fee included`,
          },
          unit_amount: amount,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/village/trading-post?paid=success&listing=${listing_id}`,
      cancel_url:  `${process.env.NEXT_PUBLIC_APP_URL}/village/trading-post`,
      metadata: {
        listing_id,
        buyer_id:   user.id,
        seller_id:  listing.user_id,
        hours:      String(hours),
        platform_fee_cents: String(platformFee),
      },
    });

    // Log pending transaction
    await supabase.from('trading_post_transactions').insert({
      listing_id,
      buyer_id:       user.id,
      seller_id:      listing.user_id,
      amount_cents:   amount,
      platform_fee_cents: platformFee,
      stripe_session_id:  session.id,
      status: 'pending',
    }).catch(() => {}); // non-blocking if table doesn't exist yet

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    console.error('Stripe error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
