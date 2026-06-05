'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { motion } from 'framer-motion';

const CATEGORIES = [
  { key:'share_gps_goals',             label:'GPS Goals & Progress',    icon:'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',  rate:2.40 },
  { key:'share_content_engagement',     label:'Content Engagement',      icon:'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',  rate:1.80 },
  { key:'share_location',               label:'Location Data',           icon:'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z',  rate:0.80 },
  { key:'share_wellness',               label:'Wellness Metrics',        icon:'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',  rate:8.50 },
  { key:'share_financial_behavior',     label:'Financial Behavior',      icon:'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',  rate:3.20 },
  { key:'share_commerce_behavior',      label:'Commerce Behavior',       icon:'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z',  rate:1.60 },
  { key:'share_social_graph',           label:'Social Graph',            icon:'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',  rate:1.40 },
  { key:'share_goal_content_interests', label:'Goal Content Interests',  icon:'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',  rate:0.80 },
  { key:'share_entertainment',          label:'Entertainment Prefs',     icon:'M15 10l4.553-2.069A1 1 0 0121 8.868V15.13a1 1 0 01-1.447.899L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z',  rate:0.70 },
  { key:'share_behavioral_patterns',    label:'Behavioral Patterns',     icon:'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',  rate:0.60 },
  { key:'share_vlg_patterns',           label:'$VLG Earning Patterns',   icon:'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1',  rate:0.90 },
  { key:'share_communication_patterns', label:'Communication Patterns',  icon:'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',  rate:0.50 },
];

