'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { PavilionNav } from '@/components/pavilion/PavilionNav';

// ─── Pavilion Home — YouTube + Eventbrite + Udemy inside The Village ─────────

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

type ContentItem = {
  id: string;
  title: string;
  creator: string;
  duration: string;
  category: string;
  thumbnail_color: string;
};

type Creator = { id: string; name: string; handle: string; posts: number; views: number; color: string };

const TYPE_COLOR: Record<string, string> = {
  webinar:'#2952E8', concert:'#BE185D', film:'#7C3AED', presentation:'#059669', show:'#E8770A',
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function formatFollowers(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

function CreatorInitials({ name, size = 48 }: { name: string; size?: number }) {
  const colors = ['#2952E8','#1D9E75','#BE185D','#7C3AED','#E8770A','#059669'];
  const bg = colors[name.charCodeAt(0) % colors.length];
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: size * 0.35, flexShrink: 0 }}>
      {name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
    </div>
  );
}

// ─── Featured Banner ──────────────────────────────────────────────────────────
function FeaturedBanner({ show, isNight }: { show: Show; isNight: boolean }) {
  const accent = TYPE_COLOR[show.type] ?? '#2952E8';
  return (
    <div style={{ margin: '0 16px 20px', borderRadius: 20, overflow: 'hidden', position: 'relative', height: 200, background: `linear-gradient(135deg, ${accent}40, ${accent}18)`, border: `1px solid ${isNight ? '#1E2448' : '#C5CAE9'}` }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)' }} />
      {show.status === 'live' && (
        <div style={{ position: 'absolute', top: 14, left: 14, background: '#D63B3B', borderRadius: 20, padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />
          <span style={{ fontSize: 11, fontWeight: 900, color: '#fff', letterSpacing: '0.06em' }}>LIVE</span>
        </div>
      )}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px 16px' }}>
        <p style={{ color: '#fff', fontWeight: 900, fontSize: 17, marginBottom: 4, lineHeight: 1.3 }}>{show.title}</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
            {show.status === 'live' ? `${show.attendee_count} watching` : show.starts_at ? formatDate(show.starts_at) : ''}
          </span>
          <Link href="/village/pavilion/live" style={{ background: show.status === 'live' ? '#D63B3B' : '#2952E8', color: '#fff', borderRadius: 20, padding: '7px 18px', fontSize: 12, fontWeight: 900, textDecoration: 'none' }}>
            {show.status === 'live' ? 'Join Live' : 'View Event'}
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Live Strip Card ──────────────────────────────────────────────────────────
function LiveCard({ show, isNight }: { show: Show; isNight: boolean }) {
  const accent = TYPE_COLOR[show.type] ?? '#2952E8';
  const cardBg = isNight ? '#1A2448' : '#FFFFFF';
  const border = isNight ? '#1E2448' : '#C5CAE9';
  return (
    <div style={{ flexShrink: 0, width: 180, borderRadius: 16, overflow: 'hidden', background: cardBg, border: `1px solid ${border}` }}>
      <div style={{ height: 100, background: `linear-gradient(135deg, ${accent}30, ${accent}15)`, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth={1.5} strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polygon points="10,8 16,12 10,16"/></svg>
        <div style={{ position: 'absolute', top: 8, left: 8, background: '#D63B3B', borderRadius: 20, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
          <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />
          <span style={{ fontSize: 9, fontWeight: 900, color: '#fff' }}>LIVE</span>
        </div>
        <div style={{ position: 'absolute', bottom: 6, right: 8 }}>
          <span style={{ fontSize: 10, color: '#fff', background: 'rgba(0,0,0,0.55)', borderRadius: 8, padding: '2px 7px', fontWeight: 700 }}>{show.attendee_count}</span>
        </div>
      </div>
      <div style={{ padding: '10px 12px' }}>
        <p style={{ fontWeight: 800, fontSize: 12, color: isNight ? '#E8E3F8' : '#1E1B4B', lineHeight: 1.3, marginBottom: 3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{show.title}</p>
        <p style={{ fontSize: 10, color: isNight ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>@{show.creator_name}</p>
      </div>
    </div>
  );
}

// ─── Upcoming Event Card ──────────────────────────────────────────────────────
function EventCard({ show, isNight }: { show: Show; isNight: boolean }) {
  const accent = TYPE_COLOR[show.type] ?? '#2952E8';
  const cardBg = isNight ? '#1A2448' : '#FFFFFF';
  const border = isNight ? '#1E2448' : '#C5CAE9';
  const text = isNight ? '#E8E3F8' : '#1E1B4B';
  const muted = isNight ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
  const isFree = show.ticket_price === 0;
  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', background: cardBg, border: `1px solid ${border}` }}>
      <div style={{ height: 120, background: `linear-gradient(135deg, ${accent}28, ${accent}10)`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth={1.5} strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
        <div style={{ position: 'absolute', top: 8, right: 8, background: isFree ? '#059669' : '#2952E8', borderRadius: 10, padding: '3px 9px' }}>
          <span style={{ fontSize: 10, fontWeight: 900, color: '#fff' }}>{isFree ? 'FREE' : `$${show.ticket_price}`}</span>
        </div>
      </div>
      <div style={{ padding: '12px 14px' }}>
        <p style={{ fontWeight: 800, fontSize: 13, color: text, marginBottom: 6, lineHeight: 1.3 }}>{show.title}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <CreatorInitials name={show.creator_name ?? 'V'} size={20} />
          <span style={{ fontSize: 11, color: muted }}>@{show.creator_name}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, color: muted }}>{show.starts_at ? formatDate(show.starts_at) : ''}</span>
          <span style={{ fontSize: 11, color: muted }}>{show.attendee_count} going</span>
        </div>
      </div>
    </div>
  );
}

// ─── Content Card (Learning) ───────────────────────────────────────────────────
function ContentCard({ item, isNight }: { item: ContentItem; isNight: boolean }) {
  const cardBg = isNight ? '#1A2448' : '#FFFFFF';
  const border = isNight ? '#1E2448' : '#C5CAE9';
  const text = isNight ? '#E8E3F8' : '#1E1B4B';
  const muted = isNight ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
  return (
    <Link href={`/village/pavilion/watch/${item.id}`} style={{ textDecoration: 'none' }}>
      <div style={{ flexShrink: 0, width: 200, borderRadius: 16, overflow: 'hidden', background: cardBg, border: `1px solid ${border}` }}>
        <div style={{ height: 90, background: `linear-gradient(135deg, ${item.thumbnail_color}30, ${item.thumbnail_color}12)`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={item.thumbnail_color} strokeWidth={1.5} strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polygon points="10,8 16,12 10,16"/></svg>
          {item.duration && (
            <div style={{ position: 'absolute', bottom: 6, right: 8, background: 'rgba(0,0,0,0.55)', borderRadius: 8, padding: '2px 7px' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>{item.duration}</span>
            </div>
          )}
        </div>
        <div style={{ padding: '10px 12px' }}>
          <p style={{ fontWeight: 800, fontSize: 12, color: text, marginBottom: 4, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.title}</p>
          <p style={{ fontSize: 10, color: muted }}>@{item.creator} · {item.category}</p>
        </div>
      </div>
    </Link>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PavilionPage() {
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';
  const supabase = createClient();

  const [liveShows, setLiveShows]     = useState<Show[]>([]);
  const [upcoming, setUpcoming]       = useState<Show[]>([]);
  const [featured, setFeatured]       = useState<Show | null>(null);
  const [content, setContent]         = useState<ContentItem[]>([]);
  const [creators, setCreators]       = useState<Creator[]>([]);

  const bg = isNight ? '#080E24' : '#F5F6FF';
  const text = isNight ? '#E8E3F8' : '#1E1B4B';
  const muted = isNight ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';

  useEffect(() => {
    (supabase as any).from('pavilion_shows')
      .select('*, profiles(username)')
      .in('status', ['live','upcoming','scheduled'])
      .order('attendee_count', { ascending: false })
      .limit(12)
      .then(({ data }: any) => {
        if (data?.length) {
          const normalized = data.map((s: any) => ({ ...s, creator_name: s.profiles?.username, status: s.status === 'scheduled' ? 'upcoming' : s.status }));
          const live = normalized.filter((s: Show) => s.status === 'live');
          const up = normalized.filter((s: Show) => s.status === 'upcoming');
          setLiveShows(live);
          setUpcoming(up);
          if (live.length) setFeatured(live[0]);
          else if (up.length) setFeatured(up[0]);
        }
      })
      .catch(() => {});

    fetch('/api/pavilion/content').then(r => r.json()).then(d => setContent((d.items ?? []).slice(0, 8))).catch(() => {});
    fetch('/api/pavilion/creators').then(r => r.json()).then(d => setCreators((d.creators ?? []).slice(0, 8))).catch(() => {});
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: bg, paddingBottom: 80 }}>
      {/* ── Header ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 30, background: isNight ? 'rgba(8,14,36,0.96)' : 'rgba(245,246,255,0.96)', backdropFilter: 'blur(16px)', borderBottom: `1px solid ${isNight ? '#1E2448' : '#C5CAE9'}`, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/village/map" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: text }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </Link>
        <h1 style={{ flex: 1, fontSize: 18, fontWeight: 900, color: text, margin: 0 }}>Pavilion</h1>
        <Link href="/village/pavilion/browse" style={{ width: 36, height: 36, borderRadius: '50%', border: `1px solid ${isNight ? '#1E2448' : '#C5CAE9'}`, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: text }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        </Link>
        <Link href="/village/pavilion/subscriptions" style={{ width: 36, height: 36, borderRadius: '50%', border: `1px solid ${isNight ? '#1E2448' : '#C5CAE9'}`, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: text }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>
        </Link>
      </div>

      {/* ── Featured Banner ── */}
      {featured && (
        <div style={{ paddingTop: 16 }}>
          <FeaturedBanner show={featured} isNight={isNight} />
        </div>
      )}

      {/* ── Live Now ── */}
      {liveShows.length > 0 && (
        <div style={{ marginBottom: 24, marginTop: featured ? 0 : 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ background: '#D63B3B', borderRadius: 20, padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
                <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />
                <span style={{ fontSize: 11, fontWeight: 900, color: '#fff' }}>LIVE NOW</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: text }}>{liveShows.length} streams</span>
            </div>
            <Link href="/village/pavilion/live" style={{ fontSize: 12, fontWeight: 700, color: '#2952E8', textDecoration: 'none' }}>See all</Link>
          </div>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '0 16px', scrollbarWidth: 'none' }}>
            {liveShows.map(s => <LiveCard key={s.id} show={s} isNight={isNight} />)}
          </div>
        </div>
      )}

      {/* ── Upcoming Events ── */}
      <div style={{ marginBottom: 24, marginTop: (!featured && liveShows.length === 0) ? 16 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 12px' }}>
          <h2 style={{ fontSize: 15, fontWeight: 900, color: text, margin: 0 }}>Upcoming Events</h2>
          <Link href="/village/pavilion/live" style={{ fontSize: 12, fontWeight: 700, color: '#2952E8', textDecoration: 'none' }}>See all</Link>
        </div>
        {upcoming.length === 0 ? (
          <div style={{ padding: '0 16px' }}>
            <Link href="/village/pavilion/host" style={{ display: 'block', textAlign: 'center', padding: '20px 0', borderRadius: 16, border: `1px dashed ${isNight ? '#1E2448' : '#C5CAE9'}`, color: '#2952E8', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
              No upcoming events yet. Host one →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '0 16px' }}>
            {upcoming.slice(0, 4).map(s => <EventCard key={s.id} show={s} isNight={isNight} />)}
          </div>
        )}
      </div>

      {/* ── Learning ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 12px' }}>
          <h2 style={{ fontSize: 15, fontWeight: 900, color: text, margin: 0 }}>Pavilion Content</h2>
          <Link href="/village/pavilion/browse" style={{ fontSize: 12, fontWeight: 700, color: '#2952E8', textDecoration: 'none' }}>Browse all</Link>
        </div>
        {content.length === 0 ? (
          <div style={{ padding: '0 16px' }}>
            <p style={{ fontSize: 12, color: muted, margin: 0 }}>No content yet. Check back soon.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '0 16px', scrollbarWidth: 'none' }}>
            {content.map(c => <ContentCard key={c.id} item={c} isNight={isNight} />)}
          </div>
        )}
      </div>

      {/* ── Village Creators ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 12px' }}>
          <h2 style={{ fontSize: 15, fontWeight: 900, color: text, margin: 0 }}>Village Creators</h2>
          <Link href="/village/pavilion/creators" style={{ fontSize: 12, fontWeight: 700, color: '#2952E8', textDecoration: 'none' }}>Explore</Link>
        </div>
        {creators.length === 0 ? (
          <div style={{ padding: '0 16px' }}>
            <p style={{ fontSize: 12, color: muted, margin: 0 }}>No creators yet. Be the first to publish in Pavilion.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 16, overflowX: 'auto', padding: '0 16px', scrollbarWidth: 'none' }}>
            {creators.map(cr => (
              <Link key={cr.id} href={`/village/pavilion/creators/${cr.handle}`} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: 64, textDecoration: 'none' }}>
                <CreatorInitials name={cr.name} size={52} />
                <p style={{ fontSize: 11, fontWeight: 700, color: text, textAlign: 'center', lineHeight: 1.2, margin: 0 }}>{cr.name}</p>
                <p style={{ fontSize: 10, color: muted, margin: 0 }}>{formatFollowers(cr.views)} views</p>
              </Link>
            ))}
          </div>
        )}
      </div>

      <PavilionNav active="home" />
    </div>
  );
}
