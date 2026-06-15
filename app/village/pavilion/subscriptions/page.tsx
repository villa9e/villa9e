'use client';
import Link from 'next/link';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { PavilionNav } from '@/components/pavilion/PavilionNav';

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

      {/* Coming soon */}
      <div style={{ margin: '16px', padding: '24px 16px', borderRadius: 18, background: isNight ? 'rgba(41,82,232,0.12)' : 'rgba(41,82,232,0.07)', border: `1px solid ${isNight ? 'rgba(41,82,232,0.3)' : 'rgba(41,82,232,0.2)'}`, textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(41,82,232,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2952E8" strokeWidth={2} strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
        </div>
        <p style={{ fontSize: 15, fontWeight: 900, color: text, margin: '0 0 6px' }}>Paid subscriptions launching soon</p>
        <p style={{ fontSize: 12, color: muted, margin: 0, lineHeight: 1.6 }}>
          Creator memberships and recurring access tiers aren't live yet. For now, all Pavilion content is free to watch.
        </p>
      </div>

      {/* Browse more */}
      <div style={{ padding: '4px 16px 20px' }}>
        <Link href="/village/pavilion/creators" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 0', borderRadius: 16, background: cardBg, border: `1px dashed ${border}`, color: '#2952E8', fontWeight: 800, fontSize: 14, textDecoration: 'none' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          Discover Creators
        </Link>
      </div>

      <PavilionNav active="home" />
    </div>
  );
}
