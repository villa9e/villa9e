'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

const VillageMap3D = dynamic(() => import('@/components/map/VillageMap3D'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-[#0a0e1a] to-[#0d1f3c]">
      <div className="text-center">
        <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
          <span className="text-6xl">⛺</span>
        </motion.div>
        <p className="text-white/50 text-sm mt-3 font-medium animate-pulse">Loading your village…</p>
      </div>
    </div>
  ),
});

// Confetti particle component
function Confetti() {
  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 1.5,
    color: ['#1877F2', '#FFD700', '#FF6B2B', '#22C55E', '#8B5CF6', '#F9A8D4'][Math.floor(Math.random() * 6)],
    size: 6 + Math.random() * 8,
    duration: 2 + Math.random() * 2,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {particles.map(p => (
        <motion.div
          key={p.id}
          initial={{ y: -20, x: `${p.x}vw`, opacity: 1, rotate: 0 }}
          animate={{ y: '110vh', opacity: [1, 1, 0], rotate: 360 * (Math.random() > 0.5 ? 1 : -1) }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  );
}

function VillageMapPageInner() {
  const [profile, setProfile]           = useState<any>(null);
  const [foundingCount, setFoundingCount] = useState(0);
  const [unreadCount, setUnreadCount]   = useState(0);
  const [showWelcome, setShowWelcome]   = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const searchParams = useSearchParams();
  const supabase     = createClient();

  useEffect(() => {
    const isWelcome = searchParams.get('welcome') === '1';

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: p }, { data: fc }, { count: unread }] = await Promise.all([
        (supabase as any).from('profiles')
          .select('username,village_score,score_tier,vlg_balance,is_founding_villager,founding_villager_number,personality_type,display_name')
          .eq('id', user.id)
          .single(),
        (supabase as any).from('founding_villager_counter')
          .select('count,max_count')
          .eq('id', 1)
          .single(),
        (supabase as any).from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false),
      ]);

      setProfile(p);
      setFoundingCount(fc?.count ?? 0);
      setUnreadCount(unread ?? 0);

      if (isWelcome) {
        setShowWelcome(true);
        if (p?.is_founding_villager) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 4000);
        }
        // Remove welcome param from URL without reload
        window.history.replaceState({}, '', '/village/map');
      }
    }

    load();

    // Realtime unread count
    const channel = supabase.channel('notif_count')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
        setUnreadCount(c => c + 1);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const spotsLeft = Math.max(0, 1000 - foundingCount);
  const vlgDisplay = profile?.vlg_balance
    ? profile.vlg_balance >= 1000
      ? `${(profile.vlg_balance / 1000).toFixed(1)}K`
      : Math.floor(profile.vlg_balance).toString()
    : '0';

  const tierColors: Record<string, string> = {
    legend:  'bg-amber-400/20 text-amber-300 border-amber-400/30',
    elder:   'bg-purple-400/20 text-purple-300 border-purple-400/30',
    builder: 'bg-blue-400/20 text-blue-300 border-blue-400/30',
    grower:  'bg-green-400/20 text-green-300 border-green-400/30',
    seedling:'bg-white/10 text-white/50 border-white/10',
  };
  const tierClass = tierColors[profile?.score_tier ?? 'seedling'] ?? tierColors.seedling;

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0e1a]">

      {/* Confetti */}
      {showConfetti && <Confetti />}

      {/* Welcome overlay */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-6"
            onClick={() => setShowWelcome(false)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 15 }}
              className="bg-[#0f1623] border border-white/10 rounded-3xl p-8 text-center max-w-sm w-full shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-7xl mb-5"
              >
                {profile?.is_founding_villager ? '👑' : '🏕️'}
              </motion.div>

              {profile?.is_founding_villager ? (
                <>
                  <div className="inline-flex items-center gap-2 bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-bold px-4 py-1.5 rounded-full mb-4">
                    FOUNDING VILLAGER #{profile.founding_villager_number}
                  </div>
                  <h2 className="text-2xl font-black text-white mb-2">
                    Welcome to the village.
                  </h2>
                  <p className="text-white/50 text-sm leading-relaxed mb-4">
                    You're one of the first {profile.founding_villager_number} people in villa9e. You'll receive 500 $VLG + a Founding Villager NFT badge at Phase 3.
                  </p>
                  <div className="bg-amber-400/10 border border-amber-400/20 rounded-2xl p-3 mb-5">
                    <p className="text-amber-300 text-xs font-semibold">+500 $VLG reserved for Phase 3 launch</p>
                    <p className="text-amber-400/60 text-xs mt-0.5">+50 $VLG welcome bonus added now</p>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-black text-white mb-2">
                    Welcome{profile?.display_name ? `, ${profile.display_name}` : ''}.
                  </h2>
                  <p className="text-white/50 text-sm leading-relaxed mb-4">
                    Your village is ready. Set your first goal, give an OoWop to a villager, and start building something real.
                  </p>
                  <div className="bg-[#1877F2]/10 border border-[#1877F2]/20 rounded-2xl p-3 mb-5">
                    <p className="text-[#60a5fa] text-xs font-semibold">+50 $VLG welcome bonus added ✓</p>
                  </div>
                </>
              )}

              <button
                onClick={() => setShowWelcome(false)}
                className="w-full bg-[#1877F2] hover:bg-[#1565c0] text-white font-bold py-3.5 rounded-2xl transition-colors"
              >
                Enter the Village →
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top navigation bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0a0e1a]/90 backdrop-blur-md border-b border-white/5 z-10">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="text-xl">⛺</span>
          <span className="font-black text-white text-sm tracking-tight">villa9e</span>
        </div>

        {/* Founding counter */}
        {spotsLeft > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 bg-amber-400/10 border border-amber-400/20 rounded-full px-3 py-1 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-amber-300 font-semibold">{spotsLeft} Founding spots left</span>
          </div>
        )}

        {/* Right side: VLG + notifs + profile */}
        <div className="flex items-center gap-2">
          {/* $VLG balance */}
          <div className="flex items-center gap-1 bg-[#1877F2]/15 border border-[#1877F2]/25 rounded-full px-2.5 py-1">
            <span className="text-xs">🪙</span>
            <span className="text-[#60a5fa] text-xs font-bold">{vlgDisplay} VLG</span>
          </div>

          {/* Notifications */}
          <Link href="/notifications" className="relative w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors">
            <span className="text-base">🔔</span>
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center"
              >
                <span className="text-white text-[9px] font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>
              </motion.div>
            )}
          </Link>

          {/* Profile */}
          <Link href="/village/hut" className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/8 rounded-full px-2.5 py-1 transition-colors">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${tierClass}`}>
              {profile?.score_tier ?? 'seedling'}
            </span>
            <span className="text-white/70 text-xs font-medium">@{profile?.username ?? '…'}</span>
          </Link>
        </div>
      </div>

      {/* 3D Map */}
      <div className="flex-1" style={{ height: 'calc(100vh - 52px)' }}>
        <VillageMap3D />
      </div>

      {/* Bottom hint */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2 text-xs text-white/40 pointer-events-none">
        Tap any building to enter
      </div>
    </div>
  );
}

export default function VillageMapPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <div className="text-6xl animate-pulse">⛺</div>
      </div>
    }>
      <VillageMapPageInner />
    </Suspense>
  );
}
