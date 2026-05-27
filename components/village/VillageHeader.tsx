'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { createClient } from '@/lib/supabase/client';

interface VillageHeaderProps {
  title: string;
  subtitle?: string;
  icon: string;
  backHref?: string;
  accentColor?: string;
}

export function VillageHeader({ title, subtitle, icon, backHref = '/village/map', accentColor }: VillageHeaderProps) {
  const { theme, toggle } = useVillageTheme();
  const isNight = theme === 'night';
  const [unread, setUnread] = useState(0);
  const supabase = createClient();

  const dayBg  = accentColor ?? '#E8770A';
  const nightBg = '#0E1020';

  useEffect(() => {
    let mounted = true;
    let ch: ReturnType<typeof supabase.channel> | null = null;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || !mounted) return;
      const uid = user.id;

      // Initial unread count
      (supabase as any)
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', uid)
        .eq('read', false)
        .then(({ count }: any) => { if (mounted) setUnread(count ?? 0); });

      // Live updates — channel named per user to avoid collision on navigation
      ch = supabase.channel(`hdr_notif_${uid}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${uid}` },
          () => { if (mounted) setUnread(n => n + 1); })
        .subscribe();
    });

    return () => {
      mounted = false;
      if (ch) supabase.removeChannel(ch);
    };
  }, []);

  return (
    <div
      className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 border-b"
      style={{
        background:  isNight ? nightBg : dayBg,
        borderColor: isNight ? '#1E2240' : 'transparent',
      }}
    >
      <Link href={backHref} className="text-xl opacity-80 hover:opacity-100 transition-opacity" style={{ color: isNight ? '#F0EBE0' : '#fff' }}>←</Link>
      <span className="text-2xl">{icon}</span>
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-black leading-tight" style={{ color: isNight ? '#F0EBE0' : '#fff' }}>{title}</h1>
        {subtitle && <p className="text-xs opacity-70 truncate" style={{ color: isNight ? '#7A7FA8' : '#fff' }}>{subtitle}</p>}
      </div>

      {/* Notification bell */}
      <Link href="/notifications" className="relative w-9 h-9 rounded-full flex items-center justify-center transition-all"
        style={{ background: isNight ? '#1E2240' : 'rgba(255,255,255,0.2)' }}>
        <span className="text-base">🔔</span>
        {unread > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-white font-black"
            style={{ background: '#EF4444', fontSize: '9px' }}
          >
            {unread > 9 ? '9+' : unread}
          </motion.span>
        )}
      </Link>

      {/* Day / Night toggle */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={toggle}
        className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
        style={{ background: isNight ? '#1E2240' : 'rgba(255,255,255,0.2)' }}
        title={isNight ? 'Switch to Day' : 'Switch to Night'}
      >
        <span className="text-base">{isNight ? '☀️' : '🌙'}</span>
      </motion.button>
    </div>
  );
}
