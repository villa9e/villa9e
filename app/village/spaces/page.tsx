'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { BackButton } from '@/components/village/BackButton';

// ── Types ─────────────────────────────────────────────────────────────────────
type EnergyType = 'high' | 'focused' | 'creative' | 'energize' | 'calm';
type Screen = 'home' | 'calendar' | 'tasks' | 'settings' | 'trigger' | 'event';

interface SpacesEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  location?: string;
  energy_type: EnergyType;
  trigger_min: number;
  trigger_enabled: boolean;
  affirmation?: string;
  trigger_playlist?: string;
}

interface Task {
  id: string;
  text: string;
  done: boolean;
  due_date?: string;
  project?: string;
  display_order: number;
}

interface TriggerProfile {
  id: string;
  name: string;
  energy_type: EnergyType;
  affirmation?: string;
  playlist?: string;
  movement?: string;
  breathwork?: string;
  environment?: string;
  duration_min: number;
  is_default: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const ENERGY_COLORS: Record<EnergyType, string> = {
  high: '#EF4444', focused: '#1877F2', creative: '#8B5CF6', energize: '#F59E0B', calm: '#10B981',
};
const ENERGY_LABELS: Record<EnergyType, string> = {
  high: 'High Performance', focused: 'Focused', creative: 'Creative', energize: 'Energize', calm: 'Calm',
};

const DEFAULT_TRIGGER_PROFILES: { name: string; icon: string; energy: EnergyType }[] = [
  { name: 'High Performance', icon: '⚡', energy: 'high' },
  { name: 'Focused', icon: '🎯', energy: 'focused' },
  { name: 'Creative', icon: '✨', energy: 'creative' },
  { name: 'Energize', icon: '🔥', energy: 'energize' },
  { name: 'Calm', icon: '🌿', energy: 'calm' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function isToday(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function isTomorrow(iso: string) {
  const d = new Date(iso);
  const tom = new Date();
  tom.setDate(tom.getDate() + 1);
  return d.getFullYear() === tom.getFullYear() && d.getMonth() === tom.getMonth() && d.getDate() === tom.getDate();
}

function isTodayDate(dateStr?: string) {
  if (!dateStr) return false;
  const today = new Date().toISOString().split('T')[0];
  return dateStr === today;
}

function EnergyPill({ type }: { type: EnergyType }) {
  return (
    <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 20, background: `${ENERGY_COLORS[type]}22`, color: ENERGY_COLORS[type], border: `1px solid ${ENERGY_COLORS[type]}44`, letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>
      {ENERGY_LABELS[type].toUpperCase()}
    </span>
  );
}

function TabIcon({ icon, label, active, onTap }: { icon: React.ReactNode; label: string; active: boolean; onTap: () => void }) {
  return (
    <button onClick={onTap} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '8px 0', color: active ? '#8B5CF6' : 'rgba(255,255,255,0.35)', background: 'transparent', border: 'none', borderTop: active ? '2px solid #8B5CF6' : '2px solid transparent', cursor: 'pointer' }}>
      {icon}
      <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.03em' }}>{label.toUpperCase()}</span>
    </button>
  );
}

// ── Event Card ────────────────────────────────────────────────────────────────
function EventCard({ event, onOpen }: { event: SpacesEvent; onOpen: (e: SpacesEvent) => void }) {
  return (
    <motion.button whileTap={{ scale: 0.98 }} onClick={() => onOpen(event)}
      style={{ width: '100%', textAlign: 'left', background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '12px 14px', marginBottom: 8, borderLeft: `3px solid ${ENERGY_COLORS[event.energy_type]}`, display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.title}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{fmtTime(event.start_time)} – {fmtTime(event.end_time)}</span>
          {event.location && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>📍 {event.location}</span>}
        </div>
        <div style={{ marginTop: 6 }}>
          <EnergyPill type={event.energy_type} />
        </div>
      </div>
      {event.trigger_enabled && (
        <div style={{ flexShrink: 0, background: '#8B5CF622', border: '1px solid #8B5CF644', borderRadius: 8, padding: '3px 8px' }}>
          <span style={{ fontSize: 9, fontWeight: 900, color: '#8B5CF6' }}>TRIGGER</span>
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
  const [triggerEnabled, setTriggerEnabled] = useState(false);
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
      creator_id: userId,
      title: title.trim(),
      start_time,
      end_time,
      location: location.trim() || null,
      energy_type: energy,
      trigger_enabled: triggerEnabled,
      trigger_min: triggerMin,
      affirmation: affirmation.trim() || null,
    });
    setSaving(false);
    if (error) { setErr(error.message); return; }
    onSaved();
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        style={{ width: '100%', background: '#111218', borderRadius: '20px 20px 0 0', padding: '20px 20px 40px', maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 2, margin: '0 auto 20px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <p style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>New Event</p>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 15, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: 18, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Event title"
          style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 14px', color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 12, boxSizing: 'border-box' }} />

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: 4 }}>DATE</p>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px', color: '#fff', fontSize: 14, colorScheme: 'dark', boxSizing: 'border-box' }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: 4 }}>START</p>
            <input type="time" value={startHour} onChange={e => setStartHour(e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px', color: '#fff', fontSize: 14, colorScheme: 'dark', boxSizing: 'border-box' }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: 4 }}>END</p>
            <input type="time" value={endHour} onChange={e => setEndHour(e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px', color: '#fff', fontSize: 14, colorScheme: 'dark', boxSizing: 'border-box' }} />
          </div>
        </div>

        <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location (optional)"
          style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 14px', color: '#fff', fontSize: 14, marginBottom: 16, boxSizing: 'border-box' }} />

        <p style={{ fontSize: 12, fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', marginBottom: 10 }}>ENERGY TYPE</p>
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          {(Object.keys(ENERGY_COLORS) as EnergyType[]).map(e => (
            <button key={e} onClick={() => setEnergy(e)}
              style={{ padding: '6px 12px', borderRadius: 20, background: energy === e ? ENERGY_COLORS[e] : `${ENERGY_COLORS[e]}18`, color: energy === e ? '#fff' : ENERGY_COLORS[e], fontWeight: 800, fontSize: 11, border: `1px solid ${ENERGY_COLORS[e]}44` }}>
              {ENERGY_LABELS[e]}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: triggerEnabled ? 12 : 16, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 14px' }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Enable Trigger</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Auto prep {triggerMin} min before event</p>
          </div>
          <button onClick={() => setTriggerEnabled(t => !t)}
            style={{ width: 44, height: 24, borderRadius: 12, background: triggerEnabled ? '#8B5CF6' : 'rgba(255,255,255,0.1)', position: 'relative', flexShrink: 0 }}>
            <div style={{ position: 'absolute', top: 2, left: triggerEnabled ? 22 : 2, width: 20, height: 20, borderRadius: 10, background: '#fff', transition: 'left 0.2s' }} />
          </button>
        </div>

        {triggerEnabled && (
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: 8 }}>PREP WINDOW</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {[5, 10, 15].map(m => (
                <button key={m} onClick={() => setTriggerMin(m)}
                  style={{ flex: 1, padding: '9px 0', borderRadius: 10, background: triggerMin === m ? '#8B5CF6' : 'rgba(255,255,255,0.06)', color: triggerMin === m ? '#fff' : 'rgba(255,255,255,0.5)', fontWeight: 900, fontSize: 14 }}>
                  {m} min
                </button>
              ))}
            </div>
            <input value={affirmation} onChange={e => setAffirmation(e.target.value)} placeholder="Affirmation (optional)"
              style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 14px', color: '#fff', fontSize: 14, marginTop: 10, boxSizing: 'border-box' }} />
          </div>
        )}

        {err && <p style={{ color: '#EF4444', fontSize: 13, marginBottom: 10, fontWeight: 700 }}>{err}</p>}
        <motion.button whileTap={{ scale: 0.97 }} onClick={save} disabled={saving}
          style={{ width: '100%', padding: '16px 0', borderRadius: 14, background: '#8B5CF6', color: '#fff', fontWeight: 900, fontSize: 16, opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Saving...' : 'Add Event'}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// ── Add Task Modal ────────────────────────────────────────────────────────────
function AddTaskModal({ userId, onSaved, onClose }: { userId: string; onSaved: () => void; onClose: () => void }) {
  const supabase = createClient();
  const [text, setText] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [project, setProject] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  async function save() {
    if (!text.trim()) { setErr('Task text required'); return; }
    setSaving(true);
    const { error } = await (supabase as any).from('spaces_tasks').insert({
      user_id: userId,
      text: text.trim(),
      due_date: dueDate || null,
      project: project.trim() || null,
    });
    setSaving(false);
    if (error) { setErr(error.message); return; }
    onSaved();
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        style={{ width: '100%', background: '#111218', borderRadius: '20px 20px 0 0', padding: '20px 20px 40px' }}>
        <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 2, margin: '0 auto 20px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <p style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>New Task</p>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 15, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: 18, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>
        <input value={text} onChange={e => setText(e.target.value)} placeholder="What needs to get done?"
          style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 14px', color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 12, boxSizing: 'border-box' }}
          autoFocus onKeyDown={e => { if (e.key === 'Enter') save(); }} />
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: 4 }}>DUE DATE (optional)</p>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px', color: '#fff', fontSize: 14, colorScheme: 'dark', boxSizing: 'border-box' }} />
          </div>
        </div>
        <input value={project} onChange={e => setProject(e.target.value)} placeholder="Project tag (optional)"
          style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 14px', color: '#fff', fontSize: 14, marginBottom: 16, boxSizing: 'border-box' }} />
        {err && <p style={{ color: '#EF4444', fontSize: 13, marginBottom: 10, fontWeight: 700 }}>{err}</p>}
        <motion.button whileTap={{ scale: 0.97 }} onClick={save} disabled={saving}
          style={{ width: '100%', padding: '14px 0', borderRadius: 14, background: '#8B5CF6', color: '#fff', fontWeight: 900, fontSize: 16, opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Saving...' : 'Add Task'}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// ── HOME SCREEN ───────────────────────────────────────────────────────────────
function HomeScreen({ events, loading, onOpenEvent, onOpenTrigger }: {
  events: SpacesEvent[]; loading: boolean;
  onOpenEvent: (e: SpacesEvent) => void; onOpenTrigger: (e: SpacesEvent) => void;
}) {
  const todayEvents = events.filter(e => isToday(e.start_time)).sort((a, b) => a.start_time.localeCompare(b.start_time));
  const tomorrowEvents = events.filter(e => isTomorrow(e.start_time)).sort((a, b) => a.start_time.localeCompare(b.start_time));
  const now = new Date();
  const nextUp = todayEvents.find(e => new Date(e.start_time) > now) || todayEvents[0];

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 14, fontWeight: 700 }}>
        Loading your schedule...
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 20px' }}>
      {nextUp ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: 'linear-gradient(135deg,#4C1D95,#7C3AED)', borderRadius: 20, padding: 20, marginBottom: 12 }}>
          <p style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.08em', marginBottom: 8 }}>NEXT UP</p>
          <p style={{ fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 4 }}>{nextUp.title}</p>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 12 }}>
            {fmtTime(nextUp.start_time)}{nextUp.trigger_enabled ? ` · Trigger in ${nextUp.trigger_min} min` : ''}
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => onOpenEvent(nextUp)} style={{ flex: 1, padding: '9px 0', borderRadius: 10, background: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 800, fontSize: 13 }}>View Details</button>
            {nextUp.trigger_enabled && <button onClick={() => onOpenTrigger(nextUp)} style={{ flex: 1, padding: '9px 0', borderRadius: 10, background: '#fff', color: '#7C3AED', fontWeight: 900, fontSize: 13 }}>Start Trigger</button>}
          </div>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: 20, marginBottom: 12, textAlign: 'center' }}>
          <p style={{ fontSize: 24, marginBottom: 8 }}>🗓</p>
          <p style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 4 }}>No events today</p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Tap + to add an event</p>
        </motion.div>
      )}

      {nextUp?.trigger_enabled && (
        <motion.button whileTap={{ scale: 0.98 }} onClick={() => onOpenTrigger(nextUp)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, background: '#8B5CF611', border: '1px solid #8B5CF633', borderRadius: 12, padding: '10px 14px', marginBottom: 20 }}>
          <div style={{ width: 8, height: 8, borderRadius: 4, background: '#8B5CF6', boxShadow: '0 0 8px #8B5CF6' }} />
          <div style={{ flex: 1, textAlign: 'left' }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: '#C4B5FD' }}>Trigger armed · fires {nextUp.trigger_min} min before</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Tap to launch now</p>
          </div>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
        </motion.button>
      )}

      {todayEvents.length > 0 && (
        <>
          <p style={{ fontSize: 13, fontWeight: 900, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', marginBottom: 10 }}>TODAY</p>
          {todayEvents.map(e => <EventCard key={e.id} event={e} onOpen={onOpenEvent} />)}
        </>
      )}

      {tomorrowEvents.length > 0 && (
        <>
          <p style={{ fontSize: 13, fontWeight: 900, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', marginTop: 4, marginBottom: 10 }}>TOMORROW</p>
          {tomorrowEvents.map(e => <EventCard key={e.id} event={e} onOpen={onOpenEvent} />)}
        </>
      )}

      {todayEvents.length === 0 && tomorrowEvents.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '32px 20px', color: 'rgba(255,255,255,0.25)', fontSize: 13, fontWeight: 700 }}>
          No events in the next 2 days
        </div>
      )}
    </div>
  );
}

// ── CALENDAR SCREEN ───────────────────────────────────────────────────────────
function CalendarScreen({ events, onOpenEvent }: { events: SpacesEvent[]; onOpenEvent: (e: SpacesEvent) => void }) {
  const today = new Date();
  const [selDate, setSelDate] = useState(today);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - today.getDay() + i + 1); // Mon–Sun
    return d;
  });

  const selStr = selDate.toISOString().split('T')[0];
  const eventsForDay = events
    .filter(e => e.start_time.startsWith(selStr))
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  const daysWithEvents = new Set(events.map(e => e.start_time.split('T')[0]));

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 20px' }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {weekDays.map(d => {
          const ds = d.toISOString().split('T')[0];
          const isSelected = ds === selStr;
          const isT = ds === today.toISOString().split('T')[0];
          return (
            <button key={ds} onClick={() => setSelDate(d)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 0', borderRadius: 12, background: isSelected ? '#8B5CF6' : 'transparent', border: 'none', cursor: 'pointer' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: isSelected ? '#fff' : 'rgba(255,255,255,0.4)' }}>
                {d.toLocaleDateString([], { weekday: 'short' })}
              </span>
              <span style={{ fontSize: 16, fontWeight: 900, color: isSelected ? '#fff' : isT ? '#8B5CF6' : 'rgba(255,255,255,0.6)' }}>
                {d.getDate()}
              </span>
              {daysWithEvents.has(ds) && (
                <div style={{ width: 5, height: 5, borderRadius: 3, background: isSelected ? '#fff' : '#8B5CF6' }} />
              )}
            </button>
          );
        })}
      </div>

      {eventsForDay.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)' }}>
          <p style={{ fontSize: 24, marginBottom: 8 }}>📅</p>
          <p style={{ fontSize: 14, fontWeight: 700 }}>No events</p>
        </div>
      ) : (
        eventsForDay.map(e => (
          <motion.button key={e.id} whileTap={{ scale: 0.98 }} onClick={() => onOpenEvent(e)}
            style={{ width: '100%', textAlign: 'left', display: 'flex', gap: 12, marginBottom: 10, padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', borderLeft: `3px solid ${ENERGY_COLORS[e.energy_type]}`, border: 'none', cursor: 'pointer' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 3 }}>{e.title}</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{fmtTime(e.start_time)} – {fmtTime(e.end_time)}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <EnergyPill type={e.energy_type} />
              {e.trigger_enabled && <span style={{ fontSize: 9, fontWeight: 800, color: '#8B5CF6', background: '#8B5CF611', padding: '2px 6px', borderRadius: 8 }}>TRIGGER</span>}
            </div>
          </motion.button>
        ))
      )}
    </div>
  );
}

