import type { Metadata } from 'next';
import { TribesInterior } from '@/components/interiors/TribesInterior';

export const metadata: Metadata = {
  title: 'Tribes — Council Hall | villa9e',
  description: 'Find your tribe, join a team, and achieve goals together.',
};

export default function TribesLayout({ children }: { children: React.ReactNode }) {
  return <TribesInterior>{children}</TribesInterior>;
}
