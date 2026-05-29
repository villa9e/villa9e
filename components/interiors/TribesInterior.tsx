'use client';
import { motion } from 'framer-motion';

// ─── Kente cloth strip ────────────────────────────────────────────────────────
function KenteStrip({ x, colors, width = 18 }: {
  x: number; colors: string[]; width?: number;
}) {
  const stripeH = 28;
  return (
    <div style={{ position: 'absolute', left: x, top: 0, bottom: 0, width, pointerEvents: 'none' }}>
      {colors.map((c, i) => (
        <div key={i} style={{
          position: 'absolute', left: 0, right: 0,
          top: i * stripeH, height: stripeH,
          background: c, opacity: 0.55,
        }}>
          {/* Warp threads */}
          {Array.from({ length: Math.floor(width / 3) }, (_, j) => (
            <div key={j} style={{ position: 'absolute', left: j * 3, top: 0, bottom: 0, width: 1,
              background: 'rgba(0,0,0,0.25)' }} />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Sacred fire pit ──────────────────────────────────────────────────────────
function SacredFire() {
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 pointer-events-none" style={{ zIndex: 2 }}>
      <svg width="80" height="60" viewBox="0 0 80 60">
        {/* Stone ring */}
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return <ellipse key={i} cx={40 + Math.cos(a) * 28} cy={52 + Math.sin(a) * 6}
            rx="7" ry="4" fill="#5A4A38" />;
        })}
        {/* Embers */}
        {Array.from({ length: 6 }, (_, i) => (
          <ellipse key={i} cx={32 + i * 3.5} cy={50} rx="2.5" ry="1.5" fill="#FF4400" opacity="0.6" />
        ))}
        {/* Flame paths */}
        <path d="M40,48 Q44,32 40,18 Q36,8 38,0 Q34,12 32,24 Q28,36 36,42 Q38,44 40,48 Z"
          fill="url(#flame1)" opacity="0.85" />
        <path d="M40,48 Q46,36 44,20 Q50,28 48,40 Z"
          fill="url(#flame2)" opacity="0.6" />
        <path d="M40,48 Q34,38 36,22 Q30,32 32,42 Z"
          fill="url(#flame2)" opacity="0.55" />
        <defs>
          <linearGradient id="flame1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="30%" stopColor="#FFEE44" />
            <stop offset="70%" stopColor="#FF8800" />
            <stop offset="100%" stopColor="#FF2200" />
          </linearGradient>
          <linearGradient id="flame2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFEE44" />
            <stop offset="100%" stopColor="#FF4400" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// ─── Council circle marker ────────────────────────────────────────────────────
function CouncilCircle() {
  const seats = 8;
  return (
    <div className="fixed bottom-0 left-0 right-0 pointer-events-none" style={{ zIndex: 1 }}>
      <svg width="100%" height="120" viewBox="0 0 400 120" preserveAspectRatio="xMidYMid slice">
        {/* Circle outline */}
        <ellipse cx="200" cy="110" rx="160" ry="40" fill="none"
          stroke="rgba(200,160,80,0.15)" strokeWidth="1.5" strokeDasharray="6,4" />
        {/* Seat markers */}
        {Array.from({ length: seats }, (_, i) => {
          const a = (i / seats) * Math.PI; // semicircle at bottom
          const x = 200 + Math.cos(a) * 155;
          const y = 110 + Math.sin(a) * 38;
          return <circle key={i} cx={x} cy={y} r="5" fill="rgba(200,160,60,0.2)"
            stroke="rgba(200,160,60,0.35)" strokeWidth="1" />;
        })}
      </svg>
    </div>
  );
}

// ─── Totem pole silhouettes ───────────────────────────────────────────────────
function TotemPole({ x, side }: { x: number; side: 'left' | 'right' }) {
  const flip = side === 'right';
  return (
    <div className="fixed pointer-events-none"
      style={{ [side]: x, top: 0, bottom: '15%', width: 32, zIndex: 1 }}>
      <svg width="32" height="600" viewBox="0 0 32 600" opacity="0.35">
        {/* Post */}
        <rect x="11" y="0" width="10" height="600" fill="#3A2810" />
        {/* Faces stacked */}
        {[60, 160, 260, 360, 460].map((y, i) => (
          <g key={i} transform={`translate(1,${y})`} style={{ transform: flip ? `scaleX(-1) translate(-30px, ${y}px)` : undefined }}>
            {/* Head */}
            <rect x="4" y="0" width="22" height="28" rx="4" fill="#4A3820" />
            {/* Eyes */}
            <rect x="8" y="8" width="4" height="4" fill="#FFD700" opacity="0.6" />
            <rect x="18" y="8" width="4" height="4" fill="#FFD700" opacity="0.6" />
            {/* Beak/mouth */}
            <path d={`M6,18 Q16,22 26,18`} fill="none" stroke="#FFD700" strokeWidth="1.5" opacity="0.5" />
            {/* Wings */}
            <path d={i % 2 === 0 ? "M4,10 L-8,4 L-8,20 Z" : ""} fill="#5A3820" opacity="0.5" />
            <path d={i % 2 === 0 ? "M26,10 L38,4 L38,20 Z" : ""} fill="#5A3820" opacity="0.5" />
          </g>
        ))}
      </svg>
    </div>
  );
}

export function TribesInterior({ children }: { children: React.ReactNode }) {
  const kenteLeft  = ['#D97706','#16A34A','#7C3AED','#DC2626','#D97706','#16A34A','#7C3AED','#DC2626'];
  const kenteRight = ['#7C3AED','#DC2626','#D97706','#16A34A','#7C3AED','#DC2626','#D97706','#16A34A'];

  return (
    <div className="relative min-h-screen overflow-x-hidden"
      style={{ background: 'linear-gradient(160deg, #080400 0%, #0C0600 50%, #080400 100%)' }}>

      {/* ── Deep forest base ──────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: `
          radial-gradient(ellipse at 50% 50%, rgba(40,20,0,0.4) 0%, transparent 65%),
          radial-gradient(ellipse at 30% 80%, rgba(100,60,0,0.15) 0%, transparent 45%)
        `,
        zIndex: 0,
      }} />

      {/* ── Tree canopy silhouettes at top ────────────────────────────── */}
      <div className="fixed top-0 left-0 right-0 pointer-events-none" style={{ zIndex: 0 }}>
        <svg width="100%" height="120" viewBox="0 0 800 120" preserveAspectRatio="none">
          <path d="M0,120 L0,60 Q40,20 80,55 Q120,20 160,50 Q200,10 240,45 Q280,15 320,50 Q360,5 400,45 Q440,10 480,50 Q520,20 560,45 Q600,15 640,50 Q680,20 720,48 Q760,25 800,50 L800,120 Z"
            fill="#0A0600" opacity="0.75" />
          {/* Hanging vines */}
          {Array.from({ length: 12 }, (_, i) => (
            <path key={i}
              d={`M${60 + i * 60},0 Q${60 + i * 60 + 8},40 ${60 + i * 60},${55 + (i % 3) * 15}`}
              fill="none" stroke="#1A3A10" strokeWidth="2" opacity="0.35" />
          ))}
        </svg>
      </div>

      {/* ── Kente strips — wall tapestries ───────────────────────────── */}
      {[0, 22, 44].map((x, i) => (
        <KenteStrip key={`l${i}`} x={x} colors={kenteLeft} width={16} />
      ))}
      {[0, 22, 44].map((x, i) => (
        <div key={`r${i}`} className="fixed pointer-events-none" style={{ right: x, top: 0, bottom: 0, width: 16, zIndex: 1 }}>
          <KenteStrip x={0} colors={kenteRight} width={16} />
        </div>
      ))}

      {/* ── Totem poles ───────────────────────────────────────────────── */}
      <TotemPole x={70} side="left" />
      <TotemPole x={70} side="right" />

      {/* ── Sacred fire pit — center of council ───────────────────────── */}
      <SacredFire />

      {/* ── Fire glow pulsing ─────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 pointer-events-none" style={{ zIndex: 1 }}>
        <motion.div
          animate={{ opacity: [0.3, 0.65, 0.3], scale: [1, 1.15, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            width: 220, height: 120,
            background: 'radial-gradient(ellipse at 50% 100%, rgba(255,100,0,0.2) 0%, rgba(255,60,0,0.06) 50%, transparent 80%)',
            filter: 'blur(10px)',
          }}
        />
      </div>

      {/* ── Council circle ────────────────────────────────────────────── */}
      <CouncilCircle />

      {/* ── Firefly sparks ────────────────────────────────────────────── */}
      {Array.from({ length: 16 }, (_, i) => (
        <motion.div key={i}
          className="fixed pointer-events-none rounded-full"
          style={{
            width: 2, height: 2,
            left:  `${(i * 41 + 8) % 88}%`,
            top:   `${(i * 31 + 15) % 70}%`,
            background: i % 3 === 0 ? '#AAFF44' : i % 3 === 1 ? '#FFD700' : '#FF8800',
            zIndex: 2,
          }}
          animate={{ opacity: [0, 0.8, 0], scale: [0.5, 1.2, 0.5] }}
          transition={{ duration: 2 + (i % 3), repeat: Infinity, delay: i * 0.4, ease: 'easeInOut' }}
        />
      ))}

      {/* ── Drum rhythm flicker ───────────────────────────────────────── */}
      <motion.div
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 1, background: 'rgba(255,80,0,0.015)' }}
        animate={{ opacity: [0, 0.5, 0, 0.3, 0] }}
        transition={{ duration: 0.8, repeat: Infinity, delay: 1.5, ease: 'easeInOut' }}
      />

      <div className="relative" style={{ zIndex: 10 }}>
        {children}
      </div>
    </div>
  );
}
