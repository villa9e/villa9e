import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// GET /api/data-export — GDPR-compliant full user data download
export async function GET(req: NextRequest) {
  const supabase = createServerClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const uid = user.id;

  const [
    { data: profile },
    { data: goals },
    { data: steps },
    { data: memories },
    { data: oowopsGiven },
    { data: oowopsReceived },
    { data: posts },
    { data: tribes },
    { data: wallet },
    { data: txns },
    { data: achievements },
    { data: skills },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', uid).single(),
    supabase.from('goals').select('*').eq('user_id', uid),
    supabase.from('goal_steps').select('*').eq('user_id', uid),
    supabase.from('spirit_memories').select('content, memory_type, created_at').eq('user_id', uid).limit(500),
    supabase.from('oowops').select('step_id, goal_id, created_at').eq('giver_id', uid),
    supabase.from('oowops').select('giver_id, step_id, goal_id, created_at').eq('receiver_id', uid),
    supabase.from('dream_line_posts').select('content, created_at, visibility').eq('user_id', uid),
    supabase.from('tribe_members').select('tribe_id, role, joined_at').eq('user_id', uid),
    supabase.from('village_wallets').select('vlg_balance, total_earned_vlg').eq('user_id', uid).single(),
    supabase.from('wallet_transactions').select('amount, token_type, direction, reason, created_at').eq('user_id', uid).limit(500),
    supabase.from('user_achievements').select('achievement_id, earned_at').eq('user_id', uid),
    supabase.from('user_skills').select('skill_name, rating, rating_category').eq('user_id', uid),
  ]);

  const export_data = {
    exported_at: new Date().toISOString(),
    user_id:     uid,
    email:       user.email,
    profile,
    goals:       goals ?? [],
    goal_steps:  steps ?? [],
    spirit_memories: (memories ?? []).map((m: any) => ({ ...m, content: m.content })),
    oowops_given:    oowopsGiven ?? [],
    oowops_received: oowopsReceived ?? [],
    dream_line_posts: posts ?? [],
    tribe_memberships: tribes ?? [],
    wallet,
    wallet_transactions: txns ?? [],
    achievements: achievements ?? [],
    skills: skills ?? [],
    notice: 'This export contains all data villa9e holds about you. Under GDPR/CCPA you may request deletion by emailing privacy@villa9e.app',
  };

  return new NextResponse(JSON.stringify(export_data, null, 2), {
    headers: {
      'Content-Type':        'application/json',
      'Content-Disposition': `attachment; filename="villa9e-data-${uid.slice(0,8)}-${new Date().toISOString().slice(0,10)}.json"`,
    },
  });
}
