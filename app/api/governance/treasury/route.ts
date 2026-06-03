import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const MOCK_TREASURY = {
  totalBalance: 250000,
  allocations: [
    { id: 'mock-t1', category: 'Community Development', amount: 75000, percentage: 30, description: 'Funding community features, events, and village infrastructure' },
    { id: 'mock-t2', category: 'Creator Rewards',       amount: 62500, percentage: 25, description: 'Weekly creator and contributor rewards pool' },
    { id: 'mock-t3', category: 'Grants & Proposals',    amount: 50000, percentage: 20, description: 'Funded community governance proposals' },
    { id: 'mock-t4', category: 'Emergency Reserve',     amount: 37500, percentage: 15, description: 'Emergency fund and protocol stability reserves' },
    { id: 'mock-t5', category: 'Development',           amount: 25000, percentage: 10, description: 'Platform development and infrastructure costs' },
  ],
  lastUpdated: new Date().toISOString(),
};

export async function GET(req: NextRequest) {
  const supabase = createServerClient() as any;

  const { data: allocations, error } = await supabase
    .from('vico_treasury_allocations')
    .select('*')
    .order('amount', { ascending: false });

  // Fall back to mock if table missing or empty
  if (error || !allocations || allocations.length === 0) {
    return NextResponse.json({
      ...MOCK_TREASURY,
      isMock: true,
    });
  }

  const totalBalance = allocations.reduce((sum: number, a: any) => sum + (a.amount ?? 0), 0);

  const enriched = allocations.map((a: any) => ({
    ...a,
    percentage: totalBalance > 0 ? Math.round((a.amount / totalBalance) * 100) : 0,
  }));

  return NextResponse.json({
    totalBalance,
    allocations: enriched,
    lastUpdated: new Date().toISOString(),
    isMock:      false,
  });
}
