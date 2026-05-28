'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';

// Mirrors VillageWorld3D LOCATIONS — world coords mapped to SVG viewport
const MAP_BUILDINGS = [
  { id: 'workshop',     label: 'Workshop',        icon: '🔨', href: '/village/workshop',     wx: -22, wz: -16, color: '#E8770A' },
  { id: 'dreamline',   label: 'Dream Line',       icon: '✨', href: '/village/dreamline',    wx:  22, wz: -16, color: '#7C3AED' },
  { id: 'trading-post',label: 'Trading Post',     icon: '🤝', href: '/village/trading-post', wx: -22, wz:  16, color: '#059669' },
  { id: 'bank',         label: 'Bank',            icon: '💰', href: '/village/bank',         wx:  22, wz:  16, color: '#D97706' },
  { id: 'zen',          label: 'Zen Garden',      icon: '🧘', href: '/village/zen',          wx: -34, wz:  0,  color: '#0D9488' },
  { id: 'tribes',       label: 'Tribes',          icon: '👥', href: '/village/tribes',       wx:  30, wz:  0,  color: '#BE185D' },
  { id: 'hospital',     label: 'Wellness Center', icon: '🌿', href: '/village/hospital',     wx:   0, wz: -28, color: '#16A34A' },
  { id: 'hut',          label: 'My Hut',          icon: '🏠', href: '/village/hut',          wx:   0, wz:  26, color: '#EA580C' },
  { id: 'spirit',       label: 'Spirit Grove',    icon: '🌿', href: '/village/spirit',       wx:   0, wz:   0, color: '#1877F2' },
] as const;

// World bounds → SVG viewport
const WX_MIN = -40, WX_MAX = 40;  // world X range
const WZ_MIN = -35, WZ_MAX = 35;  // world Z range (Z = vertical on map)
const SVG_W  = 400;
const SVG_H  = 350;

function wx2svg(wx: number) { return ((wx - WX_MIN) / (WX_MAX - WX_MIN)) * SVG_W; }
function wz2svg(wz: number) { return ((wz - WZ_MIN) / (WZ_MAX - WZ_MIN)) * SVG_H; }

// River path — flows from Zen waterfall area → through village center → east
const RIVER_PATH = `M ${wx2svg(-36)} ${wz2svg(-8)}
  Q ${wx2svg(-28)} ${wz2svg(-4)} ${wx2svg(-20)} ${wz2svg(0)}
  Q ${wx2svg(-10)} ${wz2svg(3)}  ${wx2svg(0)}   ${wz2svg(2)}
  Q ${wx2svg(10)}  ${wz2svg(1)}  ${wx2svg(20)}  ${wz2svg(-1)}
  Q ${wx2svg(30)}  ${wz2svg(-3)} ${wx2svg(40)}  ${wz2svg(0)}`;

// Mountain shape near Zen
function Mountain({ x, y, size = 1 }: { x: number; y: number; size?: number }) {
  const s = size * 22;
  return (
    <g>
      <polygon points={`${x},${y} ${x - s},${y + s} ${x + s},${y + s}`} fill="#2D3748" opacity={0.7} />
      <polygon points={`${x},${y} ${x - s * 0.4},${y + s * 0.55} ${x + s * 0.4},${y + s * 0.55}`} fill="#E2E8F0" opacity={0.9} />
    </g>
  );
}

