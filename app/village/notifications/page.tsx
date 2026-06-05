'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// ── Notification type routing ─────────────────────────────────────────────────
function getNotificationRoute(n: any): string {
  switch (n.type) {
    case 'oowop':       return `/village/workshop`;
    case 'match':       return `/village/trading-post/deals/${n.reference_id ?? ''}`;
    case 'message':     return `/village/tribe/messages/${n.reference_id ?? ''}`;
    case 'goal_step':   return `/village/workshop/goal/${n.reference_id ?? ''}`;
    case 'tribe_invite': return `/village/tribe`;
    default:            return `/village/workshop`;
  }
}

function getNotificationMessage(n: any): string {
  const actor = n.actor_username ? `@${n.actor_username}` : 'Someone';
  switch (n.type) {
    case 'oowop':        return `${actor} gave your post an OoWop`;
    case 'match':        return `${actor} matched your deal${n.metadata?.deal_name ? ` "${n.metadata.deal_name}"` : ''}`;
    case 'message':      return `${actor} sent you a message`;
    case 'goal_step':    return `Your GPS action${n.metadata?.action_title ? ` "${n.metadata.action_title}"` : ''} is ready`;
    case 'tribe_invite': return `${actor} wants to connect`;
    case 'system':       return n.body ?? 'System notification';
    default:             return n.body ?? 'New notification';
  }
}

// ── Icons (all SVG, no emoji) ─────────────────────────────────────────────────
function FistIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="9" width="12" height="8" rx="3"/>
      <path d="M6 14V9a2 2 0 012-2h8a2 2 0 012 2"/>
      <path d="M9 9V7a2 2 0 014 0v2"/>
      <path d="M6 14a3 3 0 01-3-3V9"/>
    </svg>
  );
}
function CheckCircleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  );
}
function MessageIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
  );
}
function TargetIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87"/>
      <path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  );
}
function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 01-3.46 0"/>
    </svg>
  );
}
function BigCheckIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
      stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  );
}

const NOTIFICATION_STYLES: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  oowop:       { icon: <FistIcon />,        color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
  match:       { icon: <CheckCircleIcon />, color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
  message:     { icon: <MessageIcon />,     color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
  goal_step:   { icon: <TargetIcon />,      color: '#14B8A6', bg: 'rgba(20,184,166,0.15)' },
  tribe_invite:{ icon: <UsersIcon />,       color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)' },
  system:      { icon: <BellIcon />,        color: '#6B7280', bg: 'rgba(107,114,128,0.15)' },
};

function getStyle(type: string) {
  return NOTIFICATION_STYLES[type] ?? NOTIFICATION_STYLES.system;
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)   return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function NotificationsPage() {
  const router   = useRouter();
  const supabase = createClient();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [markingAll,    setMarkingAll]     = useState(false);

  useEffect(() => { loadNotifications(); }, []);

  async function loadNotifications() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await (supabase as any)
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30);

    setNotifications(data ?? []);
    setLoading(false);
  }

  async function markAllRead() {
    setMarkingAll(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const now = new Date().toISOString();
      await (supabase as any)
        .from('notifications')
        .update({ read: true, read_at: now })
        .eq('user_id', user.id)
        .eq('read', false);
      setNotifications(prev => prev.map(n => ({ ...n, read: true, read_at: now })));
    }
    setMarkingAll(false);
  }

  async function markRead(id: string) {
    const now = new Date().toISOString();
    await (supabase as any).from('notifications').update({ read: true, read_at: now }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true, read_at: now } : n));
  }

  function handleTap(n: any) {
    markRead(n.id);
    router.push(getNotificationRoute(n));
  }

  const unreadCount = notifications.filter(n => !n.read && !n.read_at).length;

  return (
    <div style={{ minHeight: '100vh', background: '#080E24', color: '#fff', display: 'flex', flexDirection: 'column' }}>

      {/* TOP BAR */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        padding: '14px 16px',
        background: 'rgba(8,14,36,0.96)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <p style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em' }}>Notifications</p>
          {unreadCount > 0 && (
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>
              {unreadCount} unread
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            disabled={markingAll}
            style={{
              padding: '8px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700,
              background: 'rgba(41,82,232,0.15)', border: '1px solid rgba(41,82,232,0.35)',
              color: '#4D72FF', cursor: 'pointer', opacity: markingAll ? 0.6 : 1,
            }}>
            {markingAll ? 'Marking...' : 'Mark all read'}
          </button>
        )}
      </div>

      {/* LIST */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 100 }}>

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
            Loading...
          </div>
        )}

        {!loading && notifications.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 32px' }}>
            <div style={{ marginBottom: 16, opacity: 0.5 }}>
              <BigCheckIcon />
            </div>
            <p style={{ fontSize: 17, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>
              You&apos;re all caught up
            </p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', textAlign: 'center' }}>
              No new notifications right now.
            </p>
          </div>
        )}

        <AnimatePresence>
          {!loading && notifications.map((n, i) => {
            const style = getStyle(n.type);
            return (
              <motion.button
                key={n.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => handleTap(n)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 14,
                  width: '100%', padding: '14px 16px', textAlign: 'left',
                  background: (n.read || n.read_at) ? 'transparent' : 'rgba(41,82,232,0.05)',
                  border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)',
                  cursor: 'pointer', position: 'relative',
                }}>

                {/* Icon circle */}
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                  background: style.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: style.color,
                }}>
                  {style.icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: 14,
                    fontWeight: (n.read || n.read_at) ? 400 : 700,
                    color: (n.read || n.read_at) ? 'rgba(255,255,255,0.6)' : '#fff',
                    lineHeight: 1.4,
                    marginBottom: 4,
                  }}>
                    {getNotificationMessage(n)}
                  </p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                    {relativeTime(n.created_at)}
                  </p>
                </div>

                {/* Unread dot */}
                {!n.read && !n.read_at && (
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: '#2952E8', flexShrink: 0, marginTop: 6,
                  }} />
                )}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
