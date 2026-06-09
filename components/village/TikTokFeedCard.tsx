'use client';
import { useEffect, useRef, useState } from 'react';

interface Props {
  embedHtml: string;    // raw 'html' string from TikTok oEmbed response
  thumbnail: string;    // lightweight placeholder shown while loading
  isActive: boolean;    // true when this card is the currently visible one
  title?: string;
  author?: string;
}

export function TikTokFeedCard({ embedHtml, thumbnail, isActive, title, author }: Props) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const wrapperRef    = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  // IntersectionObserver: only mount the heavy iframe when visible
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Mount / unmount embed based on active + in-viewport
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const shouldMount = isActive && inView;

    if (shouldMount && embedHtml) {
      // 1. Inject the oEmbed blockquote + <script> tag
      el.innerHTML = embedHtml;

      // 2. Fire TikTok's global renderer if already loaded;
      //    the injected <script> self-executes on first mount.
      const win = window as any;
      if (win.tiktokEmbed?.lib?.render) {
        try { win.tiktokEmbed.lib.render(); } catch { /* ignore */ }
      }
    } else {
      // Destroy player to free memory when scrolled away
      el.innerHTML = '';
    }
  }, [isActive, inView, embedHtml]);

  return (
    <div ref={wrapperRef} style={{ position: 'absolute', inset: 0, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Thumbnail placeholder — visible until embed mounts */}
      {thumbnail && (
        <img
          src={thumbnail}
          alt={title ?? 'TikTok video'}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
            opacity: (isActive && inView) ? 0.15 : 1,
            transition: 'opacity 0.4s',
          }}
        />
      )}

      {/* TikTok oEmbed mount point */}
      <div
        ref={containerRef}
        style={{
          position: 'relative', zIndex: 2,
          width: '100%', maxWidth: 420,
          height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      />

      {/* Bottom info strip shown when embed isn't active yet */}
      {(!isActive || !inView) && title && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 64, padding: '0 14px 110px', zIndex: 10, pointerEvents: 'none' }}>
          <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 900, marginBottom: 5, background: 'rgba(0,0,0,0.55)', color: '#69C9D0' }}>TikTok</span>
          <h2 style={{ fontSize: 14, fontWeight: 900, color: '#fff', lineHeight: 1.3, margin: '0 0 3px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as React.CSSProperties}>{title}</h2>
          {author && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: 0 }}>@{author}</p>}
        </div>
      )}
    </div>
  );
}
