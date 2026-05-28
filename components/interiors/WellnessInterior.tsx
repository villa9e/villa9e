'use client';
import { motion } from 'framer-motion';
import { AmbientGlow } from './InteriorShell';

// Apothecary jar SVG (inline)
function ApothecaryJar({ color, label, x, y, size = 1 }: { color: string; label: string; x: number; y: number; size?: number }) {
  const s = size;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      {/* Jar body */}
      <ellipse cx="0" cy="0" rx="12" ry="15" fill={`${color}88`} stroke={`${color}cc`} strokeWidth="1.5" />
      {/* Lid */}
      <rect x="-13" y="-17" width="26" height="5" rx="2" fill={`${color}aa`} stroke={`${color}dd`} strokeWidth="1" />
      {/* Label */}
      <rect x="-9" y="-5" width="18" height="10" rx="2" fill="rgba(255,255,255,0.2)" />
      <text x="0" y="3" textAnchor="middle" fontSize="5" fill="white" fontWeight="700" opacity="0.9">{label}</text>
      {/* Cork top */}
      <rect x="-6" y="-22" width="12" height="6" rx="2" fill="#A0845C" />
      {/* Liquid fill */}
      <ellipse cx="0" cy="4" rx="10" ry="8" fill={`${color}55`} />
    </g>
  );
}

// Hanging herb bunch
function HerbBunch({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <line x1="0" y1="0" x2="0" y2="20" stroke="#8B6914" strokeWidth="1.5" strokeLinecap="round" />
      {[...Array(5)].map((_, i) => {
        const angle = -60 + i * 30;
        const rad = (angle * Math.PI) / 180;
        const ex = Math.cos(rad) * 10;
        const ey = 10 + Math.sin(rad) * 6;
        return (
          <g key={i}>
            <line x1="0" y1="10" x2={ex} y2={ey} stroke={color} strokeWidth="1" strokeLinecap="round" />
            <ellipse cx={ex} cy={ey} rx="3" ry="4" fill={color} opacity="0.8" transform={`rotate(${angle},${ex},${ey})`} />
          </g>
        );
      })}
    </g>
  );
}

