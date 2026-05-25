'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { OoWopButton, OoWopValidationCelebration } from '@/components/village/OoWopButton';
import { awardScore } from '@/lib/village/score';

export default function DreamLinePage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [givenOoWops, setGivenOoWops] = useState<Set<string>>(new Set());
  const [celebration, setCelebration] = useState<string | null>(null);
  const [postCount, setPostCount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    loadData();
    const channel = supabase
      .channel('dream_line_live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'dream_line_posts' }, p => {
        setPosts(prev => [p.new as any, ...prev]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'dream_line_posts' }, p => {
        setPosts(prev => prev.map(post => post.id === (p.new as any).id ? p.new as any : post));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      // Load which posts this user has OoWopped
      const { data: given } = await supabase.from('oowops').select('post_id').eq('giver_id', user.id);
      if (given) setGivenOoWops(new Set(given.map((o: any) => o.post_id)));
      // Today's post count
      const today = new Date(); today.setHours(0,0,0,0);
      const { count } = await supabase.from('dream_line_posts').select('id', { count: 'exact', head: true })
        .eq('user_id', user.id).gte('created_at', today.toISOString());
      setPostCount(count ?? 0);
    }
    const { data } = await supabase.from('dream_line_posts')
      .select('*, profiles(username, avatar_url, village_score, score_tier)')
      .eq('visibility', 'public').order('created_at', { ascending: false }).limit(30);
    if (data) setPosts(data);
  }

  async function submitPost() {
    if (!newPost.trim() || posting || postCount >= 3) return;
    setPosting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase.from('dream_line_posts').insert({
        user_id: user.id, content: newPost, visibility: 'public',
      });
      if (!error) {
        setNewPost('');
        setPostCount(c => c + 1);
        await awardScore('DREAM_LINE_POST');
      }
    }
    setPosting(false);
  }

  async function handleOoWop(post: any) {
    if (!currentUserId || givenOoWops.has(post.id)) return;
    const { error } = await supabase.from('oowops').insert({
      post_id: post.id, giver_id: currentUserId, receiver_id: post.user_id,
    });
    if (!error) {
      setGivenOoWops(prev => new Set([...prev, post.id]));
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, oowop_count: (p.oowop_count || 0) + 1 } : p));
      await awardScore('GIVE_OOWOP', post.id);
      // Check if this was the 3rd OoWop
      if ((post.oowop_count + 1) >= 3) {
        setCelebration(post.id);
      }
    }
  }

  const tierColors: Record<string, string> = {
    legend: 'text-amber-600 bg-amber-50',
    elder: 'text-purple-600 bg-purple-50',
    builder: 'text-blue-600 bg-blue-50',
    grower: 'text-green-600 bg-green-50',
    seedling: 'text-gray-500 bg-gray-50',
  };

  return (
    <div className="min-h-screen bg-village-bg">
      <AnimatePresence>
        {celebration && (
          <OoWopValidationCelebration onDismiss={() => setCelebration(null)} />
        )}
      </AnimatePresence>

      <div className="bg-purple-600 text-white px-6 py-4 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/village/map" className="text-xl">←</Link>
        <span className="text-2xl">✨</span>
        <div>
          <h1 className="text-xl font-bold leading-tight">Dream Line</h1>
          <p className="text-purple-200 text-xs">Share progress · Give OoWops · Validate each other</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-3">
        {/* Composer */}
        <div className="village-card">
          <textarea
            value={newPost}
            onChange={e => setNewPost(e.target.value)}
            placeholder="Share your progress, a milestone, or what you learned today…"
            rows={3}
            className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none text-sm"
            disabled={postCount >= 3}
          />
          <div className="flex items-center justify-between mt-2">
            {postCount >= 3
              ? <p className="text-xs text-gray-400">Max 3 posts/day to keep quality high ✓</p>
              : <p className="text-xs text-gray-400">{3 - postCount} posts left today</p>
            }
            <button onClick={submitPost} disabled={posting || !newPost.trim() || postCount >= 3}
              className="bg-purple-600 text-white rounded-full px-4 py-1.5 text-sm font-semibold hover:bg-purple-700 disabled:opacity-40 transition-colors">
              {posting ? 'Posting…' : '✨ Post'}
            </button>
          </div>
        </div>

        {/* Feed */}
        {posts.map((post, i) => (
          <motion.div key={post.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="village-card">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-sm font-bold text-purple-600 flex-shrink-0">
                {post.profiles?.username?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-sm">@{post.profiles?.username || 'villager'}</p>
                  {post.profiles?.score_tier && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${tierColors[post.profiles.score_tier] || tierColors.seedling}`}>
                      {post.profiles.score_tier}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400">{new Date(post.created_at).toLocaleDateString()}</p>
              </div>
              {post.medal_at_post && (
                <span className="text-xl ml-auto flex-shrink-0">
                  {post.medal_at_post === 'platinum' ? '🏆' : post.medal_at_post === 'gold' ? '🥇' : post.medal_at_post === 'silver' ? '🥈' : '🥉'}
                </span>
              )}
            </div>

            <p className="text-gray-700 text-sm mb-4 leading-relaxed">{post.content}</p>

            <div className="flex items-center justify-between">
              <OoWopButton
                count={post.oowop_count || 0}
                hasGiven={givenOoWops.has(post.id)}
                onGive={() => handleOoWop(post)}
                size="sm"
              />
              <button className="flex items-center gap-1 text-sm text-gray-400 hover:text-village-blue transition-colors">
                <span>💬</span>
                <span>{post.comment_count || 0}</span>
              </button>
            </div>

            {/* Validation progress */}
            {(post.oowop_count || 0) > 0 && (post.oowop_count || 0) < 3 && (
              <div className="mt-3 pt-3 border-t border-gray-50">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full bg-purple-400" style={{ width: `${((post.oowop_count || 0) / 3) * 100}%` }} />
                  </div>
                  <span className="text-xs text-gray-400">{3 - (post.oowop_count || 0)} more OoWops to validate</span>
                </div>
              </div>
            )}
            {post.is_validated && (
              <div className="mt-3 pt-3 border-t border-green-50 flex items-center gap-1.5 text-green-600 text-xs font-medium">
                <span>✓</span> Step Validated — the village believes in you!
              </div>
            )}
          </motion.div>
        ))}

        {posts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-5xl mb-3">✨</p>
            <p className="text-gray-500">Be the first to share your progress.</p>
          </div>
        )}
      </div>
    </div>
  );
}
