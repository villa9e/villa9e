'use client';
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSkySystem } from '@/lib/world/useSkySystem';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';

// ─── Locations ────────────────────────────────────────────────────────────────
const LOCATIONS = [
  { id: 'workshop',     label: 'Workshop',     emoji: '🔨', href: '/village/workshop',     x: 22,  y: 32, color: '#E8770A', dark: '#C45E00' },
  { id: 'dreamline',   label: 'Dream Line',   emoji: '✨', href: '/village/dreamline',    x: 72,  y: 29, color: '#7C3AED', dark: '#5B21B6' },
  { id: 'trading-post',label: 'Trading Post', emoji: '🏪', href: '/village/trading-post', x: 18,  y: 65, color: '#059669', dark: '#047857' },
  { id: 'bank',         label: 'Bank',         emoji: '🏦', href: '/village/bank',         x: 76,  y: 63, color: '#D97706', dark: '#B45309' },
  { id: 'zen',          label: 'Zen Space',    emoji: '🌿', href: '/village/zen',           x: 8,   y: 47, color: '#0D9488', dark: '#0F766E' },
  { id: 'tribes',       label: 'Tribes',       emoji: '👥', href: '/village/tribes',        x: 86,  y: 44, color: '#BE185D', dark: '#9D174D' },
  { id: 'hospital',     label: 'Hospital',     emoji: '🏥', href: '/village/hospital',      x: 48,  y: 16, color: '#16A34A', dark: '#15803D' },
  { id: 'hut',          label: 'My Hut',       emoji: '🏠', href: '/village/hut',           x: 48,  y: 79, color: '#EA580C', dark: '#C2410C' },
  { id: 'spirit',       label: 'Spirit',       emoji: '🌀', href: '/village/spirit',        x: 48,  y: 47, color: '#1877F2', dark: '#1D4ED8' },
];

// ─── Cultural building SVGs ───────────────────────────────────────────────────
function PyramidBuilding({ x, y, color, dark, scale = 1, hover = false }:
  { x: number; y: number; color: string; dark: string; scale?: number; hover?: boolean }) {
  const s = scale * (hover ? 1.06 : 1);
  return (
    <g transform={`translate(${x},${y}) scale(${s}) translate(${-x},${-y})`}>
      {/* Foundation */}
      <ellipse cx={x} cy={y+24} rx={22} ry={6} fill="rgba(0,0,0,0.12)" />
      {/* Platform */}
      <rect x={x-18} y={y+12} width={36} height={12} rx={2} fill="#C4A882" stroke="#8B6914" strokeWidth="0.8" />
      {/* Cultural stripe on platform */}
      <rect x={x-18} y={y+15} width={36} height={4} fill={color} opacity="0.6" />
      {/* Main walls */}
      <rect x={x-14} y={y-6} width={28} height={19} rx={2} fill="#F5ECD0" stroke="#2D1600" strokeWidth="1.2" />
      {/* Kente band 1 */}
      <rect x={x-14} y={y+2} width={28} height={4} fill={color} stroke="#2D1600" strokeWidth="0.5" />
      {/* Kente band 2 */}
      <rect x={x-14} y={y+7} width={28} height={2} fill={dark} opacity="0.6" />
      {/* Adinkra symbol */}
      <circle cx={x} cy={y-2} r={4} fill="none" stroke={color} strokeWidth="1.2" opacity="0.5" />
      <line x1={x-4} y1={y-2} x2={x+4} y2={y-2} stroke={color} strokeWidth="0.8" opacity="0.5" />
      <line x1={x} y1={y-6} x2={x} y2={y+2} stroke={color} strokeWidth="0.8" opacity="0.5" />
      {/* Pyramid roof */}
      <polygon points={`${x},${y-22} ${x-16},${y-6} ${x+16},${y-6}`} fill={color} stroke="#2D1600" strokeWidth="1.2" />
      {/* Roof shading */}
      <polygon points={`${x},${y-22} ${x},${y-6} ${x+16},${y-6}`} fill="rgba(0,0,0,0.15)" />
      {/* Gold spire */}
      <circle cx={x} cy={y-23} r={3} fill="#FFD700" stroke="#2D1600" strokeWidth="0.8" />
      {/* Door */}
      <path d={`M ${x-4} ${y+12} Q ${x-4} ${y+6} ${x} ${y+5} Q ${x+4} ${y+6} ${x+4} ${y+12} Z`} fill="#2D1600" opacity="0.75" />
      {/* Windows */}
      <rect x={x-11} y={y} width={5} height={4} rx={1} fill={color} opacity="0.5" />
      <rect x={x+6}  y={y} width={5} height={4} rx={1} fill={color} opacity="0.5" />
      {/* Hover outline glow */}
      {hover && <rect x={x-16} y={y-8} width={32} height={22} rx={3} fill="none" stroke={color} strokeWidth="2" opacity="0.5" />}
    </g>
  );
}

