'use client';
import { motion } from 'framer-motion';
import { AmbientGlow } from './InteriorShell';

export function BankInterior({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen" style={{ background: '#0A0600' }}>

      {/* ── Grand treasury atmosphere ─────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 50% 35%, #1A1200 0%, #0D0900 50%, #060400 100%)',
        zIndex: 0,
      }} />

      {/* Marble floor */}
      <div className="fixed bottom-0 left-0 right-0 h-48 pointer-events-none" style={{ zIndex: 1 }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'repeating-linear-gradient(45deg, rgba(240,230,210,0.04) 0px, rgba(240,230,210,0.04) 1px, transparent 1px, transparent 32px), repeating-linear-gradient(-45deg, rgba(240,230,210,0.03) 0px, rgba(240,230,210,0.03) 1px, transparent 1px, transparent 32px)',
        }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,6,0,0.9), transparent)' }} />
      </div>

      {/* Grand columns */}
      {[-38, -20, 18, 36].map((offset, i) => (
        <div key={i} className="fixed top-0 bottom-0 pointer-events-none" style={{
          left:       `calc(50% + ${offset}%)`,
          width:      '6%',
          background: `linear-gradient(to right, #1A1200, #2A1E00 20%, #3D2E00 50%, #2A1E00 80%, #1A1200)`,
          opacity:    0.55,
          zIndex:     2,
          borderRight: '1px solid rgba(212,168,32,0.12)',
          borderLeft:  '1px solid rgba(212,168,32,0.08)',
        }}>
          {/* Column capital */}
          <div style={{ height: 30, background: 'linear-gradient(to bottom, #D4A820, #8B6914)', width: '100%', opacity: 0.7 }} />
          {/* Column base */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 20, background: 'linear-gradient(to top, #D4A820, #8B6914)', opacity: 0.6 }} />
        </div>
      ))}

      {/* Ceiling — coffered panels */}
      <div className="fixed top-0 left-0 right-0 pointer-events-none" style={{ zIndex: 3 }}>
        <svg width="100%" height="80" preserveAspectRatio="none">
          {/* Gold cornice molding */}
          <rect width="100%" height="8" fill="#D4A820" opacity="0.5" />
          <rect y="8" width="100%" height="4" fill="#8B6914" opacity="0.6" />
          {/* Coffered panels */}
          {[...Array(6)].map((_, i) => (
            <g key={i} transform={`translate(${i * 16.67}%,12)`}>
              <rect width="15%" height="55" rx="2" fill="none" stroke="#D4A820" strokeWidth="0.5" opacity="0.3" />
              <rect x="3%" y="5" width="9%" height="45" rx="1" fill="none" stroke="#D4A820" strokeWidth="0.3" opacity="0.2" />
            </g>
          ))}
        </svg>
      </div>

      {/* Nubian pyramid motif — decorative wall element */}
      <div className="fixed pointer-events-none" style={{ top: '35%', left: '4%', opacity: 0.12, zIndex: 2 }}>
        <svg width="60" height="80" viewBox="0 0 60 80">
          <polygon points="30,0 60,70 0,70" fill="#D4A820" />
          <polygon points="30,8 54,65 6,65" fill="none" stroke="#FFD700" strokeWidth="0.5" />
          <line x1="30" y1="0" x2="30" y2="70" stroke="#FFD700" strokeWidth="0.5" opacity="0.6" />
          <polygon points="30,10 50,60 10,60" fill="rgba(212,168,32,0.1)" />
        </svg>
      </div>
      <div className="fixed pointer-events-none" style={{ top: '35%', right: '4%', opacity: 0.12, zIndex: 2 }}>
        <svg width="60" height="80" viewBox="0 0 60 80">
          <polygon points="30,0 60,70 0,70" fill="#D4A820" />
          <polygon points="30,8 54,65 6,65" fill="none" stroke="#FFD700" strokeWidth="0.5" />
        </svg>
      </div>

      {/* Gold vault door suggestion (back wall center) */}
      <div className="fixed pointer-events-none" style={{ top: '40%', left: '50%', transform: 'translateX(-50%)', opacity: 0.05, zIndex: 1 }}>
        <svg width="140" height="180" viewBox="0 0 140 180">
          <rect x="0" y="0" width="140" height="180" rx="8" fill="none" stroke="#D4A820" strokeWidth="3" />
          <circle cx="70" cy="90" r="55" fill="none" stroke="#D4A820" strokeWidth="2" />
          <circle cx="70" cy="90" r="40" fill="none" stroke="#D4A820" strokeWidth="1" />
          {[0,1,2,3,4,5,6,7].map(i => {
            const a = (i / 8) * Math.PI * 2;
            return <line key={i} x1={70 + Math.cos(a)*40} y1={90 + Math.sin(a)*40} x2={70 + Math.cos(a)*53} y2={90 + Math.sin(a)*53} stroke="#D4A820" strokeWidth="2" />;
          })}
          <circle cx="70" cy="90" r="15" fill="rgba(212,168,32,0.2)" />
          <text x="70" y="95" textAnchor="middle" fontSize="16" fill="#D4A820">$</text>
        </svg>
      </div>

      {/* Ambient wealth glow */}
      <AmbientGlow color="rgba(212,168,32,0.12)" size={700} top="40%" left="50%" />
      <AmbientGlow color="rgba(180,100,0,0.08)"  size={400} top="65%" left="70%" />

      {/* Gold dust particles */}
      {[...Array(10)].map((_, i) => (
        <motion.div key={i}
          className="fixed pointer-events-none"
          style={{
            top:    `${20 + Math.random() * 50}%`,
            left:   `${Math.random() * 100}%`,
            width:  2 + Math.random() * 3,
            height: 2 + Math.random() * 3,
            borderRadius: '50%',
            background: '#D4A820',
            opacity: 0,
            zIndex: 2,
          }}
          animate={{ opacity: [0, 0.6, 0], y: [0, -40], x: [0, (Math.random() - 0.5) * 30] }}
          transition={{ duration: 3 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 6 }}
        />
      ))}

      {/* ── Treasury header ───────────────────────────────────────── */}
      <div className="relative z-10 pt-14">
        <div className="sticky top-0 z-30" style={{ background: 'rgba(10,6,0,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(212,168,32,0.25)' }}>
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: 'linear-gradient(135deg, rgba(212,168,32,0.2), rgba(180,80,0,0.15))', border: '1px solid rgba(212,168,32,0.3)' }}>
              💰
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-white">Bank</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'rgba(212,168,32,0.15)', color: '#D4A820' }}>VLG Treasury</span>
              </div>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Wealth grows where goals are built.</p>
            </div>
            <div style={{ fontSize: 22 }}>🏛️</div>
          </div>
        </div>

        <div className="relative z-10">
          {children}
        </div>
      </div>
    </div>
  );
}
