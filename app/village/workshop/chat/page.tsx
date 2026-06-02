'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { useSpiritVoice } from '@/components/village/SpiritVoiceProvider';
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

  const scrollRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);

  // ── Load user name, existing goals, and start conversation ────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;

      // Load profile + existing goals in parallel
      Promise.all([
        supabase.from('profiles').select('display_name, username').eq('id', user.id).single(),
        supabase.from('goals').select('id, title').eq('user_id', user.id).eq('status', 'active').limit(10),
      ]).then(([profileRes, goalsRes]) => {
        const data = profileRes.data as any;
        const name = data?.display_name || data?.username || 'Villager';
        setUserName(name);

        if (goalsRes.data) {
          setExistingGoals((goalsRes.data as any[]).map((g: any) => ({ id: g.id, title: g.title })));
        }

        const greeting = `Hey ${name}! I'm ready to help you build your Goal GPS — the step-by-step roadmap that takes you from where you are to exactly where you want to be.\n\nTell me your goal.`;
        const greetingMsg: ChatMessage = {
          id: spiritId(), role: 'spirit', content: greeting, timestamp: new Date(),
        };
        setMessages([greetingMsg]);
        setChatItems([{ kind: 'message', msg: greetingMsg }]);
        sessionStorage.setItem('spirit_pending_speak', greeting.split('\n')[0]);
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [chatItems, typing]);

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

  async function generateGPS(gps: any, summary: string) {
    setGenerating(true);
    try {
      const res = await fetch('/api/spirit/goal-gps', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ gpsData: gps, conversationSummary: summary }),
      });
      const data = await res.json();
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
      }
    } catch { /* non-blocking */ }
    setGenerating(false);
  }

  function handleStart() {
    setCountdown(true);
    speak('GPS activated. Your journey starts now.', 'serious');
  }

  function handleCountdownComplete() {
    setCountdown(false);
    setPhase('launched');
    setShowTemplatePrompt(true);
    const prompt = `Your GPS is live! Before you head in — would you like to share this goal plan as a template? Other villagers working toward the same thing can clone it and get a headstart.`;
    speak(prompt, 'casual');
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
        <div className="flex-1">
          <p className="text-sm font-black" style={{ color: text }}>Spirit Goal GPS</p>
          <p className="text-[10px]" style={{ color: muted }}>Conversational goal building</p>
        </div>
        {/* Phase progress dots */}
        <div className="flex items-center gap-1">
          {PHASES.slice(0, 5).map((p, i) => (
            <div key={p.key}
              className="rounded-full transition-all duration-500"
              style={{
                width:      i <= phaseIdx ? 16 : 6,
                height:     6,
                background: i <= phaseIdx ? '#7C3AED' : isNight ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              }} />
          ))}
        </div>
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

        {/* Generating message */}
        {generating && (
          <div className="flex justify-center">
            <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}
              className="px-4 py-2 rounded-full text-xs"
              style={{ background: 'rgba(124,58,237,0.12)', color: '#A78BFA', border: '1px solid rgba(124,58,237,0.2)' }}>
              Spirit is building your GPS…
            </motion.div>
          </div>
        )}

        {/* GPS Card — shows when ready */}
        {gpsData && !generating && gpsSteps.length > 0 && phase !== 'launched' && (
          <GPSCard
            gpsData={gpsData}
            steps={gpsSteps}
            affiliates={affiliates}
            onStart={handleStart}
            isNight={isNight}
          />
        )}
      </div>

      {/* ── Input area (hidden after launch) ───────────────────────── */}
      {phase !== 'launched' && !gpsData && (
        <div className="flex-shrink-0 px-3 pb-4 pt-2"
          style={{ background: isNight ? 'rgba(6,8,14,0.92)' : 'rgba(248,245,255,0.92)', backdropFilter: 'blur(16px)', borderTop: `1px solid ${border}` }}>
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tell Spirit…"
              rows={1}
              className="flex-1 resize-none rounded-3xl text-sm px-4 py-3 focus:outline-none"
              style={{
                background: isNight ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                border:     `1.5px solid ${border}`,
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
          <p className="text-center text-[10px] mt-1.5" style={{ color: muted }}>Press Enter to send · Shift+Enter for new line</p>
        </div>
      )}

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
    </div>
  );
}