function DomeBuilding({ x, y, color, dark, scale = 1, hover = false }:
  { x: number; y: number; color: string; dark: string; scale?: number; hover?: boolean }) {
  const s = scale * (hover ? 1.06 : 1);
  return (
    <g transform={`translate(${x},${y}) scale(${s}) translate(${-x},${-y})`}>
      <ellipse cx={x} cy={y+22} rx={18} ry={5} fill="rgba(0,0,0,0.1)" />
      <rect x={x-13} y={y+6} width={26} height={16} rx={2} fill="#F0F9FF" stroke="#2D1600" strokeWidth="1" />
      <rect x={x-13} y={y+10} width={26} height={4} fill={color} opacity="0.6" />
      {/* Dome */}
      <path d={`M ${x-16} ${y+6} Q ${x-18} ${y-10} ${x} ${y-16} Q ${x+18} ${y-10} ${x+16} ${y+6} Z`}
        fill={color} stroke="#2D1600" strokeWidth="1.2" />
      {/* Dome shading */}
      <path d={`M ${x} ${y+6} Q ${x} ${y-16} ${x+16} ${y+6} Z`} fill="rgba(0,0,0,0.12)" />
      {/* Lantern */}
      <circle cx={x} cy={y-17} r={4} fill="#FFD700" stroke="#2D1600" strokeWidth="0.8" />
      {/* Geometric pattern on dome */}
      <circle cx={x} cy={y-6} r={5} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
      <path d={`M ${x-4} ${y+12} Q ${x-4} ${y+8} ${x} ${y+7} Q ${x+4} ${y+8} ${x+4} ${y+12} Z`} fill="#2D1600" opacity="0.7" />
      {hover && <ellipse cx={x} cy={y+14} rx={16} ry={14} fill="none" stroke={color} strokeWidth="1.5" opacity="0.4" />}
    </g>
  );
}

function MarketBuilding({ x, y, color, dark, scale = 1, hover = false }:
  { x: number; y: number; color: string; dark: string; scale?: number; hover?: boolean }) {
  const s = scale * (hover ? 1.06 : 1);
  return (
    <g transform={`translate(${x},${y}) scale(${s}) translate(${-x},${-y})`}>
      <ellipse cx={x} cy={y+20} rx={22} ry={5} fill="rgba(0,0,0,0.1)" />
      <rect x={x-16} y={y} width={32} height={18} rx={2} fill="#F5ECD0" stroke="#2D1600" strokeWidth="1" />
      {/* Goods on display */}
      <circle cx={x-7} cy={y+10} r={5} fill={color} opacity="0.4" />
      <circle cx={x+7} cy={y+10} r={5} fill={dark} opacity="0.4" />
      {/* Counter */}
      <rect x={x-16} y={y+10} width={32} height={4} rx={1} fill="#C4A882" />
      {/* Kente awning */}
      <polygon points={`${x-18},${y} ${x+18},${y} ${x+14},${y-10} ${x-14},${y-10}`} fill={color} stroke="#2D1600" strokeWidth="1" />
      {/* Awning stripes */}
      {[-10,-4,2,8,14].map((sx, i) => (
        <line key={i} x1={x+sx} y1={y} x2={x+sx+2} y2={y-10} stroke="#2D1600" strokeWidth="0.6" opacity="0.4" />
      ))}
      <circle cx={x-13} cy={y-10} r={1.5} fill="#FFD700" />
      <circle cx={x+13} cy={y-10} r={1.5} fill="#FFD700" />
      {hover && <rect x={x-18} y={y-12} width={36} height={32} rx={3} fill="none" stroke={color} strokeWidth="1.5" opacity="0.5" />}
    </g>
  );
}

