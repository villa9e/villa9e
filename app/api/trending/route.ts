import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { callClaude } from '@/lib/claude/client';

// Cache for 6 hours
let cachedTrending: any[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 6 * 60 * 60 * 1000;

export async function GET() {
  const now = Date.now();
  if (cachedTrending && now - cacheTime < CACHE_TTL) {
    return NextResponse.json(cachedTrending);
  }

  try {
    const admin = createAdminClient();

    // Pull from seeded trending_goals table first
    const { data: seeded } = await (admin as any)
      .from('trending_goals')
      .select('title, category, emoji, momentum, search_volume')
      .gt('expires_at', new Date().toISOString())
      .order('search_volume', { ascending: false })
      .limit(10);

    if (seeded?.length >= 6) {
      const result = seeded.map((g: any) => ({
        title:    g.title,
        category: g.category,
        emoji:    g.emoji ?? '📍',
        momentum: g.momentum ?? 'steady',
        context:  '',
      }));
      cachedTrending = result;
      cacheTime = now;
      return NextResponse.json(result);
    }

    // Fallback: generate with Claude if DB is empty
    const month = new Date().toLocaleString('en-US', { month: 'long' });
    const year  = new Date().getFullYear();

    const prompt = `It's ${month} ${year}. Generate 8 specific, trending goal topics people are actually working toward right now.

Return JSON array:
[{"title":"...", "category":"...", "emoji":"...", "momentum":"rising|hot|steady", "context":"one sentence"}]

Categories: Business, Health, Finance, Education, Creative, Personal, Career, Relationships`;

    const result = await callClaude(prompt);
    const trending = Array.isArray(result) ? result.slice(0, 8) : [];

    // Seed into DB for next time (24h TTL)
    if (trending.length > 0) {
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      await (admin as any).from('trending_goals').insert(
        trending.map((t: any) => ({
          category:    t.category ?? 'Personal',
          trend_source:'claude_generated',
          search_volume: 1000,
          region:      'us',
          emoji:       t.emoji ?? '📍',
          title:       t.title,
          momentum:    t.momentum ?? 'steady',
          expires_at:  expires,
        }))
      ).catch(() => {});
    }

    cachedTrending = trending;
    cacheTime = now;
    return NextResponse.json(trending);
  } catch {
    return NextResponse.json([
      { title: 'Launch my first side income stream',    emoji: '🚀', momentum: 'hot',    category: 'Business' },
      { title: 'Record and release my first EP',        emoji: '🎵', momentum: 'hot',    category: 'Creative' },
      { title: 'Pay off $10,000 in debt',               emoji: '💰', momentum: 'rising', category: 'Finance'  },
      { title: 'Build a daily meditation practice',     emoji: '🧘', momentum: 'rising', category: 'Wellness' },
      { title: 'Learn to code in 3 months',             emoji: '💻', momentum: 'hot',    category: 'Education'},
      { title: 'Start investing with $100/month',       emoji: '📈', momentum: 'rising', category: 'Finance'  },
      { title: 'Create 30 days of consistent content',  emoji: '🎬', momentum: 'hot',    category: 'Creative' },
      { title: 'Get in the best shape of my life',      emoji: '💪', momentum: 'hot',    category: 'Health'   },
    ]);
  }
}
