'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { SpiritVoice } from '@/components/village/SpiritVoice';
import { awardScore } from '@/lib/village/score';

const AFFIRMATION_THEMES = [
  { label: 'My Goals', prompt: 'my goal achievement and the progress I\'m making' },
  { label: 'My Worth', prompt: 'my inherent value and what I bring to the world' },
  { label: 'Abundance', prompt: 'abundance, financial growth, and prosperity flowing to me' },
  { label: 'Community', prompt: 'the village around me and the power of doing this together' },
  { label: 'My Health', prompt: 'my physical and mental well-being' },
  { label: 'Courage', prompt: 'my courage, boldness, and willingness to grow' },
];

export default function AffirmationPage() {
  const [profile, setProfile] = useState<any>(null);
  const [theme, setTheme] = useState(AFFIRMATION_THEMES[0]);
  const [affirmation, setAffirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [used, setUsed] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) supabase.from('profiles').select('display_name, personality_type').eq('id', user.id).single().then(({ data }) => setProfile(data));
    });
  }, []);

  async function generate() {
    if (loading) return;
    setLoading(true);
    setAffirmation('');

    const name = profile?.display_name ?? 'Villager';
    const archetype = profile?.personality_type ?? '';

    try {
      const res = await fetch('/api/claude/spirit-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'affirmation',
          mood: 'great',
          mood_score: 9,
          energy_level: 9,
          focus_area: theme.prompt,
          user_name: name,
          spiritual_system: 'secular',
        }),
      });
      const data = await res.json();
      const text = data.affirmation || data.greeting || data.reflection || data.voice_script || '';
      setAffirmation(text || `I, ${name}, am fully capable of achieving everything I am working toward. The village supports my journey.`);

      if (!used) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('mindful_moments').insert({
            user_id: user.id, type: 'affirmation', session_type: 'affirmation', notes: theme.label,
          });
          await awardScore('DAILY_MINDFUL_MOMENT');
          setUsed(true);
        }
      }
    } catch {
      setAffirmation(`I am worthy. I am capable. My goals are achievable. The village believes in me.`);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <div className="bg-amber-500 text-white px-6 py-4 flex items-center gap-3">
        <Link href="/village/zen" className="text-xl">←</Link>
        <span className="text-2xl">🌟</span>
        <h1 className="text-xl font-bold">Daily Affirmation</h1>
      </div>

      <div className="max-w-md mx-auto p-6 space-y-6">
        <div className="text-center">
          <p className="text-gray-500 text-sm">Choose a theme and let Spirit speak your truth today.</p>
        </div>

        {/* Theme selector */}
        <div className="grid grid-cols-3 gap-2">
          {AFFIRMATION_THEMES.map(t => (
            <button key={t.label} onClick={() => { setTheme(t); setAffirmation(''); }}
              className={`py-2 px-3 rounded-2xl text-xs font-medium transition-all ${theme.label === t.label ? 'bg-amber-500 text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:border-amber-300'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Affirmation display */}
        <div className="min-h-48 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {affirmation ? (
              <motion.div key={affirmation} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-4">
                <p className="text-xl font-medium text-gray-800 leading-relaxed italic">"{affirmation}"</p>
                <SpiritVoice text={affirmation} label="Hear Spirit speak this" />
                {used && <p className="text-xs text-green-600">+5 $VLG earned today ✓</p>}
              </motion.div>
            ) : (
              <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center text-gray-300">
                <p className="text-6xl mb-3">🌟</p>
                <p className="text-sm">Tap below to receive your affirmation</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button onClick={generate} disabled={loading}
          className="w-full bg-amber-500 text-white rounded-full py-4 font-bold text-lg hover:bg-amber-600 disabled:opacity-50 transition-colors">
          {loading ? '🌿 Spirit is speaking…' : affirmation ? '🔄 New Affirmation' : '🌟 Receive Affirmation'}
        </button>

        <p className="text-center text-xs text-gray-400">
          Say it out loud. Believe it. Repeat it until it's yours.
        </p>
      </div>
    </div>
  );
}
