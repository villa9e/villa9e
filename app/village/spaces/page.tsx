'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  type EnergyType, type SpacesEvent,
  ENERGY_COLORS, ENERGY_LABELS,
  fmtTime, isToday, isTomorrow, EnergyPill,
} from '@/lib/spaces/utils';

interface Task {
  id: string;
  text: string;
  done: boolean;
  due_date?: string;
  project?: string;
  display_order: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────


// Mock events seeded relative to today
function buildMockEvents(): SpacesEvent[] {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  function ts(d: Date, h: number, m = 0) {
    const x = new Date(d);
    x.setHours(h, m, 0, 0);
    return x.toISOString();
  }

  return [
    {
      id: 'mock-1',
      title: 'Team Standup',
      start_time: ts(today, 9, 0),
      end_time: ts(today, 9, 30),
      location: 'Zoom',
      energy_type: 'focused',
      trigger_min: 10,
      trigger_enabled: true,
      affirmation: 'I show up prepared, present, and ready to contribute.',
      trigger_playlist: 'Deep Focus',
    },
    {
      id: 'mock-2',
      title: 'Investor Pitch',
      start_time: ts(today, 14, 0),
      end_time: ts(today, 15, 0),
      location: 'Conference Room A',
      energy_type: 'high',
      trigger_min: 15,
      trigger_enabled: true,
      affirmation: 'I am confident, prepared, and compelling. This is my moment.',
      trigger_playlist: 'Power Mode',
    },
    {
      id: 'mock-3',
      title: 'Workout',
      start_time: ts(today, 18, 0),
      end_time: ts(today, 19, 0),
      location: 'Gym',
      energy_type: 'energize',
      trigger_min: 5,
      trigger_enabled: true,
      affirmation: 'Every rep makes me stronger. I push past comfort.',
      trigger_playlist: 'Energy Boost',
    },
    {
      id: 'mock-4',
      title: 'Design Review',
      start_time: ts(tomorrow, 10, 0),
      end_time: ts(tomorrow, 11, 0),
      location: 'Studio',
      energy_type: 'creative',
      trigger_min: 10,
      trigger_enabled: true,
      affirmation: 'My creativity flows freely. I bring fresh perspective.',
      trigger_playlist: 'Creative Flow',
    },
    {
      id: 'mock-5',
      title: 'Strategy Session',
      start_time: ts(tomorrow, 14, 0),
      end_time: ts(tomorrow, 15, 30),
      energy_type: 'focused',
      trigger_min: 10,
      trigger_enabled: true,
      affirmation: 'Clarity and precision guide every decision I make.',
      trigger_playlist: 'Deep Focus',
    },
  ];
}

// ── Helpers ───────────────────────────────────────────────────────────────────



function minutesUntil(iso: string) {
  return Math.round((new Date(iso).getTime() - Date.now()) / 60000);
}

function fmtCountdown(ms: number) {
  if (ms <= 0) return 'Now';
  const totalMins = Math.floor(ms / 60000);
  if (totalMins < 60) return `${totalMins}m`;
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

// ── Energy Pill ───────────────────────────────────────────────────────────────

// ── Tab Icon ──────────────────────────────────────────────────────────────────
function TabIcon({ icon, label, active, onTap }: { icon: React.ReactNode; label: string; active: boolean; onTap: () => void }) {
  return (
    <button onClick={onTap} style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
      padding: '10px 0', color: active ? '#7C3AED' : 'rgba(255,255,255,0.35)',
      background: 'transparent', border: 'none',
      borderTop: active ? '2px solid #7C3AED' : '2px solid transparent', cursor: 'pointer',
    }}>
      {icon}
      <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.04em' }}>{label.toUpperCase()}</span>
    </button>
  );
}

