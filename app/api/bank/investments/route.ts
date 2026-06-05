import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';

// Static price map for demo (real would use Alpaca/CoinGecko APIs)
const PRICES: Record<string, number> = {
  AAPL: 189.50, NVDA: 875.30, MSFT: 415.20, GOOGL: 178.40, TSLA: 245.10,
  BTC: 67500, ETH: 3800, SOL: 185, MATIC: 0.82,
};

export async function GET() {
  const supabase = createServerClient() as any;
  const admin = createAdminClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [{ data: holdings }, { data: watchlist }] = await Promise.all([
    admin.from('investments').select('*').eq('user_id', user.id),
    admin.from('investment_watchlist').select('*').eq('user_id', user.id),
  ]);

  // Enrich with current prices
  const enriched = (holdings ?? []).map((h: any) => ({
    ...h,
    current_price: PRICES[h.ticker] ?? h.current_price ?? 0,
    current_value: (PRICES[h.ticker] ?? h.current_price ?? 0) * h.quantity,
    gain_loss: ((PRICES[h.ticker] ?? h.current_price ?? 0) - h.avg_cost) * h.quantity,
    gain_loss_pct: h.avg_cost > 0 ? (((PRICES[h.ticker] ?? h.current_price ?? 0) - h.avg_cost) / h.avg_cost) * 100 : 0,
  }));

  const portfolioValue = enriched.reduce((s: number, h: any) => s + h.current_value, 0);

  return NextResponse.json({ holdings: enriched, watchlist: watchlist ?? [], portfolioValue });
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient() as any;
  const admin = createAdminClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { action, ticker, name, quantity, asset_type = 'stock' } = await req.json();
  const price = PRICES[ticker] ?? 100;

  if (action === 'watchlist_add') {
    await admin.from('investment_watchlist').upsert({ user_id: user.id, ticker, name, asset_type });
    return NextResponse.json({ success: true });
  }
  if (action === 'watchlist_remove') {
    await admin.from('investment_watchlist').delete().eq('user_id', user.id).eq('ticker', ticker);
    return NextResponse.json({ success: true });
  }
  if (action === 'buy') {
    const cost = price * quantity;
    // Check balance
    const { data: acct } = await admin.from('bank_accounts').select('balance, id').eq('user_id', user.id).eq('is_primary', true).single();
    if (!acct || acct.balance < cost) return NextResponse.json({ error: 'Insufficient funds' }, { status: 400 });

    // Upsert holding
    const { data: existing } = await admin.from('investments').select('*').eq('user_id', user.id).eq('ticker', ticker).maybeSingle();
    if (existing) {
      const newQty = existing.quantity + quantity;
      const newAvg = ((existing.avg_cost * existing.quantity) + (price * quantity)) / newQty;
      await admin.from('investments').update({ quantity: newQty, avg_cost: newAvg, current_price: price }).eq('id', existing.id);
    } else {
      await admin.from('investments').insert({ user_id: user.id, ticker, name, quantity, avg_cost: price, current_price: price, asset_type });
    }

    // Deduct from bank
    await admin.from('bank_accounts').update({ balance: acct.balance - cost, available_balance: acct.balance - cost }).eq('id', acct.id);
    await admin.from('bank_transactions').insert({ user_id: user.id, account_id: acct.id, transaction_type: 'payment', category: 'Investment', merchant_name: ticker, description: `Buy ${quantity} ${ticker} @ $${price}`, amount: cost, direction: 'debit', status: 'posted', method: 'internal' });

    return NextResponse.json({ success: true, cost });
  }
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
