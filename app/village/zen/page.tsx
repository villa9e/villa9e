'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { SpiritVoice } from '@/components/village/SpiritVoice';
import { awardScore } from '@/lib/village/score';
import { VillageHeader } from '@/components/village/VillageHeader';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { BackButton } from '@/components/village/BackButton';

const MOODS = [
  { value: 'great',    emoji: '🌟', label: 'Great',  score: 9, color: 'border-yellow-300 bg-yellow-50' },
  { value: 'good',     emoji: '😊', label: 'Good',   score: 7, color: 'border-green-300 bg-green-50' },
  { value: 'neutral',  emoji: '😐', label: 'Okay',   score: 5, color: 'border-blue-300 bg-blue-50' },
  { value: 'low',      emoji: '😔', label: 'Low',    score: 3, color: 'border-purple-300 bg-purple-50' },
  { value: 'very_low', emoji: '😞', label: 'Rough',  score: 1, color: 'border-[var(--v-card-border)] bg-[var(--v-bg)]' },
];

const ZEN_ACTIVITIES = [
  { emoji: '🧘', label: 'Meditate', desc: '5–20 min guided session', color: 'from-cyan-50 to-teal-50' },
  { emoji: '📓', label: 'Journal', desc: 'AI-prompted reflection', color: 'from-purple-50 to-indigo-50' },
  { emoji: '🎵', label: 'Zen Music', desc: 'Mood-matched Spotify playlist', color: 'from-pink-50 to-rose-50' },
  { emoji: '🌿', label: 'Breathwork', desc: 'Box breathing / 4-7-8 method', color: 'from-green-50 to-emerald-50' },
  { emoji: '🌟', label: 'Affirmation', desc: 'Spirit speaks your daily truth', color: 'from-amber-50 to-yellow-50' },
  { emoji: '🩺', label: 'Telehealth', desc: 'Book a therapy session', color: 'from-blue-50 to-sky-50' },
];

