import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// Step-level ad targeting: match ads to what a user is working on
export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json([], { status: 401 });

  const { goal_category, step_title, step_index } = await req.json();

  // Fetch active ads matching this step's context
  const { data: ads } = await supabase
    .from('ad_placements')
    .select('*')
    .eq('is_active', true)
    .or(`target_categories.cs.{${goal_category}},target_categories.cs.{All}`)
    .order('bid_amount', { ascending: false })
    .limit(3);

  if (!ads || ads.length === 0) {
    // Return curated house ads if no paid placements
    return NextResponse.json(getHouseAds(goal_category));
  }

  // Log impression
  const now = new Date().toISOString();
  await (supabase as any).from('ad_impressions').insert(
    ads.map(ad => ({ ad_id: ad.id, user_id: user.id, goal_category, step_title, step_index, shown_at: now }))
  );

  return NextResponse.json(ads);
}

function getHouseAds(category: string): any[] {
  const houseAds: Record<string, any[]> = {
    Business: [
      { id: 'h1', title: 'Find your co-founder', body: 'Post your startup idea to the Trading Post', cta: 'Go to Trading Post', url: '/village/trading-post', icon: '🤝' },
    ],
    Health: [
      { id: 'h2', title: 'Book a wellness provider', body: 'Licensed therapists and coaches in the village', cta: 'Browse Providers', url: '/village/hospital/providers', icon: '🩺' },
    ],
    Financial: [
      { id: 'h3', title: 'Fund your goal', body: 'Launch a crowdfunding campaign with 0% platform fee', cta: 'Start Campaign', url: '/village/bank/crowdfunding', icon: '🤝' },
    ],
    Education: [
      { id: 'h4', title: 'Find your tribe', body: 'Connect with villagers on the same learning path', cta: 'Join a Tribe', url: '/village/tribes', icon: '👥' },
    ],
  };
  return houseAds[category] ?? [
    { id: 'h0', title: 'Clone a proven blueprint', body: 'Goal DNA templates from villagers who completed similar goals', cta: 'Browse DNA', url: '/village/workshop/templates', icon: '🧬' },
  ];
}
