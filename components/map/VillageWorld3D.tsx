'use client';
import { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useWeather } from '@/lib/theme/useWeather';
import { VillageSound } from '@/lib/sounds/village';
import { useSkySystem } from '@/lib/world/useSkySystem';
import { SpiritFigure } from '@/components/spirit/SpiritFigure';
import type { SpiritVariantId } from '@/components/spirit/SpiritFigure';
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';

// ─── Location data with collision boxes ───────────────────────────────────────
const LOCATIONS = [
  { id: 'workshop',     label: 'Workshop',     href: '/village/workshop',     pos: [-7, 0, -4] as [number,number,number],  color: '#E8770A', size: [3, 4, 3] as [number,number,number] },
  { id: 'dreamline',   label: 'Dream Line',   href: '/village/dreamline',    pos: [7,  0, -4] as [number,number,number],  color: '#7C3AED', size: [3, 3.5, 3] as [number,number,number] },
  { id: 'trading-post',label: 'Trading Post', href: '/village/trading-post', pos: [-7, 0, 4] as [number,number,number],   color: '#059669', size: [3, 3, 3] as [number,number,number] },
  { id: 'bank',         label: 'Bank',         href: '/village/bank',         pos: [7,  0, 4] as [number,number,number],   color: '#D97706', size: [3, 4, 3] as [number,number,number] },
  { id: 'zen',          label: 'Zen',          href: '/village/zen',           pos: [-10, 0, 0] as [number,number,number],  color: '#0D9488', size: [3, 3, 3] as [number,number,number] },
  { id: 'tribes',       label: 'Tribes',       href: '/village/tribes',        pos: [10,  0, 0] as [number,number,number],  color: '#BE185D', size: [3, 3.5, 3] as [number,number,number] },
  { id: 'hospital',     label: 'Hospital',     href: '/village/hospital',      pos: [0,   0, -8] as [number,number,number], color: '#16A34A', size: [3, 3.5, 3] as [number,number,number] },
  { id: 'hut',          label: 'My Hut',       href: '/village/hut',           pos: [0,   0, 7] as [number,number,number],  color: '#EA580C', size: [2.5, 3, 2.5] as [number,number,number] },
];

const SPIRIT_POS: [number,number,number] = [0, 0, 0];

// ─── Sun position from altitude/azimuth ──────────────────────────────────────
function sunPosFromAngles(altitude: number, azimuth: number, dist = 60): [number,number,number] {
  const altR = (altitude * Math.PI) / 180;
  const azR  = (azimuth  * Math.PI) / 180;
  const x =  Math.sin(azR) * Math.cos(altR) * dist;
  const y =  Math.sin(altR) * dist;
  const z = -Math.cos(azR) * Math.cos(altR) * dist;
  return [x, Math.max(y, -10), z];
}

// Memoized flat-shaded toon material — avoids TypeScript JSX prop error
function FlatToonMat({ color }: { color: string }) {
  const mat = useMemo(() => {
    const m = new THREE.MeshToonMaterial({ color });
    (m as any).flatShading = true;
    return m;
  }, [color]);
  return <primitive object={mat} attach="material" />;
}

// ─── Adinkra canvas texture generator ────────────────────────────────────────
function createAdinkraTexture(color: string, bgColor = '#F5ECD0'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, 256, 256);

  const stripeColors = [color, '#FFD700', color, bgColor];
  stripeColors.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.globalAlpha = i === 3 ? 0 : 0.6;
    ctx.fillRect(0, i * 64, 256, 64);
  });
  ctx.globalAlpha = 1;

  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.7;
  for (let x = 32; x <= 224; x += 64) {
    for (let y = 32; y <= 224; y += 64) {
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - 8, y); ctx.lineTo(x + 8, y);
      ctx.moveTo(x, y - 8); ctx.lineTo(x, y + 8);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  return new THREE.CanvasTexture(canvas);
}

// ─── Sky dome with gradient colors ───────────────────────────────────────────
function SkyDome({ skyTop, skyMid, skyHor }: { skyTop: string; skyMid: string; skyHor: string }) {
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.SphereGeometry(80, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const positions = geo.attributes.position;
    const colors: number[] = [];
    const colTop = hexToColor(skyTop);
    const colMid = hexToColor(skyMid);
    const colHor = hexToColor(skyHor);

    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i);
      const t = Math.max(0, Math.min(1, y / 30));
      // above equator: interpolate horizon→mid→top
      let r: number, g: number, b: number;
      if (t < 0.35) {
        const f = t / 0.35;
        r = colHor.r + (colMid.r - colHor.r) * f;
        g = colHor.g + (colMid.g - colHor.g) * f;
        b = colHor.b + (colMid.b - colHor.b) * f;
      } else {
        const f = (t - 0.35) / 0.65;
        r = colMid.r + (colTop.r - colMid.r) * f;
        g = colMid.g + (colTop.g - colMid.g) * f;
        b = colMid.b + (colTop.b - colMid.b) * f;
      }
      colors.push(r, g, b);
    }

    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    return geo;
  }, [skyTop, skyMid, skyHor]);

  return (
    <mesh ref={meshRef} geometry={geometry} renderOrder={-1}>
      <meshBasicMaterial vertexColors side={THREE.BackSide} depthWrite={false} />
    </mesh>
  );
}

