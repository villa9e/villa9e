'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { awardScore } from '@/lib/village/score';

type Pattern = { name: string; inhale: number; hold: number; exhale: number; hold2: number; desc: string; rounds: number };

const PATTERNS: Pattern[] = [
  { name: 'Box Breathing', inhale: 4, hold: 4, exhale: 4, hold2: 4, desc: 'Equal sides — reduces stress, sharpens focus', rounds: 6 },
  { name: '4-7-8 Method', inhale: 4, hold: 7, exhale: 8, hold2: 0, desc: 'For sleep, anxiety, relaxation', rounds: 4 },
  { name: 'Power Breath', inhale: 5, hold: 2, exhale: 5, hold2: 0, desc: 'Energizing — use before big moments', rounds: 8 },
  { name: 'Calm Breath', inhale: 3, hold: 0, exhale: 6, hold2: 0, desc: 'Extended exhale activates your calm system', rounds: 10 },
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

  function getPhaseLabel(p: Phase, pattern: Pattern) {
    if (p === 'inhale') return `Inhale — ${pattern.inhale}s`;
    if (p === 'hold') return `Hold — ${pattern.hold}s`;
    if (p === 'exhale') return `Exhale — ${pattern.exhale}s`;
    if (p === 'hold2') return `Hold — ${pattern.hold2}s`;
    return 'Done';
  }

  function getPhaseDuration(p: Phase, pattern: Pattern) {
    if (p === 'inhale') return pattern.inhale;
    if (p === 'hold') return pattern.hold;
    if (p === 'exhale') return pattern.exhale;
    if (p === 'hold2') return pattern.hold2;
    return 0;
  }

  function nextPhase(currentPhase: Phase, pattern: Pattern, currentRound: number): { phase: Phase; round: number; done: boolean } {
    if (currentPhase === 'inhale') return { phase: pattern.hold > 0 ? 'hold' : 'exhale', round: currentRound, done: false };
    if (currentPhase === 'hold') return { phase: 'exhale', round: currentRound, done: false };
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
    if (duration === 0) {
      const next = nextPhase(phase, selected, round);
      setPhase(next.phase); setRound(next.round);
      if (next.done) { setRunning(false); handleComplete(); }
      return;
    }

    setCount(duration);
    intervalRef.current = setInterval(() => {
      setCount(c => {
        if (c <= 1) {
          clearInterval(intervalRef.current);
          const next = nextPhase(phase, selected, round);
          setPhase(next.phase); setRound(next.round);
          if (next.done) { setRunning(false); handleComplete(); }
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [phase, running, selected]);

  async function handleComplete() {
    setComplete(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('mindful_moments').insert({
        user_id: user.id, type: 'breathwork', session_type: 'breathwork',
        notes: `Completed ${selected?.name}`,
      });
      await awardScore('DAILY_MINDFUL_MOMENT');
    }
  }

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
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white">
      <div className="bg-teal-600 text-white px-6 py-4 flex items-center gap-3">
        <Link href="/village/zen" className="text-xl">←</Link>
        <span className="text-2xl">🌿</span>
        <h1 className="text-xl font-bold">Breathwork</h1>
      </div>

      <div className="max-w-md mx-auto p-6 space-y-6">
        {complete ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12 space-y-4">
            <div className="text-6xl animate-float">🌿</div>
            <h2 className="text-2xl font-bold text-teal-700">Session Complete</h2>
            <p className="text-gray-500">{selected?.rounds} rounds of {selected?.name}. +5 $VLG earned.</p>
            <button onClick={() => { setComplete(false); setSelected(null); }}
              className="village-btn-primary w-full">Back to Zen</button>
          </motion.div>
        ) : !selected ? (
          <>
            <p className="text-center text-gray-500 text-sm">Choose a breathing pattern to begin.</p>
            <div className="space-y-3">
              {PATTERNS.map(p => (
                <motion.button key={p.name} whileHover={{ scale: 1.01 }} onClick={() => setSelected(p)}
                  className="w-full village-card text-left hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold">{p.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{p.desc}</p>
                    </div>
                    <div className="text-right text-xs text-teal-600 font-medium flex-shrink-0">
                      {p.rounds} rounds
                    </div>
                  </div>
                  <div className="flex gap-3 mt-2 text-xs text-gray-400">
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
              <p className="font-bold text-lg">{selected.name}</p>
              <p className="text-sm text-gray-500">Round {Math.min(round + 1, selected.rounds)} of {selected.rounds}</p>
            </div>

            {/* Breathing circle */}
            <div className="flex items-center justify-center h-48">
              <motion.div
                animate={{ scale: running ? circleScale : 1 }}
                transition={{ duration: count > 0 ? count : 1, ease: 'easeInOut' }}
                className="w-40 h-40 rounded-full bg-gradient-to-br from-teal-300 to-teal-500 flex items-center justify-center shadow-xl"
              >
                <div className="text-center text-white">
                  {running ? (
                    <>
                      <p className="text-4xl font-bold">{count}</p>
                      <p className="text-xs mt-1 uppercase tracking-wide opacity-80">
                        {phase === 'inhale' ? 'Inhale' : phase === 'exhale' ? 'Exhale' : 'Hold'}
                      </p>
                    </>
                  ) : (
                    <span className="text-4xl">🌿</span>
                  )}
                </div>
              </motion.div>
            </div>

            {running && (
              <p className="text-sm text-gray-600 font-medium">{getPhaseLabel(phase, selected)}</p>
            )}

            <div className="flex gap-3">
              <button onClick={() => setSelected(null)} className="flex-1 border border-gray-200 rounded-full py-3 text-gray-500">
                ← Back
              </button>
              {!running ? (
                <button onClick={start} className="flex-1 bg-teal-600 text-white rounded-full py-3 font-bold hover:bg-teal-700">
                  Begin Session
                </button>
              ) : (
                <button onClick={stop} className="flex-1 bg-red-50 text-red-600 rounded-full py-3 font-medium border border-red-100">
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
