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

const CATEGORIES = [
  'GPS Goals',
  'Content Engagement',
  'Location',
  'Wellness Metrics',
  'Financial Behavior',
  'Commerce Behavior',
  'Social Graph',
  'Goal Content Interests',
  'Entertainment',
  'Behavioral Patterns',
  'VLG Patterns',
  'Communication Patterns',
];

export default function Export() {
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';
  const c = isNight ? L.night : L.day;
  const [format, setFormat] = useState<'json'|'csv'|'pdf'>('json');
  const [selected, setSelected] = useState<Set<string>>(new Set(CATEGORIES));
  const [email, setEmail] = useState('');
  const [frequency, setFrequency] = useState<'monthly'|'quarterly'>('monthly');

  function toggleAll() {
    if (selected.size === CATEGORIES.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(CATEGORIES));
    }
  }

  function toggleCat(cat: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  return (
    <div style={{ background:c.bg, minHeight:'100vh', maxWidth:480, margin:'0 auto', paddingBottom:88 }}>
      {/* Top bar */}
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'16px 20px 12px', background:c.card, borderBottom:`1px solid ${c.border}` }}>
        <Link href="/village/locker" style={{ textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'center', width:36, height:36, borderRadius:'50%', border:`1px solid ${c.border}` }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </Link>
        <span style={{ fontWeight:800, fontSize:18, color:c.text, letterSpacing:-0.5 }}>Export Data</span>
      </div>

      {/* Nav */}
      <div style={{ overflowX:'auto', display:'flex', gap:0, background:c.card, borderBottom:`1px solid ${c.border}` }}>
        {NAV_ITEMS.map(item => {
          const active = item.href === '/village/locker/export';
          return (
            <Link key={item.href} href={item.href} style={{ textDecoration:'none', padding:'10px 14px', fontSize:12, fontWeight:active?700:500, color:active?'#1D9E75':c.textSec, borderBottom:active?'2px solid #1D9E75':'2px solid transparent', whiteSpace:'nowrap' }}>
              {item.label}
            </Link>
          );
        })}
      </div>

      <div style={{ padding:'16px 16px 0' }}>
        {/* Portability statement */}
        <div style={{ background:'#04342C', border:'1px solid #1D9E75', borderRadius:16, padding:16, marginBottom:16, display:'flex', gap:12, alignItems:'flex-start' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9FE1CB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0, marginTop:2 }}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
          <div>
            <p style={{ color:'#9FE1CB', fontSize:13, fontWeight:700, margin:'0 0 4px' }}>Your data is portable</p>
            <p style={{ color:'rgba(159,225,203,0.8)', fontSize:12, margin:0, lineHeight:1.6 }}>
              Under GDPR Article 20, you have the right to receive your data in a machine-readable format and transfer it to any service. Village makes this free and instant.
            </p>
          </div>
        </div>

        {/* Download everything */}
        <div style={{ background:c.card, border:`1px solid ${c.border}`, borderRadius:16, padding:18, marginBottom:16 }}>
          <p style={{ fontWeight:700, fontSize:14, color:c.text, margin:'0 0 6px' }}>Download Everything</p>
          <p style={{ fontSize:12, color:c.textSec, margin:'0 0 14px', lineHeight:1.6 }}>
            Complete copy of all data Village holds about you. Includes all 9 sections and all 12 data category signals.
          </p>
          <div style={{ display:'flex', gap:8, marginBottom:14 }}>
            {(['json','csv','pdf'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                style={{ flex:1, padding:'8px 0', borderRadius:8, border:`1px solid ${format===f?'#1D9E75':c.border}`, background:format===f?'#04342C':'transparent', color:format===f?'#9FE1CB':c.textSec, fontSize:12, fontWeight:700, cursor:'pointer', textTransform:'uppercase', letterSpacing:0.5 }}
              >
                {f}
              </button>
            ))}
          </div>
          <button style={{ width:'100%', background:'#1D9E75', border:'none', color:'#fff', borderRadius:10, padding:'12px 0', fontSize:14, fontWeight:700, cursor:'pointer' }}>
            Download everything as {format.toUpperCase()}
          </button>
        </div>

        {/* Selective export */}
        <div style={{ background:c.card, border:`1px solid ${c.border}`, borderRadius:16, padding:18, marginBottom:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <p style={{ fontWeight:700, fontSize:14, color:c.text, margin:0 }}>Selective Export</p>
            <button onClick={toggleAll} style={{ fontSize:12, color:'#1D9E75', fontWeight:700, background:'transparent', border:'none', cursor:'pointer' }}>
              {selected.size === CATEGORIES.length ? 'Deselect all' : 'Select all'}
            </button>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:14 }}>
            {CATEGORIES.map(cat => (
              <label key={cat} style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
                <div
                  onClick={() => toggleCat(cat)}
                  style={{
                    width:20, height:20, borderRadius:5, border:`2px solid ${selected.has(cat)?'#1D9E75':c.border}`,
                    background:selected.has(cat)?'#1D9E75':'transparent',
                    display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, cursor:'pointer',
                  }}
                >
                  {selected.has(cat) && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                  )}
                </div>
                <span style={{ fontSize:13, color:c.text, fontWeight:500 }}>{cat}</span>
              </label>
            ))}
          </div>
          <button
            disabled={selected.size === 0}
            style={{ width:'100%', background:selected.size>0?'#04342C':'transparent', border:`1px solid ${selected.size>0?'#1D9E75':c.border}`, color:selected.size>0?'#9FE1CB':c.textTer, borderRadius:10, padding:'12px 0', fontSize:13, fontWeight:700, cursor:selected.size>0?'pointer':'not-allowed' }}
          >
            {selected.size > 0 ? `Export ${selected.size} categories as ${format.toUpperCase()}` : 'Select at least one category'}
          </button>
        </div>

        {/* Scheduled exports */}
        <div style={{ background:c.card, border:`1px solid ${c.border}`, borderRadius:16, padding:18, marginBottom:8 }}>
          <p style={{ fontWeight:700, fontSize:14, color:c.text, margin:'0 0 6px' }}>Scheduled Exports</p>
          <p style={{ fontSize:12, color:c.textSec, margin:'0 0 14px', lineHeight:1.6 }}>
            Receive an automatic export to your email on a schedule.
          </p>
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:`1px solid ${c.border}`, background:isNight?'#060F0D':'#fff', color:c.text, fontSize:13, marginBottom:10, outline:'none', boxSizing:'border-box' }}
          />
          <div style={{ display:'flex', gap:8, marginBottom:14 }}>
            {(['monthly','quarterly'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFrequency(f)}
                style={{ flex:1, padding:'9px 0', borderRadius:9, border:`1px solid ${frequency===f?'#1D9E75':c.border}`, background:frequency===f?'#04342C':'transparent', color:frequency===f?'#9FE1CB':c.textSec, fontSize:12, fontWeight:frequency===f?700:500, cursor:'pointer', textTransform:'capitalize' }}
              >
                {f}
              </button>
            ))}
          </div>
          <button
            disabled={!email}
            style={{ width:'100%', background:email?'#1D9E75':'transparent', border:`1px solid ${email?'#1D9E75':c.border}`, color:email?'#fff':c.textTer, borderRadius:10, padding:'11px 0', fontSize:13, fontWeight:700, cursor:email?'pointer':'not-allowed' }}
          >
            {email ? `Schedule ${frequency} exports` : 'Enter email to schedule'}
          </button>
        </div>
      </div>
    </div>
  );
}
