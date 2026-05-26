import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const clientId = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SECRET;
  const env = process.env.PLAID_ENV ?? 'sandbox';

  if (!clientId || !secret) {
    return NextResponse.json({ error: 'Plaid not configured' }, { status: 500 });
  }

  const baseUrl = env === 'production'
    ? 'https://production.plaid.com'
    : env === 'development'
    ? 'https://development.plaid.com'
    : 'https://sandbox.plaid.com';

  const res = await fetch(`${baseUrl}/link/token/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      secret,
      client_name: 'villa9e',
      user: { client_user_id: user.id },
      products: ['auth', 'balance'],
      country_codes: ['US'],
      language: 'en',
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    return NextResponse.json({ error: err.error_message ?? 'Plaid error' }, { status: 500 });
  }

  const data = await res.json();
  return NextResponse.json({ link_token: data.link_token });
}
