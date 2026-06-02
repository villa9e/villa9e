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
  author:   { username: string; avatar?: string; avatar_url?: string; score_tier?: string };
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
    <div className="absolute inset-0 flex flex-col" style={{ background: `linear-gradient(160deg, ${card.color}22, var(--v-bg) 60%)` }}>
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
    <div className="absolute inset-0 flex flex-col" style={{ background: 'var(--v-bg)' }}>
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
    <div className="absolute inset-0 flex flex-col" style={{ background: `linear-gradient(160deg, ${card.color}18, var(--v-bg) 70%)` }}>
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

// ── Fist fly-up OoWop animation ─────────────────────────────────────────────
function FistAnimation({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1, scale: 0.6, y: 0 }}
          animate={{ opacity: 0, scale: 1.8, y: -180 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none', zIndex: 50 }}>
          <OoWopSvg />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Sidebar action buttons ─────────────────────────────────────────────────────
function SideActions({ card, onOoWop, onSkip, onSave, owopped, saved, oowopCount }: {
  card: FeedCard; onOoWop: () => void; onSkip: () => void; onSave: () => void;
  owopped: boolean; saved: boolean; oowopCount: number;
}) {
  const SaveSvg = () => <svg width={22} height={22} viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>;
  const ThumbDown = () => <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10z"/><path d="M17 2h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17"/></svg>;

  return (
    <div style={{ position: 'absolute', right: 8, bottom: 96, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, zIndex: 20 }}>
      {/* OoWop */}
      <motion.button whileTap={{ scale: 0.85 }} onClick={onOoWop}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'transparent', border: 'none', cursor: 'pointer' }}>
        <div style={{ width: 44, height: 44, borderRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', background: owopped ? 'rgba(239,159,39,0.3)' : 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', color: owopped ? '#EF9F27' : 'white' }}>
          <OoWopSvg />
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{oowopCount > 0 ? oowopCount.toLocaleString() : 'OoWop'}</span>
      </motion.button>

      {/* Skip */}
      <motion.button whileTap={{ scale: 0.85 }} onClick={onSkip}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'transparent', border: 'none', cursor: 'pointer' }}>
        <div style={{ width: 44, height: 44, borderRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', color: 'rgba(255,255,255,0.6)' }}>
          <ThumbDown />
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>Skip</span>
      </motion.button>

      {/* Share */}
      <motion.button whileTap={{ scale: 0.85 }}
        onClick={() => { if (navigator.share) navigator.share({ title: card.title, url: window.location.href }); }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'transparent', border: 'none', cursor: 'pointer' }}>
        <div style={{ width: 44, height: 44, borderRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', color: 'white' }}>
          <ShareSvg />
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>Share</span>
      </motion.button>

      {/* Save */}
      <motion.button whileTap={{ scale: 0.85 }} onClick={onSave}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'transparent', border: 'none', cursor: 'pointer' }}>
        <div style={{ width: 44, height: 44, borderRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', background: saved ? 'rgba(0,51,204,0.3)' : 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', color: saved ? '#4D72FF' : 'white' }}>
          <SaveSvg />
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>Save</span>
      </motion.button>
    </div>
  );
}

