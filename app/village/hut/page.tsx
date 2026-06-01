'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { BackButton } from '@/components/village/BackButton';

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// ── Sub-components ────────────────────────────────────────────────────────────
function Stat({ n, label, onTap }: { n: number; label: string; onTap?: () => void }) {
  return (
    <button onClick={onTap} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 60 }}>
      <span style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>{fmt(n)}</span>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.02em' }}>{label}</span>
    </button>
  );
}

function IconBtn({ children, onPress, badge }: { children: React.ReactNode; onPress?: () => void; badge?: number }) {
  return (
    <button onClick={onPress} style={{ position: 'relative', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 18, background: 'rgba(255,255,255,0.07)' }}>
      {children}
      {(badge ?? 0) > 0 && (
        <span style={{ position: 'absolute', top: 0, right: 0, minWidth: 14, height: 14, borderRadius: 7, background: '#EF4444', color: '#fff', fontSize: 8, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 2px' }}>
          {(badge ?? 0) > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
}

function CountPill({ icon, count, label, color, onTap }: { icon: string; count: number; label: string; color: string; onTap?: () => void }) {
  return (
    <button onClick={onTap} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <span style={{ fontSize: 12 }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 800, color }}>{fmt(count)}</span>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{label}</span>
    </button>
  );
}

// ── More options dropdown ─────────────────────────────────────────────────────
function MoreMenu({ onClose }: { onClose: () => void }) {
  const items = [
    { icon: '🔗', label: 'Share Profile' },
    { icon: '📱', label: 'Scan QR Code' },
    { icon: '🚫', label: 'Block' },
    { icon: '🚩', label: 'Report' },
  ];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}>
      <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: '#12152A', borderRadius: '24px 24px 0 0', padding: '12px 0 32px' }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)', margin: '0 auto 20px' }} />
        {items.map(it => (
          <button key={it.label} onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 16, width: '100%', padding: '14px 24px', fontSize: 15, color: '#fff', fontWeight: 600 }}>
            <span style={{ fontSize: 20 }}>{it.icon}</span> {it.label}
          </button>
        ))}
      </motion.div>
    </motion.div>
  );
}

// ── Highlights ────────────────────────────────────────────────────────────────
const PLAYLIST_ICONS: Record<string, string> = { Goals: '🎯', Wins: '🏆', Village: '🏡', Life: '🌿', Work: '💼', Travel: '✈️' };

