'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
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

export default function AnalyticsPage() {
  const isNight = useVillageTheme(s => s.theme) === 'night';
  const c = isNight ? A.night : A.day;
  const supabase = createClient();
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['Impressions', 'Clicks', 'Spend', 'CTR', 'CPM']);
  const [breakdown, setBreakdown] = useState('Day');
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await (supabase as any)
        .from('ad_campaigns')
        .select('id,name,objective,status,daily_budget,lifetime_budget,start_date,end_date,created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setCampaigns(data ?? []);
      setLoading(false);
    })();
  }, []);

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

        {/* Right: Data */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Campaign overview */}
          <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${c.border}`, fontWeight: 700, fontSize: 14 }}>
              Campaigns — {breakdown} breakdown
            </div>
            {loading ? (
              <div style={{ padding: '32px 20px', textAlign: 'center', color: c.textTer, fontSize: 14 }}>Loading…</div>
            ) : campaigns.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 14, color: c.textSec, marginBottom: 12 }}>No campaigns yet. Analytics will appear once your first campaign delivers.</div>
                <Link href="/village/ads/campaigns/create"
                  style={{ display: 'inline-block', background: '#2952E8', color: '#fff', padding: '9px 20px', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
                  Create campaign
                </Link>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${c.border}` }}>
                      {['Campaign', 'Objective', 'Status', 'Budget/day', 'Starts', 'Ends'].map(h => (
                        <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: c.textTer, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map(cam => (
                      <tr key={cam.id} style={{ borderBottom: `1px solid ${c.border}` }}
                        onMouseEnter={e => (e.currentTarget.style.background = c.surface)}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600 }}>{cam.name}</td>
                        <td style={{ padding: '10px 16px', fontSize: 12, color: c.textSec }}>{cam.objective?.replace('_', ' ')}</td>
                        <td style={{ padding: '10px 16px', fontSize: 12, color: c.textSec }}>{cam.status}</td>
                        <td style={{ padding: '10px 16px', fontSize: 13 }}>${Number(cam.daily_budget ?? 0).toFixed(2)}</td>
                        <td style={{ padding: '10px 16px', fontSize: 12, color: c.textSec }}>{cam.start_date ?? '—'}</td>
                        <td style={{ padding: '10px 16px', fontSize: 12, color: c.textSec }}>{cam.end_date ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Delivery data notice */}
          {campaigns.length > 0 && (
            <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 14, padding: '20px 24px' }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Delivery analytics</div>
              <p style={{ fontSize: 13, color: c.textSec, margin: 0, lineHeight: 1.6 }}>
                Impression, click, spend, and conversion data will appear here once your campaigns begin delivering.
                Detailed {breakdown.toLowerCase()} breakdowns are automatically populated as your ads run.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
