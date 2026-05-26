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

  // Create calendar event for this appointment
  const { data: calEvent } = await admin.from('calendar_events').insert({
    creator_id: user.id,
    title: `Session with ${provider_name}`,
    description: `${specialty} session — booked via villa9e Hospital`,
    start_time: startTime.toISOString(),
    end_time: endTime.toISOString(),
    event_type: 'personal',
  }).select('id').single();

  // Create appointment record
  const { data: appointment, error } = await admin.from('appointments').insert({
    patient_id: user.id,
    provider_id: provider_id ?? null,
    calendar_event_id: calEvent?.id ?? null,
    appointment_type: 'video',
    session_topic: specialty,
    session_rate: session_rate ? parseFloat(session_rate) : null,
    status: 'scheduled',
  }).select().single();

  if (error) return NextResponse.json({ error: 'Failed to book appointment' }, { status: 500 });

  // Notify user
  await admin.from('notifications').insert({
    user_id: user.id,
    type: 'system',
    title: 'Appointment Requested!',
    body: `Your session with ${provider_name} on ${startTime.toLocaleDateString()} has been requested. You will be contacted with confirmation.`,
    reference_id: appointment.id,
    reference_type: 'appointment',
  });

  return NextResponse.json({ ok: true, appointment_id: appointment.id });
}
