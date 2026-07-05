'use client';
import Link from 'next/link';
import WorkshopTabBar from '@/components/village/WorkshopTabBar';

export default function GpsEmptyState() {
  return (
    <div style={{ height: '100dvh', background: '#0a1220', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 32px', gap: 16 }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#0d1626', border: '1px solid #2a3a55', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="#4D72FF" strokeWidth={1.8} strokeLinecap="round">
            <path d="M3 12h18M3 6h18M3 18h12"/>
          </svg>
        </div>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#E1F5EE', textAlign: 'center' }}>
          No active goal yet
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: '#7a92b0', textAlign: 'center', lineHeight: 1.6, maxWidth: 280 }}>
          Create a SMART goal and activate GPS to see your turn-by-turn route and start mining $VLG.
        </p>
        <Link href="/village/workshop/chat"
          style={{ marginTop: 8, background: '#534AB7', border: 'none', borderRadius: 12, padding: '12px 24px', color: '#EEEDFE', fontSize: 14, fontWeight: 600, textDecoration: 'none', cursor: 'pointer' }}>
          Talk to Spirit
        </Link>
      </div>
      <WorkshopTabBar active="GPS" />
    </div>
  );
}
