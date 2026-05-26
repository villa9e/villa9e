import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') ?? '30');
  const offset = parseInt(searchParams.get('offset') ?? '0');

  // Load algorithm config
  const { data: config } = await (supabase as any)
    .from('dreamline_config')
    .select('*')
    .eq('id', 1)
    .single();

  const algorithm = config?.algorithm ?? 'mission_scored';
  const minScore = config?.mission_score_minimum ?? 50;

  // Base query — always exclude hidden posts
  let q = (supabase as any)
    .from('dream_line_posts')
    .select('*, profiles(username, avatar_url, village_score, score_tier)')
    .eq('visibility', 'public')
    .eq('is_hidden', false)
    .gte('mission_score', minScore);

  // Apply ordering based on algorithm
  if (algorithm === 'chronological') {
    q = q.order('created_at', { ascending: false });
  } else if (algorithm === 'engagement') {
    q = q.order('oowop_count', { ascending: false }).order('created_at', { ascending: false });
  } else if (algorithm === 'mission_scored') {
    q = q.order('mission_score', { ascending: false }).order('created_at', { ascending: false });
  } else {
    // hybrid — score computed client side, but order by mission_score for initial fetch
    q = q.order('created_at', { ascending: false });
  }

  const { data: posts, error } = await q.range(offset, offset + limit - 1);
  if (error) return NextResponse.json([], { status: 500 });

  // For hybrid algorithm, compute composite score
  if (algorithm === 'hybrid' && posts) {
    const oowopW = config?.oowop_weight ?? 0.4;
    const recencyW = config?.recency_weight ?? 0.3;
    const missionW = config?.mission_weight ?? 0.3;
    const now = Date.now();

    const scored = posts.map(p => {
      const ageHours = (now - new Date(p.created_at).getTime()) / 3600000;
      const recencyScore = Math.max(0, 100 - ageHours * 2); // decays over 50h
      const oowopScore = Math.min(100, (p.oowop_count ?? 0) * 10);
      const missionScore = p.mission_score ?? 75;
      const composite = oowopScore * oowopW + recencyScore * recencyW + missionScore * missionW;
      return { ...p, _composite: composite };
    });

    scored.sort((a, b) => b._composite - a._composite);
    return NextResponse.json(scored);
  }

  // Apply keyword boosts/suppresses to ranking
  if ((config?.boost_keywords?.length || config?.suppress_keywords?.length) && posts) {
    const boostWords: string[] = config?.boost_keywords ?? [];
    const suppressWords: string[] = config?.suppress_keywords ?? [];

    const boosted = posts.map(p => {
      const content = (p.content ?? '').toLowerCase();
      let modifier = 0;
      boostWords.forEach((w: string) => { if (content.includes(w)) modifier += 10; });
      suppressWords.forEach((w: string) => { if (content.includes(w)) modifier -= 5; });
      return { ...p, _keyword_modifier: modifier };
    });

    if (algorithm !== 'chronological') {
      boosted.sort((a, b) => (b._keyword_modifier ?? 0) - (a._keyword_modifier ?? 0));
    }

    return NextResponse.json(boosted);
  }

  return NextResponse.json(posts ?? []);
}