// ─── Sun / Moon disc ──────────────────────────────────────────────────────────
function CelestialBody({ phase, altitude, azimuth, sunColor }: {
  phase: string; altitude: number; azimuth: number; sunColor: string;
}) {
  const isNight = phase === 'night' || phase === 'dusk' || phase === 'dawn';
  const pos = sunPosFromAngles(altitude, azimuth, 55);
  const bodyRef = useRef<THREE.Mesh>(null);

  useFrame(state => {
    if (!bodyRef.current) return;
    // Subtle pulse for sun glow
    const t = state.clock.elapsedTime;
    bodyRef.current.scale.setScalar(1 + Math.sin(t * 0.8) * 0.015);
  });

  if (altitude < -8) return null;

  return (
    <group position={pos}>
      {/* Glow halo */}
      <mesh>
        <sphereGeometry args={[isNight ? 1.2 : 2.8, 12, 10]} />
        <meshBasicMaterial color={sunColor} transparent opacity={0.12} />
      </mesh>
      {/* Body disc */}
      <mesh ref={bodyRef}>
        <sphereGeometry args={[isNight ? 0.8 : 1.8, 16, 14]} />
        <meshBasicMaterial color={isNight ? '#F0F4FF' : sunColor} />
      </mesh>
      {/* God rays at golden hour */}
      {!isNight && (phase === 'sunrise' || phase === 'golden' || phase === 'sunset') && (
        Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 2.5, Math.sin(a) * 2.5, 0]}>
              <planeGeometry args={[0.15, 4 + Math.sin(i * 1.3) * 1.5]} />
              <meshBasicMaterial color={sunColor} transparent opacity={0.08 + Math.sin(i) * 0.04} />
            </mesh>
          );
        })
      )}
    </group>
  );
}

// ─── Stars (instanced) ────────────────────────────────────────────────────────
function Stars({ visible }: { visible: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);

  const starData = useMemo(() => Array.from({ length: 200 }, () => {
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.random() * Math.PI * 0.5;
    const r     = 70;
    return {
      x: r * Math.sin(phi) * Math.cos(theta),
      y: r * Math.cos(phi) * 0.8 + 5,
      z: r * Math.sin(phi) * Math.sin(theta),
      brightness: 0.4 + Math.random() * 0.6,
      twinkleSpeed: 0.5 + Math.random() * 2.5,
      twinklePhase: Math.random() * Math.PI * 2,
    };
  }), []);

  useFrame(state => {
    if (!ref.current) return;
    const dummy = new THREE.Object3D();
    const t = state.clock.elapsedTime;
    starData.forEach((star, i) => {
      dummy.position.set(star.x, star.y, star.z);
      const twinkle = 0.85 + Math.sin(t * star.twinkleSpeed + star.twinklePhase) * 0.15;
      const scale = visible ? star.brightness * twinkle * 0.35 : 0;
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, 200]}>
      <sphereGeometry args={[1, 4, 3]} />
      <meshBasicMaterial color="#E8E8FF" />
    </instancedMesh>
  );
}

// ─── River ───────────────────────────────────────────────────────────────────
function River({ skyState }: { skyState: any }) {
  const waterRef1 = useRef<THREE.Mesh>(null);
  const waterRef2 = useRef<THREE.Mesh>(null);
  const shimmerRef = useRef<THREE.Mesh>(null);

  const isNight = skyState?.phase === 'night' || skyState?.phase === 'dusk' || skyState?.phase === 'dawn';
  const isGolden = skyState?.phase === 'golden' || skyState?.phase === 'sunrise' || skyState?.phase === 'sunset';

  const waterColor = isNight
    ? '#1A2E4A'
    : isGolden
    ? '#CC7722'
    : '#4DA8DA';

  const shimmerColor = isNight ? '#3A5A8A' : isGolden ? '#FFB347' : '#87CEEB';

  useFrame(state => {
    const t = state.clock.elapsedTime;
    if (waterRef1.current) {
      (waterRef1.current.material as THREE.MeshBasicMaterial).opacity = 0.78 + Math.sin(t * 0.4) * 0.04;
    }
    if (shimmerRef.current) {
      shimmerRef.current.position.z = -16 + ((t * 1.5) % 12);
      (shimmerRef.current.material as THREE.MeshBasicMaterial).opacity = 0.12 + Math.sin(t * 2.2) * 0.08;
    }
  });

  // River runs along the right side of the village (-X edge), curving down
  return (
    <group>
      {/* Main river channel */}
      <mesh ref={waterRef1} rotation={[-Math.PI / 2, 0, 0.15]} position={[-17, 0.06, 0]}>
        <planeGeometry args={[3.5, 36, 8, 1]} />
        <meshBasicMaterial color={waterColor} transparent opacity={0.78} />
      </mesh>
      {/* Inner highlight — sky reflection */}
      <mesh rotation={[-Math.PI / 2, 0, 0.15]} position={[-17, 0.07, 0]}>
        <planeGeometry args={[1.2, 34, 6, 1]} />
        <meshBasicMaterial color={shimmerColor} transparent opacity={0.22} />
      </mesh>
      {/* Moving shimmer band */}
      <mesh ref={shimmerRef} rotation={[-Math.PI / 2, 0, 0.15]} position={[-17, 0.08, -16]}>
        <planeGeometry args={[2.2, 3, 4, 1]} />
        <meshBasicMaterial color="#FFFFFF" transparent opacity={0.12} />
      </mesh>
      {/* River banks */}
      <mesh rotation={[-Math.PI / 2, 0, 0.15]} position={[-18.8, 0.03, 0]}>
        <planeGeometry args={[1.2, 36]} />
        <meshToonMaterial color="#7A6240" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0.15]} position={[-15.2, 0.03, 0]}>
        <planeGeometry args={[1.2, 36]} />
        <meshToonMaterial color="#7A6240" />
      </mesh>
      {/* River stones */}
      {[[-16.5, 0.12, -8], [-17.4, 0.12, -2], [-16.8, 0.12, 5], [-17.2, 0.12, 12]].map((pos, i) => (
        <mesh key={i} position={pos as [number,number,number]}>
          <sphereGeometry args={[0.2 + Math.sin(i * 1.7) * 0.1, 6, 5]} />
          <meshToonMaterial color="#8A8070" />
        </mesh>
      ))}
    </group>
  );
}

