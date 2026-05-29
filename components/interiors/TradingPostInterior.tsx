'use client';
import { motion } from 'framer-motion';

// ─── Market stall awning ──────────────────────────────────────────────────────
function StallAwning({ x, color1, color2 }: {
  x: number; color1: string; color2: string;
}) {
  const stripes = 7;
  return (
    <div style={{ position: 'absolute', left: x, top: 0, width: 90, pointerEvents: 'none' }}>
      <svg width="90" height="40" viewBox="0 0 90 40">
        {/* Awning shape — scalloped */}
        {Array.from({ length: stripes }, (_, i) => (
          <rect key={i} x={i * 13} y="0" width="13" height="40"
            fill={i % 2 === 0 ? color1 : color2} opacity="0.55" />
        ))}
        {/* Scallop bottom */}
        {Array.from({ length: 6 }, (_, i) => (
          <ellipse key={i} cx={7.5 + i * 15} cy="40" rx="7.5" ry="8"
            fill={i % 2 === 0 ? color1 : color2} opacity="0.55" />
        ))}
      </svg>
    </div>
  );
}

// ─── Merchant goods display ───────────────────────────────────────────────────
function MerchantGoods({ side }: { side: 'left' | 'right' }) {
  const flip = side === 'right';
  return (
    <div className="fixed pointer-events-none"
      style={{ [side]: 0, top: 0, bottom: 0, width: 70, zIndex: 1 }}>
      <svg width="70" height="600" viewBox="0 0 70 600"
        style={{ transform: flip ? 'scaleX(-1)' : undefined }}>

        {/* Shelf boards */}
        {[100, 200, 300, 420].map((y, i) => (
          <rect key={i} x="0" y={y} width="70" height="6" rx="2" fill="#5A3820" opacity="0.4" />
        ))}

        {/* Spice jars on shelf 1 */}
        {[8, 24, 42, 58].map((x, i) => (
          <g key={i} transform={`translate(${x},80)`}>
            <rect x="0" y="0" width="10" height="16" rx="4" fill={['#C84A1A','#4A8A2A','#2A4A8A','#8A6A1A'][i]} opacity="0.55" />
            <ellipse cx="5" cy="0" rx="5" ry="2" fill={['#E86A3A','#6AAA4A','#4A6AAA','#AA8A3A'][i]} opacity="0.4" />
          </g>
        ))}

        {/* Hanging baskets on shelf 2 */}
        {[10, 36].map((x, i) => (
          <g key={i} transform={`translate(${x},140)`}>
            <line x1="12" y1="0" x2="12" y2="12" stroke="#8B6914" strokeWidth="1.5" opacity="0.5" />
            <path d="M2,12 Q12,24 22,12" fill="#8B5A2A" opacity="0.5" />
            <path d="M4,14 Q12,20 20,14" fill="#A06030" opacity="0.4" />
          </g>
        ))}

        {/* Scrolls on shelf 3 */}
        {[5, 30, 55].map((x, i) => (
          <g key={i} transform={`translate(${x},216)`}>
            <rect x="0" y="0" width="12" height="22" rx="5" fill="#D4B483" opacity="0.5" />
            <line x1="0" y1="5" x2="12" y2="5" stroke="#8B6914" strokeWidth="1" opacity="0.4" />
            <line x1="0" y1="17" x2="12" y2="17" stroke="#8B6914" strokeWidth="1" opacity="0.4" />
          </g>
        ))}

        {/* Gems/crystals shelf 4 */}
        {[8, 28, 48].map((x, i) => (
          <g key={i} transform={`translate(${x},330)`}>
            <polygon points="6,0 12,10 6,16 0,10"
              fill={['#4ADE80','#60A5FA','#E879F9'][i]} opacity="0.45" />
          </g>
        ))}

        {/* Hanging lanterns */}
        {[20, 50].map((x, i) => (
          <g key={i} transform={`translate(${x},450)`}>
            <line x1="6" y1="-20" x2="6" y2="0" stroke="#8B6914" strokeWidth="1.5" opacity="0.4" />
            <path d="M0,0 Q6,20 12,0 L12,16 Q6,36 0,16 Z" fill="#D97706" opacity="0.35" />
          </g>
        ))}
      </svg>
    </div>
  );
}

