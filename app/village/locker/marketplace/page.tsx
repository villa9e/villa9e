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

type Request = {
  id: string;
  buyer: string;
  segments: string[];
  pricePerUser: number;
  eligible: boolean;
  eligibilityNote: string;
  dataUsed: string;
  deadline: string;
  accepted?: boolean | null;
};

const ACTIVE_REQUESTS: Request[] = [
  {
    id:'r1',
    buyer:'Productivity software company',
    segments:['GPS Goals', 'Behavioral Patterns'],
    pricePerUser:0.80,
    eligible:true,
    eligibilityNote:'You are eligible',
    dataUsed:'Monthly behavioral dataset for UX research',
    deadline:'Jun 15, 2026',
    accepted:null,
  },
  {
    id:'r2',
    buyer:'Health & wellness retailer',
    segments:['Wellness Metrics', 'Behavioral Patterns'],
    pricePerUser:2.40,
    eligible:false,
    eligibilityNote:'Requires wellness sharing',
    dataUsed:'Consumer wellness engagement signals',
    deadline:'Jun 20, 2026',
    accepted:null,
  },
  {
    id:'r3',
    buyer:'Financial services brand',
    segments:['Financial Behavior'],
    pricePerUser:3.20,
    eligible:true,
    eligibilityNote:'You are eligible',
    dataUsed:'Spending category behavior for product design',
    deadline:'Jun 30, 2026',
    accepted:null,
  },
];

const HISTORICAL = [
  { id:'h1', buyer:'Consumer goods company',    categories:'Commerce Behavior',  date:'May 28, 2026', earned:1.60, status:'Completed' },
  { id:'h2', buyer:'Content platform company',  categories:'Content Engagement', date:'Apr 30, 2026', earned:1.80, status:'Completed' },
  { id:'h3', buyer:'Learning platform company', categories:'Goal Content Interests', date:'Mar 31, 2026', earned:0.80, status:'Completed' },
];

const APPROVED_USES = [
  'Product and UX research',
  'Advertising targeting (anonymous segments)',
  'Academic and market research',
  'Service personalization',
  'Consumer behavior analytics',
];

const PROHIBITED_USES = [
  'Law enforcement (without court order)',
  'Political campaign targeting',
  'Discriminatory profiling',
  'Data resale to third parties',
  'Re-identification attempts',
  'Insurance underwriting based on health data',
];

