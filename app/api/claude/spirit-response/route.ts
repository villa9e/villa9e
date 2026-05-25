import { NextRequest, NextResponse } from 'next/server';
import { claude, CLAUDE_MODEL } from '@/lib/claude/client';

export async function POST(req: NextRequest) {
  const { type, mood, mood_score, energy_level, focus_area, spiritual_system = 'secular', user_name = 'Villager' } = await req.json();

  const isMorning = type === 'morning';

  const prompt = isMorning
    ? `Generate a personalized morning Mindful Moment for ${user_name}.
Mood: ${mood} (${mood_score}/10). Energy: ${energy_level}/10.
Focus today: ${focus_area || 'not specified'}.
Spiritual system: ${spiritual_system}.

Return JSON: {"greeting": "...", "affirmation": "...", "focus_tip": "...", "route": "workshop or zen_space", "voice_script": "30-second spoken script for Spirit's voice"}`
    : `Generate an evening reflection for ${user_name}.
Mood: ${mood} (${mood_score}/10). How they showed up: ${focus_area || 'working on goals'}.

Return JSON: {"reflection": "...", "celebration": "...", "tomorrow_intention": "...", "voice_script": "30-second bedtime affirmation"}`;

  const message = await claude.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 512,
    system: `You are Spirit, villa9e's AI life coach. Warm, real, culturally aware. Speak directly to ${user_name}. Never generic.`,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '{}';
  try {
    return NextResponse.json(JSON.parse(text));
  } catch {
    return NextResponse.json({ text });
  }
}
