// Auto-seeds curated_feed_items from YouTube Data API.
// No manual curation needed — searches by goal context + 6 theme buckets.
// POST {} → run a full seed pass
// GET  → show current item count per category
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const maxDuration = 60;

const YT_API_KEY = process.env.YOUTUBE_API_KEY ?? '';

const THEME_BUCKETS: Record<string, string[]> = {
  motivation: [
    'motivation success mindset powerful speech',
    'overcome obstacles stay focused achieve goals',
    'morning motivation high energy success habits',
  ],
  spiritual: [
    'spiritual growth purpose driven life awakening',
    'faith mindset divine purpose breakthrough',
    'spirituality self discovery inner peace wisdom',
  ],
  wealth: [
    'building generational wealth financial freedom mindset',
    'investing money smart wealth building strategies',
    'financial literacy millionaire mindset money habits',
  ],
  business: [
    'entrepreneurship build business from scratch success story',
    'startup founder journey build your brand empire',
    'small business tips scale grow revenue online',
  ],
  coaching: [
    'life coaching transformation personal power breakthrough',
    'mindset coach high performance habits discipline',
    'personal development self improvement success principles',
  ],
  community: [
    'community growth collective success village mentality',
    'supporting each other unity community empowerment',
    'black excellence community wealth building together',
  ],
};

// YouTube search → array of { videoId, title, channelTitle, thumbnailUrl }
async function searchYouTube(query: string, maxResults = 8): Promise<YouTubeVideo[]> {
  const url = new URL('https://www.googleapis.com/youtube/v3/search');
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('q', query);
  url.searchParams.set('type', 'video');
  url.searchParams.set('maxResults', String(maxResults));
  url.searchParams.set('videoCategoryId', '22'); // People & Blogs — most motivational content
  url.searchParams.set('relevanceLanguage', 'en');
  url.searchParams.set('safeSearch', 'moderate');
  url.searchParams.set('key', YT_API_KEY);

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) {
    console.error('YouTube API error', res.status, await res.text());
    return [];
  }
  const data = await res.json();
  return (data.items ?? []).map((item: any) => ({
    videoId:      item.id.videoId,
    title:        item.snippet.title,
    channelTitle: item.snippet.channelTitle,
    thumbnailUrl: item.snippet.thumbnails?.high?.url ?? item.snippet.thumbnails?.default?.url ?? '',
  }));
}

interface YouTubeVideo {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
}

// GET: return stats only
export async function GET() {
  const admin = createAdminClient() as any;
  const { data, error } = await admin
    .from('curated_feed_items')
    .select('source_type, created_at')
    .eq('is_active', true);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ total: data?.length ?? 0, items: data ?? [] });
}

// POST: seed YouTube videos across all theme buckets + active user goals
export async function POST(req: NextRequest) {
  if (!YT_API_KEY) {
    return NextResponse.json({ error: 'YOUTUBE_API_KEY not configured' }, { status: 500 });
  }

  const admin = createAdminClient() as any;

  // Fetch existing video_ids so we don't duplicate
  const { data: existing } = await admin
    .from('curated_feed_items')
    .select('video_id')
    .eq('source_type', 'youtube')
    .eq('is_active', true);

  const existingIds = new Set<string>((existing ?? []).map((r: any) => r.video_id).filter(Boolean));

  // Fetch active goal/sprint/action titles for goal-aligned content
  const { data: goals } = await admin
    .from('goals')
    .select('title, category')
    .eq('is_active', true)
    .limit(20);

  const goalQueries: string[] = (goals ?? [])
    .map((g: any) => `${g.title ?? ''} ${g.category ?? ''} success motivation`.trim())
    .filter((q: string) => q.length > 5);

  // Build full query list: all theme bucket queries + goal queries
  const allQueries: Array<{ query: string; category: string }> = [];
  for (const [category, queries] of Object.entries(THEME_BUCKETS)) {
    for (const q of queries) {
      allQueries.push({ query: q, category });
    }
  }
  for (const q of goalQueries) {
    allQueries.push({ query: q, category: 'goal' });
  }

  // Search YouTube in parallel (batch of 6 to avoid hammering the API)
  const BATCH = 6;
  const allVideos: Array<YouTubeVideo & { category: string }> = [];

  for (let i = 0; i < allQueries.length; i += BATCH) {
    const batch = allQueries.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map(({ query, category }) =>
        searchYouTube(query, 8).then(vids => vids.map(v => ({ ...v, category })))
      )
    );
    allVideos.push(...results.flat());
  }

  // Deduplicate by videoId, skip existing
  const seen = new Set<string>(existingIds);
  const toInsert: Array<Record<string, any>> = [];

  for (const v of allVideos) {
    if (!v.videoId || seen.has(v.videoId)) continue;
    seen.add(v.videoId);
    toInsert.push({
      source_type:   'youtube',
      source_url:    `https://www.youtube.com/watch?v=${v.videoId}`,
      title:         v.title,
      author_name:   v.channelTitle,
      thumbnail_url: v.thumbnailUrl,
      video_id:      v.videoId,
      is_active:     true,
      sort_order:    0,
    });
  }

  if (toInsert.length === 0) {
    return NextResponse.json({ inserted: 0, message: 'No new videos found — all already in DB' });
  }

  // Insert in chunks to stay under Supabase payload limits
  const CHUNK = 50;
  let inserted = 0;
  for (let i = 0; i < toInsert.length; i += CHUNK) {
    const chunk = toInsert.slice(i, i + CHUNK);
    const { error } = await admin.from('curated_feed_items').insert(chunk);
    if (error) {
      console.error('Insert chunk error:', error.message);
    } else {
      inserted += chunk.length;
    }
  }

  return NextResponse.json({
    inserted,
    skipped: toInsert.length - inserted + (allVideos.length - toInsert.length),
    categories: Object.keys(THEME_BUCKETS),
    goalQueriesRan: goalQueries.length,
  });
}
