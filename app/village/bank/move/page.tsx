'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { BankBottomNav } from '@/components/bank/BankBottomNav';

const B = {
  day:   { bg:'#F2F7FA', card:'#FFFFFF', border:'#C8DCE8', text:'#0A1F2E', textSec:'#3A5A6E', textTer:'#7A9AAE', action:'#0A5F8A' },
  night: { bg:'#060F18', card:'#0E1E2E', border:'#1A3040', text:'#EEF4F8', textSec:'#8EB4CC', textTer:'#4A7A96', action:'#2A9FCC' },
};

export default function MovePage() {
  const { theme } = useVillageTheme();
  const c = theme === 'night' ? B.night : B.day;
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [speed, setSpeed] = useState<'standard'|'instant'>('standard');
  const [step, setStep] = useState<'recipient'|'amount'|'review'|'done'>('recipient');
  const [recipientProfile, setRecipientProfile] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [txResult, setTxResult] = useState<any>(null);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    fetch('/api/bank/accounts').then(r => r.json()).then(d => {
      const primary = (d.accounts ?? []).find((a: any) => a.is_primary);
      setBalance(primary?.balance ?? 0);
    }).catch(() => {});
  }, []);

  async function searchRecipient() {
    if (!recipient.trim()) return;
    setSearching(true); setError('');
    try {
      const r = await fetch(`/api/check-username?handle=${encodeURIComponent(recipient.replace('@',''))}`);
      if (!r.ok) throw new Error('Network error');
      // Username exists if available=false (means it's taken = user exists)
      const data = await r.json();
      if (data.available === false && !data.error) {
        // Search profiles
        const res = await fetch(`/api/discover/search?q=${encodeURIComponent(recipient.replace('@',''))}`);
        const sd = await res.json();
        const user = sd.results?.find((x: any) => x.type === 'user');
        if (user) { setRecipientProfile({ username: user.title, display_name: user.title }); setStep('amount'); }
        else setError('User not found.');
      } else {
        setError('User not found. Check the username and try again.');
      }
    } catch { setError('Could not search. Try again.'); }
    setSearching(false);
  }

  async function send() {
    setSending(true); setError('');
    try {
      const res = await fetch('/api/bank/transfer', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to_username: recipientProfile.username, amount: parseFloat(amount), note, speed }),
      });
      const data = await res.json();
      if (res.ok) { setTxResult(data); setStep('done'); }
      else setError(data.error ?? 'Transfer failed');
    } catch { setError('Transfer failed. Try again.'); }
    setSending(false);
  }

  function fmt(n: number) { return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n); }

  return (
    <div style={{ minHeight:'100vh', background:c.bg, paddingBottom:80 }}>
      <div style={{ position:'sticky', top:0, zIndex:20, display:'flex', alignItems:'center', padding:'14px 16px', background:c.card, borderBottom:`1px solid ${c.border}` }}>
        <Link href="/village/bank" style={{ display:'flex', alignItems:'center', gap:4, color:c.action, fontWeight:800, fontSize:14, textDecoration:'none' }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg> Bank
        </Link>
        <p style={{ flex:1, textAlign:'center', fontSize:17, fontWeight:900, color:c.text }}>Send Money</p>
        <div style={{ width:60 }}/>
      </div>

      <div style={{ background:'#EAF3DE', borderBottom:'1px solid #639922', padding:'10px 16px', display:'flex', gap:8 }}>
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#27500A" strokeWidth={2} strokeLinecap="round" style={{ flexShrink:0, marginTop:1 }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        <p style={{ fontSize:11, color:'#27500A', margin:0 }}>Transfers powered by Village Bank · FDIC insured · All 50 states</p>
      </div>

      <div style={{ padding:'20px 16px' }}>
        {step === 'done' && txResult ? (
          <div style={{ textAlign:'center', padding:'40px 0' }}>
            <div style={{ width:80, height:80, borderRadius:40, background:'#E1F5EE', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
              <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth={2.5} strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <p style={{ fontSize:22, fontWeight:900, color:c.text, marginBottom:4 }}>Money sent!</p>
            <p style={{ fontSize:14, color:c.textSec, marginBottom:4 }}>{fmt(parseFloat(amount))} sent to @{recipientProfile?.username}</p>
            <p style={{ fontSize:11, color:c.textTer, marginBottom:24 }}>{txResult.status === 'posted' ? 'Delivered instantly' : 'Processing (1-3 business days)'}</p>
            <Link href="/village/bank" style={{ display:'inline-block', background:c.action, color:'#fff', borderRadius:14, padding:'12px 32px', fontSize:14, fontWeight:900, textDecoration:'none' }}>Back to Bank</Link>
          </div>
        ) : step === 'recipient' ? (
          <>
            <p style={{ fontSize:14, fontWeight:700, color:c.text, marginBottom:14 }}>Who are you sending to?</p>
            <div style={{ display:'flex', gap:8, marginBottom:8 }}>
              <input value={recipient} onChange={e=>setRecipient(e.target.value)} placeholder="@username" onKeyDown={e=>e.key==='Enter'&&searchRecipient()}
                style={{ flex:1, background:c.card, border:`1px solid ${c.border}`, borderRadius:12, padding:'12px 14px', fontSize:14, color:c.text, outline:'none' }} />
              <button onClick={searchRecipient} disabled={searching||!recipient.trim()} style={{ background:c.action, color:'#fff', border:'none', borderRadius:12, padding:'12px 20px', fontSize:14, fontWeight:900, cursor:'pointer', opacity:searching||!recipient.trim()?0.5:1 }}>
                {searching?'…':'Find'}
              </button>
            </div>
            {error&&<p style={{ fontSize:12, color:'#D63B3B' }}>{error}</p>}
          </>
        ) : step === 'amount' ? (
          <>
            <div style={{ display:'flex', alignItems:'center', gap:10, background:c.card, border:`1px solid ${c.border}`, borderRadius:14, padding:14, marginBottom:16 }}>
              <div style={{ width:44, height:44, borderRadius:22, background:c.action, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:900, fontSize:18 }}>{(recipientProfile?.display_name??recipientProfile?.username??'U').slice(0,1).toUpperCase()}</div>
              <div><p style={{ fontSize:14, fontWeight:700, color:c.text, margin:0 }}>{recipientProfile?.display_name??recipientProfile?.username}</p><p style={{ fontSize:12, color:c.textTer, margin:0 }}>@{recipientProfile?.username}</p></div>
            </div>
            <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00" style={{ width:'100%', background:c.card, border:`1px solid ${c.border}`, borderRadius:12, padding:'14px', fontSize:28, fontWeight:700, color:c.text, outline:'none', boxSizing:'border-box', marginBottom:8 }} />
            <p style={{ fontSize:11, color:c.textTer, marginBottom:14 }}>Available: {fmt(balance)}</p>
            <input value={note} onChange={e=>setNote(e.target.value)} placeholder="What's this for? (optional)" style={{ width:'100%', background:c.card, border:`1px solid ${c.border}`, borderRadius:12, padding:'12px', fontSize:13, color:c.text, outline:'none', boxSizing:'border-box', marginBottom:14 }} />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
              {(['standard','instant'] as const).map(s=>(
                <button key={s} onClick={()=>setSpeed(s)} style={{ padding:'12px', borderRadius:12, border:`2px solid ${speed===s?c.action:c.border}`, background:speed===s?`${c.action}15`:c.card, cursor:'pointer' }}>
                  <p style={{ fontSize:13, fontWeight:800, color:speed===s?c.action:c.text, margin:'0 0 2px' }}>{s==='standard'?'Standard':'Instant'}</p>
                  <p style={{ fontSize:11, color:c.textTer, margin:0 }}>{s==='standard'?'Free · 1-3 days':'$0.25 · Seconds'}</p>
                </button>
              ))}
            </div>
            {error&&<p style={{ fontSize:12, color:'#D63B3B', marginBottom:10 }}>{error}</p>}
            <button onClick={()=>parseFloat(amount)>0&&setStep('review')} disabled={!amount||parseFloat(amount)<=0} style={{ width:'100%', background:c.action, color:'#fff', border:'none', borderRadius:14, padding:'14px', fontSize:15, fontWeight:900, cursor:'pointer', opacity:!amount||parseFloat(amount)<=0?0.5:1 }}>Review →</button>
          </>
        ) : (
          <>
            <div style={{ background:c.card, border:`1px solid ${c.border}`, borderRadius:14, padding:16, marginBottom:16 }}>
              {[['To',`@${recipientProfile?.username}`],['Amount',fmt(parseFloat(amount||'0'))],['Fee',speed==='instant'?'$0.25':'Free'],['Total',fmt(parseFloat(amount||'0')+(speed==='instant'?0.25:0))],['Note',note||'—']].map(([k,v])=>(
                <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', borderBottom:`1px solid ${c.border}` }}>
                  <span style={{ fontSize:13, color:c.textSec }}>{k}</span><span style={{ fontSize:13, fontWeight:700, color:c.text }}>{v}</span>
                </div>
              ))}
            </div>
            {error&&<p style={{ fontSize:12, color:'#D63B3B', marginBottom:10 }}>{error}</p>}
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={()=>setStep('amount')} style={{ flex:1, padding:'14px', border:`1px solid ${c.border}`, borderRadius:14, background:'transparent', color:c.textSec, fontSize:14, fontWeight:700, cursor:'pointer' }}>Edit</button>
              <button onClick={send} disabled={sending} style={{ flex:2, background:c.action, color:'#fff', border:'none', borderRadius:14, padding:'14px', fontSize:15, fontWeight:900, cursor:'pointer', opacity:sending?0.6:1 }}>{sending?'Sending…':'Confirm & Send'}</button>
            </div>
          </>
        )}
      </div>
      <BankBottomNav active="/village/bank/move" />
    </div>
  );
}
