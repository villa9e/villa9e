'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { OoWopButton, OoWopValidationCelebration } from '@/components/village/OoWopButton';
import { PostActionsMenu } from '@/components/studio/PostActionsMenu';
import { awardScore } from '@/lib/village/score';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { VillageSound } from '@/lib/sounds/village';

// ── Comment drawer ─────────────────────────────────────────────────────────────
interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: { username: string; avatar_url: string | null };
}

function CommentDrawer({
  post, currentUserId, isNight, onClose,
}: {
  post: any; currentUserId: string | null; isNight: boolean; onClose: () => void;
}) {
  const [comments, setComments]   = useState<Comment[]>([]);
  const [loading, setLoading]     = useState(true);
  const [text, setText]           = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    loadComments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.id]);

  async function loadComments() {
    setLoading(true);
    const { data } = await (supabase as any)
      .from('post_interactions')
      .select('id, user_id, content, created_at, profiles(username, avatar_url)')
      .eq('post_id', post.id)
      .eq('interaction_type', 'comment')
      .order('created_at', { ascending: false })
      .limit(20);
    setComments(data ?? []);
    setLoading(false);
  }

  async function handleSubmit() {
    if (!text.trim() || !currentUserId || submitting) return;
    setSubmitting(true);
    const { data, error } = await (supabase as any)
      .from('post_interactions')
      .insert({
        post_id: post.id,
        user_id: currentUserId,
        interaction_type: 'comment',
        content: text.trim(),
      })
      .select('id, user_id, content, created_at, profiles(username, avatar_url)')
      .single();
    if (!error && data) {
      setComments(prev => [data, ...prev]);
      setText('');
    }
    setSubmitting(false);
  }

  const bg    = isNight ? '#0E1630' : '#FFFFFF';
  const text2 = isNight ? '#E8E3F8' : '#1E1B4B';
  const muted = isNight ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.38)';
  const borderC = isNight ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'now';
    if (m < 60) return `${m}m`;
    return `${Math.floor(m / 60)}h`;
  }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 300 }}
      />
      {/* Sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          height: '70vh', background: bg, zIndex: 301,
          borderRadius: '20px 20px 0 0',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: muted }} />
        </div>

        {/* Header */}
        <div style={{
          padding: '4px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: `1px solid ${borderC}`,
        }}>
          <span style={{ fontWeight: 800, fontSize: 15, color: text2 }}>
            {comments.length} comment{comments.length !== 1 ? 's' : ''}
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: muted, fontSize: 22, lineHeight: 1, padding: '0 4px' }}>
            ×
          </button>
        </div>

        {/* Comment list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: 24, color: muted, fontSize: 13 }}>Loading…</div>
          )}
          {!loading && comments.length === 0 && (
            <div style={{ textAlign: 'center', padding: 32, color: muted, fontSize: 14 }}>
              Be the first to comment
            </div>
          )}
          {comments.map(c => (
            <div key={c.id} style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                background: '#7C3AED', overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {c.profiles?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.profiles.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ color: '#fff', fontWeight: 800, fontSize: 13 }}>
                    {(c.profiles?.username ?? 'V')[0].toUpperCase()}
                  </span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: text2 }}>
                    @{c.profiles?.username ?? 'villager'}
                  </span>
                  <span style={{ fontSize: 11, color: muted }}>{timeAgo(c.created_at)}</span>
                </div>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: text2 }}>{c.content}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div style={{
          padding: '10px 12px calc(10px + env(safe-area-inset-bottom, 0px))',
          borderTop: `1px solid ${borderC}`,
          display: 'flex', gap: 10, alignItems: 'center',
          background: bg,
        }}>
          <input
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
            placeholder="Add a comment…"
            style={{
              flex: 1, background: isNight ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
              border: `1px solid ${borderC}`, borderRadius: 24,
              padding: '10px 16px', fontSize: 14, color: text2, outline: 'none',
            }}
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleSubmit}
            disabled={!text.trim() || submitting}
            style={{
              width: 40, height: 40, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: text.trim() ? '#7C3AED' : (isNight ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={text.trim() ? '#fff' : muted} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </motion.button>
        </div>
      </motion.div>
    </>
  );
}

const PAGE_SIZE = 10;

const REACTIONS = [
  { id: 'oowop',  emoji: '✊', label: 'OoWop'   },
  { id: 'fire',   emoji: '🔥', label: 'Fire'    },
  { id: 'love',   emoji: '💜', label: 'Love'    },
  { id: 'inspire',emoji: '⚡', label: 'Inspire' },
  { id: 'crown',  emoji: '👑', label: 'Crown'   },
];

// ── DreamLine post type system ────────────────────────────────────────────────
// These are the DreamLine-specific labels (different from studio post_type media type)
type DreamlineLabel =
  | 'goal_recap'
  | 'sprint_win'
  | 'how_to'
  | 'general'
  | 'ask_for_help'
  | 'milestone';

const DREAMLINE_LABELS: Record<DreamlineLabel, { label: string; color: string; bg: string }> = {
  goal_recap:   { label: 'Goal Recap',     color: '#A855F7', bg: 'rgba(168,85,247,0.15)'  },
  sprint_win:   { label: 'Sprint Win',     color: '#14B8A6', bg: 'rgba(20,184,166,0.15)'  },
  how_to:       { label: 'Workshop',       color: '#1A2DBF', bg: 'rgba(26,45,191,0.15)'   },
  general:      { label: 'General',        color: '#6B7280', bg: 'rgba(107,114,128,0.15)' },
  ask_for_help: { label: 'Ask for Help',   color: '#F59E0B', bg: 'rgba(245,158,11,0.15)'  },
  milestone:    { label: 'Milestone',      color: '#10B981', bg: 'rgba(16,185,129,0.15)'  },
};

// Map studio/create post labels → DreamLine label
function toDreamlineLabel(post: any): DreamlineLabel | null {
  const raw = post.post_label ?? post.dreamline_label ?? null;
  if (!raw) return null;
  const map: Record<string, DreamlineLabel> = {
    goal_recap:     'goal_recap',
    sprint_update:  'sprint_win',
    sprint_win:     'sprint_win',
    action_how_to:  'how_to',
    how_to:         'how_to',
    workshop:       'how_to',
    help_request:   'ask_for_help',
    ask_for_help:   'ask_for_help',
    general:        'general',
    milestone:      'milestone',
  };
  return map[raw] ?? null;
}

// Media type detection (for rendering the right card)
type MediaPostType = 'text' | 'photo' | 'video' | 'milestone' | 'reel';

function detectMediaType(post: any): MediaPostType {
  if (post.media_url?.match(/\.(mp4|mov|webm)/i)) return 'reel';
  if (post.media_url?.match(/\.(jpg|jpeg|png|gif|webp)/i)) return 'photo';
  if (/youtube\.com|youtu\.be|vimeo\.com/i.test(post.content || '')) return 'video';
  if (post.milestone) return 'milestone';
  return 'text';
}

function extractYouTubeId(url: string) {
  const m = url.match(/(?:youtube\.com.*[?&]v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

// ── Story circle ──────────────────────────────────────────────────────────────
function StoryRing({ username, hasNew, onClick }: {
  username: string; hasNew: boolean; onClick: () => void;
}) {
  const ringColor = hasNew ? '#7C3AED' : 'rgba(124,58,237,0.25)';
  return (
    <motion.button
      whileTap={{ scale: 0.93 }}
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 flex-shrink-0"
      style={{ width: 68, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
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
          overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/default-avatar.png" alt={username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      </div>
      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', maxWidth: 64, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        @{username}
      </span>
    </motion.button>
  );
}

// ── Spirit insight card ───────────────────────────────────────────────────────
function SpiritInsightCard({ isNight }: { isNight: boolean }) {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/spirit/dreamline-insight')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.insight) setInsight(d.insight); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!loading && !insight) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        borderRadius: 16,
        background: isNight
          ? 'linear-gradient(135deg, #0D2318, #0E2E1A)'
          : 'linear-gradient(135deg, #DCFCE7, #F0FDF4)',
        border: '1px solid rgba(16,185,129,0.3)',
        padding: '14px 16px',
        marginBottom: 12,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
      }}
    >
      {/* Spirit icon */}
      <div style={{
        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
        background: 'linear-gradient(135deg, #10B981, #059669)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
          color: '#10B981', marginBottom: 4,
        }}>Spirit — Daily Insight</p>
        {loading ? (
          <div style={{
            height: 14, borderRadius: 7,
            background: isNight ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.2)',
            width: '85%', animation: 'pulse 1.5s infinite',
          }} />
        ) : (
          <p style={{
            fontSize: 13, lineHeight: 1.55, fontWeight: 500,
            color: isNight ? '#6EE7B7' : '#065F46',
          }}>
            {insight}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ── Post type badge ───────────────────────────────────────────────────────────
function PostTypeBadge({ label }: { label: DreamlineLabel }) {
  const cfg = DREAMLINE_LABELS[label];
  return (
    <span style={{
      fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 700,
      background: cfg.bg, color: cfg.color,
    }}>
      {cfg.label}
    </span>
  );
}

// ── Post card ─────────────────────────────────────────────────────────────────
function PostCard({
  post, isNight, currentUserId, givenOoWops, onOoWop, onOpenActions, favorites, onToggleFavorite, onOpenComments, saves, onToggleSave,
}: {
  post: any; isNight: boolean; currentUserId: string | null;
  givenOoWops: Set<string>; onOoWop: (post: any) => void;
  onOpenActions: (post: any) => void;
  favorites: Set<string>; onToggleFavorite: (post: any) => void;
  onOpenComments: (post: any) => void;
  saves: Set<string>; onToggleSave: (post: any) => void;
}) {
  const [showReactions, setShowReactions] = useState(false);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const mediaType = detectMediaType(post);
  const dreamlineLabel = toDreamlineLabel(post);

  const bg     = isNight ? '#1a2332' : '#FFFFFF';
  const border = isNight ? '1px solid var(--v-card-border)' : '1px solid #EDE9FE';
  const text   = isNight ? '#E8E3F8' : '#1E1B4B';
  const muted  = isNight ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.38)';
  const accent = '#7C3AED';

  const images: string[] = post.images ?? (post.media_url ? [post.media_url] : []);
  const ytId = mediaType === 'video' ? extractYouTubeId(post.content || '') : null;

  // Trigger keyword generation if needed (fire-and-forget)
  useEffect(() => {
    if (!post.ai_keywords?.length && post.content) {
      fetch('/api/dreamline/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: post.id,
          content: post.content,
          post_type: dreamlineLabel ?? 'general',
        }),
      }).catch(() => {});
    }
  }, [post.id]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ background: bg, border, borderRadius: 20, overflow: 'hidden', marginBottom: 12, position: 'relative' }}
    >
      {/* Author row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px 10px' }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
          overflow: 'hidden', background: accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {post.profiles?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.profiles.avatar_url}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>
              {(post.profiles?.username ?? 'V')[0].toUpperCase()}
            </span>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
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
            {/* DreamLine post type badge */}
            {dreamlineLabel && <PostTypeBadge label={dreamlineLabel} />}
            {!dreamlineLabel && mediaType === 'milestone' && (
              <PostTypeBadge label="milestone" />
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

      {/* Workshop context — if How-to, show linked goal/sprint */}
      {dreamlineLabel === 'how_to' && (post.goal_title || post.sprint_title) && (
        <div style={{
          margin: '0 16px 10px', padding: '8px 12px', borderRadius: 10,
          background: isNight ? 'rgba(26,45,191,0.12)' : 'rgba(26,45,191,0.06)',
          border: '1px solid rgba(26,45,191,0.2)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1A2DBF" strokeWidth="2.5" strokeLinecap="round">
            <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
          </svg>
          <span style={{ fontSize: 11, color: '#1A2DBF', fontWeight: 700 }}>
            {post.goal_title ?? post.sprint_title}
          </span>
        </div>
      )}

      {/* Text content */}
      {post.content && mediaType !== 'reel' && (
        <div style={{ padding: '0 16px 12px', fontSize: 14, lineHeight: 1.6, color: text }}>
          {post.content}
        </div>
      )}

      {/* Milestone card */}
      {mediaType === 'milestone' && post.milestone && (
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
      {mediaType === 'photo' && images.length > 0 && (
        <div style={{ position: 'relative', background: '#000', marginBottom: 4 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
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

      {/* YouTube/Vimeo embed */}
      {mediaType === 'video' && ytId && (
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
      {mediaType === 'reel' && post.media_url && (
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

      {/* Action bar (bottom strip — kept for layout spacing) */}
      <div style={{ padding: '10px 16px 12px', display: 'flex', alignItems: 'center', gap: 4 }}>
        {/* Reaction picker */}
        <div style={{ position: 'relative' }}>
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
        {/* Spacer so the rail doesn't overlap text */}
        <div style={{ width: 60, flexShrink: 0, marginLeft: 'auto' }} />
      </div>

      {/* ── Right action rail ─────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', right: 12, bottom: 80,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
        zIndex: 5,
      }}>
        {/* 1. Creator avatar with follow + */}
        <div style={{ position: 'relative', width: 38, height: 38 }}>
          <div style={{
            width: 38, height: 38, borderRadius: '50%',
            border: '2px solid #FFFFFF', overflow: 'hidden',
            background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {post.profiles?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.profiles.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ color: '#fff', fontWeight: 800, fontSize: 13 }}>
                {(post.profiles?.username ?? 'V')[0].toUpperCase()}
              </span>
            )}
          </div>
          {/* Follow + badge */}
          <div style={{
            position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)',
            width: 16, height: 16, borderRadius: '50%',
            background: accent, border: '1.5px solid #fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: 11, color: '#fff', fontWeight: 900, lineHeight: 1,
          }}>
            +
          </div>
        </div>

        {/* 2. OoWop */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => onOoWop(post)}
            disabled={givenOoWops.has(post.id)}
            style={{
              background: 'none', border: 'none', cursor: givenOoWops.has(post.id) ? 'default' : 'pointer',
              padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            title="OoWop"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill={givenOoWops.has(post.id) ? '#F59E0B' : (isNight ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)')} xmlns="http://www.w3.org/2000/svg">
              <path d="M18 11V9a2 2 0 00-4 0v2H9V9a2 2 0 00-4 0v8a5 5 0 005 5h4a5 5 0 005-5v-4a2 2 0 00-4 0v2h-1v-4z"/>
            </svg>
          </motion.button>
          <span style={{ fontSize: 11, fontWeight: 700, color: givenOoWops.has(post.id) ? '#F59E0B' : muted }}>
            {post.oowop_count || 0}
          </span>
        </div>

        {/* 3. Comment */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => onOpenComments(post)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Comments"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill={isNight ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)'}>
              <path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z"/>
            </svg>
          </motion.button>
          <span style={{ fontSize: 11, fontWeight: 700, color: muted }}>{post.comment_count || 0}</span>
        </div>

        {/* 4. Share (paper plane) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => {
              const url = `${window.location.origin}/village/dreamline/post/${post.id}`;
              if (navigator.share) {
                navigator.share({ title: `@${post.profiles?.username || 'villager'} on DreamLine`, url }).catch(() => {});
              } else {
                navigator.clipboard?.writeText(url).catch(() => {});
              }
            }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Share"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={isNight ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </motion.button>
          <span style={{ fontSize: 11, fontWeight: 700, color: muted, opacity: 0 }}>0</span>
        </div>

        {/* 5. Save (bookmark) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => onToggleSave(post)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Save"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill={saves.has(post.id) ? '#1A2DBF' : 'none'} stroke={saves.has(post.id) ? '#1A2DBF' : (isNight ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)')} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
            </svg>
          </motion.button>
          <span style={{ fontSize: 11, fontWeight: 700, color: saves.has(post.id) ? '#1A2DBF' : muted, opacity: 0 }}>0</span>
        </div>
      </div>

      {/* OoWop validation bar */}
      {(post.oowop_count || 0) > 0 && (post.oowop_count || 0) < 3 && (
        <div style={{ padding: '0 16px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: isNight ? 'var(--v-card-border)' : '#EDE9FE' }}>
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

// ── Post composer (quick post from feed) ──────────────────────────────────────
type QuickPostType = 'goal_recap' | 'sprint_win' | 'how_to' | 'general' | 'ask_for_help';

const QUICK_POST_TYPES: { id: QuickPostType; label: string; color: string }[] = [
  { id: 'goal_recap',   label: 'Goal Recap',   color: '#A855F7' },
  { id: 'sprint_win',   label: 'Sprint Win',   color: '#14B8A6' },
  { id: 'how_to',       label: 'Workshop',     color: '#1A2DBF' },
  { id: 'general',      label: 'General',      color: '#6B7280' },
  { id: 'ask_for_help', label: 'Ask for Help', color: '#F59E0B' },
];

const QUICK_PLACEHOLDERS: Record<QuickPostType, string> = {
  goal_recap:   'Share your goal progress or a win…',
  sprint_win:   'What sprint did you just complete?',
  how_to:       'Teach a skill or share a how-to…',
  general:      'What\'s on your mind today?',
  ask_for_help: 'What do you need from the village?',
};

function PostComposer({
  isNight, onPost, postCount,
}: { isNight: boolean; onPost: (content: string, dreamlineLabel: QuickPostType) => Promise<void>; postCount: number }) {
  const [activeType, setActiveType] = useState<QuickPostType>('general');
  const [content, setContent]       = useState('');
  const [posting, setPosting]       = useState(false);

  const bg     = isNight ? '#1a2332' : '#FFFFFF';
  const border = isNight ? '1px solid var(--v-card-border)' : '1px solid #EDE9FE';
  const muted  = isNight ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)';
  const text   = isNight ? '#E8E3F8' : '#1E1B4B';

  async function handlePost() {
    if (!content.trim() || posting || postCount >= 3) return;
    setPosting(true);
    await onPost(content, activeType);
    setContent('');
    setPosting(false);
  }

  return (
    <div style={{ background: bg, border, borderRadius: 20, padding: 16, marginBottom: 12 }}>
      {/* Post type selector — pill row */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {QUICK_POST_TYPES.map(t => {
          const active = activeType === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveType(t.id)}
              style={{
                flexShrink: 0, padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                border: 'none', cursor: 'pointer',
                background: active ? t.color : (isNight ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)'),
                color: active ? '#fff' : t.color,
                transition: 'all 0.15s',
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder={QUICK_PLACEHOLDERS[activeType]}
        rows={3}
        disabled={postCount >= 3}
        style={{
          width: '100%', resize: 'none', fontSize: 14, outline: 'none', lineHeight: 1.6,
          background: 'transparent', color: text,
          border: `1px solid ${isNight ? 'var(--v-card-border)' : '#DDD6FE'}`,
          borderRadius: 12, padding: 12, boxSizing: 'border-box',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
        <span style={{ fontSize: 12, color: muted }}>
          {postCount >= 3 ? 'Max 3 posts/day' : `${3 - postCount} posts left today`}
        </span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link href="/village/create" style={{
            fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 20, textDecoration: 'none',
            background: isNight ? 'rgba(124,58,237,0.15)' : 'rgba(124,58,237,0.08)',
            color: '#7C3AED', border: '1px solid rgba(124,58,237,0.25)',
          }}>
            Studio
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
            {posting ? '…' : 'Share'}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DreamLinePage() {
  const router = useRouter();
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
  const [actionsPost, setActionsPost]   = useState<any | null>(null);
  const [favorites, setFavorites]       = useState<Set<string>>(new Set());
  const [commentsPost, setCommentsPost] = useState<any | null>(null);
  const [saves, setSaves]               = useState<Set<string>>(new Set());
  const bottomRef    = useRef<HTMLDivElement>(null);
  const motionRef    = useRef({ events: 0 });
  const viewTimers   = useRef<Record<string, { start: number; sent: boolean }>>({});
  const supabase = createClient();
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';

  const accent = '#7C3AED';
  const pageBg = isNight ? 'var(--v-bg)' : '#F3EFFF';

  useEffect(() => {
    if (typeof window === 'undefined' || !('DeviceMotionEvent' in window)) return;
    const h = () => { motionRef.current.events++; };
    window.addEventListener('devicemotion', h, { passive: true });
    return () => window.removeEventListener('devicemotion', h);
  }, []);

  // Infinite scroll observer
  useEffect(() => {
    if (!bottomRef.current) return;
    const obs = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting && hasMore && !loadingMore) loadMore(); },
      { threshold: 0.1 }
    );
    obs.observe(bottomRef.current);
    return () => obs.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const { data: savedPosts } = await (supabase as any)
        .from('post_interactions')
        .select('post_id')
        .eq('user_id', user.id)
        .eq('interaction_type', 'save');
      if (savedPosts) setSaves(new Set(savedPosts.map((s: any) => s.post_id)));
      loadDiscoverSteps(user.id);
    }
    // Story users (recent posters in last 24h)
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

    // Load first page of feed
    const feedRes = await fetch(`/api/dreamline/feed?limit=${PAGE_SIZE}&offset=0`);
    if (feedRes.ok) {
      const data = await feedRes.json();
      if (Array.isArray(data) && data.length > 0) { setPosts(data); setHasMore(data.length === PAGE_SIZE); return; }
    }
    // Fallback: direct Supabase query
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

  async function handlePost(content: string, dreamlineLabel: QuickPostType) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: post, error } = await (supabase as any).from('dream_line_posts').insert({
      user_id: user.id,
      content,
      visibility: 'public',
      post_label: dreamlineLabel,
      dreamline_label: dreamlineLabel,
    }).select('id').single();
    if (!error && post) {
      setPostCount(c => c + 1);
      VillageSound.post();
      await awardScore('DREAM_LINE_POST');
      // Generate keywords in background
      fetch('/api/dreamline/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: post.id, content, post_type: dreamlineLabel }),
      }).catch(() => {});
      // Score for mission alignment
      fetch('/api/dreamline/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: post.id, content }),
      }).catch(() => {});
    }
  }

  async function handleOoWop(post: any) {
    if (!currentUserId || givenOoWops.has(post.id)) return;
    // Insert to oowops table (primary) + post_interactions for cross-feature tracking
    const [{ error }] = await Promise.all([
      (supabase as any).from('oowops').insert({ post_id: post.id, giver_id: currentUserId, receiver_id: post.user_id }),
      (supabase as any).from('post_interactions').insert({ post_id: post.id, user_id: currentUserId, interaction_type: 'oowop' }).then(() => ({})),
    ]);
    if (!error) {
      const newCount = (post.oowop_count || 0) + 1;
      setGivenOoWops(prev => new Set([...prev, post.id]));
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, oowop_count: newCount } : p));
      // Update oowop_count on dream_line_posts
      (supabase as any).from('dream_line_posts').update({ oowop_count: newCount }).eq('id', post.id).then(() => {});
      await awardScore('GIVE_OOWOP', post.id);
      fetch('/api/oowops/notify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ post_id: post.id, giver_id: currentUserId, receiver_id: post.user_id, oowop_count: newCount }) }).catch(() => {});
      if (newCount >= 3) { setCelebration(post.id); VillageSound.validated(); }
    }
  }

  async function handleToggleFavorite(post: any) {
    const isStudio = !!post._source;
    if (!isStudio) return;
    const isFav = favorites.has(post.id);
    setFavorites(prev => { const n = new Set(prev); isFav ? n.delete(post.id) : n.add(post.id); return n; });
    await fetch('/api/studio/favorite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: post.id }),
    }).catch(() => {});
  }

  async function handleToggleSave(post: any) {
    if (!currentUserId) return;
    const isSaved = saves.has(post.id);
    setSaves(prev => { const n = new Set(prev); isSaved ? n.delete(post.id) : n.add(post.id); return n; });
    await (supabase as any)
      .from('post_interactions')
      .upsert({
        user_id: currentUserId,
        post_id: post.id,
        interaction_type: 'save',
      }, { onConflict: 'user_id,post_id,interaction_type', ignoreDuplicates: !isSaved });
    if (isSaved) {
      await (supabase as any)
        .from('post_interactions')
        .delete()
        .eq('user_id', currentUserId)
        .eq('post_id', post.id)
        .eq('interaction_type', 'save');
    }
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

      {/* Comment drawer */}
      <AnimatePresence>
        {commentsPost && (
          <CommentDrawer
            key={commentsPost.id}
            post={commentsPost}
            currentUserId={currentUserId}
            isNight={isNight}
            onClose={() => setCommentsPost(null)}
          />
        )}
      </AnimatePresence>

      {/* Stories row */}
      {storyUsers.length > 0 && (
        <div style={{
          background: isNight ? '#0C0E1C' : '#FFFFFF',
          borderBottom: isNight ? '1px solid #1A1C30' : '1px solid #EDE9FE',
          padding: '14px 0',
        }}>
          <div style={{ display: 'flex', gap: 14, overflowX: 'auto', padding: '0 16px', scrollbarWidth: 'none' }}>
            {/* Your story */}
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={() => router.push('/village/create')}
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
                hasNew={i < 5}
                onClick={() => router.push(`/villager/${u.username}`)}
              />
            ))}
          </div>
        </div>
      )}

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '16px 12px' }}>

        {/* Spirit daily insight */}
        <SpiritInsightCard isNight={isNight} />

        {/* OoWop Discovery (horizontal scroll) */}
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
                      background: isNight ? '#1a2332' : '#FFFFFF',
                      border: isNight ? '1px solid var(--v-card-border)' : '1px solid #EDE9FE',
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

        {/* Post composer */}
        <PostComposer isNight={isNight} onPost={handlePost} postCount={postCount} />

        {/* Feed */}
        {posts.map((post) => (
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
              onOpenComments={setCommentsPost}
              saves={saves}
              onToggleSave={handleToggleSave}
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
            <p style={{ fontSize: 12, color: isNight ? '#2A2F4A' : '#C4B5FD' }}>You have seen everything</p>
          )}
        </div>
      </div>
    </div>
  );
}
