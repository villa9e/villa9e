'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Phase = 'idle' | 'inhale' | 'hold' | 'exhale' | 'rest';

const SESSIONS = [
  { label: '5 min', minutes: 5, desc: 'Quick reset' },
  { label: '10 min', minutes: 10, desc: 'Deep focus' },
  { label: '20 min', minutes: 20, desc: 'Full restore' },
];

const GUIDES = [
  { id: 'box', label: 'Box Breathing', desc: '4-4-4-4 · Stress relief', phases: ['inhale', 'hold', 'exhale', 'rest'] as Phase[], durations: [4, 4, 4, 4] },
  { id: '478', label: '4-7-8 Method', desc: '4-7-8 · Sleep & calm', phases: ['inhale', 'hold', 'exhale'] as Phase[], durations: [4, 7, 8] },
  { id: 'deep', label: 'Deep Breathing', desc: '6-0-6 · Anxiety relief', phases: ['inhale', 'exhale'] as Phase[], durations: [6, 6] },
];

const PHASE_LABELS: Record<Phase, string> = {
  idle: '', inhale: 'Breathe In', hold: 'Hold', exhale: 'Breathe Out', rest: 'Rest',
};
const PHASE_SCALE: Record<Phase, number> = {
  idle: 1, inhale: 1.4, hold: 1.4, exhale: 0.85, rest: 0.85,
};

