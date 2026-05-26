'use client';
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { useWeather, WEATHER_PALETTES } from '@/lib/theme/useWeather';

// ─── Village locations with illustrated positions ────────────────────────────
const LOCATIONS = [
  { id: 'workshop',     label: 'Workshop',     emoji: '🔨', href: '/village/workshop',     x: 22,  y: 28, color: '#E8770A', size: 'lg' },
  { id: 'dreamline',   label: 'Dream Line',   emoji: '✨', href: '/village/dreamline',    x: 72,  y: 25, color: '#7C3AED', size: 'lg' },
  { id: 'trading-post',label: 'Trading Post', emoji: '🏪', href: '/village/trading-post', x: 18,  y: 62, color: '#059669', size: 'md' },
  { id: 'bank',         label: 'Bank',         emoji: '🏦', href: '/village/bank',         x: 75,  y: 60, color: '#D97706', size: 'lg' },
  { id: 'zen',          label: 'Zen Space',    emoji: '🌿', href: '/village/zen',           x: 8,   y: 44, color: '#0D9488', size: 'md' },
  { id: 'tribes',       label: 'Tribes',       emoji: '👥', href: '/village/tribes',        x: 85,  y: 42, color: '#BE185D', size: 'md' },
  { id: 'hospital',     label: 'Hospital',     emoji: '🏥', href: '/village/hospital',      x: 48,  y: 15, color: '#16A34A', size: 'md' },
  { id: 'hut',          label: 'My Hut',       emoji: '🏠', href: '/village/hut',           x: 48,  y: 76, color: '#EA580C', size: 'sm' },
  { id: 'spirit',       label: 'Spirit',       emoji: '🌀', href: '/village/spirit',        x: 48,  y: 46, color: '#1877F2', size: 'lg' },
];

// ─── Building SVG components — culturally inspired architecture ───────────────

// West African round hut with thatched roof
function RoundHut({ x, y, color, scale = 1 }: { x: number; y: number; color: string; scale?: number }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      {/* Shadow */}
      <ellipse cx="0" cy="18" rx="22" ry="6" fill="rgba(0,0,0,0.12)" />
      {/* Walls — circular */}
      <ellipse cx="0" cy="8" rx="18" ry="16" fill="#F5ECD0" />
      <ellipse cx="0" cy="8" rx="18" ry="16" fill="none" stroke="#2D1600" strokeWidth="1.5" />
      {/* Kente pattern band */}
      <rect x="-18" y="4" width="36" height="5" fill={color} opacity="0.7" rx="0" />
      <rect x="-18" y="4" width="36" height="5" fill="none" stroke="#2D1600" strokeWidth="0.5" />
      {/* Thatched roof — layered cones */}
      <ellipse cx="0" cy="-4" rx="20" ry="8" fill="#8B6914" />
      <ellipse cx="0" cy="-10" rx="16" ry="6" fill="#A07A1A" />
      <ellipse cx="0" cy="-15" rx="11" ry="5" fill="#C49A1E" />
      <ellipse cx="0" cy="-19" rx="7" ry="4" fill="#D4A820" />
      {/* Roof tip */}
      <circle cx="0" cy="-22" r="2.5" fill={color} />
      {/* Door */}
      <ellipse cx="0" cy="16" rx="5" ry="8" fill="#2D1600" opacity="0.8" />
      {/* Window */}
      <circle cx="-10" cy="6" r="3" fill={color} opacity="0.6" />
      <circle cx="10" cy="6" r="3" fill={color} opacity="0.6" />
    </g>
  );
}

