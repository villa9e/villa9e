'use client';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { SHOW_PREFIXES, HIDE_EXACT } from '@/components/village/BottomNav';

interface ChatMsg { role: 'user' | 'spirit'; text: string }

function extractReply(raw: any, fallbackText: string): string {
  const stripped = fallbackText.replace(/```json|```/g, '').trim();
  if (raw && typeof raw === 'object') {
    for (const key of ['response', 'reply', 'message', 'text', 'greeting']) {
      if (typeof raw[key] === 'string' && raw[key].trim()) return raw[key];
    }
    const firstString = Object.values(raw).find(v => typeof v === 'string' && (v as string).trim());
    if (firstString) return firstString as string;
  }
  return stripped || "I'm here.";
}

export default function SpiritFab() {
  const pathname = usePathname();
  const supabase = createClient();
  const [authed, setAuthed] = useState(false);
  const [open, setOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session?.user);
      setToken(session?.access_token ?? null);
    });
  }, []);

  // Load pending Spirit actions count
  useEffect(() => {
    if (!authed || !token) return;
    fetch('/api/spirit/actions', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setPendingCount((d.pending ?? []).length); })
      .catch(() => {});
  }, [authed, token]);

  // When opened, load the most recent thread (or create one on first send)
  useEffect(() => {
    if (!open || !authed || !token) return;
    if (messages.length > 0) return; // Already loaded

    setLoadingHistory(true);
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { setLoadingHistory(false); return; }
      const { data: threads } = await (supabase as any)
        .from('spirit_threads')
        .select('id, title, updated_at')
        .eq('user_id', session.user.id)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (!threads || threads.length === 0) { setLoadingHistory(false); return; }

      const latest = threads[0];
      setThreadId(latest.id);

      const { data: msgs } = await (supabase as any)
        .from('spirit_messages')
        .select('role, content')
        .eq('thread_id', latest.id)
        .order('created_at', { ascending: true })
        .limit(40);

      if (msgs && msgs.length > 0) {
        setMessages(msgs.map((m: any) => ({ role: m.role as 'user' | 'spirit', text: m.content })));
      }
      setLoadingHistory(false);
    });
  }, [open, authed, token]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open]);

  const isVisible = authed
    && SHOW_PREFIXES.some(p => pathname.startsWith(p))
    && !HIDE_EXACT.some(p => pathname === p)
    && !pathname.startsWith('/village/spirit')
    && !pathname.startsWith('/village/onboarding');

  if (!isVisible) return null;

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setMessages(m => [...m, { role: 'user', text }]);
    setSending(true);

    try {
      const res = await fetch('/api/claude/spirit-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: text, thread_id: threadId }),
      });
      const data = await res.json();

      // Persist the thread ID returned by the server
      if (data.thread_id && !threadId) setThreadId(data.thread_id);

      setMessages(m => [...m, { role: 'spirit', text: extractReply(data, data?.text ?? '') }]);
    } catch {
      setMessages(m => [...m, { role: 'spirit', text: "I'm having trouble connecting right now — try again in a bit." }]);
    } finally {
      setSending(false);
    }
  }

  function startNewThread() {
    setThreadId(null);
    setMessages([]);
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Open Spirit chat"
        style={{
          position: 'fixed', bottom: 84, right: 14, zIndex: 70,
          width: 52, height: 52, borderRadius: 26, border: 'none',
          background: '#2D63F5', boxShadow: '0 6px 20px rgba(45,99,245,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a7 7 0 0 0-7 7c0 2.4 1.2 4.5 3 5.8V18a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-3.2c1.8-1.3 3-3.4 3-5.8a7 7 0 0 0-7-7z" />
          <path d="M9 21h6" />
        </svg>
        {pendingCount > 0 && (
          <span style={{
            position: 'absolute', top: -2, right: -2, width: 16, height: 16, borderRadius: 8,
            background: '#FF6B2B', color: '#fff', fontSize: 10, fontWeight: 900,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid var(--v-bg, #0A0B12)',
          }}>
            {pendingCount}
          </span>
        )}
      </button>

      {/* Chat drawer */}
      {open && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 69, background: 'rgba(0,0,0,0.45)' }}
          onClick={() => setOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
              width: '100%', maxWidth: 480, maxHeight: '70vh',
              background: '#0E1020', borderTop: '1px solid #1E2240',
              borderTopLeftRadius: 20, borderTopRightRadius: 20,
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ fontSize: 14, fontWeight: 900, color: '#F0EBE0' }}>Spirit</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={startNewThread}
                  title="New conversation"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '4px 10px', color: 'rgba(240,235,224,0.7)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                >
                  + New
                </button>
                <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(240,235,224,0.5)', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>✕</button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {loadingHistory && (
                <p style={{ fontSize: 12, color: 'rgba(240,235,224,0.35)', textAlign: 'center', marginTop: 16 }}>Loading your conversation…</p>
              )}
              {!loadingHistory && messages.length === 0 && (
                <p style={{ fontSize: 13, color: 'rgba(240,235,224,0.45)', textAlign: 'center', marginTop: 24 }}>
                  Ask Spirit anything — your goals, your day, what's next.
                </p>
              )}
              {messages.map((m, i) => (
                <div key={i} style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%', padding: '8px 12px', borderRadius: 14,
                  background: m.role === 'user' ? '#2D63F5' : 'rgba(255,255,255,0.06)',
                  color: m.role === 'user' ? '#fff' : '#F0EBE0',
                  fontSize: 13, lineHeight: 1.45, whiteSpace: 'pre-wrap',
                }}>
                  {m.text}
                </div>
              ))}
              {sending && (
                <div style={{ alignSelf: 'flex-start', fontSize: 13, color: 'rgba(240,235,224,0.45)' }}>Spirit is thinking…</div>
              )}
            </div>

            {/* Input */}
            <div style={{ display: 'flex', gap: 8, padding: '10px 16px 16px' }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') send(); }}
                placeholder="Message Spirit…"
                style={{
                  flex: 1, background: '#0A0B12', border: '1px solid #1E2240', borderRadius: 999,
                  padding: '10px 16px', color: '#F0EBE0', fontSize: 13, outline: 'none',
                }}
              />
              <button
                onClick={send}
                disabled={sending || !input.trim()}
                style={{
                  width: 40, height: 40, borderRadius: 20, border: 'none', background: '#2D63F5',
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: sending ? 'default' : 'pointer', opacity: !input.trim() ? 0.5 : 1,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
