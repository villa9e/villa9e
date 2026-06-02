import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'villa9e' };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
