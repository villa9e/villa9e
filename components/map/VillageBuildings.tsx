'use client';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ── Shared primitive helpers ───────────────────────────────────────────────

function Column({
  pos, h = 3, r = 0.12, sides = 28, color = '#E8DCC8', capColor,
}: { pos: [number,number,number]; h?: number; r?: number; sides?: number; color?: string; capColor?: string }) {
  const cap = capColor ?? color;
  return (
    <group position={pos}>
      {/* Shaft */}
      <mesh castShadow>
        <cylinderGeometry args={[r * 0.9, r, h, sides, 3]} />
        <meshToonMaterial color={color} />
      </mesh>
      {/* Capital */}
      <mesh position={[0, h / 2 + 0.08, 0]} castShadow>
        <cylinderGeometry args={[r * 1.5, r * 0.9, 0.18, sides]} />
        <meshToonMaterial color={cap} />
      </mesh>
      {/* Base */}
      <mesh position={[0, -h / 2 - 0.06, 0]}>
        <cylinderGeometry args={[r * 1.4, r * 1.4, 0.12, sides]} />
        <meshToonMaterial color={cap} />
      </mesh>
    </group>
  );
}

function Arch({
  pos, w = 1.2, h = 1.8, depth = 0.3, color = '#C4A882', sides = 28,
}: { pos: [number,number,number]; w?: number; h?: number; depth?: number; color?: string; sides?: number }) {
  const r = w / 2;
  return (
    <group position={pos}>
      {/* Left pier */}
      <mesh position={[-r - depth / 2, 0, 0]} castShadow>
        <boxGeometry args={[depth, h, depth * 2]} />
        <meshToonMaterial color={color} />
      </mesh>
      {/* Right pier */}
      <mesh position={[r + depth / 2, 0, 0]} castShadow>
        <boxGeometry args={[depth, h, depth * 2]} />
        <meshToonMaterial color={color} />
      </mesh>
      {/* Semi-circular arch */}
      <mesh position={[0, h / 2, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[r, depth / 2, 16, sides, Math.PI]} />
        <meshToonMaterial color={color} />
      </mesh>
    </group>
  );
}

function Steps({
  pos, w = 2.5, d = 0.4, count = 4, color = '#C8B89A',
}: { pos: [number,number,number]; w?: number; d?: number; count?: number; color?: string }) {
  return (
    <group position={pos}>
      {Array.from({ length: count }).map((_, i) => (
        <mesh key={i} position={[0, i * 0.14 - (count * 0.14) / 2, -i * d + (count * d) / 2]} castShadow>
          <boxGeometry args={[w - i * 0.15, 0.14, d]} />
          <meshToonMaterial color={color} />
        </mesh>
      ))}
    </group>
  );
}

function PagoTier({
  pos, w, h, eave, color, roofColor, sides = 24,
}: { pos: [number,number,number]; w: number; h: number; eave: number; color: string; roofColor: string; sides?: number }) {
  return (
    <group position={pos}>
      <mesh castShadow>
        <boxGeometry args={[w, h, w, 2, 2, 2]} />
        <meshToonMaterial color={color} />
      </mesh>
      {/* Upturned eave roof — two pyramids flipped at edge */}
      <mesh position={[0, h / 2 + 0.35, 0]} castShadow>
        <coneGeometry args={[w / 2 + eave, 0.7, sides]} />
        <meshToonMaterial color={roofColor} />
      </mesh>
      {/* Eave shadow band */}
      <mesh position={[0, h / 2 + 0.02, 0]}>
        <cylinderGeometry args={[w / 2 + eave + 0.05, w / 2 + eave + 0.05, 0.08, sides]} />
        <meshToonMaterial color="#2D1A00" />
      </mesh>
    </group>
  );
}

function Window({
  pos, w = 0.55, h = 0.75, frameColor = '#5A3A1A', glassColor = '#A8C8FF',
}: { pos: [number,number,number]; w?: number; h?: number; frameColor?: string; glassColor?: string }) {
  return (
    <group position={pos}>
      <mesh castShadow>
        <boxGeometry args={[w + 0.08, h + 0.08, 0.06]} />
        <meshToonMaterial color={frameColor} />
      </mesh>
      <mesh position={[0, 0, 0.04]}>
        <boxGeometry args={[w, h, 0.04]} />
        <meshToonMaterial color={glassColor} transparent opacity={0.6} />
      </mesh>
      {/* Mullion cross */}
      <mesh position={[0, 0, 0.07]}>
        <boxGeometry args={[0.04, h, 0.02]} />
        <meshToonMaterial color={frameColor} />
      </mesh>
      <mesh position={[0, 0, 0.07]}>
        <boxGeometry args={[w, 0.04, 0.02]} />
        <meshToonMaterial color={frameColor} />
      </mesh>
    </group>
  );
}

// ── WORKSHOP — Japanese machiya × Industrial forge ─────────────────────────
// ~3,800 triangles
export function WorkshopBuilding({ hover }: { hover: boolean }) {
  const y = hover ? 0.2 : 0;
  return (
    <group position={[0, y, 0]}>
      {/* Main hall — exposed timber frame */}
      <mesh castShadow>
        <boxGeometry args={[3.8, 3.6, 3, 3, 4, 3]} />
        <meshToonMaterial color="#3D2B1A" />
      </mesh>
      {/* Plaster infill panels */}
      {[[-1.2, 0, 1.52], [0, 0, 1.52], [1.2, 0, 1.52],
        [-1.2, 0, -1.52],[0, 0, -1.52], [1.2, 0, -1.52]].map((p, i) => (
        <mesh key={i} position={p as [number,number,number]} castShadow>
          <boxGeometry args={[0.9, 2.8, 0.08]} />
          <meshToonMaterial color="#F0E8D0" />
        </mesh>
      ))}
      {/* Overhanging eave roof — low pitch Japanese style */}
      <mesh position={[0, 2.1, 0]} castShadow>
        <boxGeometry args={[4.6, 0.18, 3.8, 4, 1, 3]} />
        <meshToonMaterial color="#2D1A00" />
      </mesh>
      {/* Pitched roof sections */}
      <mesh position={[-0.6, 2.6, 0]} rotation={[0, 0, Math.PI / 6]} castShadow>
        <boxGeometry args={[2.4, 0.15, 3.8, 3, 1, 3]} />
        <meshToonMaterial color="#5A3520" />
      </mesh>
      <mesh position={[0.6, 2.6, 0]} rotation={[0, 0, -Math.PI / 6]} castShadow>
        <boxGeometry args={[2.4, 0.15, 3.8, 3, 1, 3]} />
        <meshToonMaterial color="#5A3520" />
      </mesh>
      {/* Ridge beam */}
      <mesh position={[0, 3.15, 0]} castShadow>
        <boxGeometry args={[0.2, 0.15, 3.9]} />
        <meshToonMaterial color="#2D1A00" />
      </mesh>
      {/* Chimney */}
      <mesh position={[1.4, 3.6, 0.5]} castShadow>
        <boxGeometry args={[0.4, 1.8, 0.4, 2, 3, 2]} />
        <meshToonMaterial color="#5A3520" />
      </mesh>
      <mesh position={[1.4, 4.55, 0.5]}>
        <cylinderGeometry args={[0.28, 0.32, 0.3, 24]} />
        <meshToonMaterial color="#2D1A00" />
      </mesh>
      {/* Forge doors — sliding shoji */}
      <mesh position={[0, -0.6, 1.56]} castShadow>
        <boxGeometry args={[1.6, 2.0, 0.1, 4, 6, 1]} />
        <meshToonMaterial color="#6B4226" />
      </mesh>
      {/* Windows */}
      <Window pos={[-1.3, 0.5, 1.56]} />
      <Window pos={[1.3, 0.5, 1.56]} />
      <Window pos={[-1.3, 0.5, -1.56]} />
      <Window pos={[1.3, 0.5, -1.56]} />
      {/* Gear decoration */}
      <mesh position={[0, 2.0, 1.6]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.4, 0.08, 14, 32]} />
        <meshToonMaterial color="#E8770A" />
      </mesh>
      {/* Workbench outside */}
      <mesh position={[0, -1.4, 1.9]} castShadow>
        <boxGeometry args={[2, 0.12, 0.7]} />
        <meshToonMaterial color="#6B4226" />
      </mesh>
      <mesh position={[-0.85, -1.85, 1.9]}>
        <cylinderGeometry args={[0.05, 0.05, 0.9, 14]} />
        <meshToonMaterial color="#4A2C1A" />
      </mesh>
      <mesh position={[0.85, -1.85, 1.9]}>
        <cylinderGeometry args={[0.05, 0.05, 0.9, 14]} />
        <meshToonMaterial color="#4A2C1A" />
      </mesh>
      {/* Ground foundation */}
      <mesh position={[0, -1.9, 0]}>
        <boxGeometry args={[4.2, 0.2, 3.4]} />
        <meshToonMaterial color="#5A3520" />
      </mesh>
    </group>
  );
}

