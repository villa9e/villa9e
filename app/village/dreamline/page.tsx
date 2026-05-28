'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { OoWopButton, OoWopValidationCelebration } from '@/components/village/OoWopButton';
import { VillageHeader } from '@/components/village/VillageHeader';
import { awardScore } from '@/lib/village/score';
import { useVillageTheme, useThemeTokens } from '@/lib/theme/useVillageTheme';
import { VillageSound } from '@/lib/sounds/village';

const PAGE_SIZE = 20;

export default function DreamLinePage() {
  const [posts, setPosts]               = useState<any[]>([]);
  const [newPost, setNewPost]           = useState('');
  const [posting, setPosting]           = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [givenOoWops, setGivenOoWops]  = useState<Set<string>>(new Set());
  const [celebration, setCelebration]  = useState<string | null>(null);
  const [postCount, setPostCount]      = useState(0);
  const [loadingMore, setLoadingMore]  = useState(false);
  const [hasMore, setHasMore]          = useState(true);
  const [page, setPage]                = useState(0);
  const [discoverSteps, setDiscoverSteps] = useState<any[]>([]);
  const [givenDiscoverOoWops, setGivenDiscoverOoWops] = useState<Set<string>>(new Set());
  const bottomRef    = useRef<HTMLDivElement>(null);
  const motionRef    = useRef({ events: 0, startTime: 0 });
  const viewTimers   = useRef<Record<string, { start: number; sent: boolean }>>({});
  const supabase = createClient();
  const { theme } = useVillageTheme();
  const t = useThemeTokens();
  const isNight = theme === 'night';

  // ── Accelerometer engagement sensing ──────────────────────
  useEffect(() => {
    if (typeof window === 'undefined' || !('DeviceMotionEvent' in window)) return;
    const handler = () => { motionRef.current.events++; };
    window.addEventListener('devicemotion', handler, { passive: true });
    return () => window.removeEventListener('devicemotion', handler);
  }, []);

  // ── Intersection Observer for infinite scroll ─────────────
  useEffect(() => {
    if (!bottomRef.current) return;
    const obs = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting && hasMore && !loadingMore) loadMore(); },
      { threshold: 0.1 }
    );
    obs.observe(bottomRef.current);
    return () => obs.disconnect();
  }, [hasMore, loadingMore, posts.length]);

  // ── Post Intersection Observer for engagement signals ─────
  const observePost = useCallback((el: HTMLDivElement | null, postId: string) => {
    if (!el) return;
    const obs = new IntersectionObserver(entries => {
      const entry = entries[0];
      if (entry.isIntersecting) {
        viewTimers.current[postId] = { start: Date.now(), sent: false };
      } else {
        const timer = viewTimers.current[postId];
        if (timer && !timer.sent) {
          const viewMs = Date.now() - timer.start;
          // Only send if viewed for >1 second
          if (viewMs > 1000) {
            timer.sent = true;
            const motionEvents = motionRef.current.events;
            motionRef.current.events = 0;
            fetch('/api/studio/engagement', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                post_id: postId,
                signals: {
                  attention_score: Math.min(100, Math.round((viewMs / 5000) * 100)),
                  motion_events:   motionEvents,
                  view_duration_ms: viewMs,
                  face_detected:   false, // camera attention added separately
                },
              }),
            }).catch(() => {});
          }
        }
      }
    }, { threshold: 0.5 });
    obs.observe(el);
  }, []);

  useEffect(() => {
    loadData();
    const channel = supabase
      .channel('dream_line_live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'dream_line_posts' }, p => {
        setPosts(prev => [p.new as any, ...prev]);
        VillageSound.notification();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'dream_line_posts' }, p => {
        setPosts(prev => prev.map(post => post.id === (p.new as any).id ? p.new as any : post));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function loadDiscoverSteps(userId: string) {
    // Fetch recently completed steps from OTHER users that still need OoWops (< 3)
    const { data: steps } = await (supabase as any)
      .from('goal_steps')
      .select(`
        id, title, goal_id,
        goals!inner(id, title, user_id,
          profiles!inner(username, score_tier, personality_type, display_name)
        ),
        oowops(id)
      `)
      .eq('status', 'completed')
      .neq('goals.user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(30);

    if (!steps) return;

    // Filter: fewer than 3 OoWops, user hasn't already given one
    const { data: myOoWops } = await (supabase as any)
      .from('oowops')
      .select('step_id')
      .eq('giver_id', userId)
      .not('step_id', 'is', null);
    const myStepOoWops = new Set((myOoWops ?? []).map((o: any) => o.step_id));

    const eligible = steps
      .filter((s: any) => {
        const count = (s.oowops ?? []).length;
        return count < 3 && !myStepOoWops.has(s.id);
      })
      .slice(0, 8);

    setDiscoverSteps(eligible);
  }

  async function giveDiscoverOoWop(step: any) {
    if (!currentUserId || givenDiscoverOoWops.has(step.id)) return;
    setGivenDiscoverOoWops(prev => new Set([...prev, step.id]));
    await (supabase as any).from('oowops').insert({
      giver_id:    currentUserId,
      receiver_id: step.goals.user_id,
      step_id:     step.id,
      goal_id:     step.goal_id,
    });
    VillageSound.oowop?.();
    setCelebration(step.id);
  }

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
      loadDiscoverSteps(user.id);
    }
    const feedRes = await fetch(`/api/dreamline/feed?limit=${PAGE_SIZE}&offset=0`);
    if (feedRes.ok) {
      const data = await feedRes.json();
      if (Array.isArray(data) && data.length > 0) {
        setPosts(data);
        setHasMore(data.length === PAGE_SIZE);
        return;
      }
    }
    const { data } = await (supabase as any).from('dream_line_posts')
      .select('*, profiles(username, avatar_url, village_score, score_tier, score_multiplier)')
      .eq('visibility', 'public').eq('is_hidden', false)
      .order('created_at', { ascending: false }).limit(PAGE_SIZE);
    if (data) {
      setPosts(data);
      setHasMore(data.length === PAGE_SIZE);
    }
  }

  async function loadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const feedRes = await fetch(`/api/dreamline/feed?limit=${PAGE_SIZE}&offset=${nextPage * PAGE_SIZE}`);
    if (feedRes.ok) {
      const data = await feedRes.json();
      if (Array.isArray(data) && data.length > 0) {
        setPosts(prev => [...prev, ...data]);
        setHasMore(data.length === PAGE_SIZE);
        setPage(nextPage);
      } else {
        setHasMore(false);
      }
    } else {
      setHasMore(false);
    }
    setLoadingMore(false);
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
        VillageSound.post();
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
      if (newCount >= 3) {
        setCelebration(post.id);
        VillageSound.validated();
      }
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

        {/* ── OoWop Discovery ───────────────────────────────────── */}
        {discoverSteps.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-2.5 flex items-center gap-2"
              style={{ color: isNight ? '#4A4F72' : '#9CA3AF' }}>
              <span>✊</span> Give OoWops — validate their wins
            </p>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
              {discoverSteps.map((step: any) => {
                const profile = step.goals?.profiles;
                const name    = profile?.display_name || profile?.username || 'Villager';
                const count   = (step.oowops ?? []).length;
                const given   = givenDiscoverOoWops.has(step.id);

                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex-shrink-0 rounded-2xl p-4 flex flex-col gap-3 w-56"
                    style={{
                      background: isNight ? '#12152A' : '#FFFFFF',
                      border: `1px solid ${isNight ? '#1E2240' : '#E9D5FF'}`,
                    }}
                  >
                    <div>
                      <p className="text-xs font-semibold truncate" style={{ color: isNight ? '#7A7FA8' : '#7C3AED' }}>
                        @{profile?.username}
                      </p>
                      <p className="text-sm font-bold mt-0.5 line-clamp-2 leading-snug"
                        style={{ color: isNight ? '#F0EBE0' : '#1E1B4B' }}>
                        {step.title}
                      </p>
                      <p className="text-xs mt-1 truncate" style={{ color: isNight ? '#4A4F72' : '#9CA3AF' }}>
                        ↳ {step.goals?.title}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: isNight ? '#4A4F72' : '#9CA3AF' }}>
                        {count}/3 OoWops
                      </span>
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={() => giveDiscoverOoWop(step)}
                        disabled={given}
                        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black transition-all disabled:opacity-50"
                        style={{
                          background: given ? (isNight ? '#1A3D2F' : '#DCFCE7') : '#7C3AED',
                          color:      given ? '#4ADE80' : '#fff',
                        }}
                      >
                        {given ? "✓ OoWop'd" : '✊ OoWop'}
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

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
          <motion.div key={post.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.3) }}
            ref={el => observePost(el as HTMLDivElement | null, post.id)}
            style={cardStyle}>
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

        {/* Infinite scroll sentinel */}
        <div ref={bottomRef} className="py-4 text-center">
          {loadingMore && (
            <div className="flex items-center justify-center gap-2">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-4 h-4 rounded-full border-2 border-t-transparent"
                style={{ borderColor: isNight ? '#4A4F72' : '#DDD6FE', borderTopColor: 'transparent' }} />
              <span className="text-xs" style={{ color: isNight ? '#4A4F72' : '#9CA3AF' }}>Loading more…</span>
            </div>
          )}
          {!hasMore && posts.length > 0 && (
            <p className="text-xs" style={{ color: isNight ? '#2A2F4A' : '#E9D5FF' }}>
              You've seen everything in the village ✨
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
