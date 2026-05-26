import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { post_id, signals } = await req.json();
  if (!post_id || !signals) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  // Compute composite engagement score (0–100)
  const attentionScore = Math.min(100, signals.attention_score ?? 0);
  const motionFactor   = Math.min(1, (signals.motion_events ?? 0) / 10);
  const viewFactor     = Math.min(1, (signals.view_duration_ms ?? 0) / 5000);
  const faceFactor     = signals.face_detected ? 0.2 : 0;

  const engagementScore = Math.round(
    attentionScore * 0.4 +
    motionFactor   * 100 * 0.2 +
    viewFactor     * 100 * 0.3 +
    faceFactor     * 100 * 0.1
  );

  const admin = createAdminClient();

  // Update mission_score on dream_line_posts using engagement as a signal
  // Blend existing mission_score with engagement (60/40 split)
  const { data: existing } = await (admin as any)
    .from('dream_line_posts')
    .select('mission_score')
    .eq('id', post_id)
    .single();

  if (existing) {
    const currentMission = existing.mission_score ?? 50;
    const blendedScore = Math.round(currentMission * 0.6 + engagementScore * 0.4);

    await (admin as any)
      .from('dream_line_posts')
      .update({ mission_score: blendedScore })
      .eq('id', post_id);
  }

  // Log raw engagement signal for algorithm training
  await (admin as any).from('post_engagement_signals').insert({
    post_id,
    user_id:          user.id,
    attention_score:  attentionScore,
    motion_events:    signals.motion_events ?? 0,
    view_duration_ms: signals.view_duration_ms ?? 0,
    face_detected:    signals.face_detected ?? false,
    engagement_score: engagementScore,
  }).then(() => {}).catch(() => {}); // non-blocking — table may not exist yet

  return NextResponse.json({ ok: true, engagement_score: engagementScore });
}
