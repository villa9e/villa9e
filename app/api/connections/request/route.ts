import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const admin    = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { addressee_id } = await req.json();
  if (!addressee_id) return NextResponse.json({ error: 'Missing addressee_id' }, { status: 400 });
  if (addressee_id === user.id) return NextResponse.json({ error: 'Cannot connect with yourself' }, { status: 400 });

  // Check existing connection
  const { data: existing } = await (supabase as any)
    .from('connections')
    .select('id, status')
    .or(`and(requester_id.eq.${user.id},addressee_id.eq.${addressee_id}),and(requester_id.eq.${addressee_id},addressee_id.eq.${user.id})`)
    .single();

  if (existing) {
    return NextResponse.json({ exists: true, status: existing.status });
  }

  // Create connection request
  const { data: conn, error } = await (supabase as any)
    .from('connections')
    .insert({ requester_id: user.id, addressee_id, status: 'pending' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get requester profile
  const { data: requester } = await (supabase as any)
    .from('profiles')
    .select('username, display_name')
    .eq('id', user.id)
    .single();

  // Notify the addressee
  await (admin as any).from('notifications').insert({
    user_id:        addressee_id,
    type:           'connection_request',
    title:          `@${requester?.username} wants to connect`,
    body:           `${requester?.display_name || requester?.username} sent you a connection request in the village.`,
    reference_id:   conn.id,
    reference_type: 'connection',
    action_url:     '/village/discover/connections',
  });

  return NextResponse.json({ ok: true, connection_id: conn.id });
}
