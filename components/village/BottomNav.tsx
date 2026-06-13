'use client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useRef, Suspense, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useNotifications } from '@/lib/hooks/useNotifications';

export const SHOW_PREFIXES = ['/village', '/notifications', '/messages', '/admin', '/trading-post'];
export const HIDE_EXACT    = ['/login', '/signup', '/onboarding'];

const ITEMS = [
  { href: '/village/workshop', label: 'Workshop',     path: 'M9.5 3C7 3 5 5.2 5 7.8c0 1 .3 2 .9 2.8A4 4 0 004 14c0 2.2 1.8 4 4 4h8c2.2 0 4-1.8 4-4a4 4 0 00-.9-2.4c.5-.8.9-1.8.9-2.8C20 5.2 18 3 15.5 3c-1 0-2 .4-2.7 1C12.1 3.4 10.9 3 9.5 3z' },
  { href: '/village/workshop', label: 'Goals',        path: 'M12 22a10 10 0 100-20 10 10 0 000 20zm0-4a6 6 0 100-12 6 6 0 000 12zm0-4a2 2 0 100-4 2 2 0 000 4z' },
  { href: '/village/create',   label: 'Create',       path: 'M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2zM12 10a4 4 0 100 8 4 4 0 000-8zm2 4h-1.5v-1.5a.5.5 0 00-1 0V14H10a.5.5 0 000 1h1.5v1.5a.5.5 0 001 0V15H14a.5.5 0 000-1z' },
  { href: '/village/dreamline',     label: 'DreamLine',    path: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
  { href: '/village/trading-post',  label: 'Trading Post', path: 'M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01' },
  { href: '/village/bank',          label: 'Bank',         path: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9zM9 22V12h6v10' },
] as const;

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

// ── Nav Drawer (bottom sheet) ─────────────────────────────────────────────────
function NavDrawer({ open, onClose, avatarUrl, onSearch }: { open: boolean; onClose: () => void; avatarUrl: string | null; onSearch: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div key="nd-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 48, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)' }} />

          {/* Sheet */}
          <motion.div key="nd-sheet"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 36 }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 52,
              background: 'rgba(8,10,22,0.97)', backdropFilter: 'blur(28px)',
              borderRadius: '22px 22px 0 0',
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 72px)',
            }}
          >
            {/* Handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 6px' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)' }} />
            </div>

            {/* Search + Profile row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 12px' }}>
              <button onClick={() => { onClose(); onSearch(); }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '8px 14px', cursor: 'pointer', flex: 1, marginRight: 12 }}>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={2} strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Search the Village…</span>
              </button>
              <Link href="/village/hut" onClick={onClose}
                style={{ width: 40, height: 40, borderRadius: 20, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.5)', background: '#1877F2', display: 'block', flexShrink: 0 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatarUrl || '/default-avatar.png'} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </Link>
            </div>

            {/* Nav items — 3-column grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: '0 16px' }}>
              {ITEMS.map((item, idx) => (
                <motion.div key={item.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04, type: 'spring', stiffness: 380, damping: 26 }}>
                  <Link href={item.href} onClick={onClose}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '14px 8px', background: 'rgba(255,255,255,0.04)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', textDecoration: 'none' }}>
                    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                      <path d={item.path} />
                    </svg>
                    <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: 800, letterSpacing: '0.02em', textAlign: 'center', lineHeight: 1.2 }}>{item.label}</span>
                  </Link>
                </motion.div>
              ))}
            </div>
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

      <NavDrawer
        open={open}
        onClose={() => setOpen(false)}
        avatarUrl={avatarUrl}
        onSearch={() => setSearchOpen(true)}
      />

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
          whileTap={{ scale: 0.88 }}
          style={{
            width: 44, height: 44, borderRadius: 22,
            background: open ? 'rgba(24,119,242,0.22)' : 'rgba(10,10,18,0.82)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: open ? '1.5px solid rgba(24,119,242,0.7)' : '1.5px solid rgba(255,255,255,0.18)',
            boxShadow: open ? '0 0 24px rgba(24,119,242,0.45), 0 4px 16px rgba(0,0,0,0.5)' : '0 4px 20px rgba(0,0,0,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background 0.2s, border 0.2s, box-shadow 0.2s',
          }}
          aria-label="Open navigation"
        >
          <motion.div animate={{ rotate: open ? 45 : 0 }} transition={{ type: 'spring', stiffness: 380, damping: 24 }}>
            <Image src="/village-icon-button.png" width={30} height={30} alt="The Village" style={{ objectFit: 'contain', display: 'block' }} priority />
          </motion.div>
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
