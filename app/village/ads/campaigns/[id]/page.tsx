'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';

const A = {
  day:   { bg: '#F2F7FA', card: '#FFFFFF', border: '#D0E4EF', text: '#0A1F2E', textSec: '#3A5A6E', textTer: '#7A9AAE', surface: '#EAF3F8' },
  night: { bg: '#060F18', card: '#0E1E2E', border: '#1A3040', text: '#EEF4F8', textSec: '#8EB4CC', textTer: '#4A7A96', surface: '#091525' },
};

const OBJ_COLORS: Record<string, { bg: string; text: string }> = {
  awareness:   { bg: 'rgba(41,82,232,0.15)',  text: '#2952E8' },
  traffic:     { bg: 'rgba(15,118,110,0.15)', text: '#0F766E' },
  engagement:  { bg: 'rgba(124,58,237,0.15)', text: '#7C3AED' },
  video_views: { bg: 'rgba(220,38,38,0.15)',  text: '#DC2626' },
  leads:       { bg: 'rgba(22,163,74,0.15)',  text: '#16A34A' },
  sales:       { bg: 'rgba(161,98,7,0.15)',   text: '#A16207' },
};

const STATUS_COLORS: Record<string, string> = {
  active: '#22C55E', learning: '#F59E0B', paused: '#9CA3AF', error: '#EF4444',
};

const CAMPAIGN = {
  id: '1', name: 'Summer Launch — DreamLine', objective: 'video_views', status: 'active',
};

const CHART_DATA = [12, 18, 15, 28, 24, 38, 32, 46, 41, 55, 49, 64, 58, 72, 68, 80, 75, 88];

const AD_SETS = [
  { id: 'as1', name: 'DreamLine — 18-34 Urban', status: 'active', budget: 200, reach: 18400, impressions: 52000, clicks: 1420 },
  { id: 'as2', name: 'Workshop — Creators', status: 'active', budget: 120, reach: 12800, impressions: 34000, clicks: 980 },
  { id: 'as3', name: 'Profile Suggested', status: 'paused', budget: 80, reach: 6200, impressions: 18200, clicks: 480 },
];

const METRICS = ['Reach', 'Impressions', 'Clicks', 'Spend', 'CPM', 'CTR'];
const BREAKDOWNS = ['Day', 'Week', 'Placement', 'Age', 'Gender'];

function MiniChart({ data }: { data: number[] }) {
  const w = 400; const h = 80;
  const min = Math.min(...data); const max = Math.max(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - 8 - ((v - min) / (max - min)) * (h - 16);
    return `${x},${y}`;
  }).join(' ');
  const area = `0,${h} ` + pts + ` ${w},${h}`;
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2952E8" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#2952E8" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#chartGrad)"/>
      <polyline points={pts} stroke="#2952E8" strokeWidth="2.5" fill="none" strokeLinejoin="round"/>
    </svg>
  );
}

export default function CampaignDetailPage() {
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';
  const c = isNight ? A.night : A.day;
  const [status, setStatus] = useState(CAMPAIGN.status);
  const [activeMetic, setActiveMetric] = useState('Impressions');
  const [breakdown, setBreakdown] = useState('Day');

  const obj = OBJ_COLORS[CAMPAIGN.objective] ?? OBJ_COLORS.awareness;
  const statusColor = STATUS_COLORS[status] ?? '#9CA3AF';

  return (
    <div style={{ background: c.bg, minHeight: '100vh', color: c.text, fontFamily: 'system-ui,sans-serif' }}>
      {/* Header */}
      <div style={{ background: c.card, borderBottom: `1px solid ${c.border}`, padding: '0 20px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/village/ads" style={{ display: 'flex', alignItems: 'center', color: c.textSec, textDecoration: 'none' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            </Link>
            <span style={{ fontWeight: 700, fontSize: 16 }}>{CAMPAIGN.name}</span>
            <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 100, fontWeight: 600, background: obj.bg, color: obj.text }}>
              {CAMPAIGN.objective.replace('_', ' ')}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: c.textSec }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor, display: 'inline-block' }}/>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>
          {/* Pause / Resume toggle */}
          <button onClick={() => setStatus(s => s === 'active' ? 'paused' : 'active')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
              background: status === 'active' ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
              border: `1px solid ${status === 'active' ? '#EF4444' : '#22C55E'}`,
              borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700,
              color: status === 'active' ? '#EF4444' : '#22C55E' }}>
            {status === 'active' ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>
                Pause
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                Resume
              </>
            )}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>
        {/* Performance card */}
        <div style={{ background: '#0A1A2E', borderRadius: 16, padding: '24px', marginBottom: 24, color: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 4 }}>Performance — last 18 days</div>
              <div style={{ fontSize: 30, fontWeight: 700 }}>42,100 reach</div>
            </div>
            {/* Metric selector */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {METRICS.map(m => (
                <button key={m} onClick={() => setActiveMetric(m)}
                  style={{ padding: '5px 12px', border: 'none', borderRadius: 16, cursor: 'pointer', fontSize: 12, fontWeight: activeMetic === m ? 700 : 400,
                    background: activeMetic === m ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)', color: '#fff' }}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          <MiniChart data={CHART_DATA} />
          {/* Metrics row */}
          <div style={{ display: 'flex', gap: 24, marginTop: 16, flexWrap: 'wrap' }}>
            {[
              { l: 'Impressions', v: '118,400' },
              { l: 'Clicks', v: '3,210' },
              { l: 'CTR', v: '2.71%' },
              { l: 'Spend', v: '$420.00' },
              { l: 'CPM', v: '$3.55' },
              { l: 'CPC', v: '$0.13' },
            ].map(s => (
              <div key={s.l}>
                <div style={{ fontSize: 11, opacity: 0.6 }}>{s.l}</div>
                <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>{s.v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Ad Sets */}
        <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 14, marginBottom: 24, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${c.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>Ad sets</span>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {/* Breakdown selector */}
              <div style={{ display: 'flex', gap: 6 }}>
                {BREAKDOWNS.map(br => (
                  <button key={br} onClick={() => setBreakdown(br)}
                    style={{ padding: '5px 10px', border: `1px solid ${breakdown === br ? '#2952E8' : c.border}`,
                      background: breakdown === br ? 'rgba(41,82,232,0.08)' : 'transparent',
                      borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                      color: breakdown === br ? '#2952E8' : c.textSec }}>
                    {br}
                  </button>
                ))}
              </div>
              <button style={{ background: '#2952E8', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                + New ad set
              </button>
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${c.border}` }}>
                {['Ad set', 'Status', 'Budget', 'Reach', 'Impressions', 'Clicks'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: c.textTer }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {AD_SETS.map(as => (
                <tr key={as.id} style={{ borderBottom: `1px solid ${c.border}` }}
                  onMouseEnter={e => (e.currentTarget.style.background = c.surface)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: 14 }}>{as.name}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: STATUS_COLORS[as.status], display: 'inline-block' }}/>
                      {as.status.charAt(0).toUpperCase() + as.status.slice(1)}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: c.textSec }}>${as.budget}/day</td>
                  <td style={{ padding: '12px 16px', fontSize: 13 }}>{as.reach.toLocaleString()}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13 }}>{as.impressions.toLocaleString()}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13 }}>{as.clicks.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