function RoundHut({ x, y, color, dark, scale = 1, hover = false }:
  { x: number; y: number; color: string; dark: string; scale?: number; hover?: boolean }) {
  const s = scale * (hover ? 1.06 : 1);
  return (
    <g transform={`translate(${x},${y}) scale(${s}) translate(${-x},${-y})`}>
      <ellipse cx={x} cy={y+20} rx={16} ry={5} fill="rgba(0,0,0,0.1)" />
      {/* Round walls */}
      <ellipse cx={x} cy={y+6} rx={14} ry={14} fill="#F5ECD0" stroke="#2D1600" strokeWidth="1.2" />
      <ellipse cx={x} cy={y+6} rx={14} ry={14} fill="none" stroke="#2D1600" strokeWidth="1.2" />
      {/* Kente band */}
      <ellipse cx={x} cy={y+4} rx={14} ry={4} fill={color} opacity="0.6" />
      {/* Layered thatched roof */}
      <ellipse cx={x} cy={y-3} rx={16} ry={6} fill="#8B6914" stroke="#2D1600" strokeWidth="0.8" />
      <ellipse cx={x} cy={y-8} rx={13} ry={5} fill="#A07A1A" stroke="#2D1600" strokeWidth="0.6" />
      <ellipse cx={x} cy={y-12} rx={9}  ry={4} fill="#C49A1E" stroke="#2D1600" strokeWidth="0.5" />
      <ellipse cx={x} cy={y-15} rx={5}  ry={3} fill="#D4A820" />
      {/* Roof finial */}
      <circle cx={x} cy={y-18} r={3} fill={color} stroke="#2D1600" strokeWidth="0.8" />
      {/* Door */}
      <ellipse cx={x} cy={y+17} rx={4} ry={6} fill="#2D1600" opacity="0.75" />
      {/* Windows */}
      <circle cx={x-8} cy={y+4} r={2.5} fill={color} opacity="0.5" stroke="#2D1600" strokeWidth="0.5" />
      <circle cx={x+8} cy={y+4} r={2.5} fill={color} opacity="0.5" stroke="#2D1600" strokeWidth="0.5" />
    </g>
  );
}

function SpiritOrb({ x, y, color, hover = false, frame = 0 }:
  { x: number; y: number; color: string; hover?: boolean; frame?: number }) {
  const pulse = 1 + Math.sin(frame * 0.05) * 0.08;
  const glow  = 0.15 + Math.sin(frame * 0.07) * 0.08;
  return (
    <g>
      {/* Outer glow */}
      <circle cx={x} cy={y} r={12 * pulse} fill={color} opacity={glow} />
      {/* Inner orb */}
      <circle cx={x} cy={y} r={8}  fill={color} opacity="0.85" stroke="#1D4ED8" strokeWidth="1" />
      {/* Core */}
      <circle cx={x} cy={y} r={4.5} fill="#60A5FA" opacity="0.9" />
      {/* Rotating ring */}
      <ellipse cx={x} cy={y} rx={8} ry={3}
        fill="none" stroke="#93C5FD" strokeWidth="1"
        transform={`rotate(${frame * 2}, ${x}, ${y})`} opacity="0.6" />
      {/* Label */}
      <text x={x} y={y + 18} textAnchor="middle" fontSize="4.5" fontWeight="bold"
        fill={hover ? color : '#1877F2'} style={{ fontFamily: 'system-ui' }}>
        Spirit
      </text>
    </g>
  );
}

// ─── River SVG path ───────────────────────────────────────────────────────────
function River({ isNight, frame, skyState }: { isNight: boolean; frame: number; skyState: any }) {
  const waterBase = isNight ? '#1E3A5A' : '#4BA3D4';
  const waterShimmer = isNight ? '#2A4A6A' : '#7EC8E3';
  const reflectColor = skyState ? skyState.skyHor : (isNight ? '#2A4A8A' : '#87CEEB');

  // River winds from top-left to bottom-right across the map
  const riverPath = 'M 5,8 C 10,12 12,18 15,22 C 18,26 16,32 14,36 C 12,40 10,44 12,50 C 14,56 18,60 22,65 C 26,70 28,78 30,85';
  const riverWidth = 4;

  // Shimmer lines animate with frame
  const shimmerOffset = (frame * 0.8) % 20;

  return (
    <g>
      {/* River bed — slightly darker water */}
      <path d={riverPath} fill="none" stroke={waterBase} strokeWidth={riverWidth + 2} strokeLinecap="round" />

      {/* River water */}
      <path d={riverPath} fill="none" stroke={waterBase} strokeWidth={riverWidth} strokeLinecap="round" opacity="0.9" />

      {/* Sky reflection in water */}
      <path d={riverPath} fill="none" stroke={reflectColor} strokeWidth={riverWidth * 0.6} strokeLinecap="round" opacity="0.3" />

      {/* Animated shimmer lines */}
      {[0, 8, 16].map((offset, i) => (
        <path key={i} d={riverPath} fill="none"
          stroke={waterShimmer} strokeWidth="1.5" strokeLinecap="round"
          strokeDasharray={`3 ${8 + i * 4}`}
          strokeDashoffset={shimmerOffset + offset}
          opacity={0.35 + Math.sin(frame * 0.04 + i) * 0.15} />
      ))}

      {/* River banks — slightly lighter edges */}
      <path d={riverPath} fill="none" stroke="#C4A882" strokeWidth={riverWidth + 4} strokeLinecap="round" opacity="0.2" />

      {/* River mouth glow at golden hour */}
      {skyState && (skyState.phase === 'golden' || skyState.phase === 'sunset') && (
        <path d={riverPath} fill="none" stroke="#FFD700" strokeWidth={riverWidth}
          strokeLinecap="round" opacity="0.25" />
      )}
    </g>
  );
}

