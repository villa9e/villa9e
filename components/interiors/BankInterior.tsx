'use client';
import React from 'react';
import { motion } from 'framer-motion';

// ─── Marble column ────────────────────────────────────────────────────────────
function MarbleColumn({ x }: { x: number }) {
  return (
    <div style={{ position: 'absolute', left: x, top: 0, bottom: 0, width: 18, pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(90deg, #2A2218 0%, #3A3228 25%, #4A4238 50%, #3A3228 75%, #2A2218 100%)',
      }} />
      {/* Marble veins */}
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          position: 'absolute', left: 3 + i * 5, top: 0, bottom: 0, width: 1,
          background: 'rgba(200,180,140,0.12)',
          clipPath: 'polygon(0 0, 100% 10%, 100% 45%, 0 55%, 0 80%, 100% 90%, 100% 100%, 0 100%)',
        }} />
      ))}
      {/* Capital */}
      <div style={{ position: 'absolute', top: 0, left: -4, right: -4, height: 16,
        background: 'linear-gradient(180deg, #5A5040, #3A3028)',
        borderRadius: '0 0 4px 4px',
      }} />
      {/* Base */}
      <div style={{ position: 'absolute', bottom: 0, left: -4, right: -4, height: 16,
        background: 'linear-gradient(180deg, #3A3028, #5A5040)',
        borderRadius: '4px 4px 0 0',
      }} />
    </div>
  );
}

// ─── Gold vault door ──────────────────────────────────────────────────────────
function VaultDoor() {
  return (
    <svg width="160" height="180" viewBox="0 0 160 180">
      {/* Door frame */}
      <rect x="10" y="10" width="140" height="160" rx="4" fill="#2A2010" stroke="#8B6914" strokeWidth="2" />
      {/* Vault wheel */}
      <circle cx="80" cy="90" r="48" fill="none" stroke="#B8860B" strokeWidth="4" />
      <circle cx="80" cy="90" r="36" fill="none" stroke="#D4A800" strokeWidth="2" />
      {/* Spokes */}
      {Array.from({ length: 8 }, (_, i) => {
        const a = i * 45 * Math.PI / 180;
        return <line key={i} x1={80 + Math.cos(a) * 14} y1={90 + Math.sin(a) * 14}
          x2={80 + Math.cos(a) * 46} y2={90 + Math.sin(a) * 46}
          stroke="#D4A800" strokeWidth="3" />;
      })}
      {/* Bolt handles */}
      {[0, 90, 180, 270].map((deg, i) => {
        const a = deg * Math.PI / 180;
        return (
          <g key={i} transform={`translate(${80 + Math.cos(a) * 46},${90 + Math.sin(a) * 46})`}>
            <circle r="5" fill="#B8860B" />
            <circle r="3" fill="#FFD700" opacity="0.6" />
          </g>
        );
      })}
      {/* Center lock */}
      <circle cx="80" cy="90" r="10" fill="#3A2A10" stroke="#D4A800" strokeWidth="2.5" />
      <circle cx="80" cy="90" r="5" fill="#D4A800" opacity="0.7" />
      {/* Rivets */}
      {[20,140].map(x => [20,160].map(y => (
        <circle key={`${x}${y}`} cx={x} cy={y} r="4" fill="#B8860B" />
      )))}
      {/* Hinges */}
      <rect x="6" y="40" width="8" height="24" rx="3" fill="#8B6914" />
      <rect x="6" y="116" width="8" height="24" rx="3" fill="#8B6914" />
    </svg>
  );
}

// ─── Gold coin scatter ────────────────────────────────────────────────────────
function GoldCoins() {
  return (
    <div className="fixed bottom-0 left-0 right-0 pointer-events-none" style={{ zIndex: 1, height: 80 }}>
      {Array.from({ length: 24 }, (_, i) => (
        <div key={i} style={{
          position: 'absolute',
          left:     `${(i * 23 + 5) % 94}%`,
          bottom:   `${(i * 7) % 60}%`,
          width:    10 + (i % 4) * 3,
          height:   10 + (i % 4) * 3,
          borderRadius: '50%',
          background: `radial-gradient(circle at 35% 35%, #FFE066, #D4A800 60%, #8B6000)`,
          opacity:  0.18 + (i % 5) * 0.04,
        }} />
      ))}
    </div>
  );
}

export function BankInterior({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden"
      style={{ background: 'linear-gradient(160deg, #0C0800 0%, #100C04 50%, #0A0800 100%)' }}>

      {/* ── Marble hall atmosphere ─────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: `
          radial-gradient(ellipse at 50% 0%, rgba(180,140,0,0.06) 0%, transparent 50%),
          radial-gradient(ellipse at 20% 100%, rgba(100,80,0,0.08) 0%, transparent 40%)
        `,
        zIndex: 0,
      }} />

      {/* ── Marble columns ─────────────────────────────────────────────── */}
      {[0, 28].map((x, i) => (
        <div key={i} className="fixed pointer-events-none" style={{ left: x, top: 0, bottom: 0, zIndex: 1 }}>
          <MarbleColumn x={0} />
        </div>
      ))}
      {[0, 28].map((x, i) => (
        <div key={i} className="fixed pointer-events-none" style={{ right: x, top: 0, bottom: 0, zIndex: 1 }}>
          <MarbleColumn x={0} />
        </div>
      ))}

      {/* ── Vault door — fixed background ──────────────────────────────── */}
      <div className="fixed pointer-events-none"
        style={{ zIndex: 1, right: '4%', top: '20%', opacity: 0.2, transform: 'rotate(-2deg)' }}>
        <VaultDoor />
      </div>

      {/* ── Gold floor tiles ───────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 h-24 pointer-events-none" style={{
        background: `
          repeating-linear-gradient(90deg, rgba(180,140,0,0.06) 0px, rgba(180,140,0,0.06) 1px, transparent 1px, transparent 52px),
          repeating-linear-gradient(0deg, rgba(180,140,0,0.04) 0px, rgba(180,140,0,0.04) 1px, transparent 1px, transparent 52px)
        `,
        zIndex: 0,
      }} />

      {/* ── Scattered gold coins ─────────────────────────────────────── */}
      <GoldCoins />

      {/* ── Golden overhead glow ─────────────────────────────────────── */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 pointer-events-none" style={{
        width: 400, height: 200, zIndex: 1,
        background: 'radial-gradient(ellipse at 50% 0%, rgba(220,180,0,0.07) 0%, transparent 65%)',
      }} />

      {/* ── Subtle coin glint animation ───────────────────────────────── */}
      <motion.div
        className="fixed pointer-events-none"
        style={{
          zIndex: 1, top: '60%', left: '50%', width: 80, height: 80,
          background: 'radial-gradient(circle, rgba(255,220,0,0.12) 0%, transparent 70%)',
        }}
        animate={{ opacity: [0, 0.5, 0], scale: [0.8, 1.4, 0.8] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
      />

      {/* ── Content ───────────────────────────────────────────────────── */}
      <div className="relative" style={{ zIndex: 10 }}>
        {children}
      </div>
    </div>
  );
}
