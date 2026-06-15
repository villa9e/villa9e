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

// ── Pending Requests Panel ────────────────────────────────────────────────────
interface PendingRequest {
  id: string;
  requester_id: string;
  display_name: string;
  role: string;
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
                    <span className={`pill ${ROLE_PILL[req.role.toLowerCase()]??'pill-blue'}`} style={{ fontSize:9, textTransform:'capitalize' }}>{req.role}</span>
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
  const [pendingReqs, setPendingReqs]   = useState<PendingRequest[]>([]);
  const [showPending, setShowPending]   = useState(false);
  const [suggestions, setSuggestions]   = useState<any[]>([]);
  const [newThisWeek, setNewThisWeek]   = useState(0);

  const bg    = 'var(--v-bg)';
  const card  = 'var(--v-card-bg)';
  const border= 'var(--v-card-border)';
  const text  = 'var(--v-text)';
  const muted = 'var(--v-text-muted)';
  const sub   = 'var(--v-text-sub)';

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // Load accepted connections (either direction)
      const { data: conns } = await (supabase as any)
        .from('connections')
        .select('id,requester_id,addressee_id,created_at,requester:profiles!connections_requester_id_fkey(id,username,display_name,occupation,personality_type),addressee:profiles!connections_addressee_id_fkey(id,username,display_name,occupation,personality_type)')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq('pending', false)
        .order('created_at', { ascending: false })
        .limit(30);

      const connList = (conns ?? []).map((c: any) => {
        const isRequester = c.requester_id === user.id;
        const other = isRequester ? c.addressee : c.requester;
        return {
          id: c.id,
          userId: isRequester ? c.addressee_id : c.requester_id,
          display_name: other?.display_name ?? other?.username ?? 'Villager',
          role: other?.occupation ?? other?.personality_type ?? 'member',
          created_at: c.created_at,
        };
      });
      setConnections(connList);

      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      setNewThisWeek(connList.filter((c: any) => new Date(c.created_at).getTime() >= weekAgo).length);

      // Load pending incoming requests
      const { data: reqs } = await (supabase as any)
        .from('connections')
        .select('id,requester_id,requester:profiles!connections_requester_id_fkey(username,display_name,occupation)')
        .eq('addressee_id', user.id)
        .eq('pending', true);
      setPendingReqs((reqs ?? []).map((r: any) => ({
        id: r.id,
        requester_id: r.requester_id,
        display_name: r.requester?.display_name ?? r.requester?.username ?? 'Villager',
        role: r.requester?.occupation ?? 'member',
      })));

      // Suggestions: villagers not yet connected or pending
      const exclude = new Set<string>([user.id, ...connList.map((c: any) => c.userId), ...(reqs ?? []).map((r: any) => r.requester_id)]);
      const { data: sugg } = await (supabase as any)
        .from('profiles')
        .select('id,username,display_name,occupation')
        .neq('id', user.id)
        .order('created_at', { ascending: false })
        .limit(15);
      setSuggestions((sugg ?? []).filter((p: any) => !exclude.has(p.id)).slice(0, 5));
    })();
  }, []);

  async function connect(id:string) {
    setSending(id);
    await (supabase as any).from('connections').insert({ requester_id: userId, addressee_id: id, pending: true }).catch(()=>{});
    setSent(s => new Set([...s, id]));
    setSending(null);
  }

  async function acceptRequest(req: PendingRequest) {
    await (supabase as any).from('connections').update({ pending: false }).eq('id', req.id).catch(()=>{});
    setPendingReqs(r => r.filter(x => x.id !== req.id));
    setConnections(c => [...c, { id: req.id, userId: req.requester_id, display_name: req.display_name, role: req.role, created_at: new Date().toISOString() }]);
  }

  async function declineRequest(req: PendingRequest) {
    await (supabase as any).from('connections').delete().eq('id', req.id).catch(()=>{});
    setPendingReqs(r => r.filter(x => x.id !== req.id));
  }

  const filtered = filter === 'All' ? connections : connections.filter((c:any) => {
    const role = c.role ?? '';
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
          { value: newThisWeek, label:'New this week', color:'var(--v-success)', onClick: undefined },
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
              <p style={{ fontSize:13 }}>{connections.length === 0 ? 'No connections yet.' : 'No connections in this category yet.'}</p>
            </div>
          ) : filtered.map((c:any, i:number) => {
            const name = c.display_name ?? 'Villager';
            const role = c.role ?? 'member';
            return (
              <div key={c.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderBottom: i < filtered.length-1 ? `1px solid ${border}` : 'none' }}>
                <Link href={`/village/trading-post/tribe/${c.userId}`} style={{ textDecoration:'none', flexShrink:0 }}>
                  <Avatar name={name} />
                </Link>
                <div style={{ flex:1, minWidth:0 }}>
                  <Link href={`/village/trading-post/tribe/${c.userId}`} style={{ textDecoration:'none' }}>
                    <p style={{ fontSize:13, fontWeight:700, color:text, margin:'0 0 2px' }}>{name}</p>
                  </Link>
                  <span className={`pill ${ROLE_PILL[role.toLowerCase()]??'pill-blue'}`} style={{fontSize:9,textTransform:'capitalize'}}>{role}</span>
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  <Link href="/village/trading-post/office" style={{ width:32, height:32, borderRadius:16, background:'var(--v-gold-light)', display:'flex', alignItems:'center', justifyContent:'center', textDecoration:'none' }}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--v-gold)" strokeWidth={2} strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Suggestions */}
        <p style={{ fontSize:10, fontWeight:900, color:sub, letterSpacing:'0.06em', marginBottom:10 }}>PEOPLE YOU MAY KNOW</p>
        <div style={{ background:card, border:`1px solid ${border}`, borderRadius:14, overflow:'hidden' }}>
          {suggestions.length === 0 ? (
            <div style={{ padding:'24px 16px', textAlign:'center', color:muted }}>
              <p style={{ fontSize:13 }}>No suggestions right now.</p>
            </div>
          ) : suggestions.map((s,i) => {
            const name = s.display_name ?? s.username ?? 'Villager';
            return (
              <div key={s.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderBottom: i < suggestions.length-1 ? `1px solid ${border}` : 'none' }}>
                <Avatar name={name} />
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:13, fontWeight:700, color:text, margin:'0 0 2px' }}>{name}</p>
                  {s.occupation && <p style={{ fontSize:10, color:muted, margin:0 }}>{s.occupation}</p>}
                </div>
                <button onClick={()=>connect(s.id)} disabled={sending===s.id||sent.has(s.id)}
                  style={{ padding:'6px 14px', borderRadius:20, border:`1px solid var(--v-gold)`, background:sent.has(s.id)?'var(--v-gold)':'transparent', color:sent.has(s.id)?'#fff':'var(--v-gold)', fontSize:11, fontWeight:900, cursor:'pointer' }}>
                  {sent.has(s.id) ? 'Sent' : sending===s.id ? '...' : 'Connect'}
                </button>
              </div>
            );
          })}
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
