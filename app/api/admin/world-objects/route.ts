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
  const { data: profile } = await (admin as any)
    .from('profiles').select('is_super_admin').eq('id', user.id).single();
  return profile?.is_super_admin ? user : null;
}

// POST /api/admin/world-objects — upsert all objects + delete removed ones
export async function POST(req: NextRequest) {
  const user = await verifyAdmin(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { rows, deletedIds, publishAll } = body as {
    rows:       Record<string, unknown>[];
    deletedIds: string[];
    publishAll: boolean;
  };

  const admin = createAdminClient();

  // Upsert all objects (service role bypasses RLS)
  if (rows.length > 0) {
    const { error } = await (admin as any)
      .from('admin_world_objects')
      .upsert(rows, { onConflict: 'id' });

    if (error) {
      // If columns are missing (old schema), fall back to core columns only
      if (error.message?.includes('column') || error.message?.includes('does not exist')) {
        const coreRows = rows.map((r: any) => ({
          id: r.id, model_url: r.model_url, label: r.label,
          pos_x: r.pos_x, pos_y: r.pos_y, pos_z: r.pos_z,
          rot_y: r.rot_y, scale: r.scale, elevation: r.elevation,
          is_live: r.is_live, is_building: r.is_building, sort_order: r.sort_order,
        }));
        const fallback = await (admin as any)
          .from('admin_world_objects')
          .upsert(coreRows, { onConflict: 'id' });
        if (fallback.error) {
          return NextResponse.json({ error: fallback.error.message }, { status: 500 });
        }
      } else {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
  }

  // Delete removed objects
  if (deletedIds.length > 0) {
    await (admin as any)
      .from('admin_world_objects')
      .delete()
      .in('id', deletedIds);
  }

  // Explicit publish pass — ensures is_live=true even for pre-existing rows
  if (publishAll && rows.length > 0) {
    await (admin as any)
      .from('admin_world_objects')
      .update({ is_live: true })
      .in('id', rows.map((r: any) => r.id));
  }

  return NextResponse.json({ ok: true });
}
