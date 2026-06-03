'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';

const L = {
  day:   { bg:'#F2FAF8', card:'#FFFFFF', border:'#D0EDE6', text:'#0A1F14', textSec:'#3A6A5A', textTer:'#7AA89A' },
  night: { bg:'#060F0D', card:'#0C1A17', border:'#0F2820', text:'#E8F5F0', textSec:'#8ABFB0', textTer:'#4A8070' },
};

const LOCKED   = { fill:'#04342C', border:'#1D9E75', text:'#9FE1CB' };
const SHARED   = { fill:'#412402', border:'#EF9F27', text:'#FAC775' };

type Category = {
  id: string;
  name: string;
  icon: string;
  shared: boolean;
  earnings: number;
};

const INITIAL_CATEGORIES: Category[] = [
  { id:'gps',     name:'GPS Goals',             icon:'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z', shared:false, earnings:2.40 },
  { id:'content', name:'Content Engagement',    icon:'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z',                                                                                         shared:true,  earnings:1.80 },
  { id:'location',name:'Location',              icon:'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',                                                                                              shared:false, earnings:0.80 },
  { id:'wellness',name:'Wellness Metrics',      icon:'M22 12h-4l-3 9L9 3l-3 9H2',                                                                                                                                              shared:false, earnings:8.50 },
  { id:'finance', name:'Financial Behavior',    icon:'M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',                                                                                                                 shared:false, earnings:3.20 },
  { id:'commerce',name:'Commerce Behavior',     icon:'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0',                                                                                             shared:true,  earnings:1.60 },
  { id:'social',  name:'Social Graph',          icon:'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M9 7a4 4 0 100 8 4 4 0 000-8z',                                               shared:false, earnings:1.40 },
  { id:'goalcont',name:'Goal Content Interests',icon:'M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z',                                                                            shared:true,  earnings:0.80 },
  { id:'entertain',name:'Entertainment',        icon:'M15.6 11.6L22 7v10l-6.4-4.5v-0.9zM2 7h12v10H2z',                                                                                                                        shared:false, earnings:0.70 },
  { id:'behavior',name:'Behavioral Patterns',   icon:'M3 12h18M3 6h18M3 18h12',                                                                                                                                               shared:false, earnings:0.60 },
  { id:'vlg',     name:'VLG Patterns',          icon:'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',                                                                        shared:false, earnings:0.90 },
  { id:'comms',   name:'Communication Patterns',icon:'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z',                                                                                                             shared:false, earnings:0.50 },
];

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

function LockIcon({ open, size=20 }: { open: boolean; size?: number }) {
  const color = open ? SHARED.text : LOCKED.text;
  if (open) return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 019.9-1"/>
    </svg>
  );
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0110 0v4"/>
    </svg>
  );
}

