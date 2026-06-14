import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

function initials(name: string): string {
  const parts = (name ?? '').trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (name ?? '').slice(0, 2).toUpperCase();
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') ?? '').trim();

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  const ilike = `%${q}%`;
  const db = createAdminClient() as any;

  const [profilesRes, postsRes, goalsRes, dealsRes, storesRes] = await Promise.allSettled([
    // 1. Profiles
    db.from('profiles')
      .select('id, username, display_name, avatar_url')
      .or(`username.ilike.${ilike},display_name.ilike.${ilike}`)
      .limit(3),

    // 2. DreamLine posts
    db.from('dream_line_posts')
      .select('id, content')
      .ilike('content', ilike)
      .limit(3),

    // 3. Goals (public — no extra is_public filter; goals visible by title)
    db.from('goals')
      .select('id, title, category')
      .ilike('title', ilike)
      .limit(3),

    // 4. Deals — active only
    db.from('investor_deals')
      .select('id, name, industry, status')
      .ilike('name', ilike)
      .eq('status', 'active')
      .limit(3),

    // 5. eStores — active only
    db.from('estores')
      .select('id, store_name, tagline, status')
      .ilike('store_name', ilike)
      .eq('status', 'active')
      .limit(3),
  ]);

  const results: any[] = [];

  // Profiles
  if (profilesRes.status === 'fulfilled' && profilesRes.value.data) {
    for (const p of profilesRes.value.data) {
      const name = p.display_name || p.username || '';
      results.push({
        type:     'user',
        id:       p.id,
        title:    p.display_name || `@${p.username}`,
        subtitle: p.username ? `@${p.username}` : undefined,
        href:     `/village/hut?userId=${p.id}`,
        avatar:   p.avatar_url ?? null,
        emoji:    !p.avatar_url ? initials(name) : undefined,
      });
    }
  }

  // Posts
  if (postsRes.status === 'fulfilled' && postsRes.value.data) {
    for (const p of postsRes.value.data) {
      results.push({
        type:     'post',
        id:       p.id,
        title:    (p.content ?? '').slice(0, 60) + ((p.content ?? '').length > 60 ? '…' : ''),
        subtitle: (p.content ?? '').slice(0, 60),
        href:     '/village/dreamline',
        avatar:   null,
      });
    }
  }

  // Goals
  if (goalsRes.status === 'fulfilled' && goalsRes.value.data) {
    for (const g of goalsRes.value.data) {
      results.push({
        type:     'goal',
        id:       g.id,
        title:    g.title,
        subtitle: g.category ?? undefined,
        href:     '/village/workshop',
        avatar:   null,
      });
    }
  }

  // Deals
  if (dealsRes.status === 'fulfilled' && dealsRes.value.data) {
    for (const d of dealsRes.value.data) {
      results.push({
        type:     'deal',
        id:       d.id,
        title:    d.name,
        subtitle: d.industry ?? undefined,
        href:     '/village/trading-post/deals',
        avatar:   null,
      });
    }
  }

  // eStores
  if (storesRes.status === 'fulfilled' && storesRes.value.data) {
    for (const s of storesRes.value.data) {
      results.push({
        type:     'market',
        id:       s.id,
        title:    s.store_name,
        subtitle: s.tagline ?? undefined,
        href:     `/village/trading-post/market/${s.id}`,
        avatar:   null,
      });
    }
  }

  return NextResponse.json({ results });
}
