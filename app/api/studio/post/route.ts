// Creator Studio — create + publish a post
// Saves to studio_posts, fires transcript + moderation async
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const supabase = createServerClient() as any;
  const admin    = createAdminClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();

  const {
    content_type, media_url, thumbnail_url, cloudinary_id,
    caption, hashtags = [], location_name,
    post_label, goal_id, sprint_id, action_ref,
    is_workshop_content, has_affiliate, affiliate_url, affiliate_product,
    visibility, is_18_plus,
    allow_comments, allow_remixes, is_template, is_ai_generated,
    save_to_device, save_with_watermark, allow_visual_search,
    is_ad, ad_only, cta_text, cta_url,
    sound_title, sound_url, sound_source,
    edit_state, text_content, text_style,
  } = body;

  // Insert post
  const { data: post, error } = await admin.from('studio_posts').insert({
    user_id:            user.id,
    content_type:       content_type ?? 'video',
    media_url,
    thumbnail_url,
    cloudinary_id,
    caption:            caption?.trim() ?? null,
    location_name:      location_name || null,
    post_label:         post_label ?? 'general',
    goal_id:            goal_id ?? null,
    sprint_id:          sprint_id ?? null,
    action_ref:         action_ref || null,
    is_workshop_content: is_workshop_content ?? false,
    has_affiliate:      has_affiliate ?? false,
    affiliate_url:      affiliate_url || null,
    affiliate_product:  affiliate_product || null,
    visibility:         visibility ?? 'everyone',
    is_18_plus:         is_18_plus ?? false,
    allow_comments:     allow_comments ?? true,
    allow_remixes:      allow_remixes ?? true,
    is_template:        is_template ?? false,
    is_ai_generated:    is_ai_generated ?? false,
    save_to_device:     save_to_device ?? true,
    save_with_watermark: save_with_watermark ?? false,
    allow_visual_search: allow_visual_search ?? true,
    is_ad:              is_ad ?? false,
    ad_only:            ad_only ?? false,
    cta_text:           cta_text || null,
    cta_url:            cta_url || null,
    sound_title:        sound_title || null,
    sound_url:          sound_url || null,
    sound_source:       sound_source || null,
    edit_state:         edit_state ?? {},
    status:             'published',
    published_at:       new Date().toISOString(),
  }).select('id').single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Save hashtags
  if (hashtags.length > 0) {
    await admin.from('post_hashtags').insert(
      hashtags.map((tag: string) => ({ post_id: post.id, tag: tag.toLowerCase() }))
    ).catch(() => {});
  }

  // Fire transcript + moderation async (don't block the response)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://villa9e.app';
  const moderationText = [caption, post_label, text_content].filter(Boolean).join(' ');

  Promise.allSettled([
    // Transcript (video/audio only)
    content_type === 'video' && media_url
      ? fetch(`${baseUrl}/api/studio/transcript`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ post_id: post.id, media_url }),
        })
      : null,
    // Moderation
    moderationText
      ? fetch(`${baseUrl}/api/studio/moderate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ post_id: post.id, text: moderationText, user_id: user.id }),
        })
      : null,
  ]).catch(() => {});

  // Award VLG for posting
  await admin.rpc('award_village_score', {
    p_user_id:      user.id,
    p_points:       is_workshop_content ? 20 : 10,
    p_vlg:          is_workshop_content ? 5 : 2,
    p_reason:       `Posted ${post_label ?? 'content'}`,
    p_reference_id: post.id,
  }).catch(() => {});

  // Notify tribe if tribe visibility
  if (visibility === 'tribe' && goal_id) {
    await admin.from('notifications').insert({
      user_id:        user.id,
      type:           'post',
      title:          'New post in your tribe',
      body:           caption?.slice(0, 100) ?? 'New content',
      reference_id:   post.id,
      reference_type: 'studio_post',
    }).catch(() => {});
  }

  return NextResponse.json({ postId: post.id, success: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = createServerClient() as any;
  const admin    = createAdminClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { post_id } = await req.json();
  if (!post_id) return NextResponse.json({ error: 'post_id required' }, { status: 400 });

  // Verify ownership before deleting
  const { data: post } = await admin.from('studio_posts').select('user_id').eq('id', post_id).single();
  if (!post || post.user_id !== user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await admin.from('studio_posts').delete().eq('id', post_id);

  return NextResponse.json({ success: true });
}
