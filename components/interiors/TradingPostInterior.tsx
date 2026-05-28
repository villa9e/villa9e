'use client';
import { motion } from 'framer-motion';
import { AmbientGlow } from './InteriorShell';

// Moroccan geometric tile pattern (SVG)
function MosaicTile({ x, y, colors }: { x: number; y: number; colors: string[] }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <polygon points="0,0 20,0 20,20 0,20" fill={colors[0]} opacity="0.7" />
      <polygon points="5,5 15,5 15,15 5,15" fill={colors[1]} opacity="0.6" />
      <polygon points="10,0 20,10 10,20 0,10" fill={colors[2]} opacity="0.4" />
    </g>
  );
}

// Hanging fabric swatch
function FabricSwatch({ x, angle, color1, color2 }: { x: number; angle: number; color1: string; color2: string }) {
  return (
    <g transform={`translate(${x},0) rotate(${angle},${x},0)`}>
      <path d={`M0,0 Q8,30 0,60 L15,60 Q8,30 15,0 Z`} fill={color1} opacity="0.7" />
      <path d={`M15,0 Q22,30 15,60 L30,60 Q22,30 30,0 Z`} fill={color2} opacity="0.65" />
    </g>
  );
}

export function TradingPostInterior({ children }: { children: React.ReactNode }) {
  const CANOPY_COLORS = [
    ['#D97706', '#059669'], ['#7C3AED', '#E8770A'],
    ['#BE185D', '#D97706'], ['#059669', '#1877F2'],
    ['#E8770A', '#BE185D'], ['#1877F2', '#059669'],
  ];

  return (
    <div className="relative min-h-screen" style={{ background: '#1A0800' }}>

      {/* ── Warm bazaar atmosphere ────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 50% 30%, #2A1200 0%, #1A0800 50%, #0D0400 100%)',
        zIndex: 0,
      }} />

      {/* Geometric tile floor */}
      <div className="fixed bottom-0 left-0 right-0 h-32 pointer-events-none" style={{ zIndex: 1 }}>
        <svg width="100%" height="128" preserveAspectRatio="xMidYMid slice">
          {[...Array(12)].map((_, i) =>
            [...Array(4)].map((__, j) => {
              const colors = [
                ['#D97706', '#059669', '#7C3AED'],
                ['#BE185D', '#E8770A', '#1877F2'],
                ['#059669', '#D97706', '#BE185D'],
              ][Math.floor(Math.random() * 3)];
              return <MosaicTile key={`${i}-${j}`} x={i * 20} y={j * 20 + 48} colors={colors} />;
            })
          )}
        </svg>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, transparent, rgba(26,8,0,0.8))' }} />
      </div>

      {/* Fabric canopy overhead */}
      <div className="fixed top-0 left-0 right-0 pointer-events-none" style={{ zIndex: 3 }}>
        <svg width="100%" height="80" preserveAspectRatio="none">
          {CANOPY_COLORS.map(([c1, c2], i) => (
            <FabricSwatch key={i} x={(i * 100) / 6 + '%' as any} angle={0} color1={c1} color2={c2} />
          ))}
          {/* Canopy waves */}
          <path d="M0,0 Q8,12 16,0 Q24,12 32,0 Q40,12 48,0 Q56,12 64,0 Q72,12 80,0 Q88,12 96,0 Q104,12 112,0 Q120,12 128,0" stroke="rgba(200,140,40,0.4)" strokeWidth="2" fill="none" />
        </svg>
      </div>

      {/* Hanging lanterns (Moroccan style) */}
      <div className="fixed top-14 left-0 right-0 pointer-events-none" style={{ zIndex: 4 }}>
        <div className="flex justify-around px-8">
          {['#D97706', '#BE185D', '#059669', '#7C3AED', '#E8770A'].map((color, i) => (
            <motion.div key={i}
              animate={{ rotate: [-(4 + i), (4 + i), -(4 + i)], y: [0, 2, 0] }}
              transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: 'easeInOut' }}
              style={{ transformOrigin: 'top center' }}
            >
              <div style={{ width: 1, height: 18, background: 'rgba(200,160,80,0.5)', margin: '0 auto' }} />
              {/* Moroccan lantern shape */}
              <svg width="22" height="30" viewBox="0 0 22 30">
                <polygon points="11,2 20,10 16,25 6,25 2,10" fill={`${color}88`} stroke={color} strokeWidth="1" />
                <polygon points="11,4 18,11 14,23 8,23 4,11" fill={`${color}44`} />
                <circle cx="11" cy="14" r="4" fill={`${color}66`} />
                <line x1="11" y1="0" x2="11" y2="2" stroke="rgba(200,160,80,0.6)" strokeWidth="2" />
              </svg>
              {/* Glow */}
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: `${color}22`,
                filter: 'blur(8px)',
                marginTop: -20, marginLeft: -4,
              }} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Arched doorway frame on sides */}
      <div className="fixed top-0 left-0 bottom-0 w-16 pointer-events-none" style={{ zIndex: 2 }}>
        <svg width="64" height="100%" preserveAspectRatio="none" style={{ height: '100vh' }}>
          {/* Geometric arch pattern */}
          {[...Array(8)].map((_, i) => {
            const y = i * 80;
            return (
              <g key={i}>
                <path d={`M0,${y+40} Q32,${y} 64,${y+40}`} stroke="#D97706" strokeWidth="1.5" fill="none" opacity="0.3" />
                <line x1="0" y1={y} x2="64" y2={y} stroke="rgba(200,140,40,0.15)" strokeWidth="1" />
              </g>
            );
          })}
        </svg>
      </div>
      <div className="fixed top-0 right-0 bottom-0 w-16 pointer-events-none" style={{ zIndex: 2, transform: 'scaleX(-1)' }}>
        <svg width="64" height="100%" preserveAspectRatio="none" style={{ height: '100vh' }}>
          {[...Array(8)].map((_, i) => {
            const y = i * 80;
            return (
              <g key={i}>
                <path d={`M0,${y+40} Q32,${y} 64,${y+40}`} stroke="#D97706" strokeWidth="1.5" fill="none" opacity="0.3" />
                <line x1="0" y1={y} x2="64" y2={y} stroke="rgba(200,140,40,0.15)" strokeWidth="1" />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Warm amber glow — marketplace heat */}
      <AmbientGlow color="rgba(217,119,6,0.18)"  size={600} top="40%" left="50%" />
      <AmbientGlow color="rgba(190,24,93,0.08)"  size={300} top="60%" left="20%" />
      <AmbientGlow color="rgba(5,150,105,0.08)"  size={300} top="30%" left="80%" />

      {/* Floating fabric particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div key={i}
          className="fixed pointer-events-none"
          style={{ top: `${10 + i * 12}%`, left: `${i * 16}%`, width: 4, height: 12, borderRadius: 2, background: CANOPY_COLORS[i][0], opacity: 0.3, zIndex: 1 }}
          animate={{ y: [0, 30, 60], x: [0, 15, -10], rotate: [0, 90, 180], opacity: [0, 0.4, 0] }}
          transition={{ duration: 8 + i * 2, repeat: Infinity, delay: i * 1.2 }}
        />
      ))}

      {/* ── Bazaar header ─────────────────────────────────────────── */}
      <div className="relative z-10 pt-20">
        <div className="sticky top-0 z-30" style={{ background: 'rgba(26,8,0,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(217,119,6,0.3)' }}>
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: 'linear-gradient(135deg, rgba(217,119,6,0.2), rgba(190,24,93,0.2))', border: '1px solid rgba(217,119,6,0.3)' }}>
              🤝
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-white">Trading Post</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'rgba(217,119,6,0.2)', color: '#F59E0B' }}>Skill Marketplace</span>
              </div>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Trade skills. Hire help. Build together.</p>
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
