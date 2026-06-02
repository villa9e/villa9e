'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const TYPE_COLOR: Record<string,{bg:string;text:string;label:string}> = {
  course:  { bg:'var(--v-gold-light)',    text:'var(--v-gold)',    label:'COURSES' },
  coaching:{ bg:'var(--v-success-light)', text:'var(--v-success)', label:'COACHING' },
  service: { bg:'var(--v-brand-light)',   text:'var(--v-brand)',   label:'SERVICES' },
  product: { bg:'var(--v-brand-light)',   text:'var(--v-brand)',   label:'PRODUCTS' },
  gig:     { bg:'var(--v-bg-3)',          text:'var(--v-text-muted)',label:'GIGS' },
  ticket:  { bg:'var(--v-warning-light)', text:'var(--v-warning)', label:'TICKETS' },
};

const TYPE_ICON: Record<string,string> = { course:'🎓', coaching:'📆', service:'💼', product:'📦', gig:'🔧', ticket:'🎟' };

function Avatar({ name, size=44 }: { name:string; size?:number }) {
  const colors = ['#2952E8','#1D9E75','#C48A20','#D4537E','#7C3AED'];
  const c = colors[name.charCodeAt(0) % colors.length];
  return (
    <div style={{ width:size, height:size, borderRadius:size/2, background:c, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:900, fontSize:size*0.36, flexShrink:0 }}>
      {name.slice(0,1).toUpperCase()}
    </div>
  );
}

const MOCK_STORE = {
  id:'s1', store_name:'The Growth Lab', tagline:'Business strategy and coaching for founders', about:'Maya Kim is a business strategist with 12 years helping founders scale from zero to Series A. Trained at Harvard Business School, worked with 200+ companies across tech, consumer, and impact sectors. Currently focused on emerging market founders and underrepresented entrepreneurs.', verified:true, rating:4.8, follower_count:142, product_count:7,
  profiles:{ display_name:'Maya Kim', username:'growthlab' },
  product_types:['coaching','courses'],
};

const MOCK_PRODUCTS = [
  { id:'p1', product_type:'coaching', name:'Founder Strategy Session', description:'90-minute one-on-one strategy session covering growth roadmap, fundraising narrative, and team structure.', price:350, cover_url:null, purchase_count:87, rating:4.9, metadata:{ duration:'90 min', format:'Video call', sessions:1 } },
  { id:'p2', product_type:'coaching', name:'Monthly Advisory Retainer', description:'Four sessions per month plus async Slack access and document reviews for your team.', price:1800, price_label:'per month', cover_url:null, purchase_count:34, rating:5.0, metadata:{ duration:'4 sessions/mo', format:'Video + async', sessions:4 } },
  { id:'p3', product_type:'course',   name:'From 0 to Pitch-Ready', description:'12-module video course covering idea validation, MVP scoping, investor narrative, and pitch deck construction.', price:297, cover_url:null, purchase_count:412, rating:4.7, metadata:{ modules:12, hours:8, format:'Video on demand' } },
];

