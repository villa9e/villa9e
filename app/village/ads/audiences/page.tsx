'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';

const A = {
  day:   { bg: '#F2F7FA', card: '#FFFFFF', border: '#D0E4EF', text: '#0A1F2E', textSec: '#3A5A6E', textTer: '#7A9AAE', surface: '#EAF3F8' },
  night: { bg: '#060F18', card: '#0E1E2E', border: '#1A3040', text: '#EEF4F8', textSec: '#8EB4CC', textTer: '#4A7A96', surface: '#091525' },
};

const AUDIENCES = {
  saved: [
    { id: 's1', name: 'Urban Creators 18-34', type: 'Saved', size: '280K–380K', created: 'May 15, 2026', updated: 'Jun 1, 2026' },
    { id: 's2', name: 'Wellness Enthusiasts', type: 'Saved', size: '120K–180K', created: 'Apr 28, 2026', updated: 'May 20, 2026' },
    { id: 's3', name: 'Small Business Owners', type: 'Saved', size: '95K–140K', created: 'Apr 10, 2026', updated: 'Apr 10, 2026' },
  ],
  custom: [
    { id: 'c1', name: 'DreamLine Engagers', type: 'Custom', size: '42,000', created: 'May 20, 2026', updated: 'Jun 1, 2026' },
    { id: 'c2', name: 'Trading Post Visitors', type: 'Custom', size: '18,500', created: 'May 10, 2026', updated: 'May 31, 2026' },
    { id: 'c3', name: 'Email List — Customers', type: 'Custom', size: '8,200', created: 'May 5, 2026', updated: 'May 5, 2026' },
    { id: 'c4', name: 'Pixel — Checkout Events', type: 'Custom', size: '3,400', created: 'Apr 22, 2026', updated: 'Jun 1, 2026' },
  ],
  lookalike: [
    { id: 'l1', name: 'Lookalike of DreamLine Engagers (1%)', type: 'Lookalike', size: '380K–420K', created: 'May 22, 2026', updated: 'May 22, 2026' },
    { id: 'l2', name: 'Lookalike of Customers (2%)', type: 'Lookalike', size: '700K–850K', created: 'May 8, 2026', updated: 'May 8, 2026' },
  ],
};

type TabKey = 'saved' | 'custom' | 'lookalike';

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  Saved:     { bg: 'rgba(41,82,232,0.12)',  text: '#2952E8' },
  Custom:    { bg: 'rgba(124,58,237,0.12)', text: '#7C3AED' },
  Lookalike: { bg: 'rgba(15,118,110,0.12)', text: '#0F766E' },
};

export default function AudiencesPage() {
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';
  const c = isNight ? A.night : A.day;
  const [tab, setTab] = useState<TabKey>('saved');

  const audiences = AUDIENCES[tab];

  return (
    <div style={{ background: c.bg, minHeight: '100vh', color: c.text, fontFamily: 'system-ui,sans-serif' }}>
      {/* Header */}
      <div style={{ background: c.card, borderBottom: `1px solid ${c.border}`, padding: '0 20px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/village/ads" style={{ display: 'flex', alignItems: 'center', color: c.textSec, textDecoration: 'none' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            </Link>
            <span style={{ fontWeight: 700, fontSize: 16 }}>Audiences</span>
          </div>
          <button style={{ background: '#2952E8', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
            + Create audience
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 20px' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: c.card, borderRadius: 10, padding: 4, border: `1px solid ${c.border}`, width: 'fit-content' }}>
          {(['saved', 'custom', 'lookalike'] as TabKey[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: '8px 20px', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 14, fontWeight: tab === t ? 700 : 400,
                background: tab === t ? '#2952E8' : 'transparent', color: tab === t ? '#fff' : c.textSec, textTransform: 'capitalize' }}>
              {t}
            </button>
          ))}
        </div>

        {/* Audience grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {audiences.map(aud => {
            const tc = TYPE_COLORS[aud.type];
            return (
              <div key={aud.id} style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 14, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{aud.name}</div>
                    <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 100, fontWeight: 600, background: tc.bg, color: tc.text }}>
                      {aud.type}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, color: c.textTer }}>Estimated size</div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{aud.size}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: c.textTer }}>
                  <span>Created: {aud.created}</span>
                  <span>Updated: {aud.updated}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <button style={{ flex: 1, padding: '7px 0', background: '#2952E8', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    Use in campaign
                  </button>
                  <button style={{ padding: '7px 12px', background: 'transparent', border: `1px solid ${c.border}`, borderRadius: 7, cursor: 'pointer', color: c.textSec }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button style={{ padding: '7px 12px', background: 'transparent', border: `1px solid ${c.border}`, borderRadius: 7, cursor: 'pointer', color: '#EF4444' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
          {/* Create card */}
          <div style={{ background: c.surface, border: `2px dashed ${c.border}`, borderRadius: 14, padding: '18px 20px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', minHeight: 160 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c.textTer} strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/>
            </svg>
            <span style={{ fontSize: 14, fontWeight: 600, color: c.textSec }}>New {tab} audience</span>
          </div>
        </div>
      </div>
    </div>
  );
}
