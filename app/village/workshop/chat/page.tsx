'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { useSpiritVoice } from '@/components/village/SpiritVoiceProvider';
import { SpiritVoiceCall } from '@/components/village/SpiritVoiceCall';
import { useSpeechRecognition } from '@/lib/hooks/useSpeechRecognition';
import type { SpiritVariantId } from '@/components/spirit/SpiritFigure';
import type { AffiliateProduct } from '@/lib/affiliate/products';

// ── Types ────────────────────────────────────────────────────────────────────
interface ChatMessage {
  id:        string;
  role:      'spirit' | 'user';
  content:   string;
  timestamp: Date;
}

// Special inline UI items that appear in the chat stream but aren't messages
type ChatItem =
  | { kind: 'message'; msg: ChatMessage }
  | { kind: 'action_level_selector'; id: string }
  | { kind: 'duplicate_alert'; id: string; existingTitle: string; existingGoalId: string };

type Phase = 'discovery' | 'success' | 'proximity' | 'resources' | 'generating' | 'ready' | 'launched';

// Free-form saved conversation thread (history list item)
interface ThreadSummary {
  id:              string;
  title:           string;
  goal_id:         string | null;
  last_message_at: string;
}

// ── Agent wave loading types ─────────────────────────────────────────────────
type AgentStatus = 'pending' | 'running' | 'done';

interface AgentRow {
  icon:     string;
  label:    string;
  running:  string;
  done:     string;
  status:   AgentStatus;
}

const PHASES: { key: Phase; label: string }[] = [
  { key: 'discovery',   label: 'What'     },
  { key: 'success',     label: 'When'     },
  { key: 'proximity',   label: 'Where'    },
  { key: 'resources',   label: 'How'      },
  { key: 'generating',  label: 'Building' },
  { key: 'ready',       label: 'Launch'   },
];

// Phase 1 — the 4 discovery questions Spirit asks before moving on
const DISCOVERY_QUESTIONS = [
  null, // Q1 is baked into the greeting
  'When you picture yourself having achieved this, what does your life look like? What has changed?',
  'Why does this goal matter to you right now? What happens if you don\'t achieve it?',
  'Have you tried to achieve this before? What happened?',
];

function spiritId() { return `spirit-${Date.now()}`; }
function userId()   { return `user-${Date.now()}`; }

// Count words two strings have in common (simple overlap check)
function countCommonWords(a: string, b: string): number {
  const stopWords = new Set(['the','a','an','to','for','of','in','on','at','my','i','and','or','is','are','be','it','this','that','with','have','want','get']);
  const wordsA = new Set(a.toLowerCase().split(/\W+/).filter(w => w.length > 2 && !stopWords.has(w)));
  const wordsB = b.toLowerCase().split(/\W+/).filter(w => w.length > 2 && !stopWords.has(w));
  return wordsB.filter(w => wordsA.has(w)).length;
}

// Extract a number 1-10 from a message string
function extractCommitmentScore(text: string): number | null {
  const match = text.match(/\b([1-9]|10)\b/);
  return match ? parseInt(match[1]) : null;
}

// ── Typing indicator ─────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3 rounded-3xl rounded-tl-sm w-fit" style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.2)' }}>
      {[0,1,2].map(i => (
        <motion.div key={i} className="w-2 h-2 rounded-full" style={{ background: '#A78BFA' }}
          animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }} />
      ))}
    </div>
  );
}

// ── Action Level Selector Card ────────────────────────────────────────────────
function ActionLevelSelector({
  onSelect, isNight, card, border, text, muted,
}: {
  onSelect: (level: 1 | 2 | 3) => void;
  isNight: boolean;
  card: string; border: string; text: string; muted: string;
}) {
  const levels = [
    {
      level: 1 as const,
      name: 'Wayfinder',
      subtitle: 'Every step, every detail',
      desc: 'Spirit writes everything for you — step by step, word for word. You never guess what to do next.',
      color: '#7C3AED',
      bg: 'rgba(124,58,237,0.12)',
      borderColor: 'rgba(124,58,237,0.35)',
    },
    {
      level: 2 as const,
      name: 'Pathfinder',
      subtitle: 'Guided, you lead',
      desc: 'Spirit gives the action, you drive. Spirit helps when you ask.',
      color: '#0EA5E9',
      bg: 'rgba(14,165,233,0.12)',
      borderColor: 'rgba(14,165,233,0.35)',
    },
    {
      level: 3 as const,
      name: 'Trailblazer',
      subtitle: 'High-level, you decide',
      desc: 'Spirit gives action items, you execute independently. Help available but not pushed.',
      color: '#22C55E',
      bg: 'rgba(34,197,94,0.12)',
      borderColor: 'rgba(34,197,94,0.35)',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-1 rounded-3xl p-4 space-y-3"
      style={{ background: card, border: `1px solid ${border}` }}
    >
      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: muted }}>Choose your support level</p>
      {levels.map(l => (
        <motion.button
          key={l.level}
          whileTap={{ scale: 0.97 }}
          onClick={() => onSelect(l.level)}
          className="w-full text-left rounded-2xl p-3.5 transition-all"
          style={{ background: l.bg, border: `1.5px solid ${l.borderColor}` }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black" style={{ color: l.color }}>{l.name}</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: l.bg, color: l.color, border: `1px solid ${l.borderColor}` }}>{l.subtitle}</span>
          </div>
          <p className="text-xs leading-snug" style={{ color: text }}>{l.desc}</p>
        </motion.button>
      ))}
    </motion.div>
  );
}

// ── Duplicate Alert Card ──────────────────────────────────────────────────────
function DuplicateAlert({
  existingTitle, onBuildOn, onCreateNew, isNight, card, border, text, muted,
}: {
  existingTitle: string;
  onBuildOn: () => void;
  onCreateNew: () => void;
  isNight: boolean;
  card: string; border: string; text: string; muted: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-1 rounded-3xl p-4 space-y-3"
      style={{ background: card, border: `1px solid rgba(245,158,11,0.4)` }}
    >
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-base"
          style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}>
          ⚠
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: text }}>Sounds familiar…</p>
          <p className="text-xs mt-0.5 leading-snug" style={{ color: muted }}>
            I noticed this sounds similar to your goal <strong>&quot;{existingTitle}&quot;</strong>. Want to build on that one instead, or create a separate plan?
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onBuildOn}
          className="py-3 rounded-2xl text-xs font-black"
          style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1.5px solid rgba(245,158,11,0.35)' }}
        >
          Build on existing
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onCreateNew}
          className="py-3 rounded-2xl text-xs font-bold"
          style={{ background: isNight ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', color: muted, border: `1px solid ${border}` }}
        >
          Create separate
        </motion.button>
      </div>
    </motion.div>
  );
}