// ── TASKS SCREEN ──────────────────────────────────────────────────────────────
function TasksScreen({ tasks, loading, onToggle }: { tasks: Task[]; loading: boolean; onToggle: (id: string, done: boolean) => void }) {
  const today = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(t => t.due_date === today);
  const upcomingTasks = tasks.filter(t => !t.due_date || t.due_date > today);

  function TaskRow({ t }: { t: Task }) {
    return (
      <motion.button whileTap={{ scale: 0.98 }} onClick={() => onToggle(t.id, !t.done)}
        style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', marginBottom: 6, border: 'none', cursor: 'pointer' }}>
        <div style={{ width: 20, height: 20, borderRadius: 10, border: t.done ? 'none' : '2px solid rgba(255,255,255,0.3)', background: t.done ? '#22C55E' : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {t.done && <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>}
        </div>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: t.done ? 'rgba(255,255,255,0.35)' : '#fff', textDecoration: t.done ? 'line-through' : 'none' }}>{t.text}</span>
          {t.project && <p style={{ fontSize: 11, color: '#8B5CF6', fontWeight: 700, marginTop: 2 }}>📁 {t.project}</p>}
        </div>
        {t.due_date && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 700 }}>{t.due_date}</span>}
      </motion.button>
    );
  }

  if (loading) {
    return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 14, fontWeight: 700 }}>Loading tasks...</div>;
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 20px' }}>
      {todayTasks.length > 0 && (
        <>
          <p style={{ fontSize: 13, fontWeight: 900, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', marginBottom: 10 }}>TODAY</p>
          {todayTasks.map(t => <TaskRow key={t.id} t={t} />)}
        </>
      )}

      {upcomingTasks.length > 0 && (
        <>
          <p style={{ fontSize: 13, fontWeight: 900, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', marginTop: todayTasks.length > 0 ? 16 : 0, marginBottom: 10 }}>UPCOMING</p>
          {upcomingTasks.map(t => <TaskRow key={t.id} t={t} />)}
        </>
      )}

      {tasks.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'rgba(255,255,255,0.25)' }}>
          <p style={{ fontSize: 28, marginBottom: 8 }}>✓</p>
          <p style={{ fontSize: 14, fontWeight: 700 }}>No tasks yet</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>Tap + to add your first task</p>
        </div>
      )}
    </div>
  );
}

