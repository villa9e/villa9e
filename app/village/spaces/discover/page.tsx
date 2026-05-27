'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { VillageSound } from '@/lib/sounds/village';

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  public:       { label: 'Public',     color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  tribe_meeting:{ label: 'Tribe',      color: '#BE185D', bg: 'rgba(190,24,93,0.12)' },
  goal_step:    { label: 'Goal Step',  color: '#E8770A', bg: 'rgba(232,119,10,0.12)' },
  personal:     { label: 'Personal',   color: '#1877F2', bg: 'rgba(24,119,242,0.12)' },
};

export default function DiscoverEventsPage() {
  const [events, setEvents]   = useState<any[]>([]);
  const [userId, setUserId]   = useState<string | null>(null);
  const [rsvped, setRsvped]   = useState<Set<string>>(new Set());
  const [filter, setFilter]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';

  const bg     = isNight ? '#060810' : '#F5F3FF';
  const card   = isNight ? '#0D1020' : '#FFFFFF';
  const border = isNight ? '#1A1F3A' : '#DDD6FE';
  const text   = isNight ? '#F0EBE0' : '#1E1B4B';
  const muted  = isNight ? '#4A4F72' : '#6D28D9';

  useEffect(() => { load(); }, [filter]);

  async function load() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id ?? null);

    const now = new Date().toISOString();
    let q = (supabase as any)
      .from('calendar_events')
      .select('*, profiles!calendar_events_creator_id_fkey(username, display_name, village_score, score_tier)')
      .in('event_type', ['public', 'tribe_meeting'])
      .gte('start_time', now)
      .order('start_time')
      .limit(40);

    if (filter) q = q.eq('event_type', filter);

    const { data } = await q;
    setEvents(data ?? []);

    if (user) {
      const { data: myRsvps } = await (supabase as any)
        .from('event_rsvps').select('event_id').eq('user_id', user.id);
      if (myRsvps) setRsvped(new Set(myRsvps.map((r: any) => r.event_id)));
    }
    setLoading(false);
  }

  async function rsvp(eventId: string) {
    if (!userId) return;
    if (rsvped.has(eventId)) {
      await (supabase as any).from('event_rsvps').delete().eq('event_id', eventId).eq('user_id', userId);
      setRsvped(prev => { const s = new Set(prev); s.delete(eventId); return s; });
    } else {
      await (supabase as any).from('event_rsvps').insert({ event_id: eventId, user_id: userId, status: 'going' });
      setRsvped(prev => new Set([...prev, eventId]));
      VillageSound.tap();
    }
  }

  const grouped = events.reduce((acc: Record<string, any[]>, ev) => {
    const date = new Date(ev.start_time).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    if (!acc[date]) acc[date] = [];
    acc[date].push(ev);
    return acc;
  }, {});

  const tierIcon = (t: string) => t === 'legend' ? '🏆' : t === 'elder' ? '⚡' : t === 'builder' ? '🏗️' : '🌱';

  return (
    <div className="min-h-screen pb-24" style={{ background: bg }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 py-3 flex items-center gap-3"
        style={{ background: isNight ? 'rgba(6,8,16,0.92)' : 'rgba(245,243,255,0.92)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${border}` }}>
        <Link href="/village/spaces" className="text-xl" style={{ color: muted }}>←</Link>
        <span className="text-2xl">🌍</span>
        <div className="flex-1">
          <h1 className="text-lg font-black" style={{ color: text }}>Discover Events</h1>
          <p className="text-xs" style={{ color: muted }}>Village-wide gatherings open to all</p>
        </div>
        <Link href="/village/spaces"
          className="text-xs font-bold px-3 py-1.5 rounded-full"
          style={{ background: '#4F46E5', color: '#fff' }}>
          + Host
        </Link>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 px-4 pt-4 pb-2 overflow-x-auto">
        {[null, 'public', 'tribe_meeting'].map(f => (
          <button key={String(f)} onClick={() => setFilter(f)}
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 transition-all"
            style={{
              background: filter === f ? '#4F46E5' : (isNight ? 'rgba(255,255,255,0.06)' : 'rgba(79,70,229,0.06)'),
              color: filter === f ? '#fff' : muted,
              border: `1px solid ${filter === f ? '#4F46E5' : border}`,
            }}>
            {f === null ? 'All Events' : f === 'public' ? '🌍 Public' : '👥 Tribe'}
          </button>
        ))}
      </div>

      <div className="max-w-2xl mx-auto px-4 space-y-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: card }} />
          ))
        ) : Object.keys(grouped).length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">📅</p>
            <p className="font-black text-lg mb-2" style={{ color: text }}>No upcoming events</p>
            <p className="text-sm mb-6" style={{ color: muted }}>Host the first event and bring the village together.</p>
            <Link href="/village/spaces"
              className="inline-block px-6 py-3 rounded-2xl font-black text-white"
              style={{ background: '#4F46E5' }}>
              Host an Event →
            </Link>
          </div>
        ) : (
          Object.entries(grouped).map(([date, dayEvents]) => (
            <div key={date} className="pt-4">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: muted }}>{date}</p>
              <div className="space-y-3">
                {dayEvents.map((ev, i) => {
                  const start  = new Date(ev.start_time);
                  const isGoing = rsvped.has(ev.id);
                  const typeCfg = TYPE_CONFIG[ev.event_type] ?? TYPE_CONFIG.public;

                  return (
                    <motion.div key={ev.id}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="rounded-2xl p-4"
                      style={{ background: card, border: `1px solid ${border}` }}>
                      <div className="flex items-start gap-3">
                        {/* Time block */}
                        <div className="flex-shrink-0 w-12 h-14 rounded-xl flex flex-col items-center justify-center"
                          style={{ background: typeCfg.bg, border: `1px solid ${typeCfg.color}30` }}>
                          <p className="text-xs font-bold leading-none" style={{ color: typeCfg.color }}>
                            {start.toLocaleString('en-US', { month: 'short' }).toUpperCase()}
                          </p>
                          <p className="text-xl font-black leading-tight" style={{ color: typeCfg.color }}>
                            {start.getDate()}
                          </p>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <p className="font-black text-sm" style={{ color: text }}>{ev.title}</p>
                            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                              style={{ background: typeCfg.bg, color: typeCfg.color }}>
                              {typeCfg.label}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs" style={{ color: muted }}>
                              {start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            {ev.location && (
                              <p className="text-xs" style={{ color: muted }}>· 📍 {ev.location}</p>
                            )}
                          </div>

                          {ev.description && (
                            <p className="text-xs mt-1.5 line-clamp-2" style={{ color: muted }}>{ev.description}</p>
                          )}

                          {/* Host */}
                          {ev.profiles && (
                            <div className="flex items-center gap-1.5 mt-2">
                              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                                style={{ background: 'linear-gradient(135deg,#1877F2,#7C3AED)' }}>
                                {ev.profiles.username?.[0]?.toUpperCase()}
                              </div>
                              <Link href={`/villager/${ev.profiles.username}`}
                                className="text-xs font-semibold" style={{ color: '#60a5fa' }}>
                                @{ev.profiles.username}
                              </Link>
                              <span className="text-xs">{tierIcon(ev.profiles.score_tier)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <button onClick={() => rsvp(ev.id)}
                        className="mt-3 w-full rounded-2xl py-2.5 text-sm font-black transition-all"
                        style={{
                          background: isGoing ? 'rgba(34,197,94,0.12)' : '#4F46E5',
                          color: isGoing ? '#22C55E' : '#fff',
                          border: isGoing ? '1px solid rgba(34,197,94,0.3)' : 'none',
                        }}>
                        {isGoing ? '✓ Going — Tap to Cancel' : '📅 RSVP — I\'m Going'}
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
