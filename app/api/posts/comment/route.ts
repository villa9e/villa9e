import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { callClaude } from '@/lib/claude/client';

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const admin = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { post_id, content } = await req.json();
  if (!post_id || !content?.trim()) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  if (content.length > 500) {
    return NextResponse.json({ error: 'Comment too long (max 500 chars)' }, { status: 400 });
  }

  // Quick quality check with Claude
  let quality_score = 0.7;
  try {
    const result = await callClaude(`Rate this Dream Line comment for quality and usefulness (0–1). Only return JSON: {"score": 0.85}. Comment: "${content.slice(0, 200)}"`);
    quality_score = result.score ?? 0.7;
  } catch { /* use default */ }

  const { data: comment, error } = await admin.from('post_comments').insert({
    post_id, user_id: user.id, content: content.trim(),
  }).select('*, profiles(username, avatar_url, village_score)').single();

  if (error) return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });

  // Increment comment count on post
  const { data: currentPost } = await admin.from('dream_line_posts').select('comment_count').eq('id', post_id).single();
  await admin.from('dream_line_posts').update({
    comment_count: (currentPost?.comment_count ?? 0) + 1,
  }).eq('id', post_id);

  // Award VLG for high quality comments
  if (quality_score >= 0.8) {
    await admin.rpc('award_village_score', {
      p_user_id: user.id, p_points: 5, p_vlg: 15,
      p_reason: 'HIGH_QUALITY_COMMENT', p_reference_id: post_id,
    });
  }

  // Notify post author
  const { data: post } = await admin.from('dream_line_posts').select('user_id').eq('id', post_id).single();
  if (post && post.user_id !== user.id) {
    const { data: commenter } = await admin.from('profiles').select('username').eq('id', user.id).single();
    await admin.from('notifications').insert({
      user_id: post.user_id,
      type: 'message',
      title: `@${commenter?.username ?? 'Villager'} commented on your post`,
      body: content.slice(0, 100),
      reference_id: post_id,
      reference_type: 'dream_line_post',
    });
  }

  return NextResponse.json({ comment, quality_score });
}

export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  const { searchParams } = new URL(req.url);
  const post_id = searchParams.get('post_id');
  if (!post_id) return NextResponse.json([], { status: 400 });

  const { data } = await supabase.from('post_comments')
    .select('*, profiles(username, avatar_url, village_score, score_tier)')
    .eq('post_id', post_id)
    .order('created_at')
    .limit(50);

  return NextResponse.json(data ?? []);
}
