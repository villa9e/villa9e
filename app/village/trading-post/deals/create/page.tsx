'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const SECTIONS = [
  { key:'header',    label:'Header',           desc:'Deal name and hook' },
  { key:'snapshot',  label:'Snapshot',         desc:'Industry, type, raise, timeline' },
  { key:'pitch',     label:'Elevator pitch',   desc:'3–5 sentences' },
  { key:'financials',label:'Financials',       desc:'ROI, IRR, unit economics' },
  { key:'team',      label:'Team',             desc:'People and equity' },
  { key:'market',    label:'Market',           desc:'TAM, moat, traction' },
  { key:'risk',      label:'Risk & exit',      desc:'Downside, exits, timeline' },
  { key:'terms',     label:'Deal terms',       desc:'Valuation, structure, minimums' },
];

export default function CreateDealPage() {
  const supabase = createClient();
  const router = useRouter();
  const [step, setStep]       = useState(0);
  const [saving, setSaving]   = useState(false);
  const [published, setPublished] = useState(false);
  const [form, setForm] = useState({
    name:'', hook:'',
    industry:'', deal_type:'', seeking:'', raise_amount:'', deal_length:'',
    elevator_pitch:'',
    projected_roi:'', irr:'', annual_yield:'', unit_economics:'', financial_model_url:'',
    founder_equity:'', founder_investment:'',
    tam:'', competitive_moat:'', customer_traction:'', market_report_url:'',
    downside_protection:'', primary_exit:'', secondary_exit:'', exit_timeline:'',
    valuation:'', structure:'', min_investment:'', legal_protections:'',
  });

  const card  = 'var(--v-card-bg)';
  const border= 'var(--v-card-border)';
  const text  = 'var(--v-text)';
  const muted = 'var(--v-text-muted)';
  const sub   = 'var(--v-text-sub)';

  function Field({ label, k, placeholder, area=false, hint='' }: { label:string; k:keyof typeof form; placeholder:string; area?:boolean; hint?:string }) {
    return (
      <div style={{ marginBottom:14 }}>
        <p style={{ fontSize:11, fontWeight:700, color:muted, marginBottom:4 }}>{label}</p>
        {area ? (
          <textarea value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} placeholder={placeholder} rows={4}
            style={{ width:'100%', background:'var(--v-bg-2)', border:`1px solid ${border}`, borderRadius:12, padding:'10px 14px', fontSize:13, color:text, resize:'none', outline:'none', fontFamily:'inherit', boxSizing:'border-box' }} />
        ) : (
          <input value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} placeholder={placeholder}
            style={{ width:'100%', background:'var(--v-bg-2)', border:`1px solid ${border}`, borderRadius:12, padding:'10px 14px', fontSize:13, color:text, outline:'none', boxSizing:'border-box' }} />
        )}
        {hint && <p style={{ fontSize:10, color:sub, marginTop:4 }}>{hint}</p>}
      </div>
    );
  }

  async function publish() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    await (supabase as any).from('investor_deals').insert({
      user_id: user.id,
      name: form.name,
      hook: form.hook,
      industry: form.industry,
      deal_type: form.deal_type,
      seeking: form.seeking,
      raise_amount: parseFloat(form.raise_amount) || 0,
      deal_length: form.deal_length,
      elevator_pitch: form.elevator_pitch,
      projected_roi: form.projected_roi,
      irr: form.irr,
      annual_yield: form.annual_yield,
      unit_economics: form.unit_economics,
      financial_model_url: form.financial_model_url,
      founder_equity: form.founder_equity,
      founder_investment: form.founder_investment,
      tam: form.tam,
      competitive_moat: form.competitive_moat,
      customer_traction: form.customer_traction,
      downside_protection: form.downside_protection,
      primary_exit: form.primary_exit,
      secondary_exit: form.secondary_exit,
      exit_timeline: form.exit_timeline,
      valuation: form.valuation,
      structure: form.structure,
      min_investment: parseFloat(form.min_investment) || 0,
      legal_protections: form.legal_protections,
      status: 'active',
    });
    setPublished(true);
    setSaving(false);
  }

  const STEP_FIELDS: Record<string, React.ReactNode> = {
    header: <><Field label="Deal name" k="name" placeholder="e.g. Meridian Solar Grid" /><Field label="One-liner hook" k="hook" placeholder="What makes this deal impossible to ignore?" hint="100 characters max — the first thing investors read" /></>,
    snapshot: (
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        {[['Industry','industry','e.g. Energy'],['Deal type','deal_type','Equity, Debt, Revenue share'],['Seeking','seeking','LP, Accredited, Family office'],['Raise amount','raise_amount','e.g. 2500000'],].map(([l,k,p])=>(
          <div key={k} style={{ marginBottom:0 }}>
            <p style={{ fontSize:11, fontWeight:700, color:muted, marginBottom:4 }}>{l}</p>
            <input value={(form as any)[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} placeholder={p}
              style={{ width:'100%', background:'var(--v-bg-2)', border:`1px solid ${border}`, borderRadius:12, padding:'10px 12px', fontSize:12, color:text, outline:'none', boxSizing:'border-box' }} />
          </div>
        ))}
        <div style={{ gridColumn:'1/-1' }}>
          <p style={{ fontSize:11, fontWeight:700, color:muted, marginBottom:4 }}>Deal length</p>
          <input value={form.deal_length} onChange={e=>setForm(f=>({...f,deal_length:e.target.value}))} placeholder="e.g. 7 years"
            style={{ width:'100%', background:'var(--v-bg-2)', border:`1px solid ${border}`, borderRadius:12, padding:'10px 14px', fontSize:13, color:text, outline:'none', boxSizing:'border-box' }} />
        </div>
      </div>
    ),
    pitch: <Field label="Elevator pitch" k="elevator_pitch" placeholder="What is this, why does it work, why now, why is your team the one to do it? (3–5 sentences)" area hint="Shown on the swipe card — write for a 5-second read" />,
    financials: <><Field label="Projected ROI" k="projected_roi" placeholder="e.g. 2.4x over 7 years" /><Field label="IRR" k="irr" placeholder="e.g. 14%" /><Field label="Annual cash yield" k="annual_yield" placeholder="e.g. 8% beginning Year 2" /><Field label="Unit economics" k="unit_economics" placeholder="How does each unit / transaction / service make money?" area /><Field label="Financial model link" k="financial_model_url" placeholder="https://" hint="Paste a public link to your spreadsheet" /></>,
    team: <><Field label="Founder equity %" k="founder_equity" placeholder="e.g. 45%" /><Field label="Personal investment committed" k="founder_investment" placeholder="e.g. $250,000" /></>,
    market: <><Field label="Total addressable market (TAM)" k="tam" placeholder="e.g. $40B annual spend in US logistics" /><Field label="Competitive moat" k="competitive_moat" placeholder="The specific unfair advantage that keeps competitors out" area /><Field label="Customer traction" k="customer_traction" placeholder="Users, revenue, growth rate, contracts, pre-sales" area /></>,
    risk: <><Field label="Downside protection" k="downside_protection" placeholder="What protects investor capital if the deal underperforms?" area /><Field label="Primary exit" k="primary_exit" placeholder="e.g. Asset sale at Year 7" /><Field label="Secondary exit" k="secondary_exit" placeholder="e.g. Strategic acquisition" /><Field label="Timeline" k="exit_timeline" placeholder="e.g. 5–8 years" /></>,
    terms: <><Field label="Valuation" k="valuation" placeholder="e.g. $8M pre-money, based on 2.4x revenue" /><Field label="Structure" k="structure" placeholder="Preferred equity, convertible note, revenue share..." /><Field label="Minimum investment" k="min_investment" placeholder="e.g. 25000" /><Field label="Legal protections" k="legal_protections" placeholder="Liquidation preferences, anti-dilution, board rights..." area /></>,
  };

  if (published) {
    return (
      <div style={{ minHeight:'100vh', background:'var(--v-bg)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24, textAlign:'center' }}>
        <p style={{ fontSize:48, marginBottom:12 }}>🚀</p>
        <p style={{ fontSize:22, fontWeight:900, color:text, marginBottom:8 }}>Deal is live</p>
        <p style={{ fontSize:13, color:muted, marginBottom:24 }}>Investors who match your criteria will start seeing it in their feed.</p>
        <Link href="/village/trading-post/deals" style={{ background:'var(--v-brand)', color:'#fff', borderRadius:14, padding:'14px 32px', fontSize:14, fontWeight:900, textDecoration:'none' }}>
          View Deals Feed
        </Link>
      </div>
    );
  }

  const current = SECTIONS[step];

  return (
    <div style={{ minHeight:'100vh', background:'var(--v-bg)', paddingBottom:90 }}>
      {/* Header */}
      <div style={{ position:'sticky', top:0, zIndex:20, display:'flex', alignItems:'center', padding:'14px 16px', background:'rgba(255,255,255,0.94)', backdropFilter:'blur(12px)', borderBottom:`1px solid ${border}` }}>
        <Link href="/village/trading-post/deals" style={{ color:'var(--v-brand)', fontWeight:800, fontSize:14, textDecoration:'none', display:'flex', alignItems:'center', gap:4 }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg> Deals
        </Link>
        <p style={{ flex:1, textAlign:'center', fontSize:17, fontWeight:900, color:text }}>List a Deal</p>
        <button onClick={()=>{}} style={{ fontSize:12, fontWeight:700, color:'var(--v-brand)', background:'none', border:'none', cursor:'pointer' }}>Save</button>
      </div>

      {/* Progress */}
      <div style={{ display:'flex', padding:'12px 16px', gap:4, overflowX:'auto', borderBottom:`1px solid ${border}` }}>
        {SECTIONS.map((s,i)=>(
          <button key={s.key} onClick={()=>setStep(i)}
            style={{ flexShrink:0, padding:'5px 10px', borderRadius:20, border:'none', background:step===i?'var(--v-brand)':i<step?'var(--v-success-light)':'var(--v-bg-2)', color:step===i?'#fff':i<step?'var(--v-success)':muted, fontSize:10, fontWeight:900, cursor:'pointer' }}>
            {i<step?'✓ ':''}{s.label}
          </button>
        ))}
      </div>

      <div style={{ padding:'20px 16px' }}>
        <p style={{ fontSize:18, fontWeight:900, color:text, marginBottom:4 }}>{current.label}</p>
        <p style={{ fontSize:12, color:muted, marginBottom:20 }}>{current.desc}</p>

        {STEP_FIELDS[current.key]}

        <div style={{ display:'flex', gap:10, marginTop:24 }}>
          {step > 0 && (
            <button onClick={()=>setStep(s=>s-1)} style={{ flex:1, padding:'13px', border:`1px solid ${border}`, borderRadius:14, background:'transparent', color:muted, fontSize:14, fontWeight:700, cursor:'pointer' }}>
              Back
            </button>
          )}
          {step < SECTIONS.length - 1 ? (
            <button onClick={()=>setStep(s=>s+1)} style={{ flex:2, padding:'13px', border:'none', borderRadius:14, background:'var(--v-brand)', color:'#fff', fontSize:14, fontWeight:900, cursor:'pointer' }}>
              Next →
            </button>
          ) : (
            <button onClick={publish} disabled={saving||!form.name||!form.hook} style={{ flex:2, padding:'13px', border:'none', borderRadius:14, background:form.name&&form.hook?'var(--v-brand)':'var(--v-bg-3)', color:'#fff', fontSize:14, fontWeight:900, cursor:form.name&&form.hook?'pointer':'not-allowed' }}>
              {saving ? 'Publishing…' : '🚀 Publish Deal'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
