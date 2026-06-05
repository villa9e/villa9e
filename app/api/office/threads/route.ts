import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createServerClient() as any;
  const admin = createAdminClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: threads } = await admin.from('office_threads').select('*').contains('participant_ids', [user.id]).order('last_message_at', { ascending: false });

  // Enrich with other participant profiles
  const enriched = await Promise.all((threads ?? []).map(async (t: any) => {
    const otherIds = (t.participant_ids ?? []).filter((id: string) => id !== user.id);
    const { data: others } = await admin.from('profiles').select('id, username, display_name, avatar_url').in('id', otherIds);
    return { ...t, participants: others ?? [] };
  }));

  return NextResponse.json({ threads: enriched });
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient() as any;
  const admin = createAdminClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { other_user_id, context_type, context_label } = await req.json();
  const participants = [user.id, other_user_id].sort();

  // Check if thread exists
  const { data: existing } = await admin.from('office_threads').select('*').contains('participant_ids', participants).limit(1).maybeSingle();
  if (existing) return NextResponse.json({ thread: existing });

  const { data: thread } = await admin.from('office_threads').insert({
    participant_ids: participants, context_type, context_label, last_message_at: new Date().toISOString(),
  }).select().single();
  return NextResponse.json({ thread });
}
