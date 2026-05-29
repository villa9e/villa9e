'use client';
import React from 'react';
import { motion } from 'framer-motion';

// ─── Star field ───────────────────────────────────────────────────────────────
function StarField() {
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      {Array.from({ length: 80 }, (_, i) => (
        <motion.div key={i}
          className="absolute rounded-full"
          style={{
            width:  1 + (i % 3 === 0 ? 1.5 : 0.5),
            height: 1 + (i % 3 === 0 ? 1.5 : 0.5),
            left:   `${(i * 37 + 3) % 98}%`,
            top:    `${(i * 53 + 7) % 70}%`,
            background: i % 7 === 0 ? '#C0D8FF' : i % 5 === 0 ? '#FFE0A0' : '#FFFFFF',
          }}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 2 + (i % 5) * 0.8, repeat: Infinity, delay: (i * 0.18) % 4, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

// ─── Nebula cloud ─────────────────────────────────────────────────────────────
function NebulaCloud({ top, left, color, size = 300 }: {
  top: string; left: string; color: string; size?: number;
}) {
  return (
    <motion.div
      className="fixed pointer-events-none"
      style={{ top, left, width: size, height: size,
        background: `radial-gradient(ellipse, ${color} 0%, transparent 70%)`,
        filter: 'blur(40px)', zIndex: 0,
      }}
      animate={{ opacity: [0.08, 0.18, 0.08], scale: [1, 1.15, 1] }}
      transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

// ─── Film projector beam ──────────────────────────────────────────────────────
function ProjectorBeam() {
  return (
    <div className="fixed top-0 left-1/2 pointer-events-none" style={{ zIndex: 1, marginLeft: -60 }}>
      <svg width="120" height="400" viewBox="0 0 120 400" opacity="0.08">
        {/* Beam trapezoid */}
        <path d="M55,0 L65,0 L110,400 L10,400 Z" fill="rgba(255,240,200,1)" />
        {/* Dust particles in beam */}
        {Array.from({ length: 20 }, (_, i) => (
          <circle key={i}
            cx={55 + (i % 5) * 12 + 5}
            cy={10 + i * 19}
            r="1.5"
            fill="white" opacity={0.6 - i * 0.02}
          />
        ))}
      </svg>
    </div>
  );
}

// ─── Film reel decoration ─────────────────────────────────────────────────────
function FilmReel({ x, y, size = 60, opacity = 0.2 }: {
  x: number | string; y: number | string; size?: number; opacity?: number;
}) {
  return (
    <div style={{ position: 'fixed', left: x, top: y, pointerEvents: 'none', zIndex: 1 }}>
      <svg width={size} height={size} viewBox="0 0 60 60" opacity={opacity}>
        <circle cx="30" cy="30" r="28" fill="none" stroke="#888" strokeWidth="3" />
        <circle cx="30" cy="30" r="10" fill="#333" stroke="#888" strokeWidth="2" />
        {/* Sprocket holes */}
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return <rect key={i} x={30 + Math.cos(a) * 19 - 3.5} y={30 + Math.sin(a) * 19 - 3.5}
            width="7" height="7" rx="1.5" fill="#1A1A1A" stroke="#888" strokeWidth="1" />;
        })}
        {/* Center hub */}
        <circle cx="30" cy="30" r="4" fill="#555" />
      </svg>
    </div>
  );
}

export function DreamLineInterior({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden"
      style={{ background: 'linear-gradient(160deg, #03010A 0%, #050212 50%, #030110 100%)' }}>

      {/* ── Deep space atmosphere ──────────────────────────────────────── */}
      <StarField />

      {/* ── Nebula clouds ─────────────────────────────────────────────── */}
      <NebulaCloud top="5%"  left="10%"  color="rgba(100,0,180,0.6)"  size={280} />
      <NebulaCloud top="30%" left="60%"  color="rgba(0,80,160,0.5)"   size={320} />
      <NebulaCloud top="60%" left="20%"  color="rgba(0,120,100,0.4)"  size={240} />
      <NebulaCloud top="10%" left="70%"  color="rgba(160,40,80,0.35)" size={200} />

      {/* ── Projector beam from ceiling ────────────────────────────────── */}
      <ProjectorBeam />

      {/* ── Film reels — decorative ────────────────────────────────────── */}
      <FilmReel x="4%" y="20%" opacity={0.18} />
      <FilmReel x="4%" y="55%" size={45} opacity={0.14} />

      {/* ── Shooting stars ────────────────────────────────────────────── */}
      {Array.from({ length: 5 }, (_, i) => (
        <motion.div key={i}
          className="fixed pointer-events-none"
          style={{
            height: 1, width: 60 + i * 20,
            left:   `${(i * 23 + 10) % 70}%`,
            top:    `${(i * 17 + 5) % 40}%`,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
            zIndex: 1,
          }}
          animate={{ x: [0, 200], opacity: [0, 0.7, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 2.8 + 1, ease: 'easeOut' }}
        />
      ))}

      {/* ── Screen glow — bottom ambient ─────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 pointer-events-none" style={{
        height: 80, zIndex: 1,
        background: 'linear-gradient(180deg, transparent, rgba(30,60,120,0.12))',
      }} />

      {/* ── Cinematic letterbox bars ───────────────────────────────────── */}
      <div className="fixed top-0 left-0 right-0 h-10 pointer-events-none"
        style={{ zIndex: 3, background: 'rgba(0,0,0,0.4)' }} />
      <div className="fixed bottom-0 left-0 right-0 h-10 pointer-events-none"
        style={{ zIndex: 3, background: 'rgba(0,0,0,0.4)' }} />

      {/* ── Content ───────────────────────────────────────────────────── */}
      <div className="relative" style={{ zIndex: 10 }}>
        {children}
      </div>
    </div>
  );
}