export default function LockerHome() {
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';
  const c = isNight ? L.night : L.day;
  const [cats, setCats] = useState<Category[]>(INITIAL_CATEGORIES);

  const sharedCount = cats.filter(c => c.shared).length;
  const monthlyEarnings = cats.filter(c => c.shared).reduce((s, c) => s + c.earnings, 0);
  const meterPct = (sharedCount / 12) * 100;

  function toggle(id: string) {
    setCats(prev => prev.map(cat => cat.id === id ? { ...cat, shared: !cat.shared } : cat));
  }

  return (
    <div style={{ background:c.bg, minHeight:'100vh', maxWidth:480, margin:'0 auto', paddingBottom:88 }}>
      {/* Top bar */}
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'16px 20px 12px', background:c.card, borderBottom:`1px solid ${c.border}` }}>
        <Link href="/village" style={{ textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'center', width:36, height:36, borderRadius:'50%', border:`1px solid ${c.border}` }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </Link>
        <span style={{ fontWeight:800, fontSize:18, color:c.text, letterSpacing:-0.5 }}>Data Locker</span>
      </div>

      {/* Side Nav */}
      <div style={{ overflowX:'auto', display:'flex', gap:0, background:c.card, borderBottom:`1px solid ${c.border}` }}>
        {NAV_ITEMS.map(item => {
          const active = item.href === '/village/locker';
          return (
            <Link key={item.href} href={item.href} style={{ textDecoration:'none', padding:'10px 14px', fontSize:12, fontWeight:active?700:500, color:active?'#1D9E75':c.textSec, borderBottom:active?'2px solid #1D9E75':'2px solid transparent', whiteSpace:'nowrap' }}>
              {item.label}
            </Link>
          );
        })}
      </div>

      <div style={{ padding:'16px 16px 0' }}>
        {/* Hero */}
        <div style={{ background:'#085041', borderRadius:20, padding:22, marginBottom:16, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-40, right:-30, width:150, height:150, borderRadius:'50%', background:'rgba(255,255,255,0.04)', pointerEvents:'none' }}/>
          <p style={{ color:'rgba(255,255,255,0.65)', fontSize:10, fontWeight:700, letterSpacing:1.2, textTransform:'uppercase', marginBottom:6 }}>Your Data Locker</p>
          <p style={{ color:'#fff', fontSize:22, fontWeight:800, letterSpacing:-0.5, margin:'0 0 8px', lineHeight:1.2 }}>Your data. Your choice. Your earnings.</p>
          <p style={{ color:'rgba(255,255,255,0.7)', fontSize:13, margin:'0 0 16px', lineHeight:1.6 }}>
            Everything the Village holds about you lives here. You decide what stays private and what earns you money.
          </p>
          <div style={{ display:'flex', gap:20 }}>
            <div>
              <p style={{ color:'rgba(255,255,255,0.6)', fontSize:10, fontWeight:700, letterSpacing:0.8, textTransform:'uppercase', margin:'0 0 2px' }}>Categories</p>
              <p style={{ color:'#fff', fontSize:20, fontWeight:800, margin:0 }}>12</p>
            </div>
            <div style={{ width:1, background:'rgba(255,255,255,0.2)' }}/>
            <div>
              <p style={{ color:'rgba(255,255,255,0.6)', fontSize:10, fontWeight:700, letterSpacing:0.8, textTransform:'uppercase', margin:'0 0 2px' }}>Lifetime Earnings</p>
              <p style={{ color:'#9FE1CB', fontSize:20, fontWeight:800, margin:0 }}>$24.80</p>
            </div>
          </div>
        </div>

        {/* Privacy Meter */}
        <div style={{ background:c.card, border:`1px solid ${c.border}`, borderRadius:16, padding:18, marginBottom:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <p style={{ fontWeight:700, fontSize:14, color:c.text, margin:0 }}>Privacy Meter</p>
            <span style={{ fontSize:12, color:c.textSec }}>Drag categories to adjust</span>
          </div>
          <div style={{ position:'relative', height:16, borderRadius:8, background:`linear-gradient(to right, #1D9E75, #EF9F27)`, marginBottom:10, overflow:'visible' }}>
            <div style={{
              position:'absolute', top:'50%', left:`${meterPct}%`, transform:'translate(-50%,-50%)',
              width:22, height:22, borderRadius:'50%', background:'#fff', border:'3px solid #085041',
              boxShadow:'0 2px 8px rgba(0,0,0,0.3)', zIndex:2,
            }}/>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
            <span style={{ fontSize:11, color:'#1D9E75', fontWeight:600 }}>Fully Private</span>
            <span style={{ fontSize:11, color:'#EF9F27', fontWeight:600 }}>Fully Shared</span>
          </div>
          <p style={{ fontSize:13, color:c.textSec, margin:0, textAlign:'center', fontWeight:600 }}>
            {sharedCount} of 12 categories shared · Est. <span style={{ color:isNight?'#FAC775':'#85620A', fontWeight:700 }}>${monthlyEarnings.toFixed(2)}/month</span>
          </p>
        </div>

        {/* Spirit recommendations */}
        <div style={{ background:'#04342C', border:`1px solid #1D9E75`, borderRadius:16, padding:16, marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:12 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9FE1CB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"/></svg>
            <span style={{ fontSize:10, fontWeight:800, color:'#9FE1CB', letterSpacing:1, textTransform:'uppercase' }}>Spirit Recommendations</span>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ background:'rgba(29,158,117,0.15)', borderRadius:12, padding:12 }}>
              <p style={{ fontSize:13, color:'#9FE1CB', margin:'0 0 8px', lineHeight:1.5 }}>
                <strong>Wellness Metrics</strong> is your highest-value category at $8.50/month. Health brands pay a premium for this signal.
              </p>
              <div style={{ display:'flex', gap:8 }}>
                <button style={{ flex:1, background:'#1D9E75', border:'none', color:'#fff', borderRadius:8, padding:'7px 0', fontSize:12, fontWeight:700, cursor:'pointer' }}>Review and share</button>
                <button style={{ flex:1, background:'transparent', border:`1px solid #1D9E75`, color:'#9FE1CB', borderRadius:8, padding:'7px 0', fontSize:12, fontWeight:600, cursor:'pointer' }}>Keep private</button>
              </div>
            </div>
            <div style={{ background:'rgba(29,158,117,0.15)', borderRadius:12, padding:12 }}>
              <p style={{ fontSize:13, color:'#9FE1CB', margin:'0 0 8px', lineHeight:1.5 }}>
                <strong>Financial Behavior</strong> ($3.20/month) has a buyer request active right now. Anonymized spending patterns only.
              </p>
              <div style={{ display:'flex', gap:8 }}>
                <button style={{ flex:1, background:'#1D9E75', border:'none', color:'#fff', borderRadius:8, padding:'7px 0', fontSize:12, fontWeight:700, cursor:'pointer' }}>Review and share</button>
                <button style={{ flex:1, background:'transparent', border:`1px solid #1D9E75`, color:'#9FE1CB', borderRadius:8, padding:'7px 0', fontSize:12, fontWeight:600, cursor:'pointer' }}>Keep private</button>
              </div>
            </div>
          </div>
        </div>

        {/* 12-category grid */}
        <p style={{ fontWeight:700, fontSize:14, color:c.text, margin:'0 0 12px' }}>Your 12 Data Categories</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
          {cats.map(cat => {
            const s = cat.shared ? SHARED : LOCKED;
            return (
              <div key={cat.id} style={{ background:s.fill, border:`1px solid ${s.border}`, borderRadius:14, padding:14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                  <div style={{ width:34, height:34, borderRadius:10, background:'rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={s.text} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d={cat.icon}/>
                    </svg>
                  </div>
                  <button
                    onClick={() => toggle(cat.id)}
                    style={{ background:'transparent', border:'none', cursor:'pointer', padding:2 }}
                    title={cat.shared ? 'Lock this category' : 'Share this category'}
                  >
                    <LockIcon open={cat.shared} size={18} />
                  </button>
                </div>
                <p style={{ fontSize:12, fontWeight:700, color:s.text, margin:'0 0 4px', lineHeight:1.3 }}>{cat.name}</p>
                <p style={{ fontSize:11, color:`${s.text}99`, margin:0 }}>
                  {cat.shared ? `$${cat.earnings.toFixed(2)}/mo` : 'Locked · Private'}
                </p>
              </div>
            );
          })}
        </div>

        {/* Quick nav */}
        <div style={{ background:c.card, border:`1px solid ${c.border}`, borderRadius:16, overflow:'hidden', marginBottom:8 }}>
          {[
            { label:'View all my data', href:'/village/locker/my-data', icon:'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
            { label:'Manage permissions', href:'/village/locker/permissions', icon:'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
            { label:'Earnings history', href:'/village/locker/earnings', icon:'M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6' },
            { label:'Audit log', href:'/village/locker/audit', icon:'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 12h6M9 16h4' },
          ].map((item, i, arr) => (
            <Link key={item.href} href={item.href} style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:12, padding:'13px 16px', borderBottom:i<arr.length-1?`1px solid ${c.border}`:'none' }}>
              <div style={{ width:34, height:34, borderRadius:10, background:isNight?'#0F2820':'#E8F5F0', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={item.icon}/></svg>
              </div>
              <span style={{ flex:1, fontSize:13, fontWeight:600, color:c.text }}>{item.label}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c.textTer} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
