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

type AuditEntry = {
  id: string;
  accessor: string;
  accessorType: 'platform' | 'buyer';
  categories: string[];
  purpose: string;
  legalBasis: string;
  date: string;
  time: string;
};

const AUDIT_LOG: AuditEntry[] = [
  {
    id:'a1',
    accessor:'Village content recommendation algorithm',
    accessorType:'platform',
    categories:['Goal Content Interests'],
    purpose:'Personalize Workshop feed and Skill Stream recommendations',
    legalBasis:'Platform operation',
    date:'Jun 3, 2026',
    time:'09:14 AM',
  },
  {
    id:'a2',
    accessor:'Spirit AI personalization engine',
    accessorType:'platform',
    categories:['Behavioral Patterns'],
    purpose:'Personalize DreamLine content order and timing',
    legalBasis:'Platform operation',
    date:'Jun 2, 2026',
    time:'07:42 PM',
  },
  {
    id:'a3',
    accessor:'Approved buyer: productivity software company',
    accessorType:'buyer',
    categories:['GPS Goals', 'Content Engagement'],
    purpose:'Monthly behavioral dataset for UX research',
    legalBasis:'User consent (Jun 1, 2026)',
    date:'Jun 1, 2026',
    time:'11:59 PM',
  },
  {
    id:'a4',
    accessor:'Village advertising system',
    accessorType:'platform',
    categories:['Commerce Behavior'],
    purpose:'Serve targeted advertisements in Trading Post',
    legalBasis:'User consent (May 28, 2026)',
    date:'May 28, 2026',
    time:'03:22 PM',
  },
  {
    id:'a5',
    accessor:'Spirit AI',
    accessorType:'platform',
    categories:['Goal Content Interests'],
    purpose:'Personalize Skill Stream content recommendations',
    legalBasis:'Platform operation',
    date:'May 25, 2026',
    time:'10:08 AM',
  },
];

