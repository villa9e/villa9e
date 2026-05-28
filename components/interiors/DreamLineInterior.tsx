'use client';
import { motion } from 'framer-motion';
import { AmbientGlow } from './InteriorShell';

export function DreamLineInterior({ children }: { children: React.ReactNode }) {
  // Stars for the open-air night sky
  const stars = Array.from({ length: 60 }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 50,
    size: 1 + Math.random() * 2,
    opacity: 0.3 + Math.random() * 0.6,
    twinkle: 2 + Math.random() * 4,
  }));

  // Floating golden light orbs
  const orbs = Array.from({ length: 8 }, (_, i) => ({
    id: i, x: 10 + i * 11,
    y: 15 + Math.sin(i * 1.5) * 10,
    size: 8 + Math.random() * 12,
    delay: i * 0.6,
  }));

  return (
    <div className="relative min-h-screen" style={{ background: '#07030F' }}>

      {/* ── Open-air amphitheater night sky ───────────────────────── */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 50% 20%, #1A0A2E 0%, #0D0520 40%, #07030F 100%)',
        zIndex: 0,
      }} />

      {/* Starfield */}
      <div className="fixed top-0 left-0 right-0 h-[60vh] overflow-hidden pointer-events-none" style={{ zIndex: 1 }}>
        {stars.map(s => (
          <motion.div key={s.id}
            style={{ position: 'absolute', left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size, borderRadius: '50%', background: '#E8D5FF' }}
            animate={{ opacity: [s.opacity * 0.4, s.opacity, s.opacity * 0.4] }}
            transition={{ duration: s.twinkle, repeat: Infinity, ease: 'easeInOut', delay: Math.random() * 3 }}
          />
        ))}
        {/* Milky way suggestion */}
        <div style={{ position: 'absolute', top: '10%', left: '20%', right: '25%', height: 2, background: 'linear-gradient(to right, transparent, rgba(200,180,255,0.08), transparent)', filter: 'blur(2px)' }} />
      </div>

      {/* Greek columns framing the scene */}
      {[-42, -24, 22, 40].map((offset, i) => (
        <div key={i} className="fixed top-0 bottom-0 pointer-events-none" style={{
          left:    `calc(50% + ${offset}%)`,
          width:   '7%',
          zIndex:  3,
          opacity: 0.3 + (i % 2) * 0.1,
        }}>
          {/* Column shaft */}
          <div style={{
            position:    'absolute',
            top:         80,
            bottom:      0,
            left:        0,
            right:       0,
            background:  'linear-gradient(to right, #1A0A30, #2D1650 30%, #3D2070 50%, #2D1650 70%, #1A0A30)',
            borderRight: '1px solid rgba(124,58,237,0.15)',
            borderLeft:  '1px solid rgba(124,58,237,0.15)',
          }} />
          {/* Fluted detail */}
          {[0, 1, 2].map(j => (
            <div key={j} style={{ position: 'absolute', top: 80, bottom: 0, left: `${j * 33}%`, width: 1, background: 'rgba(200,160,255,0.1)' }} />
          ))}
          {/* Capital */}
          <div style={{ position: 'absolute', top: 50, left: -4, right: -4, height: 30, background: 'linear-gradient(to bottom, #7C3AED44, #3D2070)', borderRadius: 2 }} />
          {/* Base */}
          <div style={{ position: 'absolute', bottom: 0, left: -6, right: -6, height: 16, background: '#1A0A30' }} />
        </div>
      ))}

      {/* Draped purple fabric between columns */}
      <div className="fixed top-14 left-0 right-0 pointer-events-none" style={{ zIndex: 2 }}>
        <svg width="100%" height="60" preserveAspectRatio="none">
          <defs>
            <linearGradient id="drape1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#4C1D95" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          {/* Draped swags */}
          {[0, 1, 2, 3].map(i => (
            <path key={i}
              d={`M${i * 25}%,0 Q${i * 25 + 12.5}%,50 ${(i + 1) * 25}%,0`}
              fill="url(#drape1)" stroke="#7C3AED" strokeWidth="0.5" strokeOpacity="0.4"
            />
          ))}
          {/* Gold fringe */}
          <path d="M0,2 L100%,2" stroke="#D4A820" strokeWidth="1" strokeOpacity="0.4" />
          {[...Array(20)].map((_, i) => (
            <line key={i} x1={`${i * 5.3}%`} y1="2" x2={`${i * 5.3 - 1}%`} y2="12" stroke="#D4A820" strokeWidth="1" strokeOpacity="0.35" />
          ))}
        </svg>
      </div>

      {/* Floating golden light orbs */}
      {orbs.map(o => (
        <motion.div key={o.id}
          className="fixed pointer-events-none"
          style={{ left: `${o.x}%`, top: `${o.y}%`, width: o.size, height: o.size, borderRadius: '50%', background: 'radial-gradient(circle, #FFD70088, transparent)', zIndex: 2 }}
          animate={{ y: [0, -15, 0], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 4 + o.delay, repeat: Infinity, delay: o.delay, ease: 'easeInOut' }}
        />
      ))}

      {/* Amphitheater seating tiers (bottom) */}
      <div className="fixed bottom-0 left-0 right-0 pointer-events-none" style={{ zIndex: 2 }}>
        <svg width="100%" height="60" preserveAspectRatio="none">
          {[0, 1, 2].map(i => (
            <path key={i}
              d={`M0,${60 - i * 20} Q50%,${40 - i * 20} 100%,${60 - i * 20}`}
              fill={`rgba(${20 + i * 8},${10 + i * 5},${40 + i * 8},0.6)`}
              stroke="rgba(124,58,237,0.15)" strokeWidth="1"
            />
          ))}
        </svg>
      </div>

      {/* Purple spotlight from above */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 pointer-events-none" style={{ zIndex: 1 }}>
        <div style={{ width: 2, height: '60vh', background: 'linear-gradient(to bottom, rgba(124,58,237,0.15), transparent)', filter: 'blur(4px)' }} />
      </div>

      {/* Ambient purple/gold lighting */}
      <AmbientGlow color="rgba(124,58,237,0.20)" size={700} top="35%" left="50%" />
      <AmbientGlow color="rgba(212,168,32,0.08)" size={400} top="20%" left="30%" />
      <AmbientGlow color="rgba(212,168,32,0.08)" size={400} top="20%" left="70%" />

      {/* ── Stage header ─────────────────────────────────────────── */}
      <div className="relative z-10 pt-20">
        <div className="sticky top-0 z-30" style={{ background: 'rgba(7,3,15,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(124,58,237,0.25)' }}>
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(212,168,32,0.1))', border: '1px solid rgba(124,58,237,0.3)' }}>
              ✨
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-white">Dream Line</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'rgba(124,58,237,0.2)', color: '#A78BFA' }}>Community Stage</span>
              </div>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Share your wins. Validate your village.</p>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          {children}
        </div>
      </div>
    </div>
  );
}
