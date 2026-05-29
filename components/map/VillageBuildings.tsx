'use client';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  createWoodGrainTexture, createMudBrickTexture, createMarbleTexture,
  createThatchTexture, createStoneTexture, createBambooTexture,
  createCedarTexture, createDarkWoodTexture, createEbonyTexture,
} from './VillageTextures';

// ─── Singleton texture cache — created once, reused across all buildings ──────
// Uses typeof document check so it's safe during SSR
let _texCache: Record<string, THREE.CanvasTexture> | null = null;
function getTex() {
  if (typeof document === 'undefined') return null;
  if (!_texCache) {
    _texCache = {
      mudBrick: createMudBrickTexture(),
      wood:     createWoodGrainTexture('#7A4A20', '#3D1E08'),
      cedar:    createCedarTexture(),
      marble:   createMarbleTexture(),
      thatch:   createThatchTexture(),
      stone:    createStoneTexture(),
      bamboo:   createBambooTexture(),
      darkWood: createDarkWoodTexture(),
      ebony:    createEbonyTexture(),
    };
  }
  return _texCache;
}

// ─── Shared primitives ─────────────────────────────────────────────────────────

function Pillar({ pos, h = 3, r = 0.13, sides = 24, color = '#D8C8A8' }: {
  pos: [number,number,number]; h?: number; r?: number; sides?: number; color?: string;
}) {
  return (
    <group position={pos}>
      {/* Entasis shaft — slightly wider at 1/3 height */}
      <mesh castShadow>
        <cylinderGeometry args={[r * 0.88, r, h * 0.72, sides, 4]} />
        <meshToonMaterial color={color} />
      </mesh>
      <mesh position={[0, h * 0.36, 0]} castShadow>
        <cylinderGeometry args={[r * 0.94, r * 0.88, h * 0.18, sides, 2]} />
        <meshToonMaterial color={color} />
      </mesh>
      <mesh position={[0, h * 0.45, 0]} castShadow>
        <cylinderGeometry args={[r * 0.88, r * 0.94, h * 0.1, sides, 2]} />
        <meshToonMaterial color={color} />
      </mesh>
      {/* Capital */}
      <mesh position={[0, h / 2 + 0.1, 0]} castShadow>
        <cylinderGeometry args={[r * 1.55, r * 0.9, 0.22, sides, 2]} />
        <meshToonMaterial color={color} />
      </mesh>
      <mesh position={[0, h / 2 + 0.22, 0]}>
        <cylinderGeometry args={[r * 1.7, r * 1.55, 0.1, sides, 1]} />
        <meshToonMaterial color={color} />
      </mesh>
      {/* Base */}
      <mesh position={[0, -h / 2 - 0.08, 0]}>
        <cylinderGeometry args={[r * 1.45, r * 1.45, 0.16, sides, 1]} />
        <meshToonMaterial color={color} />
      </mesh>
    </group>
  );
}

function RichWindow({ pos, w = 0.6, h = 0.8, frame = '#4A2C10', glass = '#A8CCFF', shutterColor = '#3A2208' }: {
  pos: [number,number,number]; w?: number; h?: number; frame?: string; glass?: string; shutterColor?: string;
}) {
  return (
    <group position={pos}>
      {/* Outer stone arch / lintel */}
      <mesh position={[0, h / 2 + 0.12, -0.01]}>
        <boxGeometry args={[w + 0.24, 0.18, 0.1, 2, 1, 1]} />
        <meshToonMaterial color={frame} />
      </mesh>
      {/* Frame */}
      <mesh castShadow>
        <boxGeometry args={[w + 0.12, h + 0.12, 0.08, 2, 3, 1]} />
        <meshToonMaterial color={frame} />
      </mesh>
      {/* Glass panes */}
      <mesh position={[0, 0, 0.045]}>
        <boxGeometry args={[w, h, 0.04, 1, 1, 1]} />
        <meshToonMaterial color={glass} transparent opacity={0.55} />
      </mesh>
      {/* Mullion vertical */}
      <mesh position={[0, 0, 0.075]}>
        <boxGeometry args={[0.038, h, 0.025, 1, 1, 1]} />
        <meshToonMaterial color={frame} />
      </mesh>
      {/* Mullion horizontal */}
      <mesh position={[0, 0.08, 0.075]}>
        <boxGeometry args={[w, 0.038, 0.025, 1, 1, 1]} />
        <meshToonMaterial color={frame} />
      </mesh>
      {/* Sill */}
      <mesh position={[0, -h / 2 - 0.08, 0.04]}>
        <boxGeometry args={[w + 0.22, 0.1, 0.14, 2, 1, 2]} />
        <meshToonMaterial color={frame} />
      </mesh>
    </group>
  );
}

function ThatchedRoof({ w, d, h, color, tex }: { w: number; d: number; h: number; color: string; tex?: THREE.CanvasTexture }) {
  return (
    <group>
      {/* Main conical/hip roof */}
      <mesh position={[0, h / 2, 0]} castShadow>
        <coneGeometry args={[Math.max(w, d) / 2 + 0.5, h, 28, 4]} />
        <meshToonMaterial color={color} map={tex ?? undefined} />
      </mesh>
      {/* Eave shadow band */}
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[Math.max(w, d) / 2 + 0.55, Math.max(w, d) / 2 + 0.55, 0.12, 28, 1, true]} />
        <meshToonMaterial color="#1E1200" />
      </mesh>
      {/* Thatch layers — horizontal bands */}
      {[0.3, 0.6, 0.9, 1.2].map((frac, i) => {
        const r = (Math.max(w, d) / 2 + 0.5) * (1 - frac / 1.5) + 0.05;
        return (
          <mesh key={i} position={[0, h * frac - 0.05, 0]}>
            <cylinderGeometry args={[r + 0.08, r, 0.12, 28, 1, true]} />
            <meshToonMaterial color={['#9A7010', '#8A6208', '#7A5206', '#6A4204'][i]} />
          </mesh>
        );
      })}
    </group>
  );
}

// ─── WORKSHOP — Malian mud-brick forge × Blacksmith guild hall ────────────────
export function WorkshopBuilding({ hover }: { hover: boolean }) {
  const tex = useMemo(() => getTex(), []);
  const smokeRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!smokeRef.current) return;
    const t = clock.elapsedTime;
    smokeRef.current.position.y = 4.5 + (t * 0.4 % 1.5);
    smokeRef.current.scale.setScalar(1 + (t * 0.4 % 1.5) * 0.4);
    (smokeRef.current.children[0] as THREE.Mesh & { material: THREE.MeshToonMaterial }).material.opacity =
      0.35 - (t * 0.4 % 1.5) * 0.22;
  });

  return (
    <group position={[0, hover ? 0.15 : 0, 0]}>
      {/* ── Foundation platform ── */}
      <mesh position={[0, -1.85, 0]} castShadow>
        <boxGeometry args={[5.2, 0.28, 4.2, 5, 1, 4]} />
        <meshToonMaterial color="#4A3018" />
      </mesh>

      {/* ── Main hall — thick mud-brick walls with procedural texture ── */}
      {/* Back wall */}
      <mesh position={[0, -0.15, -1.95]} castShadow>
        <boxGeometry args={[4.8, 3.4, 0.42, 5, 5, 1]} />
        <meshToonMaterial color="#8A5C2A" map={tex?.mudBrick ?? undefined} />
      </mesh>
      {/* Left wall */}
      <mesh position={[-2.28, -0.15, 0]} castShadow>
        <boxGeometry args={[0.42, 3.4, 3.9, 1, 5, 4]} />
        <meshToonMaterial color="#7A5020" map={tex?.mudBrick ?? undefined} />
      </mesh>
      {/* Right wall */}
      <mesh position={[2.28, -0.15, 0]} castShadow>
        <boxGeometry args={[0.42, 3.4, 3.9, 1, 5, 4]} />
        <meshToonMaterial color="#7A5020" map={tex?.mudBrick ?? undefined} />
      </mesh>
      {/* Front wall — split around door */}
      <mesh position={[-1.35, -0.15, 1.95]} castShadow>
        <boxGeometry args={[1.7, 3.4, 0.42, 2, 5, 1]} />
        <meshToonMaterial color="#8A5C2A" map={tex?.mudBrick ?? undefined} />
      </mesh>
      <mesh position={[1.35, -0.15, 1.95]} castShadow>
        <boxGeometry args={[1.7, 3.4, 0.42, 2, 5, 1]} />
        <meshToonMaterial color="#8A5C2A" map={tex?.mudBrick ?? undefined} />
      </mesh>
      {/* Lintel above door */}
      <mesh position={[0, 1.12, 1.95]} castShadow>
        <boxGeometry args={[1.28, 0.38, 0.48, 3, 1, 1]} />
        <meshToonMaterial color="#5A3510" />
      </mesh>

      {/* ── Thatched hip roof ── */}
      <group position={[0, 1.78, 0]}>
        <ThatchedRoof w={4.8} d={3.9} h={2.0} color="#8A6210" tex={tex?.thatch ?? undefined} />
      </group>

      {/* ── Chimney — forge stack ── */}
      <mesh position={[1.6, 3.0, -0.8]} castShadow>
        <boxGeometry args={[0.52, 2.4, 0.52, 2, 5, 2]} />
        <meshToonMaterial color="#5A3820" />
      </mesh>
      <mesh position={[1.6, 4.22, -0.8]}>
        <cylinderGeometry args={[0.32, 0.36, 0.22, 16, 1]} />
        <meshToonMaterial color="#3A2210" />
      </mesh>
      {/* Smoke puff */}
      <group ref={smokeRef} position={[1.6, 4.5, -0.8]}>
        <mesh>
          <sphereGeometry args={[0.22, 10, 8]} />
          <meshToonMaterial color="#888888" transparent opacity={0.3} />
        </mesh>
      </group>

      {/* ── Decorative facade ── */}
      {/* Brick texture horizontal bands */}
      {[-0.8, -0.2, 0.4, 1.0].map((y, i) => (
        <mesh key={i} position={[0, y, 1.97]}>
          <boxGeometry args={[4.82, 0.055, 0.06, 6, 1, 1]} />
          <meshToonMaterial color="#6A4218" />
        </mesh>
      ))}
      {/* Gear emblem */}
      <mesh position={[0, 1.55, 2.0]}>
        <torusGeometry args={[0.42, 0.09, 14, 36]} />
        <meshToonMaterial color="#E8770A" />
      </mesh>
      <mesh position={[0, 1.55, 2.02]}>
        <circleGeometry args={[0.22, 14]} />
        <meshToonMaterial color="#C05A00" />
      </mesh>
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
        const a = (deg * Math.PI) / 180;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.42, 1.55 + Math.sin(a) * 0.42, 2.03]}>
            <boxGeometry args={[0.12, 0.18, 0.02, 1, 2, 1]} />
            <meshToonMaterial color="#E8770A" />
          </mesh>
        );
      })}

      {/* ── Windows ── */}
      <RichWindow pos={[-1.4, 0.4, 1.97]} frame="#5A3010" glass="#FFD08888" />
      <RichWindow pos={[1.4, 0.4, 1.97]}  frame="#5A3010" glass="#FFD08888" />
      <RichWindow pos={[-2.3, 0.4, -0.5]} w={0.5} frame="#5A3010" glass="#FFD08888" />
      <RichWindow pos={[2.3, 0.4, -0.5]}  w={0.5} frame="#5A3010" glass="#FFD08888" />

      {/* ── Outdoor forge area ── */}
      {/* Anvil stand */}
      <mesh position={[0, -1.48, 2.55]} castShadow>
        <boxGeometry args={[0.65, 0.55, 0.55, 2, 2, 2]} />
        <meshToonMaterial color="#3D2808" />
      </mesh>
      <mesh position={[0, -1.15, 2.55]} castShadow>
        <boxGeometry args={[0.85, 0.15, 0.42, 2, 1, 2]} />
        <meshToonMaterial color="#2A2A2A" />
      </mesh>
      {/* Bellows */}
      <mesh position={[-1.0, -1.5, 2.6]}>
        <boxGeometry args={[0.4, 0.3, 0.6, 2, 2, 3]} />
        <meshToonMaterial color="#5A3010" />
      </mesh>
      {/* Workbench */}
      <mesh position={[0, -1.55, 3.1]} castShadow>
        <boxGeometry args={[2.8, 0.14, 0.72, 3, 1, 2]} />
        <meshToonMaterial color="#5A3818" />
      </mesh>
      {[-1.15, 1.15].map((x, i) => (
        <mesh key={i} position={[x, -1.78, 3.1]}>
          <cylinderGeometry args={[0.055, 0.07, 0.46, 10, 2]} />
          <meshToonMaterial color="#3A2008" />
        </mesh>
      ))}
    </group>
  );
}

