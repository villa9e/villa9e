'use client';
import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

function Avatar({ name, size=48 }: { name:string; size?:number }) {
  const colors = ['#2952E8','#1D9E75','#C48A20','#D4537E','#7C3AED'];
  const c = colors[name.charCodeAt(0) % colors.length];
  return (
    <div style={{ width:size, height:size, borderRadius:size/2, background:c, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:900, fontSize:size*0.36, flexShrink:0 }}>
      {name.slice(0,1).toUpperCase()}
    </div>
  );
}

type ActionItem = { id:string; task:string; assignee:string };

export default function MeetingRoomPage() {
  const [muted, setMuted]       = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [sharing, setSharing]   = useState(false);
  const [notes, setNotes]       = useState('');
  const [actions, setActions]   = useState<ActionItem[]>([]);
  const [newTask, setNewTask]   = useState('');
  const [newAssignee, setNewAssignee] = useState('');
  const [ended, setEnded]       = useState(false);

  const participants = ['Marcus Brown', 'You'];

  const card  = 'var(--v-card-bg)';
  const border= 'var(--v-card-border)';
  const text  = 'var(--v-text)';
  const muted_= 'var(--v-text-muted)';
  const sub   = 'var(--v-text-sub)';

  function addAction() {
    if (!newTask.trim()) return;
    setActions(a=>[...a,{id:Date.now().toString(),task:newTask.trim(),assignee:newAssignee||'You'}]);
    setNewTask(''); setNewAssignee('');
  }

  if (ended) {
    return (
      <div style={{ minHeight:'100vh', background:'var(--v-bg)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
        <div style={{ textAlign:'center', maxWidth:340 }}>
          <p style={{ fontSize:48, marginBottom:12 }}>✅</p>
          <p style={{ fontSize:20, fontWeight:900, color:text, marginBottom:8 }}>Meeting ended</p>
          <p style={{ fontSize:13, color:muted_, lineHeight:1.6, marginBottom:6 }}>Notes and {actions.length} action item{actions.length!==1?'s':''} have been synced to Spaces automatically.</p>
          <div style={{ background:'var(--v-gold-light)', border:'1px solid var(--v-gold)', borderRadius:14, padding:14, marginBottom:24, textAlign:'left' }}>
            <p style={{ fontSize:11, fontWeight:900, color:'var(--v-gold)', margin:'0 0 6px', letterSpacing:'0.06em' }}>SYNCED TO SPACES</p>
            {actions.map(a=>(
              <p key={a.id} style={{ fontSize:12, color:text, margin:'4px 0', display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ color:'var(--v-success)' }}>✓</span> {a.task} <span style={{ color:'var(--v-brand)', fontSize:10, fontWeight:700 }}>→ {a.assignee}</span>
              </p>
            ))}
            {actions.length===0&&<p style={{ fontSize:12, color:muted_, margin:0 }}>Meeting summary added to your calendar.</p>}
          </div>
          <Link href="/village/trading-post/office" style={{ display:'block', background:'var(--v-brand)', color:'#fff', borderRadius:14, padding:'14px', fontSize:14, fontWeight:900, textDecoration:'none', textAlign:'center' }}>
            Back to Office
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:'100vh', background:'#080E24', color:'#fff', display:'flex', flexDirection:'column' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', padding:'14px 16px', background:'rgba(8,14,36,0.9)' }}>
        <Link href="/village/trading-post/office" style={{ color:'rgba(255,255,255,0.5)', fontWeight:800, fontSize:14, textDecoration:'none', display:'flex', alignItems:'center', gap:4 }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg> Office
        </Link>
        <p style={{ flex:1, textAlign:'center', fontSize:16, fontWeight:900 }}>Meeting Room</p>
        <div style={{ width:60 }}/>
      </div>

      {/* Video tiles */}
      <div style={{ display:'flex', gap:8, padding:'12px 16px' }}>
        {participants.map(p=>(
          <div key={p} style={{ flex:1, height:110, background:'#0E1630', borderRadius:12, border:'1px solid #2A3860', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6 }}>
            {cameraOn || p!=='You' ? <Avatar name={p} size={44}/> : <div style={{ width:44, height:44, borderRadius:22, background:'#1A2448', display:'flex', alignItems:'center', justifyContent:'center' }}><span style={{fontSize:20}}>📷</span></div>}
            <p style={{ fontSize:10, color:'rgba(255,255,255,0.5)', margin:0, fontWeight:700 }}>{p}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display:'flex', justifyContent:'center', gap:16, padding:'0 16px 16px' }}>
        {[
          { icon: muted ? '🔇' : '🎙', label: muted?'Unmute':'Mute', action:()=>setMuted(!muted), bg: muted?'var(--v-danger-light)':'rgba(255,255,255,0.08)', border_: muted?'var(--v-danger)':'rgba(255,255,255,0.15)' },
          { icon: '📞', label:'End', action:()=>setEnded(true), bg:'var(--v-danger)', border_:'var(--v-danger)' },
          { icon: cameraOn?'📷':'📷', label:cameraOn?'Camera off':'Camera on', action:()=>setCameraOn(!cameraOn), bg:'rgba(255,255,255,0.08)', border_:'rgba(255,255,255,0.15)' },
          { icon: '🖥', label:'Share', action:()=>setSharing(!sharing), bg:sharing?'var(--v-brand)':'rgba(255,255,255,0.08)', border_:sharing?'var(--v-brand)':'rgba(255,255,255,0.15)' },
        ].map(b=>(
          <button key={b.label} onClick={b.action} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, background:'transparent', border:'none', cursor:'pointer' }}>
            <div style={{ width:44, height:44, borderRadius:22, background:b.bg, border:`1px solid ${b.border_}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>{b.icon}</div>
            <span style={{ fontSize:9, color:'rgba(255,255,255,0.4)', fontWeight:700 }}>{b.label.toUpperCase()}</span>
          </button>
        ))}
      </div>

      {/* Notes */}
      <div style={{ flex:1, padding:'0 16px', display:'flex', flexDirection:'column', gap:12 }}>
        <div>
          <p style={{ fontSize:10, fontWeight:900, color:'rgba(255,255,255,0.4)', letterSpacing:'0.06em', marginBottom:8 }}>MEETING NOTES</p>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)}
            placeholder="Take notes here — will sync to Spaces tasks automatically..."
            style={{ width:'100%', minHeight:80, background:'#0E1630', border:'none', borderRadius:12, padding:'12px 14px', fontSize:13, color:'#F0F4FF', resize:'none', outline:'none', fontFamily:'inherit', boxSizing:'border-box' }} />
        </div>

        {/* Action items */}
        <div>
          <p style={{ fontSize:10, fontWeight:900, color:'rgba(255,255,255,0.4)', letterSpacing:'0.06em', marginBottom:8 }}>ACTION ITEMS</p>
          <div style={{ background:'#0E1630', borderRadius:12, padding:'12px 14px', marginBottom:8 }}>
            {actions.map(a=>(
              <div key={a.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize:12, color:'#F0F4FF' }}>{a.task}</span>
                <span style={{ fontSize:10, color:'var(--v-brand)', fontWeight:700 }}>{a.assignee}</span>
              </div>
            ))}
            {actions.length===0&&<p style={{ fontSize:12, color:'rgba(255,255,255,0.3)', margin:0 }}>No action items yet</p>}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <input value={newTask} onChange={e=>setNewTask(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addAction()}
              placeholder="Add action item…" style={{ flex:2, background:'#0E1630', border:'1px solid #2A3860', borderRadius:10, padding:'9px 12px', fontSize:12, color:'#F0F4FF', outline:'none' }} />
            <input value={newAssignee} onChange={e=>setNewAssignee(e.target.value)}
              placeholder="Assignee" style={{ flex:1, background:'#0E1630', border:'1px solid #2A3860', borderRadius:10, padding:'9px 12px', fontSize:12, color:'#F0F4FF', outline:'none' }} />
            <button onClick={addAction} style={{ width:36, height:36, borderRadius:18, background:'var(--v-brand)', border:'none', cursor:'pointer', fontSize:18, color:'#fff' }}>+</button>
          </div>
        </div>

        {/* Sync reminder */}
        <div style={{ background:'rgba(29,158,117,0.1)', border:'1px solid rgba(29,158,117,0.25)', borderRadius:12, padding:'12px 14px' }}>
          <p style={{ fontSize:11, color:'#34D399', margin:0, lineHeight:1.5 }}>Notes and action items will be added to your Spaces task list and calendar automatically after this meeting ends.</p>
        </div>
      </div>

      <div style={{ height:24 }}/>
    </div>
  );
}
