'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

// ─── Mock Data ────────────────────────────────────────────────────────────────
const LIVE_SHOWS: Show[] = [
  { id:'l1', title:'Goal GPS Live Workshop', description:'Build your 12-week sprint plan in real time with Spirit AI.', creator_id:'', creator_name:'spiritai', type:'webinar', status:'live', ticket_price:0, stream_url:null, thumbnail:null, starts_at:null, attendee_count:312, created_at:'' },
  { id:'l2', title:'Village Beats — Friday Night', description:'Live DJ set from the village music community.', creator_id:'', creator_name:'dj_village', type:'concert', status:'live', ticket_price:0, stream_url:null, thumbnail:null, starts_at:null, attendee_count:189, created_at:'' },
  { id:'l3', title:'Black Founders Q&A', description:'Founders share how they raised pre-seed without Silicon Valley.', creator_id:'', creator_name:'founders_club', type:'presentation', status:'live', ticket_price:0, stream_url:null, thumbnail:null, starts_at:null, attendee_count:94, created_at:'' },
];

const UPCOMING_EVENTS: Show[] = [
  { id:'u1', title:'Brand Identity Masterclass', description:'Build a brand that moves people. Led by award-winning designer Nia James.', creator_id:'', creator_name:'niajames', type:'webinar', status:'upcoming', ticket_price:0, stream_url:null, thumbnail:null, starts_at:new Date(Date.now()+86400000).toISOString(), attendee_count:47, created_at:'' },
  { id:'u2', title:'Village Jazz Night', description:'An intimate virtual jazz performance from our Village musicians.', creator_id:'', creator_name:'jazzvillage', type:'concert', status:'upcoming', ticket_price:25, stream_url:null, thumbnail:null, starts_at:new Date(Date.now()+172800000).toISOString(), attendee_count:128, created_at:'' },
  { id:'u3', title:'Credit Repair Blueprint', description:'Step-by-step guide to rebuilding your credit score in 90 days.', creator_id:'', creator_name:'creditpro', type:'webinar', status:'upcoming', ticket_price:0, stream_url:null, thumbnail:null, starts_at:new Date(Date.now()+259200000).toISOString(), attendee_count:203, created_at:'' },
  { id:'u4', title:'Short Film Premiere: The Village', description:'An 18-minute short film about community, purpose, and building something real.', creator_id:'', creator_name:'cinema_v', type:'film', status:'upcoming', ticket_price:10, stream_url:null, thumbnail:null, starts_at:new Date(Date.now()+345600000).toISOString(), attendee_count:76, created_at:'' },
  { id:'u5', title:'Crypto for Builders', description:'DeFi fundamentals and how to use VLG tokens in the real economy.', creator_id:'', creator_name:'web3village', type:'presentation', status:'upcoming', ticket_price:0, stream_url:null, thumbnail:null, starts_at:new Date(Date.now()+432000000).toISOString(), attendee_count:155, created_at:'' },
];

const COURSES = [
  { id:'c1', title:'Goal GPS: 12-Week Sprint System', instructor:'Spirit AI', modules:8, rating:4.9, price:0, enrolled:true, progress:65, category:'Personal' },
  { id:'c2', title:'Credit & Financial Foundation', instructor:'Marcus Thompson', modules:12, rating:4.8, price:49, enrolled:true, progress:20, category:'Finance' },
  { id:'c3', title:'Full-Stack Next.js Bootcamp', instructor:'Kwame A.', modules:24, rating:4.7, price:99, enrolled:false, progress:0, category:'Tech' },
  { id:'c4', title:'Launch Your Brand in 30 Days', instructor:'Nia James', modules:10, rating:4.6, price:79, enrolled:false, progress:0, category:'Business' },
];

const CREATORS = [
  { id:'cr1', name:'Spirit AI', handle:'spiritai', followers:12400, verified:true },
  { id:'cr2', name:'Nia James', handle:'niajames', followers:3280, verified:true },
  { id:'cr3', name:'Marcus T.', handle:'marcust', followers:1870, verified:false },
  { id:'cr4', name:'DJ Village', handle:'dj_village', followers:940, verified:false },
  { id:'cr5', name:'Kwame A.', handle:'devpath', followers:4120, verified:true },
  { id:'cr6', name:'Priya S.', handle:'priyas', followers:2650, verified:false },
];

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

