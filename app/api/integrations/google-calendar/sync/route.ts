import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// Syncs a calendar_events record to Google Calendar using stored OAuth token
export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { event_id } = await req.json();
  if (!event_id) return NextResponse.json({ error: 'Missing event_id' }, { status: 400 });

  // Get user's stored Google token + event details
  const [{ data: profile }, { data: event }] = await Promise.all([
    (supabase as any).from('profiles').select('avatar_config').eq('id', user.id).single(),
    (supabase as any).from('calendar_events').select('*').eq('id', event_id).single(),
  ]);

  const token = profile?.avatar_config?.gcal_access_token;
  if (!token) {
    return NextResponse.json({ error: 'not_connected', message: 'Connect Google Calendar first' }, { status: 403 });
  }

  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

  // Refresh token if expired
  let accessToken = token;
  const expiry = profile?.avatar_config?.gcal_token_expiry ?? 0;
  if (Date.now() > expiry - 60_000 && profile?.avatar_config?.gcal_refresh_token) {
    const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id:     process.env.GOOGLE_CLOUD_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET ?? '',
        refresh_token: profile.avatar_config.gcal_refresh_token,
        grant_type:    'refresh_token',
      }),
    });
    if (refreshRes.ok) {
      const refreshData = await refreshRes.json();
      accessToken = refreshData.access_token;
      // Update stored token
      await (supabase as any).from('profiles').update({
        avatar_config: {
          ...profile.avatar_config,
          gcal_access_token:  accessToken,
          gcal_token_expiry:  Date.now() + (refreshData.expires_in ?? 3600) * 1000,
        },
      }).eq('id', user.id);
    }
  }

  // Create event on Google Calendar
  const gcalEvent = {
    summary:     event.title,
    description: event.description ?? '',
    location:    event.location ?? '',
    start: {
      dateTime: event.start_time,
      timeZone: 'UTC',
    },
    end: {
      dateTime: event.end_time ?? new Date(new Date(event.start_time).getTime() + 3600000).toISOString(),
      timeZone: 'UTC',
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 30 },
        { method: 'email',  minutes: 60 },
      ],
    },
    extendedProperties: {
      private: { villa9e_event_id: event_id },
    },
  };

  const createRes = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify(gcalEvent),
  });

  if (!createRes.ok) {
    const err = await createRes.json();
    return NextResponse.json({ error: 'google_error', details: err }, { status: 400 });
  }

  const created = await createRes.json();
  return NextResponse.json({ ok: true, gcal_event_id: created.id, gcal_link: created.htmlLink });
}
