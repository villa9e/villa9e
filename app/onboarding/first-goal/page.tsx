'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

const GOAL_STARTERS = [
  'Record and release my first EP on Spotify',
  'Launch my own business within 6 months',
  'Get in the best shape of my life this year',
  'Pay off $10,000 in debt in 12 months',
  'Learn to code and land my first dev job',
  'Write and publish my first book',
  'Build a 6-figure income stream online',
  'Earn my college degree while working full-time',
];

type Phase = 'input' | 'analyzing' | 'result' | 'saving';

export default function FirstGoalOnboarding() {
  const router = useRouter();
  const supabase = createClient();
  const [phase, setPhase] = useState<Phase>('input');
  const [goalText, setGoalText] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Typewriter effect for analyzing messages
  const analyzingMsgs = [
    'Reading your goal…',
    'Calculating success probability…',
    'Building your GPS steps…',
    'Estimating timeline and cost…',
    'Identifying who you\'ll need…',
    'Finalizing your plan…',
  ];
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    if (phase !== 'analyzing') return;
    const interval = setInterval(() => {
      setMsgIdx(i => (i + 1) % analyzingMsgs.length);
    }, 1200);
    return () => clearInterval(interval);
  }, [phase]);

  async function analyzeGoal() {
    if (!goalText.trim()) return;
    setPhase('analyzing');
    setMsgIdx(0);
    setError('');
    try {
      const res = await fetch('/api/claude/goal-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: goalText }),
      });
      const data = await res.json();
      if (data.probability_score) {
        setAnalysis(data);
        setPhase('result');
      } else {
        throw new Error('Invalid response');
      }
    } catch {
      setError('Spirit had trouble analyzing that goal. Try rephrasing it.');
      setPhase('input');
    }
  }

  async function saveGoalAndContinue() {
    setPhase('saving');
    try {
      await fetch('/api/goals/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: goalText,
          ai_analysis: analysis,
          estimated_weeks: analysis?.estimated_weeks,
          from_onboarding: true,
        }),
      });
    } catch { /* non-blocking */ }
    router.push('/onboarding/profile');
  }

  const score = analysis?.probability_score ?? 0;
  const scoreColor = score >= 70 ? '#4ade80' : score >= 50 ? '#fbbf24' : '#f87171';

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white flex flex-col overflow-hidden">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#1877F2]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/3 w-[200px] h-[200px] bg-emerald-500/8 rounded-full blur-[60px]" />
      </div>

      {/* Progress */}
      <div className="relative z-10 flex justify-center gap-2 pt-10 pb-2">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i === 2 ? 'w-8 bg-[#1877F2]' : i < 2 ? 'w-4 bg-[#1877F2]/50' : 'w-4 bg-white/10'}`} />
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* PHASE: Input */}
        {phase === 'input' && (
          <motion.div key="input"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col px-5 pb-8 max-w-lg mx-auto w-full">

            <div className="py-6">
              <p className="text-[#1877F2] text-xs font-bold tracking-[2px] uppercase mb-2">STEP 3 OF 4 · YOUR FIRST GOAL</p>
              <h2 className="text-2xl font-black text-white">What's the one thing you want to achieve?</h2>
              <p className="text-white/45 text-sm mt-1">
                Spirit will build your full GPS plan — steps, timeline, cost, and your probability of success.
              </p>
            </div>

            {/* Goal input */}
            <div className="relative mb-4">
              <textarea
                ref={textareaRef}
                value={goalText}
                onChange={e => setGoalText(e.target.value)}
                placeholder="Be specific. E.g. 'Record and release my first EP on Spotify within 3 months'"
                rows={4}
                className="w-full bg-white/[0.04] border border-white/10 focus:border-[#1877F2]/60 rounded-2xl px-5 py-4 text-white placeholder:text-white/25 text-sm focus:outline-none resize-none transition-colors"
              />
              <div className="absolute bottom-3 right-3 text-white/20 text-xs">{goalText.length}/300</div>
            </div>

            {error && (
              <p className="text-red-400 text-sm mb-3 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2.5">{error}</p>
            )}

            {/* Goal starters */}
            <div className="mb-4">
              <p className="text-white/25 text-xs mb-2 uppercase tracking-wide font-semibold">Try one of these:</p>
              <div className="flex flex-col gap-1.5">
                {GOAL_STARTERS.slice(0, 4).map(starter => (
                  <button
                    key={starter}
                    onClick={() => setGoalText(starter)}
                    className="text-left text-sm text-white/40 hover:text-white/70 px-3 py-2 rounded-xl hover:bg-white/5 transition-all truncate"
                  >
                    → {starter}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-auto pt-4 space-y-3">
              <button
                onClick={analyzeGoal}
                disabled={!goalText.trim()}
                className="w-full bg-[#1877F2] hover:bg-[#1565c0] disabled:opacity-30 text-white font-bold py-4 rounded-2xl transition-all text-base shadow-[0_0_40px_rgba(24,119,242,0.25)]"
              >
                📡 Build My GPS Plan
              </button>
              <button onClick={() => router.push('/onboarding/profile')} className="w-full text-white/25 text-sm py-2">
                Skip — I'll set a goal later
              </button>
            </div>
          </motion.div>
        )}

        {/* PHASE: Analyzing */}
        {phase === 'analyzing' && (
          <motion.div key="analyzing"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center px-6 text-center">

            {/* Spinning GPS ring */}
            <div className="relative w-32 h-32 mb-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 rounded-full border-2 border-[#1877F2]/30 border-t-[#1877F2]"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-4 rounded-full border border-[#1877F2]/20 border-t-[#1877F2]/50"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl">📡</span>
              </div>
            </div>

            <h2 className="text-xl font-black text-white mb-3">Spirit is analyzing your goal…</h2>

            <AnimatePresence mode="wait">
              <motion.p
                key={msgIdx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="text-white/40 text-sm"
              >
                {analyzingMsgs[msgIdx]}
              </motion.p>
            </AnimatePresence>

            <div className="mt-6 max-w-xs bg-white/[0.03] border border-white/8 rounded-2xl px-5 py-4 text-left">
              <p className="text-white/30 text-xs mb-1">Your goal:</p>
              <p className="text-white/70 text-sm italic">"{goalText}"</p>
            </div>
          </motion.div>
        )}

        {/* PHASE: Result */}
        {phase === 'result' && analysis && (
          <motion.div key="result"
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col px-5 pb-8 max-w-lg mx-auto w-full overflow-y-auto">

            <div className="py-6 text-center">
              <p className="text-[#1877F2] text-xs font-bold tracking-[2px] uppercase mb-2">YOUR GPS IS READY</p>
              <h2 className="text-2xl font-black text-white">Spirit built your plan.</h2>
            </div>

            {/* Probability score hero */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-white/[0.04] border border-white/8 rounded-2xl p-6 mb-4 text-center"
            >
              <p className="text-white/40 text-xs uppercase tracking-widest mb-3">GPS Probability Score</p>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.3 }}
                className="text-7xl font-black mb-2"
                style={{ color: scoreColor }}
              >
                {score}%
              </motion.div>
              <div className="w-full bg-white/10 rounded-full h-2 mb-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${score}%` }}
                  transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }}
                  className="h-2 rounded-full"
                  style={{ background: scoreColor }}
                />
              </div>
              {analysis.probability_reason && (
                <p className="text-white/40 text-xs leading-relaxed">{analysis.probability_reason}</p>
              )}
            </motion.div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { label: 'Timeline', value: `${analysis.estimated_weeks ?? '?'}w`, color: '#60a5fa' },
                { label: 'Est. Cost', value: `$${(analysis.estimated_cost ?? 0).toLocaleString()}`, color: '#fbbf24' },
                { label: 'Hrs/Week', value: `${analysis.weekly_hours_needed ?? '?'}h`, color: '#a78bfa' },
              ].map(stat => (
                <div key={stat.label} className="bg-white/[0.04] border border-white/8 rounded-xl p-3 text-center">
                  <p className="text-white/30 text-xs mb-1">{stat.label}</p>
                  <p className="font-black text-lg" style={{ color: stat.color }}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* First 3 GPS steps */}
            {analysis.steps?.length > 0 && (
              <div className="bg-white/[0.04] border border-white/8 rounded-2xl p-4 mb-4">
                <p className="text-white/40 text-xs uppercase tracking-widest mb-3">Your First Steps</p>
                <div className="space-y-3">
                  {analysis.steps.slice(0, 3).map((step: any, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + i * 0.1 }}
                      className="flex items-start gap-3"
                    >
                      <div className="w-6 h-6 rounded-full bg-[#1877F2]/20 border border-[#1877F2]/40 flex items-center justify-center text-xs font-bold text-[#60a5fa] flex-shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-white/80 text-sm font-semibold">{step.title}</p>
                        {step.description && <p className="text-white/35 text-xs mt-0.5">{step.description}</p>}
                        {step.estimated_hours && <p className="text-[#60a5fa] text-xs mt-0.5">~{step.estimated_hours}h</p>}
                      </div>
                    </motion.div>
                  ))}
                  {analysis.steps.length > 3 && (
                    <p className="text-white/25 text-xs pl-9">+ {analysis.steps.length - 3} more steps saved to your Workshop</p>
                  )}
                </div>
              </div>
            )}

            {/* Roles needed */}
            {analysis.roles_needed?.length > 0 && (
              <div className="bg-white/[0.04] border border-white/8 rounded-2xl p-4 mb-4">
                <p className="text-white/40 text-xs uppercase tracking-widest mb-2">Villagers You'll Need</p>
                <div className="flex flex-wrap gap-2">
                  {analysis.roles_needed.map((role: string, i: number) => (
                    <span key={i} className="bg-[#1877F2]/10 border border-[#1877F2]/20 text-[#60a5fa] text-xs px-3 py-1 rounded-full">
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="space-y-3 mt-2">
              <button
                onClick={saveGoalAndContinue}
                className="w-full bg-[#1877F2] hover:bg-[#1565c0] text-white font-bold py-4 rounded-2xl text-base transition-all shadow-[0_0_40px_rgba(24,119,242,0.3)]"
              >
                🗺️ Save My GPS & Enter the Village
              </button>
              <button onClick={() => setPhase('input')} className="w-full text-white/25 text-sm py-2">
                ← Try a different goal
              </button>
            </div>
          </motion.div>
        )}

        {/* PHASE: Saving */}
        {phase === 'saving' && (
          <motion.div key="saving"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4">

            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-6xl"
            >
              🗺️
            </motion.div>
            <h2 className="text-xl font-black text-white">Saving your GPS…</h2>
            <p className="text-white/40 text-sm">Your plan will be ready in the Workshop when you arrive.</p>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