// Pyramid temple — Kemetic/Mayan inspired
function TempleBuilding({ x, y, color, scale = 1 }: { x: number; y: number; color: string; scale?: number }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <ellipse cx="0" cy="20" rx="28" ry="7" fill="rgba(0,0,0,0.12)" />
      {/* Base platform */}
      <rect x="-24" y="10" width="48" height="10" rx="2" fill="#C4A882" />
      <rect x="-24" y="10" width="48" height="10" rx="2" fill="none" stroke="#2D1600" strokeWidth="1" />
      {/* Main body */}
      <rect x="-18" y="-5" width="36" height="16" rx="2" fill="#F5ECD0" />
      <rect x="-18" y="-5" width="36" height="16" rx="2" fill="none" stroke="#2D1600" strokeWidth="1.2" />
      {/* Cultural stripe */}
      <rect x="-18" y="-2" width="36" height="4" fill={color} opacity="0.75" />
      <rect x="-18" y="-2" width="36" height="4" fill="none" stroke="#2D1600" strokeWidth="0.5" />
      {/* Pyramid roof — 4 faces */}
      <polygon points="0,-24 -20,-5 20,-5" fill={color} />
      <polygon points="0,-24 -20,-5 20,-5" fill="none" stroke="#2D1600" strokeWidth="1.5" />
      {/* Shading on pyramid */}
      <polygon points="0,-24 0,-5 20,-5" fill="rgba(0,0,0,0.15)" />
      {/* Spire */}
      <circle cx="0" cy="-25" r="3" fill="#FFD700" />
      {/* Door arch */}
      <rect x="-5" y="2" width="10" height="8" rx="5" fill="#2D1600" opacity="0.8" />
      {/* Adinkra symbols on building */}
      <text x="0" y="8" textAnchor="middle" fontSize="8" fill={color} opacity="0.6">✦</text>
    </g>
  );
}

// Market stall / Trading Post
function MarketStall({ x, y, color, scale = 1 }: { x: number; y: number; color: string; scale?: number }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <ellipse cx="0" cy="18" rx="26" ry="6" fill="rgba(0,0,0,0.1)" />
      {/* Main structure */}
      <rect x="-20" y="-5" width="40" height="20" rx="2" fill="#F5ECD0" />
      <rect x="-20" y="-5" width="40" height="20" rx="2" fill="none" stroke="#2D1600" strokeWidth="1.2" />
      {/* Kente awning */}
      <path d="M-22,-5 L22,-5 L18,-12 L-18,-12 Z" fill={color} />
      <path d="M-22,-5 L22,-5 L18,-12 L-18,-12 Z" fill="none" stroke="#2D1600" strokeWidth="1" />
      {/* Awning stripes */}
      {[-12,-6,0,6,12].map(sx => (
        <line key={sx} x1={sx} y1="-5" x2={sx + 2} y2="-12" stroke="#2D1600" strokeWidth="0.5" opacity="0.4" />
      ))}
      {/* Goods display */}
      <circle cx="-8" cy="8" r="5" fill={color} opacity="0.5" />
      <circle cx="8" cy="8" r="5" fill={color} opacity="0.4" />
      {/* Counter */}
      <rect x="-20" y="8" width="40" height="4" rx="1" fill="#C4A882" />
    </g>
  );
}

// Dome sanctuary — Zen / Hospital
function DomeSanctuary({ x, y, color, scale = 1 }: { x: number; y: number; color: string; scale?: number }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <ellipse cx="0" cy="18" rx="22" ry="6" fill="rgba(0,0,0,0.1)" />
      {/* Base */}
      <rect x="-16" y="4" width="32" height="14" rx="2" fill="#F0F9FF" />
      <rect x="-16" y="4" width="32" height="14" rx="2" fill="none" stroke="#2D1600" strokeWidth="1" />
      {/* Dome */}
      <path d="M-18,4 Q-18,-16 0,-20 Q18,-16 18,4 Z" fill={color} />
      <path d="M-18,4 Q-18,-16 0,-20 Q18,-16 18,4 Z" fill="none" stroke="#2D1600" strokeWidth="1.2" />
      {/* Dome shading */}
      <path d="M0,4 Q0,-16 18,4 Z" fill="rgba(0,0,0,0.12)" />
      {/* Lantern on top */}
      <circle cx="0" cy="-20" r="3.5" fill="#FFD700" />
      <circle cx="0" cy="-20" r="3.5" fill="none" stroke="#2D1600" strokeWidth="0.8" />
      {/* Cultural detail */}
      <circle cx="0" cy="-8" r="4" fill="rgba(255,255,255,0.2)" />
      {/* Door */}
      <path d="M-5,18 Q-5,8 0,7 Q5,8 5,18 Z" fill="#2D1600" opacity="0.7" />
    </g>
  );
}

