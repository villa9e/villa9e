import { notFound, redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';

interface Props {
  params: Promise<{ username: string }>;
}

// Reserved top-level route segments — these must never be treated as usernames
const RESERVED_SEGMENTS = [
  'admin', 'api', 'auth', 'error', 'join', 'leaderboard', 'login',
  'messages', 'notifications', 'onboarding', 'privacy', 'signup',
  'sitemap.xml', 'robots.txt', 'story', 'terms', 'village', 'villager',
  // Village sub-routes that might get hit
  'bank', 'create', 'discover', 'dreamline', 'hospital', 'hut', 'map',
  'pavilion', 'personality-maze', 'spaces', 'spirit', 'studio',
  'trading-post', 'tribes', 'wellness', 'workshop', 'zen', 'live',
  'merchant', 'locker', 'blockchain', 'vico', 'ads',
];

export default async function PublicUsernameRoute({ params }: Props) {
  const { username } = await params;

  if (!username || RESERVED_SEGMENTS.includes(username.toLowerCase())) {
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

  // Redirect to the hut page — it renders the full public profile
  redirect(`/village/hut?userId=${profile.id}`);
}
