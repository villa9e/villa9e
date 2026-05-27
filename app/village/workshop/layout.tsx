import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Workshop — Goal GPS Engine | villa9e',
  description: 'Set your goals. Spirit builds your full GPS plan — steps, probability score, timeline, and resources. Start your first goal today.',
  openGraph: {
    title: 'Workshop — Goal GPS Engine | villa9e',
    description: 'Spirit builds your full GPS plan — steps, probability score, timeline, and resources.',
    images: [{ url: '/api/og?page=workshop', width: 1200, height: 630 }],
  },
};

export default function WorkshopLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