// ─── Baobab tree ──────────────────────────────────────────────────────────────
function BaobabTree({ x, y, scale = 1, flip = false, frame = 0, isNight = false }:
  { x: number; y: number; scale?: number; flip?: boolean; frame?: number; isNight?: boolean }) {
  const sway = Math.sin(frame * 0.02 + x * 0.3) * 1.5;
  const leafColor = isNight ? '#1A2E1A' : '#2D7D46';
  const leafLight = isNight ? '#1F3520' : '#22C55E';
  return (
    <g transform={`translate(${x},${y}) scale(${flip ? -scale : scale},${scale})`}>
      <ellipse cx={6} cy={2} rx={12} ry={4} fill="rgba(0,0,0,0.08)" />
      {/* Trunk */}
      <path d="M -5,0 Q -7,-12 -4,-20 Q 0,-23 4,-20 Q 7,-12 5,0 Z" fill="#6B4226" stroke="#2D1600" strokeWidth="0.8" />
      <path d="-7,0 Q -12,2 -14,0 Q -10,-4 -7,0 M 7,0 Q 12,2 14,0 Q 10,-4 7,0" fill="#6B4226" />
      {/* Main canopy — animated sway */}
      <g transform={`rotate(${sway},0,-24)`}>
        <circle cx={-2} cy={-28} r={12} fill={leafColor} stroke="#1A5C2E" strokeWidth="0.8" />
        <circle cx={-12} cy={-24} r={8} fill={leafLight} stroke="#1A5C2E" strokeWidth="0.6" />
        <circle cx={10}  cy={-22} r={7} fill={leafColor} stroke="#1A5C2E" strokeWidth="0.6" />
        <circle cx={2}   cy={-36} r={6} fill={leafLight} />
        {/* Highlight */}
        <circle cx={-5}  cy={-31} r={3} fill="#4ADE80" opacity={isNight ? 0.15 : 0.35} />
      </g>
    </g>
  );
}

// ─── Sacred fire ──────────────────────────────────────────────────────────────
function SacredFire({ x, y, frame }: { x: number; y: number; frame: number }) {
  const fh = 9 + Math.sin(frame * 0.18) * 2.5;
  const fw = 5 + Math.sin(frame * 0.15) * 1.2;
  const opacity = 0.85 + Math.sin(frame * 0.12) * 0.1;
  return (
    <g>
      {/* Glow */}
      <circle cx={x} cy={y} r={16} fill="#FF6B2B" opacity="0.06" />
      {/* Stone ring */}
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return <ellipse key={i} cx={x + Math.cos(a) * 8} cy={y + Math.sin(a) * 3.5}
          rx={2} ry={1.5} fill="#78716C" stroke="#2D1600" strokeWidth="0.3" />;
      })}
      {/* Ground circle */}
      <ellipse cx={x} cy={y} rx={6} ry={2.5} fill="#C4A882" />
      {/* Logs */}
      <line x1={x-5} y1={y} x2={x+5} y2={y} stroke="#92400E" strokeWidth="2.5" strokeLinecap="round" />
      <line x1={x-4} y1={y-1} x2={x+4} y2={y+1} stroke="#78350F" strokeWidth="2" strokeLinecap="round" />
      {/* Outer flame */}
      <ellipse cx={x} cy={y - fh/2} rx={fw/2} ry={fh/2} fill="#FF6B2B" opacity={opacity} />
      {/* Inner flame */}
      <ellipse cx={x} cy={y - fh/2 + 2} rx={fw/2 - 1.5} ry={fh/2 - 2} fill="#FFD700" opacity={opacity * 0.9} />
      {/* Embers */}
      {frame % 20 < 10 && <circle cx={x + Math.sin(frame * 0.3) * 3} cy={y - fh - 2} r={0.8} fill="#FF6B2B" opacity="0.6" />}
      {frame % 15 < 8  && <circle cx={x - Math.sin(frame * 0.4) * 4} cy={y - fh}     r={0.6} fill="#FFD700" opacity="0.5" />}
    </g>
  );
}

