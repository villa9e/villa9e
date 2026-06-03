import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  const { data, error } = await (supabase as any)
    .from('stories')
    .select('*, profiles(id, username, display_name, avatar_url, is_online, is_live)')
    .eq('user_id', userId)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ stories: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { post_id, media_url, media_type, duration_seconds, text_overlay } = body;

  const { data, error } = await (supabase as any)
    .from('stories')
    .insert({
      user_id: user.id,
      post_id: post_id ?? null,
      media_url: media_url ?? null,
      media_type: media_type ?? 'image',
      duration_seconds: duration_seconds ?? 5,
      text_overlay: text_overlay ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ story: data });
}
