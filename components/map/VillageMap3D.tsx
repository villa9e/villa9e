'use client';
import { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { Text, OrthographicCamera } from '@react-three/drei';
import { useRouter } from 'next/navigation';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { useWeather } from '@/lib/theme/useWeather';
import * as THREE from 'three';

// ─── Shading rules ─────────────────────────────────────────────────────────────
// SMOOTH (flatShading: false):
//   • Any curved geometry: spheres, cylinders, capsules, cones with 8+ sides
//   • Organic shapes: trees, rocks, flames
//   • Auto-smoothing via computeVertexNormals() on all smooth geometries
// SHARP (flatShading: true / hard edges):
//   • 4-sided pyramid roofs — face-flat is intentional and architectural
//   • Box geometry corners — 90° = crease, naturally hard
// HYBRID (smooth body, hard base/cap):
//   • Cylinder: smooth sides, flat top/bottom cap — achieved by capping segments
//   • Cone roof with 12+ sides: smooth like a true dome cone

// Smooth material factory — no block angles
function smoothMat(color: string, emissive?: string) {
  return new THREE.MeshToonMaterial({
    color,
    emissive: emissive ?? '#000000',
    emissiveIntensity: emissive ? 0.15 : 0,
    // flatShading: false is the default — smooth interpolation between vertices
  });
}

// Hard-edge material — for intentionally angular architectural faces
function hardMat(color: string) {
  const mat = new THREE.MeshToonMaterial({ color });
  mat.flatShading = true;
  return mat;
}

// ─── Locations ────────────────────────────────────────────────────────────────
const LOCATIONS = [
  { id: 'workshop',     label: 'Workshop',     href: '/village/workshop',     pos: [-4.5, 0, -2.5] as [number,number,number], color: '#E8770A', roofColor: '#C45E00', height: 2.6, roof: 'pyramid' },
  { id: 'dreamline',   label: 'Dream Line',   href: '/village/dreamline',    pos: [4.5,  0, -2.5] as [number,number,number], color: '#7C3AED', roofColor: '#5B21B6', height: 2.2, roof: 'dome' },
  { id: 'trading-post',label: 'Trading Post', href: '/village/trading-post', pos: [-4.5, 0, 2.5]  as [number,number,number], color: '#059669', roofColor: '#047857', height: 2.0, roof: 'flat' },
  { id: 'bank',         label: 'Bank',         href: '/village/bank',         pos: [4.5,  0, 2.5]  as [number,number,number], color: '#D97706', roofColor: '#B45309', height: 2.4, roof: 'pyramid' },
  { id: 'zen',          label: 'Zen',          href: '/village/zen',           pos: [-6.5, 0, 0]    as [number,number,number], color: '#0D9488', roofColor: '#0F766E', height: 1.8, roof: 'dome' },
  { id: 'tribes',       label: 'Tribes',       href: '/village/tribes',        pos: [6.5,  0, 0]    as [number,number,number], color: '#BE185D', roofColor: '#9D174D', height: 2.0, roof: 'pyramid' },
  { id: 'hospital',     label: 'Hospital',     href: '/village/hospital',      pos: [0,    0, -5.5] as [number,number,number], color: '#16A34A', roofColor: '#15803D', height: 2.2, roof: 'dome' },
  { id: 'hut',          label: 'My Hut',       href: '/village/hut',           pos: [0,    0, 4.5]  as [number,number,number], color: '#EA580C', roofColor: '#C2410C', height: 1.8, roof: 'pyramid' },
  { id: 'spirit',       label: 'Spirit',       href: '/village/spirit',        pos: [0,    0, 0]    as [number,number,number], color: '#1877F2', roofColor: '#1D4ED8', height: 1.4, roof: 'orb' },
];

// ─── Smooth sphere geometry helper ────────────────────────────────────────────
// Creates a sphere with normals computed for max smoothness
function SmoothSphere({ r, ws = 16, hs = 12, ...props }: any) {
  const geo = useMemo(() => {
    const g = new THREE.SphereGeometry(r, ws, hs);
    g.computeVertexNormals(); // force smooth normals
    return g;
  }, [r, ws, hs]);
  return <mesh geometry={geo} {...props} />;
}

// ─── Tree — smooth organic, baobab-inspired ───────────────────────────────────
function Tree({ pos, scale = 1 }: { pos: [number,number,number]; scale?: number }) {
  const ref = useRef<THREE.Group>(null);

  // Smooth geometries — high enough verts to avoid block angles
  const trunkGeo = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.15, 0.26, 0.85, 12, 2, false);
    g.computeVertexNormals();
    return g;
  }, []);

  const canopyGeos = useMemo(() => {
    // icosahedron subdivision 1 = 80 smooth-looking triangular faces
    return [
      { geo: new THREE.IcosahedronGeometry(0.72, 1), pos: [0,    1.1, 0],    color: '#2D7D46' },
      { geo: new THREE.IcosahedronGeometry(0.48, 1), pos: [0.32, 0.98, 0.22],color: '#22C55E' },
      { geo: new THREE.IcosahedronGeometry(0.42, 1), pos: [-0.28,0.92,-0.18],color: '#16A34A' },
    ].map(({ geo, ...rest }) => {
      geo.computeVertexNormals();
      return { geo, ...rest };
    });
  }, []);

  useFrame(state => {
    if (!ref.current) return;
    ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.35 + pos[0]) * 0.025;
  });

  return (
    <group ref={ref} position={pos} scale={scale}>
      {/* Trunk — smooth cylinder, flat top cap is fine (sharp is correct there) */}
      <mesh geometry={trunkGeo} position={[0, 0.42, 0]}>
        <meshToonMaterial color="#6B4226" />
      </mesh>
      {/* Canopy clusters — smooth icosahedron globes */}
      {canopyGeos.map(({ geo, pos: p, color }, i) => (
        <mesh key={i} geometry={geo} position={p as [number,number,number]}>
          <meshToonMaterial color={color} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Fire circle ──────────────────────────────────────────────────────────────
function FireCircle({ pos }: { pos: [number,number,number] }) {
  const flameRef  = useRef<THREE.Mesh>(null);
  const ember1Ref = useRef<THREE.Mesh>(null);

  // Smooth flame cone — 12 sides = no sharp polygon silhouette
  const flameGeo = useMemo(() => {
    const g = new THREE.ConeGeometry(0.18, 0.5, 12, 1, false);
    g.computeVertexNormals();
    return g;
  }, []);
  const innerGeo = useMemo(() => {
    const g = new THREE.ConeGeometry(0.1, 0.28, 10, 1, false);
    g.computeVertexNormals();
    return g;
  }, []);
  // Smooth stone — sphere segment 8 = round rock feel
  const stoneGeo = useMemo(() => {
    const g = new THREE.SphereGeometry(0.13, 8, 6);
    g.computeVertexNormals();
    return g;
  }, []);

  useFrame(state => {
    const t = state.clock.elapsedTime;
    if (flameRef.current) {
      flameRef.current.scale.x = 1 + Math.sin(t * 8.2) * 0.1;
      flameRef.current.scale.z = 1 + Math.cos(t * 7.5) * 0.08;
      flameRef.current.scale.y = 1 + Math.sin(t * 6.0) * 0.14;
    }
    if (ember1Ref.current) {
      ember1Ref.current.scale.setScalar(0.85 + Math.sin(t * 9) * 0.18);
    }
  });

  return (
    <group position={pos}>
      {/* Stone circle — smooth rounded stones */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        return (
          <mesh key={i} geometry={stoneGeo}
            position={[Math.cos(angle) * 0.52, 0.06, Math.sin(angle) * 0.52]}>
            <meshToonMaterial color="#78716C" />
          </mesh>
        );
      })}
      {/* Crossed logs — cylinder smooth */}
      {[0.4, -0.8].map((angleOffset, i) => (
        <mesh key={i} rotation={[0, angleOffset, Math.PI / 2]} position={[0, 0.08, 0]}>
          <cylinderGeometry args={[0.05, 0.07, 0.76, 8]} />
          <meshToonMaterial color="#92400E" />
        </mesh>
      ))}
      {/* Outer flame — smooth cone, no block angles */}
      <mesh ref={flameRef} geometry={flameGeo} position={[0, 0.32, 0]}>
        <meshBasicMaterial color="#FF6B2B" transparent opacity={0.92} />
      </mesh>
      {/* Inner ember — smaller smooth cone */}
      <mesh ref={ember1Ref} geometry={innerGeo} position={[0, 0.22, 0]}>
        <meshBasicMaterial color="#FFD700" transparent opacity={0.85} />
      </mesh>
      <pointLight color="#FF6B2B" intensity={1.8} distance={3.5} decay={2} />
    </group>
  );
}

// ─── Building ─────────────────────────────────────────────────────────────────
// Sharp-edge rule:
//   - Box body: 90° hard corners — correct for architecture, no fix needed
//   - Kente stripe: same, box stays hard
//   - Pyramid roof (4 sides): flatShading true — reveals 4 distinct faces intentionally
//   - Dome roof (16 sides): flatShading false + computeVertexNormals — true smooth hemisphere
//   - Orb (Spirit): icosahedron with subdivisions + smooth normals
function Building({ location, onClick, onHover, onLeave }: any) {
  const bodyRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [x, , z] = location.pos;
  const h = location.height;

  // Dome geometry — smooth hemisphere (predefined smooth, no block angles)
  const domeGeo = useMemo(() => {
    const g = new THREE.SphereGeometry(0.8, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    g.computeVertexNormals();
    return g;
  }, []);

  // Orb geometry — full icosahedron, subdivided for smooth silhouette
  const orbGeo = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(0.65, 2); // 320 smooth faces
    g.computeVertexNormals();
    return g;
  }, []);

  // Outline dome
  const domeOutlineGeo = useMemo(() => {
    const g = new THREE.SphereGeometry(0.84, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    g.computeVertexNormals();
    return g;
  }, []);

  useFrame(state => {
    if (!bodyRef.current) return;
    const t = state.clock.elapsedTime;
    bodyRef.current.position.y = hovered ? 0.28 : Math.sin(t * 0.55 + x * 0.5) * 0.06;
  });

  const bodyColor  = hovered ? location.roofColor : '#F2EDE3';
  const outlineOp  = hovered ? 0.85 : 0.28;

  return (
    <group position={[x, 0, z]}>
      {/* Drop shadow — soft circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <circleGeometry args={[0.85, 20]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.1} />
      </mesh>

      <group ref={bodyRef}>
        {/* ── BODY — Box: 90° corners are intentionally sharp ── */}
        {/* Outline shell (slightly larger box) */}
        <mesh>
          <boxGeometry args={[1.38, h + 0.05, 1.38]} />
          <meshBasicMaterial color="#111111" transparent opacity={outlineOp} />
        </mesh>
        {/* Main body */}
        <mesh
          onClick={onClick}
          onPointerOver={() => { setHovered(true); onHover?.(); document.body.style.cursor = 'pointer'; }}
          onPointerOut={() => { setHovered(false); onLeave?.(); document.body.style.cursor = 'default'; }}
        >
          <boxGeometry args={[1.3, h, 1.3]} />
          <meshToonMaterial color={bodyColor} />
        </mesh>

        {/* ── KENTE BANDS — architectural, box stays sharp ── */}
        <mesh position={[0, h * 0.32, 0]}>
          <boxGeometry args={[1.32, h * 0.18, 1.32]} />
          <meshToonMaterial color={location.color} />
        </mesh>
        <mesh position={[0, h * 0.11, 0]}>
          <boxGeometry args={[1.32, h * 0.055, 1.32]} />
          <meshToonMaterial color={location.roofColor} />
        </mesh>

        {/* ── ROOF — rule based on shape ── */}

        {/* PYRAMID: 4-sided, flatShading TRUE — each face distinct, architectural */}
        {location.roof === 'pyramid' && (
          <>
            {/* Outline */}
            <mesh position={[0, h * 0.5 + 0.52, 0]}>
              <coneGeometry args={[1.06, 1.08, 4]} />
              <meshBasicMaterial color="#111111" transparent opacity={outlineOp * 0.7} side={THREE.BackSide} />
            </mesh>
            <mesh position={[0, h * 0.5 + 0.52, 0]}>
              {/* 4 sides, flatShading: true = each triangular face reads clearly */}
              <coneGeometry args={[1.0, 1.0, 4]} />
              <meshToonMaterial color={location.color} flatShading={true} />
            </mesh>
            {/* Spire tip — smooth sphere cap */}
            <SmoothSphere r={0.1} ws={8} hs={6} position={[0, h * 0.5 + 1.05, 0]}>
              <meshToonMaterial color={location.roofColor} />
            </SmoothSphere>
          </>
        )}

        {/* DOME: 16 radial segments + computeVertexNormals = NO block angles */}
        {location.roof === 'dome' && (
          <>
            {/* Outline — backside slightly larger smooth dome */}
            <mesh geometry={domeOutlineGeo} position={[0, h * 0.5, 0]}>
              <meshBasicMaterial color="#111111" transparent opacity={outlineOp * 0.6} side={THREE.BackSide} />
            </mesh>
            {/* Smooth dome */}
            <mesh geometry={domeGeo} position={[0, h * 0.5, 0]}>
              <meshToonMaterial color={location.color} />
            </mesh>
            {/* Smooth lantern on top */}
            <SmoothSphere r={0.15} ws={10} hs={8} position={[0, h * 0.5 + 0.78, 0]}>
              <meshToonMaterial color={location.roofColor} />
            </SmoothSphere>
          </>
        )}

        {/* FLAT (Trading Post) — box overhang, all hard */}
        {location.roof === 'flat' && (
          <mesh position={[0, h * 0.5 + 0.06, 0]}>
            <boxGeometry args={[1.55, 0.1, 1.55]} />
            <meshToonMaterial color={location.color} />
          </mesh>
        )}

        {/* ORB (Spirit): icosahedron subdiv 2 — 320 faces, fully smooth sphere-like */}
        {location.roof === 'orb' && (
          <>
            <mesh geometry={orbGeo} position={[0, h * 0.5 + 0.22, 0]}>
              <meshToonMaterial color={location.color} />
            </mesh>
            {/* Outer glow shell */}
            <mesh geometry={orbGeo} position={[0, h * 0.5 + 0.22, 0]}>
              <meshBasicMaterial color={location.color} transparent opacity={0.1} side={THREE.FrontSide} />
            </mesh>
            <pointLight position={[0, h * 0.5 + 0.22, 0]} color={location.color} intensity={1.0} distance={3} />
          </>
        )}

        {/* Hover ring — smooth circle */}
        {hovered && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -h / 2 + 0.04, 0]}>
            <ringGeometry args={[0.92, 1.18, 28]} />
            <meshBasicMaterial color={location.color} transparent opacity={0.5} />
          </mesh>
        )}
      </group>

      {/* Label */}
      <Text
        position={[0, h * 0.5 + (location.roof === 'pyramid' ? 1.32 : location.roof === 'orb' ? 1.05 : 1.02), 0]}
        fontSize={0.25}
        color={hovered ? location.color : '#18100A'}
        outlineColor="#FFFFFF"
        outlineWidth={0.022}
        anchorX="center"
        anchorY="middle"
      >
        {location.label}
      </Text>
    </group>
  );
}