export default function DataLockerPage() {
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';
  const bg = isNight ? '#060F0D' : '#F2FAF8';
  const card = isNight ? '#0C1A17' : '#FFFFFF';
  const border = isNight ? '1px solid #0F2820' : '1px solid #D0EDE6';
  const text = isNight ? '#EEF4F8' : '#0A1F2E';
  const muted = isNight ? 'rgba(255,255,255,0.4)' : '#4A6A7E';

  const [prefs, setPrefs] = useState<Record<string,boolean>>({});
  const [estimatedEarnings, setEstimatedEarnings] = useState(0);
  const [sharedCount, setSharedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string|null>(null);

  useEffect(() => {
    fetch('/api/locker/preferences').then(r => r.json()).then(d => {
      setPrefs(d.preferences ?? {});
      setEstimatedEarnings(d.estimatedEarnings ?? 0);
      setSharedCount(d.sharedCount ?? 0);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function toggle(key: string) {
    const newVal = !prefs[key];
    setToggling(key);
    setPrefs(p => ({ ...p, [key]: newVal }));
    const newEarnings = CATEGORIES.reduce((s, cat) => {
      const val = cat.key === key ? newVal : (prefs[cat.key] ?? false);
      return s + (val ? cat.rate : 0);
    }, 0);
    setEstimatedEarnings(newEarnings);
    setSharedCount(CATEGORIES.filter(cat => cat.key === key ? newVal : (prefs[cat.key] ?? false)).length);

    await fetch('/api/locker/preferences', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: newVal }),
    }).catch(() => {});
    setToggling(null);
  }

  const pct = (sharedCount / 12) * 100;

  return (
    <div style={{ minHeight:'100vh', background:bg, paddingBottom:90 }}>
      {/* Hero */}
      <div style={{ background:'#085041', padding:'20px 16px 24px' }}>
        <p style={{ fontSize:10, fontWeight:900, color:'#9FE1CB', letterSpacing:'0.08em', marginBottom:8 }}>YOUR DATA LOCKER</p>
        <p style={{ fontSize:22, fontWeight:900, color:'#fff', marginBottom:6 }}>Your data. Your choice. Your earnings.</p>
        <p style={{ fontSize:13, color:'#9FE1CB', lineHeight:1.6, marginBottom:16 }}>
          The Village collects data to make the app work. You decide whether we can use it commercially. When you share it, you earn a direct share of the revenue it generates.
        </p>
        <div style={{ display:'flex', gap:20 }}>
          <div><p style={{ fontSize:24, fontWeight:900, color:'#fff', margin:0 }}>12</p><p style={{ fontSize:11, color:'#9FE1CB', margin:0 }}>Data categories</p></div>
          <div><p style={{ fontSize:24, fontWeight:900, color:'#EF9F27', margin:0 }}>${(estimatedEarnings).toFixed(2)}</p><p style={{ fontSize:11, color:'#9FE1CB', margin:0 }}>Est. monthly earnings</p></div>
        </div>
      </div>

      <div style={{ padding:'16px' }}>
        {/* Privacy meter */}
        <div style={{ background:card, border, borderRadius:14, padding:16, marginBottom:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
            <p style={{ fontSize:12, fontWeight:700, color:muted, margin:0 }}>Your current privacy level</p>
            <p style={{ fontSize:12, fontWeight:700, color:muted, margin:0 }}>{sharedCount} of 12 shared</p>
          </div>
          <div style={{ height:16, background:isNight?'#1D9E7530':'#D0EDE6', borderRadius:8, overflow:'hidden', marginBottom:8 }}>
            <div style={{ height:'100%', width:`${pct}%`, background:`linear-gradient(to right, #1D9E75, #EF9F27)`, borderRadius:8, transition:'width 0.4s' }} />
          </div>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <span style={{ fontSize:11, color:'#1D9E75', fontWeight:700 }}>Fully private</span>
            <span style={{ fontSize:11, color:'#EF9F27', fontWeight:700 }}>Fully shared</span>
          </div>
        </div>

        {/* Quick links */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
          {[
            { label:'My Data', href:'/village/locker/my-data', icon:'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
            { label:'Earnings', href:'/village/locker/earnings', icon:'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1' },
            { label:'Audit Log', href:'/village/locker/audit', icon:'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
            { label:'Export', href:'/village/locker/export', icon:'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' },
          ].map(item => (
            <Link key={item.label} href={item.href} style={{ display:'flex', alignItems:'center', gap:8, background:card, border, borderRadius:12, padding:'12px 14px', textDecoration:'none' }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth={2} strokeLinecap="round"><path d={item.icon}/></svg>
              <span style={{ fontSize:13, fontWeight:700, color:text }}>{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Category toggles */}
        <p style={{ fontSize:10, fontWeight:900, color:muted, letterSpacing:'0.06em', marginBottom:12 }}>DATA CATEGORIES</p>
        {loading ? (
          <div style={{ textAlign:'center', padding:32, color:muted }}>Loading your data preferences…</div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {CATEGORIES.map(cat => {
              const isShared = prefs[cat.key] ?? false;
              return (
                <div key={cat.key} style={{ background:card, border, borderRadius:14, padding:'14px 16px', display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:36, height:36, borderRadius:18, background: isShared ? '#41240222' : '#04342C22', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={isShared?'#EF9F27':'#1D9E75'} strokeWidth={2} strokeLinecap="round"><path d={cat.icon}/></svg>
                  </div>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:13, fontWeight:700, color:text, margin:'0 0 2px' }}>{cat.label}</p>
                    <p style={{ fontSize:11, color:muted, margin:0 }}>Est. ${cat.rate.toFixed(2)}/month if shared</p>
                  </div>
                  <button onClick={() => toggle(cat.key)} disabled={toggling === cat.key}
                    style={{ width:50, height:28, borderRadius:14, border:'none', cursor:'pointer', background: isShared ? '#EF9F27' : '#1D9E75', position:'relative', transition:'background 0.2s', opacity: toggling === cat.key ? 0.6 : 1 }}>
                    <motion.div animate={{ x: isShared ? 22 : 2 }} transition={{ type:'spring', stiffness:400, damping:25 }}
                      style={{ width:24, height:24, borderRadius:12, background:'#fff', position:'absolute', top:2, boxShadow:'0 2px 4px rgba(0,0,0,0.2)' }} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