// ── DREAM LINE — Greek amphitheater × Palaver tree ─────────────────────────
// ~4,200 triangles
export function DreamLineBuilding({ hover }: { hover: boolean }) {
  const y = hover ? 0.2 : 0;
  return (
    <group position={[0, y, 0]}>
      {/* Tiered seating — 4 semicircular tiers */}
      {[0, 1, 2, 3].map(tier => (
        <mesh key={tier} position={[0, -1.5 + tier * 0.45, 0]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[1.5 + tier * 0.55, 1.5 + tier * 0.55 + 0.5, 0.42, 40, 2, false, 0, Math.PI]} />
          <meshToonMaterial color={tier % 2 === 0 ? '#C8B89A' : '#B8A88A'} />
        </mesh>
      ))}
      {/* Central stage platform */}
      <mesh position={[0, -1.56, -0.8]} castShadow>
        <cylinderGeometry args={[1.3, 1.3, 0.35, 40]} />
        <meshToonMaterial color="#E8DCC8" />
      </mesh>
      {/* Skene building — backdrop */}
      <mesh position={[0, 0.2, -2.1]} castShadow>
        <boxGeometry args={[4, 2.8, 0.6, 4, 4, 1]} />
        <meshToonMaterial color="#D4C4A0" />
      </mesh>
      {/* Skene pediment */}
      <mesh position={[0, 1.7, -2.1]} castShadow>
        <coneGeometry args={[2.4, 0.9, 4]} />
        <meshToonMaterial color="#C4A882" />
      </mesh>
      {/* Front colonnade — 5 columns */}
      {[-1.6, -0.8, 0, 0.8, 1.6].map((x, i) => (
        <Column key={i} pos={[x, -0.4, -1.7]} h={2.4} r={0.14} sides={24} color="#E8DCC8" capColor="#C4A882" />
      ))}
      {/* Entablature beam */}
      <mesh position={[0, 0.85, -1.72]} castShadow>
        <boxGeometry args={[3.8, 0.22, 0.3, 4, 1, 1]} />
        <meshToonMaterial color="#C4A882" />
      </mesh>
      {/* Stage decorations — two torches */}
      {[-0.6, 0.6].map((x, i) => (
        <group key={i} position={[x, -0.9, -0.5]}>
          <mesh><cylinderGeometry args={[0.06, 0.04, 1.2, 18]} /><meshToonMaterial color="#6B4226" /></mesh>
          <mesh position={[0, 0.7, 0]}><sphereGeometry args={[0.12, 16, 12]} /><meshToonMaterial color="#FF6B2B" /></mesh>
        </group>
      ))}
      {/* Acanthus leaf decoration row */}
      {[-1.4, -0.7, 0, 0.7, 1.4].map((x, i) => (
        <mesh key={i} position={[x, 0.95, -2.12]}>
          <boxGeometry args={[0.28, 0.32, 0.1, 2, 3, 1]} />
          <meshToonMaterial color="#A8986A" />
        </mesh>
      ))}
    </group>
  );
}

