'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { BackButton } from '@/components/village/BackButton';

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function IconBtn({ children, onPress }: { children: React.ReactNode; onPress?: () => void }) {
  return (
    <button onClick={onPress} style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 18, background: 'rgba(255,255,255,0.07)' }}>
      {children}
    </button>
  );
}

function CountPill({ icon, count, label, color, onTap }: { icon: React.ReactNode; count: number; label: string; color: string; onTap?: () => void }) {
  return (
    <button onClick={onTap} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}>
      <span style={{ color, display: 'flex', alignItems: 'center' }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 800, color }}>{fmt(count)}</span>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{label}</span>
    </button>
  );
}

function Stat({ n, label, href }: { n: number; label: string; href?: string }) {
  const content = (
    <>
      <span style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>{fmt(n)}</span>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.45)' }}>{label}</span>
    </>
  );
  if (href) return (
    <Link href={href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, textDecoration: 'none' }}>
      {content}
    </Link>
  );
  return <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>{content}</div>;
}

function MoreMenu({ onClose }: { onClose: () => void }) {
  const items = [
    { icon: <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>, label: 'Share Profile' },
    { icon: <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M7 7h3v3H7zm0 7h3v3H7zm7-7h3v3h-3z"/></svg>, label: 'Scan QR Code' },
    { icon: <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>, label: 'Block' },
    { icon: <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>, label: 'Report' },
  ];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}>
      <motion.div initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }}
        onClick={e => e.stopPropagation()}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: '#1F2937', borderRadius: '24px 24px 0 0', padding: '12px 0 40px' }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)', margin: '0 auto 20px' }} />
        {items.map(it => (
          <button key={it.label} onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 16, width: '100%', padding: '14px 24px', fontSize: 15, color: '#fff', fontWeight: 600, background: 'transparent', border: 'none', cursor: 'pointer' }}>
            {it.icon} {it.label}
          </button>
        ))}
      </motion.div>
    </motion.div>
  );
}

function AddHighlightModal({ userId, onClose, onSaved }: { userId: string; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('📁');
  const [saving, setSaving] = useState(false);
  const supabase = createClient();
  const ICONS = ['📁', '🎯', '🏆', '🌿', '💼', '✈️', '❤️', '🎵', '💡', '🔥'];

  async function save() {
    if (!title.trim()) return;
    setSaving(true);
    await (supabase as any).from('profile_highlights').insert({ user_id: userId, title: title.trim(), icon });
    setSaving(false);
    onSaved();
    onClose();
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end' }}
      onClick={onClose}>
      <motion.div initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }}
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', background: '#1F2937', borderRadius: '24px 24px 0 0', padding: '20px 20px 40px' }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)', margin: '0 auto 20px' }} />
        <p style={{ color: '#fff', fontSize: 16, fontWeight: 900, marginBottom: 16 }}>New Highlight</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          {ICONS.map(ic => (
            <button key={ic} onClick={() => setIcon(ic)}
              style={{ fontSize: 22, width: 44, height: 44, borderRadius: 12, background: icon === ic ? '#1877F2' : 'rgba(255,255,255,0.07)', border: 'none', cursor: 'pointer' }}>
              {ic}
            </button>
          ))}
        </div>
        <input value={title} onChange={e => setTitle(e.target.value)}
          placeholder="Highlight name (e.g. Goals, Wins, Travel)"
          style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 14px', color: '#fff', fontSize: 14, outline: 'none', marginBottom: 14 }} />
        <button onClick={save} disabled={saving || !title.trim()}
          style={{ width: '100%', padding: '13px 0', borderRadius: 14, border: 'none', background: '#1877F2', color: '#fff', fontWeight: 900, fontSize: 15, cursor: 'pointer', opacity: (saving || !title.trim()) ? 0.5 : 1 }}>
          {saving ? 'Saving…' : 'Save Highlight'}
        </button>
      </motion.div>
    </motion.div>
  );
}

