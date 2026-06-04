'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ACTIVE = '#1D9E75';
const INACTIVE = 'rgba(255,255,255,0.35)';
const BG = '#111827';

const TABS = [
  {
    key: 'home',
    label: 'Home',
    href: '/village/wellness',
    icon: (on: boolean) => (
      <svg width={20} height={20} viewBox="0 0 24 24" fill={on ? ACTIVE : 'none'} stroke={on ? ACTIVE : INACTIVE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    ),
  },
  {
    key: 'body',
    label: 'Body',
    href: '/village/wellness/body',
    icon: (on: boolean) => (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={on ? ACTIVE : INACTIVE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    key: 'nutrition',
    label: 'Nutrition',
    href: '/village/wellness/nutrition',
    icon: (on: boolean) => (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={on ? ACTIVE : INACTIVE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11l19-9-9 19-2-8-8-2z" />
      </svg>
    ),
  },
  {
    key: 'ai',
    label: 'AI',
    href: '/village/wellness/ai',
    icon: (on: boolean) => (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={on ? ACTIVE : INACTIVE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    key: 'journal',
    label: 'Journal',
    href: '/village/wellness/journal',
    icon: (on: boolean) => (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={on ? ACTIVE : INACTIVE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      </svg>
    ),
  },
] as const;

export function WellnessNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === '/village/wellness') return pathname === '/village/wellness';
    return pathname.startsWith(href);
  }

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 480,
        background: BG,
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        zIndex: 50,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {TABS.map(tab => {
        const on = isActive(tab.href);
        return (
          <Link
            key={tab.key}
            href={tab.href}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              padding: '10px 0 8px',
              color: on ? ACTIVE : INACTIVE,
              textDecoration: 'none',
              fontSize: 9,
              fontWeight: on ? 900 : 500,
              letterSpacing: '0.04em',
              borderTop: `2px solid ${on ? ACTIVE : 'transparent'}`,
            }}
          >
            {tab.icon(on)}
            {tab.label.toUpperCase()}
          </Link>
        );
      })}
    </nav>
  );
}