// ─── DREAM LINE — Greek amphitheater × Nubian night stage ─────────────────────
export function DreamLineBuilding({ hover }: { hover: boolean }) {
  const tex = useMemo(() => getTex(), []);
  const torchRef1 = useRef<THREE.Mesh>(null);
  const torchRef2 = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (torchRef1.current) {
      torchRef1.current.scale.set(0.9 + Math.sin(t * 6.5) * 0.2, 1 + Math.sin(t * 5.8) * 0.3, 0.9 + Math.cos(t * 7) * 0.18);
    }
    if (torchRef2.current) {
      torchRef2.current.scale.set(0.9 + Math.sin(t * 7.2 + 1) * 0.18, 1 + Math.sin(t * 6.2 + 1) * 0.28, 0.9);
    }
  });

  const marbleColor = '#E8E0D0';
  const accentGold  = '#C8A830';
  const purpleDrape = '#5A2898';

  return (
    <group position={[0, hover ? 0.15 : 0, 0]}>
      {/* ── Grand foundation platform — 3-tiered ── */}
      {[0, 1, 2].map(tier => (
        <mesh key={tier} position={[0, -1.85 + tier * 0.35, 0]} castShadow>
          <cylinderGeometry args={[3.8 - tier * 0.6, 3.8 - tier * 0.6 + 0.2, 0.35, 48, 2]} />
          <meshToonMaterial color={tier % 2 === 0 ? '#C0B090' : '#D0C0A0'} />
        </mesh>
      ))}

      {/* ── Semicircular seating — orchestra ── */}
      {[0, 1, 2, 3].map(tier => (
        <mesh key={tier} position={[0, -1.02 + tier * 0.38, 0]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[1.8 + tier * 0.6, 1.8 + tier * 0.6 + 0.55, 0.38, 40, 2, false, 0, Math.PI]} />
          <meshToonMaterial color={tier % 2 === 0 ? '#D0C0A0' : '#C0B090'} />
        </mesh>
      ))}

      {/* ── Stage / orchestra circle ── */}
      <mesh position={[0, -1.12, -0.5]} castShadow>
        <cylinderGeometry args={[1.45, 1.45, 0.3, 40, 2]} />
        <meshToonMaterial color={marbleColor} />
      </mesh>
      {/* Stage inlay ring */}
      <mesh position={[0, -0.95, -0.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.1, 1.42, 40]} />
        <meshToonMaterial color={accentGold} />
      </mesh>

      {/* ── Skene — backdrop building ── */}
      <mesh position={[0, 0.35, -2.35]} castShadow>
        <boxGeometry args={[4.5, 3.2, 0.7, 5, 5, 1]} />
        <meshToonMaterial color={marbleColor} map={tex?.marble ?? undefined} />
      </mesh>
      {/* Skene pediment */}
      <mesh position={[0, 2.05, -2.35]} castShadow>
        <boxGeometry args={[4.8, 0.3, 0.75, 5, 1, 1]} />
        <meshToonMaterial color="#C8B880" />
      </mesh>
      {/* Triangular pediment */}
      <mesh position={[0, 2.45, -2.35]} castShadow>
        <coneGeometry args={[2.55, 1.0, 4, 2]} />
        <meshToonMaterial color="#C8B880" />
      </mesh>
      {/* Pediment sculpture spot */}
      <mesh position={[0, 2.55, -2.3]}>
        <sphereGeometry args={[0.2, 14, 10]} />
        <meshToonMaterial color={accentGold} />
      </mesh>

      {/* ── 6 Front columns ── */}
      {[-1.8, -1.08, -0.36, 0.36, 1.08, 1.8].map((x, i) => (
        <Pillar key={i} pos={[x, -0.5, -1.8]} h={2.8} r={0.15} sides={22} color={marbleColor} />
      ))}
      {/* Entablature */}
      <mesh position={[0, 0.96, -1.82]} castShadow>
        <boxGeometry args={[4.3, 0.3, 0.34, 6, 1, 1]} />
        <meshToonMaterial color="#C8B880" />
      </mesh>
      {/* Frieze — triglyphs */}
      {[-1.5, -0.75, 0, 0.75, 1.5].map((x, i) => (
        <mesh key={i} position={[x, 0.88, -1.98]}>
          <boxGeometry args={[0.22, 0.26, 0.04, 2, 4, 1]} />
          <meshToonMaterial color="#A89870" />
        </mesh>
      ))}

      {/* ── Draped purple banners ── */}
      {[-1.5, 0, 1.5].map((x, i) => (
        <mesh key={i} position={[x, 0.6, -2.02]}>
          <boxGeometry args={[0.65, 1.8, 0.04, 2, 6, 1]} />
          <meshToonMaterial color={purpleDrape} transparent opacity={0.82} />
        </mesh>
      ))}

      {/* ── Torch flames ── */}
      <group position={[-0.7, -0.65, -0.3]}>
        <mesh position={[0, 0, 0]} castShadow>
          <cylinderGeometry args={[0.055, 0.04, 1.2, 12, 3]} />
          <meshToonMaterial color="#5A3010" />
        </mesh>
        <mesh position={[0, 0.72, 0]}>
          <cylinderGeometry args={[0.12, 0.08, 0.22, 12, 1]} />
          <meshToonMaterial color="#3A1A08" />
        </mesh>
        <mesh ref={torchRef1} position={[0, 0.95, 0]}>
          <coneGeometry args={[0.12, 0.35, 12, 4]} />
          <meshToonMaterial color="#FF8820" transparent opacity={0.9} />
        </mesh>
      </group>
      <group position={[0.7, -0.65, -0.3]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.055, 0.04, 1.2, 12, 3]} />
          <meshToonMaterial color="#5A3010" />
        </mesh>
        <mesh position={[0, 0.72, 0]}>
          <cylinderGeometry args={[0.12, 0.08, 0.22, 12, 1]} />
          <meshToonMaterial color="#3A1A08" />
        </mesh>
        <mesh ref={torchRef2} position={[0, 0.95, 0]}>
          <coneGeometry args={[0.12, 0.35, 12, 4]} />
          <meshToonMaterial color="#FF8820" transparent opacity={0.9} />
        </mesh>
      </group>

      {/* ── Windows in skene ── */}
      <RichWindow pos={[-1.5, 0.4, -2.0]} frame="#8A7850" glass="#C8A0FF" />
      <RichWindow pos={[1.5, 0.4, -2.0]}  frame="#8A7850" glass="#C8A0FF" />
    </group>
  );
}

