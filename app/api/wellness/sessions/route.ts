import { NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createServerClient();
  const admin = createAdminClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: sessions } = await admin
    .from('provider_sessions')
    .select('id,provider_id,session_type,status,scheduled_at,duration_min,rate,notes,session_url,pre_visit_brief,brief_generated_at')
    .eq('patient_user_id', user.id)
    .order('scheduled_at', { ascending: true });

  const providerIds = [...new Set((sessions ?? []).map((s: any) => s.provider_id).filter(Boolean))];
  let providers: Record<string, any> = {};
  if (providerIds.length > 0) {
    const { data: profiles } = await admin
      .from('provider_profiles')
      .select('id,display_name,specialty,credential_type')
      .in('id', providerIds);
    providers = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p]));
  }

  const enriched = (sessions ?? []).map((s: any) => ({
    ...s,
    provider: providers[s.provider_id] ?? null,
  }));

  const now = Date.now();
  return NextResponse.json({
    upcoming: enriched.filter((s: any) => s.scheduled_at && new Date(s.scheduled_at).getTime() >= now),
    past: enriched.filter((s: any) => !s.scheduled_at || new Date(s.scheduled_at).getTime() < now),
  });
}