// ─── Building component with cultural textures ────────────────────────────────
function Building({ loc, onEnter }: { loc: typeof LOCATIONS[0]; onEnter: (href: string, label: string) => void }) {
  const meshRef  = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [x,, z]  = loc.pos;
  const [sw, sh, sd] = loc.size;
  const tex = useRef<THREE.CanvasTexture>();

  useEffect(() => {
    if (typeof document !== 'undefined') {
      tex.current = createAdinkraTexture(loc.color);
    }
  }, [loc.color]);

  useFrame(state => {
    if (!meshRef.current) return;
    meshRef.current.position.y = hovered ? 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.05 : 0;
  });

  return (
    <group position={[x, 0, z]}>
      {/* Shadow */}
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.01, 0]}>
        <ellipseGeometry args={[sw * 0.6, sd * 0.6, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.12} />
      </mesh>

      {/* Main body */}
      <mesh ref={meshRef}
        onClick={() => onEnter(loc.href, loc.label)}
        onPointerOver={() => { setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
        castShadow
      >
        <boxGeometry args={[sw, sh, sd]} />
        <meshToonMaterial color={hovered ? '#ffffff' : '#F5ECD0'} map={tex.current} />
      </mesh>

      {/* Kente band */}
      <mesh position={[0, sh * 0.25, 0]}>
        <boxGeometry args={[sw + 0.05, sh * 0.15, sd + 0.05]} />
        <meshToonMaterial color={loc.color} />
      </mesh>

      {/* Roof — pyramid roofs use FlatToonMat, domes use smooth toon */}
      <mesh position={[0, sh * 0.5 + 0.8, 0]}>
        <coneGeometry args={[Math.max(sw, sd) * 0.72, 1.6, loc.id === 'dreamline' || loc.id === 'zen' ? 16 : 4]} />
        {loc.id === 'dreamline' || loc.id === 'zen'
          ? <meshToonMaterial color={loc.color} />
          : <FlatToonMat color={loc.color} />
        }
      </mesh>

      {/* Hover glow ring */}
      {hovered && (
        <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[Math.max(sw,sd) * 0.7, Math.max(sw,sd) * 0.9, 24]} />
          <meshBasicMaterial color={loc.color} transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  );
}

// ─── Baobab tree ─────────────────────────────────────────────────────────────
function BaobabTree({ pos, scale = 1 }: { pos: [number,number,number]; scale?: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(state => {
    if (!ref.current) return;
    ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3 + pos[0]) * 0.02;
  });
  const trunkGeo = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.2, 0.35, 1.2, 10, 1);
    g.computeVertexNormals();
    return g;
  }, []);
  const canopyGeo = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(1.0, 1);
    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <group ref={ref} position={pos} scale={scale}>
      <mesh geometry={trunkGeo} position={[0, 0.6, 0]} castShadow>
        <meshToonMaterial color="#6B4226" />
      </mesh>
      <mesh geometry={canopyGeo} position={[0, 1.6, 0]} castShadow>
        <meshToonMaterial color="#2D7D46" />
      </mesh>
      <mesh position={[0.5, 1.4, 0.3]} castShadow>
        <icosahedronGeometry args={[0.65, 1]} />
        <meshToonMaterial color="#22C55E" />
      </mesh>
      <mesh position={[-0.4, 1.3, -0.3]} castShadow>
        <icosahedronGeometry args={[0.6, 1]} />
        <meshToonMaterial color="#16A34A" />
      </mesh>
    </group>
  );
}

