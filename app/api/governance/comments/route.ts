import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// POST /api/governance/comments — auth required
export async function POST(req: NextRequest) {
  const supabase = createServerClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { proposalId, content } = body;

  if (!proposalId || !content?.trim()) {
    return NextResponse.json({ error: 'Missing required fields: proposalId, content' }, { status: 400 });
  }

  if (content.trim().length > 2000) {
    return NextResponse.json({ error: 'Comment exceeds 2000 character limit' }, { status: 400 });
  }

  // Verify proposal exists
  const { data: proposal } = await supabase
    .from('vico_governance_proposals')
    .select('id, status')
    .eq('id', proposalId)
    .maybeSingle();

  if (!proposal) {
    return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
  }

  const { data: comment, error } = await supabase
    .from('vico_governance_comments')
    .insert({
      proposal_id: proposalId,
      user_id:     user.id,
      content:     content.trim(),
      oowop_count: 0,
      created_at:  new Date().toISOString(),
    })
    .select('*, profiles(username, display_name, avatar_url)')
    .single();

  if (error) {
    console.error('Comment insert error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(comment, { status: 201 });
}
