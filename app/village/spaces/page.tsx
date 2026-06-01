'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { BackButton } from '@/components/village/BackButton';

// ── Types ─────────────────────────────────────────────────────────────────────
type EnergyType = 'high' | 'focused' | 'creative' | 'energize' | 'calm';
type Screen = 'home' | 'calendar' | 'tasks' | 'settings' | 'trigger' | 'event';

interface Event {
  id: string;
  title: string;
  time: string;
  endTime: string;
  location?: string;
  energy: EnergyType;
  triggerMin: number;
  hasTrigger: boolean;
  affirmation?: string;
  playlist?: string;
}

interface Task {
  id: string;
  text: string;
  done: boolean;
  due?: string;
  project?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const ENERGY_COLORS: Record<EnergyType, string> = {
  high: '#EF4444', focused: '#1877F2', creative: '#8B5CF6', energize: '#F59E0B', calm: '#10B981',
};
const ENERGY_LABELS: Record<EnergyType, string> = {
  high: 'High Performance', focused: 'Focused', creative: 'Creative', energize: 'Energize', calm: 'Calm',
};

// Mock data
const TODAY_EVENTS: Event[] = [
  { id: '1', title: 'Deep Work Block', time: '9:00 AM', endTime: '11:00 AM', energy: 'focused', triggerMin: 10, hasTrigger: true, affirmation: 'I am fully present and productive.', playlist: 'Deep Focus' },
  { id: '2', title: 'Investor Pitch Prep', time: '2:00 PM', endTime: '3:00 PM', energy: 'high', triggerMin: 15, hasTrigger: true, affirmation: 'I speak with clarity and conviction.', playlist: 'Power Up' },
  { id: '3', title: 'Team Sync', time: '4:30 PM', endTime: '5:00 PM', energy: 'creative', triggerMin: 5, hasTrigger: false },
];
const TOMORROW_EVENTS: Event[] = [
  { id: '4', title: 'Morning Run', time: '7:00 AM', endTime: '7:45 AM', energy: 'energize', triggerMin: 10, hasTrigger: true, affirmation: "My body is strong. Let's go.", playlist: 'Power Up' },
  { id: '5', title: 'Therapy Session', time: '11:00 AM', endTime: '12:00 PM', energy: 'calm', triggerMin: 10, hasTrigger: true, affirmation: 'I am open and ready to heal.', playlist: 'Calm Space' },
];
const TASKS: Task[] = [
  { id: 't1', text: 'Review pitch deck slides', done: false, due: 'Today' },
  { id: 't2', text: 'Complete morning check-in', done: true, due: 'Today' },
  { id: 't3', text: 'Confirm meeting with advisor', done: false, due: 'Tomorrow' },
  { id: 't4', text: 'Submit weekly goal update', done: false, due: 'This week' },
  { id: 't5', text: 'Review sprint completions', done: false, due: 'This week', project: 'App Launch' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function EnergyPill({ type }: { type: EnergyType }) {
  return (
    <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 20, background: `${ENERGY_COLORS[type]}22`, color: ENERGY_COLORS[type], border: `1px solid ${ENERGY_COLORS[type]}44`, letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>
      {ENERGY_LABELS[type].toUpperCase()}
    </span>
  );
}

function TabIcon({ icon, label, active, onTap }: { icon: React.ReactNode; label: string; active: boolean; onTap: () => void }) {
  return (
    <button onClick={onTap} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '8px 0', color: active ? '#8B5CF6' : 'rgba(255,255,255,0.35)', background: 'transparent', borderTop: active ? '2px solid #8B5CF6' : '2px solid transparent' }}>
      {icon}
      <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.03em' }}>{label.toUpperCase()}</span>
    </button>
  );
}

// ── Event Card ────────────────────────────────────────────────────────────────
function EventCard({ event, onOpen }: { event: Event; onOpen: (e: Event) => void }) {
  return (
    <motion.button whileTap={{ scale: 0.98 }} onClick={() => onOpen(event)}
      style={{ width: '100%', textAlign: 'left', background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '12px 14px', marginBottom: 8, borderLeft: `3px solid ${ENERGY_COLORS[event.energy]}`, display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.title}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{event.time} – {event.endTime}</span>
          {event.location && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>📍 {event.location}</span>}
        </div>
        <div style={{ marginTop: 6 }}>
          <EnergyPill type={event.energy} />
        </div>
      </div>
      {event.hasTrigger && (
        <div style={{ flexShrink: 0, background: '#8B5CF622', border: '1px solid #8B5CF644', borderRadius: 8, padding: '3px 8px' }}>
          <span style={{ fontSize: 9, fontWeight: 900, color: '#8B5CF6' }}>TRIGGER</span>
        </div>
      )}
    </motion.button>
  );
}

// ── HOME SCREEN ───────────────────────────────────────────────────────────────
function HomeScreen({ onOpenEvent, onOpenTrigger }: { onOpenEvent: (e: Event) => void; onOpenTrigger: (e: Event) => void }) {
  const next = TODAY_EVENTS[1]; // The 2PM pitch as "next up"
  const now = new Date();

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 20px' }}>
      {/* Next Up Card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: 'linear-gradient(135deg,#4C1D95,#7C3AED)', borderRadius: 20, padding: 20, marginBottom: 12 }}>
        <p style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.08em', marginBottom: 8 }}>NEXT UP</p>
        <p style={{ fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 4 }}>{next.title}</p>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 12 }}>{next.time} · Trigger in {next.triggerMin} min</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => onOpenEvent(next)} style={{ flex: 1, padding: '9px 0', borderRadius: 10, background: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 800, fontSize: 13 }}>View Details</button>
          {next.hasTrigger && <button onClick={() => onOpenTrigger(next)} style={{ flex: 1, padding: '9px 0', borderRadius: 10, background: '#fff', color: '#7C3AED', fontWeight: 900, fontSize: 13 }}>Start Trigger</button>}
        </div>
      </motion.div>

      {/* Trigger Status Bar */}
      {next.hasTrigger && (
        <motion.button whileTap={{ scale: 0.98 }} onClick={() => onOpenTrigger(next)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, background: '#8B5CF611', border: '1px solid #8B5CF633', borderRadius: 12, padding: '10px 14px', marginBottom: 20 }}>
          <div style={{ width: 8, height: 8, borderRadius: 4, background: '#8B5CF6', boxShadow: '0 0 8px #8B5CF6', animation: 'pulse 2s infinite' }} />
          <div style={{ flex: 1, textAlign: 'left' }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: '#C4B5FD' }}>Trigger armed · fires at 1:45 PM</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Tap to launch now</p>
          </div>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
        </motion.button>
      )}

