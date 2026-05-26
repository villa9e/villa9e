import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { callSpirit, storeMemory, fetchSpiritContext, buildSpiritSystemPrompt } from '@/lib/claude/spirit';
import { claude, CLAUDE_MODEL } from '@/lib/claude/client';

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const body = await req.json();
  const { type, mood, mood_score, energy_level, focus_area, message: chatMessage } = body;

  // If called with a direct chat message, use full Spirit intelligence
  if (chatMessage) {
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { raw } = await callSpirit(user.id, chatMessage);
    return NextResponse.json(raw);
  }

  // Morning/Evening check-in — also personalized when user is logged in
  const isMorning = type === 'morning';

  if (user) {
    // Full personalized Spirit check-in
    const ctx = await fetchSpiritContext(user.id);
    const system = buildSpiritSystemPrompt(ctx);

    const goalSummary = ctx.activeGoals.length > 0
      ? `Their active goals: ${ctx.activeGoals.map(g => `"${g.title}" (${g.progress}%)`).join(', ')}.`
      : 'No active goals yet.';

    const prompt = isMorning
      ? `It's morning. ${ctx.displayName} is checking in.
Mood: ${mood} (${mood_score}/10). Energy: ${energy_level}/10.
${goalSummary}
${ctx.memories.length > 0 ? `What you remember: ${ctx.memories.slice(0, 3).join('; ')}.` : ''}

Respond as Spirit — warm, personal, real. Reference something specific about them if you can.
Return JSON: {"greeting": "...", "affirmation": "...", "focus_tip": "...", "route": "workshop or zen_space", "voice_script": "30-second spoken script for Spirit's voice"}`
      : `It's evening. ${ctx.displayName} is checking in.
Mood: ${mood} (${mood_score}/10). Focus today: ${focus_area || 'working on their goals'}.
${goalSummary}

Respond as Spirit — reflect on their day with warmth. Help them close out and set intention for tomorrow.
Return JSON: {"reflection": "...", "celebration": "...", "tomorrow_intention": "...", "voice_script": "30-second bedtime affirmation"}`;

    const message = await claude.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 600,
      system,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '{}';

    // Store check-in as a memory
    storeMemory(
      user.id,
      'check_in',
      `${isMorning ? 'Morning' : 'Evening'} check-in: mood=${mood} (${mood_score}/10)`,
      { mood, mood_score, type },
      6
    ).catch(() => {});

    try {
      return NextResponse.json(JSON.parse(text));
    } catch {
      return NextResponse.json({ text });
    }
  }

  // Fallback for unauthenticated / quick calls
  const { type: bodyType, spiritual_system = 'Secular', user_name = 'Villager' } = body;
  const prompt = isMorning
    ? `Generate a morning Mindful Moment for ${user_name}. Mood: ${mood}. Be personal and real.
Return JSON: {"greeting": "...", "affirmation": "...", "focus_tip": "...", "route": "workshop or zen_space", "voice_script": "..."}`
    : `Generate an evening reflection for ${user_name}. Mood: ${mood}.
Return JSON: {"reflection": "...", "celebration": "...", "tomorrow_intention": "...", "voice_script": "..."}`;

  const message = await claude.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 512,
    system: `You are Spirit — warm, real, never generic. Speak directly to ${user_name}. ${spiritual_system !== 'Secular' ? `They follow ${spiritual_system}.` : ''} Never moralize.`,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '{}';
  try {
    return NextResponse.json(JSON.parse(text));
  } catch {
    return NextResponse.json({ text });
  }
}
