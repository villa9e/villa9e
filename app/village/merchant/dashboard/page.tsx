'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';

// ── Icons ────────────────────────────────────────────────────────────────────
function ArrowRight() {
  return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>;
}
function QRIcon() {
  return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><path d="M14 14h.01M14 18h.01M18 14h.01M18 18h.01M21 14v.01M14 21v.01M21 21v.01" /></svg>;
}
function LinkIcon() {
  return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>;
}
function FileIcon() {
  return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>;
}
function SettingsIcon() {
  return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>;
}
function MapPinIcon() {
  return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>;
}
function SparkIcon() {
  return <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>;
}
function TrendUpIcon() {
  return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>;
}

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_TRANSACTIONS = [
  { id: 1, name: '@jade_ceramics', amount: 85, desc: 'Custom mug set', method: 'qr',   status: 'completed', time: '2h ago' },
  { id: 2, name: '@marcus_builds', amount: 120, desc: 'Website consultation', method: 'link', status: 'completed', time: '5h ago' },
  { id: 3, name: 'Guest',          amount: 30,  desc: 'Market stall purchase', method: 'qr', status: 'completed', time: '1d ago' },
  { id: 4, name: '@priya_yoga',   amount: 55,  desc: 'Private session', method: 'invoice', status: 'pending', time: '1d ago' },
  { id: 5, name: '@dj_soleil',    amount: 950, desc: 'Event booking', method: 'link', status: 'completed', time: '2d ago' },
];

const PERIOD_DATA: Record<string, { vico: number; usd: string; txCount: number; customers: number; avg: string }> = {
  Today:     { vico: 215,  usd: '$21.50',  txCount: 4,  customers: 3,  avg: '53.75' },
  Week:      { vico: 1240, usd: '$124.00', txCount: 18, customers: 12, avg: '68.89' },
  Month:     { vico: 4820, usd: '$482.00', txCount: 67, customers: 38, avg: '71.94' },
  'All time':{ vico: 12450, usd: '$1,245.00', txCount: 198, customers: 95, avg: '62.88' },
};

const AI_INSIGHTS = [
  'Your Tuesday peak hours (2-6pm) generate 40% of weekly revenue — consider targeted promos.',
  'Repeat customer rate is 31% — up 8pts from last month. Loyalty is building.',
  'QR payments average 2x higher than payment links. Optimize your in-person setup.',
];

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const colors = ['#BA7517','#1D9E75','#2952E8','#D4537E','#7C3AED'];
  const c = colors[name.charCodeAt(0) % colors.length];
  return (
    <div style={{ width: size, height: size, borderRadius: size / 2, background: c, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: size * 0.38, flexShrink: 0 }}>
      {name.replace('@','').slice(0,1).toUpperCase()}
    </div>
  );
}

function MethodBadge({ method }: { method: string }) {
  const map: Record<string, { label: string; color: string }> = {
    qr:      { label: 'QR', color: '#EF9F27' },
    link:    { label: 'Link', color: '#2952E8' },
    invoice: { label: 'Invoice', color: '#7C3AED' },
  };
  const m = map[method] ?? { label: method, color: '#888' };
  return (
    <span style={{ padding: '2px 7px', borderRadius: 6, background: `${m.color}22`, color: m.color, fontSize: 10, fontWeight: 700 }}>
      {m.label}
    </span>
  );
}

