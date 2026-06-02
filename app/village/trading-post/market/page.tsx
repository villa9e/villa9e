'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const TYPES = ['All','Courses','Coaching','Services','Products','Gigs','Tickets'];
const TYPE_PILL: Record<string,string> = {
  course:'pill-gold', coaching:'pill-teal', service:'pill-blue',
  product:'pill-blue', gig:'pill-solid-brand', ticket:'pill-amber',
};
function typePill(t:string){return TYPE_PILL[t]??'pill-blue';}

function Avatar({ name, size=40 }: { name:string; size?:number }) {
  const colors = ['#2952E8','#1D9E75','#C48A20','#D4537E','#7C3AED'];
  const c = colors[name.charCodeAt(0) % colors.length];
  return (
    <div style={{ width:size, height:size, borderRadius:size/2, background:c, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:900, fontSize:size*0.36, flexShrink:0 }}>
      {name.slice(0,1).toUpperCase()}
    </div>
  );
}

const MOCK_STORES = [
  { id:'s1', store_name:'The Growth Lab', tagline:'Business strategy and coaching for founders', product_types:['coaching','courses'], rating:4.8, follower_count:142, product_count:7, verified:true, profiles:{username:'growthlab', display_name:'Maya Kim'} },
  { id:'s2', store_name:'DevPath Academy', tagline:'Full-stack engineering courses for career switchers', product_types:['courses','gig'], rating:4.6, follower_count:380, product_count:12, verified:false, profiles:{username:'devpath', display_name:'Kwame A.'} },
  { id:'s3', store_name:'Legal Launchpad', tagline:'Contract templates and consulting for small businesses', product_types:['service','product'], rating:4.9, follower_count:89, product_count:5, verified:true, profiles:{username:'legallaunch', display_name:'Priya S.'} },
];

export default function MarketPage() {
  const supabase = createClient();
  const [stores, setStores]     = useState<any[]>([]);
  const [filter, setFilter]     = useState('All');

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any).from('estores')
        .select('*,profiles(username,display_name)')
        .eq('status','active').order('follower_count',{ascending:false}).limit(20);
      setStores(data && data.length > 0 ? data : MOCK_STORES);
    })();
  }, []);

  const filtered = filter === 'All' ? stores : stores.filter(s => s.product_types?.some((t:string)=>t.toLowerCase().includes(filter.toLowerCase())));

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
        <Link href="/village/trading-post" style={{ color:'var(--v-gold)', fontWeight:800, fontSize:14, textDecoration:'none', display:'flex', alignItems:'center', gap:4 }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg> Post
        </Link>
        <p style={{ flex:1, textAlign:'center', fontSize:17, fontWeight:900, color:text }}>Market</p>
        <Link href="/village/trading-post/market/create" style={{ fontSize:12, fontWeight:900, color:'var(--v-gold)', textDecoration:'none', background:'var(--v-gold-light)', borderRadius:20, padding:'6px 14px' }}>
          + Store
        </Link>
      </div>

      {/* Filter strip */}
      <div style={{ display:'flex', gap:6, overflowX:'auto', padding:'12px 16px', borderBottom:`1px solid ${border}` }}>
        {TYPES.map(t => (
          <button key={t} onClick={()=>setFilter(t)}
            style={{ padding:'5px 14px', borderRadius:20, border:`1px solid ${filter===t?'transparent':border}`, background:filter===t?'var(--v-gold)':'transparent', color:filter===t?'#fff':muted, fontSize:11, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0 }}>
            {t}
          </button>
        ))}
      </div>

      <div style={{ padding:'16px' }}>
        <p style={{ fontSize:10, fontWeight:900, color:'var(--v-gold)', letterSpacing:'0.06em', marginBottom:10 }}>FEATURED STORES</p>

        {filtered.map((store,i) => (
          <motion.div key={store.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.06}} style={{ marginBottom:10 }}>
            <Link href={`/village/trading-post/market/${store.id}`} style={{ display:'block', textDecoration:'none', background:card, border:`1px solid ${border}`, borderRadius:14, overflow:'hidden' }}>
              {/* Banner */}
              <div style={{ height:48, background:'var(--v-bg-3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span style={{ fontSize:22, opacity:0.5 }}>🏪</span>
              </div>
              {/* Info */}
              <div style={{ padding:'12px 14px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                  <Avatar name={store.store_name} size={36} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <p style={{ fontSize:13, fontWeight:800, color:text, margin:0 }}>{store.store_name}</p>
                      {store.verified && <span className="pill pill-teal" style={{fontSize:9}}>✓ Verified</span>}
                    </div>
                    <p style={{ fontSize:11, color:muted, margin:0, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>{store.profiles?.display_name} · {store.tagline}</p>
                  </div>
                  <span className="pill pill-gold" style={{fontSize:10}}>{store.rating ? store.rating.toFixed(1) : '—'} ★</span>
                </div>
                <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                  {(store.product_types??[]).map((t:string)=>(
                    <span key={t} className={`pill ${typePill(t)}`} style={{fontSize:9,textTransform:'capitalize'}}>{t}</span>
                  ))}
                </div>
              </div>
            </Link>
          </motion.div>
        ))}

        {filtered.length === 0 && (
          <div style={{ textAlign:'center', padding:'60px 0', color:muted }}>
            <p style={{ fontSize:32, marginBottom:8 }}>🏪</p>
            <p style={{ fontSize:13 }}>No stores in this category yet.</p>
            <Link href="/village/trading-post/market/create" style={{ display:'inline-block', marginTop:16, background:'var(--v-gold)', color:'#fff', borderRadius:20, padding:'10px 24px', fontSize:12, fontWeight:900, textDecoration:'none' }}>
              Open the First
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
