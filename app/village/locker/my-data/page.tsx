'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';

const L = {
  day:   { bg:'#F2FAF8', card:'#FFFFFF', border:'#D0EDE6', text:'#0A1F14', textSec:'#3A6A5A', textTer:'#7AA89A' },
  night: { bg:'#060F0D', card:'#0C1A17', border:'#0F2820', text:'#E8F5F0', textSec:'#8ABFB0', textTer:'#4A8070' },
};

const NAV_ITEMS = [
  { label:'Home',        href:'/village/locker' },
  { label:'My Data',     href:'/village/locker/my-data' },
  { label:'Permissions', href:'/village/locker/permissions' },
  { label:'Earnings',    href:'/village/locker/earnings' },
  { label:'Marketplace', href:'/village/locker/marketplace' },
  { label:'Audit Log',   href:'/village/locker/audit' },
  { label:'Export',      href:'/village/locker/export' },
  { label:'Delete',      href:'/village/locker/delete' },
];

const SECTIONS = [
  {
    id: 'workshop',
    name: 'Workshop',
    icon: 'M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z',
    points: [
      'Goal categories you have created (not titles)',
      'Sprint completion rates and frequency',
      'Goal probability scores (aggregated)',
      'Time spent in goal tracking sessions',
      'Workshop feature usage patterns',
    ],
  },
  {
    id: 'dreamline',
    name: 'DreamLine',
    icon: 'M22 12h-4l-3 9L9 3l-3 9H2',
    points: [
      'Content categories you engage with',
      'Scroll depth and watch completion rates',
      'Skip patterns and content preferences',
      'Time-of-day activity patterns in DreamLine',
      'Saved and bookmarked content categories',
    ],
  },
  {
    id: 'create',
    name: 'Create (Studio)',
    icon: 'M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z',
    points: [
      'Content types you create (video, audio, text)',
      'Publishing frequency and schedule patterns',
      'Engagement received on your posts (aggregated)',
      'Collaboration patterns with other creators',
      'Creative session duration statistics',
    ],
  },
  {
    id: 'trading-post',
    name: 'Trading Post',
    icon: 'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0',
    points: [
      'Product categories browsed and purchased',
      'Vendor rating behavior (not amounts)',
      'Purchase timing and frequency patterns',
      'Wishlist and saved item categories',
      'Return and review behavior patterns',
    ],
  },
  {
    id: 'bank',
    name: 'Village Bank',
    icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    points: [
      'Spending category distribution (never amounts)',
      'Savings rate trend (never balances)',
      'Investment category preferences',
      'Bill payment timing patterns',
      'Financial goal categories (not targets)',
    ],
  },
  {
    id: 'wellness',
    name: 'Wellness',
    icon: 'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z',
    points: [
      'Health feature engagement patterns',
      'Wellness goal category activity',
      'Exercise tracking frequency (not specific data)',
      'Mental wellness module usage patterns',
      'Sleep quality trend signals (aggregated)',
    ],
  },
  {
    id: 'spaces',
    name: 'Spaces',
    icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z',
    points: [
      'Space categories you belong to',
      'Participation frequency in community spaces',
      'Role type in spaces (member, organizer)',
      'Event attendance patterns',
      'Space discovery and join patterns',
    ],
  },
  {
    id: 'pavilion',
    name: 'Pavilion',
    icon: 'M15.6 11.6L22 7v10l-6.4-4.5v-0.9zM2 7h12v10H2z',
    points: [
      'Entertainment categories you watch',
      'Viewing session duration patterns',
      'Genre preferences (aggregated)',
      'Interaction frequency with live events',
      'Content recommendation acceptance rate',
    ],
  },
  {
    id: 'profile',
    name: 'Profile',
    icon: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 7a4 4 0 100 8 4 4 0 000-8z',
    points: [
      'Account creation date and activity age',
      'Language and region settings',
      'Feature adoption patterns (not content)',
      'Session frequency and duration trends',
      'Device type category (mobile/desktop)',
    ],
  },
];

