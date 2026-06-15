import { NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { EARNINGS_RATES, CATEGORY_LABELS } from '@/lib/locker/constants';
export const dynamic = 'force-dynamic';

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function monthLabel(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

export async function GET() {
  const supabase = createServerClient() as any;
  const admin = createAdminClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let { data: prefs } = await admin.from('data_sharing_preferences').select('*').eq('user_id', user.id).maybeSingle();
  if (!prefs) {
    const { data: created } = await admin.from('data_sharing_preferences').insert({ user_id: user.id }).select().single();
    prefs = created;
  }

  const { data: earnings } = await admin
    .from('data_earnings')
    .select('amount_usd, categories_contributed, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  const rows = earnings ?? [];
  const lifetimeTotal = rows.reduce((s: number, r: any) => s + Number(r.amount_usd), 0);

  const now = new Date();
  const thisMonthKey = monthKey(now);
  const thisMonthTotal = rows
    .filter((r: any) => monthKey(new Date(r.created_at)) === thisMonthKey)
    .reduce((s: number, r: any) => s + Number(r.amount_usd), 0);

  // Last 12 months, oldest first
  const monthly: { month: string; amount: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = monthKey(d);
    const amount = rows
      .filter((r: any) => monthKey(new Date(r.created_at)) === key)
      .reduce((s: number, r: any) => s + Number(r.amount_usd), 0);
    monthly.push({ month: monthLabel(d), amount });
  }

  const categories = Object.entries(EARNINGS_RATES).map(([key, rate]) => ({
    name: CATEGORY_LABELS[key],
    shared: !!prefs?.[key],
    monthly: prefs?.[key] ? rate : 0,
  }));
  const estimatedMonthly = categories.reduce((s, c) => s + c.monthly, 0);

  return NextResponse.json({
    lifetimeTotal,
    thisMonthTotal,
    estimatedMonthly,
    monthly,
    categories,
    payoutPreference: prefs?.payout_preference ?? 'usd',
  });
}
