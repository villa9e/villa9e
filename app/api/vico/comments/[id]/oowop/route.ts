import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// POST /api/vico/comments/[id]/oowop — toggle OoWop on a governance comment
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient();
  const admin = createAdminClient() as any;

  const { data: { user } } = await (supabase as any).auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: commentId } = params;
  if (!commentId) return NextResponse.json({ error: 'Missing comment id' }, { status: 400 });

  const { data: existing } = await admin
    .from('vico_governance_comment_oowops')
    .select('id')
    .eq('comment_id', commentId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    await admin.from('vico_governance_comment_oowops').delete().eq('id', existing.id);
  } else {
    await admin.from('vico_governance_comment_oowops').insert({ comment_id: commentId, user_id: user.id });
  }

  const { data: comment } = await admin
    .from('vico_governance_comments')
    .select('oowop_count')
    .eq('id', commentId)
    .maybeSingle();

  return NextResponse.json({ oowoped: !existing, oowop_count: comment?.oowop_count ?? 0 });
}
