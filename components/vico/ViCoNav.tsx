'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';

const NAV_ITEMS = [
  { label: 'Overview',  href: '/village/vico',           icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { label: 'Proposals', href: '/village/vico/proposals',  icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { label: 'Submit',    href: '/village/vico/submit',     icon: 'M12 4v16m8-8H4' },
  { label: 'Treasury',  href: '/village/vico/treasury',   icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
  { label: 'Elders',    href: '/village/vico/elders',     icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
];

export function ViCoNav() {
  const pathname = usePathname();
  const isNight = useVillageTheme(s => s.theme) === 'night';

  const bg = isNight ? '#1C1830' : '#FFFFFF';
  const border = isNight ? '#2E2A4A' : '#DDDAF8';
  const activeColor = '#534AB7';
  const inactiveColor = isNight ? '#6B6490' : '#A09CC8';
  const text = isNight ? '#C4C0E8' : '#534AB7';
  const inactiveText = isNight ? '#6B6490' : '#A09CC8';

  function isActive(href: string) {
    if (href === '/village/vico') return pathname === '/village/vico';
    return pathname.startsWith(href);
  }

  return (
    <nav style={{
      background: bg,
      border: `0.5px solid ${border}`,
      borderRadius: 12,
      padding: '4px 8px',
      display: 'flex',
      flexDirection: 'row',
      gap: 0,
      overflowX: 'auto',
      marginBottom: 16,
    }}>
      {NAV_ITEMS.map(item => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              padding: '8px 10px',
              borderRadius: 8,
              textDecoration: 'none',
              background: active ? (isNight ? 'rgba(127,119,221,0.15)' : 'rgba(83,74,183,0.08)') : 'transparent',
              minWidth: 56,
              flex: 1,
            }}
          >
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none"
              stroke={active ? activeColor : inactiveColor}
              strokeWidth={active ? 2 : 1.5}
              strokeLinecap="round" strokeLinejoin="round">
              <path d={item.icon} />
            </svg>
            <span style={{
              fontSize: 10,
              fontWeight: active ? 600 : 400,
              color: active ? text : inactiveText,
              whiteSpace: 'nowrap',
            }}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
