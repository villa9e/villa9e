'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { BankBottomNav } from '@/components/bank/BankBottomNav';

const B = {
  day:   { bg:'#F2F7FA', card:'#FFFFFF', border:'#C8DCE8', text:'#0A1F2E', textSec:'#3A5A6E', textTer:'#7A9AAE', action:'#0A5F8A' },
  night: { bg:'#060F18', card:'#0E1E2E', border:'#1A3040', text:'#EEF4F8', textSec:'#8EB4CC', textTer:'#4A7A96', action:'#2A9FCC' },
};

type Fund = { id:string; name:string; focus:string|null; creator_id:string; created_at:string };
type Member = { user_id:string; role:string; profiles?: { display_name?:string; username?:string } | null };
type Contribution = { amount:number; created_at:string };

export default function VillageFundPage() {
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';
  const c = isNight ? B.night : B.day;
  const supabase = createClient();

  const [userId, setUserId] = useState('');
  const [fund, setFund] = useState<Fund | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [fundName, setFundName] = useState('');
  const [fundFocus, setFundFocus] = useState('');
  const [creating, setCreating] = useState(false);

  const [showContribute, setShowContribute] = useState(false);
  const [contribAmount, setContribAmount] = useState('');
  const [contributing, setContributing] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);

      const { data: membership } = await (supabase as any)
        .from('village_fund_members')
        .select('fund_id, role, village_funds(id,name,focus,creator_id,created_at)')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      const f = membership?.village_funds as Fund | undefined;
      if (f) {
        setFund(f);

        const { data: memberRows } = await (supabase as any)
          .from('village_fund_members')
          .select('user_id, role, profiles(display_name, username)')
          .eq('fund_id', f.id);
        setMembers(memberRows ?? []);

        const { data: contribRows } = await (supabase as any)
          .from('village_fund_contributions')
          .select('amount, created_at')
          .eq('fund_id', f.id)
          .order('created_at', { ascending: true });
        setContributions(contribRows ?? []);
      }

      setLoading(false);
    })();
  }, []);

  async function createFund() {
    if (!fundName.trim() || !userId || creating) return;
    setCreating(true);
    const { data: f } = await (supabase as any)
      .from('village_funds')
      .insert({ creator_id: userId, name: fundName.trim(), focus: fundFocus.trim() || null })
      .select()
      .single();

    if (f) {
      await (supabase as any).from('village_fund_members').insert({ fund_id: f.id, user_id: userId, role: 'creator' });
      setFund(f);
      setMembers([{ user_id: userId, role: 'creator', profiles: null }]);
      setContributions([]);
    }
    setCreating(false);
    setShowCreate(false);
    setFundName('');
    setFundFocus('');
  }

  async function contribute() {
    if (!fund || !userId || contributing) return;
    const amt = parseFloat(contribAmount);
    if (!amt || amt <= 0) return;
    setContributing(true);
    const { data: row } = await (supabase as any)
      .from('village_fund_contributions')
      .insert({ fund_id: fund.id, user_id: userId, amount: amt })
      .select()
      .single();
    if (row) setContributions(prev => [...prev, row]);
    setContributing(false);
    setShowContribute(false);
    setContribAmount('');
  }

  const total = contributions.reduce((sum, row) => sum + Number(row.amount), 0);
  const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0);
  const thisMonth = contributions.filter(r => new Date(r.created_at) >= startOfMonth).reduce((s,r)=>s+Number(r.amount),0);

  const cumulative: number[] = [];
  let running = 0;
  for (const row of contributions) { running += Number(row.amount); cumulative.push(running); }
  const sparkPoints = cumulative.slice(-20);

  const sparkH = 36;
  const sparkW = 140;
  const max = Math.max(...sparkPoints, 1);
  const pts = sparkPoints.map((v,i)=>`${(i/Math.max(sparkPoints.length-1,1))*sparkW},${sparkH-(v/max)*sparkH}`).join(' ');

  const avatarColors = ['#2952E8','#1D9E75','#C48A20','#D4537E','#7C3AED','#0033CC'];

  if (loading) {
    return (
      <div style={{ background:c.bg, minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ width:32, height:32, border:`3px solid ${c.action}`, borderTopColor:'transparent', borderRadius:16, animation:'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ background:c.bg, minHeight:'100vh', maxWidth:480, margin:'0 auto', paddingBottom:88 }}>
      {/* Top bar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px 12px', background:c.card, borderBottom:`1px solid ${c.border}` }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <Link href="/village/bank" style={{ color:c.action, lineHeight:0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </Link>
          <span style={{ fontWeight:800, fontSize:17, color:c.text }}>Village Fund</span>
        </div>
        {fund && (
          <button onClick={()=>setShowContribute(true)} style={{ width:32, height:32, borderRadius:'50%', background:c.action, border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
          </button>
        )}
      </div>

      <div style={{ padding:16 }}>
        {/* Compliance banner */}
        <div style={{ background:'#EAF3DE', border:'1px solid #639922', borderRadius:12, padding:'10px 14px', marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#27500A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop:1, flexShrink:0 }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <div>
              <p style={{ fontSize:11, color:'#27500A', margin:'0 0 4px', fontWeight:700 }}>Compliance Notice</p>
              <p style={{ fontSize:11, color:'#27500A', margin:0, lineHeight:1.5 }}>
                Village Funds are member-pooled contributions tracked on the platform. They are not registered investment vehicles or securities.
                Treat a Village Fund as a shared savings pool among people you trust until formal legal structuring is available.
              </p>
            </div>
          </div>
        </div>

        {fund ? (
          <>
            {/* Portfolio summary */}
            <div style={{ background:'#0A5F8A', borderRadius:20, padding:20, marginBottom:16, position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', top:-30, right:-30, width:130, height:130, borderRadius:'50%', background:'rgba(255,255,255,0.06)', pointerEvents:'none' }}/>
              <p style={{ color:'rgba(255,255,255,0.7)', fontSize:11, fontWeight:600, letterSpacing:0.8, textTransform:'uppercase', marginBottom:4, position:'relative' }}>Total Pooled</p>
              <p style={{ color:'#fff', fontSize:32, fontWeight:800, letterSpacing:-1, margin:'0 0 4px', position:'relative' }}>${total.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</p>
              <p style={{ color:'rgba(255,255,255,0.8)', fontSize:13, position:'relative' }}>
                <span style={{ color:'#7FFFD4', fontWeight:700 }}>+${thisMonth.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</span> this month
              </p>
              <div style={{ display:'flex', gap:20, marginTop:12, position:'relative' }}>
                <div><p style={{ color:'rgba(255,255,255,0.6)', fontSize:11, margin:0 }}>Active Funds</p><p style={{ color:'#fff', fontSize:16, fontWeight:700, margin:0 }}>1</p></div>
                <div><p style={{ color:'rgba(255,255,255,0.6)', fontSize:11, margin:0 }}>Members</p><p style={{ color:'#fff', fontSize:16, fontWeight:700, margin:0 }}>{members.length}</p></div>
                <div><p style={{ color:'rgba(255,255,255,0.6)', fontSize:11, margin:0 }}>Contributions</p><p style={{ color:'#7FFFD4', fontSize:16, fontWeight:700, margin:0 }}>{contributions.length}</p></div>
              </div>
            </div>

            {/* Fund card */}
            <div style={{ background:c.card, border:`1px solid ${c.border}`, borderRadius:18, padding:16, marginBottom:16, overflow:'hidden' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                <div>
                  <p style={{ fontSize:15, fontWeight:800, color:c.text, margin:0 }}>{fund.name}</p>
                  {fund.focus && <p style={{ fontSize:11, color:c.textTer, margin:'3px 0 0' }}>{fund.focus}</p>}
                </div>
                <span style={{ fontSize:11, fontWeight:700, background:isNight?'#0D2A1E':'#ECFDF5', color:'#0F6E56', borderRadius:20, padding:'3px 10px' }}>Active</span>
              </div>

              {/* Member avatars */}
              <div style={{ display:'flex', alignItems:'center', gap:0, marginBottom:14 }}>
                {members.map((m,i)=>{
                  const label = m.profiles?.display_name || m.profiles?.username || 'V';
                  const color = avatarColors[label.charCodeAt(0) % avatarColors.length];
                  return (
                    <div key={m.user_id} style={{ width:32, height:32, borderRadius:'50%', background:color, border:`2px solid ${c.card}`, marginLeft:i>0?-8:0, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:10, fontWeight:700, zIndex:members.length-i }}>
                      {label.slice(0,2).toUpperCase()}
                    </div>
                  );
                })}
                <span style={{ fontSize:12, color:c.textSec, marginLeft:10 }}>{members.length} member{members.length!==1?'s':''}</span>
              </div>

              {/* Sparkline */}
              {sparkPoints.length >= 2 && (
                <div style={{ marginBottom:14 }}>
                  <svg viewBox={`0 0 ${sparkW} ${sparkH}`} width="100%" height={sparkH} preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="fundGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={c.action} stopOpacity="0.3"/>
                        <stop offset="100%" stopColor={c.action} stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                    <polygon points={`0,${sparkH} ${pts} ${sparkW},${sparkH}`} fill="url(#fundGrad)"/>
                    <polyline points={pts} fill="none" stroke={c.action} strokeWidth="1.5" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}

              {/* Actions */}
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={()=>setShowContribute(true)} style={{ flex:1, padding:'10px 0', borderRadius:10, border:'none', background:c.action, color:'#fff', fontSize:11, fontWeight:700, cursor:'pointer' }}>
                  Contribute
                </button>
                <button disabled title="Coming soon" style={{ flex:1, padding:'10px 0', borderRadius:10, border:`1px solid ${c.border}`, background:'transparent', color:c.textTer, fontSize:11, fontWeight:700, cursor:'not-allowed' }}>
                  Vote
                </button>
                <button disabled title="Coming soon" style={{ flex:1, padding:'10px 0', borderRadius:10, border:`1px solid ${c.border}`, background:'transparent', color:c.textTer, fontSize:11, fontWeight:700, cursor:'not-allowed' }}>
                  Distributions
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ background:c.card, border:`1px solid ${c.border}`, borderRadius:18, padding:'28px 20px', marginBottom:16, textAlign:'center' }}>
            <p style={{ fontSize:14, fontWeight:800, color:c.text, margin:'0 0 6px' }}>No Village Fund yet</p>
            <p style={{ fontSize:12, color:c.textSec, margin:'0 0 0', lineHeight:1.6 }}>
              Create a pooled fund to save and contribute toward shared goals with people in your tribe.
            </p>
          </div>
        )}

        {/* Create fund CTA */}
        {!fund && (
          <button onClick={()=>setShowCreate(true)} style={{ width:'100%', border:`2px dashed ${c.border}`, borderRadius:16, padding:'18px 0', background:'transparent', color:c.action, fontSize:14, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            Create a Village Fund
          </button>
        )}
      </div>

      {/* Create fund modal */}
      {showCreate && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', padding:20, zIndex:50 }}>
          <div style={{ background:c.card, borderRadius:18, padding:20, width:'100%', maxWidth:360 }}>
            <p style={{ fontSize:15, fontWeight:800, color:c.text, margin:'0 0 14px' }}>Create a Village Fund</p>
            <input value={fundName} onChange={e=>setFundName(e.target.value)} placeholder="Fund name"
              style={{ width:'100%', boxSizing:'border-box', padding:'10px 12px', borderRadius:10, border:`1px solid ${c.border}`, background:'transparent', color:c.text, fontSize:13, marginBottom:10, outline:'none' }} />
            <input value={fundFocus} onChange={e=>setFundFocus(e.target.value)} placeholder="Focus (optional, e.g. Real Estate)"
              style={{ width:'100%', boxSizing:'border-box', padding:'10px 12px', borderRadius:10, border:`1px solid ${c.border}`, background:'transparent', color:c.text, fontSize:13, marginBottom:14, outline:'none' }} />
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={()=>setShowCreate(false)} style={{ flex:1, padding:'10px 0', borderRadius:10, border:`1px solid ${c.border}`, background:'transparent', color:c.textSec, fontSize:13, fontWeight:700, cursor:'pointer' }}>Cancel</button>
              <button onClick={createFund} disabled={!fundName.trim() || creating} style={{ flex:1, padding:'10px 0', borderRadius:10, border:'none', background:c.action, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', opacity:(!fundName.trim()||creating)?0.6:1 }}>
                {creating ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contribute modal */}
      {showContribute && fund && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', padding:20, zIndex:50 }}>
          <div style={{ background:c.card, borderRadius:18, padding:20, width:'100%', maxWidth:360 }}>
            <p style={{ fontSize:15, fontWeight:800, color:c.text, margin:'0 0 14px' }}>Contribute to {fund.name}</p>
            <input value={contribAmount} onChange={e=>setContribAmount(e.target.value)} placeholder="Amount (USD)" type="number" min="0" step="0.01"
              style={{ width:'100%', boxSizing:'border-box', padding:'10px 12px', borderRadius:10, border:`1px solid ${c.border}`, background:'transparent', color:c.text, fontSize:13, marginBottom:14, outline:'none' }} />
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={()=>{ setShowContribute(false); setContribAmount(''); }} style={{ flex:1, padding:'10px 0', borderRadius:10, border:`1px solid ${c.border}`, background:'transparent', color:c.textSec, fontSize:13, fontWeight:700, cursor:'pointer' }}>Cancel</button>
              <button onClick={contribute} disabled={!contribAmount || parseFloat(contribAmount)<=0 || contributing} style={{ flex:1, padding:'10px 0', borderRadius:10, border:'none', background:c.action, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', opacity:(!contribAmount||parseFloat(contribAmount)<=0||contributing)?0.6:1 }}>
                {contributing ? 'Saving…' : 'Contribute'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BankBottomNav active="/village/bank/village-fund"/>
    </div>
  );
}
