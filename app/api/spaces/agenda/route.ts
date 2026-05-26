import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { callClaude } from '@/lib/claude/client';

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { event } = await req.json();

  const start = new Date(event.start_time);
  const end = event.end_time ? new Date(event.end_time) : new Date(start.getTime() + 3600000);
  const durationMins = Math.round((end.getTime() - start.getTime()) / 60000);

  const prompt = `Create a concise, practical agenda for this event.

Event: "${event.title}"
Type: ${event.event_type}
Duration: ${durationMins} minutes
Location: ${event.location || 'TBD'}
Notes: ${event.description || 'None'}

Format as a time-blocked agenda with short action items. Use plain text with timestamps like:
0:00 - Opening / Welcome
0:05 - Agenda item
...

Keep it under 10 items. Make it specific to the event type and title. Return plain text only.`;

  const result = await callClaude(prompt, { returnRaw: true, system: 'You are an expert meeting facilitator and event planner. Create clear, time-blocked agendas. Return plain text only — no JSON, no markdown formatting.' });
  return NextResponse.json({ agenda: result });
}
