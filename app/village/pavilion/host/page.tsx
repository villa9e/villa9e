'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { PavilionNav } from '@/components/pavilion/PavilionNav';

const STEPS = ['Basics', 'Date & Capacity', 'Ticketing', 'Speakers', 'Artwork', 'Technical'] as const;
type StepLabel = typeof STEPS[number];

const GPS_CATEGORIES = ['Business', 'Finance', 'Health', 'Tech', 'Music', 'Art', 'Education', 'Mindset'];
const EVENT_TYPES = ['Webinar', 'Concert', 'Film Screening', 'Presentation', 'Workshop', 'Panel', 'Show'];
const ROLES = ['Host', 'Co-host', 'Speaker', 'Performer', 'Moderator'];
const TECH_OPTIONS = ['Browser (Default)', 'OBS / RTMP stream', 'Professional encoder'];

export default function HostEventPage() {
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';
  const [step, setStep] = useState(0);

  // Form state
  const [basics, setBasics] = useState({ name: '', description: '', eventType: '', gpsCategory: '', groupGps: false });
  const [schedule, setSchedule] = useState({ date: '', time: '', capacity: '100', maxSpeakers: '4' });
  const [ticketing, setTicketing] = useState({ free: true, price: '' });
  const [speakers, setSpeakers] = useState([{ handle: '', role: 'Speaker' }]);
  const [artwork, setArtwork] = useState({ hasFile: false });
  const [technical, setTechnical] = useState({ option: 'Browser (Default)' });

  const bg     = isNight ? '#080E24' : '#F0EFF8';
  const cardBg = isNight ? '#1A1830' : '#FFFFFF';
  const border = isNight ? '#2A2845' : '#DDD9F5';
  const text   = isNight ? '#E8E3F8' : '#1E1B4B';
  const muted  = isNight ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 12,
    border: `1px solid ${border}`,
    background: isNight ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    color: text,
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  };

  function canAdvance() {
    if (step === 0) return basics.name.trim().length > 0 && basics.eventType;
    if (step === 1) return schedule.date && schedule.time;
    return true;
  }

  const [published, setPublished] = useState(false);

  if (published) {
    return (
      <div style={{ minHeight: '100vh', background: bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#2952E8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: text, marginBottom: 8 }}>Event Published!</h2>
          <p style={{ fontSize: 14, color: muted, marginBottom: 24 }}>Your event is live. Share it with your village.</p>
          <Link href="/village/pavilion/live" style={{ padding: '12px 32px', borderRadius: 24, background: '#2952E8', color: '#fff', fontWeight: 800, fontSize: 15, textDecoration: 'none', display: 'inline-block' }}>
            View Event
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: bg, paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 30, background: isNight ? 'rgba(8,14,36,0.96)' : 'rgba(240,239,248,0.96)', backdropFilter: 'blur(16px)', borderBottom: `1px solid ${border}`, padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <Link href="/village/pavilion/live" style={{ display: 'flex', alignItems: 'center', color: text, textDecoration: 'none' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
          </Link>
          <h1 style={{ flex: 1, fontSize: 18, fontWeight: 900, color: text, margin: 0 }}>Host an Event</h1>
        </div>

        {/* Step indicators */}
        <div style={{ display: 'flex', gap: 4 }}>
          {STEPS.map((s, i) => (
            <div
              key={s}
              style={{ flex: 1, height: 4, borderRadius: 2, background: i <= step ? '#2952E8' : (isNight ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'), transition: 'background 0.2s', cursor: i < step ? 'pointer' : 'default' }}
              onClick={() => { if (i < step) setStep(i); }}
            />
          ))}
        </div>
        <p style={{ fontSize: 12, color: muted, marginTop: 6 }}>Step {step + 1} of {STEPS.length}: <strong style={{ color: text }}>{STEPS[step]}</strong></p>
      </div>

      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }}>

            {/* Step 0: Basics */}
            {step === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: text, display: 'block', marginBottom: 6 }}>Event name *</label>
                  <input value={basics.name} onChange={e => setBasics(b => ({ ...b, name: e.target.value }))} placeholder="Give your event a name…" style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: text, display: 'block', marginBottom: 6 }}>Description</label>
                  <textarea value={basics.description} onChange={e => setBasics(b => ({ ...b, description: e.target.value }))} placeholder="What will attendees learn or experience?" rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: text, display: 'block', marginBottom: 8 }}>Event type *</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {EVENT_TYPES.map(t => (
                      <button key={t} onClick={() => setBasics(b => ({ ...b, eventType: t }))} style={{ padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', background: basics.eventType === t ? '#2952E8' : (isNight ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'), color: basics.eventType === t ? '#fff' : text }}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: text, display: 'block', marginBottom: 8 }}>GPS Goal Category</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {GPS_CATEGORIES.map(cat => (
                      <button key={cat} onClick={() => setBasics(b => ({ ...b, gpsCategory: b.gpsCategory === cat ? '' : cat }))} style={{ padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', background: basics.gpsCategory === cat ? '#7C3AED' : (isNight ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'), color: basics.gpsCategory === cat ? '#fff' : text }}>
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 14, background: cardBg, border: `1px solid ${border}` }}>
                  <div>
                    <p style={{ fontWeight: 800, fontSize: 14, color: text, marginBottom: 2 }}>Group GPS Launch</p>
                    <p style={{ fontSize: 12, color: muted }}>Attendees can start a shared GPS goal after the event</p>
                  </div>
                  <button onClick={() => setBasics(b => ({ ...b, groupGps: !b.groupGps }))} style={{ width: 44, height: 26, borderRadius: 13, background: basics.groupGps ? '#2952E8' : (isNight ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'), border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                    <div style={{ position: 'absolute', top: 3, left: basics.groupGps ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 1: Date & Capacity */}
            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 700, color: text, display: 'block', marginBottom: 6 }}>Date *</label>
                    <input type="date" value={schedule.date} onChange={e => setSchedule(s => ({ ...s, date: e.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 700, color: text, display: 'block', marginBottom: 6 }}>Time *</label>
                    <input type="time" value={schedule.time} onChange={e => setSchedule(s => ({ ...s, time: e.target.value }))} style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: text, display: 'block', marginBottom: 6 }}>Max attendees</label>
                  <input type="number" value={schedule.capacity} onChange={e => setSchedule(s => ({ ...s, capacity: e.target.value }))} style={inputStyle} min={1} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: text, display: 'block', marginBottom: 6 }}>Max on-stage speakers</label>
                  <input type="number" value={schedule.maxSpeakers} onChange={e => setSchedule(s => ({ ...s, maxSpeakers: e.target.value }))} style={inputStyle} min={1} max={20} />
                </div>
              </div>
            )}

            {/* Step 2: Ticketing */}
            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[true, false].map(free => (
                    <button
                      key={String(free)}
                      onClick={() => setTicketing(t => ({ ...t, free }))}
                      style={{ padding: '16px 0', borderRadius: 16, border: `2px solid ${ticketing.free === free ? '#2952E8' : border}`, background: ticketing.free === free ? (isNight ? 'rgba(41,82,232,0.12)' : 'rgba(41,82,232,0.06)') : cardBg, cursor: 'pointer', textAlign: 'center' }}
                    >
                      <div style={{ fontSize: 22, marginBottom: 4 }}>
                        {free ? (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={ticketing.free === free ? '#2952E8' : muted} strokeWidth={2} strokeLinecap="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}><path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></svg>
                        ) : (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={!ticketing.free && free === false ? '#2952E8' : muted} strokeWidth={2} strokeLinecap="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
                        )}
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 800, color: ticketing.free === free ? '#2952E8' : text }}>{free ? 'Free' : 'Paid'}</p>
                    </button>
                  ))}
                </div>
                {!ticketing.free && (
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 700, color: text, display: 'block', marginBottom: 6 }}>Ticket price (USD)</label>
                    <input type="number" value={ticketing.price} onChange={e => setTicketing(t => ({ ...t, price: e.target.value }))} placeholder="e.g. 25" style={inputStyle} min={1} />
                    <p style={{ fontSize: 12, color: muted, marginTop: 6 }}>85% goes to you · 15% Village platform fee</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Speakers */}
            {step === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {speakers.map((sp, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <input
                        value={sp.handle}
                        onChange={e => setSpeakers(prev => prev.map((s, j) => j === i ? { ...s, handle: e.target.value } : s))}
                        placeholder="@handle"
                        style={inputStyle}
                      />
                      <select
                        value={sp.role}
                        onChange={e => setSpeakers(prev => prev.map((s, j) => j === i ? { ...s, role: e.target.value } : s))}
                        style={{ ...inputStyle }}
                      >
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    {speakers.length > 1 && (
                      <button onClick={() => setSpeakers(prev => prev.filter((_, j) => j !== i))} style={{ width: 36, height: 36, borderRadius: '50%', background: isNight ? 'rgba(226,75,74,0.15)' : 'rgba(226,75,74,0.1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E24B4A" strokeWidth={2} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    )}
                  </div>
                ))}
                <button onClick={() => setSpeakers(prev => [...prev, { handle: '', role: 'Speaker' }])} style={{ padding: '12px 0', borderRadius: 14, border: `1px dashed ${border}`, background: 'transparent', color: '#2952E8', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                  Add speaker
                </button>
              </div>
            )}

            {/* Step 4: Artwork */}
            {step === 4 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div
                  onClick={() => setArtwork({ hasFile: true })}
                  style={{ height: 180, borderRadius: 20, border: `2px dashed ${border}`, background: artwork.hasFile ? isNight ? 'rgba(41,82,232,0.12)' : 'rgba(41,82,232,0.06)' : cardBg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  {artwork.hasFile ? (
                    <div style={{ textAlign: 'center' }}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2952E8" strokeWidth={2} strokeLinecap="round" style={{ display: 'block', margin: '0 auto 8px' }}><path d="M20 6L9 17l-5-5"/></svg>
                      <p style={{ fontSize: 14, fontWeight: 800, color: '#2952E8' }}>Artwork uploaded</p>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', color: muted }}>
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" style={{ display: 'block', margin: '0 auto 10px' }}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                      <p style={{ fontSize: 14, fontWeight: 700 }}>Upload artwork</p>
                      <p style={{ fontSize: 12, marginTop: 4 }}>Recommended: 1920×1080</p>
                    </div>
                  )}
                </div>
                {!artwork.hasFile && (
                  <div style={{ padding: '14px 16px', borderRadius: 14, background: isNight ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', border: `1px solid ${border}` }}>
                    <p style={{ fontSize: 14, fontWeight: 800, color: text, marginBottom: 4 }}>AI thumbnail generation</p>
                    <p style={{ fontSize: 12, color: muted, marginBottom: 10 }}>Don't have artwork? Village AI can generate a thumbnail based on your event name and type.</p>
                    <button style={{ padding: '8px 20px', borderRadius: 20, background: '#7C3AED', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                      Generate with AI
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Step 5: Technical */}
            {step === 5 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {TECH_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    onClick={() => setTechnical({ option: opt })}
                    style={{ padding: '16px', borderRadius: 16, border: `2px solid ${technical.option === opt ? '#2952E8' : border}`, background: technical.option === opt ? (isNight ? 'rgba(41,82,232,0.12)' : 'rgba(41,82,232,0.06)') : cardBg, cursor: 'pointer', textAlign: 'left' }}
                  >
                    <p style={{ fontSize: 14, fontWeight: 800, color: technical.option === opt ? '#2952E8' : text, marginBottom: 4 }}>{opt}</p>
                    <p style={{ fontSize: 12, color: muted }}>
                      {opt === 'Browser (Default)' && 'Stream directly from your browser. No extra software needed.'}
                      {opt === 'OBS / RTMP stream' && 'Use OBS or any RTMP-compatible software. Copy the stream key.'}
                      {opt === 'Professional encoder' && 'For TV-quality streams using hardware encoders.'}
                    </p>
                  </button>
                ))}

                {technical.option !== 'Browser (Default)' && (
                  <div style={{ padding: '14px 16px', borderRadius: 14, background: cardBg, border: `1px solid ${border}` }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: text, marginBottom: 6 }}>RTMP URL</p>
                    <div style={{ padding: '10px 14px', borderRadius: 10, background: isNight ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', fontFamily: 'monospace', fontSize: 12, color: muted }}>
                      rtmp://live.villa9e.app/stream
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: text, marginTop: 10, marginBottom: 6 }}>Stream Key</p>
                    <div style={{ padding: '10px 14px', borderRadius: 10, background: isNight ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', fontFamily: 'monospace', fontSize: 12, color: muted }}>
                      vil_sk_••••••••••••••••
                    </div>
                  </div>
                )}
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom bar */}
      <div style={{ position: 'fixed', bottom: 60, left: 0, right: 0, maxWidth: 480, margin: '0 auto', padding: '12px 16px', background: isNight ? 'rgba(8,14,36,0.96)' : 'rgba(240,239,248,0.96)', backdropFilter: 'blur(12px)', borderTop: `1px solid ${border}`, display: 'flex', gap: 10, zIndex: 30 }}>
        {step > 0 && (
          <button
            onClick={() => setStep(s => s - 1)}
            style={{ flex: 1, padding: '13px 0', borderRadius: 14, background: isNight ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)', color: text, fontWeight: 800, fontSize: 15, border: 'none', cursor: 'pointer' }}
          >
            Back
          </button>
        )}
        <button
          onClick={() => {
            if (step < STEPS.length - 1) setStep(s => s + 1);
            else setPublished(true);
          }}
          disabled={!canAdvance()}
          style={{ flex: 2, padding: '13px 0', borderRadius: 14, background: canAdvance() ? '#2952E8' : (isNight ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'), color: canAdvance() ? '#fff' : muted, fontWeight: 900, fontSize: 15, border: 'none', cursor: canAdvance() ? 'pointer' : 'not-allowed' }}
        >
          {step < STEPS.length - 1 ? 'Continue' : 'Save + Publish'}
        </button>
      </div>

      <PavilionNav active="mine" />
    </div>
  );
}
