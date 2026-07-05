// Shared server-side VLG award — routes MUST use this, never write to profiles
// directly. Uses village_wallets + wallet_transactions with idempotent upsert.
import { createAdminClient } from '@/lib/supabase/server';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function awardVlg(
  userId: string,
  amount: number,
  reason: string,
  sourceId?: string
): Promise<boolean> {
  const admin = createAdminClient() as any;

  const { data: wallet } = await admin
    .from('village_wallets')
    .select('id, vlg_balance, total_earned_vlg')
    .eq('user_id', userId)
    .maybeSingle();

  if (!wallet) return false;

  const currentBalance = parseFloat(wallet.vlg_balance  ?? '0') || 0;
  const currentEarned  = parseFloat(wallet.total_earned_vlg ?? '0') || 0;
  const newBalance     = currentBalance + amount;
  const newEarned      = currentEarned + amount;

  const { data: txRows } = await admin
    .from('wallet_transactions')
    .upsert({
      wallet_id:        wallet.id,
      user_id:          userId,
      transaction_type: reason,
      token_type:       'VLG',
      amount,
      direction:        'credit',
      balance_after:    newBalance,
      reference_id:     sourceId && UUID_RE.test(sourceId) ? sourceId : null,
      reference_type:   reason,
      description:      reason.replace(/_/g, ' '),
      source_key:       sourceId ?? null,
    }, { onConflict: 'user_id,transaction_type,source_key', ignoreDuplicates: true })
    .select('id');

  if (!txRows?.length) return false; // duplicate — already awarded

  await admin.from('village_wallets').update({
    vlg_balance:     newBalance,
    total_earned_vlg: newEarned,
    updated_at:      new Date().toISOString(),
  }).eq('user_id', userId);

  await admin.from('profiles').update({ vlg_balance: newBalance }).eq('id', userId);

  return true;
}

// ── Goal-level VLG formula ───────────────────────────────────────────────────
// Level 1-5 driven by duration; difficulty multiplier = inverse of probability
// (harder goals = more VLG per step).

export function calcGoalLevel(estimatedWeeks: number | null | undefined): number {
  const w = estimatedWeeks ?? 4;
  if (w <= 2)  return 1;
  if (w <= 4)  return 2;
  if (w <= 8)  return 3;
  if (w <= 12) return 4;
  return 5;
}

export function calcVlgPerAction(
  estimatedWeeks: number | null | undefined,
  probabilityScore: number | null | undefined
): number {
  const levelMultipliers = [1.0, 1.0, 1.5, 2.0, 2.5, 3.0]; // indexed by level 0-5
  const level = calcGoalLevel(estimatedWeeks);
  const lm = levelMultipliers[level];

  const p = probabilityScore ?? 75;
  const dm = p >= 90 ? 1.0 : p >= 75 ? 1.2 : p >= 60 ? 1.5 : p >= 45 ? 1.8 : 2.0;

  return Math.max(10, Math.round(10 * lm * dm));
}

export function calcVlgTotalPotential(vlgPerAction: number, totalActions: number): number {
  return vlgPerAction * totalActions;
}