// ── Event Card ────────────────────────────────────────────────────────────────
function EventCard({ event, onOpen }: { event: SpacesEvent; onOpen: (e: SpacesEvent) => void }) {
  return (
    <motion.button whileTap={{ scale: 0.98 }} onClick={() => onOpen(event)} style={{
      width: '100%', textAlign: 'left',
      background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '13px 14px', marginBottom: 8,
      borderLeft: `3px solid ${ENERGY_COLORS[event.energy_type]}`,
      display: 'flex', alignItems: 'center', gap: 12, border: 'none', cursor: 'pointer',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {event.title}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{fmtTime(event.start_time)}</span>
          {event.location && (
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
              {event.location}
            </span>
          )}
        </div>
        <div style={{ marginTop: 7 }}>
          <EnergyPill type={event.energy_type} />
        </div>
      </div>
      {event.trigger_enabled && (
        <div style={{ flexShrink: 0, background: '#7C3AED20', border: '1px solid #7C3AED40', borderRadius: 8, padding: '3px 8px' }}>
          <span style={{ fontSize: 9, fontWeight: 900, color: '#A78BFA', letterSpacing: '0.04em' }}>TRIGGER</span>
        </div>
      )}
    </motion.button>
  );
}

// ── Add Event Modal ───────────────────────────────────────────────────────────
function AddEventModal({ userId, onSaved, onClose }: { userId: string; onSaved: () => void; onClose: () => void }) {
  const supabase = createClient();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startHour, setStartHour] = useState('09:00');
  const [endHour, setEndHour] = useState('10:00');
  const [location, setLocation] = useState('');
  const [energy, setEnergy] = useState<EnergyType>('focused');
  const [triggerEnabled, setTriggerEnabled] = useState(true);
  const [triggerMin, setTriggerMin] = useState(10);
  const [affirmation, setAffirmation] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  async function save() {
    if (!title.trim()) { setErr('Title required'); return; }
    setSaving(true);
    const start_time = new Date(`${date}T${startHour}:00`).toISOString();
    const end_time = new Date(`${date}T${endHour}:00`).toISOString();
    const { error } = await (supabase as any).from('calendar_events').insert({
      creator_id: userId, title: title.trim(), start_time, end_time,
      location: location.trim() || null, energy_type: energy,
      trigger_enabled: triggerEnabled, trigger_min: triggerMin,
      affirmation: affirmation.trim() || null,
    });
    setSaving(false);
    if (error) { setErr(error.message); return; }
    onSaved();
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12, padding: '12px 14px', color: '#fff', fontSize: 14, boxSizing: 'border-box',
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'flex-end' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        style={{ width: '100%', background: '#0F1020', borderRadius: '20px 20px 0 0', padding: '20px 20px 48px', maxHeight: '88vh', overflowY: 'auto' }}>
        <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 2, margin: '0 auto 20px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <p style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>New Event</p>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 15, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: 20, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>×</button>
        </div>

        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Event title"
          style={{ ...inputStyle, fontSize: 16, fontWeight: 700, marginBottom: 12 }} />

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 800, letterSpacing: '0.05em', marginBottom: 5 }}>DATE</p>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...inputStyle, colorScheme: 'dark' }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {(['START', 'END'] as const).map((lbl, i) => (
            <div key={lbl} style={{ flex: 1 }}>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 800, letterSpacing: '0.05em', marginBottom: 5 }}>{lbl}</p>
              <input type="time" value={i === 0 ? startHour : endHour}
                onChange={e => i === 0 ? setStartHour(e.target.value) : setEndHour(e.target.value)}
                style={{ ...inputStyle, colorScheme: 'dark' }} />
            </div>
          ))}
        </div>

        <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location (optional)"
          style={{ ...inputStyle, marginBottom: 16 }} />

        <p style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', marginBottom: 10 }}>ENERGY TYPE</p>
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          {(Object.keys(ENERGY_COLORS) as EnergyType[]).map(e => (
            <button key={e} onClick={() => setEnergy(e)} style={{
              padding: '6px 12px', borderRadius: 20, fontWeight: 800, fontSize: 11, border: `1px solid ${ENERGY_COLORS[e]}50`,
              background: energy === e ? ENERGY_COLORS[e] : `${ENERGY_COLORS[e]}18`,
              color: energy === e ? '#fff' : ENERGY_COLORS[e], cursor: 'pointer',
            }}>
              {ENERGY_LABELS[e]}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: triggerEnabled ? 12 : 16, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 14px' }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Enable Trigger</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Auto prep {triggerMin} min before event</p>
          </div>
          <button onClick={() => setTriggerEnabled(t => !t)} style={{
            width: 44, height: 24, borderRadius: 12, background: triggerEnabled ? '#7C3AED' : 'rgba(255,255,255,0.1)',
            position: 'relative', flexShrink: 0, border: 'none', cursor: 'pointer',
          }}>
            <div style={{ position: 'absolute', top: 2, left: triggerEnabled ? 22 : 2, width: 20, height: 20, borderRadius: 10, background: '#fff', transition: 'left 0.2s' }} />
          </button>
        </div>

        {triggerEnabled && (
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 800, letterSpacing: '0.05em', marginBottom: 8 }}>PREP WINDOW</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              {[5, 10, 15].map(m => (
                <button key={m} onClick={() => setTriggerMin(m)} style={{
                  flex: 1, padding: '9px 0', borderRadius: 10, fontWeight: 900, fontSize: 14, border: 'none', cursor: 'pointer',
                  background: triggerMin === m ? '#7C3AED' : 'rgba(255,255,255,0.06)',
                  color: triggerMin === m ? '#fff' : 'rgba(255,255,255,0.5)',
                }}>{m} min</button>
              ))}
            </div>
            <input value={affirmation} onChange={e => setAffirmation(e.target.value)} placeholder="Affirmation (optional)"
              style={{ ...inputStyle }} />
          </div>
        )}

        {err && <p style={{ color: '#EF4444', fontSize: 13, marginBottom: 10, fontWeight: 700 }}>{err}</p>}
        <motion.button whileTap={{ scale: 0.97 }} onClick={save} disabled={saving} style={{
          width: '100%', padding: '16px 0', borderRadius: 14, background: '#7C3AED',
          color: '#fff', fontWeight: 900, fontSize: 16, opacity: saving ? 0.7 : 1, border: 'none', cursor: 'pointer', marginTop: 4,
        }}>
          {saving ? 'Saving...' : 'Add Event'}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// ── Home Content ──────────────────────────────────────────────────────────────
function HomeContent({
  events, loading, onOpenEvent,
}: {
  events: SpacesEvent[];
  loading: boolean;
  onOpenEvent: (e: SpacesEvent) => void;
}) {
  const router = useRouter();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const todayEvents = events.filter(e => isToday(e.start_time)).sort((a, b) => a.start_time.localeCompare(b.start_time));
  const tomorrowEvents = events.filter(e => isTomorrow(e.start_time)).sort((a, b) => a.start_time.localeCompare(b.start_time));
  const nextUp = todayEvents.find(e => new Date(e.start_time) > now) ?? todayEvents[0] ?? null;

  const triggerFiresAt = nextUp
    ? new Date(new Date(nextUp.start_time).getTime() - nextUp.trigger_min * 60000)
    : null;
  const msToTrigger = triggerFiresAt ? triggerFiresAt.getTime() - now.getTime() : null;
  const msToEvent = nextUp ? new Date(nextUp.start_time).getTime() - now.getTime() : null;

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 14, fontWeight: 700 }}>
        Loading schedule...
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 24px' }}>

      {/* ── Next Up Card ── */}
      {nextUp ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <button onClick={() => onOpenEvent(nextUp)} style={{
            width: '100%', textAlign: 'left',
            background: 'linear-gradient(135deg, #3B0D8F 0%, #7C3AED 100%)',
            borderRadius: 20, padding: '20px', marginBottom: 10, border: 'none', cursor: 'pointer',
            boxShadow: '0 8px 32px rgba(124,58,237,0.3)',
          }}>
            <p style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.08em', marginBottom: 8 }}>NEXT UP</p>
            <p style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 4, lineHeight: 1.2 }}>{nextUp.title}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{fmtTime(nextUp.start_time)}</span>
              {msToEvent !== null && (
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>
                  · in {fmtCountdown(msToEvent)}
                </span>
              )}
            </div>
            {nextUp.trigger_enabled && msToTrigger !== null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '7px 12px', width: 'fit-content' }}>
                <div style={{ width: 6, height: 6, borderRadius: 3, background: '#C4B5FD' }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: '#EDE9FE' }}>
                  Trigger fires in {fmtCountdown(msToTrigger)}
                </span>
              </div>
            )}
          </button>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: '28px 20px', marginBottom: 10, textAlign: 'center' }}>
          <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" style={{ margin: '0 auto 10px', display: 'block' }}><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
          <p style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 4 }}>No upcoming events</p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>Tap + to add an event</p>
        </motion.div>
      )}

      {/* ── Trigger Status Bar ── */}
      {nextUp?.trigger_enabled && (
        <motion.button whileTap={{ scale: 0.98 }} onClick={() => router.push('/village/spaces/trigger')}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            background: '#7C3AED14', border: '1px solid #7C3AED30', borderRadius: 12,
            padding: '10px 14px', marginBottom: 22, cursor: 'pointer',
          }}>
          <div style={{ width: 8, height: 8, borderRadius: 4, background: '#A78BFA', boxShadow: '0 0 8px #A78BFA' }} />
          <div style={{ flex: 1, textAlign: 'left' }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: '#C4B5FD' }}>
              Trigger armed · fires {nextUp.trigger_min} min before {nextUp.title}
            </p>
            {triggerFiresAt && (
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', marginTop: 1 }}>
                {triggerFiresAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </p>
            )}
          </div>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
        </motion.button>
      )}

      {/* ── Today ── */}
      {todayEvents.length > 0 && (
        <>
          <p style={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.07em', marginBottom: 10 }}>TODAY</p>
          {todayEvents.map(e => <EventCard key={e.id} event={e} onOpen={onOpenEvent} />)}
        </>
      )}

      {/* ── Tomorrow ── */}
      {tomorrowEvents.length > 0 && (
        <>
          <p style={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.07em', marginTop: todayEvents.length > 0 ? 20 : 0, marginBottom: 10 }}>TOMORROW</p>
          {tomorrowEvents.map(e => <EventCard key={e.id} event={e} onOpen={onOpenEvent} />)}
        </>
      )}

      {todayEvents.length === 0 && tomorrowEvents.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '32px 20px', color: 'rgba(255,255,255,0.2)', fontSize: 13, fontWeight: 700 }}>
          No events in the next 2 days
        </div>
      )}
    </div>
  );
}

