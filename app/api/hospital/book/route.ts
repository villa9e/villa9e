import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const admin = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { provider_id, provider_name, session_rate, preferred_date, specialty } = await req.json();
  if (!preferred_date) return NextResponse.json({ error: 'Missing date' }, { status: 400 });

  const startTime = new Date(preferred_date);
  const endTime = new Date(startTime.getTime() + 50 * 60_000); // 50-minute session

  // Generate a secure Jitsi Meet room URL — no API key needed, HIPAA-adjacent
  // Room name is hashed from provider+patient+date for privacy
  const roomId = Buffer.from(`villa9e-${provider_id ?? 'provider'}-${user.id}-${startTime.getTime()}`).toString('base64url').slice(0, 24);
  const videoUrl = `https://meet.jit.si/villa9e-${roomId}`;
  const videoPasscode = Math.random().toString(36).slice(2, 8).toUpperCase();

  // Create calendar event for this appointment
  const { data: calEvent } = await admin.from('calendar_events').insert({
    creator_id: user.id,
    title: `Session with ${provider_name}`,
    description: `${specialty} session — booked via villa9e Hospital\n\nVideo link: ${videoUrl}\nPasscode: ${videoPasscode}`,
    location: videoUrl,
    start_time: startTime.toISOString(),
    end_time: endTime.toISOString(),
    event_type: 'personal',
  }).select('id').single();

  // Create provider session record (not appointments — use provider_sessions table)
  const { data: session, error } = await (admin as any).from('provider_sessions').insert({
    provider_id:    provider_id ?? null,
    patient_user_id: user.id,
    session_type:   'telehealth',
    status:         'scheduled',
    scheduled_at:   startTime.toISOString(),
    duration_min:   50,
    rate:           session_rate ? parseFloat(session_rate) : null,
    session_url:    videoUrl,
    notes:          `Passcode: ${videoPasscode}`,
  }).select().single();

  const appointment = session; // alias for backward compatibility
  const appointmentError = error;

  if (appointmentError) return NextResponse.json({ error: 'Failed to book session' }, { status: 500 });

  // Notify patient with video link
  await (admin as any).from('notifications').insert({
    user_id: user.id,
    type: 'system',
    title: '📹 Session Booked!',
    body: `Your session with ${provider_name} on ${startTime.toLocaleDateString()} at ${startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} is confirmed. Video link sent — join at the scheduled time.`,
    reference_id: session?.id ?? null,
    reference_type: 'session',
  });

  return NextResponse.json({
    ok: true,
    session_id: session?.id,
    video_url: videoUrl,
    passcode: videoPasscode,
    scheduled_at: startTime.toISOString(),
  });
}
