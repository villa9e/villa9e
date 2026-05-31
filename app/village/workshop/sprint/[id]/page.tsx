'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function SprintPage({ params }: { params: { id: string } }) {
  const [sprint, setSprint]       = useState<any>(null);
  const [actions, setActions]     = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);
  const [celebrate, setCelebrate]  = useState(false);
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';

  const bg      = isNight ? '#0A0B12' : '#FFF8EE';
  const cardBg  = isNight ? '#12152A' : '#FFFFFF';
  const border  = isNight ? '#1E2240' : '#FED7AA';
  const text    = isNight ? '#F0EBE0' : '#1E1B4B';
  const muted   = isNight ? '#4A4F72' : '#6B7280';
  const accent  = '#1877F2';

  useEffect(() => { load(); }, [params.id]);

  async function load() {
    const found = await fetch(`/api/sprints?sprint_id=${params.id}`).then(r => r.json()).catch(() => null);
    if (found) {
      setSprint(found);
      setActions(found.sprint_actions?.sort((a: any, b: any) => a.order_index - b.order_index) ?? []);
    }
    setLoading(false);
  }

  async function completeAction(actionId: string) {
    setCompleting(actionId);
    await fetch('/api/sprints', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action_id: actionId }),
    });
    setActions(prev => prev.map(a => a.id === actionId ? { ...a, completed: true, completed_at: new Date() } : a));
    setCompleting(null);

    const newActions = actions.map(a => a.id === actionId ? { ...a, completed: true } : a);
    if (newActions.every(a => a.completed)) {
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 4000);
    }
  }

  const done  = actions.filter(a => a.completed).length;
  const total = actions.length;
  const pct   = total ? Math.round((done / total) * 100) : 0;
  const circumference = 2 * Math.PI * 36;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: bg }}>
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!sprint) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: bg }}>
      <div className="text-center">
        <p className="text-4xl mb-3">⚡</p>
        <p className="font-bold" style={{ color: text }}>Sprint not found</p>
        <Link href="/village/workshop" className="text-sm mt-2 block" style={{ color: accent }}>← Back to Workshop</Link>
      </div>
    </div>
  );

  const weekStart = new Date(sprint.week_start);
  const weekEnd   = new Date(sprint.week_end);

  return (
    <div className="min-h-screen pb-24" style={{ background: bg }}>
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 border-b"
        style={{ background: isNight ? '#0A0B12' : '#fff', borderColor: border }}>
        <Link href={sprint.goal_id ? `/village/workshop/goal/${sprint.goal_id}` : '/village/workshop'}
          className="text-xl" style={{ color: muted }}>←</Link>
        <div className="flex-1">
          <p className="font-black text-sm" style={{ color: text }}>Weekly Sprint</p>
          <p className="text-xs" style={{ color: muted }}>
            {weekStart.toLocaleDateString('en', { month: 'short', day: 'numeric' })} – {weekEnd.toLocaleDateString('en', { month: 'short', day: 'numeric' })}
          </p>
        </div>
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${sprint.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
          {sprint.status === 'completed' ? '✓ Done' : 'Active'}
        </span>
      </div>

      {/* Celebration overlay */}
      <AnimatePresence>
        {celebrate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} exit={{ scale: 0.5 }}
              className="text-center p-8 rounded-3xl"
              style={{ background: 'rgba(24,119,242,0.95)', backdropFilter: 'blur(16px)' }}>
              <div className="text-6xl mb-3">⚡</div>
              <p className="text-2xl font-black text-white">Sprint Complete!</p>
              <p className="text-blue-200 text-sm mt-1">+50 VLG earned</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-md mx-auto px-4 py-5 space-y-5">
        {/* Progress ring */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl p-6 flex items-center gap-5"
          style={{ background: cardBg, border: `1px solid ${border}` }}>
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg className="w-20 h-20 -rotate-90">
              <circle cx="40" cy="40" r="36" fill="none" stroke={isNight ? '#1E2240' : '#E5E7EB'} strokeWidth="7" />
              <circle cx="40" cy="40" r="36" fill="none" stroke={accent} strokeWidth="7"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - pct / 100)}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-black" style={{ color: text }}>{pct}%</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-black text-base leading-tight" style={{ color: text }}>{sprint.title}</h1>
            {sprint.focus_intention && (
              <p className="text-xs mt-1 leading-relaxed italic" style={{ color: muted }}>"{sprint.focus_intention}"</p>
            )}
            <p className="text-xs mt-2 font-semibold" style={{ color: accent }}>{done}/{total} actions complete</p>
          </div>
        </motion.div>

        {/* Spirit's opening note */}
        {sprint.spirit_note && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            className="rounded-2xl px-4 py-3 flex gap-3"
            style={{ background: isNight ? 'rgba(24,119,242,0.08)' : '#EEF2FF', border: `1px solid ${isNight ? 'rgba(24,119,242,0.2)' : '#C7D2FE'}` }}>
            <span className="text-2xl flex-shrink-0">🌿</span>
            <p className="text-sm leading-relaxed italic" style={{ color: isNight ? '#93C5FD' : '#4338CA' }}>{sprint.spirit_note}</p>
          </motion.div>
        )}

        {/* Actions list */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: muted }}>This Week's Actions</p>
          <div className="space-y-2">
            {actions.map((action, i) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 rounded-2xl px-4 py-3.5"
                style={{
                  background: action.completed ? (isNight ? 'rgba(34,197,94,0.08)' : '#F0FDF4') : cardBg,
                  border: `1px solid ${action.completed ? (isNight ? 'rgba(34,197,94,0.2)' : '#BBF7D0') : border}`,
                  opacity: action.completed ? 0.8 : 1,
                }}
              >
                {/* Checkbox */}
                <button
                  onClick={() => !action.completed && sprint.status !== 'completed' && completeAction(action.id)}
                  disabled={action.completed || sprint.status === 'completed' || completing === action.id}
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                  style={{
                    background:  action.completed ? '#22C55E' : 'transparent',
                    border:      `2px solid ${action.completed ? '#22C55E' : muted}`,
                    cursor:      action.completed ? 'default' : 'pointer',
                  }}
                >
                  {completing === action.id
                    ? <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                    : action.completed ? <span className="text-white text-xs">✓</span> : null
                  }
                </button>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight"
                    style={{ color: text, textDecoration: action.completed ? 'line-through' : 'none', opacity: action.completed ? 0.6 : 1 }}>
                    {action.title}
                  </p>
                  {action.day_of_week && (
                    <p className="text-xs mt-0.5" style={{ color: muted }}>{DAYS[action.day_of_week - 1]}</p>
                  )}
                </div>

                {action.completed && action.completed_at && (
                  <span className="text-xs" style={{ color: '#22C55E' }}>
                    {new Date(action.completed_at).toLocaleDateString('en', { weekday: 'short' })}
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Day-by-day view */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: muted }}>Week at a Glance</p>
          <div className="grid grid-cols-7 gap-1.5">
            {DAYS.map((day, i) => {
              const dayActions   = actions.filter(a => a.day_of_week === i + 1);
              const dayCompleted = dayActions.every(a => a.completed);
              const hasActions   = dayActions.length > 0;
              const today        = new Date().getDay(); // 0=Sun, 1=Mon
              const adjustedToday = today === 0 ? 7 : today;
              const isToday      = adjustedToday === i + 1;

              return (
                <div key={day} className="flex flex-col items-center gap-1">
                  <p className="text-xs font-semibold" style={{ color: isToday ? accent : muted }}>{day}</p>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      background: !hasActions ? (isNight ? '#1E2240' : '#F3F4F6')
                        : dayCompleted ? 'rgba(34,197,94,0.2)' : (isNight ? '#1A1F3A' : '#EEF2FF'),
                      border: isToday ? `2px solid ${accent}` : '2px solid transparent',
                      color: dayCompleted ? '#22C55E' : hasActions ? accent : muted,
                    }}>
                    {!hasActions ? '·' : dayCompleted ? '✓' : dayActions.length}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Complete sprint button */}
        {sprint.status === 'active' && done > 0 && done === total && (
          <button
            onClick={async () => {
              await fetch('/api/sprints', {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sprint_id: sprint.id }),
              });
              setSprint((s: any) => ({ ...s, status: 'completed' }));
              setCelebrate(true);
            }}
            className="w-full py-4 rounded-2xl font-black text-white text-base"
            style={{ background: 'linear-gradient(135deg,#22C55E,#16A34A)' }}>
            ⚡ Complete Sprint → +50 VLG
          </button>
        )}
      </div>
    </div>
  );
}
