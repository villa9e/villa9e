import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createServerClient() as any;
  const admin = createAdminClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const today = new Date().toISOString().split('T')[0];
  const [{ data: tasks }, { data: projects }] = await Promise.all([
    admin.from('tasks').select('*').eq('user_id', user.id).order('display_order').order('created_at'),
    admin.from('projects').select('*').or(`creator_id.eq.${user.id},collaborator_ids.cs.["${user.id}"]`),
  ]);
  const todayTasks = (tasks ?? []).filter((t: any) => t.due_date === today || (!t.due_date && t.status === 'pending'));
  const upcomingTasks = (tasks ?? []).filter((t: any) => t.due_date && t.due_date > today && t.status !== 'done');
  const doneTasks = (tasks ?? []).filter((t: any) => t.status === 'done');
  return NextResponse.json({ today: todayTasks, upcoming: upcomingTasks, done: doneTasks, projects: projects ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient() as any;
  const admin = createAdminClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const { data } = await admin.from('tasks').insert({ user_id: user.id, ...body }).select().single();
  return NextResponse.json({ task: data });
}

export async function PATCH(req: NextRequest) {
  const supabase = createServerClient() as any;
  const admin = createAdminClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id, ...updates } = await req.json();
  const { data } = await admin.from('tasks').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.id).select().single();
  return NextResponse.json({ task: data });
}

export async function DELETE(req: NextRequest) {
  const supabase = createServerClient() as any;
  const admin = createAdminClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = new URL(req.url).searchParams.get('id');
  await admin.from('tasks').delete().eq('id', id).eq('user_id', user.id);
  return NextResponse.json({ success: true });
}
