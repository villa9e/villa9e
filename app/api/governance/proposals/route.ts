import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const MOCK_PROPOSALS = [
  {
    id: 'mock-1',
    title: 'Increase Workshop Video Rewards by 20%',
    description: 'Proposal to increase VLG rewards for completing workshop videos from 5 to 6 VLG per completion to incentivize skill development.',
    status: 'active',
    votes_for: 234,
    votes_against: 45,
    votes_abstain: 12,
    author: { username: 'legaci', display_name: 'Legaci Jackson' },
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    ends_at: new Date(Date.now() + 86400000 * 5).toISOString(),
    category: 'rewards',
  },
  {
    id: 'mock-2',
    title: 'Add Mentorship Tier to Tribe System',
    description: 'Create a mentorship tier within Tribes that allows experienced members to offer 1-on-1 guidance to newer villagers.',
    status: 'active',
    votes_for: 189,
    votes_against: 23,
    votes_abstain: 8,
    author: { username: 'village_elder', display_name: 'Village Elder' },
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    ends_at: new Date(Date.now() + 86400000 * 6).toISOString(),
    category: 'community',
  },
  {
    id: 'mock-3',
    title: 'Treasury Allocation: Community Garden Project',
    description: 'Allocate 5,000 VICO from the community treasury to fund a virtual community garden collaboration feature.',
    status: 'passed',
    votes_for: 412,
    votes_against: 67,
    votes_abstain: 20,
    author: { username: 'builder9', display_name: 'Builder Nine' },
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    ends_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    category: 'treasury',
  },
];

export async function GET(req: NextRequest) {
  const supabase = createAdminClient() as any;
  const { searchParams } = new URL(req.url);

  const status   = searchParams.get('status') ?? 'all';
  const page     = parseInt(searchParams.get('page') ?? '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') ?? '10', 10);
  const offset   = (page - 1) * pageSize;

  let query = supabase
    .from('vico_governance_proposals')
    .select('*, profiles(username, display_name, avatar_url)', { count: 'exact' });

  if (status !== 'all') {
    query = query.eq('status', status);
  }

  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  const { data, count, error } = await query;

  // Fall back to mock if table empty or missing
  if (error || !data || data.length === 0) {
    const filtered = status === 'all'
      ? MOCK_PROPOSALS
      : MOCK_PROPOSALS.filter((p) => p.status === status);

    return NextResponse.json({
      proposals: filtered.slice(offset, offset + pageSize),
      total:     filtered.length,
      page,
      pageSize,
      isMock:    true,
    });
  }

  return NextResponse.json({
    proposals: data,
    total:     count ?? data.length,
    page,
    pageSize,
  });
}
