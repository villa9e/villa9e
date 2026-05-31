// Studio — toggle favorite (save/bookmark) on a post
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';

export const maxDuration = 10;

export async function POST(req: NextRequest) {
  const supabase = createServerClient() as any;
  const admin    = createAdminClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { post_id } = await req.json();
  if (!post_id) return NextResponse.json({ error: 'post_id required' }, { status: 400 });

  const { data: existing } = await admin
    .from('post_favorites')
    .select('id')
    .eq('post_id', post_id)
    .eq('user_id', user.id)
    .single();

  let favorited: boolean;

  if (existing) {
    await admin.from('post_favorites').delete().eq('id', existing.id);
    favorited = false;
  } else {
    await admin.from('post_favorites').insert({ post_id, user_id: user.id });
    favorited = true;
  }

  return NextResponse.json({ favorited });
}

// GET — check if user has favorited a post
export async function GET(req: NextRequest) {
  const supabase = createServerClient() as any;
  const admin    = createAdminClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ favorited: false });

  const { searchParams } = new URL(req.url);
  const post_id = searchParams.get('post_id');
  if (!post_id) return NextResponse.json({ favorited: false });

  const { data } = await admin.from('post_favorites').select('id').eq('post_id', post_id).eq('user_id', user.id).single();

  return NextResponse.json({ favorited: !!data });
}
