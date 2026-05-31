'use client';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef, Suspense, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

// Village map has its own built-in carousel nav
const HIDE_ON = ['/village/map'];

// ─── Brand blue (villa9e tent logo colors) ────────────────────────────────────
const BLUE   = '#1877F2';
const BLUE_L = 'rgba(24,119,242,0.12)';
const BLUE_B = 'rgba(24,119,242,0.35)';
const MUTED  = 'rgba(30,27,75,0.38)';

const NAV_ITEMS = [
  {
    href:  '/village/workshop',
    label: 'Goals',
    svg:   'M12 22c5.52 0 10-4.48 10-10S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10zm0-14a4 4 0 110 8 4 4 0 010-8zm0 2a2 2 0 100 4 2 2 0 000-4z',
  },
  {
    href:  '/village/dreamline',
    label: 'Feed',
    svg:   'M13 2L4.09 12.26A1 1 0 005 14h5.5l-1 8L20 9.74A1 1 0 0019 8h-5.5l1-6z',
  },
  {
    href:  '/village/spirit',
    label: 'Spirit',
    // Sparkle / 4-pointed star
    svg:   'M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z',
  },
  {
    href:  '/notifications',
    label: 'Alerts',
    isAlerts: true,
    svg:   'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0',
  },
  {
    href:  '/village/hut',
    label: 'Hut',
    svg:   'M3 12L12 3l9 9M5 10v10a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1V10',
  },
] as const;

// World Builder icon — pencil-ruler (unique, not in the regular set)
const BUILDER_SVG = 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732zM3 9h4m-4 4h4m-4 4h4';

