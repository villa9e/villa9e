'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { BackButton } from '@/components/village/BackButton';
import { OoWopIcon } from '@/components/village/OoWopIcon';

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
    question: 'You receive 3 OoWops on a DreamLine post. You feel:',
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
  if (scores.A > 2 && scores.B > 1) return 'pioneer';
  if (scores.A > 2 && scores.C === 0) return 'architect';
  if (scores.D > 2 && scores.C > 1) return 'spark';
  if (scores.C > 2 && scores.D < 2) return 'weaver';
  if (scores.B > 2) return 'sage';
  if (scores.A >= scores.B && scores.A >= scores.C && scores.A >= scores.D) {
    if (scores.D > 1) return 'flame';
    return 'anchor';
  }
  const sorted = Object.entries(scores).sort(([,a],[,b]) => b - a);
  return types[sorted[0][0] as keyof typeof types] ?? 'architect';
}

export default function PersonalityPage() {
  const [qIndex, setQIndex] = useState(-1);
  const [scores, setScores] = useState<Record<string, number>>({ A: 0, B: 0, C: 0, D: 0 });
  const [result, setResult] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

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
      await (supabase as any).from('profiles').update({ personality_type: archetype }).eq('id', user.id);
    }
    router.push('/village/hut');
  }

  const resultData = result ? ARCHETYPE_RESULTS[result] : null;
  const progress = qIndex >= 0 ? (qIndex / MAZE_QUESTIONS.length) * 100 : 0;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#0A0F2E,#1A1060,#2D1B7E)', color: '#fff' }}>
      <BackButton to="/village/hut" />

      {/* Header */}
      <div style={{ padding: '60px 20px 20px', textAlign: 'center' }}>
        <p style={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', marginBottom: 8 }}>YOUR ARCHETYPE</p>
        <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 6 }}>Personality Maze</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>8 archetypes — navigate 5 crossroads to find yours</p>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 20px 100px' }}>
        <AnimatePresence mode="wait">
          {/* Intro */}
          {qIndex === -1 && (
            <motion.div key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              style={{ textAlign: 'center', paddingTop: 20 }}>
              <div style={{ fontSize: 72, marginBottom: 24 }}>🏰</div>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.65, marginBottom: 24 }}>
                Navigate 5 crossroads. Your choices reveal your archetype — the type of villager you naturally are. There are no wrong paths.
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 32 }}>
                {Object.values(ARCHETYPE_RESULTS).map(a => (
                  <span key={a.name} style={{ fontSize: 10, fontWeight: 900, padding: '4px 10px', borderRadius: 20, background: `${a.color}22`, color: a.color, border: `1px solid ${a.color}44` }}>
                    {a.emoji} {a.name}
                  </span>
                ))}
              </div>
              <motion.button whileTap={{ scale: 0.96 }} onClick={() => setQIndex(0)}
                style={{ width: '100%', padding: '16px 0', borderRadius: 16, background: 'linear-gradient(135deg,#1877F2,#7C3AED)', color: '#fff', fontWeight: 900, fontSize: 16, border: 'none', cursor: 'pointer' }}>
                Enter the Maze
              </motion.button>
            </motion.div>
          )}

          {/* Questions */}
          {qIndex >= 0 && !result && (
            <motion.div key={`q${qIndex}`} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                  <span>Crossroad {qIndex + 1} of {MAZE_QUESTIONS.length}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#4D72FF', borderRadius: 2, width: `${progress}%`, transition: 'width 0.3s' }} />
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 20, padding: 20, marginBottom: 16 }}>
                <p style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.6, color: '#fff' }}>{MAZE_QUESTIONS[qIndex].question}</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {MAZE_QUESTIONS[qIndex].choices.map((choice, i) => (
                  <motion.button key={i} onClick={() => answer(choice.type)} whileTap={{ scale: 0.98 }}
                    style={{ textAlign: 'left', padding: '14px 16px', background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.12)', borderRadius: 14, color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 600, lineHeight: 1.5, cursor: 'pointer' }}>
                    {choice.label}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Result */}
          {result && resultData && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}>
              <div style={{ background: '#fff', borderRadius: 24, padding: 28, textAlign: 'center' }}>
                <motion.div animate={{ rotate: [0, -8, 8, 0] }} transition={{ delay: 0.3, duration: 0.5 }}
                  style={{ fontSize: 72, marginBottom: 16 }}>
                  {resultData.emoji}
                </motion.div>
                <p style={{ fontSize: 11, fontWeight: 900, color: resultData.color, letterSpacing: '0.08em', marginBottom: 4 }}>YOUR ARCHETYPE</p>
                <h2 style={{ fontSize: 32, fontWeight: 900, color: '#0A0F2E', marginBottom: 12 }}>{resultData.name}</h2>
                <p style={{ fontSize: 14, color: '#4A5568', lineHeight: 1.65, marginBottom: 20 }}>{resultData.desc}</p>

                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 12, fontWeight: 900, color: '#0A0F2E', marginBottom: 10 }}>Your Strengths</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                    {resultData.strengths.map(s => (
                      <span key={s} style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, fontWeight: 700, background: `${resultData.color}18`, color: resultData.color }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ background: '#F7F8FA', borderRadius: 14, padding: '12px 16px', textAlign: 'left', marginBottom: 20 }}>
                  <p style={{ fontSize: 11, fontWeight: 900, color: '#6B7280', marginBottom: 4 }}>Best Match</p>
                  <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{resultData.match}</p>
                </div>

                <motion.button whileTap={{ scale: 0.97 }} onClick={() => saveResult(result)} disabled={saving}
                  style={{ width: '100%', padding: '16px 0', borderRadius: 16, background: `linear-gradient(135deg,${resultData.color},#7C3AED)`, color: '#fff', fontWeight: 900, fontSize: 15, border: 'none', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving…' : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <OoWopIcon size={16} /> Save My Archetype
                    </span>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
