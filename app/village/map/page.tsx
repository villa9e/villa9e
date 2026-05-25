'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

// Dynamic import — Three.js only loads client-side
const VillageMap3D = dynamic(() => import('@/components/map/VillageMap3D'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-blue-100 to-green-50">
      <div className="text-center">
        <div className="text-6xl animate-float mb-4">⛺</div>
        <p className="text-village-blue font-medium animate-pulse">Loading your village…</p>
      </div>
    </div>
  ),
});

export default function VillageMapPage() {
  const [profile, setProfile] = useState<any>(null);
  const [foundingCount, setFoundingCount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data: p }, { data: fc }] = await Promise.all([
        supabase.from('profiles').select('username,village_score,score_tier,vlg_balance,is_founding_villager').eq('id', user.id).single(),
        supabase.from('founding_villager_counter').select('count,max_count').eq('id', 1).single(),
      ]);
      setProfile(p);
      setFoundingCount(fc?.count ?? 0);
    }
    load();
  }, []);

  const spotsLeft = 1000 - foundingCount;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-white/80 backdrop-blur-sm border-b border-gray-100 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full village-gradient flex items-center justify-center">
            <span className="text-sm">⛺</span>
          </div>
          <span className="font-bold text-village-blue">villa9e</span>
        </div>

        {/* Founding Villager counter */}
        {spotsLeft > 0 && (
          <div className="hidden sm:flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-full px-3 py-1 text-xs">
            <span className="text-amber-600 font-medium">👑 {foundingCount}/1,000 Founding Villagers</span>
            <span className="text-amber-400">· {spotsLeft} spots left</span>
          </div>
        )}

        {/* Profile chip */}
        <Link href="/village/hut" className="flex items-center gap-2 bg-gray-50 rounded-full px-3 py-1.5 hover:bg-gray-100 transition-colors">
          <div className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
            profile?.score_tier === 'legend'  ? 'bg-amber-100 text-amber-700' :
            profile?.score_tier === 'elder'   ? 'bg-purple-100 text-purple-700' :
            profile?.score_tier === 'builder' ? 'bg-blue-100 text-blue-700' :
            profile?.score_tier === 'grower'  ? 'bg-green-100 text-green-700' :
            'bg-gray-100 text-gray-600'
          }`}>
            {profile?.score_tier ?? 'seedling'}
          </div>
          <span className="text-sm font-medium text-gray-700">@{profile?.username ?? '…'}</span>
          <span className="text-xs text-village-blue font-bold">{profile?.village_score ?? 0}pts</span>
        </Link>
      </div>

      {/* 3D Map */}
      <div className="flex-1" style={{ height: 'calc(100vh - 56px)' }}>
        <VillageMap3D />
      </div>

      {/* Hint */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 text-xs text-gray-500 shadow-lg pointer-events-none">
        Tap any building to enter
      </div>
    </div>
  );
}
