'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { OoWopButton, OoWopValidationCelebration } from '@/components/village/OoWopButton';
import { PostActionsMenu } from '@/components/studio/PostActionsMenu';
import { awardScore } from '@/lib/village/score';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { VillageSound } from '@/lib/sounds/village';

const PAGE_SIZE = 20;

const REACTIONS = [
  { id: 'oowop',  emoji: '✊', label: 'OoWop'   },
  { id: 'fire',   emoji: '🔥', label: 'Fire'    },
  { id: 'love',   emoji: '💜', label: 'Love'    },
  { id: 'inspire',emoji: '⚡', label: 'Inspire' },
  { id: 'crown',  emoji: '👑', label: 'Crown'   },
];

type PostType = 'text' | 'photo' | 'video' | 'milestone' | 'reel';

function detectPostType(post: any): PostType {
  if (post.post_type) return post.post_type as PostType;
  if (post.media_url?.match(/\.(mp4|mov|webm)/i)) return 'reel';
  if (post.media_url?.match(/\.(jpg|jpeg|png|gif|webp)/i)) return 'photo';
  if (/youtube\.com|youtu\.be|vimeo\.com/i.test(post.content || '')) return 'video';
  if (post.goal_id || post.milestone) return 'milestone';
  return 'text';
}