// ─── TRADING POST — Moroccan souk × West African market ──────────────────────
export function TradingPostBuilding({ hover }: { hover: boolean }) {
  const tex = useMemo(() => getTex(), []);
  const flagRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!flagRef.current) return;
    const t = clock.elapsedTime;
    flagRef.current.rotation.z = Math.sin(t * 2.5) * 0.12;
    flagRef.current.rotation.y = Math.sin(t * 1.8) * 0.08;
  });

  const wallC   = '#C87850';
  const plasterC = '#E0C090';
  const tileC   = '#1E7848';
  const accentC = '#E8A020';

  return (
    <group position={[0, hover ? 0.15 : 0, 0]}>
      {/* ── Raised foundation ── */}
      <mesh position={[0, -1.88, 0]} castShadow>
        <boxGeometry args={[5.0, 0.32, 4.2, 5, 1, 4]} />
        <meshToonMaterial color="#7A4A28" />
      </mesh>

      {/* ── Main market hall ── */}
      {/* Rear wall */}
      <mesh position={[0, -0.1, -1.98]} castShadow>
        <boxGeometry args={[4.6, 3.6, 0.4, 5, 5, 1]} />
        <meshToonMaterial color={wallC} />
      </mesh>
      {/* Side walls */}
      <mesh position={[-2.28, -0.1, 0]} castShadow>
        <boxGeometry args={[0.4, 3.6, 3.96, 1, 5, 4]} />
        <meshToonMaterial color={wallC} />
      </mesh>
      <mesh position={[2.28, -0.1, 0]} castShadow>
        <boxGeometry args={[0.4, 3.6, 3.96, 1, 5, 4]} />
        <meshToonMaterial color={wallC} />
      </mesh>
      {/* Front side walls */}
      <mesh position={[-1.55, -0.1, 1.98]} castShadow>
        <boxGeometry args={[1.5, 3.6, 0.4, 2, 5, 1]} />
        <meshToonMaterial color={wallC} />
      </mesh>
      <mesh position={[1.55, -0.1, 1.98]} castShadow>
        <boxGeometry args={[1.5, 3.6, 0.4, 2, 5, 1]} />
        <meshToonMaterial color={wallC} />
      </mesh>

      {/* ── Decorative plasterwork panels ── */}
      {[[-1.5, 0.5, 2.0], [0, 0.5, 2.0], [1.5, 0.5, 2.0]].map((p, i) => (
        <mesh key={i} position={p as [number,number,number]}>
          <boxGeometry args={[0.9, 1.8, 0.08, 3, 6, 1]} />
          <meshToonMaterial color={plasterC} />
        </mesh>
      ))}

      {/* ── Flat roof with parapet and tile decoration ── */}
      <mesh position={[0, 1.68, 0]} castShadow>
        <boxGeometry args={[4.9, 0.24, 4.1, 5, 1, 4]} />
        <meshToonMaterial color="#A06838" />
      </mesh>
      {/* Parapet */}
      {[[-2.0, 0, 0, 0.4, 0.48, 4.1], [2.0, 0, 0, 0.4, 0.48, 4.1],
        [0, 0, -2.05, 4.9, 0.48, 0.4], [0, 0, 2.05, 4.9, 0.48, 0.4]].map(([x, y, z, w, h, d], i) => (
        <mesh key={i} position={[x, 1.96 + y, z] as [number,number,number]} castShadow>
          <boxGeometry args={[w, h, d, 3, 2, 2] as [number,number,number,number,number,number]} />
          <meshToonMaterial color={wallC} />
        </mesh>
      ))}
      {/* Parapet crenellations */}
      {[-1.5, -0.75, 0, 0.75, 1.5].map((x, i) => (
        <mesh key={i} position={[x, 2.25, 2.06]}>
          <boxGeometry args={[0.35, 0.32, 0.22, 2, 2, 1]} />
          <meshToonMaterial color="#C06838" />
        </mesh>
      ))}
      {/* Zellige tile mosaic band */}
      <mesh position={[0, 0.85, 2.0]}>
        <boxGeometry args={[4.7, 0.35, 0.1, 8, 2, 1]} />
        <meshToonMaterial color={tileC} />
      </mesh>
      {/* Star pattern on tiles */}
      {[-1.8, -0.9, 0, 0.9, 1.8].map((x, i) => (
        <mesh key={i} position={[x, 0.85, 2.05]}>
          <circleGeometry args={[0.12, 6]} />
          <meshToonMaterial color={accentC} />
        </mesh>
      ))}

      {/* ── Corner minaret ── */}
      <mesh position={[-2.1, 1.2, -1.9]} castShadow>
        <cylinderGeometry args={[0.24, 0.3, 3.2, 18, 5]} />
        <meshToonMaterial color={plasterC} />
      </mesh>
      <mesh position={[-2.1, 2.78, -1.9]}>
        <coneGeometry args={[0.32, 0.65, 18, 3]} />
        <meshToonMaterial color={tileC} />
      </mesh>
      {/* Minaret balcony */}
      <mesh position={[-2.1, 2.15, -1.9]}>
        <cylinderGeometry args={[0.38, 0.28, 0.12, 18, 1]} />
        <meshToonMaterial color={plasterC} />
      </mesh>
      {/* Flag */}
      <group position={[-2.1, 3.48, -1.9]}>
        <mesh>
          <cylinderGeometry args={[0.012, 0.012, 0.9, 6, 2]} />
          <meshToonMaterial color="#8A6020" />
        </mesh>
        <mesh ref={flagRef} position={[0.25, 0.32, 0]}>
          <boxGeometry args={[0.45, 0.28, 0.01, 3, 2, 1]} />
          <meshToonMaterial color="#DC2626" />
        </mesh>
      </group>

      {/* ── Fabric market stalls outside ── */}
      {[[-1.5, 2.55], [0, 2.55], [1.5, 2.55]].map(([x, z], i) => (
        <group key={i} position={[x, -1.2, z]}>
          {/* Canopy */}
          <mesh rotation={[-0.25, 0, 0]}>
            <boxGeometry args={[1.35, 0.07, 0.9, 3, 1, 2]} />
            <meshToonMaterial color={['#FF6B2B', '#7C3AED', '#059669'][i]} />
          </mesh>
          {/* Display goods */}
          <mesh position={[0, -0.28, 0]}>
            <boxGeometry args={[1.1, 0.1, 0.55, 2, 1, 2]} />
            <meshToonMaterial color="#5A3010" />
          </mesh>
          {[-0.3, 0.1, 0.3].map((ox, j) => (
            <mesh key={j} position={[ox, -0.18, 0]}>
              <sphereGeometry args={[0.08, 10, 7]} />
              <meshToonMaterial color={['#FFD700', '#FF6B2B', '#1877F2'][j]} />
            </mesh>
          ))}
          {/* Pole */}
          <mesh position={[0, 0.1, -0.4]}>
            <cylinderGeometry args={[0.04, 0.04, 1.1, 8, 2]} />
            <meshToonMaterial color="#4A2C08" />
          </mesh>
        </group>
      ))}

      {/* ── Windows ── */}
      <RichWindow pos={[-2.3, 0.4, 0]} w={0.5} frame="#7A4820" glass="#FFE080" />
      <RichWindow pos={[2.3, 0.4, 0]}  w={0.5} frame="#7A4820" glass="#FFE080" />
      <RichWindow pos={[0, 0.4, -2.0]} frame="#7A4820" glass="#FFE080" />

      {/* Steps */}
      {[0.3, 0.6, 0.9].map((frac, i) => (
        <mesh key={i} position={[0, -1.62 + i * 0.18, 2.25 - i * 0.14]} castShadow>
          <boxGeometry args={[2.8 - i * 0.18, 0.18, 0.5, 3, 1, 1]} />
          <meshToonMaterial color="#9A6848" />
        </mesh>
      ))}
    </group>
  );
}