// ─── Floating price tags ──────────────────────────────────────────────────────
function PriceTags() {
  const tags = [
    { x: '15%', y: '30%', text: '⬡ 24 VLG' },
    { x: '72%', y: '22%', text: '⬡ 80 VLG' },
    { x: '45%', y: '65%', text: '⬡ 12 VLG' },
  ];
  return (
    <>
      {tags.map((tag, i) => (
        <motion.div key={i}
          className="fixed pointer-events-none text-[10px] font-bold"
          style={{
            left: tag.x, top: tag.y, zIndex: 2,
            color: '#D97706', background: 'rgba(0,0,0,0.4)',
            padding: '2px 6px', borderRadius: 6,
            border: '1px solid rgba(180,120,0,0.3)',
          }}
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 1.2, ease: 'easeInOut' }}
        >
          {tag.text}
        </motion.div>
      ))}
    </>
  );
}

export function TradingPostInterior({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden"
      style={{ background: 'linear-gradient(160deg, #060400 0%, #0A0600 50%, #080400 100%)' }}>

      {/* ── Warm bazaar atmosphere ────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: `
          radial-gradient(ellipse at 40% 30%, rgba(150,90,10,0.12) 0%, transparent 50%),
          radial-gradient(ellipse at 70% 70%, rgba(120,60,5,0.1) 0%, transparent 45%)
        `,
        zIndex: 0,
      }} />

      {/* ── Awnings across top ────────────────────────────────────────── */}
      <div className="fixed top-0 left-0 right-0 pointer-events-none" style={{ zIndex: 1, height: 45 }}>
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          {[0, 92, 184, 276, 368].map((x, i) => (
            <StallAwning key={i} x={x}
              color1={['#D97706','#DC2626','#7C3AED','#059669','#2563EB'][i]}
              color2={['#92400E','#991B1B','#4C1D95','#065F46','#1E3A8A'][i]}
            />
          ))}
        </div>
      </div>

      {/* ── Merchant goods on left and right walls ────────────────────── */}
      <MerchantGoods side="left" />
      <MerchantGoods side="right" />

      {/* ── Floating price tags ───────────────────────────────────────── */}
      <PriceTags />

      {/* ── Market floor tiles ────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 h-20 pointer-events-none" style={{
        background: `
          repeating-linear-gradient(90deg, rgba(140,90,20,0.1) 0px, rgba(140,90,20,0.1) 1px, transparent 1px, transparent 44px),
          repeating-linear-gradient(0deg, rgba(140,90,20,0.08) 0px, rgba(140,90,20,0.08) 1px, transparent 1px, transparent 44px)
        `,
        zIndex: 0,
      }} />

      {/* ── Lantern warm glow ─────────────────────────────────────────── */}
      <motion.div
        className="fixed pointer-events-none"
        style={{
          zIndex: 1, top: '18%', left: '50%', transform: 'translateX(-50%)',
          width: 180, height: 180,
          background: 'radial-gradient(circle, rgba(220,150,0,0.1) 0%, transparent 70%)',
        }}
        animate={{ opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* ── Dust motes floating ───────────────────────────────────────── */}
      {Array.from({ length: 14 }, (_, i) => (
        <motion.div key={i}
          className="fixed pointer-events-none rounded-full"
          style={{
            width: 2, height: 2,
            left:  `${(i * 31 + 8) % 90}%`,
            background: 'rgba(200,150,50,0.4)',
            zIndex: 2,
          }}
          animate={{ y: ['80vh', '20vh'], opacity: [0, 0.4, 0], x: [(i % 3 - 1) * 10, (i % 3 - 1) * 30] }}
          transition={{ duration: 12 + i * 1.5, repeat: Infinity, delay: i * 0.9, ease: 'linear' }}
        />
      ))}

      <div className="relative" style={{ zIndex: 10 }}>
        {children}
      </div>
    </div>
  );
}
