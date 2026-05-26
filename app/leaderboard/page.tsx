'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getScoreTier } from '@/lib/village/score';

const TABS = ['village Score', 'OoWops Given', 'Goals Completed'] as const;
type Tab = typeof TABS[number];

export default function LeaderboardPage() {
  const [tab, setTab] = useState<Tab>('village Score');
  const [leaders, setLeaders] = useState<any[]>([]);
  const [myRank, setMyRank]   = useState<number | null>(null);
  const [myId, setMyId]       = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setMyId(user?.id ?? null));
    loadLeaders();
  }, [tab]);

  async function loadLeaders() {
    let q = supabase.from('profiles').select('id,username,display_name,village_score,score_tier,personality_type,is_founding_villager').gt('village_score', 0);
    q = q.order('village_score', { ascending: false }).limit(50);
    const { data } = await q;
    setLeaders(data ?? []);
  }

  useEffect(() => {
    if (!myId || !leaders.length) return;
    const rank = leaders.findIndex(l => l.id === myId) + 1;
    setMyRank(rank > 0 ? rank : null);
  }, [myId, leaders]);

  const ARCHETYPE_EMOJI: Record<string,string> = { architect:'🏗️', spark:'⚡', anchor:'⚓', compass:'🧭', pioneer:'🏔️', sage:'📚', weaver:'🕸️', flame:'🔥' };
  const podiumColors = ['text-amber-500', 'text-gray-400', 'text-amber-700'];
  const podiumBg     = ['bg-amber-50 border-amber-200', 'bg-gray-50 border-gray-200', 'bg-orange-50 border-orange-200'];

  return (
    <div className="min-h-screen bg-village-bg">
      <div className="village-gradient text-white px-6 py-4 flex items-center gap-3">
        <Link href="/village/map" className="text-xl">←</Link>
        <span className="text-2xl">🏆</span>
        <div>
          <h1 className="text-xl font-bold">Leaderboard</h1>
          <p className="text-blue-100 text-xs">Top villagers this season</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white border-b border-gray-100">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-3 text-xs font-semibold transition-colors ${tab === t ? 'text-village-blue border-b-2 border-village-blue' : 'text-gray-400'}`}>
            {t}
          </button>
        ))}
      </div>

      {myRank && (
        <div className="bg-blue-50 border-b border-blue-100 px-6 py-2 text-center">
          <p className="text-xs text-village-blue font-medium">You are ranked <strong>#{myRank}</strong> in the village</p>
        </div>
      )}

      <div className="max-w-2xl mx-auto p-4 space-y-3">
        {/* Podium top 3 */}
        {leaders.slice(0, 3).length === 3 && (
          <div className="grid grid-cols-3 gap-2 mb-2">
            {[leaders[1], leaders[0], leaders[2]].map((l, i) => {
              const pos = i === 0 ? 2 : i === 1 ? 1 : 3;
              const isMe = l.id === myId;
              return (
                <motion.div key={l.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  className={`village-card border text-center py-4 ${podiumBg[pos-1]} ${isMe ? 'ring-2 ring-village-blue' : ''}`}>
                  <p className={`text-3xl font-bold ${podiumColors[pos-1]}`}>{pos === 1 ? '🥇' : pos === 2 ? '🥈' : '🥉'}</p>
                  <div className="w-10 h-10 rounded-full village-gradient flex items-center justify-center text-white font-bold mx-auto mt-2 text-sm">
                    {l.username?.[0]?.toUpperCase()}
                  </div>
                  <p className="font-bold text-xs mt-1 truncate">@{l.username}</p>
                  <p className="text-village-blue font-bold text-sm">{l.village_score}</p>
                  {l.personality_type && <p className="text-lg">{ARCHETYPE_EMOJI[l.personality_type] ?? ''}</p>}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Full list */}
        {leaders.map((l, i) => {
          const tier = getScoreTier(l.village_score ?? 0);
          const isMe = l.id === myId;
          return (
            <motion.div key={l.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.02, 0.5) }}
              className={`village-card flex items-center gap-3 ${isMe ? 'border-village-blue border-2 bg-blue-50' : ''}`}>
              <span className={`w-8 text-center font-bold text-sm ${i < 3 ? podiumColors[i] : 'text-gray-400'}`}>
                {i < 3 ? ['🥇','🥈','🥉'][i] : `#${i+1}`}
              </span>
              <div className="w-9 h-9 rounded-full village-gradient flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {l.username?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className={`font-bold text-sm ${isMe ? 'text-village-blue' : ''}`}>@{l.username}</p>
                  {l.is_founding_villager && <span className="text-xs">👑</span>}
                  {l.personality_type && <span className="text-sm">{ARCHETYPE_EMOJI[l.personality_type] ?? ''}</span>}
                </div>
                <p className={`text-xs font-medium ${tier.color}`}>{tier.label}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-village-blue">{l.village_score?.toLocaleString()}</p>
                <p className="text-xs text-gray-400">pts</p>
              </div>
            </motion.div>
          );
        })}

        {leaders.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">🏆</p>
            <p>The leaderboard fills as villagers complete goals.</p>
          </div>
        )}
      </div>
    </div>
  );
}