// ── Video thumbnail placeholder ───────────────────────────────────────────────
function VideoThumb({ idx, pinned, views }: { idx: number; pinned?: boolean; views: number }) {
  const hues = [220, 260, 200, 290, 180, 240, 210, 270];
  const h = hues[idx % hues.length];
  return (
    <div style={{ aspectRatio: '9/16', position: 'relative', overflow: 'hidden', background: `hsl(${h},40%,18%)` }}>
      {pinned && (
        <div style={{ position: 'absolute', top: 4, left: 4, background: '#1877F2', borderRadius: 4, padding: '1px 5px', fontSize: 8, fontWeight: 900, color: '#fff' }}>PIN</div>
      )}
      <div style={{ position: 'absolute', bottom: 4, left: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.85)' }}>▶ {fmt(views)}</span>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function HutPage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile]   = useState<any>(null);
  const [stats, setStats]       = useState({ following: 0, tribes: 0, oowops: 0, verifications: 0, successes: 0, testimonials: 0, deals: 0 });
  const [hasStore, setHasStore] = useState(false);
  const [tab, setTab]           = useState<'grid' | 'repost' | 'oowop'>('grid');
  const [showMore, setShowMore] = useState(false);
  const [loading, setLoading]   = useState(true);

  const touchRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const [profRes, connFollowRes, connTribeRes, oowopRes, sprintRes, storeRes] = await Promise.allSettled([
        (supabase as any).from('profiles').select('*').eq('id', user.id).single(),
        (supabase as any).from('connections').select('id', { count: 'exact', head: true }).eq('requester_id', user.id).eq('status', 'accepted'),
        (supabase as any).from('connections').select('id', { count: 'exact', head: true }).eq('addressee_id', user.id).eq('status', 'accepted'),
        (supabase as any).from('oowops').select('id', { count: 'exact', head: true }).eq('receiver_id', user.id),
        (supabase as any).from('goals').select('id, goal_steps(id,status)').eq('user_id', user.id),
        (supabase as any).from('trading_post_listings').select('id').eq('user_id', user.id).eq('is_active', true).limit(1),
      ]);

      if (profRes.status === 'fulfilled') setProfile(profRes.value.data);

      const following = connFollowRes.status === 'fulfilled' ? (connFollowRes.value.count ?? 0) : 0;
      const tribes    = connTribeRes.status  === 'fulfilled' ? (connTribeRes.value.count  ?? 0) : 0;
      const oowops    = oowopRes.status      === 'fulfilled' ? (oowopRes.value.count       ?? 0) : 0;

      let successes = 0;
      if (sprintRes.status === 'fulfilled') {
        (sprintRes.value.data ?? []).forEach((g: any) => {
          successes += (g.goal_steps ?? []).filter((s: any) => s.status === 'completed').length;
        });
      }

      setStats({ following, tribes, oowops, verifications: 0, successes, testimonials: 0, deals: 0 });
      if (storeRes.status === 'fulfilled') setHasStore((storeRes.value.data ?? []).length > 0);
      setLoading(false);
    }
    load();
  }, []);

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

  const name     = profile?.display_name || `@${profile?.username || ''}`;
  const playlists = ['Goals', 'Wins', 'Village'];

  return (
    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
      style={{ background: '#0A0B12', minHeight: '100vh', color: '#fff', overflowX: 'hidden', paddingBottom: 120 }}>
      <BackButton />

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, display: 'flex', alignItems: 'center', padding: '12px 12px 12px 56px', background: 'rgba(10,11,18,0.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 16, fontWeight: 900, letterSpacing: '-0.01em' }}>
            @{profile?.username ?? '…'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <IconBtn>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
            </svg>
          </IconBtn>
          <IconBtn onPress={() => router.push('/village/hospital')}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="#22C55E" stroke="#22C55E" strokeWidth="0">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              <text x="12" y="13" textAnchor="middle" fill="white" fontSize="8" fontWeight="900" stroke="none">+</text>
            </svg>
          </IconBtn>
          <IconBtn onPress={() => router.push('/village/spaces')}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </IconBtn>
          <IconBtn onPress={() => setShowMore(true)}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="white">
              <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
            </svg>
          </IconBtn>
        </div>
      </div>

      {/* ── Avatar + Stats ──────────────────────────────────────────────── */}
      <div style={{ padding: '20px 16px 12px', display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ flexShrink: 0 }}>
          {/* Green story ring */}
          <div style={{ width: 88, height: 88, borderRadius: 44, padding: 3, background: 'linear-gradient(135deg,#22C55E,#16A34A)', position: 'relative' }}>
            <div style={{ width: '100%', height: '100%', borderRadius: 100, overflow: 'hidden', border: '2.5px solid #0A0B12', background: '#1877F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 32, fontWeight: 900 }}>{(profile?.display_name || profile?.username || '?')[0]?.toUpperCase()}</span>
              }
            </div>
            {/* Verified badge */}
            {profile?.is_verified && (
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: 11, background: '#1877F2', border: '2px solid #0A0B12', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width={12} height={12} viewBox="0 0 24 24" fill="white"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="white" fill="none" strokeWidth="2.5" strokeLinecap="round" /></svg>
              </div>
            )}
          </div>
          <Link href="/village/hut/avatar" style={{ display: 'block', marginTop: 6, textAlign: 'center', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '3px 8px', fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.65)' }}>
            + Avatar
          </Link>
        </div>
        {/* Stats */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-around' }}>
          <Stat n={stats.following} label="Following" />
          <Stat n={stats.tribes} label="Tribe" />
          <Stat n={stats.oowops} label="OoWops" />
        </div>
      </div>

      {/* ── Bio ─────────────────────────────────────────────────────────── */}
      <div style={{ padding: '0 16px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <span style={{ fontSize: 15, fontWeight: 900 }}>{name}</span>
          {profile?.pronouns && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{profile.pronouns}</span>}
        </div>

        {/* Count pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          <CountPill icon="✅" count={stats.verifications} label="Verified" color="#60A5FA" />
          <CountPill icon="🏆" count={stats.successes} label="Successes" color="#34D399" />
          <CountPill icon="⭐" count={stats.testimonials} label="Testimonials" color="#FBBF24" />
          <CountPill icon="🤝" count={stats.deals} label="Deals" color="#C084FC" />
        </div>

        {profile?.bio && (
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.45, marginBottom: 8 }}>{profile.bio}</p>
        )}

        {hasStore ? (
          <Link href="/village/trading-post" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#C084FC', marginBottom: 4, fontWeight: 700 }}>
            🏪 Trading Post
          </Link>
        ) : (
          <Link href="/village/trading-post" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.28)', marginBottom: 4 }}>
            🏪 Set up your storefront
          </Link>
        )}

        {profile?.link_in_bio && (
          <a href={profile.link_in_bio} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#60A5FA', fontWeight: 700 }}>
            🔗 <span style={{ textDecoration: 'underline' }}>{(profile.link_in_bio as string).replace(/^https?:\/\//, '')}</span>
          </a>
        )}
      </div>

      {/* ── Edit Profile (own profile) ──────────────────────────────────── */}
      <div style={{ padding: '0 16px 16px' }}>
        <Link href="/village/hut/settings" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '9px 0', borderRadius: 10, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', fontSize: 14, fontWeight: 800, color: '#fff' }}>
          Edit Profile
        </Link>
      </div>

      {/* ── Highlights / Playlists ──────────────────────────────────────── */}
      <div style={{ paddingLeft: 16, paddingBottom: 16, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ display: 'flex', gap: 16, paddingRight: 16 }}>
          <button style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 64, height: 64, borderRadius: 32, border: '1.5px dashed rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 22, color: 'rgba(255,255,255,0.4)' }}>+</span>
            </div>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 700 }}>New</span>
          </button>
          {playlists.map(pl => (
            <button key={pl} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 64, height: 64, borderRadius: 32, background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 26 }}>{PLAYLIST_ICONS[pl] ?? '📁'}</span>
              </div>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: 700 }}>{pl}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Content Tab Bar ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.07)', borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: 2 }}>
        {[
          { id: 'grid' as const, icon: (
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          )},
          { id: 'repost' as const, icon: (
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>
          )},
          { id: 'oowop' as const, icon: <span style={{ fontSize: 18 }}>✊</span> },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: '11px 0', display: 'flex', justifyContent: 'center', borderBottom: tab === t.id ? '2px solid #fff' : '2px solid transparent', color: tab === t.id ? '#fff' : 'rgba(255,255,255,0.35)', background: 'transparent' }}>
            {t.icon}
          </button>
        ))}
      </div>

      {/* ── Video Grid ──────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
        {/* Drafts folder */}
        {tab === 'grid' && (
          <Link href="/village/studio" style={{ aspectRatio: '9/16', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <span style={{ fontSize: 24 }}>📁</span>
            <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.4)' }}>Drafts</span>
          </Link>
        )}
        {/* Pinned videos (top 3 for grid) */}
        {tab === 'grid' && [0, 1, 2].map(i => <VideoThumb key={`pin-${i}`} idx={i} pinned views={(i + 1) * 340000} />)}
        {/* Regular grid */}
        {Array.from({ length: tab === 'grid' ? 6 : 9 }, (_, i) => (
          <VideoThumb key={i} idx={i + 3} views={(i + 1) * 127000 + 8000} />
        ))}
      </div>

      {/* ── More dropdown ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {showMore && <MoreMenu onClose={() => setShowMore(false)} />}
      </AnimatePresence>

      {/* Swipe hint */}
      <div style={{ position: 'fixed', bottom: 90, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', padding: '0 16px', pointerEvents: 'none', zIndex: 10 }}>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)', fontWeight: 700 }}>← Wellness</span>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)', fontWeight: 700 }}>Spaces →</span>
      </div>
    </div>
  );
}
