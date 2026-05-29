'use client';
import React from 'react';
import { motion } from 'framer-motion';

// ─── Blueprint wall section ───────────────────────────────────────────────────
function BlueprintPanel() {
  return (
    <svg width="220" height="160" viewBox="0 0 220 160">
      <rect width="220" height="160" fill="#0D2A5A" rx="4" opacity="0.7" />
      {/* Grid lines */}
      {Array.from({ length: 9 }, (_, i) => (
        <line key={`h${i}`} x1="0" y1={10 + i * 17} x2="220" y2={10 + i * 17}
          stroke="#2A5ABF" strokeWidth="0.4" opacity="0.5" />
      ))}
      {Array.from({ length: 12 }, (_, i) => (
        <line key={`v${i}`} x1={10 + i * 19} y1="0" x2={10 + i * 19} y2="160"
          stroke="#2A5ABF" strokeWidth="0.4" opacity="0.5" />
      ))}
      {/* Building footprint drawing */}
      <rect x="40" y="30" width="80" height="60" fill="none" stroke="#60A5FA" strokeWidth="1.5" />
      <rect x="60" y="50" width="16" height="12" fill="none" stroke="#60A5FA" strokeWidth="1" />
      {/* Door */}
      <path d="M100,90 L100,68 Q108,68 108,78 L108,90" fill="none" stroke="#60A5FA" strokeWidth="1" />
      {/* Windows */}
      <rect x="48" y="40" width="10" height="8" fill="none" stroke="#A0C8FF" strokeWidth="0.8" />
      <rect x="88" y="40" width="10" height="8" fill="none" stroke="#A0C8FF" strokeWidth="0.8" />
      {/* Dimension lines */}
      <line x1="40" y1="100" x2="120" y2="100" stroke="#F59E0B" strokeWidth="0.8" />
      <text x="72" y="112" fill="#F59E0B" fontSize="8" textAnchor="middle">12.0m</text>
      <line x1="130" y1="30" x2="130" y2="90" stroke="#F59E0B" strokeWidth="0.8" />
      <text x="148" y="64" fill="#F59E0B" fontSize="8" textAnchor="middle">8.0m</text>
      {/* Title block */}
      <rect x="4" y="140" width="212" height="16" fill="none" stroke="#2A5ABF" strokeWidth="0.8" />
      <text x="110" y="151" fill="#A0C8FF" fontSize="7" textAnchor="middle">VILLA9E WORKSHOP — BUILD PLAN v2.1</text>
    </svg>
  );
}

