'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { useSpiritVoice } from '@/components/village/SpiritVoiceProvider';
import { TikTokFeedCard } from '@/components/village/TikTokFeedCard';
import { OoWopIcon } from '@/components/village/OoWopIcon';
import WorkshopTabBar from '@/components/village/WorkshopTabBar';

type CardType = 'template' | 'video' | 'tiktok' | 'sprint' | 'achievement' | 'goal' | 'guide';
interface ActionContext {
  goalId: string; sprintNumber: number; sprintTitle: string;
  actionTitle: string; actionDescription?: string; actionId?: string;
}
interface FeedCard {
  id: string; type: CardType; title: string; subtitle: string; content: string;
  author: { username: string; avatar?: string; avatar_url?: string; score_tier?: string };
  media?: { videoId?: string; thumbnail?: string; url?: string; embedHtml?: string };
  color: string; accent: string; data?: any; oowops?: number;
  actionContext?: ActionContext;
}

// Strip characters that would break a PostgREST `.or()` filter expression
function sanitizeForOr(s: string): string {
  return (s ?? '').replace(/[,()%]/g, '').trim().slice(0, 40);
}
interface Comment {
  id: string; username: string; avatar?: string;
  text: string; isOoWop: boolean; timestamp: string;
  replies?: Comment[];
}

// ── Icons ────────────────────────────────────────────────────────────────────
const ShareSvg  = () => <svg width={22} height={22} viewBox="0 0 24 24" fill="white"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/></svg>;
const SaveSvg   = ({ active }: { active?: boolean }) => <svg width={22} height={22} viewBox="0 0 24 24" fill={active ? 'white' : 'none'} stroke="white" strokeWidth={2} strokeLinecap="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>;
const CommentSvg = () => <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>;
const MoreSvg   = () => <svg width={22} height={22} viewBox="0 0 24 24" fill="white"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>;
const SkipSvg   = () => <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a2 2 0 00-2-2L7 13v8h9.28a2 2 0 002-1.7l1.38-9A2 2 0 0017.7 8H14z"/><path d="M7 13H4a1 1 0 01-1-1V8a1 1 0 011-1h3"/></svg>;
const PlaySvg   = () => <svg width={36} height={36} viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>;
const PauseSvg  = () => <svg width={36} height={36} viewBox="0 0 24 24" fill="white"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>;

