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

export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');

  let query = (supabase as any)
    .from('studio_posts')
    .select('id, caption, media_url, thumbnail_url, content_type, duration_seconds, workshop_category, view_count, created_at, profiles(username, avatar_url)')
    .eq('status', 'published')
    .eq('visibility', 'everyone')
    .order('created_at', { ascending: false })
    .limit(60);

  const { data, error } = await query;
  if (error) return NextResponse.json({ items: [], categories: ['All'] });

  let items = (data ?? []).map((p: any) => ({
    id: p.id,
    title: p.caption || 'Untitled',
    creator: p.profiles?.username || 'village',
    duration: formatDuration(p.duration_seconds),
    category: categoryLabel(p.workshop_category),
    free: true,
    thumbnail_url: p.thumbnail_url || p.media_url || null,
    thumbnail_color: colorFor(p.id),
    views: p.view_count ?? 0,
    created_at: p.created_at,
  }));

  const categories = ['All', ...Array.from(new Set(items.map((i: any) => i.category as string)))];

  if (category && category !== 'All') {
    items = items.filter((i: any) => i.category === category);
  }

  return NextResponse.json({ items, categories });
}
