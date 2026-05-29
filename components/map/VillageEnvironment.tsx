'use client';
import { useRef, useMemo, Suspense, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { SeasonState } from '@/lib/world/useSeason';
import { createClient } from '@/lib/supabase/client';

// ─── Model base URL ───────────────────────────────────────────────────────────
const M = (name: string) => `/models/gltf/${name}.gltf`;

// ─── Terrain height function ──────────────────────────────────────────────────
export function terrainH(x: number, z: number): number {
  const r       = Math.sqrt(x * x + z * z);
  const flatten = Math.max(0, 1 - r / 14) * 0.92;
  const raw =
    Math.sin(x * 0.048 + 0.4) * 1.35 +
    Math.sin(z * 0.042 + 0.9) * 1.05 +
    Math.sin((x + z) * 0.055) * 0.75 +
    Math.sin(x * 0.09 - z * 0.06) * 0.42 +
    Math.cos(x * 0.07 - 1.2) * 0.55 +
    Math.cos(z * 0.065 + 2.1) * 0.48;
  return raw * (1 - flatten);
}

// Path proximity (0=on path, 1=off path)
const PATHS: [number, number][] = [
  [-22,-16],[22,-16],[-22,16],[22,16],[-34,-8],[30,0],[0,-28],[0,26],
];
export function pathness(x: number, z: number): number {
  let min = Infinity;
  for (const [bx, bz] of PATHS) {
    const t  = Math.max(0, Math.min(1, (x*bx + z*bz) / (bx*bx + bz*bz)));
    const px = bx*t, pz = bz*t;
    const d  = Math.sqrt((x-px)**2 + (z-pz)**2);
    if (d < min) min = d;
  }
  return Math.min(1, min / 2.5);
}

// ─── GLTF model — loads and places a single model at terrain height ───────────
function Model({
  url, position, rotation = 0, scale = 1, yOffset = 0,
}: {
  url: string; position: [number, number, number];
  rotation?: number; scale?: number; yOffset?: number;
}) {
  const { scene } = useGLTF(url);
  const clone = useMemo(() => {
    const c = scene.clone(true);
    c.traverse(child => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).castShadow    = true;
        (child as THREE.Mesh).receiveShadow = true;
      }
    });
    return c;
  }, [scene]);
  const y = terrainH(position[0], position[2]) + yOffset;
  return (
    <primitive object={clone} position={[position[0], y, position[2]]}
      rotation={[0, rotation, 0]} scale={scale} />
  );
}

// ─── Wandering animal ─────────────────────────────────────────────────────────
function WanderingAnimal({
  url, home, speed = 0.4, radius = 6, scale = 1, phase = 0,
}: {
  url: string; home: [number, number];
  speed?: number; radius?: number; scale?: number; phase?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(url);
  const clone = useMemo(() => scene.clone(true), [scene]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t  = clock.elapsedTime * speed + phase;
    const x  = home[0] + Math.cos(t * 0.4) * radius + Math.sin(t * 0.7) * radius * 0.4;
    const z  = home[1] + Math.sin(t * 0.4) * radius + Math.cos(t * 0.5) * radius * 0.35;
    const y  = terrainH(x, z);
    groupRef.current.position.set(x, y, z);
    const dx = Math.cos(t * 0.4 + 0.01) - Math.cos(t * 0.4 - 0.01);
    const dz = Math.sin(t * 0.4 + 0.01) - Math.sin(t * 0.4 - 0.01);
    groupRef.current.rotation.y = Math.atan2(dx, dz) + Math.PI;
  });

  return (
    <group ref={groupRef} scale={scale}>
      <primitive object={clone} />
    </group>
  );
}

// ─── Swimming fish ────────────────────────────────────────────────────────────
function SwimmingFish({
  url, cx, cz, radius = 4, depth = -0.5, speed = 1.2, phase = 0, scale = 0.8,
}: {
  url: string; cx: number; cz: number;
  radius?: number; depth?: number; speed?: number; phase?: number; scale?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(url);
  const clone = useMemo(() => scene.clone(true), [scene]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t   = clock.elapsedTime * speed + phase;
    const x   = cx + Math.cos(t) * radius;
    const z   = cz + Math.sin(t) * radius;
    const bob = Math.sin(clock.elapsedTime * 2 + phase) * 0.08;
    groupRef.current.position.set(x, depth + bob, z);
    groupRef.current.rotation.y = -t + Math.PI / 2;
  });

  return (
    <group ref={groupRef} scale={scale}>
      <primitive object={clone} />
    </group>
  );
}

