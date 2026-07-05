// GPS index — server component: auth + goal lookup happen at request time,
// no client-side race condition, no flash-to-sign-in for logged-in users.
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import GpsEmptyState from './GpsEmptyState';

export default async function GpsIndexPage() {
  const supabase = createServerClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Prefer GPS-activated goals (have sprints); fall back to any active goal
  const { data: activeGps } = await supabase
    .from('goals').select('id')
    .eq('user_id', user.id).eq('status', 'active').eq('gps_stage', 'active')
    .order('created_at', { ascending: false }).limit(1).maybeSingle();

  if (activeGps?.id) redirect(`/village/workshop/gps/${activeGps.id}`);

  const { data: anyActive } = await supabase
    .from('goals').select('id')
    .eq('user_id', user.id).eq('status', 'active')
    .order('created_at', { ascending: false }).limit(1).maybeSingle();

  if (anyActive?.id) redirect(`/village/workshop/gps/${anyActive.id}`);

  return <GpsEmptyState />;
}
