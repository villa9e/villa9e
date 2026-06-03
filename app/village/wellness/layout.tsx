import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Wellness — The Village' };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