// ─── Coastal ocean ────────────────────────────────────────────────────────────
export function CoastalOcean({ isNight, skyState }: { isNight: boolean; skyState: any }) {
  const isGolden = skyState?.phase === 'golden' || skyState?.phase === 'sunset';
  const wCol = isNight ? '#1A2E4A' : isGolden ? '#A06820' : '#1E6EA8';

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
        <ringGeometry args={[46, 200, 64, 1]} />
        <meshBasicMaterial color={wCol} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 0]}>
        <ringGeometry args={[44, 50, 64, 1]} />
        <meshBasicMaterial color={isNight ? '#2A4A6A' : '#3A8AC8'} transparent opacity={0.55} />
      </mesh>
    </group>
  );
}

// ─── Terrain mesh with vertex colors by biome ─────────────────────────────────
export function VillageTerrain({ isNight, season = 'summer' }: {
  isNight: boolean; season?: string;
}) {
  const geometry = useMemo(() => {
    const SEGS = 80, SIZE = 160;
    const geo  = new THREE.PlaneGeometry(SIZE, SIZE, SEGS, SEGS);
    geo.rotateX(-Math.PI / 2);
    const pos    = geo.attributes.position as THREE.BufferAttribute;
    const colors: number[] = [];

    const isFall   = season === 'autumn' || season === 'fall';
    const isWinter = season === 'winter';

    const grassGreen = new THREE.Color(isNight ? '#1E3018' : isFall ? '#4A5820' : isWinter ? '#3A4835' : '#3D6B2A');
    const pathDirt   = new THREE.Color(isNight ? '#3C2E1E' : '#8C7050');
    const soilDark   = new THREE.Color(isNight ? '#180E06' : '#2A1A08');
    const farmField  = new THREE.Color(isNight ? '#2A3018' : isFall ? '#8A6820' : '#6A8830');
    const snowWhite  = new THREE.Color('#D8E4F0');
    const iceBlue    = new THREE.Color('#8AAAC8');
    const forestDark = new THREE.Color(isNight ? '#142014' : isFall ? '#3A4520' : '#284A18');
    const coastal    = new THREE.Color(isNight ? '#1A2820' : '#3A6040');
    const centerPack = new THREE.Color(isNight ? '#2A1E10' : '#5A4030');

    for (let i = 0; i < pos.count; i++) {
      const wx = pos.getX(i), wz = pos.getZ(i);
      pos.setY(i, terrainH(wx, wz));

      const r   = Math.sqrt(wx*wx + wz*wz);
      const pn  = pathness(wx, wz);
      const ang = Math.atan2(wz, wx);

      let c = grassGreen.clone();

      if (r < 8) {
        c = centerPack.clone();
      } else if (pn < 0.4) {
        c = pathDirt.clone().lerp(grassGreen, pn / 0.4);
      } else {
        const westZone  = ang > 2.3 || ang < -2.3;
        const northZone = ang > -2.0 && ang < -0.5 && r > 15;
        const farmZone  = ang > -0.3 && ang < 0.8 && r > 15 && r < 40;
        const coastZone = ang > -1.8 && ang < -0.8 && r > 22;

        if (westZone && r > 20) {
          c = isWinter ? snowWhite.clone().lerp(iceBlue, 0.4) : iceBlue.clone().lerp(grassGreen, 0.5);
          if (r > 34) c = isWinter ? snowWhite.clone() : iceBlue.clone();
        } else if (northZone) {
          c = forestDark.clone();
        } else if (farmZone) {
          c = farmField.clone();
        } else if (coastZone) {
          c = coastal.clone();
        } else if (isWinter && r > 25) {
          c = grassGreen.clone().lerp(snowWhite, 0.3);
        }
      }

      if (r > 42) {
        const t = Math.min(1, (r - 42) / 6);
        c.lerp(new THREE.Color(isNight ? '#0A1820' : '#2A5A80'), t);
      }

      colors.push(c.r, c.g, c.b);
    }

    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, [isNight, season]);

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshToonMaterial vertexColors side={THREE.FrontSide} />
    </mesh>
  );
}

