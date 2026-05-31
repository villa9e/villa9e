'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { SpiritAvatarStatic } from '@/components/spirit/SpiritAvatarStatic';
import { VillageLogo } from '@/components/brand/VillageLogo';
import type { SpiritVariantId } from '@/components/spirit/SpiritFigure';

const CINEMATIC_STEPS = [
  { id: 'logo',    delay: 0,    duration: 1400 },
  { id: 'welcome', delay: 1400, duration: 1600 },
  { id: 'spirit',  delay: 3000, duration: 1800 },
  { id: 'features',delay: 4800, duration: 2000 },
  { id: 'enter',   delay: 6800, duration: 0    },
];

const FEATURES = [
  { emoji: '🗺️', text: 'Goal GPS — your full roadmap is ready' },
  { emoji: '✊',  text: 'OoWops — the village validates your wins' },
  { emoji: '🏆',  text: 'Village Score — earn $VLG for every action' },
  { emoji: '🌿',  text: 'Spirit — your AI guide is always here' },
];

export default function OnboardingWelcomePage() {
  const [phase, setPhase] = useState<'logo' | 'welcome' | 'spirit' | 'features' | 'enter'>('logo');
  const [profile, setProfile]     = useState<any>(null);
  const [spiritVariant, setSpiritVariant] = useState<SpiritVariantId>('blue');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return; }
      (supabase as any)
        .from('profiles')
        .select('display_name, username, avatar_config')
        .eq('id', user.id)
        .single()
        .then(({ data }: any) => {
          setProfile(data);
          if (data?.avatar_config?.spirit_variant) {
            setSpiritVariant(data.avatar_config.spirit_variant as SpiritVariantId);
          }
        });
    });

    // Auto-advance through cinematic phases
    CINEMATIC_STEPS.forEach(step => {
      if (step.delay > 0) {
        setTimeout(() => setPhase(step.id as any), step.delay);
      }
    });
  }, []);

  const name = profile?.display_name || profile?.username || 'Villager';

  return (
    <div
      className="min-h-screen overflow-hidden flex flex-col items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at 50% 30%, #0D1428 0%, #060810 100%)' }}
    >
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          animate={{ opacity: [0.08, 0.18, 0.08] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: '#1877F2', filter: 'blur(140px)' }}
        />
      </div>

      <div className="relative z-10 max-w-sm w-full px-6 text-center">
        <AnimatePresence mode="wait">

          {/* Phase 1: Logo */}
          {phase === 'logo' && (
            <motion.div key="logo"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="space-y-4"
            >
              <div className="mx-auto" style={{ filter: 'drop-shadow(0 0 40px rgba(24,119,242,0.6))' }}>
                <VillageLogo size={112} variant="circle" animated />
              </div>
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-5xl font-black text-white tracking-tight"
              >
                villa9e
              </motion.h1>
            </motion.div>
          )}

          {/* Phase 2: Welcome */}
          {phase === 'welcome' && (
            <motion.div key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="text-6xl">🏡</div>
              <h2 className="text-3xl font-black text-white">
                Welcome to<br />the village,<br />
                <span style={{ color: '#60A5FA' }}>{name}</span>.
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.45)' }} className="text-sm leading-relaxed">
                It takes a village. You just joined yours.
              </p>
            </motion.div>
          )}

          {/* Phase 3: Spirit */}
          {phase === 'spirit' && (
            <motion.div key="spirit"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="space-y-5"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="w-28 h-28 mx-auto"
              >
                <SpiritAvatarStatic variant={spiritVariant} size={112} />
              </motion.div>
              <div className="space-y-2">
                <div className="text-2xl font-black text-white">Your Spirit is here.</div>
                <p style={{ color: 'rgba(255,255,255,0.4)' }} className="text-sm">
                  Your personal AI guide. They know your goals, your patterns, your archetype. They're built to help you actually follow through.
                </p>
              </div>
            </motion.div>
          )}

          {/* Phase 4: Features */}
          {phase === 'features' && (
            <motion.div key="features"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <p className="text-white font-black text-xl mb-6">Inside the village:</p>
              <div className="space-y-3">
                {FEATURES.map((f, i) => (
                  <motion.div
                    key={f.text}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.18 }}
                    className="flex items-center gap-3 rounded-2xl px-4 py-3 text-left"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <span className="text-2xl">{f.emoji}</span>
                    <p className="text-sm text-white font-medium">{f.text}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Phase 5: Enter CTA */}
          {phase === 'enter' && (
            <motion.div key="enter"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <div className="text-5xl">🗺️</div>
                <h2 className="text-3xl font-black text-white">Your village awaits.</h2>
                <p style={{ color: 'rgba(255,255,255,0.4)' }} className="text-sm">
                  Your goal GPS is ready. Your Spirit is waiting.
                </p>
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push('/village/workshop')}
                className="w-full py-4 rounded-2xl font-black text-white text-lg"
                style={{
                  background: 'linear-gradient(135deg,#1877F2,#7C3AED)',
                  boxShadow: '0 0 40px rgba(24,119,242,0.4)',
                }}
              >
                Enter the Village →
              </motion.button>
              <button onClick={() => router.push('/village/workshop')}
                className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
                Skip intro
              </button>
            </motion.div>
          )}

        </AnimatePresence>

        {/* Phase dots */}
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex gap-2">
          {(['logo','welcome','spirit','features','enter'] as const).map(p => (
            <div key={p} className="w-1.5 h-1.5 rounded-full transition-all"
              style={{ background: phase === p ? '#1877F2' : 'rgba(255,255,255,0.2)', width: phase === p ? '24px' : '6px' }} />
          ))}
        </div>
      </div>
    </div>
  );
}
