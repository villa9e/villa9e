import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { claude, CLAUDE_MODEL } from '@/lib/claude/client';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient();
  const admin = createAdminClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: session } = await admin
    .from('provider_sessions')
    .select('*')
    .eq('id', params.id)
    .eq('patient_user_id', user.id)
    .single();

  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

  const { force } = await req.json().catch(() => ({ force: false }));
  if (session.pre_visit_brief && !force) {
    return NextResponse.json({ brief: session.pre_visit_brief, cached: true });
  }

  const { data: provider } = await admin
    .from('provider_profiles')
    .select('display_name,specialty,credential_type,bio')
    .eq('id', session.provider_id)
    .maybeSingle();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

  const [{ data: logs }, { data: journalEntries }] = await Promise.all([
    admin.from('wellness_logs').select('log_date,mood,energy,stress,focus,readiness,morning_intention,gratitude')
      .eq('user_id', user.id).gte('log_date', sevenDaysAgoStr).order('log_date', { ascending: false }),
    admin.from('journal_entries').select('content,mood,created_at')
      .eq('user_id', user.id).order('created_at', { ascending: false }).limit(3),
  ]);

  const moodMap: Record<string, number> = { low: 1, meh: 2, good: 3, great: 4 };
  const logLines = (logs ?? []).map((l: any) =>
    `${l.log_date}: mood=${l.mood ?? '?'} (${moodMap[l.mood] ?? '?'}/4), energy=${l.energy ?? '?'}/5, stress=${l.stress ?? '?'}/5, focus=${l.focus ?? '?'}/5, readiness=${l.readiness ?? '?'}/10`
  ).join('\n');

  const journalLines = (journalEntries ?? []).map((j: any) =>
    `- (${new Date(j.created_at).toLocaleDateString()}, mood: ${j.mood ?? 'n/a'}) ${(j.content ?? '').slice(0, 300)}`
  ).join('\n');

  const systemPrompt = `You are Spirit, a warm AI wellness assistant preparing a patient for an upcoming telehealth appointment. Write a short, helpful pre-visit brief (4-6 sentences) the patient can review before their session. Summarize relevant recent wellness patterns and suggest 2-3 specific things they might want to bring up with their provider. Never diagnose. Be supportive, not clinical.`;

  const userPrompt = `Upcoming session: ${session.session_type} with ${provider?.display_name ?? 'their provider'}${provider?.specialty ? ` (${provider.specialty})` : ''}.
${session.notes ? `Session notes: ${session.notes}` : ''}

Last 7 days of wellness logs:
${logLines || 'No recent wellness logs.'}

Recent journal entries:
${journalLines || 'No recent journal entries.'}

Write the pre-visit brief now.`;

  try {
    const msg = await claude.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 500,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const brief = msg.content[0].type === 'text' ? msg.content[0].text : null;
    if (!brief) return NextResponse.json({ error: 'Could not generate brief' }, { status: 500 });

    await admin.from('provider_sessions').update({
      pre_visit_brief: brief,
      brief_generated_at: new Date().toISOString(),
    }).eq('id', session.id);

    return NextResponse.json({ brief, cached: false });
  } catch (err) {
    console.error('wellness/sessions/brief error:', err);
    return NextResponse.json({ error: 'Failed to generate brief' }, { status: 500 });
  }
}
