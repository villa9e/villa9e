import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// POST /api/merchant/payment/[sessionId]/confirm — auth required (customer JWT)
export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const supabase = createServerClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { sessionId } = params;
  if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });

  // Fetch the pending transaction
  const { data: tx } = await supabase
    .from('merchant_transactions')
    .select('id, merchant_id, amount, currency, vico_amount, status, merchant_accounts(payout_preference, user_id, store_name)')
    .eq('id', sessionId)
    .maybeSingle();

  if (!tx) {
    return NextResponse.json({ error: 'Payment session not found' }, { status: 404 });
  }

  if (tx.status !== 'pending') {
    return NextResponse.json({ error: `Transaction is already ${tx.status}` }, { status: 400 });
  }

  // Mark as completed
  const { error: updateError } = await supabase
    .from('merchant_transactions')
    .update({
      status:       'completed',
      customer_id:  user.id,
      completed_at: new Date().toISOString(),
    })
    .eq('id', sessionId);

  if (updateError) {
    console.error('Transaction confirm error:', updateError.message);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const merchant = tx.merchant_accounts as any;

  // If payout_preference = 'convert': log Unit BaaS intent (placeholder)
  if (merchant?.payout_preference === 'convert') {
    console.log(`[Unit BaaS] Intent to convert ${tx.vico_amount} VICO to fiat for merchant ${tx.merchant_id}. Tx: ${sessionId}`);
    // TODO: Integrate Unit BaaS conversion API here
  }

  // Send notification to merchant (non-blocking)
  try {
    await supabase.from('notifications').insert({
      user_id:   merchant?.user_id,
      type:      'merchant_payment',
      title:     'New payment received',
      body:      `You received a payment of ${tx.amount} ${tx.currency} (${tx.vico_amount} VICO)`,
      metadata:  { transaction_id: sessionId },
      read:      false,
      created_at: new Date().toISOString(),
    });
  } catch {
    // non-blocking
  }

  return NextResponse.json({
    txHash:     'mock-tx-' + Date.now(),
    receiptUrl: null,
    status:     'completed',
  });
}
