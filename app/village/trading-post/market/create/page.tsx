'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const PRODUCT_TYPES = [
  { id:'courses',  icon:'🎓', label:'Courses',   desc:'Video / LMS content' },
  { id:'coaching', icon:'📆', label:'Coaching',   desc:'Sessions and retainers' },
  { id:'service',  icon:'💼', label:'Services',   desc:'Professional work' },
  { id:'product',  icon:'📦', label:'Products',   desc:'Physical items' },
  { id:'gig',      icon:'🔧', label:'Gigs',       desc:'Task-based work' },
  { id:'ticket',   icon:'🎟', label:'Tickets',    desc:'Events and experiences' },
];

export default function CreateStorePage() {
  const supabase = createClient();
  const router = useRouter();
  const [form, setForm]     = useState({ store_name:'', tagline:'', about:'' });
  const [types, setTypes]   = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [done, setDone]     = useState(false);

  const card  = 'var(--v-card-bg)';
  const border= 'var(--v-card-border)';
  const text  = 'var(--v-text)';
  const muted = 'var(--v-text-muted)';
  const sub   = 'var(--v-text-sub)';

  function toggleType(id:string) {
    setTypes(ts => ts.includes(id) ? ts.filter(t=>t!==id) : [...ts,id]);
  }

  async function publish() {
    if (!form.store_name.trim()) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    await (supabase as any).from('estores').upsert({
      user_id: user.id,
      store_name: form.store_name,
      tagline: form.tagline,
      about: form.about,
      product_types: types,
      status: 'active',
    }, { onConflict: 'user_id' });
    setDone(true);
    setSaving(false);
  }

  if (done) {
    return (
      <div style={{ minHeight:'100vh', background:'var(--v-bg)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24, textAlign:'center' }}>
        <p style={{ fontSize:48, marginBottom:12 }}>🏪</p>
        <p style={{ fontSize:22, fontWeight:900, color:text, marginBottom:8 }}>Store is live</p>
        <p style={{ fontSize:13, color:muted, marginBottom:24 }}>Your store is now visible in the Market.</p>
        <Link href="/village/trading-post/market" style={{ background:'var(--v-gold)', color:'#fff', borderRadius:14, padding:'14px 32px', fontSize:14, fontWeight:900, textDecoration:'none' }}>
          View Market
        </Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--v-bg)', paddingBottom:90 }}>
      {/* Header */}
      <div style={{ position:'sticky', top:0, zIndex:20, display:'flex', alignItems:'center', padding:'14px 16px', background:'rgba(255,255,255,0.94)', backdropFilter:'blur(12px)', borderBottom:`1px solid ${border}` }}>
        <Link href="/village/trading-post/market" style={{ color:'var(--v-gold)', fontWeight:800, fontSize:14, textDecoration:'none', display:'flex', alignItems:'center', gap:4 }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg> Market
        </Link>
        <p style={{ flex:1, textAlign:'center', fontSize:17, fontWeight:900, color:text }}>Create Store</p>
        <span style={{ fontSize:12, fontWeight:700, color:'var(--v-gold)' }}>Save</span>
      </div>

      <div style={{ padding:'20px 16px' }}>
        {/* Store identity */}
        <p style={{ fontSize:12, fontWeight:900, color:sub, letterSpacing:'0.06em', marginBottom:14 }}>STORE IDENTITY</p>

        {/* Banner */}
        <div style={{ height:60, background:'var(--v-bg-3)', border:`1px dashed ${border}`, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14, cursor:'pointer' }}>
          <p style={{ fontSize:12, color:sub }}>📸 Store banner image</p>
        </div>

        {[
          { label:'Store name', k:'store_name', placeholder:'e.g. The Growth Lab', hint:'' },
          { label:'Tagline', k:'tagline', placeholder:'One line describing what you offer', hint:'80 characters max' },
        ].map(f=>(
          <div key={f.k} style={{ marginBottom:14 }}>
            <p style={{ fontSize:11, fontWeight:700, color:muted, marginBottom:4 }}>{f.label}</p>
            <input value={(form as any)[f.k]} onChange={e=>setForm(fm=>({...fm,[f.k]:e.target.value}))} placeholder={f.placeholder}
              style={{ width:'100%', background:'var(--v-bg-2)', border:`1px solid ${border}`, borderRadius:12, padding:'10px 14px', fontSize:13, color:text, outline:'none', boxSizing:'border-box' }} />
            {f.hint && <p style={{ fontSize:10, color:sub, marginTop:3 }}>{f.hint}</p>}
          </div>
        ))}

        <div style={{ marginBottom:20 }}>
          <p style={{ fontSize:11, fontWeight:700, color:muted, marginBottom:4 }}>About</p>
          <textarea value={form.about} onChange={e=>setForm(f=>({...f,about:e.target.value}))} placeholder="Your background, expertise, and what makes you the right person to buy from" rows={4}
            style={{ width:'100%', background:'var(--v-bg-2)', border:`1px solid ${border}`, borderRadius:12, padding:'10px 14px', fontSize:13, color:text, resize:'none', outline:'none', fontFamily:'inherit', boxSizing:'border-box' }} />
        </div>

        {/* Product types */}
        <p style={{ fontSize:12, fontWeight:900, color:sub, letterSpacing:'0.06em', marginBottom:14 }}>WHAT ARE YOU SELLING?</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:24 }}>
          {PRODUCT_TYPES.map(pt=>{
            const active = types.includes(pt.id);
            return (
              <button key={pt.id} onClick={()=>toggleType(pt.id)}
                style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'14px 10px', borderRadius:12, border:`1px solid ${active?'var(--v-brand)':border}`, background:active?'var(--v-brand-light)':'transparent', cursor:'pointer', gap:6 }}>
                <span style={{ fontSize:22 }}>{pt.icon}</span>
                <span style={{ fontSize:12, fontWeight:800, color:active?'var(--v-brand-deep)':text }}>{pt.label}</span>
                <span style={{ fontSize:10, color:muted }}>{pt.desc}</span>
              </button>
            );
          })}
        </div>

        {/* Credential upload */}
        <p style={{ fontSize:12, fontWeight:900, color:sub, letterSpacing:'0.06em', marginBottom:10 }}>CREDENTIALS — OPTIONAL</p>
        <div style={{ background:card, border:`1px solid ${border}`, borderRadius:12, padding:'14px', marginBottom:24 }}>
          <p style={{ fontSize:11, color:muted, lineHeight:1.5, marginBottom:12 }}>Upload a license, certification, or credential. Our AI will verify it and display a Verified badge on your store.</p>
          <div style={{ border:`1px dashed ${border}`, borderRadius:10, padding:'20px', textAlign:'center', cursor:'pointer', background:'var(--v-bg-2)' }}>
            <p style={{ fontSize:20, marginBottom:4 }}>📄</p>
            <p style={{ fontSize:12, color:sub }}>Upload credential document</p>
            <p style={{ fontSize:10, color:sub, marginTop:2 }}>PDF, JPG, PNG</p>
          </div>
        </div>

        <button onClick={publish} disabled={saving||!form.store_name}
          style={{ width:'100%', padding:'14px', border:'none', borderRadius:14, background:form.store_name?'var(--v-gold)':'var(--v-bg-3)', color:'#fff', fontSize:14, fontWeight:900, cursor:form.store_name?'pointer':'not-allowed' }}>
          {saving ? 'Publishing…' : '🏪 Publish Store'}
        </button>
      </div>
    </div>
  );
}
