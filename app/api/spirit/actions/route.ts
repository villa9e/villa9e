import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// GET /api/spirit/actions — Spirit's recent activity for the current user:
// pending Tier-2 confirmations + a recent history of what Spirit has done.
export async function GET(req: NextRequest) {
  const supabase = createServerClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const limit = Math.min(Number(req.nextUrl.searchParams.get('limit') ?? 20), 50);

  const [pendingRes, recentRes] = await Promise.all([
    supabase
      .from('spirit_actions')
      .select('id, tool_name, tier, input, status, created_at')
      .eq('user_id', user.id)
      .eq('status', 'pending_confirmation')
      .order('created_at', { ascending: false }),
    supabase
      .from('spirit_actions')
      .select('id, tool_name, tier, input, result, status, created_at, confirmed_at')
      .eq('user_id', user.id)
      .neq('status', 'pending_confirmation')
      .order('created_at', { ascending: false })
      .limit(limit),
  ]);

  return NextResponse.json({
    pending: pendingRes.data ?? [],
    recent: recentRes.data ?? [],
  });
}
