'use client';
import { useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { useWeather } from '@/lib/theme/useWeather';
import { VillageSound } from '@/lib/sounds/village';
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

// ─── Adinkra canvas texture generator ────────────────────────────────────────
function createAdinkraTexture(color: string, bgColor = '#F5ECD0'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, 256, 256);

  // Kente stripe bands
  const stripeColors = [color, '#FFD700', color, bgColor];
  stripeColors.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.globalAlpha = i === 3 ? 0 : 0.6;
    ctx.fillRect(0, i * 64, 256, 64);
  });
  ctx.globalAlpha = 1;

  // Adinkra symbol (simplified Gye Nyame pattern)
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

// ─── Building component with cultural textures ────────────────────────────────
function Building({ loc, onEnter }: { loc: typeof LOCATIONS[0]; onEnter: (href: string, label: string) => void }) {
  const meshRef  = useRef<THREE.Mesh>(null);
  const roofRef  = useRef<THREE.Mesh>(null);
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
        <meshToonMaterial
          color={hovered ? '#ffffff' : '#F5ECD0'}
          map={tex.current}
        />
      </mesh>

      {/* Kente band */}
      <mesh position={[0, sh * 0.25, 0]}>
        <boxGeometry args={[sw + 0.05, sh * 0.15, sd + 0.05]} />
        <meshToonMaterial color={loc.color} />
      </mesh>

      {/* Roof */}
      <mesh ref={roofRef} position={[0, sh * 0.5 + 0.8, 0]}>
        <coneGeometry args={[Math.max(sw, sd) * 0.72, 1.6, loc.id === 'dreamline' || loc.id === 'zen' ? 16 : 4]} />
        <meshToonMaterial color={loc.color} flatShading={loc.id !== 'dreamline' && loc.id !== 'zen'} />
      </mesh>

      {/* Hover glow ring */}
      {hovered && (
        <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[Math.max(sw,sd) * 0.7, Math.max(sw,sd) * 0.9, 24]} />
          <meshBasicMaterial color={loc.color} transparent opacity={0.5} />
        </mesh>
      )}

      {/* Location label */}
      {hovered && (
        <mesh position={[0, sh * 0.5 + 2.5, 0]}>
          <planeGeometry args={[3, 0.8]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.7} />
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
  const trunkGeo = new THREE.CylinderGeometry(0.2, 0.35, 1.2, 10, 1);
  trunkGeo.computeVertexNormals();
  const canopyGeo = new THREE.IcosahedronGeometry(1.0, 1);
  canopyGeo.computeVertexNormals();

  return (
    <group ref={ref} position={pos} scale={scale}>
      <mesh geometry={trunkGeo} position={[0, 0.6, 0]} castShadow>
        <meshToonMaterial color="#6B4226" />
      </mesh>
      <mesh geometry={canopyGeo} position={[0, 1.6, 0]} castShadow>
        <meshToonMaterial color="#2D7D46" />
      </mesh>
      <mesh geometry={new THREE.IcosahedronGeometry(0.65, 1)} position={[0.5, 1.4, 0.3]} castShadow>
        <meshToonMaterial color="#22C55E" />
      </mesh>
      <mesh geometry={new THREE.IcosahedronGeometry(0.6, 1)} position={[-0.4, 1.3, -0.3]} castShadow>
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
  const flameGeo = new THREE.ConeGeometry(0.25, 0.7, 10, 1);
  flameGeo.computeVertexNormals();
  return (
    <group position={SPIRIT_POS}>
      {/* Stone ring */}
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        const stoneGeo = new THREE.SphereGeometry(0.18, 6, 5);
        stoneGeo.computeVertexNormals();
        return (
          <mesh key={i} geometry={stoneGeo} position={[Math.cos(a) * 0.7, 0.1, Math.sin(a) * 0.7]}>
            <meshToonMaterial color="#78716C" />
          </mesh>
        );
      })}
      {/* Flame */}
      <mesh ref={flameRef} geometry={flameGeo} position={[0, 0.5, 0]}>
        <meshBasicMaterial color="#FF6B2B" transparent opacity={0.9} />
      </mesh>
      <mesh geometry={new THREE.ConeGeometry(0.15, 0.4, 8)} position={[0, 0.4, 0]}>
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

  // Canvas texture for ground
  const groundTex = useRef<THREE.CanvasTexture>();
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = grassColor;
    ctx.fillRect(0, 0, 512, 512);
    // Grass texture dots
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
      {/* Main ground */}
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[50, 50, 16, 16]} />
        <meshToonMaterial color={grassColor} map={groundTex.current} />
      </mesh>
      {/* Dirt paths */}
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
      {/* Sacred plaza circle */}
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[3, 32]} />
        <meshToonMaterial color={pathColor} />
      </mesh>
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.025, 0]}>
        <ringGeometry args={[3, 3.4, 32]} />
        <meshBasicMaterial color={isNight ? '#5A4A2A' : '#A87C5A'} transparent opacity={0.7} />
      </mesh>
      {/* Water feature near Zen */}
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[-8.5, 0.05, 2]}>
        <circleGeometry args={[1.5, 20]} />
        <meshBasicMaterial color={isNight ? '#1E3A5A' : '#7EC8E3'} transparent opacity={0.85} />
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

  const headGeo = new THREE.SphereGeometry(0.35, 12, 10);
  headGeo.computeVertexNormals();
  const limbGeo = new THREE.CapsuleGeometry(0.1, 0.45, 4, 8);
  limbGeo.computeVertexNormals();

  useFrame(state => {
    if (!groupRef.current) return;
    // Smooth position follow
    groupRef.current.position.lerp(position, 0.15);
    groupRef.current.rotation.y = rotation;

    // Walk animation
    const t = state.clock.elapsedTime;
    const moving = position.distanceTo(groupRef.current.position) > 0.05;
    const swing  = moving ? Math.sin(t * 6) * 0.4 : 0;
    if (legLRef.current)  legLRef.current.rotation.x  = swing;
    if (legRRef.current)  legRRef.current.rotation.x  = -swing;
    if (armLRef.current)  armLRef.current.rotation.x  = -swing * 0.5;
    if (armRRef.current)  armRRef.current.rotation.x  = swing * 0.5;
    // Body bob
    groupRef.current.position.y = position.y + (moving ? Math.abs(Math.sin(t * 6)) * 0.05 : 0);
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Head */}
      <mesh geometry={headGeo} position={[0, 1.85, 0]} castShadow>
        <meshToonMaterial color={skinColor} />
      </mesh>
      {/* Hair */}
      <mesh position={[0, 2.1, 0]}>
        <sphereGeometry args={[0.28, 8, 6, 0, Math.PI*2, 0, Math.PI*0.6]} />
        <meshToonMaterial color="#1A0A00" />
      </mesh>
      {/* Eyes */}
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
      {/* Body */}
      <mesh position={[0, 1.35, 0]} castShadow>
        <boxGeometry args={[0.5, 0.55, 0.35]} />
        <meshToonMaterial color={tunicColor} />
      </mesh>
      {/* Kente band on body */}
      <mesh position={[0, 1.25, 0]}>
        <boxGeometry args={[0.52, 0.08, 0.37]} />
        <meshToonMaterial color="#FFD700" />
      </mesh>
      {/* Arms */}
      <mesh ref={armLRef} geometry={limbGeo} position={[0.35, 1.35, 0]} castShadow>
        <meshToonMaterial color={tunicColor} />
      </mesh>
      <mesh ref={armRRef} geometry={limbGeo} position={[-0.35, 1.35, 0]} castShadow>
        <meshToonMaterial color={tunicColor} />
      </mesh>
      {/* Legs */}
      <mesh ref={legLRef} geometry={limbGeo} position={[0.15, 0.8, 0]} castShadow>
        <meshToonMaterial color="#1A0A00" />
      </mesh>
      <mesh ref={legRRef} geometry={limbGeo} position={[-0.15, 0.8, 0]} castShadow>
        <meshToonMaterial color="#1A0A00" />
      </mesh>
      {/* Feet */}
      <mesh position={[0.15, 0.5, 0.08]}>
        <boxGeometry args={[0.18, 0.1, 0.28]} />
        <meshToonMaterial color="#111111" />
      </mesh>
      <mesh position={[-0.15, 0.5, 0.08]}>
        <boxGeometry args={[0.18, 0.1, 0.28]} />
        <meshToonMaterial color="#111111" />
      </mesh>
      {/* Name tag for remote players */}
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
  const offset = new THREE.Vector3(0, 6, 10);
  const lookAt = new THREE.Vector3();

  useFrame(() => {
    const target = targetPos.current.clone().add(offset);
    camera.position.lerp(target, 0.08);
    lookAt.lerp(targetPos.current.clone().add(new THREE.Vector3(0, 1, 0)), 0.1);
    camera.lookAt(lookAt);
  });
  return null;
}

