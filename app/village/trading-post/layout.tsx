import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trading Post — The Village',
  description: 'Deals, Market, Tribe, and Office. The Village commerce and collaboration hub.',
};

export default function TradingPostLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