// ─── Tool silhouette wall ─────────────────────────────────────────────────────
function ToolWall({ side }: { side: 'left' | 'right' }) {
  const flip = side === 'right';
  return (
    <svg width="80" height="520" viewBox="0 0 80 520"
      style={{ transform: flip ? 'scaleX(-1)' : undefined }}>
      {/* Pegboard */}
      {Array.from({ length: 6 }, (_, i) => (
        <line key={i} x1={8 + i * 12} y1="0" x2={8 + i * 12} y2="520"
          stroke="#2A1800" strokeWidth="1" opacity="0.35" />
      ))}
      {Array.from({ length: 14 }, (_, i) => (
        <circle key={i} cx={14 + (i % 6) * 12} cy={20 + Math.floor(i / 6) * 40}
          r="2.5" fill="#2A1800" opacity="0.3" />
      ))}

      {/* Hammer */}
      <g transform="translate(15,55) rotate(-22,18,18)">
        <rect x="14" y="0" width="7" height="32" rx="3" fill="#C8A870" opacity="0.7" />
        <rect x="4" y="-10" width="26" height="13" rx="3" fill="#4A3A28" opacity="0.7" />
        <rect x="0" y="-8" width="12" height="9" rx="2" fill="#5A4A30" opacity="0.6" />
      </g>

      {/* Saw blade */}
      <g transform="translate(5,120)">
        <rect x="4" y="0" width="60" height="8" rx="2" fill="#8A8A8A" opacity="0.55" />
        {Array.from({ length: 10 }, (_, i) => (
          <polygon key={i}
            points={`${6 + i * 6},8 ${9 + i * 6},16 ${12 + i * 6},8`}
            fill="#6A6A6A" opacity="0.55" />
        ))}
        <rect x="2" y="-2" width="18" height="12" rx="3" fill="#C8A870" opacity="0.5" />
      </g>

      {/* Wrench */}
      <g transform="translate(22,185)">
        <ellipse cx="8" cy="4" rx="10" ry="6" fill="none" stroke="#707070" strokeWidth="4" opacity="0.6" />
        <rect x="6" y="8" width="4" height="34" rx="2" fill="#707070" opacity="0.6" />
        <ellipse cx="8" cy="44" rx="6" ry="4" fill="none" stroke="#707070" strokeWidth="3.5" opacity="0.55" />
      </g>

      {/* Ruler */}
      <g transform="translate(6,260)">
        <rect x="0" y="0" width="65" height="10" rx="2" fill="#D4B483" opacity="0.55" />
        {Array.from({ length: 7 }, (_, i) => (
          <line key={i} x1={4 + i * 9} y1="2" x2={4 + i * 9} y2={i % 2 === 0 ? 8 : 5}
            stroke="#8B6914" strokeWidth="1" opacity="0.6" />
        ))}
      </g>

      {/* Level tool */}
      <g transform="translate(5,300)">
        <rect x="0" y="0" width="70" height="14" rx="4" fill="#4A8A3A" opacity="0.45" />
        <ellipse cx="35" cy="7" rx="8" ry="4" fill="none" stroke="#A0E870" strokeWidth="1.5" opacity="0.5" />
        <circle cx="35" cy="7" r="2" fill="#A0E870" opacity="0.5" />
      </g>

      {/* Screwdrivers */}
      <g transform="translate(14,345) rotate(12)">
        <rect x="4" y="0" width="6" height="44" rx="3" fill="#C8A870" opacity="0.6" />
        <rect x="2" y="42" width="10" height="16" rx="1" fill="#7A7A7A" opacity="0.6" />
        <path d="M5,58 L9,68 L7,58 Z" fill="#5A5A5A" opacity="0.55" />
      </g>
      <g transform="translate(42,360) rotate(-8)">
        <rect x="4" y="0" width="6" height="38" rx="3" fill="#D0D0D0" opacity="0.5" />
        <rect x="2" y="36" width="10" height="14" rx="1" fill="#8A3A3A" opacity="0.55" />
        <path d="M6,50 Q7,58 8,50 Z" fill="#5A5A5A" opacity="0.5" />
      </g>

      {/* Pliers */}
      <g transform="translate(8,430)">
        <path d="M20,0 Q28,10 25,30 L15,30 Q12,10 20,0 Z" fill="#5A5A5A" opacity="0.5" />
        <path d="M20,0 Q12,10 15,30 L5,30 Q8,10 20,0 Z" fill="#6A6A6A" opacity="0.45" />
        <line x1="20" y1="30" x2="30" y2="60" stroke="#5A5A5A" strokeWidth="5" opacity="0.45" />
        <line x1="20" y1="30" x2="10" y2="60" stroke="#5A5A5A" strokeWidth="5" opacity="0.45" />
      </g>
    </svg>
  );
}

// ─── Forge glow ───────────────────────────────────────────────────────────────
function ForgeGlow() {
  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 pointer-events-none" style={{ zIndex: 1 }}>
      <motion.div
        animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.08, 1] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          width: 280, height: 120,
          background: 'radial-gradient(ellipse at 50% 100%, rgba(255,80,0,0.22) 0%, rgba(255,140,0,0.08) 50%, transparent 80%)',
          filter: 'blur(12px)',
        }}
      />
    </div>
  );
}