// ─── Sacred fire ─────────────────────────────────────────────────────────────
function SacredFire() {
  const flameRef = useRef<THREE.Mesh>(null);
  useFrame(state => {
    if (!flameRef.current) return;
    const t = state.clock.elapsedTime;
    flameRef.current.scale.x = 1 + Math.sin(t * 8) * 0.1;
    flameRef.current.scale.y = 1 + Math.sin(t * 6) * 0.15;
  });
  const flameGeo = useMemo(() => {
    const g = new THREE.ConeGeometry(0.25, 0.7, 10, 1);
    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <group position={SPIRIT_POS}>
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.7, 0.1, Math.sin(a) * 0.7]}>
            <sphereGeometry args={[0.18, 6, 5]} />
            <meshToonMaterial color="#78716C" />
          </mesh>
        );
      })}
      <mesh ref={flameRef} geometry={flameGeo} position={[0, 0.5, 0]}>
        <meshBasicMaterial color="#FF6B2B" transparent opacity={0.9} />
      </mesh>
      <mesh position={[0, 0.4, 0]}>
        <coneGeometry args={[0.15, 0.4, 8]} />
        <meshBasicMaterial color="#FFD700" transparent opacity={0.85} />
      </mesh>
      <pointLight color="#FF6B2B" intensity={2.0} distance={5} decay={2} />
    </group>
  );
}

// ─── Ground ───────────────────────────────────────────────────────────────────
function Ground({ isNight }: { isNight: boolean }) {
  const grassColor = isNight ? '#1A2E1A' : '#3D7A3D';
  const pathColor  = isNight ? '#4A3E2A' : '#C4A882';

  const groundTex = useRef<THREE.CanvasTexture>();
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = grassColor;
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = isNight ? '#142414' : '#357535';
    for (let i = 0; i < 200; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * 512, Math.random() * 512, 1 + Math.random() * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    groundTex.current = new THREE.CanvasTexture(canvas);
    groundTex.current.wrapS = THREE.RepeatWrapping;
    groundTex.current.wrapT = THREE.RepeatWrapping;
    groundTex.current.repeat.set(8, 8);
  }, [isNight, grassColor]);

  return (
    <>
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60, 16, 16]} />
        <meshToonMaterial color={grassColor} map={groundTex.current} />
      </mesh>
      {LOCATIONS.map(loc => {
        const [px,,pz] = loc.pos;
        const dist = Math.sqrt(px*px + pz*pz);
        const angle = Math.atan2(pz, px);
        return (
          <mesh key={loc.id} rotation={[-Math.PI/2, -angle, 0]} position={[px/2, 0.01, pz/2]}>
            <planeGeometry args={[0.8, dist * 0.9]} />
            <meshToonMaterial color={pathColor} />
          </mesh>
        );
      })}
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[3, 32]} />
        <meshToonMaterial color={pathColor} />
      </mesh>
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.025, 0]}>
        <ringGeometry args={[3, 3.4, 32]} />
        <meshBasicMaterial color={isNight ? '#5A4A2A' : '#A87C5A'} transparent opacity={0.7} />
      </mesh>
    </>
  );
}

