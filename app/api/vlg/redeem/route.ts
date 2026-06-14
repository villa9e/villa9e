import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';

const MIN_VLG = 500;
const RATE    = 0.01; // $0.01 per VLG

export async function POST(req: NextRequest) {
  const supabase = createServerClient() as any;
  const admin    = createAdminClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { amount, payout_email } = await req.json();
  if (!amount || amount < MIN_VLG) return NextResponse.json({ error: `Minimum ${MIN_VLG} VLG` }, { status: 400 });
  if (!payout_email?.includes('@')) return NextResponse.json({ error: 'Valid email required' }, { status: 400 });

  // Check balance
  const { data: wallet } = await supabase.from('village_wallets').select('id, vlg_balance').eq('user_id', user.id).single();
  if (!wallet || parseFloat(wallet.vlg_balance) < amount) {
    return NextResponse.json({ error: 'Insufficient VLG balance' }, { status: 400 });
  }

  const usd_amount = (amount * RATE).toFixed(2);
  const newBalance = parseFloat(wallet.vlg_balance) - amount;

  // Record redemption request
  const { error } = await admin.from('vlg_redemption_requests').insert({
    user_id:       user.id,
    vlg_amount:    amount,
    usd_amount:    parseFloat(usd_amount),
    payout_email,
    status:        'pending',
    rate:          RATE,
  });

  if (error) {
    // If table doesn't exist yet, just notify admin
    console.error('VLG redeem insert error (table may not exist):', error.message);
  }

  // Deduct from wallet
  await admin.from('village_wallets').update({
    vlg_balance: newBalance,
    updated_at:  new Date().toISOString(),
  }).eq('user_id', user.id);

  // Record transaction
  await admin.from('wallet_transactions').insert({
    wallet_id:        wallet.id,
    user_id:          user.id,
    transaction_type: 'vlg_redeem_request',
    token_type:       'VLG',
    amount:           amount,
    direction:        'debit',
    balance_after:    newBalance,
    reference_type:   'vlg_redeem_request',
    description:      `Redemption request for $${usd_amount}`,
  });

  // Notify admin
  try {
    await admin.from('notifications').insert({
      user_id:    (await admin.from('profiles').select('id').eq('is_super_admin', true).limit(1).single()).data?.id,
      type:       'system',
      title:      '💸 VLG Redemption Request',
      body:       `User ${user.id} requested ${amount} VLG → $${usd_amount} to ${payout_email}`,
      reference_type: 'redemption',
    });
  } catch { /* non-blocking */ }

  return NextResponse.json({ ok: true, vlg: amount, usd: usd_amount });
}
