'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

interface VillageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: string;
  backHref?: string;
  accentColor?: string;
  actions?: React.ReactNode;
}

export function VillageHeader({ title, subtitle, icon, backHref = '/village/workshop', actions }: VillageHeaderProps) {
  const [unread, setUnread] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;
    let ch: ReturnType<typeof supabase.channel> | null = null;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || !mounted) return;
      const uid = user.id;
      (supabase as any).from('notifications').select('id', { count: 'exact', head: true })
        .eq('user_id', uid).eq('read', false)
        .then(({ count }: any) => { if (mounted) setUnread(count ?? 0); });
      ch = supabase.channel(`hdr_notif_${uid}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${uid}` },
          () => { if (mounted) setUnread(n => n + 1); })
        .subscribe();
    });
    return () => { mounted = false; if (ch) supabase.removeChannel(ch); };
  }, []);

  return (
    <div
      className="sticky top-0 z-20 flex items-center gap-3 px-4"
      style={{
        height: 56,
        background: '#FFFFFF',
        backgroundImage: 'linear-gradient(#fff, #fff), linear-gradient(90deg, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.6) 40%, rgba(184,134,11,0.8) 60%, rgba(212,175,55,0.6) 80%, rgba(212,175,55,0.15) 100%)',
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box',
        borderBottom: '2px solid transparent',
        boxShadow: '0 3px 12px rgba(0,0,0,0.08)',
      }}
    >
      <Link href={backHref}
        className="w-9 h-9 flex items-center justify-center rounded-full flex-shrink-0 transition-all hover:bg-black/5"
        style={{ color: 'rgba(30,27,75,0.7)' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
      </Link>

      {icon && <span className="text-xl flex-shrink-0">{icon}</span>}

      <div className="flex-1 min-w-0">
        <h1 className="text-sm font-black leading-tight truncate" style={{ color: '#1E1B4B' }}>{title}</h1>
        {subtitle && <p className="text-xs truncate" style={{ color: 'rgba(30,27,75,0.5)' }}>{subtitle}</p>}
      </div>

      {actions}

      {/* Notification bell */}
      <Link href="/notifications"
        className="w-9 h-9 rounded-full flex items-center justify-center relative flex-shrink-0 transition-all hover:bg-black/5"
        style={{ color: 'rgba(30,27,75,0.65)' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
        {unread > 0 && (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-white font-black"
            style={{ background: '#EF4444', fontSize: '9px' }}>
            {unread > 9 ? '9+' : unread}
          </motion.span>
        )}
      </Link>
    </div>
  );
}
