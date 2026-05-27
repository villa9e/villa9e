'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { VillageLogo } from '@/components/brand/VillageLogo';

const FEATURES = [
  { emoji: '🗺️', title: 'Goal GPS',      desc: 'Spirit AI builds your full goal roadmap — steps, probability score, timeline.' },
  { emoji: '✊',  title: 'OoWop',         desc: 'Validate each other\'s wins. Village-powered accountability.' },
  { emoji: '🌿',  title: 'Spirit AI',    desc: 'Your personal AI guide who knows you, grows with you, and never gives up on you.' },
  { emoji: '🏆',  title: 'Village Score', desc: 'Earn $VLG for every goal step, OoWop, and connection. The village rewards action.' },
];

export default function ReferralPage({ params }: { params: { username: string } }) {
  const [referrer, setReferrer]   = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const router  = useRouter();
  const supabase = createClient();

  useEffect(() => {
    localStorage.setItem('villa9e_referrer', params.username);

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) { router.push('/village/map'); return; }
    });

    // Load referrer profile
    (supabase as any)
      .from('profiles')
      .select('username, display_name, village_score, score_tier, personality_type, avatar_config')
      .eq('username', params.username)
      .single()
      .then(({ data }: any) => { setReferrer(data); setLoading(false); });
  }, [params.username]);

  const ARCHETYPE_EMOJI: Record<string, string> = {
    architect: '🏗️', spark: '⚡', anchor: '⚓', compass: '🧭',
    pioneer: '🏔️', sage: '📚', weaver: '🕸️', flame: '🔥',
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg,#060810 0%,#0E1428 50%,#0A0B18 100%)' }}>
      {/* Hero */}
      <div className="pt-12 pb-8 px-6 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="mx-auto mb-5"
          style={{ width: 80, filter: 'drop-shadow(0 0 20px rgba(24,119,242,0.5))' }}
        >
          <VillageLogo size={80} variant="circle" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl font-black text-white tracking-tight"
        >
          villa9e
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm mt-2"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          It takes a village.
        </motion.p>
      </div>

      <div className="max-w-sm mx-auto px-4 space-y-4 pb-16">
        {/* Referrer card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-3xl p-5"
          style={{ background: 'rgba(24,119,242,0.1)', border: '1px solid rgba(24,119,242,0.25)' }}
        >
          {loading ? (
            <div className="h-16 animate-pulse rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }} />
          ) : referrer ? (
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: 'rgba(24,119,242,0.2)', border: '2px solid rgba(24,119,242,0.4)' }}>
                {ARCHETYPE_EMOJI[referrer.personality_type] ?? '🌟'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-white truncate">
                  {referrer.display_name || `@${referrer.username}`}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  @{referrer.username} · {(referrer.village_score ?? 0).toLocaleString()} $VLG
                  {referrer.personality_type && (
                    <span className="capitalize"> · {referrer.personality_type}</span>
                  )}
                </p>
                <p className="text-xs mt-1.5" style={{ color: '#60A5FA' }}>
                  invited you to the village
                </p>
              </div>
            </div>
          ) : (
            <p className="text-center text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
              @{params.username} invited you to the village
            </p>
          )}
        </motion.div>

        {/* Reward callout */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl px-4 py-3 flex items-center gap-3"
          style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}
        >
          <span className="text-2xl">🏆</span>
          <p className="text-sm" style={{ color: '#FCD34D' }}>
            <span className="font-bold">You both earn +100 $VLG</span> when you join and complete onboarding.
          </p>
        </motion.div>

        {/* CTA buttons */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="space-y-3">
          <Link
            href={`/signup?ref=${params.username}`}
            className="block w-full py-4 rounded-2xl font-black text-white text-center text-base"
            style={{ background: 'linear-gradient(135deg,#1877F2,#1565C0)', boxShadow: '0 4px 24px rgba(24,119,242,0.4)' }}
          >
            🏡 Join the Village
          </Link>
          <Link
            href="/login"
            className="block w-full py-3 rounded-2xl font-bold text-sm text-center"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)' }}
          >
            Already a villager? Sign in →
          </Link>
        </motion.div>

        {/* Features */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="space-y-3 pt-2">
          <p className="text-xs text-center font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Inside the village
          </p>
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.07 }}
              className="flex items-start gap-3 rounded-2xl p-4"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <span className="text-2xl flex-shrink-0">{f.emoji}</span>
              <div>
                <p className="font-bold text-sm text-white">{f.title}</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer */}
        <p className="text-center text-xs pt-2" style={{ color: 'rgba(255,255,255,0.18)' }}>
          Free to join · No credit card required
        </p>
      </div>
    </div>
  );
}
