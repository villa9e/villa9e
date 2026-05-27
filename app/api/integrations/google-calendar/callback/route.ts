import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const code      = req.nextUrl.searchParams.get('code');
  const state     = req.nextUrl.searchParams.get('state') ?? '/village/spaces';
  const error_param = req.nextUrl.searchParams.get('error');

  if (error_param || !code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}${state}?gcal_error=access_denied`);
  }

  const clientId     = process.env.GOOGLE_CLOUD_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET ?? process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ?? '';
  const redirectUri  = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google-calendar/callback`;

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code, client_id: clientId, client_secret: clientSecret,
      redirect_uri: redirectUri, grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}${state}?gcal_error=token_exchange`);
  }

  const tokens = await tokenRes.json();

  // Save tokens to user's profile
  const supabase = createServerClient();
  const admin    = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user && tokens.access_token) {
    const { data: profile } = await (supabase as any)
      .from('profiles').select('avatar_config').eq('id', user.id).single();

    await (admin as any).from('profiles').update({
      avatar_config: {
        ...(profile?.avatar_config ?? {}),
        gcal_access_token:  tokens.access_token,
        gcal_refresh_token: tokens.refresh_token ?? null,
        gcal_token_expiry:  Date.now() + (tokens.expires_in ?? 3600) * 1000,
        gcal_connected:     true,
      },
    }).eq('id', user.id);
  }

  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}${state}?gcal_connected=1`);
}