// Sacred fire circle (center)
function SacredFire({ x, y, animated = true }: { x: number; y: number; animated?: boolean }) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setFrame(f => f + 1), 80);
    return () => clearInterval(i);
  }, []);

  const flameH = 14 + Math.sin(frame * 0.4) * 3;
  const flameW = 8 + Math.sin(frame * 0.6) * 2;

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Stone circle */}
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return <ellipse key={i} cx={Math.cos(a) * 14} cy={Math.sin(a) * 6} rx="4" ry="3" fill="#78716C" stroke="#2D1600" strokeWidth="0.5" />;
      })}
      {/* Ground disc */}
      <ellipse cx="0" cy="2" rx="10" ry="4" fill="#C4A882" />
      {/* Logs */}
      <line x1="-8" y1="2" x2="8" y2="2" stroke="#92400E" strokeWidth="3" strokeLinecap="round" />
      <line x1="-6" y1="0" x2="6" y2="4" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
      {/* Flame outer */}
      <ellipse cx="0" cy={-flameH / 2} rx={flameW / 2} ry={flameH / 2} fill="#FF6B2B" opacity="0.9" />
      {/* Flame inner */}
      <ellipse cx="0" cy={-flameH / 2 + 2} rx={flameW / 2 - 2} ry={flameH / 2 - 3} fill="#FFD700" opacity="0.85" />
      {/* Ember glow */}
      <ellipse cx="0" cy="0" rx="8" ry="3" fill="#FF6B2B" opacity="0.15" />
    </g>
  );
}