// ─── Globally diverse indigenous NPC cultures ─────────────────────────────────
// Each entry: skin, hair, garment color, cultural accent color, headpiece
// Representing: West African, Kemetic, Native American, South Asian, Pacific Islander,
// Aboriginal Australian, Mayan/Aztec, Nordic/Celtic, Southeast Asian, Siberian, East African
const NPC_CULTURES: NPCCulture[] = [
  { skin: '#2D0F08', hair: '#1A0A00', garment: '#8B0000', accent: '#FFD700',  label: 'Kemetic',       headpiece: 'crown',   hairStyle: 'locs'     },
  { skin: '#5C3010', hair: '#1A0A00', garment: '#D97706', accent: '#16A34A',  label: 'West African',  headpiece: 'wrap',    hairStyle: 'afro'     },
  { skin: '#C87941', hair: '#1A0A00', garment: '#7C3AED', accent: '#06B6D4',  label: 'Mayan',         headpiece: 'feather', hairStyle: 'straight' },
  { skin: '#F0C27F', hair: '#3B1200', garment: '#DC2626', accent: '#FFD700',  label: 'Native Amer.',  headpiece: 'feather', hairStyle: 'braids'   },
  { skin: '#8B6347', hair: '#1A0A00', garment: '#D97706', accent: '#E8770A',  label: 'South Asian',   headpiece: 'turban',  hairStyle: 'straight' },
  { skin: '#C4A882', hair: '#1A0A00', garment: '#1877F2', accent: '#E8770A',  label: 'Pacific Isl.',  headpiece: 'none',    hairStyle: 'locs'     },
  { skin: '#3A1A08', hair: '#1A0A00', garment: '#BE185D', accent: '#FFD700',  label: 'Aboriginal',    headpiece: 'none',    hairStyle: 'afro'     },
  { skin: '#F5DEB3', hair: '#8B3A10', garment: '#2D7D46', accent: '#C4A882',  label: 'Celtic',        headpiece: 'none',    hairStyle: 'braids'   },
  { skin: '#D2B48C', hair: '#1A0A00', garment: '#FF6B2B', accent: '#7C3AED',  label: 'SE Asian',      headpiece: 'none',    hairStyle: 'bun'      },
  { skin: '#5C2A10', hair: '#1A0A00', garment: '#0D9488', accent: '#FFD700',  label: 'East African',  headpiece: 'wrap',    hairStyle: 'locs'     },
  { skin: '#C8956E', hair: '#2D1600', garment: '#3B1506', accent: '#D97706',  label: 'Siberian',      headpiece: 'wrap',    hairStyle: 'braids'   },
];

