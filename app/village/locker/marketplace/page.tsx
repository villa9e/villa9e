'use client';
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
        {/* Launching soon */}
        <div style={{ background:'#04342C', border:'1px solid #1D9E75', borderRadius:16, padding:18, marginBottom:16, textAlign:'center' }}>
          <div style={{ width:44, height:44, borderRadius:'50%', background:'rgba(29,158,117,0.2)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9FE1CB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          </div>
          <p style={{ color:'#9FE1CB', fontSize:15, fontWeight:800, margin:'0 0 6px' }}>Marketplace launching soon</p>
          <p style={{ color:'rgba(159,225,203,0.8)', fontSize:12, margin:0, lineHeight:1.6 }}>
            Verified buyer requests will appear here once Village's buyer network goes live. Your earnings from data sharing are already tracked in{' '}
            <Link href="/village/locker/earnings" style={{ color:'#9FE1CB', fontWeight:700, textDecoration:'underline' }}>Earnings</Link>.
          </p>
        </div>

        {/* Active requests placeholder */}
        <p style={{ fontWeight:700, fontSize:14, color:c.text, margin:'0 0 12px' }}>Active Data Requests</p>
        <div style={{ background:c.card, border:`1px solid ${c.border}`, borderRadius:16, padding:24, textAlign:'center', marginBottom:16 }}>
          <p style={{ color:c.textTer, fontSize:13, margin:0 }}>No active requests yet. Verified buyers will appear here once the marketplace opens.</p>
        </div>

        {/* Completed requests placeholder */}
        <p style={{ fontWeight:700, fontSize:14, color:c.text, margin:'8px 0 12px' }}>Completed Requests</p>
        <div style={{ background:c.card, border:`1px solid ${c.border}`, borderRadius:16, padding:24, textAlign:'center', marginBottom:16 }}>
          <p style={{ color:c.textTer, fontSize:13, margin:0 }}>No completed requests yet.</p>
        </div>

        {/* Buyer verification */}
        <div style={{ background:c.card, border:`1px solid ${c.border}`, borderRadius:16, padding:16, marginBottom:8 }}>
          <p style={{ fontWeight:700, fontSize:14, color:c.text, margin:'0 0 4px' }}>Buyer Verification</p>
          <p style={{ fontSize:12, color:c.textSec, margin:'0 0 14px', lineHeight:1.6 }}>
            Every buyer admitted to the Village marketplace will be vetted against these standards before they can request your data.
          </p>
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
        </div>
      </div>
    </div>
  );
}
