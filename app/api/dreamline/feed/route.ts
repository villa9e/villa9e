import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') ?? '30');
  const offset = parseInt(searchParams.get('offset') ?? '0');

  // Load algorithm config — cast to any (migration table)
  const configQuery: any = await (supabase as any)
    .from('dreamline_config')
    .select('*')
    .eq('id', 1)
    .single();
  const config: any = configQuery?.data ?? {};

  const algorithm: string = config?.algorithm ?? 'mission_scored';
  const minScore: number = config?.mission_score_minimum ?? 50;

  // Base query — exclude hidden posts and posts below mission threshold
  const baseQ = (supabase as any)
    .from('dream_line_posts')
    .select('*, profiles(username, avatar_url, village_score, score_tier)')
    .eq('visibility', 'public')
    .eq('is_hidden', false)
    .gte('mission_score', minScore);

  let orderedQ: any;
  if (algorithm === 'chronological') {
    orderedQ = baseQ.order('created_at', { ascending: false });
  } else if (algorithm === 'engagement') {
    orderedQ = baseQ.order('oowop_count', { ascending: false }).order('created_at', { ascending: false });
  } else if (algorithm === 'mission_scored') {
    orderedQ = baseQ.order('mission_score', { ascending: false }).order('created_at', { ascending: false });
  } else {
    orderedQ = baseQ.order('created_at', { ascending: false });
  }

  const feedResult: any = await orderedQ.range(offset, offset + limit - 1);
  if (feedResult?.error) return NextResponse.json([], { status: 500 });
  const posts: any[] = feedResult?.data ?? [];

  // Hybrid algorithm: compute composite score client-side
  if (algorithm === 'hybrid' && posts.length > 0) {
    const oowopW: number = config?.oowop_weight ?? 0.4;
    const recencyW: number = config?.recency_weight ?? 0.3;
    const missionW: number = config?.mission_weight ?? 0.3;
    const now = Date.now();

    const scored = posts.map((p: any) => {
      const ageHours = (now - new Date(p.created_at).getTime()) / 3600000;
      const recencyScore = Math.max(0, 100 - ageHours * 2);
      const oowopScore = Math.min(100, (p.oowop_count ?? 0) * 10);
      const missionScore = p.mission_score ?? 75;
      const composite = oowopScore * oowopW + recencyScore * recencyW + missionScore * missionW;
      return { ...p, _composite: composite };
    });
    scored.sort((a: any, b: any) => b._composite - a._composite);
    return NextResponse.json(scored);
  }

  // Keyword boost/suppress
  if ((config?.boost_keywords?.length || config?.suppress_keywords?.length) && posts.length > 0) {
    const boostWords: string[] = config?.boost_keywords ?? [];
    const suppressWords: string[] = config?.suppress_keywords ?? [];

    const boosted = posts.map((p: any) => {
      const content = (p.content ?? '').toLowerCase();
      let modifier = 0;
      boostWords.forEach((w: string) => { if (content.includes(w)) modifier += 10; });
      suppressWords.forEach((w: string) => { if (content.includes(w)) modifier -= 5; });
      return { ...p, _keyword_modifier: modifier };
    });

    if (algorithm !== 'chronological') {
      boosted.sort((a: any, b: any) => (b._keyword_modifier ?? 0) - (a._keyword_modifier ?? 0));
    }
    return NextResponse.json(boosted);
  }

  return NextResponse.json(posts);
}
