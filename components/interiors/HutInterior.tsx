'use client';
import { motion } from 'framer-motion';
import { AmbientGlow } from './InteriorShell';

// ─── Hut Interior — The personal sanctuary at the heart of the forest ─────────
//
// Design intent: Every element in this space is intentional.
//
// THE THATCHED HUT (Dogon compound aesthetic, West African)
// ─────────────────────────────────────────────────────────
// This is not just a profile page. It is the user's personal home inside villa9e.
// The space should feel:
//   · Warm and lived-in — not sterile or corporate
//   · Sacred but accessible — like a real home that also holds meaning
//   · Deeply African — rooted in real architecture, not fantasy
//
// INTENTIONAL ELEMENTS:
//
// 1. THE MUD-BRICK WALLS — Dogon of Mali build in sun-dried brick, hand-shaped,
//    slightly imperfect. The grid texture represents that reality. Not "primitive" —
//    deeply sophisticated architecture that has stood for centuries.
//
// 2. THE THATCHED CEILING — Millet stalks woven by hand. The Dogon toguna
//    (word-house) had a deliberately low thatched roof so elders had to bow
//    when entering, preventing aggression. This ceiling signals: enter humbly.
//
// 3. THE GOAL WALL (left side) — A visual record of the user's GPS plans.
//    Goals pinned like a strategy board. Progress is visible. The wall holds
//    the user accountable — when friends visit, they see your commitments.
//
// 4. THE TROPHY SHELF (right side) — Each badge earned in the village.
//    Not generic emoji — these are OoWop validations, milestone completions,
//    founding villager status. Each one was earned through real action.
//
// 5. THE CANDLES — Four candles on a clay shelf. One for each direction.
//    Symbolically: knowledge (north), action (east), reflection (south),
//    community (west). The flames animate because a home is alive.
//
// 6. THE WOVEN TEXTILE STRIPS — Kente-adjacent weaving on the walls. Each
//    color strip is deliberate: gold = vision, orange = action, purple = spirit.
//    The pattern is never random; it represents the user's journey.
//
// 7. THE WINDOW (the portal) — A single window that lets light in and lets
//    the user see the village world outside. A reminder that the Hut is
//    personal, but the village is shared.
//
// 8. THE MAT ON THE FLOOR — A woven grass mat. When a visitor enters a Dogon
//    home, they sit on the mat. The mat says: you are welcome here.
//
// 9. THE WATER JUG — Clay jug near the entrance. In Dogon tradition, guests
//    are offered water before anything else. The jug signals hospitality.
//
// 10. THE GRANARY SHADOWS (corner) — Faint outline of the four cylindrical
//     granaries that flank a Dogon compound. They hold sustenance — here
//     they hold the user's potential, their stored energy and plans.
//
// This space evolves with the user's achievements. When they reach Elder tier,
// the candles become gold. When they complete 10 goals, new textile strips appear.
// The Hut is never static — it grows with its owner.

