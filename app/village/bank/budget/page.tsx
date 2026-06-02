'use client';
import Link from 'next/link';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { BankBottomNav } from '@/components/bank/BankBottomNav';

const B = {
  day:   { bg:'#F2F7FA', card:'#FFFFFF', border:'#C8DCE8', text:'#0A1F2E', textSec:'#3A5A6E', textTer:'#7A9AAE', action:'#0A5F8A' },
  night: { bg:'#060F18', card:'#0E1E2E', border:'#1A3040', text:'#EEF4F8', textSec:'#8EB4CC', textTer:'#4A7A96', action:'#2A9FCC' },
};

const CATS = [
  { name:'Food & Dining', spent:847, budget:1200, icon:'M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z' },
  { name:'Transport',     spent:312, budget:400,  icon:'M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v9a2 2 0 01-2 2h-2' },
  { name:'Shopping',      spent:634, budget:800,  icon:'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18' },
  { name:'Bills',         spent:420, budget:500,  icon:'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6' },
  { name:'Health',        spent:145, budget:300,  icon:'M22 12h-4l-3 9L9 3l-3 9H2' },
  { name:'Entertainment', spent:89,  budget:200,  icon:'M21 2H3v16h5v4l4-4h5l4-4V2z' },
];

const MERCHANTS = [
  { name:'Amazon',           amount:312, txns:8 },
  { name:'Whole Foods',      amount:247, txns:5 },
  { name:'Shell Gas',        amount:186, txns:4 },
  { name:'Netflix + Hulu',   amount:28,  txns:2 },
];

const RECURRING = [
  { name:'Netflix',          amount:15.49, next:'Jun 3',  status:'active' },
  { name:'Spotify',          amount:9.99,  next:'Jun 7',  status:'active' },
  { name:'Gym',              amount:45.00, next:'Jun 1',  status:'active' },
  { name:'iCloud Storage',   amount:2.99,  next:'Jun 10', status:'active' },
  { name:'Adobe CC',         amount:54.99, next:'Jun 15', status:'active' },
];

function barColor(pct: number) {
  if (pct >= 100) return '#A32D2D';
  if (pct >= 80)  return '#B8860B';
  return '#0A5F8A';
}

