'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

// Mock pending requests
const MOCK_PENDING = [
  { id:'p1', from_user_id:'u10', display_name:'Tariq Williams', role:'investor', context:'Matched on FleetOps deal', mutuals:3 },
  { id:'p2', from_user_id:'u11', display_name:'Sofia Reyes',    role:'founder',  context:'Mutual connection: Jordan Cole', mutuals:5 },
];

// ── Pending Requests Panel ────────────────────────────────────────────────────
interface PendingRequest {
  id: string;
  from_user_id: string;
  display_name: string;
  role: string;
  context: string;
  mutuals: number;
}

function PendingPanel({ requests, onAccept, onDecline, onClose }: {
  requests: PendingRequest[];
  onAccept: (req: PendingRequest) => void;
  onDecline: (req: PendingRequest) => void;
  onClose: () => void;
}) {
  const border = 'var(--v-card-border)';
  const card   = 'var(--v-card-bg)';
  const text   = 'var(--v-text)';
  const muted  = 'var(--v-text-muted)';
  const sub    = 'var(--v-text-sub)';

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:50, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
      <motion.div initial={{ y:100, opacity:0 }} animate={{ y:0, opacity:1 }} exit={{ y:100, opacity:0 }}
        style={{ background:card, borderRadius:'24px 24px 0 0', width:'100%', maxWidth:480, maxHeight:'80vh', overflowY:'auto', paddingBottom:'max(24px,env(safe-area-inset-bottom))' }}>
        {/* Handle */}
        <div style={{ display:'flex', justifyContent:'center', paddingTop:12, paddingBottom:4 }}>
          <div style={{ width:36, height:4, borderRadius:2, background:border }} />
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px 16px' }}>
          <p style={{ fontSize:16, fontWeight:900, color:text, margin:0 }}>
            Connection Requests
            {requests.length > 0 && (
              <span style={{ marginLeft:8, display:'inline-flex', alignItems:'center', justifyContent:'center', width:22, height:22, borderRadius:11, background:'var(--v-gold)', color:'#fff', fontSize:11, fontWeight:900, verticalAlign:'middle' }}>
                {requests.length}
              </span>
            )}
          </p>
          <button onClick={onClose} style={{ background:'none', border:'none', color:muted, fontSize:24, cursor:'pointer', lineHeight:1 }}>×</button>
        </div>

        {requests.length === 0 ? (
          <div style={{ padding:'40px 20px', textAlign:'center' }}>
            <p style={{ fontSize:24, marginBottom:8 }}>🤝</p>
            <p style={{ fontSize:13, color:muted }}>No pending requests right now.</p>
          </div>
        ) : (
          <div style={{ padding:'0 16px', display:'flex', flexDirection:'column', gap:10 }}>
            {requests.map(req => (
              <div key={req.id} style={{ background:'var(--v-bg-2)', border:`1px solid ${border}`, borderRadius:14, padding:'14px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                  <Avatar name={req.display_name} size={44} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:14, fontWeight:700, color:text, margin:'0 0 2px' }}>{req.display_name}</p>
                    <p style={{ fontSize:10, color:muted, margin:'0 0 4px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{req.context}</p>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span className={`pill ${ROLE_PILL[req.role]??'pill-blue'}`} style={{ fontSize:9, textTransform:'capitalize' }}>{req.role}</span>
                      <span style={{ fontSize:10, color:sub }}>{req.mutuals} mutual</span>
                    </div>
                  </div>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={() => onDecline(req)}
                    style={{ flex:1, padding:'10px 0', borderRadius:12, border:`1px solid ${border}`, background:'transparent', color:muted, fontSize:12, fontWeight:700, cursor:'pointer' }}>
                    Decline
                  </button>
                  <button onClick={() => onAccept(req)}
                    style={{ flex:2, padding:'10px 0', borderRadius:12, background:'var(--v-success)', border:'none', color:'#fff', fontSize:12, fontWeight:900, cursor:'pointer' }}>
                    Accept
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function TribePage() {
  const supabase = createClient();
  const [connections, setConnections]   = useState<any[]>([]);
  const [filter, setFilter]             = useState('All');
  const [userId, setUserId]             = useState('');
  const [sending, setSending]           = useState<string|null>(null);
  const [sent, setSent]                 = useState<Set<string>>(new Set());
  const [pendingReqs, setPendingReqs]   = useState<PendingRequest[]>(MOCK_PENDING);
  const [showPending, setShowPending]   = useState(false);

  const bg    = 'var(--v-bg)';
  const card  = 'var(--v-card-bg)';
  const border= 'var(--v-card-border)';
  const text  = 'var(--v-text)';
  const muted = 'var(--v-text-muted)';
  const sub   = 'var(--v-text-sub)';

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        // Load accepted connections
        const { data: conns } = await (supabase as any)
          .from('connections')
          .select('*,profiles!connections_to_user_id_fkey(username,display_name,personality_type)')
          .eq('pending', false)
          .limit(30);
        setConnections(conns && conns.length > 0 ? conns : MOCK);

        // Load pending incoming requests
        const { data: reqs } = await (supabase as any)
          .from('connections')
          .select('*,profiles!connections_from_user_id_fkey(username,display_name)')
          .eq('to_user_id', user.id)
          .eq('pending', true);
        if (reqs && reqs.length > 0) {
          setPendingReqs(reqs.map((r: any) => ({
            id: r.id,
            from_user_id: r.from_user_id,
            display_name: r.profiles?.display_name ?? r.profiles?.username ?? 'Villager',
            role: 'member',
            context: 'Connected through villa9e',
            mutuals: 0,
          })));
        }
      } else {
        setConnections(MOCK);
      }
    })();
  }, []);

  async function connect(id:string) {
    setSending(id);
    await (supabase as any).from('connections').insert({ from_user_id: userId, to_user_id: id, pending: true }).catch(()=>{});
    setSent(s => new Set([...s, id]));
    setSending(null);
  }

  async function acceptRequest(req: PendingRequest) {
    await (supabase as any).from('connections').update({ pending: false }).eq('id', req.id).catch(()=>{});
    setPendingReqs(r => r.filter(x => x.id !== req.id));
    setConnections(c => [...c, { id: req.from_user_id, display_name: req.display_name, role: req.role, context: req.context }]);
  }

  async function declineRequest(req: PendingRequest) {
    await (supabase as any).from('connections').delete().eq('id', req.id).catch(()=>{});
    setPendingReqs(r => r.filter(x => x.id !== req.id));
  }

  const filtered = filter === 'All' ? connections : connections.filter((c:any) => {
    const role = c.role ?? c.profiles?.personality_type ?? '';
    return role.toLowerCase().includes(filter.toLowerCase().replace(' pro',''));
  });

  return (
    <div style={{ minHeight:'100vh', background:bg, paddingBottom:90 }}>
      {/* Header */}
      <div style={{ position:'sticky', top:0, zIndex:20, display:'flex', alignItems:'center', padding:'14px 16px', background:'rgba(255,255,255,0.94)', backdropFilter:'blur(12px)', borderBottom:`1px solid ${border}` }}>
        <Link href="/village/trading-post" style={{ color:'var(--v-success)', fontWeight:800, fontSize:14, textDecoration:'none', display:'flex', alignItems:'center', gap:4 }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg> Post
        </Link>
        <p style={{ flex:1, textAlign:'center', fontSize:17, fontWeight:900, color:text }}>Tribe</p>
        <button style={{ fontSize:12, fontWeight:900, color:'var(--v-success)', background:'var(--v-success-light)', borderRadius:20, padding:'6px 14px', border:'none', cursor:'pointer' }}>
          + Invite
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, padding:'12px 16px', borderBottom:`1px solid ${border}` }}>
        {[
          { value: connections.length, label:'Connections', color:text, onClick: undefined },
          { value: 3, label:'New this week', color:'var(--v-success)', onClick: undefined },
          { value: pendingReqs.length, label:'Pending', color:'var(--v-gold)', onClick: () => setShowPending(true) },
        ].map(s => (
          <div
            key={s.label}
            onClick={s.onClick}
            style={{ background:'var(--v-bg-2)', borderRadius:10, padding:'10px 8px', textAlign:'center', cursor: s.onClick ? 'pointer' : 'default', position:'relative' }}
          >
            <p style={{ fontSize:18, fontWeight:900, color:s.color, margin:0 }}>{s.value}</p>
            <p style={{ fontSize:9, color:sub, margin:0, letterSpacing:'0.04em' }}>{s.label.toUpperCase()}</p>
            {s.label === 'Pending' && pendingReqs.length > 0 && (
              <span style={{ position:'absolute', top:6, right:6, width:8, height:8, borderRadius:4, background:'var(--v-gold)' }} />
            )}
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
                <Link href={`/village/trading-post/tribe/${c.id ?? c.from_user_id ?? 'unknown'}`} style={{ textDecoration:'none', flexShrink:0 }}>
                  <Avatar name={name} />
                </Link>
                <div style={{ flex:1, minWidth:0 }}>
                  <Link href={`/village/trading-post/tribe/${c.id ?? 'unknown'}`} style={{ textDecoration:'none' }}>
                    <p style={{ fontSize:13, fontWeight:700, color:text, margin:'0 0 2px' }}>{name}</p>
                  </Link>
                  <p style={{ fontSize:10, color:muted, margin:'0 0 4px', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>{context}</p>
                  <span className={`pill ${ROLE_PILL[role]??'pill-blue'}`} style={{fontSize:9,textTransform:'capitalize'}}>{role}</span>
                </div>
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

      {/* Pending requests panel */}
      <AnimatePresence>
        {showPending && (
          <PendingPanel
            requests={pendingReqs}
            onAccept={acceptRequest}
            onDecline={declineRequest}
            onClose={() => setShowPending(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