// ─── BANK — Nubian pyramid treasury × Egyptian-inspired columns ───────────────
export function BankBuilding({ hover }: { hover: boolean }) {
  const tex = useMemo(() => getTex(), []);
  const capRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!capRef.current) return;
    (capRef.current.material as THREE.MeshToonMaterial).color.setHSL(
      0.12, 0.8, 0.5 + Math.sin(clock.elapsedTime * 1.4) * 0.06
    );
  });

  const stoneC  = '#D8C8A0';
  const goldC   = '#C8A820';
  const darkC   = '#8A7050';

  return (
    <group position={[0, hover ? 0.15 : 0, 0]}>
      {/* ── Grand base platform ── */}
      <mesh position={[0, -1.88, 0]} castShadow>
        <boxGeometry args={[5.5, 0.35, 4.8, 6, 1, 5]} />
        <meshToonMaterial color={darkC} />
      </mesh>
      {/* Second plinth */}
      <mesh position={[0, -1.53, 0]} castShadow>
        <boxGeometry args={[5.1, 0.35, 4.4, 5, 1, 4]} />
        <meshToonMaterial color="#9A8060" />
      </mesh>

      {/* ── Rusticated lower story ── */}
      <mesh position={[0, -0.6, 0]} castShadow>
        <boxGeometry args={[4.4, 1.8, 3.6, 5, 5, 4]} />
        <meshToonMaterial color="#C4B490" />
      </mesh>
      {/* Rustication joints */}
      {[-0.6, 0, 0.6].map((y, i) => (
        <mesh key={i} position={[0, -0.6 + y, 1.82]}>
          <boxGeometry args={[4.42, 0.035, 0.06, 5, 1, 1]} />
          <meshToonMaterial color={darkC} />
        </mesh>
      ))}

      {/* ── Upper piano nobile ── */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[4.2, 1.85, 3.4, 5, 4, 4]} />
        <meshToonMaterial color={stoneC} />
      </mesh>

      {/* ── Nubian pyramid crowning feature ── */}
      <mesh position={[0, 1.82, 0]} castShadow>
        <coneGeometry args={[2.2, 2.6, 4, 10]} />
        <meshToonMaterial color="#C89830" />
      </mesh>
      {/* Gold capstone — animated glow */}
      <mesh ref={capRef} position={[0, 3.12, 0]}>
        <octahedronGeometry args={[0.26, 0]} />
        <meshToonMaterial color={goldC} />
      </mesh>
      {/* Pyramid hieroglyph bands */}
      {[0.4, 0.8, 1.2].map((frac, i) => {
        const r = 2.2 * (1 - frac / 2.0) + 0.08;
        return (
          <mesh key={i} position={[0, 1.82 + 2.6 * frac - 0.2, 0]}>
            <cylinderGeometry args={[r + 0.05, r, 0.06, 4, 1, true]} />
            <meshToonMaterial color="#A07820" />
          </mesh>
        );
      })}

      {/* ── 6 Doric columns ── */}
      {[-1.62, -0.81, 0, 0.81, 1.62].map((x, i) => (
        <Pillar key={i} pos={[x, -0.6, 1.72]} h={3.0} r={0.17} sides={22} color={stoneC} />
      ))}
      {/* Back columns */}
      {[-1.62, 0, 1.62].map((x, i) => (
        <Pillar key={i} pos={[x, -0.6, -1.72]} h={3.0} r={0.17} sides={22} color={stoneC} />
      ))}

      {/* ── Entablature ── */}
      <mesh position={[0, 0.88, 1.74]} castShadow>
        <boxGeometry args={[4.2, 0.34, 0.38, 6, 1, 1]} />
        <meshToonMaterial color={goldC} />
      </mesh>
      {/* Frieze frieze */}
      {[-1.4, -0.7, 0, 0.7, 1.4].map((x, i) => (
        <mesh key={i} position={[x, 0.84, 1.94]}>
          <boxGeometry args={[0.22, 0.28, 0.05, 2, 4, 1]} />
          <meshToonMaterial color={darkC} />
        </mesh>
      ))}

      {/* ── Brass entry doors ── */}
      <mesh position={[0, -0.52, 1.85]} castShadow>
        <boxGeometry args={[1.2, 2.1, 0.12, 3, 6, 1]} />
        <meshToonMaterial color="#5A3E0A" />
      </mesh>
      {/* Door panels */}
      {[-0.28, 0.28].map((x, i) => (
        <mesh key={i} position={[x, -0.52, 1.93]}>
          <boxGeometry args={[0.54, 1.9, 0.06, 2, 5, 1]} />
          <meshToonMaterial color="#3A2808" />
        </mesh>
      ))}
      {/* Brass knockers */}
      {[-0.1, 0.1].map((x, i) => (
        <mesh key={i} position={[x, -0.52, 1.98]}>
          <torusGeometry args={[0.065, 0.018, 8, 18]} />
          <meshToonMaterial color={goldC} />
        </mesh>
      ))}

      {/* ── Windows ── */}
      <RichWindow pos={[-1.5, 0.7, 1.72]} h={0.9} frame="#3A2808" glass="#FFE080" />
      <RichWindow pos={[1.5, 0.7, 1.72]}  h={0.9} frame="#3A2808" glass="#FFE080" />
      <RichWindow pos={[-2.12, 0.7, 0]} w={0.5} frame="#3A2808" glass="#FFE080" />
      <RichWindow pos={[2.12, 0.7, 0]}  w={0.5} frame="#3A2808" glass="#FFE080" />

      {/* ── Grand steps ── */}
      {[0, 1, 2, 3, 4].map(i => (
        <mesh key={i} position={[0, -1.35 + i * 0.2, 2.08 - i * 0.18]} castShadow>
          <boxGeometry args={[4.4 - i * 0.22, 0.2, 0.55, 5, 1, 1]} />
          <meshToonMaterial color="#C8B898" />
        </mesh>
      ))}
    </group>
  );
}

