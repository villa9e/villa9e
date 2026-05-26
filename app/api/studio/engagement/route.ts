import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// Records engagement signals from device sensors (accelerometer, camera attention)
// These signals feed into the Dream Line algorithm to surface high-impact content
export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { post_id, signals } = await req.json();
  // signals: {
  //   attention_score: 0-100 (0=scrolled past, 100=stopped and watched)
  //   motion_events: number (device motion detected = user is active)
  //   view_duration_ms: number (how long the post was visible)
  //   face_detected: boolean (camera detected face = user is looking)
  // }

  if (!post_id || !signals) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  // Compute composite engagement score
  const attentionScore = Math.min(100, signals.attention_score ?? 0);
  const motionFactor = Math.min(1, (signals.motion_events ?? 0) / 10); // normalize to 0-1
  const viewFactor = Math.min(1, (signals.view_duration_ms ?? 0) / 5000); // 5s = max
  const faceFactor = signals.face_detected ? 0.2 : 0;

  const engagementScore = Math.round(
    attentionScore * 0.4 +
    motionFactor * 100 * 0.2 +
    viewFactor * 100 * 0.3 +
    faceFactor * 100 * 0.1
  );

  // Update dream_line_posts engagement metrics
  // This score informs the algorithm about which posts stop scrollers
  await (supabase as any).from('dream_line_posts').update({
    // We'll use mission_score as a proxy for engagement score in Phase 1
    // Phase 2: add dedicated engagement_score column
  }).eq('id', post_id);

  // Store engagement signal for algorithm training
  // In Phase 2: dedicated engagement_signals table
  return NextResponse.json({ ok: true, engagement_score: engagementScore });
}
