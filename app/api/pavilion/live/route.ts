import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const PALETTE = ['#2952E8', '#059669', '#7C3AED', '#E8770A', '#BE185D', '#D4A030', '#0EA5E9'];

function colorFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

export async function GET() {
  const supabase = createServerClient();

  const { data, error } = await (supabase as any)
    .from('pavilion_shows')
    .select('id, title, type, status, starts_at, attendee_count, ticket_price, profiles(username)')
    .in('status', ['live', 'scheduled'])
    .order('status', { ascending: true })
    .order('starts_at', { ascending: true })
    .limit(30);

  if (error) return NextResponse.json({ events: [] });

  const events = (data ?? []).map((s: any) => ({
    id: s.id,
    title: s.title,
    host: s.profiles?.username || 'village',
    type: s.type,
    status: s.status === 'scheduled' ? 'upcoming' : s.status,
    viewers: s.attendee_count ?? 0,
    price: s.ticket_price ?? 0,
    starts_at: s.starts_at,
    color: colorFor(s.id),
  }));

  return NextResponse.json({ events });
}
