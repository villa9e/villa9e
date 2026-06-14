import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const admin    = createAdminClient() as any;

  const { data: { user } } = await (supabase as any).auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { reason, amount, source_id } = await req.json();
  if (!reason || !amount || amount <= 0) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { data: wallet } = await admin
    .from('village_wallets')
    .select('id, vlg_balance, total_earned_vlg')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!wallet) return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });

  const currentBalance = parseFloat(wallet.vlg_balance ?? '0') || 0;
  const currentEarned  = parseFloat(wallet.total_earned_vlg ?? '0') || 0;
  const newBalance     = currentBalance + amount;
  const newEarned      = currentEarned + amount;

  // Record the ledger entry — `wallet_tx_dedup` (user_id, transaction_type,
  // source_key) makes this idempotent: a repeat earn for the same
  // reason+source (e.g. OoWop on the same card) is silently ignored.
  const { data: txRows } = await admin
    .from('wallet_transactions')
    .upsert({
      wallet_id:        wallet.id,
      user_id:          user.id,
      transaction_type: reason,
      token_type:       'VLG',
      amount,
      direction:        'credit',
      balance_after:    newBalance,
      reference_id:     source_id && UUID_RE.test(source_id) ? source_id : null,
      reference_type:   reason,
      description:      reason.replace(/_/g, ' '),
      source_key:       source_id ?? null,
    }, { onConflict: 'user_id,transaction_type,source_key', ignoreDuplicates: true })
    .select('id');

  if (!txRows || txRows.length === 0) {
    return NextResponse.json({ ok: true, duplicate: true, amount, reason, source_id });
  }

  await admin
    .from('village_wallets')
    .update({ vlg_balance: newBalance, total_earned_vlg: newEarned, updated_at: new Date().toISOString() })
    .eq('user_id', user.id);

  await admin
    .from('profiles')
    .update({ vlg_balance: newBalance })
    .eq('id', user.id);

  return NextResponse.json({ ok: true, amount, reason, source_id, balance: newBalance });
}
