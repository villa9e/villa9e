'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const TYPE_CONFIG: Record<string, { icon: string; color: string }> = {
  oowop:              { icon: '✊', color: 'bg-amber-100 text-amber-700' },
  match:              { icon: '👥', color: 'bg-blue-100 text-blue-700' },
  message:            { icon: '💬', color: 'bg-purple-100 text-purple-700' },
  goal_step:          { icon: '📍', color: 'bg-orange-100 text-orange-700' },
  goal_invite:        { icon: '🗺️', color: 'bg-orange-100 text-orange-700' },
  medal:              { icon: '🏆', color: 'bg-yellow-100 text-yellow-700' },
  deal:               { icon: '🤝', color: 'bg-green-100 text-green-700' },
  tribe_invite:       { icon: '👥', color: 'bg-pink-100 text-pink-700' },
  trading_post_inquiry:{ icon: '🏪', color: 'bg-green-100 text-green-700' },
  referral:           { icon: '👥', color: 'bg-amber-100 text-amber-700' },
  mindful_moment:     { icon: '🧘', color: 'bg-cyan-100 text-cyan-700' },
  system:             { icon: '⛺', color: 'bg-gray-100 text-gray-700' },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioned, setActioned] = useState<Set<string>>(new Set());
  const supabase = createClient();

  useEffect(() => {
    loadNotifications();
    const sub = supabase.channel('notifications_live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, p => {
        setNotifications(prev => [p.new as any, ...prev]);
      }).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, []);

  async function loadNotifications() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50);
    setNotifications(data ?? []);
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    setLoading(false);
  }

  async function respondToGoalInvite(notification: any, action: 'accept' | 'decline') {
    const goalId = notification.reference_id;
    if (!goalId || actioned.has(notification.id)) return;

    await fetch('/api/goals/invite-team', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal_id: goalId, action }),
    });

    setActioned(prev => new Set([...prev, notification.id]));
    await supabase.from('notifications').update({ is_read: true }).eq('id', notification.id);
  }

  function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  const unread = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-village-bg">
      <div className="bg-village-blue text-white px-6 py-4 flex items-center gap-3">
        <Link href="/village/hut" className="text-xl">←</Link>
        <span className="text-2xl">🔔</span>
        <div>
          <h1 className="text-xl font-bold leading-tight">Notifications</h1>
          {unread > 0 && <p className="text-blue-100 text-xs">{unread} unread</p>}
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-2">
        {loading && <div className="text-center py-8 text-gray-400">Loading…</div>}

        {!loading && notifications.length === 0 && (
          <div className="text-center py-16">
            <p className="text-5xl mb-3">🔔</p>
            <p className="text-gray-500">No notifications yet.</p>
            <p className="text-sm text-gray-400 mt-1">OoWops, invites, and milestones appear here.</p>
          </div>
        )}

        {notifications.map((n, i) => {
          const config = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.system;
          const isGoalInvite = n.type === 'goal_invite' && !actioned.has(n.id);

          return (
            <motion.div key={n.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
              className={`village-card flex items-start gap-3 ${!n.is_read ? 'border-l-4 border-village-blue' : ''}`}>
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 ${config.color}`}>
                {config.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{n.title}</p>
                {n.body && <p className="text-xs text-gray-500 mt-0.5">{n.body}</p>}
                <p className="text-xs text-gray-400 mt-1">{timeAgo(n.created_at)}</p>

                {/* Goal invite action buttons */}
                {isGoalInvite && (
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => respondToGoalInvite(n, 'accept')}
                      className="bg-orange-500 text-white rounded-full px-3 py-1 text-xs font-bold hover:bg-orange-600">
                      ✓ Join Goal
                    </button>
                    <button onClick={() => respondToGoalInvite(n, 'decline')}
                      className="bg-gray-100 text-gray-600 rounded-full px-3 py-1 text-xs font-medium hover:bg-gray-200">
                      Decline
                    </button>
                  </div>
                )}
                {actioned.has(n.id) && n.type === 'goal_invite' && (
                  <p className="text-xs text-green-600 mt-1">Response sent ✓</p>
                )}

                {/* Link to reference */}
                {n.reference_type === 'goal' && !isGoalInvite && (
                  <Link href={`/village/workshop/goal/${n.reference_id}`} className="text-xs text-village-blue mt-1 inline-block hover:underline">
                    View goal →
                  </Link>
                )}
                {n.reference_type === 'conversation' && (
                  <Link href="/messages" className="text-xs text-village-blue mt-1 inline-block hover:underline">
                    View message →
                  </Link>
                )}
              </div>
              {!n.is_read && <div className="w-2 h-2 rounded-full bg-village-blue flex-shrink-0 mt-2" />}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
