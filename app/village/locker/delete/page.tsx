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
  { id:'gps',     name:'GPS Goals',             impact:'Goal tracking and progress history will be lost. Sprint streaks reset.' },
  { id:'content', name:'Content Engagement',    impact:'Content recommendations reset to generic. DreamLine loses personalization.' },
  { id:'location',name:'Location',              impact:'Location-based features and regional recommendations disabled.' },
  { id:'wellness',name:'Wellness Metrics',      impact:'Wellness progress tracking erased. Health history removed.' },
  { id:'finance', name:'Financial Behavior',    impact:'Spending insights and financial patterns deleted from Village.' },
  { id:'commerce',name:'Commerce Behavior',     impact:'Shopping history and preferences removed from Trading Post.' },
  { id:'social',  name:'Social Graph',          impact:'Connection analytics and social recommendations will reset.' },
  { id:'goalcont',name:'Goal Content Interests',impact:'Skill Stream loses all personalization. Learning history removed.' },
  { id:'entertain',name:'Entertainment',        impact:'Pavilion recommendations reset. Watch history deleted.' },
  { id:'behavior',name:'Behavioral Patterns',   impact:'App usage patterns deleted. Spirit personalization reduced.' },
  { id:'vlg',     name:'VLG Patterns',          impact:'VLG earning history and patterns removed from your profile.' },
  { id:'comms',   name:'Communication Patterns',impact:'Messaging behavior analytics deleted. Cannot be recovered.' },
];

const SCENARIOS = [
  {
    title:'Delete GPS Goals data only',
    desc:'Your goal categories and sprint patterns are deleted within 30 days. Your actual Workshop goals and content remain — only the anonymized signals Village used commercially are removed. You can still use Workshop normally.',
    icon:'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
  },
  {
    title:'Delete content engagement data',
    desc:'Your content interaction signals are deleted within 30 days. This affects DreamLine and Pavilion recommendations — they will temporarily reset to generic content until new signals build up. Your actual posts and content are not deleted.',
    icon:'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z',
  },
  {
    title:'Delete all data and close account',
    desc:'All Village data about you is permanently deleted within 30 days. Your account closes. A GDPR Article 17 reference number is issued. Note: Achievement Credentials minted on-chain are permanent (anonymized, not linked to your identity) and cannot be deleted — this is the nature of blockchain records.',
    icon:'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 7a4 4 0 100 8 4 4 0 000-8z',
  },
];

