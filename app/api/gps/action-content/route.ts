// GPS — Workshop content feed for a specific action
// Returns YouTube + user-generated content relevant to the current action.
// Adapts to user format preferences (short vs long form).
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';

export const maxDuration = 30;

const YT_KEY = process.env.YOUTUBE_API_KEY;

const FALLBACK_CONTENT = [
  { id: 'fb1', title: 'How to Set and Achieve Big Goals', channel: 'The Village', thumbnail: null, source: 'youtube', format: 'long' },
  { id: 'fb2', title: 'Building Momentum: Small Steps, Big Results', channel: 'The Village', thumbnail: null, source: 'youtube', format: 'short' },
  { id: 'fb3', title: 'The Science of Habit Formation', channel: 'The Village', thumbnail: null, source: 'youtube', format: 'long' },
  { id: 'fb4', title: 'Overcoming Obstacles on the Road to Success', channel: 'The Village', thumbnail: null, source: 'youtube', format: 'long' },
  { id: 'fb5', title: 'Daily Routines of High Achievers', channel: 'The Village', thumbnail: null, source: 'youtube', format: 'short' },
];

async function searchYouTube(query: string, maxResults = 6, videoDuration?: 'short' | 'medium' | 'long') {
  if (!YT_KEY) return [];
  try {
    const params = new URLSearchParams({
      part: 'snippet',
      q: query,
      type: 'video',
      maxResults: String(maxResults),
      relevanceLanguage: 'en',
      key: YT_KEY,
      ...(videoDuration ? { videoDuration } : {}),
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
      format:       videoDuration === 'short' ? 'short' : 'long',
    }));
  } catch { return []; }
}

// Thematic buckets aligned with villa9e: village, purpose, wealth, spirit, growth
const THEME_BUCKETS: Record<string, string[]> = {
  motivation: [
    'motivation success mindset powerful speech',
    'daily motivation discipline focus winners mentality',
    'overcome adversity mental strength resilience champions',
  ],
  spiritual: [
    'spiritual growth purpose driven life awakening',
    'faith purpose destiny fulfillment divine calling',
    'finding your calling spiritual journey transformation',
  ],
  wealth: [
    'building generational wealth financial freedom mindset',
    'wealth consciousness abundance prosperity money mindset',
    'investing for beginners build wealth from nothing',
  ],
  business: [
    'entrepreneurship build business from scratch success story',
    'black entrepreneurship business success community wealth',
    'startup founder hustle build empire entrepreneur mindset',
  ],
  coaching: [
    'life coaching transformation personal power breakthrough',
    'how to change your life mindset shift life coach',
    'peak performance habits high achievers life mastery',
  ],
  community: [
    'community growth collective success village mentality',
    'brotherhood sisterhood loyalty support success together',
    'legacy building family community purpose impact generational',
  ],
};

function pickGeneralQueries(): [string, string] {
  const buckets = Object.values(THEME_BUCKETS);
  const shuffled = [...buckets].sort(() => Math.random() - 0.5);
  const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
  return [pick(shuffled[0]), pick(shuffled[1])];
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient() as any;
  const admin    = createAdminClient() as any;

  const { action_title, goal_title, goal_category, goal_id, action_level } = await req.json();

  // No goal context — return themed content (no auth needed, public YouTube)
  if (!goal_id && !action_title) {
    const [q1, q2] = pickGeneralQueries();
    const [yt1, yt2] = await Promise.all([
      searchYouTube(q1, 5),
      searchYouTube(q2, 5),
    ]);
    const seen = new Set<string>();
    const ytFeed = [...yt1, ...yt2].filter(v => { if (seen.has(v.id)) return false; seen.add(v.id); return true; });
    const feed = ytFeed.length > 0 ? ytFeed : FALLBACK_CONTENT;
    return NextResponse.json({ feed, preferredFormat: 'long', actionTitle: null, totalResults: feed.length, isGeneral: true });
  }

  // Goal-specific: require auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Studio query, with a duration filter for action levels that have a strong
  // format preference (Wayfinder = step-by-step detail, Trailblazer = quick hits)
  let studioQuery = admin.from('studio_videos')
    .select('id, title, thumbnail_url, video_url, watch_count, likes, duration_seconds, is_affiliate')
    .or(`title.ilike.%${action_title.split(' ')[0]}%, title.ilike.%${goal_category}%`);
  if (action_level === 1) studioQuery = studioQuery.gt('duration_seconds', 600);   // Wayfinder: >10min
  else if (action_level === 3) studioQuery = studioQuery.lt('duration_seconds', 480); // Trailblazer: <8min
  studioQuery = studioQuery.order('watch_count', { ascending: false }).limit(4);

  // Load user format preferences + studio content in parallel
  const [prefRes, studioRes] = await Promise.allSettled([
    admin.from('user_workshop_preferences').select('*').eq('user_id', user.id).single(),
    studioQuery,
  ]);

  const prefs = prefRes.status === 'fulfilled' ? prefRes.value.data : null;
  const studioVideos = studioRes.status === 'fulfilled' ? (studioRes.value.data ?? []) : [];

  // Determine format preference: action level overrides the learned short/long preference
  // (1 = Wayfinder prefers >10min/medium, 3 = Trailblazer prefers <8min/short)
  const preferShort = prefs ? prefs.short_views > prefs.long_views : false;
  let videoDuration1: 'short' | 'medium' | 'long' | undefined;
  let videoDuration2: 'short' | 'medium' | 'long' | undefined;
  if (action_level === 1) { videoDuration1 = 'medium'; videoDuration2 = 'long'; }
  else if (action_level === 3) { videoDuration1 = 'short'; videoDuration2 = 'short'; }
  else { videoDuration1 = preferShort ? 'short' : undefined; videoDuration2 = preferShort ? undefined : 'short'; }

  // Build search queries: one specific to action, one broader to goal
  const query1 = `${action_title} tutorial how to ${goal_category}`;
  const query2 = `${goal_title} ${action_title}`;

  const [yt1, yt2] = await Promise.all([
    searchYouTube(query1, 4, videoDuration1),
    searchYouTube(query2, 3, videoDuration2), // alternate format for variety
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

  // Interleave: studio first (own content = higher relevance), then YouTube (fallback if no results)
  const ytOrFallback = ytVideos.length > 0 ? ytVideos : FALLBACK_CONTENT;
  const feed = [...studio, ...ytOrFallback];

  return NextResponse.json({
    feed,
    preferredFormat: action_level === 1 ? 'long' : action_level === 3 ? 'short' : (preferShort ? 'short' : 'long'),
    actionTitle: action_title,
    totalResults: feed.length,
  });
}
