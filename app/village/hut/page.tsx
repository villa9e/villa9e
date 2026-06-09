'use client';
import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { QRCodeSVG } from 'qrcode.react';

// ── Number formatter ──────────────────────────────────────────────
function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// ── SVG Icons ─────────────────────────────────────────────────────
function IconBack() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}
function IconAddFriend() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="17" y1="11" x2="23" y2="11" />
    </svg>
  );
}
function IconHeart({ color }: { color: string }) {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill={color}>
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}
function IconCalendar() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function IconMoreDots() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="white">
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  );
}
function IconCheckBadge() {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12l2 2 4-4" />
      <path d="M12 2l2.4 1.6L17 3l.8 2.8L20.4 7l-1 2.8L21 12l-1.6 2.2.6 3-2.8.4L15.4 20 12 22l-3.4-2-2.8-2.4L6.4 17 3 18l-.6-3L.4 12.2 1 9.4l-1-2.8 2.6-1.2L3 2.4l3-.4L8 .6 12 2z" />
    </svg>
  );
}
function IconVerified() {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function IconStar() {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}
function IconChat() {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}
function IconHandshake() {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}
function IconFist() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 11V8a2 2 0 00-4 0v1a2 2 0 00-2 0V8a2 2 0 00-4 0v3" />
      <rect x="6" y="11" width="12" height="8" rx="2" />
    </svg>
  );
}
function IconGrid() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}
function IconRepost() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 014-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 01-4 4H3" />
    </svg>
  );
}
function IconPin() {
  return (
    <svg width={10} height={10} viewBox="0 0 24 24" fill="white">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
    </svg>
  );
}
function IconLink() {
  return (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  );
}
function IconStore() {
  return (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  );
}
function IconFolder() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
    </svg>
  );
}
function IconVideo() {
  return (
    <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" />
    </svg>
  );
}
function IconShare() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  );
}
function IconSpirit() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l1.5 4.5H18l-3.75 2.75 1.5 4.5L12 11l-3.75 2.75 1.5-4.5L6 6.5h4.5L12 2z" />
      <path d="M12 15v7M8 19h8" />
    </svg>
  );
}
function IconQR() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="2" y="2" width="8" height="8" rx="1" />
      <rect x="14" y="2" width="8" height="8" rx="1" />
      <rect x="2" y="14" width="8" height="8" rx="1" />
      <path d="M14 14h2v2h-2zm4 0h2v2h-2zm-4 4h2v2h-2zm4-4v8" />
    </svg>
  );
}
function IconBlock() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </svg>
  );
}
function IconFlag() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  );
}
function IconPlay() {
  return (
    <svg width={10} height={10} viewBox="0 0 24 24" fill="rgba(255,255,255,0.85)">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

// ── Icon button wrapper ────────────────────────────────────────────
function IconBtn({ children, onPress, href }: { children: React.ReactNode; onPress?: () => void; href?: string }) {
  const style: React.CSSProperties = {
    width: 36,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    background: 'rgba(255,255,255,0.07)',
    border: 'none',
    cursor: 'pointer',
    flexShrink: 0,
  };
  if (href) {
    return (
      <Link href={href} style={{ ...style, textDecoration: 'none' }}>
        {children}
      </Link>
    );
  }
  return (
    <button onClick={onPress} style={style}>
      {children}
    </button>
  );
}

// ── Stat block ────────────────────────────────────────────────────
function Stat({ n, label, href }: { n: number; label: string; href?: string }) {
  const inner = (
    <>
      <span style={{ fontSize: 20, fontWeight: 900, color: '#F0F4FF' }}>{fmt(n)}</span>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(240,244,255,0.45)' }}>{label}</span>
    </>
  );
  const baseStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, textDecoration: 'none' };
  if (href) return <Link href={href} style={baseStyle}>{inner}</Link>;
  return <div style={baseStyle}>{inner}</div>;
}

// ── Count Pill ────────────────────────────────────────────────────
function CountPill({ icon, count, label, onTap }: { icon: React.ReactNode; count: number; label: string; onTap?: () => void }) {
  return (
    <button
      onClick={onTap}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 8px',
        borderRadius: 20,
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        cursor: 'pointer',
      }}
    >
      <span style={{ color: 'white', display: 'flex', alignItems: 'center' }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 800, color: 'white' }}>{fmt(count)}</span>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{label}</span>
    </button>
  );
}

