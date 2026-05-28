import type { Metadata } from 'next';
import { DreamLineInterior } from '@/components/interiors/DreamLineInterior';

export const metadata: Metadata = {
  title: 'Dream Line — Community Stage | villa9e',
  description: 'Share your wins. Validate your village. The social heart of villa9e.',
};

export default function DreamLineLayout({ children }: { children: React.ReactNode }) {
  return <DreamLineInterior>{children}</DreamLineInterior>;
}
