'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getScoreTier } from '@/lib/village/score';

const ARCHETYPE_EMOJI: Record<string, string> = { architect:'🏗️', spark:'⚡', anchor:'⚓', compass:'🧭', pioneer:'🏔️', sage:'📚', weaver:'🕸️', flame:'🔥' };

export default function VillagerProfilePage({ params }: { params: { username: string } }) {
  const [profile, setProfile] = useState<any>(null);
  const [skills, setSkills]   = useState<any[]>([]);
  const [goals, setGoals]     = useState<any[]>([]);
  const [posts, setPosts]     = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string|null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected]   = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);

      const { data: p } = await supabase.from('profiles').select('*').eq('username', params.username).single();
      if (!p) return; setProfile(p);

      const [{ data: s }, { data: g }, { data: po }] = await Promise.all([
        supabase.from('user_skills').select('*').eq('user_id', p.id).order('rating', { ascending: false }).limit(6),
        supabase.from('goals').select('id,title,probability_score,progress_percentage,medal').eq('user_id', p.id).eq('is_public', true).eq('status', 'active').limit(4),
        supabase.from('dream_line_posts').select('*').eq('user_id', p.id).eq('visibility', 'public').order('created_at', { ascending: false }).limit(3),
      ]);
      setSkills(s ?? []); setGoals(g ?? []); setPosts(po ?? []);

      if (user && p.id !== user.id) {
        const { data: conn } = await supabase.from('connections').select('id').eq('requester_id', user.id).eq('addressee_id', p.id).single();
        setConnected(!!conn);
      }
    }
    load();
  }, [params.username]);

  async function connect() {
    if (!currentUserId || !profile || connecting) return;
    setConnecting(true);
    await supabase.from('connections').upsert({ requester_id: currentUserId, addressee_id: profile.id, status: 'pending' }, { onConflict: 'requester_id,addressee_id' });
    await supabase.from('notifications').insert({ user_id: profile.id, type: 'match', title: 'New connection request', body: `A villager wants to connect with you.`, reference_id: currentUserId, reference_type: 'profile' });
    setConnected(true); setConnecting(false);
  }

  if (!profile) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Villager not found.</p></div>;

  const tier = getScoreTier(profile.village_score ?? 0);
  const isOwn = currentUserId === profile.id;
  const medalEmoji = (m: string) => m === 'platinum' ? '🏆' : m === 'gold' ? '🥇' : m === 'silver' ? '🥈' : '🥉';

  return (
    <div className="min-h-screen bg-village-bg">
      {/* Hero */}
      <div className="village-gradient px-6 pt-8 pb-6">
        <Link href="/village/discover" className="text-white/70 text-sm mb-4 block">← Back</Link>
        <div className="flex items-end gap-4">
          <div className="w-20 h-20 rounded-3xl bg-white/20 flex items-center justify-center text-4xl font-bold text-white">
            {profile.avatar_url ? <img src={profile.avatar_url} className="w-full h-full rounded-3xl object-cover" alt="" /> : profile.username?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 text-white">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">@{profile.username}</h1>
              {profile.is_founding_villager && <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">👑 Founder</span>}
              {profile.personality_type && <span className="text-lg">{ARCHETYPE_EMOJI[profile.personality_type] ?? ''}</span>}
            </div>
            {profile.display_name && <p className="text-blue-100">{profile.display_name}</p>}
            {profile.occupation && <p className="text-blue-200 text-sm">{profile.occupation}</p>}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4 -mt-4">
        {/* Score card */}
        <div className="village-card">
          <div className="flex items-center justify-between">
            <div>
              <p className={`font-bold ${tier.color}`}>{tier.label}</p>
              <p className="text-xs text-gray-400">{profile.personality_type ? `${profile.personality_type.charAt(0).toUpperCase() + profile.personality_type.slice(1)} archetype` : 'Archetype unknown'}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-village-blue">{profile.village_score ?? 0}</p>
              <p className="text-xs text-gray-400">village Score</p>
            </div>
          </div>

          {!isOwn && (
            <button onClick={connect} disabled={connecting || connected}
              className={`mt-4 w-full rounded-full py-2.5 font-bold text-sm transition-colors ${connected ? 'bg-green-50 text-green-700 border border-green-200' : 'village-btn-primary'} disabled:opacity-50`}>
              {connected ? '✓ Connected' : connecting ? 'Connecting…' : '🤝 Connect with this Villager'}
            </button>
          )}
          {isOwn && (
            <Link href="/village/hut" className="mt-4 block text-center text-sm text-village-blue hover:underline">Edit your profile →</Link>
          )}
        </div>

        {/* Bio */}
        {profile.bio && <div className="village-card"><p className="text-gray-700 text-sm leading-relaxed">{profile.bio}</p></div>}

        {/* Skills */}
        {skills.length > 0 && (
          <div className="village-card">
            <h2 className="font-bold mb-3">⚡ Skills</h2>
            <div className="space-y-2">
              {skills.map(s => (
                <div key={s.id} className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${s.rating >= 7 ? 'bg-green-500' : s.rating >= 4 ? 'bg-yellow-400' : 'bg-red-400'}`} />
                  <span className="text-sm flex-1">{s.skill_name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-100 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full village-gradient" style={{ width: `${(s.rating/9)*100}%` }} />
                    </div>
                    <span className="text-xs text-gray-400 w-4">{s.rating}</span>
                  </div>
                </div>
              ))}
            </div>
            {!isOwn && skills.some(s => s.rating >= 7) && (
              <Link href="/village/trading-post" className="mt-3 block text-center text-xs text-village-blue hover:underline">
                See their Trading Post listings →
              </Link>
            )}
          </div>
        )}

        {/* Active Goals */}
        {goals.length > 0 && (
          <div className="village-card">
            <h2 className="font-bold mb-3">📍 Active Goals</h2>
            <div className="space-y-3">
              {goals.map(g => (
                <div key={g.id} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{g.title}</p>
                      {g.medal && <span>{medalEmoji(g.medal)}</span>}
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                      <div className="h-1.5 rounded-full bg-orange-400" style={{ width: `${g.progress_percentage ?? 0}%` }} />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-village-blue flex-shrink-0">{g.probability_score}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dream Line Posts */}
        {posts.length > 0 && (
          <div className="village-card">
            <h2 className="font-bold mb-3">✨ On the Dream Line</h2>
            <div className="space-y-3">
              {posts.map(p => (
                <div key={p.id} className="border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                  <p className="text-sm text-gray-700 line-clamp-2">{p.content}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-gray-400">✊ {p.oowop_count ?? 0} OoWops</span>
                    <span className="text-xs text-gray-400">{new Date(p.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Referral */}
        <div className="village-card text-center bg-blue-50 border border-blue-100">
          <p className="text-xs text-gray-500 mb-1">Invite friends to the village</p>
          <p className="font-bold text-village-blue">villa9e.app/join/{profile.username}</p>
          <button onClick={() => navigator.clipboard?.writeText(`https://villa9e.app/join/${profile.username}`)} className="mt-2 text-xs text-gray-400 hover:text-village-blue">
            Copy referral link
          </button>
        </div>
      </div>
    </div>
  );
}
