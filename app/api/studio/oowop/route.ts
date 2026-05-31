// Studio — toggle OoWop (fist bump) on a post
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

  // Check if already oowoped
  const { data: existing } = await admin
    .from('post_oowops')
    .select('id')
    .eq('post_id', post_id)
    .eq('user_id', user.id)
    .single();

  let oowoped: boolean;

  if (existing) {
    // Un-oowop
    await admin.from('post_oowops').delete().eq('id', existing.id);
    const { data: current } = await admin.from('studio_posts').select('oowop_count').eq('id', post_id).single();
    await admin.from('studio_posts')
      .update({ oowop_count: Math.max(0, (current?.oowop_count ?? 1) - 1) })
      .eq('id', post_id);
    oowoped = false;
  } else {
    // OoWop
    await admin.from('post_oowops').insert({ post_id, user_id: user.id });
    // Increment oowop_count safely
    const { data: post } = await admin.from('studio_posts').select('oowop_count, user_id').eq('id', post_id).single();
    const newCount = (post?.oowop_count ?? 0) + 1;
    await admin.from('studio_posts').update({ oowop_count: newCount }).eq('id', post_id);

    // Notify post owner (non-blocking)
    if (post?.user_id && post.user_id !== user.id) {
      admin.from('notifications').insert({
        user_id:        post.user_id,
        type:           'oowop',
        title:          'Someone OoWop\'d your post',
        body:           'Your post got a fist bump!',
        reference_id:   post_id,
        reference_type: 'studio_post',
        actor_id:       user.id,
      }).catch(() => {});
    }
    oowoped = true;
  }

  // Return current count
  const { data: updated } = await admin.from('studio_posts').select('oowop_count').eq('id', post_id).single();

  return NextResponse.json({ oowoped, count: updated?.oowop_count ?? 0 });
}
