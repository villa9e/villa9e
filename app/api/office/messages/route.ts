import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const supabase = createServerClient() as any;
  const admin = createAdminClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const thread_id = new URL(req.url).searchParams.get('thread_id');
  if (!thread_id) return NextResponse.json({ error: 'thread_id required' }, { status: 400 });

  const { data: messages } = await admin.from('office_messages').select('*, profiles(username, display_name, avatar_url)').eq('thread_id', thread_id).order('created_at', { ascending: true });

  // Mark messages as read
  await admin.from('office_messages').update({ read_at: new Date().toISOString() }).eq('thread_id', thread_id).neq('sender_id', user.id).is('read_at', null);

  return NextResponse.json({ messages: messages ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient() as any;
  const admin = createAdminClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { thread_id, content } = await req.json();
  if (!thread_id || !content?.trim()) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const { data: message } = await admin.from('office_messages').insert({ thread_id, sender_id: user.id, content: content.trim() }).select('*, profiles(username, display_name, avatar_url)').single();

  // Update thread
  await admin.from('office_threads').update({ last_message_at: new Date().toISOString(), last_message_preview: content.slice(0, 100) }).eq('id', thread_id);

  return NextResponse.json({ message });
}
