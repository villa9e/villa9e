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

  const title = `@${requester?.username} wants to connect`;
  const body  = `${requester?.display_name || requester?.username} sent you a connection request in the village.`;

  // DB notification
  await (admin as any).from('notifications').insert({
    user_id: addressee_id, type: 'connection_request',
    title, body, reference_id: conn.id,
    reference_type: 'connection', action_url: '/village/discover/connections',
  });

  // Push notification via OneSignal
  fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/push/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      external_user_ids: [addressee_id],
      title, body,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/village/discover/connections`,
      data: { type: 'connection_request', connection_id: conn.id },
    }),
  }).catch(() => {});

  return NextResponse.json({ ok: true, connection_id: conn.id });
}
