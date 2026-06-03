'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';

const L = {
  day:   { bg:'#F2FAF8', card:'#FFFFFF', border:'#D0EDE6', text:'#0A1F14', textSec:'#3A6A5A', textTer:'#7AA89A' },
  night: { bg:'#060F0D', card:'#0C1A17', border:'#0F2820', text:'#E8F5F0', textSec:'#8ABFB0', textTer:'#4A8070' },
};
const LOCKED = { fill:'#04342C', border:'#1D9E75', text:'#9FE1CB' };
const SHARED  = { fill:'#412402', border:'#EF9F27', text:'#FAC775' };

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

type PermCategory = {
  id: string;
  name: string;
  icon: string;
  shared: boolean;
  included: string[];
  excluded: string[];
  buyers: string[];
  earningsLow: number;
  earningsHigh: number;
  modalText: string;
};

const INITIAL_PERMS: PermCategory[] = [
  {
    id:'gps', name:'GPS Goals', icon:'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
    shared:false,
    included:['Goal category types (fitness, career, finance)', 'Sprint completion rates and consistency', 'Goal probability scores (aggregated)', 'Season/timing of goal activity'],
    excluded:['Your actual goal titles or descriptions', 'Personal deadline dates', 'Your @handle or identity', 'Specific performance numbers'],
    buyers:['Productivity software companies', 'Coaching and personal development platforms', 'Corporate wellness programs'],
    earningsLow:1.80, earningsHigh:3.20,
    modalText:'You will share anonymized goal category signals. Buyers see patterns like "users who set career goals complete 73% of sprints" — never your actual goals or identity.',
  },
  {
    id:'content', name:'Content Engagement', icon:'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z',
    shared:true,
    included:['Content categories you engage with', 'Watch completion percentages', 'Skip patterns by content type', 'Time-of-day engagement trends'],
    excluded:['Specific posts or creator identities you engaged with', 'Comments or reactions you made', 'Your @handle or profile', 'DM or private content'],
    buyers:['Content recommendation platforms', 'Media companies and streaming services', 'Digital advertising networks'],
    earningsLow:1.20, earningsHigh:2.40,
    modalText:'You will share anonymized content preference signals. Buyers see patterns like "users who watch finance content for 80%+ completion" — never specific videos or your identity.',
  },
  {
    id:'location', name:'Location', icon:'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
    shared:false,
    included:['General region (city level only)', 'Urban/suburban/rural classification', 'Climate zone for relevant recommendations', 'Time zone (no finer resolution)'],
    excluded:['Precise GPS coordinates (ever)', 'Home or work address', 'Daily movement patterns', 'Location history'],
    buyers:['Local commerce platforms', 'Regional service companies', 'Location-aware app developers'],
    earningsLow:0.40, earningsHigh:1.20,
    modalText:'You will share city-level region data only. Buyers see "users in the Northeast US" — never your address, GPS coordinates, or movement.',
  },
  {
    id:'wellness', name:'Wellness Metrics', icon:'M22 12h-4l-3 9L9 3l-3 9H2',
    shared:false,
    included:['Health feature engagement frequency', 'Wellness goal category (fitness, mental, sleep)', 'Module usage patterns in wellness section', 'Consistency trends over time'],
    excluded:['Raw biometric data of any kind', 'Medical conditions or diagnoses', 'Medication or treatment information', 'Specific health numbers (weight, HR, etc)'],
    buyers:['Health and wellness retailers', 'Fitness platform companies', 'Corporate wellness benefit providers'],
    earningsLow:6.00, earningsHigh:11.00,
    modalText:'You will share wellness engagement patterns. Buyers see "users active in sleep wellness 4x/week" — never your actual health data, biometrics, or conditions.',
  },
  {
    id:'finance', name:'Financial Behavior', icon:'M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
    shared:false,
    included:['Spending category distribution (not amounts)', 'Savings behavior pattern (consistent vs irregular)', 'Investment category interest areas', 'Bill payment timing patterns'],
    excluded:['Account balances or specific amounts', 'Transaction details or merchants', 'Credit score or debt information', 'Income amount or source'],
    buyers:['Financial services brands', 'Fintech companies', 'Insurance providers', 'Investment platforms'],
    earningsLow:2.40, earningsHigh:4.00,
    modalText:'You will share anonymized financial behavior patterns. Buyers see "users with consistent savings behavior who engage with investment content" — never balances, amounts, or account details.',
  },
  {
    id:'commerce', name:'Commerce Behavior', icon:'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0',
    shared:true,
    included:['Product categories browsed in Trading Post', 'Purchase category frequency', 'Price tier preference signals', 'Vendor interaction patterns'],
    excluded:['Specific transaction amounts', 'Exact products purchased', 'Vendor identities', 'Payment method information'],
    buyers:['E-commerce platforms', 'Retail brands and merchants', 'Consumer goods companies'],
    earningsLow:1.00, earningsHigh:2.20,
    modalText:'You will share anonymized shopping pattern signals. Buyers see "users who browse home goods weekly" — never specific purchases, amounts, or store names.',
  },
  {
    id:'social', name:'Social Graph', icon:'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M9 7a4 4 0 100 8 4 4 0 000-8z',
    shared:false,
    included:['Connection count range (not identities)', 'Social category types (professional, creative, community)', 'Engagement style (active poster vs lurker)', 'Tribe/space membership category count'],
    excluded:['Who your connections are (ever)', 'Names or @handles of anyone in your network', 'Private messages or interactions', 'Connection relationship details'],
    buyers:['Social platform researchers', 'Community tools companies', 'Professional network services'],
    earningsLow:0.80, earningsHigh:2.00,
    modalText:'You will share anonymized social pattern signals. Buyers see "users with 50-200 connections in creative communities" — never who you are connected to or any individual identities.',
  },
  {
    id:'goalcont', name:'Goal Content Interests', icon:'M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z',
    shared:true,
    included:['Skill Stream content categories you engage with', 'Learning topic areas (career, fitness, finance, etc)', 'Course/module completion rates by category', 'Search topic patterns (aggregated)'],
    excluded:['Your actual goal details or personal context', 'Specific courses completed', 'Your progress notes or reflections', 'Performance scores'],
    buyers:['Online education platforms', 'Professional development companies', 'Corporate training providers'],
    earningsLow:0.50, earningsHigh:1.20,
    modalText:'You will share anonymized learning interest patterns. Buyers see "users interested in finance and career skills" — never your specific goals or personal development details.',
  },
  {
    id:'entertain', name:'Entertainment', icon:'M15.6 11.6L22 7v10l-6.4-4.5v-0.9zM2 7h12v10H2z',
    shared:false,
    included:['Content genre preferences in Pavilion', 'Viewing session duration patterns', 'Live event participation frequency', 'Content format preference (short vs long)'],
    excluded:['Specific shows, films, or creators watched', 'Viewing timestamps or schedule', 'Any commentary or ratings you gave', 'Watch history detail'],
    buyers:['Streaming and media companies', 'Entertainment studios', 'Ad-supported content platforms'],
    earningsLow:0.40, earningsHigh:1.00,
    modalText:'You will share anonymized entertainment preference signals. Buyers see "users who prefer long-form drama content on evenings" — never what specific shows you watched or your viewing history.',
  },
  {
    id:'behavior', name:'Behavioral Patterns', icon:'M3 12h18M3 6h18M3 18h12',
    shared:false,
    included:['Time-of-day usage patterns (morning vs evening)', 'Session frequency (how often you open app)', 'Feature usage distribution across Village sections', 'Day-of-week activity patterns'],
    excluded:['Calendar content or schedule details', 'What you were doing when not on Village', 'Physical location during sessions', 'Content of any sessions'],
    buyers:['App optimization companies', 'UX research firms', 'Consumer behavior analysts'],
    earningsLow:0.30, earningsHigh:0.90,
    modalText:'You will share anonymized usage pattern signals. Buyers see "users most active on weekday mornings" — never the content of what you did or your personal schedule.',
  },
  {
    id:'vlg', name:'VLG Patterns', icon:'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
    shared:false,
    included:['Which activity types earn VLG (categories only)', 'VLG earning frequency patterns', 'Reward program engagement category', 'Participation in VLG-eligible features'],
    excluded:['Wallet balance or total VLG holdings', 'Transaction details or amounts', 'Withdrawal patterns or amounts', 'Wallet address or identity'],
    buyers:['Blockchain analytics firms', 'Token economics researchers', 'Loyalty program companies'],
    earningsLow:0.60, earningsHigh:1.20,
    modalText:'You will share anonymized token engagement patterns. Buyers see "users who earn VLG through creative activities 3x/week" — never your wallet balance, transactions, or identity.',
  },
  {
    id:'comms', name:'Communication Patterns', icon:'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z',
    shared:false,
    included:['Messaging frequency (messages per week, not content)', 'Response time patterns (fast vs slow responder)', 'Group vs 1-on-1 messaging ratio', 'Communication consistency over time'],
    excluded:['Message content (ever — absolute prohibition)', 'Who you message (identities never shared)', 'Message timing precision', 'Contact list or network details'],
    buyers:['Communication tools companies', 'Workplace productivity researchers', 'Social dynamics analysts'],
    earningsLow:0.30, earningsHigh:0.80,
    modalText:'You will share anonymized messaging behavior patterns. Buyers see "users with 20+ messages/week in group contexts" — never any message content, who you message, or any identifiable information. Message content is never shared under any circumstances.',
  },
];