// ── TRADING POST — Moroccan souk × Yoruba market ───────────────────────────
// ~5,100 triangles
export function TradingPostBuilding({ hover }: { hover: boolean }) {
  const y = hover ? 0.2 : 0;
  return (
    <group position={[0, y, 0]}>
      {/* Main market hall */}
      <mesh castShadow>
        <boxGeometry args={[4, 2.8, 2.8, 4, 3, 3]} />
        <meshToonMaterial color="#C8956C" />
      </mesh>
      {/* Decorative plasterwork facade panels */}
      {[[-1.2, 0.3, 1.42], [0, 0.3, 1.42], [1.2, 0.3, 1.42]].map((p, i) => (
        <mesh key={i} position={p as [number,number,number]}>
          <boxGeometry args={[0.85, 1.6, 0.08, 3, 5, 1]} />
          <meshToonMaterial color="#E8C89A" />
        </mesh>
      ))}
      {/* Arcade arches — front colonnade */}
      <Arch pos={[-1.2, -0.4, 1.5]} w={0.9} h={1.8} color="#D4A87A" />
      <Arch pos={[0,   -0.4, 1.5]} w={0.9} h={1.8} color="#D4A87A" />
      <Arch pos={[1.2, -0.4, 1.5]} w={0.9} h={1.8} color="#D4A87A" />
      {/* Flat roof with parapet */}
      <mesh position={[0, 1.45, 0]} castShadow>
        <boxGeometry args={[4.3, 0.2, 3.1, 4, 1, 3]} />
        <meshToonMaterial color="#B8855C" />
      </mesh>
      {/* Parapet battlements */}
      {[-1.5, -0.75, 0, 0.75, 1.5].map((x, i) => (
        <mesh key={i} position={[x, 1.75, 1.55]}>
          <boxGeometry args={[0.35, 0.5, 0.22]} />
          <meshToonMaterial color="#C8956C" />
        </mesh>
      ))}
      {/* Minaret-style corner tower */}
      <mesh position={[-1.9, 1.0, -1.3]} castShadow>
        <cylinderGeometry args={[0.22, 0.28, 3.5, 24, 4]} />
        <meshToonMaterial color="#D4A87A" />
      </mesh>
      <mesh position={[-1.9, 2.85, -1.3]}>
        <coneGeometry args={[0.3, 0.7, 22]} />
        <meshToonMaterial color="#059669" />
      </mesh>
      {/* Market stalls — lean-to structures */}
      {[[-1.4, 1.8], [0, 1.8], [1.4, 1.8]].map(([x, z], i) => (
        <group key={i} position={[x, -1.1, z]}>
          <mesh><boxGeometry args={[1.1, 0.1, 0.8]} /><meshToonMaterial color={['#FF6B2B','#1877F2','#FFD700'][i]} /></mesh>
          <mesh position={[0, 0.35, -0.4]}><boxGeometry args={[1.1, 0.6, 0.06]} /><meshToonMaterial color="#6B4226" /></mesh>
        </group>
      ))}
      {/* Decorative Adire cloth hanging */}
      {[-1.0, 0.4].map((x, i) => (
        <mesh key={i} position={[x, -0.1, 1.7]}>
          <boxGeometry args={[0.6, 1.2, 0.02, 2, 4, 1]} />
          <meshToonMaterial color={i === 0 ? '#7C3AED' : '#D97706'} transparent opacity={0.85} />
        </mesh>
      ))}
      <Steps pos={[0, -1.85, 2.2]} w={3} count={3} color="#C8956C" />
    </group>
  );
}

