'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { PavilionNav } from '@/components/pavilion/PavilionNav';

const MOCK_RELATED = [
  { id: 'r1', title: 'Credit Score Mastery', creator: 'creditpro', duration: '48m', color: '#059669' },
  { id: 'r2', title: 'Village Sessions: Live Jazz', creator: 'jazzvillage', duration: '1h 33m', color: '#D4A030' },
  { id: 'r3', title: 'Introduction to Web3 & DeFi', creator: 'web3village', duration: '56m', color: '#E8770A' },
];

export default function WatchPage({ params }: { params: { contentId: string } }) {
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';
  const [oowoped, setOowoped] = useState(false);

  const bg     = isNight ? '#080E24' : '#F0EFF8';
  const cardBg = isNight ? '#1A1830' : '#FFFFFF';
  const border = isNight ? '#2A2845' : '#DDD9F5';
  const text   = isNight ? '#E8E3F8' : '#1E1B4B';
  const muted  = isNight ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';

  return (
    <div style={{ minHeight: '100vh', background: bg, paddingBottom: 80 }}>
      {/* Back bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 30, background: '#000000', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/village/pavilion/browse" style={{ display: 'flex', alignItems: 'center', color: '#fff', textDecoration: 'none' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </Link>
        <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: '#fff' }}>Building a Business from $0</span>
      </div>

      {/* Video player area */}
      <div style={{ width: '100%', aspectRatio: '16/9', background: '#000', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Placeholder play icon */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </div>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Tap to play</span>
        </div>

        {/* Seek bar at bottom */}
        <div style={{ position: 'absolute', bottom: 12, left: 16, right: 16 }}>
          <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.2)', cursor: 'pointer' }}>
            <div style={{ height: '100%', width: '0%', borderRadius: 2, background: '#2952E8' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>0:00</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>1:12:00</span>
          </div>
        </div>
      </div>

      {/* Title + Actions */}
      <div style={{ padding: '16px', background: cardBg, borderBottom: `1px solid ${border}` }}>
        <h1 style={{ fontSize: 17, fontWeight: 900, color: text, marginBottom: 6, lineHeight: 1.3 }}>Building a Business from $0</h1>
        <p style={{ fontSize: 13, color: muted, marginBottom: 12 }}>@niajames · 1h 12m · 4.2K views</p>

        {/* Action row */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setOowoped(v => !v)}
            style={{ flex: 1, padding: '10px 0', borderRadius: 20, background: oowoped ? '#2952E8' : (isNight ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'), color: oowoped ? '#fff' : text, border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M18 11V8a2 2 0 00-4 0v1a2 2 0 00-2 0V8a2 2 0 00-4 0v3"/><rect x="6" y="11" width="12" height="8" rx="2"/></svg>
            {oowoped ? 'OoWop\'d' : 'OoWop'}
          </button>
          <button
            style={{ flex: 1, padding: '10px 0', borderRadius: 20, background: isNight ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)', color: text, border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
            Share
          </button>
        </div>
      </div>

      {/* Description */}
      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${border}` }}>
        <p style={{ fontSize: 13, color: text, lineHeight: 1.6 }}>
          Learn how to start and scale a business with zero capital. Nia James walks through the exact framework she used to build three 6-figure brands without outside investment.
        </p>
      </div>

      {/* GPS Connection Card */}
      <div style={{ margin: '12px 16px', padding: '14px 16px', borderRadius: 16, background: isNight ? 'rgba(41,82,232,0.12)' : 'rgba(41,82,232,0.07)', border: `1px solid ${isNight ? 'rgba(41,82,232,0.3)' : 'rgba(41,82,232,0.2)'}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2952E8" strokeWidth={2} strokeLinecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: '#2952E8', marginBottom: 2 }}>GPS Connection: Business</p>
            <p style={{ fontSize: 12, color: muted }}>This content relates to your business goals. Save to Workshop?</p>
          </div>
          <Link href="/village/workshop" style={{ padding: '7px 14px', borderRadius: 16, background: '#2952E8', color: '#fff', fontSize: 12, fontWeight: 800, textDecoration: 'none', flexShrink: 0 }}>
            Save
          </Link>
        </div>
      </div>

      {/* Related content */}
      <div style={{ padding: '0 16px' }}>
        <h2 style={{ fontSize: 15, fontWeight: 900, color: text, marginBottom: 12 }}>Related</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {MOCK_RELATED.map(r => (
            <Link key={r.id} href={`/village/pavilion/watch/${r.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
              <div style={{ width: 80, height: 52, borderRadius: 10, background: `linear-gradient(135deg, ${r.color}35, ${r.color}15)`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={r.color} strokeWidth={1.5} strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polygon points="10,8 16,12 10,16"/></svg>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: text, lineHeight: 1.3, marginBottom: 2 }}>{r.title}</p>
                <p style={{ fontSize: 11, color: muted }}>@{r.creator} · {r.duration}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <PavilionNav active="learn" />
    </div>
  );
}
