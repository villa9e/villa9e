import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';

const EARNINGS_RATES: Record<string, number> = {
  share_gps_goals: 2.40, share_content_engagement: 1.80, share_location: 0.80,
  share_wellness: 8.50, share_financial_behavior: 3.20, share_commerce_behavior: 1.60,
  share_social_graph: 1.40, share_goal_content_interests: 0.80, share_entertainment: 0.70,
  share_behavioral_patterns: 0.60, share_vlg_patterns: 0.90, share_communication_patterns: 0.50,
};

export async function GET() {
  const supabase = createServerClient() as any;
  const admin = createAdminClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let { data: prefs } = await admin.from('data_sharing_preferences').select('*').eq('user_id', user.id).maybeSingle();
  if (!prefs) {
    const { data: created } = await admin.from('data_sharing_preferences').insert({ user_id: user.id }).select().single();
    prefs = created;
  }

  // Calculate estimated monthly earnings
  const sharedCategories = Object.entries(EARNINGS_RATES).filter(([k]) => prefs?.[k]);
  const estimatedEarnings = sharedCategories.reduce((s, [, v]) => s + v, 0);
  const sharedCount = sharedCategories.length;

  return NextResponse.json({ preferences: prefs, estimatedEarnings, sharedCount, totalCategories: 12 });
}

export async function PATCH(req: NextRequest) {
  const supabase = createServerClient() as any;
  const admin = createAdminClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const updates = await req.json();
  const { data } = await admin.from('data_sharing_preferences')
    .upsert({ user_id: user.id, ...updates, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    .select().single();

  // Log audit entry for newly shared categories
  const auditEntries = Object.entries(updates)
    .filter(([k, v]) => k.startsWith('share_') && v === true)
    .map(([k]) => ({
      user_id: user.id, accessor_type: 'village_internal',
      accessor_name: 'Village personalization engine',
      data_category: k.replace('share_', '').replace(/_/g, ' '),
      access_purpose: 'Improve personalized recommendations',
      legal_basis: 'user_consent',
    }));
  if (auditEntries.length > 0) await admin.from('data_access_audit').insert(auditEntries).catch(() => {});

  return NextResponse.json({ preferences: data });
}
