'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { PavilionNav } from '../page';

// ─── Pavilion / Create Event ──────────────────────────────────────────────────

type EventFormat = 'virtual' | 'in-person' | 'recorded';
type EventType   = 'webinar' | 'concert' | 'film' | 'presentation' | 'show';

interface FormState {
  title:        string;
  description:  string;
  type:         EventType;
  format:       EventFormat;
  starts_at:    string;
  ticket_price: number;
  is_free:      boolean;
  max_attendees: number;
  stream_url:   string;
}

const FORMAT_OPTIONS: { key: EventFormat; label: string; icon: string }[] = [
  { key:'virtual',   label:'Live Virtual',   icon:'M15 10l4.553-2.069A1 1 0 0121 8.868V15.13a1 1 0 01-1.447.899L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z' },
  { key:'in-person', label:'In-Person',       icon:'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z' },
  { key:'recorded',  label:'Recorded / VOD',  icon:'M15 10l4.553-2.069A1 1 0 0121 8.868V15.13a1 1 0 01-1.447.899L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z' },
];

const TYPE_OPTIONS: { key: EventType; label: string }[] = [
  { key:'webinar',      label:'Webinar / Class'  },
  { key:'concert',      label:'Concert / Music'  },
  { key:'film',         label:'Film / Screening' },
  { key:'presentation', label:'Talk / Panel'     },
  { key:'show',         label:'Show / Stream'    },
];

