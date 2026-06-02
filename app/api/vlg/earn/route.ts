import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const admin    = createAdminClient() as any;

  const { data: { user } } = await (supabase as any).auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { reason, amount, source_id } = await req.json();
  if (!reason || !amount || amount <= 0) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Insert VLG transaction
  const { error: txError } = await admin.from('vlg_transactions').insert({
    user_id:   user.id,
    amount,
    reason,
    source_id: source_id ?? null,
  });

  if (txError) {
    // Try wallet_transactions table as fallback (used by existing VLG code)
    await admin.from('wallet_transactions').insert({
      user_id:    user.id,
      amount,
      token_type: 'VLG',
      direction:  'credit',
      reason,
    }).catch(() => {});
  }

  // Update profiles.vlg_balance (increment by amount)
  const { data: profile } = await admin
    .from('profiles')
    .select('vlg_balance')
    .eq('id', user.id)
    .maybeSingle();

  const currentBalance = parseFloat(profile?.vlg_balance ?? '0') || 0;
  await admin
    .from('profiles')
    .update({ vlg_balance: currentBalance + amount })
    .eq('id', user.id)
    .catch(() => {});

  // Also try village_wallets if it exists
  const { data: wallet } = await admin
    .from('village_wallets')
    .select('vlg_balance')
    .eq('user_id', user.id)
    .maybeSingle();

  if (wallet !== null && wallet !== undefined) {
    const walletBalance = parseFloat(wallet?.vlg_balance ?? '0') || 0;
    await admin
      .from('village_wallets')
      .update({ vlg_balance: walletBalance + amount })
      .eq('user_id', user.id)
      .catch(() => {});
  }

  return NextResponse.json({ ok: true, amount, reason, source_id });
}