// ─── Particles ────────────────────────────────────────────────────────────────
function Fireflies({ count = 12, frame, isNight }: { count?: number; frame: number; isNight: boolean }) {
  if (!isNight) return null;
  return (
    <g>
      {Array.from({ length: count }).map((_, i) => {
        const bx = 10 + ((i * 7.3) % 80);
        const by = 45 + Math.sin(frame * 0.025 + i) * 12;
        const opacity = 0.3 + Math.sin(frame * 0.08 + i * 0.8) * 0.4;
        return <circle key={i} cx={bx + Math.sin(frame * 0.04 + i * 1.2) * 3} cy={by} r={0.7} fill="#FFD700" opacity={Math.max(0, opacity)} />;
      })}
    </g>
  );
}

function Birds({ frame, isNight }: { frame: number; isNight: boolean }) {
  if (isNight) return null;
  const bx = (frame * 0.12) % 110 - 5;
  const by = 12 + Math.sin(frame * 0.03) * 3;
  return (
    <g opacity="0.5" transform={`translate(${bx},${by})`}>
      <path d="M0,0 Q-3,-2 -5,0" stroke="#2D1600" strokeWidth="0.7" fill="none" strokeLinecap="round" />
      <path d="M0,0 Q3,-2 5,0"   stroke="#2D1600" strokeWidth="0.7" fill="none" strokeLinecap="round" />
      <path d="M8,1 Q5,-1 3,1"   stroke="#2D1600" strokeWidth="0.6" fill="none" strokeLinecap="round" />
      <path d="M8,1 Q11,-1 13,1" stroke="#2D1600" strokeWidth="0.6" fill="none" strokeLinecap="round" />
    </g>
  );
}

function Stars({ frame }: { frame: number }) {
  return (
    <g>
      {[
        [15,6],[28,4],[42,8],[58,5],[68,8],[80,4],[90,7],[12,16],[35,13],[72,11],[88,14],
        [50,3],[62,10],[22,11],[54,17],[84,6],[16,8],[44,15],[76,9],
      ].map(([sx, sy], i) => (
        <circle key={i} cx={sx} cy={sy} r={0.5 + (i % 3) * 0.2}
          fill={i % 4 === 0 ? '#E8D5FF' : '#FFFFFF'}
          opacity={Math.max(0, 0.3 + Math.sin(frame * 0.03 + i) * 0.4)} />
      ))}
      {/* Constellations */}
      <g opacity="0.25" stroke="#E8D5FF" strokeWidth="0.3">
        <line x1="15" y1="6" x2="28" y2="4" />
        <line x1="28" y1="4" x2="42" y2="8" />
        <line x1="58" y1="5" x2="68" y2="8" />
        <line x1="68" y1="8" x2="80" y2="4" />
      </g>
    </g>
  );
}

function Moon({ frame }: { frame: number }) {
  const glow = 0.08 + Math.sin(frame * 0.02) * 0.04;
  return (
    <g>
      <circle cx={82} cy={9} r={8} fill="#E8D5FF" opacity={0.08 + glow} />
      <circle cx={82} cy={9} r={5.5} fill="#F0E8FF" opacity="0.9" />
      <circle cx={84} cy={7} r={4} fill="#0A0B18" />
    </g>
  );
}

