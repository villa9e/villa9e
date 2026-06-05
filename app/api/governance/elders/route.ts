import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const MOCK_ELDERS = [
  { id: 'mock-e1', username: 'legaci',         display_name: 'Legaci Jackson',  avatar_url: null, vlg_balance: 15000, staking_tier: 'elder', proposals_authored: 5,  participation_rate: 98, village_score: 9800 },
  { id: 'mock-e2', username: 'village_elder',  display_name: 'Village Elder',   avatar_url: null, vlg_balance: 8500,  staking_tier: 'elder', proposals_authored: 3,  participation_rate: 87, village_score: 6700 },
  { id: 'mock-e3', username: 'builder9',       display_name: 'Builder Nine',    avatar_url: null, vlg_balance: 5200,  staking_tier: 'elder', proposals_authored: 2,  participation_rate: 75, village_score: 4200 },
  { id: 'mock-e4', username: 'pioneer_dee',    display_name: 'Pioneer Dee',     avatar_url: null, vlg_balance: 3100,  staking_tier: 'elder', proposals_authored: 1,  participation_rate: 72, village_score: 3900 },
  { id: 'mock-e5', username: 'compass_life',   display_name: 'Compass Life',    avatar_url: null, vlg_balance: 2400,  staking_tier: 'elder', proposals_authored: 0,  participation_rate: 65, village_score: 3100 },
];

export async function GET(req: NextRequest) {
  const supabase = createAdminClient() as any;
  const { searchParams } = new URL(req.url);

  const sort     = searchParams.get('sort') ?? 'staked';
  const page     = parseInt(searchParams.get('page') ?? '1', 10);
  const pageSize = 20;
  const offset   = (page - 1) * pageSize;

  // Query profiles where staking_tier = 'elder' OR vlg_balance >= 2000
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, vlg_balance, staking_tier, village_score')
    .or('staking_tier.eq.elder,vlg_balance.gte.2000')
    .range(offset, offset + pageSize - 1);

  if (error || !data || data.length === 0) {
    // Sort mock data
    let sorted = [...MOCK_ELDERS];
    if (sort === 'proposals')     sorted.sort((a, b) => b.proposals_authored - a.proposals_authored);
    else if (sort === 'participation') sorted.sort((a, b) => b.participation_rate - a.participation_rate);
    else /* staked */             sorted.sort((a, b) => b.vlg_balance - a.vlg_balance);

    return NextResponse.json({
      elders:  sorted.slice(offset, offset + pageSize),
      total:   sorted.length,
      page,
      isMock:  true,
    });
  }

  // Sort real data
  let sorted = [...data];
  if (sort === 'staked') {
    sorted.sort((a: any, b: any) => (b.vlg_balance ?? 0) - (a.vlg_balance ?? 0));
  } else {
    // For proposals/participation we don't have those columns — fall back to village_score
    sorted.sort((a: any, b: any) => (b.village_score ?? 0) - (a.village_score ?? 0));
  }

  return NextResponse.json({
    elders: sorted,
    total:  sorted.length,
    page,
    isMock: false,
  });
}
