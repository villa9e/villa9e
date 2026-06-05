import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createServerClient() as any;
  const admin = createAdminClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Ensure checking account exists
  const { data: existing } = await admin.from('bank_accounts').select('*').eq('user_id', user.id);
  if (!existing || existing.length === 0) {
    const acctNum = user.id.replace(/-/g,'').slice(0,10) + '0001';
    await admin.from('bank_accounts').insert([
      { user_id: user.id, account_type: 'checking', account_name: 'Village Checking', balance: 0, available_balance: 0, account_number: acctNum, is_primary: true },
      { user_id: user.id, account_type: 'savings', account_name: 'Village Savings', balance: 0, available_balance: 0, account_number: acctNum + '02' },
    ]);
  }

  const { data: accounts } = await admin.from('bank_accounts').select('*').eq('user_id', user.id).order('is_primary', { ascending: false });
  return NextResponse.json({ accounts: accounts ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient() as any;
  const admin = createAdminClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const acctNum = user.id.replace(/-/g,'').slice(0,10) + Math.floor(Math.random()*9000+1000);
  const { data, error } = await admin.from('bank_accounts').insert({ user_id: user.id, ...body, account_number: acctNum }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ account: data });
}