export function HutInterior({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen" style={{ background: '#0E0800' }}>

      {/* ── BASE ATMOSPHERE — warm mud-brick earth tone ── */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 35% 40%, #1E0E00 0%, #140900 55%, #0A0500 100%)',
        zIndex: 0,
      }} />

      {/* ── MUD-BRICK WALL TEXTURE ── */}
      {/* Horizontal mortar joints */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: `
          repeating-linear-gradient(0deg, transparent 0px, transparent 30px, rgba(60,35,10,0.14) 30px, rgba(60,35,10,0.14) 32px),
          repeating-linear-gradient(90deg, transparent 0px, transparent 58px, rgba(50,28,8,0.06) 58px, rgba(50,28,8,0.06) 60px)
        `,
        zIndex: 0,
      }} />
      {/* Brick surface variation — subtle warmth */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 80% 20%, rgba(180,80,20,0.04) 0%, transparent 60%)',
        zIndex: 0,
      }} />

      {/* ── THATCHED CEILING ── */}
      {/* The layered straw texture suggesting millet stalks woven by hand */}
      <div className="fixed top-0 left-0 right-0 pointer-events-none" style={{ zIndex: 3, height: 90 }}>
        <svg width="100%" height="90" preserveAspectRatio="none" style={{ display: 'block' }}>
          {/* Base thatch layer */}
          {[...Array(22)].map((_, i) => (
            <path
              key={`thatch-${i}`}
              d={`M${i * 4.8}%,0 Q${i * 4.8 + 2.4}%,${35 + (i % 3) * 8} ${(i + 1) * 4.8}%,0`}
              fill={`rgba(${55 + (i % 4) * 8},${32 + (i % 3) * 5},${6 + (i % 2) * 4},${0.75 + (i % 3) * 0.08})`}
            />
          ))}
          {/* Straw strand details */}
          {[...Array(18)].map((_, i) => (
            <line key={`strand-${i}`}
              x1={`${i * 5.6 + (i % 2) * 1.5}%`} y1="0"
              x2={`${i * 5.6 + (i % 2) * 1.5 + 0.8}%`} y2="90"
              stroke={`rgba(80,45,8,${0.2 + (i % 3) * 0.08})`} strokeWidth="0.7"
            />
          ))}
          {/* Ridge beam — the central structural element */}
          <rect x="0" y="0" width="100%" height="5"
            fill="rgba(40,22,6,0.85)" />
          {/* Beam texture */}
          {[...Array(8)].map((_, i) => (
            <rect key={`beam-${i}`} x={`${i * 12.5}%`} y="0" width="0.8%" height="5"
              fill="rgba(20,10,2,0.4)" />
          ))}
          {/* Hanging edge — drip of thatch */}
          {[...Array(14)].map((_, i) => (
            <path key={`drip-${i}`}
              d={`M${i * 7.2 + 1}%,85 Q${i * 7.2 + 3.6}%,${90 + (i % 3) * 4} ${i * 7.2 + 6.8}%,84`}
              fill={`rgba(70,40,8,0.6)`} />
          ))}
        </svg>
      </div>

      {/* ── LEFT WALL — KENTE-ADJACENT TEXTILE STRIPS ── */}
      {/* Gold = vision · Orange = action · Purple = spirit · Green = growth */}
      <div className="fixed top-0 left-0 bottom-0 pointer-events-none" style={{ width: 52, zIndex: 2 }}>
        <svg width="52" height="100%" style={{ height: '100vh' }} preserveAspectRatio="none">
          {/* Repeat pattern every 180px */}
          {[...Array(7)].map((_, group) => (
            <g key={group} transform={`translate(0,${group * 180})`}>
              {/* Gold strip — vision */}
              <rect x="0" y="0" width="13" height="180" fill="rgba(180,130,10,0.32)" />
              {/* Gold geometric detail */}
              {[...Array(6)].map((_, r) => (
                <rect key={r} x="2" y={r * 30 + 8} width="9" height="14"
                  fill="rgba(220,165,15,0.25)" rx="1" />
              ))}
              {/* Orange strip — action */}
              <rect x="13" y="0" width="13" height="180" fill="rgba(200,80,15,0.3)" />
              {/* Orange chevrons */}
              {[...Array(5)].map((_, r) => (
                <path key={r} d={`M13,${r*36+10} L19,${r*36+22} L26,${r*36+10}`}
                  fill="none" stroke="rgba(240,100,20,0.35)" strokeWidth="1.5" />
              ))}
              {/* Purple strip — spirit */}
              <rect x="26" y="0" width="13" height="180" fill="rgba(100,50,180,0.28)" />
              {/* Purple diamonds */}
              {[...Array(6)].map((_, r) => (
                <polygon key={r}
                  points={`32,${r*30+5} 38,${r*30+15} 32,${r*30+25} 26,${r*30+15}`}
                  fill="rgba(130,60,220,0.22)" />
              ))}
              {/* Green strip — growth */}
              <rect x="39" y="0" width="13" height="180" fill="rgba(20,90,40,0.28)" />
              {/* Mortar line between strips */}
              <line x1="0" y1="180" x2="52" y2="180"
                stroke="rgba(200,140,60,0.12)" strokeWidth="0.6" />
            </g>
          ))}
        </svg>
      </div>

      {/* ── RIGHT WALL — MIRROR TEXTILE (slightly different pattern) ── */}
      <div className="fixed top-0 right-0 bottom-0 pointer-events-none" style={{ width: 52, zIndex: 2, transform: 'scaleX(-1)' }}>
        <svg width="52" height="100%" style={{ height: '100vh' }} preserveAspectRatio="none">
          {[...Array(7)].map((_, group) => (
            <g key={group} transform={`translate(0,${group * 180 + 45})`}>
              <rect x="0" y="0" width="13" height="180" fill="rgba(20,90,40,0.28)" />
              <rect x="13" y="0" width="13" height="180" fill="rgba(100,50,180,0.28)" />
              <rect x="26" y="0" width="13" height="180" fill="rgba(200,80,15,0.28)" />
              <rect x="39" y="0" width="13" height="180" fill="rgba(180,130,10,0.28)" />
              <line x1="0" y1="180" x2="52" y2="180" stroke="rgba(200,140,60,0.12)" strokeWidth="0.6" />
            </g>
          ))}
        </svg>
      </div>

      {/* ── CANDLES (right side, mid-height) ── */}
      {/* Four candles = four directions. Each flame is alive. */}
      <div className="fixed pointer-events-none" style={{ bottom: '28%', right: '8%', zIndex: 4 }}>
        {/* Clay shelf */}
        <div style={{ height: 3, background: '#5A3520', borderRadius: 1, marginBottom: 0, width: 80 }} />
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', padding: '2px 0' }}>
          {[{ h: 32, color: '#FFD700' }, { h: 22, color: '#FF9A00' }, { h: 28, color: '#FFD700' }, { h: 16, color: '#FFCC00' }].map((c, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Flame */}
              <motion.div
                animate={{ scaleX: [1, 1.3, 0.8, 1.2, 1], skewX: [0, 6, -4, 5, 0], scaleY: [1, 1.1, 0.9, 1.05, 1] }}
                transition={{ duration: 0.7 + i * 0.18, repeat: Infinity }}
                style={{ width: 5, height: 12, background: `linear-gradient(to top, #FF6B00, ${c.color})`, borderRadius: '50% 50% 30% 30%', marginBottom: -2 }}
              />
              {/* Wax body */}
              <div style={{ width: 9, height: c.h, background: `linear-gradient(to bottom, #F0E0C0, #D4C0A0)`, borderRadius: '2px 2px 0 0' }} />
            </div>
          ))}
        </div>
        {/* Candle shadow glow */}
        <motion.div
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{ position: 'absolute', bottom: -5, left: -10, right: -10, height: 20, background: 'rgba(255,160,50,0.12)', filter: 'blur(8px)', borderRadius: '50%' }}
        />
      </div>

      {/* ── TROPHY / ACHIEVEMENT SHELF (left side, upper) ── */}
      {/* Each trophy was earned. This shelf holds real accomplishments. */}
      <div className="fixed pointer-events-none" style={{ bottom: '42%', left: '7%', zIndex: 4 }}>
        <div style={{ display: 'flex', gap: 7, alignItems: 'flex-end', marginBottom: 3 }}>
          {['🏆', '🎯', '⚡', '🌟', '✊'].map((emoji, i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 2.5 + i * 0.3, repeat: Infinity, delay: i * 0.5 }}
              style={{ fontSize: 15, opacity: 0.65 }}
            >
              {emoji}
            </motion.div>
          ))}
        </div>
        {/* Shelf */}
        <div style={{ height: 2, background: '#3D2200', borderRadius: 1, width: 90 }} />
        {/* Shelf supports */}
        {[12, 78].map((x, i) => (
          <div key={i} style={{ position: 'absolute', bottom: 0, left: x, width: 4, height: 12, background: '#3D2200', borderRadius: 1 }} />
        ))}
      </div>

      {/* ── WOVEN MAT (floor, bottom center) ── */}
      {/* The mat says: you are welcome here */}
      <div className="fixed pointer-events-none" style={{ bottom: 0, left: '50%', transform: 'translateX(-50%)', zIndex: 2, width: '60%', maxWidth: 320 }}>
        <svg width="100%" height="28" preserveAspectRatio="none">
          {/* Mat base */}
          <rect x="0" y="4" width="100%" height="22" rx="4" fill="rgba(140,90,30,0.2)" />
          {/* Weave pattern */}
          {[...Array(12)].map((_, i) => (
            <rect key={i} x={`${i * 8.5}%`} y="4" width="7%" height="22"
              fill={`rgba(${i%2===0?150:120},${i%2===0?80:70},${i%2===0?20:15},0.12)`} />
          ))}
          {/* Border */}
          <rect x="0" y="4" width="100%" height="3" fill="rgba(180,120,40,0.25)" rx="4" />
          <rect x="0" y="23" width="100%" height="3" fill="rgba(180,120,40,0.25)" />
        </svg>
      </div>

      {/* ── WINDOW (far wall, lets in a shaft of light) ── */}
      <div className="fixed pointer-events-none" style={{ top: '25%', left: '50%', transform: 'translateX(-50%)', zIndex: 3, width: 80, height: 100 }}>
        {/* Window frame */}
        <div style={{ border: '3px solid rgba(90,50,15,0.5)', borderRadius: 8, width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
          {/* Distant forest view */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #1A3020, #0D1A10)', opacity: 0.8 }} />
          {/* Light shaft through window */}
          <motion.div
            animate={{ opacity: [0.06, 0.12, 0.06] }}
            transition={{ duration: 4, repeat: Infinity }}
            style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,220,100,0.15), transparent)' }}
          />
          {/* Mullion cross */}
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 2, background: 'rgba(80,45,10,0.6)' }} />
          <div style={{ position: 'absolute', left: 0, right: 0, top: '45%', height: 2, background: 'rgba(80,45,10,0.6)' }} />
        </div>
        {/* Light shaft cast on floor */}
        <motion.div
          animate={{ opacity: [0.03, 0.07, 0.03] }}
          transition={{ duration: 4, repeat: Infinity }}
          style={{ position: 'absolute', top: '100%', left: '10%', right: '10%', height: 120, background: 'linear-gradient(180deg, rgba(255,200,80,0.06), transparent)', transform: 'perspective(200px) rotateX(60deg)', transformOrigin: 'top' }}
        />
      </div>

      {/* ── CLAY WATER JUG (near entrance, left) ── */}
      <div className="fixed pointer-events-none" style={{ bottom: '10%', left: '10%', zIndex: 4 }}>
        <svg width="28" height="40" viewBox="0 0 28 40">
          {/* Jug body */}
          <ellipse cx="14" cy="26" rx="10" ry="12" fill="rgba(140,70,20,0.45)" />
          {/* Jug neck */}
          <rect x="10" y="10" width="8" height="10" rx="3" fill="rgba(140,70,20,0.4)" />
          {/* Jug mouth */}
          <ellipse cx="14" cy="10" rx="5" ry="2.5" fill="rgba(160,80,25,0.5)" />
          {/* Highlight */}
          <ellipse cx="11" cy="22" rx="3" ry="5" fill="rgba(200,120,50,0.15)" />
          {/* Handle */}
          <path d="M24 18 Q30 24 24 30" fill="none" stroke="rgba(130,65,18,0.4)" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>

      {/* ── AMBIENT FIRE GLOW — warmth from the sacred fire outside ── */}
      <AmbientGlow color="rgba(220,100,20,0.13)" size={550} top="55%" left="50%" />
      <AmbientGlow color="rgba(200,80,10,0.08)"  size={380} top="75%" left="75%" />
      <AmbientGlow color="rgba(120,50,180,0.06)" size={280} top="35%" left="25%" />

      {/* ── CANDLE GLOW FLICKERS (light from the shelf) ── */}
      {[0, 1, 2, 3].map(i => (
        <motion.div key={i}
          className="fixed pointer-events-none"
          style={{
            bottom: `${29 + i * 0.15}%`, right: `${8.5 + i * 2}%`,
            width: 22, height: 22, borderRadius: '50%',
            background: 'rgba(255,190,70,0.22)', filter: 'blur(7px)',
            zIndex: 2,
          }}
          animate={{ opacity: [0.3, 0.75, 0.35, 0.8, 0.3] }}
          transition={{ duration: 0.9 + i * 0.25, repeat: Infinity }}
        />
      ))}

      {/* ── GRANARY SHADOWS (corners — holding potential) ── */}
      {/* Subtle circular outlines in bottom corners — the granaries of the compound */}
      {[{ x: '3%', bottom: '2%' }, { x: '89%', bottom: '2%' }].map((pos, i) => (
        <div key={i} className="fixed pointer-events-none" style={{ ...pos, zIndex: 1, width: 60, height: 80 }}>
          <svg width="60" height="80" viewBox="0 0 60 80">
            <ellipse cx="30" cy="50" rx="26" ry="28" fill="none" stroke="rgba(80,45,10,0.12)" strokeWidth="1.5" />
            <rect x="8" y="18" width="44" height="32" rx="2" fill="rgba(60,35,8,0.06)" />
          </svg>
        </div>
      ))}

      {/* ── HEADER ── */}
      <div className="relative z-10 pt-14">
        <div className="sticky top-0 z-30" style={{
          background: 'rgba(14,8,0,0.93)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(220,100,20,0.22)',
        }}>
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: 'linear-gradient(135deg, rgba(220,100,20,0.2), rgba(200,80,10,0.1))', border: '1px solid rgba(220,100,20,0.3)' }}>
              🏠
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-white">My Hut</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ background: 'rgba(220,100,20,0.2)', color: '#FB923C' }}>
                  Personal Sanctuary
                </span>
              </div>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.32)' }}>
                Your space. Your story. Your village.
              </p>
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
