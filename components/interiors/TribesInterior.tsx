'use client';
import { motion } from 'framer-motion';
import { AmbientGlow } from './InteriorShell';

// Kente cloth geometric pattern
function KenteStrip({ y, colors }: { y: number; colors: string[] }) {
  return (
    <g transform={`translate(0,${y})`}>
      {colors.map((c, i) => (
        <rect key={i} x={i * 16} y="0" width="16" height="8" fill={c} opacity="0.6" />
      ))}
      {colors.map((c, i) => (
        <rect key={`d-${i}`} x={i * 16 + 4} y="2" width="8" height="4" fill="rgba(0,0,0,0.3)" />
      ))}
    </g>
  );
}

// Thatched ceiling pattern
function ThatchCeiling() {
  return (
    <svg width="100%" height="100" preserveAspectRatio="none">
      {[...Array(16)].map((_, i) => (
        <g key={i}>
          <line x1={`${i * 6.5}%`} y1="0" x2={`${i * 6.5 - 3}%`} y2="100" stroke="#3D2800" strokeWidth="8" opacity="0.5" />
          <line x1={`${i * 6.5}%`} y1="0" x2={`${i * 6.5 + 3}%`} y2="100" stroke="#2A1800" strokeWidth="6" opacity="0.35" />
        </g>
      ))}
      {/* Thatch shading */}
      <rect width="100%" height="100" fill="url(#thatch)" opacity="0.3" />
    </svg>
  );
}

export function TribesInterior({ children }: { children: React.ReactNode }) {
  const KENTE_COLORS = [
    ['#BE185D', '#D97706', '#059669', '#E8770A', '#BE185D', '#D97706', '#059669'],
    ['#D97706', '#059669', '#BE185D', '#7C3AED', '#D97706', '#059669', '#BE185D'],
    ['#059669', '#BE185D', '#D97706', '#E8770A', '#059669', '#BE185D', '#D97706'],
  ];

  return (
    <div className="relative min-h-screen" style={{ background: '#0D0600' }}>

      {/* ── Great house atmosphere ─────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 50% 40%, #1A0C00 0%, #0D0600 55%, #060300 100%)',
        zIndex: 0,
      }} />

      {/* Earth floor — packed clay */}
      <div className="fixed bottom-0 left-0 right-0 h-32 pointer-events-none" style={{
        background: 'repeating-conic-gradient(from 45deg, #1A0C00 0 90deg, #2A1400 90deg 180deg) 0 0 / 20px 20px',
        opacity: 0.5,
        zIndex: 0,
      }} />

      {/* Thatched ceiling */}
      <div className="fixed top-0 left-0 right-0 pointer-events-none" style={{ zIndex: 3 }}>
        <ThatchCeiling />
        {/* Central roof ring (circular great house) */}
        <div style={{
          position:   'absolute',
          top:        0,
          left:       '50%',
          transform:  'translateX(-50%)',
          width:      80,
          height:     80,
          borderRadius: '50%',
          border:     '3px solid rgba(139,105,20,0.4)',
          background: 'rgba(60,30,0,0.6)',
        }} />
      </div>

      {/* Woven wall texture — Kente strips on sides */}
      <div className="fixed top-20 left-0 pointer-events-none" style={{ width: 80, zIndex: 2 }}>
        <svg width="80" height="600" viewBox="0 0 112 600">
          {KENTE_COLORS.map((colors, gi) =>
            [0, 1, 2, 3, 4, 5].map((i) => (
              <KenteStrip key={`${gi}-${i}`} y={gi * 80 + i * 10} colors={colors} />
            ))
          )}
        </svg>
      </div>
      <div className="fixed top-20 right-0 pointer-events-none" style={{ width: 80, zIndex: 2, transform: 'scaleX(-1)' }}>
        <svg width="80" height="600" viewBox="0 0 112 600">
          {KENTE_COLORS.map((colors, gi) =>
            [0, 1, 2, 3, 4, 5].map((i) => (
              <KenteStrip key={`${gi}-${i}`} y={gi * 80 + i * 10} colors={colors} />
            ))
          )}
        </svg>
      </div>

      {/* Carved totem poles */}
      {[-35, 33].map((offset, idx) => (
        <div key={idx} className="fixed top-20 pointer-events-none" style={{
          left:       `calc(50% + ${offset}%)`,
          width:      16,
          height:     '65vh',
          background: `linear-gradient(to right, #2A1800, #3D2200, #2A1800)`,
          opacity:    0.6,
          zIndex:     2,
          borderRadius: 4,
        }}>
          {/* Totem carvings */}
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{
              position:  'absolute',
              top:       `${15 + i * 22}%`,
              left:      -4,
              right:     -4,
              height:    14,
              background: i % 2 === 0 ? '#BE185D44' : '#D9770644',
              borderRadius: 4,
            }} />
          ))}
        </div>
      ))}

      {/* Sacred fire at center bottom */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 pointer-events-none" style={{ zIndex: 3 }}>
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ fontSize: 36, filter: 'drop-shadow(0 0 12px rgba(255,107,43,0.8))' }}
        >
          🔥
        </motion.div>
      </div>

      {/* Firelight warmth */}
      <AmbientGlow color="rgba(190,24,93,0.14)"  size={500} top="50%" left="50%" />
      <AmbientGlow color="rgba(217,119,6,0.12)"  size={400} top="70%" left="50%" />
      <AmbientGlow color="rgba(232,119,10,0.10)" size={300} top="80%" left="50%" />

      {/* Floating embers */}
      {[...Array(8)].map((_, i) => (
        <motion.div key={i}
          className="fixed pointer-events-none"
          style={{ bottom: '18%', left: `${45 + (Math.random() - 0.5) * 15}%`, width: 3, height: 3, borderRadius: '50%', background: '#FF6B2B', zIndex: 4 }}
          animate={{ y: [0, -60, -120], opacity: [0, 0.8, 0], x: [0, (Math.random() - 0.5) * 30] }}
          transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 4 }}
        />
      ))}

      {/* ── Council hall header ────────────────────────────────────── */}
      <div className="relative z-10 pt-20">
        <div className="sticky top-0 z-30" style={{ background: 'rgba(13,6,0,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(190,24,93,0.25)' }}>
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: 'linear-gradient(135deg, rgba(190,24,93,0.2), rgba(217,119,6,0.15))', border: '1px solid rgba(190,24,93,0.3)' }}>
              👥
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-white">Tribes</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'rgba(190,24,93,0.2)', color: '#FB7185' }}>Council Hall</span>
              </div>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Together we accomplish the impossible.</p>
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