// ── Comments Drawer ──────────────────────────────────────────────────────────
function CommentsDrawer({ open, onClose, card, onOoWop, owopped }: {
  open: boolean; onClose: () => void; card: FeedCard; onOoWop: () => void; owopped: boolean;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [input, setInput] = useState('');
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState('');
  const [keyboardInset, setKeyboardInset] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 200);
  }, [open, comments.length]);

  // Keyboard-aware positioning: shrink the sheet by the on-screen keyboard
  // height so the input row stays visible above it.
  useEffect(() => {
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    if (!open || !vv) return;
    function onResize() {
      setKeyboardInset(Math.max(0, window.innerHeight - vv!.height));
    }
    vv.addEventListener('resize', onResize);
    onResize();
    return () => { vv.removeEventListener('resize', onResize); setKeyboardInset(0); };
  }, [open]);

  function submit() {
    if (!input.trim()) return;
    setComments(prev => [...prev, {
      id: Date.now().toString(), username: 'you', text: input.trim(),
      isOoWop: false, timestamp: 'just now',
    }]);
    setInput('');
  }

  function toggleReplies(commentId: string) {
    setExpandedReplies(prev => { const n = new Set(prev); if (n.has(commentId)) n.delete(commentId); else n.add(commentId); return n; });
  }

  function submitReply(commentId: string) {
    if (!replyInput.trim()) return;
    setComments(prev => prev.map(c => c.id === commentId
      ? { ...c, replies: [...(c.replies ?? []), { id: Date.now().toString(), username: 'you', text: replyInput.trim(), isOoWop: false, timestamp: 'just now' }] }
      : c));
    setReplyInput('');
    setReplyingTo(null);
    setExpandedReplies(prev => new Set(prev).add(commentId));
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div key="cd-bg" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(0,0,0,0.55)' }} />
          <motion.div key="cd-sheet"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 71,
              background: 'rgba(8,10,24,0.98)', backdropFilter: 'blur(28px)',
              borderRadius: '24px 24px 0 0', height: '70vh', display: 'flex', flexDirection: 'column',
              paddingBottom: keyboardInset }}
          >
            {/* Handle + header — drag down to dismiss */}
            <motion.div
              drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.7 }} dragSnapToOrigin
              onDragEnd={(_e, info) => { if (info.offset.y > 100 || info.velocity.y > 500) onClose(); }}
              style={{ padding: '10px 16px 10px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0, cursor: 'grab', touchAction: 'none' }}
            >
              <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.18)', borderRadius: 2, margin: '0 auto 10px' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 15, fontWeight: 900, color: '#fff' }}>
                  Comments · {comments.length}
                </span>
                <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%', width: 30, height: 30, color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              </div>
            </motion.div>

            {/* Feed */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 18 }}>
              {comments.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
                  No comments yet — be the first!
                </div>
              )}
              {comments.map(c => (
                <div key={c.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 18, background: c.isOoWop ? 'rgba(239,159,39,0.3)' : '#1877F2', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {c.isOoWop ? <OoWopIcon size={18} /> : <span style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>{c.username[0].toUpperCase()}</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.65)' }}>@{c.username}</span>
                        {c.isOoWop && <span style={{ fontSize: 9, fontWeight: 900, color: '#EF9F27', background: 'rgba(239,159,39,0.15)', padding: '1px 6px', borderRadius: 6 }}>OoWop</span>}
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)' }}>{c.timestamp}</span>
                      </div>
                      <p style={{ fontSize: 14, color: '#fff', lineHeight: 1.5, margin: 0 }}>{c.text}</p>
                    </div>
                  </div>

                  {/* Reply action row */}
                  <div style={{ display: 'flex', gap: 16, marginLeft: 46 }}>
                    <button onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)}
                      style={{ background: 'none', border: 'none', padding: 0, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                      Reply
                    </button>
                    {!!c.replies?.length && (
                      <button onClick={() => toggleReplies(c.id)}
                        style={{ background: 'none', border: 'none', padding: 0, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                        {expandedReplies.has(c.id) ? 'Hide' : 'View'} {c.replies.length} repl{c.replies.length === 1 ? 'y' : 'ies'}
                      </button>
                    )}
                  </div>

                  {/* Reply input */}
                  {replyingTo === c.id && (
                    <div style={{ display: 'flex', gap: 8, marginLeft: 46 }}>
                      <input value={replyInput} onChange={e => setReplyInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitReply(c.id)}
                        placeholder={`Reply to @${c.username}…`} autoFocus
                        style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 18, padding: '8px 14px', color: '#fff', fontSize: 13, outline: 'none' }} />
                      <motion.button whileTap={{ scale: 0.92 }} onClick={() => submitReply(c.id)}
                        style={{ background: '#4D72FF', border: 'none', borderRadius: 18, padding: '8px 14px', color: '#fff', fontWeight: 900, fontSize: 12, cursor: 'pointer' }}>
                        Post
                      </motion.button>
                    </div>
                  )}

                  {/* Reply thread — collapsed by default */}
                  {expandedReplies.has(c.id) && c.replies?.map(r => (
                    <div key={r.id} style={{ display: 'flex', gap: 8, marginLeft: 46 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 14, background: '#1877F2', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 11, fontWeight: 900, color: '#fff' }}>{r.username[0].toUpperCase()}</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.65)' }}>@{r.username}</span>
                          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)' }}>{r.timestamp}</span>
                        </div>
                        <p style={{ fontSize: 13, color: '#fff', lineHeight: 1.5, margin: 0 }}>{r.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* OoWop row + input */}
            <div style={{ flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.07)', padding: '10px 16px', paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <motion.button whileTap={{ scale: 0.88 }} onClick={() => {
                  onOoWop();
                  setComments(prev => [...prev, { id: Date.now().toString(), username: 'you', text: '', isOoWop: true, timestamp: 'just now' }]);
                }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: owopped ? 'rgba(239,159,39,0.2)' : 'rgba(255,255,255,0.08)', border: `1px solid ${owopped ? 'rgba(239,159,39,0.5)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 20, padding: '8px 14px', cursor: 'pointer' }}>
                  <OoWopIcon size={18} />
                  <span style={{ fontSize: 12, fontWeight: 900, color: owopped ? '#EF9F27' : '#fff' }}>OoWop</span>
                </motion.button>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()}
                  placeholder="Add a comment…"
                  style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 22, padding: '11px 16px', color: '#fff', fontSize: 14, outline: 'none' }} />
                <motion.button whileTap={{ scale: 0.92 }} onClick={submit}
                  style={{ background: '#4D72FF', border: 'none', borderRadius: 22, padding: '11px 18px', color: '#fff', fontWeight: 900, fontSize: 13, cursor: 'pointer' }}>
                  Post
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── More Drawer ──────────────────────────────────────────────────────────────
const SHARE_OPTS = [
  { icon: '↩', label: 'Repost',    action: () => {} },
  { icon: '💬', label: 'SMS',       action: (t: string) => window.open(`sms:?body=${encodeURIComponent(t)}`) },
  { icon: '🟢', label: 'WhatsApp', action: (t: string) => window.open(`https://wa.me/?text=${encodeURIComponent(t)}`) },
  { icon: '🔗', label: 'Copy Link', action: () => navigator.clipboard?.writeText(window.location.href) },
  { icon: '📘', label: 'Messenger', action: () => {} },
  { icon: '✈️', label: 'Telegram',  action: (t: string) => window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(t)}`) },
  { icon: '📘', label: 'Facebook',  action: (t: string) => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`) },
  { icon: '📧', label: 'Email',     action: (t: string) => window.open(`mailto:?subject=${encodeURIComponent(t)}&body=${encodeURIComponent(window.location.href)}`) },
  { icon: '📸', label: 'Instagram', action: () => {} },
  { icon: '•••', label: 'More',    action: (_: string, title: string) => { if (navigator.share) navigator.share({ title, url: window.location.href }); } },
];
const MORE_OPTS = [
  { icon: '⚑',  label: 'Report' }, { icon: '✕', label: 'Not interested' },
  { icon: '⬇',  label: 'Download' }, { icon: '📖', label: 'Add to Story' },
  { icon: '📢', label: 'Promote' }, { icon: '📺', label: 'Cast' },
  { icon: '?',  label: 'Why this' }, { icon: 'CC', label: 'Captions' },
  { icon: '🎬', label: 'Remake' }, { icon: '⏩', label: 'Speed' },
  { icon: 'GIF', label: 'Share GIF' },
];

function MoreDrawer({ open, onClose, card, onSkip }: { open: boolean; onClose: () => void; card: FeedCard; onSkip: () => void }) {
  const COLORS = ['#7C3AED','#1D9E75','#E8770A','#1877F2','#D4537E','#0D9488','#BE185D','#D97706'];
  const [shareUsers, setShareUsers] = useState<{ id: string; display_name: string; username: string }[]>([]);

  useEffect(() => {
    if (!open) return;
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await (supabase as any)
        .from('profiles')
        .select('id,display_name,username')
        .neq('id', user.id)
        .limit(20);
      setShareUsers(data ?? []);
    })();
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div key="md-bg" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(0,0,0,0.55)' }} />
          <motion.div key="md-sheet"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 71,
              background: 'rgba(8,10,24,0.98)', backdropFilter: 'blur(28px)',
              borderRadius: '24px 24px 0 0', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}
          >
            {/* Handle + header row */}
            <div style={{ flexShrink: 0, padding: '10px 16px 10px' }}>
              <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.18)', borderRadius: 2, margin: '0 auto 10px' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button style={{ background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                </button>
                <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%', width: 32, height: 32, color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 'max(20px, env(safe-area-inset-bottom, 20px))' }}>
              {/* Section 1: Send to */}
              <div style={{ padding: '0 16px 16px' }}>
                <p style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', marginBottom: 12 }}>SEND TO</p>
                <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 4, WebkitOverflowScrolling: 'touch' as any }}>
                  {shareUsers.length === 0 ? (
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', padding: '8px 0' }}>No users to show</span>
                  ) : shareUsers.map((u, i) => {
                    const name = u.display_name || u.username || '?';
                    return (
                      <motion.button whileTap={{ scale: 0.9 }} key={u.id}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', width: 56 }}>
                        <div style={{ width: 52, height: 52, borderRadius: 26, background: COLORS[i % COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{name[0].toUpperCase()}</span>
                        </div>
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: 700, textAlign: 'center' }}>{name.split(' ')[0]}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 16px 16px' }} />

              {/* Section 2: Share */}
              <div style={{ padding: '0 16px 16px' }}>
                <p style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', marginBottom: 12 }}>SHARE</p>
                <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 4, WebkitOverflowScrolling: 'touch' as any }}>
                  {SHARE_OPTS.map(opt => (
                    <motion.button whileTap={{ scale: 0.9 }} key={opt.label}
                      onClick={() => { (opt.action as any)(card.title, card.title); onClose(); }}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, width: 60 }}>
                      <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                        {opt.icon}
                      </div>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: 700, textAlign: 'center', lineHeight: 1.2 }}>{opt.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 16px 16px' }} />

              {/* Section 3: More options */}
              <div style={{ padding: '0 16px 16px' }}>
                <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4, WebkitOverflowScrolling: 'touch' as any }}>
                  {MORE_OPTS.map(opt => (
                    <motion.button whileTap={{ scale: 0.9 }} key={opt.label}
                      onClick={() => { if (opt.label === 'Not interested') onSkip(); onClose(); }}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, width: 62 }}>
                      <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#fff', fontWeight: 900 }}>
                        {opt.icon}
                      </div>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: 700, textAlign: 'center', lineHeight: 1.2 }}>{opt.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Video Card (YouTube) ──────────────────────────────────────────────────────
function VideoCard({ card, iframeRef, isPaused, isActive }: {
  card: FeedCard;
  iframeRef: React.RefObject<HTMLIFrameElement>;
  isPaused: boolean;
  isActive: boolean;
}) {
  const thumb = card.media?.thumbnail ||
    (card.media?.videoId ? `https://img.youtube.com/vi/${card.media.videoId}/maxresdefault.jpg` : null);

  return (
    <div className="absolute inset-0" style={{ background: '#000' }}>
      {card.media?.videoId && isActive ? (
        <>
          <iframe
            ref={iframeRef}
            key={card.media.videoId}
            src={`https://www.youtube.com/embed/${card.media.videoId}?autoplay=1&mute=0&controls=0&rel=0&modestbranding=1&playsinline=1&enablejsapi=1&iv_load_policy=3&loop=1&playlist=${card.media.videoId}&fs=0&disablekb=1`}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            style={{ border: 'none', pointerEvents: 'none' }}
          />
          {/* Mask YouTube's native title/channel/share bar — title only shows in bottom info */}
          <div className="absolute inset-x-0 top-0 pointer-events-none"
            style={{ height: 130, background: 'linear-gradient(to bottom, #000 0%, #000 55%, transparent 100%)', zIndex: 2 }} />
          {/* Transparent capture layer — blocks all YouTube UI (share, playlist, watch-on-YouTube,
              end-screen suggestions) from ever receiving a tap; gestures bubble to the feed handler */}
          <div className="absolute inset-0" style={{ zIndex: 3, background: 'transparent' }} />
          {/* Full cover while paused — YouTube renders a large branded overlay (title, channel,
              share, related videos) on pause that can't be removed cross-origin, so hide it entirely */}
          {isPaused && (
            <div className="absolute inset-0" style={{ zIndex: 4, background: '#000' }}>
              {thumb && <img src={thumb} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ opacity: 0.85 }} />}
              <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.35)' }} />
            </div>
          )}
        </>
      ) : thumb ? (
        <img src={thumb} alt={card.title} className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg,#0c1828,#1a2448)' }} />
      )}
    </div>
  );
}

