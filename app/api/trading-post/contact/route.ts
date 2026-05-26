import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// Send a DM inquiry to a Trading Post listing owner
export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { listing_id, message } = await req.json();
  if (!listing_id || !message?.trim()) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const { data: listing } = await supabase.from('trading_post_listings').select('user_id, title').eq('id', listing_id).single();
  if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
  if (listing.user_id === user.id) return NextResponse.json({ error: 'Cannot contact your own listing' }, { status: 400 });

  // Create or find existing conversation
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .contains('participant_ids', [user.id, listing.user_id])
    .single();

  let conversationId = existing?.id;

  if (!conversationId) {
    const { data: conv } = await supabase.from('conversations').insert({
      participant_ids: [user.id, listing.user_id],
      listing_id: listing_id,
    }).select().single();
    conversationId = conv?.id;
  }

  if (!conversationId) return NextResponse.json({ error: 'Could not create conversation' }, { status: 500 });

  // Send the message
  await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_id: user.id,
    content: `Re: "${listing.title}"\n\n${message}`,
  });

  // Notify owner
  await supabase.from('notifications').insert({
    user_id: listing.user_id,
    type: 'trading_post_inquiry',
    title: 'New inquiry on your listing',
    body: `Someone is interested in "${listing.title}"`,
    reference_id: conversationId,
    reference_type: 'conversation',
  });

  return NextResponse.json({ ok: true, conversation_id: conversationId });
}
