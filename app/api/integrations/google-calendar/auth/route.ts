import { NextRequest, NextResponse } from 'next/server';

// Redirects user to Google OAuth for Calendar scope
// After consent, Google redirects to /api/integrations/google-calendar/callback
export async function GET(req: NextRequest) {
  const clientId    = process.env.GOOGLE_CLOUD_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google-calendar/callback`;

  if (!clientId) return NextResponse.json({ error: 'Google OAuth not configured' }, { status: 500 });

  const params = new URLSearchParams({
    client_id:    clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email',
      'openid',
    ].join(' '),
    access_type:   'offline',
    prompt:        'consent',
    state:         req.nextUrl.searchParams.get('return_to') ?? '/village/spaces',
  });

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
