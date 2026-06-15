'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { PavilionNav } from '@/components/pavilion/PavilionNav';

type Post = {
  id: string;
  title: string;
  description: string;
  creator: string;
  duration: string;
  category: string;
  thumbnail_url: string | null;
  media_url: string | null;
  oowop_count: number;
  comment_count: number;
  views: number;
};

type Related = { id: string; title: string; creator: string; duration: string; thumbnail_color: string };

function fmt(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

export default function WatchPage({ params }: { params: { contentId: string } }) {
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';
  const [oowoped, setOowoped] = useState(false);
  const [post, setPost] = useState<Post | null>(null);
  const [related, setRelated] = useState<Related[]>([]);
  const [loading, setLoading] = useState(true);

  const bg     = isNight ? '#080E24' : '#F0EFF8';
  const cardBg = isNight ? '#1A1830' : '#FFFFFF';
  const border = isNight ? '#2A2845' : '#DDD9F5';
  const text   = isNight ? '#E8E3F8' : '#1E1B4B';
  const muted  = isNight ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';

  useEffect(() => {
    fetch(`/api/pavilion/content/${params.contentId}`).then(r => r.json()).then(d => {
      setPost(d.post ?? null);
      setRelated(d.related ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [params.contentId]);

  if (!loading && !post) {
    return (
      <div style={{ minHeight: '100vh', background: bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 20 }}>
        <p style={{ fontSize: 15, fontWeight: 800, color: text }}>This content isn't available.</p>
        <Link href="/village/pavilion/browse" style={{ color: '#2952E8', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>Back to Browse</Link>
        <PavilionNav active="learn" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: bg, paddingBottom: 80 }}>
      {/* Back bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 30, background: '#000000', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/village/pavilion/browse" style={{ display: 'flex', alignItems: 'center', color: '#fff', textDecoration: 'none' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </Link>
        <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: '#fff' }}>{post?.title || ''}</span>
      </div>

      {/* Video player area */}
      <div style={{ width: '100%', aspectRatio: '16/9', background: '#000', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {post?.media_url ? (
          <video src={post.media_url} controls poster={post.thumbnail_url || undefined} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </div>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{loading ? 'Loading…' : 'Media unavailable'}</span>
          </div>
        )}
      </div>

      {/* Title + Actions */}
      <div style={{ padding: '16px', background: cardBg, borderBottom: `1px solid ${border}` }}>
        <h1 style={{ fontSize: 17, fontWeight: 900, color: text, marginBottom: 6, lineHeight: 1.3 }}>{post?.title || ''}</h1>
        <p style={{ fontSize: 13, color: muted, marginBottom: 12 }}>
          @{post?.creator}{post?.duration ? ` · ${post.duration}` : ''} · {fmt(post?.views ?? 0)} views
        </p>

        {/* Action row */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setOowoped(v => !v)}
            style={{ flex: 1, padding: '10px 0', borderRadius: 20, background: oowoped ? '#2952E8' : (isNight ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'), color: oowoped ? '#fff' : text, border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M18 11V8a2 2 0 00-4 0v1a2 2 0 00-2 0V8a2 2 0 00-4 0v3"/><rect x="6" y="11" width="12" height="8" rx="2"/></svg>
            {oowoped ? 'OoWop\'d' : 'OoWop'} {post?.oowop_count ? `(${fmt(post.oowop_count + (oowoped ? 1 : 0))})` : ''}
          </button>
          <button
            style={{ flex: 1, padding: '10px 0', borderRadius: 20, background: isNight ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)', color: text, border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
            Share
          </button>
        </div>
      </div>

      {/* Description */}
      {post?.description && (
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${border}` }}>
          <p style={{ fontSize: 13, color: text, lineHeight: 1.6 }}>{post.description}</p>
        </div>
      )}

      {/* Related content */}
      <div style={{ padding: '16px 16px 0' }}>
        <h2 style={{ fontSize: 15, fontWeight: 900, color: text, marginBottom: 12 }}>Related</h2>
        {related.length === 0 ? (
          <p style={{ fontSize: 12, color: muted }}>No related content yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {related.map(r => (
              <Link key={r.id} href={`/village/pavilion/watch/${r.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
                <div style={{ width: 80, height: 52, borderRadius: 10, background: `linear-gradient(135deg, ${r.thumbnail_color}35, ${r.thumbnail_color}15)`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={r.thumbnail_color} strokeWidth={1.5} strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polygon points="10,8 16,12 10,16"/></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: text, lineHeight: 1.3, marginBottom: 2 }}>{r.title}</p>
                  <p style={{ fontSize: 11, color: muted }}>@{r.creator}{r.duration ? ` · ${r.duration}` : ''}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <PavilionNav active="learn" />
    </div>
  );
}
