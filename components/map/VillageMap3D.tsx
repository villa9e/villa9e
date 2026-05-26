'use client';
import { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, OrthographicCamera } from '@react-three/drei';
import { useRouter } from 'next/navigation';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { useWeather } from '@/lib/theme/useWeather';
import * as THREE from 'three';

// ─── Locations ────────────────────────────────────────────────────────────────
const LOCATIONS = [
  { id: 'workshop',     label: 'Workshop',     emoji: '🔨', href: '/village/workshop',     pos: [-4.5, 0, -2.5] as [number,number,number], color: '#E8770A', roofColor: '#C45E00', height: 2.6, shape: 'pyramid' },
  { id: 'dreamline',   label: 'Dream Line',   emoji: '✨', href: '/village/dreamline',    pos: [4.5,  0, -2.5] as [number,number,number], color: '#7C3AED', roofColor: '#5B21B6', height: 2.2, shape: 'dome' },
  { id: 'trading-post',label: 'Trading Post', emoji: '🏪', href: '/village/trading-post', pos: [-4.5, 0, 2.5]  as [number,number,number], color: '#059669', roofColor: '#047857', height: 2.0, shape: 'flat' },
  { id: 'bank',         label: 'Bank',         emoji: '🏦', href: '/village/bank',         pos: [4.5,  0, 2.5]  as [number,number,number], color: '#D97706', roofColor: '#B45309', height: 2.4, shape: 'pyramid' },
  { id: 'zen',          label: 'Zen',          emoji: '🧘', href: '/village/zen',           pos: [-6.5, 0, 0]    as [number,number,number], color: '#0D9488', roofColor: '#0F766E', height: 1.8, shape: 'dome' },
  { id: 'tribes',       label: 'Tribes',       emoji: '👥', href: '/village/tribes',        pos: [6.5,  0, 0]    as [number,number,number], color: '#BE185D', roofColor: '#9D174D', height: 2.0, shape: 'pyramid' },
  { id: 'hospital',     label: 'Hospital',     emoji: '🏥', href: '/village/hospital',      pos: [0,    0, -5.5] as [number,number,number], color: '#16A34A', roofColor: '#15803D', height: 2.2, shape: 'dome' },
  { id: 'hut',          label: 'My Hut',       emoji: '🏠', href: '/village/hut',           pos: [0,    0, 4.5]  as [number,number,number], color: '#EA580C', roofColor: '#C2410C', height: 1.8, shape: 'pyramid' },
  { id: 'spirit',       label: 'Spirit',       emoji: '🌀', href: '/village/spirit',        pos: [0,    0, 0]    as [number,number,number], color: '#1877F2', roofColor: '#1D4ED8', height: 1.4, shape: 'orb' },
];

// ─── Halftone dot overlay component (Spider-Verse style) ──────────────────────
function HalftoneOverlay() {
  const dots = useMemo(() => {
    const d = [];
    for (let x = -12; x <= 12; x += 2.5) {
      for (let z = -10; z <= 10; z += 2.5) {
        d.push([x, z]);
      }
    }
    return d;
  }, []);

  return (
    <>
      {dots.map(([x, z], i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, -0.02, z]}>
          <circleGeometry args={[0.06, 6]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.04} />
        </mesh>
      ))}
    </>
  );
}

// ─── Tree (baobab-inspired, Spider-Verse low-poly) ────────────────────────────
function Tree({ pos, scale = 1 }: { pos: [number,number,number]; scale?: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(state => {
    if (!ref.current) return;
    ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.4 + pos[0]) * 0.03;
  });
  return (
    <group ref={ref} position={pos} scale={scale}>
      {/* Trunk — wide baobab style */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.18, 0.28, 0.8, 6]} />
        <meshToonMaterial color="#6B4226" />
      </mesh>
      {/* Canopy — flat angular (low-poly) */}
      <mesh position={[0, 1.1, 0]}>
        <dodecahedronGeometry args={[0.75, 0]} />
        <meshToonMaterial color="#2D7D46" />
      </mesh>
      <mesh position={[0.3, 0.95, 0.2]}>
        <dodecahedronGeometry args={[0.45, 0]} />
        <meshToonMaterial color="#22C55E" />
      </mesh>
      <mesh position={[-0.25, 0.9, -0.15]}>
        <dodecahedronGeometry args={[0.4, 0]} />
        <meshToonMaterial color="#16A34A" />
      </mesh>
    </group>
  );
}