export default function AuditLog() {
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';
  const c = isNight ? L.night : L.day;
  const [typeFilter, setTypeFilter] = useState<'all'|'platform'|'buyer'>('all');
  const [catFilter, setCatFilter] = useState('all');

  const allCats = ['all', ...Array.from(new Set(AUDIT_LOG.flatMap(e => e.categories)))];
  const filtered = AUDIT_LOG.filter(e => {
    if (typeFilter !== 'all' && e.accessorType !== typeFilter) return false;
    if (catFilter !== 'all' && !e.categories.includes(catFilter)) return false;
    return true;
  });

  return (
    <div style={{ background:c.bg, minHeight:'100vh', maxWidth:480, margin:'0 auto', paddingBottom:88 }}>
      {/* Top bar */}
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'16px 20px 12px', background:c.card, borderBottom:`1px solid ${c.border}` }}>
        <Link href="/village/locker" style={{ textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'center', width:36, height:36, borderRadius:'50%', border:`1px solid ${c.border}` }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </Link>
        <span style={{ fontWeight:800, fontSize:18, color:c.text, letterSpacing:-0.5 }}>Audit Log</span>
      </div>

      {/* Nav */}
      <div style={{ overflowX:'auto', display:'flex', gap:0, background:c.card, borderBottom:`1px solid ${c.border}` }}>
        {NAV_ITEMS.map(item => {
          const active = item.href === '/village/locker/audit';
          return (
            <Link key={item.href} href={item.href} style={{ textDecoration:'none', padding:'10px 14px', fontSize:12, fontWeight:active?700:500, color:active?'#1D9E75':c.textSec, borderBottom:active?'2px solid #1D9E75':'2px solid transparent', whiteSpace:'nowrap' }}>
              {item.label}
            </Link>
          );
        })}
      </div>

      <div style={{ padding:'16px 16px 0' }}>
        {/* All clear banner */}
        <div style={{ background:'#04342C', border:`1px solid #1D9E75`, borderRadius:16, padding:16, marginBottom:16, display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:40, height:40, borderRadius:'50%', background:'rgba(29,158,117,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9FE1CB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
          </div>
          <div>
            <p style={{ color:'#9FE1CB', fontSize:14, fontWeight:800, margin:'0 0 2px' }}>0 unauthorized accesses — ever</p>
            <p style={{ color:'rgba(159,225,203,0.7)', fontSize:12, margin:0, lineHeight:1.5 }}>
              Every access below was either platform operation or your explicit consent. Nothing else.
            </p>
          </div>
        </div>

        {/* Filter controls */}
        <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
          {(['all','platform','buyer'] as const).map(f => (
            <button
              key={f}
              onClick={() => setTypeFilter(f)}
              style={{ padding:'6px 14px', borderRadius:20, border:`1px solid ${typeFilter===f?'#1D9E75':c.border}`, background:typeFilter===f?'#04342C':'transparent', color:typeFilter===f?'#9FE1CB':c.textSec, fontSize:12, fontWeight:typeFilter===f?700:500, cursor:'pointer', textTransform:'capitalize' }}
            >
              {f === 'all' ? 'All accesses' : f === 'platform' ? 'Platform only' : 'Buyers only'}
            </button>
          ))}
        </div>

        <div style={{ overflowX:'auto', marginBottom:16 }}>
          <div style={{ display:'flex', gap:6 }}>
            {allCats.map(cat => (
              <button
                key={cat}
                onClick={() => setCatFilter(cat)}
                style={{ padding:'5px 12px', borderRadius:20, border:`1px solid ${catFilter===cat?'#EF9F27':c.border}`, background:catFilter===cat?'#412402':'transparent', color:catFilter===cat?'#FAC775':c.textTer, fontSize:11, fontWeight:catFilter===cat?700:500, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0 }}
              >
                {cat === 'all' ? 'All categories' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Audit entries */}
        {filtered.map((entry, i) => (
          <div key={entry.id} style={{ background:c.card, border:`1px solid ${c.border}`, borderRadius:14, padding:16, marginBottom:10 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:13, fontWeight:700, color:c.text, margin:'0 0 2px' }}>{entry.accessor}</p>
                <p style={{ fontSize:11, color:c.textTer, margin:0 }}>{entry.date} at {entry.time}</p>
              </div>
              <span style={{
                fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:20, marginLeft:8, whiteSpace:'nowrap',
                background:entry.accessorType==='buyer'?'#412402':'#04342C',
                border:`1px solid ${entry.accessorType==='buyer'?'#EF9F27':'#1D9E75'}`,
                color:entry.accessorType==='buyer'?'#FAC775':'#9FE1CB',
              }}>
                {entry.accessorType==='buyer'?'Buyer access':'Platform'}
              </span>
            </div>

            <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:8 }}>
              {entry.categories.map(cat => (
                <span key={cat} style={{ background:isNight?'#0F2820':'#E8F5F0', border:`1px solid ${c.border}`, borderRadius:20, padding:'2px 8px', fontSize:11, color:c.textSec, fontWeight:600 }}>
                  {cat}
                </span>
              ))}
            </div>

            <p style={{ fontSize:12, color:c.textSec, margin:'0 0 6px', lineHeight:1.5 }}>
              <strong style={{ color:c.text }}>Purpose:</strong> {entry.purpose}
            </p>
            <p style={{ fontSize:11, color:c.textTer, margin:0 }}>
              <strong>Legal basis:</strong> {entry.legalBasis}
            </p>
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{ background:c.card, border:`1px solid ${c.border}`, borderRadius:14, padding:24, textAlign:'center' }}>
            <p style={{ color:c.textTer, fontSize:13, margin:0 }}>No entries match your filters.</p>
          </div>
        )}

        {/* Export button */}
        <button style={{ width:'100%', background:'transparent', border:`1px solid ${c.border}`, color:'#1D9E75', borderRadius:12, padding:'12px 0', fontSize:13, fontWeight:700, cursor:'pointer', marginTop:4, marginBottom:16 }}>
          Export audit log as PDF
        </button>

        {/* Statement */}
        <div style={{ background:isNight?'#0A1810':'#F0FAF6', border:`1px solid ${c.border}`, borderRadius:14, padding:16, marginBottom:8 }}>
          <p style={{ fontSize:12, color:c.textSec, margin:0, lineHeight:1.8, fontStyle:'italic' }}>
            "If you locked a category, this log stays empty for that category forever. That is the evidence our practices match our promises."
          </p>
        </div>
      </div>
    </div>
  );
}
