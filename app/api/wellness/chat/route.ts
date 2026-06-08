import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { claude, CLAUDE_MODEL } from '@/lib/claude/client';
import { fetchSpiritContext, buildSharedKnowledgeBlock } from '@/lib/claude/spirit';

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { message, context } = await req.json();
  if (!message?.trim()) return NextResponse.json({ error: 'message required' }, { status: 400 });

  // Load today's wellness log for wearable/gratitude fields not covered by
  // the shared Spirit snapshot (hrv/sleep come from the client device, gratitude
  // is journaled text — Wellness-specific framing layered on shared knowledge).
  const today = new Date().toISOString().split('T')[0];
  const [ctx, { data: log }] = await Promise.all([
    fetchSpiritContext(user.id, message),
    (supabase as any).from('wellness_logs')
      .select('gratitude')
      .eq('user_id', user.id)
      .eq('log_date', today)
      .maybeSingle(),
  ]);

  const wearables = {
    hrv:   context?.hrv ?? null,
    sleep: context?.sleep ?? null,
  };

  const systemPrompt = `You are Spirit, an AI wellness advisor for villa9e. NOT a licensed medical professional. Always recommend consulting a provider for medical decisions. Never diagnose. Be warm, specific, and grounded in the user's actual data. If user describes emergency symptoms, direct them to call 911 immediately.

${wearables.hrv !== null ? `HRV: ${wearables.hrv}` : ''}${wearables.sleep !== null ? `${wearables.hrv !== null ? ', ' : ''}Sleep: ${wearables.sleep}` : ''}
${log?.gratitude ? `Today's gratitude entry: "${log.gratitude}"` : ''}

${buildSharedKnowledgeBlock(ctx)}

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
