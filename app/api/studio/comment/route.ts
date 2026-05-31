// Studio — create, read, delete post comments
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';

export const maxDuration = 15;

// GET /api/studio/comment?post_id=xxx&cursor=xxx
export async function GET(req: NextRequest) {
  const supabase = createServerClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const post_id = searchParams.get('post_id');
  const cursor  = searchParams.get('cursor');
  const limit   = Number(searchParams.get('limit') ?? 20);

  if (!post_id) return NextResponse.json({ error: 'post_id required' }, { status: 400 });

  const admin = createAdminClient() as any;
  let query = admin
    .from('post_comments')
    .select(`
      id, content, created_at, parent_id, oowop_count,
      user:user_id (
        id,
        username:username,
        display_name,
        avatar_url
      )
    `)
    .eq('post_id', post_id)
    .is('parent_id', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data: comments, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const nextCursor = comments && comments.length === limit
    ? comments[comments.length - 1]?.created_at
    : null;

  return NextResponse.json({ comments: comments ?? [], nextCursor });
}

// POST /api/studio/comment
export async function POST(req: NextRequest) {
  const supabase = createServerClient() as any;
  const admin    = createAdminClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { post_id, content, parent_id } = await req.json();
  if (!post_id || !content?.trim()) return NextResponse.json({ error: 'post_id and content required' }, { status: 400 });

  const { data: comment, error } = await admin.from('post_comments').insert({
    post_id,
    user_id:   user.id,
    content:   content.trim().slice(0, 1000),
    parent_id: parent_id ?? null,
  }).select('id, content, created_at').single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Increment comment count on post
  const { data: post } = await admin.from('studio_posts').select('comment_count, user_id').eq('id', post_id).single();
  await admin.from('studio_posts').update({ comment_count: (post?.comment_count ?? 0) + 1 }).eq('id', post_id);

  // Notify post owner
  if (post?.user_id && post.user_id !== user.id) {
    admin.from('notifications').insert({
      user_id:        post.user_id,
      type:           'comment',
      title:          'New comment on your post',
      body:           content.trim().slice(0, 80),
      reference_id:   post_id,
      reference_type: 'studio_post',
      actor_id:       user.id,
    }).catch(() => {});
  }

  // Run moderation async
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://villa9e.app';
  fetch(`${baseUrl}/api/studio/moderate`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ post_id: comment.id, text: content, user_id: user.id }),
  }).catch(() => {});

  return NextResponse.json({ commentId: comment.id, success: true });
}

// DELETE /api/studio/comment
export async function DELETE(req: NextRequest) {
  const supabase = createServerClient() as any;
  const admin    = createAdminClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { comment_id } = await req.json();
  if (!comment_id) return NextResponse.json({ error: 'comment_id required' }, { status: 400 });

  // Only allow deleting own comments
  const { data: comment } = await admin.from('post_comments').select('post_id').eq('id', comment_id).eq('user_id', user.id).single();
  if (!comment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await admin.from('post_comments').delete().eq('id', comment_id);

  // Decrement comment count
  const { data: post } = await admin.from('studio_posts').select('comment_count').eq('id', comment.post_id).single();
  await admin.from('studio_posts').update({ comment_count: Math.max(0, (post?.comment_count ?? 1) - 1) }).eq('id', comment.post_id);

  return NextResponse.json({ success: true });
}
