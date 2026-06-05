'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

function Avatar({ name, size=36 }: { name:string; size?:number }) {
  const colors = ['#2952E8','#1D9E75','#C48A20','#D4537E','#7C3AED'];
  const c = colors[name.charCodeAt(0) % colors.length];
  return (
    <div style={{ width:size, height:size, borderRadius:size/2, background:c, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:900, fontSize:size*0.36, flexShrink:0 }}>
      {name.slice(0,1).toUpperCase()}
    </div>
  );
}

const MOCK_MEETINGS = [
  { id:'m1', title:'Strategy Session — Meridian Solar', scheduled_at: new Date(Date.now()+2*3600000).toISOString(), duration_min:45, status:'scheduled', attendee_names:['Marcus B.'] },
  { id:'m2', title:'Growth Lab Coaching Call', scheduled_at: new Date(Date.now()+26*3600000).toISOString(), duration_min:60, status:'scheduled', attendee_names:['Maya Kim'] },
];

const MOCK_THREADS = [
  { id:'t1', name:'Marcus Brown', preview:'Looking forward to the session tomorrow...', ts: new Date(Date.now()-1800000).toISOString(), unread:2, context:'Matched on Meridian Solar' },
  { id:'t2', name:'Dr. Aisha Thompson', preview:'I sent over the pitch deck revision', ts: new Date(Date.now()-3*3600000).toISOString(), unread:0, context:'Nara Health deal' },
  { id:'t3', name:'Maya Kim', preview:'Your session notes are ready in Spaces', ts: new Date(Date.now()-24*3600000).toISOString(), unread:0, context:'Growth Lab coaching' },
];

function fmtTime(iso:string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = (d.getTime()-now.getTime())/1000;
  if (diff < 3600 && diff > 0) return `In ${Math.round(diff/60)}m`;
  if (diff > 0 && diff < 86400) return d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
  return d.toLocaleDateString([],{month:'short',day:'numeric'});
}

function fmtAgo(iso:string) {
  const secs = (Date.now() - new Date(iso).getTime())/1000;
  if (secs < 60) return 'Now';
  if (secs < 3600) return `${Math.round(secs/60)}m`;
  if (secs < 86400) return `${Math.round(secs/3600)}h`;
  return `${Math.round(secs/86400)}d`;
}

