'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getScoreTier } from '@/lib/village/score';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';

const TABS = ['Village Score', '$VLG Earned', 'Goals Completed'] as const;
type Tab = typeof TABS[number];

const ARCHETYPE_EMOJI: Record<string,string> = {
  architect:'🏗️', spark:'⚡', anchor:'⚓', compass:'🧭',
  pioneer:'🏔️', sage:'📚', weaver:'🕸️', flame:'🔥',
};

const MEDALS = ['🥇','🥈','🥉'];

export default function LeaderboardPage() {
  const [tab, setTab]       = useState<Tab>('Village Score');
  const [leaders, setLeaders] = useState<any[]>([]);
  const [myRank, setMyRank]   = useState<number | null>(null);
  const [myId, setMyId]       = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';

  const bg     = isNight ? '#060810' : '#F0F4FF';
  const card   = isNight ? '#0D1020' : '#FFFFFF';
  const border = isNight ? '#1A1F3A' : '#E0E7FF';
  const text   = isNight ? '#F0EBE0' : '#1E1B4B';
  const muted  = isNight ? '#4A4F72' : '#6D28D9';

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setMyId(user?.id ?? null));
  }, []);

  useEffect(() => { loadLeaders(); }, [tab]);

  async function loadLeaders() {
    setLoading(true);
    if (tab === '$VLG Earned') {
      const { data } = await (supabase as any)
        .from('village_wallets')
        .select('user_id, total_earned_vlg, profiles(id, username, score_tier, personality_type, is_founding_villager, village_score)')
        .gt('total_earned_vlg', 0)
        .order('total_earned_vlg', { ascending: false })
        .limit(50);
      setLeaders((data ?? []).map((w: any) => ({ ...w.profiles, vlg: parseFloat(w.total_earned_vlg ?? 0) })));
    } else if (tab === 'Goals Completed') {
      const { data } = await (supabase as any)
        .from('goals')
        .select('user_id, profiles(id, username, score_tier, personality_type, is_founding_villager, village_score)')
        .eq('status', 'completed');
      const counts: Record<string, any> = {};
      (data ?? []).forEach((g: any) => {
        const uid = g.user_id;
        if (!counts[uid]) counts[uid] = { ...g.profiles, goals_done: 0 };
        counts[uid].goals_done++;
      });
      setLeaders(Object.values(counts).sort((a: any, b: any) => b.goals_done - a.goals_done).slice(0, 50));
    } else {
      const { data } = await (supabase as any)
        .from('profiles')
        .select('id,username,display_name,village_score,score_tier,personality_type,is_founding_villager')
        .gt('village_score', 0)
        .order('village_score', { ascending: false })
        .limit(50);
      setLeaders(data ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (!myId || !leaders.length) return;
    const rank = leaders.findIndex(l => l.id === myId) + 1;
    setMyRank(rank > 0 ? rank : null);
  }, [myId, leaders]);

  function getMetric(l: any): string {
    if (tab === '$VLG Earned') return `${parseFloat(l.vlg ?? 0).toFixed(0)} $VLG`;
    if (tab === 'Goals Completed') return `${l.goals_done ?? 0} goals`;
    return `${(l.village_score ?? 0).toLocaleString()} pts`;
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: bg }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 py-3 flex items-center gap-3"
        style={{ background: isNight ? 'rgba(6,8,16,0.92)' : 'rgba(240,244,255,0.92)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${border}` }}>
        <Link href="/village/map" className="text-xl" style={{ color: muted }}>←</Link>
        <span className="text-2xl">🏆</span>
        <div className="flex-1">
          <h1 className="text-lg font-black" style={{ color: text }}>Leaderboard</h1>
          <p className="text-xs" style={{ color: muted }}>Top villagers this season</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b" style={{ background: card, borderColor: border }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-3 text-xs font-semibold transition-colors relative"
            style={{ color: tab === t ? '#1877F2' : muted }}>
            {t}
            {tab === t && (
              <motion.div layoutId="leaderboard-tab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1877F2]" />
            )}
          </button>
        ))}
      </div>

      {/* My rank banner */}
      {myRank && (
        <div className="px-4 py-2 text-center text-xs font-semibold"
          style={{ background: isNight ? 'rgba(24,119,242,0.08)' : 'rgba(24,119,242,0.06)', borderBottom: `1px solid ${border}`, color: '#1877F2' }}>
          You are ranked <strong>#{myRank}</strong> in the village
        </div>
      )}

      <div className="max-w-2xl mx-auto p-4 space-y-3">

        {/* Podium top 3 */}
        {!loading && leaders.slice(0, 3).length === 3 && (
          <div className="flex items-end justify-center gap-2 mb-4 pt-2">
            {[
              { data: leaders[1], pos: 2, height: 'h-24' },
              { data: leaders[0], pos: 1, height: 'h-32' },
              { data: leaders[2], pos: 3, height: 'h-20' },
            ].map(({ data: l, pos, height }) => (
              <motion.div key={l.id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: pos * 0.08 }}
                className={`flex-1 flex flex-col items-center ${height}`}
              >
                {l.id === myId && (
                  <div className="text-[8px] font-bold text-[#1877F2] mb-0.5 uppercase tracking-wide">You</div>
                )}
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm text-white mb-1.5"
                  style={{ background: pos === 1 ? 'linear-gradient(135deg,#FFD700,#FF8C00)' : pos === 2 ? 'linear-gradient(135deg,#94a3b8,#64748b)' : 'linear-gradient(135deg,#cd7f32,#a0522d)' }}>
                  {l.username?.[0]?.toUpperCase()}
                </div>
                <p className="text-[10px] font-bold truncate max-w-full" style={{ color: text }}>@{l.username}</p>
                {l.personality_type && <p className="text-sm">{ARCHETYPE_EMOJI[l.personality_type] ?? ''}</p>}
                {l.is_founding_villager && <p className="text-xs">👑</p>}
                <div className={`w-full mt-1 rounded-t-xl flex items-start justify-center pt-2`}
                  style={{ height: pos === 1 ? '60px' : pos === 2 ? '45px' : '35px', background: pos === 1 ? 'rgba(255,215,0,0.2)' : pos === 2 ? 'rgba(148,163,184,0.15)' : 'rgba(205,127,50,0.15)', border: `1px solid ${pos === 1 ? 'rgba(255,215,0,0.3)' : pos === 2 ? 'rgba(148,163,184,0.25)' : 'rgba(205,127,50,0.25)'}`, borderBottom: 'none' }}>
                  <span className="text-xl">{MEDALS[pos-1]}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Full list */}
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: card }} />
          ))
        ) : (
          leaders.map((l, i) => {
            const tier = getScoreTier(l.village_score ?? 0);
            const isMe = l.id === myId;
            return (
              <motion.div key={l.id}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.025, 0.5) }}
              >
                <Link href={`/villager/${l.username}`}
                  className="flex items-center gap-3 p-3 rounded-2xl transition-all"
                  style={{
                    background: isMe ? 'rgba(24,119,242,0.08)' : card,
                    border: `1px solid ${isMe ? 'rgba(24,119,242,0.3)' : border}`,
                    display: 'flex',
                  }}>
                  {/* Rank */}
                  <span className="w-8 text-center font-black text-sm flex-shrink-0"
                    style={{ color: i === 0 ? '#FFD700' : i === 1 ? '#94a3b8' : i === 2 ? '#CD7F32' : muted }}>
                    {i < 3 ? MEDALS[i] : `#${i+1}`}
                  </span>

                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-sm text-white flex-shrink-0"
                    style={{ background: isMe ? '#1877F2' : 'linear-gradient(135deg,#1877F2,#7C3AED)' }}>
                    {l.username?.[0]?.toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-sm truncate" style={{ color: isMe ? '#60a5fa' : text }}>
                        @{l.username}
                      </p>
                      {l.is_founding_villager && <span className="text-xs">👑</span>}
                      {l.personality_type && <span className="text-sm">{ARCHETYPE_EMOJI[l.personality_type] ?? ''}</span>}
                    </div>
                    <p className={`text-xs font-medium ${tier.color}`}>{tier.label}</p>
                  </div>

                  {/* Metric */}
                  <div className="text-right flex-shrink-0">
                    <p className="font-black text-sm" style={{ color: '#1877F2' }}>
                      {tab === '$VLG Earned' ? parseFloat(l.vlg ?? 0).toFixed(0) :
                       tab === 'Goals Completed' ? l.goals_done ?? 0 :
                       (l.village_score ?? 0).toLocaleString()}
                    </p>
                    <p className="text-[10px]" style={{ color: muted }}>
                      {tab === '$VLG Earned' ? '$VLG' : tab === 'Goals Completed' ? 'goals' : 'pts'}
                    </p>
                  </div>
                </Link>
              </motion.div>
            );
          })
        )}

        {!loading && leaders.length === 0 && (
          <div className="text-center py-16">
            <p className="text-5xl mb-3">🏆</p>
            <p className="text-sm" style={{ color: muted }}>The leaderboard fills as villagers complete goals.</p>
          </div>
        )}
      </div>
    </div>
  );
}
