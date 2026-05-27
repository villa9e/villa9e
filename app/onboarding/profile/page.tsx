'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

const OCCUPATIONS = [
  { label: 'Student', emoji: '📚' },
  { label: 'Entrepreneur', emoji: '🚀' },
  { label: 'Artist/Creative', emoji: '🎨' },
  { label: 'Musician', emoji: '🎵' },
  { label: 'Developer', emoji: '💻' },
  { label: 'Designer', emoji: '🖌️' },
  { label: 'Healthcare', emoji: '🏥' },
  { label: 'Educator', emoji: '📖' },
  { label: 'Finance', emoji: '💰' },
  { label: 'Trades', emoji: '🔨' },
  { label: 'Coach', emoji: '🏆' },
  { label: 'Other', emoji: '✨' },
];

const COMM_STYLES = [
  { id: 'Encouraging & warm',       emoji: '🤗', desc: 'Positive, supportive, celebratory' },
  { id: 'Direct & concise',         emoji: '⚡', desc: 'Straight to the point, no fluff' },
  { id: 'Analytical & detailed',    emoji: '🔬', desc: 'Data-driven, thorough breakdowns' },
  { id: 'Gentle & patient',         emoji: '🌿', desc: 'Calm, never overwhelming' },
  { id: 'Storytelling & metaphors', emoji: '📖', desc: 'Vivid examples, relatable analogies' },
];

type Step = 'name' | 'occupation' | 'style' | 'saving' | 'done';

