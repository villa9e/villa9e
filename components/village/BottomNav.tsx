'use client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

const SHOW_PREFIXES = ['/village', '/notifications', '/messages', '/admin', '/trading-post'];
const HIDE_EXACT    = ['/login', '/signup', '/onboarding'];

// Pages with their own back-button UI — no floating nav here
const HIDE_PREFIXES = [
  '/village/hut',
  '/village/studio',
  '/village/zen',
  '/village/hospital',
  '/village/spaces',
];

// Arc radius (px from logo center to icon center)
const RADIUS = 92;

// angleDeg: degrees clockwise from straight-up (0 = up, -90 = left, +90 = right)
const ITEMS = [
  {
    href:     '/village/workshop',
    label:    'Workshop',
    angleDeg: -60,
    // Brain — two lobes
    path: 'M9.5 3C7 3 5 5.2 5 7.8c0 1 .3 2 .9 2.8A4 4 0 004 14c0 2.2 1.8 4 4 4h8c2.2 0 4-1.8 4-4a4 4 0 00-.9-2.4c.5-.8.9-1.8.9-2.8C20 5.2 18 3 15.5 3c-1 0-2 .4-2.7 1C12.1 3.4 10.9 3 9.5 3zM12 7v10M9 9v6M15 9v6',
  },
  {
    href:     '/village/workshop',
    label:    'Goal',
    angleDeg: -30,
    // Target / bullseye — three concentric circles + center dot
    path: 'M12 22a10 10 0 100-20 10 10 0 000 20zm0-4a6 6 0 100-12 6 6 0 000 12zm0-4a2 2 0 100-4 2 2 0 000 4z',
  },
  {
    href:     '/village/create',
    label:    'Create',
    angleDeg: 0,
    // Camera body + lens circle + plus on lens
    path: 'M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2zM12 10a4 4 0 100 8 4 4 0 000-8zm2 4h-1.5v-1.5a.5.5 0 00-1 0V14H10a.5.5 0 000 1h1.5v1.5a.5.5 0 001 0V15H14a.5.5 0 000-1z',
  },
  {
    href:     '/village/dreamline',
    label:    'DreamLine',
    angleDeg: 30,
    // 5-pointed star
    path: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  },
  {
    href:     '/village/trading-post',
    label:    'Trading Post',
    angleDeg: 60,
    // Market stall / price tag
    path: 'M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01',
  },
] as const;

function arcPos(angleDeg: number) {
  const rad = angleDeg * (Math.PI / 180);
  return {
    x: RADIUS * Math.sin(rad),
    y: -RADIUS * Math.cos(rad),
  };
}

function BottomNavInner() {
  const path     = usePathname();
  const [open, setOpen]         = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [initials, setInitials]   = useState('');
  const triggerRef = useRef<HTMLButtonElement>(null);

  const isVisible = SHOW_PREFIXES.some(p => path.startsWith(p)) &&
                    !HIDE_EXACT.some(p => path === p) &&
                    !HIDE_PREFIXES.some(p => path.startsWith(p));

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      (supabase as any)
        .from('profiles')
        .select('avatar_url, display_name, username')
        .eq('id', user.id)
        .single()
        .then(({ data }: any) => {
          if (data?.avatar_url) setAvatarUrl(data.avatar_url);
          const name = data?.display_name || data?.username || '';
          setInitials(name.slice(0, 2).toUpperCase());
        });
    });
  }, []);

  // Close on route change
  useEffect(() => { setOpen(false); }, [path]);

  if (!isVisible) return null;

  const ICON_SZ = 44;

  return (
    <>
      {/* Backdrop — closes menu on tap */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 48,
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(2px)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Avatar pill — bottom right, appears when open */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="avatar"
            initial={{ opacity: 0, scale: 0.6, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: 20 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28, delay: 0.05 }}
            style={{
              position: 'fixed',
              bottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
              right: 24,
              zIndex: 51,
            }}
          >
            <Link
              href="/village/hut"
              onClick={() => setOpen(false)}
              style={{
                display: 'block',
                width: ICON_SZ,
                height: ICON_SZ,
                borderRadius: ICON_SZ / 2,
                overflow: 'hidden',
                border: '2.5px solid rgba(255,255,255,0.6)',
                background: '#1877F2',
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
              }}
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{
                  width: '100%', height: '100%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 900, fontSize: 14,
                }}>
                  {initials || '?'}
                </div>
              )}
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Crescent icon buttons */}
      <AnimatePresence>
        {open && ITEMS.map((item, idx) => {
          const pos = arcPos(item.angleDeg);
          return (
            <motion.div
              key={item.href + item.label}
              initial={{ opacity: 0, scale: 0.4, x: 0, y: 0 }}
              animate={{
                opacity: 1, scale: 1,
                x: pos.x,
                y: pos.y,
              }}
              exit={{ opacity: 0, scale: 0.4, x: 0, y: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 26, delay: idx * 0.04 }}
              style={{
                position: 'fixed',
                bottom: `calc(${24 + ICON_SZ / 2}px + env(safe-area-inset-bottom, 0px))`,
                left: '50%',
                marginLeft: -ICON_SZ / 2,
                marginBottom: -ICON_SZ / 2,
                zIndex: 52,
              }}
            >
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}
              >
                <div style={{
                  width: ICON_SZ,
                  height: ICON_SZ,
                  borderRadius: ICON_SZ / 2,
                  background: 'rgba(20,20,30,0.85)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1.5px solid rgba(255,255,255,0.25)',
                  boxShadow: '0 6px 24px rgba(0,0,0,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <svg width={20} height={20} viewBox="0 0 24 24"
                    fill="none" stroke="#ffffff" strokeWidth="1.8"
                    strokeLinecap="round" strokeLinejoin="round">
                    <path d={item.path} />
                  </svg>
                </div>
                <span style={{
                  color: '#fff',
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: '0.03em',
                  textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                  whiteSpace: 'nowrap',
                  userSelect: 'none',
                }}>
                  {item.label}
                </span>
              </Link>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Main trigger button — center bottom */}
      <div style={{
        position: 'fixed',
        bottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 53,
      }}>
        <motion.button
          ref={triggerRef}
          onClick={() => setOpen(o => !o)}
          whileTap={{ scale: 0.92 }}
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            background: open ? 'rgba(24,119,242,0.25)' : 'rgba(10,10,18,0.80)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: open
              ? '2px solid rgba(24,119,242,0.7)'
              : '2px solid rgba(255,255,255,0.18)',
            boxShadow: open
              ? '0 0 32px rgba(24,119,242,0.5), 0 6px 24px rgba(0,0,0,0.5)'
              : '0 6px 32px rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background 0.2s, border 0.2s, box-shadow 0.2s',
          }}
          aria-label="Open navigation"
        >
          <motion.div
            animate={{ rotate: open ? 45 : 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 24 }}
          >
            <Image
              src="/village-icon-white.png"
              width={36}
              height={36}
              alt="villa9e"
              style={{ objectFit: 'contain', display: 'block' }}
              priority
            />
          </motion.div>
        </motion.button>
      </div>
    </>
  );
}

export function BottomNav() {
  return (
    <Suspense fallback={null}>
      <BottomNavInner />
    </Suspense>
  );
}