function BottomNavInner() {
  const path         = usePathname();
  const searchParams = useSearchParams();
  const [unread, setUnread]   = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const supabase = createClient();

  // Swipe / trackpad state
  const touchStart = useRef<number | null>(null);
  const wheelLock  = useRef(false);
  const [centerIdx, setCenterIdx] = useState(2); // Feed is default center
  const allItems = isAdmin
    ? [...NAV_ITEMS, { href: '/admin/sandbox', label: 'Builder', svg: BUILDER_SVG, isAdmin: true } as const]
    : [...NAV_ITEMS];

  const isVillagePage = path.startsWith('/village') || path.startsWith('/admin') ||
    path === '/notifications' || path.startsWith('/messages');
  const isHidden = HIDE_ON.some(p => path === p || path.startsWith(p)) ||
    searchParams.get('embedded') === '1';

  useEffect(() => {
    const supabaseClient = createClient();
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      const email = session?.user?.email ?? '';
      setIsAdmin(email === 'admin@villa9e.app' || email === 'elitehousemusic@gmail.com');
    });
  }, []);

  useEffect(() => {
    async function loadUnread() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { count } = await (supabase as any)
        .from('notifications').select('id', { count: 'exact', head: true })
        .eq('user_id', user.id).eq('is_read', false);
      setUnread(count ?? 0);
    }
    loadUnread();
    const sub = supabase.channel('notif_count_nav')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' },
        () => setUnread(u => u + 1))
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, []);

  // Sync centerIdx to current active page
  useEffect(() => {
    const idx = allItems.findIndex(it => it.href === path || (it.href.length > 1 && path.startsWith(it.href)));
    if (idx >= 0) setCenterIdx(idx);
  }, [path, isAdmin]);

  function haptic(ms = 6) { if (navigator.vibrate) navigator.vibrate(ms); }

  function shift(delta: number) {
    setCenterIdx(c => {
      const next = Math.max(0, Math.min(allItems.length - 1, c + delta));
      if (next !== c) haptic(6);
      return next;
    });
  }

  if (!isVillagePage || isHidden) return null;

  const isOnCreatePage = path.startsWith('/village/create');

  // Show center ± 3 items (7 visible max)
  const visible = allItems
    .map((item, i) => ({ item, i, dist: i - centerIdx }))
    .filter(({ dist }) => Math.abs(dist) <= 3);

  const ICON_SZ = [24, 19, 15, 11];
  const OPAC    = [1, 0.55, 0.3, 0.14];

  return (
    <Fragment>
    {/* Create button — floating above center of nav */}
    {!isOnCreatePage && (
      <Link
        href="/village/create"
        onClick={() => haptic(12)}
        style={{
          position:    'fixed',
          bottom:      'calc(68px + env(safe-area-inset-bottom, 0px))',
          left:        '50%',
          transform:   'translateX(-50%)',
          width:        54,
          height:       54,
          borderRadius: 27,
          background:  'linear-gradient(135deg, #1877F2, #7C3AED)',
          boxShadow:   '0 6px 28px rgba(24,119,242,0.55)',
          display:     'flex',
          alignItems:  'center',
          justifyContent: 'center',
          zIndex:       49,
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </Link>
    )}
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{ background: '#FFFFFF', borderTop: `1.5px solid ${BLUE_B}`, boxShadow: '0 -4px 20px rgba(24,119,242,0.10)' }}
      onTouchStart={e => { touchStart.current = e.touches[0].clientX; }}
      onTouchMove={e => {
        if (touchStart.current === null) return;
        const dx = e.touches[0].clientX - touchStart.current;
        if (Math.abs(dx) > 20) { shift(dx < 0 ? 1 : -1); touchStart.current = null; }
      }}
      onTouchEnd={() => { touchStart.current = null; }}
      onWheel={e => {
        if (Math.abs(e.deltaX) < Math.abs(e.deltaY) || Math.abs(e.deltaX) < 15) return;
        if (wheelLock.current) return;
        wheelLock.current = true;
        shift(e.deltaX > 0 ? 1 : -1);
        setTimeout(() => { wheelLock.current = false; }, 200);
      }}
    >
      {/* Blue gradient top indicator */}
      <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${BLUE} 30%, ${BLUE} 70%, transparent)`, opacity: 0.6 }} />

      {/* Icon row */}
      <div className="flex items-center justify-center gap-0.5 px-2 pt-2 pb-1">
        {visible.map(({ item, i, dist }) => {
          const abs    = Math.abs(dist);
          const isC    = dist === 0;
          const sz     = ICON_SZ[abs] ?? 10;
          const op     = OPAC[abs] ?? 0.08;
          const isActive = path === item.href || (item.href.length > 1 && path.startsWith(item.href));
          const iconColor = isC ? BLUE : MUTED;
          const isAlerts  = 'isAlerts' in item && item.isAlerts;

          return (
            <motion.div
              key={item.href}
              animate={{ opacity: op }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="flex flex-col items-center"
              style={{
                padding: isC ? '5px 14px' : '4px 8px',
                background: isC ? BLUE_L : 'transparent',
                border: `1.5px solid ${isC ? BLUE_B : 'transparent'}`,
                borderRadius: 14,
                cursor: 'pointer',
                minWidth: isC ? 58 : 'auto',
                position: 'relative',
              }}
              onClick={() => {
                if (isC) { haptic(10); }
                else     { haptic(6); setCenterIdx(i); }
              }}
            >
              <Link href={item.href} className="flex flex-col items-center gap-0.5">
                <div className="relative">
                  <svg width={sz} height={sz} viewBox="0 0 24 24"
                    fill="none" stroke={iconColor} strokeWidth={isC ? 2 : 1.6}
                    strokeLinecap="round" strokeLinejoin="round">
                    <path d={item.svg} />
                  </svg>
                  {isAlerts && unread > 0 && isC && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1.5 min-w-[14px] h-[14px] rounded-full flex items-center justify-center font-black px-0.5"
                      style={{ background: '#EF4444', color: '#fff', fontSize: 8 }}>
                      {unread > 9 ? '9+' : unread}
                    </motion.span>
                  )}
                </div>
                {isC && (
                  <span className="text-[9px] font-black whitespace-nowrap" style={{ color: BLUE }}>
                    {item.label}
                  </span>
                )}
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Pagination dots */}
      <div className="flex justify-center gap-1 pb-2">
        {allItems.map((_, i) => (
          <button key={i} onClick={() => { haptic(4); setCenterIdx(i); }}
            className="rounded-full transition-all"
            style={{
              width: i === centerIdx ? 14 : 4, height: 3,
              background: i === centerIdx ? BLUE : 'rgba(24,119,242,0.2)',
            }} />
        ))}
      </div>
    </nav>
    </Fragment>
  );
}

export function BottomNav() {
  return (
    <Suspense fallback={null}>
      <BottomNavInner />
    </Suspense>
  );
}