// ─── Player character ──────────────────────────────────────────────────────────
function PlayerCharacter({
  position, rotation, skinColor, isLocal, username,
}: {
  position: THREE.Vector3;
  rotation: number;
  skinColor: string;
  isLocal: boolean;
  username?: string;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const legLRef  = useRef<THREE.Mesh>(null);
  const legRRef  = useRef<THREE.Mesh>(null);
  const armLRef  = useRef<THREE.Mesh>(null);
  const armRRef  = useRef<THREE.Mesh>(null);
  const tunicColor = isLocal ? '#1877F2' : '#E8770A';

  const headGeo = useMemo(() => {
    const g = new THREE.SphereGeometry(0.35, 12, 10);
    g.computeVertexNormals();
    return g;
  }, []);
  const limbGeo = useMemo(() => {
    const g = new THREE.CapsuleGeometry(0.1, 0.45, 4, 8);
    g.computeVertexNormals();
    return g;
  }, []);

  useFrame(state => {
    if (!groupRef.current) return;
    groupRef.current.position.lerp(position, 0.15);
    groupRef.current.rotation.y = rotation;

    const t = state.clock.elapsedTime;
    const moving = position.distanceTo(groupRef.current.position) > 0.05;
    const swing  = moving ? Math.sin(t * 6) * 0.4 : 0;
    if (legLRef.current)  legLRef.current.rotation.x  = swing;
    if (legRRef.current)  legRRef.current.rotation.x  = -swing;
    if (armLRef.current)  armLRef.current.rotation.x  = -swing * 0.5;
    if (armRRef.current)  armRRef.current.rotation.x  = swing * 0.5;
    groupRef.current.position.y = position.y + (moving ? Math.abs(Math.sin(t * 6)) * 0.05 : 0);
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh geometry={headGeo} position={[0, 1.85, 0]} castShadow>
        <meshToonMaterial color={skinColor} />
      </mesh>
      <mesh position={[0, 2.1, 0]}>
        <sphereGeometry args={[0.28, 8, 6, 0, Math.PI*2, 0, Math.PI*0.6]} />
        <meshToonMaterial color="#1A0A00" />
      </mesh>
      <mesh position={[0.12, 1.88, 0.33]}>
        <sphereGeometry args={[0.06, 6, 5]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>
      <mesh position={[-0.12, 1.88, 0.33]}>
        <sphereGeometry args={[0.06, 6, 5]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>
      <mesh position={[0.12, 1.88, 0.36]}>
        <sphereGeometry args={[0.035, 5, 4]} />
        <meshBasicMaterial color="#111" />
      </mesh>
      <mesh position={[-0.12, 1.88, 0.36]}>
        <sphereGeometry args={[0.035, 5, 4]} />
        <meshBasicMaterial color="#111" />
      </mesh>
      <mesh position={[0, 1.35, 0]} castShadow>
        <boxGeometry args={[0.5, 0.55, 0.35]} />
        <meshToonMaterial color={tunicColor} />
      </mesh>
      <mesh position={[0, 1.25, 0]}>
        <boxGeometry args={[0.52, 0.08, 0.37]} />
        <meshToonMaterial color="#FFD700" />
      </mesh>
      <mesh ref={armLRef} geometry={limbGeo} position={[0.35, 1.35, 0]} castShadow>
        <meshToonMaterial color={tunicColor} />
      </mesh>
      <mesh ref={armRRef} geometry={limbGeo} position={[-0.35, 1.35, 0]} castShadow>
        <meshToonMaterial color={tunicColor} />
      </mesh>
      <mesh ref={legLRef} geometry={limbGeo} position={[0.15, 0.8, 0]} castShadow>
        <meshToonMaterial color="#1A0A00" />
      </mesh>
      <mesh ref={legRRef} geometry={limbGeo} position={[-0.15, 0.8, 0]} castShadow>
        <meshToonMaterial color="#1A0A00" />
      </mesh>
      <mesh position={[0.15, 0.5, 0.08]}>
        <boxGeometry args={[0.18, 0.1, 0.28]} />
        <meshToonMaterial color="#111111" />
      </mesh>
      <mesh position={[-0.15, 0.5, 0.08]}>
        <boxGeometry args={[0.18, 0.1, 0.28]} />
        <meshToonMaterial color="#111111" />
      </mesh>
      {!isLocal && username && (
        <mesh position={[0, 2.5, 0]}>
          <planeGeometry args={[1.2, 0.35]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.6} />
        </mesh>
      )}
    </group>
  );
}

// ─── Third-person camera controller ───────────────────────────────────────────
function CameraFollow({ targetPos }: { targetPos: React.MutableRefObject<THREE.Vector3> }) {
  const { camera } = useThree();
  const lerpedLook = useRef(new THREE.Vector3());

  useFrame(() => {
    const offset = new THREE.Vector3(0, 6, 10);
    const target = targetPos.current.clone().add(offset);
    camera.position.lerp(target, 0.08);
    lerpedLook.current.lerp(targetPos.current.clone().add(new THREE.Vector3(0, 1, 0)), 0.1);
    camera.lookAt(lerpedLook.current);
  });
  return null;
}

// ─── Fireflies ────────────────────────────────────────────────────────────────
function Fireflies({ count = 25, isNight = false }: { count?: number; isNight?: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const data = useMemo(() => Array.from({ length: count }, () => ({
    x: (Math.random()-0.5)*30, y: 0.5+Math.random()*2,
    z: (Math.random()-0.5)*25, sp: 0.3+Math.random()*0.6, ph: Math.random()*Math.PI*2,
  })), [count]);

  useFrame(state => {
    if (!ref.current) return;
    const dummy = new THREE.Object3D();
    const t = state.clock.elapsedTime;
    data.forEach((p, i) => {
      dummy.position.set(p.x+Math.sin(t*p.sp+p.ph)*0.8, p.y+Math.sin(t*p.sp*1.3+p.ph)*0.4, p.z+Math.cos(t*p.sp*0.7+p.ph)*0.6);
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
    (ref.current.material as THREE.MeshBasicMaterial).opacity = isNight ? 0.55+Math.sin(state.clock.elapsedTime*3)*0.3 : 0.12;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.05, 5, 4]} />
      <meshBasicMaterial color={isNight ? '#FFD700' : '#FFFFFF'} transparent />
    </instancedMesh>
  );
}

// ─── Scene lighting that responds to sky state ────────────────────────────────
function SceneLighting({ skyState }: { skyState: any }) {
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const ambColor = useRef(new THREE.Color('#FFFBF0'));
  const sunColor = useRef(new THREE.Color('#FFF5D0'));

  useFrame(() => {
    if (!skyState) return;
    if (ambientRef.current) {
      ambientRef.current.intensity = skyState.ambientIntensity * 0.9;
      ambientRef.current.color.set(skyState.ambientColor);
    }
    if (sunRef.current) {
      const [sx, sy, sz] = sunPosFromAngles(skyState.sunAltitude, skyState.sunAzimuth, 60);
      sunRef.current.position.set(sx, Math.max(sy, 2), sz);
      sunRef.current.intensity = Math.max(0.05, skyState.ambientIntensity * 1.2);
      sunRef.current.color.set(skyState.sunColor);
    }
  });

  const isNight = skyState?.phase === 'night' || skyState?.phase === 'dusk' || skyState?.phase === 'dawn';
  const initSunPos = sunPosFromAngles(skyState?.sunAltitude ?? 45, skyState?.sunAzimuth ?? 180, 60);

  return (
    <>
      <ambientLight ref={ambientRef}
        intensity={skyState?.ambientIntensity ?? 0.65}
        color={ambColor.current}
      />
      <directionalLight
        ref={sunRef}
        position={initSunPos}
        intensity={Math.max(0.1, (skyState?.ambientIntensity ?? 0.65) * 1.2)}
        color={sunColor.current}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[0, 3, 0]} intensity={isNight ? 0.8 : 0.2} color="#FF6B2B" />
      {isNight && (
        <pointLight position={[20, 30, -20]} intensity={0.15} color="#B0B8FF" />
      )}
    </>
  );
}

// ─── Main scene ───────────────────────────────────────────────────────────────
interface RemotePlayer {
  userId: string;
  username: string;
  x: number;
  y: number;
  z: number;
  rotation: number;
  skinColor: string;
}

function WorldScene({
  playerPos, playerRot, remotePlayers, onEnterBuilding, skyState, spiritVariant,
}: {
  playerPos: React.MutableRefObject<THREE.Vector3>;
  playerRot: React.MutableRefObject<number>;
  remotePlayers: RemotePlayer[];
  onEnterBuilding: (href: string, label: string) => void;
  skyState: any;
  spiritVariant: SpiritVariantId;
}) {
  const isNight = skyState?.phase === 'night' || skyState?.phase === 'dusk' || skyState?.phase === 'dawn';
  const starsVisible = skyState?.phase === 'night' || skyState?.phase === 'dawn';

  return (
    <>
      {/* Lighting */}
      <SceneLighting skyState={skyState} />

      {/* Sky dome */}
      <SkyDome
        skyTop={skyState?.skyTop ?? '#1E6FC8'}
        skyMid={skyState?.skyMid ?? '#4A90D9'}
        skyHor={skyState?.skyHor ?? '#87CEEB'}
      />

      {/* Stars */}
      <Stars visible={starsVisible} />

      {/* Sun / Moon */}
      <CelestialBody
        phase={skyState?.phase ?? 'morning'}
        altitude={skyState?.sunAltitude ?? 45}
        azimuth={skyState?.sunAzimuth ?? 180}
        sunColor={skyState?.sunColor ?? '#FFF5D0'}
      />

      {/* Fog */}
      {skyState?.hasFog && (
        <fog attach="fog" args={[skyState.fogColor, 18, 55]} />
      )}

      {/* Physics world — ground floor + building colliders */}
      <Physics gravity={[0, -9.81, 0]} colliders={false}>
        {/* Static ground plane */}
        <RigidBody type="fixed" colliders="cuboid">
          <CuboidCollider args={[30, 0.1, 30]} position={[0, -0.1, 0]} />
        </RigidBody>

        {/* Building static colliders — replace manual AABB */}
        {LOCATIONS.map(loc => {
          const [bx, , bz] = loc.pos;
          const [bw, bh, bd] = loc.size;
          return (
            <RigidBody key={loc.id} type="fixed" colliders={false}>
              <CuboidCollider args={[bw / 2 + 0.4, bh / 2, bd / 2 + 0.4]} position={[bx, bh / 2, bz]} />
            </RigidBody>
          );
        })}
      </Physics>

      {/* Ground */}
      <Ground isNight={isNight} />

      {/* River */}
      <River skyState={skyState} />

      {/* Sacred fire */}
      <SacredFire />

      {/* Floating Spirit figure above the fire — user's selected variant */}
      <group position={[0, 1.8, 0]}>
        <SpiritFigure variant={spiritVariant} scale={1.2} index={0} />
      </group>
      {/* Gentle glow beneath Spirit */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <circleGeometry args={[1.2, 32]} />
        <meshBasicMaterial color="#1877F2" transparent opacity={0.08} />
      </mesh>

      {/* Buildings */}
      {LOCATIONS.map(loc => (
        <Building key={loc.id} loc={loc} onEnter={onEnterBuilding} />
      ))}

      {/* Baobab trees */}
      {[
        [-14, 0, -8], [-13, 0, -3], [-14, 0, 3], [-13, 0, 7],
        [14,  0, -8], [13,  0, -2], [14,  0, 4], [13,  0, 8],
        [-4,  0, -13],[0,   0, -14],[4,   0, -13],
        [-4,  0, 13], [0,   0, 14], [4,   0, 13],
      ].map((pos, i) => (
        <BaobabTree key={i} pos={pos as [number,number,number]} scale={0.8 + Math.sin(i*1.4)*0.2} />
      ))}

      {/* Remote players */}
      {remotePlayers.map(p => (
        <PlayerCharacter key={p.userId}
          position={new THREE.Vector3(p.x, p.y, p.z)}
          rotation={p.rotation}
          skinColor={p.skinColor}
          isLocal={false}
          username={p.username}
        />
      ))}

      {/* Local player */}
      <PlayerCharacter
        position={playerPos.current}
        rotation={playerRot.current}
        skinColor="#8D5524"
        isLocal={true}
      />

      {/* Camera follow */}
      <CameraFollow targetPos={playerPos} />

      {/* Fireflies */}
      <Fireflies count={isNight ? 35 : 12} isNight={isNight} />
    </>
  );
}

// ─── Virtual joystick (mobile) ────────────────────────────────────────────────
function VirtualJoystick({ onMove }: { onMove: (dx: number, dy: number) => void }) {
  const stickRef = useRef<HTMLDivElement>(null);
  const touching = useRef(false);
  const origin   = useRef({ x: 0, y: 0 });
  const maxDist  = 40;

  function onTouchStart(e: React.TouchEvent) {
    touching.current = true;
    const t = e.touches[0];
    origin.current = { x: t.clientX, y: t.clientY };
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!touching.current || !stickRef.current) return;
    const t = e.touches[0];
    let dx = t.clientX - origin.current.x;
    let dy = t.clientY - origin.current.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist > maxDist) { dx = (dx/dist)*maxDist; dy = (dy/dist)*maxDist; }
    stickRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
    onMove(dx / maxDist, dy / maxDist);
  }

  function onTouchEnd() {
    touching.current = false;
    if (stickRef.current) stickRef.current.style.transform = 'translate(0,0)';
    onMove(0, 0);
  }

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="absolute bottom-24 left-6 w-24 h-24 rounded-full"
      style={{ background: 'rgba(255,255,255,0.12)', border: '2px solid rgba(255,255,255,0.25)', touchAction: 'none' }}>
      <div ref={stickRef}
        className="absolute inset-4 rounded-full transition-transform duration-75"
        style={{ background: 'rgba(255,255,255,0.4)', boxShadow: '0 0 15px rgba(24,119,242,0.5)' }} />
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────
export default function VillageWorld3D({ onNavigate }: { onNavigate?: (href: string) => void }) {
  const router   = useRouter();
  const supabase = createClient();
  const { mood } = useWeather();
  const { skyState } = useSkySystem();

  const [spiritVariant, setSpiritVariant] = useState<SpiritVariantId>('blue');
  const playerPos = useRef(new THREE.Vector3(0, 0, 5));
  const playerRot = useRef(0);
  const moveInput = useRef({ dx: 0, dy: 0 });
  const keys      = useRef<Set<string>>(new Set());

  const [remotePlayers, setRemotePlayers] = useState<RemotePlayer[]>([]);
  const [nearBuilding, setNearBuilding]   = useState<{ href: string; label: string } | null>(null);
  const [enterPrompt, setEnterPrompt]     = useState(false);
  const channelRef = useRef<any>(null);

  // ── Multiplayer presence ──────────────────────────────────────────────────
  useEffect(() => {
    let userId: string;
    let username: string;
    const presenceInterval = setInterval(async () => {
      if (!userId || !channelRef.current) return;
      await channelRef.current.track({
        user_id:   userId,
        username,
        x: playerPos.current.x,
        y: playerPos.current.y,
        z: playerPos.current.z,
        rotation:  playerRot.current,
        skinColor: '#8D5524',
      });
    }, 150);

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      userId = user.id;

      (supabase as any).from('profiles').select('username, avatar_config').eq('id', user.id).single()
        .then(({ data }: any) => {
          username = data?.username ?? 'villager';
          if (data?.avatar_config?.spirit_variant) {
            setSpiritVariant(data.avatar_config.spirit_variant as SpiritVariantId);
          }
        });

      const channel = supabase.channel('village_world', {
        config: { presence: { key: user.id } },
      });

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const others: RemotePlayer[] = [];
          Object.entries(state).forEach(([key, presences]) => {
            if (key !== user.id) {
              const p = (presences as any[])[0];
              if (p) others.push(p as RemotePlayer);
            }
          });
          setRemotePlayers(others);
        })
        .subscribe();

      channelRef.current = channel;
    });

    return () => {
      clearInterval(presenceInterval);
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, []);

  // ── Keyboard controls ─────────────────────────────────────────────────────
  useEffect(() => {
    const down = (e: KeyboardEvent) => keys.current.add(e.key);
    const up   = (e: KeyboardEvent) => keys.current.delete(e.key);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  // ── Movement loop ─────────────────────────────────────────────────────────
  useEffect(() => {
    const SPEED = 0.08;

    const loop = setInterval(() => {
      let dx = moveInput.current.dx;
      let dz = moveInput.current.dy;

      if (keys.current.has('w') || keys.current.has('ArrowUp'))    dz = -1;
      if (keys.current.has('s') || keys.current.has('ArrowDown'))  dz =  1;
      if (keys.current.has('a') || keys.current.has('ArrowLeft'))  dx = -1;
      if (keys.current.has('d') || keys.current.has('ArrowRight')) dx =  1;

      if (dx !== 0 || dz !== 0) {
        const mag = Math.sqrt(dx*dx + dz*dz);
        dx = (dx/mag) * SPEED;
        dz = (dz/mag) * SPEED;

        let nx = playerPos.current.x + dx;
        let nz = playerPos.current.z + dz;

        let blocked = false;
        for (const loc of LOCATIONS) {
          const [bx,,bz] = loc.pos;
          const [bw,,bd] = loc.size;
          const margin = 0.8;
          if (Math.abs(nx - bx) < bw/2 + margin && Math.abs(nz - bz) < bd/2 + margin) {
            blocked = true; break;
          }
        }
        // River boundary (left edge)
        if (nx < -15) blocked = true;
        if (Math.abs(nx) > 22 || Math.abs(nz) > 20) blocked = true;

        if (!blocked) {
          playerPos.current.set(nx, 0, nz);
          playerRot.current = Math.atan2(dx, dz);
        }

        let nearest: { href: string; label: string; dist: number } | null = null;
        for (const loc of LOCATIONS) {
          const [bx,,bz] = loc.pos;
          const dist = Math.sqrt((playerPos.current.x-bx)**2 + (playerPos.current.z-bz)**2);
          if (dist < 3.5 && (!nearest || dist < nearest.dist)) {
            nearest = { href: loc.href, label: loc.label, dist };
          }
        }
        setNearBuilding(nearest);
        setEnterPrompt(!!nearest);
      } else {
        setNearBuilding(null);
        setEnterPrompt(false);
      }
    }, 16);

    return () => clearInterval(loop);
  }, []);

  function handleEnterBuilding(href: string, label: string) {
    VillageSound.tap();
    if (onNavigate) onNavigate(href);
    else router.push(href);
  }

  // Sky background color transitions with the sky state
  const isNight = skyState?.phase === 'night' || skyState?.phase === 'dusk' || skyState?.phase === 'dawn';
  const bgColor = skyState?.skyTop ?? (isNight ? '#080912' : '#6AAEDC');

  return (
    <div className="w-full h-full relative">
      <Canvas
        shadows
        gl={{ antialias: false, powerPreference: 'high-performance', pixelRatio: Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 1.5) }}
        style={{ background: bgColor, transition: 'background 4s ease' }}
        performance={{ min: 0.5 }}
        camera={{ position: [0, 8, 12], fov: 60 }}
      >
        <WorldScene
          playerPos={playerPos}
          playerRot={playerRot}
          remotePlayers={remotePlayers}
          onEnterBuilding={handleEnterBuilding}
          skyState={skyState}
          spiritVariant={spiritVariant}
        />
      </Canvas>

      {/* Virtual joystick (mobile) */}
      <VirtualJoystick onMove={(dx, dy) => { moveInput.current = { dx, dy }; }} />

      {/* Enter building prompt */}
      {enterPrompt && nearBuilding && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-10">
          <button
            onClick={() => handleEnterBuilding(nearBuilding.href, nearBuilding.label)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-white animate-bounce"
            style={{ background: 'linear-gradient(135deg,#1877F2,#7C3AED)', boxShadow: '0 0 30px rgba(24,119,242,0.5)' }}>
            <span>↑</span> Enter {nearBuilding.label}
          </button>
        </div>
      )}

      {/* Sky phase indicator */}
      {skyState && (
        <div className="absolute top-16 left-4 z-10 px-3 py-1.5 rounded-full text-xs font-semibold capitalize"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', color: skyState.sunColor, border: `1px solid ${skyState.sunColor}30` }}>
          {skyState.phase} · {skyState.sunAltitude > 0 ? `☀ ${skyState.sunAltitude.toFixed(0)}°` : '🌙'}
        </div>
      )}

      {/* Online players count */}
      {remotePlayers.length > 0 && (
        <div className="absolute top-16 right-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', color: '#4ADE80' }}>
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          {remotePlayers.length + 1} online
        </div>
      )}

      {/* Controls hint */}
      <div className="absolute bottom-6 right-4 z-10 text-xs rounded-full px-3 py-1.5 hidden sm:block"
        style={{ background: 'rgba(0,0,0,0.4)', color: 'rgba(255,255,255,0.5)' }}>
        WASD / Arrow keys to move
      </div>
    </div>
  );
}
