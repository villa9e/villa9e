// Spaces — AI Trigger adjustment (PLATFORM_SPEC §Spaces: "AI dynamically
// adjusts Trigger based on daily wellness data"). Given the energy
// type/duration a calendar event was scheduled with, checks today's
// wellness_logs (mood/energy/stress/focus/readiness) and lets Spirit
// suggest an adjusted profile + duration with a short reason. Falls back
// to the scheduled values unchanged if there's no wellness data today or
// the model response can't be parsed.
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { claude, CLAUDE_MODEL } from '@/lib/claude/client';

const ENERGY_TYPES = ['high', 'focused', 'creative', 'energize', 'calm'] as const;
type EnergyType = typeof ENERGY_TYPES[number];

async function getUser(req: NextRequest) {
  const supabase = createServerClient() as any;
  const { data: { user: cookieUser } } = await supabase.auth.getUser();
  if (cookieUser) return cookieUser;
  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const { data: { user: tokenUser } } = await supabase.auth.getUser(authHeader.slice(7));
    if (tokenUser) return tokenUser;
  }
  return null;
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient() as any;
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const scheduledEnergy: EnergyType = ENERGY_TYPES.includes(body.energyType) ? body.energyType : 'focused';
  const scheduledDuration: number = Number.isFinite(body.durationMin) ? body.durationMin : 10;
  const eventTitle: string = typeof body.eventTitle === 'string' ? body.eventTitle.slice(0, 120) : 'this event';

  const fallback = { adjusted: false, energyType: scheduledEnergy, durationMin: scheduledDuration, reason: null };

  const today = new Date().toISOString().split('T')[0];
  const { data: log } = await supabase
    .from('wellness_logs')
    .select('mood,energy,stress,focus,readiness')
    .eq('user_id', user.id)
    .eq('log_date', today)
    .single();

  // No wellness data logged today — nothing to adjust against.
  if (!log || (!log.mood && !log.energy && !log.stress && !log.focus && !log.readiness)) {
    return NextResponse.json(fallback);
  }

  const systemPrompt = `You are Spirit, an AI that fine-tunes a user's pre-event "Trigger" prep ritual based on their wellness data. Trigger profiles: high (High Performance), focused (Focused), creative (Creative), energize (Energize), calm (Calm). Scheduled durations are normally 5-20 minutes.

Guidance:
- Low readiness, high stress, or low energy → lean toward "calm", extend duration (e.g. 15-20min), grounding.
- High readiness, strong mood, low stress → can shorten duration (e.g. 5min) and lean toward more activating profiles like "energize" or "high".
- If the data doesn't suggest a meaningful change, keep the scheduled profile and duration.

Respond with ONLY a JSON object, no markdown: {"energyType": one of high|focused|creative|energize|calm, "durationMin": integer 5-20, "reason": a short (<14 words) reason for the user, or null if unchanged}`;

  const userPrompt = `Event: "${eventTitle}". Scheduled Trigger: energyType=${scheduledEnergy}, durationMin=${scheduledDuration}. Today's wellness: mood=${log.mood ?? 'unlogged'}, energy=${log.energy ?? 'unlogged'}/5, stress=${log.stress ?? 'unlogged'}/5, focus=${log.focus ?? 'unlogged'}/5, readiness=${log.readiness ?? 'unlogged'}/10.`;

  try {
    const msg = await claude.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 200,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return NextResponse.json(fallback);

    const parsed = JSON.parse(match[0]);
    const energyType: EnergyType = ENERGY_TYPES.includes(parsed.energyType) ? parsed.energyType : scheduledEnergy;
    const durationMin = Number.isFinite(parsed.durationMin)
      ? Math.min(20, Math.max(5, Math.round(parsed.durationMin)))
      : scheduledDuration;
    const reason: string | null = typeof parsed.reason === 'string' ? parsed.reason.slice(0, 140) : null;

    const adjusted = energyType !== scheduledEnergy || durationMin !== scheduledDuration;
    return NextResponse.json({ adjusted, energyType, durationMin, reason: adjusted ? reason : null });
  } catch (err) {
    console.error('spaces/trigger-adjustment error:', err);
    return NextResponse.json(fallback);
  }
}