// ── Mini map preview (static SVG) ──────────────────────────────────────────
function MiniMapPreview({ isNight }: { isNight: boolean }) {
  return (
    <div style={{ borderRadius: 10, overflow: 'hidden', height: 120, position: 'relative', background: isNight ? '#1A1F2E' : '#E8F4EA' }}>
      <svg width="100%" height="120" viewBox="0 0 320 120">
        <rect width="320" height="120" fill={isNight ? '#1A1F2E' : '#E8F4EA'} />
        {/* Streets */}
        <line x1="0" y1="60" x2="320" y2="60" stroke={isNight ? '#2A3040' : '#C8DCC8'} strokeWidth="6" />
        <line x1="160" y1="0" x2="160" y2="120" stroke={isNight ? '#2A3040' : '#C8DCC8'} strokeWidth="6" />
        <line x1="0" y1="30" x2="320" y2="30" stroke={isNight ? '#252A38' : '#D4E8D4'} strokeWidth="3" />
        <line x1="0" y1="90" x2="320" y2="90" stroke={isNight ? '#252A38' : '#D4E8D4'} strokeWidth="3" />
        <line x1="80" y1="0" x2="80" y2="120" stroke={isNight ? '#252A38' : '#D4E8D4'} strokeWidth="3" />
        <line x1="240" y1="0" x2="240" y2="120" stroke={isNight ? '#252A38' : '#D4E8D4'} strokeWidth="3" />
        {/* Merchant pins */}
        {[[160,60],[100,35],[200,80],[60,75],[260,40]].map(([x,y],i) => (
          <g key={i}>
            <circle cx={x} cy={y} r={10} fill="#EF9F27" stroke="white" strokeWidth="1.5" />
            <path d={`M${x} ${y-5}L${x-4} ${y+3}h3l0.5-1.5h1.5l0.5 1.5h3L${x} ${y-5}z`} fill="rgba(0,0,0,0.3)" />
            {i === 0 && <circle cx={x} cy={y} r={14} fill="none" stroke="#EF9F27" strokeWidth="1.5" strokeDasharray="3 2" />}
          </g>
        ))}
      </svg>
      <div style={{ position: 'absolute', bottom: 8, right: 8 }}>
        <Link href="/village/merchant/map" style={{
          padding: '5px 10px', background: 'rgba(0,0,0,0.6)', borderRadius: 6,
          color: 'white', fontSize: 11, fontWeight: 600, textDecoration: 'none',
          backdropFilter: 'blur(4px)',
        }}>
          Open map
        </Link>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function MerchantDashboardPage() {
  const isNight = useVillageTheme(s => s.theme) === 'night';
  const [period, setPeriod] = useState<keyof typeof PERIOD_DATA>('Week');
  const data = PERIOD_DATA[period];

  const pageBg      = isNight ? '#1A1400' : '#FFFBF2';
  const heroBg      = '#412402';
  const cardBg      = isNight ? '#221A00' : '#FFFFFF';
  const cardBorder  = isNight ? '1px solid #3A2800' : '1px solid #F0D9B0';
  const textPrimary = isNight ? '#F5E6C8' : '#2D1A00';
  const textMuted   = isNight ? '#9B7A3A' : '#8B6230';
  const accent      = '#EF9F27';
  const btnBg       = isNight ? '#EF9F27' : '#BA7517';

  const QUICK_LINKS = [
    { label: 'QR Code',     href: '/village/merchant/payments',     icon: <QRIcon /> },
    { label: 'Payment Link', href: '/village/merchant/payments',    icon: <LinkIcon /> },
    { label: 'Invoice',     href: '/village/merchant/invoices',      icon: <FileIcon /> },
    { label: 'Settings',    href: '/village/merchant/settings',      icon: <SettingsIcon /> },
  ];

  const STAT_TILES = [
    { label: 'Total Received', value: `${data.vico.toLocaleString()} VICO`, sub: data.usd, icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'USD Equivalent', value: data.usd, sub: `at $0.10/VICO`, icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
    { label: 'Transactions', value: data.txCount.toString(), sub: 'payments processed', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { label: 'Unique Customers', value: data.customers.toString(), sub: `${data.avg} avg VICO`, icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: pageBg, paddingBottom: 80 }}>
      {/* Hero */}
      <div style={{ background: heroBg, padding: '52px 20px 24px', position: 'relative' }}>
        <Link href="/village/merchant" style={{
          position: 'absolute', top: 16, left: 16,
          display: 'flex', alignItems: 'center', gap: 6,
          color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 14,
        }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Merchant
        </Link>

        <div style={{ marginBottom: 4 }}>
          <span style={{ display: 'inline-block', padding: '3px 10px', background: 'rgba(239,159,39,0.2)', borderRadius: 6, color: accent, fontSize: 11, fontWeight: 700, marginBottom: 10 }}>
            DASHBOARD
          </span>
        </div>
        <div style={{ color: 'white', fontSize: 32, fontWeight: 800, letterSpacing: -0.5 }}>
          {data.vico.toLocaleString()} <span style={{ color: accent, fontSize: 20 }}>VICO</span>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, marginTop: 2 }}>
          {data.usd} USD equiv
        </div>

        {/* Period pills */}
        <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
          {(['Today','Week','Month','All time'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
              background: period === p ? accent : 'rgba(255,255,255,0.12)',
              color: period === p ? '#412402' : 'rgba(255,255,255,0.75)',
              fontWeight: 700, fontSize: 12,
            }}>
              {p}
            </button>
          ))}
        </div>

        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 12 }}>
          {data.txCount} transactions · {data.customers} customers · {data.avg} avg VICO
        </div>
      </div>

      <div style={{ padding: '20px 16px 0' }}>
        {/* Quick links */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
          {QUICK_LINKS.map(ql => (
            <Link key={ql.label} href={ql.href} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: cardBg, border: cardBorder, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent }}>
                {ql.icon}
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, color: textMuted, textAlign: 'center' }}>{ql.label}</span>
            </Link>
          ))}
        </div>

        {/* Stat grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          {STAT_TILES.map(tile => (
            <div key={tile.label} style={{ background: cardBg, border: cardBorder, borderRadius: 12, padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d={tile.icon} />
                </svg>
                <span style={{ fontSize: 10, color: textMuted, fontWeight: 500 }}>{tile.label}</span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: textPrimary, letterSpacing: -0.3 }}>{tile.value}</div>
              <div style={{ fontSize: 11, color: textMuted, marginTop: 2 }}>{tile.sub}</div>
            </div>
          ))}
        </div>

        {/* Payout status */}
        <div style={{ background: cardBg, border: cardBorder, borderRadius: 12, padding: '16px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: textPrimary }}>Payout Status</span>
            <span style={{ padding: '3px 10px', borderRadius: 20, background: `${accent}22`, color: accent, fontSize: 11, fontWeight: 700 }}>
              Holding VICO
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: textMuted }}>Balance</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: textPrimary }}>1,240 VICO</span>
          </div>
          <div style={{ height: 6, background: isNight ? '#3A2800' : '#F0D9B0', borderRadius: 3 }}>
            <div style={{ width: '62%', height: 6, background: accent, borderRadius: 3 }} />
          </div>
          <div style={{ fontSize: 11, color: textMuted, marginTop: 6 }}>62% of monthly goal · 767 VICO to target</div>
        </div>

        {/* Recent transactions */}
        <div style={{ background: cardBg, border: cardBorder, borderRadius: 12, padding: '16px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: textPrimary }}>Recent Transactions</span>
            <Link href="/village/merchant/transactions" style={{ display: 'flex', alignItems: 'center', gap: 4, color: accent, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
              View all <ArrowRight />
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {MOCK_TRANSACTIONS.map(tx => (
              <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar name={tx.name} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.name}</div>
                  <div style={{ fontSize: 11, color: textMuted }}>{tx.desc} · {tx.time}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: textPrimary }}>{tx.amount} VICO</div>
                  <MethodBadge method={tx.method} />
                </div>
                <span style={{
                  padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, marginLeft: 4,
                  background: tx.status === 'completed' ? '#1D9E7522' : `${accent}22`,
                  color: tx.status === 'completed' ? '#1D9E75' : accent,
                }}>
                  {tx.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Merchant map preview */}
        <div style={{ background: cardBg, border: cardBorder, borderRadius: 12, padding: '16px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ color: accent }}><MapPinIcon /></div>
              <span style={{ fontSize: 13, fontWeight: 700, color: textPrimary }}>Merchant Map</span>
            </div>
            <span style={{ padding: '3px 8px', borderRadius: 6, background: '#1D9E7522', color: '#1D9E75', fontSize: 10, fontWeight: 700 }}>Listed</span>
          </div>
          <MiniMapPreview isNight={isNight} />
        </div>

        {/* AI Insights */}
        <div style={{ background: isNight ? '#001A0F' : '#F0FFF8', border: isNight ? '1px solid #003820' : '1px solid #9DD8B8', borderRadius: 12, padding: '16px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#1D9E75', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <SparkIcon />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: isNight ? '#7DFFC0' : '#0D5C38' }}>Spirit Insights</div>
              <div style={{ fontSize: 10, color: isNight ? '#3D8C6A' : '#5DA882' }}>AI-powered merchant analysis</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {AI_INSIGHTS.map((insight, i) => (
              <div key={i} style={{ display: 'flex', gap: 10 }}>
                <div style={{ color: '#1D9E75', marginTop: 2, flexShrink: 0 }}><TrendUpIcon /></div>
                <span style={{ fontSize: 12, color: isNight ? '#A0D4BC' : '#1A5C3A', lineHeight: 1.5 }}>{insight}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Link href="/village/merchant/payments" style={{
            padding: '14px', borderRadius: 12, background: btnBg,
            color: isNight ? '#412402' : 'white', fontWeight: 700, fontSize: 13,
            textDecoration: 'none', textAlign: 'center', display: 'block',
          }}>
            Generate QR
          </Link>
          <Link href="/village/merchant/invoices" style={{
            padding: '14px', borderRadius: 12, background: cardBg, border: cardBorder,
            color: textPrimary, fontWeight: 700, fontSize: 13,
            textDecoration: 'none', textAlign: 'center', display: 'block',
          }}>
            New Invoice
          </Link>
        </div>
      </div>
    </div>
  );
}
