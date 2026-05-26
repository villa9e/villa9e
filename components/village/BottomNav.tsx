'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

const NAV_ITEMS = [
  { href: '/village/map',       icon: '🗺️', label: 'Village' },
  { href: '/village/workshop',  icon: '🔨', label: 'Goals'   },
  { href: '/village/dreamline', icon: '✨', label: 'Feed'    },
  { href: '/notifications',     icon: '🔔', label: 'Alerts'  },
  { href: '/village/hut',       icon: '🏠', label: 'Hut'     },
];

export function BottomNav() {
  const path = usePathname();
  const [unread, setUnread] = useState(0);
  const supabase = createClient();

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
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
        setUnread(u => u + 1);
      }).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, []);

  const isVillagePage = path.startsWith('/village') || path === '/notifications' || path.startsWith('/messages');
  if (!isVillagePage) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(6,8,18,0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div className="flex items-center justify-around max-w-lg mx-auto px-1 pb-[env(safe-area-inset-bottom)]">
        {NAV_ITEMS.map(item => {
          const active = path === item.href || (item.href !== '/village/map' && path.startsWith(item.href));
          const isAlerts = item.href === '/notifications';

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center gap-0.5 px-4 py-3 min-w-[56px] transition-all"
            >
              {/* Active glow pill */}
              <AnimatePresence>
                {active && (
                  <motion.div
                    layoutId="nav-pill"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className="absolute inset-x-1 top-1 bottom-1 rounded-2xl"
                    style={{ background: 'rgba(24,119,242,0.15)', border: '1px solid rgba(24,119,242,0.25)' }}
                  />
                )}
              </AnimatePresence>

              {/* Icon */}
              <div className="relative z-10">
                <motion.span
                  animate={{ scale: active ? 1.15 : 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="block text-xl leading-none"
                  style={{ filter: active ? 'drop-shadow(0 0 8px rgba(24,119,242,0.6))' : 'none' }}
                >
                  {item.icon}
                </motion.span>

                {/* Notification badge */}
                {isAlerts && unread > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1.5 min-w-[16px] h-4 bg-red-500 rounded-full text-white text-[9px] flex items-center justify-center font-black px-0.5 leading-none"
                  >
                    {unread > 9 ? '9+' : unread}
                  </motion.span>
                )}
              </div>

              {/* Label */}
              <span
                className="relative z-10 text-[10px] font-semibold leading-none transition-colors"
                style={{ color: active ? '#60a5fa' : 'rgba(255,255,255,0.35)' }}
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
