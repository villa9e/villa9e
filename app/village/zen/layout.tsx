import type { Metadata } from 'next';
import { ZenInterior } from '@/components/interiors/ZenInterior';

export const metadata: Metadata = {
  title: 'Zen Garden — Heal & Restore | villa9e',
  description: 'Your sanctuary for meditation, breathwork, journaling, and inner peace.',
};

export default function ZenLayout({ children }: { children: React.ReactNode }) {
  return <ZenInterior>{children}</ZenInterior>;
}
