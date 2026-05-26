import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { callClaude } from '@/lib/claude/client';

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { event_title, event_type, start_time } = await req.json();

  const { data: profile } = await supabase.from('profiles').select('display_name, personality_type').eq('id', user.id).single();

  const timeStr = start_time ? new Date(start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'soon';
  const name = profile?.display_name ?? 'Villager';
  const archetype = profile?.personality_type ?? '';

  const prompt = `You are Spirit, a wise and warm AI companion inside villa9e. Give a short pre-event mindset preparation for the villager named ${name}${archetype ? ` (archetype: ${archetype})` : ''}.

Event: "${event_title}"
Type: ${event_type}
Time: ${timeStr}

In 2-3 sentences, offer grounding advice, an affirmation, or a specific mindset tip for THIS specific event. Be personal, real, and motivating. Do not use generic filler. Return plain text only.`;

  const result = await callClaude(prompt, { returnRaw: true, system: 'You are Spirit, a wise and warm AI life coach inside villa9e. Give practical, personal, grounding advice. Return plain text only — no JSON, no markdown.' });
  return NextResponse.json({ message: result });
}
