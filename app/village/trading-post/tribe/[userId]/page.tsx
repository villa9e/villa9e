'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

// ── Types ─────────────────────────────────────────────────────────────────────
interface VillagerProfile {
  id: string;
  display_name: string;
  username: string;
  role?: string;
  company?: string;
  bio?: string;
  verified?: boolean;
  credentials?: string[];
  tribe_size?: number;
  deals_active?: number;
  store_rating?: number;
  avatar_url?: string;
}

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_PROFILE: VillagerProfile = {
  id: 'mock',
  display_name: 'Marcus Brown',
  username: 'marcusbrown',
  role: 'Investor',
  company: 'Meridian Capital',
  bio: 'Impact investor focused on clean energy and underserved communities. LP in 14 funds across North America. Building toward a $250M climate portfolio by 2030.',
  verified: true,
  credentials: ['Accredited Investor', 'SEC Verified', 'Village Pro'],
  tribe_size: 87,
  deals_active: 3,
  store_rating: 4.9,
};

// ── Color tokens ──────────────────────────────────────────────────────────────
const C = {
  bg:        'var(--v-bg)',
  card:      'var(--v-card-bg)',
  border:    'var(--v-card-border)',
  text:      'var(--v-text)',
  muted:     'var(--v-text-muted)',
  sub:       'var(--v-text-sub)',
  brand:     'var(--v-brand)',
  brandDeep: '#0033CC',
  gold:      'var(--v-gold)',
  success:   'var(--v-success)',
};

function Avatar({ name, size=72, url }: { name: string; size?: number; url?: string }) {
  const colors = ['#2952E8','#1D9E75','#C48A20','#D4537E','#7C3AED','#0033CC'];
  const c = colors[name.charCodeAt(0) % colors.length];
  if (url) {
    return (
      <img src={url} alt={name} style={{ width:size, height:size, borderRadius:size/2, objectFit:'cover', border:'3px solid var(--v-card-bg)' }} />
    );
  }
  return (
    <div style={{ width:size, height:size, borderRadius:size/2, background:c, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:900, fontSize:size*0.36, border:'3px solid var(--v-card-bg)', flexShrink:0 }}>
      {name.slice(0,1).toUpperCase()}
    </div>
  );
}