// ── BANK — Nubian pyramid treasury × Neo-Classical columns ─────────────────
// ~6,200 triangles
export function BankBuilding({ hover }: { hover: boolean }) {
  const y = hover ? 0.2 : 0;
  return (
    <group position={[0, y, 0]}>
      {/* Grand base platform */}
      <mesh position={[0, -1.7, 0]} castShadow>
        <boxGeometry args={[4.5, 0.4, 3.8, 5, 1, 4]} />
        <meshToonMaterial color="#B8A882" />
      </mesh>
      {/* Rusticated lower story */}
      <mesh position={[0, -0.8, 0]} castShadow>
        <boxGeometry args={[4, 1.8, 3.2, 4, 4, 3]} />
        <meshToonMaterial color="#D4C4A0" />
      </mesh>
      {/* Piano nobile — upper story */}
      <mesh position={[0, 0.65, 0]} castShadow>
        <boxGeometry args={[3.8, 1.6, 3, 4, 3, 3]} />
        <meshToonMaterial color="#E8DCC8" />
      </mesh>
      {/* Nubian pyramid crowning feature */}
      <mesh position={[0, 1.65, 0]} castShadow>
        <coneGeometry args={[2.0, 2.2, 4, 8]} />
        <meshToonMaterial color="#D97706" />
      </mesh>
      {/* Gold capstone */}
      <mesh position={[0, 2.76, 0]}>
        <octahedronGeometry args={[0.22]} />
        <meshToonMaterial color="#FFD700" />
      </mesh>
      {/* 6 Doric columns across facade */}
      {[-1.5, -0.9, -0.3, 0.3, 0.9, 1.5].map((x, i) => (
        <Column key={i} pos={[x, -0.6, 1.55]} h={2.6} r={0.16} sides={26} color="#E8DCC8" capColor="#C4A882" />
      ))}
      {/* Entablature */}
      <mesh position={[0, 0.75, 1.56]} castShadow>
        <boxGeometry args={[3.8, 0.28, 0.32, 5, 1, 1]} />
        <meshToonMaterial color="#C4A882" />
      </mesh>
      {/* Triglyphs */}
      {[-1.3, -0.65, 0, 0.65, 1.3].map((x, i) => (
        <mesh key={i} position={[x, 0.78, 1.72]}>
          <boxGeometry args={[0.2, 0.24, 0.04, 2, 3, 1]} />
          <meshToonMaterial color="#A89870" />
        </mesh>
      ))}
      {/* Grand entrance doors — heavy, imposing */}
      <mesh position={[0, -0.5, 1.55]} castShadow>
        <boxGeometry args={[1.1, 2.0, 0.1, 3, 5, 1]} />
        <meshToonMaterial color="#4A2C0A" />
      </mesh>
      {/* Door hardware */}
      <mesh position={[0.35, -0.5, 1.62]}><sphereGeometry args={[0.07, 16, 12]} /><meshToonMaterial color="#FFD700" /></mesh>
      <mesh position={[-0.35, -0.5, 1.62]}><sphereGeometry args={[0.07, 16, 12]} /><meshToonMaterial color="#FFD700" /></mesh>
      {/* Windows — upper floor */}
      <Window pos={[-1.2, 0.65, 1.52]} h={0.9} frameColor="#4A2C0A" />
      <Window pos={[1.2, 0.65, 1.52]} h={0.9} frameColor="#4A2C0A" />
      <Steps pos={[0, -1.52, 2.1]} w={4} count={5} color="#C8B89A" />
    </group>
  );
}

