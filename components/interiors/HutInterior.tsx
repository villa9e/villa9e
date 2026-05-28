'use client';
import { motion } from 'framer-motion';
import { AmbientGlow } from './InteriorShell';

export function HutInterior({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen" style={{ background: '#100800' }}>

      {/* ── Warm personal sanctuary ───────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 40% 40%, #1E0E00 0%, #130900 50%, #0A0500 100%)',
        zIndex: 0,
      }} />

      {/* Mud brick wall texture */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: `repeating-linear-gradient(0deg, rgba(60,35,10,0.12) 0px, rgba(60,35,10,0.12) 1px, transparent 1px, transparent 32px), repeating-linear-gradient(90deg, rgba(80,45,10,0.08) 0px, rgba(80,45,10,0.08) 1px, transparent 1px, transparent 48px)`,
        zIndex: 0,
      }} />

      {/* Handwoven textile strips on walls */}
      <div className="fixed top-0 left-0 bottom-0 pointer-events-none" style={{ width: 60, zIndex: 2 }}>
        <svg width="60" height="100%" style={{ height: '100vh' }} preserveAspectRatio="none">
          {[
            ['#EA580C', '#D97706', '#EA580C', '#7C3AED'],
            ['#D97706', '#EA580C', '#059669', '#EA580C'],
            ['#7C3AED', '#EA580C', '#D97706', '#EA580C'],
          ].map((row, gi) =>
            [0, 1, 2, 3, 4, 5].map(i => (
              <g key={`${gi}-${i}`} transform={`translate(0,${gi * 140 + i * 20})`}>
                {row.map((color, j) => (
                  <rect key={j} x={j * 15} y="0" width="15" height="20" fill={color} opacity="0.35" />
                ))}
                <line x1="0" y1="20" x2="60" y2="20" stroke="rgba(200,160,80,0.15)" strokeWidth="0.5" />
              </g>
            ))
          )}
        </svg>
      </div>
      <div className="fixed top-0 right-0 bottom-0 pointer-events-none" style={{ width: 60, zIndex: 2, transform: 'scaleX(-1)' }}>
        <svg width="60" height="100%" style={{ height: '100vh' }} preserveAspectRatio="none">
          {[
            ['#EA580C', '#059669', '#D97706', '#EA580C'],
            ['#7C3AED', '#EA580C', '#EA580C', '#D97706'],
            ['#D97706', '#7C3AED', '#EA580C', '#059669'],
          ].map((row, gi) =>
            [0, 1, 2, 3, 4, 5].map(i => (
              <g key={`${gi}-${i}`} transform={`translate(0,${gi * 140 + i * 20 + 10})`}>
                {row.map((color, j) => (
                  <rect key={j} x={j * 15} y="0" width="15" height="20" fill={color} opacity="0.3" />
                ))}
              </g>
            ))
          )}
        </svg>
      </div>

      {/* Thatched roof (ceiling) */}
      <div className="fixed top-0 left-0 right-0 pointer-events-none" style={{ zIndex: 3 }}>
        <svg width="100%" height="70" preserveAspectRatio="none">
          {[...Array(20)].map((_, i) => (
            <g key={i}>
              <path d={`M${i * 5.2}%,0 Q${i * 5.2 + 2.6}%,40 ${(i + 1) * 5.2}%,0`} fill={`rgba(60,35,10,${0.5 + (i % 3) * 0.1})`} />
              <path d={`M${i * 5.2}%,0 L${i * 5.2 + 1}%,70 L${(i + 1) * 5.2 - 1}%,70 L${(i + 1) * 5.2}%,0`} fill={`rgba(40,20,5,0.3)`} />
            </g>
          ))}
          <rect width="100%" height="3" fill="rgba(100,60,20,0.6)" />
        </svg>
      </div>

      {/* Candles on a shelf */}
      <div className="fixed pointer-events-none" style={{ bottom: '25%', right: '8%', zIndex: 3 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          {[28, 20, 22, 15].map((h, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <motion.div
                animate={{ scaleX: [1, 1.2, 0.9, 1.1, 1], skewX: [0, 5, -3, 4, 0] }}
                transition={{ duration: 0.8 + i * 0.2, repeat: Infinity }}
                style={{ width: 4, height: 10, background: 'linear-gradient(to top, #FF6B2B, #FFD700)', borderRadius: 2, marginBottom: -2 }}
              />
              <div style={{ width: 8, height: h, background: `linear-gradient(to bottom, #F0E0C0, #D4C0A0)`, borderRadius: '2px 2px 0 0' }} />
            </div>
          ))}
        </div>
        {/* Shelf */}
        <div style={{ height: 3, background: '#5A3520', borderRadius: 1, marginTop: 2 }} />
      </div>

      {/* Personal trophies shelf */}
      <div className="fixed pointer-events-none" style={{ bottom: '38%', left: '6%', zIndex: 3 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
          {['🏆', '🎯', '⚡'].map((emoji, i) => (
            <div key={i} style={{ fontSize: 16, opacity: 0.5 }}>{emoji}</div>
          ))}
        </div>
        <div style={{ height: 2, background: '#3D2200', borderRadius: 1, marginTop: 2, width: 70 }} />
      </div>

      {/* Candlelight warmth */}
      <AmbientGlow color="rgba(234,88,12,0.14)"  size={600} top="50%" left="50%" />
      <AmbientGlow color="rgba(217,119,6,0.10)"  size={400} top="70%" left="80%" />
      <AmbientGlow color="rgba(124,58,237,0.06)" size={300} top="30%" left="20%" />

      {/* Candle glow flickers */}
      {[0, 1, 2, 3].map(i => (
        <motion.div key={i}
          className="fixed pointer-events-none"
          style={{ bottom: `${26 + i * 0.2}%`, right: `${8.5 + i * 2}%`, width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,200,80,0.2)', filter: 'blur(6px)', zIndex: 2 }}
          animate={{ opacity: [0.3, 0.7, 0.4, 0.8, 0.3] }}
          transition={{ duration: 1 + i * 0.3, repeat: Infinity }}
        />
      ))}

      {/* ── Personal hut header ───────────────────────────────────── */}
      <div className="relative z-10 pt-14">
        <div className="sticky top-0 z-30" style={{ background: 'rgba(16,8,0,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(234,88,12,0.25)' }}>
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: 'linear-gradient(135deg, rgba(234,88,12,0.2), rgba(217,119,6,0.1))', border: '1px solid rgba(234,88,12,0.3)' }}>
              🏠
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-white">My Hut</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'rgba(234,88,12,0.2)', color: '#FB923C' }}>Personal Sanctuary</span>
              </div>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Your space. Your story. Your village.</p>
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