// ─── Course Card ──────────────────────────────────────────────────────────────
function CourseCard({ course, isNight }: { course: typeof COURSES[0]; isNight: boolean }) {
  const cardBg = isNight ? '#1A2448' : '#FFFFFF';
  const border = isNight ? '#1E2448' : '#C5CAE9';
  const text = isNight ? '#E8E3F8' : '#1E1B4B';
  const muted = isNight ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
  return (
    <div style={{ flexShrink: 0, width: 200, borderRadius: 16, overflow: 'hidden', background: cardBg, border: `1px solid ${border}` }}>
      <div style={{ height: 90, background: isNight ? 'rgba(41,82,232,0.15)' : 'rgba(41,82,232,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2952E8" strokeWidth={1.5} strokeLinecap="round"><path d="M12 14l9-5-9-5-9 5 9 5zM12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/></svg>
      </div>
      <div style={{ padding: '10px 12px' }}>
        <p style={{ fontWeight: 800, fontSize: 12, color: text, marginBottom: 4, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{course.title}</p>
        <p style={{ fontSize: 10, color: muted, marginBottom: 6 }}>{course.instructor} · {course.modules} modules</p>
        {course.enrolled && course.progress > 0 ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontSize: 10, color: '#2952E8', fontWeight: 700 }}>{course.progress}%</span>
              <span style={{ fontSize: 10, color: muted }}>In Progress</span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: isNight ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}>
              <div style={{ height: '100%', width: `${course.progress}%`, borderRadius: 2, background: '#2952E8' }} />
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 2 }}>
              {[1,2,3,4,5].map(s => (
                <svg key={s} width="10" height="10" viewBox="0 0 24 24" fill={s <= Math.round(course.rating) ? '#F59E0B' : 'none'} stroke="#F59E0B" strokeWidth={2}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              ))}
            </div>
            <span style={{ fontSize: 11, fontWeight: 800, color: course.price === 0 ? '#059669' : text }}>{course.price === 0 ? 'Free' : `$${course.price}`}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PavilionPage() {
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';
  const supabase = createClient();

  const [liveShows, setLiveShows]     = useState<Show[]>(LIVE_SHOWS);
  const [upcoming, setUpcoming]       = useState<Show[]>(UPCOMING_EVENTS);
  const [featured, setFeatured]       = useState<Show>(LIVE_SHOWS[0]);

  const bg = isNight ? '#080E24' : '#F5F6FF';
  const text = isNight ? '#E8E3F8' : '#1E1B4B';
  const muted = isNight ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
  const sectionBg = isNight ? 'rgba(255,255,255,0.03)' : 'transparent';

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
          if (live.length) setLiveShows(live);
          if (up.length) setUpcoming(up);
          if (live.length) setFeatured(live[0]);
          else if (up.length) setFeatured(up[0]);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: bg, paddingBottom: 80 }}>
      {/* ── Header ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 30, background: isNight ? 'rgba(8,14,36,0.96)' : 'rgba(245,246,255,0.96)', backdropFilter: 'blur(16px)', borderBottom: `1px solid ${isNight ? '#1E2448' : '#C5CAE9'}`, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/village/map" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: text }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </Link>
        <h1 style={{ flex: 1, fontSize: 18, fontWeight: 900, color: text, margin: 0 }}>Pavilion</h1>
        <button style={{ width: 36, height: 36, borderRadius: '50%', border: `1px solid ${isNight ? '#1E2448' : '#C5CAE9'}`, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: text }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        </button>
        <button style={{ width: 36, height: 36, borderRadius: '50%', border: `1px solid ${isNight ? '#1E2448' : '#C5CAE9'}`, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: text }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>
        </button>
      </div>

      {/* ── Featured Banner ── */}
      <div style={{ paddingTop: 16 }}>
        <FeaturedBanner show={featured} isNight={isNight} />
      </div>

      {/* ── Live Now ── */}
      <div style={{ marginBottom: 24 }}>
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

      {/* ── Upcoming Events ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 12px' }}>
          <h2 style={{ fontSize: 15, fontWeight: 900, color: text, margin: 0 }}>Upcoming Events</h2>
          <Link href="/village/pavilion/live" style={{ fontSize: 12, fontWeight: 700, color: '#2952E8', textDecoration: 'none' }}>See all</Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '0 16px' }}>
          {upcoming.slice(0, 4).map(s => <EventCard key={s.id} show={s} isNight={isNight} />)}
        </div>
      </div>

      {/* ── Learning ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 12px' }}>
          <h2 style={{ fontSize: 15, fontWeight: 900, color: text, margin: 0 }}>Learning</h2>
          <Link href="/village/pavilion/learn" style={{ fontSize: 12, fontWeight: 700, color: '#2952E8', textDecoration: 'none' }}>Browse all</Link>
        </div>
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '0 16px', scrollbarWidth: 'none' }}>
          {COURSES.map(c => <CourseCard key={c.id} course={c} isNight={isNight} />)}
        </div>
      </div>

      {/* ── Village Creators ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 12px' }}>
          <h2 style={{ fontSize: 15, fontWeight: 900, color: text, margin: 0 }}>Village Creators</h2>
          <Link href="/village/pavilion/live" style={{ fontSize: 12, fontWeight: 700, color: '#2952E8', textDecoration: 'none' }}>Explore</Link>
        </div>
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', padding: '0 16px', scrollbarWidth: 'none' }}>
          {CREATORS.map(cr => (
            <div key={cr.id} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: 64 }}>
              <div style={{ position: 'relative' }}>
                <CreatorInitials name={cr.name} size={52} />
                {cr.verified && (
                  <div style={{ position: 'absolute', bottom: 0, right: -2, width: 16, height: 16, borderRadius: '50%', background: '#2952E8', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${bg}` }}>
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                  </div>
                )}
              </div>
              <p style={{ fontSize: 11, fontWeight: 700, color: text, textAlign: 'center', lineHeight: 1.2, margin: 0 }}>{cr.name}</p>
              <p style={{ fontSize: 10, color: muted, margin: 0 }}>{formatFollowers(cr.followers)}</p>
            </div>
          ))}
        </div>
      </div>

      <PavilionNav active="home" />
    </div>
  );
}