function extractYouTubeId(url: string) {
  const m = url.match(/(?:youtube\.com.*[?&]v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

// ── Story circle ──────────────────────────────────────────────────────────────
function StoryRing({ username, tier, hasNew, onClick }: {
  username: string; tier?: string; hasNew: boolean; onClick: () => void;
}) {
  const ringColor = hasNew ? '#7C3AED' : 'rgba(124,58,237,0.25)';
  return (
    <motion.button
      whileTap={{ scale: 0.93 }}
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 flex-shrink-0"
      style={{ width: 68 }}
    >
      <div style={{
        width: 58, height: 58, borderRadius: '50%',
        background: `conic-gradient(${ringColor} 0deg, ${ringColor} 270deg, rgba(124,58,237,0.15) 270deg)`,
        padding: 2.5,
        boxShadow: hasNew ? '0 0 14px rgba(124,58,237,0.45)' : 'none',
      }}>
        <div style={{
          width: '100%', height: '100%', borderRadius: '50%',
          background: 'linear-gradient(135deg, #2D1B4E, #1A0A30)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, fontWeight: 900, color: '#C4B5FD',
        }}>
          {username[0]?.toUpperCase() || '?'}
        </div>
      </div>
      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', maxWidth: 64, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        @{username}
      </span>
    </motion.button>
  );
}

// ── Post card ─────────────────────────────────────────────────────────────────
function PostCard({
  post, isNight, currentUserId, givenOoWops, onOoWop, onOpenActions, favorites, onToggleFavorite,
}: {
  post: any; isNight: boolean; currentUserId: string | null;
  givenOoWops: Set<string>; onOoWop: (post: any) => void;
  onOpenActions: (post: any) => void;
  favorites: Set<string>; onToggleFavorite: (post: any) => void;
}) {
  const [showReactions, setShowReactions] = useState(false);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const type = detectPostType(post);

  const bg     = isNight ? '#0F1124' : '#FFFFFF';
  const border = isNight ? '1px solid #1E2240' : '1px solid #EDE9FE';
  const text   = isNight ? '#E8E3F8' : '#1E1B4B';
  const muted  = isNight ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.38)';
  const accent = '#7C3AED';

  const images: string[] = post.images ?? (post.media_url ? [post.media_url] : []);
  const ytId = type === 'video' ? extractYouTubeId(post.content || '') : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ background: bg, border, borderRadius: 20, overflow: 'hidden', marginBottom: 12 }}
    >
      {/* Author row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px 10px' }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
          background: `linear-gradient(135deg, ${accent}, #4C1D95)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, fontWeight: 900, color: '#fff',
        }}>
          {post.profiles?.username?.[0]?.toUpperCase() || '?'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontWeight: 800, fontSize: 14, color: text }}>
              @{post.profiles?.username || 'villager'}
            </span>
            {post.profiles?.score_tier && (
              <span style={{
                fontSize: 10, padding: '2px 7px', borderRadius: 20, fontWeight: 700,
                background: isNight ? 'rgba(124,58,237,0.2)' : 'rgba(124,58,237,0.1)',
                color: '#A78BFA',
              }}>
                {post.profiles.score_tier}
              </span>
            )}
            {type === 'milestone' && (
              <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, fontWeight: 700, background: 'rgba(16,185,129,0.15)', color: '#10B981' }}>
                🏆 Milestone
              </span>
            )}
            {(post.has_affiliate || post.is_ad) && (
              <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, fontWeight: 700, background: 'rgba(245,158,11,0.15)', color: '#D97706' }}>
                Sponsored
              </span>
            )}
          </div>
          <span style={{ fontSize: 11, color: muted }}>
            {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        {/* More */}
        <button onClick={() => onOpenActions(post)}
          style={{ background: 'none', border: 'none', color: muted, fontSize: 20, cursor: 'pointer', padding: '0 4px' }}>···</button>
      </div>

      {/* Text content */}
      {post.content && type !== 'reel' && (
        <div style={{ padding: '0 16px 12px', fontSize: 14, lineHeight: 1.6, color: text }}>
          {post.content}
        </div>
      )}

      {/* Milestone card */}
      {type === 'milestone' && post.milestone && (
        <div style={{
          margin: '0 16px 12px', padding: '14px 16px', borderRadius: 14,
          background: isNight ? 'linear-gradient(135deg, #0D1F18, #1A3D2F)' : 'linear-gradient(135deg, #DCFCE7, #F0FDF4)',
          border: '1px solid rgba(16,185,129,0.3)',
        }}>
          <div style={{ fontSize: 11, color: '#10B981', fontWeight: 700, marginBottom: 4 }}>GOAL MILESTONE</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: isNight ? '#6EE7B7' : '#065F46' }}>
            {post.milestone}
          </div>
          {post.goal_title && (
            <div style={{ fontSize: 12, color: isNight ? 'rgba(110,231,183,0.6)' : 'rgba(6,95,70,0.6)', marginTop: 4 }}>
              ↳ {post.goal_title}
            </div>
          )}
        </div>
      )}

      {/* Image carousel */}
      {type === 'photo' && images.length > 0 && (
        <div style={{ position: 'relative', background: '#000', marginBottom: 4 }}>
          <img
            src={images[carouselIdx]}
            alt="post media"
            style={{ width: '100%', maxHeight: 380, objectFit: 'cover', display: 'block' }}
          />
          {images.length > 1 && (
            <>
              <button
                onClick={() => setCarouselIdx(i => Math.max(0, i - 1))}
                style={{
                  position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(0,0,0,0.55)', border: 'none', color: '#fff', borderRadius: '50%',
                  width: 32, height: 32, cursor: 'pointer', fontSize: 16,
                  display: carouselIdx === 0 ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >‹</button>
              <button
                onClick={() => setCarouselIdx(i => Math.min(images.length - 1, i + 1))}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(0,0,0,0.55)', border: 'none', color: '#fff', borderRadius: '50%',
                  width: 32, height: 32, cursor: 'pointer', fontSize: 16,
                  display: carouselIdx === images.length - 1 ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >›</button>
              {/* Dots */}
              <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 5 }}>
                {images.map((_, i) => (
                  <div key={i} style={{
                    width: i === carouselIdx ? 16 : 6, height: 6, borderRadius: 3,
                    background: i === carouselIdx ? '#fff' : 'rgba(255,255,255,0.4)',
                    transition: 'width 0.2s',
                  }} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Video embed */}
      {type === 'video' && ytId && (
        <div style={{ position: 'relative', paddingBottom: '56.25%', background: '#000', marginBottom: 4 }}>
          <iframe
            src={`https://www.youtube.com/embed/${ytId}`}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {/* Reel (vertical video) */}
      {type === 'reel' && post.media_url && (
        <div style={{ position: 'relative', background: '#000' }}>
          <video
            src={post.media_url}
            controls
            playsInline
            style={{ width: '100%', maxHeight: 520, display: 'block', objectFit: 'cover' }}
          />
          {post.content && (
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px 16px 12px',
              background: 'linear-gradient(to top, rgba(0,0,0,0.75), transparent)',
              fontSize: 13, color: '#fff', fontWeight: 600,
            }}>
              {post.content}
            </div>
          )}
        </div>
      )}

      {/* Action bar */}
      <div style={{ padding: '10px 16px 12px', display: 'flex', alignItems: 'center', gap: 4 }}>
        {/* OoWop reaction */}
        <OoWopButton
          count={post.oowop_count || 0}
          hasGiven={givenOoWops.has(post.id)}
          onGive={async () => { onOoWop(post); }}
          size="sm"
        />

        {/* Reaction picker */}
        <div style={{ position: 'relative', marginLeft: 6 }}>
          <motion.button
            whileTap={{ scale: 0.88 }}
            onPointerDown={() => setShowReactions(true)}
            onPointerLeave={() => setShowReactions(false)}
            style={{
              background: 'none', border: 'none', fontSize: 18, cursor: 'pointer',
              padding: '6px 8px', borderRadius: 20,
              color: muted,
            }}
          >
            😊
          </motion.button>
          <AnimatePresence>
            {showReactions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 4 }}
                style={{
                  position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
                  background: isNight ? '#1A1C36' : '#fff',
                  border: `1px solid ${isNight ? '#2A2C4E' : '#EDE9FE'}`,
                  borderRadius: 40, padding: '8px 12px',
                  display: 'flex', gap: 10,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)', zIndex: 10,
                  whiteSpace: 'nowrap',
                }}
              >
                {REACTIONS.map(r => (
                  <motion.button
                    key={r.id}
                    whileHover={{ scale: 1.35 }}
                    whileTap={{ scale: 0.9 }}
                    title={r.label}
                    style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', padding: 0 }}
                    onClick={() => { setShowReactions(false); if (navigator.vibrate) navigator.vibrate(8); }}
                  >
                    {r.emoji}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Comment */}
        <Link
          href={`/village/dreamline/post/${post.id}`}
          style={{ display: 'flex', alignItems: 'center', gap: 5, color: muted, textDecoration: 'none', padding: '6px 10px', borderRadius: 20, fontSize: 13, marginLeft: 'auto' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z"/>
          </svg>
          <span>{post.comment_count || 0}</span>
        </Link>

        {/* Favorite */}
        <button
          onClick={() => onToggleFavorite(post)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px 8px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 5, color: favorites.has(post.id) ? '#F59E0B' : muted }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill={favorites.has(post.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </button>

        {/* Share */}
        <button style={{ background: 'none', border: 'none', color: muted, cursor: 'pointer', padding: '6px 8px', borderRadius: 20, fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/>
          </svg>
        </button>
      </div>

      {/* OoWop validation bar */}
      {(post.oowop_count || 0) > 0 && (post.oowop_count || 0) < 3 && (
        <div style={{ padding: '0 16px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: isNight ? '#1E2240' : '#EDE9FE' }}>
              <div style={{
                height: '100%', borderRadius: 2, transition: 'width 0.4s',
                width: `${((post.oowop_count || 0) / 3) * 100}%`,
                background: 'linear-gradient(to right, #7C3AED, #A78BFA)',
              }} />
            </div>
            <span style={{ fontSize: 11, color: muted, flexShrink: 0 }}>
              {3 - (post.oowop_count || 0)} to validate
            </span>
          </div>
        </div>
      )}
      {post.is_validated && (
        <div style={{ padding: '0 16px 14px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#10B981', fontWeight: 700 }}>
          <span>✓ Village Validated</span>
        </div>
      )}
    </motion.div>
  );
}

// ── Post composer ─────────────────────────────────────────────────────────────
function PostComposer({
  isNight, onPost, postCount,
}: { isNight: boolean; onPost: (content: string, type: PostType) => Promise<void>; postCount: number }) {
  const [activeType, setActiveType] = useState<PostType>('text');
  const [content, setContent]       = useState('');
  const [posting, setPosting]       = useState(false);

  const bg     = isNight ? '#0F1124' : '#FFFFFF';
  const border = isNight ? '1px solid #1E2240' : '1px solid #EDE9FE';
  const muted  = isNight ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)';
  const text   = isNight ? '#E8E3F8' : '#1E1B4B';

  const TYPES: { id: PostType; icon: string; label: string }[] = [
    { id: 'text',      icon: '📝', label: 'Post'      },
    { id: 'photo',     icon: '📸', label: 'Photo'     },
    { id: 'video',     icon: '🎬', label: 'Video'     },
    { id: 'milestone', icon: '🏆', label: 'Milestone' },
    { id: 'reel',      icon: '⚡', label: 'Reel'      },
  ];

  const placeholders: Record<PostType, string> = {
    text:      'Share your progress, a win, or what you learned…',
    photo:     'Add a photo URL or describe what you\'re sharing…',
    video:     'Paste a YouTube or Vimeo link…',
    milestone: 'Describe your milestone achievement…',
    reel:      'Paste a video URL for your reel…',
  };

  async function handlePost() {
    if (!content.trim() || posting || postCount >= 3) return;
    setPosting(true);
    await onPost(content, activeType);
    setContent('');
    setPosting(false);
  }

  return (
    <div style={{ background: bg, border, borderRadius: 20, padding: 16, marginBottom: 12 }}>
      {/* Type selector */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {TYPES.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveType(t.id)}
            style={{
              flexShrink: 0, padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
              border: 'none', cursor: 'pointer',
              background: activeType === t.id ? '#7C3AED' : (isNight ? 'rgba(124,58,237,0.12)' : 'rgba(124,58,237,0.08)'),
              color: activeType === t.id ? '#fff' : '#7C3AED',
              transition: 'all 0.15s',
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder={placeholders[activeType]}
        rows={3}
        disabled={postCount >= 3}
        style={{
          width: '100%', resize: 'none', fontSize: 14, outline: 'none', lineHeight: 1.6,
          background: 'transparent', color: text,
          border: `1px solid ${isNight ? '#1E2240' : '#DDD6FE'}`,
          borderRadius: 12, padding: 12, boxSizing: 'border-box',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
        <span style={{ fontSize: 12, color: muted }}>
          {postCount >= 3 ? 'Max 3 posts/day ✓' : `${3 - postCount} posts left today`}
        </span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link href="/village/studio" style={{
            fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 20, textDecoration: 'none',
            background: isNight ? 'rgba(124,58,237,0.15)' : 'rgba(124,58,237,0.08)',
            color: '#7C3AED', border: '1px solid rgba(124,58,237,0.25)',
          }}>
            🎬 Studio
          </Link>
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={handlePost}
            disabled={posting || !content.trim() || postCount >= 3}
            style={{
              padding: '7px 20px', borderRadius: 20, fontSize: 13, fontWeight: 800,
              background: posting || !content.trim() || postCount >= 3 ? 'rgba(124,58,237,0.3)' : '#7C3AED',
              color: '#fff', border: 'none', cursor: posting ? 'default' : 'pointer',
            }}
          >
            {posting ? '…' : '✨ Share'}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DreamLinePage() {
  const [posts, setPosts]             = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [givenOoWops, setGivenOoWops] = useState<Set<string>>(new Set());
  const [celebration, setCelebration] = useState<string | null>(null);
  const [postCount, setPostCount]     = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore]         = useState(true);
  const [page, setPage]               = useState(0);
  const [storyUsers, setStoryUsers]   = useState<any[]>([]);
  const [discoverSteps, setDiscoverSteps] = useState<any[]>([]);
  const [givenDiscoverOoWops, setGivenDiscoverOoWops] = useState<Set<string>>(new Set());
  const [actionsPost, setActionsPost] = useState<any | null>(null);
  const [favorites, setFavorites]     = useState<Set<string>>(new Set());
  const bottomRef    = useRef<HTMLDivElement>(null);
  const motionRef    = useRef({ events: 0 });
  const viewTimers   = useRef<Record<string, { start: number; sent: boolean }>>({});
  const supabase = createClient();
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';

  const accent = '#7C3AED';
  const pageBg = isNight ? '#07080F' : '#F3EFFF';

  useEffect(() => {
    if (typeof window === 'undefined' || !('DeviceMotionEvent' in window)) return;
    const h = () => { motionRef.current.events++; };
    window.addEventListener('devicemotion', h, { passive: true });
    return () => window.removeEventListener('devicemotion', h);
  }, []);

  useEffect(() => {
    if (!bottomRef.current) return;
    const obs = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting && hasMore && !loadingMore) loadMore(); },
      { threshold: 0.1 }
    );
    obs.observe(bottomRef.current);
    return () => obs.disconnect();
  }, [hasMore, loadingMore, posts.length]);

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
          if (viewMs > 1000) {
            timer.sent = true;
            fetch('/api/studio/engagement', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ post_id: postId, signals: { attention_score: Math.min(100, Math.round((viewMs / 5000) * 100)), motion_events: motionRef.current.events, view_duration_ms: viewMs } }),
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
      .channel('dreamline_live')
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

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      const { data: given } = await (supabase as any).from('oowops').select('post_id').eq('giver_id', user.id);
      if (given) setGivenOoWops(new Set(given.map((o: any) => o.post_id)));
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const { count } = await (supabase as any).from('dream_line_posts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id).gte('created_at', today.toISOString());
      setPostCount(count ?? 0);
      const { data: favs } = await (supabase as any).from('post_favorites').select('post_id').eq('user_id', user.id);
      if (favs) setFavorites(new Set(favs.map((f: any) => f.post_id)));
      loadDiscoverSteps(user.id);
    }
    // Load story users (recent posters in last 24h)
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    const { data: recentPosts } = await (supabase as any)
      .from('dream_line_posts')
      .select('user_id, profiles(username, avatar_url, score_tier)')
      .gte('created_at', yesterday)
      .eq('visibility', 'public')
      .limit(12);
    if (recentPosts) {
      const seen = new Set<string>();
      const unique = recentPosts.filter((p: any) => {
        if (seen.has(p.user_id)) return false;
        seen.add(p.user_id);
        return true;
      });
      setStoryUsers(unique.map((p: any) => p.profiles).filter(Boolean));
    }

    const feedRes = await fetch(`/api/dreamline/feed?limit=${PAGE_SIZE}&offset=0`);
    if (feedRes.ok) {
      const data = await feedRes.json();
      if (Array.isArray(data) && data.length > 0) { setPosts(data); setHasMore(data.length === PAGE_SIZE); return; }
    }
    const { data } = await (supabase as any).from('dream_line_posts')
      .select('*, profiles(username, avatar_url, village_score, score_tier, score_multiplier)')
      .eq('visibility', 'public').eq('is_hidden', false)
      .order('created_at', { ascending: false }).limit(PAGE_SIZE);
    if (data) { setPosts(data); setHasMore(data.length === PAGE_SIZE); }
  }

  async function loadDiscoverSteps(userId: string) {
    const { data: steps } = await (supabase as any)
      .from('goal_steps')
      .select(`id, title, goal_id, goals!inner(id, title, user_id, profiles!inner(username, score_tier, display_name)), oowops(id)`)
      .eq('status', 'completed').neq('goals.user_id', userId)
      .order('completed_at', { ascending: false }).limit(30);
    if (!steps) return;
    const { data: myOoWops } = await (supabase as any).from('oowops').select('step_id').eq('giver_id', userId).not('step_id', 'is', null);
    const myStepOoWops = new Set((myOoWops ?? []).map((o: any) => o.step_id));
    setDiscoverSteps(steps.filter((s: any) => (s.oowops ?? []).length < 3 && !myStepOoWops.has(s.id)).slice(0, 8));
  }

  async function loadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const feedRes = await fetch(`/api/dreamline/feed?limit=${PAGE_SIZE}&offset=${nextPage * PAGE_SIZE}`);
    if (feedRes.ok) {
      const data = await feedRes.json();
      if (Array.isArray(data) && data.length > 0) {
        setPosts(prev => [...prev, ...data]); setHasMore(data.length === PAGE_SIZE); setPage(nextPage);
      } else { setHasMore(false); }
    } else { setHasMore(false); }
    setLoadingMore(false);
  }

  async function handlePost(content: string, type: PostType) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    let extra: any = { post_type: type };
    if (type === 'video' || type === 'reel') extra.media_url = content.match(/https?:\/\/\S+/)?.[0] ?? null;
    const { data: post, error } = await (supabase as any).from('dream_line_posts').insert({
      user_id: user.id, content, visibility: 'public', ...extra,
    }).select('id').single();
    if (!error && post) {
      setPostCount(c => c + 1);
      VillageSound.post();
      await awardScore('DREAM_LINE_POST');
      if (/youtube\.com|youtu\.be|vimeo\.com/i.test(content)) {
        fetch('/api/video/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ post_id: post.id, content }) }).catch(() => {});
      }
    }
  }

  async function handleOoWop(post: any) {
    if (!currentUserId || givenOoWops.has(post.id)) return;
    const { error } = await (supabase as any).from('oowops').insert({ post_id: post.id, giver_id: currentUserId, receiver_id: post.user_id });
    if (!error) {
      const newCount = (post.oowop_count || 0) + 1;
      setGivenOoWops(prev => new Set([...prev, post.id]));
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, oowop_count: newCount } : p));
      await awardScore('GIVE_OOWOP', post.id);
      fetch('/api/oowops/notify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ post_id: post.id, giver_id: currentUserId, receiver_id: post.user_id, oowop_count: newCount }) }).catch(() => {});
      if (newCount >= 3) { setCelebration(post.id); VillageSound.validated(); }
    }
  }

  async function handleToggleFavorite(post: any) {
    const isStudio = !!post._source;
    if (!isStudio) return; // only studio posts have favorites API
    const isFav = favorites.has(post.id);
    setFavorites(prev => { const n = new Set(prev); isFav ? n.delete(post.id) : n.add(post.id); return n; });
    await fetch('/api/studio/favorite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: post.id }),
    }).catch(() => {});
  }

  async function giveDiscoverOoWop(step: any) {
    if (!currentUserId || givenDiscoverOoWops.has(step.id)) return;
    setGivenDiscoverOoWops(prev => new Set([...prev, step.id]));
    await (supabase as any).from('oowops').insert({ giver_id: currentUserId, receiver_id: step.goals.user_id, step_id: step.id, goal_id: step.goal_id });
    VillageSound.oowop?.();
    setCelebration(step.id);
  }

  return (
    <div style={{ minHeight: '100vh', background: pageBg }}>
      <AnimatePresence>
        {celebration && <OoWopValidationCelebration onDismiss={() => setCelebration(null)} />}
      </AnimatePresence>

      {/* Post actions sheet */}
      <AnimatePresence>
        {actionsPost && (
          <PostActionsMenu
            key={actionsPost.id}
            postId={actionsPost.id}
            isOwner={actionsPost.user_id === currentUserId}
            onClose={() => setActionsPost(null)}
            onDeleted={() => {
              setPosts(prev => prev.filter(p => p.id !== actionsPost.id));
              setActionsPost(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Stories row ─────────────────────────────────────────────── */}
      {storyUsers.length > 0 && (
        <div style={{
          background: isNight ? '#0C0E1C' : '#FFFFFF',
          borderBottom: isNight ? '1px solid #1A1C30' : '1px solid #EDE9FE',
          padding: '14px 0',
        }}>
          <div style={{ display: 'flex', gap: 14, overflowX: 'auto', padding: '0 16px', scrollbarWidth: 'none' }}>
            {/* "Your story" button */}
            <motion.button
              whileTap={{ scale: 0.93 }}
              className="flex flex-col items-center gap-1.5 flex-shrink-0"
              style={{ width: 68, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <div style={{
                width: 58, height: 58, borderRadius: '50%',
                background: isNight ? 'rgba(124,58,237,0.12)' : 'rgba(124,58,237,0.08)',
                border: '2px dashed rgba(124,58,237,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, color: accent,
              }}>
                +
              </div>
              <span style={{ fontSize: 10, color: 'rgba(124,58,237,0.7)', fontWeight: 700 }}>Your Story</span>
            </motion.button>

            {storyUsers.map((u: any, i: number) => (
              <StoryRing
                key={i}
                username={u.username || '?'}
                tier={u.score_tier}
                hasNew={i < 5}
                onClick={() => {}}
              />
            ))}
          </div>
        </div>
      )}

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '16px 12px' }}>

        {/* ── OoWop Discovery (horizontal scroll) ────────────────────── */}
        {discoverSteps.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10, color: isNight ? '#3A3F62' : '#9CA3AF', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>✊</span> Validate Their Wins
            </p>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6, scrollbarWidth: 'none', margin: '0 -12px', padding: '0 12px 6px' }}>
              {discoverSteps.map((step: any) => {
                const profile = step.goals?.profiles;
                const count   = (step.oowops ?? []).length;
                const given   = givenDiscoverOoWops.has(step.id);
                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                      flexShrink: 0, borderRadius: 18, padding: '14px 16px',
                      background: isNight ? '#0F1124' : '#FFFFFF',
                      border: isNight ? '1px solid #1E2240' : '1px solid #EDE9FE',
                      width: 220, display: 'flex', flexDirection: 'column', gap: 12,
                    }}
                  >
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 700, color: accent, marginBottom: 3 }}>@{profile?.username}</p>
                      <p style={{ fontSize: 14, fontWeight: 800, color: isNight ? '#E8E3F8' : '#1E1B4B', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {step.title}
                      </p>
                      <p style={{ fontSize: 11, marginTop: 3, color: isNight ? '#3A3F62' : '#9CA3AF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>↳ {step.goals?.title}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: isNight ? '#3A3F62' : '#9CA3AF' }}>{count}/3 OoWops</span>
                      <motion.button
                        whileTap={{ scale: 0.88 }}
                        onClick={() => giveDiscoverOoWop(step)}
                        disabled={given}
                        style={{
                          padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 800, border: 'none', cursor: given ? 'default' : 'pointer',
                          background: given ? (isNight ? '#1A3D2F' : '#DCFCE7') : accent,
                          color: given ? '#4ADE80' : '#fff',
                        }}
                      >
                        {given ? '✓ OoWop\'d' : '✊ OoWop'}
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Post composer ───────────────────────────────────────────── */}
        <PostComposer isNight={isNight} onPost={handlePost} postCount={postCount} />

        {/* ── Feed ────────────────────────────────────────────────────── */}
        {posts.map((post, i) => (
          <div key={post.id} ref={el => observePost(el as HTMLDivElement | null, post.id)}>
            <PostCard
              post={post}
              isNight={isNight}
              currentUserId={currentUserId}
              givenOoWops={givenOoWops}
              onOoWop={handleOoWop}
              onOpenActions={setActionsPost}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
            />
          </div>
        ))}

        {posts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>✨</div>
            <p style={{ color: isNight ? '#3A3F62' : '#9CA3AF', fontSize: 15 }}>Be the first to share your progress.</p>
          </div>
        )}

        {/* Infinite scroll sentinel */}
        <div ref={bottomRef} style={{ padding: '16px 0', textAlign: 'center' }}>
          {loadingMore && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${accent}`, borderTopColor: 'transparent', margin: '0 auto' }}
            />
          )}
          {!hasMore && posts.length > 0 && (
            <p style={{ fontSize: 12, color: isNight ? '#2A2F4A' : '#C4B5FD' }}>You've seen everything ✨</p>
          )}
        </div>
      </div>
    </div>
  );
}
