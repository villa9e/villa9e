'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';

// ── Color system ──────────────────────────────────────────────────────────────
const A = {
  day: {
    bg: '#F2F7FA', card: '#FFFFFF', border: '#D0E4EF',
    text: '#0A1F2E', textSec: '#3A5A6E', textTer: '#7A9AAE',
    surface: '#EAF3F8',
  },
  night: {
    bg: '#060F18', card: '#0E1E2E', border: '#1A3040',
    text: '#EEF4F8', textSec: '#8EB4CC', textTer: '#4A7A96',
    surface: '#091525',
  },
};

const OBJ_COLORS: Record<string, { bg: string; text: string }> = {
  awareness:   { bg: 'rgba(41,82,232,0.15)',  text: '#2952E8' },
  traffic:     { bg: 'rgba(15,118,110,0.15)', text: '#0F766E' },
  engagement:  { bg: 'rgba(124,58,237,0.15)', text: '#7C3AED' },
  video_views: { bg: 'rgba(220,38,38,0.15)',  text: '#DC2626' },
  leads:       { bg: 'rgba(22,163,74,0.15)',  text: '#16A34A' },
  sales:       { bg: 'rgba(161,98,7,0.15)',   text: '#A16207' },
};

const STATUS_DOTS: Record<string, string> = {
  active:   '#22C55E',
  learning: '#F59E0B',
  paused:   '#9CA3AF',
  error:    '#EF4444',
};

// ── Mock data ─────────────────────────────────────────────────────────────────
const CAMPAIGNS = [
  {
    id: '1', name: 'Summer Launch — DreamLine', objective: 'video_views', status: 'active',
    reach: 42100, impressions: 118400, clicks: 3210, spend: 420, budget: 600,
  },
  {
    id: '2', name: 'Trading Post Promo', objective: 'traffic', status: 'learning',
    reach: 8700, impressions: 22800, clicks: 940, spend: 180, budget: 300,
  },
  {
    id: '3', name: 'Brand Awareness Q2', objective: 'awareness', status: 'paused',
    reach: 95000, impressions: 240000, clicks: 7800, spend: 950, budget: 1000,
  },
];

const SPARKLINE_PTS = [12, 19, 14, 28, 22, 35, 30, 42, 38, 50, 44, 60, 55, 72, 68];

