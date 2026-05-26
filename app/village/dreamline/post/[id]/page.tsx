'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { OoWopButton, OoWopValidationCelebration } from '@/components/village/OoWopButton';
import { awardScore } from '@/lib/village/score';
import { getScoreTier } from '@/lib/village/score';

export default function PostDetailPage({ params }: { params: { id: string } }) {
  const [post, setPost] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [hasGiven, setHasGiven] = useState(false);
  const [celebration, setCelebration] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);

      const { data } = await supabase
        .from('dream_line_posts')
        .select('*, profiles(username, avatar_url, village_score, score_tier, personality_type)')
        .eq('id', params.id)
        .single();

      setPost(data);

      if (user && data) {
        const { data: ow } = await supabase.from('oowops').select('id').eq('post_id', params.id).eq('giver_id', user.id).single();
        setHasGiven(!!ow);
      }
    }
    load();
  }, [params.id]);

  async function handleOoWop() {
    if (!currentUserId || !post || hasGiven) return;
    const { error } = await supabase.from('oowops').insert({
      post_id: post.id, giver_id: currentUserId, receiver_id: post.user_id,
    });
    if (!error) {
      const newCount = (post.oowop_count || 0) + 1;
      setHasGiven(true);
      setPost((p: any) => ({ ...p, oowop_count: newCount }));
      await awardScore('GIVE_OOWOP', post.id);
      fetch('/api/oowops/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: post.id, giver_id: currentUserId, receiver_id: post.user_id, oowop_count: newCount }),
      }).catch(() => {});
      if (newCount >= 3) setCelebration(true);
    }
  }

  if (!post) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-4xl animate-float">✨</div>
    </div>
  );

  const tier = getScoreTier(post.profiles?.village_score ?? 0);
  const ARCHETYPE_EMOJI: Record<string, string> = { architect:'🏗️', spark:'⚡', anchor:'⚓', compass:'🧭', pioneer:'🏔️', sage:'📚', weaver:'🕸️', flame:'🔥' };

  return (
    <div className="min-h-screen bg-village-bg">
      {celebration && <OoWopValidationCelebration onDismiss={() => setCelebration(false)} />}

      <div className="bg-purple-600 text-white px-6 py-4 flex items-center gap-3">
        <Link href="/village/dreamline" className="text-xl">←</Link>
        <span className="text-2xl">✨</span>
        <h1 className="text-xl font-bold">Dream Line Post</h1>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="village-card">
          {/* Author */}
          <div className="flex items-center gap-3 mb-4">
            <Link href={`/villager/${post.profiles?.username}`}>
              <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center text-xl font-bold text-purple-600 flex-shrink-0">
                {post.profiles?.avatar_url
                  ? <img src={post.profiles.avatar_url} className="w-full h-full rounded-2xl object-cover" alt="" />
                  : (post.profiles?.username?.[0] ?? '?').toUpperCase()}
              </div>
            </Link>
            <div>
              <div className="flex items-center gap-1.5">
                <Link href={`/villager/${post.profiles?.username}`} className="font-bold hover:text-purple-600">
                  @{post.profiles?.username}
                </Link>
                {post.profiles?.personality_type && (
                  <span className="text-sm">{ARCHETYPE_EMOJI[post.profiles.personality_type] ?? ''}</span>
                )}
              </div>
              <p className={`text-xs font-medium ${tier.color}`}>{tier.label}</p>
            </div>
            <p className="text-xs text-gray-400 ml-auto">
              {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          {/* Content */}
          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-sm">{post.content}</p>

          {/* Goal link */}
          {post.goal_id && (
            <div className="mt-3 bg-orange-50 rounded-xl p-3 flex items-center gap-2">
              <span>📍</span>
              <Link href={`/village/workshop/goal/${post.goal_id}`} className="text-sm text-orange-700 font-medium hover:underline">
                View linked goal →
              </Link>
            </div>
          )}

          {/* Mission score */}
          {post.mission_score != null && (
            <div className="mt-3 flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                post.mission_score >= 70 ? 'bg-green-100 text-green-700' :
                post.mission_score >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
              }`}>
                Mission Score: {post.mission_score}%
              </span>
              {post.is_milestone && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Milestone</span>}
            </div>
          )}

          {/* OoWop */}
          <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
            {currentUserId && currentUserId !== post.user_id ? (
              <OoWopButton
                count={post.oowop_count ?? 0}
                hasGiven={hasGiven}
                onGive={handleOoWop}
                size="md"
                showValidation
              />
            ) : (
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <span>✊</span>
                <span>{post.oowop_count ?? 0} OoWops received</span>
              </div>
            )}
            <span className="text-xs text-gray-400">
              {new Date(post.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
