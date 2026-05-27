'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { VillageSound } from '@/lib/sounds/village';

const TYPE_CONFIG: Record<string, { emoji: string; color: string; href: (ref: string) => string }> = {
  oowop:              { emoji: '✊',  color: '#FFD700', href: ()    => '/village/dreamline' },
  goal_step:          { emoji: '📍',  color: '#E8770A', href: (ref) => ref ? `/village/workshop/goal/${ref}` : '/village/workshop' },
  deal:               { emoji: '🤝',  color: '#059669', href: ()    => '/village/trading-post' },
  match:              { emoji: '🔍',  color: '#1877F2', href: (ref) => ref ? `/villager/${ref}` : '/village/discover' },
  medal:              { emoji: '🏆',  color: '#FFD700', href: (ref) => ref ? `/village/workshop/goal/${ref}` : '/village/workshop' },
  tribe:              { emoji: '👥',  color: '#BE185D', href: (ref) => ref ? `/village/tribes/${ref}` : '/village/tribes' },
  connection_request: { emoji: '🤝',  color: '#1877F2', href: ()    => '/village/discover/connections' },
  connection_accepted:{ emoji: '✅',  color: '#22C55E', href: (ref) => ref ? `/villager/${ref}` : '/village/discover/connections' },
  referral:           { emoji: '👥',  color: '#F59E0B', href: ()    => '/village/hut/referrals' },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading]             = useState(true);
  const [unreadCount, setUnreadCount]     = useState(0);
  const supabase = createClient();
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';

  const bg       = isNight ? '#0A0B12' : '#F5F5FF';
  const cardBg   = isNight ? '#12152A' : '#FFFFFF';
  const border   = isNight ? '#1E2240' : '#E8EAFF';
  const textMain = isNight ? '#F0EBE0' : '#1E1B4B';
  const textMute = isNight ? '#4A4F72' : '#6D28D9';

  useEffect(() => {
    load();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      const channel = supabase.channel('notif_page')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
          p => {
            setNotifications(prev => [p.new as any, ...prev]);
            setUnreadCount(c => c + 1);
            VillageSound.notification();
          })
        .subscribe();
    });
  }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await (supabase as any).from('notifications')
      .select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false }).limit(60);
    setNotifications(data ?? []);
    setUnreadCount((data ?? []).filter((n: any) => !n.is_read).length);
    setLoading(false);
  }

  async function markRead(id: string) {
    await (supabase as any).from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(c => Math.max(0, c - 1));
  }

  async function respondToConnection(notifId: string, connectionId: string, action: 'accept' | 'decline') {
    await fetch('/api/connections/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connection_id: connectionId, action }),
    });
    // Remove the notification from list
    setNotifications(prev => prev.filter(n => n.id !== notifId));
    setUnreadCount(c => Math.max(0, c - 1));
    if (action === 'accept') VillageSound.oowop();
  }

  async function markAllRead() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await (supabase as any).from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
    VillageSound.tap();
  }

  const grouped = notifications.reduce((acc: Record<string, any[]>, n) => {
    const day = new Date(n.created_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    if (!acc[day]) acc[day] = [];
    acc[day].push(n);
    return acc;
  }, {});

  return (
    <div className="min-h-screen" style={{ background: bg }}>
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 border-b"
        style={{ background: isNight ? '#0E1020' : '#fff', borderColor: border }}>
        <Link href="/village/map" className="text-xl" style={{ color: textMute }}>←</Link>
        <div className="flex-1">
          <h1 className="font-black text-base" style={{ color: textMain }}>Notifications</h1>
          {unreadCount > 0 && <p className="text-xs" style={{ color: textMute }}>{unreadCount} unread</p>}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-xs font-bold" style={{ color: '#1877F2' }}>Mark all read</button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><div className="text-4xl animate-pulse">🔔</div></div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🔔</p>
          <p style={{ color: textMute }}>No notifications yet.</p>
          <p className="text-sm mt-1" style={{ color: isNight ? '#2A2F4A' : '#C4B5FD' }}>
            Give an OoWop, complete a step, or post to Dream Line to get started.
          </p>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-5">
          {Object.entries(grouped).map(([day, notifs]) => (
            <div key={day}>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: textMute }}>{day}</p>
              <div className="space-y-2">
                {notifs.map((n: any) => {
                  const cfg = TYPE_CONFIG[n.type] ?? { emoji: '📢', color: '#1877F2', href: () => '/village/map' };
                  const isConnReq = n.type === 'connection_request';

                  const inner = (
                    <motion.div key={n.id}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      className="flex items-start gap-3 rounded-2xl p-4 transition-all"
                      style={{
                        background: !n.is_read ? (isNight ? '#12152A' : '#F0F0FF') : cardBg,
                        border: `1px solid ${!n.is_read ? cfg.color + '35' : border}`,
                        marginBottom: '8px',
                        cursor: isConnReq ? 'default' : 'pointer',
                      }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                        style={{ background: cfg.color + '20' }}>
                        {cfg.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm" style={{ color: textMain }}>{n.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: textMute }}>{n.body}</p>
                        {isConnReq && n.reference_id && (
                          <div className="flex gap-2 mt-2.5">
                            <button onClick={() => respondToConnection(n.id, n.reference_id, 'accept')}
                              className="px-3.5 py-1.5 rounded-full text-xs font-black text-white"
                              style={{ background: '#1877F2' }}>
                              ✓ Accept
                            </button>
                            <button onClick={() => respondToConnection(n.id, n.reference_id, 'decline')}
                              className="px-3 py-1.5 rounded-full text-xs font-semibold"
                              style={{ background: isNight ? 'rgba(255,255,255,0.06)' : '#F3F4F6', color: textMute }}>
                              Decline
                            </button>
                          </div>
                        )}
                        <p className="text-xs mt-1 opacity-50" style={{ color: textMute }}>
                          {new Date(n.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {!n.is_read && <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ background: cfg.color }} />}
                    </motion.div>
                  );

                  return isConnReq
                    ? <div key={n.id}>{inner}</div>
                    : <Link key={n.id} href={cfg.href(n.reference_id ?? '')} onClick={() => !n.is_read && markRead(n.id)}>{inner}</Link>;
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
