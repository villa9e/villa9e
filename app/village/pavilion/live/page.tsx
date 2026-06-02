'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { PavilionNav } from '../page';

// ─── Pavilion / Live & Events Feed ───────────────────────────────────────────

interface Show {
  id:            string;
  title:         string;
  description:   string;
  creator_id:    string;
  creator_name?: string;
  type:          string;
  status:        'upcoming' | 'live' | 'replay' | 'scheduled';
  ticket_price:  number;
  stream_url:    string | null;
  thumbnail:     string | null;
  starts_at:     string | null;
  attendee_count: number;
  created_at:    string;
}

const TYPE_COLOR: Record<string, string> = {
  webinar: '#2952E8', concert: '#BE185D', film: '#7C3AED', presentation: '#059669', show: '#E8770A',
};

const MOCK_SHOWS: Show[] = [
  { id:'l1', title:'Goal GPS Live Workshop', description:'Build your 12-week sprint plan in real time with Spirit AI.', creator_id:'', creator_name:'spiritai', type:'webinar', status:'live', ticket_price:0, stream_url:null, thumbnail:null, starts_at:null, attendee_count:312, created_at:'' },
  { id:'l2', title:'Village Beats — Friday Night', description:'Live DJ set from the village music community.', creator_id:'', creator_name:'dj_village', type:'concert', status:'live', ticket_price:0, stream_url:null, thumbnail:null, starts_at:null, attendee_count:189, created_at:'' },
  { id:'l3', title:'Black Founders Q&A', description:'Founders share how they raised pre-seed without Silicon Valley networks.', creator_id:'', creator_name:'founders_club', type:'presentation', status:'live', ticket_price:0, stream_url:null, thumbnail:null, starts_at:null, attendee_count:94, created_at:'' },
  { id:'u1', title:'Brand Identity Masterclass', description:'Build a brand that moves people.', creator_id:'', creator_name:'niajames', type:'webinar', status:'upcoming', ticket_price:0, stream_url:null, thumbnail:null, starts_at:new Date(Date.now()+86400000).toISOString(), attendee_count:47, created_at:'' },
  { id:'u2', title:'Village Jazz Night', description:'An intimate virtual jazz performance.', creator_id:'', creator_name:'jazzvillage', type:'concert', status:'upcoming', ticket_price:25, stream_url:null, thumbnail:null, starts_at:new Date(Date.now()+172800000).toISOString(), attendee_count:128, created_at:'' },
  { id:'u3', title:'Credit Repair Blueprint', description:'Rebuild your credit score in 90 days.', creator_id:'', creator_name:'creditpro', type:'webinar', status:'upcoming', ticket_price:0, stream_url:null, thumbnail:null, starts_at:new Date(Date.now()+259200000).toISOString(), attendee_count:203, created_at:'' },
  { id:'u4', title:'Short Film Premiere: The Village', description:'An 18-minute film about community and purpose.', creator_id:'', creator_name:'cinema_v', type:'film', status:'upcoming', ticket_price:10, stream_url:null, thumbnail:null, starts_at:new Date(Date.now()+345600000).toISOString(), attendee_count:76, created_at:'' },
  { id:'u5', title:'Crypto for Builders', description:'DeFi fundamentals and VLG token economy.', creator_id:'', creator_name:'web3village', type:'presentation', status:'upcoming', ticket_price:0, stream_url:null, thumbnail:null, starts_at:new Date(Date.now()+432000000).toISOString(), attendee_count:155, created_at:'' },
];

type FilterKey = 'all' | 'live' | 'tonight' | 'week' | 'free' | 'paid';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key:'all',     label:'All'       },
  { key:'live',    label:'Live Now'  },
  { key:'tonight', label:'Tonight'  },
  { key:'week',    label:'This Week' },
  { key:'free',    label:'Free'      },
  { key:'paid',    label:'Paid'      },
];

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function filterShows(shows: Show[], filter: FilterKey): Show[] {
  const now = Date.now();
  const tonightEnd = new Date(); tonightEnd.setHours(23, 59, 59, 999);
  const weekEnd = new Date(now + 7 * 86400000);
  switch (filter) {
    case 'live':    return shows.filter(s => s.status === 'live');
    case 'tonight': return shows.filter(s => s.starts_at && new Date(s.starts_at) <= tonightEnd);
    case 'week':    return shows.filter(s => s.starts_at && new Date(s.starts_at) <= weekEnd);
    case 'free':    return shows.filter(s => s.ticket_price === 0);
    case 'paid':    return shows.filter(s => s.ticket_price > 0);
    default:        return shows;
  }
}

function CreatorInitials({ name, size = 32 }: { name: string; size?: number }) {
  const colors = ['#2952E8','#1D9E75','#BE185D','#7C3AED','#E8770A'];
  const bg = colors[name.charCodeAt(0) % colors.length];
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: size * 0.35, flexShrink: 0 }}>
      {name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
    </div>
  );
}

