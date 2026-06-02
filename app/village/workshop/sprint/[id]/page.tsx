'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ---------------------------------------------------------------------------
// SVG icons — no emojis
// ---------------------------------------------------------------------------

function BadgeIcon({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <circle cx="22" cy="22" r="20" fill="url(#badgeGrad)" />
      <path d="M22 10 l3 7h7l-5.5 4.5 2 7L22 25l-6.5 3.5 2-7L12 17h7z"
        fill="white" opacity="0.9" />
      <defs>
        <linearGradient id="badgeGrad" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#0EA5E9" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="12" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="4" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="13" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10.5 3.75L5.5 7.25M5.5 8.75l5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Sprint celebration overlay (spec §11.4)
// ---------------------------------------------------------------------------

interface SprintCelebrationProps {
  sprint: any;
  done: number;
  total: number;
  onClose: () => void;
}

function SprintCelebration({ sprint, done, total, onClose }: SprintCelebrationProps) {
  const router = useRouter();
  const [sharing, setSharing] = useState(false);

  const weekStart = sprint?.week_start ? new Date(sprint.week_start) : null;
  const weekEnd   = sprint?.week_end   ? new Date(sprint.week_end)   : null;
  const weekRange = weekStart && weekEnd
    ? `${weekStart.toLocaleDateString('en', { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString('en', { month: 'short', day: 'numeric' })}`
    : '';

  async function startNextSprint() {
    // Try to find and activate next sprint
    try {
      const res = await fetch('/api/sprints/next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_sprint_id: sprint.id }),
      }).then(r => r.json()).catch(() => ({}));

      if (res.next_sprint_id) {
        router.push(`/village/workshop/sprint/${res.next_sprint_id}`);
      } else {
        router.push(sprint.goal_id ? `/village/workshop/goal/${sprint.goal_id}` : '/village/workshop');
      }
    } catch {
      router.push('/village/workshop');
    }
    onClose();
  }

  async function shareToDreamLine() {
    setSharing(true);
    try {
      const goalTitle = sprint.goal_title ?? sprint.title ?? 'my goal';
      const sprintNum = sprint.sprint_number ?? '';
      const content   = `I just completed Sprint ${sprintNum} of ${goalTitle}!`;
      await fetch('/api/dreamline/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, type: 'sprint_complete', source_id: sprint.id }),
      }).catch(() => {});
      // Fallback to dream_line_posts table if dedicated endpoint not ready
      await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, post_type: 'sprint_complete', source_id: sprint.id }),
      }).catch(() => {});
    } finally {
      setSharing(false);
    }
    onClose();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-6"
      style={{ background: '#0a0a0f' }}
    >
      {/* Inner card */}
      <motion.div
        initial={{ scale: 0.75, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 18, stiffness: 300 }}
        className="w-full max-w-sm flex flex-col items-center text-center"
      >
        {/* Badge icon — 90px circle with amber-teal gradient border */}
        <div
          className="flex items-center justify-center rounded-full mb-5"
          style={{
            width: 90,
            height: 90,
            background: '#0a0a0f',
            border: '2px solid transparent',
            backgroundClip: 'padding-box',
            boxShadow: '0 0 0 2px transparent',
            position: 'relative',
          }}
        >
          {/* Gradient border workaround */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #F59E0B, #0EA5E9)',
              zIndex: 0,
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 2,
              borderRadius: '50%',
              background: '#0a0a0f',
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BadgeIcon size={44} />
          </div>
        </div>

        {/* Title */}
        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#ffffff', lineHeight: 1.2, marginBottom: 6 }}>
          Sprint complete!
        </h2>

        {/* Subtitle — sprint title */}
        <p style={{ fontSize: 15, color: '#6B7280', marginBottom: 20 }}>
          {sprint?.title ?? 'Weekly Sprint'}
        </p>

        {/* Stats row — 3 tiles */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 8,
            width: '100%',
            marginBottom: 20,
          }}
        >
          {[
            { label: 'Sprint', value: sprint?.sprint_number ? `#${sprint.sprint_number}` : '—' },
            { label: 'Week',   value: weekRange || '—' },
            { label: 'Done',   value: `${done}/${total}` },
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{
                background: '#111118',
                borderRadius: 12,
                padding: '10px 6px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
              }}
            >
              <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {label}
              </span>
              <span style={{ fontSize: 13, color: '#F0EBE0', fontWeight: 800 }}>
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* $VLG earned pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(245,158,11,0.12)',
            border: '1px solid rgba(245,158,11,0.25)',
            borderRadius: 999,
            padding: '6px 16px',
            marginBottom: 28,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, color: '#F59E0B' }}>+50 $VLG</span>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
          <button
            onClick={startNextSprint}
            style={{
              width: '100%',
              padding: '14px 20px',
              borderRadius: 16,
              background: '#0EA5E9',
              color: '#ffffff',
              fontSize: 15,
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            Start next sprint
            <ArrowRightIcon />
          </button>

          <button
            onClick={shareToDreamLine}
            disabled={sharing}
            style={{
              width: '100%',
              padding: '14px 20px',
              borderRadius: 16,
              background: '#1877F2',
              color: '#ffffff',
              fontSize: 15,
              fontWeight: 700,
              border: 'none',
              cursor: sharing ? 'not-allowed' : 'pointer',
              opacity: sharing ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            Share to DreamLine
            <ShareIcon />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Sprint page
// ---------------------------------------------------------------------------

export default function SprintPage({ params }: { params: { id: string } }) {
  const [sprint, setSprint]         = useState<any>(null);
  const [actions, setActions]       = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);
  const [celebrate, setCelebrate]   = useState(false);
  const [vlgFired, setVlgFired]     = useState(false);
  const [newBadges, setNewBadges]   = useState<string[]>([]);
  const confettiFired               = useRef(false);
  const router                      = useRouter();
  const { theme }                   = useVillageTheme();
  const isNight                     = theme === 'night';

  const bg     = isNight ? 'var(--v-bg)' : 'var(--v-bg)';
  const cardBg = isNight ? 'var(--v-card-bg)' : '#FFFFFF';
  const border = isNight ? 'var(--v-card-border)' : '#FED7AA';
  const text   = isNight ? '#F0EBE0' : '#1E1B4B';
  const muted  = isNight ? '#4A4F72' : '#6B7280';
  const accent = '#1877F2';

  useEffect(() => { load(); }, [params.id]);

  // Fire confetti when celebrate becomes true
  useEffect(() => {
    if (!celebrate || confettiFired.current) return;
    confettiFired.current = true;

    import('canvas-confetti').then(({ default: confetti }) => {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.4 } });
    }).catch(() => {});
  }, [celebrate]);

  // Reset confettiFired when celebrate is dismissed so it can fire again
  useEffect(() => {
    if (!celebrate) confettiFired.current = false;
  }, [celebrate]);

  async function load() {
    const found = await fetch(`/api/sprints?sprint_id=${params.id}`)
      .then(r => r.json())
      .catch(() => null);
    if (found) {
      setSprint(found);
      setActions(found.sprint_actions?.sort((a: any, b: any) => a.order_index - b.order_index) ?? []);
    }
    setLoading(false);
  }

  async function completeAction(actionId: string) {
    setCompleting(actionId);
    const updatedActions = actions.map(a =>
      a.id === actionId ? { ...a, completed: true, completed_at: new Date() } : a
    );
    setActions(updatedActions);

    const res = await fetch('/api/sprints', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action_id: actionId }),
    }).then(r => r.json()).catch(() => ({ ok: true }));

    setCompleting(null);

    if (res.sprint_completed) {
      setSprint((s: any) => s ? { ...s, status: 'completed' } : s);
      setNewBadges(res.new_badges ?? []);
      triggerCelebration();
    }
  }

  async function triggerCelebration() {
    if (celebrate) return;
    setCelebrate(true);
    // Award VLG once
    if (!vlgFired) {
      setVlgFired(true);
      await fetch('/api/vlg/earn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: 'sprint_complete',
          amount: 50,
          source_id: sprint?.id,
        }),
      }).catch(() => {});
    }
  }

  const done  = actions.filter(a => a.completed).length;
  const total = actions.length;
  const pct   = total ? Math.round((done / total) * 100) : 0;
  const circumference = 2 * Math.PI * 36;

  // Auto-trigger celebration when all actions are done
  useEffect(() => {
    if (done === total && total > 0 && !celebrate) {
      triggerCelebration();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, total]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: bg }}>
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!sprint) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: bg }}>
      <div className="text-center">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="mx-auto mb-3" aria-hidden="true">
          <circle cx="20" cy="20" r="18" stroke="#1877F2" strokeWidth="2" opacity="0.5" />
          <path d="M20 12v8M20 24v2" stroke="#1877F2" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        <p className="font-bold" style={{ color: text }}>Sprint not found</p>
        <Link href="/village/workshop" className="text-sm mt-2 block" style={{ color: accent }}>
          Back to Workshop
        </Link>
      </div>
    </div>
  );

  const weekStart = new Date(sprint.week_start);
  const weekEnd   = new Date(sprint.week_end);

  return (
    <div className="min-h-screen pb-24" style={{ background: bg }}>
      {/* Header */}
      <div
        className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 border-b"
        style={{ background: isNight ? 'var(--v-bg)' : '#fff', borderColor: border }}
      >
        <Link
          href={sprint.goal_id ? `/village/workshop/goal/${sprint.goal_id}` : '/village/workshop'}
          className="text-xl"
          style={{ color: muted }}
        >
          &larr;
        </Link>
        <div className="flex-1">
          <p className="font-black text-sm" style={{ color: text }}>Weekly Sprint</p>
          <p className="text-xs" style={{ color: muted }}>
            {weekStart.toLocaleDateString('en', { month: 'short', day: 'numeric' })} –{' '}
            {weekEnd.toLocaleDateString('en', { month: 'short', day: 'numeric' })}
          </p>
        </div>
        <span
          className={`text-xs font-bold px-3 py-1 rounded-full ${
            sprint.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
          }`}
        >
          {sprint.status === 'completed' ? 'Done' : 'Active'}
        </span>
      </div>

      {/* Full-screen celebration overlay */}
      <AnimatePresence>
        {celebrate && (
          <SprintCelebration
            sprint={sprint}
            done={done}
            total={total}
            onClose={() => setCelebrate(false)}
          />
        )}
      </AnimatePresence>

      <div className="max-w-md mx-auto px-4 py-5 space-y-5">
        {/* Progress ring */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl p-6 flex items-center gap-5"
          style={{ background: cardBg, border: `1px solid ${border}` }}
        >
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg className="w-20 h-20 -rotate-90">
              <circle
                cx="40" cy="40" r="36"
                fill="none"
                stroke={isNight ? 'var(--v-card-border)' : '#E5E7EB'}
                strokeWidth="7"
              />
              <circle
                cx="40" cy="40" r="36"
                fill="none"
                stroke={accent}
                strokeWidth="7"
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
            <h1 className="font-black text-base leading-tight" style={{ color: text }}>
              {sprint.title}
            </h1>
            {sprint.focus_intention && (
              <p className="text-xs mt-1 leading-relaxed italic" style={{ color: muted }}>
                &ldquo;{sprint.focus_intention}&rdquo;
              </p>
            )}
            <p className="text-xs mt-2 font-semibold" style={{ color: accent }}>
              {done}/{total} actions complete
            </p>
          </div>
        </motion.div>

        {/* Spirit's opening note */}
        {sprint.spirit_note && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl px-4 py-3 flex gap-3"
            style={{
              background: isNight ? 'rgba(24,119,242,0.08)' : '#EEF2FF',
              border: `1px solid ${isNight ? 'rgba(24,119,242,0.2)' : '#C7D2FE'}`,
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 mt-0.5" aria-hidden="true">
              <circle cx="12" cy="12" r="10" fill={isNight ? 'rgba(24,119,242,0.2)' : '#C7D2FE'} />
              <path d="M12 7v5l3 3" stroke={isNight ? '#93C5FD' : '#4338CA'} strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <p className="text-sm leading-relaxed italic" style={{ color: isNight ? '#93C5FD' : '#4338CA' }}>
              {sprint.spirit_note}
            </p>
          </motion.div>
        )}

        {/* Actions list */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: muted }}>
            This Week&apos;s Actions
          </p>
          <div className="space-y-2">
            {actions.map((action, i) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 rounded-2xl px-4 py-3.5"
                style={{
                  background: action.completed
                    ? (isNight ? 'rgba(34,197,94,0.08)' : '#F0FDF4')
                    : cardBg,
                  border: `1px solid ${action.completed
                    ? (isNight ? 'rgba(34,197,94,0.2)' : '#BBF7D0')
                    : border}`,
                  opacity: action.completed ? 0.8 : 1,
                }}
              >
                {/* Checkbox */}
                <button
                  onClick={() =>
                    !action.completed &&
                    sprint.status !== 'completed' &&
                    completeAction(action.id)
                  }
                  disabled={
                    action.completed ||
                    sprint.status === 'completed' ||
                    completing === action.id
                  }
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                  style={{
                    background: action.completed ? '#22C55E' : 'transparent',
                    border: `2px solid ${action.completed ? '#22C55E' : muted}`,
                    cursor: action.completed ? 'default' : 'pointer',
                  }}
                >
                  {completing === action.id ? (
                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                  ) : action.completed ? (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                      <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : null}
                </button>

                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium leading-tight"
                    style={{
                      color: text,
                      textDecoration: action.completed ? 'line-through' : 'none',
                      opacity: action.completed ? 0.6 : 1,
                    }}
                  >
                    {action.title}
                  </p>
                  {action.day_of_week && (
                    <p className="text-xs mt-0.5" style={{ color: muted }}>
                      {DAYS[action.day_of_week - 1]}
                    </p>
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
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: muted }}>
            Week at a Glance
          </p>
          <div className="grid grid-cols-7 gap-1.5">
            {DAYS.map((day, i) => {
              const dayActions    = actions.filter(a => a.day_of_week === i + 1);
              const dayCompleted  = dayActions.every(a => a.completed);
              const hasActions    = dayActions.length > 0;
              const today         = new Date().getDay();
              const adjustedToday = today === 0 ? 7 : today;
              const isToday       = adjustedToday === i + 1;

              return (
                <div key={day} className="flex flex-col items-center gap-1">
                  <p className="text-xs font-semibold" style={{ color: isToday ? accent : muted }}>
                    {day}
                  </p>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      background: !hasActions
                        ? (isNight ? 'var(--v-card-border)' : '#F3F4F6')
                        : dayCompleted
                          ? 'rgba(34,197,94,0.2)'
                          : (isNight ? '#1A1F3A' : '#EEF2FF'),
                      border: isToday ? `2px solid ${accent}` : '2px solid transparent',
                      color: dayCompleted ? '#22C55E' : hasActions ? accent : muted,
                    }}
                  >
                    {!hasActions ? '·' : dayCompleted ? (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                        <path d="M1 4l3 3 5-6" stroke="#22C55E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : dayActions.length}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Complete sprint button — shown when all done but celebrate hasn't fired yet */}
        {sprint.status === 'active' && done > 0 && done === total && !celebrate && (
          <button
            onClick={async () => {
              const res = await fetch('/api/sprints', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sprint_id: sprint.id }),
              }).then(r => r.json()).catch(() => ({}));
              setSprint((s: any) => ({ ...s, status: 'completed' }));
              setNewBadges(res.new_badges ?? []);
              triggerCelebration();
            }}
            className="w-full py-4 rounded-2xl font-black text-white text-base"
            style={{ background: 'linear-gradient(135deg,#22C55E,#16A34A)' }}
          >
            Complete Sprint
          </button>
        )}
      </div>
    </div>
  );
}
