import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const admin    = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { connection_id, action } = await req.json(); // action: 'accept' | 'decline'
  if (!connection_id || !['accept', 'decline'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  // Verify this user is the addressee
  const { data: conn } = await (supabase as any)
    .from('connections')
    .select('*, profiles!connections_requester_id_fkey(username, display_name)')
    .eq('id', connection_id)
    .eq('addressee_id', user.id)
    .single();

  if (!conn) return NextResponse.json({ error: 'Connection not found' }, { status: 404 });

  const newStatus = action === 'accept' ? 'accepted' : 'declined';

  await (supabase as any)
    .from('connections')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', connection_id);

  // Mark notification as read
  await (supabase as any)
    .from('notifications')
    .update({ is_read: true })
    .eq('reference_id', connection_id)
    .eq('user_id', user.id);

  // Notify requester if accepted
  if (action === 'accept') {
    const { data: me } = await (supabase as any)
      .from('profiles')
      .select('username, display_name')
      .eq('id', user.id)
      .single();

    await (admin as any).from('notifications').insert({
      user_id:        conn.requester_id,
      type:           'connection_accepted',
      title:          `@${me?.username} accepted your connection`,
      body:           `You and ${me?.display_name || me?.username} are now connected in the village. Give them an OoWop!`,
      reference_id:   user.id,
      reference_type: 'profile',
      action_url:     `/villager/${me?.username}`,
    });

    // Award VLG for making a connection
    try {
      await admin.rpc('award_village_score', {
        p_user_id: user.id, p_points: 5, p_vlg: 10,
        p_reason: 'CONNECTION_ACCEPTED', p_reference_id: conn.requester_id,
      });
      await admin.rpc('award_village_score', {
        p_user_id: conn.requester_id, p_points: 5, p_vlg: 10,
        p_reason: 'CONNECTION_MADE', p_reference_id: user.id,
      });
    } catch { /* non-critical */ }
  }

  return NextResponse.json({ ok: true, status: newStatus });
}