function Sun({ azimuth, altitude, skyState }: { azimuth: number; altitude: number; skyState: any }) {
  // Map sun position to SVG coordinates
  // azimuth 0-360 (N=0, E=90, S=180, W=270) → SVG x 0-100
  // altitude 0-90 → SVG y from horizon down to 0
  const svgX = ((azimuth - 60) / 260) * 100;
  const svgY = Math.max(2, 45 - (altitude / 90) * 42);

  if (altitude < -6) return null; // Below twilight

  const isRising = azimuth < 180;
  const phase = skyState?.phase;
  const isGolden = phase === 'golden' || phase === 'golden_am' || phase === 'sunrise' || phase === 'sunset';

  const sunR = isGolden ? 6 : 5;
  const glowR = isGolden ? 18 : 12;
  const sunColor = altitude < 5 ? '#FF6B35' : isGolden ? '#FFD700' : '#FFF8DC';
  const glowColor = altitude < 5 ? '#FF4500' : isGolden ? '#FFB347' : '#FFE87C';

  return (
    <g>
      {/* Sun halo */}
      <circle cx={svgX} cy={svgY} r={glowR} fill={glowColor} opacity="0.12" />
      {/* Sun rays (golden hour) */}
      {isGolden && Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        return (
          <line key={i}
            x1={svgX + Math.cos(angle) * (sunR + 2)}
            y1={svgY + Math.sin(angle) * (sunR + 2)}
            x2={svgX + Math.cos(angle) * (sunR + 8)}
            y2={svgY + Math.sin(angle) * (sunR + 8)}
            stroke={glowColor} strokeWidth="1.2" opacity="0.4" />
        );
      })}
      {/* Sun disk */}
      <circle cx={svgX} cy={svgY} r={sunR} fill={sunColor} />
      {/* Light scattering on horizon */}
      {altitude < 10 && (
        <>
          <line x1={svgX} y1={svgY} x2={svgX > 50 ? 100 : 0} y2={45} stroke={glowColor} strokeWidth="0.5" opacity="0.15" />
          <ellipse cx={svgX} cy={45} rx={isRising ? 30 : 40} ry={4} fill={glowColor} opacity="0.12" />
        </>
      )}
    </g>
  );
}

