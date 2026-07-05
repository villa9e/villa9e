'use client';
import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';

interface Msg {
  role: 'user' | 'spirit';
  content: string;
  webSearchUsed?: boolean;
  searchQueries?: string[];
}

function AskSpiritInner() {
  const searchParams  = useSearchParams();
  const seedQuestion  = searchParams.get('q') ?? '';
  const { theme }     = useVillageTheme();
  const isNight       = theme === 'night';
  const supabase      = createClient();
  const bottomRef     = useRef<HTMLDivElement>(null);

  const bg      = isNight ? '#080E24' : '#F0F4FF';
  const cardBg  = isNight ? '#0D1020' : '#FFFFFF';
  const border  = isNight ? '#1A1F3A' : '#E0E7FF';
  const text    = isNight ? '#F0EBE0' : '#1E1B4B';
  const muted   = isNight ? '#4A4F72' : '#6B7280';
  const accent  = '#4D72FF';

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput]       = useState(seedQuestion);
  const [loading, setLoading]   = useState(false);
  const [token, setToken]       = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setToken(session?.access_token ?? null);
    });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);
    try {
      const history = messages.map(m => ({ role: m.role === 'spirit' ? 'assistant' : 'user', content: m.content }));
      const res = await fetch('/api/spirit/websearch', {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: msg, history, thread_id: threadId }),
      });
      const data = await res.json();
      if (data.thread_id && !threadId) setThreadId(data.thread_id);
      setMessages(prev => [...prev, {
        role:           'spirit',
        content:        data.reply ?? 'Spirit is here. Keep going.',
        webSearchUsed:  data.webSearchUsed ?? false,
        searchQueries:  data.searchQueries ?? [],
      }]);
    } catch {
      setMessages(prev => [...prev, { role: 'spirit', content: 'Something went wrong. Try again.' }]);
    } finally {
      setLoading(false);
    }
  }

  const STARTERS = [
    'What\'s the best protein source for building muscle on a budget?',
    'How do I start investing with under $500?',
    'What\'s a realistic morning routine for someone with two kids?',
    'Find me the latest research on habit formation.',
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: bg }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 py-3 flex items-center gap-3"
        style={{ background: isNight ? 'rgba(8,14,36,0.92)' : 'rgba(240,244,255,0.92)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${border}` }}>
        <Link href="/village/hut" className="text-xl leading-none" style={{ color: muted }}>←</Link>
        <div className="flex-1">
          <h1 className="font-black text-lg leading-tight" style={{ color: text }}>Ask Spirit</h1>
          <p className="text-xs" style={{ color: muted }}>Can search the web in real time</p>
        </div>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${accent}18`, color: accent, border: `1px solid ${accent}30` }}>
          LIVE
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col gap-3 pt-4">
            <p className="text-sm font-semibold text-center" style={{ color: muted }}>Ask me anything — I can look things up.</p>
            {STARTERS.map(q => (
              <button key={q} onClick={() => send(q)}
                className="text-left px-4 py-3 rounded-2xl text-sm leading-relaxed transition-all"
                style={{ background: cardBg, border: `1px solid ${border}`, color: text }}>
                {q}
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
              style={m.role === 'user'
                ? { background: accent, color: '#fff', borderBottomRightRadius: 6 }
                : { background: cardBg, color: text, border: `1px solid ${border}`, borderBottomLeftRadius: 6 }}>
              {m.content}
            </div>

            {/* Web search attribution */}
            {m.role === 'spirit' && m.webSearchUsed && (
              <div className="mt-1.5 flex flex-col gap-0.5 items-start max-w-[85%]">
                <p className="text-xs font-semibold" style={{ color: accent }}>Spirit searched the web for this</p>
                {(m.searchQueries ?? []).map((q, qi) => (
                  <p key={qi} className="text-xs" style={{ color: muted }}>› {q}</p>
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-start">
            <div className="px-4 py-3 rounded-2xl text-sm" style={{ background: cardBg, border: `1px solid ${border}`, color: muted }}>
              Spirit is thinking{'…'}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="sticky bottom-0 px-4 py-3 flex gap-2"
        style={{ background: isNight ? 'rgba(8,14,36,0.95)' : 'rgba(240,244,255,0.95)', backdropFilter: 'blur(12px)', borderTop: `1px solid ${border}` }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Ask Spirit anything…"
          className="flex-1 rounded-2xl px-4 py-2.5 text-sm focus:outline-none"
          style={{ background: cardBg, border: `1px solid ${border}`, color: text }}
          disabled={loading}
        />
        <button onClick={() => send()} disabled={loading || !input.trim()}
          className="px-4 py-2.5 rounded-2xl font-bold text-sm text-white disabled:opacity-40 transition-all"
          style={{ background: accent }}>
          {loading ? '…' : '↑'}
        </button>
      </div>
    </div>
  );
}

export default function AskSpiritPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: '#080E24' }} />}>
      <AskSpiritInner />
    </Suspense>
  );
}
