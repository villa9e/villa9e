import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { claude, CLAUDE_MODEL } from '@/lib/claude/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const supabase = createServerClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') ?? 'week';

  // Resolve merchant account
  const { data: merchant } = await supabase
    .from('merchant_accounts')
    .select('id, business_name, payout_preference, is_verified, status')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!merchant) {
    return NextResponse.json({ error: 'No merchant account found' }, { status: 404 });
  }

  // Determine date filter
  let dateFilter: string | null = null;
  const now = new Date();
  if (period === 'today') {
    const start = new Date(now); start.setHours(0, 0, 0, 0);
    dateFilter = start.toISOString();
  } else if (period === 'week') {
    const start = new Date(now); start.setDate(start.getDate() - 7);
    dateFilter = start.toISOString();
  } else if (period === 'month') {
    const start = new Date(now); start.setDate(start.getDate() - 30);
    dateFilter = start.toISOString();
  }

  // Fetch transactions
  let txQuery = supabase
    .from('merchant_transactions')
    .select('id, amount, currency, vico_amount, status, description, created_at, customer_wallet')
    .eq('merchant_id', merchant.id)
    .order('created_at', { ascending: false });

  if (dateFilter) {
    txQuery = txQuery.gte('created_at', dateFilter);
  }

  const { data: transactions } = await txQuery.limit(50);

  const txList: any[] = transactions ?? [];

  // Compute stats
  const completed = txList.filter((t: any) => t.status === 'completed');
  const totalRevenue = completed.reduce((sum: number, t: any) => sum + (t.amount ?? 0), 0);
  const totalVicoVolume = completed.reduce((sum: number, t: any) => sum + (t.vico_amount ?? 0), 0);

  const stats = {
    totalRevenue,
    totalVicoVolume,
    transactionCount:    txList.length,
    completedCount:      completed.length,
    pendingCount:        txList.filter((t: any) => t.status === 'pending').length,
    averageTransaction:  completed.length > 0 ? totalRevenue / completed.length : 0,
  };

  // Payout status
  const payoutStatus = {
    preference: merchant.payout_preference ?? 'hold',
    nextPayout: null,
    pendingBalance: totalRevenue,
  };

  // AI Insights via Spirit
  let aiInsights = '';
  if (txList.length > 0) {
    try {
      const message = await claude.messages.create({
        model:      CLAUDE_MODEL,
        max_tokens: 150,
        system:     `You are Spirit — the AI companion of villa9e. You give brief, practical merchant insights. Be warm, specific, and action-oriented. No generic advice. 2-3 sentences max. Return plain text (no JSON).`,
        messages: [{
          role: 'user',
          content: `Merchant: ${merchant.business_name}. Period: ${period}. Stats: ${completed.length} completed sales, $${totalRevenue.toFixed(2)} revenue, ${totalVicoVolume} VICO exchanged. ${stats.pendingCount} pending transactions. Give them 2-3 sentences of Spirit merchant insight and a clear next action.`,
        }],
      });
      aiInsights = message.content[0].type === 'text' ? message.content[0].text : '';
    } catch {
      aiInsights = 'Your store is active and ready for business. Keep sharing your merchant handle to bring in new customers.';
    }
  } else {
    aiInsights = `No transactions yet for this period. Share your merchant QR code or handle to start accepting payments in the village.`;
  }

  return NextResponse.json({
    stats,
    recentTransactions: txList.slice(0, 10),
    payoutStatus,
    aiInsights,
    merchant: {
      id:          merchant.id,
      storeName:   merchant.business_name,
      isVerified:  merchant.is_verified,
      isActive:    merchant.status === 'active',
    },
  });
}