// ─── Fire circle / campfire (tribal center) ───────────────────────────────────
function FireCircle({ pos }: { pos: [number,number,number] }) {
  const flameRef = useRef<THREE.Mesh>(null);
  useFrame(state => {
    if (!flameRef.current) return;
    const t = state.clock.elapsedTime;
    flameRef.current.scale.x = 1 + Math.sin(t * 8) * 0.12;
    flameRef.current.scale.z = 1 + Math.sin(t * 7 + 1) * 0.1;
    flameRef.current.scale.y = 1 + Math.sin(t * 6) * 0.15;
  });
  return (
    <group position={pos}>
      {/* Stone circle */}
      {[0,1,2,3,4,5,6,7].map(i => {
        const angle = (i / 8) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(angle) * 0.5, 0.04, Math.sin(angle) * 0.5]}>
            <dodecahedronGeometry args={[0.12, 0]} />
            <meshToonMaterial color="#78716C" />
          </mesh>
        );
      })}
      {/* Logs */}
      <mesh rotation={[0, 0.4, Math.PI / 2]} position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.05, 0.07, 0.7, 6]} />
        <meshToonMaterial color="#92400E" />
      </mesh>
      <mesh rotation={[0, -0.8, Math.PI / 2]} position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.05, 0.07, 0.7, 6]} />
        <meshToonMaterial color="#92400E" />
      </mesh>
      {/* Flame */}
      <mesh ref={flameRef} position={[0, 0.28, 0]}>
        <coneGeometry args={[0.18, 0.45, 6]} />
        <meshBasicMaterial color="#FF6B2B" transparent opacity={0.9} />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <coneGeometry args={[0.1, 0.25, 5]} />
        <meshBasicMaterial color="#FFD700" transparent opacity={0.8} />
      </mesh>
      {/* Firelight point */}
      <pointLight color="#FF6B2B" intensity={1.5} distance={3} decay={2} />
    </group>
  );
}

