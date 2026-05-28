'use client';
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

// ── Floating particle (petals, dust, sparks, orbs) ───────────────────────────
export interface Particle {
  id:      number;
  x:       number;   // initial % from left
  delay:   number;   // animation delay (s)
  dur:     number;   // fall duration (s)
  size:    number;   // px
  opacity: number;
  drift:   number;   // horizontal drift (px)
  rotate:  number;   // end rotation
  color?:  string;
  emoji?:  string;
}

export function FloatingParticles({
  count, emoji, colors, sizeRange = [6, 14], durRange = [8, 18],
}: {
  count: number;
  emoji?: string;
  colors?: string[];
  sizeRange?: [number, number];
  durRange?: [number, number];
}) {
  const particles: Particle[] = Array.from({ length: count }, (_, i) => ({
    id:      i,
    x:       Math.random() * 100,
    delay:   Math.random() * -20,
    dur:     durRange[0] + Math.random() * (durRange[1] - durRange[0]),
    size:    sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]),
    opacity: 0.4 + Math.random() * 0.5,
    drift:   (Math.random() - 0.5) * 120,
    rotate:  (Math.random() - 0.5) * 360,
    color:   colors ? colors[Math.floor(Math.random() * colors.length)] : undefined,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 1 }}>
      {particles.map(p => (
        <motion.div
          key={p.id}
          style={{
            position:  'absolute',
            top:       '-20px',
            left:      `${p.x}%`,
            width:     p.size,
            height:    p.size,
            borderRadius: emoji ? 0 : '50%',
            background: p.color ?? 'transparent',
            opacity:   p.opacity,
            fontSize:  p.size,
          }}
          animate={{
            y:       ['0vh', '110vh'],
            x:       [0, p.drift],
            rotate:  [0, p.rotate],
            opacity: [0, p.opacity, p.opacity, 0],
          }}
          transition={{
            duration: p.dur,
            delay:    p.delay,
            repeat:   Infinity,
            ease:     'linear',
          }}
        >
          {emoji || null}
        </motion.div>
      ))}
    </div>
  );
}

// ── Ambient light pulse ───────────────────────────────────────────────────────
export function AmbientGlow({ color, size = 600, top = '20%', left = '50%', opacity = 0.15 }: {
  color: string; size?: number; top?: string; left?: string; opacity?: number;
}) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ top, left, transform: 'translate(-50%,-50%)', width: size, height: size, borderRadius: '50%', background: color, filter: 'blur(80px)', zIndex: 0 }}
      animate={{ opacity: [opacity * 0.7, opacity, opacity * 0.7], scale: [0.95, 1.05, 0.95] }}
      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

// ── Ceiling beam/rafter pattern ───────────────────────────────────────────────
export function CeilingBeams({ color, count = 6, angle = 0 }: { color: string; count?: number; angle?: number }) {
  return (
    <div className="absolute top-0 left-0 right-0 h-24 overflow-hidden pointer-events-none" style={{ zIndex: 2 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          position:   'absolute',
          top:        0,
          left:       `${(i / count) * 100}%`,
          width:      `${100 / count}%`,
          height:     '100%',
          background: `linear-gradient(to bottom, ${color}, transparent)`,
          transform:  `rotate(${angle}deg)`,
          opacity:    0.6 + (i % 2) * 0.2,
        }} />
      ))}
    </div>
  );
}
