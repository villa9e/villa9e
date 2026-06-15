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

export async function GET(req: NextRequest, { params }: { params: { handle: string } }) {
  const supabase = createServerClient();

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('id, username, display_name, bio, avatar_url, created_at')
    .ilike('username', params.handle)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ profile: null, videos: [], liveEvents: [] }, { status: 404 });
  }

  const { data: posts } = await (supabase as any)
    .from('studio_posts')
    .select('id, caption, thumbnail_url, media_url, duration_seconds, view_count, created_at')
    .eq('user_id', profile.id)
    .eq('status', 'published')
    .eq('visibility', 'everyone')
    .order('created_at', { ascending: false })
    .limit(30);

  const { data: shows } = await (supabase as any)
    .from('pavilion_shows')
    .select('id, title, type, status, starts_at, attendee_count')
    .eq('host_id', profile.id)
    .in('status', ['live', 'scheduled'])
    .order('starts_at', { ascending: true })
    .limit(10);

  return NextResponse.json({
    profile: {
      name: profile.display_name || profile.username,
      handle: profile.username,
      bio: profile.bio || '',
      avatar_url: profile.avatar_url || null,
      created_at: profile.created_at,
      color: colorFor(profile.id),
    },
    videos: (posts ?? []).map((p: any) => ({
      id: p.id,
      title: p.caption || 'Untitled',
      duration: formatDuration(p.duration_seconds),
      views: p.view_count ?? 0,
      color: colorFor(p.id),
    })),
    liveEvents: (shows ?? []).map((s: any) => ({
      id: s.id,
      title: s.title,
      type: s.type,
      status: s.status,
      starts_at: s.starts_at,
      attendee_count: s.attendee_count ?? 0,
    })),
  });
}