// ── ZEN SPACE — 3-tier Japanese pagoda × Zen garden ───────────────────────
// ~5,400 triangles
export function ZenBuilding({ hover }: { hover: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(state => {
    if (ref.current) ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.03;
  });
  const y = hover ? 0.2 : 0;
  return (
    <group position={[0, y, 0]} ref={ref}>
      {/* Stone base platform */}
      <mesh position={[0, -1.7, 0]}>
        <cylinderGeometry args={[2.2, 2.5, 0.4, 16]} />
        <meshToonMaterial color="#8A8070" />
      </mesh>
      {/* First tier — widest */}
      <PagoTier pos={[0, -1.1, 0]} w={2.6} h={1.1} eave={0.55} color="#C89878" roofColor="#2D5A1A" />
      {/* Second tier */}
      <PagoTier pos={[0, 0.35, 0]}  w={1.9} h={0.9} eave={0.42} color="#B88868" roofColor="#2D5A1A" />
      {/* Third tier — smallest */}
      <PagoTier pos={[0, 1.55, 0]}  w={1.3} h={0.75} eave={0.32} color="#A87858" roofColor="#2D5A1A" />
      {/* Finial spire — sorin */}
      <mesh position={[0, 2.35, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.08, 1.2, 20, 3]} />
        <meshToonMaterial color="#C4A832" />
      </mesh>
      {[0.25, 0.55, 0.85].map((y2, i) => (
        <mesh key={i} position={[0, 2.35 + y2 * 0.3, 0]}>
          <torusGeometry args={[0.12 - i * 0.02, 0.04, 12, 24]} />
          <meshToonMaterial color="#FFD700" />
        </mesh>
      ))}
      {/* Torii gate entrance */}
      <group position={[0, -1.2, 2.2]}>
        <mesh position={[-0.6, 0, 0]} castShadow><cylinderGeometry args={[0.07, 0.07, 2.2, 20, 3]} /><meshToonMaterial color="#CC3300" /></mesh>
        <mesh position={[0.6, 0, 0]} castShadow><cylinderGeometry args={[0.07, 0.07, 2.2, 20, 3]} /><meshToonMaterial color="#CC3300" /></mesh>
        <mesh position={[0, 0.9, 0]}><boxGeometry args={[1.6, 0.12, 0.12, 3, 1, 1]} /><meshToonMaterial color="#CC3300" /></mesh>
        <mesh position={[0, 0.65, 0]}><boxGeometry args={[1.4, 0.1, 0.1, 3, 1, 1]} /><meshToonMaterial color="#CC3300" /></mesh>
      </group>
      {/* Stone lanterns */}
      {[[-1.4, -1.5, 1.6], [1.4, -1.5, 1.6]].map((p, i) => (
        <group key={i} position={p as [number,number,number]}>
          <mesh><cylinderGeometry args={[0.12, 0.18, 0.8, 20, 3]} /><meshToonMaterial color="#8A8070" /></mesh>
          <mesh position={[0, 0.55, 0]}><boxGeometry args={[0.32, 0.35, 0.32, 2, 2, 2]} /><meshToonMaterial color="#7A7060" /></mesh>
          <mesh position={[0, 0.8, 0]}><coneGeometry args={[0.22, 0.3, 20]} /><meshToonMaterial color="#5A5048" /></mesh>
        </group>
      ))}
      {/* Raked gravel garden rings */}
      {[1.4, 1.7, 2.0].map((r2, i) => (
        <mesh key={i} position={[0, -1.88, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[r2, r2 + 0.06, 56]} />
          <meshToonMaterial color="#C8B89A" />
        </mesh>
      ))}
    </group>
  );
}

// ── TRIBES — Zulu great indlu × Mesoamerican council ring ─────────────────
// ~4,800 triangles
export function TribesBuilding({ hover }: { hover: boolean }) {
  const y = hover ? 0.2 : 0;
  return (
    <group position={[0, y, 0]}>
      {/* Main round great hall */}
      <mesh castShadow>
        <cylinderGeometry args={[1.8, 2.0, 2.8, 36, 5]} />
        <meshToonMaterial color="#C89858" />
      </mesh>
      {/* Thatched conical roof — multi-layer */}
      <mesh position={[0, 1.7, 0]} castShadow>
        <coneGeometry args={[2.3, 0.6, 36, 3]} />
        <meshToonMaterial color="#8B6914" />
      </mesh>
      <mesh position={[0, 2.1, 0]} castShadow>
        <coneGeometry args={[1.9, 0.6, 36, 3]} />
        <meshToonMaterial color="#7A5A0A" />
      </mesh>
      <mesh position={[0, 2.48, 0]} castShadow>
        <coneGeometry args={[1.4, 0.8, 36, 3]} />
        <meshToonMaterial color="#6B4A00" />
      </mesh>
      <mesh position={[0, 2.9, 0]} castShadow>
        <coneGeometry args={[0.8, 0.7, 36, 3]} />
        <meshToonMaterial color="#5A3A00" />
      </mesh>
      {/* Roof finial */}
      <mesh position={[0, 3.3, 0]}><sphereGeometry args={[0.12, 18, 14]} /><meshToonMaterial color="#FFD700" /></mesh>
      {/* Ceremonial entrance porch */}
      <mesh position={[0, -0.2, 1.95]} castShadow>
        <boxGeometry args={[1.2, 2.4, 0.6, 2, 4, 1]} />
        <meshToonMaterial color="#A87840" />
      </mesh>
      {/* Totem poles flanking entrance */}
      {[-0.8, 0.8].map((x, i) => (
        <group key={i} position={[x, 0.2, 2.15]}>
          <mesh castShadow><cylinderGeometry args={[0.12, 0.14, 3.2, 20, 5]} /><meshToonMaterial color="#6B4226" /></mesh>
          <mesh position={[0, 1.3, 0]}><boxGeometry args={[0.35, 0.35, 0.35, 2, 2, 2]} /><meshToonMaterial color="#BE185D" /></mesh>
          <mesh position={[0, 1.6, 0]}><sphereGeometry args={[0.2, 16, 12]} /><meshToonMaterial color="#7C3AED" /></mesh>
        </group>
      ))}
      {/* Ring of 6 smaller satellite structures */}
      {Array.from({ length: 6 }).map((_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <group key={i} position={[Math.cos(a) * 2.8, -1.1, Math.sin(a) * 2.8]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.35, 0.4, 0.9, 22, 3]} />
              <meshToonMaterial color="#A87840" />
            </mesh>
            <mesh position={[0, 0.6, 0]} castShadow>
              <coneGeometry args={[0.5, 0.6, 22, 3]} />
              <meshToonMaterial color="#7A5A0A" />
            </mesh>
          </group>
        );
      })}
      {/* Kente band decoration */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[2.01, 2.01, 0.5, 40, 1, true]} />
        <meshToonMaterial color="#BE185D" />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[2.01, 2.01, 0.15, 40, 1, true]} />
        <meshToonMaterial color="#FFD700" />
      </mesh>
    </group>
  );
}

