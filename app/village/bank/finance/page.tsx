'use client';
import Link from 'next/link';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { BankBottomNav } from '@/components/bank/BankBottomNav';

const B = {
  day:   { bg:'#F2F7FA', card:'#FFFFFF', border:'#C8DCE8', text:'#0A1F2E', textSec:'#3A5A6E', textTer:'#7A9AAE', action:'#0A5F8A' },
  night: { bg:'#060F18', card:'#0E1E2E', border:'#1A3040', text:'#EEF4F8', textSec:'#8EB4CC', textTer:'#4A7A96', action:'#2A9FCC' },
};

const PRODUCTS = [
  {
    id:'personal',
    title:'Personal Loan',
    subtitle:'For any purpose — home improvement, debt consolidation, medical',
    apr:'8.9% – 24.9% APR',
    range:'$1,000 – $50,000',
    terms:'12 – 60 months',
    icon:'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM12 8v4l3 3',
    badge:'Pre-qualify in 60 seconds',
    badgeColor:'#0F6E56',
    badgeBg:'#ECFDF5',
  },
  {
    id:'business',
    title:'Village Business Loan',
    subtitle:'Requires verified Trading Post activity. Backed by revenue history.',
    apr:'7.5% – 18.9% APR',
    range:'$5,000 – $250,000',
    terms:'6 – 84 months',
    icon:'M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM2 12h20',
    badge:'Trading Post required',
    badgeColor:'#3A5A6E',
    badgeBg:'#E8F3FA',
  },
  {
    id:'crypto',
    title:'Crypto-Backed Loan',
    subtitle:'Use Bitcoin or ETH as collateral. No credit check. Smart contract on Polygon.',
    apr:'4.5% – 9.9% APR',
    range:'Up to 50% LTV',
    terms:'1 – 12 months',
    icon:'M22 12h-4l-3 9L9 3l-3 9H2',
    badge:'No credit check',
    badgeColor:'#0F6E56',
    badgeBg:'#ECFDF5',
  },
  {
    id:'credit-builder',
    title:'Credit Builder Card',
    subtitle:'Secured card that reports to all 3 bureaus. Build credit while you spend.',
    apr:'0% APR (secured)',
    range:'$200 – $5,000 deposit',
    terms:'Monthly reporting',
    icon:'M3 5h18v14H3zM3 10h18',
    badge:'Build your credit score',
    badgeColor:'#7A9AAE',
    badgeBg:'#F2F7FA',
  },
];

export default function FinancePage() {
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';
  const c = isNight ? B.night : B.day;

  return (
    <div style={{ background:c.bg, minHeight:'100vh', maxWidth:480, margin:'0 auto', paddingBottom:88 }}>
      {/* Top bar */}
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'16px 20px 12px', background:c.card, borderBottom:`1px solid ${c.border}` }}>
        <Link href="/village/bank" style={{ color:c.action, lineHeight:0 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </Link>
        <span style={{ fontWeight:800, fontSize:17, color:c.text }}>Financing</span>
      </div>

      <div style={{ padding:16 }}>
        {/* Eligibility AI card */}
        <div style={{ background:'#EAF3DE', border:'1px solid #B4D88A', borderRadius:16, padding:16, marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:10 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#27500A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
            <span style={{ fontSize:10, fontWeight:800, color:'#27500A', letterSpacing:0.8, textTransform:'uppercase' }}>AI Eligibility Preview</span>
            <span style={{ fontSize:10, color:'#27500A', marginLeft:'auto', background:'rgba(39,80,10,0.1)', borderRadius:20, padding:'2px 8px', fontWeight:600 }}>Soft pull · No impact</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
            {[
              { label:'Est. Credit Score', value:'Good (720–739)' },
              { label:'Pre-qual Amount',    value:'Up to $25,000' },
              { label:'Est. Rate',          value:'11.4% APR' },
              { label:'Monthly Payment',    value:'~$218/mo' },
            ].map(s=>(
              <div key={s.label} style={{ background:'rgba(39,80,10,0.08)', borderRadius:10, padding:'8px 10px' }}>
                <p style={{ fontSize:10, color:'#4A7A30', margin:'0 0 2px' }}>{s.label}</p>
                <p style={{ fontSize:12, fontWeight:700, color:'#27500A', margin:0 }}>{s.value}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize:11, color:'#27500A', margin:0, lineHeight:1.5 }}>
            Based on your account history and spending patterns. A formal application requires a hard credit pull with your consent.
          </p>
        </div>

        {/* Product cards */}
        {PRODUCTS.map(prod=>(
          <div key={prod.id} style={{ background:c.card, border:`1px solid ${c.border}`, borderRadius:16, padding:16, marginBottom:14 }}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:12 }}>
              <div style={{ width:44, height:44, borderRadius:12, background:isNight?'#1A3040':'#E8F3FA', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c.action} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={prod.icon}/></svg>
              </div>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:14, fontWeight:700, color:c.text, margin:0 }}>{prod.title}</p>
                <p style={{ fontSize:11, color:c.textSec, margin:'4px 0 0', lineHeight:1.4 }}>{prod.subtitle}</p>
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
              {[
                { label:'Rate', value:prod.apr },
                { label:'Amount', value:prod.range },
                { label:'Terms', value:prod.terms },
              ].map(d=>(
                <div key={d.label} style={{ background:isNight?'#1A3040':'#F2F7FA', borderRadius:8, padding:'8px 10px' }}>
                  <p style={{ fontSize:10, color:c.textTer, margin:'0 0 2px' }}>{d.label}</p>
                  <p style={{ fontSize:12, fontWeight:600, color:c.text, margin:0 }}>{d.value}</p>
                </div>
              ))}
              <div style={{ background:prod.badgeBg, borderRadius:8, padding:'8px 10px' }}>
                <p style={{ fontSize:10, color:prod.badgeColor, margin:'0 0 2px', fontWeight:700 }}>Highlight</p>
                <p style={{ fontSize:11, fontWeight:700, color:prod.badgeColor, margin:0 }}>{prod.badge}</p>
              </div>
            </div>

            <button style={{ width:'100%', background:c.action, color:'#fff', border:'none', borderRadius:10, padding:'12px 0', fontSize:13, fontWeight:700, cursor:'pointer' }}>
              Check Eligibility
            </button>
          </div>
        ))}
      </div>
      <BankBottomNav active="/village/bank/budget"/>
    </div>
  );
}