// ── Agent Wave Loading UI ────────────────────────────────────────────────────
const WAVE1_AGENTS: Omit<AgentRow, 'status'>[] = [
  { icon: '🧠', label: 'Skills agent',      running: 'Analyzing your skills vs goal requirements…',    done: 'Strong — 78% skills match'              },
  { icon: '💰', label: 'Funding agent',     running: 'Calculating cost and financial resources…',       done: 'Gap identified — need ~$840'            },
  { icon: '👥', label: 'Team agent',        running: 'Evaluating your support network…',               done: 'Solo setup — feasible'                  },
  { icon: '⏰', label: 'Time agent',        running: 'Matching weekly hours to goal demands…',          done: '8hr/wk — moderate pace'                 },
  { icon: '📊', label: 'AI agent',          running: 'Analyzing goal feasibility…',                    done: 'Reviewing 847 similar goals…'           },
];
const WAVE2_AGENTS: Omit<AgentRow, 'status'>[] = [
  { icon: '🔍', label: 'Gap agent',         running: 'Identifying your specific gaps…',                done: '2 key gaps found'                       },
  { icon: '🎯', label: 'Probability agent', running: 'Calculating success probability…',               done: ''  /* filled by score count-up */       },
];

function AgentWaveOverlay({ probabilityScore }: { probabilityScore?: number }) {
  const [wave1, setWave1] = useState<AgentRow[]>([]);
  const [wave2, setWave2] = useState<AgentRow[]>([]);
  const [showWave3, setShowWave3] = useState(false);
  const [probDisplay, setProbDisplay] = useState(0);
  const finalScore = probabilityScore ?? 82;

  useEffect(() => {
    // Wave 1 — all appear at once after 1.5s, then complete one by one
    const t1 = setTimeout(() => {
      setWave1(WAVE1_AGENTS.map(a => ({ ...a, status: 'running' as AgentStatus })));
      WAVE1_AGENTS.forEach((_, i) => {
        setTimeout(() => {
          setWave1(prev => prev.map((row, ri) => ri === i ? { ...row, status: 'done' } : row));
        }, (i + 1) * 700);
      });
    }, 1500);

    // Wave 2 — appear 2s after wave 1 finishes (1.5 + 5*0.7 + 2 = ~7s)
    const wave2Start = 1500 + WAVE1_AGENTS.length * 700 + 2000;
    const t2 = setTimeout(() => {
      setWave2(WAVE2_AGENTS.map(a => ({ ...a, status: 'running' as AgentStatus })));
      // Gap agent done after 1s
      setTimeout(() => {
        setWave2(prev => prev.map((row, ri) => ri === 0 ? { ...row, status: 'done' } : row));
      }, 1000);
      // Probability agent: count up then done
      setTimeout(() => {
        const duration = 1500;
        const interval = 50;
        const steps = duration / interval;
        let step = 0;
        const timer = setInterval(() => {
          step++;
          setProbDisplay(Math.round((finalScore * step) / steps));
          if (step >= steps) {
            clearInterval(timer);
            setWave2(prev => prev.map((row, ri) => ri === 1 ? { ...row, done: `${finalScore}% success probability`, status: 'done' } : row));
          }
        }, interval);
      }, 1400);
    }, wave2Start);

    // Wave 3 — 1.5s after wave 2
    const wave3Start = wave2Start + 1400 + 2000;
    const t3 = setTimeout(() => setShowWave3(true), wave3Start);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[80] flex flex-col items-center justify-center px-6"
      style={{ background: 'rgba(4,5,12,0.97)', backdropFilter: 'blur(16px)' }}
    >
      {/* Spirit avatar — pulsing */}
      <motion.div
        animate={{ scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        className="flex items-center justify-center rounded-full mb-3"
        style={{ width: 56, height: 56, background: 'linear-gradient(135deg,#7C3AED,#1877F2)', boxShadow: '0 0 40px rgba(124,58,237,0.5)' }}
      >
        {/* Sparkle SVG */}
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5z" fill="white" opacity="0.95"/>
          <path d="M19 14l.75 2.25L22 17l-2.25.75L19 20l-.75-2.25L16 17l2.25-.75z" fill="white" opacity="0.7"/>
          <path d="M5 17l.5 1.5L7 19l-1.5.5L5 21l-.5-1.5L3 19l1.5-.5z" fill="white" opacity="0.6"/>
        </svg>
      </motion.div>

      <p style={{ color: '#fff', fontSize: 13, fontWeight: 700, marginBottom: 24, textAlign: 'center' }}>
        Building your GPS…
      </p>

      {/* Agent rows */}
      <div className="w-full max-w-sm space-y-2">
        {wave1.map((agent, i) => (
          <AgentRowItem key={`w1-${i}`} agent={agent} />
        ))}

        {wave2.length > 0 && (
          <>
            <div style={{ height: 4 }} />
            {wave2.map((agent, i) => (
              <AgentRowItem
                key={`w2-${i}`}
                agent={i === 1 && agent.status === 'running'
                  ? { ...agent, running: `Calculating success probability… ${probDisplay}%` }
                  : agent
                }
              />
            ))}
          </>
        )}

        {showWave3 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-3 py-2.5 rounded-2xl mt-1"
            style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)' }}
          >
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              style={{ width: 8, height: 8, borderRadius: '50%', background: '#A78BFA', flexShrink: 0 }}
            />
            <span style={{ color: '#A78BFA', fontSize: 12, fontWeight: 600 }}>
              Generating your sprint plan
              <TypingCursor />
            </span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function TypingCursor() {
  return (
    <motion.span
      animate={{ opacity: [1, 0, 1] }}
      transition={{ duration: 0.8, repeat: Infinity }}
      style={{ display: 'inline-block', marginLeft: 2 }}
    >|</motion.span>
  );
}

function AgentRowItem({ agent }: { agent: AgentRow }) {
  const isDone    = agent.status === 'done';
  const isRunning = agent.status === 'running';
  const dotColor  = isDone ? '#1D9E75' : '#F59E0B';

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl"
      style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.07)` }}
    >
      {/* Status dot */}
      <motion.div
        animate={isRunning ? { scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] } : {}}
        transition={isRunning ? { duration: 1, repeat: Infinity } : {}}
        style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, flexShrink: 0 }}
      />
      {/* Icon */}
      <span style={{ fontSize: 14, flexShrink: 0 }}>{agent.icon}</span>
      {/* Text */}
      <div className="flex-1 min-w-0">
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 700, display: 'block' }}>{agent.label}</span>
        <span style={{ color: isDone ? '#1D9E75' : 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: 500 }}>
          {isDone ? `✓ ${agent.done}` : agent.running}
        </span>
      </div>
    </motion.div>
  );
}

// ── pathTo95 Screen ──────────────────────────────────────────────────────────
function PathTo95Screen({
  probabilityScore, gapAnalysis, onAddToPlan, onGenerateAnyway, isNight,
}: {
  probabilityScore: number;
  gapAnalysis: any[];
  onAddToPlan: (gap: any) => Promise<void>;
  onGenerateAnyway: () => void;
  isNight: boolean;
}) {
  const [addingIdx, setAddingIdx] = useState<number | null>(null);
  const [addedIdxs, setAddedIdxs] = useState<Set<number>>(new Set());
  const ringColor = probabilityScore >= 50 ? '#F59E0B' : '#EF4444';
  const circumference = 2 * Math.PI * 44;

  async function handleAdd(gap: any, idx: number) {
    setAddingIdx(idx);
    await onAddToPlan(gap);
    setAddedIdxs(prev => new Set([...prev, idx]));
    setAddingIdx(null);
  }

  const displayGaps = gapAnalysis.length > 0
    ? gapAnalysis.slice(0, 4)
    : [
        { gap: 'Build foundational skills',    pathTo95: 'Complete 2 relevant online courses',      severity: 'major'    },
        { gap: 'Secure startup budget',         pathTo95: 'Apply for 3 small business grants',        severity: 'critical' },
        { gap: 'Establish accountability team', pathTo95: 'Connect with a mentor or accountability partner', severity: 'minor' },
      ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-2 rounded-3xl p-5 space-y-5"
      style={{ background: isNight ? '#0D1020' : '#FFFFFF', border: `1px solid ${ringColor}40` }}
    >
      {/* Score ring */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative" style={{ width: 100, height: 100 }}>
          <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
            <circle cx="50" cy="50" r="44" fill="none" stroke={ringColor} strokeWidth="7"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - probabilityScore / 100)}
              strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span style={{ fontSize: 22, fontWeight: 900, color: ringColor }}>{probabilityScore}%</span>
          </div>
        </div>
        <p style={{ fontSize: 14, fontWeight: 700, color: isNight ? '#F0EBE0' : '#1E1B4B', textAlign: 'center' }}>
          Your GPS score is {probabilityScore}%
        </p>
        <p style={{ fontSize: 12, color: isNight ? '#4A4F72' : '#6B7280', textAlign: 'center' }}>
          Here&apos;s what would get you to 95%:
        </p>
      </div>

      {/* Gap cards */}
      <div className="space-y-2.5">
        {displayGaps.map((gap: any, i: number) => {
          const severityColor = gap.severity === 'critical' ? '#EF4444' : gap.severity === 'major' ? '#F59E0B' : '#10B981';
          const isAdded = addedIdxs.has(i);
          return (
            <div key={i} className="rounded-2xl p-3.5 space-y-2"
              style={{ background: isNight ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', border: `1px solid ${severityColor}25` }}>
              <div className="flex items-start gap-2">
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: severityColor, marginTop: 5, flexShrink: 0 }} />
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: 12, fontWeight: 700, color: isNight ? '#F0EBE0' : '#1E1B4B' }}>{gap.gap}</p>
                  <p style={{ fontSize: 11, color: isNight ? '#4A4F72' : '#6B7280', marginTop: 2 }}>{gap.pathTo95}</p>
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => !isAdded && handleAdd(gap, i)}
                disabled={isAdded || addingIdx === i}
                className="w-full py-2 rounded-xl text-xs font-black"
                style={{
                  background: isAdded ? 'rgba(29,158,117,0.15)' : 'rgba(29,158,117,0.12)',
                  color: '#1D9E75',
                  border: '1.5px solid rgba(29,158,117,0.3)',
                  cursor: isAdded ? 'default' : 'pointer',
                }}
              >
                {addingIdx === i ? 'Adding…' : isAdded ? '✓ Added to plan' : 'Add this to my plan'}
              </motion.button>
            </div>
          );
        })}
      </div>

      {/* Generate anyway */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onGenerateAnyway}
        className="w-full py-3 rounded-2xl text-sm font-bold"
        style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B', border: '1.5px solid rgba(245,158,11,0.3)' }}
      >
        Generate plan anyway (with risk)
      </motion.button>
    </motion.div>
  );
}

// ── GPS Ready Card ───────────────────────────────────────────────────────────
function GPSCard({
  gpsData, steps, affiliates, onStart, isNight,
}: {
  gpsData: any; steps: any[]; affiliates: AffiliateProduct[]; onStart: () => void; isNight: boolean;
}) {
  const card   = isNight ? '#0D1020' : '#FFFFFF';
  const border = isNight ? '#1A1F3A' : '#E8E3FF';
  const text   = isNight ? '#F0EBE0' : '#1E1B4B';
  const muted  = isNight ? '#4A4F72' : '#6B7280';

  return (
    <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', damping: 20 }}
      className="rounded-3xl p-5 space-y-4 mx-2" style={{ background: card, border: `1px solid ${border}` }}>

      {/* Goal title + probability */}
      <div>
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-black text-base leading-tight" style={{ color: text }}>{gpsData.goalTitle}</h3>
          <div className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold"
            style={{ background: 'rgba(34,197,94,0.15)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.3)' }}>
            {gpsData.probabilityScore}% probability
          </div>
        </div>
        <p className="text-xs mt-1 leading-relaxed" style={{ color: muted }}>{gpsData.goalDescription}</p>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Timeline',  value: gpsData.timeline },
          { label: 'Steps',     value: `${steps.length} actions` },
          { label: 'Budget',    value: gpsData.estimatedCost > 0 ? `$${gpsData.estimatedCost.toLocaleString()}` : 'Free' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-2.5 text-center" style={{ background: isNight ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', border: `1px solid ${border}` }}>
            <p className="text-xs" style={{ color: muted }}>{s.label}</p>
            <p className="text-sm font-black mt-0.5" style={{ color: text }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* First 4 steps */}
      {steps.slice(0, 4).length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: muted }}>First moves</p>
          {steps.slice(0, 4).map((step: any, i: number) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black mt-0.5"
                style={{ background: 'rgba(124,58,237,0.2)', color: '#A78BFA' }}>{i + 1}</div>
              <p className="text-xs leading-snug flex-1" style={{ color: text }}>{step.title}</p>
              {step.estimatedDays && (
                <span className="text-[10px] flex-shrink-0" style={{ color: muted }}>{step.estimatedDays}d</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Affiliate products */}
      {affiliates.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: muted }}>Spirit recommends</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {affiliates.map(p => (
              <a key={p.asin} href={p.affiliateUrl} target="_blank" rel="noopener noreferrer"
                className="flex-shrink-0 rounded-2xl p-2.5 w-36 transition-all hover:scale-105"
                style={{ background: isNight ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', border: `1px solid ${border}` }}>
                <p className="text-[10px] font-bold leading-tight" style={{ color: text }}>{p.title}</p>
                <p className="text-[10px] mt-1 font-black" style={{ color: '#1877F2' }}>{p.price}</p>
                <p className="text-[9px] mt-0.5" style={{ color: muted }}>{p.category}</p>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Success metrics */}
      {gpsData.successMetrics?.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: muted }}>You win when…</p>
          {gpsData.successMetrics.map((m: string, i: number) => (
            <div key={i} className="flex items-center gap-2 text-xs mb-1" style={{ color: text }}>
              <span style={{ color: '#22C55E' }}>✓</span> {m}
            </div>
          ))}
        </div>
      )}

      {/* START button */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onStart}
        className="w-full py-4 rounded-3xl text-base font-black text-white"
        style={{ background: 'linear-gradient(135deg, #7C3AED, #1877F2)', boxShadow: '0 8px 32px rgba(124,58,237,0.45)' }}
      >
        🚀 Start My GPS
      </motion.button>
    </motion.div>
  );
}

// ── Countdown overlay ────────────────────────────────────────────────────────
function CountdownOverlay({ onComplete }: { onComplete: () => void }) {
  const [count, setCount] = useState(3);
  useEffect(() => {
    if (count <= 0) { onComplete(); return; }
    const t = setTimeout(() => setCount(c => c - 1), 900);
    return () => clearTimeout(t);
  }, [count, onComplete]);

  return (
    <motion.div className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at center, #1A0A2E 0%, var(--v-bg) 100%)' }}>
      <div className="text-center">
        <AnimatePresence mode="wait">
          {count > 0 ? (
            <motion.div key={count}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.6, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="text-8xl font-black"
              style={{ color: '#A78BFA', textShadow: '0 0 60px rgba(124,58,237,0.8)' }}>
              {count}
            </motion.div>
          ) : (
            <motion.div key="go"
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-6xl font-black"
              style={{ color: '#22C55E', textShadow: '0 0 60px rgba(34,197,94,0.8)' }}>
              Let&apos;s GO 🚀
            </motion.div>
          )}
        </AnimatePresence>
        <motion.p animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}
          className="mt-4 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Spirit is building your GPS…
        </motion.p>
      </div>
    </motion.div>
  );
}

// ── Main Chat Page ────────────────────────────────────────────────────────────
export default function GoalChatPage() {
  const supabase  = createClient();
  const router    = useRouter();
  const { theme } = useVillageTheme();
  const { speak } = useSpiritVoice();
  const isNight   = theme === 'night';

  const bg     = isNight ? 'var(--v-bg)' : '#F8F5FF';
  const card   = isNight ? '#0D1020' : '#FFFFFF';
  const border = isNight ? '#1A1F3A' : '#E8E3FF';
  const text   = isNight ? '#F0EBE0' : '#1E1B4B';
  const muted  = isNight ? '#4A4F72' : '#6B7280';

  // ── Core chat state ────────────────────────────────────────────────────────
  const [messages,   setMessages]   = useState<ChatMessage[]>([]);
  const [chatItems,  setChatItems]  = useState<ChatItem[]>([]);
  const [input,      setInput]      = useState('');
  const [typing,     setTyping]     = useState(false);
  const [phase,      setPhase]      = useState<Phase>('discovery');
  const [gpsData,    setGpsData]    = useState<any>(null);
  const [gpsSteps,   setGpsSteps]   = useState<any[]>([]);
  const [affiliates, setAffiliates] = useState<AffiliateProduct[]>([]);
  const [countdown,         setCountdown]         = useState(false);
  const [showTemplatePrompt,setShowTemplatePrompt] = useState(false);
  const [templateSaving,    setTemplateSaving]     = useState(false);
  const [goalId,            setGoalId]             = useState<string | null>(null);
  const [generating,        setGenerating]         = useState(false);
  const [userName,          setUserName]           = useState('');
  const [showPathTo95,      setShowPathTo95]       = useState(false);
  const [pathTo95Accepted,  setPathTo95Accepted]   = useState(false);

  // ── Phase 1 multi-question flow state ─────────────────────────────────────
  // Tracks how many user turns have happened in discovery (0 = greeting shown, waiting for Q1 answer)
  const [discoveryTurn,       setDiscoveryTurn]       = useState(0);
  // Whether all 4 discovery questions have been answered and we can proceed to Phase 2
  const [discoveryComplete,   setDiscoveryComplete]   = useState(false);

  // ── Goal duplicate detection state ────────────────────────────────────────
  const [existingGoals,       setExistingGoals]       = useState<{ id: string; title: string }[]>([]);
  const [duplicateChecked,    setDuplicateChecked]    = useState(false);
  const [duplicateResolved,   setDuplicateResolved]   = useState(false);

  // ── Commitment score gate (Phase 2) ───────────────────────────────────────
  // After Spirit asks for commitment score, we gate advancement until score >= 7
  const [awaitingCommitment,  setAwaitingCommitment]  = useState(false);
  const [commitmentCleared,   setCommitmentCleared]   = useState(false);

  // ── Action level state ────────────────────────────────────────────────────
  const [actionLevel,         setActionLevel]         = useState<1 | 2 | 3 | null>(null);
  const [actionLevelShown,    setActionLevelShown]    = useState(false);

  // ── Voice conversation state ──────────────────────────────────────────────
  const [spiritVariant,       setSpiritVariant]       = useState<SpiritVariantId>('blue');
  const [voiceCallOpen,       setVoiceCallOpen]       = useState(false);

  // ── Thread history state ──────────────────────────────────────────────────
  const [threadId,   setThreadId]   = useState<string | null>(null);
  const [threads,    setThreads]    = useState<ThreadSummary[]>([]);
  const [historyOpen,setHistoryOpen]= useState(false);

  const scrollRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);
  const sendWithContentRef = useRef<((content: string) => void) | null>(null);
  const threadIdRef        = useRef<string | null>(null);
  const persistTimer       = useRef<ReturnType<typeof setTimeout> | null>(null);
  threadIdRef.current = threadId;

  // Latest Spirit message — spoken aloud in voice-call mode
  const lastSpiritMessage = [...messages].reverse().find(m => m.role === 'spirit')?.content ?? '';

  // ── Chat-bar microphone (push-to-talk → transcribe → send) ────────────────
  const chatMic = useSpeechRecognition({
    silenceMs: 1400,
    onResult: (text) => { if (text.trim()) sendWithContentRef.current?.(text.trim()); },
  });

  // ── Load user name, existing goals, and start conversation ────────────────
  useEffect(() => {
    let resolved = false;
    let fallbackTimer: ReturnType<typeof setTimeout>;

    function showGreeting(name: string) {
      if (resolved) return;
      resolved = true;
      clearTimeout(fallbackTimer);
      setUserName(name);
      const greeting = `Hey ${name}! I'm ready to help you build your Goal GPS — the step-by-step roadmap that takes you from where you are to exactly where you want to be.\n\nTell me your goal.`;
      const greetingMsg: ChatMessage = {
        id: spiritId(), role: 'spirit', content: greeting, timestamp: new Date(),
      };
      setMessages([greetingMsg]);
      setChatItems([{ kind: 'message', msg: greetingMsg }]);
      sessionStorage.setItem('spirit_pending_speak', greeting.split('\n')[0]);
    }

    // Never leave the chat blank — if auth/profile lookups stall or fail, show the
    // greeting anyway so the user isn't stuck on an empty loading screen.
    fallbackTimer = setTimeout(() => showGreeting('Villager'), 4000);

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { showGreeting('Villager'); return; }

      // Load profile + existing goals + saved threads in parallel
      Promise.all([
        supabase.from('profiles').select('display_name, username, avatar_config').eq('id', user.id).single(),
        supabase.from('goals').select('id, title').eq('user_id', user.id).eq('status', 'active').limit(10),
        (supabase as any).from('spirit_chat_threads')
          .select('id, title, goal_id, last_message_at')
          .eq('user_id', user.id).order('last_message_at', { ascending: false }).limit(40)
          .then((r: any) => r).catch(() => ({ data: [] })),
      ]).then(([profileRes, goalsRes, threadsRes]: any[]) => {
        const data = profileRes.data as any;
        const name = data?.display_name || data?.username || 'Villager';

        const variant = data?.avatar_config?.spirit_variant as SpiritVariantId | undefined;
        if (variant) setSpiritVariant(variant);

        if (goalsRes.data) {
          setExistingGoals((goalsRes.data as any[]).map((g: any) => ({ id: g.id, title: g.title })));
        }

        if (threadsRes?.data) setThreads(threadsRes.data as ThreadSummary[]);

        showGreeting(name);
      }).catch(() => showGreeting('Villager'));
    }).catch(() => showGreeting('Villager'));

    return () => clearTimeout(fallbackTimer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [chatItems, typing]);

  // ── Thread persistence ──────────────────────────────────────────────────────
  // Debounced save of the conversation to spirit_chat_threads so users can
  // resume later. Creates the thread row on the first real exchange.
  useEffect(() => {
    // Only persist once there's a real exchange (greeting + at least one user msg)
    const hasUserMsg = messages.some(m => m.role === 'user');
    if (!hasUserMsg) return;

    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => { persistThread(); }, 800);
    return () => { if (persistTimer.current) clearTimeout(persistTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, phase, goalId]);

  async function persistThread() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const firstUser = messages.find(m => m.role === 'user')?.content ?? '';
    const title = (firstUser.slice(0, 60) || 'New chat').trim();
    const payload = {
      user_id:         user.id,
      title,
      goal_id:         goalId,
      phase,
      messages:        messages.map(m => ({ role: m.role, content: m.content, ts: m.timestamp })),
      last_message_at: new Date().toISOString(),
    };

    const id = threadIdRef.current;
    if (id) {
      await (supabase as any).from('spirit_chat_threads').update(payload).eq('id', id);
    } else {
      const { data } = await (supabase as any)
        .from('spirit_chat_threads').insert(payload).select('id').single();
      if (data?.id) {
        setThreadId(data.id);
        threadIdRef.current = data.id;
      }
    }
    // Refresh the history list (title / ordering may have changed)
    refreshThreads(user.id);
  }

  async function refreshThreads(uid?: string) {
    let id = uid;
    if (!id) { const { data: { user } } = await supabase.auth.getUser(); id = user?.id; }
    if (!id) return;
    const { data } = await (supabase as any)
      .from('spirit_chat_threads')
      .select('id, title, goal_id, last_message_at')
      .eq('user_id', id).order('last_message_at', { ascending: false }).limit(40);
    if (data) setThreads(data as ThreadSummary[]);
  }

  // Start a brand-new conversation
  function startNewChat() {
    if (persistTimer.current) clearTimeout(persistTimer.current);
    setThreadId(null);
    threadIdRef.current = null;
    setGoalId(null);
    setGpsData(null);
    setGpsSteps([]);
    setAffiliates([]);
    setPhase('discovery');
    setDiscoveryTurn(0);
    setDiscoveryComplete(false);
    setDuplicateChecked(false);
    setDuplicateResolved(false);
    setAwaitingCommitment(false);
    setCommitmentCleared(false);
    setActionLevel(null);
    setActionLevelShown(false);
    setShowPathTo95(false);
    setPathTo95Accepted(false);
    setHistoryOpen(false);

    const greeting = `Hey ${userName || 'Villager'}! I'm ready to help you build your Goal GPS — the step-by-step roadmap that takes you from where you are to exactly where you want to be.\n\nTell me your goal.`;
    const greetingMsg: ChatMessage = { id: spiritId(), role: 'spirit', content: greeting, timestamp: new Date() };
    setMessages([greetingMsg]);
    setChatItems([{ kind: 'message', msg: greetingMsg }]);
  }

  // Resume a saved thread
  async function openThread(id: string) {
    setHistoryOpen(false);
    if (persistTimer.current) clearTimeout(persistTimer.current);
    const { data } = await (supabase as any)
      .from('spirit_chat_threads').select('*').eq('id', id).single();
    if (!data) return;

    const restored: ChatMessage[] = (data.messages ?? []).map((m: any, i: number) => ({
      id:        `${m.role}-restored-${i}`,
      role:      m.role as 'spirit' | 'user',
      content:   m.content,
      timestamp: m.ts ? new Date(m.ts) : new Date(),
    }));

    setThreadId(data.id);
    threadIdRef.current = data.id;
    setMessages(restored);
    setChatItems(restored.map(msg => ({ kind: 'message' as const, msg })));
    setGoalId(data.goal_id ?? null);

    // Resume in a state where new input flows straight to Spirit (it has the
    // full transcript as context), skipping the scripted discovery questions.
    setPhase((data.phase as Phase) ?? 'success');
    setDiscoveryComplete(true);
    setDiscoveryTurn(99);
    setDuplicateChecked(true);
    setDuplicateResolved(true);
    setCommitmentCleared(true);
    setAwaitingCommitment(false);
  }

  async function deleteThread(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    await (supabase as any).from('spirit_chat_threads').delete().eq('id', id);
    setThreads(prev => prev.filter(t => t.id !== id));
    if (threadIdRef.current === id) startNewChat();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  function addSpiritMessage(content: string): ChatMessage {
    const msg: ChatMessage = { id: spiritId(), role: 'spirit', content, timestamp: new Date() };
    setMessages(prev => [...prev, msg]);
    setChatItems(prev => [...prev, { kind: 'message', msg }]);
    const first = content.split(/[.!?]/)[0];
    if (first.length > 5) speak(first, 'casual');
    return msg;
  }

  function addUserMessage(content: string): ChatMessage {
    const msg: ChatMessage = { id: userId(), role: 'user', content, timestamp: new Date() };
    setMessages(prev => [...prev, msg]);
    setChatItems(prev => [...prev, { kind: 'message', msg }]);
    return msg;
  }

  // Check for goal duplicates against user's existing goals
  function checkDuplicate(goalText: string): { id: string; title: string } | null {
    for (const g of existingGoals) {
      if (countCommonWords(goalText, g.title) > 3) return g;
    }
    return null;
  }

  // Inject action level selector into the chat stream
  function showActionLevelSelector() {
    if (actionLevelShown) return;
    setActionLevelShown(true);
    setChatItems(prev => [...prev, { kind: 'action_level_selector', id: `als-${Date.now()}` }]);
  }

  // Handle action level tap
  function handleActionLevelSelect(level: 1 | 2 | 3) {
    const levelNames = { 1: 'Wayfinder', 2: 'Pathfinder', 3: 'Trailblazer' };
    setActionLevel(level);
    // Send as a user message to continue the conversation
    const content = `I choose ${levelNames[level]}`;
    sendWithContent(content);
  }

  // Handle duplicate alert buttons
  function handleBuildOnExisting(existingGoalId: string) {
    setDuplicateResolved(true);
    router.push(`/village/workshop/goal/${existingGoalId}`);
  }

  function handleCreateSeparate() {
    setDuplicateResolved(true);
    // Remove the duplicate alert item, add a Spirit message and continue
    setChatItems(prev => prev.filter(i => i.kind !== 'duplicate_alert'));
    addSpiritMessage('Got it — let\'s build a fresh plan. Walk me through it.');
  }

  const sendMessage = useCallback(async () => {
    if (!input.trim() || typing || generating) return;

    // Speak any pending greeting
    const pending = sessionStorage.getItem('spirit_pending_speak');
    if (pending) { sessionStorage.removeItem('spirit_pending_speak'); speak(pending, 'casual'); }

    await sendWithContent(input.trim());
    setInput('');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, typing, generating]);

  // Core send logic — can be called with explicit content (action level choice) or from input
  const sendWithContent = useCallback(async (content: string) => {
    const userMsg = addUserMessage(content);

    // ── Phase 1: multi-question discovery flow ──────────────────────────────
    if (phase === 'discovery' && !discoveryComplete) {
      const nextTurn = discoveryTurn + 1;
      setDiscoveryTurn(nextTurn);

      // After Q1 answer: check for duplicates (only once)
      if (nextTurn === 1 && !duplicateChecked) {
        setDuplicateChecked(true);
        const dup = checkDuplicate(content);
        if (dup && !duplicateResolved) {
          // Show duplicate alert inline and halt discovery
          setChatItems(prev => [...prev, { kind: 'duplicate_alert', id: `dup-${Date.now()}`, existingTitle: dup.title, existingGoalId: dup.id }]);
          return; // Wait for user to resolve duplicate alert
        }
      }

      // Ask next discovery question if we haven't done all 4
      if (nextTurn < DISCOVERY_QUESTIONS.length) {
        const nextQ = DISCOVERY_QUESTIONS[nextTurn];
        if (nextQ) {
          setTyping(true);
          await new Promise(r => setTimeout(r, 700));
          setTyping(false);
          addSpiritMessage(nextQ);
        }
        return; // Stay in discovery, don't hit the API yet
      }

      // All 4 questions answered — mark discovery complete and transition to Phase 2
      setDiscoveryComplete(true);
      setPhase('success');
      // Fall through to API call so Spirit can start Phase 2
    }

    // ── Phase 2: commitment score gate ─────────────────────────────────────
    if (phase === 'success' && awaitingCommitment && !commitmentCleared) {
      const score = extractCommitmentScore(content);
      if (score !== null && score < 7) {
        // Score too low — Spirit asks what would make it higher
        setTyping(true);
        await new Promise(r => setTimeout(r, 700));
        setTyping(false);
        addSpiritMessage('What would make it an 8 or 9 for you?');
        return; // Stay in commitment gate
      } else if (score !== null && score >= 7) {
        setCommitmentCleared(true);
        setAwaitingCommitment(false);
        // Fall through to API
      }
      // If no number found, fall through to API and let Spirit handle it
    }

    // ── Phase 4: show action level selector after API response ─────────────
    // (handled in the API response handler below)

    // ── Call Spirit API ─────────────────────────────────────────────────────
    setTyping(true);

    const allMsgs = [...messages, userMsg];

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch('/api/spirit/goal-chat', {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          messages: allMsgs.map(m => ({
            role:    m.role === 'spirit' ? 'assistant' : 'user',
            content: m.content,
          })),
          context: {
            phase,
            discoveryComplete,
            actionLevel,
            awaitingCommitment,
          },
        }),
      });

      setTyping(false);

      if (!res.ok) {
        const status = res.status;
        const fallback = status === 401
          ? 'Reconnecting you to Spirit — please try again.'
          : status >= 500
          ? 'Spirit is thinking hard on this one. Give it a second and try again.'
          : 'Something went wrong. Try sending that again.';
        addSpiritMessage(fallback);
        return;
      }

      const data = await res.json();
      const message = data.message ?? 'Spirit is here. Keep going.';

      const spiritMsg: ChatMessage = { id: spiritId(), role: 'spirit', content: message, timestamp: new Date() };
      setMessages(prev => [...prev, spiritMsg]);
      setChatItems(prev => [...prev, { kind: 'message', msg: spiritMsg }]);
      const firstSentence = message.split(/[.!?]/)[0];
      if (firstSentence.length > 5) speak(firstSentence, 'casual');

      if (data.phase) setPhase(data.phase as Phase);

      // ── Detect commitment score question from Spirit ──────────────────────
      // Spirit asks for commitment score in Phase 2 — enable the gate
      if (
        data.phase === 'success' &&
        !awaitingCommitment &&
        !commitmentCleared &&
        (message.toLowerCase().includes('scale of 1-10') || message.toLowerCase().includes('how committed'))
      ) {
        setAwaitingCommitment(true);
      }

      // ── Phase 4: inject action level selector after Spirit's resources Q ──
      if (data.phase === 'resources' && !actionLevelShown) {
        // Give a short delay then inject the selector
        setTimeout(() => showActionLevelSelector(), 400);
      }

      // GPS is ready — generate the full plan
      if (data.gpsReady && data.gpsData && !gpsData) {
        const gpsDataWithLevel = { ...data.gpsData, actionLevel: actionLevel ?? 2 };
        setGpsData(gpsDataWithLevel);
        setPhase('ready');
        generateGPS(gpsDataWithLevel, allMsgs.map(m => m.content).join(' '));
      }
    } catch (err) {
      setTyping(false);
      const msg = err instanceof TypeError && String(err).includes('fetch')
        ? 'No connection — check your internet and try again.'
        : 'Spirit hit a snag. Send that again and we will keep going.';
      addSpiritMessage(msg);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, phase, discoveryTurn, discoveryComplete, duplicateChecked, duplicateResolved,
      awaitingCommitment, commitmentCleared, actionLevel, actionLevelShown, gpsData, typing, generating]);

  // Keep the mic callback pointed at the latest sendWithContent
  useEffect(() => { sendWithContentRef.current = sendWithContent; }, [sendWithContent]);

  async function generateGPS(gps: any, summary: string) {
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch('/api/spirit/goal-gps', {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body:    JSON.stringify({ gpsData: gps, conversationSummary: summary }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.goalId) {
        setGenerating(false);
        addSpiritMessage(
          'I built your plan but hit a snag saving it. Tap the 🎤 or send any message and I\'ll try again — your answers are safe.'
        );
        return;
      }

      if (data.goalId) {
        setGoalId(data.goalId);
        setGpsSteps(data.steps ?? []);
        setAffiliates(data.affiliateProducts ?? []);

        if (data.firstTimeFeatures?.needsTradingPostTour) {
          localStorage.setItem('villa9e_needs_trading_tour', '1');
        }
        if (data.firstTimeFeatures?.needsBudgetSetup) {
          localStorage.setItem('villa9e_needs_budget_setup', '1');
        }

        // pathTo95: if probability < 70, show gap guidance first and wait for
        // the user. Otherwise the GPS is ready — automatically take them to it.
        const probScore = gps?.probabilityScore ?? 0;
        if (probScore > 0 && probScore < 70) {
          setShowPathTo95(true);
          setGenerating(false);
          return;
        }
        setGenerating(false);
        setCountdown(true);            // brief transition, then route to GPS page
        speak('Your GPS is ready. Taking you there now.', 'serious');
        return;
      }
    } catch { /* non-blocking */ }
    setGenerating(false);
  }

  // When the user accepts a below-threshold plan, proceed to the GPS page too.
  useEffect(() => {
    if (pathTo95Accepted && goalId) {
      setCountdown(true);
      speak('Your GPS is ready. Taking you there now.', 'serious');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathTo95Accepted]);

  function handleStart() {
    setCountdown(true);
    speak('GPS activated. Your journey starts now.', 'serious');
  }

  // GPS created → countdown finishes → go straight to the goal's GPS page.
  function handleCountdownComplete() {
    setCountdown(false);
    setPhase('launched');
    navigateToGoal();
  }

  function navigateToGoal() {
    const needsTradingTour = localStorage.getItem('villa9e_needs_trading_tour') === '1';
    const needsBudgetSetup = localStorage.getItem('villa9e_needs_budget_setup') === '1';
    if (needsTradingTour) {
      localStorage.removeItem('villa9e_needs_trading_tour');
      router.push('/village/workshop/goal/' + goalId + '?tour=trading');
    } else if (needsBudgetSetup) {
      localStorage.removeItem('villa9e_needs_budget_setup');
      router.push('/village/workshop/goal/' + goalId + '?tour=budget');
    } else {
      router.push('/village/workshop/goal/' + goalId);
    }
  }

  async function handleShareTemplate() {
    if (!goalId) { navigateToGoal(); return; }
    setTemplateSaving(true);
    try {
      await fetch('/api/goals/template', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ goalId }),
      });
      speak('Template shared! Other villagers can now clone your plan. That\'s leadership.', 'casual');
    } catch { /* non-blocking */ }
    setTemplateSaving(false);
    setShowTemplatePrompt(false);
    setTimeout(navigateToGoal, 1000);
  }

  function handleSkipTemplate() {
    setShowTemplatePrompt(false);
    navigateToGoal();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  const phaseIdx = PHASES.findIndex(p => p.key === phase);

  return (
    <div className="flex flex-col" style={{ height: '100dvh', background: bg }}>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 z-10"
        style={{ background: isNight ? 'rgba(6,8,14,0.92)' : 'rgba(248,245,255,0.92)', backdropFilter: 'blur(16px)', borderBottom: `1px solid ${border}` }}>
        <Link href="/village/workshop"
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(124,58,237,0.12)', color: '#7C3AED' }}>
          ←
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black truncate" style={{ color: text }}>Spirit Goal GPS</p>
          <p className="text-[10px]" style={{ color: muted }}>Conversational goal building</p>
        </div>

        {/* History */}
        <button
          onClick={() => setHistoryOpen(true)}
          aria-label="Chat history"
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(124,58,237,0.12)', color: '#7C3AED' }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
          </svg>
        </button>

        {/* New chat */}
        <button
          onClick={startNewChat}
          aria-label="New chat"
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(124,58,237,0.12)', color: '#7C3AED' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>

        {/* Voice call */}
        <button
          onClick={() => setVoiceCallOpen(true)}
          aria-label="Talk to Spirit"
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white"
          style={{ background: 'linear-gradient(135deg,#7C3AED,#1877F2)' }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
            <rect x="9" y="3" width="6" height="11" rx="3" fill="#fff" />
            <path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* ── Chat items ──────────────────────────────────────────────── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ minHeight: 0 }}>

        {chatItems.map(item => {
          if (item.kind === 'message') {
            const msg = item.msg;
            return (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                {msg.role === 'spirit' && (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mb-1"
                    style={{ background: 'linear-gradient(135deg,#7C3AED,#1877F2)', fontSize: 16 }}>
                    🌿
                  </div>
                )}
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className="max-w-[78%] px-4 py-3 rounded-3xl text-sm leading-relaxed"
                  style={msg.role === 'spirit'
                    ? {
                        background:   isNight ? 'rgba(124,58,237,0.12)' : 'rgba(124,58,237,0.08)',
                        border:       `1px solid ${isNight ? 'rgba(124,58,237,0.25)' : 'rgba(124,58,237,0.15)'}`,
                        color:        text,
                        borderRadius: '4px 20px 20px 20px',
                      }
                    : {
                        background:   'linear-gradient(135deg, #7C3AED, #1877F2)',
                        color:        '#fff',
                        borderRadius: '20px 4px 20px 20px',
                      }
                  }
                >
                  {msg.content.split('\n').map((line, i, arr) => (
                    <span key={i}>{line.replace(/\*\*(.*?)\*\*/g, '$1')}{i < arr.length - 1 && <br />}</span>
                  ))}
                </motion.div>
              </div>
            );
          }

          if (item.kind === 'action_level_selector') {
            return (
              <ActionLevelSelector
                key={item.id}
                onSelect={handleActionLevelSelect}
                isNight={isNight}
                card={card} border={border} text={text} muted={muted}
              />
            );
          }

          if (item.kind === 'duplicate_alert') {
            return (
              <DuplicateAlert
                key={item.id}
                existingTitle={item.existingTitle}
                onBuildOn={() => handleBuildOnExisting(item.existingGoalId)}
                onCreateNew={handleCreateSeparate}
                isNight={isNight}
                card={card} border={border} text={text} muted={muted}
              />
            );
          }

          return null;
        })}

        {/* Typing indicator */}
        {typing && (
          <div className="flex items-end gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#7C3AED,#1877F2)', fontSize: 16 }}>🌿</div>
            <TypingDots />
          </div>
        )}

        {/* pathTo95 screen — shown when probability < 70 */}
        {gpsData && !generating && showPathTo95 && !pathTo95Accepted && phase !== 'launched' && (
          <PathTo95Screen
            probabilityScore={gpsData.probabilityScore ?? 0}
            gapAnalysis={gpsData.gapAnalysis ?? []}
            onAddToPlan={async (gap) => {
              try {
                await fetch('/api/goals/add-gap-task', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ goal_id: goalId, gap }),
                });
              } catch { /* silent */ }
            }}
            onGenerateAnyway={() => setPathTo95Accepted(true)}
            isNight={isNight}
          />
        )}

        {/* GPS Card — shows when ready (probability >= 70 or user accepted risk) */}
        {gpsData && !generating && gpsSteps.length > 0 && phase !== 'launched' &&
          (!showPathTo95 || pathTo95Accepted) && (
          <div>
            {pathTo95Accepted && gpsData.probabilityScore < 70 && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-2 mb-3 px-4 py-3 rounded-2xl"
                style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.35)' }}
              >
                <p style={{ fontSize: 12, color: '#F59E0B', fontWeight: 700 }}>
                  Proceeding with {gpsData.probabilityScore}% probability — Spirit recommends addressing the gaps above to improve your odds.
                </p>
              </motion.div>
            )}
            <GPSCard
              gpsData={gpsData}
              steps={gpsSteps}
              affiliates={affiliates}
              onStart={handleStart}
              isNight={isNight}
            />
          </div>
        )}
      </div>

      {/* ── Input area (hidden after launch) ───────────────────────── */}
      {phase !== 'launched' && !gpsData && (
        <div className="flex-shrink-0 px-3 pb-4 pt-2"
          style={{ background: isNight ? 'rgba(6,8,14,0.92)' : 'rgba(248,245,255,0.92)', backdropFilter: 'blur(16px)', borderTop: `1px solid ${border}` }}>
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={chatMic.listening ? chatMic.transcript : input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={chatMic.listening ? 'Listening…' : 'Tell Spirit…'}
              rows={1}
              readOnly={chatMic.listening}
              className="flex-1 resize-none rounded-3xl text-sm px-4 py-3 focus:outline-none"
              style={{
                background: isNight ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                border:     `1.5px solid ${chatMic.listening ? '#7C3AED' : border}`,
                color:      text,
                minHeight:  44,
                maxHeight:  120,
              }}
              onInput={e => {
                const t = e.currentTarget;
                t.style.height = 'auto';
                t.style.height = Math.min(t.scrollHeight, 120) + 'px';
              }}
            />

            {/* Microphone — push to talk, auto-sends on pause */}
            {chatMic.supported && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => { if (chatMic.listening) chatMic.stop(); else { chatMic.reset(); chatMic.start(); } }}
                disabled={typing || generating}
                aria-label={chatMic.listening ? 'Stop listening' : 'Speak to Spirit'}
                className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-30 relative"
                style={{ background: chatMic.listening ? '#EF4444' : 'rgba(124,58,237,0.15)' }}
              >
                {chatMic.listening && (
                  <motion.span className="absolute inset-0 rounded-full"
                    style={{ border: '2px solid #EF4444' }}
                    animate={{ scale: [1, 1.45], opacity: [0.6, 0] }}
                    transition={{ duration: 1.1, repeat: Infinity }} />
                )}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect x="9" y="3" width="6" height="11" rx="3" fill={chatMic.listening ? '#fff' : '#7C3AED'} />
                  <path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke={chatMic.listening ? '#fff' : '#7C3AED'} strokeWidth="2" strokeLinecap="round" />
                </svg>
              </motion.button>
            )}

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={sendMessage}
              disabled={!input.trim() || typing}
              className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-30"
              style={{ background: input.trim() ? 'linear-gradient(135deg,#7C3AED,#1877F2)' : 'rgba(124,58,237,0.2)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </motion.button>
          </div>
          <p className="text-center text-[10px] mt-1.5" style={{ color: muted }}>
            {chatMic.supported ? 'Type, or tap 🎤 to talk · Enter to send' : 'Press Enter to send · Shift+Enter for new line'}
          </p>
        </div>
      )}

      {/* ── Agent wave loading overlay (Phase 5 — Generating) ──────── */}
      <AnimatePresence>
        {generating && (
          <AgentWaveOverlay probabilityScore={gpsData?.probabilityScore} />
        )}
      </AnimatePresence>

      {/* ── Countdown ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {countdown && <CountdownOverlay onComplete={handleCountdownComplete} />}
      </AnimatePresence>

      {/* ── Template prompt — appears after countdown ───────────────── */}
      <AnimatePresence>
        {showTemplatePrompt && (
          <motion.div
            className="fixed inset-0 z-[90] flex items-end justify-center pb-8 px-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-sm rounded-3xl p-6 space-y-5"
              style={{ background: isNight ? '#0D1020' : '#FFFFFF', border: `1px solid ${border}` }}
              initial={{ y: 60, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 260 }}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-lg"
                  style={{ background: 'linear-gradient(135deg,#7C3AED,#1877F2)' }}>
                  🌿
                </div>
                <div className="flex-1">
                  <p className="text-sm leading-relaxed" style={{ color: text }}>
                    Your GPS is live! Would you like to share this goal plan as a <strong>template</strong> that other villagers can clone and use?
                  </p>
                  <p className="text-xs mt-1.5" style={{ color: muted }}>
                    You get +5 $VLG every time someone clones it. That&apos;s leadership.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleShareTemplate}
                  disabled={templateSaving}
                  className="py-3.5 rounded-2xl text-sm font-black transition-all"
                  style={{
                    background: 'linear-gradient(135deg,#7C3AED,#1877F2)',
                    color:      '#fff',
                    boxShadow:  '0 4px 20px rgba(124,58,237,0.4)',
                  }}
                >
                  {templateSaving ? '…' : '🌟 Yes, share it'}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleSkipTemplate}
                  className="py-3.5 rounded-2xl text-sm font-bold transition-all"
                  style={{
                    background: isNight ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                    color:      muted,
                    border:     `1px solid ${border}`,
                  }}
                >
                  Keep it private
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Chat history drawer ─────────────────────────────────────── */}
      <AnimatePresence>
        {historyOpen && (
          <motion.div
            className="fixed inset-0 z-[110] flex"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setHistoryOpen(false)} />
            <motion.div
              initial={{ x: -340 }} animate={{ x: 0 }} exit={{ x: -340 }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              className="relative w-[300px] max-w-[82%] h-full flex flex-col"
              style={{ background: isNight ? '#080A14' : '#FFFFFF', borderRight: `1px solid ${border}` }}
            >
              <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: `1px solid ${border}` }}>
                <p className="text-sm font-black" style={{ color: text }}>Your chats</p>
                <button onClick={() => setHistoryOpen(false)} className="text-lg" style={{ color: muted }}>✕</button>
              </div>

              <button
                onClick={startNewChat}
                className="mx-3 mt-3 mb-1 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 text-white flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#7C3AED,#1877F2)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                New chat
              </button>

              <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
                {threads.length === 0 && (
                  <p className="text-xs text-center mt-6" style={{ color: muted }}>No saved chats yet. Start talking to Spirit and your conversations will appear here.</p>
                )}
                {threads.map(t => {
                  const active = t.id === threadId;
                  return (
                    <div key={t.id}
                      onClick={() => openThread(t.id)}
                      className="group flex items-center gap-2 px-3 py-2.5 rounded-2xl cursor-pointer transition-all"
                      style={{
                        background: active ? 'rgba(124,58,237,0.15)' : 'transparent',
                        border: `1px solid ${active ? 'rgba(124,58,237,0.4)' : 'transparent'}`,
                      }}>
                      <span className="text-sm flex-shrink-0">{t.goal_id ? '🎯' : '💬'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: text }}>{t.title || 'New chat'}</p>
                        <p className="text-[10px]" style={{ color: muted }}>
                          {new Date(t.last_message_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <button onClick={(e) => deleteThread(t.id, e)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-xs px-1.5"
                        style={{ color: '#EF4444' }} aria-label="Delete chat">🗑</button>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Immersive voice call ────────────────────────────────────── */}
      <SpiritVoiceCall
        open={voiceCallOpen}
        variant={spiritVariant}
        lastSpiritMessage={lastSpiritMessage}
        thinking={typing || generating}
        onSend={(t) => sendWithContentRef.current?.(t)}
        onClose={() => setVoiceCallOpen(false)}
      />
    </div>
  );
}
