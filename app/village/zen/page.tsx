'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { SpiritVoice } from '@/components/village/SpiritVoice';
import { awardScore } from '@/lib/village/score';

const MOODS = [
  { value: 'great',    emoji: '🌟', label: 'Great',  score: 9, color: 'border-yellow-300 bg-yellow-50' },
  { value: 'good',     emoji: '😊', label: 'Good',   score: 7, color: 'border-green-300 bg-green-50' },
  { value: 'neutral',  emoji: '😐', label: 'Okay',   score: 5, color: 'border-blue-300 bg-blue-50' },
  { value: 'low',      emoji: '😔', label: 'Low',    score: 3, color: 'border-purple-300 bg-purple-50' },
  { value: 'very_low', emoji: '😞', label: 'Rough',  score: 1, color: 'border-gray-300 bg-gray-50' },
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 via-teal-50 to-emerald-50">
      <div className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white px-6 py-4 flex items-center gap-3">
        <Link href="/village/map" className="text-xl">←</Link>
        <span className="text-2xl">🧘</span>
        <div>
          <h1 className="text-xl font-bold leading-tight">Zen Space</h1>
          <p className="text-cyan-100 text-xs">Your sanctuary — no ads, no noise</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Mindful Moment check-in */}
        {!spiritResponse ? (
          <div className="village-card">
            <div className="text-center mb-6">
              <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 3 }} className="text-5xl mb-3">
                {isEvening ? '🌙' : '☀️'}
              </motion.div>
              <h2 className="text-2xl font-bold">{isEvening ? 'Evening' : 'Morning'} Mindful Moment</h2>
              <p className="text-gray-500 text-sm mt-1">How are you feeling right now?</p>
            </div>

            <div className="flex justify-center gap-3 flex-wrap">
              {MOODS.map(mood => (
                <button key={mood.value} onClick={() => setSelectedMood(mood.value)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all ${
                    selectedMood === mood.value ? `${mood.color} scale-110 shadow-md` : 'border-gray-100 hover:border-gray-200'
                  }`}>
                  <span className="text-3xl">{mood.emoji}</span>
                  <span className="text-xs font-medium text-gray-600">{mood.label}</span>
                </button>
              ))}
            </div>

            <button onClick={checkIn} disabled={!selectedMood || loading}
              className="mt-6 w-full bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-2xl py-3 font-bold hover:opacity-90 disabled:opacity-50 transition-opacity">
              {loading ? '🤖 Spirit is listening…' : '✨ Talk to Spirit'}
            </button>
          </div>
        ) : (
          <AnimatePresence>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Spirit message */}
              <div className="village-card bg-gradient-to-br from-cyan-50 to-teal-50 border border-cyan-100">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">🌿</span>
                  <p className="font-bold text-cyan-700">Spirit says:</p>
                  {saved && <span className="text-xs text-green-600 ml-auto">+5 VLG ✓</span>}
                </div>
                <p className="text-gray-700 leading-relaxed">
                  {spiritResponse.greeting || spiritResponse.reflection}
                </p>
                {spiritResponse.affirmation && (
                  <div className="mt-3 bg-white/70 rounded-xl p-3 border border-cyan-100">
                    <p className="text-sm italic text-cyan-700">"{spiritResponse.affirmation}"</p>
                  </div>
                )}
                {spiritResponse.focus_tip && (
                  <p className="text-sm text-gray-600 mt-3">{spiritResponse.focus_tip}</p>
                )}

                {/* Spirit voice */}
                {(spiritResponse.voice_script || spiritResponse.greeting) && (
                  <div className="mt-4">
                    <SpiritVoice
                      text={spiritResponse.voice_script || spiritResponse.greeting}
                      label="Hear Spirit"
                    />
                  </div>
                )}
              </div>

              {/* Route suggestion */}
              {spiritResponse.route && (
                <div className={`village-card border ${spiritResponse.route === 'zen_space' ? 'border-cyan-200 bg-cyan-50' : 'border-orange-200 bg-orange-50'}`}>
                  <p className="text-sm font-medium">
                    {spiritResponse.route === 'zen_space'
                      ? '🧘 Spirit suggests staying in Zen Space today — rest and restore.'
                      : '🔨 Your energy is good — head to the Workshop and make progress.'}
                  </p>
                  <Link href={`/village/${spiritResponse.route === 'zen_space' ? 'zen' : 'workshop'}`}
                    className="mt-2 inline-block text-sm font-bold text-village-blue hover:underline">
                    Go {spiritResponse.route === 'zen_space' ? 'deeper into Zen' : 'to Workshop'} →
                  </Link>
                </div>
              )}

              {/* Zen activities */}
              <div>
                <p className="font-bold mb-3 text-gray-700">What would you like to do?</p>
                <div className="grid grid-cols-2 gap-3">
                  {ZEN_ACTIVITIES.map(act => {
                    const href = act.label === 'Journal' ? '/village/zen/journal'
                      : act.label === 'Breathwork' ? '/village/zen/breathwork'
                      : act.label === 'Affirmation' ? '/village/zen/affirmation'
                      : act.label === 'Telehealth' ? '/village/hospital/providers'
                      : null;
                    const cardCls = `village-card bg-gradient-to-br ${act.color} text-left hover:shadow-md transition-shadow block`;
                    const inner = (<>
                      <span className="text-2xl mb-1 block">{act.emoji}</span>
                      <p className="font-semibold text-sm">{act.label}</p>
                      <p className="text-xs text-gray-500">{act.desc}</p>
                    </>);
                    return href ? (
                      <Link key={act.label} href={href} className={cardCls}>{inner}</Link>
                    ) : (
                      <motion.button key={act.label} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        className={cardCls}>{inner}</motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Do again */}
              <button onClick={() => { setSpiritResponse(null); setSelectedMood(''); setSaved(false); }}
                className="w-full border border-cyan-200 rounded-2xl py-2.5 text-sm text-cyan-700 hover:bg-cyan-50 transition-colors">
                ← Check in again
              </button>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