export default function EStorePage() {
  const supabase = createClient();
  const { storeId } = useParams<{ storeId: string }>();
  const [store, setStore]     = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [following, setFollowing] = useState(false);
  const [booking, setBooking] = useState<any>(null);
  const [selectedTime, setTime] = useState('');
  const [booked, setBooked]   = useState(false);

  useEffect(() => {
    (async () => {
      if (storeId.startsWith('s')) { setStore(MOCK_STORE); setProducts(MOCK_PRODUCTS); return; }
      const [{ data: s }, { data: p }] = await Promise.all([
        (supabase as any).from('estores').select('*,profiles(username,display_name)').eq('id',storeId).single(),
        (supabase as any).from('estore_products').select('*').eq('store_id',storeId).eq('status','active').order('purchase_count',{ascending:false}),
      ]);
      if (s) setStore(s);
      if (p) setProducts(p);
    })();
  }, [storeId]);

  if (!store) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--v-bg)' }}><p style={{ color:'var(--v-text-muted)' }}>Loading…</p></div>;

  const card  = 'var(--v-card-bg)';
  const border= 'var(--v-card-border)';
  const text  = 'var(--v-text)';
  const muted = 'var(--v-text-muted)';
  const sub   = 'var(--v-text-sub)';

  const byType = products.reduce((acc:any, p:any) => { (acc[p.product_type]??=[]).push(p); return acc; }, {});
  const TIMES = ['9:00 AM','10:30 AM','1:00 PM','2:30 PM','4:00 PM','5:30 PM'];

  return (
    <div style={{ minHeight:'100vh', background:'var(--v-bg)', paddingBottom:100 }}>
      {/* Header */}
      <div style={{ position:'sticky', top:0, zIndex:20, display:'flex', alignItems:'center', padding:'14px 16px', background:'rgba(255,255,255,0.94)', backdropFilter:'blur(12px)', borderBottom:`1px solid ${border}` }}>
        <Link href="/village/trading-post/market" style={{ color:'var(--v-gold)', fontWeight:800, fontSize:14, textDecoration:'none', display:'flex', alignItems:'center', gap:4 }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg> Market
        </Link>
        <p style={{ flex:1, textAlign:'center', fontSize:16, fontWeight:900, color:text }}>eStore</p>
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={muted} strokeWidth={2} strokeLinecap="round" style={{ cursor:'pointer' }}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
      </div>

      {/* Banner */}
      <div style={{ height:64, background:'linear-gradient(135deg,var(--v-brand-deep),var(--v-brand))' }} />

      {/* Identity */}
      <div style={{ padding:'12px 16px 0' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
          <Avatar name={store.store_name} size={52} />
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <p style={{ fontSize:15, fontWeight:900, color:text, margin:0 }}>{store.store_name}</p>
              {store.verified && <span className="pill pill-teal" style={{fontSize:9}}>✓ Verified</span>}
            </div>
            <p style={{ fontSize:12, color:muted, margin:'2px 0 0' }}>{store.profiles?.display_name} · {store.tagline}</p>
          </div>
          <button onClick={()=>setFollowing(!following)}
            style={{ padding:'8px 16px', borderRadius:20, border:'none', background:following?'var(--v-gold-light)':'var(--v-gold)', color:following?'var(--v-gold)':'#fff', fontSize:12, fontWeight:900, cursor:'pointer' }}>
            {following?'Following':'Follow'}
          </button>
        </div>

        {store.about && <p style={{ fontSize:12, color:muted, lineHeight:1.6, marginBottom:12, display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{store.about}</p>}

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, marginBottom:20 }}>
          {[{v:store.rating?.toFixed(1)||'—',l:'Rating'},{v:store.follower_count,l:'Followers'},{v:store.product_count||products.length,l:'Products'}].map(s=>(
            <div key={s.l} style={{ background:'var(--v-bg-2)', borderRadius:10, padding:'10px 8px', textAlign:'center' }}>
              <p style={{ fontSize:16, fontWeight:900, color:'var(--v-brand)', margin:0 }}>{s.v}</p>
              <p style={{ fontSize:9, color:sub, margin:0, letterSpacing:'0.04em' }}>{s.l.toUpperCase()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Products by type */}
      {Object.entries(byType).map(([type, prods]:any) => {
        const tc = TYPE_COLOR[type] ?? { bg:'var(--v-bg-2)', text:muted, label:type.toUpperCase() };
        return (
          <div key={type} style={{ padding:'0 16px', marginBottom:20 }}>
            <p style={{ fontSize:10, fontWeight:900, color:tc.text, letterSpacing:'0.06em', marginBottom:10 }}>{tc.label}</p>
            {prods.map((p:any,i:number)=>(
              <motion.div key={p.id} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:i*0.06}}
                style={{ background:card, border:`1px solid ${border}`, borderRadius:14, overflow:'hidden', marginBottom:10 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px' }}>
                  <div style={{ width:46, height:46, borderRadius:23, background:tc.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>
                    {TYPE_ICON[type]}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:14, fontWeight:800, color:text, margin:'0 0 2px' }}>{p.name}</p>
                    <p style={{ fontSize:11, color:muted, margin:0, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>{p.description}</p>
                    {p.metadata && (
                      <p style={{ fontSize:10, color:sub, margin:'3px 0 0' }}>
                        {p.metadata.modules ? `${p.metadata.modules} modules · ${p.metadata.hours}h` : p.metadata.duration}
                        {p.metadata.format && ` · ${p.metadata.format}`}
                      </p>
                    )}
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <span className="pill" style={{ background:tc.bg, color:tc.text, fontSize:12, fontWeight:900 }}>${p.price?.toLocaleString()}{p.price_label?`/${p.price_label.replace('per ','')}`:''}
                    </span>
                  </div>
                </div>
                <div style={{ padding:'0 14px 14px' }}>
                  <button onClick={()=>{ if(type==='coaching') setBooking(p); }}
                    style={{ width:'100%', padding:'10px', background:'var(--v-brand)', color:'#fff', border:'none', borderRadius:10, fontSize:13, fontWeight:900, cursor:'pointer' }}>
                    {type==='coaching'?'Book Session':type==='course'?'Enroll Now':type==='gig'?'Order':'Purchase'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        );
      })}

      {/* Message button */}
      <div style={{ position:'fixed', bottom:'env(safe-area-inset-bottom,0px)', left:0, right:0, padding:'12px 16px', background:card, borderTop:`1px solid ${border}`, zIndex:20 }}>
        <Link href="/village/trading-post/office" style={{ display:'block', textAlign:'center', background:'var(--v-brand)', color:'#fff', borderRadius:14, padding:'14px', fontSize:14, fontWeight:900, textDecoration:'none' }}>
          Message {store.profiles?.display_name?.split(' ')[0] ?? 'Seller'}
        </Link>
      </div>

      {/* Booking modal */}
      {booking && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:50, display:'flex', alignItems:'flex-end', justifyContent:'center', padding:16 }}>
          <motion.div initial={{y:80,opacity:0}} animate={{y:0,opacity:1}}
            style={{ background:card, borderRadius:24, width:'100%', maxWidth:420, padding:24, paddingBottom:32 }}>
            {booked ? (
              <div style={{ textAlign:'center', padding:'24px 0' }}>
                <p style={{ fontSize:40, marginBottom:8 }}>✅</p>
                <p style={{ fontSize:16, fontWeight:900, color:text }}>Session booked!</p>
                <p style={{ fontSize:12, color:muted, marginTop:6 }}>{booking.name} · {selectedTime}</p>
              </div>
            ) : (
              <>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
                  <div><p style={{ fontSize:15, fontWeight:900, color:text, margin:0 }}>{booking.name}</p><p style={{ fontSize:11, color:muted, margin:0 }}>Virtual · {booking.metadata?.duration}</p></div>
                  <button onClick={()=>setBooking(null)} style={{ color:muted, background:'none', border:'none', fontSize:22, cursor:'pointer' }}>×</button>
                </div>
                <p style={{ fontSize:11, fontWeight:900, color:sub, letterSpacing:'0.06em', marginBottom:10 }}>SELECT A TIME</p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:20 }}>
                  {TIMES.map(t=>(
                    <button key={t} onClick={()=>setTime(t)}
                      style={{ padding:'10px 0', borderRadius:10, border:`1px solid ${selectedTime===t?'var(--v-brand)':border}`, background:selectedTime===t?'var(--v-brand-light)':'transparent', color:selectedTime===t?'var(--v-brand-deep)':muted, fontSize:12, fontWeight:700, cursor:'pointer' }}>
                      {t}
                    </button>
                  ))}
                </div>
                <button onClick={()=>{setBooked(true);setTimeout(()=>{setBooking(null);setBooked(false);setTime('');},2500);}} disabled={!selectedTime}
                  style={{ width:'100%', padding:'13px', borderRadius:14, background:selectedTime?'var(--v-brand)':'var(--v-bg-3)', color:'#fff', fontSize:14, fontWeight:900, border:'none', cursor:selectedTime?'pointer':'not-allowed' }}>
                  Confirm Booking — ${booking.price}
                </button>
              </>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
