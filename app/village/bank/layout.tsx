import type { Metadata } from 'next';
import { BankInterior } from '@/components/interiors/BankInterior';

export const metadata: Metadata = {
  title: 'Bank — VLG Treasury | villa9e',
  description: 'Manage your VLG wallet, link your bank, fund your goals.',
};

export default function BankLayout({ children }: { children: React.ReactNode }) {
  return <BankInterior>{children}</BankInterior>;
}
