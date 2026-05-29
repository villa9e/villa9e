import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pavilion — Screenings, Concerts & Live Events | villa9e',
  description: 'Watch films, attend virtual concerts, join webinars and live shows. Sell tickets to your own events.',
};

export default function PavilionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