// ─── ZEN GARDEN — Japanese pagoda × Korean hanok × Bamboo garden ──────────────
export function ZenBuilding({ hover }: { hover: boolean }) {
  const tex = useMemo(() => getTex(), []);
  const groupRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.28) * 0.025;
  });

  const tileC = '#2D5A18';
  const woodC = '#8A6040';
  const stoneC = '#7A7060';

  return (
    <group position={[0, hover ? 0.15 : 0, 0]} ref={groupRef}>
      {/* ── Stone platform base ── */}
      <mesh position={[0, -1.85, 0]} castShadow>
        <cylinderGeometry args={[2.8, 3.2, 0.5, 16, 3]} />
        <meshToonMaterial color={stoneC} />
      </mesh>
      {/* Raked gravel concentric rings */}
      {[2.1, 2.4, 2.7].map((r, i) => (
        <mesh key={i} position={[0, -1.58, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[r, r + 0.055, 56]} />
          <meshToonMaterial color="#C8B890" />
        </mesh>
      ))}

      {/* ── Ground tier 1 — widest ── */}
      <mesh position={[0, -1.5, 0]} castShadow>
        <boxGeometry args={[3.0, 1.1, 2.8, 4, 3, 3]} />
        <meshToonMaterial color={woodC} />
      </mesh>
      {/* Tier 1 roof */}
      <mesh position={[0, -0.8, 0]} castShadow>
        <boxGeometry args={[3.8, 0.18, 3.6, 4, 1, 4]} />
        <meshToonMaterial color={tileC} />
      </mesh>
      <mesh position={[0, -0.65, 0]}>
        <coneGeometry args={[2.2, 0.65, 28, 3]} />
        <meshToonMaterial color="#224814" />
      </mesh>
      {/* Upturned eave tips */}
      {[0, 90, 180, 270].map((deg, i) => {
        const a = (deg * Math.PI) / 180;
        return (
          <mesh key={i} position={[Math.cos(a) * 1.9, -0.55, Math.sin(a) * 1.8]}
            rotation={[0, a, -0.45]}>
            <boxGeometry args={[0.18, 0.35, 0.14, 1, 2, 1]} />
            <meshToonMaterial color={tileC} />
          </mesh>
        );
      })}

      {/* ── Tier 2 ── */}
      <mesh position={[0, 0.08, 0]} castShadow>
        <boxGeometry args={[2.2, 1.0, 2.0, 3, 3, 3]} />
        <meshToonMaterial color={woodC} />
      </mesh>
      <mesh position={[0, 0.68, 0]} castShadow>
        <boxGeometry args={[2.9, 0.15, 2.7, 3, 1, 3]} />
        <meshToonMaterial color={tileC} />
      </mesh>
      <mesh position={[0, 0.82, 0]}>
        <coneGeometry args={[1.65, 0.58, 26, 3]} />
        <meshToonMaterial color="#224814" />
      </mesh>

      {/* ── Tier 3 ── */}
      <mesh position={[0, 1.52, 0]} castShadow>
        <boxGeometry args={[1.5, 0.9, 1.4, 2, 3, 2]} />
        <meshToonMaterial color={woodC} />
      </mesh>
      <mesh position={[0, 2.04, 0]} castShadow>
        <boxGeometry args={[2.1, 0.14, 2.0, 3, 1, 3]} />
        <meshToonMaterial color={tileC} />
      </mesh>
      <mesh position={[0, 2.18, 0]}>
        <coneGeometry args={[1.2, 0.55, 24, 3]} />
        <meshToonMaterial color="#1A4010" />
      </mesh>

      {/* ── Finial spire ── */}
      <mesh position={[0, 2.76, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.07, 1.5, 16, 4]} />
        <meshToonMaterial color="#C8A820" />
      </mesh>
      {[0.35, 0.7, 1.05].map((y, i) => (
        <mesh key={i} position={[0, 2.76 + y, 0]}>
          <torusGeometry args={[0.1 - i * 0.02, 0.04, 10, 24]} />
          <meshToonMaterial color="#FFD700" />
        </mesh>
      ))}
      {/* Finial orb */}
      <mesh position={[0, 4.32, 0]}>
        <sphereGeometry args={[0.1, 16, 12]} />
        <meshToonMaterial color="#FFD700" />
      </mesh>

      {/* ── Torii gate entrance ── */}
      <group position={[0, -1.1, 2.55]}>
        {[-0.65, 0.65].map((x, i) => (
          <mesh key={i} position={[x, 0.2, 0]} castShadow>
            <cylinderGeometry args={[0.075, 0.075, 2.4, 14, 3]} />
            <meshToonMaterial color="#CC3300" />
          </mesh>
        ))}
        {/* Upper crossbeam */}
        <mesh position={[0, 1.28, 0]}>
          <boxGeometry args={[1.85, 0.12, 0.12, 4, 1, 1]} />
          <meshToonMaterial color="#CC3300" />
        </mesh>
        {/* Kasagi curved top */}
        <mesh position={[0, 1.4, 0]}>
          <boxGeometry args={[2.05, 0.1, 0.18, 4, 1, 1]} />
          <meshToonMaterial color="#AA2200" />
        </mesh>
        {/* Shimaki lower beam */}
        <mesh position={[0, 1.08, 0]}>
          <boxGeometry args={[1.7, 0.09, 0.09, 3, 1, 1]} />
          <meshToonMaterial color="#CC3300" />
        </mesh>
      </group>

      {/* ── Stone lanterns flanking gate ── */}
      {[-1.5, 1.5].map((x, i) => (
        <group key={i} position={[x, -1.5, 2.2]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.14, 0.2, 0.85, 14, 3]} />
            <meshToonMaterial color={stoneC} />
          </mesh>
          <mesh position={[0, 0.62, 0]} castShadow>
            <boxGeometry args={[0.38, 0.38, 0.38, 2, 2, 2]} />
            <meshToonMaterial color="#6A6050" />
          </mesh>
          <mesh position={[0, 0.62, 0]}>
            <boxGeometry args={[0.3, 0.3, 0.3, 1, 1, 1]} />
            <meshToonMaterial color="#FFE080" transparent opacity={0.6} />
          </mesh>
          <mesh position={[0, 0.88, 0]}>
            <coneGeometry args={[0.26, 0.28, 14, 2]} />
            <meshToonMaterial color="#5A5040" />
          </mesh>
        </group>
      ))}

      {/* ── Bamboo grove beside building ── */}
      {[[-2.2, -1.0], [-2.5, 0.3], [-2.1, 1.4]].map(([x, z], i) => (
        <group key={i} position={[x, -1.0, z]}>
          <mesh>
            <cylinderGeometry args={[0.065, 0.078, 3.5 + i * 0.4, 8, 6]} />
            <meshToonMaterial color={['#6A8A30', '#558025', '#6A9030'][i]} />
          </mesh>
          {[0.5, 1.1, 1.7, 2.3].map((y, j) => (
            <mesh key={j} position={[0.12, -1.75 + y, 0]}>
              <boxGeometry args={[0.35, 0.035, 0.065, 2, 1, 1]} />
              <meshToonMaterial color="#4A7020" />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

// ─── TRIBES — Zulu great house × Mesoamerican council ring ───────────────────
export function TribesBuilding({ hover }: { hover: boolean }) {
  const tex = useMemo(() => getTex(), []);
  const fireRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!fireRef.current) return;
    const t = clock.elapsedTime;
    fireRef.current.scale.set(0.85 + Math.sin(t * 5.8) * 0.2, 1 + Math.sin(t * 6.5) * 0.25, 0.85 + Math.cos(t * 4.9) * 0.15);
  });

  const mudC    = '#B88040';
  const thatchC = '#8A6010';
  const kenteCr = '#E8A020'; // kente gold
  const kenteGn = '#2D7830'; // kente green

  return (
    <group position={[0, hover ? 0.15 : 0, 0]}>
      {/* ── Circular main great house ── */}
      <mesh castShadow>
        <cylinderGeometry args={[2.0, 2.25, 3.1, 40, 6]} />
        <meshToonMaterial color={mudC} />
      </mesh>

      {/* ── Thatched conical roof — 4 overlapping layers ── */}
      <group position={[0, 1.55, 0]}>
        <mesh castShadow>
          <coneGeometry args={[2.65, 0.72, 40, 4]} />
          <meshToonMaterial color="#9A7810" />
        </mesh>
        <mesh position={[0, 0.52, 0]} castShadow>
          <coneGeometry args={[2.15, 0.72, 38, 4]} />
          <meshToonMaterial color="#8A6808" />
        </mesh>
        <mesh position={[0, 0.98, 0]} castShadow>
          <coneGeometry args={[1.6, 0.8, 36, 4]} />
          <meshToonMaterial color="#7A5806" />
        </mesh>
        <mesh position={[0, 1.44, 0]} castShadow>
          <coneGeometry args={[0.95, 0.88, 34, 4]} />
          <meshToonMaterial color="#6A4804" />
        </mesh>
        <mesh position={[0, 1.9, 0]}>
          <coneGeometry args={[0.45, 0.65, 32, 3]} />
          <meshToonMaterial color="#5A3A04" />
        </mesh>
      </group>
      {/* Finial */}
      <mesh position={[0, 4.22, 0]}>
        <sphereGeometry args={[0.14, 16, 12]} />
        <meshToonMaterial color="#FFD700" />
      </mesh>
      <mesh position={[0, 4.4, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.45, 8, 2]} />
        <meshToonMaterial color="#C8A020" />
      </mesh>

      {/* ── Kente cloth bands ── */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[2.26, 2.26, 0.6, 42, 1, true]} />
        <meshToonMaterial color="#BE185D" />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[2.26, 2.26, 0.18, 42, 1, true]} />
        <meshToonMaterial color={kenteCr} />
      </mesh>
      <mesh position={[0, -0.55, 0]}>
        <cylinderGeometry args={[2.26, 2.26, 0.18, 42, 1, true]} />
        <meshToonMaterial color={kenteGn} />
      </mesh>

      {/* ── Ceremonial entrance porch ── */}
      <mesh position={[0, -0.22, 2.22]} castShadow>
        <boxGeometry args={[1.3, 2.68, 0.65, 2, 5, 1]} />
        <meshToonMaterial color="#A07030" />
      </mesh>
      {/* Carved lintel */}
      <mesh position={[0, 1.2, 2.23]}>
        <boxGeometry args={[1.4, 0.22, 0.48, 4, 2, 1]} />
        <meshToonMaterial color={kenteCr} />
      </mesh>

      {/* ── Totem poles flanking entrance ── */}
      {[-0.9, 0.9].map((x, i) => (
        <group key={i} position={[x, 0.3, 2.42]}>
          {/* Main pole */}
          <mesh castShadow>
            <cylinderGeometry args={[0.115, 0.14, 3.6, 16, 6]} />
            <meshToonMaterial color="#5A3010" />
          </mesh>
          {/* Carved face at top */}
          <mesh position={[0, 1.55, 0]} castShadow>
            <boxGeometry args={[0.38, 0.42, 0.38, 2, 3, 2]} />
            <meshToonMaterial color="#8A5020" />
          </mesh>
          <mesh position={[0, 1.58, 0.2]}>
            <boxGeometry args={[0.22, 0.25, 0.06, 2, 2, 1]} />
            <meshToonMaterial color="#C04020" />
          </mesh>
          {/* Carved wings */}
          <mesh position={[0, 0.8, 0.16]}>
            <boxGeometry args={[0.7, 0.2, 0.05, 3, 1, 1]} />
            <meshToonMaterial color={['#7C3AED', '#BE185D'][i]} />
          </mesh>
          {/* Mid carving */}
          <mesh position={[0, 0.0, 0.16]}>
            <torusGeometry args={[0.12, 0.05, 8, 18, Math.PI * 1.8]} />
            <meshToonMaterial color={kenteCr} />
          </mesh>
          {/* Base anchor */}
          <mesh position={[0, -1.88, 0]}>
            <cylinderGeometry args={[0.22, 0.22, 0.2, 16, 1]} />
            <meshToonMaterial color="#3A2008" />
          </mesh>
        </group>
      ))}

      {/* ── Ring of 6 satellite huts ── */}
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <group key={i} position={[Math.cos(a) * 3.1, -1.0, Math.sin(a) * 3.1]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.42, 0.48, 1.05, 20, 4]} />
              <meshToonMaterial color={mudC} />
            </mesh>
            <mesh position={[0, 0.72, 0]} castShadow>
              <coneGeometry args={[0.6, 0.65, 20, 3]} />
              <meshToonMaterial color={thatchC} />
            </mesh>
          </group>
        );
      })}

      {/* ── Outdoor sacred fire pit ── */}
      {/* Stone ring */}
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.55, -1.5, Math.sin(a) * 0.55 + 3.1]}>
            <dodecahedronGeometry args={[0.14, 0]} />
            <meshToonMaterial color="#5A4838" />
          </mesh>
        );
      })}
      <mesh ref={fireRef} position={[0, -1.1, 3.1]}>
        <coneGeometry args={[0.2, 0.55, 12, 4]} />
        <meshToonMaterial color="#FF8020" transparent opacity={0.88} />
      </mesh>
      <mesh position={[0, -1.42, 3.1]}>
        <cylinderGeometry args={[0.06, 0.1, 0.42, 10, 2]} />
        <meshToonMaterial color="#3A2008" />
      </mesh>
    </group>
  );
}

