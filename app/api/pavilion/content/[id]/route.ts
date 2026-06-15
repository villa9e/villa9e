import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const PALETTE = ['#2952E8', '#059669', '#7C3AED', '#E8770A', '#BE185D', '#D4A030', '#0EA5E9'];

function colorFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

function formatDuration(seconds: number | null) {
  if (!seconds || seconds <= 0) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${Math.round(seconds)}s`;
}

function categoryLabel(raw: string | null) {
  if (!raw) return 'General';
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient();

  const { data: post, error } = await (supabase as any)
    .from('studio_posts')
    .select('id, caption, description, media_url, thumbnail_url, content_type, duration_seconds, workshop_category, oowop_count, comment_count, view_count, created_at, profiles(username, avatar_url)')
    .eq('id', params.id)
    .maybeSingle();

  if (error || !post) {
    return NextResponse.json({ post: null, related: [] }, { status: 404 });
  }

  const { data: relatedRaw } = await (supabase as any)
    .from('studio_posts')
    .select('id, caption, thumbnail_url, media_url, duration_seconds, view_count, profiles(username)')
    .eq('status', 'published')
    .eq('visibility', 'everyone')
    .neq('id', params.id)
    .order('created_at', { ascending: false })
    .limit(3);

  return NextResponse.json({
    post: {
      id: post.id,
      title: post.caption || 'Untitled',
      description: post.description || '',
      creator: post.profiles?.username || 'village',
      duration: formatDuration(post.duration_seconds),
      category: categoryLabel(post.workshop_category),
      thumbnail_url: post.thumbnail_url || post.media_url || null,
      media_url: post.media_url || null,
      oowop_count: post.oowop_count ?? 0,
      comment_count: post.comment_count ?? 0,
      views: post.view_count ?? 0,
      created_at: post.created_at,
    },
    related: (relatedRaw ?? []).map((r: any) => ({
      id: r.id,
      title: r.caption || 'Untitled',
      creator: r.profiles?.username || 'village',
      duration: formatDuration(r.duration_seconds),
      thumbnail_color: colorFor(r.id),
    })),
  });
}
