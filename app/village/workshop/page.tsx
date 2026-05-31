'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { useSpiritVoice } from '@/components/village/SpiritVoiceProvider';

// ── Card types ────────────────────────────────────────────────────────────────
type CardType = 'template' | 'video' | 'sprint' | 'achievement' | 'goal' | 'guide';

interface FeedCard {
  id:       string;
  type:     CardType;
  title:    string;
  subtitle: string;
  content:  string;
  author:   { username: string; avatar?: string; score_tier?: string };
  media?:   { videoId?: string; thumbnail?: string; url?: string };
  color:    string;
  accent:   string;
  data?:    any;
  oowops?:  number;
}

// ── Icon SVGs (monotone) ─────────────────────────────────────────────────────
const HeartSvg    = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>;
const OoWopSvg    = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>;
const ShareSvg    = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/></svg>;
const PlaySvg     = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>;

// ── Card components ───────────────────────────────────────────────────────────
function TemplateCard({ card, onOoWop, owopped }: { card: FeedCard; onOoWop: () => void; owopped: boolean }) {
  const steps = card.data?.steps ?? [];
  return (
    <div className="absolute inset-0 flex flex-col" style={{ background: `linear-gradient(160deg, ${card.color}22, #06080E 60%)` }}>
      {/* Gradient overlay */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 55%)' }} />

      {/* Header badge */}
      <div className="relative z-10 px-5 pt-14 flex items-center gap-2">
        <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: card.accent + '33', color: card.accent, border: `1px solid ${card.accent}55` }}>
          📋 Goal Template
        </span>
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{steps.length} steps</span>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-end px-5 pb-28">
        <h2 className="text-2xl font-black text-white leading-tight mb-2">{card.title}</h2>
        <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.6)' }}>{card.subtitle}</p>

        {/* First 3 steps preview */}
        <div className="space-y-2 mb-4">
          {steps.slice(0, 3).map((s: any, i: number) => (
            <div key={i} className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                style={{ background: card.accent + '33', color: card.accent }}>{i + 1}</div>
              {s.title}
            </div>
          ))}
          {steps.length > 3 && <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>+{steps.length - 3} more steps</p>}
        </div>

        {/* Clone button */}
        <Link href={`/village/workshop/chat?template=${card.id}`}
          className="w-full py-3.5 rounded-2xl text-sm font-black text-white text-center"
          style={{ background: `linear-gradient(135deg, ${card.accent}, #1877F2)`, boxShadow: `0 4px 20px ${card.accent}55` }}>
          Clone This Plan
        </Link>
      </div>
    </div>
  );
}

function VideoCard({ card, onOoWop, owopped }: { card: FeedCard; onOoWop: () => void; owopped: boolean }) {
  const [playing, setPlaying] = useState(false);
  const { speak } = useSpiritVoice();
  const thumb = card.media?.thumbnail || `https://img.youtube.com/vi/${card.media?.videoId}/maxresdefault.jpg`;

  return (
    <div className="absolute inset-0 flex flex-col" style={{ background: '#000' }}>
      {/* Video / thumbnail */}
      <div className="flex-1 relative">
        {playing && card.media?.videoId ? (
          <iframe
            src={`https://www.youtube.com/embed/${card.media.videoId}?autoplay=1&controls=1`}
            className="absolute inset-0 w-full h-full"
            allow="autoplay; fullscreen"
            allowFullScreen
          />
        ) : (
          <>
            {thumb && <img src={thumb} alt={card.title} className="absolute inset-0 w-full h-full object-cover" />}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 100%)' }} />
            <button onClick={() => { setPlaying(true); speak(card.title, 'casual'); }}
              className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(8px)' }}>
                <PlaySvg />
              </div>
            </button>
          </>
        )}
      </div>

      {/* Info overlay */}
      <div className="absolute bottom-0 left-0 right-0 px-5 pb-28">
        <span className="px-3 py-1 rounded-full text-xs font-bold mb-2 inline-block" style={{ background: 'rgba(255,107,43,0.25)', color: '#FF6B2B', border: '1px solid rgba(255,107,43,0.4)' }}>
          🎬 Training
        </span>
        <h2 className="text-xl font-black text-white leading-tight mt-1">{card.title}</h2>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>{card.subtitle}</p>
      </div>
    </div>
  );
}