function VerifiedBadge({ label }: { label: string }) {
  return (
    <div style={{ display:'inline-flex', alignItems:'center', gap:4, background:'var(--v-brand-light)', border:'1px solid var(--v-brand)', borderRadius:20, padding:'4px 10px' }}>
      <svg width={10} height={10} viewBox="0 0 24 24" fill="var(--v-brand)" stroke="none"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" fill="none" stroke="var(--v-brand)" strokeWidth="2" strokeLinecap="round"/></svg>
      <span style={{ fontSize:10, fontWeight:700, color:'var(--v-brand-deep)' }}>{label}</span>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function TribeProfilePage() {
  const supabase = createClient();
  const params   = useParams();
  const router   = useRouter();
  const targetId = params.userId as string;

  const [profile, setProfile]       = useState<VillagerProfile | null>(null);
  const [loading, setLoading]       = useState(true);
  const [connected, setConnected]   = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);

      // Load profile
      const { data: prof } = await (supabase as any)
        .from('profiles')
        .select('id,display_name,username,role,company,bio,verified,avatar_url')
        .eq('id', targetId)
        .single();

      if (prof) {
        // Load deal count
        const { count: dealCount } = await (supabase as any)
          .from('deals')
          .select('id', { count:'exact', head:true })
          .eq('user_id', targetId)
          .eq('status','active');

        // Load tribe size (connections count)
        const { count: tribeCount } = await (supabase as any)
          .from('connections')
          .select('id', { count:'exact', head:true })
          .eq('from_user_id', targetId)
          .eq('pending', false);

        // Load store rating
        const { data: store } = await (supabase as any)
          .from('estores')
          .select('rating')
          .eq('user_id', targetId)
          .single();

        setProfile({
          ...prof,
          tribe_size:   tribeCount ?? 0,
          deals_active: dealCount ?? 0,
          store_rating: store?.rating ?? null,
          credentials:  prof.verified ? ['Accredited Investor', 'Village Pro'] : [],
        });

        // Check if already connected
        if (user) {
          const { data: conn } = await (supabase as any)
            .from('connections')
            .select('id')
            .or(`and(from_user_id.eq.${user.id},to_user_id.eq.${targetId}),and(from_user_id.eq.${targetId},to_user_id.eq.${user.id})`)
            .eq('pending', false)
            .single();
          if (conn) setConnected(true);
        }
      } else {
        // Fall back to mock
        setProfile(MOCK_PROFILE);
      }

      setLoading(false);
    })();
  }, [targetId]);

  async function handleConnect() {
    if (!currentUserId || connected || connecting) return;
    setConnecting(true);
    await (supabase as any).from('connections').insert({ from_user_id: currentUserId, to_user_id: targetId, pending: true }).catch(()=>{});
    setConnecting(false);
    setConnected(true);
  }

  if (loading) {
    return (
      <div style={{ minHeight:'100vh', background:C.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ width:32, height:32, border:'3px solid var(--v-brand)', borderTopColor:'transparent', borderRadius:16, animation:'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ minHeight:'100vh', background:C.bg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
        <p style={{ fontSize:15, fontWeight:700, color:C.muted, marginBottom:16 }}>Member not found</p>
        <button onClick={() => router.back()} style={{ padding:'10px 24px', borderRadius:20, background:C.brand, color:'#fff', border:'none', fontSize:13, fontWeight:900, cursor:'pointer' }}>Go Back</button>
      </div>
    );
  }

  const STATS = [
    { label:'Tribe',        value: profile.tribe_size ?? 0,    color: C.brand },
    { label:'Active Deals', value: profile.deals_active ?? 0,  color: C.gold },
    { label:'Store',        value: profile.store_rating ? `${profile.store_rating}★` : '—', color: C.success },
  ];

  return (
    <div style={{ minHeight:'100vh', background:C.bg, paddingBottom:80 }}>
      {/* Banner */}
      <div style={{ position:'relative', height:70, background:C.brandDeep }}>
        {/* Back button */}
        <button onClick={() => router.back()} style={{ position:'absolute', top:14, left:16, width:34, height:34, borderRadius:17, background:'rgba(255,255,255,0.15)', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
      </div>

      {/* Avatar overlapping banner */}
      <div style={{ position:'relative', padding:'0 20px', marginTop:-36 }}>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:12 }}>
          <Avatar name={profile.display_name} size={72} url={profile.avatar_url} />
          {/* Action buttons */}
          <div style={{ display:'flex', gap:8, paddingBottom:4 }}>
            <Link
              href="/village/trading-post/office"
              style={{ padding:'9px 18px', borderRadius:20, background:C.brand, color:'#fff', border:'none', fontSize:12, fontWeight:900, cursor:'pointer', textDecoration:'none', display:'inline-flex', alignItems:'center', gap:6 }}
            >
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              Message
            </Link>
            <button
              onClick={handleConnect}
              disabled={connected || connecting}
              style={{ padding:'9px 18px', borderRadius:20, background: connected ? 'var(--v-gold)' : 'transparent', color: connected ? '#fff' : 'var(--v-gold)', border:'2px solid var(--v-gold)', fontSize:12, fontWeight:900, cursor: connected ? 'default' : 'pointer' }}
            >
              {connecting ? '...' : connected ? 'Connected' : 'Connect'}
            </button>
          </div>
        </div>

        {/* Name, role, company */}
        <div style={{ marginBottom:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginBottom:2 }}>
            <p style={{ fontSize:20, fontWeight:900, color:C.text, margin:0 }}>{profile.display_name}</p>
            {profile.verified && (
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--v-brand)" strokeWidth={2} strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            )}
          </div>
          <p style={{ fontSize:13, color:C.muted, margin:'0 0 4px' }}>
            {profile.role}{profile.company ? ` · ${profile.company}` : ''}
          </p>
          <p style={{ fontSize:11, color:C.sub, margin:0 }}>@{profile.username}</p>
        </div>

        {/* Verified credential badges */}
        {profile.credentials && profile.credentials.length > 0 && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:16 }}>
            {profile.credentials.map(cred => (
              <VerifiedBadge key={cred} label={cred} />
            ))}
          </div>
        )}

        {/* Stats row */}
        <motion.div
          initial={{ opacity:0, y:12 }}
          animate={{ opacity:1, y:0 }}
          style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:20 }}
        >
          {STATS.map(s => (
            <div key={s.label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:'14px 8px', textAlign:'center' }}>
              <p style={{ fontSize:20, fontWeight:900, color:s.color, margin:'0 0 4px' }}>{s.value}</p>
              <p style={{ fontSize:9, fontWeight:700, color:C.sub, margin:0, letterSpacing:'0.05em' }}>{s.label.toUpperCase()}</p>
            </div>
          ))}
        </motion.div>

        {/* About section */}
        {profile.bio && (
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:'16px', marginBottom:16 }}>
            <p style={{ fontSize:10, fontWeight:900, color:C.sub, letterSpacing:'0.06em', margin:'0 0 8px' }}>ABOUT</p>
            <p style={{ fontSize:13, color:C.muted, lineHeight:1.65, margin:0 }}>{profile.bio}</p>
          </div>
        )}

        {/* Deals CTA */}
        {(profile.deals_active ?? 0) > 0 && (
          <div style={{ background:'var(--v-gold-light)', border:'1px solid var(--v-gold)', borderRadius:14, padding:'14px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <p style={{ fontSize:13, fontWeight:700, color:C.text, margin:'0 0 2px' }}>
                {profile.deals_active} active deal{(profile.deals_active ?? 0) > 1 ? 's' : ''}
              </p>
              <p style={{ fontSize:11, color:C.muted, margin:0 }}>View open investment opportunities</p>
            </div>
            <Link href="/village/trading-post/deals"
              style={{ padding:'8px 16px', borderRadius:20, background:'var(--v-gold)', color:'#fff', fontSize:12, fontWeight:900, textDecoration:'none' }}>
              View Deals
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
