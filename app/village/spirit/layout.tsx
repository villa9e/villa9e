import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Spirit — Your AI Guide | villa9e',
  description: 'Talk to Spirit — your personal AI guide inside villa9e. Get GPS recalibration, accountability check-ins, and real talk about your goals.',
  openGraph: {
    title: 'Spirit — Your AI Guide | villa9e',
    description: 'Your AI guide who knows you, grows with you, and never gives up on you.',
    images: [{ url: '/api/og?page=spirit', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Spirit — Your AI Guide | villa9e',
    description: 'Your AI guide who knows you, grows with you, and never gives up on you.',
  },
};

export default function SpiritLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
