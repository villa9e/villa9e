'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { PavilionNav } from '@/components/pavilion/PavilionNav';

type ContentItem = {
  id: string;
  title: string;
  creator: string;
  duration: string;
  category: string;
  free: boolean;
  thumbnail_color: string;
};

export default function BrowsePage() {
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';
  const [activeCategory, setActiveCategory] = useState('All');
  const [items, setItems] = useState<ContentItem[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [loading, setLoading] = useState(true);

  const bg     = isNight ? '#080E24' : '#F0EFF8';
  const cardBg = isNight ? '#1A1830' : '#FFFFFF';
  const border = isNight ? '#2A2845' : '#DDD9F5';
  const text   = isNight ? '#E8E3F8' : '#1E1B4B';
  const muted  = isNight ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';

  useEffect(() => {
    fetch('/api/pavilion/content').then(r => r.json()).then(d => {
      setItems(d.items ?? []);
      setCategories(d.categories ?? ['All']);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = activeCategory === 'All' ? items : items.filter(c => c.category === activeCategory);

  return (
    <div style={{ minHeight: '100vh', background: bg, paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 30, background: isNight ? 'rgba(8,14,36,0.96)' : 'rgba(240,239,248,0.96)', backdropFilter: 'blur(16px)', borderBottom: `1px solid ${border}`, padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Link href="/village/pavilion" style={{ display: 'flex', alignItems: 'center', color: text, textDecoration: 'none' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
          </Link>
          <h1 style={{ flex: 1, fontSize: 18, fontWeight: 900, color: text, margin: 0 }}>Browse</h1>
          <button style={{ width: 36, height: 36, borderRadius: '50%', border: `1px solid ${border}`, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: text }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          </button>
        </div>
        {/* Category pills */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              style={{
                flexShrink: 0,
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: activeCategory === c ? '#7F77DD' : (isNight ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'),
                color: activeCategory === c ? '#fff' : (isNight ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)'),
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Content grid */}
      {!loading && filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: muted }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" style={{ margin: '0 auto 12px', display: 'block' }}><circle cx="12" cy="12" r="10"/><polygon points="10,8 16,12 10,16"/></svg>
          <p style={{ fontSize: 14 }}>No content yet. Check back soon.</p>
        </div>
      ) : (
        <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {filtered.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link href={`/village/pavilion/watch/${item.id}`} style={{ display: 'block', borderRadius: 16, overflow: 'hidden', background: cardBg, border: `1px solid ${border}`, textDecoration: 'none' }}>
                {/* Thumbnail */}
                <div style={{ height: 110, background: `linear-gradient(135deg, ${item.thumbnail_color}35, ${item.thumbnail_color}15)`, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={item.thumbnail_color} strokeWidth={1.5} strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polygon points="10,8 16,12 10,16"/></svg>
                  {item.duration && (
                    <div style={{ position: 'absolute', bottom: 6, right: 8, background: 'rgba(0,0,0,0.6)', borderRadius: 8, padding: '2px 7px' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>{item.duration}</span>
                    </div>
                  )}
                  {item.free && (
                    <div style={{ position: 'absolute', top: 6, right: 8, background: '#059669', borderRadius: 8, padding: '2px 7px' }}>
                      <span style={{ fontSize: 10, fontWeight: 900, color: '#fff' }}>FREE</span>
                    </div>
                  )}
                </div>
                {/* Info */}
                <div style={{ padding: '10px 12px' }}>
                  <p style={{ fontWeight: 800, fontSize: 12, color: text, marginBottom: 3, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {item.title}
                  </p>
                  <p style={{ fontSize: 10, color: muted }}>@{item.creator}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      <PavilionNav active="learn" />
    </div>
  );
}
