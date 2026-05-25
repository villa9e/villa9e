'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const NAV_ITEMS = [
  { href: '/village/map',      icon: '🗺️', label: 'Map'     },
  { href: '/village/workshop', icon: '🔨', label: 'Goals'   },
  { href: '/village/dreamline',icon: '✨', label: 'Feed'    },
  { href: '/notifications',    icon: '🔔', label: 'Alerts'  },
  { href: '/village/hut',      icon: '🏠', label: 'Hut'     },
];

export function BottomNav() {
  const path = usePathname();
  const [unread, setUnread] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    async function loadUnread() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { count } = await supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false);
      setUnread(count ?? 0);
    }
    loadUnread();
    const sub = supabase.channel('notif_count')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
        setUnread(u => u + 1);
      }).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, []);

  // Hide on non-village pages
  const isVillagePage = path.startsWith('/village') || path === '/notifications' || path.startsWith('/messages');
  if (!isVillagePage) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 safe-area-pb">
      <div className="flex items-center justify-around max-w-lg mx-auto px-2 py-2">
        {NAV_ITEMS.map(item => {
          const active = path === item.href || (item.href !== '/village/map' && path.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-colors ${active ? 'bg-village-blue/10' : ''}`}>
              <div className="relative">
                <span className="text-2xl">{item.icon}</span>
                {item.href === '/notifications' && unread > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium ${active ? 'text-village-blue' : 'text-gray-400'}`}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