// ── Calendar Tab ──────────────────────────────────────────────────────────────
function CalendarContent({ events, onOpenEvent }: { events: SpacesEvent[]; onOpenEvent: (e: SpacesEvent) => void }) {
  const today = new Date();
  const [selDate, setSelDate] = useState(today);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - today.getDay() + i + 1);
    return d;
  });

  const selStr = selDate.toISOString().split('T')[0];
  const eventsForDay = events.filter(e => e.start_time.startsWith(selStr)).sort((a, b) => a.start_time.localeCompare(b.start_time));
  const daysWithEvents = new Set(events.map(e => e.start_time.split('T')[0]));

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 24px' }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {weekDays.map(d => {
          const ds = d.toISOString().split('T')[0];
          const isSelected = ds === selStr;
          const isT = ds === today.toISOString().split('T')[0];
          return (
            <button key={ds} onClick={() => setSelDate(d)} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              padding: '8px 0', borderRadius: 12, background: isSelected ? '#7C3AED' : 'transparent', border: 'none', cursor: 'pointer',
            }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: isSelected ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.35)', letterSpacing: '0.04em' }}>
                {d.toLocaleDateString([], { weekday: 'short' }).toUpperCase()}
              </span>
              <span style={{ fontSize: 17, fontWeight: 900, color: isSelected ? '#fff' : isT ? '#A78BFA' : 'rgba(255,255,255,0.65)' }}>
                {d.getDate()}
              </span>
              {daysWithEvents.has(ds) && (
                <div style={{ width: 5, height: 5, borderRadius: 3, background: isSelected ? 'rgba(255,255,255,0.7)' : '#A78BFA' }} />
              )}
            </button>
          );
        })}
      </div>

      {eventsForDay.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'rgba(255,255,255,0.25)' }}>
          <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ margin: '0 auto 10px', display: 'block' }}><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
          <p style={{ fontSize: 14, fontWeight: 700 }}>No events this day</p>
        </div>
      ) : (
        eventsForDay.map(e => <EventCard key={e.id} event={e} onOpen={onOpenEvent} />)
      )}
    </div>
  );
}

