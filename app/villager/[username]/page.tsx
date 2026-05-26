'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getScoreTier } from '@/lib/village/score';
import { OoWopButton } from '@/components/village/OoWopButton';
import { VillageSound } from '@/lib/sounds/village';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';

const ARCHETYPE_EMOJI: Record<string, string> = {
  architect:'🏗️', spark:'⚡', anchor:'⚓', compass:'🧭',
  pioneer:'🏔️', sage:'📚', weaver:'🕸️', flame:'🔥',
};
const ARCHETYPE_DESC: Record<string, string> = {
  architect:'Builds with intention',   spark:'Ignites communities',
  anchor:'Holds steady for others',    compass:'Reads people deeply',
  pioneer:'Goes first into unknown',   sage:'Knows and teaches',
  weaver:'Connects everything',        flame:'Burns for what matters',
};

export default function VillagerProfilePage({ params }: { params: { username: string } }) {
  const [profile, setProfile]         = useState<any>(null);
  const [skills, setSkills]           = useState<any[]>([]);
  const [goals, setGoals]             = useState<any[]>([]);
  const [posts, setPosts]             = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string|null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [postOoWops, setPostOoWops]   = useState<Set<string>>(new Set());
  const [connecting, setConnecting]   = useState(false);
  const [activeTab, setActiveTab]     = useState<'goals'|'posts'|'skills'>('goals');
  const supabase = createClient();
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';

  const bg       = isNight ? '#0A0B12' : '#F8F9FF';
  const cardBg   = isNight ? '#12152A' : '#FFFFFF';
  const border   = isNight ? '#1E2240' : '#E8EAFF';
  const textMain = isNight ? '#F0EBE0' : '#1E1B4B';
  const textMute = isNight ? '#4A4F72' : '#6D28D9';

  useEffect(() => {
    load();
  }, [params.username]);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id ?? null);

    const { data: p } = await (supabase as any).from('profiles')
      .select('*').eq('username', params.username).single();
    if (!p) return;
    setProfile(p);

    const [
      { data: s },
      { data: g },
      { data: po },
      { count: followers },
      { count: following },
    ] = await Promise.all([
      (supabase as any).from('user_skills').select('*').eq('user_id', p.id)
        .order('rating', { ascending: false }).limit(8),
      (supabase as any).from('goals').select('id,title,probability_score,progress_percentage,status,goal_steps(status)')
        .eq('user_id', p.id).in('status', ['active', 'completed']).limit(5),
      (supabase as any).from('dream_line_posts').select('*').eq('user_id', p.id)
        .eq('visibility', 'public').order('created_at', { ascending: false }).limit(6),
      (supabase as any).from('connections').select('id', { count: 'exact', head: true })
        .eq('addressee_id', p.id).eq('status', 'accepted'),
      (supabase as any).from('connections').select('id', { count: 'exact', head: true })
        .eq('requester_id', p.id).eq('status', 'accepted'),
    ]);

    setSkills(s ?? []);
    setGoals(g ?? []);
    setPosts(po ?? []);
    setFollowerCount(followers ?? 0);
    setFollowingCount(following ?? 0);

    if (user && p.id !== user.id) {
      const { data: conn } = await (supabase as any).from('connections')
        .select('id').eq('requester_id', user.id).eq('addressee_id', p.id).maybeSingle();
      setIsFollowing(!!conn);

      // Which posts has current user OoWop'd?
      const postIds = (po ?? []).map((pp: any) => pp.id);
      if (postIds.length > 0) {
        const { data: ow } = await (supabase as any).from('oowops')
          .select('post_id').eq('giver_id', user.id).in('post_id', postIds);
        if (ow) setPostOoWops(new Set(ow.map((o: any) => o.post_id)));
      }
    }
  }

  async function follow() {
    if (!currentUserId || !profile || connecting) return;
    setConnecting(true);
    if (isFollowing) {
      await (supabase as any).from('connections')
        .delete().eq('requester_id', currentUserId).eq('addressee_id', profile.id);
      setIsFollowing(false);
      setFollowerCount(c => Math.max(0, c - 1));
    } else {
      await (supabase as any).from('connections').upsert(
        { requester_id: currentUserId, addressee_id: profile.id, status: 'accepted' },
        { onConflict: 'requester_id,addressee_id' }
      );
      await (supabase as any).from('notifications').insert({
        user_id: profile.id, type: 'match',
        title: 'New follower in the village!',
        body: 'Someone connected with you.',
        reference_id: currentUserId, reference_type: 'profile',
      });
      setIsFollowing(true);
      setFollowerCount(c => c + 1);
      VillageSound.tap();
    }
    setConnecting(false);
  }

  async function oowopPost(post: any) {
    if (!currentUserId || postOoWops.has(post.id)) return;
    const { error } = await (supabase as any).from('oowops').insert({
      post_id: post.id, giver_id: currentUserId, receiver_id: post.user_id,
    });
    if (!error) {
      setPostOoWops(prev => new Set([...prev, post.id]));
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, oowop_count: (p.oowop_count || 0) + 1 } : p));
      fetch('/api/oowops/notify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: post.id, giver_id: currentUserId, receiver_id: post.user_id, oowop_count: (post.oowop_count || 0) + 1 }),
      }).catch(() => {});
    }
  }

  if (!profile) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: bg }}>
      <p style={{ color: textMute }}>Villager not found.</p>
    </div>
  );

  const tier = getScoreTier(profile.village_score ?? 0);
  const isOwn = currentUserId === profile.id;
  const archEmoji = ARCHETYPE_EMOJI[profile.personality_type ?? ''] ?? '';
  const archDesc  = ARCHETYPE_DESC[profile.personality_type ?? ''] ?? '';

  return (
    <div className="min-h-screen" style={{ background: bg }}>
      {/* Hero header */}
      <div style={{ background: isNight ? 'linear-gradient(160deg, #0E1020 0%, #12152A 100%)' : 'linear-gradient(160deg, #1877F2 0%, #4F46E5 100%)' }}>
        <div className="px-4 pt-10 pb-20 max-w-2xl mx-auto">
          <Link href="/village/discover" className="text-white/60 text-sm block mb-5">← Discover</Link>
          <div className="flex items-end gap-4">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-3xl font-black flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.3)' }}>
              {profile.avatar_url
                ? <img src={profile.avatar_url} className="w-full h-full rounded-3xl object-cover" alt="" />
                : <span className="text-white">{profile.username?.[0]?.toUpperCase()}</span>}
            </div>
            <div className="flex-1 text-white">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-black">@{profile.username}</h1>
                {profile.is_founding_villager && (
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,215,0,0.2)', color: '#FFD700' }}>
                    👑 Founding
                  </span>
                )}
              </div>
              {profile.display_name && <p className="text-white/80 text-sm">{profile.display_name}</p>}
              {profile.occupation && <p className="text-white/50 text-xs">{profile.occupation}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Profile card overlapping hero */}
      <div className="max-w-2xl mx-auto px-4 -mt-14 space-y-3">
        <div className="rounded-2xl p-5" style={{ background: cardBg, border: `1px solid ${border}` }}>
          {/* Archetype */}
          {profile.personality_type && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">{archEmoji}</span>
              <div>
                <p className="font-black capitalize text-sm" style={{ color: textMain }}>{profile.personality_type}</p>
                <p className="text-xs" style={{ color: textMute }}>{archDesc}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="font-black text-lg" style={{ color: '#1877F2' }}>{profile.village_score ?? 0}</p>
                <p className="text-xs" style={{ color: textMute }}>{tier.label}</p>
              </div>
            </div>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: 'Followers', value: followerCount },
              { label: 'Following', value: followingCount },
              { label: 'OoWops',    value: profile.oowop_count ?? 0 },
            ].map(stat => (
              <div key={stat.label} className="text-center rounded-xl py-2"
                style={{ background: isNight ? '#0A0B12' : '#F8F9FF' }}>
                <p className="font-black text-lg" style={{ color: textMain }}>{stat.value}</p>
                <p className="text-xs" style={{ color: textMute }}>{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-sm leading-relaxed mb-4" style={{ color: isNight ? '#C8C3B8' : '#374151' }}>{profile.bio}</p>
          )}

          {/* Action buttons */}
          {!isOwn && (
            <div className="flex gap-2">
              <button onClick={follow} disabled={connecting}
                className="flex-1 rounded-full py-2.5 font-bold text-sm transition-all"
                style={{
                  background: isFollowing ? (isNight ? '#1E2240' : '#F3F4F6') : '#1877F2',
                  color:      isFollowing ? textMute : '#fff',
                }}>
                {connecting ? '…' : isFollowing ? 'Following ✓' : '+ Follow'}
              </button>
              <Link href={`/messages?with=${profile.id}`}
                className="flex-1 rounded-full py-2.5 font-bold text-sm text-center transition-all"
                style={{ background: isNight ? '#1E2240' : '#EEF2FF', color: '#1877F2' }}>
                💬 Message
              </Link>
            </div>
          )}
          {isOwn && (
            <Link href="/village/hut/settings"
              className="block w-full text-center rounded-full py-2.5 font-bold text-sm"
              style={{ background: isNight ? '#1E2240' : '#EEF2FF', color: textMute }}>
              Edit Profile
            </Link>
          )}
        </div>

        {/* Content tabs */}
        <div className="flex rounded-2xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${border}` }}>
          {(['goals', 'posts', 'skills'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="flex-1 py-3 text-sm font-bold transition-all capitalize"
              style={{
                background: activeTab === tab ? '#1877F2' : 'transparent',
                color:      activeTab === tab ? '#fff' : textMute,
              }}>
              {tab === 'goals' ? '🎯 Goals' : tab === 'posts' ? '✨ Posts' : '⚒️ Skills'}
            </button>
          ))}
        </div>

        {/* Goals tab */}
        <AnimatePresence mode="wait">
          {activeTab === 'goals' && (
            <motion.div key="goals" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
              {goals.length === 0 && (
                <div className="text-center py-10" style={{ color: textMute }}>No public goals yet.</div>
              )}
              {goals.map(goal => {
                const done  = goal.goal_steps?.filter((s: any) => s.status === 'completed').length ?? 0;
                const total = goal.goal_steps?.length ?? 0;
                const pct   = total ? Math.round((done / total) * 100) : goal.progress_percentage ?? 0;
                return (
                  <div key={goal.id} className="rounded-2xl p-4"
                    style={{ background: cardBg, border: `1px solid ${border}` }}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-sm" style={{ color: textMain }}>{goal.title}</p>
                      <span className="font-black text-sm flex-shrink-0" style={{ color: '#1877F2' }}>
                        {goal.probability_score ?? 0}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-1.5 rounded-full" style={{ background: isNight ? '#1E2240' : '#EDE9FE' }}>
                        <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: '#1877F2' }} />
                      </div>
                      <span className="text-xs" style={{ color: textMute }}>{done}/{total}</span>
                    </div>
                    <span className="text-xs mt-1 inline-block px-2 py-0.5 rounded-full"
                      style={{ background: goal.status === 'completed' ? (isNight ? '#0D2D1A' : '#DCFCE7') : (isNight ? '#0D1A2D' : '#EEF2FF'), color: goal.status === 'completed' ? '#16A34A' : '#1877F2' }}>
                      {goal.status === 'completed' ? '✓ Completed' : 'Active'}
                    </span>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* Posts tab */}
          {activeTab === 'posts' && (
            <motion.div key="posts" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
              {posts.length === 0 && (
                <div className="text-center py-10" style={{ color: textMute }}>No Dream Line posts yet.</div>
              )}
              {posts.map(post => (
                <div key={post.id} className="rounded-2xl p-4"
                  style={{ background: cardBg, border: `1px solid ${border}` }}>
                  <p className="text-sm leading-relaxed mb-3" style={{ color: isNight ? '#C8C3B8' : '#374151' }}>
                    {post.content}
                  </p>
                  <div className="flex items-center justify-between">
                    <OoWopButton
                      count={post.oowop_count || 0}
                      hasGiven={postOoWops.has(post.id)}
                      onGive={() => oowopPost(post)}
                      size="sm"
                    />
                    <span className="text-xs" style={{ color: textMute }}>
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* Skills tab */}
          {activeTab === 'skills' && (
            <motion.div key="skills" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              {skills.length === 0 && (
                <div className="text-center py-10" style={{ color: textMute }}>No skills listed yet.</div>
              )}
              <div className="flex flex-wrap gap-2">
                {skills.map(skill => {
                  const isSkillset = skill.rating >= 7;
                  const isPainPoint = skill.rating <= 3;
                  return (
                    <span key={skill.id} className="text-sm px-3 py-1.5 rounded-full font-medium"
                      style={{
                        background: isSkillset ? (isNight ? '#0D2D1A' : '#DCFCE7') : isPainPoint ? (isNight ? '#2D0D0D' : '#FEE2E2') : (isNight ? '#0D1A2D' : '#EEF2FF'),
                        color:      isSkillset ? '#16A34A' : isPainPoint ? '#DC2626' : '#1877F2',
                      }}>
                      {skill.skill_name}
                      <span className="ml-1 opacity-60 text-xs">{isSkillset ? '✓' : isPainPoint ? '→' : '·'}</span>
                    </span>
                  );
                })}
              </div>
              <p className="text-xs mt-3" style={{ color: textMute }}>
                ✓ Skillset &nbsp;· &nbsp;→ Needs help &nbsp;· &nbsp;· Neutral
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