function Sparkline() {
  const w = 200; const h = 48;
  const min = Math.min(...SPARKLINE_PTS);
  const max = Math.max(...SPARKLINE_PTS);
  const pts = SPARKLINE_PTS.map((v, i) => {
    const x = (i / (SPARKLINE_PTS.length - 1)) * w;
    const y = h - ((v - min) / (max - min)) * h;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      <polyline points={pts} stroke="rgba(255,255,255,0.7)" strokeWidth="2" fill="none" strokeLinejoin="round" />
    </svg>
  );
}

const PERIODS = ['Today', '7 days', '30 days', 'Month'];

const PERF_STATS = [
  { label: 'Reach', value: '145,800' },
  { label: 'Impressions', value: '381,200' },
  { label: 'CTR', value: '3.14%' },
  { label: 'CPM', value: '$4.12' },
  { label: 'CPC', value: '$0.49' },
  { label: 'Clicks', value: '11,950' },
  { label: 'Video views', value: '28,400' },
  { label: 'Conversions', value: '312' },
];

const AI_TIPS = [
  'Campaign "Summer Launch" has 3x higher CTR on mobile — consider increasing mobile bid by 20%.',
  'Audience fatigue detected on "Brand Awareness Q2". Refresh creative or expand targeting by age +5 years.',
  '"Trading Post Promo" is still in learning phase. Avoid editing budget until 50 conversions reached.',
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function AdsManagerDashboard() {
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';
  const c = isNight ? A.night : A.day;
  const [period, setPeriod] = useState('7 days');

  return (
    <div style={{ background: c.bg, minHeight: '100vh', color: c.text, fontFamily: 'system-ui,sans-serif' }}>
      {/* Header */}
      <div style={{ background: c.card, borderBottom: `1px solid ${c.border}`, padding: '0 20px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/village" style={{ display: 'flex', alignItems: 'center', color: c.textSec, textDecoration: 'none' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            </Link>
            <span style={{ fontWeight: 700, fontSize: 18, color: c.text }}>Ads Manager</span>
          </div>
          <Link href="/village/ads/campaigns/create"
            style={{ background: '#2952E8', color: '#fff', padding: '8px 18px', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
            + Create campaign
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>

        {/* Account overview card */}
        <div style={{ background: '#0A5F8A', borderRadius: 16, padding: '24px 28px', marginBottom: 24, color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 4 }}>Total spend</div>
              <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: -1 }}>$1,550.00</div>
              <div style={{ fontSize: 13, opacity: 0.65, marginTop: 4 }}>Across 3 active campaigns</div>
            </div>
            <div>
              {/* Period selector */}
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.12)', borderRadius: 8, padding: 3, gap: 2 }}>
                {PERIODS.map(p => (
                  <button key={p} onClick={() => setPeriod(p)}
                    style={{ padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: period === p ? 700 : 400,
                      background: period === p ? 'rgba(255,255,255,0.25)' : 'transparent', color: '#fff' }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Stat tiles + sparkline */}
          <div style={{ display: 'flex', gap: 16, marginTop: 24, flexWrap: 'wrap' }}>
            {[
              { label: 'Reach', value: '145.8K' },
              { label: 'Impressions', value: '381.2K' },
              { label: 'Clicks', value: '11,950' },
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '12px 20px', minWidth: 120 }}>
                <div style={{ fontSize: 12, opacity: 0.7 }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, marginTop: 2 }}>{s.value}</div>
              </div>
            ))}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'flex-end' }}>
              <Sparkline />
            </div>
          </div>
        </div>

        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
          <div>
            {/* Active campaigns */}
            <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 14, marginBottom: 24, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${c.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>Active campaigns</span>
                <Link href="/village/ads/campaigns/create" style={{ color: '#2952E8', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>+ New</Link>
              </div>
              {CAMPAIGNS.map((cam) => {
                const obj = OBJ_COLORS[cam.objective] ?? OBJ_COLORS.awareness;
                const dot = STATUS_DOTS[cam.status] ?? '#9CA3AF';
                const barPct = Math.min(100, (cam.spend / cam.budget) * 100);
                return (
                  <Link key={cam.id} href={`/village/ads/campaigns/${cam.id}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ padding: '16px 20px', borderBottom: `1px solid ${c.border}` }}
                      onMouseEnter={e => (e.currentTarget.style.background = c.surface)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ width: 9, height: 9, borderRadius: '50%', background: dot, display: 'inline-block', flexShrink: 0 }} />
                          <span style={{ fontWeight: 600, fontSize: 14 }}>{cam.name}</span>
                          <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 100, fontWeight: 600,
                            background: obj.bg, color: obj.text }}>
                            {cam.objective.replace('_', ' ')}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 20, fontSize: 13, color: c.textSec }}>
                          <span>Reach <b style={{ color: c.text }}>{cam.reach.toLocaleString()}</b></span>
                          <span>Imp <b style={{ color: c.text }}>{cam.impressions.toLocaleString()}</b></span>
                          <span>Clicks <b style={{ color: c.text }}>{cam.clicks.toLocaleString()}</b></span>
                        </div>
                      </div>
                      {/* Spend bar */}
                      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ flex: 1, height: 6, background: c.surface, borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${barPct}%`, height: '100%', background: '#2952E8', borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 12, color: c.textSec, whiteSpace: 'nowrap' }}>${cam.spend} / ${cam.budget}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Performance snapshot */}
            <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${c.border}` }}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>Performance snapshot</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                {PERF_STATS.map((s, i) => (
                  <div key={s.label} style={{ padding: '14px 20px', borderBottom: i < PERF_STATS.length - 2 ? `1px solid ${c.border}` : undefined,
                    borderRight: i % 2 === 0 ? `1px solid ${c.border}` : undefined }}>
                    <div style={{ fontSize: 12, color: c.textTer, marginBottom: 3 }}>{s.label}</div>
                    <div style={{ fontWeight: 700, fontSize: 20 }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* AI recommendations */}
            <div style={{ background: '#EAF3DE', border: '1px solid #C5E0A8', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #C5E0A8', display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2">
                  <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                </svg>
                <span style={{ fontWeight: 700, fontSize: 14, color: '#14532D' }}>Spirit recommendations</span>
              </div>
              <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {AI_TIPS.map((tip, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ background: '#16A34A', color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
                    <span style={{ fontSize: 13, color: '#14532D', lineHeight: 1.5 }}>{tip}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick links */}
            <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 14, padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: c.text }}>Quick links</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Create', href: '/village/ads/campaigns/create', icon: 'M12 5v14M5 12h14' },
                  { label: 'Audiences', href: '/village/ads/audiences', icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75' },
                  { label: 'Billing', href: '/village/ads/billing', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
                  { label: 'Analytics', href: '/village/ads/analytics', icon: 'M18 20V10M12 20V4M6 20v-6' },
                ].map(ql => (
                  <Link key={ql.label} href={ql.href}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '14px 8px',
                      background: c.surface, borderRadius: 10, textDecoration: 'none', color: c.textSec,
                      border: `1px solid ${c.border}` }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isNight ? '#fff' : '#1A2DBF'} strokeWidth="2">
                      <path d={ql.icon} strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span style={{ fontSize: 13, fontWeight: 600, color: c.text }}>{ql.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
