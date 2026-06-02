'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { BankBottomNav } from '@/components/bank/BankBottomNav';

const B = {
  day:   { bg:'#F2F7FA', card:'#FFFFFF', border:'#C8DCE8', text:'#0A1F2E', textSec:'#3A5A6E', textTer:'#7A9AAE', action:'#0A5F8A' },
  night: { bg:'#060F18', card:'#0E1E2E', border:'#1A3040', text:'#EEF4F8', textSec:'#8EB4CC', textTer:'#4A7A96', action:'#2A9FCC' },
};

const STOCKS = [
  { sym:'AAPL', name:'Apple Inc.',          value:4200, change:+2.1,  shares:21.4 },
  { sym:'NVDA', name:'NVIDIA Corp.',         value:3800, change:+8.4,  shares:9.1  },
  { sym:'MSFT', name:'Microsoft Corp.',      value:2100, change:-0.3,  shares:5.3  },
  { sym:'AMZN', name:'Amazon.com Inc.',      value:1740, change:+1.6,  shares:10.2 },
];

const CRYPTO = [
  { sym:'BTC',   name:'Bitcoin',  value:3200, change:+4.2,  qty:0.048 },
  { sym:'ETH',   name:'Ethereum', value:1840, change:+3.1,  qty:0.821 },
  { sym:'MATIC', name:'Polygon',  value:340,  change:-1.8,  qty:847.2 },
];

const WATCHLIST = ['TSLA','GOOGL','META','SPY'];
const TRENDING  = ['NVDA','META','PLTR','ARM'];
const TOP_MOVERS= [
  { sym:'SMCI', change:+12.4 },
  { sym:'ARM',  change:+9.8  },
  { sym:'PLTR', change:-6.2  },
];
const AI_PICKS  = [
  { sym:'VTI',  reason:'Diversified ETF — aligns with your long-term goal horizon' },
  { sym:'SCHD', reason:'Dividend ETF — complements your income strategy' },
];

const SPARKLINE = [30,42,38,55,48,60,58,65,70,68,75,80,76,84,82,90,88,95,92,100];

