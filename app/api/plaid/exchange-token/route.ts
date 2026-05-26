import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const admin = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const clientId = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SECRET;
  const env = process.env.PLAID_ENV ?? 'sandbox';

  if (!clientId || !secret) return NextResponse.json({ error: 'Plaid not configured' }, { status: 500 });

  const { public_token } = await req.json();
  if (!public_token) return NextResponse.json({ error: 'Missing public_token' }, { status: 400 });

  const baseUrl = env === 'production' ? 'https://production.plaid.com' : 'https://sandbox.plaid.com';

  // Exchange public token for access token
  const res = await fetch(`${baseUrl}/item/public_token/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: clientId, secret, public_token }),
  });

  if (!res.ok) return NextResponse.json({ error: 'Exchange failed' }, { status: 500 });
  const { access_token, item_id } = await res.json();

  // Get institution info
  const accountsRes = await fetch(`${baseUrl}/accounts/get`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: clientId, secret, access_token }),
  });

  let institutionName = 'Connected Bank';
  if (accountsRes.ok) {
    const accountsData = await accountsRes.json();
    // Store masked account info (never store the access token directly in the main DB)
    // In production: use Supabase Vault or encrypted column
    institutionName = accountsData.accounts?.[0]?.name ?? 'Bank Account';
  }

  // Note: In production, store access_token in Supabase Vault
  // For Phase 1 sandbox: store item_id as reference
  await admin.from('profiles').update({
    stripe_customer_id: `plaid:${item_id}`, // Reusing field as placeholder
  }).eq('id', user.id);

  return NextResponse.json({ ok: true, institution: institutionName });
}
