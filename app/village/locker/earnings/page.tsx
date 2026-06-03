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

const MONTHLY = [
  { month:'Jun 25', amount:0.60 },
  { month:'Jul 25', amount:0.80 },
  { month:'Aug 25', amount:1.10 },
  { month:'Sep 25', amount:1.40 },
  { month:'Oct 25', amount:1.80 },
  { month:'Nov 25', amount:2.10 },
  { month:'Dec 25', amount:2.40 },
  { month:'Jan 26', amount:2.60 },
  { month:'Feb 26', amount:2.80 },
  { month:'Mar 26', amount:3.00 },
  { month:'Apr 26', amount:3.20 },
  { month:'May 26', amount:3.40 },
];

const CATEGORIES = [
  { name:'GPS Goals',             shared:false, monthly:0,    highlight:false },
  { name:'Content Engagement',    shared:true,  monthly:1.80, highlight:false },
  { name:'Location',              shared:false, monthly:0,    highlight:false },
  { name:'Wellness Metrics',      shared:false, monthly:0,    highlight:true  },
  { name:'Financial Behavior',    shared:false, monthly:0,    highlight:false },
  { name:'Commerce Behavior',     shared:true,  monthly:1.60, highlight:true  },
  { name:'Social Graph',          shared:false, monthly:0,    highlight:false },
  { name:'Goal Content Interests',shared:true,  monthly:0.80, highlight:false },
  { name:'Entertainment',         shared:false, monthly:0,    highlight:false },
  { name:'Behavioral Patterns',   shared:false, monthly:0,    highlight:false },
  { name:'VLG Patterns',          shared:false, monthly:0,    highlight:false },
  { name:'Communication Patterns',shared:false, monthly:0,    highlight:false },
];

const EXPLAINER = [
  { q:'Who buys your data?', a:'Verified companies in approved categories — productivity software, health brands, retailers, and research firms. Law enforcement, political campaigns, and data brokers are prohibited.' },
  { q:'How much do you get?', a:'70% of all revenue generated from your data goes directly to you. Village keeps 30% to cover anonymization infrastructure, legal compliance, and buyer verification.' },
  { q:'When do you get paid?', a:'Earnings are deposited to your Village Bank account by the 5th of each month. Minimum payout is $1.00 — amounts below that carry forward.' },
  { q:'Is there a $VICO option?', a:'Yes. Switch your payout preference to $VICO and receive a +15% bonus on top of your USD earnings. Toggle below.' },
];

