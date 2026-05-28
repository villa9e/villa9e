'use client';
import { motion } from 'framer-motion';
import { FloatingParticles, AmbientGlow } from './InteriorShell';

// Tool silhouette SVG decorations
function ToolWall({ side }: { side: 'left' | 'right' }) {
  const flip = side === 'right' ? 'scale(-1,1)' : '';
  return (
    <svg width="90" height="500" viewBox="0 0 90 500" style={{ transform: flip }}>
      {/* Pegboard vertical lines */}
      {[0, 1, 2, 3].map(i => (
        <line key={i} x1={10 + i * 22} y1="0" x2={10 + i * 22} y2="500" stroke="#3D2A10" strokeWidth="1" opacity="0.4" />
      ))}
      {/* Hammer */}
      <g transform="translate(15,60) rotate(-30,20,20)" opacity="0.55">
        <rect x="8" y="0" width="8" height="25" rx="3" fill="#C8A87A" />
        <rect x="0" y="-8" width="24" height="12" rx="3" fill="#4A3520" />
      </g>
      {/* Wrench */}
      <g transform="translate(40,100)" opacity="0.5">
        <path d="M5,0 Q15,-8 25,0 L22,50 Q15,58 8,50 Z" fill="#5A5A5A" />
        <circle cx="15" cy="-2" r="8" fill="none" stroke="#5A5A5A" strokeWidth="4" />
      </g>
      {/* Screwdriver */}
      <g transform="translate(70,80) rotate(20,5,30)" opacity="0.5">
        <rect x="3" y="0" width="6" height="50" rx="3" fill="#C8A87A" />
        <rect x="1" y="48" width="10" height="20" rx="1" fill="#6A6A6A" />
      </g>
      {/* Ruler */}
      <g transform="translate(10,180)" opacity="0.45">
        <rect x="0" y="0" width="70" height="10" rx="2" fill="#D4B483" />
        {[0,1,2,3,4,5,6].map(i => (
          <line key={i} x1={5+i*10} y1="2" x2={5+i*10} y2={i%2===0?8:5} stroke="#8B6914" strokeWidth="1" />
        ))}
      </g>
      {/* Blueprint roll */}
      <g transform="translate(20,240)" opacity="0.4">
        <rect x="0" y="0" width="50" height="35" rx="3" fill="#1877F2" opacity="0.4" />
        <line x1="5" y1="10" x2="45" y2="10" stroke="white" strokeWidth="1" opacity="0.6" />
        <line x1="5" y1="18" x2="30" y2="18" stroke="white" strokeWidth="1" opacity="0.6" />
        <line x1="5" y1="26" x2="38" y2="26" stroke="white" strokeWidth="1" opacity="0.6" />
      </g>
    </svg>
  );
}

export function WorkshopInterior({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen" style={{ background: '#0D0800' }}>

      {/* ── Dark wood workshop atmosphere ────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 50% 40%, #1A0E00 0%, #0D0800 60%, #060400 100%)',
        zIndex: 0,
      }} />

      {/* Wood plank floor */}
      <div className="fixed bottom-0 left-0 right-0 h-40 pointer-events-none" style={{
        background: 'repeating-linear-gradient(90deg, #2A1800 0px, #2A1800 60px, #1E1200 60px, #1E1200 120px)',
        opacity: 0.6,
        zIndex: 0,
      }} />

      {/* Wood grain wall texture */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'repeating-linear-gradient(180deg, transparent 0px, transparent 38px, rgba(50,30,5,0.08) 38px, rgba(50,30,5,0.08) 40px)',
        zIndex: 0,
      }} />

      {/* Dark ceiling with exposed beams */}
      <div className="fixed top-0 left-0 right-0 pointer-events-none" style={{ zIndex: 2 }}>
        <div style={{ height: 8, background: '#1A0E00' }} />
        {/* Exposed ceiling beams */}
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} style={{
            position:   'absolute',
            top:        0,
            left:       `${i * 22}%`,
            width:      '18%',
            height:     40,
            background: `linear-gradient(to bottom, #2A1800, #1A0E00)`,
            borderRight: '1px solid rgba(80,50,10,0.3)',
          }} />
        ))}
      </div>

      {/* Tool walls */}
      <div className="fixed top-20 left-0 pointer-events-none" style={{ zIndex: 2 }}>
        <ToolWall side="left" />
      </div>
      <div className="fixed top-20 right-0 pointer-events-none" style={{ zIndex: 2, transform: 'scaleX(-1)' }}>
        <ToolWall side="right" />
      </div>

      {/* Workbench silhouette */}
      <div className="fixed bottom-16 left-0 right-0 pointer-events-none" style={{ zIndex: 2 }}>
        <div style={{ height: 12, background: 'linear-gradient(to right, #2A1800, #3D2200, #2A1800)', opacity: 0.7 }} />
      </div>

      {/* Hanging overhead lanterns */}
      <div className="fixed top-10 left-0 right-0 pointer-events-none" style={{ zIndex: 3 }}>
        <div className="flex justify-around px-16">
          {[0, 1, 2].map(i => (
            <motion.div key={i}
              animate={{ rotate: [-(3 + i), (3 + i), -(3 + i)] }}
              transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut' }}
              style={{ transformOrigin: 'top center' }}
            >
              <div style={{ width: 1, height: 30, background: 'rgba(180,130,60,0.5)', margin: '0 auto' }} />
              <div style={{
                width: 24, height: 32,
                background: `radial-gradient(ellipse at 40% 35%, #FFB34788, #7A450088)`,
                borderRadius: '40%',
                boxShadow: '0 0 20px rgba(255,160,40,0.4)',
                margin: '0 auto',
              }} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Forge glow at bottom */}
      <AmbientGlow color="rgba(232,119,10,0.15)" size={500} top="75%" left="50%" />
      <AmbientGlow color="rgba(220,50,10,0.08)"  size={300} top="80%" left="25%" />

      {/* Flying sparks from forge */}
      <FloatingParticles
        count={12}
        colors={['#FF6B2B', '#FFD700', '#FF4500', '#FFA500', '#FF8C00']}
        sizeRange={[3, 6]}
        durRange={[1.5, 4]}
      />

      {/* Dust motes floating */}
      <FloatingParticles
        count={8}
        colors={['rgba(200,168,120,0.4)', 'rgba(180,140,80,0.3)']}
        sizeRange={[4, 8]}
        durRange={[12, 25]}
      />

      {/* ── Workshop header ──────────────────────────────────────── */}
      <div className="relative z-10 pt-0">
        <div className="sticky top-0 z-30" style={{ background: 'rgba(13,8,0,0.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(232,119,10,0.25)' }}>
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: 'rgba(232,119,10,0.15)', border: '1px solid rgba(232,119,10,0.3)' }}>
              🔨
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-white">Workshop</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'rgba(232,119,10,0.2)', color: '#E8770A' }}>Goal GPS Engine</span>
              </div>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Build with intention. Forge your future.</p>
            </div>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}>
              <span style={{ fontSize: 20 }}>⚙️</span>
            </motion.div>
          </div>
        </div>

        <div className="relative z-10">
          {children}
        </div>
      </div>
    </div>
  );
}