// ── More bottom sheet ─────────────────────────────────────────────
function MoreMenu({ onClose, onShareProfile }: { onClose: () => void; onShareProfile: () => void }) {
  const items = [
    { icon: <IconShare />, label: 'Share Profile', action: onShareProfile },
    { icon: <IconQR />, label: 'Scan QR Code', action: onClose },
    { icon: <IconBlock />, label: 'Block', action: onClose },
    { icon: <IconFlag />, label: 'Report', action: onClose },
  ];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60 }}
        animate={{ y: 0 }}
        exit={{ y: 60 }}
        onClick={e => e.stopPropagation()}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#0E1630',
          borderRadius: '24px 24px 0 0',
          padding: '12px 0 40px',
        }}
      >
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)', margin: '0 auto 20px' }} />
        {items.map(it => (
          <button
            key={it.label}
            onClick={() => { it.action(); if (it.label !== 'Share Profile') onClose(); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              width: '100%',
              padding: '14px 24px',
              fontSize: 15,
              color: '#F0F4FF',
              fontWeight: 600,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {it.icon}
            {it.label}
          </button>
        ))}
      </motion.div>
    </motion.div>
  );
}

// ── QR Share Modal ────────────────────────────────────────────────
function QRShareModal({ username, onClose }: { username: string; onClose: () => void }) {
  const profileUrl = `https://villa9e.app/${username}`;
  const [copied, setCopied] = useState(false);

  function copyLink() {
    navigator.clipboard.writeText(profileUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      // Fallback for environments without clipboard API
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function nativeShare() {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      (navigator as any).share({ title: `@${username} on villa9e`, url: profileUrl }).catch(() => {});
    } else {
      copyLink();
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 480,
          background: '#0E1630',
          borderRadius: '24px 24px 0 0',
          padding: '20px 24px 48px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0,
        }}
      >
        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)', marginBottom: 20 }} />

        {/* Title */}
        <p style={{ fontWeight: 900, fontSize: 18, color: '#F0F4FF', marginBottom: 20 }}>Share Profile</p>

        {/* QR code */}
        <div style={{ padding: 16, background: '#FFFFFF', borderRadius: 20, marginBottom: 16 }}>
          <QRCodeSVG
            value={profileUrl}
            size={240}
            bgColor="#FFFFFF"
            fgColor="#0033CC"
            level="M"
          />
        </div>

        {/* Username */}
        <p style={{ fontSize: 16, fontWeight: 800, color: '#F0F4FF', marginBottom: 4 }}>@{username}</p>
        <p style={{ fontSize: 13, color: 'rgba(240,244,255,0.4)', marginBottom: 24 }}>{profileUrl}</p>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, width: '100%' }}>
          <button
            onClick={copyLink}
            style={{ flex: 1, padding: '13px 0', borderRadius: 16, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: copied ? '#1D9E75' : '#F0F4FF', fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            {copied ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                Copied!
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                Copy link
              </>
            )}
          </button>
          <button
            onClick={nativeShare}
            style={{ flex: 1, padding: '13px 0', borderRadius: 16, background: '#4D72FF', border: 'none', color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/></svg>
            Share
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Highlight circle (SVG icon per label, no emoji) ───────────────
const HIGHLIGHT_ICONS: Record<string, React.ReactNode> = {
  'My Goals': <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  'Wins': <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
  'Journey': <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" strokeLinecap="round"><path d="M3 12h18M3 6l9-3 9 3M3 18l9 3 9-3"/></svg>,
};
const DEFAULT_HIGHLIGHT_ICON = (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" strokeLinecap="round">
    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
  </svg>
);

function HighlightCircle({ label }: { label: string }) {
  return (
    <button style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, background: 'transparent', border: 'none', cursor: 'pointer' }}>
      <div style={{ width: 64, height: 64, borderRadius: 32, background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {HIGHLIGHT_ICONS[label] ?? DEFAULT_HIGHLIGHT_ICON}
      </div>
      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: 700, maxWidth: 64, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {label}
      </span>
    </button>
  );
}

// ── Video thumbnail ───────────────────────────────────────────────
function VideoThumb({ post, onTap }: { post: any; onTap?: () => void }) {
  const url = post?.media_urls?.[0];
  const views = post?.view_count ?? 0;
  const pinned = post?.is_pinned;
  return (
    <button
      onClick={onTap}
      style={{
        aspectRatio: '9/16',
        position: 'relative',
        overflow: 'hidden',
        background: '#0E1630',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        display: 'block',
        width: '100%',
      }}
    >
      {url ? (
        <video src={url} muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#0E1630,#1A2448)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconVideo />
        </div>
      )}
      {pinned && (
        <div style={{ position: 'absolute', top: 4, left: 4 }}>
          <IconPin />
        </div>
      )}
      <div style={{ position: 'absolute', bottom: 4, left: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
        <IconPlay />
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.85)', fontWeight: 700 }}>{fmt(views)}</span>
      </div>
    </button>
  );
}

// ── Pill detail sheet ─────────────────────────────────────────────
type PillType = 'verified' | 'successes' | 'testimonials' | 'deals';
function PillSheet({ type, onClose }: { type: PillType; onClose: () => void }) {
  const config: Record<PillType, { title: string; icon: React.ReactNode; body: string; cta?: { label: string; href: string } }> = {
    verified: {
      title: 'Verifications',
      icon: <svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="#4D72FF" strokeWidth="1.5" strokeLinecap="round"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
      body: 'Complete goals, earn OoWops from the village, and top performers receive verification badges. Keep building.',
    },
    successes: {
      title: 'Successes',
      icon: <svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="1.5" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
      body: 'Every completed goal step is a Success. Start a goal, follow the GPS, and complete actions to earn them.',
      cta: { label: 'Go to Workshop', href: '/village/workshop' },
    },
    testimonials: {
      title: 'Testimonials',
      icon: <svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="#D4A030" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
      body: 'Testimonials are written by your tribe members celebrating your work and character.',
    },
    deals: {
      title: 'Deals',
      icon: <svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="#4D72FF" strokeWidth="1.5" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
      body: 'Active and completed deals you are party to in the Trading Post.',
      cta: { label: 'View Trading Post', href: '/village/trading-post' },
    },
  };
  const c = config[type];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(0,0,0,0.75)', display: 'flex', flexDirection: 'column' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', marginTop: 80, background: '#0E1630', borderRadius: '24px 24px 0 0', overflow: 'hidden' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <p style={{ fontWeight: 900, fontSize: 16, color: '#F0F4FF' }}>{c.title}</p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
          <div style={{ marginBottom: 16 }}>{c.icon}</div>
          <p style={{ color: '#F0F4FF', fontWeight: 800, fontSize: 18, marginBottom: 8 }}>{c.title}</p>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.5, marginBottom: 24 }}>{c.body}</p>
          {c.cta && (
            <Link
              href={c.cta.href}
              onClick={onClose}
              style={{ padding: '12px 28px', borderRadius: 24, background: '#4D72FF', color: '#fff', fontWeight: 800, textDecoration: 'none', fontSize: 14 }}
            >
              {c.cta.label}
            </Link>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Types ─────────────────────────────────────────────────────────
type ContentTab = 'grid' | 'repost' | 'oowop';

// ── Main page ─────────────────────────────────────────────────────
function HutPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const viewedUserId = searchParams.get('userId');

  const [uid, setUid] = useState<string | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending' | 'accepted' | 'self'>('self');
  const [followLoading, setFollowLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    following: 0,
    tribe: 0,
    oowops: 0,
    verifications: 0,
    successes: 0,
    testimonials: 0,
    deals: 0,
  });
  const [vlgBalance, setVlgBalance] = useState<number>(0);
  const [hasStore, setHasStore] = useState(false);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [pinnedPosts, setPinnedPosts] = useState<any[]>([]);
  const [oowopedPosts, setOowopedPosts] = useState<any[]>([]);
  const [hasDrafts, setHasDrafts] = useState(false);
  const [highlights, setHighlights] = useState<{ id: string; title: string }[]>([]);
  const [hasActiveStory, setHasActiveStory] = useState(false);
  const [tab, setTab] = useState<ContentTab>('grid');
  const [showMore, setShowMore] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pillModal, setPillModal] = useState<PillType | null>(null);

  const touchRef = useRef<{ x: number; y: number } | null>(null);

  // Desktop arrow-key navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') router.push('/village/hospital');
      if (e.key === 'ArrowRight') router.push('/village/spaces');
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [router]);

  useEffect(() => { loadAll(); }, [viewedUserId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadAll() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    setUid(user.id);

    const targetUserId = viewedUserId || user.id;
    const ownProfile = targetUserId === user.id;
    setIsOwnProfile(ownProfile);

    const [
      profRes,
      followRes,
      tribeRes,
      oowopCntRes,
      sprintRes,
      storeRes,
      dealRes,
      testimonialRes,
      postsRes,
      pinnedRes,
      highlightsRes,
      draftsRes,
      storiesRes,
      connRes,
    ] = await Promise.allSettled([
      // profiles — include is_live and is_online for ring color
      (supabase as any).from('profiles').select('*, is_live, is_online').eq('id', targetUserId).single(),
      // following count (requester)
      (supabase as any).from('connections').select('id', { count: 'exact', head: true }).eq('requester_id', targetUserId).eq('status', 'accepted'),
      // tribe/followers count (addressee)
      (supabase as any).from('connections').select('id', { count: 'exact', head: true }).eq('addressee_id', targetUserId).eq('status', 'accepted'),
      // total oowops received
      (supabase as any).from('oowops').select('id', { count: 'exact', head: true }).eq('receiver_id', targetUserId),
      // goals → sprints completed
      (supabase as any).from('goals').select('id, goal_steps(id,status)').eq('user_id', targetUserId),
      // trading post store
      (supabase as any).from('trading_post_listings').select('id').eq('user_id', targetUserId).eq('is_active', true).limit(1),
      // deals
      (supabase as any).from('deals').select('id', { count: 'exact', head: true }).or(`requester_id.eq.${targetUserId},provider_id.eq.${targetUserId}`).in('status', ['active', 'completed']),
      // testimonials
      (supabase as any).from('testimonials').select('id', { count: 'exact', head: true }).eq('receiver_id', targetUserId),
      // public posts
      (supabase as any).from('dream_line_posts').select('id,content,media_urls,media_types,view_count,is_pinned,created_at').eq('user_id', targetUserId).eq('visibility', 'public').order('created_at', { ascending: false }).limit(30),
      // pinned posts
      (supabase as any).from('dream_line_posts').select('id,content,media_urls,view_count,is_pinned').eq('user_id', targetUserId).eq('is_pinned', true).limit(3),
      // highlights
      (supabase as any).from('profile_highlights').select('*').eq('user_id', targetUserId).order('display_order'),
      // drafts existence check — own profile only (private)
      ownProfile
        ? (supabase as any).from('dream_line_posts').select('id', { count: 'exact', head: true }).eq('user_id', targetUserId).eq('status', 'draft')
        : Promise.resolve({ count: 0 }),
      // active stories (24h expiry)
      (supabase as any).from('stories').select('id', { count: 'exact', head: true }).eq('user_id', targetUserId).gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      // connection status with the viewed user — only when viewing someone else
      ownProfile
        ? Promise.resolve({ data: null })
        : (supabase as any).from('connections').select('id, status, requester_id')
            .or(`and(requester_id.eq.${user.id},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${user.id})`)
            .maybeSingle(),
    ]);

    if (profRes.status === 'fulfilled') {
      setProfile(profRes.value.data);
      if (ownProfile) {
        const bal = parseFloat(profRes.value.data?.vlg_balance ?? '0') || 0;
        setVlgBalance(bal);
      }
    }
    if (connRes.status === 'fulfilled' && !ownProfile) {
      const conn = (connRes.value as any)?.data;
      setConnectionStatus(conn?.status === 'accepted' ? 'accepted' : conn?.status === 'pending' ? 'pending' : 'none');
    } else if (ownProfile) {
      setConnectionStatus('self');
    }
    if (postsRes.status === 'fulfilled') setPosts(postsRes.value.data ?? []);
    if (pinnedRes.status === 'fulfilled') setPinnedPosts(pinnedRes.value.data ?? []);
    if (highlightsRes.status === 'fulfilled') setHighlights(highlightsRes.value.data ?? []);
    if (draftsRes.status === 'fulfilled') setHasDrafts((draftsRes.value.count ?? 0) > 0);
    if (storiesRes.status === 'fulfilled') setHasActiveStory((storiesRes.value.count ?? 0) > 0);

    // Store
    if (storeRes.status === 'fulfilled') {
      const rows = storeRes.value.data ?? [];
      setHasStore(rows.length > 0);
      if (rows.length > 0) setStoreId(rows[0].id ?? null);
    }

    // Successes: count completed goal steps
    let successes = 0;
    if (sprintRes.status === 'fulfilled') {
      (sprintRes.value.data ?? []).forEach((g: any) => {
        successes += (g.goal_steps ?? []).filter((s: any) => s.status === 'completed').length;
      });
    }

    setStats({
      following:     followRes.status === 'fulfilled'     ? (followRes.value.count ?? 0)      : 0,
      tribe:         tribeRes.status === 'fulfilled'      ? (tribeRes.value.count ?? 0)       : 0,
      oowops:        oowopCntRes.status === 'fulfilled'   ? (oowopCntRes.value.count ?? 0)    : 0,
      verifications: 0,
      successes,
      testimonials:  testimonialRes.status === 'fulfilled' ? (testimonialRes.value.count ?? 0) : 0,
      deals:         dealRes.status === 'fulfilled'       ? (dealRes.value.count ?? 0)        : 0,
    });

    setLoading(false);
  }

  async function loadOowopedPosts() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const targetUserId = viewedUserId || user.id;
    const { data: ows } = await (supabase as any)
      .from('oowops')
      .select('post_id, dream_line_posts(id,content,media_urls,view_count,created_at)')
      .eq('giver_id', targetUserId)
      .order('created_at', { ascending: false })
      .limit(18);
    setOowopedPosts((ows ?? []).map((o: any) => o.dream_line_posts).filter(Boolean));
  }

  useEffect(() => {
    if (tab === 'oowop') loadOowopedPosts();
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Connect / Message (other users' profiles) ──────────────────
  async function handleFollow() {
    if (!viewedUserId || followLoading || connectionStatus === 'accepted') return;
    setFollowLoading(true);
    try {
      const res = await fetch('/api/connections/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addressee_id: viewedUserId }),
      }).then(r => r.json()).catch(() => ({}));
      if (res?.exists) setConnectionStatus(res.status === 'accepted' ? 'accepted' : 'pending');
      else if (res?.ok) setConnectionStatus('pending');
    } finally {
      setFollowLoading(false);
    }
  }

  function handleMessage() {
    if (!viewedUserId) return;
    router.push(`/messages?with=${viewedUserId}`);
  }

  // ── Touch swipe ────────────────────────────────────────────────
  function onTouchStart(e: React.TouchEvent) {
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (!touchRef.current) return;
    const dx = e.changedTouches[0].clientX - touchRef.current.x;
    const dy = Math.abs(e.changedTouches[0].clientY - touchRef.current.y);
    if (Math.abs(dx) > 60 && dy < 50) {
      // swipe RIGHT → Spaces, swipe LEFT → Hospital/Wellness
      if (dx > 0) router.push('/village/spaces');
      else router.push('/village/hospital');
    }
    touchRef.current = null;
  }

  const displayName = profile?.display_name || profile?.username || '…';
  const displayPosts = tab === 'grid'
    ? posts.filter(p => !p.is_pinned)
    : tab === 'oowop'
    ? oowopedPosts
    : [];

  // Determine ring color based on priority:
  // 1. Red (#E24B4A) — is_live
  // 2. Green (#1D9E75) — active story within 24h
  // 3. Royal blue (#2952E8) — is_online
  // 4. Navy (#0033CC) — offline default
  const ringColor = profile?.is_live
    ? '#E24B4A'
    : hasActiveStory
    ? '#1D9E75'
    : profile?.is_online
    ? '#2952E8'
    : '#0033CC';
  const storyRing = { padding: 3, background: ringColor };

  // ── Mock highlights (fallback if none in DB) ───────────────────
  const shownHighlights: { id: string; title: string }[] =
    highlights.length > 0
      ? highlights
      : [
          { id: 'mock-1', title: 'My Goals' },
          { id: 'mock-2', title: 'Wins' },
          { id: 'mock-3', title: 'Journey' },
        ];

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{ background: '#080E24', minHeight: '100vh', color: '#F0F4FF', overflowX: 'hidden', paddingBottom: 80 }}
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          padding: '10px 12px',
          background: 'rgba(8,14,36,0.95)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          gap: 8,
        }}
      >
        {/* Back */}
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          style={{
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 18,
            background: 'rgba(255,255,255,0.07)',
            border: 'none',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <IconBack />
        </button>

        {/* Username center */}
        <div style={{ flex: 1, textAlign: 'center' }}>
          <span style={{ fontSize: 16, fontWeight: 900, letterSpacing: '-0.01em', color: '#F0F4FF' }}>
            @{loading ? '…' : (profile?.username ?? '…')}
          </span>
        </div>

        {/* Right icon cluster */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {/* Add Friend — only when viewing someone else */}
          {!isOwnProfile && (
            <IconBtn onPress={handleFollow}>
              <IconAddFriend />
            </IconBtn>
          )}
          {/* Ask Spirit — web-aware AI chat */}
          {isOwnProfile && (
            <IconBtn href="/village/spirit/ask">
              <IconSpirit />
            </IconBtn>
          )}
          {/* Health shortcut — green heart */}
          <IconBtn href="/village/hospital">
            <IconHeart color="#1D9E75" />
          </IconBtn>
          {/* Spaces shortcut */}
          <IconBtn href="/village/spaces">
            <IconCalendar />
          </IconBtn>
          {/* More ⋯ */}
          <IconBtn onPress={() => setShowMore(true)}>
            <IconMoreDots />
          </IconBtn>
        </div>
      </header>

      {/* ── Avatar + Stats ──────────────────────────────────────── */}
      <div style={{ padding: '20px 16px 12px', display: 'flex', alignItems: 'center', gap: 20 }}>
        {/* Avatar column */}
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          {/* Story ring */}
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 44,
              position: 'relative',
              ...storyRing,
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: 100,
                overflow: 'hidden',
                border: '2.5px solid #080E24',
                background: '#1A2448',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={profile?.avatar_url || '/default-avatar.png'}
                alt="Profile avatar"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            {/* Verified badge */}
            {profile?.is_verified && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  background: '#4D72FF',
                  border: '2px solid #080E24',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconCheckBadge />
              </div>
            )}
          </div>
          {/* Avatar edit button — own profile only */}
          {isOwnProfile && (
            <Link
              href="/village/hut/avatar"
              style={{
                display: 'block',
                textAlign: 'center',
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 8,
                padding: '3px 10px',
                fontSize: 10,
                fontWeight: 800,
                color: 'rgba(255,255,255,0.65)',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              + Avatar
            </Link>
          )}
        </div>

        {/* Stats row */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-around' }}>
          <Stat n={stats.following} label="Following" href="/village/discover" />
          <Stat n={stats.tribe} label="Tribe" href="/village/tribes" />
          <Stat n={stats.oowops} label="OoWops" />
        </div>
      </div>

      {/* $VLG balance pill — own profile only (private balance) */}
      {isOwnProfile && (
      <div style={{ padding: '0 16px 10px' }}>
        <Link
          href="/village/hut/vlg-wallet"
          style={{
            display:        'inline-flex',
            alignItems:     'center',
            gap:            8,
            background:     'rgba(239,159,39,0.1)',
            border:         '1px solid rgba(239,159,39,0.25)',
            borderRadius:   999,
            padding:        '6px 16px',
            textDecoration: 'none',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF9F27" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#EF9F27' }}>
            {vlgBalance.toLocaleString()} $VLG
          </span>
        </Link>
      </div>
      )}

      {/* ── Bio + Counts ────────────────────────────────────────── */}
      <div style={{ padding: '0 16px 14px' }}>
        {/* Display name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 15, fontWeight: 900, color: '#F0F4FF' }}>{displayName}</span>
          {profile?.pronouns && (
            <span style={{ fontSize: 12, color: 'rgba(240,244,255,0.35)' }}>{profile.pronouns}</span>
          )}
        </div>

        {/* Count pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          <CountPill
            icon={<IconVerified />}
            count={stats.verifications}
            label="Verified"
            onTap={() => setPillModal('verified')}
          />
          <CountPill
            icon={<IconStar />}
            count={stats.successes}
            label="Successes"
            onTap={() => setPillModal('successes')}
          />
          <CountPill
            icon={<IconChat />}
            count={stats.testimonials}
            label="Testimonials"
            onTap={() => setPillModal('testimonials')}
          />
          <CountPill
            icon={<IconHandshake />}
            count={stats.deals}
            label="Deals"
            onTap={() => setPillModal('deals')}
          />
        </div>

        {/* Bio */}
        {profile?.bio && (
          <p style={{ fontSize: 13, color: 'rgba(240,244,255,0.8)', lineHeight: 1.5, marginBottom: 8 }}>
            {profile.bio.slice(0, 80)}
          </p>
        )}

        {/* Trading Post store link */}
        {hasStore ? (
          <Link
            href={storeId ? `/village/trading-post/market/${storeId}` : '/village/trading-post'}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#F0F4FF', marginBottom: 4, fontWeight: 700, textDecoration: 'none' }}
          >
            <IconStore />
            Trading Post
          </Link>
        ) : null}

        {/* Link in bio */}
        {profile?.link_in_bio && (
          <a
            href={profile.link_in_bio}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#4D72FF', fontWeight: 700, textDecoration: 'none' }}
          >
            <IconLink />
            <span style={{ textDecoration: 'underline' }}>
              {(profile.link_in_bio as string).replace(/^https?:\/\//, '')}
            </span>
          </a>
        )}
      </div>

      {/* ── Action Buttons ──────────────────────────────────────── */}
      <div style={{ padding: '0 16px 16px', display: 'flex', gap: 8 }}>
        {isOwnProfile ? (
          <Link
            href="/village/hut/settings"
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px 0',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
              fontSize: 14,
              fontWeight: 800,
              color: '#F0F4FF',
              textDecoration: 'none',
            }}
          >
            Edit Profile
          </Link>
        ) : (
          <>
            <button
              onClick={handleFollow}
              disabled={followLoading || connectionStatus === 'accepted'}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px 0',
                borderRadius: 10,
                background: connectionStatus === 'accepted' ? 'rgba(255,255,255,0.07)' : '#4D72FF',
                border: connectionStatus === 'accepted' ? '1px solid rgba(255,255,255,0.12)' : 'none',
                fontSize: 14,
                fontWeight: 800,
                color: '#F0F4FF',
                cursor: followLoading || connectionStatus === 'accepted' ? 'default' : 'pointer',
                opacity: followLoading ? 0.6 : 1,
              }}
            >
              {connectionStatus === 'accepted' ? 'Connected' : connectionStatus === 'pending' ? 'Pending' : 'Add Friend'}
            </button>
            <button
              onClick={handleMessage}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px 0',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
                fontSize: 14,
                fontWeight: 800,
                color: '#F0F4FF',
                cursor: 'pointer',
              }}
            >
              Message
            </button>
          </>
        )}
      </div>

      {/* ── Highlights / Playlists ──────────────────────────────── */}
      <div style={{ paddingLeft: 16, paddingBottom: 16, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ display: 'flex', gap: 16, paddingRight: 16 }}>
          {shownHighlights.map(hl => (
            <HighlightCircle key={hl.id} label={hl.title} />
          ))}
        </div>
      </div>

      {/* ── Content Tab Bar ─────────────────────────────────────── */}
      <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.07)', borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: 2 }}>
        {([
          { id: 'grid' as ContentTab, icon: <IconGrid /> },
          { id: 'repost' as ContentTab, icon: <IconRepost /> },
          { id: 'oowop' as ContentTab, icon: <IconFist /> },
        ] as { id: ContentTab; icon: React.ReactNode }[]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1,
              padding: '11px 0',
              display: 'flex',
              justifyContent: 'center',
              color: tab === t.id ? '#F0F4FF' : 'rgba(255,255,255,0.3)',
              background: 'transparent',
              border: 'none',
              borderBottom: tab === t.id ? '2px solid #F0F4FF' : '2px solid transparent',
              cursor: 'pointer',
            } as React.CSSProperties}
          >
            {t.icon}
          </button>
        ))}
      </div>

      {/* ── Video Grid ──────────────────────────────────────────── */}
      {tab === 'repost' ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'rgba(255,255,255,0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
            <IconRepost />
          </div>
          <p style={{ fontSize: 13 }}>No reposts yet</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
          {/* Drafts folder — grid tab only, only if drafts exist */}
          {tab === 'grid' && hasDrafts && (
            <Link
              href="/village/studio"
              style={{
                aspectRatio: '9/16',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                background: 'rgba(255,255,255,0.04)',
                border: '1px dashed rgba(255,255,255,0.1)',
                textDecoration: 'none',
              }}
            >
              <IconFolder />
              <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.4)' }}>Drafts</span>
            </Link>
          )}

          {/* Pinned posts — grid tab only */}
          {tab === 'grid' && pinnedPosts.map(p => (
            <VideoThumb key={`pin-${p.id}`} post={{ ...p, is_pinned: true }} />
          ))}

          {/* Regular posts */}
          {displayPosts.length > 0
            ? displayPosts.map(p => (
                <VideoThumb key={p.id} post={p} />
              ))
            : (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px 20px', color: 'rgba(255,255,255,0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                  {tab === 'oowop' ? <IconFist /> : <IconVideo />}
                </div>
                <p style={{ fontSize: 13 }}>
                  {tab === 'oowop' ? 'No OoWops given yet' : 'No posts yet. Create something.'}
                </p>
                {tab === 'grid' && (
                  <Link
                    href="/village/studio"
                    style={{
                      display: 'inline-block',
                      marginTop: 12,
                      padding: '8px 20px',
                      borderRadius: 20,
                      background: '#4D72FF',
                      color: '#fff',
                      fontSize: 13,
                      fontWeight: 700,
                      textDecoration: 'none',
                    }}
                  >
                    Create Now
                  </Link>
                )}
              </div>
            )
          }
        </div>
      )}

      {/* ── Desktop nav arrows ──────────────────────────────────── */}
      <button
        onClick={() => router.push('/village/hospital')}
        className="hidden sm:flex"
        style={{
          position: 'fixed',
          left: 16,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 10,
          width: 40,
          height: 40,
          borderRadius: 20,
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.12)',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          backdropFilter: 'blur(8px)',
        }}
      >
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <button
        onClick={() => router.push('/village/spaces')}
        className="hidden sm:flex"
        style={{
          position: 'fixed',
          right: 16,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 10,
          width: 40,
          height: 40,
          borderRadius: 20,
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.12)',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          backdropFilter: 'blur(8px)',
        }}
      >
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      {/* ── Swipe hints (mobile) ────────────────────────────────── */}
      <div
        style={{
          position: 'fixed',
          bottom: 110,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'space-between',
          padding: '0 16px',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      >
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.12)', fontWeight: 700 }}>← Wellness</span>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.12)', fontWeight: 700 }}>Spaces →</span>
      </div>

      {/* ── Modals ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {showMore && (
        <MoreMenu
          onClose={() => setShowMore(false)}
          onShareProfile={() => { setShowMore(false); setShowQR(true); }}
        />
      )}
      {showQR && (
        <QRShareModal
          username={profile?.username ?? 'me'}
          onClose={() => setShowQR(false)}
        />
      )}
        {pillModal && (
          <PillSheet type={pillModal} onClose={() => setPillModal(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function HutPage() {
  return (
    <Suspense fallback={
      <div style={{ background: '#080E24', minHeight: '100vh' }} />
    }>
      <HutPageInner />
    </Suspense>
  );
}