// ── HOSPITAL — Scandinavian pavilion × Red Crescent warmth ────────────────
// ~4,600 triangles
export function HospitalBuilding({ hover }: { hover: boolean }) {
  const y = hover ? 0.2 : 0;
  return (
    <group position={[0, y, 0]}>
      {/* Main building — clean white with warm accents */}
      <mesh castShadow>
        <boxGeometry args={[4, 3.2, 2.8, 4, 4, 3]} />
        <meshToonMaterial color="#F0F8F0" />
      </mesh>
      {/* Green roof — living roof effect */}
      <mesh position={[0, 1.7, 0]} castShadow>
        <boxGeometry args={[4.3, 0.35, 3.1, 4, 1, 3]} />
        <meshToonMaterial color="#2D7A3D" />
      </mesh>
      {/* Roof raised central section with skylights */}
      <mesh position={[0, 2.15, 0]} castShadow>
        <boxGeometry args={[2.8, 0.8, 2.2, 3, 2, 2]} />
        <meshToonMaterial color="#E8F4E8" />
      </mesh>
      {/* Glass curtain wall — front facade panels */}
      {[[-1.3, 0, 1.42], [0, 0, 1.42], [1.3, 0, 1.42]].map((p, i) => (
        <mesh key={i} position={p as [number,number,number]}>
          <boxGeometry args={[1.1, 2.6, 0.08, 2, 4, 1]} />
          <meshToonMaterial color="#A8E4FF" transparent opacity={0.65} />
        </mesh>
      ))}
      {/* Red cross emblem — prominent on facade */}
      <mesh position={[0, 0.8, 1.45]}>
        <boxGeometry args={[0.22, 1.0, 0.06]} />
        <meshToonMaterial color="#DC2626" />
      </mesh>
      <mesh position={[0, 0.8, 1.45]}>
        <boxGeometry args={[1.0, 0.22, 0.06]} />
        <meshToonMaterial color="#DC2626" />
      </mesh>
      {/* Accessible ramp entrance */}
      <mesh position={[0, -1.3, 2.1]} rotation={[0.18, 0, 0]} castShadow>
        <boxGeometry args={[2.2, 0.12, 1.5, 3, 1, 2]} />
        <meshToonMaterial color="#D4E8D4" />
      </mesh>
      {/* Sliding glass door frame */}
      <mesh position={[0, -0.35, 1.46]} castShadow>
        <boxGeometry args={[1.6, 2.4, 0.08, 3, 4, 1]} />
        <meshToonMaterial color="#88CC88" transparent opacity={0.5} />
      </mesh>
      {/* Horizontal window bands — upper floor */}
      <mesh position={[0, 1.1, 1.42]}>
        <boxGeometry args={[3.6, 0.5, 0.06, 4, 1, 1]} />
        <meshToonMaterial color="#A8E4FF" transparent opacity={0.7} />
      </mesh>
      {/* Back windows */}
      <Window pos={[-1, 0.3, -1.42]} />
      <Window pos={[1, 0.3, -1.42]} />
      {/* Support columns — clean steel look */}
      {[-1.5, 0, 1.5].map((x, i) => (
        <mesh key={i} position={[x, 0, 1.5]}>
          <cylinderGeometry args={[0.08, 0.08, 3.2, 20, 3]} />
          <meshToonMaterial color="#6B8C6B" />
        </mesh>
      ))}
      {/* Healing garden — side area */}
      <mesh position={[2.5, -1.75, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.9, 36]} />
        <meshToonMaterial color="#4A7A3A" />
      </mesh>
    </group>
  );
}