      {/* Today */}
      <p style={{ fontSize: 13, fontWeight: 900, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', marginBottom: 10 }}>TODAY</p>
      {TODAY_EVENTS.map(e => <EventCard key={e.id} event={e} onOpen={onOpenEvent} />)}

      {/* Tomorrow */}
      <p style={{ fontSize: 13, fontWeight: 900, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', marginTop: 4, marginBottom: 10 }}>TOMORROW</p>
      {TOMORROW_EVENTS.map(e => <EventCard key={e.id} event={e} onOpen={onOpenEvent} />)}
    </div>
  );
}

// ── CALENDAR SCREEN ───────────────────────────────────────────────────────────
function CalendarScreen({ onOpenEvent }: { onOpenEvent: (e: Event) => void }) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const [selDay, setSelDay] = useState(3); // Thursday
  const eventsForDay = selDay === 3 ? TODAY_EVENTS : selDay === 4 ? TOMORROW_EVENTS : [];

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 20px' }}>
      {/* Week strip */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {days.map((d, i) => (
          <button key={d} onClick={() => setSelDay(i)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 0', borderRadius: 12, background: selDay === i ? '#8B5CF6' : 'transparent' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: selDay === i ? '#fff' : 'rgba(255,255,255,0.4)' }}>{d}</span>
            <span style={{ fontSize: 16, fontWeight: 900, color: selDay === i ? '#fff' : 'rgba(255,255,255,0.6)' }}>{15 + i}</span>
            {[1, 3, 4].includes(i) && <div style={{ width: 5, height: 5, borderRadius: 3, background: selDay === i ? '#fff' : '#8B5CF6' }} />}
          </button>
        ))}
      </div>

      {eventsForDay.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)' }}>
          <p style={{ fontSize: 24, marginBottom: 8 }}>📅</p>
          <p style={{ fontSize: 14, fontWeight: 700 }}>No events</p>
        </div>
      ) : (
        eventsForDay.map(e => (
          <motion.button key={e.id} whileTap={{ scale: 0.98 }} onClick={() => onOpenEvent(e)}
            style={{ width: '100%', textAlign: 'left', display: 'flex', gap: 12, marginBottom: 10, padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', borderLeft: `3px solid ${ENERGY_COLORS[e.energy]}` }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 3 }}>{e.title}</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{e.time} – {e.endTime}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <EnergyPill type={e.energy} />
              {e.hasTrigger && <span style={{ fontSize: 9, fontWeight: 800, color: '#8B5CF6', background: '#8B5CF611', padding: '2px 6px', borderRadius: 8 }}>TRIGGER</span>}
            </div>
          </motion.button>
        ))
      )}
    </div>
  );
}

// ── TASKS SCREEN ──────────────────────────────────────────────────────────────
function TasksScreen() {
  const [tasks, setTasks] = useState(TASKS);
  const todayTasks = tasks.filter(t => t.due === 'Today');
  const upcomingTasks = tasks.filter(t => t.due !== 'Today');

  function toggle(id: string) {
    setTasks(ts => ts.map(t => t.id === id ? { ...t, done: !t.done } : t));
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 20px' }}>
      <p style={{ fontSize: 13, fontWeight: 900, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', marginBottom: 10 }}>TODAY</p>
      {todayTasks.map(t => (
        <motion.button key={t.id} whileTap={{ scale: 0.98 }} onClick={() => toggle(t.id)}
          style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', marginBottom: 6 }}>
          <div style={{ width: 20, height: 20, borderRadius: 10, border: t.done ? 'none' : '2px solid rgba(255,255,255,0.3)', background: t.done ? '#22C55E' : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {t.done && <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>}
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: t.done ? 'rgba(255,255,255,0.35)' : '#fff', textDecoration: t.done ? 'line-through' : 'none' }}>{t.text}</span>
        </motion.button>
      ))}

      <p style={{ fontSize: 13, fontWeight: 900, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', marginTop: 16, marginBottom: 10 }}>UPCOMING</p>
      {upcomingTasks.map(t => (
        <motion.button key={t.id} whileTap={{ scale: 0.98 }} onClick={() => toggle(t.id)}
          style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', marginBottom: 6 }}>
          <div style={{ width: 20, height: 20, borderRadius: 10, border: t.done ? 'none' : '2px solid rgba(255,255,255,0.3)', background: t.done ? '#22C55E' : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {t.done && <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: t.done ? 'rgba(255,255,255,0.35)' : '#fff', textDecoration: t.done ? 'line-through' : 'none' }}>{t.text}</p>
            {t.project && <p style={{ fontSize: 11, color: '#8B5CF6', fontWeight: 700, marginTop: 2 }}>📁 {t.project}</p>}
          </div>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 700 }}>{t.due}</span>
        </motion.button>
      ))}
    </div>
  );
}

// ── SETTINGS SCREEN ───────────────────────────────────────────────────────────
function SettingsScreen() {
  const [defaultTrigger, setDefaultTrigger] = useState<5 | 10 | 15>(10);
  const profiles: { name: string; icon: string; energy: EnergyType }[] = [
    { name: 'High Performance', icon: '⚡', energy: 'high' },
    { name: 'Focused', icon: '🎯', energy: 'focused' },
    { name: 'Creative', icon: '✨', energy: 'creative' },
    { name: 'Energize', icon: '🔥', energy: 'energize' },
    { name: 'Calm', icon: '🌿', energy: 'calm' },
  ];
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 20px' }}>
      <p style={{ fontSize: 13, fontWeight: 900, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', marginBottom: 12 }}>TRIGGER DEFAULTS</p>
      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '14px', marginBottom: 24 }}>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 700, marginBottom: 12 }}>Default prep window</p>
        <div style={{ display: 'flex', gap: 8 }}>
          {([5, 10, 15] as const).map(m => (
            <button key={m} onClick={() => setDefaultTrigger(m)} style={{ flex: 1, padding: '10px 0', borderRadius: 10, background: defaultTrigger === m ? '#8B5CF6' : 'rgba(255,255,255,0.06)', color: defaultTrigger === m ? '#fff' : 'rgba(255,255,255,0.5)', fontWeight: 900, fontSize: 15 }}>
              {m} min
            </button>
          ))}
        </div>
      </div>

      <p style={{ fontSize: 13, fontWeight: 900, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', marginBottom: 12 }}>TRIGGER PROFILES</p>
      {profiles.map(p => (
        <button key={p.name} style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, padding: '14px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: 20, background: `${ENERGY_COLORS[p.energy]}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{p.icon}</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{p.name}</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Tap to edit profile</p>
          </div>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
        </button>
      ))}
    </div>
  );
}

// ── EVENT DETAIL SCREEN ───────────────────────────────────────────────────────
function EventDetail({ event, onBack, onTrigger }: { event: Event; onBack: () => void; onTrigger: () => void }) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 20px' }}>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#8B5CF6', fontWeight: 800, fontSize: 14, marginBottom: 16, background: 'transparent' }}>
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg> Back
      </button>

      <div style={{ background: `${ENERGY_COLORS[event.energy]}18`, borderRadius: 20, padding: 20, marginBottom: 16, borderLeft: `4px solid ${ENERGY_COLORS[event.energy]}` }}>
        <EnergyPill type={event.energy} />
        <p style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '10px 0 4px' }}>{event.title}</p>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)' }}>{event.time} – {event.endTime}</p>
      </div>

      {event.hasTrigger && (
        <div style={{ background: '#8B5CF611', border: '1px solid #8B5CF633', borderRadius: 14, padding: 16, marginBottom: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 900, color: '#8B5CF6', letterSpacing: '0.06em', marginBottom: 6 }}>TRIGGER DETAILS</p>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>Fires {event.triggerMin} min before · {event.playlist}</p>
          {event.affirmation && (
            <p style={{ fontSize: 13, color: '#C4B5FD', fontStyle: 'italic', marginTop: 8, padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 10 }}>"{event.affirmation}"</p>
          )}
        </div>
      )}

      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 14, marginBottom: 16 }}>
        <p style={{ fontSize: 12, fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', marginBottom: 8 }}>LINKED FILES</p>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>No files attached</p>
      </div>

      {event.hasTrigger && (
        <motion.button whileTap={{ scale: 0.97 }} onClick={onTrigger}
          style={{ width: '100%', padding: '16px 0', borderRadius: 16, background: '#8B5CF6', color: '#fff', fontWeight: 900, fontSize: 16 }}>
          Start Trigger Now
        </motion.button>
      )}
    </div>
  );
}