export default function Marketplace() {
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';
  const c = isNight ? L.night : L.day;
  const [requests, setRequests] = useState<Request[]>(ACTIVE_REQUESTS);

  function handleAccept(id: string) {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, accepted: true } : r));
  }
  function handleDecline(id: string) {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, accepted: false } : r));
  }

  return (
    <div style={{ background:c.bg, minHeight:'100vh', maxWidth:480, margin:'0 auto', paddingBottom:88 }}>
      {/* Top bar */}
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'16px 20px 12px', background:c.card, borderBottom:`1px solid ${c.border}` }}>
        <Link href="/village/locker" style={{ textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'center', width:36, height:36, borderRadius:'50%', border:`1px solid ${c.border}` }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </Link>
        <span style={{ fontWeight:800, fontSize:18, color:c.text, letterSpacing:-0.5 }}>Data Marketplace</span>
      </div>

      {/* Nav */}
      <div style={{ overflowX:'auto', display:'flex', gap:0, background:c.card, borderBottom:`1px solid ${c.border}` }}>
        {NAV_ITEMS.map(item => {
          const active = item.href === '/village/locker/marketplace';
          return (
            <Link key={item.href} href={item.href} style={{ textDecoration:'none', padding:'10px 14px', fontSize:12, fontWeight:active?700:500, color:active?'#1D9E75':c.textSec, borderBottom:active?'2px solid #1D9E75':'2px solid transparent', whiteSpace:'nowrap' }}>
              {item.label}
            </Link>
          );
        })}
      </div>

      <div style={{ padding:'16px 16px 0' }}>
        {/* Active requests */}
        <p style={{ fontWeight:700, fontSize:14, color:c.text, margin:'0 0 12px' }}>Active Data Requests</p>

        {requests.map(req => (
          <div key={req.id} style={{ background:c.card, border:`1px solid ${c.border}`, borderRadius:16, padding:16, marginBottom:12 }}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:14, fontWeight:700, color:c.text, margin:'0 0 4px' }}>{req.buyer}</p>
                <p style={{ fontSize:11, color:c.textSec, margin:0 }}>Deadline: {req.deadline}</p>
              </div>
              <span style={{
                fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:20,
                background:req.eligible?'#04342C':'rgba(0,0,0,0.1)',
                border:`1px solid ${req.eligible?'#1D9E75':c.border}`,
                color:req.eligible?'#9FE1CB':c.textTer,
                marginLeft:8, whiteSpace:'nowrap',
              }}>
                {req.eligibilityNote}
              </span>
            </div>

            <div style={{ marginBottom:10 }}>
              <p style={{ fontSize:11, fontWeight:700, color:c.textTer, letterSpacing:0.8, textTransform:'uppercase', margin:'0 0 6px' }}>Data requested</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {req.segments.map(seg => (
                  <span key={seg} style={{ background:isNight?'#0F2820':'#E8F5F0', border:`1px solid ${c.border}`, borderRadius:20, padding:'3px 10px', fontSize:11, color:c.textSec, fontWeight:600 }}>
                    {seg}
                  </span>
                ))}
              </div>
            </div>

            <p style={{ fontSize:12, color:c.textSec, margin:'0 0 10px', lineHeight:1.5 }}>{req.dataUsed}</p>

            <div style={{ background:'#04342C', border:'1px solid #1D9E75', borderRadius:10, padding:'9px 12px', marginBottom:12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:12, color:'#9FE1CB', fontWeight:600 }}>Your share</span>
              <span style={{ fontSize:14, fontWeight:800, color:'#9FE1CB' }}>${req.pricePerUser.toFixed(2)} per user</span>
            </div>

            {req.accepted === null ? (
              req.eligible ? (
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={() => handleAccept(req.id)} style={{ flex:2, background:'#1D9E75', border:'none', color:'#fff', borderRadius:10, padding:'11px 0', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                    Accept and earn
                  </button>
                  <button onClick={() => handleDecline(req.id)} style={{ flex:1, background:'transparent', border:`1px solid ${c.border}`, color:c.textSec, borderRadius:10, padding:'11px 0', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                    Decline
                  </button>
                </div>
              ) : (
                <Link href="/village/locker/permissions" style={{ textDecoration:'none' }}>
                  <button style={{ width:'100%', background:'transparent', border:`1px solid #EF9F27`, color:'#EF9F27', borderRadius:10, padding:'11px 0', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                    Enable sharing to participate
                  </button>
                </Link>
              )
            ) : req.accepted ? (
              <div style={{ background:'#04342C', border:'1px solid #1D9E75', borderRadius:10, padding:'11px 14px', textAlign:'center' }}>
                <p style={{ color:'#9FE1CB', fontSize:13, fontWeight:700, margin:0 }}>Accepted — earnings deposited by {req.deadline}</p>
              </div>
            ) : (
              <div style={{ background:isNight?'#0F2820':'#F0FAF6', borderRadius:10, padding:'11px 14px', textAlign:'center' }}>
                <p style={{ color:c.textTer, fontSize:13, fontWeight:600, margin:0 }}>Declined</p>
              </div>
            )}
          </div>
        ))}

        {/* Historical requests */}
        <p style={{ fontWeight:700, fontSize:14, color:c.text, margin:'8px 0 12px' }}>Completed Requests</p>
        <div style={{ background:c.card, border:`1px solid ${c.border}`, borderRadius:16, overflow:'hidden', marginBottom:16 }}>
          {HISTORICAL.map((h, i) => (
            <div key={h.id} style={{ padding:'12px 16px', borderBottom:i<HISTORICAL.length-1?`1px solid ${c.border}`:'none' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:13, fontWeight:600, color:c.text, margin:'0 0 2px' }}>{h.buyer}</p>
                  <p style={{ fontSize:11, color:c.textSec, margin:'0 0 2px' }}>{h.categories}</p>
                  <p style={{ fontSize:11, color:c.textTer, margin:0 }}>{h.date}</p>
                </div>
                <div style={{ textAlign:'right' }}>
                  <p style={{ fontSize:13, fontWeight:700, color:'#EF9F27', margin:'0 0 4px' }}>+${h.earned.toFixed(2)}</p>
                  <span style={{ fontSize:10, fontWeight:700, background:'#04342C', border:'1px solid #1D9E75', color:'#9FE1CB', borderRadius:20, padding:'2px 8px' }}>
                    {h.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Buyer verification */}
        <div style={{ background:c.card, border:`1px solid ${c.border}`, borderRadius:16, padding:16, marginBottom:8 }}>
          <p style={{ fontWeight:700, fontSize:14, color:c.text, margin:'0 0 14px' }}>Buyer Verification</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <p style={{ fontSize:11, fontWeight:700, color:'#1D9E75', letterSpacing:0.8, textTransform:'uppercase', margin:'0 0 8px' }}>Approved uses</p>
              {APPROVED_USES.map((use, i) => (
                <div key={i} style={{ display:'flex', gap:6, marginBottom:5, alignItems:'flex-start' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0, marginTop:2 }}><path d="M20 6L9 17l-5-5"/></svg>
                  <span style={{ fontSize:11, color:c.textSec, lineHeight:1.4 }}>{use}</span>
                </div>
              ))}
            </div>
            <div>
              <p style={{ fontSize:11, fontWeight:700, color:'#EF9F27', letterSpacing:0.8, textTransform:'uppercase', margin:'0 0 8px' }}>Prohibited</p>
              {PROHIBITED_USES.map((use, i) => (
                <div key={i} style={{ display:'flex', gap:6, marginBottom:5, alignItems:'flex-start' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#EF9F27" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0, marginTop:2 }}><path d="M18 6L6 18M6 6l12 12"/></svg>
                  <span style={{ fontSize:11, color:c.textSec, lineHeight:1.4 }}>{use}</span>
                </div>
              ))}
            </div>
          </div>
          <button style={{ width:'100%', background:'transparent', border:`1px solid ${c.border}`, color:'#1D9E75', borderRadius:10, padding:'10px 0', fontSize:12, fontWeight:700, cursor:'pointer', marginTop:12 }}>
            View buyer trust standards
          </button>
        </div>
      </div>
    </div>
  );
}
