// Admin API: manage curated feed items (TikTok oEmbed + YouTube)
// POST  { url }  → fetch oEmbed, store in DB, return item
// GET             → list all active items (sorted)
// DELETE { id }  → soft-delete (is_active = false)
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';

export const maxDuration = 20;

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /[?&]v=([^&]+)/,
    /youtu\.be\/([^?&]+)/,
    /embed\/([^?&]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function extractTikTokId(url: string): string | null {
  const m = url.match(/video\/(\d+)/);
  return m ? m[1] : null;
}

async function fetchTikTokOEmbed(url: string) {
  const endpoint = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
  const res = await fetch(endpoint, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; villa9e/1.0)' },
    next: { revalidate: 86400 },
  });
  if (!res.ok) throw new Error(`TikTok oEmbed returned ${res.status}`);
  return res.json();
}

async function isAdmin(supabase: any): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.from('profiles').select('is_super_admin').eq('id', user.id).single();
  return data?.is_super_admin === true;
}

// ── GET: list curated items ──────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const admin = createAdminClient() as any;
  const { data, error } = await admin
    .from('curated_feed_items')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

// ── POST: add a URL (TikTok or YouTube) ─────────────────────────────────────
export async function POST(req: NextRequest) {
  const supabase = createServerClient() as any;
  const adminDb  = createAdminClient() as any;

  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  const { url } = await req.json();
  if (!url?.trim()) return NextResponse.json({ error: 'url required' }, { status: 400 });

  const cleanUrl = url.trim();
  let record: Record<string, any> = { source_url: cleanUrl, curated_by: user!.id };

  // ── TikTok ──
  if (cleanUrl.includes('tiktok.com')) {
    try {
      const oembed = await fetchTikTokOEmbed(cleanUrl);
      record = {
        ...record,
        source_type:   'tiktok',
        title:         oembed.title ?? null,
        author_name:   oembed.author_name ?? null,
        embed_html:    oembed.html ?? null,
        thumbnail_url: oembed.thumbnail_url ?? null,
        video_id:      extractTikTokId(cleanUrl),
      };
    } catch (err: any) {
      return NextResponse.json({ error: `oEmbed fetch failed: ${err.message}` }, { status: 502 });
    }
  }
  // ── YouTube ──
  else if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) {
    const videoId = extractYouTubeId(cleanUrl);
    if (!videoId) return NextResponse.json({ error: 'Could not extract YouTube video ID' }, { status: 400 });
    record = {
      ...record,
      source_type:   'youtube',
      video_id:      videoId,
      thumbnail_url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      // title fetched client-side or left null (YouTube Data API optional)
    };
  } else {
    return NextResponse.json({ error: 'URL must be a TikTok or YouTube link' }, { status: 400 });
  }

  const { data, error } = await adminDb.from('curated_feed_items').insert(record).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data }, { status: 201 });
}

// ── DELETE: deactivate an item ───────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const supabase = createServerClient() as any;
  const adminDb  = createAdminClient() as any;

  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const { error } = await adminDb.from('curated_feed_items').update({ is_active: false }).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