// ─── NPC — culturally diverse, bold Spider-Verse silhouette ──────────────────
interface NPCCulture {
  skin: string; hair: string; garment: string; accent: string;
  label: string;
  headpiece?: 'wrap' | 'crown' | 'feather' | 'turban' | 'none';
  hairStyle?: 'afro' | 'locs' | 'straight' | 'bun' | 'braids';
}

function NPC({ pos, culture }: { pos: [number,number,number]; culture: NPCCulture }) {
  const ref = useRef<THREE.Group>(null);
  const armRef = useRef<THREE.Mesh>(null);

  const headGeo  = useMemo(() => { const g = new THREE.SphereGeometry(0.28, 12, 10); g.computeVertexNormals(); return g; }, []);
  const afroGeo  = useMemo(() => { const g = new THREE.SphereGeometry(0.30, 10, 8); g.computeVertexNormals(); return g; }, []);
  const locsGeo  = useMemo(() => { const g = new THREE.CylinderGeometry(0.04, 0.03, 0.25, 6); g.computeVertexNormals(); return g; }, []);
  const limbGeo  = useMemo(() => { const g = new THREE.CapsuleGeometry(0.07, 0.32, 4, 8); g.computeVertexNormals(); return g; }, []);
  const bunGeo   = useMemo(() => { const g = new THREE.SphereGeometry(0.15, 8, 6); g.computeVertexNormals(); return g; }, []);

  useFrame(state => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime + pos[0] * 0.7;
    ref.current.position.y = pos[1] + Math.sin(t * 0.9) * 0.03;
    ref.current.rotation.y = Math.sin(t * 0.4 + pos[2]) * 0.12;
    if (armRef.current) {
      armRef.current.rotation.x = Math.sin(t * 1.2) * 0.15;
    }
  });

  const hairStyle = culture.hairStyle ?? 'straight';

  return (
    <group ref={ref} position={pos} scale={0.72}>
      {/* Head */}
      <mesh geometry={headGeo} position={[0, 1.35, 0]} castShadow>
        <meshToonMaterial color={culture.skin} />
      </mesh>

      {/* Hair — style varies by culture */}
      {hairStyle === 'afro' && (
        <mesh geometry={afroGeo} position={[0, 1.50, 0]} castShadow>
          <meshToonMaterial color={culture.hair} />
        </mesh>
      )}
      {hairStyle === 'locs' && (
        <>
          {[-0.12, 0, 0.12].map((x, i) => (
            <mesh key={i} geometry={locsGeo} position={[x, 1.28 - i * 0.04, 0.05]} castShadow>
              <meshToonMaterial color={culture.hair} />
            </mesh>
          ))}
          {/* Crown */}
          <mesh position={[0, 1.55, 0]}>
            <sphereGeometry args={[0.22, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
            <meshToonMaterial color={culture.hair} />
          </mesh>
        </>
      )}
      {hairStyle === 'bun' && (
        <>
          <mesh position={[0, 1.52, 0]}>
            <sphereGeometry args={[0.18, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
            <meshToonMaterial color={culture.hair} />
          </mesh>
          <mesh geometry={bunGeo} position={[0, 1.58, 0]} scale={[0.8, 0.7, 0.8]}>
            <meshToonMaterial color={culture.hair} />
          </mesh>
        </>
      )}
      {hairStyle === 'braids' && (
        <>
          {[-0.1, 0.1].map((x, i) => (
            <mesh key={i} position={[x, 1.22, 0.08]} rotation={[0.2, 0, 0]}>
              <capsuleGeometry args={[0.04, 0.22, 4, 6]} />
              <meshToonMaterial color={culture.hair} />
            </mesh>
          ))}
          <mesh position={[0, 1.52, 0]}>
            <sphereGeometry args={[0.20, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
            <meshToonMaterial color={culture.hair} />
          </mesh>
        </>
      )}
      {hairStyle === 'straight' && (
        <mesh position={[0, 1.48, 0]}>
          <sphereGeometry args={[0.24, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.65]} />
          <meshToonMaterial color={culture.hair} />
        </mesh>
      )}

      {/* Headpiece — cultural */}
      {culture.headpiece === 'crown' && (
        <mesh position={[0, 1.64, 0]}>
          <cylinderGeometry args={[0.24, 0.20, 0.14, 8, 1, true]} />
          <meshToonMaterial color={culture.accent} />
        </mesh>
      )}
      {culture.headpiece === 'wrap' && (
        <mesh position={[0, 1.55, 0]}>
          <torusGeometry args={[0.22, 0.07, 6, 12]} />
          <meshToonMaterial color={culture.garment} />
        </mesh>
      )}
      {culture.headpiece === 'feather' && (
        <mesh position={[0.02, 1.68, 0]} rotation={[0.3, 0, 0.2]}>
          <capsuleGeometry args={[0.025, 0.22, 4, 6]} />
          <meshToonMaterial color={culture.accent} />
        </mesh>
      )}
      {culture.headpiece === 'turban' && (
        <mesh position={[0, 1.54, 0]} scale={[1, 0.75, 1]}>
          <sphereGeometry args={[0.28, 10, 8]} />
          <meshToonMaterial color={culture.garment} />
        </mesh>
      )}

      {/* Eyes */}
      {[-0.09, 0.09].map((x, i) => (
        <mesh key={i} position={[x, 1.37, 0.26]}>
          <sphereGeometry args={[0.038, 6, 5]} />
          <meshBasicMaterial color="#0A0A12" />
        </mesh>
      ))}

      {/* Body — cultural garment color */}
      <mesh position={[0, 0.95, 0]} castShadow>
        <boxGeometry args={[0.38, 0.44, 0.28]} />
        <meshToonMaterial color={culture.garment} />
      </mesh>
      {/* Accent band (kente/sash/belt) */}
      <mesh position={[0, 0.88, 0]}>
        <boxGeometry args={[0.40, 0.09, 0.30]} />
        <meshToonMaterial color={culture.accent} />
      </mesh>

      {/* Arms */}
      <mesh ref={armRef} geometry={limbGeo} position={[0.25, 0.92, 0]} rotation={[0, 0, 0.3]} castShadow>
        <meshToonMaterial color={culture.skin} />
      </mesh>
      <mesh geometry={limbGeo} position={[-0.25, 0.92, 0]} rotation={[0, 0, -0.3]} castShadow>
        <meshToonMaterial color={culture.skin} />
      </mesh>

      {/* Legs */}
      <mesh geometry={limbGeo} position={[0.1, 0.54, 0]} castShadow>
        <meshToonMaterial color={culture.garment} />
      </mesh>
      <mesh geometry={limbGeo} position={[-0.1, 0.54, 0]} castShadow>
        <meshToonMaterial color={culture.garment} />
      </mesh>
    </group>
  );
}

// ─── Particle systems ──────────────────────────────────────────────────────────
function Fireflies({ count = 25, isNight = false }: { count?: number; isNight?: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const data = useMemo(() => Array.from({ length: count }, () => ({
    x: (Math.random() - 0.5) * 16, y: 0.6 + Math.random() * 2.2,
    z: (Math.random() - 0.5) * 14,
    spd: 0.3 + Math.random() * 0.7, ph: Math.random() * Math.PI * 2,
  })), [count]);

  useFrame(state => {
    if (!ref.current) return;
    const dummy = new THREE.Object3D();
    const t = state.clock.elapsedTime;
    data.forEach((p, i) => {
      dummy.position.set(
        p.x + Math.sin(t * p.spd + p.ph) * 0.9,
        p.y + Math.sin(t * p.spd * 1.3 + p.ph) * 0.5,
        p.z + Math.cos(t * p.spd * 0.7 + p.ph) * 0.7,
      );
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
    (ref.current.material as THREE.MeshBasicMaterial).opacity =
      isNight ? 0.55 + Math.sin(state.clock.elapsedTime * 3) * 0.3 : 0.18;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.045, 6, 5]} />
      <meshBasicMaterial color={isNight ? '#FFD700' : '#FFFFFF'} transparent />
    </instancedMesh>
  );
}

function StarField({ count = 100 }: { count?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const stars = useMemo(() => Array.from({ length: count }, () => ({
    x: (Math.random() - 0.5) * 42, y: 9 + Math.random() * 9,
    z: (Math.random() - 0.5) * 32, tw: Math.random() * Math.PI * 2,
  })), [count]);

  useFrame(state => {
    if (!ref.current) return;
    const dummy = new THREE.Object3D();
    const t = state.clock.elapsedTime;
    stars.forEach((s, i) => {
      dummy.position.set(s.x, s.y, s.z);
      dummy.scale.setScalar(0.65 + Math.sin(t * 1.8 + s.tw) * 0.4);
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <octahedronGeometry args={[0.06, 0]} />
      <meshBasicMaterial color="#E8D5FF" transparent opacity={0.65} />
    </instancedMesh>
  );
}

function RainParticles({ count = 120 }: { count?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const data = useMemo(() => Array.from({ length: count }, () => ({
    x: (Math.random() - 0.5) * 22, y: 5 + Math.random() * 5,
    z: (Math.random() - 0.5) * 18, spd: 4 + Math.random() * 3,
  })), [count]);

  useFrame((_, dt) => {
    if (!ref.current) return;
    const dummy = new THREE.Object3D();
    data.forEach((d, i) => {
      d.y -= d.spd * dt;
      if (d.y < 0) { d.y = 10; d.x = (Math.random() - 0.5) * 22; }
      dummy.position.set(d.x, d.y, d.z);
      dummy.scale.set(1, 4, 1);
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <capsuleGeometry args={[0.018, 0.14, 2, 4]} />
      <meshBasicMaterial color="#BFDBFE" transparent opacity={0.38} />
    </instancedMesh>
  );
}

// ─── Ground & Terrain ─────────────────────────────────────────────────────────
function HalftoneOverlay() {
  const dots = useMemo(() => {
    const d: [number,number][] = [];
    for (let x = -12; x <= 12; x += 2.5) for (let z = -10; z <= 10; z += 2.5) d.push([x, z]);
    return d;
  }, []);
  return (
    <>{dots.map(([x, z], i) => (
      <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, -0.02, z]}>
        <circleGeometry args={[0.055, 6]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.035} />
      </mesh>
    ))}</>
  );
}

const TREE_POSITIONS: [number,number,number][] = [
  [-8, 0, -6], [-7.2, 0, -3.5], [-9, 0, -1.5], [-8.2, 0, 1.2], [-9, 0, 4.2], [-7.5, 0, 6.2],
  [8.2, 0, -6], [7.2, 0, -3], [9, 0, 0.2], [8.2, 0, 3.2], [7.5, 0, 6.2],
  [-2.2, 0, -7.5], [2.2, 0, -7.5], [0, 0, -8.5],
  [-3, 0, 7.2], [3, 0, 7.2], [0, 0, 8.5],
];

function Ground({ isNight }: { isNight: boolean }) {
  const grass = isNight ? '#1A2E1A' : '#3D7A3D';
  const path  = isNight ? '#4A3E2A' : '#C4A882';

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[36, 30, 6, 6]} />
        <meshToonMaterial color={grass} />
      </mesh>
      {LOCATIONS.filter(l => l.id !== 'spirit').map(loc => {
        const [px,,pz] = loc.pos;
        const dist = Math.sqrt(px * px + pz * pz);
        const angle = Math.atan2(pz, px);
        return (
          <mesh key={loc.id} rotation={[-Math.PI / 2, -angle, 0]} position={[px / 2, 0.006, pz / 2]}>
            <planeGeometry args={[0.42, dist * 0.94]} />
            <meshToonMaterial color={path} />
          </mesh>
        );
      })}
      {/* Sacred circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[1.38, 28]} />
        <meshToonMaterial color={path} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <ringGeometry args={[1.38, 1.62, 28]} />
        <meshBasicMaterial color={isNight ? '#4A3E2A' : '#A87C5A'} transparent opacity={0.75} />
      </mesh>
      {/* Adinkra cross lines */}
      {[0, Math.PI / 4, Math.PI / 2, Math.PI * 3 / 4].map((a, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, a, 0]} position={[0, 0.013, 0]}>
          <planeGeometry args={[0.07, 2.55]} />
          <meshBasicMaterial color={isNight ? '#5A4A2A' : '#B8934A'} transparent opacity={0.55} />
        </mesh>
      ))}
      {/* Water pool near Zen — smooth circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-5.8, 0.04, 1.8]}>
        <circleGeometry args={[0.82, 18]} />
        <meshBasicMaterial color={isNight ? '#1E3A5A' : '#7EC8E3'} transparent opacity={0.82} />
      </mesh>
      <HalftoneOverlay />
    </>
  );
}

// ─── Lighting ─────────────────────────────────────────────────────────────────
function Lights({ isNight, weatherMood }: { isNight: boolean; weatherMood: string }) {
  const ambInt = isNight ? 0.32 : weatherMood === 'rainy' ? 0.55 : 0.72;
  const sunCol = isNight ? '#1A0A30' : weatherMood === 'rainy' ? '#8899AA' : '#FFF5D0';
  const sunInt = isNight ? 0.22 : weatherMood === 'rainy' ? 0.32 : 0.88;
  return (
    <>
      <ambientLight intensity={ambInt} color={isNight ? '#2A1A50' : '#FFFBF0'} />
      <directionalLight position={isNight ? [-5, 12, 4] : [-9, 16, 6]} intensity={sunInt} color={sunCol} />
      <pointLight position={[0, 8, 0]} intensity={isNight ? 0.45 : 0.12} color={isNight ? '#1877F2' : '#FFD700'} />
    </>
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────────
function Scene({ onNavigate, onHover, onLeave, isNight, weatherMood }:
  { onNavigate: (href: string) => void; onHover: (id: string) => void; onLeave: () => void; isNight: boolean; weatherMood: string }) {
  return (
    <>
      <Lights isNight={isNight} weatherMood={weatherMood} />
      <Ground isNight={isNight} />
      {TREE_POSITIONS.map((pos, i) => <Tree key={i} pos={pos} scale={0.72 + Math.sin(i * 1.4) * 0.22} />)}
      <FireCircle pos={[0, 0, 0]} />

      {/* Globally diverse NPC villagers — scattered near the fire circle */}
      {[
        { pos: [2.2,   0,  1.8],  cIdx: 0 },  // Kemetic — near hut
        { pos: [-2.0,  0,  1.6],  cIdx: 1 },  // West African — near trading post path
        { pos: [1.5,   0, -2.0],  cIdx: 2 },  // Mayan — near workshop path
        { pos: [-1.6,  0, -1.8],  cIdx: 3 },  // Native American — near zen path
        { pos: [2.8,   0,  0.2],  cIdx: 4 },  // South Asian — near tribes path
        { pos: [-2.5,  0,  0.4],  cIdx: 5 },  // Pacific Islander — near zen
        { pos: [0.8,   0,  2.8],  cIdx: 6 },  // Aboriginal — near hut
        { pos: [-0.6,  0, -2.8],  cIdx: 7 },  // Celtic — near hospital
      ].map(({ pos, cIdx }) => (
        <NPC key={cIdx}
          pos={pos as [number,number,number]}
          culture={NPC_CULTURES[cIdx % NPC_CULTURES.length]}
        />
      ))}

      {LOCATIONS.map(loc => (
        <Building key={loc.id} location={loc}
          onClick={() => onNavigate(loc.href)}
          onHover={() => onHover(loc.id)}
          onLeave={onLeave}
        />
      ))}

      <Fireflies count={isNight ? 38 : 14} isNight={isNight} />
      {isNight && <StarField count={100} />}
      {(weatherMood === 'rainy' || weatherMood === 'night_rain') && <RainParticles />}

      {/* Sky plane */}
      <mesh position={[0, 6, -20]}>
        <planeGeometry args={[55, 28]} />
        <meshBasicMaterial color={
          isNight
            ? weatherMood === 'stormy' ? '#0A0020' : '#08091A'
            : weatherMood === 'rainy' ? '#8899AA'
            : weatherMood === 'golden' ? '#FF9A3C'
            : '#87CEEB'
        } />
      </mesh>
      {/* Sun or moon — smooth sphere */}
      <mesh position={isNight ? [-8, 13, -17] : [10, 15, -17]}>
        <sphereGeometry args={[isNight ? 0.85 : 1.6, 14, 10]} />
        <meshBasicMaterial color={isNight ? '#E8D5FF' : '#FFF0A0'} />
      </mesh>
    </>
  );
}

// ─── HUD overlay ──────────────────────────────────────────────────────────────
function VillageHUD({ hoveredId, isNight }: { hoveredId: string | null; isNight: boolean }) {
  const loc = hoveredId ? LOCATIONS.find(l => l.id === hoveredId) : null;
  if (!loc) return null;
  return (
    <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-10 pointer-events-none animate-rise"
      style={{
        background: isNight ? 'rgba(18,21,42,0.95)' : 'rgba(255,255,255,0.95)',
        border: `2px solid ${loc.color}`,
        borderRadius: '16px',
        padding: '8px 18px',
        boxShadow: `0 4px 24px ${loc.color}50`,
      }}>
      <p className="font-black text-sm" style={{ color: loc.color }}>{loc.label}</p>
      <p className="text-xs" style={{ color: isNight ? '#7A7FA8' : '#9CA3AF' }}>Tap to enter</p>
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────
export default function VillageMap3D() {
  const router = useRouter();
  const { theme } = useVillageTheme();
  const { mood }  = useWeather();
  const isNight   = theme === 'night';
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const skyGradient = isNight
    ? mood === 'stormy'     ? 'linear-gradient(180deg,#0A0020 0%,#1A0A30 100%)'
    : mood === 'night_rain' ? 'linear-gradient(180deg,#0A0B1A 0%,#1A2030 100%)'
    :                         'linear-gradient(180deg,#080912 0%,#1A1A3A 60%,#0D2040 100%)'
    : mood === 'rainy'      ? 'linear-gradient(180deg,#607080 0%,#8898AA 60%,#A0B0C0 100%)'
    : mood === 'stormy'     ? 'linear-gradient(180deg,#2A2040 0%,#404060 100%)'
    : mood === 'golden'     ? 'linear-gradient(180deg,#FF9A3C 0%,#FFD700 40%,#87CEEB 100%)'
    : mood === 'hot'        ? 'linear-gradient(180deg,#3A80C8 0%,#87CEEB 50%,#D4EEFF 100%)'
    : mood === 'snowy'      ? 'linear-gradient(180deg,#C8DCFF 0%,#E8F0FF 60%,#F0F4FF 100%)'
    :                         'linear-gradient(180deg,#6AAEDC 0%,#87CEEB 50%,#BFDFEF 100%)';

  return (
    <div className="w-full h-full relative" style={{ cursor: 'default' }}>
      <Canvas
        shadows={false}
        gl={{
          antialias: false,
          powerPreference: 'high-performance',
          pixelRatio: Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 1.5),
        }}
        style={{ background: skyGradient }}
        performance={{ min: 0.5 }}
        frameloop="always"
      >
        <OrthographicCamera makeDefault position={[7, 12, 8]} zoom={48} near={0.1} far={100} />
        <Scene
          onNavigate={href => { document.body.style.cursor = 'default'; router.push(href); }}
          onHover={setHoveredId}
          onLeave={() => setHoveredId(null)}
          isNight={isNight}
          weatherMood={mood}
        />
      </Canvas>
      <VillageHUD hoveredId={hoveredId} isNight={isNight} />
    </div>
  );
}
