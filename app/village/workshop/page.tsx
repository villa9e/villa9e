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
interface FeedCard {
  id: string; type: CardType; title: string; subtitle: string; content: string;
  author: { username: string; avatar?: string; avatar_url?: string; score_tier?: string };
  media?: { videoId?: string; thumbnail?: string; url?: string; embedHtml?: string };
  color: string; accent: string; data?: any; oowops?: number;
}
interface Comment {
  id: string; username: string; avatar?: string;
  text: string; isOoWop: boolean; timestamp: string;
}

// ── Icons ────────────────────────────────────────────────────────────────────
const ShareSvg  = () => <svg width={22} height={22} viewBox="0 0 24 24" fill="white"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/></svg>;
const SaveSvg   = ({ active }: { active?: boolean }) => <svg width={22} height={22} viewBox="0 0 24 24" fill={active ? 'white' : 'none'} stroke="white" strokeWidth={2} strokeLinecap="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>;
const CommentSvg = () => <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>;
const MoreSvg   = () => <svg width={22} height={22} viewBox="0 0 24 24" fill="white"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>;
const PlaySvg   = () => <svg width={36} height={36} viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>;
const PauseSvg  = () => <svg width={36} height={36} viewBox="0 0 24 24" fill="white"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>;

// ── Comments Drawer ──────────────────────────────────────────────────────────
function CommentsDrawer({ open, onClose, card, onOoWop, owopped }: {
  open: boolean; onClose: () => void; card: FeedCard; onOoWop: () => void; owopped: boolean;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 200);
  }, [open, comments.length]);

  function submit() {
    if (!input.trim()) return;
    setComments(prev => [...prev, {
      id: Date.now().toString(), username: 'you', text: input.trim(),
      isOoWop: false, timestamp: 'just now',
    }]);
    setInput('');
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
              borderRadius: '24px 24px 0 0', maxHeight: '78vh', display: 'flex', flexDirection: 'column' }}
          >
            {/* Handle + header */}
            <div style={{ padding: '10px 16px 10px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
              <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.18)', borderRadius: 2, margin: '0 auto 10px' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 15, fontWeight: 900, color: '#fff' }}>
                  Comments · {comments.length}
                </span>
                <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%', width: 30, height: 30, color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              </div>
            </div>

            {/* Feed */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 18 }}>
              {comments.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
                  No comments yet — be the first!
                </div>
              )}
              {comments.map(c => (
                <div key={c.id} style={{ display: 'flex', gap: 10 }}>
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

function MoreDrawer({ open, onClose, card }: { open: boolean; onClose: () => void; card: FeedCard }) {
  const FAKE_USERS = ['Alex','Jordan','Sam','Morgan','Taylor','Casey','Riley','Drew','Chris','Avery','Blake','Quinn'];
  const COLORS = ['#7C3AED','#1D9E75','#E8770A','#1877F2','#D4537E','#0D9488','#BE185D','#D97706'];

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
                  {FAKE_USERS.map((name, i) => (
                    <motion.button whileTap={{ scale: 0.9 }} key={name}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', width: 56 }}>
                      <div style={{ width: 52, height: 52, borderRadius: 26, background: COLORS[i % COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{name[0]}</span>
                      </div>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: 700, textAlign: 'center' }}>{name}</span>
                    </motion.button>
                  ))}
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
                    <motion.button whileTap={{ scale: 0.9 }} key={opt.label} onClick={onClose}
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
function VideoCard({ card, iframeRef, isPaused }: {
  card: FeedCard;
  iframeRef: React.RefObject<HTMLIFrameElement>;
  isPaused: boolean;
}) {
  const thumb = card.media?.thumbnail ||
    (card.media?.videoId ? `https://img.youtube.com/vi/${card.media.videoId}/maxresdefault.jpg` : null);

  return (
    <div className="absolute inset-0" style={{ background: '#000' }}>
      {card.media?.videoId ? (
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
function SideActions({ card, onOoWop, owopped, oowopCount, onComment, onMore, onSave, saved, uiVisible }: {
  card: FeedCard; onOoWop: () => void; owopped: boolean; oowopCount: number;
  onComment: () => void; onMore: () => void; onSave: () => void; saved: boolean; uiVisible: boolean;
}) {
  const AVATAR_COLORS = ['#7C3AED','#1D9E75','#E8770A','#1877F2','#D4537E'];
  const username = card.author.username || '?';
  const avatarColor = AVATAR_COLORS[username.charCodeAt(0) % AVATAR_COLORS.length];

  return (
    <div style={{
      position: 'absolute', right: 6, bottom: 100,
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
    </div>
  );
}

// ── Goal Popup ────────────────────────────────────────────────────────────────
function GoalPopup({ open, onClose, activeGoal, isGeneral }: {
  open: boolean; onClose: () => void;
  activeGoal?: { id: string; title: string; probability_score?: number } | null;
  isGeneral: boolean;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.88, y: -8 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          style={{
            position: 'fixed', top: 'max(80px, calc(env(safe-area-inset-top, 48px) + 56px))', left: 12, zIndex: 50,
            background: 'rgba(8,10,28,0.96)', backdropFilter: 'blur(24px)',
            borderRadius: 16, padding: '14px 16px', width: 220,
            border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
          }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <p style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.08em', margin: 0 }}>
              {activeGoal ? 'ACTIVE GOAL' : 'CONTENT CATEGORY'}
            </p>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>
          </div>

          {activeGoal ? (
            <>
              <Link href={`/village/workshop/gps/${activeGoal.id}`} onClick={onClose}
                style={{ color: '#fff', fontWeight: 800, fontSize: 13, textDecoration: 'none', display: 'block', lineHeight: 1.4, marginBottom: 8 }}>
                {activeGoal.title} <span style={{ color: '#4D72FF' }}>→</span>
              </Link>
              {(activeGoal.probability_score ?? 0) > 0 && (
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)', margin: '0 0 10px' }}>
                  {activeGoal.probability_score}% GPS probability
                </p>
              )}
            </>
          ) : (
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', margin: '0 0 10px', lineHeight: 1.5 }}>
              Showing motivational, spiritual, wealth & coaching content.
            </p>
          )}

          <Link href="/village/workshop/chat" onClick={onClose}
            style={{ display: 'block', background: '#4D72FF', color: '#fff', borderRadius: 10, padding: '9px 12px', fontSize: 12, fontWeight: 900, textDecoration: 'none', textAlign: 'center' }}>
            + New Goal
          </Link>
        </motion.div>
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
          initial={{ opacity: 1, scale: 0.7, y: 0 }}
          animate={{ opacity: 0, scale: 2, y: -200 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.65, ease: 'easeOut' }}
          style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none', zIndex: 50 }}>
          <OoWopIcon size={48} />
        </motion.div>
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
  const [cards,         setCards]         = useState<FeedCard[]>([]);
  const [current,       setCurrent]       = useState(0);
  const [owopped,       setOwopped]       = useState<Set<string>>(new Set());
  const [saved,         setSaved]         = useState<Set<string>>(new Set());
  const [showFist,      setShowFist]      = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [activeGoals,   setActiveGoals]   = useState<any[]>([]);
  const [activeSprints, setActiveSprints] = useState<any[]>([]);
  const [uiVisible,     setUiVisible]     = useState(true);
  const [isPaused,      setIsPaused]      = useState(false);
  const [showPauseInd,  setShowPauseInd]  = useState(false);
  const [showComments,  setShowComments]  = useState(false);
  const [showMore,      setShowMore]      = useState(false);
  const [showGoalPopup, setShowGoalPopup] = useState(false);

  const iframeRef  = useRef<HTMLIFrameElement>(null);
  const uiTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tapCount   = useRef(0);
  const tapTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ptDown     = useRef({ x: 0, y: 0, time: 0 });
  const isDragging = useRef(false);

  const hasGoals = activeGoals.length > 0;
  const card = cards[current];
  const isGoalAligned = hasGoals && card?.type === 'video';
  const gpsHref = activeGoals[0] ? `/village/workshop/gps/${activeGoals[0].id}` : '/village/workshop/gps';

  // Auto-hide UI after 3s on card change
  useEffect(() => {
    triggerUIShow();
    setIsPaused(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      if (dx > 0) router.push('/village/workshop/chat'); // swipe right → Goals
      else router.push(gpsHref); // swipe left → GPS
      triggerUIShow();
      return;
    }

    // Vertical swipe → content navigation (Workshop only)
    if (tab !== 'Workshop') return;
    if (Math.abs(dy) > 55) {
      if (dy < 0 && current < cards.length - 1) {
        const next = current + 1;
        setCurrent(next);
        if (cards[next]) speak(cards[next].title, 'casual');
      }
      if (dy > 0 && current > 0) {
        const prev = current - 1;
        setCurrent(prev);
        if (cards[prev]) speak(cards[prev].title, 'casual');
      }
    }
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
  function onWheel(e: React.WheelEvent) {
    if (tab !== 'Workshop') return;
    if (e.deltaY > 50 && current < cards.length - 1) setCurrent(c => c + 1);
    if (e.deltaY < -50 && current > 0) setCurrent(c => c - 1);
  }

  useEffect(() => { loadFeed(); }, []);

  async function loadFeed() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const [templatesRes, goalsRes, videosRes, ytRes, curatedRes] = await Promise.all([
        (supabase as any).from('goal_templates')
          .select('id, title, description, estimated_weeks, clone_count, oowop_count, steps, profiles!creator_id(username, score_tier)')
          .eq('is_public', true).order('clone_count', { ascending: false }).limit(10)
          .then((r: any) => r).catch(() => ({ data: [] })),
        user
          ? (supabase as any).from('goals')
              .select('id, title, description, category, progress_percentage, probability_score, goal_steps(status)')
              .eq('user_id', user.id).eq('status', 'active').limit(5)
              .then((r: any) => r).catch(() => ({ data: [] }))
          : Promise.resolve({ data: [] }),
        (supabase as any).from('studio_videos')
          .select('id, title, description, category, video_url, thumbnail_url, profiles!creator_id(username)')
          .eq('is_published', true).order('watch_count', { ascending: false }).limit(10)
          .then((r: any) => r).catch(() => ({ data: [] })),
        fetch('/api/gps/action-content', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}),
        }).then(r => r.ok ? r.json() : { feed: [] }).catch(() => ({ feed: [] })),
        // Curated feed: TikTok oEmbed + manually pinned YouTube
        fetch('/api/admin/curated-feed')
          .then(r => r.ok ? r.json() : { items: [] }).catch(() => ({ items: [] })),
      ]);

      const templates: any[] = templatesRes.data ?? [];
      const goals:     any[] = goalsRes.data     ?? [];
      const videos:    any[] = videosRes.data    ?? [];
      const curated:   any[] = curatedRes?.items  ?? [];

      if (user && goals.length) {
        setActiveGoals(goals);
        fetch('/api/sprints').then(r => r.ok ? r.json() : []).then(data => {
          if (!Array.isArray(data)) return;
          setActiveSprints(data.filter((s: any) => s.status === 'active'));
        }).catch(() => {});
      }

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
        return { id: v.id, type: 'video', title: v.title, subtitle: v.category ?? 'Training', content: v.description ?? '', author: { username: v.profiles?.username ?? 'creator' }, media: { videoId: rawId, thumbnail: v.thumbnail_url }, color: '#FF6B2B', accent: '#FF6B2B' };
      });
      const ytCards: FeedCard[] = (ytRes?.feed ?? [])
        .filter((v: any) => v.id && !v.id.startsWith('fb')).slice(0, 8)
        .map((v: any) => ({ id: `yt-${v.id}`, type: 'video', title: v.title, subtitle: v.channel ?? 'YouTube', content: '', author: { username: v.channel ?? 'YouTube' }, media: { videoId: v.id, thumbnail: v.thumbnail }, color: '#FF0000', accent: '#FF6B2B' }));

      // Curated items: TikTok oEmbed cards + pinned YouTube — same video-first position as YT
      const curatedCards: FeedCard[] = curated.map((c: any) => {
        if (c.source_type === 'tiktok') {
          return {
            id: `tt-${c.id}`, type: 'tiktok' as CardType,
            title: c.title ?? 'TikTok', subtitle: c.author_name ?? 'TikTok Creator', content: '',
            author: { username: c.author_name ?? 'tiktok' },
            media: { embedHtml: c.embed_html, thumbnail: c.thumbnail_url },
            color: '#010101', accent: '#69C9D0',
          };
        }
        // Pinned YouTube
        return {
          id: `cur-${c.id}`, type: 'video' as CardType,
          title: c.title ?? 'Video', subtitle: c.author_name ?? 'Curated', content: '',
          author: { username: c.author_name ?? 'curator' },
          media: { videoId: c.video_id, thumbnail: c.thumbnail_url },
          color: '#FF0000', accent: '#FF6B2B',
        };
      });

      // All video-type cards go first (YouTube + TikTok + studio), sorted for variety
      const videoCards    = [...studioCards.filter(c => c.media?.videoId), ...curatedCards, ...ytCards];
      const nonVideoCards = [...goalCards, ...templateCards, ...studioCards.filter(c => !c.media?.videoId)];
      const guideCard: FeedCard = { id: 'guide', type: 'guide', title: 'How to use the Workshop', subtitle: 'Start with your Goal GPS', content: '', author: { username: 'Spirit' }, color: '#7C3AED', accent: '#7C3AED' };
      const shuffled: FeedCard[] = videoCards.length > 0 ? [...videoCards, ...nonVideoCards] : goals.length ? [...nonVideoCards, guideCard] : [guideCard, ...nonVideoCards];
      setCards(shuffled);
      if (shuffled[0]) speak(shuffled[0].title, 'casual');
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
          opacity: !uiVisible && !showGoalPopup ? 0 : 1,
          pointerEvents: !uiVisible && !showGoalPopup ? 'none' : 'auto',
          transition: 'opacity 0.5s ease',
        }}>
          {/* Dual-function target button (content type / goal alignment) */}
          <div style={{ position: 'relative' }}>
            <motion.button
              onClick={() => setShowGoalPopup(p => !p)}
              animate={isGoalAligned ? { scale: [1, 1.18, 1] } : {}}
              transition={isGoalAligned ? { repeat: Infinity, duration: 1.8, ease: 'easeInOut' } : {}}
              style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', border: isGoalAligned ? '1.5px solid rgba(77,114,255,0.7)' : '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.2} strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2" fill="white" stroke="none"/>
              </svg>
            </motion.button>
            <GoalPopup open={showGoalPopup} onClose={() => setShowGoalPopup(false)}
              activeGoal={activeGoals[0] ? { id: activeGoals[0].id, title: activeGoals[0].title, probability_score: activeGoals[0].probability_score } : null}
              isGeneral={!hasGoals} />
          </div>

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
          style={{ position: 'fixed', inset: 0, zIndex: 1, background: '#000', overflow: 'hidden', touchAction: 'none', cursor: isDragging.current ? 'grabbing' : 'default' }}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onWheel={onWheel}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={() => { isDragging.current = false; }}
        >
          {/* Card */}
          <AnimatePresence mode="wait">
            <motion.div key={card?.id}
              initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '-100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="absolute inset-0">

              {card?.type === 'video'    && <VideoCard card={card} iframeRef={iframeRef} isPaused={isPaused} />}
              {card?.type === 'tiktok'   && <TikTokFeedCard embedHtml={card.media?.embedHtml ?? ''} thumbnail={card.media?.thumbnail ?? ''} isActive={true} title={card.title} author={card.author.username} />}
              {card?.type === 'template' && <TemplateCard card={card} />}
              {card?.type === 'goal'     && <GoalCard card={card} />}
              {card?.type === 'guide'    && <GuideCard />}

              {/* Bottom gradient (video + tiktok, auto-hides) */}
              {(card?.type === 'video' || card?.type === 'tiktok') && (
                <div className="absolute inset-x-0 bottom-0 pointer-events-none"
                  style={{ height: '50%', background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)', opacity: uiVisible ? 1 : 0, transition: 'opacity 0.5s ease' }} />
              )}

              {/* Bottom text info (video + tiktok, auto-hides) */}
              {(card?.type === 'video' || card?.type === 'tiktok') && (
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 72, padding: '0 16px 110px', zIndex: 10, opacity: uiVisible ? 1 : 0, transition: 'opacity 0.5s ease', pointerEvents: 'none' }}>
                  <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 900, marginBottom: 6, background: 'rgba(83,74,183,0.3)', color: '#AFA9EC', border: '1px solid rgba(83,74,183,0.5)' }}>
                    {card.subtitle || 'Training'}
                  </span>
                  <h2 style={{ fontSize: 16, fontWeight: 900, color: '#fff', lineHeight: 1.3, margin: '0 0 4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{card.title}</h2>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: 0 }}>@{card.author.username}</p>
                </div>
              )}

              {/* Pause/play indicator */}
              <AnimatePresence>
                {showPauseInd && (
                  <motion.div initial={{ opacity: 1, scale: 0.7 }} animate={{ opacity: 0, scale: 1.1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}
                    style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 30 }}>
                    <div style={{ width: 72, height: 72, borderRadius: 36, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isPaused ? <PauseSvg /> : <PlaySvg />}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Fist OoWop fly-up */}
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 40 }}>
                <FistAnimation show={showFist} />
              </div>

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
                  uiVisible={uiVisible}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Progress dots */}
          <div style={{ position: 'absolute', right: 3, top: '50%', transform: 'translateY(-50%)', zIndex: 30, display: 'flex', flexDirection: 'column', gap: 5 }}>
            {cards.slice(0, 10).map((_, i) => (
              <div key={i} style={{ borderRadius: 3, width: 3, height: i === current ? 20 : 6, background: i === current ? '#E8770A' : 'rgba(255,255,255,0.22)', transition: 'height 0.2s' }} />
            ))}
          </div>

          {/* Swipe-up hint */}
          {current === 0 && cards.length > 1 && (
            <motion.div style={{ position: 'absolute', bottom: 90, left: '50%', transform: 'translateX(-50%)', zIndex: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}
              initial={{ opacity: 0 }} animate={{ opacity: 1, y: [0, -8, 0] }} transition={{ delay: 2.5, duration: 1.4, repeat: 3 }}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="rgba(255,255,255,0.35)"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6 1.41 1.41z"/></svg>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Swipe up</p>
            </motion.div>
          )}
        </div>
      )}

      {/* Drawers */}
      {card && <CommentsDrawer open={showComments} onClose={() => setShowComments(false)} card={card} onOoWop={() => handleOoWop(card.id)} owopped={owopped.has(card.id)} />}
      {card && <MoreDrawer open={showMore} onClose={() => setShowMore(false)} card={card} />}
    </div>
  );
}