// ── TRIGGER SCREEN ────────────────────────────────────────────────────────────
function TriggerScreen({ event, onDone }: { event: Event; onDone: () => void }) {
  const [seconds, setSeconds] = useState(event.triggerMin * 60);
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

  return (
    <div style={{ minHeight: '100vh', background: '#0A0B12', display: 'flex', flexDirection: 'column' }}>
      {/* Dark header */}
      <div style={{ background: 'linear-gradient(180deg,#1E0A3C 0%,#150828 100%)', padding: '20px 16px 32px', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
          <button onClick={onDone} style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.08)', padding: '6px 14px', borderRadius: 20 }}>Done</button>
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

      {/* Music card */}
      {event.playlist && (
        <div style={{ margin: '16px 16px 0', background: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 8, background: `${ENERGY_COLORS[event.energy]}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🎵</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{event.playlist}</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}><EnergyPill type={event.energy} /></p>
          </div>
          <div style={{ width: 10, height: 10, borderRadius: 5, background: '#22C55E', boxShadow: '0 0 8px #22C55E' }} />
        </div>
      )}

      {/* Checklist */}
      <div style={{ padding: '16px 16px 0', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <p style={{ fontSize: 12, fontWeight: 900, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em' }}>PREP CHECKLIST</p>
          <p style={{ fontSize: 12, color: '#22C55E', fontWeight: 800 }}>{done}/{checklist.length} done</p>
        </div>
        {checklist.map(c => (
          <motion.button key={c.id} whileTap={{ scale: 0.98 }} onClick={() => toggle(c.id)}
            style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', marginBottom: 6 }}>
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

      {/* Focus sentence */}
      <div style={{ padding: '16px', marginBottom: 24 }}>
        <div style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 14, padding: '14px 16px' }}>
          <p style={{ fontSize: 10, fontWeight: 900, color: '#8B5CF6', letterSpacing: '0.1em', marginBottom: 6 }}>FOCUS</p>
          <p style={{ fontSize: 15, fontWeight: 900, color: '#fff', lineHeight: 1.4 }}>
            {event.energy === 'high' ? 'Walk in ready. Speak with authority. This is your moment.' :
             event.energy === 'focused' ? 'One task. Full attention. Create something real.' :
             event.energy === 'creative' ? 'Open your mind. Play with ideas. Nothing is wrong yet.' :
             event.energy === 'energize' ? 'Move with intention. Push past comfort. Get stronger.' :
             'Be present. Be open. Show up as you are.'}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── PAGE ──────────────────────────────────────────────────────────────────────
export default function SpacesPage() {
  const router = useRouter();
  const [screen, setScreen]       = useState<Screen>('home');
  const [activeTab, setActiveTab] = useState<'home' | 'calendar' | 'tasks' | 'settings'>('home');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  function openEvent(e: Event) { setSelectedEvent(e); setScreen('event'); }
  function openTrigger(e: Event) { setSelectedEvent(e); setScreen('trigger'); }
  function goBack() { setScreen(activeTab); }

  const headerTitle: Record<Screen, string> = {
    home: 'Spaces', calendar: 'Calendar', tasks: 'Tasks', settings: 'Settings',
    trigger: '', event: 'Event',
  };

  if (screen === 'trigger' && selectedEvent) {
    return <TriggerScreen event={selectedEvent} onDone={() => { setScreen('event'); }} />;
  }

  return (
    <div style={{ background: '#0A0B12', minHeight: '100vh', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      <BackButton to="/village/hut" />

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, display: 'flex', alignItems: 'center', padding: '14px 16px 14px 60px', background: 'rgba(10,11,18,0.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {screen !== activeTab ? (
          <button onClick={goBack} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#8B5CF6', fontWeight: 800, fontSize: 14, background: 'transparent', marginRight: 12 }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
        ) : null}
        <p style={{ fontSize: 20, fontWeight: 900, flex: 1 }}>{headerTitle[screen]}</p>
        {screen === 'home' && (
          <button style={{ width: 32, height: 32, borderRadius: 16, background: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" /></svg>
          </button>
        )}
        {screen === 'calendar' && (
          <button style={{ width: 32, height: 32, borderRadius: 16, background: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 14 }}>+</span>
          </button>
        )}
        {screen === 'tasks' && (
          <button style={{ width: 32, height: 32, borderRadius: 16, background: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 18, fontWeight: 900 }}>+</span>
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', paddingTop: 16, paddingBottom: 80 }}>
        {screen === 'home'     && <HomeScreen onOpenEvent={openEvent} onOpenTrigger={openTrigger} />}
        {screen === 'calendar' && <CalendarScreen onOpenEvent={openEvent} />}
        {screen === 'tasks'    && <TasksScreen />}
        {screen === 'settings' && <SettingsScreen />}
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
    </div>
  );
}
