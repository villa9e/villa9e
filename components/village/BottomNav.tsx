'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useRef, Suspense, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useNotifications } from '@/lib/hooks/useNotifications';

export const SHOW_PREFIXES = ['/village', '/notifications', '/messages', '/admin', '/trading-post'];
export const HIDE_EXACT    = ['/login', '/signup', '/onboarding'];

type RadialIconKey = 'workshop' | 'goals' | 'create' | 'dreamline' | 'trading-post' | 'bank' | 'profile';

// 7 items, left to right, per WORKSHOP_SPEC §2 radial menu order.
const ITEMS: { href: string; label: string; icon: RadialIconKey }[] = [
  { href: '/village/workshop',      label: 'Workshop',     icon: 'workshop' },
  { href: '/village/workshop/chat', label: 'Goals',        icon: 'goals' },
  { href: '/village/create',        label: 'Create',       icon: 'create' },
  { href: '/village/dreamline',     label: 'DreamLine',    icon: 'dreamline' },
  { href: '/village/trading-post',  label: 'Trading Post', icon: 'trading-post' },
  { href: '/village/bank',          label: 'Bank',         icon: 'bank' },
  { href: '/village/hut',           label: 'Profile',      icon: 'profile' },
];

// Radial icons — 20px, white stroke (villa9e icon rules: white on dark, no color variety).
function RadialIcon({ icon, avatarUrl }: { icon: RadialIconKey; avatarUrl: string | null }) {
  if (icon === 'profile') {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={avatarUrl || '/default-avatar.png'} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
    );
  }
  const common = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: '#ffffff', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (icon) {
    case 'workshop':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="8" height="8" rx="1.5" />
          <rect x="13" y="3" width="8" height="8" rx="1.5" />
          <rect x="3" y="13" width="8" height="8" rx="1.5" />
          <rect x="13" y="13" width="8" height="8" rx="1.5" />
        </svg>
      );
    case 'goals':
      return (
        <svg {...common}>
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
          <path d="M4 22V15" />
        </svg>
      );
    case 'create':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v8M8 12h8" />
        </svg>
      );
    case 'dreamline':
      return (
        <svg {...common}>
          <path d="M3 12h18" />
          <circle cx="6" cy="12" r="1.6" fill="#ffffff" stroke="none" />
          <circle cx="12" cy="12" r="1.6" fill="#ffffff" stroke="none" />
          <circle cx="18" cy="12" r="1.6" fill="#ffffff" stroke="none" />
        </svg>
      );
    case 'trading-post':
      return (
        <svg {...common}>
          <path d="M2 9l1.5-5h17L22 9" />
          <path d="M2 9v11a1 1 0 001 1h18a1 1 0 001-1V9" />
          <path d="M9 21v-7h6v7" />
        </svg>
      );
    case 'bank':
      return (
        <svg {...common}>
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9zM9 22V12h6v10" />
        </svg>
      );
    default:
      return null;
  }
}

// Teepee trigger icon — 28px, white. Crosses to an "X" when the radial menu opens.
function TeepeeIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L4 22M12 2l8 20" />
      <path d="M9 22V15a3 3 0 016 0v7" />
      <path d="M7 17h10" />
    </svg>
  );
}

function CloseIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={2} strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}


