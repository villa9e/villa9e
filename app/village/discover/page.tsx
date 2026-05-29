'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';

export default function DiscoverPage() {
  const [villagers, setVillagers] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [tab, setTab]          = useState<'matches' | 'discover' | 'mentors'>('matches');
  const [mentors, setMentors]  = useState<any[]>([]);
  const [mentorLoading, setMentorLoading] = useState(false);
  const supabase = createClient();
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';

  const bg     = isNight ? '#060810' : '#F0F4FF';
  const card   = isNight ? '#0D1020' : '#FFFFFF';
  const border = isNight ? '#1A1F3A' : '#E0E7FF';
  const text   = isNight ? '#F0EBE0' : '#1E1B4B';
  const muted  = isNight ? '#4A4F72' : '#6D28D9';
  const sub    = isNight ? '#3A3F5A' : '#9CA3AF';

  useEffect(() => { loadVillagers(); }, []);

  async function loadVillagers() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [{ data: top }, { data: myMatches }] = await Promise.all([
      (supabase as any).from('profiles')
        .select('id,username,display_name,village_score,score_tier,personality_type,occupation')
        .neq('id', user.id).gt('village_score', 0)
        .order('village_score', { ascending: false }).limit(20),
      (supabase as any).from('villager_matches')
        .select('*, profiles!villager_matches_matched_user_id_fkey(username,display_name,village_score,score_tier,personality_type,occupation)')
        .eq('user_id', user.id).eq('is_dismissed', false)
        .order('match_score', { ascending: false }).limit(10),
    ]);
    setVillagers(top ?? []);
    setMatches(myMatches ?? []);
    setLoading(false);
  }

  async function loadMentors() {
    if (mentors.length > 0) return;
    setMentorLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setMentorLoading(false); return; }
    // Find high-score villagers (legend/elder tier) who could mentor
    const { data } = await (supabase as any)
      .from('profiles')
      .select('id,username,display_name,village_score,score_tier,personality_type,occupation,bio')
      .neq('id', user.id)
      .in('score_tier', ['legend','elder','builder'])
      .order('village_score', { ascending: false })
      .limit(12);
    setMentors(data ?? []);
    setMentorLoading(false);
  }

  async function requestMentor(mentorId: string, mentorName: string) {
    if (sent.has(mentorId)) return;
    setSent(prev => new Set([...prev, mentorId]));
    await fetch('/api/connections/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addressee_id: mentorId, message: `Hi ${mentorName}, I admire your journey in the village. Would you be open to mentoring me?` }),
    });
  }

  async function runMatching() {
    setMatching(true);
    await fetch('/api/claude/match-villagers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
    await loadVillagers();
    setMatching(false);
    setTab('matches');
  }

  const [sent, setSent] = useState<Set<string>>(new Set());

  async function connectWithVillager(matchedId: string) {
    if (sent.has(matchedId)) return;
    setSent(prev => new Set([...prev, matchedId]));
    await fetch('/api/connections/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addressee_id: matchedId }),
    });
  }

  async function dismissMatch(matchId: string) {
    await (supabase as any).from('villager_matches').update({ is_dismissed: true }).eq('id', matchId);
    setMatches(prev => prev.filter(m => m.id !== matchId));
  }

  const tierIcon = (tier: string) => tier === 'legend' ? '🏆' : tier === 'elder' ? '⚡' : tier === 'builder' ? '🏗️' : tier === 'grower' ? '🌱' : '🌾';
  const ARCHETYPE_EMOJI: Record<string,string> = { architect:'🏗️', spark:'⚡', anchor:'⚓', compass:'🧭', pioneer:'🏔️', sage:'📚', weaver:'🕸️', flame:'🔥' };

  const VillagerCard = ({ v, matchData }: { v: any; matchData?: any }) => (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4"
      style={{ background: card, border: `1px solid ${border}` }}>
      <div className="flex items-start gap-3">
        <Link href={`/villager/${v.username}`}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#1877F2,#7C3AED)' }}>
            {v.username?.[0]?.toUpperCase() ?? '?'}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link href={`/villager/${v.username}`}>
              <p className="font-bold text-sm" style={{ color: text }}>@{v.username}</p>
            </Link>
            <span>{tierIcon(v.score_tier ?? 'seedling')}</span>
            {v.personality_type && <span className="text-sm">{ARCHETYPE_EMOJI[v.personality_type] ?? ''}</span>}
            <span className="text-xs ml-auto" style={{ color: sub }}>{v.village_score ?? 0} pts</span>
          </div>
          {v.display_name && <p className="text-sm mt-0.5" style={{ color: muted }}>{v.display_name}</p>}
          {v.occupation && <p className="text-xs mt-0.5" style={{ color: sub }}>{v.occupation}</p>}
          {matchData?.match_reason && (
            <p className="text-xs mt-1.5 px-2 py-1 rounded-lg"
              style={{ color: '#60a5fa', background: isNight ? 'rgba(24,119,242,0.1)' : 'rgba(24,119,242,0.06)' }}>
              ✨ {matchData.match_reason}
            </p>
          )}
          {matchData?.match_score && (
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex-1 rounded-full h-1.5" style={{ background: 'var(--v-progress-bg)' }}>
                <div className="h-1.5 rounded-full" style={{ width: `${matchData.match_score}%`, background: '#1877F2' }} />
              </div>
              <span className="text-xs font-bold" style={{ color: '#1877F2' }}>{matchData.match_score}% match</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button onClick={() => connectWithVillager(v.id)}
          disabled={sent.has(v.id)}
          className="flex-1 text-white rounded-full py-2 text-xs font-bold transition-all disabled:opacity-60"
          style={{ background: sent.has(v.id) ? '#22C55E' : '#1877F2' }}>
          {sent.has(v.id) ? '✓ Sent' : '🤝 Connect'}
        </button>
        {matchData && (
          <button onClick={() => dismissMatch(matchData.id)}
            className="px-4 rounded-full text-xs font-semibold transition-colors"
            style={{ background: isNight ? '#1A1F3A' : '#F3F4F6', color: sub }}>
            ✕
          </button>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen pb-24" style={{ background: bg }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 py-3 flex items-center gap-3"
        style={{ background: isNight ? 'rgba(6,8,16,0.92)' : 'rgba(240,244,255,0.92)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${border}` }}>
        <Link href="/village/map" className="text-xl" style={{ color: muted }}>←</Link>
        <span className="text-2xl">🔍</span>
        <div className="flex-1">
          <h1 className="text-lg font-black" style={{ color: text }}>Discover Villagers</h1>
          <p className="text-xs" style={{ color: muted }}>Find your people</p>
        </div>
        <Link href="/village/discover/connections"
          className="text-xs font-semibold mr-1" style={{ color: '#60a5fa' }}>
          🤝 Connections
        </Link>
        <button onClick={runMatching} disabled={matching}
          className="px-3 py-1.5 rounded-full text-xs font-bold text-white disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg,#1877F2,#7C3AED)' }}>
          {matching ? '⟳ Matching…' : '🤖 AI Match'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b" style={{ background: card, borderColor: border }}>
        {([
          ['matches',  `✨ Matches (${matches.length})`],
          ['discover', '🌍 Villagers'],
          ['mentors',  '🎓 Mentors'],
        ] as const).map(([t, label]) => (
          <button key={t} onClick={() => { setTab(t); if (t === 'mentors') loadMentors(); }}
            className="flex-1 py-3 text-xs font-semibold transition-colors relative"
            style={{ color: tab === t ? '#1877F2' : muted }}>
            {label}
            {tab === t && <motion.div layoutId="discover-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1877F2]" />}
          </button>
        ))}
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-3">
        {loading && (
          <div className="text-center py-12 text-sm" style={{ color: muted }}>Loading villagers…</div>
        )}

        {!loading && tab === 'matches' && (
          matches.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-5xl mb-3">🤖</p>
              <p className="text-sm mb-4" style={{ color: muted }}>No AI matches yet.</p>
              <button onClick={runMatching} disabled={matching}
                className="px-6 py-3 rounded-full font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#1877F2,#7C3AED)' }}>
                {matching ? 'Finding matches…' : '✨ Find My Villagers'}
              </button>
            </div>
          ) : (
            matches.map(m => <VillagerCard key={m.id} v={m.profiles} matchData={m} />)
          )
        )}

        {!loading && tab === 'discover' && villagers.map((v, i) => (
          <motion.div key={v.id} transition={{ delay: i * 0.03 }}>
            <VillagerCard v={v} />
          </motion.div>
        ))}

        {!loading && tab === 'discover' && villagers.length === 0 && (
          <div className="text-center py-16">
            <p className="text-5xl mb-3">🌍</p>
            <p className="text-sm" style={{ color: muted }}>No villagers yet. Be the first to join!</p>
          </div>
        )}

        {/* ── MENTORS ── */}
        {tab === 'mentors' && mentorLoading && (
          <div className="text-center py-12 text-sm" style={{ color: muted }}>Finding mentors…</div>
        )}
        {tab === 'mentors' && !mentorLoading && mentors.length === 0 && (
          <div className="text-center py-16">
            <p className="text-5xl mb-3">🎓</p>
            <p className="font-bold mb-2" style={{ color: text }}>No mentors found yet</p>
            <p className="text-sm" style={{ color: muted }}>
              Mentors are high-score villagers who've proven their journey. Keep building — you could be one.
            </p>
          </div>
        )}
        {tab === 'mentors' && !mentorLoading && mentors.map((m, i) => {
          const isSent = sent.has(m.id);
          const tierLabel = m.score_tier === 'legend' ? '🏆 Legend' : m.score_tier === 'elder' ? '⚡ Elder' : '🏗️ Builder';
          return (
            <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-2xl p-4"
              style={{ background: card, border: `1px solid ${border}` }}>
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl text-white flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#7C3AED,#1877F2)' }}>
                  {m.username?.[0]?.toUpperCase() ?? '🎓'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-black text-sm" style={{ color: text }}>@{m.username}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                      style={{ background: 'rgba(124,58,237,0.15)', color: '#7C3AED' }}>
                      {tierLabel}
                    </span>
                  </div>
                  {m.display_name && <p className="text-sm mt-0.5" style={{ color: muted }}>{m.display_name}</p>}
                  {m.occupation && <p className="text-xs mt-0.5" style={{ color: sub }}>{m.occupation}</p>}
                  {m.bio && <p className="text-xs mt-1.5 line-clamp-2" style={{ color: sub }}>{m.bio}</p>}
                  <p className="text-xs mt-1" style={{ color: sub }}>
                    {m.village_score ?? 0} village points
                  </p>
                  <button onClick={() => requestMentor(m.id, m.display_name || m.username)}
                    disabled={isSent}
                    className="mt-3 w-full py-2 rounded-xl text-xs font-black transition-all"
                    style={{
                      background: isSent ? 'rgba(255,255,255,0.04)' : 'linear-gradient(135deg,#7C3AED,#1877F2)',
                      color: isSent ? sub : '#fff',
                      border: isSent ? `1px solid ${border}` : 'none',
                    }}>
                    {isSent ? '✓ Request Sent' : '🎓 Request Mentorship'}
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
