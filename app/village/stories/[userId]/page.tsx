'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface Story {
  id: string;
  user_id: string;
  media_url: string | null;
  media_type: string;
  duration_seconds: number;
  text_overlay: string | null;
  created_at: string;
  profiles: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    is_online: boolean;
    is_live: boolean;
  };
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

function ringColor(profile: Story['profiles']): string {
  if (profile.is_live) return '#E8170A';   // red — Live
  if (profile.is_online) return '#2952E8'; // royal blue — online
  return '#0033CC';                         // navy — offline
}

export default function StoryViewerPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;

  const [stories, setStories]   = useState<Story[]>([]);
  const [index, setIndex]       = useState(0);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading]   = useState(true);
  const [paused, setPaused]     = useState(false);

  const timerRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartRef  = useRef<{ x: number; y: number } | null>(null);
  const videoRef       = useRef<HTMLVideoElement | null>(null);

  // Load stories
  useEffect(() => {
    fetch(`/api/stories?userId=${userId}`)
      .then(r => r.json())
      .then(d => {
        setStories(d.stories ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [userId]);

  const current = stories[index];
  const duration = current?.duration_seconds ?? 5;

  const goNext = useCallback(() => {
    if (index < stories.length - 1) {
      setIndex(i => i + 1);
      setProgress(0);
    } else {
      router.back();
    }
  }, [index, stories.length, router]);

  const goPrev = useCallback(() => {
    if (index > 0) {
      setIndex(i => i - 1);
      setProgress(0);
    }
  }, [index]);

  // Progress timer for photos
  useEffect(() => {
    if (!current || current.media_type === 'video' || paused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    const tick = 100; // ms
    const steps = (duration * 1000) / tick;
    let step = 0;
    timerRef.current = setInterval(() => {
      step++;
      setProgress(step / steps);
      if (step >= steps) {
        clearInterval(timerRef.current!);
        goNext();
      }
    }, tick);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [current, paused, duration, goNext]);

  // Tap handler
  function handleTap(e: React.MouseEvent<HTMLDivElement>) {
    const { clientX, currentTarget } = e;
    const half = currentTarget.clientWidth / 2;
    if (clientX < half) goPrev(); else goNext();
  }

  // Touch handlers for swipe-down-to-close
  function onTouchStart(e: React.TouchEvent) {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (!touchStartRef.current) return;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    const dx = Math.abs(e.changedTouches[0].clientX - touchStartRef.current.x);
    if (dy > 80 && dx < 50) router.back();
    touchStartRef.current = null;
  }

  if (loading) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, border: '3px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!stories.length) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15 }}>No active stories</p>
        <button onClick={() => router.back()} style={{ color: '#fff', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 20, padding: '8px 20px', cursor: 'pointer', fontSize: 14 }}>
          Go back
        </button>
      </div>
    );
  }

  const profile = current.profiles;
  const ring = ringColor(profile);

  return (
    <div
      onClick={handleTap}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 200, overflow: 'hidden', cursor: 'pointer', userSelect: 'none' }}
    >
      {/* Media */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{ position: 'absolute', inset: 0 }}
        >
          {current.media_url && current.media_type === 'video' ? (
            <video
              ref={videoRef}
              src={current.media_url}
              autoPlay
              muted={false}
              playsInline
              onEnded={goNext}
              onTimeUpdate={e => {
                const v = e.currentTarget;
                if (v.duration) setProgress(v.currentTime / v.duration);
              }}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : current.media_url ? (
            <img
              src={current.media_url}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              draggable={false}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #0A1F2E, #1A3040)' }} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Dark gradient top */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 160, background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)', pointerEvents: 'none' }} />

      {/* Progress bars */}
      <div style={{ position: 'absolute', top: 'calc(12px + env(safe-area-inset-top, 0px))', left: 12, right: 12, display: 'flex', gap: 4 }}>
        {stories.map((s, i) => (
          <div key={s.id} style={{ flex: 1, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.35)', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              borderRadius: 2,
              background: '#fff',
              width: i < index ? '100%' : i === index ? `${progress * 100}%` : '0%',
              transition: i === index ? 'none' : undefined,
            }} />
          </div>
        ))}
      </div>

      {/* Top left: avatar + user info */}
      <div style={{ position: 'absolute', top: 'calc(28px + env(safe-area-inset-top, 0px))', left: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Avatar with ring */}
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: `2.5px solid ${ring}`, overflow: 'hidden', flexShrink: 0 }}>
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: '#2952E8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 15 }}>
              {(profile.display_name || profile.username || '?').slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
        <div>
          <p style={{ color: '#fff', fontSize: 13, fontWeight: 700, margin: 0, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
            @{profile.username}
          </p>
          <p style={{ color: profile.is_live ? '#E8170A' : 'rgba(255,255,255,0.7)', fontSize: 11, margin: 0, fontWeight: profile.is_live ? 700 : 400, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
            {profile.is_live ? 'Live' : timeAgo(current.created_at)}
          </p>
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={e => { e.stopPropagation(); router.back(); }}
        style={{ position: 'absolute', top: 'calc(28px + env(safe-area-inset-top, 0px))', right: 14, width: 36, height: 36, borderRadius: 18, background: 'rgba(0,0,0,0.4)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        aria-label="Close"
      >
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      {/* Text overlay */}
      {current.text_overlay && (
        <div style={{ position: 'absolute', bottom: '30%', left: 0, right: 0, textAlign: 'center', pointerEvents: 'none' }}>
          <span style={{ background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 20, fontWeight: 700, padding: '6px 16px', borderRadius: 8 }}>
            {current.text_overlay}
          </span>
        </div>
      )}

      {/* Bottom gradient */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 100, background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)', pointerEvents: 'none' }} />
    </div>
  );
}
