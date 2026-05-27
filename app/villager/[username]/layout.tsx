import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';

export async function generateMetadata(
  { params }: { params: { username: string } }
): Promise<Metadata> {
  const supabase = createClient();
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('display_name, username, score_tier, village_score, personality_type')
    .eq('username', params.username)
    .single();

  const name     = profile?.display_name || `@${params.username}`;
  const tier     = profile?.score_tier ?? 'Seedling';
  const score    = profile?.village_score ?? 0;
  const archetype = profile?.personality_type;

  const title = `${name} — ${tier} Villager | villa9e`;
  const desc  = `${name} is a ${tier} villager on villa9e with ${score.toLocaleString()} $VLG${archetype ? ` · ${archetype} archetype` : ''}. Join them in the village.`;

  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      images: [{ url: `/api/og?username=${params.username}`, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
    },
  };
}

export default function VillagerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