export default function MeditatePage() {
  const router = useRouter();
  const supabase = createClient();

  const [selectedSession, setSelectedSession] = useState(SESSIONS[0]);
  const [selectedGuide, setSelectedGuide] = useState(GUIDES[0]);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);

  const [totalSeconds, setTotalSeconds] = useState(SESSIONS[0].minutes * 60);
  const [elapsed, setElapsed] = useState(0);

  const [phase, setPhase] = useState<Phase>('idle');
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [cycle, setCycle] = useState(0);

  const phaseIdx = useRef(0);
  const phaseTick = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const guide = selectedGuide;

  const tick = useCallback(() => {
    setElapsed(e => {
      const next = e + 1;
      if (next >= totalSeconds) {
        setRunning(false);
        setCompleted(true);
        setPhase('idle');
        return totalSeconds;
      }
      return next;
    });

    phaseTick.current += 1;
    const currentDuration = guide.durations[phaseIdx.current % guide.durations.length];

    setPhaseProgress(phaseTick.current / currentDuration);

    if (phaseTick.current >= currentDuration) {
      phaseIdx.current = (phaseIdx.current + 1) % guide.phases.length;
      phaseTick.current = 0;
      setPhase(guide.phases[phaseIdx.current]);
      if (phaseIdx.current === 0) setCycle(c => c + 1);
    }
  }, [totalSeconds, guide]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(tick, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, tick]);

  function start() {
    setTotalSeconds(selectedSession.minutes * 60);
    setElapsed(0);
    phaseIdx.current = 0;
    phaseTick.current = 0;
    setCycle(0);
    setPhase(guide.phases[0]);
    setPhaseProgress(0);
    setCompleted(false);
    setRunning(true);
  }

  function stop() {
    setRunning(false);
    setPhase('idle');
    setPhaseProgress(0);
  }

  async function saveSession() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    await (supabase as any).from('wellness_logs').upsert({
      user_id: user.id,
      log_date: today,
      ai_insight: `Completed ${selectedSession.label} ${guide.label} meditation`,
    }, { onConflict: 'user_id,log_date' });
  }

  useEffect(() => {
    if (completed) saveSession();
  }, [completed]);

  const remaining = totalSeconds - elapsed;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const progressPct = elapsed / totalSeconds;

  const ringR = 110;
  const ringC = 2 * Math.PI * ringR;

  if (completed) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,var(--v-card-bg) 0%,var(--v-bg) 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 72, marginBottom: 16 }}>🧘</div>
          <p style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 8 }}>Session Complete</p>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', marginBottom: 8 }}>{selectedSession.label} · {guide.label}</p>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', marginBottom: 32 }}>{cycle} breath cycles completed</p>

          <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 16, padding: '14px 20px', marginBottom: 32 }}>
            <p style={{ fontSize: 13, color: '#34D399', fontWeight: 700 }}>✓ Session logged to your wellness record</p>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <motion.button whileTap={{ scale: 0.97 }} onClick={start}
              style={{ flex: 1, padding: '14px 0', borderRadius: 14, background: 'rgba(255,255,255,0.08)', color: '#fff', fontWeight: 800, fontSize: 15, border: 'none', cursor: 'pointer' }}>
              Go again
            </motion.button>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => router.push('/village/zen')}
              style={{ flex: 1, padding: '14px 0', borderRadius: 14, background: 'linear-gradient(135deg,#0EA5E9,#0284C7)', color: '#fff', fontWeight: 900, fontSize: 15, border: 'none', cursor: 'pointer' }}>
              Done
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,var(--v-card-bg) 0%,var(--v-bg) 100%)', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={() => router.push('/village/zen')}
          style={{ width: 36, height: 36, borderRadius: 18, background: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', marginRight: 12 }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <p style={{ fontSize: 18, fontWeight: 900 }}>Meditate</p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 16px 40px' }}>
        {!running ? (
          <>
            {/* Duration picker */}
            <p style={{ fontSize: 12, fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', marginBottom: 12 }}>SESSION LENGTH</p>
            <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
              {SESSIONS.map(s => (
                <button key={s.label} onClick={() => setSelectedSession(s)}
                  style={{ flex: 1, padding: '14px 0', borderRadius: 14, background: selectedSession.label === s.label ? 'rgba(14,165,233,0.2)' : 'rgba(255,255,255,0.04)', border: selectedSession.label === s.label ? '1.5px solid #0EA5E9' : '1.5px solid rgba(255,255,255,0.08)', cursor: 'pointer', textAlign: 'center' }}>
                  <p style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{s.label}</p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{s.desc}</p>
                </button>
              ))}
            </div>

            {/* Guide picker */}
            <p style={{ fontSize: 12, fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', marginBottom: 12 }}>BREATHING GUIDE</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 40 }}>
              {GUIDES.map(g => (
                <button key={g.id} onClick={() => setSelectedGuide(g)}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 14, background: selectedGuide.id === g.id ? 'rgba(14,165,233,0.12)' : 'rgba(255,255,255,0.04)', border: selectedGuide.id === g.id ? '1.5px solid #0EA5E9' : '1.5px solid rgba(255,255,255,0.06)', cursor: 'pointer', textAlign: 'left' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 22, background: selectedGuide.id === g.id ? 'rgba(14,165,233,0.2)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={selectedGuide.id === g.id ? '#0EA5E9' : 'rgba(255,255,255,0.4)'} strokeWidth="2" strokeLinecap="round"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" /><path d="M12 6v6l4 2" /></svg>
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{g.label}</p>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{g.desc}</p>
                  </div>
                  {selectedGuide.id === g.id && (
                    <div style={{ marginLeft: 'auto', width: 20, height: 20, borderRadius: 10, background: '#0EA5E9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                  )}
                </button>
              ))}
            </div>

            <motion.button whileTap={{ scale: 0.97 }} onClick={start}
              style={{ width: '100%', padding: '18px 0', borderRadius: 16, background: 'linear-gradient(135deg,#0EA5E9,#0284C7)', color: '#fff', fontWeight: 900, fontSize: 18, border: 'none', cursor: 'pointer', boxShadow: '0 8px 32px rgba(14,165,233,0.35)' }}>
              Begin Session
            </motion.button>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 20 }}>
            {/* Outer progress ring */}
            <div style={{ position: 'relative', width: 260, height: 260, marginBottom: 32 }}>
              <svg width={260} height={260} style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
                <circle cx={130} cy={130} r={ringR} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
                <circle cx={130} cy={130} r={ringR} fill="none" stroke="#0EA5E9" strokeWidth={6}
                  strokeDasharray={ringC} strokeDashoffset={ringC * (1 - progressPct)} strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s linear' }} />
              </svg>

              {/* Breathing orb */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <motion.div
                  animate={{ scale: PHASE_SCALE[phase] }}
                  transition={{ duration: guide.durations[phaseIdx.current % guide.durations.length], ease: phase === 'inhale' ? 'easeIn' : phase === 'exhale' ? 'easeOut' : 'linear' }}
                  style={{
                    width: 120, height: 120, borderRadius: 60,
                    background: 'radial-gradient(circle at 38% 38%, rgba(14,165,233,0.9), rgba(2,132,199,0.6))',
                    boxShadow: '0 0 60px rgba(14,165,233,0.5), 0 0 120px rgba(14,165,233,0.2)',
                  }}
                />
              </div>

              {/* Timer */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <p style={{ fontSize: 36, fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                  {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
                </p>
              </div>
            </div>

            {/* Phase label */}
            <AnimatePresence mode="wait">
              <motion.p key={phase} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 8, minHeight: 32 }}>
                {PHASE_LABELS[phase]}
              </motion.p>
            </AnimatePresence>

            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>{guide.label}</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', marginBottom: 48 }}>Cycle {cycle + 1}</p>

            <motion.button whileTap={{ scale: 0.97 }} onClick={stop}
              style={{ padding: '12px 40px', borderRadius: 50, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
              End Session
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}
