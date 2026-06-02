'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';

const B = {
  day:   { bg:'#F2F7FA', card:'#FFFFFF', border:'#C8DCE8', text:'#0A1F2E', textSec:'#3A5A6E', textTer:'#7A9AAE', action:'#0A5F8A' },
  night: { bg:'#060F18', card:'#0E1E2E', border:'#1A3040', text:'#EEF4F8', textSec:'#8EB4CC', textTer:'#4A7A96', action:'#2A9FCC' },
};

const ACCOUNTS = [
  { id:'chk',  label:'Checking',    amount:8240    },
  { id:'sav',  label:'Savings',     amount:4607    },
  { id:'port', label:'Portfolio',   amount:12840   },
  { id:'cc',   label:'Credit Card', amount:-1200   },
];

const TXNS = [
  { id:1,  merchant:'Whole Foods Market',        category:'Groceries',    amount:-84.32,  date:'Today' },
  { id:2,  merchant:'Direct Deposit — Acme Corp',category:'Income',       amount:2850.00, date:'Today' },
  { id:3,  merchant:'Netflix',                   category:'Subscriptions',amount:-15.49,  date:'Yesterday' },
  { id:4,  merchant:'Shell Gas Station',         category:'Transport',    amount:-52.10,  date:'Yesterday' },
  { id:5,  merchant:'Amazon',                    category:'Shopping',     amount:-134.99, date:'May 30' },
  { id:6,  merchant:'Uber Eats',                 category:'Food',         amount:-28.75,  date:'May 30' },
  { id:7,  merchant:'Gym Membership',            category:'Health',       amount:-45.00,  date:'May 29' },
  { id:8,  merchant:'Zelle Transfer — Marcus',   category:'Transfer',     amount:200.00,  date:'May 29' },
  { id:9,  merchant:'Starbucks',                 category:'Food',         amount:-7.85,   date:'May 28' },
  { id:10, merchant:'Apple iCloud',              category:'Subscriptions',amount:-2.99,   date:'May 28' },
];

const SPEND = [
  { name:'Housing',  amount:1850, pct:100, color:'#0A5F8A' },
  { name:'Food',     amount:847,  pct:71,  color:'#1D9E75' },
  { name:'Transport',amount:312,  pct:78,  color:'#0F6E56' },
  { name:'Shopping', amount:634,  pct:79,  color:'#3A5A6E' },
  { name:'Bills',    amount:420,  pct:84,  color:'#7A9AAE' },
  { name:'Health',   amount:145,  pct:29,  color:'#2A9FCC' },
];

const NETWORK = [
  { name:'Nia J.',    credential:'CFP',       initials:'NJ' },
  { name:'Marcus T.', credential:'Series 65', initials:'MT' },
  { name:'Aisha B.',  credential:'CPA',       initials:'AB' },
];

const TX_ICON: Record<string,string> = {
  Income:        'M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
  Groceries:     'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0',
  Subscriptions: 'M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8',
  Transport:     'M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v9a2 2 0 01-2 2h-2',
  Shopping:      'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18',
  Food:          'M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z',
  Health:        'M22 12h-4l-3 9L9 3l-3 9H2',
  Transfer:      'M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4',
};

