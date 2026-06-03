'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  SpacesEvent,
  ENERGY_COLORS,
  ENERGY_LABELS,
  fmtTime,
} from '@/lib/spaces/utils';

// ── Re-export mock events builder (same data as Spaces home) ──────────────────
function buildMockEvents(): SpacesEvent[] {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 5);

  function ts(d: Date, h: number, m = 0) {
    const x = new Date(d);
    x.setHours(h, m, 0, 0);
    return x.toISOString();
  }

  return [
    { id: 'mock-1', title: 'Team Standup', start_time: ts(today, 9, 0), end_time: ts(today, 9, 30), location: 'Zoom', energy_type: 'focused', trigger_min: 10, trigger_enabled: true, affirmation: 'I show up prepared, present, and ready to contribute.', trigger_playlist: 'Deep Focus' },
    { id: 'mock-2', title: 'Investor Pitch', start_time: ts(today, 14, 0), end_time: ts(today, 15, 0), location: 'Conference Room A', energy_type: 'high', trigger_min: 15, trigger_enabled: true, affirmation: 'I am confident, prepared, and compelling. This is my moment.', trigger_playlist: 'Power Mode' },
    { id: 'mock-3', title: 'Workout', start_time: ts(today, 18, 0), end_time: ts(today, 19, 0), location: 'Gym', energy_type: 'energize', trigger_min: 5, trigger_enabled: true, affirmation: 'Every rep makes me stronger. I push past comfort.', trigger_playlist: 'Energy Boost' },
    { id: 'mock-4', title: 'Design Review', start_time: ts(tomorrow, 10, 0), end_time: ts(tomorrow, 11, 0), location: 'Studio', energy_type: 'creative', trigger_min: 10, trigger_enabled: true, affirmation: 'My creativity flows freely. I bring fresh perspective.', trigger_playlist: 'Creative Flow' },
    { id: 'mock-5', title: 'Strategy Session', start_time: ts(tomorrow, 14, 0), end_time: ts(tomorrow, 15, 30), energy_type: 'focused', trigger_min: 10, trigger_enabled: true, affirmation: 'Clarity and precision guide every decision I make.', trigger_playlist: 'Deep Focus' },
    { id: 'mock-6', title: 'Morning Meditation', start_time: ts(nextWeek, 7, 0), end_time: ts(nextWeek, 7, 20), energy_type: 'calm', trigger_min: 5, trigger_enabled: false },
  ];
}