// ─── Stone paths ──────────────────────────────────────────────────────────────
export function StonePaths({ isNight }: { isNight: boolean }) {
  const stoneColor = isNight ? '#2A2420' : '#8A7060';
  const paths: [number,number,number,number,number,number][] = [
    [0, 0, -14, 0, 28, 0.9],   // N-S spine
    [-14, 0, 0, 90, 28, 0.9],  // E-W spine
  ];
  return (
    <group>
      {paths.map(([x, y, z, rot, len, w], i) => (
        <mesh key={i} position={[x, 0.05, z]} rotation={[0, rot * Math.PI / 180, 0]}>
          <planeGeometry args={[w, len]} />
          <meshToonMaterial color={stoneColor} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Tree system — intentional placement, one tree per spot ──────────────────
// 24 trees total: each placed with purpose, no random scatter
function GltfTree({ url, pos, sc = 1, rot = 0 }: {
  url: string; pos: [number, number, number]; sc?: number; rot?: number;
}) {
  return (
    <Suspense fallback={null}>
      <Model url={url} position={pos} scale={sc} rotation={rot} />
    </Suspense>
  );
}

export function TreeSystem({ windStr = 0, season = 'summer' }: {
  windStr?: number; season?: string;
}) {
  const isWinter = season === 'winter';

  return (
    <group>
      {/* ── North forest — around Hut (sparse, 6 trees) ── */}
      <GltfTree url={M('BirchTree_1')} pos={[-8, 0,  20]} sc={1.1} rot={0.3} />
      <GltfTree url={M('MapleTree_2')} pos={[ 8, 0,  20]} sc={1.2} rot={1.1} />
      <GltfTree url={M('BirchTree_3')} pos={[-10,0,  30]} sc={1.0} rot={2.1} />
      <GltfTree url={M('MapleTree_1')} pos={[ 10,0,  30]} sc={1.1} rot={0.8} />
      <GltfTree url={M('BirchTree_2')} pos={[-6, 0,  36]} sc={0.9} rot={1.5} />
      <GltfTree url={M('MapleTree_3')} pos={[ 6, 0,  36]} sc={1.0} rot={2.8} />

      {/* ── Tribes forest — northeast (4 trees, visible but not crowded) ── */}
      <GltfTree url={M('MapleTree_4')} pos={[18, 0,  4]} sc={1.1} rot={0.5} />
      <GltfTree url={M('BirchTree_4')} pos={[34, 0,  4]} sc={1.0} rot={1.8} />
      <GltfTree url={M('MapleTree_5')} pos={[18, 0, 14]} sc={1.2} rot={2.5} />
      <GltfTree url={M('BirchTree_5')} pos={[34, 0, 14]} sc={0.9} rot={0.2} />

      {/* ── Icy west — pine trees approaching mountain (4 trees) ── */}
      <GltfTree url={M('Resource_PineTree')} pos={[-26,0,-16]} sc={1.3} rot={0.5} />
      <GltfTree url={M('Resource_PineTree')} pos={[-32,0,-22]} sc={1.5} rot={1.2} />
      <GltfTree url={M(isWinter ? 'DeadTree_1' : 'Resource_PineTree')} pos={[-38,0,-16]} sc={1.2} rot={2.0} />
      <GltfTree url={M(isWinter ? 'DeadTree_2' : 'Resource_PineTree')} pos={[-38,0,-28]} sc={1.4} rot={0.8} />

      {/* ── Coastal palms — Wellness Center (3 palms) ── */}
      <GltfTree url={M('Environment_PalmTree_1')} pos={[ 8,0,-28]} sc={1.1} rot={0.4} />
      <GltfTree url={M('Environment_PalmTree_2')} pos={[-8,0,-30]} sc={1.2} rot={1.6} />
      <GltfTree url={M('Environment_PalmTree_3')} pos={[14,0,-32]} sc={1.0} rot={0.9} />

      {/* ── Farm zone — scattered birch + maple (4 trees) ── */}
      <GltfTree url={M('BirchTree_1')} pos={[-24,0,-22]} sc={1.0} rot={0.9} />
      <GltfTree url={M('MapleTree_2')} pos={[-26,0,-12]} sc={1.1} rot={2.3} />
      <GltfTree url={M('BirchTree_3')} pos={[-14,0,-26]} sc={0.9} rot={1.4} />

      {/* ── Outer border — 3 landmark trees (sparse edge markers) ── */}
      <GltfTree url={M('BirchTree_2')} pos={[ 40,0, -8]} sc={1.3} rot={0.6} />
      <GltfTree url={M('MapleTree_4')} pos={[-10,0, 42]} sc={1.2} rot={1.9} />
      <GltfTree url={M('Resource_PineTree')} pos={[-40,0,  6]} sc={1.5} rot={0.3} />
    </group>
  );
}

// ─── Rock clusters — 8 strategic rocks ───────────────────────────────────────
export function RockSystem() {
  const spots: [string, number, number, number, number][] = [
    ['Rock',       -28, -18, 0.9, 0.4],
    ['Rock_Group',  26,  20, 0.8, 1.2],
    ['Rock',       -18,  22, 0.7, 2.1],
    ['Resource_Rock_1', 30, -15, 1.0, 0.6],
    ['Rock_Group',  -8,  28, 0.9, 0.3],
    ['Rock',        18, -26, 0.8, 1.8],
    ['Resource_Rock_2', -30, 10, 1.1, 1.0],
    ['Rock',        36,  10, 0.7, 2.4],
  ];
  return (
    <group>
      {spots.map(([name, x, z, sc, rot], i) => (
        <Suspense key={i} fallback={null}>
          <Model url={M(name)} position={[x, 0, z]} scale={sc} rotation={rot} />
        </Suspense>
      ))}
    </group>
  );
}

// ─── Flower patches — small clusters only in clearings ────────────────────────
export function FlowerSystem() {
  const spots: [number, number, number][] = [
    [ 12,  14, 0], [-12, -12, 1], [ 18,   8, 2],
    [-16,  -4, 3], [  6, -18, 4], [ -6,  16, 0],
    [ 20, -20, 1], [-20,  14, 2],
  ];
  const urls = [M('Flower_1_Clump'), M('Flower_2_Clump'), M('Flower_3_Clump'), M('Flower_4_Clump'), M('Flower_5_Clump')];
  return (
    <group>
      {spots.map(([x, z, ui], i) => (
        <Suspense key={i} fallback={null}>
          <Model url={urls[ui % urls.length]} position={[x, 0, z]} scale={0.9} rotation={i * 0.7} />
        </Suspense>
      ))}
    </group>
  );
}

// ─── Animals — 6 well-spaced animals with distinct home territories ───────────
export function AnimalSystem() {
  return (
    <group>
      <Suspense fallback={null}>
        {/* Deer near Hut forest — stays north */}
        <WanderingAnimal url={M('Deer')}   home={[0, 32]}    scale={1.0} phase={0}   radius={5} speed={0.25} />
        {/* Fox near Tribes */}
        <WanderingAnimal url={M('Fox')}    home={[26, 12]}   scale={0.85}phase={1.5} radius={5} speed={0.5}  />
        {/* Wolf in mountain approach — west */}
        <WanderingAnimal url={M('Wolf')}   home={[-30,-18]}  scale={1.1} phase={0.8} radius={7} speed={0.22} />
        {/* Horse in farm zone — SE */}
        <WanderingAnimal url={M('Horse')}  home={[22,-18]}   scale={1.1} phase={0.5} radius={6} speed={0.2}  />
        {/* Husky near village center */}
        <WanderingAnimal url={M('Husky')}  home={[0, 0]}     scale={0.7} phase={0.3} radius={4} speed={0.55} />
        {/* Alpaca near Zen — mountain plateau */}
        <WanderingAnimal url={M('Alpaca')} home={[-34,-22]}  scale={1.0} phase={2.0} radius={4} speed={0.18} />
      </Suspense>
    </group>
  );
}

// ─── Coastal fish — 4 fish in north ocean ────────────────────────────────────
export function CoastalFish() {
  return (
    <group>
      <Suspense fallback={null}>
        <SwimmingFish url={M('Prop_Fish_Mackerel')} cx={10}  cz={-52} radius={6} speed={1.4} phase={0}   scale={0.9} />
        <SwimmingFish url={M('Prop_Fish_Tuna')}     cx={-5}  cz={-55} radius={8} speed={1.1} phase={1.5} scale={1.1} />
        <SwimmingFish url={M('Prop_Fish_Mackerel')} cx={52}  cz={5}   radius={5} speed={1.5} phase={2.0} scale={0.85}/>
        <SwimmingFish url={M('Prop_Fish_Tuna')}     cx={8}   cz={52}  radius={6} speed={1.2} phase={3.0} scale={1.0} />
      </Suspense>
    </group>
  );
}

// ─── Ground clutter — 20 sparse bushes and logs ───────────────────────────────
export function GroundClutter() {
  const items: [number, number, string, number][] = [
    [-16,  -8, 'Bush',         0.3],
    [ 14,  -8, 'Bush_Flowers', 0.8],
    [-20,   4, 'Bush',         2.1],
    [ 18,  10, 'Logs',         1.4],
    [ -4,  18, 'Bush_Small',   0.5],
    [ 16,  22, 'Bush_Flowers', 2.8],
    [-12, -20, 'Logs',         1.0],
    [ 20, -10, 'Bush',         1.6],
    [ -8, -10, 'Bush_Flowers', 3.1],
    [  2,  14, 'Bush_Small',   0.2],
    [-24,   0, 'Logs',         1.9],
    [ 24,   0, 'Bush',         0.7],
    [-16,  14, 'Bush_Flowers', 2.4],
    [ 12,  -4, 'Bush_Small',   1.1],
    [-22, -10, 'Bush',         2.6],
    [ 28,  -4, 'Logs',         0.4],
    [-28,  -4, 'Bush_Small',   1.7],
    [ -2,  -6, 'Bush',         2.9],
    [ 16, -14, 'Bush_Flowers', 0.6],
    [-18,  28, 'Logs',         1.3],
  ];
  return (
    <group>
      {items.map(([x, z, name, rot], i) => (
        <Suspense key={i} fallback={null}>
          <Model url={M(name)} position={[x, 0, z]} rotation={rot} scale={0.6 + (i % 3) * 0.1} />
        </Suspense>
      ))}
    </group>
  );
}

// ─── Sacred fire ──────────────────────────────────────────────────────────────
export function SacredFire() {
  const flame1 = useRef<THREE.Mesh>(null);
  const flame2 = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (flame1.current) flame1.current.scale.set(0.8+Math.sin(t*5.2)*0.18, 1+Math.sin(t*6.1)*0.22, 0.8+Math.cos(t*4.8)*0.14);
    if (flame2.current) flame2.current.scale.set(0.7+Math.sin(t*7.1+1)*0.2, 1+Math.sin(t*5.5+0.5)*0.28, 0.7+Math.cos(t*6.3+1)*0.16);
    if (glowRef.current) (glowRef.current.material as THREE.MeshBasicMaterial).opacity = 0.14+Math.sin(t*3.5)*0.06;
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Stone ring */}
      {Array.from({length: 8}, (_, i) => {
        const a = (i/8)*Math.PI*2;
        return <mesh key={i} position={[Math.cos(a)*0.72, 0.14, Math.sin(a)*0.72]}>
          <dodecahedronGeometry args={[0.16, 0]} />
          <meshToonMaterial color={i%2===0 ? '#5A4838' : '#4A3828'} />
        </mesh>;
      })}
      {/* Logs */}
      <mesh position={[0.2, 0.1, 0]} rotation={[0, 0.6, 0.25]}>
        <cylinderGeometry args={[0.07, 0.1, 1.0, 10, 2]} />
        <meshToonMaterial color="#3D2410" />
      </mesh>
      <mesh position={[-0.2, 0.1, 0]} rotation={[0, -0.6, 0.2]}>
        <cylinderGeometry args={[0.07, 0.1, 1.0, 10, 2]} />
        <meshToonMaterial color="#3D2410" />
      </mesh>
      {/* Flame */}
      <mesh ref={flame1} position={[0, 0.8, 0]}>
        <coneGeometry args={[0.18, 0.55, 8, 2]} />
        <meshBasicMaterial color="#FF8C00" transparent opacity={0.92} />
      </mesh>
      <mesh ref={flame2} position={[0, 1.05, 0]}>
        <coneGeometry args={[0.1, 0.38, 8, 2]} />
        <meshBasicMaterial color="#FFDD44" transparent opacity={0.85} />
      </mesh>
      {/* Glow */}
      <mesh ref={glowRef} position={[0, 0.5, 0]}>
        <sphereGeometry args={[1.2, 16, 12]} />
        <meshBasicMaterial color="#FF8C00" transparent opacity={0.14} />
      </mesh>
    </group>
  );
}

// ─── Stone lanterns — 8 around the village center ────────────────────────────
export function StoneLanterns({ isNight }: { isNight: boolean }) {
  const positions: [number, number][] = [
    [-6, -6], [6, -6], [6, 6], [-6, 6],
    [-12, 0], [12, 0], [0, -12], [0, 12],
  ];
  return (
    <group>
      {positions.map(([x, z], i) => {
        const y = terrainH(x, z);
        return (
          <group key={i} position={[x, y, z]}>
            <mesh position={[0, 0.3, 0]}>
              <boxGeometry args={[0.25, 0.6, 0.25]} />
              <meshToonMaterial color="#6A5A4A" />
            </mesh>
            <mesh position={[0, 0.7, 0]}>
              <boxGeometry args={[0.3, 0.3, 0.3]} />
              <meshToonMaterial color={isNight ? '#FFC060' : '#8A7A6A'} />
            </mesh>
            {isNight && (
              <pointLight color="#FF9020" intensity={0.6} distance={4} decay={2} position={[0, 0.7, 0]} />
            )}
          </group>
        );
      })}
    </group>
  );
}

// ─── Fireflies — evening atmosphere ──────────────────────────────────────────
export function Fireflies({ visible }: { visible: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const COUNT = 30;
  const data = useMemo(() => Array.from({length: COUNT}, () => ({
    x: (Math.random()-0.5)*50, z: (Math.random()-0.5)*50,
    baseY: 1.0 + Math.random()*2.0, speed: 0.3 + Math.random()*0.5,
    phase: Math.random()*Math.PI*2, radius: 1.0 + Math.random()*2.5,
  })), []);

  useFrame(({clock}) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    const dummy = new THREE.Object3D();
    data.forEach((d, i) => {
      const flicker = Math.sin(t*4.2 + d.phase) > 0.1;
      const scale   = visible && flicker ? 0.06 + Math.random()*0.04 : 0;
      dummy.position.set(
        d.x + Math.cos(t*d.speed + d.phase)*d.radius,
        terrainH(d.x, d.z) + d.baseY + Math.sin(t*0.7 + d.phase)*0.5,
        d.z + Math.sin(t*d.speed*0.8 + d.phase+1)*d.radius,
      );
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, COUNT]}>
      <sphereGeometry args={[1, 6, 5]} />
      <meshBasicMaterial color="#AAFF44" transparent opacity={0.85} />
    </instancedMesh>
  );
}

// ─── Dense grass — subtle ground cover ───────────────────────────────────────
export function DenseGrass({ windStr = 0 }: { windStr?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const COUNT = 800;

  const blades = useMemo(() => {
    const arr: { x: number; z: number; rot: number; ph: number }[] = [];
    let tries = 0;
    while (arr.length < COUNT && tries++ < COUNT * 8) {
      const x = (Math.random()-0.5)*90, z = (Math.random()-0.5)*90;
      const r = Math.sqrt(x*x+z*z);
      if (r < 8 || r > 46 || pathness(x,z) < 0.6) continue;
      arr.push({ x, z, rot: Math.random()*Math.PI*2, ph: Math.random()*Math.PI*2 });
    }
    return arr;
  }, []);

  const col = useMemo(() => [
    new THREE.Color('#2A5C14'), new THREE.Color('#306818'),
    new THREE.Color('#246010'), new THREE.Color('#387020'),
  ], []);

  useFrame(({clock}) => {
    const t = clock.elapsedTime;
    const dummy = new THREE.Object3D();
    if (!ref.current) return;
    blades.forEach((b, i) => {
      const h    = 0.12;
      const wind = Math.sin(t*2.0 + b.x*0.32 + b.ph) * windStr * 0.06;
      dummy.position.set(b.x, terrainH(b.x, b.z) + h*0.5, b.z);
      dummy.rotation.set(wind, b.rot, 0);
      dummy.scale.set(0.018, h, 0.018);
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
      ref.current!.setColorAt(i, col[i % col.length]);
    });
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, COUNT]}>
      <coneGeometry args={[0.5, 1, 3, 2]} />
      <meshToonMaterial side={THREE.DoubleSide} />
    </instancedMesh>
  );
}

// ─── World landmarks — dock, windmill, sawmill, watchtower ────────────────────
export function WorldLandmarks() {
  return (
    <Suspense fallback={null}>
      {/* Coastal dock — by Wellness Center */}
      <Model url={M('Environment_Dock')}      position={[6,  0, -40]} rotation={0}    scale={1.2} />
      <Model url={M('Environment_Dock_Pole')} position={[10, 0, -42]} rotation={0}    scale={1.0} />
      <Model url={M('Environment_Dock_Pole')} position={[ 2, 0, -42]} rotation={0}    scale={1.0} />
      {/* Windmill — farm zone */}
      <Model url={M('Windmill_FirstAge')}     position={[-28, 0, -24]} rotation={0.8} scale={1.0} />
      {/* Sawmill — farm zone */}
      <Model url={M('Environment_Sawmill')}   position={[-26, 0, -10]} rotation={-0.4} scale={1.0} />
      {/* Watch tower — northeast */}
      <Model url={M('WatchTower_FirstAge_Level1')} position={[38, 0, -8]} rotation={1.6} scale={1.0} />
    </Suspense>
  );
}

// ─── Admin world objects — live objects placed via sandbox ───────────────────
interface WorldObject {
  id: string; model_url: string;
  pos_x: number; pos_y: number; pos_z: number;
  rot_y: number; scale: number;
}

function AdminModelInstance({ obj }: { obj: WorldObject }) {
  const { scene } = useGLTF(obj.model_url);
  const clone = useMemo(() => {
    const c = scene.clone(true);
    c.traverse(child => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).castShadow    = true;
        (child as THREE.Mesh).receiveShadow = true;
      }
    });
    return c;
  }, [scene]);
  return (
    <primitive
      object={clone}
      position={[obj.pos_x, obj.pos_y, obj.pos_z]}
      rotation={[0, obj.rot_y, 0]}
      scale={obj.scale}
    />
  );
}

export function AdminWorldObjects() {
  const [objects, setObjects] = useState<WorldObject[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('admin_world_objects')
      .select('id,model_url,pos_x,pos_y,pos_z,rot_y,scale')
      .eq('is_live', true)
      .then(({ data, error }) => { if (!error && data) setObjects(data); });
  }, []);

  return (
    <Suspense fallback={null}>
      {objects.map(obj => (
        <AdminModelInstance key={obj.id} obj={obj} />
      ))}
    </Suspense>
  );
}