export function WellnessInterior({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen" style={{ background: '#F8FBF8' }}>

      {/* ── Clean white walls with warm undertone ──────────────── */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'linear-gradient(180deg, #FFFFFF 0%, #F0F8F0 40%, #EAF4EA 100%)',
        zIndex: 0,
      }} />

      {/* Wood panel trim on sides */}
      <div className="fixed top-0 bottom-0 left-0 w-4 pointer-events-none" style={{ background: 'linear-gradient(to right, #8B6914, #A07830)', opacity: 0.35, zIndex: 1 }} />
      <div className="fixed top-0 bottom-0 right-0 w-4 pointer-events-none" style={{ background: 'linear-gradient(to left, #8B6914, #A07830)', opacity: 0.35, zIndex: 1 }} />

      {/* Chair rail molding */}
      <div className="fixed left-0 right-0 pointer-events-none" style={{ top: '35%', height: 3, background: 'linear-gradient(to right, #8B6914, #C4A265, #8B6914)', opacity: 0.25, zIndex: 1 }} />

      {/* Ceiling — clean recessed panel effect */}
      <div className="fixed top-0 left-0 right-0 pointer-events-none" style={{ zIndex: 2 }}>
        <div style={{ height: 4, background: 'linear-gradient(to bottom, #CBD5C0, transparent)', opacity: 0.5 }} />
        {/* Subtle ceiling grid */}
        <div style={{
          height: 60,
          background: 'repeating-linear-gradient(90deg, transparent, transparent 79px, rgba(0,100,40,0.04) 80px), repeating-linear-gradient(0deg, transparent, transparent 59px, rgba(0,100,40,0.04) 60px)',
        }} />
      </div>

      {/* Apothecary shelves — right wall */}
      <div className="fixed right-0 top-24 pointer-events-none" style={{ width: 80, zIndex: 2 }}>
        <svg width="80" height="400" viewBox="0 0 80 400">
          {/* Shelf planks */}
          <rect x="0" y="100" width="80" height="5" rx="2" fill="#8B6914" opacity="0.5" />
          <rect x="0" y="210" width="80" height="5" rx="2" fill="#8B6914" opacity="0.5" />
          <rect x="0" y="320" width="80" height="5" rx="2" fill="#8B6914" opacity="0.5" />
          {/* Jars on shelf 1 */}
          <ApothecaryJar color="#16A34A" label="Sage" x={15} y={85} size={0.7} />
          <ApothecaryJar color="#059669" label="Mint" x={40} y={82} size={0.65} />
          <ApothecaryJar color="#D97706" label="Ginger" x={63} y={87} size={0.6} />
          {/* Jars on shelf 2 */}
          <ApothecaryJar color="#7C3AED" label="Lavender" x={15} y={195} size={0.72} />
          <ApothecaryJar color="#DC2626" label="Rose Hip" x={42} y={192} size={0.65} />
          <ApothecaryJar color="#0D9488" label="Eucalyptus" x={65} y={197} size={0.58} />
          {/* Herb bunches on shelf 3 */}
          <HerbBunch x={20} y={308} color="#16A34A" />
          <HerbBunch x={45} y={305} color="#65A30D" />
          <HerbBunch x={65} y={310} color="#0D9488" />
        </svg>
      </div>

      {/* Botanical illustration — left wall */}
      <div className="fixed left-0 top-32 pointer-events-none" style={{ width: 70, zIndex: 2, opacity: 0.18 }}>
        <svg width="70" height="300" viewBox="0 0 70 300">
          {/* Stylized leaf/plant illustration */}
          <ellipse cx="35" cy="200" rx="4" ry="80" fill="#16A34A" />
          {[0, 1, 2, 3, 4].map(i => {
            const y = 100 + i * 30;
            const side = i % 2 === 0 ? 1 : -1;
            return (
              <ellipse key={i} cx={35 + side * 20} cy={y} rx="20" ry="10"
                fill="#16A34A" opacity="0.8"
                transform={`rotate(${-20 * side},${35 + side * 20},${y})`}
              />
            );
          })}
          {/* Flower */}
          <circle cx="35" cy="80" r="8" fill="#FBBF24" />
          {[0, 1, 2, 3, 4, 5].map(i => {
            const a = (i / 6) * Math.PI * 2;
            return <ellipse key={i} cx={35 + Math.cos(a) * 12} cy={80 + Math.sin(a) * 12} rx="6" ry="4"
              fill="#D97706" transform={`rotate(${(i / 6) * 360},${35 + Math.cos(a) * 12},${80 + Math.sin(a) * 12})`} />;
          })}
        </svg>
      </div>

      {/* Soft healing green ambient */}
      <AmbientGlow color="rgba(22,163,74,0.07)" size={600} top="50%" left="50%" />
      <AmbientGlow color="rgba(251,191,36,0.05)" size={300} top="20%" left="70%" />

      {/* Soft steam from herb vessel */}
      {[0, 1, 2].map(i => (
        <motion.div key={i}
          className="fixed pointer-events-none"
          style={{ bottom: '15%', right: '8%', width: 2, zIndex: 2 }}
          animate={{ y: [0, -40, -80], opacity: [0, 0.3, 0], x: [0, (i - 1) * 4] }}
          transition={{ duration: 2.5, delay: i * 0.7, repeat: Infinity, ease: 'easeOut' }}
        >
          <div style={{ width: 3, height: 20, background: 'rgba(255,255,255,0.4)', borderRadius: 2, filter: 'blur(2px)' }} />
        </motion.div>
      ))}

      {/* ── Clinic header ────────────────────────────────────────── */}
      <div className="relative z-10 pt-0">
        <div className="sticky top-0 z-30" style={{ background: 'rgba(248,251,248,0.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(22,163,74,0.15)' }}>
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)', border: '1px solid #A7F3D0' }}>
              🌿
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black" style={{ color: '#052E16' }}>Wellness Center</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: '#DCFCE7', color: '#15803D' }}>🌿 Healing Space</span>
              </div>
              <p className="text-xs" style={{ color: '#6B7280' }}>Licensed providers · Holistic care · Telehealth</p>
            </div>
            {/* Caduceus symbol */}
            <div style={{ fontSize: 20 }}>⚕️</div>
          </div>

          {/* Service nav pills */}
          <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
            {['Find Provider', 'Book Session', 'Apply as Provider', 'My Care'].map((s, i) => (
              <div key={s} className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap"
                style={{ background: i === 0 ? '#16A34A' : '#ECFDF5', color: i === 0 ? '#fff' : '#15803D', border: '1px solid #A7F3D0' }}>
                {s}
              </div>
            ))}
          </div>
        </div>

        {/* Reassuring wellness banner */}
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="rounded-2xl p-3 flex items-center gap-3"
            style={{ background: 'linear-gradient(135deg, #ECFDF5, #F0FDF4)', border: '1px solid #BBF7D0' }}>
            <span className="text-2xl">🏥</span>
            <div>
              <p className="text-xs font-bold" style={{ color: '#15803D' }}>HIPAA Compliant · NPI Verified</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>All practitioners are licensed. Sessions are private and secure.</p>
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    </div>
  );
}
