import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { claude, CLAUDE_MODEL } from '@/lib/claude/client';

export async function GET(_req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const today = new Date().toISOString().split('T')[0];

  // Load today's wellness log
  const { data: todayLog } = await (supabase as any)
    .from('wellness_logs')
    .select('mood,energy,stress,focus,readiness,ai_insight')
    .eq('user_id', user.id)
    .eq('log_date', today)
    .single();

  // Return cached insight if it exists
  if (todayLog?.ai_insight) {
    return NextResponse.json({
      insight: todayLog.ai_insight,
      readiness: parseFloat(todayLog.readiness ?? 0),
      cached: true,
    });
  }

  // Not enough data to generate insight
  if (!todayLog || (!todayLog.mood && !todayLog.energy && !todayLog.stress)) {
    return NextResponse.json({
      insight: null,
      readiness: 0,
      cached: false,
    });
  }

  // Load last 7 days of wellness logs for pattern context
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

  const { data: recentLogs } = await (supabase as any)
    .from('wellness_logs')
    .select('log_date,mood,energy,stress,focus,readiness')
    .eq('user_id', user.id)
    .gte('log_date', sevenDaysAgoStr)
    .lt('log_date', today)
    .order('log_date', { ascending: false });

  // Calculate 7-day mood average (convert mood strings to numbers)
  const moodMap: Record<string, number> = { low: 1, meh: 2, good: 3, great: 4 };
  const moodValues = (recentLogs ?? [])
    .map((l: any) => moodMap[l.mood] ?? null)
    .filter((v: number | null) => v !== null) as number[];
  const avgMood = moodValues.length > 0
    ? (moodValues.reduce((a: number, b: number) => a + b, 0) / moodValues.length).toFixed(1)
    : null;

  const moodScore = moodMap[todayLog.mood] ?? null;

  const systemPrompt = `You are Spirit, a warm compassionate AI wellness advisor. Never clinical. Write like a knowledgeable best friend. 2-3 sentences max.`;

  const userPrompt = `User's data today: mood=${moodScore ?? '?'}/4 (${todayLog.mood ?? 'not logged'}), energy=${todayLog.energy ?? '?'}/5, stress=${todayLog.stress ?? '?'}/5, focus=${todayLog.focus ?? '?'}/5. Recent 7-day mood average: ${avgMood ?? 'no history'}. Generate a personalized insight about what their data shows and one specific action to take today.`;

  try {
    const msg = await claude.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const insight = msg.content[0].type === 'text' ? msg.content[0].text : null;

    if (!insight) {
      return NextResponse.json({ insight: null, readiness: parseFloat(todayLog.readiness ?? 0), cached: false });
    }

    // Calculate readiness from logged data if not already set
    const energyScore = todayLog.energy ?? 3;
    const stressScore = todayLog.stress ?? 3;
    const focusScore = todayLog.focus ?? 3;
    const moodNum = moodMap[todayLog.mood] ?? 2;
    // Simple readiness formula: weighted average scaled to /10
    const computedReadiness = parseFloat(todayLog.readiness ?? 0) ||
      Math.round(((moodNum / 4) * 3 + (energyScore / 5) * 3 + ((5 - stressScore) / 5) * 2 + (focusScore / 5) * 2) * 10 / 10);

    // Save insight and readiness back to the wellness log
    await (supabase as any)
      .from('wellness_logs')
      .upsert({
        user_id: user.id,
        log_date: today,
        ai_insight: insight.slice(0, 500),
        readiness: computedReadiness,
      }, { onConflict: 'user_id,log_date' });

    return NextResponse.json({
      insight,
      readiness: computedReadiness,
      cached: false,
    });
  } catch (err) {
    console.error('wellness/insight error:', err);
    return NextResponse.json({
      insight: "Spirit is taking a moment to reflect. Check back shortly for your personalized insight.",
      readiness: parseFloat(todayLog.readiness ?? 0),
      cached: false,
    });
  }
}
