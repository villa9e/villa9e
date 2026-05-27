'use client';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { awardScore } from '@/lib/village/score';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';

type Pattern = { name: string; inhale: number; hold: number; exhale: number; hold2: number; desc: string; rounds: number };

const PATTERNS: Pattern[] = [
  { name: 'Box Breathing',  inhale: 4, hold: 4, exhale: 4, hold2: 4, desc: 'Equal sides — reduces stress, sharpens focus', rounds: 6 },
  { name: '4-7-8 Method',   inhale: 4, hold: 7, exhale: 8, hold2: 0, desc: 'For sleep, anxiety, relaxation', rounds: 4 },
  { name: 'Power Breath',   inhale: 5, hold: 2, exhale: 5, hold2: 0, desc: 'Energizing — use before big moments', rounds: 8 },
  { name: 'Calm Breath',    inhale: 3, hold: 0, exhale: 6, hold2: 0, desc: 'Extended exhale activates your calm system', rounds: 10 },
];

type Phase = 'inhale' | 'hold' | 'exhale' | 'hold2' | 'done';

export default function BreathworkPage() {
  const [selected, setSelected] = useState<Pattern | null>(null);
  const [phase, setPhase] = useState<Phase>('inhale');
  const [count, setCount] = useState(0);
  const [round, setRound] = useState(0);
  const [running, setRunning] = useState(false);
  const [complete, setComplete] = useState(false);
  const intervalRef = useRef<any>(null);
  const supabase = createClient();
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';

  const bg     = isNight
    ? 'linear-gradient(160deg, #040A0E 0%, #061218 50%, #040E14 100%)'
    : 'linear-gradient(160deg, #ECFDF5 0%, #F0FDFA 50%, #ECFDF5 100%)';
  const card   = isNight ? '#0D1A20' : '#FFFFFF';
  const border = isNight ? '#1A3030' : '#99F6E4';
  const text   = isNight ? '#F0EBE0' : '#064E3B';
  const muted  = isNight ? '#4A7060' : '#065F46';
  const sub    = isNight ? '#2A4A40' : '#A7F3D0';
  const accent = isNight ? '#34D399' : '#059669';

  function getPhaseLabel(p: Phase, pattern: Pattern) {
    if (p === 'inhale') return `Inhale — ${pattern.inhale}s`;
    if (p === 'hold')   return `Hold — ${pattern.hold}s`;
    if (p === 'exhale') return `Exhale — ${pattern.exhale}s`;
    if (p === 'hold2')  return `Hold — ${pattern.hold2}s`;
    return 'Done';
  }

  function getPhaseDuration(p: Phase, pattern: Pattern) {
    if (p === 'inhale') return pattern.inhale;
    if (p === 'hold')   return pattern.hold;
    if (p === 'exhale') return pattern.exhale;
    if (p === 'hold2')  return pattern.hold2;
    return 0;
  }

  function nextPhase(currentPhase: Phase, pattern: Pattern, currentRound: number): { phase: Phase; round: number; done: boolean } {
    if (currentPhase === 'inhale') return { phase: pattern.hold > 0 ? 'hold' : 'exhale', round: currentRound, done: false };
    if (currentPhase === 'hold')   return { phase: 'exhale', round: currentRound, done: false };
    if (currentPhase === 'exhale') {
      if (pattern.hold2 > 0) return { phase: 'hold2', round: currentRound, done: false };
      const newRound = currentRound + 1;
      if (newRound >= pattern.rounds) return { phase: 'done', round: newRound, done: true };
      return { phase: 'inhale', round: newRound, done: false };
    }
    if (currentPhase === 'hold2') {
      const newRound = currentRound + 1;
      if (newRound >= pattern.rounds) return { phase: 'done', round: newRound, done: true };
      return { phase: 'inhale', round: newRound, done: false };
    }
    return { phase: 'done', round: currentRound, done: true };
  }

  useEffect(() => {
    if (!running || !selected) return;
    const duration = getPhaseDuration(phase, selected);
    setCount(duration);

    intervalRef.current = setInterval(() => {
      setCount(c => {
        if (c <= 1) {
          clearInterval(intervalRef.current);
          const { phase: nextP, round: nextR, done } = nextPhase(phase, selected, round);
          if (done) {
            setRunning(false);
            setComplete(true);
            setPhase('done');
            awardScore('DAILY_MINDFUL_MOMENT');
            supabase.auth.getUser().then(({ data: { user } }) => {
              if (user) {
                supabase.from('mindful_moments').insert({
                  user_id: user.id, session_type: 'breathwork',
                  mood: 'neutral', mood_score: 5, energy_level: 7,
                  app_route: 'zen/breathwork',
                });
              }
            });
          } else {
            setPhase(nextP);
            setRound(nextR);
          }
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [running, phase, selected]);

  function start() {
    if (!selected) return;
    setPhase('inhale'); setRound(0); setComplete(false);
    setRunning(true);
  }

  function stop() {
    clearInterval(intervalRef.current);
    setRunning(false);
    setPhase('inhale'); setRound(0); setCount(0);
  }

  const circleScale = phase === 'inhale' ? 1.4 : phase === 'exhale' ? 0.7 : 1;

  return (
    <div className="min-h-screen pb-24" style={{ background: bg }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 py-3.5 flex items-center gap-3"
        style={{ background: isNight ? 'rgba(4,10,14,0.9)' : 'rgba(236,253,245,0.9)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${border}` }}>
        <Link href="/village/zen" className="text-xl" style={{ color: muted }}>←</Link>
        <span className="text-2xl">🌿</span>
        <h1 className="text-lg font-black" style={{ color: text }}>Breathwork</h1>
      </div>

      <div className="max-w-md mx-auto p-6 space-y-6">
        {complete ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 space-y-5">
            <div className="text-7xl animate-float">🌿</div>
            <h2 className="text-2xl font-black" style={{ color: text }}>Session Complete</h2>
            <p className="text-sm" style={{ color: muted }}>{selected?.rounds} rounds of {selected?.name}. +5 $VLG earned.</p>
            <button onClick={() => { setComplete(false); setSelected(null); }}
              className="font-bold text-white rounded-full px-8 py-3.5 text-base"
              style={{ background: accent }}>
              Back to Zen
            </button>
          </motion.div>
        ) : !selected ? (
          <>
            <p className="text-center text-sm" style={{ color: muted }}>Choose a breathing pattern to begin.</p>
            <div className="space-y-3">
              {PATTERNS.map(p => (
                <motion.button key={p.name} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setSelected(p)}
                  className="w-full text-left p-4 rounded-2xl transition-all"
                  style={{ background: card, border: `1px solid ${border}` }}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold" style={{ color: text }}>{p.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: muted }}>{p.desc}</p>
                    </div>
                    <div className="text-right text-xs font-bold flex-shrink-0" style={{ color: accent }}>
                      {p.rounds} rounds
                    </div>
                  </div>
                  <div className="flex gap-3 mt-2 text-xs" style={{ color: isNight ? '#2A4A40' : '#6EE7B7' }}>
                    <span>Inhale {p.inhale}s</span>
                    {p.hold > 0 && <span>Hold {p.hold}s</span>}
                    <span>Exhale {p.exhale}s</span>
                    {p.hold2 > 0 && <span>Hold {p.hold2}s</span>}
                  </div>
                </motion.button>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center space-y-8">
            <div>
              <p className="font-black text-lg" style={{ color: text }}>{selected.name}</p>
              <p className="text-sm" style={{ color: muted }}>
                Round {Math.min(round + 1, selected.rounds)} of {selected.rounds}
              </p>
            </div>

            {/* Breathing circle */}
            <div className="flex items-center justify-center h-52">
              <div className="relative">
                {/* Outer glow ring */}
                <motion.div
                  animate={{ scale: running ? circleScale * 1.15 : 1, opacity: running ? 0.4 : 0.15 }}
                  transition={{ duration: count > 0 ? count : 1, ease: 'easeInOut' }}
                  className="absolute inset-0 rounded-full"
                  style={{ background: accent, filter: 'blur(20px)', transform: 'scale(1.3)' }}
                />
                <motion.div
                  animate={{ scale: running ? circleScale : 1 }}
                  transition={{ duration: count > 0 ? count : 1, ease: 'easeInOut' }}
                  className="relative w-40 h-40 rounded-full flex items-center justify-center shadow-2xl"
                  style={{ background: `radial-gradient(circle at 40% 35%, ${isNight ? '#22C55E' : '#34D399'}, ${isNight ? '#059669' : '#0D9488'})` }}
                >
                  <div className="text-center text-white">
                    {running ? (
                      <>
                        <p className="text-5xl font-black">{count}</p>
                        <p className="text-xs mt-1 uppercase tracking-widest opacity-80">
                          {phase === 'inhale' ? 'Inhale' : phase === 'exhale' ? 'Exhale' : 'Hold'}
                        </p>
                      </>
                    ) : (
                      <span className="text-5xl">🌿</span>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>

            {running && (
              <p className="text-sm font-semibold" style={{ color: accent }}>
                {getPhaseLabel(phase, selected)}
              </p>
            )}

            <div className="flex gap-3">
              <button onClick={() => { stop(); setSelected(null); }}
                className="flex-1 rounded-full py-3.5 font-semibold transition-all"
                style={{ border: `1px solid ${border}`, color: muted, background: 'transparent' }}>
                ← Back
              </button>
              {!running ? (
                <button onClick={start}
                  className="flex-1 text-white rounded-full py-3.5 font-black transition-all"
                  style={{ background: accent }}>
                  Begin Session
                </button>
              ) : (
                <button onClick={stop}
                  className="flex-1 rounded-full py-3.5 font-semibold transition-all"
                  style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                  Stop
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