// ─── WELLNESS CENTER — Scandinavian healing pavilion × African apothecary ─────
export function HospitalBuilding({ hover }: { hover: boolean }) {
  const tex = useMemo(() => getTex(), []);
  const steamRef = useRef<THREE.InstancedMesh>(null);
  useFrame(({ clock }) => {
    if (!steamRef.current) return;
    const t     = clock.elapsedTime;
    const dummy = new THREE.Object3D();
    [0, 1, 2].forEach((i) => {
      const y = ((t * 0.4 + i * 0.33) % 1.0) * 1.5;
      dummy.position.set(-0.3 + i * 0.3, y, 2.1);
      dummy.scale.setScalar(0.18 + y * 0.15);
      dummy.updateMatrix();
      steamRef.current!.setMatrixAt(i, dummy.matrix);
      (steamRef.current!.material as THREE.MeshBasicMaterial).opacity = 0.28 - y * 0.18;
    });
    steamRef.current.instanceMatrix.needsUpdate = true;
  });

  const wallC   = '#EEF5EE';
  const greenC  = '#2D7A3D';
  const accentC = '#5BA058';
  const frameC  = '#3A6A38';

  return (
    <group position={[0, hover ? 0.15 : 0, 0]}>
      {/* ── Foundation ── */}
      <mesh position={[0, -1.88, 0]} castShadow>
        <boxGeometry args={[5.2, 0.3, 4.4, 5, 1, 4]} />
        <meshToonMaterial color="#4A6A48" />
      </mesh>

      {/* ── Main building — clean white ── */}
      <mesh position={[0, -0.05, 0]} castShadow>
        <boxGeometry args={[4.6, 3.6, 3.8, 5, 5, 4]} />
        <meshToonMaterial color={wallC} map={tex?.mudBrick ?? undefined} />
      </mesh>

      {/* ── Living green roof ── */}
      <mesh position={[0, 1.88, 0]} castShadow>
        <boxGeometry args={[4.9, 0.42, 4.1, 5, 1, 4]} />
        <meshToonMaterial color={greenC} />
      </mesh>
      {/* Wildflower patches on roof */}
      {[[-0.8, 0, -0.5], [0.6, 0, 0.8], [-0.3, 0, 1.0]].map((p, i) => (
        <mesh key={i} position={[p[0], 2.15, p[2]]}>
          <sphereGeometry args={[0.18, 10, 7]} />
          <meshToonMaterial color={['#FFD700', '#FF6B6B', '#C084FC'][i]} />
        </mesh>
      ))}
      {/* Raised clerestory */}
      <mesh position={[0, 2.32, 0]} castShadow>
        <boxGeometry args={[3.0, 0.88, 2.5, 3, 2, 3]} />
        <meshToonMaterial color="#DFF0E0" />
      </mesh>
      {/* Clerestory windows */}
      <mesh position={[0, 2.32, 1.26]}>
        <boxGeometry args={[2.6, 0.55, 0.06, 4, 1, 1]} />
        <meshToonMaterial color="#A8D8FF" transparent opacity={0.65} />
      </mesh>

      {/* ── Curtain wall glass panels — front ── */}
      {[-1.35, 0, 1.35].map((x, i) => (
        <mesh key={i} position={[x, 0.0, 1.92]}>
          <boxGeometry args={[1.15, 2.8, 0.08, 2, 5, 1]} />
          <meshToonMaterial color="#B8E4FF" transparent opacity={0.58} />
        </mesh>
      ))}
      {/* Frame uprights */}
      {[-1.93, -0.78, 0.78, 1.93].map((x, i) => (
        <mesh key={i} position={[x, 0.0, 1.93]}>
          <boxGeometry args={[0.075, 3.65, 0.085, 1, 5, 1]} />
          <meshToonMaterial color={frameC} />
        </mesh>
      ))}

      {/* ── Green cross emblem ── */}
      <mesh position={[0, 0.85, 1.96]}>
        <boxGeometry args={[0.22, 1.0, 0.07, 1, 3, 1]} />
        <meshToonMaterial color="#18A34A" />
      </mesh>
      <mesh position={[0, 0.85, 1.96]}>
        <boxGeometry args={[1.0, 0.22, 0.07, 3, 1, 1]} />
        <meshToonMaterial color="#18A34A" />
      </mesh>

      {/* ── Sliding glass door ── */}
      <mesh position={[0, -0.4, 1.95]}>
        <boxGeometry args={[1.5, 2.4, 0.06, 3, 5, 1]} />
        <meshToonMaterial color="#88CCFF" transparent opacity={0.45} />
      </mesh>
      {/* Door rail */}
      <mesh position={[0, 0.85, 1.93]}>
        <boxGeometry args={[1.6, 0.05, 0.08, 3, 1, 1]} />
        <meshToonMaterial color={frameC} />
      </mesh>
      <mesh position={[0, -1.65, 1.93]}>
        <boxGeometry args={[1.6, 0.05, 0.08, 3, 1, 1]} />
        <meshToonMaterial color={frameC} />
      </mesh>

      {/* ── Healing herb garden ── */}
      <mesh position={[2.6, -1.62, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.05, 20]} />
        <meshToonMaterial color="#2A5A20" />
      </mesh>
      {/* Garden beds */}
      {[[0, 0], [0.55, 0.5], [-0.45, 0.5], [0.1, -0.6]].map(([ox, oz], i) => (
        <mesh key={i} position={[2.6 + ox, -1.58, oz]}>
          <sphereGeometry args={[0.18, 10, 7]} scale={[1, 0.5, 1] as any} />
          <meshToonMaterial color={['#4A8030', '#5A9040', '#3A7020', '#60A048'][i]} />
        </mesh>
      ))}
      {/* Garden border stones */}
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2;
        return (
          <mesh key={i} position={[2.6 + Math.cos(a) * 1.02, -1.62, Math.sin(a) * 1.02]}>
            <boxGeometry args={[0.14, 0.14, 0.14, 1, 1, 1]} />
            <meshToonMaterial color="#7A7068" />
          </mesh>
        );
      })}

      {/* ── Steam from hot spring / apothecary cauldron ── */}
      <instancedMesh ref={steamRef} args={[undefined, undefined, 3]}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshBasicMaterial color="#FFFFFF" transparent opacity={0.28} />
      </instancedMesh>

      {/* ── Windows back and side ── */}
      <RichWindow pos={[-1.5, 0.5, -1.92]} frame={frameC} glass="#B8E4FF" />
      <RichWindow pos={[1.5, 0.5, -1.92]}  frame={frameC} glass="#B8E4FF" />
      <RichWindow pos={[-2.32, 0.5, -0.5]} w={0.5} frame={frameC} glass="#B8E4FF" />
      <RichWindow pos={[2.32, 0.5, -0.5]}  w={0.5} frame={frameC} glass="#B8E4FF" />

      {/* ── Access ramp ── */}
      <mesh position={[0, -1.42, 2.62]} rotation={[0.22, 0, 0]} castShadow>
        <boxGeometry args={[2.4, 0.1, 1.6, 3, 1, 2]} />
        <meshToonMaterial color="#D0E8D0" />
      </mesh>
      {/* Ramp railing */}
      {[-1.1, 1.1].map((x, i) => (
        <mesh key={i} position={[x, -1.2, 2.62]} rotation={[0.22, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 1.65, 8, 2]} />
          <meshToonMaterial color={frameC} />
        </mesh>
      ))}
    </group>
  );
}

