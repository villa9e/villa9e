'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const MAZE_QUESTIONS = [
  {
    question: 'You arrive at a crossroads in the village. You can see smoke from a campfire ahead. You:',
    choices: [
      { label: 'Head straight toward the fire — where there\'s warmth, there\'s community.', type: 'A' },
      { label: 'Scout the perimeter first to understand what\'s happening before joining.', type: 'B' },
      { label: 'Wait and see who comes out before deciding to approach.', type: 'C' },
      { label: 'Start your own fire and let others come to you.', type: 'D' },
    ],
  },
  {
    question: 'The village Trading Post needs a new roof. You offer to:',
    choices: [
      { label: 'Organize everyone and assign tasks — you\'ll have it done by nightfall.', type: 'A' },
      { label: 'Draw up the plans first. A rushed roof collapses.', type: 'B' },
      { label: 'Gather everyone\'s input. The village should decide together.', type: 'C' },
      { label: 'Find the most skilled builder and fund their work.', type: 'D' },
    ],
  },
  {
    question: 'Another villager shares a goal that seems impossible to you. You:',
    choices: [
      { label: 'Say: "Let\'s break this down — here\'s how we make it possible."', type: 'A' },
      { label: 'Say: "The odds are tough, but I\'ve seen tougher. Let\'s research."', type: 'B' },
      { label: 'Say: "What matters most to you about this goal?"', type: 'C' },
      { label: 'Say: "Tell me more. I want to understand your vision completely."', type: 'D' },
    ],
  },
  {
    question: 'Your goal is almost complete but an unexpected obstacle blocks the final step. You:',
    choices: [
      { label: 'Adapt immediately and find a different path forward.', type: 'A' },
      { label: 'Analyze the obstacle before taking any action.', type: 'B' },
      { label: 'Reach out to others who\'ve faced this before.', type: 'C' },
      { label: 'See it as a sign to reconsider if this is the right goal.', type: 'D' },
    ],
  },
  {
    question: 'You receive 3 OoWops on a Dream Line post. You feel:',
    choices: [
      { label: 'Good — now let\'s get the next 3. On to the next step.', type: 'A' },
      { label: 'Validated but also curious: what specifically resonated?', type: 'B' },
      { label: 'Genuinely grateful — community support means everything.', type: 'C' },
      { label: 'Inspired to give OoWops to others who deserve them.', type: 'D' },
    ],
  },
];

const ARCHETYPE_RESULTS: Record<string, { name: string; emoji: string; color: string; desc: string; strengths: string[]; match: string }> = {
  architect: { name: 'Architect',  emoji: '🏗️', color: '#1877F2', desc: 'You build with intention. Every goal is a blueprint. You see the structure where others see chaos.', strengths: ['Strategic thinking','Systems design','Long-term planning','Leadership through clarity'], match: 'Sparks who have the energy you channel into structure.' },
  spark:     { name: 'Spark',      emoji: '⚡', color: '#FF6B2B', desc: 'You ignite. Where others see walls, you see doors. Your energy is contagious and your optimism is a superpower.', strengths: ['Infectious enthusiasm','Creative problem-solving','Fast action','Rallying communities'], match: 'Anchors who ground your ideas into steady reality.' },
  anchor:    { name: 'Anchor',     emoji: '⚓', color: '#22C55E', desc: 'You hold. When storms hit the village, people find you. Your consistency is the foundation others build on.', strengths: ['Reliability','Emotional stability','Follow-through','Trust-building'], match: 'Pioneers who need someone dependable to hold the base.' },
  compass:   { name: 'Compass',    emoji: '🧭', color: '#F9A8D4', desc: 'You orient. You sense where things need to go before others see it. Your intuition about people is your greatest gift.', strengths: ['Deep empathy','Relationship intelligence','Conflict navigation','Reading rooms'], match: 'Architects who need a human compass alongside their blueprints.' },
  pioneer:   { name: 'Pioneer',    emoji: '🏔️', color: '#8B5CF6', desc: 'You go first. Into the unknown, into the uncomfortable, into the untested. Others follow your trail.', strengths: ['Courage','Adaptability','Risk tolerance','Vision under pressure'], match: 'Sages who bring wisdom to the trails you blaze.' },
  sage:      { name: 'Sage',       emoji: '📚', color: '#FFD700', desc: 'You know. Not just facts but patterns. You\'ve processed enough experience to see what others miss.', strengths: ['Deep knowledge','Pattern recognition','Teaching','Long-view thinking'], match: 'Sparks who energize the wisdom you carry.' },
  weaver:    { name: 'Weaver',     emoji: '🕸️', color: '#14B8A6', desc: 'You connect. You see relationships between people, ideas, and resources that others miss. You make 1+1=11.', strengths: ['Network thinking','Bridge building','Collaboration','Synthesis'], match: 'Pioneers who forge new paths you can weave networks through.' },
  flame:     { name: 'Flame',      emoji: '🔥', color: '#DC2626', desc: 'You burn for what you believe. Your passion is undeniable and your commitment legendary. You complete what others abandon.', strengths: ['Fierce commitment','Inspiring passion','Resilience','Excellence under pressure'], match: 'Anchors who provide the steadiness your flame needs.' },
};

