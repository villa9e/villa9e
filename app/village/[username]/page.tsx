import { notFound, redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';

interface Props {
  params: Promise<{ username: string }>;
}

export default async function PublicProfileByUsername({ params }: Props) {
  const { username } = await params;

  // Don't conflict with other known routes
  const RESERVED_SEGMENTS = [
    'bank', 'create', 'discover', 'dreamline', 'hospital', 'hut', 'map',
    'notifications', 'pavilion', 'personality-maze', 'spaces', 'spirit',
    'studio', 'trading-post', 'tribes', 'wellness', 'workshop', 'zen',
    'admin', 'live', 'stories',
  ];
  if (RESERVED_SEGMENTS.includes(username.toLowerCase())) {
    notFound();
  }

  const supabase = createServerClient();
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('id, username, display_name')
    .ilike('username', username)
    .maybeSingle();

  if (!profile) {
    notFound();
  }

  // Redirect to the hut page with userId — the hut page renders the full profile
  redirect(`/village/hut?userId=${profile.id}`);
}