// ── Event creation modal ──────────────────────────────────────────────────────
function AddEventModal({ onClose, onAdd, selectedDate }: { onClose: () => void; onAdd: (e: SpacesEvent) => void; selectedDate: Date }) {
  type EnergyType = 'high' | 'focused' | 'creative' | 'energize' | 'calm';
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(selectedDate.toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [energy, setEnergy] = useState<EnergyType>('focused');
  const [triggerEnabled, setTriggerEnabled] = useState(true);
  const [triggerMin, setTriggerMin] = useState(10);
  const [err, setErr] = useState('');

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12, padding: '12px 14px', color: '#fff', fontSize: 14, boxSizing: 'border-box',
  };

  function submit() {
    if (!title.trim()) { setErr('Title required'); return; }
    const start_time = new Date(`${date}T${startTime}:00`).toISOString();
    const end_time = new Date(`${date}T${endTime}:00`).toISOString();
    onAdd({
      id: `local-${Date.now()}`,
      title: title.trim(),
      start_time,
      end_time,
      energy_type: energy,
      trigger_min: triggerMin,
      trigger_enabled: triggerEnabled,
    });
    onClose();
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'flex-end' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        style={{ width: '100%', background: '#0F1020', borderRadius: '20px 20px 0 0', padding: '20px 20px 48px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 2, margin: '0 auto 20px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <p style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>New Event</p>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 15, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: 20, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>×</button>
        </div>

        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Event title"
          style={{ ...inputStyle, fontSize: 16, fontWeight: 700, marginBottom: 12 }} />

        <div style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 800, letterSpacing: '0.05em', marginBottom: 5 }}>DATE</p>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...inputStyle, colorScheme: 'dark' }} />
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {(['START', 'END'] as const).map((lbl, i) => (
            <div key={lbl} style={{ flex: 1 }}>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 800, letterSpacing: '0.05em', marginBottom: 5 }}>{lbl}</p>
              <input type="time" value={i === 0 ? startTime : endTime}
                onChange={e => i === 0 ? setStartTime(e.target.value) : setEndTime(e.target.value)}
                style={{ ...inputStyle, colorScheme: 'dark' }} />
            </div>
          ))}
        </div>

        <p style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', marginBottom: 10 }}>ENERGY TYPE</p>
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          {(Object.keys(ENERGY_COLORS) as EnergyType[]).map(e => (
            <button key={e} onClick={() => setEnergy(e)} style={{
              padding: '6px 12px', borderRadius: 20, fontWeight: 800, fontSize: 11,
              border: `1px solid ${ENERGY_COLORS[e]}50`,
              background: energy === e ? ENERGY_COLORS[e] : `${ENERGY_COLORS[e]}18`,
              color: energy === e ? '#fff' : ENERGY_COLORS[e], cursor: 'pointer',
            }}>
              {ENERGY_LABELS[e]}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 14px' }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Enable Trigger</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Auto prep before event</p>
          </div>
          <button onClick={() => setTriggerEnabled(t => !t)} style={{ width: 44, height: 24, borderRadius: 12, background: triggerEnabled ? '#7C3AED' : 'rgba(255,255,255,0.1)', position: 'relative', flexShrink: 0, border: 'none', cursor: 'pointer' }}>
            <div style={{ position: 'absolute', top: 2, left: triggerEnabled ? 22 : 2, width: 20, height: 20, borderRadius: 10, background: '#fff', transition: 'left 0.2s' }} />
          </button>
        </div>

        {triggerEnabled && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 800, letterSpacing: '0.05em', marginBottom: 8 }}>PREP WINDOW</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {[5, 10, 15].map(m => (
                <button key={m} onClick={() => setTriggerMin(m)} style={{
                  flex: 1, padding: '9px 0', borderRadius: 10, fontWeight: 900, fontSize: 14, border: 'none', cursor: 'pointer',
                  background: triggerMin === m ? '#7C3AED' : 'rgba(255,255,255,0.06)',
                  color: triggerMin === m ? '#fff' : 'rgba(255,255,255,0.5)',
                }}>{m} min</button>
              ))}
            </div>
          </div>
        )}

        {err && <p style={{ color: '#EF4444', fontSize: 13, marginBottom: 10, fontWeight: 700 }}>{err}</p>}
        <motion.button whileTap={{ scale: 0.97 }} onClick={submit} style={{ width: '100%', padding: '16px 0', borderRadius: 14, background: '#7C3AED', color: '#fff', fontWeight: 900, fontSize: 16, border: 'none', cursor: 'pointer' }}>
          Add Event
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// ── Calendar Page ─────────────────────────────────────────────────────────────
export default function CalendarPage() {
  const router = useRouter();
  const today = new Date();

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDay, setSelectedDay] = useState<Date | null>(today);
  const [events, setEvents] = useState<SpacesEvent[]>(buildMockEvents());
  const [showAdd, setShowAdd] = useState(false);

  // Build calendar grid for viewYear/viewMonth
  const firstDay = new Date(viewYear, viewMonth, 1);
  // Mon-Sun: getDay() returns 0=Sun, so shift: Mon=0
  const startDow = (firstDay.getDay() + 6) % 7; // 0=Mon
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const totalCells = Math.ceil((startDow + daysInMonth) / 7) * 7;

  const cells: (number | null)[] = [];
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - startDow + 1;
    cells.push(dayNum >= 1 && dayNum <= daysInMonth ? dayNum : null);
  }

  const daysWithEvents = new Set(
    events.map(e => {
      const d = new Date(e.start_time);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    })
  );

  function hasDot(day: number) {
    return daysWithEvents.has(`${viewYear}-${viewMonth}-${day}`);
  }

  function isToday(day: number) {
    return day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
  }

  function isSelected(day: number) {
    if (!selectedDay) return false;
    return day === selectedDay.getDate() && viewMonth === selectedDay.getMonth() && viewYear === selectedDay.getFullYear();
  }

  function selectDay(day: number) {
    setSelectedDay(new Date(viewYear, viewMonth, day));
  }

  // Events for selected day
  const selStr = selectedDay ? selectedDay.toDateString() : '';
  const dayEvents = events
    .filter(e => new Date(e.start_time).toDateString() === selStr)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  return (
    <div style={{ background: '#080E24', minHeight: '100vh', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: 'rgba(8,14,36,0.97)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => router.push('/village/spaces')} style={{ width: 36, height: 36, borderRadius: 18, background: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <p style={{ fontSize: 20, fontWeight: 900, flex: 1 }}>Calendar</p>
          <button onClick={() => setShowAdd(true)} style={{ width: 36, height: 36, borderRadius: 18, background: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          </button>
        </div>

        {/* Month navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
          <p style={{ fontSize: 16, fontWeight: 900 }}>{MONTH_NAMES[viewMonth]} {viewYear}</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={prevMonth} style={{ width: 32, height: 32, borderRadius: 16, background: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <button onClick={nextMonth} style={{ width: 32, height: 32, borderRadius: 16, background: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 100px' }}>
        {/* Day-of-week headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginTop: 16, marginBottom: 8 }}>
          {DOW.map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.04em', paddingBottom: 4 }}>
              {d.toUpperCase()}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 24 }}>
          {cells.map((day, idx) => {
            if (day === null) return <div key={`empty-${idx}`} style={{ height: 44 }} />;
            const sel = isSelected(day);
            const tod = isToday(day);
            const dot = hasDot(day);
            return (
              <motion.button
                key={`day-${day}`}
                whileTap={{ scale: 0.9 }}
                onClick={() => selectDay(day)}
                style={{
                  height: 44, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 10, position: 'relative',
                }}
              >
                <div style={{
                  width: 30, height: 30, borderRadius: 15, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: sel ? '#7C3AED' : tod ? 'rgba(124,58,237,0.25)' : 'transparent',
                  border: tod && !sel ? '1.5px solid #7C3AED' : 'none',
                }}>
                  <span style={{ fontSize: 13, fontWeight: sel || tod ? 900 : 600, color: sel ? '#fff' : tod ? '#A78BFA' : 'rgba(255,255,255,0.75)' }}>
                    {day}
                  </span>
                </div>
                {dot && (
                  <div style={{ width: 4, height: 4, borderRadius: 2, background: sel ? 'rgba(255,255,255,0.8)' : '#A78BFA', marginTop: 2 }} />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Events for selected day */}
        {selectedDay && (
          <>
            <p style={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.07em', marginBottom: 12 }}>
              {selectedDay.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()}
            </p>
            {dayEvents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 20px', color: 'rgba(255,255,255,0.25)' }}>
                <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ margin: '0 auto 8px', display: 'block' }}><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                <p style={{ fontSize: 13, fontWeight: 700 }}>No events — tap + to add one</p>
              </div>
            ) : (
              dayEvents.map(event => (
                <motion.div key={event.id} whileTap={{ scale: 0.98 }}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 0, background: 'rgba(255,255,255,0.04)', borderRadius: 14, marginBottom: 8, overflow: 'hidden' }}>
                  {/* Colored left border = energy type color */}
                  <div style={{ width: 3, alignSelf: 'stretch', background: ENERGY_COLORS[event.energy_type], flexShrink: 0 }} />
                  <div style={{ flex: 1, padding: '13px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                      <p style={{ fontSize: 14, fontWeight: 800, color: '#fff', flex: 1 }}>{event.title}</p>
                      {event.trigger_enabled && (
                        <span style={{ fontSize: 9, fontWeight: 900, color: '#A78BFA', background: '#7C3AED20', border: '1px solid #7C3AED40', borderRadius: 6, padding: '2px 7px', flexShrink: 0 }}>TRIGGER</span>
                      )}
                    </div>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 3 }}>
                      {fmtTime(event.start_time)} — {fmtTime(event.end_time)}
                      {event.location ? ` · ${event.location}` : ''}
                    </p>
                    <div style={{ marginTop: 7 }}>
                      <span style={{
                        fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 20,
                        background: `${ENERGY_COLORS[event.energy_type]}20`, color: ENERGY_COLORS[event.energy_type],
                        border: `1px solid ${ENERGY_COLORS[event.energy_type]}40`, letterSpacing: '0.04em',
                      }}>
                        {ENERGY_LABELS[event.energy_type].toUpperCase()}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </>
        )}
      </div>

      {/* Bottom Nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(8,14,36,0.97)', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', paddingBottom: 'env(safe-area-inset-bottom, 0px)', zIndex: 30 }}>
        {[
          { label: 'Home', icon: <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>, href: '/village/spaces', active: false },
          { label: 'Calendar', icon: <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>, href: '/village/spaces/calendar', active: true },
          { label: 'Tasks', icon: <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>, href: '/village/spaces/tasks', active: false },
          { label: 'Settings', icon: <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>, href: '/village/spaces/settings', active: false },
        ].map(tab => (
          <button key={tab.label} onClick={() => router.push(tab.href)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '10px 0', color: tab.active ? '#7C3AED' : 'rgba(255,255,255,0.35)', background: 'transparent', border: 'none', borderTop: tab.active ? '2px solid #7C3AED' : '2px solid transparent', cursor: 'pointer' }}>
            {tab.icon}
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.04em' }}>{tab.label.toUpperCase()}</span>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {showAdd && <AddEventModal onClose={() => setShowAdd(false)} onAdd={e => setEvents(prev => [...prev, e])} selectedDate={selectedDay ?? today} />}
      </AnimatePresence>
    </div>
  );
}