export default function Delete() {
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';
  const c = isNight ? L.night : L.day;
  const [deleteModal, setDeleteModal] = useState<string | null>(null);
  const [confirmHandle, setConfirmHandle] = useState('');
  const [deleteAllModal, setDeleteAllModal] = useState(false);
  const [allConfirmHandle, setAllConfirmHandle] = useState('');
  const MOCK_HANDLE = '@yourhandle';

  function handleCatDelete(id: string) {
    setDeleteModal(null);
    // In production: trigger deletion API
  }

  return (
    <div style={{ background:c.bg, minHeight:'100vh', maxWidth:480, margin:'0 auto', paddingBottom:88 }}>
      {/* Top bar */}
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'16px 20px 12px', background:c.card, borderBottom:`1px solid ${c.border}` }}>
        <Link href="/village/locker" style={{ textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'center', width:36, height:36, borderRadius:'50%', border:`1px solid ${c.border}` }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </Link>
        <span style={{ fontWeight:800, fontSize:18, color:c.text, letterSpacing:-0.5 }}>Delete Data</span>
      </div>

      {/* Nav */}
      <div style={{ overflowX:'auto', display:'flex', gap:0, background:c.card, borderBottom:`1px solid ${c.border}` }}>
        {NAV_ITEMS.map(item => {
          const active = item.href === '/village/locker/delete';
          return (
            <Link key={item.href} href={item.href} style={{ textDecoration:'none', padding:'10px 14px', fontSize:12, fontWeight:active?700:500, color:active?'#1D9E75':c.textSec, borderBottom:active?'2px solid #1D9E75':'2px solid transparent', whiteSpace:'nowrap' }}>
              {item.label}
            </Link>
          );
        })}
      </div>

      <div style={{ padding:'16px 16px 0' }}>
        {/* GDPR note */}
        <div style={{ background:isNight?'#0A1810':'#F0FAF6', border:`1px solid ${c.border}`, borderRadius:14, padding:14, marginBottom:16, display:'flex', gap:10, alignItems:'flex-start' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0, marginTop:2 }}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
          <p style={{ fontSize:12, color:c.textSec, margin:0, lineHeight:1.6 }}>
            Deletion requests are processed within 30 days under GDPR Article 17. A reference number is issued for each request.
          </p>
        </div>

        {/* Category deletion cards */}
        <p style={{ fontWeight:700, fontSize:14, color:c.text, margin:'0 0 12px' }}>Delete a Specific Category</p>
        {CATEGORIES.map(cat => (
          <div key={cat.id} style={{ background:c.card, border:`1px solid ${c.border}`, borderRadius:14, padding:14, marginBottom:10 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10 }}>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:13, fontWeight:700, color:c.text, margin:'0 0 4px' }}>{cat.name}</p>
                <p style={{ fontSize:11, color:c.textSec, margin:0, lineHeight:1.5 }}>{cat.impact}</p>
              </div>
              <button
                onClick={() => { setDeleteModal(cat.id); setConfirmHandle(''); }}
                style={{ background:'transparent', border:'1px solid #CC3333', color:'#CC3333', borderRadius:8, padding:'6px 12px', fontSize:11, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0 }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {/* What deletion means */}
        <p style={{ fontWeight:700, fontSize:14, color:c.text, margin:'16px 0 12px' }}>What Deletion Means</p>
        <div style={{ background:c.card, border:`1px solid ${c.border}`, borderRadius:16, padding:16, marginBottom:16 }}>
          {SCENARIOS.map((s, i) => (
            <div key={i} style={{ marginBottom:i < SCENARIOS.length - 1 ? 16 : 0, paddingBottom:i < SCENARIOS.length - 1 ? 16 : 0, borderBottom:i < SCENARIOS.length - 1 ? `1px solid ${c.border}` : 'none' }}>
              <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                <div style={{ width:32, height:32, borderRadius:10, background:isNight?'#0F2820':'#E8F5F0', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={s.icon}/></svg>
                </div>
                <div>
                  <p style={{ fontSize:13, fontWeight:700, color:c.text, margin:'0 0 4px' }}>{s.title}</p>
                  <p style={{ fontSize:12, color:c.textSec, margin:0, lineHeight:1.6 }}>{s.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Blockchain note */}
        <div style={{ background:isNight?'#1A1206':'#FFFBF0', border:'1px solid #EF9F27', borderRadius:14, padding:14, marginBottom:16, display:'flex', gap:10, alignItems:'flex-start' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF9F27" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0, marginTop:2 }}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/></svg>
          <p style={{ fontSize:12, color:isNight?'#FAC775':'#7A5000', margin:0, lineHeight:1.6 }}>
            <strong>Blockchain Achievement Credentials are permanent</strong> but anonymized. They cannot be linked to your identity after account deletion. This is the nature of on-chain records.
          </p>
        </div>

        {/* Delete all data */}
        <div style={{ border:'2px solid #CC3333', borderRadius:16, padding:18, marginBottom:8 }}>
          <div style={{ display:'flex', gap:10, alignItems:'flex-start', marginBottom:12 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#CC3333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0, marginTop:2 }}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
            <div>
              <p style={{ fontSize:14, fontWeight:800, color:'#CC3333', margin:'0 0 4px' }}>Delete All Data and Close Account</p>
              <p style={{ fontSize:12, color:c.textSec, margin:0, lineHeight:1.6 }}>
                This permanently deletes all data Village holds about you and closes your account. This cannot be undone. A GDPR Article 17 reference number will be issued.
              </p>
            </div>
          </div>
          <button
            onClick={() => { setDeleteAllModal(true); setAllConfirmHandle(''); }}
            style={{ width:'100%', background:'transparent', border:'1px solid #CC3333', color:'#CC3333', borderRadius:10, padding:'12px 0', fontSize:13, fontWeight:700, cursor:'pointer' }}
          >
            Delete everything and close account
          </button>
        </div>
      </div>

      {/* Category delete modal */}
      {deleteModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:100 }}>
          <div style={{ background:isNight?'#0C1A17':'#fff', borderRadius:'20px 20px 0 0', padding:24, width:'100%', maxWidth:480 }}>
            <p style={{ fontWeight:800, fontSize:16, color:c.text, margin:'0 0 10px' }}>
              Delete {CATEGORIES.find(cat => cat.id === deleteModal)?.name}?
            </p>
            <p style={{ fontSize:13, color:c.textSec, margin:'0 0 16px', lineHeight:1.6 }}>
              {CATEGORIES.find(cat => cat.id === deleteModal)?.impact} This takes up to 30 days and cannot be undone.
            </p>
            <p style={{ fontSize:12, color:c.textSec, margin:'0 0 8px' }}>Type your @handle to confirm:</p>
            <input
              type="text"
              placeholder={MOCK_HANDLE}
              value={confirmHandle}
              onChange={e => setConfirmHandle(e.target.value)}
              style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:`1px solid ${c.border}`, background:isNight?'#060F0D':'#fff', color:c.text, fontSize:13, marginBottom:14, outline:'none', boxSizing:'border-box' }}
            />
            <div style={{ display:'flex', gap:10 }}>
              <button
                onClick={() => handleCatDelete(deleteModal)}
                disabled={confirmHandle !== MOCK_HANDLE}
                style={{ flex:2, background:confirmHandle===MOCK_HANDLE?'#CC3333':'transparent', border:'1px solid #CC3333', color:confirmHandle===MOCK_HANDLE?'#fff':'#CC3333', borderRadius:10, padding:'12px 0', fontSize:14, fontWeight:700, cursor:confirmHandle===MOCK_HANDLE?'pointer':'not-allowed', opacity:confirmHandle===MOCK_HANDLE?1:0.5 }}
              >
                Confirm deletion
              </button>
              <button onClick={() => setDeleteModal(null)} style={{ flex:1, background:'transparent', border:`1px solid ${c.border}`, color:c.textSec, borderRadius:10, padding:'12px 0', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete all modal */}
      {deleteAllModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:100 }}>
          <div style={{ background:isNight?'#0C1A17':'#fff', borderRadius:'20px 20px 0 0', padding:24, width:'100%', maxWidth:480 }}>
            <p style={{ fontWeight:800, fontSize:16, color:'#CC3333', margin:'0 0 10px' }}>Delete all data and close account?</p>
            <p style={{ fontSize:13, color:c.textSec, margin:'0 0 6px', lineHeight:1.6 }}>
              This permanently deletes everything Village holds about you and closes your account. There is no undo.
            </p>
            <p style={{ fontSize:12, color:c.textSec, margin:'0 0 8px' }}>Type your @handle to confirm:</p>
            <input
              type="text"
              placeholder={MOCK_HANDLE}
              value={allConfirmHandle}
              onChange={e => setAllConfirmHandle(e.target.value)}
              style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:'1px solid #CC3333', background:isNight?'#060F0D':'#fff', color:c.text, fontSize:13, marginBottom:14, outline:'none', boxSizing:'border-box' }}
            />
            <div style={{ display:'flex', gap:10 }}>
              <button
                disabled={allConfirmHandle !== MOCK_HANDLE}
                style={{ flex:2, background:allConfirmHandle===MOCK_HANDLE?'#CC3333':'transparent', border:'1px solid #CC3333', color:allConfirmHandle===MOCK_HANDLE?'#fff':'#CC3333', borderRadius:10, padding:'12px 0', fontSize:14, fontWeight:700, cursor:allConfirmHandle===MOCK_HANDLE?'pointer':'not-allowed', opacity:allConfirmHandle===MOCK_HANDLE?1:0.5 }}
              >
                Delete everything
              </button>
              <button onClick={() => setDeleteAllModal(false)} style={{ flex:1, background:'transparent', border:`1px solid ${c.border}`, color:c.textSec, borderRadius:10, padding:'12px 0', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