function LockIcon({ open, size=22 }: { open:boolean; size?:number }) {
  const color = open ? '#EF9F27' : '#1D9E75';
  if (open) return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 019.9-1"/>
    </svg>
  );
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0110 0v4"/>
    </svg>
  );
}

export default function Permissions() {
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';
  const c = isNight ? L.night : L.day;
  const [perms, setPerms] = useState<PermCategory[]>(INITIAL_PERMS);
  const [modal, setModal] = useState<PermCategory | null>(null);
  const [minimization, setMinimization] = useState(false);

  function confirmShare() {
    if (!modal) return;
    setPerms(prev => prev.map(p => p.id === modal.id ? { ...p, shared:true } : p));
    setModal(null);
  }

  function handleToggle(cat: PermCategory) {
    if (!cat.shared) {
      setModal(cat);
    } else {
      setPerms(prev => prev.map(p => p.id === cat.id ? { ...p, shared:false } : p));
    }
  }

  function shareAll() {
    setPerms(prev => prev.map(p => ({ ...p, shared:true })));
  }
  function lockAll() {
    setPerms(prev => prev.map(p => ({ ...p, shared:false })));
  }

  return (
    <div style={{ background:c.bg, minHeight:'100vh', maxWidth:480, margin:'0 auto', paddingBottom:88 }}>
      {/* Top bar */}
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'16px 20px 12px', background:c.card, borderBottom:`1px solid ${c.border}` }}>
        <Link href="/village/locker" style={{ textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'center', width:36, height:36, borderRadius:'50%', border:`1px solid ${c.border}` }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </Link>
        <span style={{ fontWeight:800, fontSize:18, color:c.text, letterSpacing:-0.5 }}>Sharing Permissions</span>
      </div>

      {/* Nav */}
      <div style={{ overflowX:'auto', display:'flex', gap:0, background:c.card, borderBottom:`1px solid ${c.border}` }}>
        {NAV_ITEMS.map(item => {
          const active = item.href === '/village/locker/permissions';
          return (
            <Link key={item.href} href={item.href} style={{ textDecoration:'none', padding:'10px 14px', fontSize:12, fontWeight:active?700:500, color:active?'#1D9E75':c.textSec, borderBottom:active?'2px solid #1D9E75':'2px solid transparent', whiteSpace:'nowrap' }}>
              {item.label}
            </Link>
          );
        })}
      </div>

      <div style={{ padding:'16px 16px 0' }}>
        {/* Global controls */}
        <div style={{ background:c.card, border:`1px solid ${c.border}`, borderRadius:16, padding:16, marginBottom:16 }}>
          <p style={{ fontWeight:700, fontSize:14, color:c.text, margin:'0 0 12px' }}>Global Controls</p>
          <div style={{ display:'flex', gap:8, marginBottom:12 }}>
            <button onClick={shareAll} style={{ flex:1, background:'#412402', border:`1px solid #EF9F27`, color:'#FAC775', borderRadius:10, padding:'10px 0', fontSize:13, fontWeight:700, cursor:'pointer' }}>
              Share everything
            </button>
            <button onClick={lockAll} style={{ flex:1, background:'#04342C', border:`1px solid #1D9E75`, color:'#9FE1CB', borderRadius:10, padding:'10px 0', fontSize:13, fontWeight:700, cursor:'pointer' }}>
              Lock everything
            </button>
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:isNight?'#0A1810':'#F0FAF6', borderRadius:10, padding:'11px 14px' }}>
            <div>
              <p style={{ fontSize:13, fontWeight:700, color:c.text, margin:'0 0 2px' }}>Data minimization mode</p>
              <p style={{ fontSize:11, color:c.textSec, margin:0 }}>Spirit selects the optimal sharing config</p>
            </div>
            <button
              onClick={() => setMinimization(v => !v)}
              style={{ width:44, height:24, borderRadius:12, background:minimization?'#1D9E75':'#ccc', border:'none', cursor:'pointer', position:'relative', transition:'background 0.2s' }}
            >
              <div style={{ position:'absolute', top:2, left:minimization?22:2, width:20, height:20, borderRadius:'50%', background:'#fff', transition:'left 0.2s' }}/>
            </button>
          </div>
        </div>

        {/* Per-category cards */}
        {perms.map(cat => {
          const s = cat.shared ? SHARED : LOCKED;
          return (
            <div key={cat.id} style={{ background:c.card, border:`1px solid ${c.border}`, borderRadius:16, marginBottom:12, overflow:'hidden' }}>
              <div style={{ background:s.fill, border:`1px solid ${s.border}`, margin:1, borderRadius:14, padding:'14px 16px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:36, height:36, borderRadius:10, background:'rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={s.text} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={cat.icon}/></svg>
                    </div>
                    <div>
                      <p style={{ fontSize:14, fontWeight:700, color:s.text, margin:0 }}>{cat.name}</p>
                      <p style={{ fontSize:11, color:`${s.text}99`, margin:0 }}>{cat.shared?'Sharing — earning':'Locked — private'}</p>
                    </div>
                  </div>
                  <button onClick={() => handleToggle(cat)} style={{ background:'transparent', border:'none', cursor:'pointer', padding:4 }}>
                    <LockIcon open={cat.shared} size={26} />
                  </button>
                </div>
              </div>
              <div style={{ padding:'14px 16px' }}>
                <div style={{ marginBottom:12 }}>
                  <p style={{ fontSize:11, fontWeight:700, color:'#1D9E75', letterSpacing:0.8, textTransform:'uppercase', margin:'0 0 6px' }}>What is included</p>
                  <ul style={{ margin:0, paddingLeft:16 }}>
                    {cat.included.map((pt,i) => <li key={i} style={{ fontSize:12, color:c.textSec, marginBottom:4, lineHeight:1.5 }}>{pt}</li>)}
                  </ul>
                </div>
                <div style={{ marginBottom:12 }}>
                  <p style={{ fontSize:11, fontWeight:700, color:'#EF9F27', letterSpacing:0.8, textTransform:'uppercase', margin:'0 0 6px' }}>What is never included</p>
                  <ul style={{ margin:0, paddingLeft:16 }}>
                    {cat.excluded.map((pt,i) => <li key={i} style={{ fontSize:12, color:c.textSec, marginBottom:4, lineHeight:1.5 }}>{pt}</li>)}
                  </ul>
                </div>
                <div style={{ marginBottom:12 }}>
                  <p style={{ fontSize:11, fontWeight:700, color:c.textTer, letterSpacing:0.8, textTransform:'uppercase', margin:'0 0 6px' }}>Who can buy this</p>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    {cat.buyers.map((b,i) => (
                      <span key={i} style={{ background:isNight?'#0F2820':'#E8F5F0', border:`1px solid ${c.border}`, borderRadius:20, padding:'3px 10px', fontSize:11, color:c.textSec, fontWeight:600 }}>{b}</span>
                    ))}
                  </div>
                </div>
                <div style={{ background:isNight?'#0A1810':'#F0FAF6', borderRadius:10, padding:'10px 12px' }}>
                  <p style={{ fontSize:12, fontWeight:700, color:'#1D9E75', margin:0 }}>
                    Estimated earnings: ${cat.earningsLow.toFixed(2)} – ${cat.earningsHigh.toFixed(2)} per month
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation modal */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:100 }}>
          <div style={{ background:isNight?'#0C1A17':'#fff', borderRadius:'20px 20px 0 0', padding:24, width:'100%', maxWidth:480 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EF9F27" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 019.9-1"/>
              </svg>
              <p style={{ fontWeight:800, fontSize:16, color:isNight?'#E8F5F0':'#0A1F14', margin:0 }}>Share {modal.name}?</p>
            </div>
            <p style={{ fontSize:13, color:isNight?'#8ABFB0':'#3A6A5A', lineHeight:1.7, margin:'0 0 14px' }}>{modal.modalText}</p>
            <div style={{ background:'#04342C', border:`1px solid #1D9E75`, borderRadius:10, padding:'10px 14px', marginBottom:16 }}>
              <p style={{ fontSize:12, color:'#9FE1CB', margin:0, fontWeight:600 }}>
                Estimated earnings: ${modal.earningsLow.toFixed(2)} – ${modal.earningsHigh.toFixed(2)} per month
              </p>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={confirmShare} style={{ flex:2, background:'#1D9E75', border:'none', color:'#fff', borderRadius:10, padding:'13px 0', fontSize:14, fontWeight:700, cursor:'pointer' }}>
                Yes, share and start earning
              </button>
              <button onClick={() => setModal(null)} style={{ flex:1, background:'transparent', border:`1px solid ${isNight?'#0F2820':'#D0EDE6'}`, color:isNight?'#8ABFB0':'#3A6A5A', borderRadius:10, padding:'13px 0', fontSize:14, fontWeight:600, cursor:'pointer' }}>
                Keep private
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
