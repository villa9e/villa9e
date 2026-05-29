'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { createClient } from '@/lib/supabase/client';

// ─── World bounds → SVG viewport ─────────────────────────────────────────────
const WX_MIN = -46, WX_MAX = 46;
const WZ_MIN = -46, WZ_MAX = 46;
const SVG_W  = 420;
const SVG_H  = 420;

function wx2svg(wx: number) { return ((wx - WX_MIN) / (WX_MAX - WX_MIN)) * SVG_W; }
function wz2svg(wz: number) { return ((wz - WZ_MIN) / (WZ_MAX - WZ_MIN)) * SVG_H; }

// Mugsum Hut — always permanent on map
const HUT = { id: 'hut', label: 'Mugsum Hut', icon: '🏠', href: '/village/hut', wx: 0, wz: 24, color: '#EA580C' };
const HUT_SVG = { x: wx2svg(HUT.wx), y: wz2svg(HUT.wz) };

// Mountain shapes
function Mountain({ x, y, size = 1 }: { x: number; y: number; size?: number }) {
  const s = size * 20;
  return (
    <g>
      <polygon points={`${x},${y} ${x - s},${y + s} ${x + s},${y + s}`} fill="#2D3748" opacity={0.65} />
      <polygon points={`${x},${y} ${x - s * 0.38},${y + s * 0.55} ${x + s * 0.38},${y + s * 0.55}`} fill="#E2E8F0" opacity={0.85} />
    </g>
  );
}

interface MapBuilding {
  id: string;
  label: string;
  linked_page: string | null;
  pos_x: number;
  pos_z: number;
  trail_enabled: boolean;
  trail_points: [number,number][];
}