// ── Search Drawer ─────────────────────────────────────────────────────────────
function SearchDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef              = useRef<HTMLInputElement>(null);
  const router                = useRouter();

  useEffect(() => {
    if (open) { setQuery(''); setResults([]); setTimeout(() => inputRef.current?.focus(), 300); }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/discover/search?q=${encodeURIComponent(query)}`);
        if (res.ok) { const d = await res.json(); setResults(d.results ?? []); }
      } catch { /* silent */ } finally { setLoading(false); }
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  function goTo(href: string) { onClose(); router.push(href); }

  const CATEGORY_COLORS: Record<string, string> = { user: '#1877F2', post: '#7C3AED', market: '#059669', deal: '#D97706', goal: '#BE185D', default: '#4A7A96' };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 320, damping: 34 }}
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(5,8,20,0.98)', backdropFilter: 'blur(24px)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4 }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)' }} />
          </div>
          <div style={{ padding: '12px 16px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.08)', borderRadius: 14, border: '1.5px solid rgba(255,255,255,0.12)', padding: '10px 14px' }}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={2} strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} placeholder="Search the Village…"
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 16, fontWeight: 500 }} />
              {query && <button onClick={() => setQuery('')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>}
            </div>
          </div>
          {!query && (
            <div style={{ padding: '16px 16px 0', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[{ label: 'People', href: '/village/discover?type=users' }, { label: 'Content', href: '/village/discover?type=posts' }, { label: 'Market', href: '/village/trading-post/market' }, { label: 'Deals', href: '/village/trading-post/deals' }, { label: 'Goals', href: '/village/workshop' }].map(c => (
                <button key={c.label} onClick={() => goTo(c.href)} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: '8px 16px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>{c.label}</button>
              ))}
            </div>
          )}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 120px' }}>
            {loading && <div style={{ textAlign: 'center', padding: 32, color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>Searching…</div>}
            {!loading && query && results.length === 0 && <div style={{ textAlign: 'center', padding: 32, color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>No results for &ldquo;{query}&rdquo;</div>}
            {results.map((r: any, i: number) => (
              <button key={i} onClick={() => goTo(r.href ?? '/village/discover')} style={{ width: '100%', textAlign: 'left', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '12px 14px', marginBottom: 8, cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {r.avatar ? <img src={r.avatar} alt="" style={{ width: 36, height: 36, borderRadius: 18, objectFit: 'cover' }} /> : <div style={{ width: 36, height: 36, borderRadius: 18, background: CATEGORY_COLORS[r.type ?? 'default'] + '33', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 16 }}>{r.emoji ?? '🔍'}</span></div>}
                  <div><p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>{r.title}</p>{r.subtitle && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: '2px 0 0' }}>{r.subtitle}</p>}</div>
                  <div style={{ marginLeft: 'auto' }}><span style={{ background: CATEGORY_COLORS[r.type ?? 'default'] + '22', color: CATEGORY_COLORS[r.type ?? 'default'], borderRadius: 20, padding: '3px 8px', fontSize: 10, fontWeight: 700 }}>{r.type ?? 'result'}</span></div>
                </div>
              </button>
            ))}
          </div>
          <div style={{ position: 'absolute', bottom: 'calc(24px + env(safe-area-inset-bottom, 0px))', left: '50%', transform: 'translateX(-50%)' }}>
            <button onClick={onClose} style={{ width: 52, height: 52, borderRadius: 26, background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Straight-line Menu ─────────────────────────────────────────────────────────
// 7 items in a horizontal row, sliding up from above the trigger button.
function RadialMenu({ open, onClose, avatarUrl }: { open: boolean; onClose: () => void; avatarUrl: string | null }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="rm-bg"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 48, background: 'rgba(0,0,0,0.5)' }}
          />

          {/* Horizontal pill row above the trigger */}
          <motion.div
            key="rm-row"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            style={{
              position: 'fixed',
              bottom: 'calc(env(safe-area-inset-bottom, 0px) + 76px)',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 52,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-end',
              gap: 6,
              padding: '12px 14px',
              background: 'rgba(8,10,24,0.88)',
              borderRadius: 28,
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(24px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            }}
          >
            {ITEMS.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ type: 'spring', stiffness: 320, damping: 22, delay: i * 0.035 }}
              >
                <Link href={item.href} onClick={onClose}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, textDecoration: 'none' }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 22,
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: item.icon === 'profile' ? 'hidden' : 'visible',
                  }}>
                    <RadialIcon icon={item.icon} avatarUrl={avatarUrl} />
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 9, fontWeight: 800, letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>
                    {item.label}
                  </span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Inner component ───────────────────────────────────────────────────────────
function BottomNavInner() {
  const path                              = usePathname();
  const [open, setOpen]                   = useState(false);
  const [searchOpen, setSearchOpen]       = useState(false);
  const [avatarUrl, setAvatarUrl]         = useState<string | null>(null);
  const { count: unreadCount }            = useNotifications();

  const isVisible = SHOW_PREFIXES.some(p => path.startsWith(p)) && !HIDE_EXACT.some(p => path === p);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      (supabase as any).from('profiles').select('avatar_url').eq('id', user.id).single()
        .then(({ data }: any) => { if (data?.avatar_url) setAvatarUrl(data.avatar_url); });
    });
  }, []);

  useEffect(() => { setOpen(false); }, [path]);

  const handleToggle = useCallback(() => {
    if (searchOpen) { setSearchOpen(false); return; }
    setOpen(o => !o);
  }, [searchOpen]);

  if (!isVisible) return null;

  return (
    <>
      <SearchDrawer open={searchOpen} onClose={() => setSearchOpen(false)} />

      <RadialMenu
        open={open}
        onClose={() => setOpen(false)}
        avatarUrl={avatarUrl}
      />

      {/* Search — top-left, mirrors the notification bell */}
      <button onClick={() => setSearchOpen(true)}
        style={{ position: 'fixed', top: 'calc(48px + env(safe-area-inset-top, 0px))', left: 16, zIndex: 47, width: 36, height: 36, borderRadius: 18, background: 'rgba(10,10,18,0.75)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        aria-label="Search">
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={2} strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
      </button>

      {/* Notification bell — hidden on workshop (it has its own) */}
      {path !== '/village/workshop' && (
        <Link href="/village/notifications"
          style={{ position: 'fixed', top: 'calc(48px + env(safe-area-inset-top, 0px))', right: 16, zIndex: 47, width: 36, height: 36, borderRadius: 18, background: 'rgba(10,10,18,0.75)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
          aria-label="Notifications">
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={1.8} strokeLinecap="round">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
          </svg>
          {unreadCount > 0 && (
            <span style={{ position: 'absolute', top: -2, right: -2, width: 16, height: 16, borderRadius: 8, background: '#E8170A', color: '#fff', fontSize: 9, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid rgba(5,8,20,0.9)' }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
      )}

      {/* Main trigger — small, pinned to very bottom center */}
      <div style={{
        position: 'fixed',
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 6px)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 53,
      }}>
        <motion.button
          onClick={handleToggle}
          whileTap={{ scale: 0.94 }}
          transition={{ duration: 0.12 }}
          style={{
            width: 56, height: 56, borderRadius: 28,
            background: open ? 'rgba(38,33,92,0.85)' : 'transparent',
            border: open ? '1.5px solid rgba(255,255,255,0.15)' : 'none',
            boxShadow: open ? '0 4px 20px rgba(0,0,0,0.55)' : '0 4px 20px rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background 0.2s, border 0.2s',
          }}
          aria-label="Open navigation"
        >
          <AnimatePresence mode="wait" initial={false}>
            {open ? (
              <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ type: 'spring', stiffness: 380, damping: 24 }}>
                <CloseIcon size={28} />
              </motion.div>
            ) : (
              <motion.div key="logo" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ type: 'spring', stiffness: 380, damping: 24 }}>
                <Image src="/favicon.png" alt="villa9e" width={52} height={52} style={{ objectFit: 'contain', borderRadius: 26 }} priority />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </>
  );
}

export function BottomNav() {
  return (
    <Suspense fallback={null}>
      <BottomNavInner />
    </Suspense>
  );
}
