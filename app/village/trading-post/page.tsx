'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { BackButton } from '@/components/village/BackButton';

// ── Icons ─────────────────────────────────────────────────────────────────────
function IconCards()  { return <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>; }
function IconStore()  { return <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M3 9l1-4h16l1 4"/><path d="M21 9v11a1 1 0 01-1 1H4a1 1 0 01-1-1V9"/><path d="M9 21V9"/><path d="M15 21V9"/></svg>; }
function IconUsers()  { return <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>; }
function IconBuilding(){ return <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><rect x="2" y="3" width="20" height="18" rx="1"/><path d="M8 21V13h8v8"/><path d="M8 7h.01M12 7h.01M16 7h.01M8 11h.01M12 11h.01M16 11h.01"/></svg>; }
function IconBell()   { return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>; }
function IconSearch() { return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>; }

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const colors = ['#2952E8','#1D9E75','#C48A20','#D4537E','#7C3AED','#0033CC'];
  const c = colors[name.charCodeAt(0) % colors.length];
  return (
    <div style={{ width: size, height: size, borderRadius: size / 2, background: c, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: size * 0.36, flexShrink: 0 }}>
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

const SECTIONS = [
  { key: 'deals',  label: 'Deals',  sub: 'Swipe investments',        href: '/village/trading-post/deals',  border: 'var(--v-brand)',   icon: <IconCards />,    iconColor: 'var(--v-brand)' },
  { key: 'market', label: 'Market', sub: 'Storefronts and services', href: '/village/trading-post/market', border: 'var(--v-gold)',    icon: <IconStore />,    iconColor: 'var(--v-gold)' },
  { key: 'tribe',  label: 'Tribe',  sub: 'Your network',             href: '/village/trading-post/tribe',  border: 'var(--v-success)', icon: <IconUsers />,    iconColor: 'var(--v-success)' },
  { key: 'office', label: 'Office', sub: 'Meetings and messages',    href: '/village/trading-post/office', border: '#D4537E',          icon: <IconBuilding />, iconColor: '#ED93B1' },
];

export default function TradingPostHub() {
  const supabase = createClient();
  const router = useRouter();
  const [stores, setStores]       = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [unread, setUnread]       = useState(0);

  useEffect(() => {
    (async () => {
      const [{ data: s }, { data: c }] = await Promise.all([
        (supabase as any).from('estores').select('id,store_name,tagline,product_types,user_id,profiles(username)').eq('status','active').order('follower_count',{ascending:false}).limit(3),
        (supabase as any).from('connections').select('id,profiles!connections_addressee_id_fkey(username,display_name)').eq('pending', false).limit(8),
      ]);
      setStores(s ?? []);
      setConnections(c ?? []);
    })();
  }, []);

  const bg    = 'var(--v-bg)';
  const card  = 'var(--v-card-bg)';
  const border= 'var(--v-card-border)';
  const text  = 'var(--v-text)';
  const muted = 'var(--v-text-muted)';
  const sub   = 'var(--v-text-sub)';

  return (
    <div style={{ minHeight: '100vh', background: bg, paddingBottom: 90 }}>
      <BackButton to="/village/map" />

      {/* Top bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, display: 'flex', alignItems: 'center', padding: '14px 16px 14px 60px', background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${border}` }}>
        <p style={{ flex: 1, fontSize: 18, fontWeight: 900, color: text }}>Trading Post</p>
        <button style={{ width: 36, height: 36, borderRadius: 18, background: 'transparent', border: 'none', color: muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconSearch />
        </button>
        <button style={{ position: 'relative', width: 36, height: 36, borderRadius: 18, background: 'transparent', border: 'none', color: muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 4 }}>
          <IconBell />
          {unread > 0 && <span style={{ position: 'absolute', top: 4, right: 4, width: 14, height: 14, borderRadius: 7, background: 'var(--v-gold)', color: '#fff', fontSize: 8, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unread}</span>}
        </button>
      </div>

      <div style={{ padding: '16px' }}>
        {/* 4-tile hub grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 24 }}>
          {SECTIONS.map((s, i) => (
            <motion.div key={s.key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Link href={s.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', background: card, border: `1px solid ${s.border}`, borderRadius: 14, padding: '20px 12px', gap: 8, minHeight: 90 }}>
                <div style={{ color: s.iconColor }}>{s.icon}</div>
                <p style={{ fontSize: 14, fontWeight: 800, color: text, margin: 0 }}>{s.label}</p>
                <p style={{ fontSize: 10, color: muted, margin: 0, textAlign: 'center' }}>{s.sub}</p>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Active in market */}
        {stores.length > 0 && (
          <>
            <p style={{ fontSize: 10, fontWeight: 900, color: 'var(--v-gold)', letterSpacing: '0.06em', marginBottom: 10 }}>ACTIVE IN MARKET</p>
            <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, overflow: 'hidden', marginBottom: 20 }}>
              {stores.map((store, i) => (
                <Link key={store.id} href={`/village/trading-post/market/${store.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', textDecoration: 'none', borderBottom: i < stores.length - 1 ? `1px solid ${border}` : 'none' }}>
                  <Avatar name={store.store_name} size={38} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: text, margin: 0, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{store.store_name}</p>
                    <p style={{ fontSize: 11, color: muted, margin: 0, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{store.tagline}</p>
                    {store.product_types?.length > 0 && (
                      <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                        {(store.product_types as string[]).slice(0, 2).map(t => (
                          <span key={t} className="pill pill-blue" style={{ fontSize: 9 }}>{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={sub} strokeWidth={2} strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* New in tribe */}
        {connections.length > 0 && (
          <>
            <p style={{ fontSize: 10, fontWeight: 900, color: 'var(--v-text-sub)', letterSpacing: '0.06em', marginBottom: 10 }}>NEW IN TRIBE</p>
            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
              {connections.slice(0, 8).map((c: any) => {
                const name = c.profiles?.display_name ?? c.profiles?.username ?? 'V';
                return (
                  <div key={c.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    <Avatar name={name} size={44} />
                    <p style={{ fontSize: 9, color: muted, fontWeight: 700, textAlign: 'center', maxWidth: 44, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{name.split(' ')[0]}</p>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Quick-start CTAs if no content */}
        {stores.length === 0 && (
          <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, padding: 20, textAlign: 'center', marginBottom: 16 }}>
            <p style={{ fontSize: 28, marginBottom: 8 }}>🏪</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: text, marginBottom: 6 }}>The market is open</p>
            <p style={{ fontSize: 12, color: muted, marginBottom: 14 }}>Be the first to list your store and start building your village income.</p>
            <Link href="/village/trading-post/market/create" style={{ display: 'inline-block', background: 'var(--v-gold)', color: '#fff', borderRadius: 20, padding: '10px 24px', fontSize: 13, fontWeight: 900, textDecoration: 'none' }}>
              Open Your Store
            </Link>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--v-card-bg)', borderTop: `1px solid ${border}`, display: 'flex', paddingBottom: 'env(safe-area-inset-bottom,0px)', zIndex: 30 }}>
        {SECTIONS.map(s => (
          <Link key={s.key} href={s.href} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '8px 0', textDecoration: 'none', color: sub }}>
            <div style={{ fontSize: 14 }}>{s.icon}</div>
            <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.04em' }}>{s.label.toUpperCase()}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
