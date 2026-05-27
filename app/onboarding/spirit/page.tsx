'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import type { SpiritVariantId } from '@/components/spirit/SpiritFigure';

const SpiritSelector = dynamic(
  () => import('@/components/spirit/SpiritSelector').then(m => ({ default: m.SpiritSelector })),
  { ssr: false }
);

const TOPICS = [
  { id: 'wellness',      emoji: '🌿', label: 'Wellness' },
  { id: 'business',     emoji: '💼', label: 'Business' },
  { id: 'creativity',   emoji: '🎨', label: 'Creativity' },
  { id: 'family',       emoji: '👨‍👩‍👧', label: 'Family' },
  { id: 'finance',      emoji: '💰', label: 'Finance' },
  { id: 'fitness',      emoji: '💪', label: 'Fitness' },
  { id: 'spirituality', emoji: '✨', label: 'Spirituality' },
  { id: 'education',    emoji: '📚', label: 'Education' },
  { id: 'relationships',emoji: '❤️', label: 'Love' },
  { id: 'travel',       emoji: '✈️', label: 'Travel' },
  { id: 'career',       emoji: '🚀', label: 'Career' },
  { id: 'community',    emoji: '🤝', label: 'Community' },
];

const SPIRITUAL_SYSTEMS = [
  { id: 'Christianity', emoji: '✝️' },
  { id: 'Islam', emoji: '☪️' },
  { id: 'Buddhism', emoji: '☸️' },
  { id: 'Hinduism', emoji: '🕉️' },
  { id: 'Stoicism', emoji: '⚖️' },
  { id: 'Secular', emoji: '🌍' },
  { id: 'Spiritual (non-religious)', emoji: '🌌' },
  { id: 'Judaism', emoji: '✡️' },
  { id: 'Other', emoji: '💫' },
];

// Stepped onboarding: intro → spirit_choice → topics → spirit → done
type Step = 'intro' | 'spirit_choice' | 'topics' | 'spirit' | 'saving';

