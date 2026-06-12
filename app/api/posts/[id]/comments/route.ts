import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = createAdminClient() as any;
  const { data: comments } = await admin.from('post_comments')
    .select('*, profiles(id, username, display_name, avatar_url)')
    .eq('post_id', params.id).eq('is_deleted', false)
    .order('oowop_count', { ascending: false }).order('created_at', { ascending: true })
    .limit(50);
  return NextResponse.json({ comments: comments ?? [] });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient() as any;
  const admin = createAdminClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { content, parent_id } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: 'Empty comment' }, { status: 400 });

  const { data: comment } = await admin.from('post_comments').insert({ post_id: params.id, user_id: user.id, content: content.trim(), parent_id: parent_id ?? null }).select('*, profiles(id, username, display_name, avatar_url)').single();

  // Increment comment count on post
  try {
    await admin.rpc('increment_comment_count', { post_id: params.id });
  } catch {
    const { data: post } = await admin.from('dream_line_posts').select('comment_count').eq('id', params.id).single();
    await admin.from('dream_line_posts').update({ comment_count: (post?.comment_count ?? 0) + 1 }).eq('id', params.id);
  }

  return NextResponse.json({ comment });
}