// ── SETTINGS SCREEN ───────────────────────────────────────────────────────────
function SettingsScreen({ userId }: { userId: string }) {
  const supabase = createClient();
  const [defaultTrigger, setDefaultTrigger] = useState<5 | 10 | 15>(10);
  const [triggerProfiles, setTriggerProfiles] = useState<TriggerProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await (supabase as any).from('trigger_profiles').select('*').eq('user_id', userId).order('created_at');
      setTriggerProfiles(data || []);
      const def = (data || []).find((p: TriggerProfile) => p.is_default);
      if (def) setDefaultTrigger(def.duration_min as 5 | 10 | 15);
      setLoading(false);
    }
    load();
  }, [userId]);

  async function setDefault(min: 5 | 10 | 15) {
    setDefaultTrigger(min);
    await (supabase as any).from('trigger_profiles').update({ duration_min: min }).eq('user_id', userId).eq('is_default', true);
  }

  async function createDefaultProfile(energy: EnergyType, name: string) {
    const exists = triggerProfiles.find(p => p.energy_type === energy);
    if (exists) return;
    await (supabase as any).from('trigger_profiles').insert({ user_id: userId, name, energy_type: energy, duration_min: 10 });
    const { data } = await (supabase as any).from('trigger_profiles').select('*').eq('user_id', userId).order('created_at');
    setTriggerProfiles(data || []);
  }

  const displayProfiles = DEFAULT_TRIGGER_PROFILES.map(dp => ({
    ...dp,
    dbProfile: triggerProfiles.find(p => p.energy_type === dp.energy),
  }));

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 20px' }}>
      <p style={{ fontSize: 13, fontWeight: 900, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', marginBottom: 12 }}>TRIGGER DEFAULTS</p>
      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '14px', marginBottom: 24 }}>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 700, marginBottom: 12 }}>Default prep window</p>
        <div style={{ display: 'flex', gap: 8 }}>
          {([5, 10, 15] as const).map(m => (
            <button key={m} onClick={() => setDefault(m)} style={{ flex: 1, padding: '10px 0', borderRadius: 10, background: defaultTrigger === m ? '#8B5CF6' : 'rgba(255,255,255,0.06)', color: defaultTrigger === m ? '#fff' : 'rgba(255,255,255,0.5)', fontWeight: 900, fontSize: 15, border: 'none', cursor: 'pointer' }}>
              {m} min
            </button>
          ))}
        </div>
      </div>

      <p style={{ fontSize: 13, fontWeight: 900, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', marginBottom: 12 }}>TRIGGER PROFILES</p>
      {displayProfiles.map(p => (
        <button key={p.name} onClick={() => createDefaultProfile(p.energy, p.name)}
          style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, padding: '14px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', marginBottom: 8, border: 'none', cursor: 'pointer' }}>
          <div style={{ width: 40, height: 40, borderRadius: 20, background: `${ENERGY_COLORS[p.energy]}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{p.icon}</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{p.name}</p>
            <p style={{ fontSize: 11, color: p.dbProfile ? '#22C55E' : 'rgba(255,255,255,0.4)' }}>
              {p.dbProfile ? 'Profile saved' : 'Tap to create profile'}
            </p>
          </div>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
        </button>
      ))}
    </div>
  );
}

// ── EVENT DETAIL SCREEN ───────────────────────────────────────────────────────
function EventDetail({ event, onBack, onTrigger }: { event: SpacesEvent; onBack: () => void; onTrigger: () => void }) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 20px' }}>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#8B5CF6', fontWeight: 800, fontSize: 14, marginBottom: 16, background: 'transparent', border: 'none', cursor: 'pointer' }}>
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg> Back
      </button>

      <div style={{ background: `${ENERGY_COLORS[event.energy_type]}18`, borderRadius: 20, padding: 20, marginBottom: 16, borderLeft: `4px solid ${ENERGY_COLORS[event.energy_type]}` }}>
        <EnergyPill type={event.energy_type} />
        <p style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '10px 0 4px' }}>{event.title}</p>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)' }}>{fmtTime(event.start_time)} – {fmtTime(event.end_time)}</p>
        {event.location && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>📍 {event.location}</p>}
      </div>

      {event.trigger_enabled && (
        <div style={{ background: '#8B5CF611', border: '1px solid #8B5CF633', borderRadius: 14, padding: 16, marginBottom: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 900, color: '#8B5CF6', letterSpacing: '0.06em', marginBottom: 6 }}>TRIGGER DETAILS</p>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>Fires {event.trigger_min} min before{event.trigger_playlist ? ` · ${event.trigger_playlist}` : ''}</p>
          {event.affirmation && (
            <p style={{ fontSize: 13, color: '#C4B5FD', fontStyle: 'italic', marginTop: 8, padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 10 }}>"{event.affirmation}"</p>
          )}
        </div>
      )}

      {event.trigger_enabled && (
        <motion.button whileTap={{ scale: 0.97 }} onClick={onTrigger}
          style={{ width: '100%', padding: '16px 0', borderRadius: 16, background: '#8B5CF6', color: '#fff', fontWeight: 900, fontSize: 16, border: 'none', cursor: 'pointer' }}>
          Start Trigger Now
        </motion.button>
      )}
    </div>
  );
}

// ── TRIGGER SCREEN ────────────────────────────────────────────────────────────
function TriggerScreen({ event, onDone }: { event: SpacesEvent; onDone: () => void }) {
  const [seconds, setSeconds] = useState(event.trigger_min * 60);
  const [checklist, setChecklist] = useState([
    { id: 'body', category: 'BODY', text: 'Shake out tension · roll your shoulders · stand up', done: false },
    { id: 'breath', category: 'MIND', text: '4-4-4 breathing: inhale 4s, hold 4s, exhale 4s', done: false },
    { id: 'space', category: 'SPACE', text: 'Clear your desk · silence your phone · get water', done: false },
    { id: 'focus', category: 'SPACE', text: 'Close all other tabs · put on your headphones', done: false },
  ]);

  useEffect(() => {
    const t = setInterval(() => setSeconds(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const done = checklist.filter(c => c.done).length;

  function toggle(id: string) {
    setChecklist(cl => cl.map(c => c.id === id ? { ...c, done: !c.done } : c));
  }

  const focusSentence: Record<EnergyType, string> = {
    high: 'Walk in ready. Speak with authority. This is your moment.',
    focused: 'One task. Full attention. Create something real.',
    creative: 'Open your mind. Play with ideas. Nothing is wrong yet.',
    energize: 'Move with intention. Push past comfort. Get stronger.',
    calm: 'Be present. Be open. Show up as you are.',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0A0B12', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: 'linear-gradient(180deg,#1E0A3C 0%,#150828 100%)', padding: '20px 16px 32px', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
          <button onClick={onDone} style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.08)', padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer' }}>Done</button>
        </div>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.12em', marginBottom: 12 }}>PREPARING FOR</p>
          <div style={{ fontSize: 72, fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums', lineHeight: 1, marginBottom: 8 }}>
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </div>
          <p style={{ fontSize: 18, fontWeight: 800, color: 'rgba(255,255,255,0.8)', marginBottom: 16 }}>{event.title}</p>
          {event.affirmation && (
            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: '12px 16px', borderLeft: '3px solid #8B5CF6' }}>
              <p style={{ fontSize: 14, color: '#C4B5FD', fontStyle: 'italic', lineHeight: 1.5 }}>"{event.affirmation}"</p>
            </div>
          )}
        </div>
      </div>

      {event.trigger_playlist && (
        <div style={{ margin: '16px 16px 0', background: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 8, background: `${ENERGY_COLORS[event.energy_type]}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🎵</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{event.trigger_playlist}</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}><EnergyPill type={event.energy_type} /></p>
          </div>
          <div style={{ width: 10, height: 10, borderRadius: 5, background: '#22C55E', boxShadow: '0 0 8px #22C55E' }} />
        </div>
      )}

      <div style={{ padding: '16px 16px 0', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <p style={{ fontSize: 12, fontWeight: 900, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em' }}>PREP CHECKLIST</p>
          <p style={{ fontSize: 12, color: '#22C55E', fontWeight: 800 }}>{done}/{checklist.length} done</p>
        </div>
        {checklist.map(c => (
          <motion.button key={c.id} whileTap={{ scale: 0.98 }} onClick={() => toggle(c.id)}
            style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', marginBottom: 6, border: 'none', cursor: 'pointer' }}>
            <div style={{ width: 20, height: 20, borderRadius: 10, flexShrink: 0, border: c.done ? 'none' : '2px solid rgba(255,255,255,0.25)', background: c.done ? '#22C55E' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
              {c.done && <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>}
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 9, fontWeight: 900, color: '#8B5CF6', letterSpacing: '0.08em' }}>{c.category} · </span>
              <span style={{ fontSize: 13, color: c.done ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.85)', fontWeight: 600, textDecoration: c.done ? 'line-through' : 'none' }}>{c.text}</span>
            </div>
          </motion.button>
        ))}
      </div>

      <div style={{ padding: '16px', marginBottom: 24 }}>
        <div style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 14, padding: '14px 16px' }}>
          <p style={{ fontSize: 10, fontWeight: 900, color: '#8B5CF6', letterSpacing: '0.1em', marginBottom: 6 }}>FOCUS</p>
          <p style={{ fontSize: 15, fontWeight: 900, color: '#fff', lineHeight: 1.4 }}>{focusSentence[event.energy_type]}</p>
        </div>
      </div>
    </div>
  );
}

// ── PAGE ──────────────────────────────────────────────────────────────────────
export default function SpacesPage() {
  const supabase = createClient();
  const [userId, setUserId] = useState('');
  const [screen, setScreen] = useState<Screen>('home');
  const [activeTab, setActiveTab] = useState<'home' | 'calendar' | 'tasks' | 'settings'>('home');
  const [selectedEvent, setSelectedEvent] = useState<SpacesEvent | null>(null);

  const [events, setEvents] = useState<SpacesEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(true);

  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  const loadEvents = useCallback(async () => {
    if (!userId) return;
    setEventsLoading(true);
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setDate(to.getDate() + 7);
    const { data } = await (supabase as any)
      .from('calendar_events')
      .select('id,title,start_time,end_time,location,energy_type,trigger_min,trigger_enabled,affirmation,trigger_playlist')
      .eq('creator_id', userId)
      .gte('start_time', from.toISOString())
      .lte('start_time', to.toISOString())
      .order('start_time');
    setEvents((data || []).map((e: any) => ({
      ...e,
      energy_type: e.energy_type || 'focused',
      trigger_min: e.trigger_min ?? 10,
      trigger_enabled: e.trigger_enabled ?? false,
    })));
    setEventsLoading(false);
  }, [userId]);

  const loadTasks = useCallback(async () => {
    if (!userId) return;
    setTasksLoading(true);
    const { data } = await (supabase as any)
      .from('spaces_tasks')
      .select('*')
      .eq('user_id', userId)
      .order('display_order')
      .order('created_at');
    setTasks(data || []);
    setTasksLoading(false);
  }, [userId]);

  useEffect(() => {
    if (userId) { loadEvents(); loadTasks(); }
  }, [userId, loadEvents, loadTasks]);

  async function toggleTask(id: string, done: boolean) {
    setTasks(ts => ts.map(t => t.id === id ? { ...t, done } : t));
    await (supabase as any).from('spaces_tasks').update({ done }).eq('id', id);
  }

  function openEvent(e: SpacesEvent) { setSelectedEvent(e); setScreen('event'); }
  function openTrigger(e: SpacesEvent) { setSelectedEvent(e); setScreen('trigger'); }
  function goBack() { setScreen(activeTab); }

  const headerTitle: Record<Screen, string> = {
    home: 'Spaces', calendar: 'Calendar', tasks: 'Tasks', settings: 'Settings',
    trigger: '', event: 'Event',
  };

  if (screen === 'trigger' && selectedEvent) {
    return <TriggerScreen event={selectedEvent} onDone={() => setScreen('event')} />;
  }

  return (
    <div style={{ background: '#0A0B12', minHeight: '100vh', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      <BackButton to="/village/hut" />

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, display: 'flex', alignItems: 'center', padding: '14px 16px 14px 60px', background: 'rgba(10,11,18,0.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {screen !== activeTab ? (
          <button onClick={goBack} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#8B5CF6', fontWeight: 800, fontSize: 14, background: 'transparent', border: 'none', cursor: 'pointer', marginRight: 12 }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
        ) : null}
        <p style={{ fontSize: 20, fontWeight: 900, flex: 1 }}>{headerTitle[screen]}</p>
        {(screen === 'calendar' || screen === 'home') && (
          <button onClick={() => setShowAddEvent(true)} style={{ width: 32, height: 32, borderRadius: 16, background: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', fontSize: 20, color: '#fff' }}>+</button>
        )}
        {screen === 'tasks' && (
          <button onClick={() => setShowAddTask(true)} style={{ width: 32, height: 32, borderRadius: 16, background: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', fontSize: 20, color: '#fff' }}>+</button>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', paddingTop: 16, paddingBottom: 80 }}>
        {screen === 'home'     && <HomeScreen events={events} loading={eventsLoading} onOpenEvent={openEvent} onOpenTrigger={openTrigger} />}
        {screen === 'calendar' && <CalendarScreen events={events} onOpenEvent={openEvent} />}
        {screen === 'tasks'    && <TasksScreen tasks={tasks} loading={tasksLoading} onToggle={toggleTask} />}
        {screen === 'settings' && userId && <SettingsScreen userId={userId} />}
        {screen === 'event' && selectedEvent && <EventDetail event={selectedEvent} onBack={goBack} onTrigger={() => openTrigger(selectedEvent)} />}
      </div>

      {/* Bottom nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(10,11,18,0.97)', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', paddingBottom: 'env(safe-area-inset-bottom, 0px)', zIndex: 30 }}>
        <TabIcon label="Spaces" active={activeTab === 'home' && screen === 'home'} onTap={() => { setActiveTab('home'); setScreen('home'); }}
          icon={<svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>} />
        <TabIcon label="Calendar" active={activeTab === 'calendar' && screen === 'calendar'} onTap={() => { setActiveTab('calendar'); setScreen('calendar'); }}
          icon={<svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>} />
        <TabIcon label="Tasks" active={activeTab === 'tasks' && screen === 'tasks'} onTap={() => { setActiveTab('tasks'); setScreen('tasks'); }}
          icon={<svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>} />
        <TabIcon label="Settings" active={activeTab === 'settings' && screen === 'settings'} onTap={() => { setActiveTab('settings'); setScreen('settings'); }}
          icon={<svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>} />
      </div>

      <AnimatePresence>
        {showAddEvent && userId && (
          <AddEventModal userId={userId} onSaved={() => { setShowAddEvent(false); loadEvents(); }} onClose={() => setShowAddEvent(false)} />
        )}
        {showAddTask && userId && (
          <AddTaskModal userId={userId} onSaved={() => { setShowAddTask(false); loadTasks(); }} onClose={() => setShowAddTask(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