function ShowCard({ show, isNight }: { show: Show; isNight: boolean }) {
  const accent = TYPE_COLOR[show.type] ?? '#2952E8';
  const cardBg = isNight ? '#1A2448' : '#FFFFFF';
  const border = isNight ? '#1E2448' : '#C5CAE9';
  const text = isNight ? '#E8E3F8' : '#1E1B4B';
  const muted = isNight ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
  const isLive = show.status === 'live';
  const isFree = show.ticket_price === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.97 }}
      style={{ borderRadius: 16, overflow: 'hidden', background: cardBg, border: `1px solid ${border}`, cursor: 'pointer' }}
    >
      {/* Thumbnail */}
      <div style={{ height: 130, background: `linear-gradient(135deg, ${accent}28, ${accent}10)`, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth={1.5} strokeLinecap="round">
          <circle cx="12" cy="12" r="10"/><polygon points="10,8 16,12 10,16"/>
        </svg>
        {/* Status pill */}
        {isLive ? (
          <div style={{ position: 'absolute', top: 8, left: 8, background: '#D63B3B', borderRadius: 20, padding: '3px 9px', display: 'flex', alignItems: 'center', gap: 4 }}>
            <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />
            <span style={{ fontSize: 10, fontWeight: 900, color: '#fff' }}>LIVE</span>
          </div>
        ) : (
          <div style={{ position: 'absolute', top: 8, left: 8, background: '#2952E8', borderRadius: 20, padding: '3px 9px' }}>
            <span style={{ fontSize: 10, fontWeight: 900, color: '#fff' }}>UPCOMING</span>
          </div>
        )}
        {/* Price badge */}
        <div style={{ position: 'absolute', top: 8, right: 8, background: isFree ? '#059669' : isNight ? '#1E2448' : '#EEF2FF', borderRadius: 10, padding: '3px 9px' }}>
          <span style={{ fontSize: 10, fontWeight: 900, color: isFree ? '#fff' : (isNight ? '#E8E3F8' : '#2952E8') }}>
            {isFree ? 'FREE' : `$${show.ticket_price}`}
          </span>
        </div>
        {isLive && show.attendee_count > 0 && (
          <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.55)', borderRadius: 8, padding: '2px 8px' }}>
            <span style={{ fontSize: 10, color: '#fff', fontWeight: 700 }}>{show.attendee_count} watching</span>
          </div>
        )}
      </div>
      {/* Info */}
      <div style={{ padding: '11px 13px' }}>
        <p style={{ fontWeight: 800, fontSize: 13, color: text, marginBottom: 6, lineHeight: 1.3 }}>{show.title}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <CreatorInitials name={show.creator_name ?? 'V'} size={22} />
          <span style={{ fontSize: 11, color: muted }}>@{show.creator_name}</span>
        </div>
        {!isLive && show.starts_at && (
          <p style={{ fontSize: 11, color: muted }}>{formatDate(show.starts_at)}</p>
        )}
      </div>
    </motion.div>
  );
}

export default function LivePage() {
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';
  const supabase = createClient();
  const [shows, setShows]   = useState<Show[]>(MOCK_SHOWS);
  const [filter, setFilter] = useState<FilterKey>('all');

  const bg = isNight ? '#080E24' : '#F5F6FF';
  const text = isNight ? '#E8E3F8' : '#1E1B4B';
  const border = isNight ? '#1E2448' : '#C5CAE9';

  useEffect(() => {
    (supabase as any).from('pavilion_shows')
      .select('*, profiles(username)')
      .in('status', ['live','upcoming','scheduled'])
      .order('starts_at', { ascending: true })
      .limit(30)
      .then(({ data }: any) => {
        if (data?.length) {
          setShows(data.map((s: any) => ({ ...s, creator_name: s.profiles?.username, status: s.status === 'scheduled' ? 'upcoming' : s.status })));
        }
      })
      .catch(() => {});
  }, []);

  const filtered = filterShows(shows, filter);
  const liveCount = shows.filter(s => s.status === 'live').length;

  return (
    <div style={{ minHeight: '100vh', background: bg, paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 30, background: isNight ? 'rgba(8,14,36,0.96)' : 'rgba(245,246,255,0.96)', backdropFilter: 'blur(16px)', borderBottom: `1px solid ${border}`, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/village/pavilion" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: text }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </Link>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 17, fontWeight: 900, color: text, margin: 0 }}>Live & Events</h1>
          {liveCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
              <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} style={{ width: 7, height: 7, borderRadius: '50%', background: '#D63B3B' }} />
              <span style={{ fontSize: 11, color: '#D63B3B', fontWeight: 700 }}>{liveCount} live now</span>
            </div>
          )}
        </div>
        <Link href="/village/pavilion/create-event">
          <motion.button whileTap={{ scale: 0.95 }} style={{ padding: '8px 16px', borderRadius: 20, background: '#2952E8', color: '#fff', fontWeight: 900, fontSize: 12, border: 'none', cursor: 'pointer' }}>
            Host Event
          </motion.button>
        </Link>
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 8, padding: '14px 16px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            style={{
              flexShrink: 0, padding: '7px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700, border: `1px solid ${filter === f.key ? '#2952E8' : border}`,
              background: filter === f.key ? '#2952E8' : 'transparent',
              color: filter === f.key ? '#fff' : (isNight ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)'),
              cursor: 'pointer',
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '0 16px' }}>
        {filtered.map(s => <ShowCard key={s.id} show={s} isNight={isNight} />)}
        {filtered.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 0' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={isNight ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'} strokeWidth={1.5} strokeLinecap="round" style={{ marginBottom: 12 }}><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
            <p style={{ color: isNight ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)', fontSize: 14 }}>No events match this filter.</p>
          </div>
        )}
      </div>

      <PavilionNav active="live" />
    </div>
  );
}
