import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const supabase = createServerClient() as any;
  const admin = createAdminClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') ?? '20');
  const month = searchParams.get('month'); // YYYY-MM format

  let q = admin.from('bank_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(limit);
  if (month) {
    q = q.gte('created_at', `${month}-01`).lt('created_at', `${month}-32`);
  }
  const { data } = await q;
  return NextResponse.json({ transactions: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient() as any;
  const admin = createAdminClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const { data, error } = await admin.from('bank_transactions').insert({ user_id: user.id, ...body }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update account balance
  if (body.account_id) {
    const delta = body.direction === 'credit' ? body.amount : -body.amount;
    await admin.rpc('increment_balance', { acct_id: body.account_id, delta }).catch(() => {
      // Fallback: direct update
      admin.from('bank_accounts').select('balance').eq('id', body.account_id).single().then(({ data: acct }: any) => {
        if (acct) admin.from('bank_accounts').update({ balance: (acct.balance ?? 0) + delta, available_balance: (acct.balance ?? 0) + delta }).eq('id', body.account_id);
      });
    });
  }
  return NextResponse.json({ transaction: data });
}
