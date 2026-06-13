// Workshop — Mission score for a video against the user's current GPS action.
// Caches results in video_mission_scores so the same (video, action) pair
// is never re-scored by Claude.
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { callClaude } from '@/lib/claude/client';

export const maxDuration = 30;

function scoreLabel(score: number): 'green' | 'amber' | null {
  if (score >= 85) return 'green';
  if (score >= 70) return 'amber';
  return null;
}

async function getUser(req: NextRequest) {
  const supabase = createServerClient() as any;
  const { data: { user: cookieUser } } = await supabase.auth.getUser();
  if (cookieUser) return cookieUser;
  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const { data: { user: tokenUser } } = await supabase.auth.getUser(authHeader.slice(7));
    if (tokenUser) return tokenUser;
  }
  return null;
}

export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { videoId, videoTitle, actionTitle, actionDescription } = await req.json();
  if (!videoId || !videoTitle || !actionTitle) {
    return NextResponse.json({ error: 'Missing videoId, videoTitle, or actionTitle' }, { status: 400 });
  }

  const actionKey = String(actionTitle).trim().toLowerCase().slice(0, 200);
  const admin = createAdminClient() as any;

  const { data: cached } = await admin
    .from('video_mission_scores')
    .select('score, label')
    .eq('video_id', videoId).eq('action_key', actionKey)
    .maybeSingle();

  if (cached) {
    return NextResponse.json({ score: cached.score, label: cached.label, cached: true });
  }

  const prompt = `A user is working on this action as part of their goal plan:
Action: "${actionTitle}"
${actionDescription ? `Details: ${actionDescription}` : ''}

They're about to watch this video:
Title: "${videoTitle}"

On a scale of 0-100, how directly useful would this video be for completing that specific action? 100 = perfectly on-topic instructional content for this exact action. 0 = completely unrelated.

Return JSON ONLY: {"score": 0-100}`;

  const result = await callClaude(prompt, { maxTokens: 50 });
  const score = Math.max(0, Math.min(100, Math.round(Number(result.score) || 0)));
  const label = scoreLabel(score);

  await admin.from('video_mission_scores').insert({ video_id: videoId, action_key: actionKey, score, label });

  return NextResponse.json({ score, label, cached: false });
}