function scoreToArchetype(scores: Record<string, number>): string {
  const types = { A: 'architect', B: 'sage', C: 'weaver', D: 'compass' };
  const sorted = Object.entries(scores).sort(([,a],[,b]) => b - a);
  const winner = sorted[0][0];
  // Special combos
  if (scores.A > 2 && scores.B > 1) return 'pioneer';
  if (scores.A > 2 && scores.C === 0) return 'architect';
  if (scores.D > 2 && scores.C > 1) return 'spark';
  if (scores.C > 2 && scores.D < 2) return 'weaver';
  if (scores.B > 2) return 'sage';
  if (scores.A >= scores.B && scores.A >= scores.C && scores.A >= scores.D) {
    if (scores.D > 1) return 'flame';
    return 'anchor';
  }
  return types[winner as keyof typeof types] ?? 'architect';
}

export default function PersonalityMazePage() {
  const [qIndex, setQIndex] = useState(-1); // -1 = intro
  const [scores, setScores] = useState<Record<string, number>>({ A: 0, B: 0, C: 0, D: 0 });
  const [result, setResult] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  function start() { setQIndex(0); }

  function answer(type: string) {
    const newScores = { ...scores, [type]: scores[type] + 1 };
    setScores(newScores);
    if (qIndex + 1 >= MAZE_QUESTIONS.length) {
      setResult(scoreToArchetype(newScores));
    } else {
      setQIndex(qIndex + 1);
    }
  }

  async function saveResult(archetype: string) {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({ personality_type: archetype as any }).eq('id', user.id);
    }
    router.push('/village/hut');
  }

  const resultData = result ? ARCHETYPE_RESULTS[result] : null;
  const progress = qIndex >= 0 ? ((qIndex) / MAZE_QUESTIONS.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-village-blue via-blue-700 to-indigo-900">
      <div className="px-6 py-4 flex items-center gap-3 text-white">
        <Link href="/village/trading-post" className="text-xl opacity-70">←</Link>
        <span className="text-2xl">🏰</span>
        <h1 className="text-xl font-bold">Personality Maze</h1>
      </div>

      <div className="max-w-lg mx-auto p-4">
        <AnimatePresence mode="wait">
          {qIndex === -1 && (
            <motion.div key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center text-white py-8">
              <div className="text-8xl mb-6">🏰</div>
              <h2 className="text-3xl font-bold mb-3">Enter the Maze</h2>
              <p className="text-blue-200 mb-8 leading-relaxed">Navigate 5 crossroads. Your choices reveal your archetype — the type of villager you naturally are. There are no wrong paths.</p>
              <p className="text-sm text-blue-300 mb-8">8 archetypes: Architect · Spark · Anchor · Compass · Pioneer · Sage · Weaver · Flame</p>
              <button onClick={start} className="bg-white text-village-blue rounded-full px-8 py-4 font-bold text-lg hover:shadow-xl transition-shadow">
                🚶 Enter the Maze
              </button>
            </motion.div>
          )}

          {qIndex >= 0 && !result && (
            <motion.div key={`q${qIndex}`} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              {/* Progress path */}
              <div className="mb-6">
                <div className="flex justify-between text-white/60 text-xs mb-2">
                  <span>Crossroad {qIndex + 1} of {MAZE_QUESTIONS.length}</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-1.5">
                  <div className="h-1.5 bg-white rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 mb-4">
                <p className="text-white text-lg font-medium leading-relaxed">{MAZE_QUESTIONS[qIndex].question}</p>
              </div>

              <div className="space-y-3">
                {MAZE_QUESTIONS[qIndex].choices.map((choice, i) => (
                  <motion.button
                    key={i}
                    onClick={() => answer(choice.type)}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-2xl p-4 text-left text-sm leading-relaxed transition-all"
                  >
                    {choice.label}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {result && resultData && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
              <div className="bg-white rounded-3xl p-8 space-y-5">
                <motion.div animate={{ rotate: [0, -10, 10, 0] }} transition={{ delay: 0.3, duration: 0.5 }} className="text-8xl">
                  {resultData.emoji}
                </motion.div>
                <div>
                  <p className="text-sm font-medium uppercase tracking-wide" style={{ color: resultData.color }}>Your Archetype</p>
                  <h2 className="text-4xl font-bold text-gray-900">{resultData.name}</h2>
                </div>
                <p className="text-gray-600 leading-relaxed">{resultData.desc}</p>
                <div>
                  <p className="text-sm font-bold text-gray-700 mb-2">Your Strengths</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {resultData.strengths.map(s => (
                      <span key={s} className="text-xs px-3 py-1 rounded-full font-medium" style={{ backgroundColor: resultData.color + '20', color: resultData.color }}>{s}</span>
                    ))}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-2xl p-3 text-left">
                  <p className="text-xs font-bold text-gray-500 mb-1">Best Match:</p>
                  <p className="text-sm text-gray-700">{resultData.match}</p>
                </div>
                <button onClick={() => saveResult(result)} disabled={saving} className="village-btn-primary w-full py-4 text-base disabled:opacity-50">
                  {saving ? 'Saving…' : '✊ Save My Archetype to Hut'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
