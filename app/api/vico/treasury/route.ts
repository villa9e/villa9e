import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { TRANSACTION_TYPE_LABELS } from '@/lib/vico/constants';

export const dynamic = 'force-dynamic';

const ALLOC_COLORS = ['#534AB7', '#1D9E75', '#BA7517', '#0A6FA8', '#C0392B', '#7F77DD'];

// GET /api/vico/treasury
export async function GET() {
  const admin = createAdminClient() as any;

  const [{ data: config }, { data: txns }] = await Promise.all([
    admin.from('vico_supply_config').select('*').eq('id', 1).maybeSingle(),
    admin.from('vico_treasury_transactions').select('*').order('created_at', { ascending: false }).limit(20),
  ]);

  const totalSupply   = Number(config?.total_supply ?? 33000000);
  const burned        = Number(config?.burned ?? 0);
  const communityPool = Number(config?.community_pool ?? 0);
  const priceUsd      = Number(config?.price_usd ?? 0.08);

  const netByType = new Map<string, number>();
  for (const t of txns ?? []) {
    const delta = t.direction === 'in' ? Number(t.amount) : -Number(t.amount);
    netByType.set(t.transaction_type, (netByType.get(t.transaction_type) ?? 0) + delta);
  }

  const buckets: { label: string; amount: number }[] = [
    { label: 'Community Pool', amount: communityPool },
  ];
  for (const [type, net] of netByType.entries()) {
    if (net > 0) buckets.push({ label: TRANSACTION_TYPE_LABELS[type] ?? type, amount: net });
  }

  const total = buckets.reduce((sum, b) => sum + b.amount, 0);
  const allocations = buckets.map((b, i) => ({
    label: b.label,
    amount: Math.round(b.amount),
    pct: total > 0 ? Math.round((b.amount / total) * 1000) / 10 : 0,
    color: ALLOC_COLORS[i % ALLOC_COLORS.length],
  }));

  const supply = {
    total: totalSupply,
    circulating: Math.max(totalSupply - burned - communityPool, 0),
    burned,
    community_pool: communityPool,
    price_usd: priceUsd,
  };

  return NextResponse.json({
    total_treasury: Math.round(total),
    total_treasury_usd: Math.round(total * priceUsd),
    allocations,
    transactions: txns ?? [],
    supply,
  });
}
