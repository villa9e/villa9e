'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { SpiritVoice } from '@/components/village/SpiritVoice';
import { awardScore } from '@/lib/village/score';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';

const AFFIRMATION_THEMES = [
  { label: 'My Goals',   prompt: 'my goal achievement and the progress I\'m making' },
  { label: 'My Worth',   prompt: 'my inherent value and what I bring to the world' },
  { label: 'Abundance',  prompt: 'abundance, financial growth, and prosperity flowing to me' },
  { label: 'Community',  prompt: 'the village around me and the power of doing this together' },
  { label: 'My Health',  prompt: 'my physical and mental well-being' },
  { label: 'Courage',    prompt: 'my courage, boldness, and willingness to grow' },
];

export default function AffirmationPage() {
  const [profile, setProfile] = useState<any>(null);
  const [theme, setTheme] = useState(AFFIRMATION_THEMES[0]);
  const [affirmation, setAffirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [used, setUsed] = useState(false);
  const supabase = createClient();
  const { theme: villageTheme } = useVillageTheme();
  const isNight = villageTheme === 'night';

  const bg     = isNight
    ? 'linear-gradient(160deg, #0A0600 0%, #140A00 50%, #0A0600 100%)'
    : 'linear-gradient(160deg, #FFFBEB 0%, #FEF9C3 50%, #FFFBEB 100%)';
  const card   = isNight ? '#1A1000' : '#FFFFFF';
  const border = isNight ? '#3D2800' : '#FDE68A';
  const text   = isNight ? '#F0EBE0' : '#451A03';
  const muted  = isNight ? '#8B6000' : '#92400E';
  const accent = isNight ? '#FBBF24' : '#D97706';

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) (supabase as any).from('profiles').select('display_name, personality_type').eq('id', user.id).single()
        .then(({ data }: any) => setProfile(data));
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
          mood: 'great', mood_score: 9, energy_level: 9,
          focus_area: theme.prompt,
          user_name: name,
          spiritual_system: 'secular',
        }),
      });
      const data = await res.json();
      const txt = data.affirmation || data.greeting || data.reflection || data.voice_script || '';
      setAffirmation(txt || `I, ${name}, am fully capable of achieving everything I am working toward. The village supports my journey.`);

      if (!used) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await (supabase as any).from('mindful_moments').insert({
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
    <div className="min-h-screen pb-24" style={{ background: bg }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 py-3.5 flex items-center gap-3"
        style={{ background: isNight ? 'rgba(10,6,0,0.9)' : 'rgba(255,251,235,0.9)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${border}` }}>
        <Link href="/village/zen" className="text-xl" style={{ color: muted }}>←</Link>
        <span className="text-2xl">🌟</span>
        <h1 className="text-lg font-black" style={{ color: text }}>Daily Affirmation</h1>
      </div>

      <div className="max-w-md mx-auto p-6 space-y-6">
        <p className="text-center text-sm" style={{ color: muted }}>
          Choose a theme and let Spirit speak your truth today.
        </p>

        {/* Theme selector */}
        <div className="grid grid-cols-3 gap-2">
          {AFFIRMATION_THEMES.map(t => (
            <button key={t.label} onClick={() => { setTheme(t); setAffirmation(''); }}
              className="py-2.5 px-3 rounded-2xl text-xs font-semibold transition-all"
              style={{
                background: theme.label === t.label ? accent : card,
                color: theme.label === t.label ? '#fff' : muted,
                border: `1px solid ${theme.label === t.label ? accent : border}`,
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Affirmation display */}
        <div className="min-h-52 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {affirmation ? (
              <motion.div key={affirmation}
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-5 px-2">
                <div className="relative">
                  <div className="absolute -top-6 -left-2 text-4xl opacity-20" style={{ color: accent }}>"</div>
                  <p className="text-xl font-medium leading-relaxed italic" style={{ color: text }}>
                    {affirmation}
                  </p>
                  <div className="absolute -bottom-6 -right-2 text-4xl opacity-20" style={{ color: accent }}>"</div>
                </div>
                <div className="mt-8 flex flex-col items-center gap-3">
                  <SpiritVoice text={affirmation} label="Hear Spirit speak this" />
                  {used && (
                    <p className="text-xs font-semibold" style={{ color: '#22C55E' }}>+5 $VLG earned today ✓</p>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center" style={{ color: muted }}>
                <motion.p className="text-6xl mb-3"
                  animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity }}>
                  🌟
                </motion.p>
                <p className="text-sm">Tap below to receive your affirmation</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button onClick={generate} disabled={loading}
          className="w-full text-white rounded-full py-4 font-black text-base transition-all disabled:opacity-50"
          style={{ background: `linear-gradient(135deg, ${accent}, ${isNight ? '#F59E0B' : '#B45309'})` }}>
          {loading ? '🌿 Spirit is speaking…' : affirmation ? '🔄 New Affirmation' : '🌟 Receive Affirmation'}
        </button>

        <p className="text-center text-xs" style={{ color: isNight ? '#3D2800' : '#92400E' }}>
          Say it out loud. Believe it. Repeat it until it's yours.
        </p>
      </div>
    </div>
  );
}