export default function BudgetPage() {
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';
  const c = isNight ? B.night : B.day;
  const totalSpent = CATS.reduce((s,cat)=>s+cat.spent,0);
  const totalBudget = CATS.reduce((s,cat)=>s+cat.budget,0);
  const totalPct = Math.round((totalSpent/totalBudget)*100);

  return (
    <div style={{ background:c.bg, minHeight:'100vh', maxWidth:480, margin:'0 auto', paddingBottom:88 }}>
      {/* Top bar */}
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'16px 20px 12px', background:c.card, borderBottom:`1px solid ${c.border}` }}>
        <Link href="/village/bank" style={{ color:c.action, lineHeight:0 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </Link>
        <span style={{ fontWeight:800, fontSize:17, color:c.text }}>Budget</span>
      </div>

      <div style={{ padding:16 }}>
        {/* Month summary card */}
        <div style={{ background:'#0A5F8A', borderRadius:20, padding:20, marginBottom:16, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-30, right:-30, width:130, height:130, borderRadius:'50%', background:'rgba(255,255,255,0.06)', pointerEvents:'none' }}/>
          <p style={{ color:'rgba(255,255,255,0.7)', fontSize:11, fontWeight:600, letterSpacing:0.8, textTransform:'uppercase', marginBottom:4, position:'relative' }}>May 2026 — Budget Summary</p>
          <div style={{ display:'flex', alignItems:'baseline', gap:6, marginBottom:4, position:'relative' }}>
            <p style={{ color:'#fff', fontSize:28, fontWeight:800, letterSpacing:-0.5, margin:0 }}>${totalSpent.toLocaleString()}</p>
            <p style={{ color:'rgba(255,255,255,0.6)', fontSize:14, margin:0 }}>/ ${totalBudget.toLocaleString()}</p>
          </div>
          <p style={{ color:'rgba(255,255,255,0.7)', fontSize:12, marginBottom:12, position:'relative' }}>
            ${(totalBudget-totalSpent).toLocaleString()} remaining · {totalPct}% used
          </p>
          <div style={{ height:8, background:'rgba(255,255,255,0.2)', borderRadius:4, overflow:'hidden', position:'relative' }}>
            <div style={{ width:`${Math.min(totalPct,100)}%`, height:'100%', background:totalPct>=100?'#FF6B6B':totalPct>=80?'#FFD166':'#7FFFD4', borderRadius:4, transition:'width 0.6s ease' }}/>
          </div>
        </div>

        {/* Category cards */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
          {CATS.map(cat=>{
            const pct = Math.round((cat.spent/cat.budget)*100);
            return (
              <div key={cat.name} style={{ background:c.card, border:`1px solid ${c.border}`, borderRadius:14, padding:14 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                  <div style={{ width:30, height:30, borderRadius:8, background:isNight?'#1A3040':'#E8F3FA', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={c.action} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={cat.icon}/></svg>
                  </div>
                  <span style={{ fontSize:11, fontWeight:600, color:c.textSec, lineHeight:1.2 }}>{cat.name}</span>
                </div>
                <p style={{ fontSize:16, fontWeight:800, color:c.text, margin:'0 0 2px' }}>${cat.spent}</p>
                <p style={{ fontSize:11, color:c.textTer, margin:'0 0 8px' }}>/ ${cat.budget}</p>
                <div style={{ height:5, background:isNight?'#1A3040':'#DDE9F0', borderRadius:3 }}>
                  <div style={{ width:`${Math.min(pct,100)}%`, height:'100%', background:barColor(pct), borderRadius:3 }}/>
                </div>
                <p style={{ fontSize:10, color:pct>=80?'#B8860B':c.textTer, margin:'4px 0 0', fontWeight:pct>=80?700:400 }}>{pct}% used</p>
              </div>
            );
          })}
        </div>

        {/* Merchant insights */}
        <div style={{ background:c.card, border:`1px solid ${c.border}`, borderRadius:16, padding:16, marginBottom:16 }}>
          <p style={{ fontWeight:700, fontSize:14, color:c.text, marginBottom:12 }}>Top Merchants</p>
          {MERCHANTS.map((m,i)=>(
            <div key={m.name} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:10, paddingBottom:10, borderTop:i>0?`1px solid ${c.border}`:'none' }}>
              <div>
                <p style={{ fontSize:13, fontWeight:600, color:c.text, margin:0 }}>{m.name}</p>
                <p style={{ fontSize:11, color:c.textTer, margin:0 }}>{m.txns} transactions</p>
              </div>
              <span style={{ fontSize:13, fontWeight:700, color:c.text }}>${m.amount}</span>
            </div>
          ))}
        </div>

        {/* Recurring */}
        <div style={{ background:c.card, border:`1px solid ${c.border}`, borderRadius:16, overflow:'hidden', marginBottom:8 }}>
          <div style={{ padding:'14px 16px', borderBottom:`1px solid ${c.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <p style={{ fontWeight:700, fontSize:14, color:c.text, margin:0 }}>Recurring Charges</p>
            <span style={{ fontSize:12, color:c.textTer }}>${RECURRING.reduce((s,r)=>s+r.amount,0).toFixed(2)}/mo</span>
          </div>
          {RECURRING.map((r,i)=>(
            <div key={r.name} style={{ padding:'12px 16px', borderBottom:i<RECURRING.length-1?`1px solid ${c.border}`:'none', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <p style={{ fontSize:13, fontWeight:600, color:c.text, margin:0 }}>{r.name}</p>
                <p style={{ fontSize:11, color:c.textTer, margin:0 }}>Next: {r.next}</p>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:13, fontWeight:700, color:c.text }}>${r.amount.toFixed(2)}</span>
                <button style={{ fontSize:11, color:'#A32D2D', background:'none', border:`1px solid #A32D2D`, borderRadius:20, padding:'3px 10px', cursor:'pointer', fontWeight:600 }}>Cancel</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <BankBottomNav active="/village/bank/budget"/>
    </div>
  );
}
