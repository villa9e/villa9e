'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const ROLES = ['All','Investors','Founders','Advisors','Service Pros','Buyers'];
const ROLE_PILL: Record<string,string> = {
  investor:'pill-solid-brand', founder:'pill-gold', advisor:'pill-teal',
  'service pro':'pill-blue', buyer:'pill-blue',
};

function Avatar({ name, size=44 }: { name:string; size?:number }) {
  const colors = ['#2952E8','#1D9E75','#C48A20','#D4537E','#7C3AED','#0033CC'];
  const c = colors[name.charCodeAt(0) % colors.length];
  return (
    <div style={{ width:size, height:size, borderRadius:size/2, background:c, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:900, fontSize:size*0.36, flexShrink:0 }}>
      {name.slice(0,1).toUpperCase()}
    </div>
  );
}

const MOCK = [
  { id:'c1', display_name:'Marcus Brown', role:'investor',    context:'Matched on Meridian Solar', mutuals:3 },
  { id:'c2', display_name:'Dr. Aisha Thompson', role:'founder', context:'Mutual connection with Sarah C.', mutuals:7 },
  { id:'c3', display_name:'Priya Singh', role:'service pro', context:'Purchased Legal Launchpad service', mutuals:2 },
  { id:'c4', display_name:'Jordan Cole', role:'advisor',     context:'Met at Pavilion Summit 2025', mutuals:12 },
  { id:'c5', display_name:'Maya Kim', role:'founder',        context:'Purchased Growth Lab coaching', mutuals:5 },
];

const SUGGEST = [
  { id:'s1', display_name:'Elena Vasquez', role:'investor', mutuals:8 },
  { id:'s2', display_name:'Kwame Asante',  role:'founder',  mutuals:4 },
  { id:'s3', display_name:'David Park',    role:'advisor',  mutuals:6 },
];

