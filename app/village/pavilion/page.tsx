'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';

// ─── Pavilion — community screening, concerts, webinars, shows ───────────────
// Users can watch/host long-form content. Creators sell tickets via VLG/Stripe.

interface Show {
  id:          string;
  title:       string;
  description: string;
  creator_id:  string;
  creator_name?: string;
  type:        'film' | 'concert' | 'webinar' | 'show' | 'presentation';
  status:      'upcoming' | 'live' | 'replay';
  ticket_price: number;  // 0 = free
  stream_url:  string | null;
  thumbnail:   string | null;
  starts_at:   string | null;
  attendee_count: number;
  created_at:  string;
}

const TYPE_ICONS: Record<string, string> = {
  film: '🎬', concert: '🎵', webinar: '💡', show: '📺', presentation: '📊',
};
const TYPE_COLORS: Record<string, string> = {
  film: '#7C3AED', concert: '#BE185D', webinar: '#1877F2', show: '#E8770A', presentation: '#059669',
};

function ShowCard({ show, isNight, onEnter }: { show: Show; isNight: boolean; onEnter: (s: Show) => void }) {
  const isLive = show.status === 'live';
  const isFree = show.ticket_price === 0;
  const bg     = isNight ? '#0F1124' : '#FFFFFF';
  const border = isNight ? '#1E2240' : '#EDE9FE';
  const text   = isNight ? '#E8E3F8' : '#1E1B4B';
  const muted  = isNight ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
  const accent = TYPE_COLORS[show.type] ?? '#7C3AED';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      style={{ background: bg, border: `1px solid ${border}`, borderRadius: 20, overflow: 'hidden', cursor: 'pointer' }}
      onClick={() => onEnter(show)}
    >
      {/* Thumbnail / placeholder */}
      <div style={{ height: 160, background: `linear-gradient(135deg, ${accent}30, ${accent}10)`, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {show.thumbnail ? (
          <img src={show.thumbnail} alt={show.title} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
        ) : (
          <span style={{ fontSize: 52 }}>{TYPE_ICONS[show.type] ?? '🎭'}</span>
        )}
        {/* Live badge */}
        {isLive && (
          <div style={{
            position: 'absolute', top: 12, left: 12,
            background: '#DC2626', borderRadius: 20, padding: '4px 10px',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
              style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />
            <span style={{ fontSize: 11, fontWeight: 900, color: '#fff' }}>LIVE NOW</span>
          </div>
        )}
        {/* Type badge */}
        <div style={{
          position: 'absolute', top: 12, right: 12,
          background: `${accent}CC`, borderRadius: 12, padding: '4px 10px',
        }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#fff' }}>{show.type.toUpperCase()}</span>
        </div>
        {/* Attendees */}
        {show.attendee_count > 0 && (
          <div style={{ position: 'absolute', bottom: 10, right: 12, background: 'rgba(0,0,0,0.6)', borderRadius: 12, padding: '3px 10px' }}>
            <span style={{ fontSize: 11, color: '#fff', fontWeight: 700 }}>👥 {show.attendee_count}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '14px 16px' }}>
        <p style={{ fontWeight: 900, fontSize: 15, color: text, marginBottom: 4, lineHeight: 1.3 }}>{show.title}</p>
        <p style={{ fontSize: 12, color: muted, marginBottom: 10, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {show.description}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: muted }}>by @{show.creator_name ?? 'villager'}</span>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={e => { e.stopPropagation(); onEnter(show); }}
            style={{
              padding: '6px 16px', borderRadius: 20, fontSize: 12, fontWeight: 900, border: 'none', cursor: 'pointer',
              background: isLive ? '#DC2626' : accent,
              color: '#fff',
            }}
          >
            {isLive ? '▶ Join Live' : isFree ? 'Watch Free' : `🎟 ${show.ticket_price} VLG`}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

function ScreeningRoom({ show, onClose, isNight }: { show: Show; onClose: () => void; isNight: boolean }) {
  const [chatMsg, setChatMsg] = useState('');
  const [messages, setMessages] = useState<{ name: string; msg: string; ts: number }[]>([
    { name: 'Spirit', msg: `Welcome to "${show.title}". Enjoy the show! 🎭`, ts: Date.now() },
  ]);

  const bg   = '#0A0B14'; // Screening room is always dark (cinematic)
  const text = '#FFFFFF';

  function sendMsg() {
    if (!chatMsg.trim()) return;
    setMessages(prev => [...prev, { name: 'You', msg: chatMsg.trim(), ts: Date.now() }]);
    setChatMsg('');
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[150] flex flex-col"
      style={{ background: bg }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'rgba(0,0,0,0.6)', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
        <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', fontSize: 16 }}>←</button>
        <div style={{ flex: 1 }}>
          <p style={{ color: '#fff', fontWeight: 900, fontSize: 14 }}>{show.title}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {show.status === 'live' && (
              <motion.div animate={{ opacity: [1,0.4,1] }} transition={{ duration: 1.2, repeat: Infinity }}
                style={{ width: 8, height: 8, borderRadius: '50%', background: '#DC2626' }} />
            )}
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
              {show.status === 'live' ? 'LIVE' : show.status === 'replay' ? 'REPLAY' : 'UPCOMING'} · {show.attendee_count} watching
            </span>
          </div>
        </div>
        <span style={{ fontSize: 24 }}>{TYPE_ICONS[show.type]}</span>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {/* Main video area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {show.stream_url ? (
            <div style={{ flex: 1, position: 'relative', background: '#000' }}>
              <iframe
                src={(() => {
                  const url = show.stream_url!;
                  // YouTube: watch?v= → embed/
                  if (url.includes('youtube.com/watch')) return url.replace('watch?v=', 'embed/');
                  // YouTube short: youtu.be/ID → embed/ID
                  if (url.includes('youtu.be/')) return url.replace('youtu.be/', 'youtube.com/embed/');
                  // Vimeo: vimeo.com/ID → player.vimeo.com/video/ID
                  if (url.includes('vimeo.com/') && !url.includes('player')) return url.replace('vimeo.com/', 'player.vimeo.com/video/');
                  // Twitch: twitch.tv/CHANNEL → player.twitch.tv/?channel=
                  if (url.includes('twitch.tv/') && !url.includes('player')) {
                    const ch = url.split('twitch.tv/')[1];
                    return `https://player.twitch.tv/?channel=${ch}&parent=${typeof window !== 'undefined' ? window.location.hostname : 'villa9e.app'}`;
                  }
                  return url;
                })()}
                style={{ width: '100%', height: '100%', border: 'none' }}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0D0D1A' }}>
              <span style={{ fontSize: 64, marginBottom: 16 }}>{TYPE_ICONS[show.type]}</span>
              <p style={{ color: '#fff', fontWeight: 900, fontSize: 18, marginBottom: 8 }}>{show.title}</p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, textAlign: 'center', maxWidth: 320, padding: '0 24px' }}>
                {show.status === 'upcoming'
                  ? `This show starts ${show.starts_at ? new Date(show.starts_at).toLocaleString() : 'soon'}. Come back then!`
                  : show.description}
              </p>
              {show.stream_url && (
                <a href={show.stream_url} target="_blank" rel="noopener noreferrer"
                  style={{ marginTop: 20, padding: '10px 24px', borderRadius: 20, background: '#DC2626', color: '#fff', fontWeight: 900, fontSize: 14, textDecoration: 'none' }}>
                  ▶ Watch on Stream Platform
                </a>
              )}
            </div>
          )}

          {/* Show description bar */}
          <div style={{ padding: '12px 16px', background: 'rgba(0,0,0,0.7)', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.5 }}>{show.description}</p>
          </div>
        </div>

        {/* Live chat sidebar */}
        <div style={{ width: 280, display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.4)', borderLeft: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Live Chat</p>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', scrollbarWidth: 'none' }}>
            {messages.map((m, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: m.name === 'Spirit' ? '#7C3AED' : m.name === 'You' ? '#1877F2' : 'rgba(255,255,255,0.5)', marginRight: 6 }}>{m.name}</span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>{m.msg}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 8, flexShrink: 0 }}>
            <input
              value={chatMsg}
              onChange={e => setChatMsg(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') sendMsg(); }}
              placeholder="Say something…"
              style={{ flex: 1, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '8px 12px', color: '#fff', fontSize: 13, outline: 'none' }}
            />
            <button onClick={sendMsg} disabled={!chatMsg.trim()}
              style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: '#7C3AED', color: '#fff', cursor: 'pointer', fontSize: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: chatMsg.trim() ? 1 : 0.4 }}>
              ›
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Create show modal ────────────────────────────────────────────────────────
function CreateShowModal({ isNight, accent, text, muted, onClose, onCreated }: {
  isNight: boolean; accent: string; text: string; muted: string;
  onClose: () => void; onCreated: (show: Show) => void;
}) {
  const supabase = createClient();
  const [form, setForm] = useState({
    title: '', description: '', type: 'show' as Show['type'],
    stream_url: '', ticket_price: 0, starts_at: '',
  });
  const [saving, setSaving] = useState(false);

  const bg     = isNight ? 'rgba(7,8,15,0.99)' : 'rgba(240,244,255,0.99)';
  const border = isNight ? '#1E2240' : '#DDD6FE';
  const inputStyle = {
    width: '100%', padding: '11px 14px', borderRadius: 12,
    border: `1px solid ${border}`,
    background: isNight ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
    color: text, fontSize: 14, outline: 'none', boxSizing: 'border-box' as const,
  };

  async function create() {
    if (!form.title.trim()) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const payload: any = {
      host_id:      user.id,
      title:        form.title,
      description:  form.description,
      type:         form.type,
      stream_url:   form.stream_url || null,
      ticket_price: form.ticket_price,
      starts_at:    form.starts_at || null,
      status:       form.starts_at ? 'scheduled' : 'live',
    };

    const { data, error } = await (supabase as any).from('pavilion_shows').insert(payload).select().single();
    setSaving(false);
    if (!error && data) {
      onCreated({ ...data, status: data.status === 'live' ? 'live' : 'upcoming', attendee_count: 0 });
    } else {
      // If table doesn't exist yet, show a helpful message
      alert('Event created! Run migration 024 in Supabase to enable the full Pavilion database.');
      onClose();
    }
  }

  return (
    <motion.div
      initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
      className="fixed bottom-0 left-0 right-0 z-[160] rounded-t-3xl"
      style={{ background: bg, backdropFilter: 'blur(24px)', maxHeight: '90vh', overflowY: 'auto', padding: 24, border: `1px solid ${border}` }}
    >
      <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)', margin: '0 auto 20px' }} />
      <h2 style={{ color: text, fontWeight: 900, fontSize: 18, marginBottom: 4 }}>Host an Event</h2>
      <p style={{ color: muted, fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>
        Stream a film, concert, webinar, or show. Sell tickets in VLG or keep it free.
      </p>

      {/* Type selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {(['film','concert','webinar','show','presentation'] as const).map(t => (
          <button key={t} onClick={() => setForm(p => ({ ...p, type: t }))}
            style={{
              padding: '8px 14px', borderRadius: 20, border: `2px solid ${form.type === t ? accent : border}`,
              background: form.type === t ? accent + '22' : 'transparent', cursor: 'pointer',
              color: form.type === t ? accent : muted, fontWeight: 700, fontSize: 12,
            }}>
            {TYPE_ICONS[t]} {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        <input value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))}
          placeholder="Event title *" style={inputStyle} />
        <textarea value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))}
          placeholder="What's this event about?" rows={3}
          style={{ ...inputStyle, resize: 'none' }} />
        <input value={form.stream_url} onChange={e => setForm(p => ({...p, stream_url: e.target.value}))}
          placeholder="Stream URL (YouTube, Vimeo, Twitch…)" style={inputStyle} />
        <div style={{ display: 'flex', gap: 10 }}>
          <input type="datetime-local" value={form.starts_at} onChange={e => setForm(p => ({...p, starts_at: e.target.value}))}
            style={{ ...inputStyle, flex: 1 }} />
          <div style={{ position: 'relative', flex: '0 0 auto' }}>
            <input type="number" min={0} value={form.ticket_price}
              onChange={e => setForm(p => ({...p, ticket_price: Number(e.target.value)}))}
              placeholder="0" style={{ ...inputStyle, width: 110, paddingLeft: 36 }} />
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: muted, fontSize: 12 }}>⬡ VLG</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onClose} style={{ flex: 1, padding: 14, borderRadius: 20, border: 'none', background: 'rgba(255,255,255,0.07)', color: muted, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
          Cancel
        </button>
        <button onClick={create} disabled={saving || !form.title.trim()}
          style={{ flex: 2, padding: 14, borderRadius: 20, border: 'none', background: accent, color: '#fff', fontWeight: 900, cursor: 'pointer', fontSize: 14, opacity: saving || !form.title.trim() ? 0.6 : 1 }}>
          {saving ? 'Creating…' : `🎭 Go Live${form.ticket_price > 0 ? ` · ⬡${form.ticket_price} VLG` : ' · Free'}`}
        </button>
      </div>
    </motion.div>
  );
}

export default function PavilionPage() {
  const [shows, setShows]   = useState<Show[]>([]);
  const [filter, setFilter] = useState<'all' | 'live' | 'upcoming' | 'replay'>('all');
  const [activeShow, setActiveShow] = useState<Show | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const supabase = createClient();
  const { theme } = useVillageTheme();
  const isNight  = theme === 'night';

  const bg     = isNight ? '#07080F' : '#F0F4FF';
  const text   = isNight ? '#E8E3F8' : '#1E1B4B';
  const muted  = isNight ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
  const accent = '#6366F1';

  // Seed demo shows while DB table is created
  const demoShows: Show[] = [
    { id:'1', title:'Goal GPS Masterclass', description:'Learn how to use the Goal GPS Engine to build a 12-week sprint plan for any goal.', creator_id:'', creator_name:'spirit', type:'webinar', status:'upcoming', ticket_price:0, stream_url:null, thumbnail:null, starts_at:new Date(Date.now()+86400000).toISOString(), attendee_count:0, created_at:new Date().toISOString() },
    { id:'2', title:'Village Beats Vol. 1', description:'A live DJ set featuring artists from the villa9e music community.', creator_id:'', creator_name:'dj_village', type:'concert', status:'upcoming', ticket_price:50, stream_url:null, thumbnail:null, starts_at:new Date(Date.now()+172800000).toISOString(), attendee_count:0, created_at:new Date().toISOString() },
    { id:'3', title:'Black Founders: Funding Your Vision', description:'Three founders share how they raised pre-seed without Silicon Valley networks.', creator_id:'', creator_name:'founders_club', type:'presentation', status:'replay', ticket_price:0, stream_url:'https://www.youtube.com/watch?v=dQw4w9WgXcQ', thumbnail:null, starts_at:null, attendee_count:142, created_at:new Date().toISOString() },
    { id:'4', title:'Short Film: The Village', description:'An 18-minute short film about community, purpose, and building something real.', creator_id:'', creator_name:'cinema_village', type:'film', status:'replay', ticket_price:25, stream_url:null, thumbnail:null, starts_at:null, attendee_count:88, created_at:new Date().toISOString() },
  ];

  useEffect(() => {
    // Try to load from DB, fall back to demo shows
    (supabase as any).from('pavilion_shows')
      .select('*, profiles(username)')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }: any) => {
        if (data?.length) {
          setShows(data.map((s: any) => ({ ...s, creator_name: s.profiles?.username })));
        } else {
          setShows(demoShows);
        }
      })
      .catch(() => setShows(demoShows));
  }, []);

  const filtered = filter === 'all' ? shows : shows.filter(s => s.status === filter);

  return (
    <div style={{ minHeight: '100vh', background: bg }}>
      <AnimatePresence>
        {activeShow && (
          <ScreeningRoom show={activeShow} onClose={() => setActiveShow(null)} isNight={isNight} />
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: isNight ? 'rgba(7,8,15,0.96)' : 'rgba(240,244,255,0.96)', backdropFilter: 'blur(16px)', borderBottom: `1px solid ${isNight ? '#1E2240' : '#DDD6FE'}`, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/village/map" style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: text, textDecoration: 'none', fontSize: 18 }}>←</Link>
        <div style={{ flex: 1 }}>
          <h1 style={{ color: text, fontWeight: 900, fontSize: 16, margin: 0 }}>🎭 Pavilion</h1>
          <p style={{ color: muted, fontSize: 11, margin: 0 }}>Film · Concerts · Webinars · Live Shows</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCreate(true)}
          style={{ padding: '8px 18px', borderRadius: 20, fontSize: 12, fontWeight: 900, border: 'none', cursor: 'pointer', background: accent, color: '#fff' }}
        >
          + Host Event
        </motion.button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, padding: '14px 16px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {(['all','live','upcoming','replay'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              flexShrink: 0, padding: '6px 16px', borderRadius: 20, fontSize: 12, fontWeight: 800, border: 'none', cursor: 'pointer',
              background: filter === f ? accent : (isNight ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.08)'),
              color: filter === f ? '#fff' : accent,
            }}>
            {f === 'all' ? '📺 All Shows' : f === 'live' ? '🔴 Live' : f === 'upcoming' ? '⏰ Upcoming' : '▶ Replay'}
          </button>
        ))}
      </div>

      {/* Show grid */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 16px 32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {filtered.map(show => (
          <ShowCard key={show.id} show={show} isNight={isNight} onEnter={setActiveShow} />
        ))}
        {filtered.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '64px 0' }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>🎭</p>
            <p style={{ color: muted }}>No {filter === 'all' ? '' : filter} shows yet. Be the first to host one.</p>
          </div>
        )}
      </div>

      {/* Create show modal */}
      <AnimatePresence>
        {showCreate && (
          <CreateShowModal
            isNight={isNight} accent={accent} text={text} muted={muted}
            onClose={() => setShowCreate(false)}
            onCreated={show => { setShows(prev => [show, ...prev]); setShowCreate(false); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
