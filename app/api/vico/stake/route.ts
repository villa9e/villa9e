import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// POST /api/vico/stake — { action: 'stake' | 'unstake', amount: number }
export async function POST(req: NextRequest) {
  const supabase = createServerClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { action, amount } = await req.json();
  if (!['stake', 'unstake'].includes(action)) {
    return NextResponse.json({ error: "action must be 'stake' or 'unstake'" }, { status: 400 });
  }
  const amt = Number(amount);
  if (!amt || amt <= 0) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
  }

  const { error } = await supabase.rpc('vico_stake', { p_amount: amt, p_action: action });
  if (error) {
    const message = error.message === 'insufficient balance'
      ? `Insufficient ${action === 'stake' ? '$VICO balance' : 'staked $VICO'} for this ${action}`
      : error.message;
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const admin = createAdminClient() as any;
  const { data: wallet } = await admin
    .from('village_wallets')
    .select('vico_balance, vico_staked')
    .eq('user_id', user.id)
    .maybeSingle();

  return NextResponse.json({
    success: true,
    vico_balance: Number(wallet?.vico_balance ?? 0),
    vico_staked: Number(wallet?.vico_staked ?? 0),
  });
}
