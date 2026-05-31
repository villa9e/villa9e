// GPS — Workshop content feed for a specific action
// Returns YouTube + user-generated content relevant to the current action.
// Adapts to user format preferences (short vs long form).
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';

export const maxDuration = 30;

const YT_KEY = process.env.YOUTUBE_API_KEY;

async function searchYouTube(query: string, maxResults = 6, preferShort = false) {
  if (!YT_KEY) return [];
  try {
    const params = new URLSearchParams({
      part: 'snippet',
      q: query,
      type: 'video',
      maxResults: String(maxResults),
      relevanceLanguage: 'en',
      key: YT_KEY,
      ...(preferShort ? { videoDuration: 'short' } : {}),
    });
    const r = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`, { next: { revalidate: 3600 } });
    const d = await r.json();
    return (d.items ?? []).map((item: any) => ({
      id:           item.id.videoId,
      title:        item.snippet.title,
      channel:      item.snippet.channelTitle,
      thumbnail:    item.snippet.thumbnails.medium?.url ?? item.snippet.thumbnails.default?.url,
      publishedAt:  item.snippet.publishedAt,
      source:       'youtube',
      format:       preferShort ? 'short' : 'long',
    }));
  } catch { return []; }
}

const GENERAL_QUERIES = [
  'motivation inspiration success mindset',
  'habits productivity self improvement',
  'goal setting achievement success',
  'personal development growth mindset',
  'morning routine success habits',
];

export async function POST(req: NextRequest) {
  const supabase = createServerClient() as any;
  const admin    = createAdminClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { action_title, goal_title, goal_category, goal_id } = await req.json();

  // No goal selected — return general motivational/wellness content
  if (!goal_id && !action_title) {
    const q = GENERAL_QUERIES[Math.floor(Math.random() * GENERAL_QUERIES.length)];
    const [yt1, yt2] = await Promise.all([
      searchYouTube(q, 5, false),
      searchYouTube('wellness wellbeing mental health growth', 4, true),
    ]);
    const seen = new Set<string>();
    const feed = [...yt1, ...yt2].filter(v => { if (seen.has(v.id)) return false; seen.add(v.id); return true; });
    return NextResponse.json({ feed, preferredFormat: 'long', actionTitle: null, totalResults: feed.length, isGeneral: true });
  }

  // Load user format preferences + studio content in parallel
  const [prefRes, studioRes] = await Promise.allSettled([
    admin.from('user_workshop_preferences').select('*').eq('user_id', user.id).single(),
    admin.from('studio_videos')
      .select('id, title, thumbnail_url, video_url, watch_count, likes, duration_seconds, is_affiliate')
      .or(`title.ilike.%${action_title.split(' ')[0]}%, title.ilike.%${goal_category}%`)
      .order('watch_count', { ascending: false })
      .limit(4),
  ]);

  const prefs = prefRes.status === 'fulfilled' ? prefRes.value.data : null;
  const studioVideos = studioRes.status === 'fulfilled' ? (studioRes.value.data ?? []) : [];

  // Determine format preference
  const preferShort = prefs
    ? prefs.short_views > prefs.long_views
    : false;

  // Build search queries: one specific to action, one broader to goal
  const query1 = `${action_title} tutorial how to ${goal_category}`;
  const query2 = `${goal_title} ${action_title}`;

  const [yt1, yt2] = await Promise.all([
    searchYouTube(query1, 4, preferShort),
    searchYouTube(query2, 3, !preferShort), // alternate format for variety
  ]);

  // Merge and deduplicate YouTube results
  const seen = new Set<string>();
  const ytVideos = [...yt1, ...yt2].filter(v => {
    if (seen.has(v.id)) return false;
    seen.add(v.id);
    return true;
  });

  // Format studio videos to match structure
  const studio = studioVideos.map((v: any) => ({
    id:        v.id,
    title:     v.title,
    thumbnail: v.thumbnail_url,
    source:    'studio',
    format:    (v.duration_seconds ?? 0) < 90 ? 'short' : 'long',
    watchCount: v.watch_count,
    likes:     v.likes,
  }));

  // Interleave: studio first (own content = higher relevance), then YouTube
  const feed = [...studio, ...ytVideos];

  return NextResponse.json({
    feed,
    preferredFormat: preferShort ? 'short' : 'long',
    actionTitle: action_title,
    totalResults: feed.length,
  });
}