function VideoThumb({ post }: { post: any }) {
  const url = post?.media_urls?.[0];
  const views = post?.view_count ?? 0;
  const pinned = post?.is_pinned;
  return (
    <div style={{ aspectRatio: '9/16', position: 'relative', overflow: 'hidden', background: '#1a1b2e' }}>
      {url ? (
        <video src={url} muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#1a1b2e,#2d2f5e)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 24, opacity: 0.3 }}>🎬</span>
        </div>
      )}
      {pinned && (
        <div style={{ position: 'absolute', top: 4, left: 4, background: '#1877F2', borderRadius: 4, padding: '1px 5px', fontSize: 8, fontWeight: 900, color: '#fff' }}>PIN</div>
      )}
      <div style={{ position: 'absolute', bottom: 4, left: 4 }}>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.85)' }}>▶ {fmt(views)}</span>
      </div>
    </div>
  );
}

type ContentTab = 'grid' | 'repost' | 'oowop';

export default function HutPage() {
  const router = useRouter();
  const supabase = createClient();

  const [uid, setUid] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ following: 0, tribe: 0, oowops: 0, verifications: 0, successes: 0, testimonials: 0, deals: 0 });
  const [hasStore, setHasStore] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [pinnedPosts, setPinnedPosts] = useState<any[]>([]);
  const [oowopedPosts, setOowopedPosts] = useState<any[]>([]);
  const [highlights, setHighlights] = useState<any[]>([]);
  const [tab, setTab] = useState<ContentTab>('grid');
  const [showMore, setShowMore] = useState(false);
  const [showAddHighlight, setShowAddHighlight] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pillModal, setPillModal] = useState<{ type: string; url?: string } | null>(null);

  const touchRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => { loadAll(); }, []);

  // Desktop keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') router.push('/village/hospital');
      if (e.key === 'ArrowRight') router.push('/village/spaces');
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  async function loadAll() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    setUid(user.id);

    const [
      profRes, followRes, tribeRes, oowopCntRes,
      sprintRes, storeRes, dealRes, testimonialRes,
      postsRes, pinnedRes, highlightsRes,
    ] = await Promise.allSettled([
      (supabase as any).from('profiles').select('*').eq('id', user.id).single(),
      (supabase as any).from('connections').select('id', { count: 'exact', head: true }).eq('requester_id', user.id).eq('status', 'accepted'),
      (supabase as any).from('connections').select('id', { count: 'exact', head: true }).eq('addressee_id', user.id).eq('status', 'accepted'),
      (supabase as any).from('oowops').select('id', { count: 'exact', head: true }).eq('receiver_id', user.id),
      (supabase as any).from('goals').select('id, goal_steps(id,status)').eq('user_id', user.id),
      (supabase as any).from('trading_post_listings').select('id').eq('user_id', user.id).eq('is_active', true).limit(1),
      (supabase as any).from('deals').select('id', { count: 'exact', head: true }).or(`requester_id.eq.${user.id},provider_id.eq.${user.id}`).in('status', ['active', 'completed']),
      (supabase as any).from('testimonials').select('id', { count: 'exact', head: true }).eq('receiver_id', user.id),
      (supabase as any).from('dream_line_posts').select('id,content,media_urls,media_types,view_count,is_pinned,created_at').eq('user_id', user.id).eq('visibility', 'public').order('created_at', { ascending: false }).limit(30),
      (supabase as any).from('dream_line_posts').select('id,content,media_urls,view_count,is_pinned').eq('user_id', user.id).eq('is_pinned', true).limit(3),
      (supabase as any).from('profile_highlights').select('*').eq('user_id', user.id).order('display_order'),
    ]);

    if (profRes.status === 'fulfilled') setProfile(profRes.value.data);
    if (postsRes.status === 'fulfilled') setPosts(postsRes.value.data ?? []);
    if (pinnedRes.status === 'fulfilled') setPinnedPosts(pinnedRes.value.data ?? []);
    if (highlightsRes.status === 'fulfilled') setHighlights(highlightsRes.value.data ?? []);
    if (storeRes.status === 'fulfilled') setHasStore((storeRes.value.data ?? []).length > 0);

    let successes = 0;
    if (sprintRes.status === 'fulfilled') {
      (sprintRes.value.data ?? []).forEach((g: any) => {
        successes += (g.goal_steps ?? []).filter((s: any) => s.status === 'completed').length;
      });
    }

    setStats({
      following:     followRes.status === 'fulfilled' ? (followRes.value.count ?? 0) : 0,
      tribe:         tribeRes.status === 'fulfilled'  ? (tribeRes.value.count ?? 0)  : 0,
      oowops:        oowopCntRes.status === 'fulfilled' ? (oowopCntRes.value.count ?? 0) : 0,
      verifications: 0, // from provider verification system
      successes,
      testimonials:  testimonialRes.status === 'fulfilled' ? (testimonialRes.value.count ?? 0) : 0,
      deals:         dealRes.status === 'fulfilled' ? (dealRes.value.count ?? 0) : 0,
    });

    setLoading(false);
  }

  async function loadOowopedPosts() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: ows } = await (supabase as any)
      .from('oowops')
      .select('post_id, dream_line_posts(id,content,media_urls,view_count,created_at)')
      .eq('giver_id', user.id)
      .order('created_at', { ascending: false })
      .limit(18);
    setOowopedPosts((ows ?? []).map((o: any) => o.dream_line_posts).filter(Boolean));
  }

  useEffect(() => { if (tab === 'oowop') loadOowopedPosts(); }, [tab]);

  function onTouchStart(e: React.TouchEvent) {
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (!touchRef.current) return;
    const dx = e.changedTouches[0].clientX - touchRef.current.x;
    const dy = Math.abs(e.changedTouches[0].clientY - touchRef.current.y);
    if (Math.abs(dx) > 60 && dy < 50) {
      if (dx > 0) router.push('/village/spaces');
      else router.push('/village/hospital');
    }
    touchRef.current = null;
  }

  const name = profile?.display_name || `@${profile?.username || ''}`;
  const displayPosts = tab === 'grid'
    ? posts.filter(p => !p.is_pinned)
    : tab === 'oowop'
    ? oowopedPosts
    : [];

  return (
    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
      style={{ background: '#111827', minHeight: '100vh', color: '#fff', overflowX: 'hidden', paddingBottom: 40 }}>
      <BackButton to="/village/workshop" />

      {/* ── Header ───────────────────────────────────────────── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, display: 'flex', alignItems: 'center', padding: '12px 12px 12px 56px', background: 'rgba(17,24,39,0.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 16, fontWeight: 900, letterSpacing: '-0.01em' }}>@{profile?.username ?? '…'}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Add Friend */}
          <IconBtn>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="white" stroke="none" />
            </svg>
          </IconBtn>
          {/* Health shortcut */}
          <IconBtn onPress={() => router.push('/village/hospital')}>
            <svg width={18} height={18} viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#22C55E" /></svg>
          </IconBtn>
          {/* Spaces shortcut */}
          <IconBtn onPress={() => router.push('/village/spaces')}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </IconBtn>
          {/* More */}
          <IconBtn onPress={() => setShowMore(true)}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="white">
              <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
            </svg>
          </IconBtn>
        </div>
      </div>

      {/* ── Avatar + Stats ───────────────────────────────────── */}
      <div style={{ padding: '20px 16px 12px', display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ flexShrink: 0 }}>
          <div style={{ width: 88, height: 88, borderRadius: 44, padding: 3, background: 'linear-gradient(135deg,#22C55E,#16A34A)', position: 'relative' }}>
            <div style={{ width: '100%', height: '100%', borderRadius: 100, overflow: 'hidden', border: '2.5px solid #111827', background: '#1877F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img
                src={profile?.avatar_url || '/default-avatar.png'}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            {profile?.is_verified && (
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: 11, background: '#1877F2', border: '2px solid #111827', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
            )}
          </div>
          <Link href="/village/hut/avatar" style={{ display: 'block', marginTop: 6, textAlign: 'center', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '3px 8px', fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.65)', textDecoration: 'none' }}>
            + Avatar
          </Link>
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-around' }}>
          <Stat n={stats.following} label="Following" href="/village/discover" />
          <Stat n={stats.tribe} label="Tribe" href="/village/tribes" />
          <Stat n={stats.oowops} label="OoWops" />
        </div>
      </div>

      {/* ── Bio ─────────────────────────────────────────────── */}
      <div style={{ padding: '0 16px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <span style={{ fontSize: 15, fontWeight: 900 }}>{name}</span>
          {profile?.pronouns && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{profile.pronouns}</span>}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          <CountPill
            icon={<svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
            count={stats.verifications} label="Verified" color="#60A5FA"
            onTap={() => setPillModal({ type: 'verified' })}
          />
          <CountPill
            icon={<svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>}
            count={stats.successes} label="Successes" color="#34D399"
            onTap={() => setPillModal({ type: 'successes' })}
          />
          <CountPill
            icon={<svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>}
            count={stats.testimonials} label="Testimonials" color="#FBBF24"
            onTap={() => setPillModal({ type: 'testimonials', url: '/village/hut/testimonials' })}
          />
          <CountPill
            icon={<svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>}
            count={stats.deals} label="Deals" color="#C084FC"
            onTap={() => setPillModal({ type: 'deals', url: '/village/trading-post' })}
          />
        </div>
        {profile?.bio && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.45, marginBottom: 8 }}>{profile.bio}</p>}
        {hasStore ? (
          <Link href="/village/trading-post" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#C084FC', marginBottom: 4, fontWeight: 700, textDecoration: 'none' }}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
            Trading Post
          </Link>
        ) : (
          <Link href="/village/trading-post" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.28)', marginBottom: 4, textDecoration: 'none' }}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
            Set up your storefront
          </Link>
        )}
        {profile?.link_in_bio && (
          <a href={profile.link_in_bio} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#60A5FA', fontWeight: 700, textDecoration: 'none' }}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
            <span style={{ textDecoration: 'underline' }}>{(profile.link_in_bio as string).replace(/^https?:\/\//, '')}</span>
          </a>
        )}
      </div>

      {/* ── Action Buttons ───────────────────────────────────── */}
      <div style={{ padding: '0 16px 16px', display: 'flex', gap: 8 }}>
        <Link href="/village/hut/settings" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '9px 0', borderRadius: 10, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', fontSize: 14, fontWeight: 800, color: '#fff', textDecoration: 'none' }}>
          Edit Profile
        </Link>
        <Link href="/messages" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '9px 0', borderRadius: 10, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', fontSize: 14, fontWeight: 800, color: '#fff', textDecoration: 'none' }}>
          Message
        </Link>
        <button onClick={() => setShowMore(true)} style={{ width: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', fontSize: 18, color: '#fff', cursor: 'pointer' }}>
          ▼
        </button>
      </div>

      {/* ── Highlights ───────────────────────────────────────── */}
      <div style={{ paddingLeft: 16, paddingBottom: 16, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ display: 'flex', gap: 16, paddingRight: 16 }}>
          <button onClick={() => setShowAddHighlight(true)} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <div style={{ width: 64, height: 64, borderRadius: 32, border: '1.5px dashed rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 22, color: 'rgba(255,255,255,0.4)' }}>+</span>
            </div>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 700 }}>New</span>
          </button>
          {highlights.map(hl => (
            <button key={hl.id} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, background: 'transparent', border: 'none', cursor: 'pointer' }}>
              <div style={{ width: 64, height: 64, borderRadius: 32, background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 26 }}>{hl.icon}</span>
              </div>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: 700, maxWidth: 64, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hl.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Content Tabs ─────────────────────────────────────── */}
      <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.07)', borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: 2 }}>
        {([
          { id: 'grid' as ContentTab, icon: <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
          { id: 'repost' as ContentTab, icon: <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg> },
          { id: 'oowop' as ContentTab, icon: <span style={{ fontSize: 18 }}>✊</span> },
        ] as { id: ContentTab; icon: React.ReactNode }[]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: '11px 0', display: 'flex', justifyContent: 'center', color: tab === t.id ? '#fff' : 'rgba(255,255,255,0.35)', background: 'transparent', border: 'none', borderBottom: tab === t.id ? '2px solid #fff' : '2px solid transparent', cursor: 'pointer' } as any}>
            {t.icon}
          </button>
        ))}
      </div>

      {/* ── Video Grid ───────────────────────────────────────── */}
      {tab === 'repost' ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'rgba(255,255,255,0.3)' }}>
          <p style={{ fontSize: 28, marginBottom: 8 }}>▤</p>
          <p style={{ fontSize: 13 }}>No reposts yet</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
          {/* Drafts folder — grid tab only */}
          {tab === 'grid' && (
            <Link href="/village/studio" style={{ aspectRatio: '9/16', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.1)', textDecoration: 'none' }}>
              <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
              <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.4)' }}>Drafts</span>
            </Link>
          )}
          {/* Pinned posts — grid tab only, top 3 */}
          {tab === 'grid' && pinnedPosts.map(p => <VideoThumb key={`pin-${p.id}`} post={{ ...p, is_pinned: true }} />)}
          {/* Regular posts */}
          {displayPosts.length > 0
            ? displayPosts.map(p => <VideoThumb key={p.id} post={p} />)
            : (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px 20px', color: 'rgba(255,255,255,0.3)' }}>
                <p style={{ fontSize: 28, marginBottom: 8 }}>{tab === 'oowop' ? '✊' : '🎬'}</p>
                <p style={{ fontSize: 13 }}>{tab === 'oowop' ? 'No OoWops given yet' : 'No posts yet. Create something.'}</p>
                {tab === 'grid' && (
                  <Link href="/village/studio" style={{ display: 'inline-block', marginTop: 12, padding: '8px 20px', borderRadius: 20, background: '#1877F2', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                    Create Now
                  </Link>
                )}
              </div>
            )
          }
        </div>
      )}

      {/* Desktop navigation arrows */}
      <button onClick={() => router.push('/village/hospital')}
        className="hidden sm:flex"
        style={{ position: 'fixed', left: 16, top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: 40, height: 40, borderRadius: 20, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <button onClick={() => router.push('/village/spaces')}
        className="hidden sm:flex"
        style={{ position: 'fixed', right: 16, top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: 40, height: 40, borderRadius: 20, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
      </button>

      {/* Swipe hints (mobile only) */}
      <div style={{ position: 'fixed', bottom: 110, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', padding: '0 16px', pointerEvents: 'none', zIndex: 10 }}>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)', fontWeight: 700 }}>← Wellness</span>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)', fontWeight: 700 }}>Spaces →</span>
      </div>

      <AnimatePresence>
        {showMore && <MoreMenu onClose={() => setShowMore(false)} />}
        {showAddHighlight && uid && (
          <AddHighlightModal
            userId={uid}
            onClose={() => setShowAddHighlight(false)}
            onSaved={loadAll}
          />
        )}
        {pillModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(0,0,0,0.75)', display: 'flex', flexDirection: 'column' }}
            onClick={() => setPillModal(null)}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', marginTop: 80, background: '#1F2937', borderRadius: '24px 24px 0 0', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <p style={{ fontWeight: 900, fontSize: 16, color: '#fff' }}>
                  {pillModal.type === 'verified' ? 'Verifications' : pillModal.type === 'successes' ? 'Successes' : pillModal.type === 'testimonials' ? 'Testimonials' : 'Deals'}
                </p>
                <button onClick={() => setPillModal(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>×</button>
              </div>
              {pillModal.url ? (
                <iframe src={pillModal.url} style={{ flex: 1, border: 'none', width: '100%' }} />
              ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
                  {pillModal.type === 'verified' && (
                    <>
                      <svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom: 16 }}><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      <p style={{ color: '#fff', fontWeight: 800, fontSize: 18, marginBottom: 8 }}>Village Verification</p>
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.5, marginBottom: 24 }}>Complete goals, earn OoWops from the village, and top performers receive verification badges. Keep building.</p>
                    </>
                  )}
                  {pillModal.type === 'successes' && (
                    <>
                      <svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom: 16 }}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                      <p style={{ color: '#fff', fontWeight: 800, fontSize: 18, marginBottom: 8 }}>Your Successes</p>
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.5, marginBottom: 24 }}>Every completed goal step is a Success. Start a goal, follow the GPS, and complete actions to earn them.</p>
                      <Link href="/village/workshop" onClick={() => setPillModal(null)} style={{ padding: '12px 28px', borderRadius: 24, background: '#1877F2', color: '#fff', fontWeight: 800, textDecoration: 'none', fontSize: 14 }}>Go to Workshop</Link>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
