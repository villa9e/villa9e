import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { callClaude } from '@/lib/claude/client';

const VILLA9E_MISSION = `villa9e's mission is to help people achieve their goals through community support, accountability, and AI-powered planning.

Core values:
- Goal achievement and personal growth
- Community support and collaboration (OoWops, accountability)
- Wellness and mental health (Zen, Hospital)
- Financial empowerment (VLG, crowdfunding, investing)
- Skill development and trading (Trading Post, Skill Stream)
- Authenticity and progress sharing (Dream Line)
- Entrepreneurship and creative work
- Positive community building

Content that ALIGNS with the mission (score 70-100):
- Sharing goal progress and milestones
- Celebrating wins and learning from setbacks
- Skill offers, trades, and collaborations
- Wellness tips, mental health, motivation
- Financial growth and entrepreneurship
- Supporting and encouraging others
- Creative work and artistic expression
- Business ventures and side hustles

Content that PARTIALLY aligns (score 40-69):
- General life updates tangentially related to growth
- Entertainment that doesn't conflict with values
- Social interactions and community building

Content that DOES NOT align (score 0-39):
- Content promoting illegal activity or harm
- Spam, advertising, or self-promotion without substance
- Negativity, hate, or attacks on other villagers
- Content with no relation to personal growth or community`;

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const admin = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { post_id, content, video_labels } = await req.json();
  if (!post_id || !content) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const videoContext = video_labels?.length
    ? `\n\nVideo content labels from analysis: ${video_labels.join(', ')}`
    : '';

  const prompt = `Score this Dream Line post for mission alignment with villa9e.

${VILLA9E_MISSION}

Post content: "${content}"${videoContext}

Return JSON ONLY:
{
  "mission_score": 82,
  "reason": "one sentence explanation",
  "flags": ["any concerning elements, or empty array"],
  "category": "goal_progress | celebration | skill_share | wellness | community | off_mission"
}`;

  let score = 75;
  let reason = 'General community post';
  let flags: string[] = [];
  let category = 'community';

  try {
    const result = await callClaude(prompt);
    score = result.mission_score ?? 75;
    reason = result.reason ?? reason;
    flags = result.flags ?? [];
    category = result.category ?? category;
  } catch { /* use defaults */ }

  // Update the post with mission score
  await (admin as any).from('dream_line_posts').update({
    mission_score: score,
  }).eq('id', post_id);

  // Load admin config to check thresholds
  const configResult: any = await (admin as any).from('dreamline_config').select('auto_hide_below, mission_score_minimum').eq('id', 1).single();
  const config = configResult?.data;
  const autoHideBelow = config?.auto_hide_below ?? 20;

  if (score < autoHideBelow) {
    // Auto-hide and send to review queue
    await (admin as any).from('dream_line_posts').update({ is_hidden: true, hidden_reason: `Auto-hidden: mission score ${score}% below threshold` }).eq('id', post_id);
    await (admin as any).from('content_review_queue').insert({
      post_id,
      mission_score: score,
      reason: `${reason}${flags.length ? ` · Flags: ${flags.join(', ')}` : ''}`,
      status: 'pending',
    });
  } else if (score < (config?.mission_score_minimum ?? 50)) {
    // Below minimum but above auto-hide — visible to author only (is_hidden stays false, but score filters it from feed)
    await (admin as any).from('content_review_queue').insert({
      post_id,
      mission_score: score,
      reason: `Low mission alignment: ${reason}`,
      status: 'pending',
    });
  }

  return NextResponse.json({ score, reason, flags, category, auto_hidden: score < autoHideBelow });
}
