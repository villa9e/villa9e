import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Leaderboard — Village Score Rankings | villa9e',
  description: 'See the top villagers ranked by Village Score, $VLG earned, and goals completed. Where do you stand?',
  openGraph: {
    title: 'Leaderboard | villa9e',
    description: 'Top villagers ranked by Village Score, $VLG earned, and goals completed.',
    images: [{ url: '/api/og?page=leaderboard', width: 1200, height: 630 }],
  },
};

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
