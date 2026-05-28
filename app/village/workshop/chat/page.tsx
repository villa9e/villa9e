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

type Phase = 'discovery' | 'success' | 'proximity' | 'resources' | 'generating' | 'ready' | 'launched';

const PHASES: { key: Phase; label: string }[] = [
  { key: 'discovery',   label: 'What' },
  { key: 'success',     label: 'When' },
  { key: 'proximity',   label: 'Where' },
  { key: 'resources',   label: 'How' },
  { key: 'generating',  label: 'Building' },
  { key: 'ready',       label: 'Launch' },
];

function spiritId() { return `spirit-${Date.now()}`; }
function userId()   { return `user-${Date.now()}`; }

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

      {/* First 3 steps */}
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
      style={{ background: 'radial-gradient(ellipse at center, #1A0A2E 0%, #060810 100%)' }}>
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

  const bg     = isNight ? '#06080E' : '#F8F5FF';
  const card   = isNight ? '#0D1020' : '#FFFFFF';
  const border = isNight ? '#1A1F3A' : '#E8E3FF';
  const text   = isNight ? '#F0EBE0' : '#1E1B4B';
  const muted  = isNight ? '#4A4F72' : '#6B7280';

  const [messages,   setMessages]   = useState<ChatMessage[]>([]);
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

  const scrollRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);

  // Load user name and start conversation
  // Note: don't call speak() here — browsers block autoplay before user interaction
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from('profiles').select('display_name, username').eq('id', user.id).single()
        .then(({ data }: any) => {
          const name = data?.display_name || data?.username || 'Villager';
          setUserName(name);
          const greeting = `Hey ${name}! I'm ready to help you build your Goal GPS — the step-by-step roadmap that takes you from where you are to exactly where you want to be.\n\nWhat goal are we building today?`;
          setMessages([{
            id:        spiritId(),
            role:      'spirit',
            content:   greeting,
            timestamp: new Date(),
          }]);
          // Store greeting so we can speak it after first user interaction
          sessionStorage.setItem('spirit_pending_speak', greeting.split('\n')[0]);
        });
    });
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typing]);

  // Build conversation history for API
  function buildHistory() {
    return messages.map(m => ({
      role:    m.role === 'spirit' ? 'assistant' as const : 'user' as const,
      content: m.content,
    }));
  }

  const sendMessage = useCallback(async () => {
    if (!input.trim() || typing || generating) return;

    // Speak any pending greeting (must happen after user interaction for autoplay to work)
    const pending = sessionStorage.getItem('spirit_pending_speak');
    if (pending) { sessionStorage.removeItem('spirit_pending_speak'); speak(pending, 'casual'); }

    const userMsg: ChatMessage = {
      id: userId(), role: 'user', content: input.trim(), timestamp: new Date(),
    };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setTyping(true);

    try {
      const res = await fetch('/api/spirit/goal-chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          messages: newMessages.map(m => ({
            role:    m.role === 'spirit' ? 'assistant' : 'user',
            content: m.content,
          })),
          context: {},
        }),
      });

      const data = await res.json();
      setTyping(false);

      const spiritMsg: ChatMessage = {
        id: spiritId(), role: 'spirit', content: data.message, timestamp: new Date(),
      };
      setMessages(prev => [...prev, spiritMsg]);
      setPhase(data.phase as Phase);

      // Speak the response (first sentence only for length)
      const firstSentence = data.message.split(/[.!?]/)[0];
      if (firstSentence.length > 5) speak(firstSentence, 'casual');

      // GPS is ready — generate the full plan
      if (data.gpsReady && data.gpsData && !gpsData) {
        setGpsData(data.gpsData);
        setPhase('ready');
        generateGPS(data.gpsData, newMessages.map(m => m.content).join(' '));
      }
    } catch {
      setTyping(false);
      setMessages(prev => [...prev, {
        id: spiritId(), role: 'spirit',
        content: 'I lost connection for a second. Can you say that again?',
        timestamp: new Date(),
      }]);
    }
  }, [input, messages, typing, generating, gpsData]);

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

        // First-time feature checks
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
    // Ask about template before navigating
    setShowTemplatePrompt(true);
    const prompt = `Your GPS is live! 🎉 Before you head in — would you like to share this goal plan as a template? Other villagers working toward the same thing can clone it and get a headstart.`;
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

  // Enter key sends
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
                width: i <= phaseIdx ? 16 : 6,
                height: 6,
                background: i <= phaseIdx ? '#7C3AED' : isNight ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              }} />
          ))}
        </div>
      </div>

      {/* ── Chat messages ───────────────────────────────────────────── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ minHeight: 0 }}>

        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}>
            {/* Spirit avatar */}
            {msg.role === 'spirit' && (
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mb-1"
                style={{ background: 'linear-gradient(135deg,#7C3AED,#1877F2)', fontSize: 16 }}>
                🌿
              </div>
            )}

            {/* Bubble */}
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
              {msg.content.split('\n').map((line, i) => (
                <span key={i}>{line.replace(/\*\*(.*?)\*\*/g, '$1')}{i < msg.content.split('\n').length - 1 && <br />}</span>
              ))}
            </motion.div>
          </div>
        ))}

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
                background:   isNight ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                border:       `1.5px solid ${border}`,
                color:        text,
                minHeight:    44,
                maxHeight:    120,
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
              {/* Spirit asking */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-lg"
                  style={{ background: 'linear-gradient(135deg,#7C3AED,#1877F2)' }}>
                  🌿
                </div>
                <div className="flex-1">
                  <p className="text-sm leading-relaxed" style={{ color: text }}>
                    Your GPS is live! 🎉 Would you like to share this goal plan as a <strong>template</strong> that other villagers can clone and use?
                  </p>
                  <p className="text-xs mt-1.5" style={{ color: muted }}>
                    You get +5 $VLG every time someone clones it. That&apos;s leadership.
                  </p>
                </div>
              </div>

              {/* Action buttons */}
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
