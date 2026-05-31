// Creator Studio — save and load drafts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const maxDuration = 15;

export async function POST(req: NextRequest) {
  const supabase = createServerClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { media_url, cloudinary_id, content_type, thumbnail_url, draft_data } = await req.json();

  const { data, error } = await supabase.from('studio_drafts').insert({
    user_id: user.id,
    media_url:     media_url ?? null,
    cloudinary_id: cloudinary_id ?? null,
    content_type:  content_type ?? 'video',
    thumbnail_url: thumbnail_url ?? null,
    draft_data:    draft_data ?? {},
  }).select('id').single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ draftId: data.id });
}

export async function GET(req: NextRequest) {
  const supabase = createServerClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data } = await supabase.from('studio_drafts')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(20);

  return NextResponse.json({ drafts: data ?? [] });
}

export async function DELETE(req: NextRequest) {
  const supabase = createServerClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await req.json();
  await supabase.from('studio_drafts').delete().eq('id', id).eq('user_id', user.id);
  return NextResponse.json({ success: true });
}