// ── Author bar ─────────────────────────────────────────────────────────────────
function AuthorBar({ card }: { card: FeedCard }) {
  return (
    <div className="absolute bottom-20 left-5 right-20 z-20 flex items-center gap-2.5">
      <div className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden" style={{ border: '2px solid white' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={card.author.avatar_url || '/default-avatar.png'} alt="" className="w-full h-full object-cover" />
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
    <div className="absolute inset-0 flex flex-col" style={{ background: 'linear-gradient(160deg, #7C3AED22, var(--v-bg) 60%)' }}>
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

// ── Tab bar ────────────────────────────────────────────────────────────────────
const TABS = ['Goals', 'Workshop', 'GPS'] as const;
type Tab = typeof TABS[number];

// ── Main Workshop Page ─────────────────────────────────────────────────────────
export default function WorkshopPage() {
  const router   = useRouter();
  const supabase = createClient();
  const { theme } = useVillageTheme();
  const { speak } = useSpiritVoice();
  const isNight = theme === 'night';

  const [tab,          setTab]          = useState<Tab>('Workshop');
  const [cards,        setCards]        = useState<FeedCard[]>([]);
  const [current,      setCurrent]      = useState(0);
  const [owopped,      setOwopped]      = useState<Set<string>>(new Set());
  const [saved,        setSaved]        = useState<Set<string>>(new Set());
  const [skipped,      setSkipped]      = useState<Set<string>>(new Set());
  const [showFist,     setShowFist]     = useState(false);
  const [loading,      setLoading]      = useState(true);
  const [activeGoals,  setActiveGoals]  = useState<any[]>([]);
  const [activeSprints,setActiveSprints]= useState<any[]>([]);
  const [showNudge,    setShowNudge]    = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY  = useRef(0);
  const touchStartX  = useRef(0);
  const mouseStartY  = useRef(0);
  const mouseStartX  = useRef(0);
  const isDragging   = useRef(false);
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

      const [templatesRes, goalsRes, videosRes, ytRes] = await Promise.all([
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
        fetch('/api/gps/action-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }).then(r => r.ok ? r.json() : { feed: [] }).catch(() => ({ feed: [] })),
      ]);

      const templates: any[] = templatesRes.data ?? [];
      const goals:     any[] = goalsRes.data     ?? [];
      const videos:    any[] = videosRes.data    ?? [];

      if (user && goals.length) {
        setActiveGoals(goals);
        // Load active sprints for GPS tab
        fetch('/api/sprints').then(r => r.ok ? r.json() : []).then(data => {
          if (Array.isArray(data)) setActiveSprints(data.filter((s:any) => s.status === 'active'));
        }).catch(() => {});
      }

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

      // YouTube videos from action-content API
      const ytVideos: any[] = ytRes?.feed ?? [];
      ytVideos.slice(0, 6).forEach((v: any) => {
        if (!v.id) return;
        feed.push({
          id: `yt-${v.id}`, type: 'video' as CardType, title: v.title,
          subtitle: v.channel ?? 'YouTube', content: '',
          author: { username: v.channel ?? 'YouTube' },
          media: { videoId: v.id, thumbnail: v.thumbnail },
          color: '#FF0000', accent: '#FF6B2B',
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

    if (Math.abs(dx) > 80 && Math.abs(dy) < 60) {
      if (dx > 0) {
        // Swipe right: Goals ← Workshop → (nothing) / Workshop ← GPS → (nothing)
        if (tab === 'Workshop') router.push('/village/workshop/chat');
        if (tab === 'GPS') setTab('Workshop');
        if (tab === 'Goals') setTab('Workshop');
      } else {
        // Swipe left: Goals → Workshop → GPS
        if (tab === 'Goals') setTab('Workshop');
        else if (tab === 'Workshop') setTab('GPS');
      }
      return;
    }

    if (tab !== 'Workshop') return;
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

  function onMouseDown(e: React.MouseEvent) {
    mouseStartY.current = e.clientY;
    mouseStartX.current = e.clientX;
    isDragging.current = true;
  }
  function onMouseMove(e: React.MouseEvent) {
    if (isDragging.current) e.preventDefault();
  }
  function onMouseUp(e: React.MouseEvent) {
    if (!isDragging.current) return;
    isDragging.current = false;
    const dy = mouseStartY.current - e.clientY;
    const dx = e.clientX - mouseStartX.current;
    if (Math.abs(dx) > 80 && Math.abs(dy) < 60) {
      if (dx > 0) {
        if (tab === 'Workshop') router.push('/village/workshop/chat');
        else setTab('Workshop');
      } else {
        if (tab === 'Goals') setTab('Workshop');
        else if (tab === 'Workshop') setTab('GPS');
      }
      return;
    }
    if (tab !== 'Workshop') return;
    if (Math.abs(dy) > 60) {
      if (dy > 0 && current < cards.length - 1) { const next = current + 1; setCurrent(next); if (cards[next]) speak(cards[next].title, 'casual'); }
      if (dy < 0 && current > 0) { const prev = current - 1; setCurrent(prev); if (cards[prev]) speak(cards[prev].title, 'casual'); }
    }
  }

  async function handleOoWop(cardId: string) {
    // Toggle — un-OoWop if already owopped
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
    const card = cards.find(c => c.id === cardId);
    if (!card) return;
    if (card.type === 'template') {
      (supabase as any).from('goal_templates').update({ oowop_count: (card.oowops ?? 0) + 1 }).eq('id', cardId).catch(() => {});
    } else if (card.type === 'video') {
      (supabase as any).from('studio_videos').update({ oowop_count: (card.oowops ?? 0) + 1 }).eq('id', cardId).catch(() => {});
    }
  }

  function handleSkip(cardId: string) {
    setSkipped(prev => { const n = new Set(prev); n.add(cardId); return n; });
    // Advance to next card
    if (current < cards.length - 1) setCurrent(c => c + 1);
  }

  function handleSave(cardId: string) {
    setSaved(prev => {
      const n = new Set(prev);
      if (n.has(cardId)) n.delete(cardId); else n.add(cardId);
      return n;
    });
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: '#080E24' }}>
        <div className="space-y-4 text-center">
          <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <img src="/village-teepee-logo.png" alt="Workshop" style={{ width: 64, height: 64, margin: '0 auto' }} />
          </motion.div>
          <p className="text-sm font-black" style={{ color: '#4D72FF', letterSpacing: '0.08em' }}>WORKSHOP</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Loading your feed…</p>
        </div>
      </div>
    );
  }

  const card = cards[current];
  const CARD_H = 'calc(100dvh - 80px)';

  return (
    <div style={{ background: '#080E24', minHeight: '100dvh' }}>
      {/* Top bar + tab bar */}
      <div className="sticky top-0 z-30"
        style={{ background: 'rgba(8,14,36,0.97)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between px-5 pt-12 pb-1">
          <span className="text-base font-black text-white">Workshop</span>
          <Link href="/village/workshop/chat"
            style={{ background: '#4D72FF', color: '#fff', borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 900, textDecoration: 'none' }}>
            + New Goal
          </Link>
        </div>
        {/* Tab bar */}
        <div style={{ display: 'flex', padding: '0 16px 0' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ flex: 1, padding: '10px 0', fontSize: 13, fontWeight: tab === t ? 900 : 600, color: tab === t ? '#fff' : 'rgba(255,255,255,0.35)', background: 'transparent', border: 'none', cursor: 'pointer', borderBottom: tab === t ? '2px solid #4D72FF' : '2px solid transparent', transition: 'all 0.15s' }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* ── GOALS TAB ──────────────────────────────────────────────────────────── */}
      {tab === 'Goals' && (
        <div style={{ padding: '16px', overflowY: 'auto', paddingBottom: 100 }}>
          {activeGoals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <p style={{ fontSize: 40, marginBottom: 12 }}>🎯</p>
              <p style={{ fontSize: 16, fontWeight: 900, color: '#fff', marginBottom: 8 }}>No active goals yet</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 24, lineHeight: 1.6 }}>
                Talk to Spirit to create your first goal and GPS plan.
              </p>
              <Link href="/village/workshop/chat"
                style={{ display: 'inline-block', background: '#4D72FF', color: '#fff', borderRadius: 14, padding: '14px 28px', fontSize: 14, fontWeight: 900, textDecoration: 'none' }}>
                Create My First Goal →
              </Link>
            </div>
          ) : (
            <>
              <p style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em', marginBottom: 12 }}>ACTIVE GOALS</p>
              {activeGoals.map((g: any, i: number) => {
                const COLORS = ['#4D72FF','#1D9E75','#D4A030','#D4537E','#7C3AED'];
                const color = COLORS[i % COLORS.length];
                const done  = g.goal_steps?.filter((s: any) => s.status === 'completed').length ?? 0;
                const total = g.goal_steps?.length ?? 0;
                const pct   = total ? Math.round((done / total) * 100) : g.progress_percentage ?? 0;
                const prob  = g.probability_score ?? 0;
                return (
                  <Link key={g.id || i} href={g.id ? `/village/workshop/goal/${g.id}` : '/village/workshop'}
                    style={{ display: 'block', textDecoration: 'none', background: '#0E1630', border: `1px solid ${color}33`, borderRadius: 16, padding: 16, marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                      <p style={{ fontSize: 15, fontWeight: 900, color: '#fff', flex: 1, marginRight: 10, lineHeight: 1.3 }}>{g.title}</p>
                      <span style={{ background: prob >= 70 ? 'rgba(29,158,117,0.2)' : 'rgba(77,114,255,0.2)', color: prob >= 70 ? '#1D9E75' : '#4D72FF', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 900, whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {prob}%
                      </span>
                    </div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden', marginBottom: 6 }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.5s' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                      <span>{pct}% complete</span>
                      <span>{g.category ?? 'Personal'} · {g.estimated_weeks ?? '?'}w plan</span>
                    </div>
                  </Link>
                );
              })}
              <Link href="/village/workshop/templates"
                style={{ display: 'block', textDecoration: 'none', background: 'rgba(77,114,255,0.08)', border: '1px dashed rgba(77,114,255,0.3)', borderRadius: 16, padding: 16, textAlign: 'center', marginTop: 8 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#4D72FF' }}>Browse Goal DNA Templates →</p>
              </Link>
            </>
          )}
        </div>
      )}

      {/* ── GPS TAB ─────────────────────────────────────────────────────────────── */}
      {tab === 'GPS' && (
        <div style={{ padding: '16px', overflowY: 'auto', paddingBottom: 100 }}>
          {activeSprints.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <p style={{ fontSize: 40, marginBottom: 12 }}>🗺️</p>
              <p style={{ fontSize: 16, fontWeight: 900, color: '#fff', marginBottom: 8 }}>No active sprint</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, marginBottom: 24 }}>
                {hasGoals ? 'Activate your GPS to generate a sprint plan.' : 'Create a goal first, then activate your GPS.'}
              </p>
              {hasGoals ? (
                <Link href={`/village/workshop/goal/${activeGoals[0]?.id}`}
                  style={{ display: 'inline-block', background: '#4D72FF', color: '#fff', borderRadius: 14, padding: '14px 28px', fontSize: 14, fontWeight: 900, textDecoration: 'none' }}>
                  View GPS →
                </Link>
              ) : (
                <Link href="/village/workshop/chat"
                  style={{ display: 'inline-block', background: '#4D72FF', color: '#fff', borderRadius: 14, padding: '14px 28px', fontSize: 14, fontWeight: 900, textDecoration: 'none' }}>
                  Create a Goal →
                </Link>
              )}
            </div>
          ) : (
            <>
              <p style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em', marginBottom: 12 }}>ACTIVE SPRINT</p>
              {activeSprints.slice(0, 1).map((sprint: any) => (
                <div key={sprint.id} style={{ background: '#0E1630', border: '1px solid rgba(77,114,255,0.3)', borderRadius: 16, overflow: 'hidden', marginBottom: 12 }}>
                  <div style={{ background: 'linear-gradient(135deg,#0033CC,#4D72FF)', padding: '16px' }}>
                    <p style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.06em', marginBottom: 4 }}>CURRENT SPRINT</p>
                    <p style={{ fontSize: 16, fontWeight: 900, color: '#fff', marginBottom: 4 }}>{sprint.title}</p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{sprint.week_start} → {sprint.week_end}</p>
                  </div>
                  <div style={{ padding: '14px' }}>
                    {(sprint.sprint_actions ?? []).slice(0, 5).map((action: any, ai: number) => (
                      <div key={action.id || ai} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: ai < (sprint.sprint_actions?.length ?? 0) - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                        <div style={{ width: 20, height: 20, borderRadius: 10, border: `2px solid ${action.completed ? '#1D9E75' : 'rgba(255,255,255,0.2)'}`, background: action.completed ? '#1D9E75' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {action.completed && <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                        </div>
                        <p style={{ fontSize: 13, color: action.completed ? 'rgba(255,255,255,0.4)' : '#fff', textDecoration: action.completed ? 'line-through' : 'none', flex: 1 }}>{action.title}</p>
                      </div>
                    ))}
                    <Link href={`/village/workshop/sprint/${sprint.id}`}
                      style={{ display: 'block', textAlign: 'center', marginTop: 12, background: '#4D72FF', color: '#fff', borderRadius: 12, padding: '12px', fontSize: 13, fontWeight: 900, textDecoration: 'none' }}>
                      Open Full Sprint →
                    </Link>
                  </div>
                </div>
              ))}
              <Link href="/village/workshop/skill-stream"
                style={{ display: 'block', textDecoration: 'none', background: 'rgba(29,158,117,0.08)', border: '1px solid rgba(29,158,117,0.2)', borderRadius: 16, padding: 14, textAlign: 'center' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#1D9E75' }}>Skill Stream — Learn what your goals require →</p>
              </Link>
            </>
          )}
        </div>
      )}

      {/* ── WORKSHOP TAB (swipe feed) ─────────────────────────────────────────── */}
      {tab === 'Workshop' && (
      <div
        ref={containerRef}
        className="relative overflow-hidden select-none"
        style={{ height: CARD_H, marginTop: '-60px', touchAction: 'pan-y', cursor: isDragging.current ? 'grabbing' : 'grab' }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={() => { isDragging.current = false; }}
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

            {/* Fist fly-up animation on OoWop */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 40, color: '#EF9F27' }}>
              <FistAnimation show={showFist} />
            </div>

            {card && card.type !== 'guide' && <AuthorBar card={card} />}
            {card && card.type !== 'goal' && card.type !== 'guide' && (
              <SideActions
                card={card}
                onOoWop={() => handleOoWop(card.id)}
                onSkip={() => handleSkip(card.id)}
                onSave={() => handleSave(card.id)}
                owopped={owopped.has(card.id)}
                saved={saved.has(card.id)}
                oowopCount={(card.oowops ?? 0) + (owopped.has(card.id) ? 1 : 0)}
              />
            )}
          </motion.div>
        </AnimatePresence>

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
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1"
            initial={{ opacity: 0 }} animate={{ opacity: 1, y: [0, -6, 0] }}
            transition={{ delay: 2, duration: 1.5, repeat: 3 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="rgba(255,255,255,0.4)"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6 1.41 1.41z"/></svg>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Swipe up</p>
          </motion.div>
        )}

        {/* Swipe-right nudge — only on Workshop tab */}
        <AnimatePresence>
          {showNudge && !hasGoals && tab === 'Workshop' && (
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
      )}
    </div>
  );
}
