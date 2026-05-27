'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import { SpiritVoice } from '@/components/village/SpiritVoice';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { SpiritAvatarStatic } from '@/components/spirit/SpiritAvatar';
import type { SpiritVariantId } from '@/components/spirit/SpiritFigure';

// Lazy-load the 3D avatar (heavy Three.js bundle)
const SpiritAvatar = dynamic(
  () => import('@/components/spirit/SpiritAvatar').then(m => ({ default: m.SpiritAvatar })),
  { ssr: false, loading: () => <SpiritAvatarStatic variant="blue" size={40} /> }
);

interface Message {
  id:      string;
  role:    'user' | 'spirit';
  content: string;
  time:    Date;
}

const SPIRIT_STARTERS = [
  "How am I actually doing on my goals?",
  "I'm feeling stuck. What should I do?",
  "What's the most important thing I should focus on right now?",
  "Help me think through a decision I'm struggling with.",
  "I need motivation. Be real with me.",
  "What patterns do you see in how I'm showing up?",
];

export default function SpiritHubPage() {
  const [messages, setMessages]     = useState<Message[]>([]);
  const [input, setInput]           = useState('');
  const [sending, setSending]       = useState(false);
  const [profile, setProfile]       = useState<any>(null);
  const [spiritVariant, setSpiritVariant] = useState<SpiritVariantId>('blue');
  const [showStarters, setShowStarters] = useState(true);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);
  const supabase   = createClient();
  const { theme }  = useVillageTheme();
  const isNight    = theme === 'night';

  const bg       = isNight ? '#060810' : '#F0F4FF';
  const cardBg   = isNight ? '#0D1020' : '#FFFFFF';
  const border   = isNight ? '#1A1F3A' : '#E0E7FF';
  const textMain = isNight ? '#F0EBE0' : '#1E1B4B';
  const textMute = isNight ? '#4A4F72' : '#6D28D9';
  const accent   = '#1877F2';

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: p } = await (supabase as any)
        .from('profiles')
        .select('username, display_name, personality_type, village_score, score_tier, avatar_config')
        .eq('id', user.id)
        .single();
      setProfile(p);
      // Load selected spirit variant from avatar_config
      if (p?.avatar_config?.spirit_variant) {
        setSpiritVariant(p.avatar_config.spirit_variant as SpiritVariantId);
      }

      // Load recent Spirit conversations from DB
      const { data: memories } = await (supabase as any)
        .from('spirit_memories')
        .select('content, created_at')
        .eq('user_id', user.id)
        .eq('memory_type', 'conversation')
        .order('created_at', { ascending: false })
        .limit(5);

      // Greet Spirit style: show an opening message
      const greeting = getGreeting(p);
      setMessages([{
        id:      'welcome',
        role:    'spirit',
        content: greeting,
        time:    new Date(),
      }]);
    }
    load();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function getGreeting(p: any): string {
    const hour = new Date().getHours();
    const name = p?.display_name || p?.username || 'Villager';
    const time = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    const greetings = [
      `Good ${time}, ${name}. I'm here. What's on your mind?`,
      `${name}. Good ${time}. What are we working through today?`,
      `Hey, ${name}. I'm listening. What do you need?`,
      `Good ${time}. I've been thinking about your goals. Where are you at right now, ${name}?`,
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || sending) return;

    setShowStarters(false);
    setInput('');
    setSending(true);

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: msg, time: new Date() };
    setMessages(prev => [...prev, userMsg]);

    // Typing indicator
    const typingId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: typingId, role: 'spirit', content: '...', time: new Date() }]);

    try {
      const res = await fetch('/api/claude/spirit-response', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ message: msg }),
      });
      const data = await res.json();
      const spiritText = data.text || data.response || data.greeting || data.reflection || JSON.stringify(data);

      setMessages(prev => prev.map(m =>
        m.id === typingId
          ? { ...m, content: spiritText }
          : m
      ));
    } catch {
      setMessages(prev => prev.map(m =>
        m.id === typingId
          ? { ...m, content: "I'm here. Try again — I didn't catch that." }
          : m
      ));
    }

    setSending(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  const ARCHETYPE_EMOJI: Record<string, string> = {
    architect: '🏗️', spark: '⚡', anchor: '⚓', compass: '🧭',
    pioneer: '🏔️', sage: '📚', weaver: '🕸️', flame: '🔥',
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: bg }}>

      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 border-b"
        style={{ background: isNight ? '#0A0B18' : '#fff', borderColor: border }}>
        <Link href="/village/map" className="text-xl" style={{ color: textMute }}>←</Link>

        <div className="relative">
          <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center"
            style={{ background: isNight ? '#08101A' : '#EEF2FF', border: `2px solid ${accent}` }}>
            <SpiritAvatar variant={spiritVariant} size={48} />
          </div>
          <motion.div
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
            style={{ background: '#22C55E', borderColor: isNight ? '#0A0B18' : '#fff' }}
          />
        </div>

        <div className="flex-1">
          <h1 className="font-black text-base" style={{ color: textMain }}>Spirit</h1>
          <p className="text-xs" style={{ color: textMute }}>Your personal guide · Always here</p>
        </div>

        {profile?.personality_type && (
          <div className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
            style={{ background: isNight ? '#12152A' : '#EEF2FF', color: textMute }}>
            <span>{ARCHETYPE_EMOJI[profile.personality_type] ?? '✨'}</span>
            <span className="capitalize">{profile.personality_type}</span>
          </div>
        )}
        <Link href="/village/spirit/memories"
          className="w-8 h-8 rounded-full flex items-center justify-center text-base transition-colors"
          style={{ background: isNight ? '#12152A' : '#EEF2FF', color: textMute }}
          title="Spirit's memory">
          🧠
        </Link>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 max-w-2xl mx-auto w-full">
        {messages.map((msg, i) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i === 0 ? 0.3 : 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}
          >
            {msg.role === 'spirit' && (
              <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: isNight ? '#08101A' : '#EEF2FF', border: `1px solid ${border}` }}>
                <SpiritAvatarStatic variant={spiritVariant} size={36} />
              </div>
            )}

            <div className="max-w-[78%]">
              <div className="rounded-2xl px-4 py-3 text-sm leading-relaxed"
                style={msg.role === 'user'
                  ? { background: accent, color: '#fff', borderBottomRightRadius: '6px' }
                  : { background: cardBg, color: textMain, border: `1px solid ${border}`, borderBottomLeftRadius: '6px' }
                }>
                {msg.content === '...'
                  ? <TypingDots isNight={isNight} />
                  : msg.content
                }
              </div>

              {/* Voice for Spirit messages */}
              {msg.role === 'spirit' && msg.content !== '...' && msg.content.length > 20 && (
                <div className="mt-1.5 ml-1">
                  <SpiritVoice text={msg.content} label="Hear Spirit" compact />
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {/* Conversation starters */}
        <AnimatePresence>
          {showStarters && messages.length <= 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.8 }}
              className="space-y-2"
            >
              <p className="text-xs text-center" style={{ color: textMute }}>Or start with one of these:</p>
              {SPIRIT_STARTERS.map(starter => (
                <button key={starter} onClick={() => send(starter)}
                  className="w-full text-left text-sm rounded-2xl px-4 py-3 transition-all"
                  style={{ background: cardBg, border: `1px solid ${border}`, color: textMute }}>
                  {starter}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t px-4 py-3 max-w-2xl mx-auto w-full"
        style={{ borderColor: border, background: isNight ? '#0A0B18' : '#fff' }}>
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Talk to Spirit…"
            rows={1}
            className="flex-1 resize-none rounded-2xl px-4 py-3 text-sm focus:outline-none"
            style={{
              background: isNight ? '#12152A' : '#F8FAFF',
              border:     `1px solid ${border}`,
              color:      textMain,
              maxHeight:  '120px',
            }}
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => send()}
            disabled={!input.trim() || sending}
            className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-all"
            style={{ background: accent }}
          >
            {sending
              ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              : <span className="text-white text-lg">↑</span>
            }
          </motion.button>
        </div>
        <p className="text-center text-xs mt-2" style={{ color: isNight ? '#2A2F4A' : '#C4B5FD' }}>
          Spirit learns from your conversations and grows with you
        </p>
      </div>
    </div>
  );
}

function TypingDots({ isNight }: { isNight: boolean }) {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map(i => (
        <motion.div key={i}
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: isNight ? '#4A4F72' : '#C4B5FD' }}
        />
      ))}
    </div>
  );
}
