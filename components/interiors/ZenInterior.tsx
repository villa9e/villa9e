'use client';
import React from 'react';
import { motion } from 'framer-motion';

// ─── Raked sand garden — top-down pattern ────────────────────────────────────
function SandGarden() {
  const rows = 18;
  const w = 280, h = 100;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <rect width={w} height={h} fill="#E8DEC8" rx="6" />
      {/* Rake lines */}
      {Array.from({ length: rows }, (_, i) => (
        <line key={i} x1="8" y1={5 + i * 5.2} x2={w - 8} y2={5 + i * 5.2}
          stroke="#C8B89A" strokeWidth="0.8" />
      ))}
      {/* Three stones */}
      {[
        { cx: 70, cy: 50, rx: 22, ry: 15, fill: '#8A7A6A' },
        { cx: 145, cy: 38, rx: 14, ry: 10, fill: '#6A5A4A' },
        { cx: 210, cy: 58, rx: 18, ry: 12, fill: '#7A6A5A' },
      ].map((s, i) => (
        <g key={i}>
          {/* Concentric rake rings around each stone */}
          {[1,2,3,4].map(r => (
            <ellipse key={r} cx={s.cx} cy={s.cy} rx={s.rx + r * 8} ry={s.ry + r * 5}
              fill="none" stroke="#C8B89A" strokeWidth="0.7" opacity={0.6 - r * 0.12} />
          ))}
          <ellipse cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} fill={s.fill} />
          <ellipse cx={s.cx - 4} cy={s.cy - 4} rx={s.rx * 0.4} ry={s.ry * 0.4} fill={s.fill} opacity={0.4} />
        </g>
      ))}
    </svg>
  );
}

// ─── Mountain silhouette ──────────────────────────────────────────────────────
function MountainSilhouette() {
  return (
    <svg width="100%" height="180" viewBox="0 0 800 180" preserveAspectRatio="none">
      {/* Far mountains */}
      <path d="M0,180 L120,60 L220,120 L340,30 L480,100 L580,20 L700,80 L800,50 L800,180 Z"
        fill="#0A1A12" opacity="0.5" />
      {/* Mid mountains */}
      <path d="M0,180 L80,90 L180,140 L300,65 L420,120 L520,55 L640,100 L760,70 L800,85 L800,180 Z"
        fill="#0D2018" opacity="0.65" />
      {/* Snow caps */}
      {[
        [300, 65, 45],
        [520, 55, 38],
        [340, 30, 52],
        [580, 20, 48],
      ].map(([px, py, w], i) => (
        <path key={i}
          d={`M${px - w/2},${py + 22} L${px},${py} L${px + w/2},${py + 22} Z`}
          fill="#D8E8F0" opacity={0.55 - i * 0.06} />
      ))}
      {/* Waterfall */}
      <path d="M340,30 Q342,80 338,110 Q336,140 340,180" fill="none"
        stroke="#7AB8D0" strokeWidth="2" opacity="0.4" />
    </svg>
  );
}

// ─── Ice crystal decoration ───────────────────────────────────────────────────
function IceCrystal({ x, y, size = 28, opacity = 0.4 }: {
  x: number; y: number; size?: number; opacity?: number;
}) {
  return (
    <svg style={{ position: 'absolute', left: x, top: y, pointerEvents: 'none' }}
      width={size} height={size} viewBox="0 0 40 40" opacity={opacity}>
      {/* 6-point star */}
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i * 60 * Math.PI) / 180;
        return (
          <line key={i} x1="20" y1="20" x2={20 + Math.cos(a) * 18} y2={20 + Math.sin(a) * 18}
            stroke="#A8D8F0" strokeWidth="1.5" />
        );
      })}
      <circle cx="20" cy="20" r="3" fill="#D0EEFF" />
    </svg>
  );
}

