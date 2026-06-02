import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { callClaude } from '@/lib/claude/client';

export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  const admin = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Ensure cache columns exist
  try {
    await (admin as any).rpc('run_sql', {
      sql: `
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dreamline_insight text;
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dreamline_insight_date date;
      `,
    });
  } catch {
    // Columns may already exist — continue
  }

  // Check if we already have a cached insight from today
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('dreamline_insight, dreamline_insight_date')
    .eq('id', user.id)
    .single();

  if (
    profile?.dreamline_insight &&
    profile?.dreamline_insight_date === today
  ) {
    return NextResponse.json({ insight: profile.dreamline_insight });
  }

  // Load user's active goals and recent OoWops received
  const [goalsResult, oowopsResult] = await Promise.all([
    (supabase as any)
      .from('goals')
      .select('title, gps_stage, probability_score, category')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(5),
    (supabase as any)
      .from('oowops')
      .select('id, created_at')
      .eq('receiver_id', user.id)
      .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString())
      .limit(20),
  ]);

  const goals: any[] = goalsResult?.data ?? [];
  const recentOoWops: number = (oowopsResult?.data ?? []).length;

  // Build context for Spirit
  const goalContext = goals.length > 0
    ? goals.map((g: any) =>
        `• "${g.title}" — Stage: ${g.gps_stage ?? 'planning'}, Probability: ${g.probability_score ?? 70}%`
      ).join('\n')
    : 'No active goals yet.';

  const prompt = `You are Spirit, villa9e's AI life coach. Generate a single sentence of daily encouragement for this user.

Their active goals:
${goalContext}

They received ${recentOoWops} OoWop validations from the village in the past 7 days.

Rules:
- ONE sentence only. No preamble.
- Be specific to where they are in their GPS journey (planning, executing, etc.)
- Be warm, real, and empowering — not generic.
- Reference their goals or stage briefly if possible.
- End with energy, not punctuation overload.
- Do NOT use emojis.

Return JSON ONLY:
{ "insight": "Your one sentence of encouragement here." }`;

  let insight = 'Your village is watching — keep building, keep showing up.';
  try {
    const result = await callClaude(prompt);
    if (result?.insight && typeof result.insight === 'string') {
      insight = result.insight.trim();
    }
  } catch {
    // Use default
  }

  // Cache in profile
  await (admin as any)
    .from('profiles')
    .update({
      dreamline_insight: insight,
      dreamline_insight_date: today,
    })
    .eq('id', user.id);

  return NextResponse.json({ insight });
}
