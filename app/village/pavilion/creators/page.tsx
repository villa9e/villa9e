'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { PavilionNav } from '@/components/pavilion/PavilionNav';

const MOCK_CREATORS = [
  { id: 'cr1', name: 'Spirit AI', handle: 'spiritai', subscribers: 12400, verified: true, color: '#2952E8', specialty: 'Wellness & Goals' },
  { id: 'cr2', name: 'Nia James', handle: 'niajames', subscribers: 3280, verified: true, color: '#BE185D', specialty: 'Brand & Business' },
  { id: 'cr3', name: 'Marcus T.', handle: 'marcust', subscribers: 1870, verified: false, color: '#059669', specialty: 'Finance & Credit' },
  { id: 'cr4', name: 'DJ Village', handle: 'dj_village', subscribers: 940, verified: false, color: '#E8770A', specialty: 'Music & Arts' },
  { id: 'cr5', name: 'Kwame A.', handle: 'devpath', subscribers: 4120, verified: true, color: '#7C3AED', specialty: 'Tech & Web3' },
  { id: 'cr6', name: 'Priya S.', handle: 'priyas', subscribers: 2650, verified: false, color: '#D4A030', specialty: 'Health & Mindset' },
];

function fmt(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

export default function CreatorsPage() {
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';
  const [search, setSearch] = useState('');
  const [following, setFollowing] = useState<Set<string>>(new Set());

  const bg     = isNight ? '#080E24' : '#F0EFF8';
  const cardBg = isNight ? '#1A1830' : '#FFFFFF';
  const border = isNight ? '#2A2845' : '#DDD9F5';
  const text   = isNight ? '#E8E3F8' : '#1E1B4B';
  const muted  = isNight ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';

  const filtered = MOCK_CREATORS.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.handle.includes(search.toLowerCase())
  );

  function toggleFollow(id: string) {
    setFollowing(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div style={{ minHeight: '100vh', background: bg, paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 30, background: isNight ? 'rgba(8,14,36,0.96)' : 'rgba(240,239,248,0.96)', backdropFilter: 'blur(16px)', borderBottom: `1px solid ${border}`, padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Link href="/village/pavilion" style={{ display: 'flex', alignItems: 'center', color: text, textDecoration: 'none' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
          </Link>
          <h1 style={{ flex: 1, fontSize: 18, fontWeight: 900, color: text, margin: 0 }}>Creators</h1>
        </div>
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={muted} strokeWidth={2} strokeLinecap="round" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search creators…"
            style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 12, border: `1px solid ${border}`, background: cardBg, color: text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      {/* Grid */}
      <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {filtered.map((cr, i) => (
          <motion.div
            key={cr.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            style={{ borderRadius: 18, overflow: 'hidden', background: cardBg, border: `1px solid ${border}` }}
          >
            <Link href={`/village/pavilion/creators/${cr.handle}`} style={{ display: 'block', textDecoration: 'none' }}>
              {/* Banner */}
              <div style={{ height: 64, background: `linear-gradient(135deg, ${cr.color}40, ${cr.color}18)`, position: 'relative' }}>
                {/* Avatar */}
                <div style={{ position: 'absolute', bottom: -24, left: '50%', transform: 'translateX(-50%)', width: 48, height: 48, borderRadius: '50%', background: cr.color, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `3px solid ${cardBg}`, color: '#fff', fontWeight: 900, fontSize: 16 }}>
                  {cr.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                  {cr.verified && (
                    <div style={{ position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderRadius: '50%', background: '#2952E8', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${cardBg}` }}>
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                    </div>
                  )}
                </div>
              </div>
            </Link>

            <div style={{ paddingTop: 28, paddingBottom: 12, paddingLeft: 12, paddingRight: 12, textAlign: 'center' }}>
              <Link href={`/village/pavilion/creators/${cr.handle}`} style={{ textDecoration: 'none' }}>
                <p style={{ fontWeight: 900, fontSize: 13, color: text, marginBottom: 2 }}>{cr.name}</p>
                <p style={{ fontSize: 10, color: muted, marginBottom: 4 }}>@{cr.handle}</p>
                <p style={{ fontSize: 10, color: muted, marginBottom: 8 }}>{fmt(cr.subscribers)} subscribers</p>
                <p style={{ fontSize: 10, color: cr.color, fontWeight: 700, marginBottom: 10 }}>{cr.specialty}</p>
              </Link>
              <button
                onClick={() => toggleFollow(cr.id)}
                style={{ width: '100%', padding: '8px 0', borderRadius: 20, background: following.has(cr.id) ? (isNight ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)') : '#2952E8', color: following.has(cr.id) ? text : '#fff', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 12 }}
              >
                {following.has(cr.id) ? 'Following' : 'Follow'}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <PavilionNav active="home" />
    </div>
  );
}