// ── PAGE ──────────────────────────────────────────────────────────────────────
export default function SpacesPage() {
  const router = useRouter();
  const supabase = createClient();
  const [userId, setUserId] = useState('');
  const [activeTab, setActiveTab] = useState<'home' | 'calendar'>('home');
  const [events, setEvents] = useState<SpacesEvent[]>(buildMockEvents());
  const [eventsLoading, setEventsLoading] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) { setUserId(user.id); }
    });
  }, []);

  const loadEvents = useCallback(async () => {
    if (!userId) return;
    setEventsLoading(true);
    const from = new Date(); from.setHours(0, 0, 0, 0);
    const to = new Date(from); to.setDate(to.getDate() + 7);
    const { data } = await (supabase as any)
      .from('calendar_events')
      .select('id,title,start_time,end_time,location,energy_type,trigger_min,trigger_enabled,affirmation,trigger_playlist')
      .eq('creator_id', userId)
      .gte('start_time', from.toISOString())
      .lte('start_time', to.toISOString())
      .order('start_time');
    if (data && data.length > 0) {
      setEvents(data.map((e: any) => ({
        ...e,
        energy_type: e.energy_type || 'focused',
        trigger_min: e.trigger_min ?? 10,
        trigger_enabled: e.trigger_enabled ?? false,
      })));
    }
    setEventsLoading(false);
  }, [userId]);

  useEffect(() => { if (userId) loadEvents(); }, [userId, loadEvents]);

  function openEvent(e: SpacesEvent) {
    router.push(`/village/spaces/event/${e.id}?title=${encodeURIComponent(e.title)}&start=${encodeURIComponent(e.start_time)}&end=${encodeURIComponent(e.end_time)}&energy=${e.energy_type}&trigger_min=${e.trigger_min}&trigger_enabled=${e.trigger_enabled}${e.location ? `&location=${encodeURIComponent(e.location)}` : ''}${e.affirmation ? `&affirmation=${encodeURIComponent(e.affirmation)}` : ''}${e.trigger_playlist ? `&playlist=${encodeURIComponent(e.trigger_playlist)}` : ''}`);
  }

  return (
    <div style={{ background: '#080E24', minHeight: '100vh', color: '#fff', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20, display: 'flex', alignItems: 'center',
        padding: '14px 16px', background: 'rgba(8,14,36,0.96)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        {/* Back */}
        <button onClick={() => router.push('/village/hut')} style={{
          width: 36, height: 36, borderRadius: 18, background: 'rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', marginRight: 10,
        }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>

        <p style={{ fontSize: 20, fontWeight: 900, flex: 1, letterSpacing: '-0.01em' }}>Spaces</p>

        {/* Bell */}
        <button style={{ width: 36, height: 36, borderRadius: 18, background: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', marginRight: 8 }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>
        </button>

        {/* Add */}
        <button onClick={() => setShowAddEvent(true)} style={{
          width: 36, height: 36, borderRadius: 18, background: '#7C3AED',
          display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer',
        }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
        </button>
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', padding: '12px 16px 0', gap: 6 }}>
        {(['home', 'calendar'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '7px 16px', borderRadius: 20, fontWeight: 800, fontSize: 12, border: 'none', cursor: 'pointer',
            background: activeTab === tab ? '#7C3AED' : 'rgba(255,255,255,0.07)',
            color: activeTab === tab ? '#fff' : 'rgba(255,255,255,0.45)',
            letterSpacing: '0.03em',
          }}>
            {tab === 'home' ? 'Schedule' : 'Calendar'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', paddingTop: 16, paddingBottom: 88 }}>
        {activeTab === 'home'
          ? <HomeContent events={events} loading={eventsLoading} onOpenEvent={openEvent} />
          : <CalendarContent events={events} onOpenEvent={openEvent} />
        }
      </div>

      {/* Bottom Nav */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(8,14,36,0.97)', borderTop: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', paddingBottom: 'env(safe-area-inset-bottom, 0px)', zIndex: 30,
      }}>
        <TabIcon label="Home" active={true} onTap={() => {}}
          icon={<svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>}
        />
        <TabIcon label="Calendar" active={false} onTap={() => router.push('/village/spaces/calendar')}
          icon={<svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>}
        />
        <TabIcon label="Tasks" active={false} onTap={() => router.push('/village/spaces/tasks')}
          icon={<svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>}
        />
        <TabIcon label="Settings" active={false} onTap={() => router.push('/village/spaces/settings')}
          icon={<svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>}
        />
      </div>

      <AnimatePresence>
        {showAddEvent && userId && (
          <AddEventModal userId={userId} onSaved={() => { setShowAddEvent(false); loadEvents(); }} onClose={() => setShowAddEvent(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