// ── HUT — Dogon compound (Mali) ────────────────────────────────────────────
// The Dogon of the Bandiagara Escarpment build in sun-dried mud brick
// with flat roofs, symbolic geometric facades, cylindrical granaries
// with conical thatched caps, and a toguna (word house) meeting shelter.
// ~4,400 triangles
export function HutBuilding({ hover }: { hover: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(state => {
    if (!ref.current) return;
    ref.current.position.y = hover ? 0.2 + Math.sin(state.clock.elapsedTime * 1.5) * 0.03 : 0;
  });

  const mud    = '#B8864A';  // sun-dried mud brick
  const mudDk  = '#8A5A28';  // shadowed mud
  const thatch = '#9A7820';  // thatched roof
  const wood   = '#5A3A10';  // wooden elements
  const deco   = '#D4A040';  // geometric decoration
  const red    = '#A03020';  // ochre accent

  return (
    <group ref={ref}>
      {/* ── Main dwelling — rectangular flat-roofed structure ── */}
      <mesh castShadow>
        <boxGeometry args={[3.6, 2.4, 2.6, 5, 4, 4]} />
        <meshToonMaterial color={mud} />
      </mesh>

      {/* Flat roof with parapet walls */}
      <mesh position={[0, 1.28, 0]} castShadow>
        <boxGeometry args={[3.8, 0.22, 2.8, 5, 1, 4]} />
        <meshToonMaterial color={mudDk} />
      </mesh>
      {/* Parapet — raised edges around flat roof */}
      {[
        [0, 1.5, 1.4, 3.8, 0.35, 0.22],  // front
        [0, 1.5, -1.4, 3.8, 0.35, 0.22], // back
        [1.9, 1.5, 0, 0.22, 0.35, 2.4],  // right
        [-1.9, 1.5, 0, 0.22, 0.35, 2.4], // left
      ].map(([x, y, z, w, h, d], i) => (
        <mesh key={i} position={[x, y, z] as [number,number,number]} castShadow>
          <boxGeometry args={[w, h, d, 3, 2, 2] as [number,number,number,number,number,number]} />
          <meshToonMaterial color={mudDk} />
        </mesh>
      ))}

      {/* ── Facade geometric decoration — Dogon symbolic patterns ── */}
      {/* Vertical relief strips */}
      {[-1.2, -0.4, 0.4, 1.2].map((x, i) => (
        <mesh key={i} position={[x, 0, 1.32]} castShadow>
          <boxGeometry args={[0.12, 2.4, 0.08, 1, 6, 1]} />
          <meshToonMaterial color={mudDk} />
        </mesh>
      ))}
      {/* Horizontal band with chevron pattern */}
      <mesh position={[0, 0.5, 1.32]}>
        <boxGeometry args={[3.6, 0.28, 0.1, 8, 1, 1]} />
        <meshToonMaterial color={deco} />
      </mesh>
      <mesh position={[0, -0.5, 1.32]}>
        <boxGeometry args={[3.6, 0.16, 0.1, 8, 1, 1]} />
        <meshToonMaterial color={red} />
      </mesh>
      {/* Decorative niches — ancestral spirit houses */}
      {[-1.1, 0, 1.1].map((x, i) => (
        <mesh key={i} position={[x, -0.1, 1.34]}>
          <boxGeometry args={[0.35, 0.55, 0.1, 2, 3, 1]} />
          <meshToonMaterial color={mudDk} />
        </mesh>
      ))}

      {/* ── Narrow Dogon doorway — low and rectangular ── */}
      <mesh position={[0, -0.75, 1.32]} castShadow>
        <boxGeometry args={[0.7, 1.5, 0.12, 2, 5, 1]} />
        <meshToonMaterial color={wood} />
      </mesh>
      {/* Carved wooden door panel */}
      <mesh position={[0, -0.75, 1.39]}>
        <boxGeometry args={[0.65, 1.4, 0.04, 4, 8, 1]} />
        <meshToonMaterial color="#4A2A08" />
      </mesh>
      {/* Door lock bar — traditional wood bolt */}
      <mesh position={[0, -0.75, 1.43]}>
        <boxGeometry args={[0.5, 0.08, 0.06, 3, 1, 1]} />
        <meshToonMaterial color={deco} />
      </mesh>

      {/* ── Four cylindrical granaries — core of Dogon life ── */}
      {[
        [-1.6, -1.5, -1.5] as [number,number,number],
        [-1.6, -1.5,  1.5] as [number,number,number],
        [ 1.6, -1.5, -1.5] as [number,number,number],
        [ 1.6, -1.5,  1.5] as [number,number,number],
      ].map((pos, i) => (
        <group key={i} position={pos}>
          {/* Cylinder body */}
          <mesh castShadow>
            <cylinderGeometry args={[0.52, 0.58, 1.8, 28, 5]} />
            <meshToonMaterial color={mud} />
          </mesh>
          {/* Decorative band */}
          <mesh position={[0, 0.1, 0]}>
            <cylinderGeometry args={[0.59, 0.59, 0.2, 28, 1, true]} />
            <meshToonMaterial color={red} />
          </mesh>
          {/* Conical thatched cap */}
          <mesh position={[0, 1.05, 0]} castShadow>
            <coneGeometry args={[0.68, 0.75, 28, 4]} />
            <meshToonMaterial color={thatch} />
          </mesh>
          {/* Thatch cap tip */}
          <mesh position={[0, 1.46, 0]}>
            <sphereGeometry args={[0.1, 16, 12]} />
            <meshToonMaterial color={wood} />
          </mesh>
          {/* Foundation ring */}
          <mesh position={[0, -0.94, 0]}>
            <cylinderGeometry args={[0.65, 0.65, 0.1, 28]} />
            <meshToonMaterial color={mudDk} />
          </mesh>
        </group>
      ))}

      {/* ── Toguna — low community meeting shelter ── */}
      <group position={[0, -1.1, 2.8]}>
        {/* 6 wooden support posts */}
        {[-0.9, 0, 0.9].map((x, i) => (
          <mesh key={i} position={[x, 0.35, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.1, 1.5, 18, 3]} />
            <meshToonMaterial color={wood} />
          </mesh>
        ))}
        {/* Very low thatched roof — Dogon tradition: low to make men bow */}
        <mesh position={[0, 1.15, 0]} castShadow>
          <boxGeometry args={[2.6, 0.18, 1.2, 4, 1, 2]} />
          <meshToonMaterial color={mudDk} />
        </mesh>
        <mesh position={[0, 1.28, 0]} castShadow>
          <boxGeometry args={[2.8, 0.22, 1.4, 4, 1, 2]} />
          <meshToonMaterial color={thatch} />
        </mesh>
        {/* Millet stalks layered on roof — Dogon tradition */}
        {[-0.7, 0, 0.7].map((x, i) => (
          <mesh key={i} position={[x, 1.42, 0.1]}>
            <boxGeometry args={[0.1, 0.12, 1.0, 2, 1, 3]} />
            <meshToonMaterial color="#C8A030" />
          </mesh>
        ))}
      </group>

      {/* ── Ancestral totem — binu shrine ── */}
      <group position={[-2.2, -0.9, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.3, 1.4, 0.3, 2, 5, 2]} />
          <meshToonMaterial color={mud} />
        </mesh>
        <mesh position={[0, 0.85, 0]}>
          <boxGeometry args={[0.45, 0.45, 0.45, 2, 2, 2]} />
          <meshToonMaterial color={mudDk} />
        </mesh>
        {/* Geometric face carving */}
        <mesh position={[0, 0.85, 0.25]}>
          <boxGeometry args={[0.3, 0.3, 0.06, 3, 3, 1]} />
          <meshToonMaterial color={red} />
        </mesh>
        {/* Offering bowl on top */}
        <mesh position={[0, 1.1, 0]}>
          <cylinderGeometry args={[0.18, 0.12, 0.1, 22]} />
          <meshToonMaterial color={deco} />
        </mesh>
      </group>

      {/* ── Ground terrace — stone foundation ── */}
      <mesh position={[0, -1.32, 0]} castShadow>
        <boxGeometry args={[4.2, 0.18, 3.2, 5, 1, 4]} />
        <meshToonMaterial color={mudDk} />
      </mesh>
      {/* Entry step */}
      <mesh position={[0, -1.26, 1.7]}>
        <boxGeometry args={[1.2, 0.12, 0.5]} />
        <meshToonMaterial color="#A89070" />
      </mesh>
    </group>
  );
}

// ── SPIRIT SHRINE — Sacred geometry crystal × Kemetic obelisk ─────────────
// ~4,900 triangles — animated
export function SpiritShrine({ hover }: { hover: boolean }) {
  const crystalRef = useRef<THREE.Group>(null);
  const orbRef     = useRef<THREE.Mesh>(null);

  useFrame(state => {
    const t = state.clock.elapsedTime;
    if (crystalRef.current) {
      crystalRef.current.rotation.y = t * 0.4;
    }
    if (orbRef.current) {
      orbRef.current.position.y = Math.sin(t * 1.2) * 0.15 + 1.6;
      (orbRef.current.material as THREE.MeshToonMaterial).opacity = 0.6 + Math.sin(t * 2) * 0.2;
    }
  });

  const y = hover ? 0.2 : 0;
  return (
    <group position={[0, y, 0]}>
      {/* Stepped ziggurat base */}
      {[0, 1, 2].map(tier => (
        <mesh key={tier} position={[0, -1.7 + tier * 0.38, 0]} castShadow>
          <cylinderGeometry args={[2.0 - tier * 0.45, 2.0 - tier * 0.45 + 0.12, 0.38, 36, 2]} />
          <meshToonMaterial color={tier === 0 ? '#2D1F3A' : tier === 1 ? '#3D2F4A' : '#4D3F5A'} />
        </mesh>
      ))}
      {/* Central obelisk */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[0.6, 3.5, 0.6, 2, 8, 2]} />
        <meshToonMaterial color="#1E1B4B" />
      </mesh>
      {/* Obelisk gold cap */}
      <mesh position={[0, 2.0, 0]} castShadow>
        <coneGeometry args={[0.42, 0.7, 4, 4]} />
        <meshToonMaterial color="#D97706" />
      </mesh>
      {/* Sacred geometry — rotating crystal formation */}
      <group ref={crystalRef} position={[0, 0.3, 0]}>
        {[0, 60, 120, 180, 240, 300].map((deg, i) => {
          const a = (deg * Math.PI) / 180;
          const r = 1.4;
          return (
            <mesh key={i} position={[Math.cos(a) * r, 0, Math.sin(a) * r]} castShadow>
              <octahedronGeometry args={[0.28, 0]} />
              <meshToonMaterial color={['#7C3AED','#1877F2','#059669','#7C3AED','#1877F2','#059669'][i]} />
            </mesh>
          );
        })}
        {/* Connecting ring */}
        <mesh>
          <torusGeometry args={[1.4, 0.05, 14, 56]} />
          <meshToonMaterial color="#7C3AED" transparent opacity={0.7} />
        </mesh>
      </group>
      {/* Floating central orb */}
      <mesh ref={orbRef} position={[0, 1.6, 0]}>
        <sphereGeometry args={[0.5, 32, 24]} />
        <meshToonMaterial color="#60A5FA" transparent opacity={0.75} />
      </mesh>
      {/* Inner orb glow */}
      <mesh position={[0, 1.6, 0]}>
        <sphereGeometry args={[0.3, 24, 18]} />
        <meshToonMaterial color="#E8D5FF" />
      </mesh>
      {/* 4 corner pillars */}
      {[[-1.7, -1.7], [1.7, -1.7], [-1.7, 1.7], [1.7, 1.7]].map(([x, z], i) => (
        <group key={i} position={[x, -0.9, z]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.15, 0.18, 1.8, 22, 4]} />
            <meshToonMaterial color="#3D2F4A" />
          </mesh>
          <mesh position={[0, 1.0, 0]}>
            <octahedronGeometry args={[0.18, 0]} />
            <meshToonMaterial color="#7C3AED" />
          </mesh>
        </group>
      ))}
      {/* Portal arch entrance */}
      <Arch pos={[0, -0.5, 2.1]} w={1.0} h={1.8} color="#4D3F5A" />
      {/* Glowing portal fill */}
      <mesh position={[0, -0.1, 2.1]}>
        <boxGeometry args={[0.9, 1.5, 0.04, 2, 4, 1]} />
        <meshToonMaterial color="#7C3AED" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}