// ─── Snow system ──────────────────────────────────────────────────────────────
function SnowSystem() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const COUNT = 600;
  const flakes = useMemo(() => Array.from({ length: COUNT }, () => ({
    x: (Math.random() - 0.5) * 110,
    z: (Math.random() - 0.5) * 110,
    y: 2 + Math.random() * 20,
    speed: 0.7 + Math.random() * 1.0,
    ph: Math.random() * Math.PI * 2,
    size: 0.04 + Math.random() * 0.08,
  })), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((_, delta) => {
    if (!ref.current) return;
    flakes.forEach((f, i) => {
      f.y -= f.speed * delta;
      if (f.y < terrainH(f.x, f.z)) { f.y = 16 + Math.random() * 6; }
      dummy.position.set(f.x, f.y, f.z);
      dummy.scale.setScalar(f.size);
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, COUNT]}>
      <sphereGeometry args={[1, 4, 3]} />
      <meshBasicMaterial color="#E8F4FF" transparent opacity={0.82} />
    </instancedMesh>
  );
}

function RainSystem({ windStr = 0 }: { windStr?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const COUNT = 500;
  const drops = useMemo(() => Array.from({ length: COUNT }, () => ({
    x: (Math.random() - 0.5) * 100, z: (Math.random() - 0.5) * 100,
    y: 2 + Math.random() * 16, speed: 8 + Math.random() * 5,
  })), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((_, delta) => {
    if (!ref.current) return;
    drops.forEach((d, i) => {
      d.y -= d.speed * delta;
      d.x += windStr * delta * 3;
      if (d.y < 0) { d.y = 14 + Math.random() * 6; d.x = (Math.random()-0.5)*100; d.z = (Math.random()-0.5)*100; }
      dummy.position.set(d.x, d.y, d.z);
      dummy.scale.set(0.012, 0.2, 0.012);
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, COUNT]}>
      <capsuleGeometry args={[0.5, 1, 2, 4]} />
      <meshBasicMaterial color="#A8C8F0" transparent opacity={0.38} />
    </instancedMesh>
  );
}

function AutumnLeaves({ leafColor }: { leafColor: string }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const COUNT = 180;
  const leaves = useMemo(() => Array.from({ length: COUNT }, () => ({
    x: (Math.random()-0.5)*80, z: (Math.random()-0.5)*80,
    y: 1 + Math.random()*12, speed: 0.4 + Math.random()*0.6,
    driftX: (Math.random()-0.5)*0.6, ph: Math.random()*Math.PI*2,
    rot: Math.random()*Math.PI*2, spin: (Math.random()-0.5)*1.5,
    size: 0.08 + Math.random()*0.12,
  })), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(leafColor), [leafColor]);

  useFrame(({ clock }, delta) => {
    if (!ref.current) return;
    leaves.forEach((l, i) => {
      l.y -= l.speed * delta;
      l.x += Math.sin(clock.elapsedTime*0.5+l.ph)*l.driftX*delta;
      l.rot += l.spin * delta;
      if (l.y < terrainH(l.x, l.z)) { l.y = 8 + Math.random()*8; }
      dummy.position.set(l.x, l.y, l.z);
      dummy.rotation.set(l.rot*0.4, l.rot, l.rot*0.3);
      dummy.scale.setScalar(l.size);
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
      ref.current!.setColorAt(i, color);
    });
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, COUNT]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial color={leafColor} transparent opacity={0.72} side={THREE.DoubleSide} />
    </instancedMesh>
  );
}

function WindParticles({ strength = 0.5 }: { strength?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const COUNT = 80;
  const particles = useMemo(() => Array.from({ length: COUNT }, () => ({
    x: (Math.random()-0.5)*90, z: (Math.random()-0.5)*90,
    y: 0.5 + Math.random()*4, speed: 3 + Math.random()*4,
    length: 0.4 + Math.random()*1.0,
  })), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((_, delta) => {
    if (!ref.current) return;
    particles.forEach((p, i) => {
      p.x += p.speed * strength * delta * 2;
      if (p.x > 50) { p.x = -50; }
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(0, 0, Math.PI/2);
      dummy.scale.set(p.length, 0.016, 0.016);
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, COUNT]}>
      <capsuleGeometry args={[0.5, 1, 2, 4]} />
      <meshBasicMaterial color="#C0D8E8" transparent opacity={0.22 * strength} />
    </instancedMesh>
  );
}

function SpringBlossoms() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const COUNT = 140;
  const petals = useMemo(() => Array.from({ length: COUNT }, () => ({
    x: (Math.random()-0.5)*70, z: (Math.random()-0.5)*70,
    y: 2 + Math.random()*10, speed: 0.3 + Math.random()*0.4,
    driftX: (Math.random()-0.5)*0.4, ph: Math.random()*Math.PI*2,
    rot: Math.random()*Math.PI*2, spin: (Math.random()-0.5)*1.5,
    size: 0.06 + Math.random()*0.07,
  })), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ clock }, delta) => {
    if (!ref.current) return;
    petals.forEach((p, i) => {
      p.y -= p.speed * delta;
      p.x += Math.sin(clock.elapsedTime*0.6+p.ph)*p.driftX*delta;
      p.rot += p.spin * delta;
      if (p.y < 0) { p.y = 8 + Math.random()*8; }
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(p.rot*0.4, p.rot, 0);
      dummy.scale.setScalar(p.size);
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, COUNT]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial color="#FFB8D4" transparent opacity={0.65} side={THREE.DoubleSide} depthWrite={false} />
    </instancedMesh>
  );
}

// ─── Master seasonal weather ──────────────────────────────────────────────────
export function SeasonalWeatherSystem({ season }: { season: SeasonState }) {
  return (
    <>
      {season.snowOn   && <SnowSystem />}
      {season.rainOn   && <RainSystem windStr={season.windStr} />}
      {season.leavesOn && <AutumnLeaves leafColor={season.leafColor} />}
      {season.windStr > 0.3 && <WindParticles strength={season.windStr} />}
      {season.season === 'spring' && !season.rainOn && <SpringBlossoms />}
    </>
  );
}

// ─── Preload priority models ──────────────────────────────────────────────────
export function preloadWorldModels() {
  [
    'BirchTree_1', 'MapleTree_1', 'Resource_PineTree',
    'Environment_PalmTree_1', 'Deer', 'Horse', 'Husky',
    'Prop_Fish_Mackerel', 'Bush', 'Casual_Male', 'Casual_Female',
  ].forEach(m => useGLTF.preload(M(m)));
}