export function VillageMap2D({ onNavigate }: { onNavigate: (href: string) => void }) {
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';
  const [hovered, setHovered] = useState<string | null>(null);

  const bg     = isNight ? '#0A0F1E' : '#1A2F1A';
  const ground = isNight ? '#0D1A0D' : '#1F3D1F';
  const water  = isNight ? '#0D2D4A' : '#1A5276';
  const paths  = isNight ? '#2A1A00' : '#3D2800';

  return (
    <div className="w-full h-full flex flex-col" style={{ background: bg }}>
      {/* Title */}
      <div className="flex-shrink-0 px-4 py-3 flex items-center justify-between"
        style={{ borderBottom: `1px solid ${isNight ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.12)'}` }}>
        <div>
          <p className="text-sm font-black text-white">Village Map</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Tap a building to enter</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(24,119,242,0.15)', border: '1px solid rgba(24,119,242,0.3)' }}>
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-xs text-blue-400 font-semibold">Live</span>
        </div>
      </div>

      {/* SVG Map */}
      <div className="flex-1 flex items-center justify-center p-4 min-h-0">
        <div className="w-full max-w-md" style={{ aspectRatio: `${SVG_W}/${SVG_H}` }}>
          <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full h-full" style={{ borderRadius: 16, overflow: 'hidden' }}>
            {/* Ground */}
            <rect width={SVG_W} height={SVG_H} fill={ground} />

            {/* Forest ring (rough outline) */}
            <ellipse cx={SVG_W/2} cy={SVG_H/2} rx={SVG_W*0.48} ry={SVG_H*0.48} fill="none" stroke={isNight ? '#0A1F0A' : '#1A3A1A'} strokeWidth={18} opacity={0.7} />

            {/* Mountains near Zen (top-left area) */}
            <Mountain x={wx2svg(-38)} y={wz2svg(-12)} size={1.2} />
            <Mountain x={wx2svg(-42)} y={wz2svg(-6)}  size={0.8} />
            <Mountain x={wx2svg(-36)} y={wz2svg(-18)} size={0.9} />

            {/* Waterfall spray (near Zen) */}
            <ellipse cx={wx2svg(-36)} cy={wz2svg(-8)} rx={5} ry={3} fill={water} opacity={0.8} />
            <line x1={wx2svg(-36)} y1={wz2svg(-14)} x2={wx2svg(-36)} y2={wz2svg(-8)} stroke={water} strokeWidth={3} opacity={0.9} strokeLinecap="round" />
            <line x1={wx2svg(-36)+3} y1={wz2svg(-14)} x2={wx2svg(-36)+2} y2={wz2svg(-9)} stroke={water} strokeWidth={2} opacity={0.6} strokeLinecap="round" />

            {/* River */}
            <path d={RIVER_PATH} stroke={water} strokeWidth={8} fill="none" opacity={0.85} strokeLinecap="round" />
            {/* River shimmer */}
            <path d={RIVER_PATH} stroke="#7FC8E8" strokeWidth={2} fill="none" opacity={0.35} strokeLinecap="round" strokeDasharray="6 12" />

            {/* Bridge over river (near village center) */}
            <rect x={wx2svg(-3)} y={wz2svg(0.5)} width={wx2svg(3)-wx2svg(-3)} height={5} rx={2} fill={paths} opacity={0.9} />
            <line x1={wx2svg(-3)} y1={wz2svg(0.5)} x2={wx2svg(-3)} y2={wz2svg(0.5)+5} stroke="#8B6914" strokeWidth={2} />
            <line x1={wx2svg(3)}  y1={wz2svg(0.5)} x2={wx2svg(3)}  y2={wz2svg(0.5)+5} stroke="#8B6914" strokeWidth={2} />

            {/* Paths between buildings */}
            {[
              [0, 0, -22, -16],  // center → workshop
              [0, 0,  22, -16],  // center → dreamline
              [0, 0, -22,  16],  // center → trading post
              [0, 0,  22,  16],  // center → bank
              [0, 0, -34,   0],  // center → zen
              [0, 0,  30,   0],  // center → tribes
              [0, 0,   0, -28],  // center → wellness
              [0, 0,   0,  26],  // center → hut
            ].map(([x1, z1, x2, z2], i) => (
              <line key={i}
                x1={wx2svg(x1)} y1={wz2svg(z1)}
                x2={wx2svg(x2)} y2={wz2svg(z2)}
                stroke={paths} strokeWidth={2.5} opacity={0.6} strokeLinecap="round"
              />
            ))}

            {/* Sacred fire at center */}
            <circle cx={wx2svg(0)} cy={wz2svg(0)} r={4} fill="#FF6B2B" opacity={0.9} />
            <circle cx={wx2svg(0)} cy={wz2svg(0)} r={7} fill="none" stroke="#FF6B2B" strokeWidth={1} opacity={0.4} />

            {/* Buildings */}
            {MAP_BUILDINGS.filter(b => b.id !== 'spirit').map(b => {
              const bx = wx2svg(b.wx);
              const bz = wz2svg(b.wz);
              const isHov = hovered === b.id;
              const r = isHov ? 16 : 12;
              return (
                <g key={b.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => onNavigate(b.href)}
                  onMouseEnter={() => setHovered(b.id)}
                  onMouseLeave={() => setHovered(null)}
                >
                  {/* Glow when hovered */}
                  {isHov && <circle cx={bx} cy={bz} r={r + 8} fill={b.color} opacity={0.2} />}
                  {/* Building circle */}
                  <circle cx={bx} cy={bz} r={r} fill={b.color} opacity={isHov ? 1 : 0.85} />
                  {/* Icon */}
                  <text x={bx} y={bz + 1} textAnchor="middle" dominantBaseline="middle" fontSize={isHov ? 14 : 11}>
                    {b.icon}
                  </text>
                  {/* Label */}
                  <text x={bx} y={bz + r + 9} textAnchor="middle" fontSize={8} fill="white" fontWeight="600" opacity={0.9}>
                    {b.label}
                  </text>
                </g>
              );
            })}

            {/* Zen waterfall label */}
            <text x={wx2svg(-38)} y={wz2svg(-16)} textAnchor="middle" fontSize={7} fill="#7EC8E3" opacity={0.7}>
              Waterfall
            </text>
          </svg>
        </div>
      </div>

      {/* Hovered building detail */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="flex-shrink-0 mx-4 mb-4 p-4 rounded-2xl flex items-center gap-3"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            {(() => {
              const b = MAP_BUILDINGS.find(b => b.id === hovered);
              return b ? (
                <>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: b.color + '30' }}>
                    {b.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black text-white">{b.label}</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Tap to enter</p>
                  </div>
                  <button onClick={() => onNavigate(b.href)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white"
                    style={{ background: b.color }}>
                    Enter →
                  </button>
                </>
              ) : null;
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
