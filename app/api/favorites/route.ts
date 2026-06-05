import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const supabase = createServerClient() as any;
  const admin = createAdminClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const type = new URL(req.url).searchParams.get('type');
  let q = admin.from('user_favorites').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
  if (type) q = q.eq('item_type', type);
  const { data } = await q;
  return NextResponse.json({ favorites: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient() as any;
  const admin = createAdminClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { item_type, item_id, item_title, item_thumbnail } = await req.json();
  const { data } = await admin.from('user_favorites').upsert({ user_id: user.id, item_type, item_id, item_title, item_thumbnail }, { onConflict: 'user_id,item_type,item_id' }).select().single();
  return NextResponse.json({ favorite: data });
}

export async function DELETE(req: NextRequest) {
  const supabase = createServerClient() as any;
  const admin = createAdminClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  await admin.from('user_favorites').delete().eq('user_id', user.id).eq('item_id', searchParams.get('item_id')).eq('item_type', searchParams.get('type') ?? 'post');
  return NextResponse.json({ success: true });
}
