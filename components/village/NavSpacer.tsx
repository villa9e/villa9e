'use client';
import { usePathname } from 'next/navigation';

const HIDE_PREFIXES = [
  '/village/hut',
  '/village/studio',
  '/village/zen',
  '/village/hospital',
  '/village/spaces',
];

// Renders a spacer that pushes scroll content above the floating nav button
export function NavSpacer() {
  const path = usePathname();
  if (HIDE_PREFIXES.some(p => path.startsWith(p))) return null;
  return <div aria-hidden style={{ height: 'calc(104px + env(safe-area-inset-bottom, 0px))' }} />;
}