export function BankBottomNav({ active }: { active: string }) {
  const { theme } = useVillageTheme();
  const c = theme === 'night' ? B.night : B.day;
  const tabs = [
    { href:'/village/bank',              label:'Home',   d:'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
    { href:'/village/bank/move',         label:'Move',   d:'M5 12h14M12 5l7 7-7 7' },
    { href:'/village/bank/invest',       label:'Invest', d:'M23 6l-9.5 9.5-5-5L1 18' },
    { href:'/village/bank/village-fund', label:'Fund',   d:'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75' },
    { href:'/village/bank/budget',       label:'More',   d:'M4 6h16M4 12h16M4 18h16' },
  ];
  return (
    <nav style={{ position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:480, background:c.card, borderTop:`1px solid ${c.border}`, display:'flex', zIndex:50 }}>
      {tabs.map(t => {
        const on = active === t.href;
        return (
          <Link key={t.href} href={t.href} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'10px 0 8px', color:on?c.action:c.textTer, textDecoration:'none', fontSize:10, fontWeight:on?700:400, gap:3 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={on?2.5:1.5} strokeLinecap="round" strokeLinejoin="round"><path d={t.d}/></svg>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function BankHome() {
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';
  const c = isNight ? B.night : B.day;
  const [showNW, setShowNW] = useState(false);
  const total = ACCOUNTS.reduce((s, a) => s + a.amount, 0);

  return (
    <div style={{ background:c.bg, minHeight:'100vh', maxWidth:480, margin:'0 auto', paddingBottom:88 }}>
      {/* Top bar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px 12px', background:c.card, borderBottom:`1px solid ${c.border}` }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c.action} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <span style={{ fontWeight:800, fontSize:18, color:c.text, letterSpacing:-0.5 }}>Village Bank</span>
        </div>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c.textSec} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>
      </div>

      <div style={{ padding:'16px 16px 0' }}>
        {/* Balance card — always dark */}
        <div style={{ background:'#0A5F8A', borderRadius:20, padding:20, marginBottom:16, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-30, right:-30, width:130, height:130, borderRadius:'50%', background:'rgba(255,255,255,0.06)', pointerEvents:'none' }}/>
          <div style={{ position:'absolute', bottom:-20, left:30, width:90, height:90, borderRadius:'50%', background:'rgba(255,255,255,0.04)', pointerEvents:'none' }}/>
          <p style={{ color:'rgba(255,255,255,0.7)', fontSize:11, fontWeight:600, letterSpacing:0.8, textTransform:'uppercase', marginBottom:4, position:'relative' }}>Total Balance</p>
          <p style={{ color:'#fff', fontSize:32, fontWeight:800, letterSpacing:-1, margin:'0 0 6px', position:'relative' }}>
            ${total.toLocaleString('en-US',{minimumFractionDigits:2})}
          </p>
          <div style={{ display:'flex', gap:20, marginBottom:12, position:'relative' }}>
            <span style={{ color:'rgba(255,255,255,0.65)', fontSize:12 }}>Available <strong style={{ color:'#fff' }}>$12,847.00</strong></span>
            <span style={{ color:'rgba(255,255,255,0.65)', fontSize:12 }}>Pending <strong style={{ color:'#fff' }}>$0.00</strong></span>
          </div>
          <button onClick={()=>setShowNW(v=>!v)} style={{ background:'rgba(255,255,255,0.15)', border:'none', color:'#fff', borderRadius:20, padding:'5px 14px', fontSize:12, cursor:'pointer', fontWeight:600, position:'relative' }}>
            {showNW?'Hide Net Worth':'Show Net Worth'}
          </button>
          {showNW && (
            <div style={{ background:'rgba(255,255,255,0.1)', borderRadius:12, padding:'10px 14px', marginTop:10, position:'relative' }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'rgba(255,255,255,0.8)', marginBottom:4 }}><span>Assets</span><strong style={{ color:'#fff' }}>$25,687.00</strong></div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'rgba(255,255,255,0.8)', marginBottom:4 }}><span>Liabilities</span><strong style={{ color:'#fff' }}>-$1,200.00</strong></div>
              <div style={{ borderTop:'1px solid rgba(255,255,255,0.2)', marginTop:6, paddingTop:6, display:'flex', justifyContent:'space-between', fontSize:13, fontWeight:700, color:'#fff' }}><span>Net Worth</span><span>$24,487.00</span></div>
            </div>
          )}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:10, position:'relative' }}>
            {ACCOUNTS.map(a=>(
              <span key={a.id} style={{ background:'rgba(255,255,255,0.15)', borderRadius:20, padding:'3px 10px', fontSize:11, color:'#fff', fontWeight:600 }}>{a.label}</span>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:16 }}>
          {([
            { label:'Send',    href:'/village/bank/move',    d:'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z' },
            { label:'Receive', href:'/village/bank/move',    d:'M12 2v20M2 12l10-10 10 10' },
            { label:'Deposit', href:'/village/bank/move',    d:'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3' },
            { label:'Finance', href:'/village/bank/finance', d:'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM12 8v4l3 3' },
          ] as { label:string; href:string; d:string }[]).map(a=>(
            <Link key={a.label} href={a.href} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, textDecoration:'none' }}>
              <div style={{ width:52, height:52, borderRadius:'50%', background:c.action, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={a.d}/></svg>
              </div>
              <span style={{ fontSize:11, color:c.textSec, fontWeight:600 }}>{a.label}</span>
            </Link>
          ))}
        </div>

        {/* AI insight */}
        <div style={{ background:'#EAF3DE', border:'1px solid #B4D88A', borderRadius:16, padding:16, marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#27500A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
            <span style={{ fontSize:10, fontWeight:800, color:'#27500A', letterSpacing:0.8, textTransform:'uppercase' }}>AI Insight</span>
          </div>
          <p style={{ fontSize:13, color:'#27500A', lineHeight:1.6, margin:0 }}>
            Your spending is 12% lower than last month — great discipline. Your savings rate is 18%, putting you on track to hit your Home Down Payment goal 3 months early. Consider moving $400 from checking to savings to strengthen your emergency fund ratio.
          </p>
        </div>

        {/* Spending snapshot */}
        <div style={{ background:c.card, border:`1px solid ${c.border}`, borderRadius:16, padding:16, marginBottom:16 }}>
          <p style={{ fontWeight:700, fontSize:14, color:c.text, marginBottom:12 }}>Spending Snapshot — May</p>
          {SPEND.map(cat=>(
            <div key={cat.name} style={{ marginBottom:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontSize:12, color:c.textSec }}>{cat.name}</span>
                <span style={{ fontSize:12, fontWeight:600, color:c.text }}>${cat.amount.toLocaleString()}</span>
              </div>
              <div style={{ height:6, background:isNight?'#1A3040':'#DDE9F0', borderRadius:3 }}>
                <div style={{ width:`${cat.pct}%`, height:'100%', background:cat.color, borderRadius:3 }}/>
              </div>
            </div>
          ))}
        </div>

        {/* Accounts */}
        <div style={{ background:c.card, border:`1px solid ${c.border}`, borderRadius:16, marginBottom:16, overflow:'hidden' }}>
          <div style={{ padding:'14px 16px', borderBottom:`1px solid ${c.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <p style={{ fontWeight:700, fontSize:14, color:c.text, margin:0 }}>Accounts</p>
            <span style={{ fontSize:12, color:c.action, fontWeight:600, cursor:'pointer' }}>Manage</span>
          </div>
          {ACCOUNTS.map((acct,i)=>(
            <div key={acct.id} style={{ padding:'12px 16px', borderBottom:i<ACCOUNTS.length-1?`1px solid ${c.border}`:'none', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:isNight?'#1A3040':'#E8F3FA', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c.action} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
                </div>
                <div>
                  <p style={{ fontSize:13, fontWeight:600, color:c.text, margin:0 }}>{acct.label}</p>
                  <p style={{ fontSize:11, color:c.textTer, margin:0 }}>Village Bank</p>
                </div>
              </div>
              <span style={{ fontWeight:700, fontSize:14, color:acct.amount<0?'#A32D2D':c.text }}>
                {acct.amount<0?'-':''}${Math.abs(acct.amount).toLocaleString('en-US',{minimumFractionDigits:2})}
              </span>
            </div>
          ))}
        </div>

        {/* Transactions */}
        <div style={{ background:c.card, border:`1px solid ${c.border}`, borderRadius:16, marginBottom:16, overflow:'hidden' }}>
          <div style={{ padding:'14px 16px', borderBottom:`1px solid ${c.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <p style={{ fontWeight:700, fontSize:14, color:c.text, margin:0 }}>Recent Transactions</p>
            <span style={{ fontSize:12, color:c.action, fontWeight:600, cursor:'pointer' }}>See all</span>
          </div>
          {TXNS.map((tx,i)=>(
            <div key={tx.id} style={{ padding:'11px 16px', borderBottom:i<TXNS.length-1?`1px solid ${c.border}`:'none', display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:38, height:38, borderRadius:'50%', background:isNight?'#1A3040':'#E8F3FA', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:c.action }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={TX_ICON[tx.category]??'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z'}/>
                </svg>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:13, fontWeight:600, color:c.text, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{tx.merchant}</p>
                <p style={{ fontSize:11, color:c.textTer, margin:0 }}>{tx.date} · {tx.category}</p>
              </div>
              <span style={{ fontWeight:700, fontSize:13, color:tx.amount>=0?'#0F6E56':'#A32D2D', whiteSpace:'nowrap' }}>
                {tx.amount>=0?'+':'-'}${Math.abs(tx.amount).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {/* Network */}
        <div style={{ background:c.card, border:`1px solid ${c.border}`, borderRadius:16, padding:16, marginBottom:8 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <p style={{ fontWeight:700, fontSize:14, color:c.text, margin:0 }}>Financial Network</p>
            <span style={{ fontSize:12, color:c.action, fontWeight:600, cursor:'pointer' }}>View all</span>
          </div>
          <div style={{ display:'flex', gap:20 }}>
            {NETWORK.map(n=>(
              <div key={n.name} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
                <div style={{ width:48, height:48, borderRadius:'50%', background:c.action, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:14 }}>{n.initials}</div>
                <span style={{ fontSize:11, color:c.text, fontWeight:600 }}>{n.name}</span>
                <span style={{ fontSize:10, color:c.action, fontWeight:700, background:isNight?'#1A3040':'#E8F3FA', borderRadius:20, padding:'2px 8px' }}>{n.credential}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <BankBottomNav active="/village/bank"/>
    </div>
  );
}