export default function InvestPage() {
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';
  const c = isNight ? B.night : B.day;
  const [tab, setTab] = useState<'stocks'|'crypto'>('stocks');
  const holdings = tab === 'stocks' ? STOCKS : CRYPTO;
  const totalValue = STOCKS.reduce((s,h)=>s+h.value,0) + CRYPTO.reduce((s,h)=>s+h.value,0);
  const sparkH = 32;
  const sparkW = 120;
  const max = Math.max(...SPARKLINE);
  const pts = SPARKLINE.map((v,i)=>`${(i/(SPARKLINE.length-1))*sparkW},${sparkH-(v/max)*sparkH}`).join(' ');

  return (
    <div style={{ background:c.bg, minHeight:'100vh', maxWidth:480, margin:'0 auto', paddingBottom:88 }}>
      {/* Top bar */}
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'16px 20px 12px', background:c.card, borderBottom:`1px solid ${c.border}` }}>
        <Link href="/village/bank" style={{ color:c.action, lineHeight:0 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </Link>
        <span style={{ fontWeight:800, fontSize:17, color:c.text }}>Invest</span>
      </div>

      <div style={{ padding:16 }}>
        {/* Portfolio value card */}
        <div style={{ background:'#0A5F8A', borderRadius:20, padding:20, marginBottom:16, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-30, right:-30, width:130, height:130, borderRadius:'50%', background:'rgba(255,255,255,0.06)', pointerEvents:'none' }}/>
          <p style={{ color:'rgba(255,255,255,0.7)', fontSize:11, fontWeight:600, letterSpacing:0.8, textTransform:'uppercase', marginBottom:4, position:'relative' }}>Portfolio Value</p>
          <p style={{ color:'#fff', fontSize:32, fontWeight:800, letterSpacing:-1, margin:'0 0 4px', position:'relative' }}>
            ${totalValue.toLocaleString('en-US',{minimumFractionDigits:2})}
          </p>
          <p style={{ color:'rgba(255,255,255,0.8)', fontSize:13, marginBottom:12, position:'relative' }}>
            <span style={{ color:'#7FFFD4', fontWeight:700 }}>+$342.18 (+2.04%)</span> today
          </p>
          <svg viewBox={`0 0 ${sparkW} ${sparkH}`} width={sparkW} height={sparkH} style={{ position:'relative' }}>
            <polyline points={pts} fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Tab switcher */}
        <div style={{ display:'flex', background:c.card, border:`1px solid ${c.border}`, borderRadius:12, padding:3, marginBottom:16 }}>
          {(['stocks','crypto'] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{ flex:1, padding:'9px 0', borderRadius:9, border:'none', background:tab===t?c.action:'transparent', color:tab===t?'#fff':c.textSec, fontSize:13, fontWeight:700, cursor:'pointer', textTransform:'capitalize' }}>
              {t.charAt(0).toUpperCase()+t.slice(1)}
            </button>
          ))}
        </div>

        {/* Holdings */}
        <div style={{ background:c.card, border:`1px solid ${c.border}`, borderRadius:16, marginBottom:16, overflow:'hidden' }}>
          <div style={{ padding:'14px 16px', borderBottom:`1px solid ${c.border}` }}>
            <p style={{ fontWeight:700, fontSize:14, color:c.text, margin:0 }}>Holdings</p>
          </div>
          {holdings.map((h,i)=>(
            <div key={h.sym} style={{ padding:'12px 16px', borderBottom:i<holdings.length-1?`1px solid ${c.border}`:'none', display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:40, height:40, borderRadius:10, background:isNight?'#1A3040':'#E8F3FA', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <span style={{ fontSize:11, fontWeight:800, color:c.action }}>{h.sym}</span>
              </div>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:13, fontWeight:600, color:c.text, margin:0 }}>{h.name}</p>
                <p style={{ fontSize:11, color:c.textTer, margin:0 }}>{'qty' in h ? `${h.qty} ${h.sym}` : `${h.shares} shares`}</p>
              </div>
              <div style={{ textAlign:'right' }}>
                <p style={{ fontSize:13, fontWeight:700, color:c.text, margin:0 }}>${h.value.toLocaleString()}</p>
                <p style={{ fontSize:11, fontWeight:600, color:h.change>=0?'#0F6E56':'#A32D2D', margin:0 }}>
                  {h.change>=0?'+':''}{h.change}%
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Watchlist */}
        <div style={{ background:c.card, border:`1px solid ${c.border}`, borderRadius:16, padding:16, marginBottom:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <p style={{ fontWeight:700, fontSize:14, color:c.text, margin:0 }}>Watchlist</p>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c.action} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {WATCHLIST.map(sym=>(
              <span key={sym} style={{ padding:'6px 12px', borderRadius:20, border:`1px solid ${c.border}`, fontSize:12, fontWeight:700, color:c.textSec, background:c.card }}>
                {sym}
              </span>
            ))}
            <span style={{ padding:'6px 12px', borderRadius:20, border:`1px dashed ${c.border}`, fontSize:12, fontWeight:700, color:c.textTer, cursor:'pointer' }}>+ Add</span>
          </div>
        </div>

        {/* Discover */}
        <div style={{ background:c.card, border:`1px solid ${c.border}`, borderRadius:16, padding:16, marginBottom:16 }}>
          <p style={{ fontWeight:700, fontSize:14, color:c.text, marginBottom:14 }}>Discover</p>

          <p style={{ fontSize:12, color:c.textTer, fontWeight:600, marginBottom:8 }}>Trending</p>
          <div style={{ display:'flex', gap:8, marginBottom:14 }}>
            {TRENDING.map(sym=>(
              <span key={sym} style={{ padding:'6px 12px', borderRadius:20, background:isNight?'#1A3040':'#E8F3FA', fontSize:12, fontWeight:700, color:c.action }}>{sym}</span>
            ))}
          </div>

          <p style={{ fontSize:12, color:c.textTer, fontWeight:600, marginBottom:8 }}>Top Movers</p>
          <div style={{ display:'flex', gap:8, marginBottom:14 }}>
            {TOP_MOVERS.map(m=>(
              <span key={m.sym} style={{ padding:'6px 12px', borderRadius:20, background:m.change>=0?(isNight?'#0D2A1E':'#ECFDF5'):(isNight?'#2A1010':'#FEF2F2'), fontSize:12, fontWeight:700, color:m.change>=0?'#0F6E56':'#A32D2D' }}>
                {m.sym} {m.change>=0?'+':''}{m.change}%
              </span>
            ))}
          </div>

          <p style={{ fontSize:12, color:c.textTer, fontWeight:600, marginBottom:8 }}>AI Suggested</p>
          <div style={{ background:'#EAF3DE', border:'1px solid #B4D88A', borderRadius:12, padding:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:8 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#27500A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
              <span style={{ fontSize:10, fontWeight:800, color:'#27500A', letterSpacing:0.8, textTransform:'uppercase' }}>AI Picks · Informational only</span>
            </div>
            {AI_PICKS.map(p=>(
              <div key={p.sym} style={{ display:'flex', gap:10, marginBottom:8 }}>
                <span style={{ fontSize:12, fontWeight:800, color:'#27500A', minWidth:40 }}>{p.sym}</span>
                <span style={{ fontSize:11, color:'#27500A', lineHeight:1.4 }}>{p.reason}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <BankBottomNav active="/village/bank/invest"/>
    </div>
  );
}