export default function OfficePage() {
  const supabase = createClient();
  const [meetings, setMeetings]   = useState<any[]>(MOCK_MEETINGS);
  const [threads, setThreads]     = useState<any[]>(MOCK_THREADS);
  const [activeThread, setThread] = useState<any>(null);
  const [messages, setMessages]   = useState<{role:'me'|'them';text:string;ts:string}[]>([]);
  const [input, setInput]         = useState('');
  const [showNewMtg, setNewMtg]   = useState(false);
  const [syncItems, setSyncItems] = useState(3);
  const bottomRef = useRef<HTMLDivElement>(null);

  const bg    = 'var(--v-bg)';
  const card  = 'var(--v-card-bg)';
  const border= 'var(--v-card-border)';
  const text  = 'var(--v-text)';
  const muted = 'var(--v-text-muted)';
  const sub   = 'var(--v-text-sub)';

  async function openThread(t:any) {
    const label = t.context_label ?? t.context ?? null;
    setThread({ ...t, context_label: label });
    // Load real messages from API
    try {
      const res = await fetch(`/api/office/messages?thread_id=${t.id}`);
      if (res.ok) {
        const data = await res.json();
        const msgs = (data.messages ?? []).map((m: any) => ({
          role: m.sender_id === t._currentUserId ? 'me' : 'them' as 'me'|'them',
          text: m.content,
          ts: m.created_at,
        }));
        setMessages(msgs.length > 0 ? msgs : [{ role: 'them' as const, text: t.last_message_preview ?? t.preview ?? 'Start a conversation', ts: t.last_message_at ?? new Date().toISOString() }]);
      }
    } catch {
      setMessages([{ role: 'them' as const, text: t.last_message_preview ?? t.preview ?? '', ts: new Date().toISOString() }]);
    }
  }

  async function send() {
    if (!input.trim() || !activeThread) return;
    const text = input.trim();
    setInput('');
    setMessages(m => [...m, { role:'me' as const, text, ts: new Date().toISOString() }]);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior:'smooth' }), 50);
    // Persist to DB
    fetch('/api/office/messages', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ thread_id: activeThread.id, content: text }),
    }).catch(() => {});
  }

  if (activeThread) {
    return (
      <div style={{ height:'100vh', display:'flex', flexDirection:'column', background:bg }}>
        {/* Thread header */}
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', background:card, borderBottom:`1px solid ${border}` }}>
          <button onClick={()=>setThread(null)} style={{ background:'none', border:'none', color:muted, cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontSize:14, fontWeight:700 }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg> Office
          </button>
          <Avatar name={activeThread.name} size={36} />
          <div style={{ flex:1 }}>
            <p style={{ fontSize:14, fontWeight:700, color:text, margin:0 }}>{activeThread.name}</p>
          </div>
          <button style={{ background:'none', border:'none', cursor:'pointer', color:muted }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
          </button>
        </div>

        {/* Context pill */}
        {activeThread.context_label && (
          <div style={{ display:'flex', justifyContent:'center', padding:'8px 16px', background:bg, borderBottom:`1px solid ${border}` }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'var(--v-brand-light)', border:'1px solid var(--v-brand)', borderRadius:20, padding:'5px 14px', maxWidth:'100%' }}>
              <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="var(--v-brand)" strokeWidth={2} strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span style={{ fontSize:11, fontWeight:700, color:'var(--v-brand-deep)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {activeThread.context_label}
              </span>
            </div>
          </div>
        )}

        {/* Messages */}
        <div style={{ flex:1, overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:10 }}>
          {messages.map((m,i)=>(
            <div key={i} style={{ display:'flex', justifyContent:m.role==='me'?'flex-end':'flex-start' }}>
              <div style={{ maxWidth:'80%', padding:'10px 14px', borderRadius: m.role==='me'?'16px 4px 16px 16px':'4px 16px 16px 16px', background: m.role==='me'?'var(--v-brand-light)':'var(--v-bg-2)', border:`1px solid ${m.role==='me'?'var(--v-brand)':border}` }}>
                <p style={{ fontSize:13, color:m.role==='me'?'var(--v-brand-deep)':text, margin:0, lineHeight:1.55 }}>{m.text}</p>
                <p style={{ fontSize:10, color:sub, margin:'4px 0 0', textAlign:m.role==='me'?'right':'left' }}>{fmtAgo(m.ts)}</p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ display:'flex', gap:10, padding:'12px 16px', paddingBottom:'max(12px,env(safe-area-inset-bottom))', background:card, borderTop:`1px solid ${border}` }}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()}
            placeholder="Message..." style={{ flex:1, background:'var(--v-bg-2)', border:`1px solid ${border}`, borderRadius:24, padding:'10px 16px', fontSize:13, color:text, outline:'none' }} />
          <button onClick={send} style={{ width:40, height:40, borderRadius:20, background:'var(--v-gold)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:'100vh', background:bg, paddingBottom:90 }}>
      {/* Header */}
      <div style={{ position:'sticky', top:0, zIndex:20, display:'flex', alignItems:'center', padding:'14px 16px', background:'rgba(255,255,255,0.94)', backdropFilter:'blur(12px)', borderBottom:`1px solid ${border}` }}>
        <Link href="/village/trading-post" style={{ color:'#ED93B1', fontWeight:800, fontSize:14, textDecoration:'none', display:'flex', alignItems:'center', gap:4 }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg> Post
        </Link>
        <p style={{ flex:1, textAlign:'center', fontSize:17, fontWeight:900, color:text }}>Office</p>
        <button onClick={()=>setNewMtg(true)} style={{ fontSize:12, fontWeight:900, color:'var(--v-brand)', textDecoration:'none', background:'var(--v-brand-light)', borderRadius:20, padding:'6px 14px', border:'none', cursor:'pointer' }}>
          + Meet
        </button>
      </div>

      <div style={{ padding:'16px' }}>
        {/* Sync to Spaces card */}
        {syncItems > 0 && (
          <div style={{ background:'var(--v-gold-light)', border:'1px solid var(--v-gold)', borderRadius:14, padding:'14px', marginBottom:20 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--v-gold)" strokeWidth={2} strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              <span style={{ fontSize:10, fontWeight:900, color:'var(--v-gold)', letterSpacing:'0.06em' }}>SEND TO SPACES</span>
            </div>
            <p style={{ fontSize:13, fontWeight:700, color:'var(--v-text)', margin:'0 0 4px' }}>{syncItems} items ready to sync</p>
            <p style={{ fontSize:11, color:'var(--v-text-muted)', margin:0 }}>2 meetings · 1 project plan · action items</p>
            <button onClick={()=>setSyncItems(0)} style={{ marginTop:10, background:'var(--v-gold)', color:'#fff', border:'none', borderRadius:20, padding:'8px 18px', fontSize:12, fontWeight:900, cursor:'pointer' }}>
              Sync Now
            </button>
          </div>
        )}

        {/* Upcoming meetings */}
        <p style={{ fontSize:10, fontWeight:900, color:sub, letterSpacing:'0.06em', marginBottom:10 }}>UPCOMING MEETINGS</p>
        {meetings.map(m => {
          const soon = new Date(m.scheduled_at).getTime() - Date.now() < 3600000;
          return (
            <div key={m.id} style={{ background:card, border:`1px solid ${soon?'var(--v-brand)':border}`, borderRadius:14, padding:'14px', marginBottom:10 }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:8 }}>
                <div>
                  <p style={{ fontSize:15, fontWeight:900, color:text, margin:'0 0 2px' }}>{fmtTime(m.scheduled_at)}</p>
                  <p style={{ fontSize:13, fontWeight:700, color:text, margin:0 }}>{m.title}</p>
                  <p style={{ fontSize:10, color:muted, margin:'2px 0 0' }}>{m.duration_min} min · Video</p>
                </div>
                <Link href="/village/trading-post/office/meeting" style={{ background:'var(--v-brand)', color:'#fff', borderRadius:20, padding:'8px 16px', fontSize:12, fontWeight:900, textDecoration:'none' }}>
                  Join
                </Link>
              </div>
              {m.attendee_names?.length > 0 && (
                <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                  {m.attendee_names.map((n:string)=>(
                    <div key={n} style={{ display:'flex', alignItems:'center', gap:5 }}>
                      <Avatar name={n} size={20} />
                      <span style={{ fontSize:11, color:muted }}>{n}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <button onClick={()=>setNewMtg(true)} style={{ width:'100%', padding:'12px', background:card, border:`1px dashed ${border}`, borderRadius:14, color:muted, fontSize:13, fontWeight:700, cursor:'pointer', marginBottom:20 }}>
          + Schedule a meeting
        </button>

        {/* DMs */}
        <p style={{ fontSize:10, fontWeight:900, color:sub, letterSpacing:'0.06em', marginBottom:10 }}>DIRECT MESSAGES</p>
        <div style={{ background:card, border:`1px solid ${border}`, borderRadius:14, overflow:'hidden', marginBottom:20 }}>
          {threads.map((t,i)=>(
            <button key={t.id} onClick={()=>openThread(t)}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderBottom:i<threads.length-1?`1px solid ${border}`:'none', background:'transparent', border:'none', cursor:'pointer', textAlign:'left' }}>
              <Avatar name={t.name} />
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:13, fontWeight:700, color:text, margin:'0 0 2px' }}>{t.name}</p>
                <p style={{ fontSize:11, color:muted, margin:0, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>{t.preview}</p>
              </div>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, flexShrink:0 }}>
                <span style={{ fontSize:10, color:sub }}>{fmtAgo(t.ts)}</span>
                {t.unread > 0 && <span style={{ width:18, height:18, borderRadius:9, background:'var(--v-gold)', color:'#fff', fontSize:9, fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center' }}>{t.unread}</span>}
              </div>
            </button>
          ))}
        </div>

        {/* Start a meeting */}
        <button onClick={()=>setNewMtg(true)} style={{ width:'100%', padding:'14px', background:'var(--v-brand)', color:'#fff', border:'none', borderRadius:14, fontSize:14, fontWeight:900, cursor:'pointer' }}>
          Start a Meeting
        </button>
      </div>

      {/* New meeting modal */}
      <AnimatePresence>
        {showNewMtg && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:50, display:'flex', alignItems:'flex-end', justifyContent:'center', padding:16 }}>
            <motion.div initial={{y:80,opacity:0}} animate={{y:0,opacity:1}} exit={{y:80,opacity:0}}
              style={{ background:card, borderRadius:24, width:'100%', maxWidth:420, padding:24, paddingBottom:32 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
                <p style={{ fontSize:16, fontWeight:900, color:text, margin:0 }}>Schedule a meeting</p>
                <button onClick={()=>setNewMtg(false)} style={{ color:muted, background:'none', border:'none', fontSize:22, cursor:'pointer', lineHeight:1 }}>×</button>
              </div>
              {[
                { label:'Title', placeholder:'e.g. Strategy call' },
                { label:'Date & time', placeholder:'e.g. Tomorrow 2pm' },
                { label:'Attendees', placeholder:'Search tribe members...' },
              ].map(f=>(
                <div key={f.label} style={{ marginBottom:12 }}>
                  <p style={{ fontSize:11, color:muted, fontWeight:700, marginBottom:4 }}>{f.label}</p>
                  <input placeholder={f.placeholder} style={{ width:'100%', background:'var(--v-bg-2)', border:`1px solid ${border}`, borderRadius:12, padding:'10px 14px', fontSize:13, color:text, outline:'none', boxSizing:'border-box' }} />
                </div>
              ))}
              <div style={{ display:'flex', gap:8, marginTop:8 }}>
                {['15m','30m','45m','60m','90m'].map(d=>(
                  <button key={d} style={{ flex:1, padding:'8px 0', borderRadius:10, border:`1px solid ${border}`, background:'transparent', color:muted, fontSize:12, fontWeight:700, cursor:'pointer' }}>{d}</button>
                ))}
              </div>
              <button onClick={()=>{ setMeetings(ms=>[...ms,{id:'new'+Date.now(),title:'New Meeting',scheduled_at:new Date(Date.now()+3600000).toISOString(),duration_min:30,status:'scheduled',attendee_names:[]}]); setNewMtg(false); }}
                style={{ width:'100%', marginTop:20, padding:'14px', background:'var(--v-brand)', color:'#fff', border:'none', borderRadius:14, fontSize:14, fontWeight:900, cursor:'pointer' }}>
                Create Meeting
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