export function VillageMap2D({ onNavigate }: { onNavigate: (href: string) => void }) {
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';
  const [hovered, setHovered]     = useState<string | null>(null);
  const [buildings, setBuildings] = useState<MapBuilding[]>([]);

  const bg    = isNight ? '#08100A' : '#162814';
  const ground = isNight ? '#0C160C' : '#1C341C';
  const water  = isNight ? '#0C2438' : '#1A4A6A';
  const pathC  = isNight ? '#2A1800' : '#4A3010';

  // Load live admin buildings from DB
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('admin_world_objects')
      .select('id,label,linked_page,pos_x,pos_z,trail_enabled,trail_points')
      .eq('is_live', true)
      .eq('is_building', true)
      .then(({ data }) => { if (data) setBuildings(data as MapBuilding[]); });
  }, []);

  // All map items = hut (permanent) + admin buildings
  const allBuildings = [
    { id: HUT.id, label: HUT.label, linked_page: HUT.href, pos_x: HUT.wx, pos_z: HUT.wz, trail_enabled: false, trail_points: [] as [number,number][] },
    ...buildings,
  ];

  // Color from label hash
  function labelColor(label: string): string {
    const palette = ['#E8770A','#7C3AED','#059669','#D97706','#0D9488','#BE185D','#16A34A','#6366F1','#1877F2','#DC2626'];
    let h = 0;
    for (let i = 0; i < label.length; i++) h = (h * 31 + label.charCodeAt(i)) % palette.length;
    return palette[Math.abs(h)];
  }

  // Moat — circular ring
  const moatR_inner = ((31.5 / (WX_MAX - WX_MIN)) * SVG_W);
  const moatR_outer = ((40.0 / (WX_MAX - WX_MIN)) * SVG_W);
  const cx = SVG_W / 2, cy = SVG_H / 2;

  return (
    <div className="w-full h-full flex flex-col" style={{ background: bg }}>
      {/* Title bar */}
      <div className="flex-shrink-0 px-4 py-3 flex items-center justify-between"
        style={{ borderBottom: `1px solid rgba(255,255,255,0.07)` }}>
        <div>
          <p className="text-sm font-black text-white">Village Map</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {allBuildings.length} buildings · tap to enter
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.25)' }}>
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-green-400 font-semibold">Live</span>
        </div>
      </div>

      {/* SVG Map */}
      <div className="flex-1 flex items-center justify-center p-3 min-h-0 overflow-hidden">
        <div className="w-full max-w-sm" style={{ aspectRatio: '1' }}>
          <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full h-full" style={{ borderRadius: 16 }}>
            {/* Background ground */}
            <rect width={SVG_W} height={SVG_H} fill={ground} />

            {/* Ocean ring around island */}
            <circle cx={cx} cy={cy} r={moatR_outer + 2} fill={water} opacity={0.4} />
            <circle cx={cx} cy={cy} r={moatR_outer} fill={ground} />

            {/* Island landmass */}
            <ellipse cx={cx} cy={cy} rx={moatR_inner - 2} ry={moatR_inner - 2} fill={ground} opacity={0.85} />

            {/* Forest ring border */}
            <circle cx={cx} cy={cy} r={moatR_inner - 2} fill="none"
              stroke={isNight ? '#0A2A0A' : '#1A4A1A'} strokeWidth={16} opacity={0.6} />

            {/* Moat water */}
            <path d={`
              M ${cx} ${cy - moatR_outer}
              A ${moatR_outer} ${moatR_outer} 0 1 1 ${cx - 0.01} ${cy - moatR_outer}
            `} fill="none" stroke={water} strokeWidth={moatR_outer - moatR_inner} opacity={0.7} />

            {/* 4 bridges over moat */}
            {[[0,-1],[0,1],[1,0],[-1,0]].map(([dx,dz],i) => {
              const bridgeLen = (moatR_outer - moatR_inner + 6);
              const midR = (moatR_inner + moatR_outer) / 2;
              return (
                <rect key={i}
                  x={cx + dx * midR - (dx === 0 ? 6 : bridgeLen/2)}
                  y={cy + dz * midR - (dz === 0 ? 6 : bridgeLen/2)}
                  width={dx === 0 ? 12 : bridgeLen}
                  height={dz === 0 ? 12 : bridgeLen}
                  fill={pathC} opacity={0.8} rx={2}
                />
              );
            })}

            {/* Mountains near west */}
            <Mountain x={wx2svg(-36)} y={wz2svg(-22)} size={1.1} />
            <Mountain x={wx2svg(-40)} y={wz2svg(-16)} size={0.75} />

            {/* Mountain waterfall */}
            <line x1={wx2svg(-36)} y1={wz2svg(-28)} x2={wx2svg(-36)} y2={wz2svg(-18)}
              stroke={water} strokeWidth={3} opacity={0.7} strokeLinecap="round" />
            <ellipse cx={wx2svg(-36)} cy={wz2svg(-18)} rx={5} ry={3} fill={water} opacity={0.7} />

            {/* Trails from Hut to each admin building */}
            {buildings
              .filter(b => b.trail_enabled)
              .map(b => (
                <line key={`trail-${b.id}`}
                  x1={HUT_SVG.x} y1={HUT_SVG.y}
                  x2={wx2svg(b.pos_x)} y2={wz2svg(b.pos_z)}
                  stroke={pathC} strokeWidth={2.5} opacity={0.55}
                  strokeLinecap="round" strokeDasharray="5,4"
                />
              ))}

            {/* Sacred fire at village center */}
            <circle cx={cx} cy={cy} r={5} fill="#FF6B2B" opacity={0.9} />
            <circle cx={cx} cy={cy} r={9} fill="none" stroke="#FF6B2B" strokeWidth={1.5} opacity={0.3} />

            {/* All buildings */}
            {allBuildings.map(b => {
              const bx  = wx2svg(b.pos_x);
              const bz  = wz2svg(b.pos_z);
              const col = b.id === 'hut' ? HUT.color : labelColor(b.label ?? 'building');
              const isH = hovered === b.id;
              const r   = isH ? 15 : 11;
              const icon = b.id === 'hut' ? '🏠' : '🏛️';
              return (
                <g key={b.id} style={{ cursor: b.linked_page ? 'pointer' : 'default' }}
                  onClick={() => b.linked_page && onNavigate(b.linked_page)}
                  onMouseEnter={() => setHovered(b.id)}
                  onMouseLeave={() => setHovered(null)}
                >
                  {isH && <circle cx={bx} cy={bz} r={r + 8} fill={col} opacity={0.18} />}
                  <circle cx={bx} cy={bz} r={r} fill={col} opacity={isH ? 1 : 0.85} />
                  <text x={bx} y={bz + 1} textAnchor="middle" dominantBaseline="middle" fontSize={isH ? 13 : 10}>
                    {icon}
                  </text>
                  <text x={bx} y={bz + r + 9} textAnchor="middle" fontSize={7}
                    fill="white" fontWeight="700" opacity={0.88}>
                    {(b.label ?? '').length > 12 ? (b.label ?? '').slice(0, 11) + '…' : (b.label ?? '')}
                  </text>
                </g>
              );
            })}

            {/* Island name */}
            <text x={cx} y={cy - moatR_outer - 12} textAnchor="middle" fontSize={9}
              fill="rgba(255,255,255,0.35)" fontStyle="italic">
              villa9e island
            </text>

            {/* Compass */}
            <text x={SVG_W - 18} y={18} textAnchor="middle" fontSize={10} fill="rgba(255,255,255,0.4)">N</text>
            <line x1={SVG_W - 18} y1={22} x2={SVG_W - 18} y2={34} stroke="rgba(255,255,255,0.25)" strokeWidth={1} />
          </svg>
        </div>
      </div>

      {/* Hovered building detail */}
      <AnimatePresence>
        {hovered && (() => {
          const b = allBuildings.find(x => x.id === hovered);
          if (!b) return null;
          const col = b.id === 'hut' ? HUT.color : labelColor(b.label ?? '');
          return (
            <motion.div
              key={hovered}
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 16, opacity: 0 }}
              className="flex-shrink-0 mx-4 mb-4 p-3.5 rounded-2xl flex items-center gap-3"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                style={{ background: col + '28' }}>
                {b.id === 'hut' ? '🏠' : '🏛️'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-white truncate">{b.label}</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {b.trail_enabled ? '⟵ trail from Hut' : 'Tap to enter'}
                </p>
              </div>
              {b.linked_page && (
                <button onClick={() => onNavigate(b.linked_page!)}
                  className="px-3 py-2 rounded-xl text-xs font-black text-white shrink-0"
                  style={{ background: col }}>
                  Enter →
                </button>
              )}
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