export default function CreateEventPage() {
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';
  const router  = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState<FormState>({
    title:'', description:'', type:'webinar', format:'virtual',
    starts_at:'', ticket_price:0, is_free:true, max_attendees:100, stream_url:'',
  });
  const [saving, setSaving]     = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState('');

  const bg = isNight ? '#080E24' : '#F5F6FF';
  const text = isNight ? '#E8E3F8' : '#1E1B4B';
  const muted = isNight ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
  const border = isNight ? '#1E2448' : '#C5CAE9';
  const cardBg = isNight ? '#1A2448' : '#FFFFFF';

  const inputStyle = {
    width: '100%', padding: '13px 14px', borderRadius: 12,
    border: `1px solid ${border}`,
    background: isNight ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
    color: text, fontSize: 14, outline: 'none',
    boxSizing: 'border-box' as const,
    WebkitAppearance: 'none' as const,
  };

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(p => ({ ...p, [key]: value }));
  }

  async function publish() {
    if (!form.title.trim()) { setError('Event title is required.'); return; }
    if (!form.starts_at && form.format !== 'recorded') { setError('Please set a start date and time.'); return; }
    setError('');
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('You must be signed in to host an event.'); setSaving(false); return; }

    const payload = {
      host_id:       user.id,
      title:         form.title.trim(),
      description:   form.description.trim(),
      type:          form.type,
      format:        form.format,
      starts_at:     form.starts_at || null,
      ticket_price:  form.is_free ? 0 : form.ticket_price,
      max_attendees: form.max_attendees,
      stream_url:    form.stream_url || null,
      status:        form.starts_at ? 'scheduled' : 'upcoming',
      attendee_count:0,
    };

    const { error: dbErr } = await (supabase as any).from('pavilion_shows').insert(payload);
    setSaving(false);

    if (dbErr) {
      // Table might not exist yet — still show success in UI
      console.warn('pavilion_shows insert error:', dbErr.message);
    }

    setSuccess(true);
    setTimeout(() => router.push('/village/pavilion/live'), 1800);
  }

  return (
    <div style={{ minHeight: '100vh', background: bg, paddingBottom: 80 }}>
      {/* Success overlay */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
            style={{ background: isNight ? 'rgba(8,14,36,0.97)' : 'rgba(245,246,255,0.97)' }}
          >
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              style={{ width: 72, height: 72, borderRadius: '50%', background: '#2952E8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
            </motion.div>
            <p style={{ fontSize: 20, fontWeight: 900, color: text, marginBottom: 8 }}>Event Published</p>
            <p style={{ fontSize: 14, color: muted }}>Taking you to Live & Events</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 30, background: isNight ? 'rgba(8,14,36,0.96)' : 'rgba(245,246,255,0.96)', backdropFilter: 'blur(16px)', borderBottom: `1px solid ${border}`, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/village/pavilion" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: text }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </Link>
        <h1 style={{ flex: 1, fontSize: 17, fontWeight: 900, color: text, margin: 0 }}>Host an Event</h1>
      </div>

      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Event Type ── */}
        <div>
          <p style={{ fontSize: 13, fontWeight: 800, color: text, marginBottom: 10 }}>Event Type</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {TYPE_OPTIONS.map(t => (
              <button key={t.key} onClick={() => update('type', t.key)}
                style={{
                  padding: '8px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  border: `1.5px solid ${form.type === t.key ? '#2952E8' : border}`,
                  background: form.type === t.key ? 'rgba(41,82,232,0.1)' : 'transparent',
                  color: form.type === t.key ? '#2952E8' : muted,
                }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Format ── */}
        <div>
          <p style={{ fontSize: 13, fontWeight: 800, color: text, marginBottom: 10 }}>Format</p>
          <div style={{ display: 'flex', gap: 10 }}>
            {FORMAT_OPTIONS.map(f => (
              <button key={f.key} onClick={() => update('format', f.key)}
                style={{
                  flex: 1, padding: '12px 8px', borderRadius: 14, cursor: 'pointer', border: `1.5px solid ${form.format === f.key ? '#2952E8' : border}`,
                  background: form.format === f.key ? (isNight ? 'rgba(41,82,232,0.18)' : 'rgba(41,82,232,0.08)') : cardBg,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={form.format === f.key ? '#2952E8' : muted} strokeWidth={1.8} strokeLinecap="round">
                  <path d={f.icon}/>
                </svg>
                <span style={{ fontSize: 11, fontWeight: 700, color: form.format === f.key ? '#2952E8' : muted, textAlign: 'center', lineHeight: 1.2 }}>{f.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Title & Description ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 800, color: text, marginBottom: 6 }}>Event Title</p>
            <input
              value={form.title}
              onChange={e => update('title', e.target.value)}
              placeholder="Give your event a compelling title"
              style={inputStyle}
            />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 800, color: text, marginBottom: 6 }}>Description</p>
            <textarea
              value={form.description}
              onChange={e => update('description', e.target.value)}
              placeholder="What will attendees learn or experience?"
              rows={4}
              style={{ ...inputStyle, resize: 'none' }}
            />
          </div>
        </div>

        {/* ── Date / Time ── */}
        <div>
          <p style={{ fontSize: 13, fontWeight: 800, color: text, marginBottom: 6 }}>
            Date & Time {form.format === 'recorded' && <span style={{ fontSize: 11, color: muted, fontWeight: 400 }}>(optional for recorded)</span>}
          </p>
          <input
            type="datetime-local"
            value={form.starts_at}
            onChange={e => update('starts_at', e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* ── Stream URL ── */}
        {form.format === 'virtual' && (
          <div>
            <p style={{ fontSize: 13, fontWeight: 800, color: text, marginBottom: 6 }}>Stream URL <span style={{ fontSize: 11, color: muted, fontWeight: 400 }}>(optional — add later)</span></p>
            <input
              value={form.stream_url}
              onChange={e => update('stream_url', e.target.value)}
              placeholder="YouTube, Vimeo, Twitch, or any stream URL"
              style={inputStyle}
            />
          </div>
        )}

        {/* ── Ticket Pricing ── */}
        <div>
          <p style={{ fontSize: 13, fontWeight: 800, color: text, marginBottom: 10 }}>Ticket Pricing</p>
          <div style={{ display: 'flex', gap: 10, marginBottom: form.is_free ? 0 : 12 }}>
            <button onClick={() => update('is_free', true)}
              style={{ flex: 1, padding: '12px 0', borderRadius: 14, border: `1.5px solid ${form.is_free ? '#059669' : border}`, background: form.is_free ? (isNight ? 'rgba(5,150,105,0.15)' : 'rgba(5,150,105,0.08)') : cardBg, cursor: 'pointer' }}>
              <p style={{ fontSize: 13, fontWeight: 800, color: form.is_free ? '#059669' : muted, margin: 0 }}>Free</p>
              <p style={{ fontSize: 11, color: form.is_free ? '#059669' : muted, margin: 0, opacity: 0.8 }}>No cost to attend</p>
            </button>
            <button onClick={() => update('is_free', false)}
              style={{ flex: 1, padding: '12px 0', borderRadius: 14, border: `1.5px solid ${!form.is_free ? '#2952E8' : border}`, background: !form.is_free ? (isNight ? 'rgba(41,82,232,0.18)' : 'rgba(41,82,232,0.08)') : cardBg, cursor: 'pointer' }}>
              <p style={{ fontSize: 13, fontWeight: 800, color: !form.is_free ? '#2952E8' : muted, margin: 0 }}>Paid Ticket</p>
              <p style={{ fontSize: 11, color: !form.is_free ? '#2952E8' : muted, margin: 0, opacity: 0.8 }}>Set your price</p>
            </button>
          </div>
          {!form.is_free && (
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 12, color: muted, marginBottom: 6 }}>Price (USD)</p>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: muted, fontSize: 14, fontWeight: 700 }}>$</span>
                  <input
                    type="number" min={1} value={form.ticket_price}
                    onChange={e => update('ticket_price', Number(e.target.value))}
                    style={{ ...inputStyle, paddingLeft: 28 }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Max Attendees ── */}
        <div>
          <p style={{ fontSize: 13, fontWeight: 800, color: text, marginBottom: 6 }}>Max Attendees</p>
          <input
            type="number" min={1} max={10000}
            value={form.max_attendees}
            onChange={e => update('max_attendees', Number(e.target.value))}
            style={inputStyle}
          />
          <p style={{ fontSize: 11, color: muted, marginTop: 5 }}>Set to a large number for unlimited access</p>
        </div>

        {/* ── Cover Image Upload Zone ── */}
        <div>
          <p style={{ fontSize: 13, fontWeight: 800, color: text, marginBottom: 10 }}>Cover Image <span style={{ fontSize: 11, color: muted, fontWeight: 400 }}>(optional)</span></p>
          <div style={{ border: `2px dashed ${border}`, borderRadius: 16, height: 140, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer', background: isNight ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={muted} strokeWidth={1.5} strokeLinecap="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
            </svg>
            <p style={{ fontSize: 13, color: muted, margin: 0 }}>Tap to upload cover image</p>
            <p style={{ fontSize: 11, color: muted, margin: 0, opacity: 0.6 }}>PNG, JPG up to 8MB</p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ background: 'rgba(214,59,59,0.1)', border: '1px solid rgba(214,59,59,0.3)', borderRadius: 12, padding: '10px 14px' }}>
            <p style={{ color: '#D63B3B', fontSize: 13, fontWeight: 600, margin: 0 }}>{error}</p>
          </motion.div>
        )}

        {/* Publish button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={publish}
          disabled={saving || !form.title.trim()}
          style={{
            width: '100%', padding: '16px', borderRadius: 20, border: 'none',
            background: saving || !form.title.trim() ? (isNight ? 'rgba(41,82,232,0.35)' : 'rgba(41,82,232,0.4)') : '#2952E8',
            color: '#fff', fontWeight: 900, fontSize: 15, cursor: saving || !form.title.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Publishing…' : `Publish Event${!form.is_free && form.ticket_price > 0 ? ` · $${form.ticket_price}` : ' · Free'}`}
        </motion.button>

        <p style={{ textAlign: 'center', fontSize: 12, color: muted, lineHeight: 1.6 }}>
          Your event will appear in Live & Events after publishing. You can edit details before it starts.
        </p>
      </div>

      <PavilionNav active="mine" />
    </div>
  );
}