export default function ProfileOnboarding() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState<Step>('name');
  const [form, setForm] = useState({
    display_name: '',
    location_city: '',
    occupation: '',
    communication_style: '',
    date_of_birth: '',
  });

  async function finish(skipToEnd = false) {
    setStep('saving');
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await (supabase as any).from('profiles').update({
        display_name:        form.display_name || null,
        location_city:       form.location_city || null,
        occupation:          form.occupation || null,
        communication_style: form.communication_style || null,
        date_of_birth:       form.date_of_birth || null,
        onboarding_complete: true,
        onboarding_step:     99,
      }).eq('id', user.id);

      const referrer = typeof window !== 'undefined' ? localStorage.getItem('villa9e_referrer') : null;
      await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referrer }),
      });
      if (referrer) localStorage.removeItem('villa9e_referrer');
    }
    setStep('done');
    setTimeout(() => router.push('/onboarding/welcome'), 1200);
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white flex flex-col overflow-hidden">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-emerald-500/8 rounded-full blur-[80px]" />
        <div className="absolute bottom-1/3 left-1/4 w-[200px] h-[200px] bg-[#1877F2]/8 rounded-full blur-[60px]" />
      </div>

      {/* Progress */}
      <div className="relative z-10 flex justify-center gap-2 pt-10 pb-2">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i === 3 ? 'w-8 bg-emerald-400' : 'w-4 bg-emerald-400/50'}`} />
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* STEP: Name */}
        {step === 'name' && (
          <motion.div key="name"
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            className="flex-1 flex flex-col px-5 pb-8 max-w-lg mx-auto w-full">

            <div className="py-8">
              <p className="text-emerald-400 text-xs font-bold tracking-[2px] uppercase mb-2">STEP 4 OF 4 · YOUR IDENTITY</p>
              <h2 className="text-2xl font-black text-white">What should the village call you?</h2>
              <p className="text-white/45 text-sm mt-1">This is your display name — you can change it anytime.</p>
            </div>

            <div className="space-y-4 flex-1">
              <div>
                <label className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2 block">Name or Nickname</label>
                <input
                  value={form.display_name}
                  onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && form.display_name.trim() && setStep('occupation')}
                  placeholder="Your name…"
                  autoFocus
                  className="w-full bg-white/[0.04] border border-white/10 focus:border-emerald-400/50 rounded-2xl px-5 py-4 text-white placeholder:text-white/25 text-lg focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2 block">Where are you based? <span className="normal-case text-white/25 font-normal">(optional)</span></label>
                <input
                  value={form.location_city}
                  onChange={e => setForm(f => ({ ...f, location_city: e.target.value }))}
                  placeholder="City, State (e.g. Los Angeles, CA)"
                  className="w-full bg-white/[0.04] border border-white/10 focus:border-emerald-400/50 rounded-2xl px-5 py-4 text-white placeholder:text-white/25 text-base focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2 block">Date of Birth <span className="normal-case text-white/25 font-normal">(optional — never shown publicly)</span></label>
                <input
                  type="date"
                  value={form.date_of_birth}
                  onChange={e => setForm(f => ({ ...f, date_of_birth: e.target.value }))}
                  className="w-full bg-white/[0.04] border border-white/10 focus:border-emerald-400/50 rounded-2xl px-5 py-4 text-white/70 text-base focus:outline-none transition-colors"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
            </div>

            <div className="pt-6 space-y-3">
              <button
                onClick={() => form.display_name.trim() ? setStep('occupation') : finish()}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-4 rounded-2xl transition-all text-base"
              >
                {form.display_name.trim() ? 'Continue →' : 'Skip & Enter Village'}
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP: Occupation */}
        {step === 'occupation' && (
          <motion.div key="occupation"
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            className="flex-1 flex flex-col px-5 pb-8 max-w-lg mx-auto w-full">

            <div className="py-6">
              <p className="text-emerald-400 text-xs font-bold tracking-[2px] uppercase mb-2">ALMOST THERE</p>
              <h2 className="text-2xl font-black text-white">What do you do?</h2>
              <p className="text-white/45 text-sm mt-1">Helps Spirit match you with the right villagers.</p>
            </div>

            <div className="grid grid-cols-3 gap-2.5 flex-1 content-start">
              {OCCUPATIONS.map(occ => (
                <motion.button
                  key={occ.label}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setForm(f => ({ ...f, occupation: occ.label }));
                    setTimeout(() => setStep('style'), 150);
                  }}
                  className={`flex flex-col items-center gap-1.5 p-3.5 rounded-2xl border transition-all ${
                    form.occupation === occ.label
                      ? 'border-emerald-400 bg-emerald-400/15 text-white'
                      : 'border-white/8 bg-white/[0.03] text-white/50 hover:border-white/20 hover:text-white/70'
                  }`}
                >
                  <span className="text-2xl">{occ.emoji}</span>
                  <span className="font-semibold text-xs text-center leading-tight">{occ.label}</span>
                </motion.button>
              ))}
            </div>

            <div className="pt-5 space-y-3">
              <button onClick={() => setStep('style')}
                className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold py-3 rounded-2xl transition-all text-sm border border-emerald-500/20">
                Skip this →
              </button>
              <button onClick={() => setStep('name')} className="w-full text-white/25 text-sm py-2">← Back</button>
            </div>
          </motion.div>
        )}

        {/* STEP: Communication Style */}
        {step === 'style' && (
          <motion.div key="style"
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            className="flex-1 flex flex-col px-5 pb-8 max-w-lg mx-auto w-full">

            <div className="py-6">
              <p className="text-emerald-400 text-xs font-bold tracking-[2px] uppercase mb-2">LAST STEP</p>
              <h2 className="text-2xl font-black text-white">How should Spirit talk to you?</h2>
              <p className="text-white/45 text-sm mt-1">You can change this anytime in your Spirit settings.</p>
            </div>

            <div className="space-y-3 flex-1">
              {COMM_STYLES.map(style => (
                <motion.button
                  key={style.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setForm(f => ({ ...f, communication_style: style.id }));
                    setTimeout(() => finish(), 200);
                  }}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                    form.communication_style === style.id
                      ? 'border-emerald-400 bg-emerald-400/15'
                      : 'border-white/8 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'
                  }`}
                >
                  <span className="text-2xl">{style.emoji}</span>
                  <div>
                    <p className="font-bold text-white text-sm">{style.id}</p>
                    <p className="text-white/40 text-xs mt-0.5">{style.desc}</p>
                  </div>
                </motion.button>
              ))}
            </div>

            <div className="pt-5 space-y-3">
              <button onClick={() => finish()}
                className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold py-3 rounded-2xl transition-all text-sm border border-emerald-500/20">
                Skip — Enter the Village
              </button>
              <button onClick={() => setStep('occupation')} className="w-full text-white/25 text-sm py-2">← Back</button>
            </div>
          </motion.div>
        )}

        {/* SAVING */}
        {(step === 'saving' || step === 'done') && (
          <motion.div key="saving"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center px-6 text-center">

            <AnimatePresence mode="wait">
              {step === 'saving' ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    className="w-12 h-12 rounded-full border-2 border-emerald-400 border-t-transparent"
                  />
                  <p className="text-white/50 text-sm">Setting up your village…</p>
                </motion.div>
              ) : (
                <motion.div key="done" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring' }}
                  className="flex flex-col items-center gap-4">
                  <span className="text-7xl">🏕️</span>
                  <h2 className="text-2xl font-black text-white">Welcome to the village.</h2>
                  <p className="text-white/40 text-sm">Taking you to your map…</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