export default function ZenSpacePage() {
  const [selectedMood, setSelectedMood] = useState('');
  const [spiritResponse, setSpiritResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [sessionType, setSessionType] = useState<'morning' | 'evening'>('morning');
  const [saved, setSaved] = useState(false);
  const supabase = createClient();

  const hour = new Date().getHours();
  const isEvening = hour >= 17;

  async function checkIn() {
    const mood = MOODS.find(m => m.value === selectedMood);
    if (!mood) return;
    setLoading(true);
    const type = isEvening ? 'evening' : 'morning';
    setSessionType(type as any);

    const [spiritRes, { data: { user } }] = await Promise.all([
      fetch('/api/claude/spirit-response', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, mood: mood.value, mood_score: mood.score, energy_level: mood.score }),
      }),
      supabase.auth.getUser(),
    ]);

    const data = await spiritRes.json();
    setSpiritResponse(data);

    // Save to DB
    if (user) {
      await supabase.from('mindful_moments').insert({
        user_id:       user.id,
        session_type:  type,
        mood:          mood.value as any,
        mood_score:    mood.score,
        energy_level:  mood.score,
        spirit_response: data.greeting || data.reflection,
        app_route:     data.route || 'workshop',
      });
      // Update last mindful date on profile
      await supabase.from('profiles').update({ mindful_moment_done: true, last_mindful_date: new Date().toISOString().slice(0, 10) }).eq('id', user.id);
      await awardScore('DAILY_MINDFUL_MOMENT');
      setSaved(true);
    }
    setLoading(false);
  }

  const { theme } = useVillageTheme();
  const isNight  = theme === 'night';
  const bg       = isNight
    ? 'linear-gradient(160deg, #060A12 0%, #080D18 50%, #060C14 100%)'
    : 'linear-gradient(160deg, #ECFDF5 0%, #F0FDFA 50%, #ECFDF5 100%)';
  const cardBg   = isNight ? '#0D1820' : '#FFFFFF';
  const border   = isNight ? '#0E2D25' : '#A7F3D0';
  const textMain = isNight ? '#F0EBE0' : '#052E16';
  const textMute = isNight ? '#4A6B62' : '#065F46';
  const accent   = isNight ? '#34D399' : '#059669';

  return (
    <div className="min-h-screen" style={{ background: bg }}>
      <BackButton to="/village/hospital" />
      {isNight && (
        <div className="fixed inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(52,211,153,0.05) 0%, transparent 60%)' }} />
      )}
      <VillageHeader title="Zen Space" subtitle="Your sanctuary — no ads, no noise" icon="🧘"
        accentColor={isNight ? '#065F46' : '#059669'} backHref="/village/hospital" />

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Mindful Moment check-in */}
        {!spiritResponse ? (
          <div className="rounded-2xl p-5" style={{ background: cardBg, border: `1px solid ${border}` }}>
            <div className="text-center mb-6">
              <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 3 }} className="text-5xl mb-3">
                {isEvening ? '🌙' : '☀️'}
              </motion.div>
              <h2 className="text-2xl font-black" style={{ color: textMain }}>{isEvening ? 'Evening' : 'Morning'} Mindful Moment</h2>
              <p className="text-sm mt-1" style={{ color: textMute }}>How are you feeling right now?</p>
            </div>

            <div className="flex justify-center gap-3 flex-wrap">
              {MOODS.map(mood => (
                <button key={mood.value} onClick={() => setSelectedMood(mood.value)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all"
                  style={{
                    borderColor: selectedMood === mood.value ? accent : (isNight ? '#1E3D2F' : '#D1FAE5'),
                    background:  selectedMood === mood.value ? (isNight ? '#0D2D1A' : '#ECFDF5') : 'transparent',
                    transform:   selectedMood === mood.value ? 'scale(1.1)' : 'scale(1)',
                  }}>
                  <span className="text-3xl">{mood.emoji}</span>
                  <span className="text-xs font-medium" style={{ color: textMute }}>{mood.label}</span>
                </button>
              ))}
            </div>

            <button onClick={checkIn} disabled={!selectedMood || loading}
              className="mt-6 w-full rounded-2xl py-3 font-bold transition-opacity disabled:opacity-50 text-white"
              style={{ background: `linear-gradient(135deg, ${accent}, ${isNight ? '#059669' : '#0D9488'})` }}>
              {loading ? '🌀 Spirit is listening…' : '✨ Talk to Spirit'}
            </button>
          </div>
        ) : (
          <AnimatePresence>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Spirit message */}
              <div className="rounded-2xl p-5" style={{ background: isNight ? '#0D1F1A' : '#ECFDF5', border: `1px solid ${border}` }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">🌿</span>
                  <p className="font-bold" style={{ color: accent }}>Spirit says:</p>
                  {saved && <span className="text-xs text-green-500 ml-auto">+5 VLG ✓</span>}
                </div>
                <p className="leading-relaxed" style={{ color: textMain }}>
                  {spiritResponse.greeting || spiritResponse.reflection}
                </p>
                {spiritResponse.affirmation && (
                  <div className="mt-3 rounded-xl p-3" style={{ background: isNight ? 'rgba(52,211,153,0.08)' : 'rgba(255,255,255,0.7)', border: `1px solid ${border}` }}>
                    <p className="text-sm italic" style={{ color: accent }}>"{spiritResponse.affirmation}"</p>
                  </div>
                )}
                {spiritResponse.focus_tip && (
                  <p className="text-sm mt-3" style={{ color: textMute }}>{spiritResponse.focus_tip}</p>
                )}
                {(spiritResponse.voice_script || spiritResponse.greeting) && (
                  <div className="mt-4">
                    <SpiritVoice text={spiritResponse.voice_script || spiritResponse.greeting} label="Hear Spirit" />
                  </div>
                )}
              </div>

              {/* Route suggestion */}
              {spiritResponse.route && (
                <div className="rounded-2xl p-4" style={{ background: cardBg, border: `1px solid ${border}` }}>
                  <p className="text-sm font-medium" style={{ color: textMain }}>
                    {spiritResponse.route === 'zen_space'
                      ? '🧘 Spirit suggests staying in Zen Space today — rest and restore.'
                      : '🔨 Your energy is good — head to the Workshop and make progress.'}
                  </p>
                  <Link href={`/village/${spiritResponse.route === 'zen_space' ? 'zen' : 'workshop'}`}
                    className="mt-2 inline-block text-sm font-bold hover:underline" style={{ color: '#1877F2' }}>
                    Go {spiritResponse.route === 'zen_space' ? 'deeper into Zen' : 'to Workshop'} →
                  </Link>
                </div>
              )}

              {/* Zen activities */}
              <div>
                <p className="font-bold mb-3" style={{ color: textMain }}>What would you like to do?</p>
                <div className="grid grid-cols-2 gap-3">
                  {ZEN_ACTIVITIES.map(act => {
                    const href = act.label === 'Journal' ? '/village/zen/journal'
                      : act.label === 'Breathwork' ? '/village/zen/breathwork'
                      : act.label === 'Affirmation' ? '/village/zen/affirmation'
                      : act.label === 'Zen Music' ? '/village/zen/music'
                      : act.label === 'Telehealth' ? '/village/hospital/providers'
                      : null;
                    const inner = (
                      <div className="rounded-2xl p-4 text-left transition-all" style={{ background: cardBg, border: `1px solid ${border}` }}>
                        <span className="text-2xl mb-1 block">{act.emoji}</span>
                        <p className="font-bold text-sm" style={{ color: textMain }}>{act.label}</p>
                        <p className="text-xs mt-0.5" style={{ color: textMute }}>{act.desc}</p>
                      </div>
                    );
                    return href ? (
                      <Link key={act.label} href={href}>{inner}</Link>
                    ) : (
                      <motion.button key={act.label} whileTap={{ scale: 0.98 }} className="block w-full text-left">{inner}</motion.button>
                    );
                  })}
                </div>
              </div>

              <button onClick={() => { setSpiritResponse(null); setSelectedMood(''); setSaved(false); }}
                className="w-full rounded-2xl py-2.5 text-sm transition-colors"
                style={{ border: `1px solid ${border}`, color: textMute, background: 'transparent' }}>
                ← Check in again
              </button>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