export default function Earnings() {
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';
  const c = isNight ? L.night : L.day;
  const [payout, setPayout] = useState<'usd'|'vico'>('usd');

  const maxAmount = Math.max(...MONTHLY.map(m => m.amount));
  const chartH = 120;

  // Build SVG path for trend line
  const pts = MONTHLY.map((m, i) => {
    const x = (i / (MONTHLY.length - 1)) * 280 + 20;
    const y = chartH - (m.amount / maxAmount) * (chartH - 20) - 10;
    return `${x},${y}`;
  });
  const trendPath = 'M' + pts.join(' L');

  return (
    <div style={{ background:c.bg, minHeight:'100vh', maxWidth:480, margin:'0 auto', paddingBottom:88 }}>
      {/* Top bar */}
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'16px 20px 12px', background:c.card, borderBottom:`1px solid ${c.border}` }}>
        <Link href="/village/locker" style={{ textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'center', width:36, height:36, borderRadius:'50%', border:`1px solid ${c.border}` }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </Link>
        <span style={{ fontWeight:800, fontSize:18, color:c.text, letterSpacing:-0.5 }}>Earnings</span>
      </div>

      {/* Nav */}
      <div style={{ overflowX:'auto', display:'flex', gap:0, background:c.card, borderBottom:`1px solid ${c.border}` }}>
        {NAV_ITEMS.map(item => {
          const active = item.href === '/village/locker/earnings';
          return (
            <Link key={item.href} href={item.href} style={{ textDecoration:'none', padding:'10px 14px', fontSize:12, fontWeight:active?700:500, color:active?'#1D9E75':c.textSec, borderBottom:active?'2px solid #1D9E75':'2px solid transparent', whiteSpace:'nowrap' }}>
              {item.label}
            </Link>
          );
        })}
      </div>

      <div style={{ padding:'16px 16px 0' }}>
        {/* Hero amber */}
        <div style={{ background:'#412402', borderRadius:20, padding:22, marginBottom:16, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-40, right:-30, width:150, height:150, borderRadius:'50%', background:'rgba(255,255,255,0.03)', pointerEvents:'none' }}/>
          <p style={{ color:'rgba(250,199,117,0.7)', fontSize:10, fontWeight:700, letterSpacing:1.2, textTransform:'uppercase', marginBottom:6 }}>Data Earnings</p>
          <p style={{ color:'#fff', fontSize:28, fontWeight:800, letterSpacing:-1, margin:'0 0 6px' }}>$24.80</p>
          <p style={{ color:'rgba(250,199,117,0.8)', fontSize:13, margin:'0 0 16px' }}>Lifetime earnings from data sharing</p>
          <div style={{ display:'flex', gap:20 }}>
            <div>
              <p style={{ color:'rgba(250,199,117,0.6)', fontSize:10, fontWeight:700, letterSpacing:0.8, textTransform:'uppercase', margin:'0 0 2px' }}>This Month</p>
              <p style={{ color:'#FAC775', fontSize:18, fontWeight:800, margin:0 }}>$3.40</p>
            </div>
            <div style={{ width:1, background:'rgba(239,159,39,0.3)' }}/>
            <div>
              <p style={{ color:'rgba(250,199,117,0.6)', fontSize:10, fontWeight:700, letterSpacing:0.8, textTransform:'uppercase', margin:'0 0 2px' }}>Deposited To</p>
              <Link href="/village/bank" style={{ color:'#FAC775', fontSize:14, fontWeight:700, textDecoration:'underline' }}>Village Bank</Link>
            </div>
          </div>
        </div>

        {/* Bar chart */}
        <div style={{ background:c.card, border:`1px solid ${c.border}`, borderRadius:16, padding:16, marginBottom:16, overflowX:'auto' }}>
          <p style={{ fontWeight:700, fontSize:14, color:c.text, margin:'0 0 16px' }}>12-Month Earnings</p>
          <svg width="320" height={chartH + 30} viewBox={`0 0 320 ${chartH + 30}`} style={{ display:'block', margin:'0 auto' }}>
            {MONTHLY.map((m, i) => {
              const barW = 16;
              const x = (i / (MONTHLY.length - 1)) * 280 + 20 - barW / 2;
              const barH = (m.amount / maxAmount) * (chartH - 20);
              const y = chartH - barH - 10;
              return (
                <g key={m.month}>
                  <rect x={x} y={y} width={barW} height={barH} rx={3} fill="#EF9F27" opacity={0.85}/>
                  <text x={x + barW/2} y={chartH + 20} textAnchor="middle" fontSize="8" fill={c.textTer}>{m.month.replace(' ','  ')}</text>
                </g>
              );
            })}
            <path d={trendPath} fill="none" stroke="#FAC775" strokeWidth="2" strokeDasharray="4 2" opacity={0.7}/>
          </svg>
        </div>

        {/* Category breakdown */}
        <div style={{ background:c.card, border:`1px solid ${c.border}`, borderRadius:16, marginBottom:16, overflow:'hidden' }}>
          <div style={{ padding:'14px 16px', borderBottom:`1px solid ${c.border}` }}>
            <p style={{ fontWeight:700, fontSize:14, color:c.text, margin:0 }}>Category Breakdown — This Month</p>
          </div>
          {CATEGORIES.map((cat, i) => (
            <div key={cat.name} style={{ padding:'11px 16px', borderBottom:i<CATEGORIES.length-1?`1px solid ${c.border}`:'none', display:'flex', alignItems:'center', gap:12, background:cat.highlight&&cat.shared?isNight?'rgba(65,36,2,0.3)':'#FFF8EE':'' }}>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:13, fontWeight:cat.highlight&&cat.shared?700:500, color:c.text, margin:0 }}>{cat.name}</p>
              </div>
              <span style={{
                fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20,
                background:cat.shared?'#412402':'#04342C',
                border:`1px solid ${cat.shared?'#EF9F27':'#1D9E75'}`,
                color:cat.shared?'#FAC775':'#9FE1CB',
              }}>
                {cat.shared ? 'Shared' : 'Locked'}
              </span>
              <span style={{ fontSize:13, fontWeight:700, color:cat.monthly>0?'#EF9F27':c.textTer, minWidth:44, textAlign:'right' }}>
                {cat.monthly > 0 ? `$${cat.monthly.toFixed(2)}` : '—'}
              </span>
            </div>
          ))}
        </div>

        {/* How earnings work */}
        <div style={{ background:c.card, border:`1px solid ${c.border}`, borderRadius:16, padding:16, marginBottom:16 }}>
          <p style={{ fontWeight:700, fontSize:14, color:c.text, margin:'0 0 14px' }}>How Earnings Work</p>
          {EXPLAINER.map((item, i) => (
            <div key={i} style={{ marginBottom:i < EXPLAINER.length - 1 ? 14 : 0 }}>
              <p style={{ fontSize:13, fontWeight:700, color:'#1D9E75', margin:'0 0 4px' }}>{item.q}</p>
              <p style={{ fontSize:12, color:c.textSec, margin:0, lineHeight:1.6 }}>{item.a}</p>
            </div>
          ))}
        </div>

        {/* Payout toggle */}
        <div style={{ background:c.card, border:`1px solid ${c.border}`, borderRadius:16, padding:16, marginBottom:16 }}>
          <p style={{ fontWeight:700, fontSize:14, color:c.text, margin:'0 0 12px' }}>Payout Preference</p>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => setPayout('usd')} style={{ flex:1, padding:'10px 0', borderRadius:10, border:`1px solid ${payout==='usd'?'#1D9E75':c.border}`, background:payout==='usd'?'#04342C':'transparent', color:payout==='usd'?'#9FE1CB':c.textSec, fontSize:13, fontWeight:700, cursor:'pointer' }}>
              USD to Village Bank
            </button>
            <button onClick={() => setPayout('vico')} style={{ flex:1, padding:'10px 0', borderRadius:10, border:`1px solid ${payout==='vico'?'#EF9F27':c.border}`, background:payout==='vico'?'#412402':'transparent', color:payout==='vico'?'#FAC775':c.textSec, fontSize:13, fontWeight:700, cursor:'pointer' }}>
              $VICO +15% bonus
            </button>
          </div>
          {payout === 'vico' && (
            <p style={{ fontSize:12, color:'#FAC775', margin:'10px 0 0', background:'#412402', border:'1px solid #EF9F27', borderRadius:8, padding:'8px 12px' }}>
              +15% bonus applied. This month: $3.40 USD = $3.91 in $VICO value.
            </p>
          )}
        </div>

        {/* VS platforms comparison */}
        <div style={{ background:c.card, border:`1px solid ${c.border}`, borderRadius:16, padding:16, marginBottom:8 }}>
          <p style={{ fontWeight:700, fontSize:14, color:c.text, margin:'0 0 12px' }}>Village vs Other Platforms</p>
          {[
            { name:'Facebook', earns:164, color:'#3B5998' },
            { name:'Google',   earns:220, color:'#4285F4' },
            { name:'TikTok',   earns:98,  color:'#69C9D0' },
          ].map(plat => (
            <div key={plat.name} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
              <span style={{ fontSize:12, fontWeight:700, color:c.textSec, minWidth:70 }}>{plat.name}</span>
              <div style={{ flex:1, height:8, background:isNight?'#0F2820':'#E8F5F0', borderRadius:4 }}>
                <div style={{ width:`${Math.min((plat.earns/250)*100, 100)}%`, height:'100%', background:plat.color, borderRadius:4, opacity:0.6 }}/>
              </div>
              <span style={{ fontSize:12, fontWeight:600, color:c.textTer, minWidth:50, textAlign:'right' }}>~${plat.earns}/yr</span>
              <span style={{ fontSize:10, color:c.textTer }}>from you</span>
            </div>
          ))}
          <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:4, paddingTop:10, borderTop:`1px solid ${c.border}` }}>
            <span style={{ fontSize:12, fontWeight:800, color:'#1D9E75', minWidth:70 }}>Village</span>
            <div style={{ flex:1, height:8, background:'#04342C', borderRadius:4 }}>
              <div style={{ width:`${(24.80/250)*100}%`, height:'100%', background:'#1D9E75', borderRadius:4 }}/>
            </div>
            <span style={{ fontSize:12, fontWeight:700, color:'#1D9E75', minWidth:50, textAlign:'right' }}>$24.80</span>
            <span style={{ fontSize:10, color:'#9FE1CB' }}>to you</span>
          </div>
          <p style={{ fontSize:11, color:c.textSec, margin:'10px 0 0', lineHeight:1.6 }}>
            Facebook earns ~$164/year from your data and pays you $0. Village paid you $24.80 so far — and you only started sharing 3 categories.
          </p>
        </div>
      </div>
    </div>
  );
}
