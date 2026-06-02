import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { claude, CLAUDE_MODEL } from '@/lib/claude/client';

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { message, context } = await req.json();
  if (!message?.trim()) return NextResponse.json({ error: 'message required' }, { status: 400 });

  // Load today's wellness log for context
  const today = new Date().toISOString().split('T')[0];
  const { data: log } = await (supabase as any)
    .from('wellness_logs')
    .select('mood,energy,stress,focus,readiness,gratitude')
    .eq('user_id', user.id)
    .eq('log_date', today)
    .single();

  const wellnessContext = {
    hrv: context?.hrv ?? null,
    sleep: context?.sleep ?? null,
    readiness: context?.readiness ?? log?.readiness ?? null,
    mood: log?.mood ?? context?.mood ?? null,
    energy: log?.energy ?? null,
    stress: log?.stress ?? null,
    focus: log?.focus ?? null,
  };

  const systemPrompt = `You are Spirit, an AI wellness advisor for villa9e. NOT a licensed medical professional. Always recommend consulting a provider for medical decisions. Never diagnose. Be warm, specific, and grounded in the user's actual data. If user describes emergency symptoms, direct them to call 911 immediately.

Today's wellness data:
- Readiness: ${wellnessContext.readiness ?? 'not logged'}/10
- Mood: ${wellnessContext.mood ?? 'not logged'}
- Energy: ${wellnessContext.energy ? `${wellnessContext.energy}/5` : 'not logged'}
- Stress: ${wellnessContext.stress ? `${wellnessContext.stress}/5` : 'not logged'}
- Focus: ${wellnessContext.focus ? `${wellnessContext.focus}/5` : 'not logged'}

Be warm, clear, and practical. Specific to their data when available. Empowering — frame everything as an opportunity to optimize. Concise — 2–3 sentences max unless a detailed explanation is genuinely needed.`;

  try {
    const msg = await claude.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 400,
      system: systemPrompt,
      messages: [{ role: 'user', content: message }],
    });

    const reply = (msg.content[0] as any).text ?? 'I\'m here to help. Can you tell me more about what you\'re experiencing?';

    // Store the interaction
    await (supabase as any).from('wellness_logs').upsert({
      user_id: user.id,
      log_date: today,
      ai_insight: reply.slice(0, 500),
    }, { onConflict: 'user_id,log_date' });

    return NextResponse.json({ reply });
  } catch (err) {
    console.error('wellness/chat error:', err);
    return NextResponse.json({ reply: 'I\'m having trouble connecting right now. Take a deep breath — your data is still tracking. Try again in a moment.' });
  }
}
