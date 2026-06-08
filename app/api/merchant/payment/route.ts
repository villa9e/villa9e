import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// POST /api/merchant/payment — public endpoint to initiate a payment session
export async function POST(req: NextRequest) {
  const supabase = createServerClient() as any;

  const body = await req.json();
  const { merchantHandle, amount, currency, description, customerWallet } = body;

  if (!merchantHandle || !amount || !currency) {
    return NextResponse.json({ error: 'Missing required fields: merchantHandle, amount, currency' }, { status: 400 });
  }

  if (typeof amount !== 'number' || amount <= 0) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
  }

  // Look up merchant by handle
  const { data: merchant } = await supabase
    .from('merchant_accounts')
    .select('id, business_name, status, is_verified, user_id')
    .ilike('merchant_handle', merchantHandle)
    .maybeSingle();

  if (!merchant) {
    return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
  }

  if (merchant.status !== 'active') {
    return NextResponse.json({ error: 'Merchant account is not active' }, { status: 400 });
  }

  // VICO conversion rate: 1 VICO = $0.01 (placeholder)
  const vicoAmount = Math.round(amount * 100);

  // Create payment session (pending transaction)
  const { data: tx, error } = await supabase
    .from('merchant_transactions')
    .insert({
      merchant_id:      merchant.id,
      amount:           amount,
      currency:         currency.toUpperCase(),
      vico_amount:      vicoAmount,
      description:      description ?? null,
      customer_wallet:  customerWallet ?? null,
      status:           'pending',
      created_at:       new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    console.error('Payment session error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    paymentSessionId: tx.id,
    vicoAmount,
    merchantName:     merchant.business_name,
    merchantVerified: merchant.is_verified,
  });
}
