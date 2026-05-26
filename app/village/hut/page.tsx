'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { getScoreTier } from '@/lib/village/score';

export default function HutPage() {
  const [profile, setProfile] = useState<any>(null);
  const [skills, setSkills] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data: p }, { data: s }, { data: g }, { data: w }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('user_skills').select('*').eq('user_id', user.id).order('rating', { ascending: false }),
        supabase.from('goals').select('id,title,probability_score,status,progress_percentage').eq('user_id', user.id).eq('status', 'active').limit(5),
        supabase.from('village_wallets').select('vlg_balance,total_earned_vlg,total_data_earnings').eq('user_id', user.id).single(),
      ]);
      setProfile(p); setSkills(s ?? []); setGoals(g ?? []); setWallet(w);
      setLoading(false);
    }
    load();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-4xl animate-float">🏠</div>
    </div>
  );

  const tier = getScoreTier(profile?.village_score ?? 0);
  const tierToNext = tier.next === Infinity ? null : tier.next - (profile?.village_score ?? 0);

  return (
    <div className="min-h-screen bg-village-bg">
      <div className="bg-amber-500 text-white px-6 py-4 flex items-center gap-3">
        <Link href="/village/map" className="text-xl">←</Link>
        <span className="text-2xl">🏠</span>
        <div>
          <h1 className="text-xl font-bold leading-tight">The Hut</h1>
          <p className="text-amber-100 text-xs">Your home base</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Profile card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="village-card">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-village-blue/10 flex items-center justify-center text-2xl flex-shrink-0">
              {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full rounded-2xl object-cover" alt="" /> : '👤'}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold">@{profile?.username}</h2>
                {profile?.is_founding_villager && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium border border-amber-200">
                    👑 Founding Villager #{profile.founding_villager_number}
                  </span>
                )}
              </div>
              <p className="text-gray-500 text-sm">{profile?.display_name}</p>
              {profile?.bio && <p className="text-xs text-gray-400 mt-1">{profile.bio}</p>}
            </div>
          </div>

          {/* Score + tier */}
          <div className="mt-4 p-3 bg-gray-50 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className={`font-bold text-sm ${tier.color}`}>{tier.label}</span>
              <span className="text-2xl font-bold text-village-blue">{profile?.village_score ?? 0}</span>
            </div>
            {tierToNext && (
              <>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                  <div
                    className="h-2 rounded-full village-gradient"
                    style={{ width: `${Math.min(100, ((profile?.village_score ?? 0) / tier.next) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400">{tierToNext} pts to next tier</p>
              </>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="text-center">
              <p className="text-xl font-bold text-village-blue">{goals.length}</p>
              <p className="text-xs text-gray-400">Active Goals</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-green-600">{skills.filter(s => s.rating >= 7).length}</p>
              <p className="text-xs text-gray-400">Skillsets</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-amber-600">{Math.floor(wallet?.vlg_balance ?? 0)}</p>
              <p className="text-xs text-gray-400">$VLG Earned</p>
            </div>
          </div>
        </motion.div>

        {/* VLG Wallet */}
        {wallet && (
          <div className="village-card bg-gradient-to-br from-village-blue to-blue-700 text-white">
            <p className="text-blue-200 text-xs font-medium uppercase tracking-wide mb-1">village Wallet · Phase 1</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{parseFloat(wallet.vlg_balance ?? 0).toFixed(2)}</span>
              <span className="text-blue-200">$VLG</span>
            </div>
            <p className="text-blue-200 text-xs mt-1">Earned from goals, OoWops, and contributions. Converts to real $VLG at Phase 3.</p>
          </div>
        )}

        {/* Active goals */}
        {goals.length > 0 && (
          <div className="village-card">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <span>📍</span> Active Goals
            </h3>
            <div className="space-y-3">
              {goals.map(g => (
                <Link key={g.id} href={`/village/workshop/goal/${g.id}`} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-sm truncate">{g.title}</p>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1.5">
                      <div className="h-1.5 rounded-full bg-orange-400" style={{ width: `${g.progress_percentage ?? 0}%` }} />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-village-blue flex-shrink-0">{g.probability_score}%</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div className="village-card">
            <h3 className="font-bold mb-3">⚡ Skills</h3>
            <div className="space-y-2">
              {skills.slice(0, 6).map(skill => (
                <div key={skill.id} className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${skill.rating >= 7 ? 'bg-green-500' : skill.rating >= 4 ? 'bg-yellow-400' : 'bg-red-400'}`} />
                  <span className="text-sm flex-1 truncate">{skill.skill_name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-100 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full village-gradient" style={{ width: `${(skill.rating / 9) * 100}%` }} />
                    </div>
                    <span className="text-xs text-gray-400 w-4 text-right">{skill.rating}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick links */}
        <div className="village-card space-y-1">
          {[
            { href: '/village/hut/vlg-wallet',  icon: '💰', label: '$VLG Wallet',        desc: 'Balance & transactions' },
            { href: '/village/hut/data-locker', icon: '🔐', label: 'Data Locker',        desc: 'Control your data & earnings' },
            { href: '/village/discover',         icon: '🔍', label: 'Discover Villagers', desc: 'AI-matched villagers' },
            { href: '/village/personality-maze', icon: '🏰', label: 'Personality Maze',  desc: 'Find your archetype' },
            { href: '/leaderboard',              icon: '🏆', label: 'Leaderboard',        desc: 'Top villagers' },
            { href: '/messages',                 icon: '💬', label: 'Messages',           desc: 'Direct messages' },
            { href: '/village/hut/settings',     icon: '⚙️', label: 'Settings',          desc: 'Profile, Spirit, language' },
          ].map(item => (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
              <span className="text-xl">{item.icon}</span>
              <div className="flex-1">
                <p className="font-medium text-sm">{item.label}</p>
                <p className="text-xs text-gray-400">{item.desc}</p>
              </div>
              <span className="text-gray-300 text-lg">›</span>
            </Link>
          ))}
        </div>

        <button onClick={signOut} className="w-full border border-gray-200 rounded-xl py-3 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors text-sm">
          Sign out
        </button>
      </div>
    </div>
  );
}
