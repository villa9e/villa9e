'use client';
// ── Shared Goals | Workshop | GPS tab bar ──────────────────────────────────
// Rendered on /village/workshop/chat (Goals), /village/workshop (Workshop),
// and /village/workshop/gps/[id] (GPS). The active tab's underline uses a
// shared framer-motion layoutId, so when navigating between these routes the
// underline animates from its old position to its new one instead of
// snapping — making the three pages feel like one swipeable surface.
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useRef, useEffect } from 'react';

export type WorkshopTab = 'Goals' | 'Workshop' | 'GPS';

const TAB_ORDER: { key: WorkshopTab; href: string }[] = [
  { key: 'Goals', href: '/village/workshop/chat' },
  { key: 'Workshop', href: '/village/workshop' },
  { key: 'GPS', href: '/village/workshop/gps' },
];

/** Touch handlers for swiping horizontally between Goals ↔ Workshop ↔ GPS. */
export function useWorkshopSwipeNav(active: WorkshopTab, gpsHref?: string) {
  const router = useRouter();
  const start = useRef({ x: 0, y: 0 });
  const activeIdx = TAB_ORDER.findIndex(t => t.key === active);

  function hrefFor(idx: number) {
    const t = TAB_ORDER[idx];
    return t.key === 'GPS' ? (gpsHref ?? t.href) : t.href;
  }

  function onTouchStart(e: React.TouchEvent) {
    start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  function onTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - start.current.x;
    const dy = e.changedTouches[0].clientY - start.current.y;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    // dx > 0 = swipe right → go to the tab on the right (higher index)
    // dx < 0 = swipe left  → go to the tab on the left  (lower index)
    if (dx > 0 && activeIdx < TAB_ORDER.length - 1) router.push(hrefFor(activeIdx + 1));
    else if (dx < 0 && activeIdx > 0) router.push(hrefFor(activeIdx - 1));
  }

  // Desktop: → or L → right tab; ← or H → left tab
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if ((e.key === 'ArrowRight' || e.key === 'l') && activeIdx < TAB_ORDER.length - 1) {
        e.preventDefault(); router.push(hrefFor(activeIdx + 1));
      } else if ((e.key === 'ArrowLeft' || e.key === 'h') && activeIdx > 0) {
        e.preventDefault(); router.push(hrefFor(activeIdx - 1));
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIdx, gpsHref]);

  return { onTouchStart, onTouchEnd };
}

export default function WorkshopTabBar({
  active,
  gpsHref,
  activeColor = '#fff',
  inactiveColor = 'rgba(255,255,255,0.45)',
  underlineColor = '#fff',
}: {
  active: WorkshopTab;
  gpsHref?: string;
  activeColor?: string;
  inactiveColor?: string;
  underlineColor?: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', height: 44, width: '100%' }}>
      {TAB_ORDER.map(t => {
        const isActive = t.key === active;
        const href = t.key === 'GPS' ? (gpsHref ?? t.href) : t.href;
        return (
          <Link key={t.key} href={href}
            style={{ flex: 1, position: 'relative', height: 44, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textDecoration: 'none' }}>
            <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? activeColor : inactiveColor }}>
              {t.key}
            </span>
            {isActive && (
              <motion.span layoutId="workshop-tab-underline"
                style={{ position: 'absolute', bottom: 0, left: 10, right: 10, height: 2, background: underlineColor, borderRadius: 1 }}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }} />
            )}
          </Link>
        );
      })}
    </div>
  );
}
