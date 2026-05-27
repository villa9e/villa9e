import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Village Map | villa9e',
  description: 'Explore the villa9e world. Visit the Workshop, Dream Line, Trading Post, Zen zone, Bank, Tribes, Hospital, and your Hut.',
  openGraph: {
    title: 'Village Map | villa9e',
    description: 'Explore the village. Every building is a tool for your growth.',
    images: [{ url: '/api/og?page=map', width: 1200, height: 630 }],
  },
};

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
