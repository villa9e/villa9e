'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const SESSION_OPTIONS = [5, 10, 15, 20] as const;
type SessionMinutes = typeof SESSION_OPTIONS[number];

const BREATHING_CYCLE: { label: string; duration: number }[] = [
  { label: 'Breathe in...', duration: 4 },
  { label: 'Hold...',       duration: 4 },
  { label: 'Breathe out...', duration: 4 },
  { label: 'Hold...',       duration: 4 },
];

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="white" strokeWidth="2.5" strokeLinecap="round">
      <path d="M15 18l-6-6 6-6"/>
    </svg>
  );
}

export default function MeditatePage() {
  const router   = useRouter();
  const supabase = createClient();

  const [sessionMins,  setSessionMins]  = useState<SessionMinutes>(10);
  const [running,      setRunning]      = useState(false);
  const [elapsed,      setElapsed]      = useState(0);
  const [completed,    setCompleted]    = useState(false);

  // Breathing cycle state
  const [phaseIdx,     setPhaseIdx]     = useState(0);
  const [phaseSecs,    setPhaseSecs]    = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSeconds = sessionMins * 60;
  const remaining    = totalSeconds - elapsed;
  const mins         = Math.floor(remaining / 60);
  const secs         = remaining % 60;

  const currentPhase = BREATHING_CYCLE[phaseIdx];
  const breathScale  = currentPhase.label.startsWith('Breathe in') || currentPhase.label === 'Hold...'
    ? (phaseSecs < currentPhase.duration / 2 ? 1.4 : 1.4)
    : 1;

  // Breathing orb target scale
  const orbScale = (() => {
    if (!running) return 1;
    if (currentPhase.label.startsWith('Breathe in'))  return 1.4;
    if (currentPhase.label.startsWith('Hold'))
      return phaseIdx === 1 ? 1.4 : 1; // hold-in: large, hold-out: small
    return 1; // breathe out
  })();

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setElapsed(e => {
        const next = e + 1;
        if (next >= totalSeconds) {
          setRunning(false);
          setCompleted(true);
          clearInterval(intervalRef.current!);
          return totalSeconds;
        }
        return next;
      });

      setPhaseSecs(ps => {
        const next = ps + 1;
        if (next >= currentPhase.duration) {
          setPhaseIdx(idx => (idx + 1) % BREATHING_CYCLE.length);
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, totalSeconds, currentPhase.duration]);

  function start() {
    setElapsed(0);
    setPhaseSecs(0);
    setPhaseIdx(0);
    setCompleted(false);
    setRunning(true);
  }

  function stop() {
    setRunning(false);
    setElapsed(0);
    setPhaseSecs(0);
    setPhaseIdx(0);
  }

  async function saveSession() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    await (supabase as any).from('wellness_logs').upsert({
      user_id: user.id,
      log_date: today,
      ai_insight: `Completed ${sessionMins}-minute meditation session`,
    }, { onConflict: 'user_id,log_date' });
  }

  useEffect(() => {
    if (completed) saveSession();
  }, [completed]);

  // ── Completed screen ──────────────────────────────────────────────────────────
  if (completed) {
    return (
      <div style={{
        minHeight: '100vh', background: '#080E24', color: '#fff',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32,
      }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          style={{ textAlign: 'center', width: '100%', maxWidth: 320 }}>

          {/* Check icon circle */}
          <div style={{
            width: 80, height: 80, borderRadius: '50%', margin: '0 auto 24px',
            background: 'rgba(16,185,129,0.15)', border: '1.5px solid rgba(16,185,129,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>

          <p style={{ fontSize: 26, fontWeight: 900, marginBottom: 8 }}>Session Complete</p>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', marginBottom: 32 }}>
            {sessionMins} minutes
          </p>

          <div style={{
            background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
            borderRadius: 14, padding: '12px 16px', marginBottom: 32,
          }}>
            <p style={{ fontSize: 13, color: '#34D399', fontWeight: 600 }}>
              Logged to your wellness record
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <motion.button whileTap={{ scale: 0.97 }} onClick={start}
              style={{
                flex: 1, padding: '14px 0', borderRadius: 14,
                background: 'rgba(255,255,255,0.07)', color: '#fff',
                fontWeight: 800, fontSize: 15, border: 'none', cursor: 'pointer',
              }}>
              Go again
            </motion.button>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => router.push('/village/zen')}
              style={{
                flex: 1, padding: '14px 0', borderRadius: 14,
                background: '#2952E8', color: '#fff',
                fontWeight: 900, fontSize: 15, border: 'none', cursor: 'pointer',
              }}>
              Done
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Main screen ───────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh', background: '#080E24', color: '#fff',
      display: 'flex', flexDirection: 'column',
    }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', padding: '14px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <button
          onClick={() => router.push('/village/zen')}
          style={{
            width: 36, height: 36, borderRadius: 18, background: 'rgba(255,255,255,0.07)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: 'none', cursor: 'pointer', marginRight: 12,
          }}>
          <BackIcon />
        </button>
        <p style={{ fontSize: 18, fontWeight: 900 }}>Meditate</p>
      </div>

      {running ? (
        /* ── ACTIVE SESSION ── */
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: '32px 24px',
        }}>

          {/* Timer */}
          <p style={{
            fontSize: 48, fontWeight: 900, letterSpacing: '-0.04em',
            fontVariantNumeric: 'tabular-nums', marginBottom: 48,
            color: '#fff',
          }}>
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </p>

          {/* Breathing orb */}
          <div style={{ position: 'relative', width: 200, height: 200, marginBottom: 48 }}>
            <motion.div
              animate={{ scale: orbScale }}
              transition={{
                duration: currentPhase.duration,
                ease: currentPhase.label.startsWith('Breathe in') ? 'easeIn'
                    : currentPhase.label.startsWith('Breathe out') ? 'easeOut'
                    : 'linear',
              }}
              style={{
                position: 'absolute', inset: 0,
                borderRadius: '50%',
                background: 'radial-gradient(circle at 38% 38%, rgba(77,114,255,0.85), rgba(41,82,232,0.55))',
                boxShadow: '0 0 60px rgba(77,114,255,0.4), 0 0 120px rgba(41,82,232,0.2)',
              }}
            />
          </div>

          {/* Phase label */}
          <AnimatePresence mode="wait">
            <motion.p
              key={phaseIdx}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 40, minHeight: 30 }}>
              {currentPhase.label}
            </motion.p>
          </AnimatePresence>

          {/* End button */}
          <motion.button whileTap={{ scale: 0.97 }} onClick={stop}
            style={{
              padding: '12px 40px', borderRadius: 50,
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.6)', fontWeight: 700, fontSize: 15, cursor: 'pointer',
            }}>
            End Session
          </motion.button>
        </div>
      ) : (
        /* ── SETUP SCREEN ── */
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 20px 60px' }}>

          {/* Session length */}
          <p style={{ fontSize: 12, fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', marginBottom: 14 }}>
            SESSION LENGTH
          </p>
          <div style={{ display: 'flex', gap: 10, marginBottom: 40 }}>
            {SESSION_OPTIONS.map(m => (
              <button key={m} onClick={() => setSessionMins(m)}
                style={{
                  flex: 1, padding: '16px 0', borderRadius: 14, textAlign: 'center',
                  background: sessionMins === m ? 'rgba(41,82,232,0.2)' : 'rgba(255,255,255,0.04)',
                  border: sessionMins === m ? '1.5px solid #2952E8' : '1.5px solid rgba(255,255,255,0.08)',
                  cursor: 'pointer',
                }}>
                <p style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>{m}</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>min</p>
              </button>
            ))}
          </div>

          {/* Preview orb */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 48 }}>
            <motion.div
              animate={{ scale: [1, 1.4, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                width: 140, height: 140, borderRadius: '50%',
                background: 'radial-gradient(circle at 38% 38%, rgba(77,114,255,0.7), rgba(41,82,232,0.45))',
                boxShadow: '0 0 50px rgba(77,114,255,0.3)',
              }}
            />
            <p style={{ marginTop: 20, fontSize: 15, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
              Breathe in... Hold... Breathe out... Hold...
            </p>
          </div>

          {/* Begin button */}
          <motion.button whileTap={{ scale: 0.97 }} onClick={start}
            style={{
              width: '100%', padding: '18px 0', borderRadius: 16,
              background: '#2952E8', color: '#fff',
              fontWeight: 900, fontSize: 18, border: 'none', cursor: 'pointer',
              boxShadow: '0 8px 32px rgba(41,82,232,0.35)',
            }}>
            Begin Session
          </motion.button>
        </div>
      )}
    </div>
  );
}
