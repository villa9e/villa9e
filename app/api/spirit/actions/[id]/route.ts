import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { getSpiritTool } from '@/lib/claude/spirit-tools';

// POST /api/spirit/actions/[id] — confirm or reject a Tier-2 action Spirit
// queued (e.g. "send_tribe_message"). { decision: 'confirm' | 'reject' }
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { decision } = await req.json();
  if (decision !== 'confirm' && decision !== 'reject') {
    return NextResponse.json({ error: 'decision must be "confirm" or "reject"' }, { status: 400 });
  }

  const admin = createAdminClient() as any;

  const { data: action } = await admin
    .from('spirit_actions')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (!action) return NextResponse.json({ error: 'Action not found' }, { status: 404 });
  if (action.status !== 'pending_confirmation') {
    return NextResponse.json({ error: 'Action already resolved' }, { status: 409 });
  }

  if (decision === 'reject') {
    await admin.from('spirit_actions')
      .update({ status: 'rejected', confirmed_at: new Date().toISOString() })
      .eq('id', action.id);
    return NextResponse.json({ status: 'rejected' });
  }

  const tool = getSpiritTool(action.tool_name);
  if (!tool) {
    await admin.from('spirit_actions')
      .update({ status: 'failed', result: { error: 'Unknown tool' }, confirmed_at: new Date().toISOString() })
      .eq('id', action.id);
    return NextResponse.json({ error: 'Unknown tool' }, { status: 500 });
  }

  const result = await tool.handler(admin, user.id, action.input);
  await admin.from('spirit_actions')
    .update({
      status: result.ok ? 'completed' : 'failed',
      result,
      confirmed_at: new Date().toISOString(),
    })
    .eq('id', action.id);

  return NextResponse.json({ status: result.ok ? 'completed' : 'failed', result });
}