// ─── Bamboo stalk ─────────────────────────────────────────────────────────────
function BambooStalk({ x, height, opacity = 0.3 }: {
  x: number; height: number; opacity?: number;
}) {
  const segments = Math.floor(height / 40);
  return (
    <svg style={{ position: 'absolute', left: x, top: 0, pointerEvents: 'none' }}
      width="16" height={height} viewBox={`0 0 16 ${height}`} opacity={opacity}>
      <rect x="3" y="0" width="10" height={height} rx="4"
        fill="url(#bambooGrad)" />
      {Array.from({ length: segments }, (_, i) => (
        <line key={i} x1="2" y1={40 + i * 40} x2="14" y2={40 + i * 40}
          stroke="#1A3A1A" strokeWidth="1.5" />
      ))}
      <defs>
        <linearGradient id="bambooGrad" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#2A5A2A" />
          <stop offset="50%" stopColor="#4A8A3A" />
          <stop offset="100%" stopColor="#2A5A2A" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function ZenInterior({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden"
      style={{ background: 'linear-gradient(160deg, #040E08 0%, #071510 50%, #030A0E 100%)' }}>

      {/* ── Mountain backdrop ────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 pointer-events-none" style={{ zIndex: 0 }}>
        <MountainSilhouette />
      </div>

      {/* ── Misty gradient overlay ────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 50% 20%, rgba(100,180,220,0.04) 0%, transparent 65%)',
        zIndex: 0,
      }} />

      {/* ── Ice crystals — icy atmosphere ────────────────────────────── */}
      {[
        { x: 24,  y: 80,  s: 20, o: 0.3 }, { x: 58,  y: 240, s: 16, o: 0.2 },
        { x: 12,  y: 420, s: 24, o: 0.25 },{ x: 72,  y: 160, s: 14, o: 0.2 },
      ].map((c, i) => (
        <IceCrystal key={`l${i}`} x={c.x} y={c.y} size={c.s} opacity={c.o} />
      ))}
      {[
        { right: 40,  y: 100, s: 18, o: 0.25 }, { right: 60, y: 300, s: 22, o: 0.2 },
        { right: 30,  y: 200, s: 14, o: 0.18 }, { right: 70, y: 450, s: 20, o: 0.22 },
      ].map((c, i) => (
        <div key={`r${i}`} style={{ position: 'fixed', right: c.right, top: c.y, pointerEvents: 'none', zIndex: 1 }}>
          <IceCrystal x={0} y={0} size={c.s} opacity={c.o} />
        </div>
      ))}

      {/* ── Bamboo frame — left and right ────────────────────────────── */}
      {[8, 28, 50].map((x, i) => (
        <BambooStalk key={`bl${i}`} x={x} height={800} opacity={0.18 + i * 0.04} />
      ))}

      {/* ── Falling snow particles ────────────────────────────────────── */}
      {Array.from({ length: 28 }, (_, i) => (
        <motion.div key={i}
          className="fixed pointer-events-none rounded-full"
          style={{
            width:  2 + (i % 3),
            height: 2 + (i % 3),
            left:   `${(i * 37 + 7) % 100}%`,
            background: 'rgba(200,230,255,0.7)',
            zIndex: 1,
          }}
          animate={{ y: ['0vh', '110vh'], opacity: [0, 0.6, 0] }}
          transition={{
            duration:  8 + (i % 5) * 2.4,
            repeat:    Infinity,
            delay:     i * 0.45,
            ease:      'linear',
          }}
        />
      ))}

      {/* ── Sand garden — top feature ─────────────────────────────────── */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 pointer-events-none" style={{ zIndex: 1, opacity: 0.25 }}>
        <SandGarden />
      </div>

      {/* ── Ambient moonlight glow ────────────────────────────────────── */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 pointer-events-none" style={{
        width: 300, height: 300, zIndex: 0,
        background: 'radial-gradient(circle, rgba(160,210,255,0.06) 0%, transparent 70%)',
      }} />

      {/* ── Lantern glow — meditation light ──────────────────────────── */}
      {[{ left: '8%', top: '25%' }, { right: '8%', top: '32%' }].map((pos, i) => (
        <motion.div key={i}
          className="fixed pointer-events-none"
          style={{ ...pos, zIndex: 1, width: 30, height: 30,
            background: 'radial-gradient(circle, rgba(255,220,100,0.18) 0%, transparent 70%)',
          }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2.8 + i * 0.7, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* ── Content ───────────────────────────────────────────────────── */}
      <div className="relative" style={{ zIndex: 10 }}>
        {children}
      </div>
    </div>
  );
}
