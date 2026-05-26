'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { OoWopButton, OoWopValidationCelebration } from '@/components/village/OoWopButton';
import { VillageHeader } from '@/components/village/VillageHeader';
import { awardScore } from '@/lib/village/score';
import { useVillageTheme, useThemeTokens } from '@/lib/theme/useVillageTheme';

export default function DreamLinePage() {
  const [posts, setPosts]               = useState<any[]>([]);
  const [newPost, setNewPost]           = useState('');
  const [posting, setPosting]           = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [givenOoWops, setGivenOoWops]  = useState<Set<string>>(new Set());
  const [celebration, setCelebration]  = useState<string | null>(null);
  const [postCount, setPostCount]      = useState(0);
  const supabase = createClient();
  const { theme } = useVillageTheme();
  const t = useThemeTokens();
  const isNight = theme === 'night';

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
      const { data: given } = await (supabase as any).from('oowops').select('post_id').eq('giver_id', user.id);
      if (given) setGivenOoWops(new Set(given.map((o: any) => o.post_id)));
      const today = new Date(); today.setHours(0,0,0,0);
      const { count } = await (supabase as any).from('dream_line_posts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id).gte('created_at', today.toISOString());
      setPostCount(count ?? 0);
    }
    const feedRes = await fetch('/api/dreamline/feed?limit=30');
    if (feedRes.ok) {
      const data = await feedRes.json();
      if (Array.isArray(data) && data.length > 0) { setPosts(data); return; }
    }
    const { data } = await (supabase as any).from('dream_line_posts')
      .select('*, profiles(username, avatar_url, village_score, score_tier)')
      .eq('visibility', 'public').eq('is_hidden', false)
      .order('created_at', { ascending: false }).limit(30);
    if (data) setPosts(data);
  }

  async function submitPost() {
    if (!newPost.trim() || posting || postCount >= 3) return;
    setPosting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: post, error } = await (supabase as any).from('dream_line_posts').insert({
        user_id: user.id, content: newPost, visibility: 'public',
      }).select('id').single();
      if (!error && post) {
        setNewPost('');
        setPostCount(c => c + 1);
        await awardScore('DREAM_LINE_POST');
        fetch('/api/dreamline/score', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ post_id: post.id, content: newPost }) }).catch(() => {});
        if (/youtube\.com|youtu\.be|vimeo\.com/i.test(newPost)) {
          fetch('/api/video/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ post_id: post.id, content: newPost }) }).catch(() => {});
        }
      }
    }
    setPosting(false);
  }

  async function handleOoWop(post: any) {
    if (!currentUserId || givenOoWops.has(post.id)) return;
    const { error } = await (supabase as any).from('oowops').insert({
      post_id: post.id, giver_id: currentUserId, receiver_id: post.user_id,
    });
    if (!error) {
      const newCount = (post.oowop_count || 0) + 1;
      setGivenOoWops(prev => new Set([...prev, post.id]));
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, oowop_count: newCount } : p));
      await awardScore('GIVE_OOWOP', post.id);
      fetch('/api/oowops/notify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ post_id: post.id, giver_id: currentUserId, receiver_id: post.user_id, oowop_count: newCount }) }).catch(() => {});
      if (newCount >= 3) setCelebration(post.id);
    }
  }

  const accentColor = isNight ? '#8B5CF6' : '#7C3AED';
  const cardStyle: React.CSSProperties = {
    background:   isNight ? '#12152A' : '#FFFFFF',
    border:       `1px solid ${isNight ? '#1E2240' : '#EDE9FE'}`,
    borderRadius: '20px',
    padding:      '16px',
    marginBottom: '12px',
  };

  return (
    <div className="min-h-screen" style={{ background: isNight ? '#0A0B12' : '#F5F0FF' }}>
      <AnimatePresence>
        {celebration && <OoWopValidationCelebration onDismiss={() => setCelebration(null)} />}
      </AnimatePresence>

      <VillageHeader title="Dream Line" subtitle="Share progress · Give OoWops · Validate each other" icon="✨" accentColor={accentColor} />

      {/* Tribal pattern ambient */}
      {isNight && (
        <div className="fixed inset-0 pointer-events-none opacity-[0.03]"
          style={{ backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.5) 10px, rgba(255,255,255,0.5) 11px)` }} />
      )}

      <div className="max-w-2xl mx-auto p-4 space-y-3">

        {/* Post composer */}
        <div style={cardStyle}>
          <textarea
            value={newPost}
            onChange={e => setNewPost(e.target.value)}
            placeholder="Share your progress, a milestone, or what you learned today…"
            rows={3}
            disabled={postCount >= 3}
            className="w-full resize-none text-sm focus:outline-none"
            style={{
              background: 'transparent',
              color: isNight ? '#F0EBE0' : '#2D1F0E',
              border: `1px solid ${isNight ? '#1E2240' : '#DDD6FE'}`,
              borderRadius: '12px',
              padding: '12px',
            }}
          />
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs" style={{ color: isNight ? '#4A4F72' : '#9CA3AF' }}>
              {postCount >= 3 ? 'Max 3 posts/day to keep quality high ✓' : `${3 - postCount} posts left today`}
            </p>
            <button
              onClick={submitPost}
              disabled={posting || !newPost.trim() || postCount >= 3}
              className="rounded-full px-4 py-1.5 text-sm font-bold transition-all disabled:opacity-30"
              style={{ background: accentColor, color: '#fff' }}
            >
              {posting ? 'Posting…' : '✨ Post'}
            </button>
          </div>
        </div>

        {/* Feed */}
        {posts.map((post, i) => (
          <motion.div key={post.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} style={cardStyle}>
            {/* Author row */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ background: isNight ? '#1E2240' : '#EDE9FE', color: accentColor }}>
                {post.profiles?.username?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-sm" style={{ color: isNight ? '#F0EBE0' : '#2D1F0E' }}>
                    @{post.profiles?.username || 'villager'}
                  </p>
                  {post.profiles?.score_tier && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                      style={{ background: isNight ? '#1E2240' : '#F3F4F6', color: isNight ? '#7A7FA8' : '#6B7280' }}>
                      {post.profiles.score_tier}
                    </span>
                  )}
                </div>
                <p className="text-xs" style={{ color: isNight ? '#4A4F72' : '#9CA3AF' }}>
                  {new Date(post.created_at).toLocaleDateString()}
                </p>
              </div>
              {post.medal_at_post && (
                <span className="text-xl ml-auto">
                  {post.medal_at_post === 'gold' ? '🥇' : post.medal_at_post === 'silver' ? '🥈' : '🥉'}
                </span>
              )}
            </div>

            <Link href={`/village/dreamline/post/${post.id}`}>
              <p className="text-sm mb-4 leading-relaxed" style={{ color: isNight ? '#C8C3B8' : '#374151' }}>
                {post.content}
              </p>
            </Link>

            <div className="flex items-center justify-between">
              <OoWopButton
                count={post.oowop_count || 0}
                hasGiven={givenOoWops.has(post.id)}
                onGive={() => handleOoWop(post)}
                size="sm"
              />
              <Link href={`/village/dreamline/post/${post.id}`}
                className="flex items-center gap-1 text-sm transition-colors"
                style={{ color: isNight ? '#4A4F72' : '#9CA3AF' }}>
                <span>💬</span>
                <span>{post.comment_count || 0}</span>
              </Link>
            </div>

            {/* OoWop progress bar */}
            {(post.oowop_count || 0) > 0 && (post.oowop_count || 0) < 3 && (
              <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${isNight ? '#1E2240' : '#F5F3FF'}` }}>
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-full h-1.5" style={{ background: isNight ? '#1E2240' : '#E9D5FF' }}>
                    <div className="h-1.5 rounded-full" style={{ width: `${((post.oowop_count || 0) / 3) * 100}%`, background: accentColor }} />
                  </div>
                  <span className="text-xs" style={{ color: isNight ? '#4A4F72' : '#9CA3AF' }}>
                    {3 - (post.oowop_count || 0)} more to validate
                  </span>
                </div>
              </div>
            )}
            {post.is_validated && (
              <div className="mt-3 pt-3 flex items-center gap-1.5 text-xs font-medium"
                style={{ borderTop: `1px solid ${isNight ? '#1E2240' : '#F0FDF4'}`, color: '#16A34A' }}>
                <span>✓</span> Step Validated — the village believes in you!
              </div>
            )}
          </motion.div>
        ))}

        {posts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-5xl mb-3">✨</p>
            <p style={{ color: isNight ? '#4A4F72' : '#9CA3AF' }}>Be the first to share your progress.</p>
          </div>
        )}
      </div>
    </div>
  );
}