export default function MyData() {
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';
  const c = isNight ? L.night : L.day;
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [format, setFormat] = useState<'json'|'csv'|'pdf'>('json');

  function toggle(id: string) {
    setOpen(prev => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div style={{ background:c.bg, minHeight:'100vh', maxWidth:480, margin:'0 auto', paddingBottom:88 }}>
      {/* Top bar */}
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'16px 20px 12px', background:c.card, borderBottom:`1px solid ${c.border}` }}>
        <Link href="/village/locker" style={{ textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'center', width:36, height:36, borderRadius:'50%', border:`1px solid ${c.border}` }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </Link>
        <span style={{ fontWeight:800, fontSize:18, color:c.text, letterSpacing:-0.5 }}>My Data</span>
      </div>

      {/* Side Nav */}
      <div style={{ overflowX:'auto', display:'flex', gap:0, background:c.card, borderBottom:`1px solid ${c.border}` }}>
        {NAV_ITEMS.map(item => {
          const active = item.href === '/village/locker/my-data';
          return (
            <Link key={item.href} href={item.href} style={{ textDecoration:'none', padding:'10px 14px', fontSize:12, fontWeight:active?700:500, color:active?'#1D9E75':c.textSec, borderBottom:active?'2px solid #1D9E75':'2px solid transparent', whiteSpace:'nowrap' }}>
              {item.label}
            </Link>
          );
        })}
      </div>

      <div style={{ padding:'16px 16px 0' }}>
        {/* Header statement */}
        <div style={{ background:'#04342C', border:`1px solid #1D9E75`, borderRadius:16, padding:16, marginBottom:16, display:'flex', alignItems:'center', gap:12 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9FE1CB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <p style={{ color:'#9FE1CB', fontSize:13, margin:0, lineHeight:1.5 }}>
            <strong>Your data is complete — nothing is hidden.</strong> If Village holds it, you see it here.
          </p>
        </div>

        {/* Collapsible sections */}
        {SECTIONS.map(sec => (
          <div key={sec.id} style={{ background:c.card, border:`1px solid ${c.border}`, borderRadius:14, marginBottom:10, overflow:'hidden' }}>
            <button
              onClick={() => toggle(sec.id)}
              style={{ width:'100%', background:'transparent', border:'none', cursor:'pointer', padding:'14px 16px', display:'flex', alignItems:'center', gap:12, textAlign:'left' }}
            >
              <div style={{ width:34, height:34, borderRadius:10, background:isNight?'#0F2820':'#E8F5F0', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={sec.icon}/></svg>
              </div>
              <span style={{ flex:1, fontSize:14, fontWeight:700, color:c.text }}>{sec.name}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c.textTer} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={open[sec.id] ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'}/>
              </svg>
            </button>
            {open[sec.id] && (
              <div style={{ padding:'0 16px 14px', borderTop:`1px solid ${c.border}` }}>
                <p style={{ fontSize:11, fontWeight:700, color:c.textTer, letterSpacing:0.8, textTransform:'uppercase', margin:'12px 0 8px' }}>Data we hold</p>
                <ul style={{ margin:0, paddingLeft:16 }}>
                  {sec.points.map((pt, i) => (
                    <li key={i} style={{ fontSize:13, color:c.textSec, marginBottom:6, lineHeight:1.5 }}>{pt}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}

        {/* Download section */}
        <div style={{ background:c.card, border:`1px solid ${c.border}`, borderRadius:16, padding:18, marginBottom:16 }}>
          <p style={{ fontWeight:700, fontSize:14, color:c.text, margin:'0 0 6px' }}>Download Everything</p>
          <p style={{ fontSize:12, color:c.textSec, margin:'0 0 14px', lineHeight:1.6 }}>
            Export a complete copy of your Village data. GDPR Article 20 compliant.
          </p>
          <div style={{ display:'flex', gap:8, marginBottom:14 }}>
            {(['json','csv','pdf'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                style={{ flex:1, padding:'8px 0', borderRadius:8, border:`1px solid ${format===f?'#1D9E75':c.border}`, background:format===f?'#04342C':'transparent', color:format===f?'#9FE1CB':c.textSec, fontSize:12, fontWeight:700, cursor:'pointer', textTransform:'uppercase', letterSpacing:0.5 }}
              >
                {f}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              if (format === 'pdf') window.open('/api/locker/export?format=html', '_blank');
              else window.location.href = `/api/locker/export?format=${format}`;
            }}
            style={{ width:'100%', background:'#1D9E75', border:'none', color:'#fff', borderRadius:10, padding:'12px 0', fontSize:14, fontWeight:700, cursor:'pointer' }}
          >
            Download as {format.toUpperCase()}
          </button>
        </div>
      </div>
    </div>
  );
}
