import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { callClaude } from '@/lib/claude/client';

// AI-powered content creation tips for affiliates and Dream Line creators
export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { content_type, goal_category, engagement_data, platform } = await req.json();
  // content_type: 'dream_line_post' | 'story' | 'reel' | 'affiliate_promo'
  // engagement_data: { avg_watch_time, oowop_rate, comment_rate, scroll_stop_rate }
  // platform: 'dream_line' | 'tiktok' | 'instagram' | 'youtube_shorts'

  const { data: profile } = await supabase.from('profiles').select('personality_type, village_score').eq('id', user.id).single();

  const engagementSummary = engagement_data
    ? `Average watch time: ${engagement_data.avg_watch_time ?? 0}s, OoWop rate: ${engagement_data.oowop_rate ?? 0}%, Comment rate: ${engagement_data.comment_rate ?? 0}%`
    : 'No engagement data yet';

  const prompt = `You are the villa9e Creator Coach — an expert in authentic, community-driven content for goal-focused creators and affiliate marketers.

Creator profile:
- Personality: ${profile?.personality_type ?? 'unknown'}
- Village Score: ${profile?.village_score ?? 0}
- Content type: ${content_type}
- Goal category: ${goal_category ?? 'general'}
- Platform: ${platform ?? 'dream_line'}
- Recent engagement: ${engagementSummary}

Generate 5 specific, actionable content creation tips. Each tip should:
1. Be specific to the creator's personality type and goal category
2. Reference what's working or not from the engagement data
3. Include a concrete example or template they can use today
4. Be honest — if engagement is low, explain why and what to fix

Return JSON:
{
  "score": 72,
  "trend": "rising|steady|declining",
  "summary": "one sentence on their content health",
  "tips": [
    {"title": "Hook in 1.5 seconds", "body": "...", "example": "...", "priority": "high"},
    ...5 tips
  ],
  "next_best_content": "The single best piece of content they should create RIGHT NOW"
}`;

  const result = await callClaude(prompt);
  return NextResponse.json(result);
}
