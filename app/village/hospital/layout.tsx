import type { Metadata } from 'next';
import { WellnessInterior } from '@/components/interiors/WellnessInterior';

export const metadata: Metadata = {
  title: 'Wellness Center — Healing & Care | villa9e',
  description: 'Licensed practitioners, holistic care, and telehealth for mind, body, and spirit.',
};

export default function WellnessLayout({ children }: { children: React.ReactNode }) {
  return <WellnessInterior>{children}</WellnessInterior>;
}
