'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';

const A = {
  day:   { bg: '#F2F7FA', card: '#FFFFFF', border: '#D0E4EF', text: '#0A1F2E', textSec: '#3A5A6E', textTer: '#7A9AAE', surface: '#EAF3F8' },
  night: { bg: '#060F18', card: '#0E1E2E', border: '#1A3040', text: '#EEF4F8', textSec: '#8EB4CC', textTer: '#4A7A96', surface: '#091525' },
};

const ALL_METRICS = [
  'Reach', 'Impressions', 'Frequency', 'CPM', 'Clicks', 'CPC', 'CTR',
  'Video views', 'Video view rate', '3-sec video views', 'ThruPlays',
  'Spend', 'Link clicks', 'Landing page views',
  'Leads', 'Cost per lead', 'Conversions', 'Cost per conversion',
  'Purchases', 'Purchase ROAS', 'Add to cart', 'Checkout initiated',
  'Post engagement', 'Page likes', 'Profile visits',
];

const BREAKDOWNS = ['Day', 'Week', 'Month', 'Placement', 'Age', 'Gender', 'Platform', 'Section', 'Geography'];

const REPORT_DATA = [
  { date: 'May 26', impressions: 18400, clicks: 512, spend: 82.40, cpm: 4.48, ctr: '2.78%' },
  { date: 'May 27', impressions: 21200, clicks: 640, spend: 94.80, cpm: 4.47, ctr: '3.02%' },
  { date: 'May 28', impressions: 19800, clicks: 590, spend: 88.20, cpm: 4.45, ctr: '2.98%' },
  { date: 'May 29', impressions: 24600, clicks: 780, spend: 108.00, cpm: 4.39, ctr: '3.17%' },
  { date: 'May 30', impressions: 22100, clicks: 694, spend: 97.40, cpm: 4.41, ctr: '3.14%' },
  { date: 'May 31', impressions: 26800, clicks: 840, spend: 116.60, cpm: 4.35, ctr: '3.13%' },
  { date: 'Jun 1',  impressions: 25200, clicks: 810, spend: 112.60, cpm: 4.47, ctr: '3.21%' },
];

// Funnel stages
const FUNNEL = [
  { label: 'Impressions',   value: 158100, pct: 100, dropoff: null },
  { label: 'Visits',        value: 4842,   pct: 3.1,  dropoff: '96.9%' },
  { label: 'Leads',         value: 628,    pct: 13.0, dropoff: '87.0%' },
  { label: 'Purchases',     value: 94,     pct: 15.0, dropoff: '85.0%' },
];

export default function AnalyticsPage() {
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';
  const c = isNight ? A.night : A.day;
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['Impressions', 'Clicks', 'Spend', 'CTR', 'CPM']);
  const [breakdown, setBreakdown] = useState('Day');

  const toggleMetric = (m: string) => {
    setSelectedMetrics(p => p.includes(m) ? p.filter(x => x !== m) : [...p, m]);
  };

  return (
    <div style={{ background: c.bg, minHeight: '100vh', color: c.text, fontFamily: 'system-ui,sans-serif' }}>
      {/* Header */}
      <div style={{ background: c.card, borderBottom: `1px solid ${c.border}`, padding: '0 20px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/village/ads" style={{ display: 'flex', alignItems: 'center', color: c.textSec, textDecoration: 'none' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            </Link>
            <span style={{ fontWeight: 700, fontSize: 16 }}>Analytics</span>
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: 7, background: c.card, border: `1px solid ${c.border}`, color: c.textSec,
            borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px', display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Left: Report builder */}
        <div>
          <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '14px 16px', borderBottom: `1px solid ${c.border}`, fontWeight: 700, fontSize: 14 }}>Metrics</div>
            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 360, overflowY: 'auto' }}>
              {ALL_METRICS.map(m => (
                <label key={m} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                  <input type="checkbox" checked={selectedMetrics.includes(m)} onChange={() => toggleMetric(m)}
                    style={{ accentColor: '#2952E8', width: 15, height: 15 }} />
                  <span style={{ color: selectedMetrics.includes(m) ? c.text : c.textSec }}>{m}</span>
                </label>
              ))}
            </div>
          </div>
          <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: `1px solid ${c.border}`, fontWeight: 700, fontSize: 14 }}>Breakdown</div>
            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {BREAKDOWNS.map(br => (
                <button key={br} onClick={() => setBreakdown(br)}
                  style={{ width: '100%', textAlign: 'left', padding: '7px 10px', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: breakdown === br ? 700 : 400,
                    background: breakdown === br ? 'rgba(41,82,232,0.08)' : 'transparent', color: breakdown === br ? '#2952E8' : c.textSec }}>
                  {br}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Data + Funnel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Report table */}
          <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${c.border}`, fontWeight: 700, fontSize: 14 }}>
              Report — {breakdown} breakdown
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${c.border}` }}>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: c.textTer, whiteSpace: 'nowrap' }}>Date</th>
                    {selectedMetrics.map(m => (
                      <th key={m} style={{ padding: '10px 16px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: c.textTer, whiteSpace: 'nowrap' }}>{m}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {REPORT_DATA.map((row) => (
                    <tr key={row.date} style={{ borderBottom: `1px solid ${c.border}` }}
                      onMouseEnter={e => (e.currentTarget.style.background = c.surface)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600 }}>{row.date}</td>
                      {selectedMetrics.map(m => {
                        const val: Record<string, unknown> = row;
                        const key = m.toLowerCase().replace(/[^a-z]/g, '');
                        const raw = val[key] ?? val[m.toLowerCase()] ?? '—';
                        return (
                          <td key={m} style={{ padding: '10px 16px', textAlign: 'right', fontSize: 13, color: c.textSec }}>
                            {typeof raw === 'number' ? (m === 'Spend' ? `$${raw.toFixed(2)}` : raw.toLocaleString()) : String(raw)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Funnel visualization */}
          <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${c.border}`, fontWeight: 700, fontSize: 14 }}>Conversion funnel</div>
            <div style={{ padding: '20px 24px' }}>
              {FUNNEL.map((stage, i) => {
                const barColor = ['#2952E8', '#7C3AED', '#0F766E', '#16A34A'][i];
                return (
                  <div key={stage.label} style={{ marginBottom: i < FUNNEL.length - 1 ? 8 : 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{stage.label}</span>
                      <span style={{ fontSize: 13, color: c.textSec }}>{stage.value.toLocaleString()}</span>
                    </div>
                    <div style={{ height: 28, background: c.surface, borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
                      <div style={{ height: '100%', width: `${stage.pct}%`, background: barColor, borderRadius: 6, transition: 'width 0.5s' }} />
                      <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: c.textSec }}>
                        {stage.pct}%
                      </span>
                    </div>
                    {stage.dropoff && i < FUNNEL.length - 1 && (
                      <div style={{ textAlign: 'center', fontSize: 11, color: '#EF4444', margin: '2px 0 4px' }}>
                        {stage.dropoff} drop-off
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