// ─── Main Illustrated Map ──────────────────────────────────────────────────────
export default function VillageIllustration() {
  const router  = useRouter();
  const { theme } = useVillageTheme();
  const { skyState, coords } = useSkySystem();
  const [hovered, setHovered] = useState<string | null>(null);
  const [frame, setFrame]     = useState(0);
  const isNight = theme === 'night';

  // Derive sky from system or theme
  const effectiveSky = skyState ?? {
    phase: isNight ? 'night' : 'morning',
    skyTop: isNight ? '#0D1235' : '#4A90D9',  // was #08091A — now visible navy
    skyMid: isNight ? '#1E2348' : '#87CEEB',  // was #1A1A3A
    skyHor: isNight ? '#162040' : '#C8E6FF',  // was #0A0B28
    sunColor: isNight ? '#E8D5FF' : '#FFF8DC',
    ambientColor: isNight ? '#1A0A30' : '#FFFBF0',
    ambientIntensity: isNight ? 0.45 : 0.8,  // brighter night ambient
    hasFog: false, fogColor: '#ccc', fogDensity: 0,
    sunAltitude: isNight ? -20 : 45,
    sunAzimuth: isNight ? 0 : 180,
  };

  const isEffectiveNight = effectiveSky.phase === 'night' || effectiveSky.phase === 'dusk' || effectiveSky.phase === 'dawn';
  const groundColor = isEffectiveNight ? '#1A2E1A' : '#3D7A3D';
  const groundDark  = isEffectiveNight ? '#152814' : '#2D6030';
  const pathColor   = isEffectiveNight ? '#4A3E2A' : '#C4A882';

  // Animation loop
  useEffect(() => {
    const id = setInterval(() => setFrame(f => f + 1), 60);
    return () => clearInterval(id);
  }, []);

  const hovered_loc = hovered ? LOCATIONS.find(l => l.id === hovered) : null;

  function getBuildingComponent(loc: typeof LOCATIONS[0]) {
    const props = { x: loc.x, y: loc.y, color: loc.color, dark: loc.dark, hover: hovered === loc.id };
    if (['dreamline','zen','hospital'].includes(loc.id)) return <DomeBuilding key={loc.id} {...props} />;
    if (loc.id === 'trading-post')                       return <MarketBuilding key={loc.id} {...props} />;
    if (loc.id === 'hut')                                return <RoundHut key={loc.id} {...props} />;
    return <PyramidBuilding key={loc.id} {...props} />;
  }

  return (
    <div className="w-full h-full relative overflow-hidden select-none">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full"
        style={{ position: 'absolute', inset: 0 }}
      >
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={effectiveSky.skyTop} />
            <stop offset="50%"  stopColor={effectiveSky.skyMid} />
            <stop offset="100%" stopColor={effectiveSky.skyHor} />
          </linearGradient>
          <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={groundColor} />
            <stop offset="100%" stopColor={groundDark} />
          </linearGradient>
          {/* Golden hour god rays */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="0.8" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          {/* Fog effect */}
          {effectiveSky.hasFog && (
            <filter id="fog">
              <feGaussianBlur stdDeviation="1.5" />
            </filter>
          )}
          <radialGradient id="weatherGlow" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor={effectiveSky.skyHor} stopOpacity="0.15" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Sky */}
        <rect x="0" y="0" width="100" height="52" fill="url(#skyGrad)" />

        {/* Stars (night/dusk/dawn) */}
        {isEffectiveNight && <Stars frame={frame} />}
        {isEffectiveNight && <Moon frame={frame} />}

        {/* Sun (day) */}
        {!isEffectiveNight && (
          <Sun azimuth={effectiveSky.sunAzimuth} altitude={effectiveSky.sunAltitude} skyState={effectiveSky} />
        )}

        {/* Weather ambient glow */}
        <rect x="0" y="0" width="100" height="100" fill="url(#weatherGlow)" />

        {/* Clouds */}
        {!isEffectiveNight && (
          <g opacity="0.55" transform={`translate(${Math.sin(frame * 0.008) * 3},0)`}>
            <ellipse cx="22" cy="11" rx="10" ry="4.5" fill="white" />
            <ellipse cx="29" cy="9"  rx="8"  ry="4.5" fill="white" />
            <ellipse cx="16" cy="10" rx="6"  ry="3.5" fill="white" />
          </g>
        )}
        {!isEffectiveNight && (
          <g opacity="0.35" transform={`translate(${Math.cos(frame * 0.006) * 2},0)`}>
            <ellipse cx="68" cy="16" rx="8" ry="3.5" fill="white" />
            <ellipse cx="74" cy="14" rx="6" ry="3.5" fill="white" />
          </g>
        )}

        {/* Birds */}
        <Birds frame={frame} isNight={isEffectiveNight} />

        {/* Ground */}
        <path d="M0,50 Q25,47 50,49 Q75,51 100,49 L100,100 L0,100 Z" fill="url(#groundGrad)" />

        {/* Ground detail lines */}
        {[55,62,70,79,88].map((yy, i) => (
          <path key={i} d={`M${i*15},${yy} Q${20+i*15},${yy-2} ${40+i*15},${yy}`}
            stroke={isEffectiveNight ? '#1A2E1A' : '#2D6030'} strokeWidth="0.25" fill="none" opacity="0.4" />
        ))}

        {/* ── RIVER ── winding from top-left through the village */}
        <River isNight={isEffectiveNight} frame={frame} skyState={effectiveSky} />

        {/* Paths from center to each building */}
        {LOCATIONS.filter(l => l.id !== 'spirit').map(loc => {
          const angle = Math.atan2(loc.y - 47, loc.x - 48);
          const dist  = Math.sqrt((loc.x-48)**2 + (loc.y-47)**2);
          return (
            <line key={loc.id}
              x1={48 + Math.cos(angle) * 3}
              y1={47 + Math.sin(angle) * 3}
              x2={loc.x - Math.cos(angle) * 5}
              y2={loc.y - Math.sin(angle) * 5}
              stroke={pathColor} strokeWidth="1.2" strokeLinecap="round" />
          );
        })}

        {/* Sacred plaza */}
        <circle cx={48} cy={47} r={6} fill={pathColor} opacity="0.5" />
        <circle cx={48} cy={47} r={6} fill="none" stroke={isEffectiveNight ? '#5A4A2A' : '#A87C5A'} strokeWidth="0.6" />
        {/* Adinkra cross */}
        {[0, Math.PI/4, Math.PI/2, Math.PI*3/4].map((a, i) => (
          <line key={i} x1={48 + Math.cos(a)*1} y1={47 + Math.sin(a)*1}
            x2={48 + Math.cos(a)*5} y2={47 + Math.sin(a)*5}
            stroke={isEffectiveNight ? '#5A4A2A' : '#8B6914'} strokeWidth="0.4" opacity="0.6" />
        ))}

        {/* Water features */}
        {/* Pond near Zen */}
        <ellipse cx={9} cy={57} rx={5} ry={2.5} fill={isEffectiveNight ? '#1E3A5A' : '#7EC8E3'} opacity="0.85" />
        <path d="M7,56 Q9,55 11,56" stroke="white" strokeWidth="0.4" fill="none" opacity="0.4" />
        {/* River pool at bottom of river */}
        <ellipse cx={31} cy={88} rx={4} ry={2} fill={isEffectiveNight ? '#1E3A5A' : '#7EC8E3'} opacity="0.7" />

        {/* Golden hour light shafts */}
        {(effectiveSky.phase === 'golden' || effectiveSky.phase === 'sunset' || effectiveSky.phase === 'sunrise') && (
          <g opacity="0.06" filter="url(#glow)">
            {[30,48,65,78].map((lx, i) => (
              <polygon key={i} points={`${lx},0 ${lx+6},0 ${lx+20},100 ${lx+14},100`} fill="#FFD700" />
            ))}
          </g>
        )}

        {/* Trees — positioned artfully around the village */}
        {([
          [5,  52, 0.52, false],[7,  61, 0.44, true], [4,  70, 0.40, false],
          [92, 52, 0.50, true], [94, 63, 0.42, false],[91, 73, 0.38, true],
          [25, 88, 0.38, false],[38, 91, 0.35, true], [55, 90, 0.38, false],[68, 89, 0.36, true],
          [28, 14, 0.30, false],[42, 11, 0.28, true], [62, 12, 0.30, false],
        ] as [number, number, number, boolean][]).map(([tx, ty, sc, fl], i) => (
          <BaobabTree key={i} x={tx} y={ty} scale={sc} flip={fl} frame={frame} isNight={isEffectiveNight} />
        ))}

        {/* Sacred fire at center */}
        <SacredFire x={48} y={49} frame={frame} />

        {/* Buildings */}
        {LOCATIONS.filter(l => l.id !== 'spirit').map(loc => (
          <g key={loc.id} style={{ cursor: 'pointer' }}
            onMouseEnter={() => setHovered(loc.id)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => router.push(loc.href)}>
            {getBuildingComponent(loc)}
          </g>
        ))}

        {/* Spirit orb at center */}
        <g style={{ cursor: 'pointer' }}
          onMouseEnter={() => setHovered('spirit')}
          onMouseLeave={() => setHovered(null)}
          onClick={() => router.push('/village/spirit')}>
          <SpiritOrb x={48} y={43} color="#1877F2" hover={hovered === 'spirit'} frame={frame} />
        </g>

        {/* Fireflies */}
        <Fireflies count={isEffectiveNight ? 18 : 6} frame={frame} isNight={isEffectiveNight} />

        {/* Fog (dawn/dusk) */}
        {effectiveSky.hasFog && (
          <rect x="0" y="40" width="100" height="30" fill="white" opacity="0.04" filter="url(#fog)" />
        )}

        {/* Halftone dots — Spider-Verse signature */}
        {Array.from({ length: 90 }).map((_, i) => (
          <circle key={i} cx={(i % 10) * 11 + 3} cy={Math.floor(i / 10) * 7 + 52}
            r="0.28" fill="black" opacity="0.025" />
        ))}
      </svg>

      {/* Building hover tooltip */}
      <AnimatePresence>
        {hovered_loc && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 pointer-events-none z-20"
            style={{
              background: isEffectiveNight ? 'rgba(18,21,42,0.95)' : 'rgba(255,255,255,0.96)',
              border: `2px solid ${hovered_loc.color}`,
              borderRadius: '16px',
              padding: '8px 18px',
              boxShadow: `0 4px 24px ${hovered_loc.color}50`,
            }}>
            <p className="font-black text-sm" style={{ color: hovered_loc.color }}>
              {hovered_loc.emoji} {hovered_loc.label}
            </p>
            <p className="text-xs" style={{ color: isEffectiveNight ? '#7A7FA8' : '#9CA3AF' }}>Tap to enter</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sky info badge */}
      {skyState && (
        <div className="absolute top-14 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
          style={{ background: isEffectiveNight ? 'rgba(10,11,18,0.8)' : 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}>
          <span>{skyState.phase === 'sunrise' ? '🌅' : skyState.phase === 'sunset' ? '🌇' : skyState.phase === 'golden' ? '🌆' : skyState.phase === 'night' ? '🌙' : '☀️'}</span>
          <span style={{ color: isEffectiveNight ? '#F0EBE0' : '#1A0A00', fontWeight: 600 }}>
            {skyState.phase.replace('_', ' ')}
            {coords && ` · ${Math.round(skyState.sunAltitude)}° alt`}
          </span>
        </div>
      )}
    </div>
  );
}