// ─── Building (Spider-Verse low-poly, culturally inspired) ───────────────────
function Building({ location, onClick, onHover, onLeave }: any) {
  const bodyRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [x,, z] = location.pos;
  const h = location.height;

  useFrame(state => {
    if (!bodyRef.current) return;
    const t = state.clock.elapsedTime;
    bodyRef.current.position.y = hovered ? 0.25 : Math.sin(t * 0.6 + x * 0.5) * 0.05;
  });

  // Outline effect (Spider-Verse black outline)
  const outlineColor = hovered ? location.color : '#111111';
  const outlineOpacity = hovered ? 0.9 : 0.3;

  return (
    <group position={[x, 0, z]}>
      {/* Ground shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <ellipseGeometry args={[0.9, 0.7, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.12} />
      </mesh>

      <group ref={bodyRef}>
        {/* Outer outline (thick, Spider-Verse style) */}
        <mesh>
          <boxGeometry args={[1.38, h + 0.06, 1.38]} />
          <meshBasicMaterial color={outlineColor} transparent opacity={outlineOpacity} />
        </mesh>

        {/* Main body — flat toon shading */}
        <mesh
          onClick={onClick}
          onPointerOver={() => { setHovered(true); onHover?.(); document.body.style.cursor = 'pointer'; }}
          onPointerOut={() => { setHovered(false); onLeave?.(); document.body.style.cursor = 'default'; }}
        >
          <boxGeometry args={[1.3, h, 1.3]} />
          <meshToonMaterial color={hovered ? location.roofColor : '#F5F0E8'} />
        </mesh>

        {/* Cultural stripe band — Kente-inspired */}
        <mesh position={[0, h * 0.3, 0]}>
          <boxGeometry args={[1.32, h * 0.18, 1.32]} />
          <meshToonMaterial color={location.color} />
        </mesh>
        <mesh position={[0, h * 0.1, 0]}>
          <boxGeometry args={[1.32, h * 0.06, 1.32]} />
          <meshToonMaterial color={location.roofColor} />
        </mesh>

        {/* Roof — shape varies by location */}
        {location.shape === 'pyramid' && (
          <>
            <mesh position={[0, h * 0.5 + 0.5, 0]}>
              <coneGeometry args={[1.0, 1.0, 4]} />
              <meshToonMaterial color={location.color} />
            </mesh>
            {/* Outline */}
            <mesh position={[0, h * 0.5 + 0.5, 0]}>
              <coneGeometry args={[1.05, 1.05, 4]} />
              <meshBasicMaterial color="#111111" transparent opacity={outlineOpacity * 0.6} side={THREE.BackSide} />
            </mesh>
          </>
        )}
        {location.shape === 'dome' && (
          <>
            <mesh position={[0, h * 0.5 + 0.3, 0]}>
              <sphereGeometry args={[0.75, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshToonMaterial color={location.color} />
            </mesh>
          </>
        )}
        {location.shape === 'orb' && (
          <>
            <mesh position={[0, h * 0.5 + 0.2, 0]}>
              <icosahedronGeometry args={[0.65, 0]} />
              <meshToonMaterial color={location.color} />
            </mesh>
            {/* Spirit orb glow */}
            <mesh position={[0, h * 0.5 + 0.2, 0]}>
              <icosahedronGeometry args={[0.75, 0]} />
              <meshBasicMaterial color={location.color} transparent opacity={0.12} />
            </mesh>
            <pointLight position={[0, h * 0.5 + 0.2, 0]} color={location.color} intensity={0.8} distance={2.5} />
          </>
        )}
        {location.shape === 'flat' && (
          <mesh position={[0, h * 0.5 + 0.06, 0]}>
            <boxGeometry args={[1.5, 0.12, 1.5]} />
            <meshToonMaterial color={location.color} />
          </mesh>
        )}

        {/* Active hover glow ring */}
        {hovered && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -h / 2 + 0.03, 0]}>
            <ringGeometry args={[0.95, 1.2, 32]} />
            <meshBasicMaterial color={location.color} transparent opacity={0.5} />
          </mesh>
        )}
      </group>

      {/* Label */}
      <Text
        position={[0, h * 0.5 + (location.shape === 'pyramid' ? 1.3 : location.shape === 'orb' ? 1.0 : 0.9), 0]}
        fontSize={0.26}
        color={hovered ? location.color : '#1a0a00'}
        outlineColor="#ffffff"
        outlineWidth={0.02}
        anchorX="center"
        anchorY="middle"
      >
        {location.label}
      </Text>
    </group>
  );
}

// ─── Particle systems ──────────────────────────────────────────────────────────
function Fireflies({ count = 30, isNight = false }: { count?: number; isNight?: boolean }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const positions = useMemo(() => Array.from({ length: count }, () => ({
    x: (Math.random() - 0.5) * 16,
    y: 0.5 + Math.random() * 2.5,
    z: (Math.random() - 0.5) * 14,
    speed: 0.3 + Math.random() * 0.7,
    phase: Math.random() * Math.PI * 2,
  })), [count]);

  useFrame(state => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    const dummy = new THREE.Object3D();
    positions.forEach((p, i) => {
      dummy.position.set(
        p.x + Math.sin(t * p.speed + p.phase) * 0.8,
        p.y + Math.sin(t * p.speed * 1.3 + p.phase) * 0.5,
        p.z + Math.cos(t * p.speed * 0.7 + p.phase) * 0.6,
      );
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
    // Flicker opacity
    (meshRef.current.material as THREE.MeshBasicMaterial).opacity = isNight
      ? 0.5 + Math.sin(t * 3) * 0.3
      : 0.15 + Math.sin(t * 2) * 0.1;
  });

  if (!isNight && count < 20) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.04, 4, 4]} />
      <meshBasicMaterial color={isNight ? '#FFD700' : '#FFFFFF'} transparent />
    </instancedMesh>
  );
}