// ─── Spark particles ──────────────────────────────────────────────────────────
function Sparks() {
  return (
    <>
      {Array.from({ length: 18 }, (_, i) => (
        <motion.div key={i}
          className="fixed pointer-events-none rounded-full"
          style={{
            width:  1 + (i % 2),
            height: 1 + (i % 2),
            left:   `${42 + (i % 16) * 1.2}%`,
            bottom: `${2 + (i % 8) * 3}%`,
            background: i % 3 === 0 ? '#FFAA00' : i % 3 === 1 ? '#FF6600' : '#FFDD44',
            zIndex: 2,
          }}
          animate={{ y: [0, -60 - (i % 4) * 20], opacity: [0.9, 0], x: [(i % 5 - 2) * 5, (i % 5 - 2) * 14] }}
          transition={{ duration: 0.8 + (i % 3) * 0.4, repeat: Infinity, delay: i * 0.22, ease: 'easeOut' }}
        />
      ))}
    </>
  );
}

export function WorkshopInterior({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ background: '#080400' }}>

      {/* ── Stone + wood base ─────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: `
          radial-gradient(ellipse at 30% 70%, rgba(80,40,0,0.25) 0%, transparent 55%),
          radial-gradient(ellipse at 70% 80%, rgba(100,50,0,0.2) 0%, transparent 50%),
          linear-gradient(180deg, #0D0600 0%, #080400 60%, #050300 100%)
        `,
        zIndex: 0,
      }} />

      {/* ── Wood floor planks ─────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 h-28 pointer-events-none" style={{
        background: `repeating-linear-gradient(90deg,
          rgba(80,45,15,0.18) 0px, rgba(80,45,15,0.18) 1px,
          transparent 1px, transparent 62px
        ), linear-gradient(180deg, transparent, rgba(50,28,8,0.3))`,
        zIndex: 0,
      }} />

      {/* ── Blueprint panel (background) ──────────────────────────────── */}
      <div className="fixed top-16 left-4 pointer-events-none" style={{ zIndex: 1, opacity: 0.22, transform: 'rotate(-1.5deg)' }}>
        <BlueprintPanel />
      </div>

      {/* ── Tool walls — fixed left and right ─────────────────────────── */}
      <div className="fixed left-0 top-0 bottom-0 pointer-events-none" style={{ zIndex: 1 }}>
        <ToolWall side="left" />
      </div>
      <div className="fixed right-0 top-0 bottom-0 pointer-events-none" style={{ zIndex: 1 }}>
        <ToolWall side="right" />
      </div>

      {/* ── Forge glow — warm orange from below ───────────────────────── */}
      <ForgeGlow />

      {/* ── Sparks rising from forge ───────────────────────────────────── */}
      <Sparks />

      {/* ── Amber overhead lamp glow ───────────────────────────────────── */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 pointer-events-none" style={{
        width: 200, height: 200, zIndex: 1,
        background: 'radial-gradient(circle, rgba(255,180,60,0.09) 0%, transparent 65%)',
      }} />

      {/* ── Smoke wisps (faint) ────────────────────────────────────────── */}
      {Array.from({ length: 5 }, (_, i) => (
        <motion.div key={i}
          className="fixed pointer-events-none rounded-full"
          style={{
            width: 40 + i * 12, height: 40 + i * 12,
            left:  `${45 + (i - 2) * 4}%`,
            bottom: `${8 + i * 2}%`,
            background: 'rgba(150,100,50,0.06)',
            filter: 'blur(16px)',
            zIndex: 1,
          }}
          animate={{ y: [0, -120 - i * 30], opacity: [0.5, 0], scale: [1, 2.5] }}
          transition={{ duration: 4 + i * 0.8, repeat: Infinity, delay: i * 1.1, ease: 'easeOut' }}
        />
      ))}

      {/* ── Content ───────────────────────────────────────────────────── */}
      <div className="relative" style={{ zIndex: 10 }}>
        {children}
      </div>
    </div>
  );
}
