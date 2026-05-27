import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

const ADMIN_EMAILS = ['elitehousemusic@gmail.com', 'admin@villa9e.app'];

async function verifyAdmin(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  const admin = createAdminClient();
  const { data: { user } } = await (admin as any).auth.getUser(token);
  if (!user) return null;
  if (ADMIN_EMAILS.includes(user.email ?? '')) return user;
  const { data: profile } = await (admin as any).from('profiles').select('is_super_admin').eq('id', user.id).single();
  return profile?.is_super_admin ? user : null;
}

// GET /api/admin/config — returns all config entries (or ?key=xxx for one)
export async function GET(req: NextRequest) {
  const admin = createAdminClient();
  const key = req.nextUrl.searchParams.get('key');

  if (key) {
    const { data, error } = await (admin as any).from('app_config').select('*').eq('key', key).single();
    if (error) return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json(data);
  }

  const { data, error } = await (admin as any).from('app_config').select('*').order('section').order('key');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/admin/config — upsert one or many config entries
export async function POST(req: NextRequest) {
  const user = await verifyAdmin(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const admin = createAdminClient();

  // Body can be { key, value } or an array of { key, value }
  const entries: { key: string; value: any }[] = Array.isArray(body) ? body : [body];

  const rows = entries.map(e => ({
    key:        e.key,
    value:      e.value,
    updated_at: new Date().toISOString(),
    updated_by: user.id,
  }));

  const { data, error } = await (admin as any)
    .from('app_config')
    .upsert(rows, { onConflict: 'key' })
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, updated: data });
}