// ─── Particle systems ─────────────────────────────────────────────────────────
function Fireflies({ count = 25, isNight = false }: { count?: number; isNight?: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const data = useRef(Array.from({ length: count }, () => ({
    x: (Math.random()-0.5)*30, y: 0.5+Math.random()*2,
    z: (Math.random()-0.5)*25, sp: 0.3+Math.random()*0.6, ph: Math.random()*Math.PI*2,
  })));
  useFrame(state => {
    if (!ref.current) return;
    const dummy = new THREE.Object3D();
    const t = state.clock.elapsedTime;
    data.current.forEach((p, i) => {
      dummy.position.set(p.x+Math.sin(t*p.sp+p.ph)*0.8, p.y+Math.sin(t*p.sp*1.3+p.ph)*0.4, p.z+Math.cos(t*p.sp*0.7+p.ph)*0.6);
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
    (ref.current.material as THREE.MeshBasicMaterial).opacity = isNight ? 0.55+Math.sin(state.clock.elapsedTime*3)*0.3 : 0.15;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.05, 5, 4]} />
      <meshBasicMaterial color={isNight ? '#FFD700' : '#FFFFFF'} transparent />
    </instancedMesh>
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
  playerPos, playerRot, remotePlayers, onEnterBuilding, isNight, weatherMood,
}: {
  playerPos: React.MutableRefObject<THREE.Vector3>;
  playerRot: React.MutableRefObject<number>;
  remotePlayers: RemotePlayer[];
  onEnterBuilding: (href: string, label: string) => void;
  isNight: boolean;
  weatherMood: string;
}) {
  const [playerPosition] = useState(() => playerPos.current.clone());
  const playerDisplayPos = useRef(new THREE.Vector3(0, 0, 0));

  useFrame(() => {
    playerDisplayPos.current.copy(playerPos.current);
  });

  const sunPos: [number,number,number] = isNight ? [-10, 15, -10] : [10, 20, 5];
  const sunColor = isNight ? '#2A1A50' : weatherMood === 'rainy' ? '#8899AA' : '#FFF5D0';

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={isNight ? 0.3 : 0.65} color={isNight ? '#1A0A30' : '#FFFBF0'} />
      <directionalLight position={sunPos} intensity={isNight ? 0.2 : 0.85} color={sunColor} castShadow
        shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <pointLight position={[0, 3, 0]} intensity={isNight ? 0.5 : 0.1} color="#FF6B2B" />

      {/* Ground */}
      <Ground isNight={isNight} />

      {/* Sacred fire */}
      <SacredFire />

      {/* Buildings */}
      {LOCATIONS.map(loc => (
        <Building key={loc.id} loc={loc} onEnter={onEnterBuilding} />
      ))}

      {/* Trees */}
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

      {/* Sky */}
      <mesh position={[0, 5, -30]}>
        <planeGeometry args={[80, 40]} />
        <meshBasicMaterial color={isNight ? '#08091A' : weatherMood === 'rainy' ? '#8899AA' : '#87CEEB'} />
      </mesh>
    </>
  );
}

// ─── Virtual joystick (mobile) ────────────────────────────────────────────────
function VirtualJoystick({ onMove }: { onMove: (dx: number, dy: number) => void }) {
  const baseRef  = useRef<HTMLDivElement>(null);
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
    <div ref={baseRef}
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
  const router  = useRouter();
  const supabase = createClient();
  const { theme } = useVillageTheme();
  const { mood }  = useWeather();
  const isNight   = theme === 'night';

  const playerPos = useRef(new THREE.Vector3(0, 0, 5));
  const playerRot = useRef(0);
  const targetPos = useRef(new THREE.Vector3(0, 0, 5));
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

      supabase.from('profiles').select('username').eq('id', user.id).single()
        .then(({ data }) => { username = data?.username ?? 'villager'; });

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

        // AABB collision with buildings
        let blocked = false;
        for (const loc of LOCATIONS) {
          const [bx,,bz] = loc.pos;
          const [bw,,bd] = loc.size;
          const margin = 0.8;
          if (Math.abs(nx - bx) < bw/2 + margin && Math.abs(nz - bz) < bd/2 + margin) {
            blocked = true; break;
          }
        }

        // World boundary
        if (Math.abs(nx) > 22 || Math.abs(nz) > 20) blocked = true;

        if (!blocked) {
          playerPos.current.set(nx, 0, nz);
          playerRot.current = Math.atan2(dx, dz);
        }

        // Check proximity to buildings
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

  // ── Tap-to-move ───────────────────────────────────────────────────────────
  function handleCanvasClick(e: React.MouseEvent) {
    // Raycasting done by Three.js onClick on building meshes
    // For ground tap — we use a simple projection
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width * 2 - 1) * 15;
    const nz = -((e.clientY - rect.top)  / rect.height * 2 - 1) * 15;
    targetPos.current.set(nx, 0, nz);
  }

  function handleEnterBuilding(href: string, label: string) {
    VillageSound.tap();
    if (onNavigate) onNavigate(href);
    else router.push(href);
  }

  const skyGradient = isNight
    ? 'linear-gradient(180deg,#080912 0%,#1A1A3A 100%)'
    : mood === 'rainy' ? 'linear-gradient(180deg,#607080 0%,#8898AA 100%)'
    : 'linear-gradient(180deg,#6AAEDC 0%,#C8E6FF 100%)';

  return (
    <div className="w-full h-full relative">
      <Canvas
        shadows
        gl={{ antialias: false, powerPreference: 'high-performance', pixelRatio: Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 1.5) }}
        style={{ background: skyGradient }}
        performance={{ min: 0.5 }}
        camera={{ position: [0, 8, 12], fov: 60 }}
        onClick={handleCanvasClick}
      >
        <WorldScene
          playerPos={playerPos}
          playerRot={playerRot}
          remotePlayers={remotePlayers}
          onEnterBuilding={handleEnterBuilding}
          isNight={isNight}
          weatherMood={mood}
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