export default function SpiritOnboarding() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState<Step>('intro');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [spiritualSystem, setSpiritualSystem] = useState('Secular');
  const [spiritVariant, setSpiritVariant] = useState<SpiritVariantId>('blue');

  function toggleTopic(id: string) {
    setSelectedTopics(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  }

  async function saveAndContinue() {
    setStep('saving');
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await Promise.all([
        (supabase as any).from('spirit_configs').upsert({
          user_id: user.id,
          topics: selectedTopics,
          spiritual_system: spiritualSystem,
        }),
        // Save spirit variant to avatar_config
        (supabase as any).from('profiles')
          .select('avatar_config')
          .eq('id', user.id)
          .single()
          .then(({ data }: any) => {
            const updated = { ...(data?.avatar_config ?? {}), spirit_variant: spiritVariant };
            return (supabase as any).from('profiles').update({ avatar_config: updated }).eq('id', user.id);
          }),
      ]);
    }
    router.push('/onboarding/skills');
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white flex flex-col overflow-hidden">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#1877F2]/8 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[200px] h-[200px] bg-amber-500/6 rounded-full blur-[60px]" />
      </div>

      {/* Progress dots */}
      <div className="relative z-10 flex justify-center gap-2 pt-10 pb-4">
        {(['intro', 'spirit_choice', 'topics', 'spirit'] as const).map((s, i) => (
          <div key={s} className={`h-1 rounded-full transition-all duration-500 ${
            s === step || (step === 'saving' && s === 'spirit') ? 'w-8 bg-[#1877F2]' :
            i < (['intro', 'spirit_choice', 'topics', 'spirit'] as const).indexOf(step as any) ? 'w-4 bg-[#1877F2]/60' :
            'w-4 bg-white/10'
          }`} />
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* STEP 1: Village intro */}
        {step === 'intro' && (
          <motion.div key="intro"
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}
            className="flex-1 flex flex-col items-center justify-center px-6 pb-10 text-center">

            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="relative mb-8">
              <div className="absolute inset-0 rounded-full bg-[#1877F2]/20 animate-ping opacity-40 scale-150" />
              <div className="w-28 h-28 rounded-full bg-[#1877F2]/10 border border-[#1877F2]/30 flex items-center justify-center">
                <span className="text-6xl">⛺</span>
              </div>
            </motion.div>

            <h1 className="text-3xl font-black mb-3">Welcome to villa9e.</h1>
            <p className="text-white/50 text-base leading-relaxed max-w-xs mb-2">
              You just joined a living, breathing village built for people who chase real goals.
            </p>
            <p className="text-white/30 text-sm max-w-xs mb-10">
              Before we show you the village — let's introduce you to <span className="text-[#1877F2] font-semibold">Spirit</span>, your personal AI guide.
            </p>

            {/* Spirit preview card */}
            <div className="w-full max-w-sm bg-[#1877F2]/8 border border-[#1877F2]/20 rounded-2xl p-5 mb-8 text-left">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1877F2]/20 flex items-center justify-center text-xl flex-shrink-0">🌀</div>
                <div>
                  <p className="font-bold text-white text-sm">Spirit says:</p>
                  <p className="text-white/60 text-sm mt-1 leading-relaxed">
                    "Welcome, Villager. I'm here to help you set your first goal, build your GPS plan, and connect you with people who can push you forward. Let's make this real."
                  </p>
                </div>
              </div>
            </div>

            <button onClick={() => setStep('spirit_choice')}
              className="bg-[#1877F2] hover:bg-[#1565c0] text-white font-bold px-10 py-4 rounded-2xl text-base transition-all hover:scale-[1.02] w-full max-w-sm shadow-[0_0_40px_rgba(24,119,242,0.3)]">
              Meet Spirit →
            </button>
            <p className="text-white/20 text-xs mt-3">Takes about 60 seconds</p>
          </motion.div>
        )}

        {/* STEP 2: Choose your Spirit */}
        {step === 'spirit_choice' && (
          <motion.div key="spirit_choice"
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            className="flex-1 flex flex-col px-5 pb-10 max-w-lg mx-auto w-full">

            <div className="py-6">
              <p className="text-[#1877F2] text-xs font-bold tracking-[2px] uppercase mb-2">SPIRIT SETUP · CHOOSE</p>
              <h2 className="text-2xl font-black text-white">Pick your Spirit.</h2>
              <p className="text-white/45 text-sm mt-1">This is your AI companion until you create your own.</p>
            </div>

            <div className="flex-1">
              <SpiritSelector selected={spiritVariant} onSelect={setSpiritVariant} />
            </div>

            <div className="pt-5 space-y-3">
              <button onClick={() => setStep('topics')}
                className="w-full bg-[#1877F2] hover:bg-[#1565c0] text-white font-bold py-4 rounded-2xl transition-all">
                Continue with {spiritVariant === 'blue' ? 'Blue' : spiritVariant === 'white' ? 'White' : 'Dark'} Spirit →
              </button>
              <button onClick={() => setStep('intro')} className="w-full text-white/30 text-sm py-2">← Back</button>
            </div>
          </motion.div>
        )}

        {/* STEP 3: Topic selection */}
        {step === 'topics' && (
          <motion.div key="topics"
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            className="flex-1 flex flex-col px-5 pb-10 max-w-lg mx-auto w-full">

            <div className="py-6">
              <p className="text-[#1877F2] text-xs font-bold tracking-[2px] uppercase mb-2">SPIRIT SETUP · 1 OF 2</p>
              <h2 className="text-2xl font-black text-white">What do you care about?</h2>
              <p className="text-white/45 text-sm mt-1">Spirit learns your language. Pick everything that matters.</p>
            </div>

            <div className="grid grid-cols-3 gap-2.5 flex-1">
              {TOPICS.map(topic => (
                <motion.button
                  key={topic.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleTopic(topic.id)}
                  className={`flex flex-col items-center gap-1.5 p-3.5 rounded-2xl border transition-all text-sm ${
                    selectedTopics.includes(topic.id)
                      ? 'border-[#1877F2] bg-[#1877F2]/15 text-white'
                      : 'border-white/8 bg-white/[0.03] text-white/50 hover:border-white/20 hover:text-white/70'
                  }`}
                >
                  <span className="text-2xl">{topic.emoji}</span>
                  <span className="font-semibold text-xs">{topic.label}</span>
                </motion.button>
              ))}
            </div>

            <div className="pt-5 space-y-3">
              <button
                onClick={() => selectedTopics.length > 0 && setStep('spirit')}
                disabled={selectedTopics.length === 0}
                className="w-full bg-[#1877F2] hover:bg-[#1565c0] disabled:opacity-30 text-white font-bold py-4 rounded-2xl transition-all">
                {selectedTopics.length === 0 ? 'Pick at least one' : `Continue with ${selectedTopics.length} selected →`}
              </button>
              <button onClick={() => setStep('intro')} className="w-full text-white/30 text-sm py-2">← Back</button>
            </div>
          </motion.div>
        )}

        {/* STEP 3: Spiritual system */}
        {step === 'spirit' && (
          <motion.div key="spirit"
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            className="flex-1 flex flex-col px-5 pb-10 max-w-lg mx-auto w-full">

            <div className="py-6">
              <p className="text-[#1877F2] text-xs font-bold tracking-[2px] uppercase mb-2">SPIRIT SETUP · 2 OF 2</p>
              <h2 className="text-2xl font-black text-white">What guides you?</h2>
              <p className="text-white/45 text-sm mt-1">Spirit honors your values and speaks your language.</p>
            </div>

            <div className="grid grid-cols-3 gap-2.5 flex-1">
              {SPIRITUAL_SYSTEMS.map(sys => (
                <motion.button
                  key={sys.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSpiritualSystem(sys.id)}
                  className={`flex flex-col items-center gap-1.5 p-3.5 rounded-2xl border transition-all text-sm ${
                    spiritualSystem === sys.id
                      ? 'border-[#1877F2] bg-[#1877F2]/15 text-white'
                      : 'border-white/8 bg-white/[0.03] text-white/50 hover:border-white/20 hover:text-white/70'
                  }`}
                >
                  <span className="text-2xl">{sys.emoji}</span>
                  <span className="font-semibold text-xs text-center leading-tight">{sys.id}</span>
                </motion.button>
              ))}
            </div>

            <div className="pt-5 space-y-3">
              <button onClick={saveAndContinue}
                className="w-full bg-[#1877F2] hover:bg-[#1565c0] text-white font-bold py-4 rounded-2xl transition-all">
                Enter the Village 🏡
              </button>
              <button onClick={() => setStep('topics')} className="w-full text-white/30 text-sm py-2">← Back</button>
            </div>
          </motion.div>
        )}

        {/* SAVING */}
        {step === 'saving' && (
          <motion.div key="saving"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 rounded-full border-2 border-[#1877F2] border-t-transparent mb-6" />
            <h2 className="text-xl font-bold text-white mb-2">Awakening Spirit…</h2>
            <p className="text-white/40 text-sm">Preparing your village experience</p>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
