'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { PavilionNav } from '@/components/pavilion/PavilionNav';

const MOCK_SUBS = [
  { id: 's1', creator: 'Nia James', handle: 'niajames', tier: 'Creator Pass', price_usd: 9, next_billing: new Date(Date.now() + 12 * 86400000).toISOString(), color: '#BE185D' },
  { id: 's2', creator: 'Spirit AI', handle: 'spiritai', tier: 'Village Member', price_usd: 0, next_billing: null, color: '#2952E8' },
  { id: 's3', creator: 'Kwame A.', handle: 'devpath', tier: 'Dev Access', price_usd: 19, next_billing: new Date(Date.now() + 24 * 86400000).toISOString(), color: '#7C3AED' },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function SubscriptionsPage() {
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';

  const bg     = isNight ? '#080E24' : '#F0EFF8';
  const cardBg = isNight ? '#1A1830' : '#FFFFFF';
  const border = isNight ? '#2A2845' : '#DDD9F5';
  const text   = isNight ? '#E8E3F8' : '#1E1B4B';
  const muted  = isNight ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';

  return (
    <div style={{ minHeight: '100vh', background: bg, paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 30, background: isNight ? 'rgba(8,14,36,0.96)' : 'rgba(240,239,248,0.96)', backdropFilter: 'blur(16px)', borderBottom: `1px solid ${border}`, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/village/pavilion" style={{ display: 'flex', alignItems: 'center', color: text, textDecoration: 'none' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </Link>
        <h1 style={{ flex: 1, fontSize: 18, fontWeight: 900, color: text, margin: 0 }}>My Subscriptions</h1>
      </div>

      {/* Summary card */}
      <div style={{ margin: '16px', padding: '16px', borderRadius: 18, background: isNight ? 'rgba(41,82,232,0.12)' : 'rgba(41,82,232,0.07)', border: `1px solid ${isNight ? 'rgba(41,82,232,0.3)' : 'rgba(41,82,232,0.2)'}` }}>
        <p style={{ fontSize: 13, color: muted, marginBottom: 4 }}>Monthly spend</p>
        <p style={{ fontSize: 28, fontWeight: 900, color: text }}>$28<span style={{ fontSize: 14, color: muted }}>/mo</span></p>
        <p style={{ fontSize: 12, color: muted, marginTop: 4 }}>3 active subscriptions</p>
      </div>

      {/* List */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {MOCK_SUBS.map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            style={{ borderRadius: 16, overflow: 'hidden', background: cardBg, border: `1px solid ${border}` }}
          >
            <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
              {/* Avatar */}
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 16, flexShrink: 0 }}>
                {s.creator.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 900, fontSize: 15, color: text, marginBottom: 2 }}>{s.creator}</p>
                <p style={{ fontSize: 12, color: muted, marginBottom: 4 }}>{s.tier}</p>
                {s.next_billing ? (
                  <p style={{ fontSize: 11, color: muted }}>Next billing: <strong style={{ color: text }}>{formatDate(s.next_billing)}</strong></p>
                ) : (
                  <p style={{ fontSize: 11, color: '#059669', fontWeight: 700 }}>Free</p>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <span style={{ fontSize: 15, fontWeight: 900, color: text }}>{s.price_usd === 0 ? 'Free' : `$${s.price_usd}/mo`}</span>
                <button style={{ padding: '6px 14px', borderRadius: 20, background: isNight ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)', color: text, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>
                  Manage
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Browse more */}
      <div style={{ padding: '20px 16px' }}>
        <Link href="/village/pavilion/creators" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 0', borderRadius: 16, background: cardBg, border: `1px dashed ${border}`, color: '#2952E8', fontWeight: 800, fontSize: 14, textDecoration: 'none' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          Discover More Creators
        </Link>
      </div>

      <PavilionNav active="home" />
    </div>
  );
}
