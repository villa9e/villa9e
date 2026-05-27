'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { SpiritAvatarStatic } from '@/components/spirit/SpiritAvatarStatic';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { useSpiritVoice } from '@/components/village/SpiritVoiceProvider';
import type { SpiritVariantId } from '@/components/spirit/SpiritFigure';

const MOODS = [
  { id: 'energized', emoji: '⚡', label: 'Energized', color: '#F59E0B' },
  { id: 'focused',   emoji: '🎯', label: 'Focused',   color: '#1877F2' },
  { id: 'steady',    emoji: '🌿', label: 'Steady',    color: '#059669' },
  { id: 'struggling',emoji: '🌊', label: 'Struggling',color: '#7C3AED' },
  { id: 'lost',      emoji: '🌫️', label: 'Lost',      color: '#6B7280' },
];

type Step = 'greeting' | 'mood' | 'question' | 'done';

export default function SpiritCheckinPage() {
  const [step, setStep]           = useState<Step>('greeting');
  const [mood, setMood]           = useState<typeof MOODS[0] | null>(null);
  const [question, setQuestion]   = useState('');
  const [answer, setAnswer]       = useState('');
  const [reflection, setReflection] = useState('');
  const [loading, setLoading]     = useState(false);
  const [profile, setProfile]     = useState<any>(null);
  const [spiritVariant, setSpiritVariant] = useState<SpiritVariantId>('blue');
  const [alreadyDone, setAlreadyDone] = useState(false);
  const supabase = createClient();
  const router   = useRouter();
  const { theme } = useVillageTheme();
  const { speak } = useSpiritVoice();
  const isNight  = theme === 'night';

  const bg      = isNight ? '#060810' : '#F0F4FF';
  const cardBg  = isNight ? '#0D1020' : '#FFFFFF';
  const border  = isNight ? '#1A1F3A' : '#E0E7FF';
  const text    = isNight ? '#F0EBE0' : '#1E1B4B';
  const muted   = isNight ? '#4A4F72' : '#6D28D9';

  const hour      = new Date().getHours();
  const timeLabel = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: p } = await (supabase as any)
        .from('profiles')
        .select('username, display_name, personality_type, avatar_config, mindful_moment_done, last_mindful_date, village_score')
        .eq('id', user.id)
        .single();

      setProfile(p);
      if (p?.avatar_config?.spirit_variant) setSpiritVariant(p.avatar_config.spirit_variant as SpiritVariantId);

      // Check if already checked in today
      const today = new Date().toISOString().slice(0, 10);
      if (p?.mindful_moment_done && p?.last_mindful_date === today) {
        setAlreadyDone(true);
      }
    }
    load();
  }, []);

  async function onMoodSelect(m: typeof MOODS[0]) {
    setMood(m);
    setLoading(true);

    // Ask Spirit for a focused check-in question based on mood
    try {
      const res = await fetch('/api/claude/spirit-response', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `The user is doing their ${timeLabel} Spirit check-in. Their mood is "${m.label}". Ask them ONE focused, warm, personal question to help them reflect on their day and goals. Under 2 sentences. No preamble.`,
        }),
      });
      const data = await res.json();
      const q = data.text || data.response || "What's the most important thing you're working through right now?";
      setQuestion(q);
      speak(q, 'neutral');
    } catch {
      const fallback = "What's one thing you want to make sure happens today?";
      setQuestion(fallback);
      speak(fallback, 'neutral');
    }

    setLoading(false);
    setStep('question');
  }

  async function submitAnswer() {
    if (!answer.trim() || !mood) return;
    setLoading(true);

    try {
      const res = await fetch('/api/claude/spirit-response', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `User's ${timeLabel} check-in. Mood: ${mood.label}. They said: "${answer}". Give a brief, warm, specific reflection (2-3 sentences). Be real. Be encouraging without being generic.`,
        }),
      });
      const data = await res.json();
      const reflection = data.text || data.response || "That took courage to say. Keep going.";
      setReflection(reflection);
      speak(reflection, 'serious');
    } catch {
      const fallback = "That took courage to say. Keep going — one step at a time.";
      setReflection(fallback);
      speak(fallback, 'serious');
    }

    // Save to spirit_memories + award score + mark day done
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const today = new Date().toISOString().slice(0, 10);
      await (supabase as any).from('spirit_memories').insert({
        user_id:     user.id,
        memory_type: 'checkin',
        content:     `${timeLabel} check-in — Mood: ${mood.label}. ${question} "${answer}"`,
      });
      await (supabase as any).from('profiles').update({
        mindful_moment_done: true,
        last_mindful_date:   today,
        village_score:       (profile?.village_score ?? 0) + 10,
      }).eq('id', user.id);
    }

    setLoading(false);
    setStep('done');
  }

  if (alreadyDone) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: bg }}>
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="w-20 h-20 mx-auto">
            <SpiritAvatarStatic variant={spiritVariant} size={80} />
          </div>
          <div className="text-4xl">✓</div>
          <h2 className="text-2xl font-black" style={{ color: text }}>Already checked in today</h2>
          <p className="text-sm" style={{ color: muted }}>You've done your Spirit ritual for today. See you {timeLabel === 'morning' ? 'this evening' : 'tomorrow morning'}.</p>
          <Link href="/village/spirit"
            className="block w-full py-3 rounded-2xl font-bold text-white text-center"
            style={{ background: '#1877F2' }}>
            Talk to Spirit →
          </Link>
          <Link href="/village/map" className="block text-sm" style={{ color: muted }}>← Back to Village</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: bg }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b"
        style={{ background: isNight ? '#0A0B18' : '#fff', borderColor: border }}>
        <Link href="/village/spirit" className="text-xl" style={{ color: muted }}>←</Link>
        <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center"
          style={{ background: isNight ? '#08101A' : '#EEF2FF', border: `2px solid #1877F2` }}>
          <SpiritAvatarStatic variant={spiritVariant} size={36} />
        </div>
        <div className="flex-1">
          <p className="font-black text-sm" style={{ color: text }}>Spirit Check-In</p>
          <p className="text-xs capitalize" style={{ color: muted }}>{timeLabel} ritual · +10 VLG</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-md mx-auto w-full">
        <AnimatePresence mode="wait">

          {/* Step 1: Greeting */}
          {step === 'greeting' && (
            <motion.div key="greeting" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-6 w-full">
              <div className="w-24 h-24 mx-auto">
                <SpiritAvatarStatic variant={spiritVariant} size={96} />
              </div>
              <div>
                <h1 className="text-3xl font-black" style={{ color: text }}>
                  Good {timeLabel},<br />{profile?.display_name || profile?.username || 'Villager'}.
                </h1>
                <p className="text-sm mt-3 leading-relaxed" style={{ color: muted }}>
                  This is your {timeLabel} ritual. It takes 60 seconds. Spirit's been thinking about you.
                </p>
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setStep('mood')}
                className="w-full py-4 rounded-2xl font-black text-white text-base"
                style={{ background: 'linear-gradient(135deg,#1877F2,#7C3AED)', boxShadow: '0 4px 24px rgba(24,119,242,0.3)' }}
              >
                I'm ready →
              </motion.button>
            </motion.div>
          )}

          {/* Step 2: Mood picker */}
          {step === 'mood' && (
            <motion.div key="mood" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="w-full space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-black" style={{ color: text }}>How are you showing up right now?</h2>
                <p className="text-sm mt-1" style={{ color: muted }}>Be honest. Spirit can handle it.</p>
              </div>
              <div className="space-y-3">
                {MOODS.map(m => (
                  <motion.button
                    key={m.id}
                    onClick={() => onMoodSelect(m)}
                    whileTap={{ scale: 0.98 }}
                    disabled={loading}
                    className="w-full flex items-center gap-4 rounded-2xl px-5 py-4 text-left transition-all disabled:opacity-50"
                    style={{ background: cardBg, border: `1px solid ${border}` }}
                  >
                    <span className="text-3xl">{m.emoji}</span>
                    <div>
                      <p className="font-bold" style={{ color: text }}>{m.label}</p>
                    </div>
                    <div className="ml-auto w-3 h-3 rounded-full" style={{ background: m.color }} />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 3: Spirit question + user answer */}
          {step === 'question' && (
            <motion.div key="question" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="w-full space-y-5">
              <div className="rounded-2xl p-5" style={{ background: cardBg, border: `1px solid ${border}` }}>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 flex-shrink-0">
                    <SpiritAvatarStatic variant={spiritVariant} size={36} />
                  </div>
                  {loading
                    ? <div className="flex items-center gap-1 py-2">
                        {[0,1,2].map(i => (
                          <motion.div key={i} animate={{ y: [0,-4,0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i*0.15 }}
                            className="w-2 h-2 rounded-full" style={{ background: muted }} />
                        ))}
                      </div>
                    : <p className="text-sm leading-relaxed font-medium" style={{ color: text }}>{question}</p>
                  }
                </div>
              </div>

              <textarea
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                placeholder="Type your answer…"
                rows={4}
                className="w-full rounded-2xl px-4 py-3 text-sm focus:outline-none resize-none"
                style={{ background: cardBg, border: `1px solid ${border}`, color: text }}
              />

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={submitAnswer}
                disabled={!answer.trim() || loading}
                className="w-full py-4 rounded-2xl font-black text-white text-base disabled:opacity-40"
                style={{ background: mood?.color ?? '#1877F2' }}
              >
                {loading ? 'Spirit is reflecting…' : 'Submit →'}
              </motion.button>
            </motion.div>
          )}

          {/* Step 4: Done — Spirit reflection */}
          {step === 'done' && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="w-full space-y-6 text-center">
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="w-24 h-24 mx-auto"
              >
                <SpiritAvatarStatic variant={spiritVariant} size={96} />
              </motion.div>

              <div className="rounded-2xl p-5 text-left" style={{ background: cardBg, border: `1px solid ${border}` }}>
                <p className="text-sm leading-relaxed" style={{ color: text }}>{reflection}</p>
              </div>

              <div className="rounded-2xl py-3 px-4 flex items-center justify-center gap-2"
                style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <span className="text-lg">✓</span>
                <span className="font-bold text-green-400 text-sm">Check-in complete · +10 VLG earned</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Link href="/village/spirit"
                  className="py-3 rounded-2xl font-bold text-white text-sm text-center"
                  style={{ background: '#1877F2' }}>
                  Talk to Spirit
                </Link>
                <Link href="/village/map"
                  className="py-3 rounded-2xl font-bold text-sm text-center"
                  style={{ background: cardBg, border: `1px solid ${border}`, color: text }}>
                  Back to Village
                </Link>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
