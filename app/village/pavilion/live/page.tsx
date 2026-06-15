'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { PavilionNav } from '@/components/pavilion/PavilionNav';

const FILTERS = ['All', 'Live Now', 'Tonight', 'This Week', 'Free', 'Paid'] as const;
type Filter = typeof FILTERS[number];

type EventItem = {
  id: string;
  title: string;
  host: string;
  type: string;
  status: 'live' | 'upcoming';
  viewers: number;
  price: number;
  starts_at: string | null;
  color: string;
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function LiveEventsPage() {
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';
  const [activeFilter, setActiveFilter] = useState<Filter>('All');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  const bg       = isNight ? '#080E24' : '#F0EFF8';
  const cardBg   = isNight ? '#1A1830' : '#FFFFFF';
  const border   = isNight ? '#2A2845' : '#DDD9F5';
  const text     = isNight ? '#E8E3F8' : '#1E1B4B';
  const muted    = isNight ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';

  useEffect(() => {
    fetch('/api/pavilion/live').then(r => r.json()).then(d => {
      setEvents(d.events ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = events.filter(e => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Live Now') return e.status === 'live';
    if (activeFilter === 'Tonight') return e.status === 'upcoming' && e.starts_at && new Date(e.starts_at).getTime() - Date.now() < 86400000;
    if (activeFilter === 'This Week') return e.status === 'upcoming';
    if (activeFilter === 'Free') return e.price === 0;
    if (activeFilter === 'Paid') return e.price > 0;
    return true;
  });

  return (
    <div style={{ minHeight: '100vh', background: bg, paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 30, background: isNight ? 'rgba(8,14,36,0.96)' : 'rgba(240,239,248,0.96)', backdropFilter: 'blur(16px)', borderBottom: `1px solid ${border}`, padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Link href="/village/pavilion" style={{ display: 'flex', alignItems: 'center', color: text, textDecoration: 'none' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
          </Link>
          <h1 style={{ flex: 1, fontSize: 18, fontWeight: 900, color: text, margin: 0 }}>Live</h1>
          <Link href="/village/pavilion/host" style={{ padding: '8px 16px', borderRadius: 20, background: '#2952E8', color: '#fff', fontSize: 12, fontWeight: 900, textDecoration: 'none' }}>
            Host an Event
          </Link>
        </div>
        {/* Filter pills */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              style={{
                flexShrink: 0,
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: activeFilter === f ? '#2952E8' : (isNight ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'),
                color: activeFilter === f ? '#fff' : (isNight ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)'),
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Event cards */}
      <div style={{ padding: '16px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: muted }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" style={{ margin: '0 auto 12px', display: 'block' }}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            <p style={{ fontSize: 14 }}>{loading ? 'Loading…' : events.length === 0 ? 'No live or upcoming events yet.' : 'No events match this filter'}</p>
            {!loading && events.length === 0 && (
              <Link href="/village/pavilion/host" style={{ display: 'inline-block', marginTop: 12, color: '#2952E8', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
                Host the first event →
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map((e, i) => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                style={{ borderRadius: 18, overflow: 'hidden', background: cardBg, border: `1px solid ${border}` }}
              >
                {/* Thumbnail area */}
                <div style={{ height: 140, background: `linear-gradient(135deg, ${e.color}35, ${e.color}15)`, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={e.color} strokeWidth={1.5} strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polygon points="10,8 16,12 10,16"/></svg>
                  {/* Status badge */}
                  {e.status === 'live' ? (
                    <div style={{ position: 'absolute', top: 12, left: 12, background: '#E24B4A', borderRadius: 20, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />
                      <span style={{ fontSize: 11, fontWeight: 900, color: '#fff', letterSpacing: '0.05em' }}>LIVE</span>
                    </div>
                  ) : (
                    <div style={{ position: 'absolute', top: 12, left: 12, background: e.price === 0 ? '#059669' : '#EF9F27', borderRadius: 20, padding: '4px 10px' }}>
                      <span style={{ fontSize: 11, fontWeight: 900, color: '#fff' }}>{e.price === 0 ? 'FREE' : `$${e.price}`}</span>
                    </div>
                  )}
                  {e.status === 'live' && (
                    <div style={{ position: 'absolute', bottom: 10, right: 12, background: 'rgba(0,0,0,0.55)', borderRadius: 10, padding: '3px 9px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{e.viewers} watching</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 900, fontSize: 14, color: text, marginBottom: 4, lineHeight: 1.3 }}>{e.title}</p>
                    <p style={{ fontSize: 12, color: muted }}>@{e.host}</p>
                    {e.starts_at && (
                      <p style={{ fontSize: 11, color: muted, marginTop: 2 }}>{formatDate(e.starts_at)}</p>
                    )}
                  </div>
                  <Link
                    href={e.status === 'live' ? `/village/pavilion/live/${e.id}` : '#'}
                    style={{ padding: '10px 18px', borderRadius: 20, background: e.status === 'live' ? '#E24B4A' : '#2952E8', color: '#fff', fontSize: 12, fontWeight: 900, textDecoration: 'none', flexShrink: 0 }}
                  >
                    {e.status === 'live' ? 'Join' : 'RSVP'}
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <PavilionNav active="live" />
    </div>
  );
}
