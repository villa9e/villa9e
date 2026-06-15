import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const PALETTE = ['#2952E8', '#059669', '#7C3AED', '#E8770A', '#BE185D', '#D4A030', '#0EA5E9'];

function colorFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  const { searchParams } = new URL(req.url);
  const search = (searchParams.get('search') || '').toLowerCase();

  const { data, error } = await (supabase as any)
    .from('studio_posts')
    .select('user_id, view_count, profiles(username, display_name, avatar_url)')
    .eq('status', 'published')
    .eq('visibility', 'everyone')
    .limit(500);

  if (error) return NextResponse.json({ creators: [] });

  const byUser = new Map<string, { username: string; displayName: string; posts: number; views: number }>();
  for (const row of data ?? []) {
    const username = row.profiles?.username;
    if (!username) continue;
    const entry = byUser.get(row.user_id) || { username, displayName: row.profiles?.display_name || username, posts: 0, views: 0 };
    entry.posts += 1;
    entry.views += row.view_count ?? 0;
    byUser.set(row.user_id, entry);
  }

  let creators = Array.from(byUser.entries()).map(([id, c]) => ({
    id,
    name: c.displayName,
    handle: c.username,
    posts: c.posts,
    views: c.views,
    color: colorFor(id),
  }));

  if (search) {
    creators = creators.filter(c => c.name.toLowerCase().includes(search) || c.handle.toLowerCase().includes(search));
  }

  creators.sort((a, b) => b.views - a.views);

  return NextResponse.json({ creators });
}