// ── Template Card ─────────────────────────────────────────────────────────────
function TemplateCard({ card }: { card: FeedCard }) {
  const steps = card.data?.steps ?? [];
  return (
    <div className="absolute inset-0 flex flex-col" style={{ background: `linear-gradient(160deg, ${card.color}22, var(--v-bg) 60%)` }}>
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 55%)' }} />
      <div className="relative z-10 px-5 pb-28 flex flex-col justify-end flex-1" style={{ paddingTop: 'max(80px, env(safe-area-inset-top, 80px))' }}>
        <span className="px-3 py-1 rounded-full text-xs font-bold mb-3 inline-block" style={{ background: card.accent + '33', color: card.accent, border: `1px solid ${card.accent}55` }}>
          Goal Template · {steps.length} steps
        </span>
        <h2 className="text-2xl font-black text-white leading-tight mb-2">{card.title}</h2>
        <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.6)' }}>{card.subtitle}</p>
        <div className="space-y-2 mb-4">
          {steps.slice(0, 3).map((s: any, i: number) => (
            <div key={i} className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                style={{ background: card.accent + '33', color: card.accent }}>{i + 1}</div>
              {s.title}
            </div>
          ))}
        </div>
        <Link href={`/village/workshop/chat?template=${card.id}`}
          className="w-full py-3.5 rounded-2xl text-sm font-black text-white text-center"
          style={{ background: `linear-gradient(135deg, ${card.accent}, #1877F2)`, boxShadow: `0 4px 20px ${card.accent}55` }}>
          Clone This Plan
        </Link>
      </div>
    </div>
  );
}

// ── Goal Card ─────────────────────────────────────────────────────────────────
function GoalCard({ card }: { card: FeedCard }) {
  const progress = card.data?.progress ?? 0;
  const probability = card.data?.probability ?? 0;
  return (
    <div className="absolute inset-0 flex flex-col" style={{ background: `linear-gradient(160deg, ${card.color}18, var(--v-bg) 70%)` }}>
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 50%)' }} />
      <div className="relative z-10 flex-1 flex flex-col justify-end px-5 pb-28">
        <h2 className="text-2xl font-black text-white leading-tight mb-2">{card.title}</h2>
        <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>{card.subtitle}</p>
        <div className="rounded-full overflow-hidden mb-2" style={{ background: 'rgba(255,255,255,0.1)', height: 6 }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: card.accent }} />
        </div>
        <div className="flex justify-between text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
          <span>{progress}% complete</span><span>{probability}% probability</span>
        </div>
      </div>
    </div>
  );
}

// ── Guide Card ────────────────────────────────────────────────────────────────
function GuideCard() {
  const STEPS = [
    { n: 1, title: 'Open Spirit', desc: 'Tap "New Goal". Spirit will understand your goal.' },
    { n: 2, title: 'Build Your GPS', desc: 'Spirit creates your full GPS plan — sprint by sprint.' },
    { n: 3, title: 'Assess & Activate', desc: 'Spirit scores your probability and activates your plan.' },
    { n: 4, title: 'Execute Daily', desc: 'Open Instructions each day for step-by-step guidance.' },
    { n: 5, title: 'Get OoWops', desc: 'Share progress. Your village validates your wins.' },
  ];
  return (
    <div className="absolute inset-0 flex flex-col" style={{ background: 'linear-gradient(160deg, #7C3AED22, var(--v-bg) 60%)' }}>
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 40%)' }} />
      <div className="relative z-10 flex-1 flex flex-col justify-end px-5 pb-28 pt-20">
        <h2 className="text-2xl font-black text-white leading-tight mb-1">How to use the Workshop</h2>
        <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.5)' }}>It takes a village — but it starts with your Goal GPS.</p>
        <div className="space-y-3">
          {STEPS.map(s => (
            <div key={s.n} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                style={{ background: 'rgba(124,58,237,0.35)', color: '#A78BFA', border: '1px solid rgba(124,58,237,0.5)' }}>{s.n}</div>
              <div>
                <p className="text-sm font-bold text-white">{s.title}</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <Link href="/village/workshop/chat"
          className="mt-6 block w-full py-4 rounded-2xl text-sm font-black text-white text-center"
          style={{ background: 'linear-gradient(135deg,#7C3AED,#1877F2)', boxShadow: '0 4px 20px rgba(124,58,237,0.5)' }}>
          Create My First Goal GPS →
        </Link>
      </div>
    </div>
  );
}

// ── Side Actions ──────────────────────────────────────────────────────────────
function SideActions({ card, onOoWop, owopped, oowopCount, onComment, onMore, onSave, saved, onSkip, uiVisible }: {
  card: FeedCard; onOoWop: () => void; owopped: boolean; oowopCount: number;
  onComment: () => void; onMore: () => void; onSave: () => void; saved: boolean; onSkip: () => void; uiVisible: boolean;
}) {
  const AVATAR_COLORS = ['#7C3AED','#1D9E75','#E8770A','#1877F2','#D4537E'];
  const username = card.author.username || '?';
  const avatarColor = AVATAR_COLORS[username.charCodeAt(0) % AVATAR_COLORS.length];

  return (
    <div style={{
      position: 'fixed', right: 6, bottom: 100,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, zIndex: 20,
      opacity: uiVisible ? 1 : 0, transition: 'opacity 0.5s ease', pointerEvents: uiVisible ? 'auto' : 'none',
    }}>
      {/* Creator avatar */}
      <div style={{ position: 'relative', marginBottom: 2 }}>
        <div style={{ width: 38, height: 38, borderRadius: 19, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.8)', flexShrink: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={card.author.avatar_url || card.author.avatar || '/default-avatar.png'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ position: 'absolute', bottom: -5, left: '50%', transform: 'translateX(-50%)', width: 16, height: 16, borderRadius: 8, background: '#4D72FF', border: '2px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width={7} height={7} viewBox="0 0 24 24" fill="white"><path d="M12 5v14M5 12h14"/></svg>
        </div>
      </div>

      {/* OoWop (fist) */}
      <motion.button whileTap={{ scale: 0.82 }} onClick={onOoWop}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'transparent', border: 'none', cursor: 'pointer', marginTop: 6 }}>
        <div style={{ width: 40, height: 40, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: owopped ? 'rgba(239,159,39,0.3)' : 'rgba(255,255,255,0.14)', backdropFilter: 'blur(8px)' }}>
          <OoWopIcon size={19} />
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, color: owopped ? '#EF9F27' : 'rgba(255,255,255,0.75)' }}>
          {oowopCount > 0 ? oowopCount.toLocaleString() : 'OoWop'}
        </span>
      </motion.button>

      {/* Comment */}
      <motion.button whileTap={{ scale: 0.82 }} onClick={onComment}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'transparent', border: 'none', cursor: 'pointer' }}>
        <div style={{ width: 40, height: 40, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(8px)' }}>
          <CommentSvg />
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>Comment</span>
      </motion.button>

      {/* Share */}
      <motion.button whileTap={{ scale: 0.82 }}
        onClick={() => { if (navigator.share) navigator.share({ title: card.title, url: window.location.href }); }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'transparent', border: 'none', cursor: 'pointer' }}>
        <div style={{ width: 40, height: 40, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(8px)' }}>
          <ShareSvg />
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>Share</span>
      </motion.button>

      {/* Save */}
      <motion.button whileTap={{ scale: 0.82 }} onClick={onSave}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'transparent', border: 'none', cursor: 'pointer' }}>
        <div style={{ width: 40, height: 40, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: saved ? 'rgba(77,114,255,0.3)' : 'rgba(255,255,255,0.14)', backdropFilter: 'blur(8px)' }}>
          <SaveSvg active={saved} />
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, color: saved ? '#4D72FF' : 'rgba(255,255,255,0.75)' }}>Save</span>
      </motion.button>

      {/* More */}
      <motion.button whileTap={{ scale: 0.82 }} onClick={onMore}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'transparent', border: 'none', cursor: 'pointer' }}>
        <div style={{ width: 40, height: 40, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(8px)' }}>
          <MoreSvg />
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>More</span>
      </motion.button>

      {/* Skip / not helpful */}
      <motion.button whileTap={{ scale: 0.82 }} onClick={onSkip}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'transparent', border: 'none', cursor: 'pointer' }}>
        <div style={{ width: 40, height: 40, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(8px)' }}>
          <SkipSvg />
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>Skip</span>
      </motion.button>
    </div>
  );
}