function RainParticles({ count = 150 }: { count?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const data = useMemo(() => Array.from({ length: count }, () => ({
    x: (Math.random() - 0.5) * 20,
    y: 6 + Math.random() * 4,
    z: (Math.random() - 0.5) * 16,
    speed: 4 + Math.random() * 3,
  })), []);

  useFrame((_, delta) => {
    if (!ref.current) return;
    const dummy = new THREE.Object3D();
    data.forEach((d, i) => {
      d.y -= d.speed * delta;
      if (d.y < 0) { d.y = 10; d.x = (Math.random() - 0.5) * 20; d.z = (Math.random() - 0.5) * 16; }
      dummy.position.set(d.x, d.y, d.z);
      dummy.scale.set(1, 3, 1);
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <capsuleGeometry args={[0.02, 0.15, 2, 4]} />
      <meshBasicMaterial color="#BFDBFE" transparent opacity={0.4} />
    </instancedMesh>
  );
}

function StarField({ count = 120 }: { count?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const stars = useMemo(() => Array.from({ length: count }, () => ({
    x: (Math.random() - 0.5) * 40,
    y: 8 + Math.random() * 10,
    z: (Math.random() - 0.5) * 30,
    twinkle: Math.random() * Math.PI * 2,
  })), []);

  useFrame(state => {
    if (!ref.current) return;
    const dummy = new THREE.Object3D();
    const t = state.clock.elapsedTime;
    stars.forEach((s, i) => {
      dummy.position.set(s.x, s.y, s.z);
      const scale = 0.7 + Math.sin(t * 2 + s.twinkle) * 0.4;
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <octahedronGeometry args={[0.05, 0]} />
      <meshBasicMaterial color="#E8D5FF" transparent opacity={0.7} />
    </instancedMesh>
  );
}

// ─── Ground & Terrain ─────────────────────────────────────────────────────────
function Ground({ isNight }: { isNight: boolean }) {
  const grassColor = isNight ? '#1A2E1A' : '#3D7A3D';
  const pathColor  = isNight ? '#4A3E2A' : '#C4A882';

  return (
    <>
      {/* Main ground — large flat plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[36, 28, 8, 8]} />
        <meshToonMaterial color={grassColor} />
      </mesh>

      {/* Outer outline edge */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[38, 30]} />
        <meshBasicMaterial color="#111111" transparent opacity={0.08} />
      </mesh>

      {/* Dirt paths radiating from center */}
      {LOCATIONS.filter(l => l.id !== 'spirit').map(loc => {
        const [px,, pz] = loc.pos;
        const dist = Math.sqrt(px * px + pz * pz);
        const angle = Math.atan2(pz, px);
        return (
          <mesh key={loc.id}
            rotation={[-Math.PI / 2, -angle, 0]}
            position={[px / 2, 0.005, pz / 2]}>
            <planeGeometry args={[0.45, dist * 0.95]} />
            <meshToonMaterial color={pathColor} />
          </mesh>
        );
      })}

      {/* Central sacred circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]}>
        <ringGeometry args={[1.4, 1.65, 32]} />
        <meshBasicMaterial color={isNight ? '#4A3E2A' : '#A87C5A'} transparent opacity={0.8} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.009, 0]}>
        <circleGeometry args={[1.4, 32]} />
        <meshToonMaterial color={pathColor} />
      </mesh>

      {/* Adinkra-style geometric floor pattern (simplified) */}
      {[0, Math.PI/4, Math.PI/2, Math.PI*3/4].map((angle, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, angle, 0]} position={[0, 0.01, 0]}>
          <planeGeometry args={[0.08, 2.6]} />
          <meshBasicMaterial color={isNight ? '#5A4A2A' : '#B8934A'} transparent opacity={0.6} />
        </mesh>
      ))}

      {/* Water feature (near Zen) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-5.8, 0.03, 1.8]}>
        <circleGeometry args={[0.8, 12]} />
        <meshBasicMaterial color={isNight ? '#1E3A5A' : '#7EC8E3'} transparent opacity={0.85} />
      </mesh>

      {/* Halftone dot pattern (Spider-Verse) */}
      <HalftoneOverlay />
    </>
  );
}

// ─── Tree clusters ─────────────────────────────────────────────────────────────
const TREE_POSITIONS: [number,number,number][] = [
  [-8, 0, -6], [-7, 0, -4], [-9, 0, -2], [-8, 0, 1], [-9, 0, 4], [-7, 0, 6],
  [8, 0, -6],  [7, 0, -3],  [9, 0, 0],   [8, 0, 3],  [7, 0, 6],
  [-2, 0, -7], [2, 0, -7],  [0, 0, -8],
  [-3, 0, 7],  [3, 0, 7],   [0, 0, 8],
];

// ─── Lighting — Spider-Verse uses dramatic directional light ───────────────────
function Lights({ isNight, weatherMood }: { isNight: boolean; weatherMood: string }) {
  const ambientIntensity = isNight ? 0.3 : 0.7;
  const sunColor  = isNight ? '#1A0A30' : weatherMood === 'rainy' ? '#8888AA' : '#FFF5D0';
  const sunIntensity = isNight ? 0.2 : weatherMood === 'rainy' ? 0.3 : 0.9;

  return (
    <>
      <ambientLight intensity={ambientIntensity} color={isNight ? '#1A0A30' : '#FFFBF0'} />
      <directionalLight
        position={isNight ? [-5, 12, 3] : [-8, 15, 6]}
        intensity={sunIntensity}
        color={sunColor}
        castShadow
      />
      {/* Accent fill */}
      <pointLight position={[0, 8, 0]} intensity={isNight ? 0.4 : 0.15} color={isNight ? '#1877F2' : '#FFD700'} />
    </>
  );
}

// ─── Spider-Verse Avatar Character ────────────────────────────────────────────
function AvatarCharacter({ pos, skinColor = '#8B4513', hairColor = '#1A0A00', isNight = false }:
  { pos: [number,number,number]; skinColor?: string; hairColor?: string; isNight?: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Mesh>(null);
  const legR = useRef<THREE.Mesh>(null);
  const armL = useRef<THREE.Mesh>(null);
  const armR = useRef<THREE.Mesh>(null);

  useFrame(state => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    // Gentle idle bob
    ref.current.position.y = pos[1] + Math.sin(t * 1.2) * 0.05;
    // Leg swing
    if (legL.current) legL.current.rotation.x = Math.sin(t * 2) * 0.3;
    if (legR.current) legR.current.rotation.x = -Math.sin(t * 2) * 0.3;
    if (armL.current) armL.current.rotation.x = -Math.sin(t * 2) * 0.25;
    if (armR.current) armR.current.rotation.x = Math.sin(t * 2) * 0.25;
  });

  const outlineColor = '#111111';
  const tunicColor   = isNight ? '#1877F2' : '#E8770A';  // outfit changes with theme

  return (
    <group ref={ref} position={pos} scale={0.55}>
      {/* ── HEAD ── */}
      {/* Head outline */}
      <mesh position={[0, 2.42, 0]}>
        <sphereGeometry args={[0.47, 8, 8]} />
        <meshBasicMaterial color={outlineColor} />
      </mesh>
      {/* Skin */}
      <mesh position={[0, 2.42, 0]}>
        <sphereGeometry args={[0.42, 8, 8]} />
        <meshToonMaterial color={skinColor} />
      </mesh>
      {/* Hair — flat angular Spider-Verse style */}
      <mesh position={[0, 2.72, 0]}>
        <dodecahedronGeometry args={[0.35, 0]} />
        <meshToonMaterial color={hairColor} />
      </mesh>
      {/* Eyes */}
      <mesh position={[0.15, 2.46, 0.38]}>
        <sphereGeometry args={[0.07, 6, 6]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>
      <mesh position={[-0.15, 2.46, 0.38]}>
        <sphereGeometry args={[0.07, 6, 6]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>
      <mesh position={[0.15, 2.46, 0.42]}>
        <sphereGeometry args={[0.04, 5, 5]} />
        <meshBasicMaterial color="#111111" />
      </mesh>
      <mesh position={[-0.15, 2.46, 0.42]}>
        <sphereGeometry args={[0.04, 5, 5]} />
        <meshBasicMaterial color="#111111" />
      </mesh>

      {/* ── TORSO ── */}
      <mesh position={[0, 1.7, 0]}>
        <boxGeometry args={[0.72, 0.76, 0.7]} />
        <meshBasicMaterial color={outlineColor} />
      </mesh>
      <mesh position={[0, 1.7, 0]}>
        <boxGeometry args={[0.64, 0.7, 0.62]} />
        <meshToonMaterial color={tunicColor} />
      </mesh>
      {/* Collar detail */}
      <mesh position={[0, 2.0, 0.3]}>
        <boxGeometry args={[0.3, 0.12, 0.08]} />
        <meshToonMaterial color={isNight ? '#1D4ED8' : '#C45E00'} />
      </mesh>

      {/* ── ARMS ── */}
      <mesh ref={armL} position={[0.5, 1.7, 0]}>
        <capsuleGeometry args={[0.12, 0.5, 4, 6]} />
        <meshBasicMaterial color={outlineColor} />
      </mesh>
      <mesh ref={armL} position={[0.5, 1.7, 0]}>
        <capsuleGeometry args={[0.1, 0.45, 4, 6]} />
        <meshToonMaterial color={tunicColor} />
      </mesh>
      <mesh ref={armR} position={[-0.5, 1.7, 0]}>
        <capsuleGeometry args={[0.12, 0.5, 4, 6]} />
        <meshBasicMaterial color={outlineColor} />
      </mesh>
      <mesh ref={armR} position={[-0.5, 1.7, 0]}>
        <capsuleGeometry args={[0.1, 0.45, 4, 6]} />
        <meshToonMaterial color={tunicColor} />
      </mesh>

      {/* ── LEGS ── */}
      <mesh ref={legL} position={[0.2, 1.1, 0]}>
        <capsuleGeometry args={[0.13, 0.52, 4, 6]} />
        <meshBasicMaterial color={outlineColor} />
      </mesh>
      <mesh ref={legL} position={[0.2, 1.1, 0]}>
        <capsuleGeometry args={[0.11, 0.48, 4, 6]} />
        <meshToonMaterial color={isNight ? '#0F172A' : '#2D1F0E'} />
      </mesh>
      <mesh ref={legR} position={[-0.2, 1.1, 0]}>
        <capsuleGeometry args={[0.13, 0.52, 4, 6]} />
        <meshBasicMaterial color={outlineColor} />
      </mesh>
      <mesh ref={legR} position={[-0.2, 1.1, 0]}>
        <capsuleGeometry args={[0.11, 0.48, 4, 6]} />
        <meshToonMaterial color={isNight ? '#0F172A' : '#2D1F0E'} />
      </mesh>

      {/* Feet */}
      <mesh position={[0.22, 0.72, 0.12]}>
        <boxGeometry args={[0.2, 0.12, 0.32]} />
        <meshToonMaterial color="#111111" />
      </mesh>
      <mesh position={[-0.22, 0.72, 0.12]}>
        <boxGeometry args={[0.2, 0.12, 0.32]} />
        <meshToonMaterial color="#111111" />
      </mesh>

      {/* Name label */}
      <Text position={[0, 3.1, 0]} fontSize={0.3} color="#1877F2"
        outlineColor="#ffffff" outlineWidth={0.03} anchorX="center" anchorY="middle">
        You
      </Text>
    </group>
  );
}

// ─── Full Scene ────────────────────────────────────────────────────────────────
function Scene({ onNavigate, onHover, onLeave, isNight, weatherMood }:
  { onNavigate: (href: string) => void; onHover: (id: string) => void; onLeave: () => void; isNight: boolean; weatherMood: string }) {
  return (
    <>
      <Lights isNight={isNight} weatherMood={weatherMood} />
      <Ground isNight={isNight} />

      {TREE_POSITIONS.map((pos, i) => (
        <Tree key={i} pos={pos} scale={0.7 + Math.sin(i * 1.3) * 0.25} />
      ))}

      <FireCircle pos={[0, 0, 0]} />

      {/* Avatar character — wandering near center */}
      <AvatarCharacter pos={[1.8, 0, 1.5]} isNight={isNight} />

      {LOCATIONS.filter(l => l.id !== 'spirit').map(loc => (
        <Building key={loc.id} location={loc}
          onClick={() => onNavigate(loc.href)}
          onHover={() => onHover(loc.id)}
          onLeave={onLeave}
        />
      ))}
      {/* Spirit orb in center (above fire) */}
      <Building
        location={LOCATIONS.find(l => l.id === 'spirit')!}
        onClick={() => onNavigate('/village/spirit')}
        onHover={() => onHover('spirit')}
        onLeave={onLeave}
      />

      {/* Fireflies / particles */}
      <Fireflies count={isNight ? 40 : 15} isNight={isNight} />
      {isNight && <StarField count={100} />}
      {weatherMood === 'rainy' || weatherMood === 'night_rain' ? <RainParticles /> : null}

      {/* Sky backdrop */}
      <mesh position={[0, 5, -18]}>
        <planeGeometry args={[50, 25]} />
        <meshBasicMaterial
          color={isNight
            ? weatherMood === 'stormy' ? '#1A0A30' : '#0A0B1A'
            : weatherMood === 'rainy' ? '#8899AA'
            : weatherMood === 'golden' ? '#FF9A3C'
            : '#87CEEB'}
        />
      </mesh>

      {/* Sun or moon */}
      <mesh position={isNight ? [-8, 12, -15] : [10, 14, -15]}>
        <circleGeometry args={[isNight ? 0.8 : 1.5, 12]} />
        <meshBasicMaterial color={isNight ? '#E8D5FF' : '#FFD700'} />
      </mesh>
    </>
  );
}

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
      <p className="font-black text-sm" style={{ color: loc.color }}>
        {loc.emoji} {loc.label}
      </p>
      <p className="text-xs" style={{ color: isNight ? '#7A7FA8' : '#9CA3AF' }}>Tap to enter</p>
    </div>
  );
}

// ─── Exports ──────────────────────────────────────────────────────────────────
export default function VillageMap3D() {
  const router   = useRouter();
  const { theme } = useVillageTheme();
  const { mood }  = useWeather();
  const isNight   = theme === 'night';
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const skyGradient = isNight
    ? mood === 'stormy'    ? 'linear-gradient(180deg, #0A0020 0%, #1A0A30 100%)'
    : mood === 'night_rain'? 'linear-gradient(180deg, #0A0B1A 0%, #1A2030 100%)'
    :                        'linear-gradient(180deg, #0A0B1A 0%, #1A1A3A 60%, #0D2040 100%)'
    : mood === 'rainy'     ? 'linear-gradient(180deg, #607080 0%, #8898AA 60%, #A0B0C0 100%)'
    : mood === 'stormy'    ? 'linear-gradient(180deg, #2A2040 0%, #404060 100%)'
    : mood === 'golden'    ? 'linear-gradient(180deg, #FF9A3C 0%, #FFD700 40%, #87CEEB 100%)'
    : mood === 'sunny' || mood === 'hot'
                           ? 'linear-gradient(180deg, #4A90D9 0%, #87CEEB 50%, #C8E6FF 100%)'
    :                        'linear-gradient(180deg, #6AAEDC 0%, #87CEEB 50%, #BFDFEF 100%)';

  function handleClick(href: string) {
    document.body.style.cursor = 'default';
    router.push(href);
  }

  return (
    <div className="w-full h-full relative" style={{ cursor: 'default' }}>
      <Canvas
        shadows={false}
        gl={{
          antialias: false,       // saves GPU on mobile
          powerPreference: 'high-performance',
          pixelRatio: Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 1.5),
        }}
        style={{ background: skyGradient }}
        camera={{ position: [0, 0, 0] } as any}
        frameloop="always"
        performance={{ min: 0.5 }}  // drop frame rate before dropping quality
      >
        <OrthographicCamera makeDefault position={[7, 12, 8]} zoom={48} near={0.1} far={100} />
        <Scene
          onNavigate={handleClick}
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
