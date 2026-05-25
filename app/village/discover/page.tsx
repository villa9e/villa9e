'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function DiscoverPage() {
  const [villagers, setVillagers] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [tab, setTab] = useState<'matches' | 'discover'>('matches');
  const supabase = createClient();

  useEffect(() => { loadVillagers(); }, []);

  async function loadVillagers() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [{ data: top }, { data: myMatches }] = await Promise.all([
      supabase.from('profiles').select('id,username,display_name,village_score,score_tier,personality_type,occupation').neq('id', user.id).gt('village_score', 0).order('village_score', { ascending: false }).limit(20),
      supabase.from('villager_matches').select('*, profiles!villager_matches_matched_user_id_fkey(username,display_name,village_score,score_tier,personality_type,occupation)').eq('user_id', user.id).eq('is_dismissed', false).order('match_score', { ascending: false }).limit(10),
    ]);
    setVillagers(top ?? []);
    setMatches(myMatches ?? []);
    setLoading(false);
  }

  async function runMatching() {
    setMatching(true);
    await fetch('/api/claude/match-villagers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
    await loadVillagers();
    setMatching(false);
    setTab('matches');
  }

  async function connectWithVillager(matchedId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('connections').upsert({ requester_id: user.id, addressee_id: matchedId, status: 'pending' }, { onConflict: 'requester_id,addressee_id' });
  }

  async function dismissMatch(matchId: string) {
    await supabase.from('villager_matches').update({ is_dismissed: true }).eq('id', matchId);
    setMatches(prev => prev.filter(m => m.id !== matchId));
  }

  const tierIcon = (tier: string) => tier === 'legend' ? '🏆' : tier === 'elder' ? '⚡' : tier === 'builder' ? '🏗️' : tier === 'grower' ? '🌱' : '🌾';

  const VillagerCard = ({ v, matchData }: { v: any; matchData?: any }) => (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="village-card">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-2xl bg-village-blue/10 flex items-center justify-center text-2xl font-bold text-village-blue flex-shrink-0">
          {v.username?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-bold">@{v.username}</p>
            <span>{tierIcon(v.score_tier ?? 'seedling')}</span>
            <span className="text-xs text-gray-400 ml-auto">{v.village_score} pts</span>
          </div>
          {v.display_name && <p className="text-sm text-gray-600">{v.display_name}</p>}
          {v.occupation && <p className="text-xs text-gray-400 mt-0.5">{v.occupation}</p>}
          {matchData?.match_reason && (
            <p className="text-xs text-village-blue mt-1.5 bg-blue-50 px-2 py-1 rounded-lg">
              ✨ {matchData.match_reason}
            </p>
          )}
          {matchData?.match_score && (
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                <div className="h-1.5 rounded-full village-gradient" style={{ width: `${matchData.match_score}%` }} />
              </div>
              <span className="text-xs font-bold text-village-blue">{matchData.match_score}% match</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button onClick={() => connectWithVillager(v.id)} className="flex-1 bg-village-blue text-white rounded-full py-1.5 text-xs font-bold hover:bg-village-blueDark">
          🤝 Connect
        </button>
        {matchData && (
          <button onClick={() => dismissMatch(matchData.id)} className="px-3 bg-gray-100 text-gray-400 rounded-full text-xs hover:bg-gray-200">
            ✕
          </button>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-village-bg">
      <div className="bg-village-blue text-white px-6 py-4 flex items-center gap-3">
        <Link href="/village/map" className="text-xl">←</Link>
        <span className="text-2xl">🔍</span>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Discover Villagers</h1>
          <p className="text-blue-100 text-xs">Find your people</p>
        </div>
        <button onClick={runMatching} disabled={matching} className="bg-white/20 rounded-full px-3 py-1 text-xs font-bold hover:bg-white/30 disabled:opacity-50">
          {matching ? '⟳ Matching…' : '🤖 AI Match'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white">
        {(['matches', 'discover'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${tab === t ? 'text-village-blue border-b-2 border-village-blue' : 'text-gray-500'}`}>
            {t === 'matches' ? `✨ My Matches (${matches.length})` : '🌍 All Villagers'}
          </button>
        ))}
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-3">
        {loading && <div className="text-center py-8 text-gray-400">Loading villagers…</div>}

        {tab === 'matches' && (
          <>
            {matches.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-4xl mb-3">🤖</p>
                <p className="text-gray-500 mb-4">No AI matches yet.</p>
                <button onClick={runMatching} disabled={matching} className="village-btn-primary">
                  {matching ? 'Finding matches…' : '✨ Find My Villagers'}
                </button>
              </div>
            ) : (
              matches.map(m => <VillagerCard key={m.id} v={m.profiles} matchData={m} />)
            )}
          </>
        )}

        {tab === 'discover' && villagers.map((v, i) => (
          <motion.div key={v.id} transition={{ delay: i * 0.03 }}>
            <VillagerCard v={v} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
