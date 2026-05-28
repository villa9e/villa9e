import type { Metadata } from 'next';
import { TradingPostInterior } from '@/components/interiors/TradingPostInterior';

export const metadata: Metadata = {
  title: 'Trading Post — Skill Marketplace | villa9e',
  description: 'Trade skills, hire help, and build your tribe. The village marketplace.',
};

export default function TradingPostLayout({ children }: { children: React.ReactNode }) {
  return <TradingPostInterior>{children}</TradingPostInterior>;
}
