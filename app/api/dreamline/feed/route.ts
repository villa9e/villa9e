import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') ?? '30');
  const offset = parseInt(searchParams.get('offset') ?? '0');

  const configQuery: any = await (supabase as any)
    .from('dreamline_config')
    .select('*')
    .eq('id', 1)
    .single();
  const config: any = configQuery?.data ?? {};
  const algorithm: string = config?.algorithm ?? 'mission_scored';
  const minScore: number = config?.mission_score_minimum ?? 50;

  // Query dream_line_posts
  const dlQ = (supabase as any)
    .from('dream_line_posts')
    .select('*, profiles(username, avatar_url, village_score, score_tier, score_multiplier, personality_type)')
    .eq('visibility', 'public')
    .eq('is_hidden', false)
    .gte('mission_score', minScore)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Query studio_posts — normalize to dreamline shape
  const spQ = (supabase as any)
    .from('studio_posts')
    .select('id, user_id, caption, media_url, content_type, thumbnail_url, oowop_count, comment_count, visibility, created_at, profiles(username, avatar_url, score_tier)')
    .eq('visibility', 'everyone')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .range(offset, offset + Math.floor(limit / 3) - 1);

  const [dlResult, spResult] = await Promise.all([dlQ, spQ]);

  const dlPosts: any[] = dlResult?.data ?? [];

  // Normalize studio posts to match dreamline shape
  const studioNormalized: any[] = (spResult?.data ?? []).map((p: any) => ({
    id:            p.id,
    user_id:       p.user_id,
    content:       p.caption ?? '',
    media_url:     p.media_url ?? p.thumbnail_url ?? null,
    post_type:     p.content_type === 'video' ? 'reel' : p.content_type ?? 'reel',
    oowop_count:   p.oowop_count ?? 0,
    comment_count: p.comment_count ?? 0,
    visibility:    'public',
    created_at:    p.created_at,
    profiles:      p.profiles,
    mission_score: 75,
    is_hidden:     false,
    _source:       'studio',
  }));

  // Merge and sort by created_at descending
  const all = [...dlPosts, ...studioNormalized].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  if (algorithm === 'hybrid' && all.length > 0) {
    const oowopW: number  = config?.oowop_weight ?? 0.4;
    const recencyW: number = config?.recency_weight ?? 0.3;
    const missionW: number = config?.mission_weight ?? 0.3;
    const now = Date.now();
    const scored = all.map((p: any) => {
      const ageHours = (now - new Date(p.created_at).getTime()) / 3600000;
      const recencyScore = Math.max(0, 100 - ageHours * 2);
      const oowopScore = Math.min(100, (p.oowop_count ?? 0) * 10);
      const missionScore = p.mission_score ?? 75;
      return { ...p, _composite: oowopScore * oowopW + recencyScore * recencyW + missionScore * missionW };
    });
    scored.sort((a: any, b: any) => b._composite - a._composite);
    return NextResponse.json(scored.slice(0, limit));
  }

  return NextResponse.json(all.slice(0, limit));
}
