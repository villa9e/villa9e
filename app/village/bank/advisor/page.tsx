'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';

const B = {
  day:   { bg:'#F2F7FA', card:'#FFFFFF', border:'#C8DCE8', text:'#0A1F2E', textSec:'#3A5A6E', textTer:'#7A9AAE', action:'#0A5F8A' },
  night: { bg:'#060F18', card:'#0E1E2E', border:'#1A3040', text:'#EEF4F8', textSec:'#8EB4CC', textTer:'#4A7A96', action:'#2A9FCC' },
};

// Mock financial context — replace with real Supabase/Unit data when live
const FINANCIAL_CONTEXT = {
  totalBalance:   24487,
  monthlySpend:   3715,
  portfolioValue: 12840,
  activeGoals:    3,
};

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Sparkle icon
function SparkleIcon({ size = 18, color = '#27500A' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"/>
    </svg>
  );
}

// Send icon
function SendIcon({ color = '#fff' }: { color?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
    </svg>
  );
}

// Back chevron
function BackIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6"/>
    </svg>
  );
}

// Typing indicator dots
function TypingDots() {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:4, padding:'10px 14px', background:'#EAF3DE', borderRadius:'18px 18px 18px 4px', alignSelf:'flex-start', maxWidth:80 }}>
      {[0,1,2].map(i => (
        <div
          key={i}
          style={{
            width:7, height:7, borderRadius:'50%', background:'#27500A',
            animation:'bankAdvisorPulse 1.2s ease-in-out infinite',
            animationDelay:`${i*0.2}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes bankAdvisorPulse {
          0%,80%,100% { opacity:0.3; transform:scale(0.8); }
          40%          { opacity:1;   transform:scale(1); }
        }
      `}</style>
    </div>
  );
}

export default function AdvisorPage() {
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';
  const c = isNight ? B.night : B.day;

  const [messages, setMessages] = useState<Message[]>([]);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [openingLoading, setOpeningLoading] = useState(true);

  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Load opening message on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/bank/advisor/opening');
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          setMessages([{ role: 'assistant', content: data.message }]);
          setSuggestedQuestions(data.suggestedQuestions ?? []);
        }
      } catch {
        setMessages([{ role: 'assistant', content: 'Welcome to Village Bank Financial Advisor. How can I help you with your finances today?' }]);
      } finally {
        if (!cancelled) setOpeningLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    const msg = text.trim();
    if (!msg || loading) return;

    // Clear suggested questions after first user message
    setSuggestedQuestions([]);
    setInput('');

    const newMessages: Message[] = [...messages, { role: 'user', content: msg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch('/api/bank/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          context: FINANCIAL_CONTEXT,
          history: messages, // send prior history for context
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply ?? 'I had trouble responding. Please try again.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  }, [messages, loading]);

  const handleSend = () => sendMessage(input);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div style={{ background:c.bg, minHeight:'100vh', maxWidth:480, margin:'0 auto', display:'flex', flexDirection:'column' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 16px', background:c.card, borderBottom:`1px solid ${c.border}`, position:'sticky', top:0, zIndex:40 }}>
        <Link href="/village/bank" style={{ color:c.action, lineHeight:0, flexShrink:0 }}>
          <BackIcon color={c.action}/>
        </Link>
        <div style={{ display:'flex', alignItems:'center', gap:7, flex:1 }}>
          <SparkleIcon size={18} color={c.action}/>
          <span style={{ fontWeight:700, fontSize:16, color:c.text, letterSpacing:-0.3 }}>AI Financial Advisor</span>
        </div>
        <span style={{ fontSize:10, fontWeight:700, color:'#1D9E75', background:'#EAF3DE', borderRadius:20, padding:'2px 10px', letterSpacing:0.3 }}>SPIRIT</span>
      </div>

      {/* Disclaimer banner — permanent, non-dismissible */}
      <div style={{ background:'#EAF3DE', borderBottom:'1px solid #B4D88A', padding:'10px 16px', flexShrink:0 }}>
        <p style={{ fontSize:11, color:'#27500A', lineHeight:1.5, margin:0, textAlign:'center', fontWeight:500 }}>
          Not a licensed financial advisor. For educational and informational purposes only. Always consult a qualified professional for investment decisions.
        </p>
      </div>

      {/* Chat messages */}
      <div style={{ flex:1, overflowY:'auto', padding:'16px 16px 8px', display:'flex', flexDirection:'column', gap:12 }}>
        {openingLoading ? (
          // Opening loading state
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {[60, 90, 45].map((w, i) => (
              <div key={i} style={{ height:14, borderRadius:7, background:isNight?'#1A3040':'#DDE9F0', width:`${w}%`, animation:'bankSkeletonPulse 1.4s ease-in-out infinite', animationDelay:`${i*0.15}s` }}/>
            ))}
            <style>{`
              @keyframes bankSkeletonPulse {
                0%,100% { opacity:0.5; } 50% { opacity:1; }
              }
            `}</style>
          </div>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              style={{
                display:'flex',
                justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth:'82%',
                  padding:'10px 14px',
                  borderRadius: m.role === 'user'
                    ? '18px 18px 4px 18px'
                    : '18px 18px 18px 4px',
                  background: m.role === 'user' ? '#C8D8F8' : '#EAF3DE',
                  color: m.role === 'user' ? '#0A1F2E' : '#27500A',
                  fontSize:13,
                  lineHeight:1.6,
                  whiteSpace:'pre-wrap',
                  wordBreak:'break-word',
                }}
              >
                {m.content}
              </div>
            </div>
          ))
        )}

        {/* Typing indicator */}
        {loading && <TypingDots/>}

        {/* Suggested question pills */}
        {suggestedQuestions.length > 0 && !loading && messages.length === 1 && (
          <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:4 }}>
            <p style={{ fontSize:11, color:c.textTer, margin:0, fontWeight:600, letterSpacing:0.3 }}>SUGGESTED</p>
            {suggestedQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => sendMessage(q)}
                style={{
                  background:c.card,
                  border:`1px solid ${c.border}`,
                  borderRadius:20,
                  padding:'8px 14px',
                  fontSize:12,
                  color:c.action,
                  cursor:'pointer',
                  textAlign:'left',
                  fontWeight:500,
                  lineHeight:1.4,
                }}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <div ref={bottomRef}/>
      </div>

      {/* Input row */}
      <div style={{
        padding:'12px 16px 20px',
        background:c.card,
        borderTop:`1px solid ${c.border}`,
        display:'flex',
        alignItems:'flex-end',
        gap:10,
        flexShrink:0,
      }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask about your finances..."
          rows={1}
          disabled={loading || openingLoading}
          style={{
            flex:1,
            resize:'none',
            border:`1px solid ${c.border}`,
            borderRadius:20,
            padding:'10px 14px',
            fontSize:14,
            color:c.text,
            background:isNight?'#0A1420':c.bg,
            outline:'none',
            fontFamily:'inherit',
            lineHeight:1.5,
            minHeight:42,
            maxHeight:120,
            overflowY:'auto',
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading || openingLoading}
          style={{
            width:42,
            height:42,
            borderRadius:'50%',
            background: !input.trim() || loading ? (isNight?'#1A3040':'#DDE9F0') : c.action,
            border:'none',
            cursor: !input.trim() || loading ? 'default' : 'pointer',
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            flexShrink:0,
            transition:'background 0.15s',
          }}
        >
          <SendIcon color={!input.trim() || loading ? c.textTer : '#fff'}/>
        </button>
      </div>
    </div>
  );
}