function GoalCard({ card }: { card: FeedCard }) {
  const progress = card.data?.progress ?? 0;
  const probability = card.data?.probability ?? 0;
  return (
    <div className="absolute inset-0 flex flex-col" style={{ background: `linear-gradient(160deg, ${card.color}18, #06080E 70%)` }}>
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 50%)' }} />

      <div className="relative z-10 flex-1 flex flex-col justify-end px-5 pb-28">
        <span className="px-3 py-1 rounded-full text-xs font-bold mb-3 inline-block" style={{ background: `${card.accent}22`, color: card.accent, border: `1px solid ${card.accent}44` }}>
          🎯 Active Goal
        </span>
        <h2 className="text-2xl font-black text-white leading-tight mb-2">{card.title}</h2>
        <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>{card.subtitle}</p>

        {/* Progress bar */}
        <div className="rounded-full overflow-hidden mb-2" style={{ background: 'rgba(255,255,255,0.1)', height: 6 }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: card.accent }} />
        </div>
        <div className="flex justify-between text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
          <span>{progress}% complete</span>
          <span>{probability}% probability</span>
        </div>
      </div>
    </div>
  );
}

// ── Sidebar action buttons ─────────────────────────────────────────────────────
function SideActions({ card, onOoWop, owopped, oowopCount }: {
  card: FeedCard; onOoWop: () => void; owopped: boolean; oowopCount: number;
}) {
  const BUTTONS = [
    { icon: <HeartSvg />, label: oowopCount.toString(), action: onOoWop, active: owopped, color: owopped ? '#FF6B2B' : 'white' },
    { icon: <OoWopSvg />, label: 'OoWop', action: onOoWop, active: owopped, color: owopped ? '#FFD700' : 'white' },
    { icon: <ShareSvg />, label: 'Share', action: () => { if (navigator.share) navigator.share({ title: card.title, url: window.location.href }); }, active: false, color: 'white' },
  ];
  return (
    <div className="absolute right-4 bottom-36 flex flex-col items-center gap-6 z-20">
      {BUTTONS.map((btn, i) => (
        <motion.button key={i} whileTap={{ scale: 0.85 }} onClick={btn.action}
          className="flex flex-col items-center gap-1.5">
          <div className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', color: btn.color }}>
            {btn.icon}
          </div>
          <span className="text-[11px] font-bold" style={{ color: 'rgba(255,255,255,0.7)' }}>{btn.label}</span>
        </motion.button>
      ))}
    </div>
  );
}

// ── Author bar ─────────────────────────────────────────────────────────────────
function AuthorBar({ card }: { card: FeedCard }) {
  return (
    <div className="absolute bottom-20 left-5 right-20 z-20 flex items-center gap-2.5">
      <div className="w-10 h-10 rounded-full flex items-center justify-center text-base font-black flex-shrink-0"
        style={{ background: card.color, border: '2px solid white' }}>
        {card.author.username?.[0]?.toUpperCase() || '?'}
      </div>
      <div>
        <p className="text-sm font-bold text-white">@{card.author.username}</p>
        {card.author.score_tier && (
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{card.author.score_tier}</p>
        )}
      </div>
    </div>
  );
}