// ── Goal Popup ────────────────────────────────────────────────────────────────
function ActionSelectorSheet({ open, onClose, onSelect }: {
  open: boolean;
  onClose: () => void;
  onSelect: (ctx: ActionContext) => void;
}) {
  const supabase = createClient();
  const [step, setStep] = useState<'goal' | 'sprint' | 'action'>('goal');
  const [goals, setGoals] = useState<any[]>([]);
  const [sprints, setSprints] = useState<any[]>([]);
  const [actions, setActions] = useState<any[]>([]);
  const [selGoal, setSelGoal] = useState<any>(null);
  const [selSprint, setSelSprint] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep('goal'); setSelGoal(null); setSelSprint(null);
    setLoading(true);
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await (supabase as any)
        .from('goals')
        .select('id, title, gps_stage, probability_score, sprints(id)')
        .eq('user_id', user.id).eq('status', 'active')
        .order('created_at', { ascending: false }).limit(10);
      setGoals(data ?? []);
      setLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function selectGoal(goal: any) {
    setSelGoal(goal); setLoading(true);
    const { data } = await (supabase as any)
      .from('sprints')
      .select('id, title, status, sprint_actions(id, title, description, completed, order_index)')
      .eq('goal_id', goal.id)
      .order('created_at', { ascending: true });
    setSprints(data ?? []);
    setStep('sprint'); setLoading(false);
  }

  function selectSprint(sprint: any) {
    setSelSprint(sprint);
    const sorted = [...(sprint.sprint_actions ?? [])].sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0));
    setActions(sorted);
    setStep('action');
  }

  function selectAction(action: any) {
    const sprintIdx = sprints.findIndex((s: any) => s.id === selSprint?.id);
    onSelect({
      goalId: selGoal.id, sprintNumber: sprintIdx + 1,
      sprintTitle: selSprint.title, actionId: action.id,
      actionTitle: action.title, actionDescription: action.description,
    });
    onClose();
  }

  const headerLabel = step === 'goal'
    ? 'WORKSHOP CONTENT FOR'
    : step === 'sprint'
      ? (selGoal?.title ?? '').slice(0, 32) + ((selGoal?.title ?? '').length > 32 ? '…' : '')
      : `Sprint ${sprints.findIndex((s: any) => s.id === selSprint?.id) + 1} · ${(selSprint?.title ?? '').slice(0, 24)}`;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 100 }}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 101,
              background: 'rgba(10,14,36,0.98)', backdropFilter: 'blur(28px)',
              borderRadius: '20px 20px 0 0', paddingBottom: 'max(env(safe-area-inset-bottom, 20px), 20px)',
              border: '1px solid rgba(255,255,255,0.07)', maxHeight: '75dvh', display: 'flex', flexDirection: 'column',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* drag handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
            </div>

            {/* header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px 8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                {step !== 'goal' && (
                  <button onClick={() => setStep(step === 'action' ? 'sprint' : 'goal')}
                    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 22, lineHeight: 1, cursor: 'pointer', padding: 0, flexShrink: 0 }}>
                    ←
                  </button>
                )}
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.32)', letterSpacing: '0.1em', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {headerLabel}
                  </p>
                  <p style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0 }}>
                    {step === 'goal' ? 'Which goal?' : step === 'sprint' ? 'Which sprint?' : 'Which action?'}
                  </p>
                </div>
              </div>
              <button onClick={onClose}
                style={{ background: 'rgba(255,255,255,0.07)', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0, marginLeft: 8 }}>
                ×
              </button>
            </div>

            {/* list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0 8px' }}>
              {loading && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.08)', borderTopColor: '#4D72FF' }} />
                </div>
              )}

              {/* Goal list */}
              {step === 'goal' && !loading && goals.map(g => (
                <button key={g.id} onClick={() => selectGoal(g)}
                  style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '11px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: '0 0 5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.title}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {g.gps_stage === 'active' ? (
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#6EE7B7', background: 'rgba(16,185,129,0.12)', padding: '2px 8px', borderRadius: 20, border: '1px solid rgba(16,185,129,0.25)' }}>GPS Active</span>
                      ) : (
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 20 }}>No GPS yet</span>
                      )}
                      {(g.sprints?.length ?? 0) > 0 && (
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{g.sprints.length} sprint{g.sprints.length !== 1 ? 's' : ''}</span>
                      )}
                    </div>
                  </div>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={2.2} strokeLinecap="round" style={{ flexShrink: 0, marginLeft: 8 }}><path d="M9 18l6-6-6-6"/></svg>
                </button>
              ))}

              {/* Sprint list */}
              {step === 'sprint' && !loading && sprints.map((s: any, i: number) => {
                const sprintActions = s.sprint_actions ?? [];
                const done = sprintActions.filter((a: any) => a.completed).length;
                const isComplete = s.status === 'complete';
                const isActive = s.status === 'active';
                const isLocked = !isComplete && !isActive;
                return (
                  <button key={s.id} onClick={() => !isLocked && selectSprint(s)} disabled={isLocked}
                    style={{ width: '100%', background: 'none', border: 'none', cursor: isLocked ? 'default' : 'pointer', padding: '11px 20px', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', opacity: isLocked ? 0.35 : 1, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    {isComplete
                      ? <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#6EE7B7" strokeWidth={2.5} strokeLinecap="round" style={{ flexShrink: 0 }}><polyline points="20 6 9 17 4 12"/></svg>
                      : isActive
                        ? <svg width={16} height={16} viewBox="0 0 24 24" fill="#4D72FF" stroke="none" style={{ flexShrink: 0 }}><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        : <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={1.8} style={{ flexShrink: 0 }}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    }
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Sprint {i + 1} · {s.title}</p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', margin: 0 }}>{done}/{sprintActions.length} actions complete</p>
                    </div>
                    {!isLocked && <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={2.2} strokeLinecap="round" style={{ flexShrink: 0 }}><path d="M9 18l6-6-6-6"/></svg>}
                  </button>
                );
              })}

              {/* Action list */}
              {step === 'action' && !loading && actions.map((a: any) => (
                <button key={a.id} onClick={() => selectAction(a)}
                  style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '11px 20px', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  {a.completed
                    ? <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#6EE7B7" strokeWidth={2.5} strokeLinecap="round" style={{ flexShrink: 0 }}><polyline points="20 6 9 17 4 12"/></svg>
                    : <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={2} style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="9"/></svg>
                  }
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 2px', color: a.completed ? 'rgba(255,255,255,0.4)' : '#fff', textDecoration: a.completed ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</p>
                    {a.description && !a.completed && (
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.32)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.description}</p>
                    )}
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 900, color: '#4D72FF', background: 'rgba(77,114,255,0.13)', padding: '3px 9px', borderRadius: 12, flexShrink: 0, border: '1px solid rgba(77,114,255,0.22)' }}>VIEW</span>
                </button>
              ))}

              {/* new goal CTA (goal step only) */}
              {step === 'goal' && !loading && (
                <div style={{ padding: '16px 20px 0' }}>
                  <Link href="/village/workshop/chat" onClick={onClose}
                    style={{ display: 'block', background: 'rgba(77,114,255,0.15)', color: '#AFC0FF', borderRadius: 12, padding: '12px 14px', fontSize: 13, fontWeight: 700, textDecoration: 'none', textAlign: 'center', border: '1px solid rgba(77,114,255,0.22)' }}>
                    + New Goal
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Fist fly-up animation ─────────────────────────────────────────────────────
function FistAnimation({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1, scale: 1, y: 0 }}
          animate={{ opacity: 0, scale: 1.4, y: -180 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          style={{ position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none', zIndex: 50,
            width: 64, height: 64, background: '#EF9F27',
            WebkitMaskImage: 'url(/oowop.png)', maskImage: 'url(/oowop.png)',
            WebkitMaskSize: 'contain', maskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center', maskPosition: 'center' }} />
      )}
    </AnimatePresence>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function WorkshopPage() {
  const router   = useRouter();
  const supabase = createClient();
  const { speak } = useSpiritVoice();

  const tab = 'Workshop' as const;
  const [cards,           setCards]           = useState<FeedCard[]>([]);
  const [current,         setCurrent]         = useState(0);
  const [owopped,         setOwopped]         = useState<Set<string>>(new Set());
  const [saved,           setSaved]           = useState<Set<string>>(new Set());
  const [showFist,        setShowFist]        = useState(false);
  const [loading,         setLoading]         = useState(true);
  const [activeGoals,     setActiveGoals]     = useState<any[]>([]);
  const [activeSprints,   setActiveSprints]   = useState<any[]>([]);
  const [uiVisible,       setUiVisible]       = useState(true);
  const [isPaused,        setIsPaused]        = useState(false);
  const [showPauseInd,    setShowPauseInd]    = useState(false);
  const [showComments,    setShowComments]    = useState(false);
  const [showMore,        setShowMore]        = useState(false);
  const [showSelector,    setShowSelector]    = useState(false);
  const [selectedContext, setSelectedContext] = useState<ActionContext | null>(null);
  const [feedKey,         setFeedKey]         = useState(0);
  const [missionScores,   setMissionScores]   = useState<Record<string, { score: number; label: 'green' | 'amber' | null }>>({});
  const selectedContextRef = useRef<ActionContext | null>(null);

  const iframeRef  = useRef<HTMLIFrameElement>(null);
  const uiTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tapCount   = useRef(0);
  const tapTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ptDown     = useRef({ x: 0, y: 0, time: 0 });
  const isDragging = useRef(false);
  const feedRef     = useRef<HTMLDivElement>(null);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasGoals = activeGoals.length > 0;
  const card = cards[current];
  const isGoalAligned = !!(card?.actionContext || selectedContext);
  const gpsActiveGoal = activeGoals.find((g: any) => g.gps_stage === 'active');
  const effectiveGoalId = selectedContext?.goalId ?? card?.actionContext?.goalId ?? gpsActiveGoal?.id ?? activeGoals[0]?.id;
  const gpsHref = effectiveGoalId ? `/village/workshop/gps/${effectiveGoalId}` : '/village/workshop/gps';

  // Auto-hide UI after 3s on card change
  useEffect(() => {
    triggerUIShow();
    setIsPaused(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  // Keep the scroll-snap container in sync when `current` changes
  // programmatically (e.g. handleSkip advancing past a skipped card).
  useEffect(() => {
    const el = feedRef.current;
    if (!el) return;
    const target = current * el.clientHeight;
    if (Math.abs(el.scrollTop - target) > 2) {
      el.scrollTo({ top: target, behavior: 'smooth' });
    }
  }, [current]);

  function triggerUIShow() {
    setUiVisible(true);
    if (uiTimer.current) clearTimeout(uiTimer.current);
    uiTimer.current = setTimeout(() => setUiVisible(false), 3000);
  }

  function togglePause() {
    const win = iframeRef.current?.contentWindow;
    const newPaused = !isPaused;
    setIsPaused(newPaused);
    if (win) {
      const fn = newPaused ? 'pauseVideo' : 'playVideo';
      win.postMessage(`{"event":"command","func":"${fn}","args":""}`, '*');
    }
    setShowPauseInd(true);
    setTimeout(() => setShowPauseInd(false), 700);
  }

  function handleTap() {
    tapCount.current += 1;
    if (tapCount.current === 1) {
      tapTimer.current = setTimeout(() => {
        tapCount.current = 0;
        triggerUIShow();
        if (card?.type === 'video') togglePause();
      }, 280);
    } else if (tapCount.current >= 2) {
      if (tapTimer.current) clearTimeout(tapTimer.current);
      tapCount.current = 0;
      if (card) { handleOoWop(card.id); triggerUIShow(); }
    }
  }

  function handleGesture(dx: number, dy: number, dt: number) {
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 14 && dt < 380) { handleTap(); return; }

    // Horizontal swipe → Goals / GPS navigation
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 55) {
      if (dx > 0) router.push(gpsHref);                  // swipe right → GPS
      else router.push('/village/workshop/chat');          // swipe left  → Goals
      triggerUIShow();
    }
    // Vertical card-to-card navigation is handled natively by CSS scroll-snap.
  }

  function onTouchStart(e: React.TouchEvent) {
    ptDown.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, time: Date.now() };
  }
  function onTouchEnd(e: React.TouchEvent) {
    const t = e.changedTouches[0];
    handleGesture(t.clientX - ptDown.current.x, t.clientY - ptDown.current.y, Date.now() - ptDown.current.time);
  }
  function onMouseDown(e: React.MouseEvent) {
    ptDown.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    isDragging.current = true;
  }
  function onMouseMove(e: React.MouseEvent) { if (isDragging.current) e.preventDefault(); }
  function onMouseUp(e: React.MouseEvent) {
    if (!isDragging.current) return;
    isDragging.current = false;
    handleGesture(e.clientX - ptDown.current.x, e.clientY - ptDown.current.y, Date.now() - ptDown.current.time);
  }
  // Debounced scroll-snap position → `current` index sync.
  function onFeedScroll() {
    const el = feedRef.current;
    if (!el) return;
    if (scrollTimer.current) clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => {
      const idx = Math.round(el.scrollTop / el.clientHeight);
      const clamped = Math.max(0, Math.min(idx, cards.length - 1));
      if (clamped !== current) {
        setCurrent(clamped);
        if (cards[clamped]) speak(cards[clamped].title, 'casual');
      }
    }, 80);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadFeed(); }, [feedKey]);

  // Mission score: lazily score the current video card against the user's
  // GPS action (cached server-side, so repeat views are free).
  useEffect(() => {
    const c = cards[current];
    if (!c?.media?.videoId || !c.actionContext || missionScores[c.id]) return;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch('/api/workshop/score-video', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({
            videoId: c.media!.videoId,
            videoTitle: c.title,
            actionTitle: c.actionContext!.actionTitle,
            actionDescription: c.actionContext!.actionDescription,
          }),
        });
        if (!res.ok) return;
        const data = await res.json();
        setMissionScores(prev => ({ ...prev, [c.id]: { score: data.score, label: data.label } }));
      } catch {}
    })();
  }, [current, cards]);

  async function loadFeed() {
    setLoading(true);
    const overrideCtx = selectedContextRef.current;
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // ── Goals first (newest-active = "primary"), so the rest of the feed
      // can be built around the sprint/action the user is currently on ──
      let goals: any[] = [];
      let actionContext: ActionContext | null = overrideCtx ?? null;
      let skipCounts: Map<string, number> = new Map();
      if (user) {
        const { data: skips } = await (supabase as any)
          .from('card_skips')
          .select('card_id, skip_count')
          .eq('user_id', user.id)
          .then((r: any) => r).catch(() => ({ data: [] }));
        (skips ?? []).forEach((s: any) => skipCounts.set(s.card_id, s.skip_count));

        const { data } = await (supabase as any)
          .from('goals')
          .select('id, title, description, category, progress_percentage, probability_score, action_level, gps_stage, goal_steps(status)')
          .eq('user_id', user.id).eq('status', 'active')
          .order('created_at', { ascending: false }).limit(5)
          .then((r: any) => r).catch(() => ({ data: [] }));
        goals = data ?? [];

        if (!overrideCtx) {
          // Prefer GPS-activated goals for action context and swipe target
          const primaryGoal = goals.find((g: any) => g.gps_stage === 'active') ?? goals[0];
          if (primaryGoal) {
            const { data: sp } = await (supabase as any)
              .from('sprints')
              .select('id, title, sprint_actions(id, title, description, completed, order_index)')
              .eq('goal_id', primaryGoal.id)
              .order('created_at', { ascending: true })
              .then((r: any) => r).catch(() => ({ data: [] }));

            let cur: { sprintNumber: number; sprintTitle: string; title: string; description?: string } | null = null;
            (sp ?? []).forEach((s: any, i: number) => {
              if (cur) return;
              const action = (s.sprint_actions ?? [])
                .slice().sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0))
                .find((a: any) => !a.completed);
              if (action) cur = { sprintNumber: i + 1, sprintTitle: s.title, title: action.title, description: action.description };
            });

            // Fallback: derive from goal_steps if no sprints exist yet
            if (!cur) {
              const { data: steps } = await (supabase as any)
                .from('goal_steps')
                .select('title, status, step_number, week_number, description')
                .eq('goal_id', primaryGoal.id).order('step_number', { ascending: true })
                .then((r: any) => r).catch(() => ({ data: [] }));
              const action = (steps ?? []).find((st: any) => st.status !== 'completed');
              if (action) cur = { sprintNumber: action.week_number ?? 1, sprintTitle: `Sprint ${action.week_number ?? 1}`, title: action.title, description: action.description };
            }

            if (cur) {
              actionContext = {
                goalId: primaryGoal.id, sprintNumber: cur.sprintNumber, sprintTitle: cur.sprintTitle,
                actionTitle: cur.title, actionDescription: cur.description,
              };
            }
          }
        }
      }

      if (user && goals.length) {
        setActiveGoals(goals);
        fetch('/api/sprints').then(r => r.ok ? r.json() : []).then(data => {
          if (!Array.isArray(data)) return;
          setActiveSprints(data.filter((s: any) => s.status === 'active'));
        }).catch(() => {});
      }

      // Studio videos: when the user has a current action, only pull videos
      // relevant to that action/category; otherwise show top-watched.
      const actionLevel = goals[0]?.action_level ?? 1;
      let studioQuery = (supabase as any).from('studio_videos')
        .select('id, title, description, category, video_url, thumbnail_url, duration_seconds, profiles!creator_id(username)')
        .eq('is_published', true);
      if (actionContext) {
        const kw = sanitizeForOr(actionContext.actionTitle.split(' ')[0]);
        const cat = sanitizeForOr(goals[0]?.category ?? '');
        if (kw || cat) studioQuery = studioQuery.or(`title.ilike.%${kw}%,category.ilike.%${cat}%`);
        // Format filter by action level: Wayfinder prefers >10min, Trailblazer prefers <8min
        if (actionLevel === 1) studioQuery = studioQuery.gt('duration_seconds', 600);
        else if (actionLevel === 3) studioQuery = studioQuery.lt('duration_seconds', 480);
      }

      const [templatesRes, videosRes, ytRes, curatedRes] = await Promise.all([
        (supabase as any).from('goal_templates')
          .select('id, title, description, estimated_weeks, clone_count, oowop_count, steps, profiles!creator_id(username, score_tier)')
          .eq('is_public', true).order('clone_count', { ascending: false }).limit(10)
          .then((r: any) => r).catch(() => ({ data: [] })),
        studioQuery.order('watch_count', { ascending: false }).limit(10)
          .then((r: any) => r).catch(() => ({ data: [] })),
        fetch('/api/gps/action-content', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(actionContext ? {
            goal_id: actionContext.goalId,
            goal_title: goals[0]?.title,
            goal_category: goals[0]?.category,
            action_title: actionContext.actionTitle,
            action_level: actionLevel,
          } : {}),
        }).then(r => r.ok ? r.json() : { feed: [] }).catch(() => ({ feed: [] })),
        // Curated feed: TikTok oEmbed + manually pinned YouTube
        fetch('/api/admin/curated-feed')
          .then(r => r.ok ? r.json() : { items: [] }).catch(() => ({ items: [] })),
      ]);

      const templates: any[] = templatesRes.data ?? [];
      const videos:    any[] = videosRes.data    ?? [];
      const curated:   any[] = curatedRes?.items  ?? [];

      const COLORS = ['#E8770A','#7C3AED','#059669','#D97706','#BE185D','#0D9488','#1877F2'];
      const goalCards: FeedCard[] = goals.map((g: any, i: number) => {
        const done = g.goal_steps?.filter((s: any) => s.status === 'completed').length ?? 0;
        const total = g.goal_steps?.length ?? 1;
        return { id: `goal-${g.id ?? i}`, type: 'goal', title: g.title, subtitle: `${done}/${total} steps · ${g.category ?? 'personal'}`, content: g.description ?? '', author: { username: 'You' }, color: COLORS[i % COLORS.length], accent: COLORS[i % COLORS.length], data: { goalId: g.id, progress: g.progress_percentage ?? 0, probability: g.probability_score ?? 0 } };
      });
      const templateCards: FeedCard[] = templates.map((t: any, i: number) => ({
        id: t.id, type: 'template', title: t.title, subtitle: `${t.estimated_weeks ?? 0}wk plan · ${t.clone_count ?? 0} clones`, content: t.description ?? '', author: { username: t.profiles?.username ?? 'villager', score_tier: t.profiles?.score_tier }, color: COLORS[(i + 2) % COLORS.length], accent: COLORS[(i + 2) % COLORS.length], data: { steps: t.steps ?? [] }, oowops: t.oowop_count ?? 0,
      }));
      const studioCards: FeedCard[] = videos.filter((v: any) => v.video_url || v.thumbnail_url).map((v: any) => {
        const rawId = v.video_url?.includes('v=') ? v.video_url.split('v=')[1]?.split('&')[0] : undefined;
        return {
          id: v.id, type: 'video', title: v.title, subtitle: v.category ?? 'Training', content: v.description ?? '',
          author: { username: v.profiles?.username ?? 'creator' }, media: { videoId: rawId, thumbnail: v.thumbnail_url },
          color: '#FF6B2B', accent: '#FF6B2B',
          ...(actionContext ? { actionContext } : {}),
        };
      });
      const ytCards: FeedCard[] = (ytRes?.feed ?? [])
        .filter((v: any) => v.source === 'youtube' && v.id && !String(v.id).startsWith('fb')).slice(0, 8)
        .map((v: any) => ({
          id: `yt-${v.id}`, type: 'video', title: v.title, subtitle: v.channel ?? 'YouTube', content: '',
          author: { username: v.channel ?? 'YouTube' }, media: { videoId: v.id, thumbnail: v.thumbnail },
          color: '#FF0000', accent: '#FF6B2B',
          ...(actionContext ? { actionContext } : {}),
        }));

      // Curated items: TikTok oEmbed cards + pinned YouTube — same video-first position as YT
      const curatedCards: FeedCard[] = curated.map((c: any) => {
        if (c.source_type === 'tiktok') {
          return {
            id: `tt-${c.id}`, type: 'tiktok' as CardType,
            title: c.title ?? 'TikTok', subtitle: c.author_name ?? 'TikTok Creator', content: '',
            author: { username: c.author_name ?? 'tiktok' },
            media: { embedHtml: c.embed_html, thumbnail: c.thumbnail_url },
            color: '#010101', accent: '#69C9D0',
            ...(actionContext ? { actionContext } : {}),
          };
        }
        // Pinned YouTube
        return {
          id: `cur-${c.id}`, type: 'video' as CardType,
          title: c.title ?? 'Video', subtitle: c.author_name ?? 'Curated', content: '',
          author: { username: c.author_name ?? 'curator' },
          media: { videoId: c.video_id, thumbnail: c.thumbnail_url },
          color: '#FF0000', accent: '#FF6B2B',
          ...(actionContext ? { actionContext } : {}),
        };
      });

      // When the user has a current action, action-matched content (YouTube
      // search results + relevant studio videos for that action) leads the
      // feed; curated/pinned content follows. Otherwise, studio content
      // leads as before, with the generic YouTube feed last.
      const matchedStudio = studioCards.filter(c => c.media?.videoId);
      const videoCards = actionContext
        ? [...ytCards, ...matchedStudio, ...curatedCards]
        : [...matchedStudio, ...curatedCards, ...ytCards];
      const nonVideoCards = [...goalCards, ...templateCards, ...studioCards.filter(c => !c.media?.videoId)];
      const guideCard: FeedCard = { id: 'guide', type: 'guide', title: 'How to use the Workshop', subtitle: 'Start with your Goal GPS', content: '', author: { username: 'Spirit' }, color: '#7C3AED', accent: '#7C3AED' };
      const shuffled: FeedCard[] = videoCards.length > 0 ? [...videoCards, ...nonVideoCards] : goals.length ? [...nonVideoCards, guideCard] : [guideCard, ...nonVideoCards];

      // Skip signal (WORKSHOP_SPEC §5.3): hide cards skipped 3+ times,
      // and randomly drop cards skipped 1-2 times (~30% chance per skip).
      const filtered = shuffled.filter(c => {
        const skips = skipCounts.get(c.id) ?? 0;
        if (skips >= 3) return false;
        if (skips > 0 && Math.random() < skips * 0.3) return false;
        return true;
      });
      const finalCards = filtered.length > 0 ? filtered : shuffled;

      setCards(finalCards);
      if (finalCards[0]) speak(finalCards[0].title, 'casual');
    } catch {
      setCards([{ id: 'guide', type: 'guide', title: 'How to use the Workshop', subtitle: 'Start with your Goal GPS', content: '', author: { username: 'Spirit' }, color: '#7C3AED', accent: '#7C3AED' }]);
    } finally { setLoading(false); }
  }

  async function handleOoWop(cardId: string) {
    if (owopped.has(cardId)) {
      setOwopped(prev => { const n = new Set(prev); n.delete(cardId); return n; });
      setCards(prev => prev.map(c => c.id === cardId ? { ...c, oowops: Math.max(0, (c.oowops ?? 1) - 1) } : c));
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setOwopped(prev => { const n = new Set(prev); n.add(cardId); return n; });
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, oowops: (c.oowops ?? 0) + 1 } : c));
    setShowFist(true);
    setTimeout(() => setShowFist(false), 800);
    fetch('/api/vlg/earn', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason: 'oowop_earned', amount: 1, source_id: cardId }) }).catch(() => {});
  }

  function handleSave(cardId: string) {
    setSaved(prev => { const n = new Set(prev); if (n.has(cardId)) n.delete(cardId); else n.add(cardId); return n; });
  }

  function handleSkip(cardId: string) {
    setTimeout(() => setCurrent(c => Math.min(c + 1, cards.length - 1)), 300);
    fetch('/api/workshop/skip', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId }),
    }).catch(() => {});
  }

  if (loading) {
    return (
      <div style={{ background: '#080E24', minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <video autoPlay muted loop playsInline style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 24 }} src="/loading.mp4" />
        <p style={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em' }}>WORKSHOP</p>
      </div>
    );
  }

  // ── Shared header (floats transparently over all tabs) ─────────────────────
  const safeTop = 'max(44px, env(safe-area-inset-top, 44px))';

  return (
    <div style={{ background: '#080E24', minHeight: '100dvh' }}>
      {/* Floating header */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 30, background: 'transparent' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `calc(${safeTop} + 6px) 12px 4px`,
          opacity: !uiVisible && !showSelector ? 0 : 1,
          pointerEvents: !uiVisible && !showSelector ? 'none' : 'auto',
          transition: 'opacity 0.5s ease',
        }}>
          {/* Target button — opens goal/sprint/action selector */}
          <motion.button
            onClick={() => setShowSelector(true)}
            animate={isGoalAligned ? { scale: [1, 1.18, 1] } : {}}
            transition={isGoalAligned ? { repeat: Infinity, duration: 1.8, ease: 'easeInOut' } : {}}
            style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', border: isGoalAligned ? '1.5px solid rgba(77,114,255,0.7)' : '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.2} strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2" fill="white" stroke="none"/>
            </svg>
          </motion.button>
          <ActionSelectorSheet
            open={showSelector}
            onClose={() => setShowSelector(false)}
            onSelect={ctx => {
              selectedContextRef.current = ctx;
              setSelectedContext(ctx);
              setCurrent(0);
              setFeedKey(k => k + 1);
            }}
          />

          {/* Notification bell */}
          <Link href="/village/notifications"
            style={{ width: 34, height: 34, borderRadius: 17, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', flexShrink: 0 }}>
            <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={1.8} strokeLinecap="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
          </Link>
        </div>

        {/* Goals | Workshop | GPS tab bar */}
        <div style={{ padding: '0 12px' }}>
          <WorkshopTabBar active="Workshop" gpsHref={gpsHref} underlineColor="#4D72FF" />
        </div>
      </div>

      {/* ── WORKSHOP TAB — full-screen TikTok feed ───────────────────────────── */}
      {tab === 'Workshop' && (
        <div
          ref={feedRef}
          style={{ position: 'fixed', inset: 0, zIndex: 1, background: '#000', overflowY: 'scroll', scrollSnapType: 'y mandatory', WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', cursor: isDragging.current ? 'grabbing' : 'default' }}
          onScroll={onFeedScroll}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={() => { isDragging.current = false; }}
        >
          {/* Cards — all rendered, snapped one-per-screen */}
          {cards.map((c, i) => (
            <div key={c.id} style={{ position: 'relative', height: '100dvh', scrollSnapAlign: 'start', scrollSnapStop: 'always', overflow: 'hidden' }}>
              {c.type === 'video'    && <VideoCard card={c} iframeRef={iframeRef} isPaused={i === current && isPaused} isActive={i === current} />}
              {c.type === 'tiktok'   && <TikTokFeedCard embedHtml={c.media?.embedHtml ?? ''} thumbnail={c.media?.thumbnail ?? ''} isActive={i === current} title={c.title} author={c.author.username} />}
              {c.type === 'template' && <TemplateCard card={c} />}
              {c.type === 'goal'     && <GoalCard card={c} />}
              {c.type === 'guide'    && <GuideCard />}

              {/* Bottom gradient (video + tiktok, auto-hides) — active card only */}
              {i === current && (c.type === 'video' || c.type === 'tiktok') && (
                <div className="absolute inset-x-0 bottom-0 pointer-events-none"
                  style={{ height: '50%', background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)', opacity: uiVisible ? 1 : 0, transition: 'opacity 0.5s ease' }} />
              )}

              {/* Bottom text info (video + tiktok, auto-hides) — active card only */}
              {i === current && (c.type === 'video' || c.type === 'tiktok') && (
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 72, padding: '0 16px 110px', zIndex: 10, opacity: uiVisible ? 1 : 0, transition: 'opacity 0.5s ease', pointerEvents: 'none' }}>
                  {/* Action context banner — card's own context, or manually selected context */}
                  {(c.actionContext || selectedContext) && (() => {
                    const ctx = c.actionContext ?? selectedContext!;
                    return (
                      <Link href={`/village/workshop/gps/${ctx.goalId}`}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 20, fontSize: 10, fontWeight: 900, marginBottom: 6, background: selectedContext && !c.actionContext ? 'rgba(239,159,39,0.22)' : 'rgba(77,114,255,0.22)', color: selectedContext && !c.actionContext ? '#FCD34D' : '#AFC0FF', border: `1px solid ${selectedContext && !c.actionContext ? 'rgba(239,159,39,0.5)' : 'rgba(77,114,255,0.5)'}`, pointerEvents: 'auto', width: 'fit-content', textDecoration: 'none' }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>
                          Sprint {ctx.sprintNumber} · {ctx.actionTitle}
                        </span>
                      </Link>
                    );
                  })()}
                  {/* Mission score pill — how well this video matches the current action (Claude-scored, cached) */}
                  {missionScores[c.id]?.label && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20,
                      fontSize: 10, fontWeight: 900, marginBottom: 6,
                      background: missionScores[c.id].label === 'green' ? 'rgba(16,185,129,0.22)' : 'rgba(217,119,6,0.22)',
                      color: missionScores[c.id].label === 'green' ? '#6EE7B7' : '#FCD34D',
                      border: `1px solid ${missionScores[c.id].label === 'green' ? 'rgba(16,185,129,0.5)' : 'rgba(217,119,6,0.5)'}`,
                    }}>
                      <span>{missionScores[c.id].label === 'green' ? '✓' : '~'}</span>
                      <span>{missionScores[c.id].score}% mission match</span>
                    </span>
                  )}
                  <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 900, marginBottom: 6, background: 'rgba(83,74,183,0.3)', color: '#AFA9EC', border: '1px solid rgba(83,74,183,0.5)' }}>
                    {c.subtitle || 'Training'}
                  </span>
                  <h2 style={{ fontSize: 16, fontWeight: 900, color: '#fff', lineHeight: 1.3, margin: '0 0 4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.title}</h2>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: 0 }}>@{c.author.username}</p>
                </div>
              )}
            </div>
          ))}

          {/* Pause/play indicator */}
          <AnimatePresence>
            {showPauseInd && (
              <motion.div initial={{ opacity: 1, scale: 0.7 }} animate={{ opacity: 0, scale: 1.1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}
                style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 30 }}>
                <div style={{ width: 72, height: 72, borderRadius: 36, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isPaused ? <PauseSvg /> : <PlaySvg />}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Fist OoWop fly-up */}
          <FistAnimation show={showFist} />

          {/* Side actions (video + template cards) */}
          {card && card.type !== 'goal' && card.type !== 'guide' && (
            <SideActions
              card={card}
              onOoWop={() => handleOoWop(card.id)}
              owopped={owopped.has(card.id)}
              oowopCount={(card.oowops ?? 0) + (owopped.has(card.id) ? 1 : 0)}
              onComment={() => setShowComments(true)}
              onMore={() => setShowMore(true)}
              onSave={() => handleSave(card.id)}
              saved={saved.has(card.id)}
              onSkip={() => handleSkip(card.id)}
              uiVisible={uiVisible}
            />
          )}

          {/* Progress dots */}
          <div style={{ position: 'fixed', right: 3, top: '50%', transform: 'translateY(-50%)', zIndex: 30, display: 'flex', flexDirection: 'column', gap: 5 }}>
            {cards.slice(0, 10).map((_, i) => (
              <div key={i} style={{ borderRadius: 3, width: 3, height: i === current ? 20 : 6, background: i === current ? '#E8770A' : 'rgba(255,255,255,0.22)', transition: 'height 0.2s' }} />
            ))}
          </div>

          {/* Swipe-up hint */}
          {current === 0 && cards.length > 1 && (
            <motion.div style={{ position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)', zIndex: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}
              initial={{ opacity: 0 }} animate={{ opacity: 1, y: [0, -8, 0] }} transition={{ delay: 2.5, duration: 1.4, repeat: 3 }}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="rgba(255,255,255,0.35)"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6 1.41 1.41z"/></svg>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Swipe up</p>
            </motion.div>
          )}
        </div>
      )}

      {/* Drawers */}
      {card && <CommentsDrawer open={showComments} onClose={() => setShowComments(false)} card={card} onOoWop={() => handleOoWop(card.id)} owopped={owopped.has(card.id)} />}
      {card && <MoreDrawer open={showMore} onClose={() => setShowMore(false)} card={card} onSkip={() => handleSkip(card.id)} />}
    </div>
  );
}
