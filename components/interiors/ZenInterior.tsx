'use client';
import { motion } from 'framer-motion';
import { FloatingParticles, AmbientGlow } from './InteriorShell';

// Cherry blossom petal shapes (SVG path variants)
const PETAL_COLORS = ['#FFB7C5', '#FF8FA3', '#FFC0D0', '#FFAABB', '#FFD6E0', '#F9A8B4'];

export function ZenInterior({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ background: '#071510' }}>

      {/* ── Atmospheric background layers ────────────────────────── */}
      {/* Deep forest base */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 50% 60%, #0A2318 0%, #071510 50%, #040C08 100%)',
        zIndex: 0,
      }} />

      {/* Stone floor texture at bottom */}
      <div className="fixed bottom-0 left-0 right-0 h-32 pointer-events-none" style={{
        background: 'repeating-linear-gradient(90deg, rgba(80,70,60,0.12) 0px, rgba(80,70,60,0.12) 1px, transparent 1px, transparent 48px), repeating-linear-gradient(0deg, rgba(80,70,60,0.08) 0px, rgba(80,70,60,0.08) 1px, transparent 1px, transparent 32px)',
        zIndex: 0,
      }} />

      {/* Bamboo stalks — left and right walls */}
      {[...Array(6)].map((_, i) => (
        <div key={`bl-${i}`} className="fixed pointer-events-none" style={{
          left:       `${i * 5}%`,
          top:        0,
          bottom:     0,
          width:      12 + (i % 2) * 4,
          background: `linear-gradient(to right, #2A4A2A, #3D6B3D ${30 + i * 5}%, #2A4A2A)`,
          opacity:    0.25 - i * 0.02,
          zIndex:     0,
          borderRight: '1px solid rgba(80,120,60,0.15)',
          borderLeft:  '1px solid rgba(80,120,60,0.15)',
        }} />
      ))}
      {[...Array(5)].map((_, i) => (
        <div key={`br-${i}`} className="fixed pointer-events-none" style={{
          right:      `${i * 5}%`,
          top:        0,
          bottom:     0,
          width:      10 + (i % 2) * 5,
          background: `linear-gradient(to left, #2A4A2A, #3D6B3D 40%, #2A4A2A)`,
          opacity:    0.20 - i * 0.02,
          zIndex:     0,
        }} />
      ))}

      {/* Bamboo horizontal joints */}
      {[...Array(8)].map((_, i) => (
        <div key={`bj-${i}`} className="fixed left-0 right-0 pointer-events-none" style={{
          top:       `${10 + i * 12}%`,
          height:    2,
          background: 'rgba(80,120,60,0.1)',
          zIndex:    0,
        }} />
      ))}

      {/* Ceiling — paper lanterns hanging */}
      <div className="fixed top-0 left-0 right-0 pointer-events-none" style={{ zIndex: 2 }}>
        {/* Horizontal ceiling beam */}
        <div style={{ height: 6, background: 'linear-gradient(to right, #1A3A1A, #2D5A2D, #1A3A1A)', opacity: 0.8 }} />
        {/* Hanging lanterns */}
        <div className="flex justify-around px-8 pt-2">
          {[...Array(5)].map((_, i) => (
            <motion.div key={i}
              animate={{ rotate: [-(2 + i), (2 + i), -(2 + i)] }}
              transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{ transformOrigin: 'top center' }}
            >
              {/* String */}
              <div style={{ width: 1, height: 20 + i * 8, background: 'rgba(200,180,140,0.4)', margin: '0 auto' }} />
              {/* Lantern body */}
              <div style={{
                width:  18 + i * 2,
                height: 24 + i * 2,
                borderRadius: '50%',
                background: `radial-gradient(ellipse at 40% 35%, ${['#FFD700', '#FF8C00', '#FFA500', '#FFB347', '#FFCC00'][i]}44, ${['#8B6914', '#7A4500', '#7A5500', '#8B5E00', '#7A6500'][i]}88)`,
                boxShadow:  `0 0 12px ${['#FFD70066', '#FF8C0066', '#FFA50066', '#FFB34766', '#FFCC0066'][i]}`,
                margin:     '0 auto',
              }} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Ambient glow — soft sage light from center */}
      <AmbientGlow color="rgba(13,148,136,0.18)" size={700} top="40%" left="50%" />
      <AmbientGlow color="rgba(34,197,94,0.06)"  size={400} top="70%" left="30%" />
      <AmbientGlow color="rgba(251,191,36,0.08)" size={200} top="15%" left="50%" />

      {/* Cherry blossom petals falling */}
      <FloatingParticles count={18} emoji="🌸" sizeRange={[12, 20]} durRange={[10, 22]} />

      {/* Koi pond at bottom (decorative waterline) */}
      <div className="fixed bottom-0 left-0 right-0 pointer-events-none" style={{ zIndex: 1 }}>
        <motion.div
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
          style={{
            height:     40,
            background: 'linear-gradient(to top, rgba(13,148,136,0.25), transparent)',
          }}
        />
        {/* Water ripple lines */}
        {[...Array(3)].map((_, i) => (
          <motion.div key={i}
            animate={{ scaleX: [0.8, 1.1, 0.8], opacity: [0.15, 0.35, 0.15] }}
            transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.8 }}
            style={{
              position:    'absolute',
              bottom:      8 + i * 10,
              left:        '15%',
              right:       '15%',
              height:      1,
              background:  'rgba(13,148,136,0.4)',
              borderRadius: 4,
            }}
          />
        ))}
      </div>

      {/* Water sound ripple hint */}
      <motion.div
        animate={{ opacity: [0, 0.6, 0], scale: [1, 1.3, 1] }}
        transition={{ duration: 4, repeat: Infinity, delay: 2 }}
        className="fixed pointer-events-none"
        style={{ bottom: 50, right: '15%', width: 30, height: 30, borderRadius: '50%', border: '1px solid rgba(13,148,136,0.4)', zIndex: 2 }}
      />

      {/* ── Entry arch ───────────────────────────────────────────── */}
      <div className="relative z-10 pt-16">

        {/* Torii gate header */}
        <div className="sticky top-0 z-30" style={{ background: 'rgba(7,21,16,0.88)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(13,148,136,0.2)' }}>
          <div className="max-w-2xl mx-auto px-4 py-4">
            {/* Torii crossbeam visual */}
            <div className="flex items-center gap-3">
              <div className="text-2xl">⛩️</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-black text-white tracking-tight">Zen Garden</h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'rgba(13,148,136,0.2)', color: '#0D9488' }}>Sanctuary</span>
                </div>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Breathe. Be still. Heal.</p>
              </div>
              {/* Animated zen circle */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(13,148,136,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0D9488' }} />
              </motion.div>
            </div>
          </div>
        </div>

        {/* Stepping stone path */}
        <div className="flex justify-center gap-4 py-4 px-4" style={{ zIndex: 10, position: 'relative' }}>
          {['Breathwork', 'Meditate', 'Journal', 'Music', 'Affirmation'].map((s, i) => (
            <motion.div key={s}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-full px-3 py-1.5 text-xs font-semibold cursor-pointer whitespace-nowrap"
              style={{ background: 'rgba(13,148,136,0.12)', color: '#5EEAD4', border: '1px solid rgba(13,148,136,0.2)' }}
            >
              {s}
            </motion.div>
          ))}
        </div>

        {/* Page content */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    </div>
  );
}