// ── Guide card — shown when user has no goals ─────────────────────────────────
function GuideCard() {
  const STEPS = [
    { n: 1, icon: '🌀', title: 'Open Spirit', desc: 'Tap "New Goal" above. Spirit will ask you questions to understand your goal.' },
    { n: 2, icon: '🗺️', title: 'Build Your GPS', desc: 'Spirit creates your full GPS plan — sprint by sprint, action by action.' },
    { n: 3, icon: '🔍', title: 'Assess & Activate', desc: 'Spirit scores your probability of success and activates your sprint schedule.' },
    { n: 4, icon: '📈', title: 'Execute Daily', desc: 'Open Instructions each day for step-by-step guidance on your current action.' },
    { n: 5, icon: '✊', title: 'Get OoWops', desc: 'Share progress to the Dreamline. Your village validates your wins with OoWops.' },
  ];

  return (
    <div className="absolute inset-0 flex flex-col" style={{ background: 'linear-gradient(160deg, #7C3AED22, #06080E 60%)' }}>
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 40%)' }} />

      <div className="relative z-10 flex-1 flex flex-col justify-end px-5 pb-28 pt-20">
        <span className="px-3 py-1 rounded-full text-xs font-bold mb-3 inline-block" style={{ background: 'rgba(124,58,237,0.25)', color: '#A78BFA', border: '1px solid rgba(124,58,237,0.5)' }}>
          🚀 Getting Started
        </span>
        <h2 className="text-2xl font-black text-white leading-tight mb-1">How to use the Workshop</h2>
        <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.5)' }}>
          It takes a village — but it starts with your Goal GPS.
        </p>

        <div className="space-y-3">
          {STEPS.map(s => (
            <div key={s.n} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                style={{ background: 'rgba(124,58,237,0.35)', color: '#A78BFA', border: '1px solid rgba(124,58,237,0.5)' }}>
                {s.n}
              </div>
              <div>
                <p className="text-sm font-bold text-white">{s.icon} {s.title}</p>
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

// ── Main Workshop Page ─────────────────────────────────────────────────────────
export default function WorkshopPage() {
  const router   = useRouter();
  const supabase = createClient();
  const { theme } = useVillageTheme();
  const { speak } = useSpiritVoice();
  const isNight = theme === 'night';

  const [cards,        setCards]        = useState<FeedCard[]>([]);
  const [current,      setCurrent]      = useState(0);
  const [owopped,      setOwopped]      = useState<Set<string>>(new Set());
  const [loading,      setLoading]      = useState(true);
  const [activeGoals,  setActiveGoals]  = useState<any[]>([]);
  const [showNudge,    setShowNudge]    = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY  = useRef(0);
  const touchStartX  = useRef(0);
  const hasGoals     = activeGoals.length > 0;

  useEffect(() => { loadFeed(); }, []);

  // Show nudge on first load (no goals) and every 3 cards thereafter
  useEffect(() => {
    if (!hasGoals && !loading) {
      setShowNudge(true);
      const t = setTimeout(() => setShowNudge(false), 4000);
      return () => clearTimeout(t);
    }
  }, [hasGoals, loading]);

  useEffect(() => {
    if (!hasGoals && current > 0 && current % 3 === 0) {
      setShowNudge(true);
      const t = setTimeout(() => setShowNudge(false), 4000);
      return () => clearTimeout(t);
    }
  }, [current, hasGoals]);

  async function loadFeed() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const [templatesRes, goalsRes, videosRes] = await Promise.all([
        (supabase as any).from('goal_templates')
          .select('id, title, description, estimated_weeks, clone_count, oowop_count, steps, profiles!creator_id(username, score_tier)')
          .eq('is_public', true).order('clone_count', { ascending: false }).limit(10)
          .then((r: any) => r).catch(() => ({ data: [] })),
        user
          ? (supabase as any).from('goals')
              .select('title, description, category, progress_percentage, probability_score, goal_steps(status)')
              .eq('user_id', user.id).eq('status', 'active').limit(5)
              .then((r: any) => r).catch(() => ({ data: [] }))
          : Promise.resolve({ data: [] }),
        (supabase as any).from('studio_videos')
          .select('id, title, description, category, video_url, thumbnail_url, profiles!creator_id(username)')
          .eq('is_published', true).order('watch_count', { ascending: false }).limit(10)
          .then((r: any) => r).catch(() => ({ data: [] })),
      ]);

      const templates: any[] = templatesRes.data ?? [];
      const goals:     any[] = goalsRes.data     ?? [];
      const videos:    any[] = videosRes.data    ?? [];

      if (user && goals.length) setActiveGoals(goals);

      const hasGoals = goals.length > 0;

      const COLORS = ['#E8770A', '#7C3AED', '#059669', '#D97706', '#BE185D', '#0D9488', '#1877F2'];
      const feed: FeedCard[] = [];

      // User's active goals
      goals.forEach((g: any, i: number) => {
        const done  = g.goal_steps?.filter((s: any) => s.status === 'completed').length ?? 0;
        const total = g.goal_steps?.length ?? 1;
        feed.push({
          id: `goal-${i}`, type: 'goal', title: g.title,
          subtitle: `${done}/${total} steps · ${g.category ?? 'personal'}`,
          content: g.description ?? '',
          author: { username: 'You' },
          color: COLORS[i % COLORS.length], accent: COLORS[i % COLORS.length],
          data: { progress: g.progress_percentage ?? 0, probability: g.probability_score ?? 0 },
        });
      });

      // Public templates
      templates.forEach((t: any, i: number) => {
        feed.push({
          id: t.id, type: 'template', title: t.title,
          subtitle: `${t.estimated_weeks ?? 0}wk plan · ${t.clone_count ?? 0} clones`,
          content: t.description ?? '',
          author: { username: t.profiles?.username ?? 'villager', score_tier: t.profiles?.score_tier },
          color: COLORS[(i + 2) % COLORS.length], accent: COLORS[(i + 2) % COLORS.length],
          data: { steps: t.steps ?? [] }, oowops: t.oowop_count ?? 0,
        });
      });

      // Studio videos
      videos.forEach((v: any) => {
        feed.push({
          id: v.id, type: 'video', title: v.title,
          subtitle: v.category ?? 'Training', content: v.description ?? '',
          author: { username: v.profiles?.username ?? 'creator' },
          media: { videoId: v.video_url?.includes('youtube') ? v.video_url.split('v=')[1] : undefined, thumbnail: v.thumbnail_url },
          color: '#FF6B2B', accent: '#FF6B2B',
        });
      });

      const guideCard: FeedCard = {
        id: 'guide', type: 'guide' as CardType, title: 'How to use the Workshop',
        subtitle: 'Start with your Goal GPS', content: '',
        author: { username: 'Spirit' }, color: '#7C3AED', accent: '#7C3AED',
      };

      const shuffled: FeedCard[] = !hasGoals
        ? [guideCard, ...feed]
        : feed.length > 0 ? feed : [guideCard];

      setCards(shuffled);
      if (shuffled[0]) speak(shuffled[0].title, 'casual');
    } catch {
      // Always show guide card on any error so the page isn't stuck
      setCards([{
        id: 'guide', type: 'guide' as CardType, title: 'How to use the Workshop',
        subtitle: 'Start with your Goal GPS', content: '',
        author: { username: 'Spirit' }, color: '#7C3AED', accent: '#7C3AED',
      }]);
    } finally {
      setLoading(false);
    }
  }

  // Swipe up/down navigation; swipe right → create goal (when no goals)
  function onTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    const dy = touchStartY.current - e.changedTouches[0].clientY;
    const dx = e.changedTouches[0].clientX - touchStartX.current;

    // Swipe right (dx > 80 and not primarily vertical) → go create goal
    if (dx > 80 && Math.abs(dy) < 60) {
      router.push('/village/workshop/chat');
      return;
    }

    if (dy > 60 && current < cards.length - 1) {
      const next = current + 1;
      setCurrent(next);
      if (cards[next]) speak(cards[next].title, 'casual');
    }
    if (dy < -60 && current > 0) {
      const prev = current - 1;
      setCurrent(prev);
      if (cards[prev]) speak(cards[prev].title, 'casual');
    }
  }

  function onWheel(e: React.WheelEvent) {
    if (e.deltaY > 50 && current < cards.length - 1) setCurrent(c => c + 1);
    if (e.deltaY < -50 && current > 0) setCurrent(c => c - 1);
  }

  function handleOoWop(cardId: string) {
    setOwopped(prev => { const n = new Set(prev); n.has(cardId) ? n.delete(cardId) : n.add(cardId); return n; });
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: '#06080E' }}>
        <div className="space-y-3 text-center">
          <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}
            className="text-3xl font-black" style={{ color: '#E8770A', fontFamily: 'monospace' }}>
            Workshop
          </motion.div>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Loading your feed…</p>
        </div>
      </div>
    );
  }

  const card = cards[current];

  return (
    <div ref={containerRef} className="fixed inset-0 overflow-hidden select-none"
      style={{ background: '#000', touchAction: 'none' }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onWheel={onWheel}
    >
      {/* Current card */}
      <AnimatePresence mode="wait">
        <motion.div key={card?.id}
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '-100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 260 }}
          className="absolute inset-0"
        >
          {card?.type === 'template'    && <TemplateCard card={card} onOoWop={() => handleOoWop(card.id)} owopped={owopped.has(card.id)} />}
          {card?.type === 'video'       && <VideoCard card={card} onOoWop={() => handleOoWop(card.id)} owopped={owopped.has(card.id)} />}
          {card?.type === 'goal'        && <GoalCard card={card} />}
          {card?.type === 'achievement' && <GoalCard card={card} />}
          {card?.type === 'guide'       && <GuideCard />}

          {/* Author + actions */}
          {card && card.type !== 'guide' && <AuthorBar card={card} />}
          {card && card.type !== 'goal' && card.type !== 'guide' && (
            <SideActions card={card} onOoWop={() => handleOoWop(card.id)} owopped={owopped.has(card.id)} oowopCount={(card.oowops ?? 0) + (owopped.has(card.id) ? 1 : 0)} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-30 px-5 pt-12 pb-3"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)' }}>
        <span className="text-base font-black text-white">Workshop</span>
      </div>

      {/* Progress dots */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-1.5">
        {cards.slice(0, 8).map((_, i) => (
          <div key={i} className="rounded-full transition-all"
            style={{ width: 3, height: i === current ? 20 : 6, background: i === current ? '#E8770A' : 'rgba(255,255,255,0.25)' }} />
        ))}
      </div>

      {/* Swipe hint */}
      {current === 0 && cards.length > 1 && (
        <motion.div
          className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1"
          initial={{ opacity: 0 }} animate={{ opacity: 1, y: [0, -6, 0] }}
          transition={{ delay: 2, duration: 1.5, repeat: 3 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="rgba(255,255,255,0.4)"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6 1.41 1.41z"/></svg>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Swipe up</p>
        </motion.div>
      )}

      {/* Bottom nav space */}
      <div className="absolute bottom-0 left-0 right-0 h-20" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }} />

      {/* Swipe-right nudge — shown when user has no goals */}
      <AnimatePresence>
        {showNudge && !hasGoals && (
          <motion.div
            initial={{ x: -120, opacity: 0 }}
            animate={{ x: [0, 14, 0, 14, 0], opacity: 1 }}
            exit={{ x: -120, opacity: 0 }}
            transition={{ x: { duration: 1.4, repeat: 1, repeatDelay: 0.8, ease: 'easeInOut' }, opacity: { duration: 0.3 } }}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-40 flex items-center"
            onClick={() => router.push('/village/workshop/chat')}
          >
            <div className="flex items-center gap-3 pl-4 pr-5 py-4 rounded-r-2xl cursor-pointer"
              style={{ background: 'linear-gradient(135deg,#7C3AED,#1877F2)', boxShadow: '4px 0 24px rgba(124,58,237,0.5)' }}>
              <div className="flex flex-col">
                <span className="text-xs font-black text-white leading-tight">Swipe right</span>
                <span className="text-[10px] text-white/70 leading-tight">to create your first goal</span>
              </div>
              <motion.span
                animate={{ x: [0, 6, 0] }}
                transition={{ duration: 0.7, repeat: Infinity, ease: 'easeInOut' }}
                className="text-white text-lg"
              >→</motion.span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
