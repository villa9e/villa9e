import type { Metadata } from 'next';
import { HutInterior } from '@/components/interiors/HutInterior';

export const metadata: Metadata = {
  title: 'My Hut — Personal Sanctuary | villa9e',
  description: 'Your profile, achievements, wallet, and personal space in the village.',
};

export default function HutLayout({ children }: { children: React.ReactNode }) {
  return <HutInterior>{children}</HutInterior>;
}
