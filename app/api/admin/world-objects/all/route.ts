import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

const ADMIN_EMAILS = ['elitehousemusic@gmail.com', 'admin@villa9e.app'];

// GET /api/admin/world-objects/all — returns ALL objects for admin (sandbox editor)
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = auth.slice(7);
  const admin = createAdminClient();
  const { data: { user } } = await (admin as any).auth.getUser(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const isAdmin = ADMIN_EMAILS.includes(user.email ?? '');
  if (!isAdmin) {
    const { data: profile } = await (admin as any)
      .from('profiles').select('is_super_admin').eq('id', user.id).single();
    if (!profile?.is_super_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data, error } = await (admin as any)
    .from('admin_world_objects')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    if (error.code === '42P01') return NextResponse.json([]); // table doesn't exist yet
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