export default function TribePage() {
  const supabase = createClient();
  const [connections, setConnections] = useState<any[]>([]);
  const [filter, setFilter] = useState('All');
  const [userId, setUserId] = useState('');
  const [sending, setSending] = useState<string|null>(null);
  const [sent, setSent]       = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
      const { data } = await (supabase as any).from('connections')
        .select('*,profiles!connections_to_user_id_fkey(username,display_name,personality_type)')
        .limit(30);
      setConnections(data && data.length > 0 ? data : MOCK);
    })();
  }, []);

  async function connect(id:string) {
    setSending(id);
    await (supabase as any).from('connections').insert({ from_user_id: userId, to_user_id: id, pending: true }).catch(()=>{});
    setSent(s => new Set([...s, id]));
    setSending(null);
  }

  const filtered = filter === 'All' ? connections : connections.filter((c:any) => {
    const role = c.role ?? c.profiles?.personality_type ?? '';
    return role.toLowerCase().includes(filter.toLowerCase().replace(' pro',''));
  });

  const bg    = 'var(--v-bg)';
  const card  = 'var(--v-card-bg)';
  const border= 'var(--v-card-border)';
  const text  = 'var(--v-text)';
  const muted = 'var(--v-text-muted)';
  const sub   = 'var(--v-text-sub)';

  return (
    <div style={{ minHeight:'100vh', background:bg, paddingBottom:90 }}>
      {/* Header */}
      <div style={{ position:'sticky', top:0, zIndex:20, display:'flex', alignItems:'center', padding:'14px 16px', background:'rgba(255,255,255,0.94)', backdropFilter:'blur(12px)', borderBottom:`1px solid ${border}` }}>
        <Link href="/village/trading-post" style={{ color:'var(--v-success)', fontWeight:800, fontSize:14, textDecoration:'none', display:'flex', alignItems:'center', gap:4 }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg> Post
        </Link>
        <p style={{ flex:1, textAlign:'center', fontSize:17, fontWeight:900, color:text }}>Tribe</p>
        <button style={{ fontSize:12, fontWeight:900, color:'var(--v-success)', textDecoration:'none', background:'var(--v-success-light)', borderRadius:20, padding:'6px 14px', border:'none', cursor:'pointer' }}>
          + Invite
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, padding:'12px 16px', borderBottom:`1px solid ${border}` }}>
        {[
          { value: connections.length, label:'Connections', color:text },
          { value: 3, label:'New this week', color:'var(--v-success)' },
          { value: 1, label:'Pending', color:'var(--v-gold)' },
        ].map(s => (
          <div key={s.label} style={{ background:'var(--v-bg-2)', borderRadius:10, padding:'10px 8px', textAlign:'center' }}>
            <p style={{ fontSize:18, fontWeight:900, color:s.color, margin:0 }}>{s.value}</p>
            <p style={{ fontSize:9, color:sub, margin:0, letterSpacing:'0.04em' }}>{s.label.toUpperCase()}</p>
          </div>
        ))}
      </div>

      {/* Role filter */}
      <div style={{ display:'flex', gap:6, overflowX:'auto', padding:'12px 16px', borderBottom:`1px solid ${border}` }}>
        {ROLES.map(r => (
          <button key={r} onClick={()=>setFilter(r)}
            style={{ padding:'5px 14px', borderRadius:20, border:`1px solid ${filter===r?'transparent':border}`, background:filter===r?'var(--v-gold)':'transparent', color:filter===r?'#fff':muted, fontSize:11, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0 }}>
            {r}
          </button>
        ))}
      </div>

      <div style={{ padding:'16px' }}>
        {/* Connections list */}
        <p style={{ fontSize:10, fontWeight:900, color:sub, letterSpacing:'0.06em', marginBottom:10 }}>YOUR TRIBE</p>
        <div style={{ background:card, border:`1px solid ${border}`, borderRadius:14, overflow:'hidden', marginBottom:20 }}>
          {filtered.length === 0 ? (
            <div style={{ padding:'32px 16px', textAlign:'center', color:muted }}>
              <p style={{ fontSize:24, marginBottom:8 }}>🤝</p>
              <p style={{ fontSize:13 }}>No connections yet in this category.</p>
            </div>
          ) : filtered.map((c:any, i:number) => {
            const name = c.display_name ?? c.profiles?.display_name ?? c.profiles?.username ?? 'Villager';
            const role = c.role ?? 'member';
            const context = c.context ?? `Connected through villa9e`;
            return (
              <div key={c.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderBottom: i < filtered.length-1 ? `1px solid ${border}` : 'none' }}>
                <Avatar name={name} />
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:13, fontWeight:700, color:text, margin:'0 0 2px' }}>{name}</p>
                  <p style={{ fontSize:10, color:muted, margin:'0 0 4px', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>{context}</p>
                  <span className={`pill ${ROLE_PILL[role]??'pill-blue'}`} style={{fontSize:9,textTransform:'capitalize'}}>{role}</span>
                </div>
                {/* Message + call */}
                <div style={{ display:'flex', gap:6 }}>
                  <Link href="/village/trading-post/office" style={{ width:32, height:32, borderRadius:16, background:'var(--v-gold-light)', display:'flex', alignItems:'center', justifyContent:'center', textDecoration:'none' }}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--v-gold)" strokeWidth={2} strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                  </Link>
                  <button style={{ width:32, height:32, borderRadius:16, background:'var(--v-bg-2)', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={sub} strokeWidth={2} strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Suggestions */}
        <p style={{ fontSize:10, fontWeight:900, color:sub, letterSpacing:'0.06em', marginBottom:10 }}>PEOPLE YOU MAY KNOW</p>
        <div style={{ background:card, border:`1px solid ${border}`, borderRadius:14, overflow:'hidden' }}>
          {SUGGEST.map((s,i) => (
            <div key={s.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderBottom: i < SUGGEST.length-1 ? `1px solid ${border}` : 'none' }}>
              <Avatar name={s.display_name} />
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:13, fontWeight:700, color:text, margin:'0 0 2px' }}>{s.display_name}</p>
                <p style={{ fontSize:10, color:muted, margin:0 }}>{s.mutuals} mutual connections · <span style={{textTransform:'capitalize'}}>{s.role}</span></p>
              </div>
              <button onClick={()=>connect(s.id)} disabled={sending===s.id||sent.has(s.id)}
                style={{ padding:'6px 14px', borderRadius:20, border:`1px solid var(--v-gold)`, background:sent.has(s.id)?'var(--v-gold)':'transparent', color:sent.has(s.id)?'#fff':'var(--v-gold)', fontSize:11, fontWeight:900, cursor:'pointer' }}>
                {sent.has(s.id) ? 'Sent' : sending===s.id ? '...' : 'Connect'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
