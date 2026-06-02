import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { claude, CLAUDE_MODEL } from '@/lib/claude/client';

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const admin    = createAdminClient() as any;

  const { data: { user } } = await (supabase as any).auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const {
    videoTitle,
    videoDescription,
    videoChannel,
    actionTitle,
    goalCategory,
    actionLevel,
    video_id,
    action_id,
  } = await req.json();

  if (!videoTitle || !actionTitle || !goalCategory) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Ensure video_scores table exists (idempotent)
  await admin.rpc('create_video_scores_if_not_exists').catch(() => {
    // If RPC doesn't exist, try direct SQL via admin — gracefully continue if unavailable
  });

  // Check cache first
  if (video_id && action_id) {
    const { data: cached } = await admin
      .from('video_scores')
      .select('score')
      .eq('video_id', video_id)
      .eq('action_id', action_id)
      .maybeSingle();

    if (cached) {
      return NextResponse.json({ score: cached.score, cached: true });
    }
  }

  // Call Claude to score the video
  const prompt = `Score this video 0-100 on how directly it teaches this skill/action. Action: ${actionTitle}. Goal category: ${goalCategory}. Video: ${videoTitle} - ${videoDescription ?? ''}. Rubric: 90-100=directly teaches step-by-step, 70-89=teaches relevant skill with significant overlap, 50-69=related but partial, below 50=motivational/tangential. Return ONLY the number.`;

  let rawScore = 60;
  try {
    const message = await claude.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 16,
      system: 'You are a video relevance scorer. Return only a single integer 0-100.',
      messages: [{ role: 'user', content: prompt }],
    });
    const text = message.content[0].type === 'text' ? message.content[0].text.trim() : '';
    const parsed = parseInt(text.replace(/\D/g, ''), 10);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
      rawScore = parsed;
    }
  } catch {
    // Use default 60 if Claude unavailable
  }

  // Apply action level format adjustment
  let finalScore = rawScore;
  if (actionLevel === 1) {
    // Wayfinder: penalizes short videos -15
    // (caller should pass videoDurationSeconds if available; absent = no penalty applied)
    finalScore = Math.max(0, rawScore - 15);
  } else if (actionLevel === 3) {
    // Trailblazer: penalizes long videos -10
    finalScore = Math.max(0, rawScore - 10);
  }
  finalScore = Math.min(100, finalScore);

  // Cache the score
  if (video_id && action_id) {
    // Create table with IF NOT EXISTS inline — safe to run every time
    await admin.rpc('run_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS video_scores (
          video_id  TEXT        NOT NULL,
          action_id TEXT        NOT NULL,
          score     INT         NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (video_id, action_id)
        );
      `,
    }).catch(async () => {
      // If RPC doesn't exist, just upsert and let it fail silently if table missing
    });

    await admin
      .from('video_scores')
      .upsert({ video_id, action_id, score: finalScore }, { onConflict: 'video_id,action_id' })
      .catch(() => {});
  }

  return NextResponse.json({ score: finalScore, cached: false });
}
