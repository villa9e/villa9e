'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { BankBottomNav } from '@/components/bank/BankBottomNav';

const B = {
  day:   { bg:'#F2F7FA', card:'#FFFFFF', border:'#C8DCE8', text:'#0A1F2E', textSec:'#3A5A6E', textTer:'#7A9AAE', action:'#0A5F8A' },
  night: { bg:'#060F18', card:'#0E1E2E', border:'#1A3040', text:'#EEF4F8', textSec:'#8EB4CC', textTer:'#4A7A96', action:'#2A9FCC' },
};

const CONTACTS = [
  { name:'Nia J.',    initials:'NJ', handle:'@niaj' },
  { name:'Marcus T.', initials:'MT', handle:'@marcust' },
  { name:'Deja R.',   initials:'DR', handle:'@dejar' },
];

const CURRENCIES = ['USD','BTC','ETH','MATIC'];

export default function MovePage() {
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';
  const c = isNight ? B.night : B.day;
  const [amount, setAmount] = useState('0');
  const [currency, setCurrency] = useState('USD');
  const [speed, setSpeed] = useState<'standard'|'instant'>('standard');
  const [step, setStep] = useState<'entry'|'review'>('entry');
  const [recipient, setRecipient] = useState('');

  function handleNum(n: string) {
    setAmount(prev => {
      if (n === '.' && prev.includes('.')) return prev;
      if (prev === '0' && n !== '.') return n;
      return prev + n;
    });
  }
  function handleDel() {
    setAmount(prev => prev.length <= 1 ? '0' : prev.slice(0, -1));
  }

  const keys = ['1','2','3','4','5','6','7','8','9','.','0','DEL'];

  if (step === 'review') {
    return (
      <div style={{ background:c.bg, minHeight:'100vh', maxWidth:480, margin:'0 auto', paddingBottom:88 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'16px 20px 12px', background:c.card, borderBottom:`1px solid ${c.border}` }}>
          <button onClick={()=>setStep('entry')} style={{ background:'none', border:'none', cursor:'pointer', color:c.action, padding:0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <span style={{ fontWeight:800, fontSize:17, color:c.text }}>Review Transfer</span>
        </div>
        <div style={{ padding:16 }}>
          <div style={{ background:c.card, border:`1px solid ${c.border}`, borderRadius:16, padding:20, marginBottom:16 }}>
            <div style={{ textAlign:'center', marginBottom:20 }}>
              <p style={{ fontSize:13, color:c.textTer, marginBottom:4 }}>Sending</p>
              <p style={{ fontSize:36, fontWeight:800, color:c.text, letterSpacing:-1 }}>{currency === 'USD' ? '$' : ''}{amount} <span style={{ fontSize:18, color:c.textSec }}>{currency}</span></p>
            </div>
            {[
              { label:'To',      value:recipient || '@recipient' },
              { label:'Speed',   value:speed === 'standard' ? 'Standard ACH (1-3 days)' : 'Instant RTP (seconds)' },
              { label:'Fee',     value:speed === 'standard' ? 'Free' : '$0.25' },
              { label:'From',    value:'Village Checking ···8240' },
              { label:'Arrives', value:speed === 'standard' ? '2-3 business days' : 'Within seconds' },
            ].map(row=>(
              <div key={row.label} style={{ display:'flex', justifyContent:'space-between', paddingTop:12, paddingBottom:12, borderTop:`1px solid ${c.border}` }}>
                <span style={{ fontSize:13, color:c.textSec }}>{row.label}</span>
                <span style={{ fontSize:13, fontWeight:600, color:c.text }}>{row.value}</span>
              </div>
            ))}
          </div>
          <button style={{ width:'100%', background:c.action, color:'#fff', border:'none', borderRadius:14, padding:'16px', fontSize:15, fontWeight:700, cursor:'pointer', marginBottom:12 }}>
            Confirm Send
          </button>
          <p style={{ fontSize:11, color:c.textTer, textAlign:'center', lineHeight:1.5 }}>
            By confirming you agree to Village Bank transfer terms. ACH transfers are processed by Unit Financial Inc.
          </p>
        </div>
        <BankBottomNav active="/village/bank/move"/>
      </div>
    );
  }

  return (
    <div style={{ background:c.bg, minHeight:'100vh', maxWidth:480, margin:'0 auto', paddingBottom:88 }}>
      {/* Top bar */}
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'16px 20px 12px', background:c.card, borderBottom:`1px solid ${c.border}` }}>
        <Link href="/village/bank" style={{ color:c.action, lineHeight:0 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </Link>
        <span style={{ fontWeight:800, fontSize:17, color:c.text }}>Send Money</span>
      </div>

      <div style={{ padding:16 }}>
        {/* Compliance banner */}
        <div style={{ background:'#EAF3DE', border:'1px solid #639922', borderRadius:12, padding:'10px 14px', marginBottom:16, display:'flex', alignItems:'flex-start', gap:8 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#27500A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop:1, flexShrink:0 }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <p style={{ fontSize:11, color:'#27500A', margin:0, lineHeight:1.5 }}>
            <strong>FDIC insured</strong> up to $250,000 · ACH via Unit Financial (FinCEN registered MSB) · RTP instant payments compliant
          </p>
        </div>

        {/* Recipient search */}
        <div style={{ position:'relative', marginBottom:16 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c.textTer} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)' }}><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input
            value={recipient}
            onChange={e=>setRecipient(e.target.value)}
            placeholder="Search name, @handle, phone, or routing #"
            style={{ width:'100%', boxSizing:'border-box', paddingLeft:36, paddingRight:12, paddingTop:12, paddingBottom:12, borderRadius:12, border:`1px solid ${c.border}`, background:c.card, color:c.text, fontSize:13, outline:'none' }}
          />
        </div>

        {/* Recent contacts */}
        <p style={{ fontSize:12, color:c.textTer, fontWeight:600, marginBottom:10 }}>Recent</p>
        <div style={{ display:'flex', gap:16, marginBottom:20, overflowX:'auto', paddingBottom:4 }}>
          {CONTACTS.map(co=>(
            <button key={co.name} onClick={()=>setRecipient(co.handle)} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5, background:'none', border:'none', cursor:'pointer', flexShrink:0 }}>
              <div style={{ width:48, height:48, borderRadius:'50%', background:c.action, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:14 }}>{co.initials}</div>
              <span style={{ fontSize:11, color:c.text, fontWeight:600 }}>{co.name}</span>
              <span style={{ fontSize:10, color:c.textTer }}>{co.handle}</span>
            </button>
          ))}
        </div>

        {/* Amount display */}
        <div style={{ background:c.card, border:`1px solid ${c.border}`, borderRadius:16, padding:'20px 16px', marginBottom:16, textAlign:'center' }}>
          <p style={{ fontSize:44, fontWeight:800, color:c.text, letterSpacing:-1, margin:'0 0 4px' }}>
            {currency === 'USD' ? '$' : ''}{amount}
            <span style={{ fontSize:20, color:c.textSec, marginLeft:4 }}>{currency !== 'USD' ? currency : ''}</span>
          </p>
          {/* Currency toggle */}
          <div style={{ display:'flex', gap:6, justifyContent:'center', marginTop:8 }}>
            {CURRENCIES.map(cur=>(
              <button key={cur} onClick={()=>setCurrency(cur)} style={{ padding:'4px 10px', borderRadius:20, border:`1px solid ${currency===cur?c.action:c.border}`, background:currency===cur?c.action:'transparent', color:currency===cur?'#fff':c.textSec, fontSize:11, fontWeight:700, cursor:'pointer' }}>
                {cur}
              </button>
            ))}
          </div>
        </div>

        {/* Numpad */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
          {keys.map(k=>(
            <button key={k} onClick={()=>k==='DEL'?handleDel():handleNum(k)}
              style={{ padding:'16px 0', borderRadius:14, border:`1px solid ${c.border}`, background:c.card, color:k==='DEL'?c.action:c.text, fontSize:k==='DEL'?13:20, fontWeight:k==='DEL'?700:500, cursor:'pointer' }}>
              {k === 'DEL' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin:'0 auto', display:'block' }}><path d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2zM18 9l-6 6M12 9l6 6"/></svg>
              ) : k}
            </button>
          ))}
        </div>

        {/* Speed selector */}
        <div style={{ background:c.card, border:`1px solid ${c.border}`, borderRadius:16, overflow:'hidden', marginBottom:16 }}>
          <p style={{ fontSize:12, color:c.textTer, fontWeight:600, padding:'12px 16px 8px' }}>Speed</p>
          {([
            { id:'standard', label:'Standard', desc:'ACH · 1-3 business days', fee:'Free' },
            { id:'instant',  label:'Instant',  desc:'RTP · Arrives in seconds',  fee:'$0.25' },
          ] as { id:'standard'|'instant'; label:string; desc:string; fee:string }[]).map((opt,i)=>(
            <button key={opt.id} onClick={()=>setSpeed(opt.id)}
              style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', background:'transparent', border:'none', borderTop:i>0?`1px solid ${c.border}`:'none', cursor:'pointer' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:18, height:18, borderRadius:'50%', border:`2px solid ${speed===opt.id?c.action:c.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {speed===opt.id && <div style={{ width:8, height:8, borderRadius:'50%', background:c.action }}/>}
                </div>
                <div style={{ textAlign:'left' }}>
                  <p style={{ fontSize:13, fontWeight:600, color:c.text, margin:0 }}>{opt.label}</p>
                  <p style={{ fontSize:11, color:c.textTer, margin:0 }}>{opt.desc}</p>
                </div>
              </div>
              <span style={{ fontSize:12, fontWeight:700, color:opt.fee==='Free'?'#0F6E56':c.text }}>{opt.fee}</span>
            </button>
          ))}
        </div>

        <button
          onClick={()=>setStep('review')}
          disabled={amount==='0'}
          style={{ width:'100%', background:amount==='0'?c.border:c.action, color:'#fff', border:'none', borderRadius:14, padding:'16px', fontSize:15, fontWeight:700, cursor:amount==='0'?'not-allowed':'pointer' }}>
          Review Transfer
        </button>
      </div>
      <BankBottomNav active="/village/bank/move"/>
    </div>
  );
}
