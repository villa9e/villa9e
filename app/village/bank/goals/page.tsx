'use client';
import Link from 'next/link';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { BankBottomNav } from '../page';

const B = {
  day:   { bg:'#F2F7FA', card:'#FFFFFF', border:'#C8DCE8', text:'#0A1F2E', textSec:'#3A5A6E', textTer:'#7A9AAE', action:'#0A5F8A' },
  night: { bg:'#060F18', card:'#0E1E2E', border:'#1A3040', text:'#EEF4F8', textSec:'#8EB4CC', textTer:'#4A7A96', action:'#2A9FCC' },
};

const GOALS = [
  {
    id:'home',
    name:'Home Down Payment',
    icon:'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z',
    saved:8400,
    target:60000,
    monthly:500,
    projectedDate:'Mar 2036',
    onTrack:true,
    aiTip:'Increasing monthly contribution by $200 would shorten timeline to Dec 2033.',
  },
  {
    id:'emergency',
    name:'Emergency Fund',
    icon:'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    saved:5200,
    target:15000,
    monthly:400,
    projectedDate:'Jan 2029',
    onTrack:true,
    aiTip:'You are on track. Aim to reach 6 months of expenses ($12,500) by end of year.',
  },
  {
    id:'vacation',
    name:'Hawaii Vacation',
    icon:'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z',
    saved:1200,
    target:5000,
    monthly:200,
    projectedDate:'Nov 2026',
    onTrack:false,
    aiTip:'Reducing dining spend by $150/mo could accelerate this goal by 3 months.',
  },
];

export default function GoalsPage() {
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';
  const c = isNight ? B.night : B.day;
  const totalSaved = GOALS.reduce((s,g)=>s+g.saved,0);
  const totalTarget = GOALS.reduce((s,g)=>s+g.target,0);
  const onTrack = GOALS.filter(g=>g.onTrack).length;

  return (
    <div style={{ background:c.bg, minHeight:'100vh', maxWidth:480, margin:'0 auto', paddingBottom:88 }}>
      {/* Top bar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px 12px', background:c.card, borderBottom:`1px solid ${c.border}` }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <Link href="/village/bank" style={{ color:c.action, lineHeight:0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </Link>
          <span style={{ fontWeight:800, fontSize:17, color:c.text }}>Financial Goals</span>
        </div>
        <button style={{ width:32, height:32, borderRadius:'50%', background:c.action, border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
        </button>
      </div>

      <div style={{ padding:16 }}>
        {/* Overview card */}
        <div style={{ background:'#0A5F8A', borderRadius:20, padding:20, marginBottom:16, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-30, right:-30, width:130, height:130, borderRadius:'50%', background:'rgba(255,255,255,0.06)', pointerEvents:'none' }}/>
          <p style={{ color:'rgba(255,255,255,0.7)', fontSize:11, fontWeight:600, letterSpacing:0.8, textTransform:'uppercase', marginBottom:4, position:'relative' }}>Total Saved</p>
          <p style={{ color:'#fff', fontSize:32, fontWeight:800, letterSpacing:-1, margin:'0 0 4px', position:'relative' }}>
            ${totalSaved.toLocaleString()}
          </p>
          <p style={{ color:'rgba(255,255,255,0.7)', fontSize:12, marginBottom:14, position:'relative' }}>of ${totalTarget.toLocaleString()} total target</p>
          <div style={{ display:'flex', gap:24, position:'relative' }}>
            <div>
              <p style={{ color:'rgba(255,255,255,0.6)', fontSize:11, margin:0 }}>Goals</p>
              <p style={{ color:'#fff', fontSize:16, fontWeight:700, margin:0 }}>{GOALS.length}</p>
            </div>
            <div>
              <p style={{ color:'rgba(255,255,255,0.6)', fontSize:11, margin:0 }}>On Track</p>
              <p style={{ color:'#7FFFD4', fontSize:16, fontWeight:700, margin:0 }}>{onTrack}</p>
            </div>
            <div>
              <p style={{ color:'rgba(255,255,255,0.6)', fontSize:11, margin:0 }}>Earliest</p>
              <p style={{ color:'#fff', fontSize:16, fontWeight:700, margin:0 }}>Nov 2026</p>
            </div>
          </div>
        </div>

        {/* Goal cards */}
        {GOALS.map(goal=>{
          const pct = Math.round((goal.saved/goal.target)*100);
          return (
            <div key={goal.id} style={{ background:c.card, border:`1px solid ${c.border}`, borderRadius:16, padding:16, marginBottom:14 }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:12 }}>
                <div style={{ width:40, height:40, borderRadius:12, background:isNight?'#1A3040':'#E8F3FA', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c.action} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={goal.icon}/></svg>
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:14, fontWeight:700, color:c.text, margin:0 }}>{goal.name}</p>
                  <div style={{ display:'flex', gap:8, marginTop:3 }}>
                    <span style={{ fontSize:10, fontWeight:700, background:goal.onTrack?(isNight?'#0D2A1E':'#ECFDF5'):(isNight?'#2A1010':'#FEF2F2'), color:goal.onTrack?'#0F6E56':'#A32D2D', borderRadius:20, padding:'2px 8px' }}>
                      {goal.onTrack ? 'On Track' : 'Behind'}
                    </span>
                    <span style={{ fontSize:10, color:c.textTer }}>Target: {goal.projectedDate}</span>
                  </div>
                </div>
              </div>

              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{ fontSize:13, color:c.textSec }}>Saved</span>
                <span style={{ fontSize:13, fontWeight:700, color:c.text }}>${goal.saved.toLocaleString()} <span style={{ color:c.textTer, fontWeight:400 }}>/ ${goal.target.toLocaleString()}</span></span>
              </div>
              <div style={{ height:8, background:isNight?'#1A3040':'#DDE9F0', borderRadius:4, marginBottom:8 }}>
                <div style={{ width:`${Math.min(pct,100)}%`, height:'100%', background:c.action, borderRadius:4 }}/>
              </div>
              <p style={{ fontSize:11, color:c.textTer, marginBottom:12 }}>{pct}% · ${goal.monthly}/mo contribution</p>

              {/* AI tip */}
              <div style={{ background:'#EAF3DE', border:'1px solid #B4D88A', borderRadius:10, padding:'8px 12px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:4 }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#27500A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                  <span style={{ fontSize:9, fontWeight:800, color:'#27500A', letterSpacing:0.8, textTransform:'uppercase' }}>AI Tip</span>
                </div>
                <p style={{ fontSize:11, color:'#27500A', margin:0, lineHeight:1.5 }}>{goal.aiTip}</p>
              </div>
            </div>
          );
        })}

        {/* New goal button */}
        <button style={{ width:'100%', border:`2px dashed ${c.border}`, borderRadius:16, padding:'18px 0', background:'transparent', color:c.action, fontSize:14, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
          New Goal
        </button>
      </div>
      <BankBottomNav active="/village/bank/budget"/>
    </div>
  );
}