// ─── HUT — Dogon compound × Bamana earthen home ───────────────────────────────
export function HutBuilding({ hover }: { hover: boolean }) {
  const tex = useMemo(() => getTex(), []);
  const groupRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.position.y = hover ? Math.sin(clock.elapsedTime * 1.8) * 0.03 + 0.15 : 0;
  });

  const mud    = '#B87848';
  const mudDk  = '#8A5A28';
  const thatch = '#9A7820';
  const wood   = '#5A3A10';
  const deco   = '#D8A840';
  const red    = '#A83020';

  return (
    <group ref={groupRef}>
      {/* ── Foundation terrace ── */}
      <mesh position={[0, -1.85, 0]} castShadow>
        <boxGeometry args={[4.8, 0.28, 4.0, 5, 1, 4]} />
        <meshToonMaterial color={mudDk} />
      </mesh>

      {/* ── Main dwelling — thick mud-brick walls ── */}
      {/* Left wall */}
      <mesh position={[-1.95, -0.25, 0]} castShadow>
        <boxGeometry args={[0.45, 3.0, 3.6, 1, 5, 4]} />
        <meshToonMaterial color={mud} />
      </mesh>
      {/* Right wall */}
      <mesh position={[1.95, -0.25, 0]} castShadow>
        <boxGeometry args={[0.45, 3.0, 3.6, 1, 5, 4]} />
        <meshToonMaterial color={mud} />
      </mesh>
      {/* Back wall */}
      <mesh position={[0, -0.25, -1.78]} castShadow>
        <boxGeometry args={[3.9, 3.0, 0.45, 5, 5, 1]} />
        <meshToonMaterial color={mudDk} />
      </mesh>
      {/* Front wall — split */}
      <mesh position={[-1.12, -0.25, 1.78]} castShadow>
        <boxGeometry args={[1.5, 3.0, 0.45, 2, 5, 1]} />
        <meshToonMaterial color={mud} />
      </mesh>
      <mesh position={[1.12, -0.25, 1.78]} castShadow>
        <boxGeometry args={[1.5, 3.0, 0.45, 2, 5, 1]} />
        <meshToonMaterial color={mud} />
      </mesh>

      {/* ── Flat roof with parapet ── */}
      <mesh position={[0, 1.32, 0]} castShadow>
        <boxGeometry args={[4.0, 0.22, 3.6, 5, 1, 4]} />
        <meshToonMaterial color={mudDk} />
      </mesh>
      {/* Parapet walls */}
      {[[0, 1.62, 1.8, 4.0, 0.45, 0.28],
        [0, 1.62, -1.8, 4.0, 0.45, 0.28],
        [1.96, 1.62, 0, 0.28, 0.45, 3.6],
        [-1.96, 1.62, 0, 0.28, 0.45, 3.6],
      ].map(([x, y, z, w, h, d], i) => (
        <mesh key={i} position={[x, y, z] as [number,number,number]} castShadow>
          <boxGeometry args={[w, h, d, 3, 2, 2] as any} />
          <meshToonMaterial color={mudDk} />
        </mesh>
      ))}

      {/* ── Dogon facade decoration ── */}
      {/* Vertical relief strips */}
      {[-1.2, -0.4, 0.4, 1.2].map((x, i) => (
        <mesh key={i} position={[x, 0, 1.8]}>
          <boxGeometry args={[0.1, 2.8, 0.1, 1, 8, 1]} />
          <meshToonMaterial color={mudDk} />
        </mesh>
      ))}
      {/* Decorative gold band */}
      <mesh position={[0, 0.55, 1.82]}>
        <boxGeometry args={[3.9, 0.28, 0.1, 8, 1, 1]} />
        <meshToonMaterial color={deco} />
      </mesh>
      {/* Red ochre band */}
      <mesh position={[0, -0.5, 1.82]}>
        <boxGeometry args={[3.9, 0.16, 0.1, 8, 1, 1]} />
        <meshToonMaterial color={red} />
      </mesh>
      {/* Ancestral spirit niches */}
      {[-1.1, 0, 1.1].map((x, i) => (
        <group key={i} position={[x, -0.15, 1.84]}>
          <mesh>
            <boxGeometry args={[0.38, 0.55, 0.06, 2, 3, 1]} />
            <meshToonMaterial color={mudDk} />
          </mesh>
          <mesh position={[0, 0.28, 0.04]}>
            <coneGeometry args={[0.19, 0.2, 14, 2]} />
            <meshToonMaterial color={deco} />
          </mesh>
        </group>
      ))}
      {/* Symbolic chevron carvings */}
      {[-0.75, 0, 0.75].map((x, i) => (
        <mesh key={i} position={[x, 0.2, 1.84]}>
          <boxGeometry args={[0.18, 0.18, 0.04, 2, 2, 1]} />
          <meshToonMaterial color={red} />
        </mesh>
      ))}

      {/* ── Carved wooden doorway ── */}
      <mesh position={[0, -0.7, 1.82]} castShadow>
        <boxGeometry args={[0.78, 1.55, 0.14, 2, 6, 1]} />
        <meshToonMaterial color={wood} />
      </mesh>
      {/* Carved door panel */}
      <mesh position={[0, -0.7, 1.9]}>
        <boxGeometry args={[0.68, 1.42, 0.04, 4, 9, 1]} />
        <meshToonMaterial color="#3A2008" />
      </mesh>
      {/* Door bolt */}
      <mesh position={[0.2, -0.7, 1.95]}>
        <boxGeometry args={[0.32, 0.065, 0.055, 3, 1, 1]} />
        <meshToonMaterial color={deco} />
      </mesh>
      {/* Lintel carving */}
      <mesh position={[0, 0.12, 1.82]}>
        <boxGeometry args={[0.85, 0.2, 0.14, 4, 2, 1]} />
        <meshToonMaterial color={deco} />
      </mesh>

      {/* ── Four cylindrical granaries ── */}
      {[
        [-1.7, -1.6] as [number,number], [-1.7, 1.6] as [number,number],
        [1.7, -1.6] as [number,number],  [1.7, 1.6] as [number,number],
      ].map(([x, z], i) => (
        <group key={i} position={[x, -1.0, z]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.55, 0.62, 1.9, 28, 6]} />
            <meshToonMaterial color={mud} map={tex?.mudBrick ?? undefined} />
          </mesh>
          {/* Painted band */}
          <mesh position={[0, 0.1, 0]}>
            <cylinderGeometry args={[0.63, 0.63, 0.2, 28, 1, true]} />
            <meshToonMaterial color={red} />
          </mesh>
          {/* Zigzag decoration */}
          <mesh position={[0, 0.42, 0]}>
            <cylinderGeometry args={[0.63, 0.63, 0.1, 28, 1, true]} />
            <meshToonMaterial color={deco} />
          </mesh>
          {/* Thatched cap */}
          <mesh position={[0, 1.12, 0]} castShadow>
            <coneGeometry args={[0.72, 0.82, 28, 5]} />
            <meshToonMaterial color={thatch} />
          </mesh>
          <mesh position={[0, 1.58, 0]}>
            <sphereGeometry args={[0.1, 14, 10]} />
            <meshToonMaterial color={wood} />
          </mesh>
          {/* Foundation ring */}
          <mesh position={[0, -0.98, 0]}>
            <cylinderGeometry args={[0.68, 0.68, 0.1, 28, 1]} />
            <meshToonMaterial color={mudDk} />
          </mesh>
        </group>
      ))}

      {/* ── Toguna — community meeting shelter ── */}
      <group position={[0, -1.1, 2.85]}>
        {[-1.0, 0, 1.0].map((x, i) => (
          <mesh key={i} position={[x, 0.38, 0]} castShadow>
            <cylinderGeometry args={[0.085, 0.11, 1.5, 14, 3]} />
            <meshToonMaterial color={wood} />
          </mesh>
        ))}
        <mesh position={[0, 1.22, 0]} castShadow>
          <boxGeometry args={[2.8, 0.2, 1.3, 4, 1, 2]} />
          <meshToonMaterial color={mudDk} />
        </mesh>
        <mesh position={[0, 1.38, 0]} castShadow>
          <boxGeometry args={[3.0, 0.25, 1.5, 4, 1, 2]} />
          <meshToonMaterial color={thatch} />
        </mesh>
        {/* Millet stalks */}
        {[-0.8, 0, 0.8].map((x, i) => (
          <mesh key={i} position={[x, 1.52, 0.12]}>
            <boxGeometry args={[0.1, 0.14, 1.05, 2, 1, 3]} />
            <meshToonMaterial color="#C8A030" />
          </mesh>
        ))}
      </group>

      {/* ── Binu ancestral shrine ── */}
      <group position={[-2.3, -0.85, 0.5]}>
        <mesh castShadow>
          <boxGeometry args={[0.32, 1.5, 0.32, 2, 6, 2]} />
          <meshToonMaterial color={mud} />
        </mesh>
        <mesh position={[0, 0.9, 0]} castShadow>
          <boxGeometry args={[0.48, 0.48, 0.48, 2, 2, 2]} />
          <meshToonMaterial color={mudDk} />
        </mesh>
        <mesh position={[0, 0.9, 0.26]}>
          <boxGeometry args={[0.32, 0.32, 0.06, 3, 3, 1]} />
          <meshToonMaterial color={red} />
        </mesh>
        {/* Offering bowl */}
        <mesh position={[0, 1.15, 0]}>
          <cylinderGeometry args={[0.2, 0.13, 0.1, 22, 2]} />
          <meshToonMaterial color={deco} />
        </mesh>
      </group>

      {/* ── Courtyard potted plants ── */}
      {[[-1.5, 2.2], [1.5, 2.2]].map(([x, z], i) => (
        <group key={i} position={[x, -1.58, z]}>
          <mesh>
            <cylinderGeometry args={[0.2, 0.16, 0.32, 14, 2]} />
            <meshToonMaterial color="#8A5828" />
          </mesh>
          <mesh position={[0, 0.3, 0]}>
            <sphereGeometry args={[0.22, 12, 9]} />
            <meshToonMaterial color="#3A7020" />
          </mesh>
          <mesh position={[0.1, 0.46, 0.1]}>
            <sphereGeometry args={[0.075, 8, 6]} />
            <meshToonMaterial color="#FF6060" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ─── SPIRIT SHRINE — Kemetic obelisk × Sacred crystal formation ───────────────
export function SpiritShrine({ hover }: { hover: boolean }) {
  const tex = useMemo(() => getTex(), []);
  const crystalRef = useRef<THREE.Group>(null);
  const orbRef     = useRef<THREE.Mesh>(null);
  const glowRef    = useRef<THREE.Mesh>(null);
  const ringsRef   = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (crystalRef.current)  crystalRef.current.rotation.y  = t * 0.38;
    if (ringsRef.current)    ringsRef.current.rotation.y    = -t * 0.22;
    if (orbRef.current) {
      orbRef.current.position.y = Math.sin(t * 1.3) * 0.18 + 1.85;
      const mat = orbRef.current.material as THREE.MeshToonMaterial;
      mat.opacity = 0.62 + Math.sin(t * 2.1) * 0.22;
    }
    if (glowRef.current) {
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.08 + Math.sin(t * 1.8) * 0.05;
    }
  });

  return (
    <group position={[0, hover ? 0.15 : 0, 0]}>
      {/* ── Stepped ziggurat base — 4 tiers ── */}
      {[0, 1, 2, 3].map(tier => (
        <mesh key={tier} position={[0, -1.82 + tier * 0.4, 0]} castShadow>
          <cylinderGeometry args={[2.3 - tier * 0.45, 2.3 - tier * 0.45 + 0.15, 0.4, 40, 2]} />
          <meshToonMaterial color={['#1E1828', '#28203A', '#32284A', '#3C3058'][tier]} />
        </mesh>
      ))}
      {/* Tier accent rings — gold */}
      {[0, 1, 2, 3].map(tier => (
        <mesh key={tier} position={[0, -1.62 + tier * 0.4, 0]}>
          <cylinderGeometry args={[2.32 - tier * 0.45, 2.32 - tier * 0.45, 0.06, 40, 1, true]} />
          <meshToonMaterial color="#C8A030" />
        </mesh>
      ))}

      {/* ── Central Kemetic obelisk ── */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[0.65, 4.1, 0.65, 2, 10, 2]} />
        <meshToonMaterial color="#1A1640" />
      </mesh>
      {/* Obelisk hieroglyph bands */}
      {[-1.0, -0.2, 0.6, 1.4].map((y, i) => (
        <mesh key={i} position={[0, y, 0.33]}>
          <boxGeometry args={[0.62, 0.18, 0.04, 4, 2, 1]} />
          <meshToonMaterial color="#8A7020" />
        </mesh>
      ))}
      {/* Gold pyramid cap */}
      <mesh position={[0, 2.45, 0]} castShadow>
        <coneGeometry args={[0.46, 0.85, 4, 4]} />
        <meshToonMaterial color="#D4A820" />
      </mesh>
      {/* Capstone glow */}
      <mesh position={[0, 2.9, 0]}>
        <sphereGeometry args={[0.12, 14, 10]} />
        <meshToonMaterial color="#FFE060" />
      </mesh>

      {/* ── Rotating crystal formation ── */}
      <group ref={crystalRef} position={[0, 0.4, 0]}>
        {[0, 60, 120, 180, 240, 300].map((deg, i) => {
          const a = (deg * Math.PI) / 180;
          const r = 1.55;
          const colors = ['#7C3AED', '#1877F2', '#059669', '#BE185D', '#7C3AED', '#D97706'];
          return (
            <group key={i} position={[Math.cos(a) * r, 0, Math.sin(a) * r]}>
              <mesh castShadow>
                <octahedronGeometry args={[0.3, 0]} />
                <meshToonMaterial color={colors[i]} />
              </mesh>
              {/* Crystal glow */}
              <mesh>
                <sphereGeometry args={[0.22, 10, 8]} />
                <meshBasicMaterial color={colors[i]} transparent opacity={0.18} />
              </mesh>
            </group>
          );
        })}
        {/* Outer torus ring */}
        <mesh>
          <torusGeometry args={[1.55, 0.06, 12, 60]} />
          <meshToonMaterial color="#7C3AED" transparent opacity={0.65} />
        </mesh>
        {/* Inner ring */}
        <mesh position={[0, 0.5, 0]} rotation={[Math.PI / 3, 0, 0]}>
          <torusGeometry args={[0.9, 0.04, 10, 48]} />
          <meshToonMaterial color="#1877F2" transparent opacity={0.5} />
        </mesh>
      </group>

      {/* ── Outer counter-rotating rings ── */}
      <group ref={ringsRef} position={[0, 0.4, 0]}>
        <mesh rotation={[Math.PI / 4, 0, 0]}>
          <torusGeometry args={[1.9, 0.03, 8, 60]} />
          <meshBasicMaterial color="#A78BFA" transparent opacity={0.35} />
        </mesh>
        <mesh rotation={[-Math.PI / 4, Math.PI / 3, 0]}>
          <torusGeometry args={[2.1, 0.03, 8, 60]} />
          <meshBasicMaterial color="#60A5FA" transparent opacity={0.28} />
        </mesh>
      </group>

      {/* ── Floating central orb ── */}
      <mesh ref={orbRef} position={[0, 1.85, 0]}>
        <sphereGeometry args={[0.52, 34, 26]} />
        <meshToonMaterial color="#60A5FA" transparent opacity={0.75} />
      </mesh>
      {/* Inner bright core */}
      <mesh position={[0, 1.85, 0]}>
        <sphereGeometry args={[0.28, 24, 18]} />
        <meshToonMaterial color="#E8EEFF" />
      </mesh>

      {/* ── Ground glow ── */}
      <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[2.8, 48]} />
        <meshBasicMaterial color="#7C3AED" transparent opacity={0.08} />
      </mesh>

      {/* ── 4 Corner obelisks ── */}
      {[[-1.8, -1.8], [1.8, -1.8], [-1.8, 1.8], [1.8, 1.8]].map(([x, z], i) => (
        <group key={i} position={[x, -0.85, z]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.14, 0.18, 2.0, 16, 5]} />
            <meshToonMaterial color="#28204A" />
          </mesh>
          <mesh position={[0, 1.1, 0]} castShadow>
            <coneGeometry args={[0.2, 0.4, 4, 2]} />
            <meshToonMaterial color="#C8A030" />
          </mesh>
          <mesh position={[0, 1.32, 0]}>
            <octahedronGeometry args={[0.1, 0]} />
            <meshToonMaterial color="#7C3AED" />
          </mesh>
        </group>
      ))}

      {/* ── Portal arch entrance ── */}
      <group position={[0, -0.5, 2.35]}>
        {[-0.55, 0.55].map((x, i) => (
          <mesh key={i} position={[x, 0.55, 0]} castShadow>
            <boxGeometry args={[0.3, 2.1, 0.3, 2, 6, 2]} />
            <meshToonMaterial color="#3C2E58" />
          </mesh>
        ))}
        <mesh position={[0, 1.65, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.58, 0.15, 10, 22, Math.PI]} />
          <meshToonMaterial color="#4D3F6A" />
        </mesh>
        {/* Portal glow fill */}
        <mesh position={[0, 0.58, 0]}>
          <boxGeometry args={[0.85, 1.65, 0.04, 2, 4, 1]} />
          <meshToonMaterial color="#7C3AED" transparent opacity={0.28} />
        </mesh>
        {/* Portal rune marks */}
        {[-0.25, 0, 0.25].map((x, i) => (
          <mesh key={i} position={[x, 0.0, 0.04]}>
            <circleGeometry args={[0.065, 6]} />
            <meshBasicMaterial color="#A78BFA" />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// ─── PAVILION — Open-air screening & concert amphitheater ─────────────────────
// An open pavilion with a large screen wall, curved seating tiers, and
// hanging lanterns. Inspired by Greek amphitheater × African gathering circle.
export function PavilionBuilding({ hover }: { hover: boolean }) {
  const tex = useMemo(() => getTex(), []);
  const screenRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!screenRef.current) return;
    const mat = screenRef.current.material as THREE.MeshBasicMaterial;
    // Screen glows slightly when hovered
    mat.color.setHex(hover ? 0x3344AA : 0x1A1A3A);
  });

  const stoneC  = '#5A5268';
  const woodC   = '#4A3018';
  const roofC   = '#2D1A40';
  const accentC = '#6366F1';

  return (
    <group position={[0, hover ? 0.15 : 0, 0]}>
      {/* Foundation platform */}
      <mesh position={[0, -1.88, 0]} castShadow>
        <cylinderGeometry args={[5.5, 6.0, 0.32, 32, 2]} />
        <meshToonMaterial color={stoneC} />
      </mesh>
      {/* Seating tiers — semicircular */}
      {[0, 1, 2, 3].map(tier => (
        <mesh key={tier} position={[0, -1.42 + tier * 0.38, 0]}>
          <cylinderGeometry args={[2.2 + tier * 0.8, 2.2 + tier * 0.8 + 0.6, 0.38, 36, 2, false, Math.PI * 0.08, Math.PI * 1.84]} />
          <meshToonMaterial color={tier % 2 === 0 ? '#3D3050' : '#302840'} />
        </mesh>
      ))}
      {/* Stage platform */}
      <mesh position={[0, -1.52, -2.0]} castShadow>
        <cylinderGeometry args={[2.0, 2.0, 0.28, 32, 2]} />
        <meshToonMaterial color={stoneC} />
      </mesh>
      {/* Screen wall — back of stage */}
      <mesh position={[0, 0.2, -3.8]} castShadow>
        <boxGeometry args={[5.0, 3.5, 0.4, 4, 3, 1]} />
        <meshToonMaterial color="#2A2440" />
      </mesh>
      {/* Screen surface — glows */}
      <mesh ref={screenRef} position={[0, 0.3, -3.62]}>
        <boxGeometry args={[4.2, 2.8, 0.05, 3, 2, 1]} />
        <meshBasicMaterial color="#1A1A3A" />
      </mesh>
      {/* Indigo glow from screen */}
      <mesh position={[0, 0.3, -3.5]}>
        <boxGeometry args={[4.6, 3.2, 0.02, 1, 1, 1]} />
        <meshBasicMaterial color={accentC} transparent opacity={0.08} />
      </mesh>
      {/* Side columns flanking screen */}
      {[-2.8, 2.8].map((x, i) => (
        <group key={i} position={[x, -0.5, -3.6]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.18, 0.22, 4.0, 16, 4]} />
            <meshToonMaterial color={stoneC} />
          </mesh>
          <mesh position={[0, 2.1, 0]}>
            <sphereGeometry args={[0.22, 14, 10]} />
            <meshToonMaterial color={accentC} />
          </mesh>
        </group>
      ))}
      {/* Roof canopy — covers stage area */}
      <mesh position={[0, 1.85, -2.4]} castShadow>
        <boxGeometry args={[5.8, 0.2, 3.5, 4, 1, 3]} />
        <meshToonMaterial color={roofC} />
      </mesh>
      {/* Roof arch */}
      <mesh position={[0, 2.18, -2.4]}>
        <coneGeometry args={[3.2, 1.2, 28, 3]} />
        <meshToonMaterial color={roofC} />
      </mesh>
      {/* Hanging lanterns above seating */}
      {[-2.0, 0, 2.0].map((x, i) => (
        <group key={i} position={[x, 1.6, -0.5]}>
          <mesh>
            <cylinderGeometry args={[0.04, 0.04, 1.8, 8, 2]} />
            <meshToonMaterial color={woodC} />
          </mesh>
          <mesh position={[0, -1.0, 0]}>
            <boxGeometry args={[0.26, 0.26, 0.26, 2, 2, 2]} />
            <meshToonMaterial color={accentC} transparent opacity={0.7} />
          </mesh>
        </group>
      ))}
      {/* Billboard sign */}
      <mesh position={[0, 2.6, -3.85]}>
        <boxGeometry args={[2.2, 0.5, 0.08, 3, 1, 1]} />
        <meshToonMaterial color={accentC} />
      </mesh>
      {/* Steps up to stage */}
      {[0, 1, 2].map(i => (
        <mesh key={i} position={[0, -1.62 + i * 0.18, -0.2 - i * 0.2]} castShadow>
          <boxGeometry args={[3.0 - i * 0.15, 0.18, 0.55, 3, 1, 1]} />
          <meshToonMaterial color="#4A4258" />
        </mesh>
      ))}
    </group>
  );
}
