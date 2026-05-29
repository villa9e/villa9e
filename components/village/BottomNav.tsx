'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

// Village map has its own carousel nav — exclude it here
const HIDE_ON = ['/village/map', '/admin/sandbox'];

const NAV_ITEMS = [
  {
    href: '/village/map',
    label: 'Village',
    svg: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
  },
  {
    href: '/village/workshop',
    label: 'Goals',
    svg: 'M12 2a10 10 0 100 20A10 10 0 0012 2zm0 18a8 8 0 110-16 8 8 0 010 16zm0-12.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9zm0 7a2.5 2.5 0 110-5 2.5 2.5 0 010 5z',
  },
  {
    href: '/village/dreamline',
    label: 'Feed',
    svg: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z',
  },
  {
    href: '/notifications',
    label: 'Alerts',
    isAlerts: true,
    svg: 'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0',
  },
  {
    href: '/village/hut',
    label: 'Hut',
    svg: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10',
  },
] as const;

export function BottomNav() {
  const path = usePathname();
  const [unread, setUnread] = useState(0);
  const supabase = createClient();

  const isVillagePage = path.startsWith('/village') || path === '/notifications' || path.startsWith('/messages');
  const isHidden = HIDE_ON.some(p => path === p || path.startsWith(p));

  useEffect(() => {
    async function loadUnread() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { count } = await (supabase as any)
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      setUnread(count ?? 0);
    }
    loadUnread();
    const sub = supabase.channel('notif_count_nav')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' },
        () => setUnread(u => u + 1))
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, []);

  if (!isVillagePage || isHidden) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: 'linear-gradient(180deg, #FFFFFF 0%, #FFF8E8 60%, #FFF0CC 100%)',
        borderTop: '1.5px solid rgba(212,175,55,0.4)',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.10), 0 -1px 0 rgba(212,175,55,0.2)',
      }}
    >
      <div className="flex items-center justify-around max-w-lg mx-auto px-2"
        style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}>
        {NAV_ITEMS.map(item => {
          const active = path === item.href || (item.href !== '/village/map' && path.startsWith(item.href));
          const isAlerts = 'isAlerts' in item && item.isAlerts;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center gap-1 px-3 py-2.5 min-w-[52px] transition-all"
            >
              {/* Active indicator pill */}
              <AnimatePresence>
                {active && (
                  <motion.div
                    layoutId="bottom-nav-pill"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className="absolute inset-x-1 top-1 bottom-1 rounded-xl"
                    style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.35)' }}
                  />
                )}
              </AnimatePresence>

              {/* Icon */}
              <div className="relative z-10">
                <motion.div
                  animate={{ scale: active ? 1.12 : 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <svg
                    width="22" height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={active ? '#B8860B' : 'rgba(30,27,75,0.45)'}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d={item.svg} />
                  </svg>
                </motion.div>

                {/* Notification badge */}
                {isAlerts && unread > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1.5 min-w-[15px] h-[15px] rounded-full flex items-center justify-center font-black px-0.5 leading-none"
                    style={{ background: '#EF4444', color: '#fff', fontSize: 9 }}
                  >
                    {unread > 9 ? '9+' : unread}
                  </motion.span>
                )}
              </div>

              {/* Label */}
              <span
                className="relative z-10 text-[10px] font-bold leading-none"
                style={{ color: active ? '#B8860B' : 'rgba(30,27,75,0.4)' }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