// Baobab tree — large, characterful
function BaobabTree({ x, y, scale = 1, flip = false }: { x: number; y: number; scale?: number; flip?: boolean }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${flip ? -scale : scale}, ${scale})`}>
      {/* Shadow */}
      <ellipse cx="5" cy="2" rx="12" ry="4" fill="rgba(0,0,0,0.08)" />
      {/* Trunk — wide baobab */}
      <path d="M-7,0 Q-9,-15 -5,-25 Q0,-28 5,-25 Q9,-15 7,0 Z" fill="#6B4226" />
      <path d="M-7,0 Q-9,-15 -5,-25 Q0,-28 5,-25 Q9,-15 7,0 Z" fill="none" stroke="#2D1600" strokeWidth="1" />
      {/* Root flare */}
      <path d="M-7,0 Q-14,2 -16,0 Q-12,-5 -7,0" fill="#6B4226" />
      <path d="M7,0 Q14,2 16,0 Q12,-5 7,0" fill="#6B4226" />
      {/* Main canopy */}
      <circle cx="-2" cy="-30" r="14" fill="#2D7D46" />
      <circle cx="-2" cy="-30" r="14" fill="none" stroke="#1A5C2E" strokeWidth="1" />
      {/* Side canopies */}
      <circle cx="-14" cy="-25" r="9" fill="#22C55E" />
      <circle cx="12" cy="-22" r="8" fill="#16A34A" />
      <circle cx="2" cy="-38" r="7" fill="#22C55E" />
      {/* Highlight */}
      <circle cx="-6" cy="-34" r="4" fill="#4ADE80" opacity="0.4" />
    </g>
  );
}

// Winding path between locations
function VillagePaths({ isNight }: { isNight: boolean }) {
  const pathColor = isNight ? '#4A3E2A' : '#C4A882';
  const pathStroke = isNight ? '#5A4E3A' : '#B8934A';
  return (
    <g opacity="0.8">
      {/* Paths radiating from center */}
      <path d="M 48,46 Q 35,38 22,32" stroke={pathColor} strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M 48,46 Q 60,36 72,30" stroke={pathColor} strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M 48,46 Q 48,30 48,20" stroke={pathColor} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M 48,46 Q 30,54 18,66" stroke={pathColor} strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M 48,46 Q 62,55 75,64" stroke={pathColor} strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M 48,46 Q 18,46 10,46" stroke={pathColor} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M 48,46 Q 70,46 85,46" stroke={pathColor} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M 48,46 Q 48,60 48,78" stroke={pathColor} strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Path borders */}
      <path d="M 48,46 Q 35,38 22,32" stroke={pathStroke} strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.3" />
    </g>
  );
}

// ─── Main Illustrated Map ─────────────────────────────────────────────────────
export default function VillageIllustration() {
  const router = useRouter();
  const { theme, toggle: toggleTheme } = useVillageTheme();
  const { mood, temp, city } = useWeather();
  const isNight = theme === 'night';
  const [hovered, setHovered] = useState<string | null>(null);
  const [cloudOffset, setCloudOffset] = useState(0);
  const [birdPos, setBirdPos] = useState({ x: -10, y: 15 });

  const palette = WEATHER_PALETTES[mood] ?? WEATHER_PALETTES.default;

  // Cloud drift animation
  useEffect(() => {
    const i = setInterval(() => {
      setCloudOffset(o => (o + 0.02) % 100);
      setBirdPos(p => ({ x: (p.x + 0.15) % 110, y: p.y + Math.sin(Date.now() / 1200) * 0.05 }));
    }, 50);
    return () => clearInterval(i);
  }, []);

  // Sky gradient based on time/weather
  const skyTop = isNight
    ? mood === 'stormy' ? '#0A0020' : '#080912'
    : mood === 'rainy' ? '#607080' : mood === 'golden' ? '#FF9A3C' : '#6AAEDC';
  const skyBot = isNight
    ? '#1A1A3A'
    : mood === 'rainy' ? '#8898AA' : mood === 'golden' ? '#FFD700' : '#C8E6FF';
  const groundColor = isNight ? '#1A2E1A' : '#3D7A3D';
  const groundDark  = isNight ? '#152814' : '#2D6030';

  const hovered_loc = hovered ? LOCATIONS.find(l => l.id === hovered) : null;

  function BuildingFor({ loc }: { loc: typeof LOCATIONS[0] }) {
    const s = loc.size === 'lg' ? 1.1 : loc.size === 'md' ? 0.9 : 0.75;
    if (['workshop', 'bank', 'hospital'].includes(loc.id)) return <TempleBuilding x={0} y={0} color={loc.color} scale={s} />;
    if (['dreamline', 'spirit'].includes(loc.id)) return <DomeSanctuary x={0} y={0} color={loc.color} scale={s} />;
    if (['zen', 'hospital'].includes(loc.id)) return <DomeSanctuary x={0} y={0} color={loc.color} scale={s} />;
    if (loc.id === 'trading-post') return <MarketStall x={0} y={0} color={loc.color} scale={s} />;
    return <RoundHut x={0} y={0} color={loc.color} scale={s} />;
  }

  return (
    <div className="w-full h-full relative overflow-hidden" style={{ background: skyTop }}>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full"
        style={{ position: 'absolute', inset: 0 }}
      >
        <defs>
          {/* Sky gradient */}
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={skyTop} />
            <stop offset="100%" stopColor={skyBot} />
          </linearGradient>
          {/* Ground gradient */}
          <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={groundColor} />
            <stop offset="100%" stopColor={groundDark} />
          </linearGradient>
          {/* Weather glow overlay */}
          <radialGradient id="weatherGlow" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor={palette.bgOverlay} stopOpacity="1" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Sky */}
        <rect x="0" y="0" width="100" height="55" fill="url(#skyGrad)" />

        {/* Weather glow */}
        <rect x="0" y="0" width="100" height="100" fill="url(#weatherGlow)" opacity="0.6" />

        {/* Stars (night) */}
        {isNight && [
          [15,8],[25,5],[38,10],[55,6],[65,9],[78,5],[88,8],[12,18],[30,15],[70,12],[85,16],
          [42,4],[58,11],[20,12],[50,18],[82,7]
        ].map(([sx, sy], i) => (
          <circle key={i} cx={sx} cy={sy} r="0.4" fill="#E8D5FF"
            opacity={0.4 + Math.sin(Date.now() / 1000 + i) * 0.3} />
        ))}

        {/* Sun or moon */}
        {isNight ? (
          <circle cx="80" cy="10" r="5" fill="#E8D5FF" opacity="0.9" />
        ) : (
          <circle cx="78" cy="10" r="6.5" fill="#FFD700" opacity="0.95" />
        )}

        {/* Clouds */}
        <g transform={`translate(${cloudOffset - 20}, 0)`} opacity={isNight ? 0.2 : 0.6}>
          <ellipse cx="20" cy="12" rx="12" ry="5" fill="white" />
          <ellipse cx="27" cy="10" rx="9" ry="5" fill="white" />
          <ellipse cx="14" cy="11" rx="7" ry="4" fill="white" />
        </g>
        <g transform={`translate(${(cloudOffset * 0.6) - 10}, 0)`} opacity={isNight ? 0.15 : 0.4}>
          <ellipse cx="60" cy="18" rx="10" ry="4" fill="white" />
          <ellipse cx="66" cy="16" rx="7" ry="4" fill="white" />
        </g>

        {/* Bird */}
        {!isNight && (
          <g transform={`translate(${birdPos.x}, ${birdPos.y})`} opacity="0.6">
            <path d="M0,0 Q-3,-2 -5,0" stroke="#2D1600" strokeWidth="0.6" fill="none" />
            <path d="M0,0 Q3,-2 5,0" stroke="#2D1600" strokeWidth="0.6" fill="none" />
          </g>
        )}

        {/* Rain (if rainy) */}
        {(mood === 'rainy' || mood === 'night_rain') && (
          Array.from({ length: 20 }).map((_, i) => (
            <line key={i}
              x1={((i * 5.3) + Date.now() / 100 * 0.5) % 105}
              y1={(i * 3.7 + Date.now() / 80) % 100}
              x2={((i * 5.3) + Date.now() / 100 * 0.5 + 1) % 105}
              y2={(i * 3.7 + Date.now() / 80 + 4) % 100}
              stroke="#BFDBFE" strokeWidth="0.4" opacity="0.5"
            />
          ))
        )}

        {/* Ground */}
        <path d="M0,52 Q20,48 40,50 Q60,52 80,50 Q90,49 100,51 L100,100 L0,100 Z" fill="url(#groundGrad)" />

        {/* Ground texture lines */}
        {[55,60,65,70,75,82,90].map((y, i) => (
          <path key={i} d={`M${i*8},${y} Q${20+i*8},${y-2} ${40+i*8},${y}`}
            stroke={isNight ? '#1A2E1A' : '#2D6030'} strokeWidth="0.3" fill="none" opacity="0.4" />
        ))}

        {/* Water pool near Zen */}
        <ellipse cx="12" cy="56" rx="6" ry="3" fill={isNight ? '#1E3A5A' : '#7EC8E3'} opacity="0.8" />
        <ellipse cx="12" cy="56" rx="6" ry="3" fill="none" stroke={isNight ? '#2A4A6A' : '#60B8D3'} strokeWidth="0.4" />
        {/* Water reflection shimmer */}
        <path d="M9,55 Q12,54 15,55" stroke="white" strokeWidth="0.5" fill="none" opacity="0.4" />

        {/* Paths */}
        <VillagePaths isNight={isNight} />

        {/* Sacred plaza circle */}
        <circle cx="48" cy="46" r="8" fill={isNight ? '#2D1F00' : '#C4A882'} opacity="0.5" />
        <circle cx="48" cy="46" r="8" fill="none" stroke={isNight ? '#4A3E2A' : '#A87C5A'} strokeWidth="0.5" />
        {/* Adinkra cross */}
        <line x1="48" y1="39" x2="48" y2="53" stroke={isNight ? '#5A4A2A' : '#8B6914'} strokeWidth="0.4" opacity="0.6" />
        <line x1="41" y1="46" x2="55" y2="46" stroke={isNight ? '#5A4A2A' : '#8B6914'} strokeWidth="0.4" opacity="0.6" />

        {/* Fire circle (center, on plaza) */}
        <SacredFire x={48} y={47} />

        {/* Trees — positioned around the village */}
        <BaobabTree x={5}  y={48} scale={0.5} />
        <BaobabTree x={92} y={50} scale={0.5} flip />
        <BaobabTree x={8}  y={65} scale={0.4} />
        <BaobabTree x={90} y={68} scale={0.4} flip />
        <BaobabTree x={20} y={78} scale={0.35} />
        <BaobabTree x={76} y={80} scale={0.35} flip />
        <BaobabTree x={48} y={88} scale={0.4} />
        <BaobabTree x={35} y={22} scale={0.3} />
        <BaobabTree x={62} y={20} scale={0.3} flip />

        {/* Buildings — positioned per location */}
        {LOCATIONS.filter(l => l.id !== 'spirit').map(loc => {
          const isHov = hovered === loc.id;
          return (
            <g key={loc.id}
              transform={`translate(${loc.x}, ${loc.y})`}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHovered(loc.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => router.push(loc.href)}
            >
              {/* Hover glow */}
              {isHov && (
                <circle cx="0" cy="5" r="18" fill={loc.color} opacity="0.12" />
              )}
              <BuildingFor loc={loc} />
              {/* Label */}
              <text x="0" y="28" textAnchor="middle" fontSize="3.2" fontWeight="bold"
                fill={isHov ? loc.color : (isNight ? '#F0EBE0' : '#1A0A00')}
                style={{ fontFamily: 'system-ui, sans-serif', letterSpacing: '0.02em' }}>
                {loc.label}
              </text>
            </g>
          );
        })}

        {/* Spirit center — glowing orb */}
        <g transform="translate(48, 46)" style={{ cursor: 'pointer' }}
          onClick={() => router.push('/village/spirit')}
          onMouseEnter={() => setHovered('spirit')}
          onMouseLeave={() => setHovered(null)}>
          <circle cx="0" cy="-8" r="5" fill="#1877F2" opacity="0.15" />
          <circle cx="0" cy="-8" r="3.5" fill="#1877F2" opacity="0.7" />
          <circle cx="0" cy="-8" r="3.5" fill="none" stroke="#60A5FA" strokeWidth="0.6" />
          <text x="0" y="-6" textAnchor="middle" fontSize="4" fill="white">🌀</text>
          {hovered === 'spirit' && (
            <text x="0" y="2" textAnchor="middle" fontSize="3" fill="#60A5FA" fontWeight="bold">Spirit</text>
          )}
        </g>

        {/* Fireflies (night) */}
        {isNight && [
          [30, 55], [65, 58], [20, 70], [75, 65], [45, 72], [82, 55], [15, 60]
        ].map(([fx, fy], i) => (
          <circle key={i} cx={fx + Math.sin(Date.now() / 800 + i) * 2} cy={fy + Math.cos(Date.now() / 600 + i) * 1.5}
            r="0.5" fill="#FFD700"
            opacity={0.4 + Math.sin(Date.now() / 500 + i * 0.8) * 0.4} />
        ))}

        {/* Halftone dots (Spider-Verse) */}
        {Array.from({ length: 80 }).map((_, i) => (
          <circle key={i}
            cx={(i % 10) * 11 + 3}
            cy={Math.floor(i / 10) * 11 + 52}
            r="0.3" fill="black" opacity="0.03" />
        ))}
      </svg>

      {/* Hover tooltip */}
      <AnimatePresence>
        {hovered_loc && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-28 left-1/2 -translate-x-1/2 pointer-events-none z-20"
            style={{
              background: isNight ? 'rgba(18,21,42,0.95)' : 'rgba(255,255,255,0.96)',
              border: `2px solid ${hovered_loc.color}`,
              borderRadius: '16px',
              padding: '8px 18px',
              boxShadow: `0 4px 24px ${hovered_loc.color}50`,
            }}>
            <p className="font-black text-sm" style={{ color: hovered_loc.color }}>
              {hovered_loc.emoji} {hovered_loc.label}
            </p>
            <p className="text-xs" style={{ color: isNight ? '#7A7FA8' : '#9CA3AF' }}>Tap to enter</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Weather badge */}
      {city && (
        <div className="absolute top-16 left-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
          style={{ background: isNight ? 'rgba(10,11,18,0.8)' : 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}>
          <span>{palette.emoji}</span>
          <span style={{ color: isNight ? '#F0EBE0' : '#1A0A00' }}>{temp !== null ? `${temp}°F` : ''} {city}</span>
        </div>
      )}
    </div>
  );
}
