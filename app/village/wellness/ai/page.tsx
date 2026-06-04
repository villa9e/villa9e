'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { BackButton } from '@/components/village/BackButton';
import { WellnessNav } from '@/components/wellness/WellnessNav';

interface Message {
  role: 'ai' | 'user';
  text: string;
}

interface WellnessContext {
  readiness: number;
  mood: string | null;
  energy: number | null;
  stress: number | null;
  focus: number | null;
}

const INITIAL_MESSAGE = "Hello! I'm Spirit, your wellness advisor. Log your mood, energy, and stress daily to get personalized insights. Ask me anything about your wellbeing, nutrition, or recovery.";

const SUGGESTED = [
  'What does my wellness data show today?',
  'How can I improve my sleep quality?',
  'What should I eat to reduce stress?',
];

export default function AIHealthPage() {
  const router = useRouter();
  const supabase = createClient();
  const [messages, setMessages] = useState<Message[]>([{ role: 'ai', text: INITIAL_MESSAGE }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState<WellnessContext>({ readiness: 0, mood: null, energy: null, stress: null, focus: null });
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const today = new Date().toISOString().split('T')[0];
      const { data: log } = await (supabase as any)
        .from('wellness_logs')
        .select('readiness,mood,energy,stress,focus,ai_insight')
        .eq('user_id', user.id)
        .eq('log_date', today)
        .single();

      if (log) {
        setContext({
          readiness: parseFloat(log.readiness ?? 0),
          mood: log.mood ?? null,
          energy: log.energy ?? null,
          stress: log.stress ?? null,
          focus: log.focus ?? null,
        });
        // Seed AI with today's insight if available
        if (log.ai_insight) {
          setMessages([{ role: 'ai', text: log.ai_insight }]);
        }
      }
    });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setMessages(m => [...m, { role: 'user', text: trimmed }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/wellness/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, context }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(m => [...m, { role: 'ai', text: data.reply }]);
      } else {
        throw new Error('API failed');
      }
    } catch {
      setMessages(m => [...m, {
        role: 'ai',
        text: 'I\'m having trouble connecting right now. Take a deep breath — your data is still tracking. Try again in a moment.',
      }]);
    }
    setLoading(false);
  }

  return (
    <div style={{ background: '#111827', minHeight: '100vh', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      <BackButton to="/village/wellness" />

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, display: 'flex', alignItems: 'center', padding: '14px 16px 14px 60px', background: 'rgba(17,24,39,0.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          onClick={() => router.push('/village/wellness')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#22C55E', fontWeight: 800, fontSize: 14, background: 'transparent', border: 'none', cursor: 'pointer', marginRight: 12 }}
        >
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <p style={{ fontSize: 20, fontWeight: 900, flex: 1 }}>AI Health</p>
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
      </div>

      {/* Disclaimer banner */}
      <div style={{ background: 'rgba(34,197,94,0.06)', border: 'none', borderBottom: '1px solid rgba(34,197,94,0.12)', padding: '10px 16px', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" style={{ marginTop: 1, flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>
          Not a diagnosis. For medical decisions, always consult your healthcare provider. In an emergency, call 911.
        </p>
      </div>

      {/* Context pill */}
      {(context.mood || context.energy) && (
        <div style={{ padding: '8px 16px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {context.mood && (
            <span style={{ fontSize: 11, fontWeight: 700, color: '#34D399', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 12, padding: '3px 10px' }}>
              Mood: {context.mood}
            </span>
          )}
          {context.energy && (
            <span style={{ fontSize: 11, fontWeight: 700, color: '#34D399', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 12, padding: '3px 10px' }}>
              Energy: {context.energy}/5
            </span>
          )}
          {context.readiness > 0 && (
            <span style={{ fontSize: 11, fontWeight: 700, color: '#34D399', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 12, padding: '3px 10px' }}>
              Readiness: {context.readiness}/10
            </span>
          )}
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'ai' ? 'flex-start' : 'flex-end' }}>
            <div style={{
              maxWidth: '85%', padding: '12px 14px',
              borderRadius: m.role === 'ai' ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
              background: m.role === 'ai' ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.09)',
              border: m.role === 'ai' ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(255,255,255,0.12)',
            }}>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.55 }}>{m.text}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '12px 16px', background: 'rgba(34,197,94,0.1)', borderRadius: '4px 16px 16px 16px', border: '1px solid rgba(34,197,94,0.2)' }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {[0, 1, 2].map(i => (
                  <motion.div key={i} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                    style={{ width: 6, height: 6, borderRadius: 3, background: '#34D399' }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested prompts (only when few messages) */}
      {messages.length <= 2 && (
        <div style={{ padding: '0 16px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {SUGGESTED.map(s => (
            <button key={s} onClick={() => send(s)}
              style={{ textAlign: 'left', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 13, color: 'rgba(255,255,255,0.65)', fontWeight: 600, cursor: 'pointer' }}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ padding: '10px 16px', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 64px)', display: 'flex', gap: 10, background: 'rgba(17,24,39,0.97)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send(input)}
          placeholder="Ask about your health..."
          style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 24, padding: '10px 16px', fontSize: 14, color: '#fff', outline: 'none' }}
        />
        <button
          onClick={() => send(input)}
          disabled={loading || !input.trim()}
          style={{ width: 40, height: 40, borderRadius: 20, background: input.trim() ? '#22C55E' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: 'none', cursor: input.trim() ? 'pointer' : 'not-allowed', opacity: loading ? 0.6 : 1 }}
        >
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" />
          </svg>
        </button>
      </div>

      <WellnessNav />
    </div>
  );
}
