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
    Math.sin(x * 0.13 + z * 0.10) * 0.28 +
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

// ─── GLTF model component — loads and places a model ─────────────────────────
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

// ─── Animated animal — wanders slowly around a home point ────────────────────
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
    const x  = home[0] + Math.cos(t * 0.4) * radius + Math.sin(t * 0.7) * radius * 0.5;
    const z  = home[1] + Math.sin(t * 0.4) * radius + Math.cos(t * 0.5) * radius * 0.4;
    const y  = terrainH(x, z);
    groupRef.current.position.set(x, y, z);
    // Face direction of travel
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

// ─── Animated fish — swims in a circle at water depth ────────────────────────
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

// ─── Coastal water plane ───────────────────────────────────────────────────────
export function CoastalOcean({ isNight, skyState }: { isNight: boolean; skyState: any }) {
  const ref  = useRef<THREE.Mesh>(null);
  const isGolden = skyState?.phase === 'golden' || skyState?.phase === 'sunset';
  const wCol = isNight ? '#1A2E4A' : isGolden ? '#A06820' : '#1E6EA8';
  const gCol = isNight ? '#2A4A6A' : isGolden ? '#C08040' : '#3A8AC8';

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const mat = ref.current.material as THREE.MeshBasicMaterial;
    mat.color.set(wCol);
  });

  return (
    <group>
      {/* Main ocean — covers N/E/S edges beyond r=46 */}
      <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
        <ringGeometry args={[46, 200, 64, 1]} />
        <meshBasicMaterial color={wCol} />
      </mesh>
      {/* Shimmer ring — transition at shore */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 0]}>
        <ringGeometry args={[44, 50, 64, 1]} />
        <meshBasicMaterial color={gCol} transparent opacity={0.55} />
      </mesh>
      {/* Wave lines */}
      {[48, 55, 65, 80, 100].map((r, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.45, 0]}>
          <ringGeometry args={[r, r + 0.8, 64, 1]} />
          <meshBasicMaterial color="#FFFFFF" transparent opacity={0.06 - i * 0.01} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Terrain with vertex colors per biome ─────────────────────────────────────
export function VillageTerrain({ isNight, season = 'summer' }: {
  isNight: boolean; season?: string;
}) {
  const geometry = useMemo(() => {
    const SEGS = 100, SIZE = 160;
    const geo  = new THREE.PlaneGeometry(SIZE, SIZE, SEGS, SEGS);
    geo.rotateX(-Math.PI / 2);
    const pos    = geo.attributes.position as THREE.BufferAttribute;
    const colors: number[] = [];

    const isFall  = season === 'fall';
    const isWinter = season === 'winter';
    const isNightBool = isNight;

    // Biome color palette
    const grassGreen  = new THREE.Color(isNightBool ? '#1E3018' : isFall ? '#4A5820' : isWinter ? '#3A4835' : '#3D6B2A');
    const pathDirt    = new THREE.Color(isNightBool ? '#3C2E1E' : '#8C7050');
    const soilDark    = new THREE.Color(isNightBool ? '#180E06' : '#2A1A08');
    const farmField   = new THREE.Color(isNightBool ? '#2A3018' : isFall ? '#8A6820' : '#6A8830');
    const snowWhite   = new THREE.Color('#D8E4F0');
    const iceBlue     = new THREE.Color('#8AAAC8');
    const forestDark  = new THREE.Color(isNightBool ? '#142014' : isFall ? '#3A4520' : '#284A18');
    const coastal     = new THREE.Color(isNightBool ? '#1A2820' : '#3A6040');
    const centerPack  = new THREE.Color(isNightBool ? '#2A1E10' : '#5A4030');

    for (let i = 0; i < pos.count; i++) {
      const wx = pos.getX(i), wz = pos.getZ(i);
      pos.setY(i, terrainH(wx, wz));

      const r    = Math.sqrt(wx*wx + wz*wz);
      const pn   = pathness(wx, wz);
      const ang  = Math.atan2(wz, wx); // angle from center

      let c = grassGreen.clone();

      if (r < 8) {
        // Sacred center — packed earth
        c = centerPack.clone();
      } else if (pn < 0.4) {
        // Paths
        c = pathDirt.clone().lerp(grassGreen, pn / 0.4);
      } else {
        // Biome zones by angle and distance
        // West (-π to -π/2 and π/2 to π) = mountain/icy
        const westZone = (ang > 2.3 || ang < -2.3);
        // North (ang from -π/2 to -π/6) = forest (Hut area)
        const northZone = ang > -2.0 && ang < -0.5 && r > 15;
        // East (ang from -π/6 to π/4) = farm (Workshop area)
        const farmZone = ang > -0.3 && ang < 0.8 && r > 15 && r < 40;
        // South (ang from π/4 to π/2) = coastal (Wellness area)
        const coastalZone = ang > 0.4 && ang < 1.6 && r > 20;

        if (isWinter && r > 25) {
          c = snowWhite.clone().lerp(grassGreen, 0.3);
        } else if (westZone && r > 25) {
          c = isWinter ? snowWhite.clone() : iceBlue.clone().lerp(grassGreen, 0.4);
        } else if (northZone) {
          c = forestDark.clone();
          if (Math.sin(wx * 0.3 + wz * 0.2) > 0.4) c.lerp(soilDark, 0.4);
        } else if (farmZone) {
          c = farmField.clone();
          if (Math.sin(wx * 0.6) > 0.5) c.lerp(grassGreen, 0.5); // crop rows
        } else if (coastalZone) {
          c = coastal.clone().lerp(grassGreen, 0.6);
        } else {
          const t = (Math.sin(wx * 0.3 + wz * 0.2) * 0.5 + 0.5);
          c = grassGreen.clone().lerp(forestDark, t * 0.35);
        }
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

// ─── Stone path pebbles ───────────────────────────────────────────────────────
export function StonePaths({ isNight }: { isNight: boolean }) {
  const stoneColor = isNight ? '#2A2420' : '#8A7060';
  return (
    <group>
      {PATHS.map(([bx, bz], bi) =>
        Array.from({ length: 14 }, (_, si) => {
          const t  = (si + 0.5) / 14;
          const x  = bx * t + Math.sin(si * 1.8 + bi) * 0.55;
          const z  = bz * t + Math.cos(si * 1.5 + bi * 0.7) * 0.55;
          const y  = terrainH(x, z) + 0.04;
          const w  = 0.45 + Math.sin(si * 2.3) * 0.12;
          const rot = Math.sin(si * 0.9 + bi) * 0.3;
          return (
            <group key={`${bi}-${si}`} position={[x, y, z]}>
              <mesh rotation={[-Math.PI / 2, rot, 0]}>
                <boxGeometry args={[w + 0.15, w, 0.08]} />
                <meshToonMaterial color={stoneColor} />
              </mesh>
            </group>
          );
        })
      )}
    </group>
  );
}

// ─── Real GLTF tree placer ────────────────────────────────────────────────────
function GltfTree({ url, pos, sc = 1, rot = 0 }: {
  url: string; pos: [number, number, number]; sc?: number; rot?: number;
}) {
  return (
    <Suspense fallback={null}>
      <Model url={url} position={pos} scale={sc} rotation={rot} />
    </Suspense>
  );
}

// ─── Full tree system using real models ───────────────────────────────────────
export function TreeSystem({ windStr = 0, season = 'summer' }: {
  windStr?: number; season?: string;
}) {
  const birch  = (p: [number,number,number], s=1, r=0) => <GltfTree key={`b${p}`} url={M('BirchTree_1')}  pos={p} sc={s} rot={r} />;
  const birch2 = (p: [number,number,number], s=1, r=0) => <GltfTree key={`b2${p}`} url={M('BirchTree_3')} pos={p} sc={s} rot={r} />;
  const maple  = (p: [number,number,number], s=1, r=0) => <GltfTree key={`m${p}`} url={M('MapleTree_1')}  pos={p} sc={s} rot={r} />;
  const maple2 = (p: [number,number,number], s=1, r=0) => <GltfTree key={`m2${p}`} url={M('MapleTree_3')} pos={p} sc={s} rot={r} />;
  const pine   = (p: [number,number,number], s=1, r=0) => <GltfTree key={`p${p}`} url={M('Resource_PineTree')} pos={p} sc={s} rot={r} />;
  const dead   = (p: [number,number,number], s=1, r=0) => <GltfTree key={`d${p}`} url={M('DeadTree_1')}   pos={p} sc={s} rot={r} />;
  const palm   = (p: [number,number,number], s=1, r=0) => <GltfTree key={`palm${p}`} url={M('Environment_PalmTree_1')} pos={p} sc={s} rot={r} />;

  return (
    <group>
      {/* ── FOREST ZONE — North/center (Hut region) ── */}
      {birch([-12,0,-8],  1.2, 0.3)}
      {birch2([11,0,-7],  1.1, 1.1)}
      {maple([-11,0,9],   1.3, 0.8)}
      {maple2([10,0,8],   1.0, 2.1)}
      {birch([-13,0,3],   0.9, 1.5)}
      {birch2([12,0,2],   1.1, 0.6)}
      {maple([-9,0,-3],   1.2, 2.3)}
      {maple2([8,0,-2],   0.95,1.8)}
      {birch([-15,0,-14], 1.4, 0.2)}
      {birch([14,0,-13],  1.2, 1.7)}
      {maple([-14,0,18],  1.3, 0.9)}
      {maple2([13,0,17],  1.1, 2.0)}
      {/* Forest center — surrounding Hut */}
      {birch([4,0,22],    1.0, 0.4)}
      {maple([-4,0,24],   1.1, 1.3)}
      {birch2([7,0,28],   0.9, 2.2)}
      {maple2([-6,0,30],  1.2, 0.7)}
      {birch([2,0,32],    1.0, 1.9)}
      {birch2([-2,0,34],  0.8, 0.1)}

      {/* ── PINE/ICY ZONE — West (Zen/mountain region) ── */}
      {pine([-28,0,-18],  1.4, 0.5)}
      {pine([-32,0,-25],  1.6, 1.2)}
      {pine([-36,0,-18],  1.3, 2.0)}
      {pine([-30,0,-30],  1.5, 0.8)}
      {pine([-24,0,-26],  1.2, 1.6)}
      {dead([-38,0,-12],  1.1, 0.3)}
      {dead([-42,0,-18],  1.3, 1.8)}
      {pine([-44,0,-26],  1.2, 0.6)}
      {pine([-36,0,-34],  1.4, 2.1)}

      {/* ── MAPLE/FARM ZONE — East (Workshop/farm area) ── */}
      {maple([18,0,-18],  1.1, 0.9)}
      {maple2([24,0,-20], 1.2, 1.4)}
      {birch([28,0,-14],  1.0, 0.2)}
      {maple([20,0,-12],  0.9, 2.3)}
      {maple2([26,0,-8],  1.1, 1.0)}
      {birch([22,0,-24],  1.3, 0.7)}

      {/* ── PALM ZONE — South/coastal (Wellness area) ── */}
      {palm([8,0,-24],   1.1, 0.4)}
      {palm([-6,0,-30],  1.2, 1.6)}
      {palm([4,0,-34],   1.0, 0.9)}
      {palm([-10,0,-36], 1.3, 2.0)}
      {palm([14,0,-32],  1.1, 1.3)}

      {/* ── OUTER RING — Mixed forest border ── */}
      {[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map(i => {
        const a = (i / 16) * Math.PI * 2;
        const r = 43 + Math.sin(i * 2.1) * 3;
        const x = Math.cos(a) * r, z = Math.sin(a) * r;
        const url = i % 4 === 0 ? M('BirchTree_1') : i % 4 === 1 ? M('MapleTree_2') : i % 4 === 2 ? M('Resource_PineTree') : M('BirchTree_4');
        const s = 1.2 + Math.sin(i * 1.3) * 0.3;
        return <GltfTree key={`outer${i}`} url={url} pos={[x,0,z]} sc={s} rot={a} />;
      })}
    </group>
  );
}

// ─── Rocks scattered across the world ────────────────────────────────────────
export function RockSystem() {
  const spots: [number,number,number,number][] = [
    [-28,-20,0.8,0.4], [25,20,0.9,1.2], [-18,22,0.7,2.1],
    [28,-15,1.0,0.6], [5,-24,0.8,1.8], [-8,28,0.9,0.3],
    [32,10,0.7,2.4], [-30,8,1.1,1.0], [18,-26,0.85,0.8],
    [-24,14,0.9,1.5], [-36,-20,1.2,0.2], [34,-18,0.8,1.9],
    [-20,30,0.9,0.7], [20,32,1.0,2.0], [-32,26,0.75,1.3],
  ];
  return (
    <group>
      {spots.map(([x, z, sc, rot], i) => (
        <Suspense key={i} fallback={null}>
          <Model
            url={M(i % 3 === 0 ? 'Rock' : i % 3 === 1 ? 'Rock_Group' : 'Environment_Rock_1')}
            position={[x, 0, z]}
            scale={sc} rotation={rot}
          />
        </Suspense>
      ))}
    </group>
  );
}

// ─── Flowers scattered in clearings ──────────────────────────────────────────
export function FlowerSystem() {
  const flowers = useMemo(() => {
    const arr: { x: number; z: number; url: string; rot: number; sc: number }[] = [];
    const flowerUrls = [
      M('Flower_1_Clump'), M('Flower_2_Clump'), M('Flower_3_Clump'),
      M('Flower_4_Clump'), M('Flower_5_Clump'),
    ];
    for (let i = 0; i < 60; i++) {
      let x: number, z: number;
      do { x = (Math.random()-0.5)*100; z = (Math.random()-0.5)*100; }
      while (Math.sqrt(x*x+z*z) < 9 || pathness(x,z) < 0.55 || Math.sqrt(x*x+z*z) > 48);
      arr.push({
        x, z,
        url: flowerUrls[i % flowerUrls.length],
        rot: Math.random() * Math.PI * 2,
        sc:  0.6 + Math.random() * 0.6,
      });
    }
    return arr;
  }, []);

  return (
    <group>
      {flowers.map((f, i) => (
        <Suspense key={i} fallback={null}>
          <Model url={f.url} position={[f.x, 0, f.z]} rotation={f.rot} scale={f.sc} />
        </Suspense>
      ))}
    </group>
  );
}

// ─── Wandering animals ────────────────────────────────────────────────────────
export function AnimalSystem() {
  return (
    <group>
      <Suspense fallback={null}>
        {/* Deer in forest — north/center */}
        <WanderingAnimal url={M('Deer')} home={[-10, 10]}  scale={1.0} phase={0}   radius={5} speed={0.3} />
        <WanderingAnimal url={M('Deer')} home={[8,  12]}   scale={0.9} phase={2.5} radius={4} speed={0.35} />
        {/* Fox in forest */}
        <WanderingAnimal url={M('Fox')}  home={[-8, 20]}   scale={0.8} phase={1.2} radius={4} speed={0.5} />
        {/* Wolf in northwest */}
        <WanderingAnimal url={M('Wolf')} home={[-30,-15]}  scale={1.1} phase={0.8} radius={6} speed={0.25} />
        {/* Alpaca near mountain */}
        <WanderingAnimal url={M('Alpaca')} home={[-32,-18]} scale={1.0} phase={1.5} radius={5} speed={0.2} />
        {/* Dogs in village */}
        <WanderingAnimal url={M('Husky')}   home={[0, 5]}  scale={0.7} phase={0.3} radius={3} speed={0.6} />
        <WanderingAnimal url={M('ShibaInu')} home={[5,-5]} scale={0.65}phase={1.8} radius={3} speed={0.65} />
        <WanderingAnimal url={M('Pug')}     home={[-4, 6]} scale={0.6} phase={3.1} radius={2.5}speed={0.7} />
        {/* Horse in farm zone */}
        <WanderingAnimal url={M('Horse')} home={[22,-14]}   scale={1.1} phase={0.5} radius={7} speed={0.2} />
      </Suspense>
    </group>
  );
}

// ─── Fish in coastal water ────────────────────────────────────────────────────
export function CoastalFish() {
  return (
    <group>
      <Suspense fallback={null}>
        {/* North coast fish */}
        <SwimmingFish url={M('Prop_Fish_Mackerel')} cx={10}  cz={-52} radius={6}  speed={1.4} phase={0}   scale={0.9} />
        <SwimmingFish url={M('Prop_Fish_Tuna')}     cx={-5}  cz={-55} radius={8}  speed={1.1} phase={1.5} scale={1.1} />
        <SwimmingFish url={M('Prop_Fish_Mackerel')} cx={-15} cz={-50} radius={5}  speed={1.6} phase={3.0} scale={0.8} />
        {/* East coast */}
        <SwimmingFish url={M('Prop_Fish_Tuna')}     cx={52}  cz={5}   radius={7}  speed={1.2} phase={0.8} scale={1.0} />
        <SwimmingFish url={M('Prop_Fish_Mackerel')} cx={55}  cz={-8}  radius={5}  speed={1.5} phase={2.2} scale={0.85}/>
        {/* South coast */}
        <SwimmingFish url={M('Prop_Fish_Mackerel')} cx={8}   cz={52}  radius={6}  speed={1.3} phase={1.0} scale={0.9} />
        <SwimmingFish url={M('Prop_Fish_Tuna')}     cx={-10} cz={54}  radius={8}  speed={1.0} phase={2.8} scale={1.2} />
        {/* Moat fish */}
        <SwimmingFish url={M('Prop_Fish_Mackerel')} cx={0}   cz={-35} radius={3}  speed={1.8} phase={0.5} scale={0.6} depth={-0.3} />
        <SwimmingFish url={M('Prop_Fish_Mackerel')} cx={35}  cz={0}   radius={3}  speed={2.0} phase={1.5} scale={0.6} depth={-0.3} />
      </Suspense>
    </group>
  );
}

// ─── Scatter bushes and logs ──────────────────────────────────────────────────
export function GroundClutter() {
  const items = useMemo(() => {
    const arr: { x: number; z: number; url: string; rot: number; sc: number }[] = [];
    const urls = [M('Bush'), M('Bush_Flowers'), M('Bush_Large'), M('Bush_Small'), M('Logs')];
    for (let i = 0; i < 80; i++) {
      let x: number, z: number;
      do { x = (Math.random()-0.5)*96; z = (Math.random()-0.5)*96; }
      while (Math.sqrt(x*x+z*z) < 8 || pathness(x,z) < 0.6 || Math.sqrt(x*x+z*z) > 46);
      arr.push({ x, z, url: urls[i % urls.length], rot: Math.random()*Math.PI*2, sc: 0.5+Math.random()*0.5 });
    }
    return arr;
  }, []);

  return (
    <group>
      {items.map((it, i) => (
        <Suspense key={i} fallback={null}>
          <Model url={it.url} position={[it.x, 0, it.z]} rotation={it.rot} scale={it.sc} />
        </Suspense>
      ))}
    </group>
  );
}

// ─── Sacred fire ──────────────────────────────────────────────────────────────
export function SacredFire() {
  const flame1 = useRef<THREE.Mesh>(null);
  const flame2 = useRef<THREE.Mesh>(null);
  const flame3 = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (flame1.current) flame1.current.scale.set(0.8+Math.sin(t*5.2)*0.18, 1+Math.sin(t*6.1)*0.22, 0.8+Math.cos(t*4.8)*0.14);
    if (flame2.current) flame2.current.scale.set(0.7+Math.sin(t*7.1+1)*0.2, 1+Math.sin(t*5.5+0.5)*0.28, 0.7+Math.cos(t*6.3+1)*0.16);
    if (flame3.current) flame3.current.scale.set(0.9+Math.sin(t*4.4+2)*0.15, 1+Math.sin(t*7.2+1)*0.18, 0.9+Math.cos(t*5.0+2)*0.12);
    if (glowRef.current) (glowRef.current.material as THREE.MeshBasicMaterial).opacity = 0.14+Math.sin(t*3.5)*0.06;
  });

  return (
    <group position={[0,0,0]}>
      {Array.from({length:10},(_,i)=>{
        const a=(i/10)*Math.PI*2;
        return <mesh key={i} position={[Math.cos(a)*0.72,0.14,Math.sin(a)*0.72]} rotation={[0.1,a,0.05]}>
          <dodecahedronGeometry args={[0.16,0]} /><meshToonMaterial color={i%2===0?'#5A4838':'#4A3828'} />
        </mesh>;
      })}
      <mesh position={[0.2,0.1,0]} rotation={[0,0.6,0.25]}><cylinderGeometry args={[0.07,0.1,1.0,10,2]}/><meshToonMaterial color="#3D2410"/></mesh>
      <mesh position={[-0.2,0.1,0]} rotation={[0,-0.4,-0.28]}><cylinderGeometry args={[0.07,0.1,1.0,10,2]}/><meshToonMaterial color="#3D2410"/></mesh>
      <mesh position={[0,0.06,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[0.38,16]}/><meshToonMaterial color="#CC3300"/></mesh>
      <mesh ref={flame3} position={[0,0.48,0]}><coneGeometry args={[0.42,0.95,18,6]}/><meshToonMaterial color="#E85000" transparent opacity={0.72}/></mesh>
      <mesh ref={flame2} position={[0,0.6,0]}><coneGeometry args={[0.28,0.85,16,5]}/><meshToonMaterial color="#FF7A00" transparent opacity={0.82}/></mesh>
      <mesh ref={flame1} position={[0,0.72,0]}><coneGeometry args={[0.18,0.72,14,4]}/><meshToonMaterial color="#FFD040" transparent opacity={0.92}/></mesh>
      <mesh position={[0,1.28,0]}><coneGeometry args={[0.06,0.28,10,3]}/><meshToonMaterial color="#FFEE80" transparent opacity={0.85}/></mesh>
      <mesh ref={glowRef} rotation={[-Math.PI/2,0,0]} position={[0,0.02,0]}><circleGeometry args={[2.2,36]}/><meshBasicMaterial color="#FF6820" transparent opacity={0.14}/></mesh>
    </group>
  );
}

// ─── Lanterns along paths ─────────────────────────────────────────────────────
export function StoneLanterns({ isNight }: { isNight: boolean }) {
  const LANTERN_POS: [number,number,number][] = [
    [-7,0,-5.5],[7,0,-5.5],[-5.5,0,7],[5.5,0,7],
    [-11,0,-9],[11,0,-9],[-9,0,11],[9,0,11],
    [-15,0,-11],[15,0,-11],[-13,0,14],[13,0,14],
  ];
  return (
    <group>
      {LANTERN_POS.map((p,i) => {
        const y = terrainH(p[0], p[2]);
        return (
          <group key={i} position={[p[0],y,p[2]]}>
            <mesh position={[0,0.14,0]}><cylinderGeometry args={[0.18,0.22,0.28,8,2]}/><meshToonMaterial color="#7A6858"/></mesh>
            <mesh position={[0,0.55,0]}><cylinderGeometry args={[0.1,0.14,0.55,8,3]}/><meshToonMaterial color="#6A5848"/></mesh>
            <mesh position={[0,0.86,0]}><cylinderGeometry args={[0.2,0.12,0.1,8,1]}/><meshToonMaterial color="#5A4838"/></mesh>
            <mesh position={[0,1.08,0]}><boxGeometry args={[0.3,0.32,0.3,2,2,2]}/><meshToonMaterial color="#5A4838"/></mesh>
            <mesh position={[0,1.08,0]}><boxGeometry args={[0.24,0.26,0.24,1,1,1]}/><meshToonMaterial color={isNight?'#FFB840':'#FFF4C0'} transparent opacity={isNight?0.7:0.15}/></mesh>
            <mesh position={[0,1.26,0]}><coneGeometry args={[0.22,0.18,8,2]}/><meshToonMaterial color="#4A3828"/></mesh>
          </group>
        );
      })}
    </group>
  );
}

// ─── Fireflies ────────────────────────────────────────────────────────────────
export function Fireflies({ visible }: { visible: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const COUNT = 55;
  const data = useMemo(() => Array.from({length:COUNT},(_,i) => ({
    x:(Math.random()-0.5)*60, z:(Math.random()-0.5)*60,
    baseY:1.2+Math.random()*2.4, speed:0.3+Math.random()*0.5,
    phase:Math.random()*Math.PI*2, radius:1.5+Math.random()*3.0,
  })),[]);

  useFrame(({clock}) => {
    if (!ref.current) return;
    const t=clock.elapsedTime, dummy=new THREE.Object3D();
    data.forEach((d,i) => {
      const flicker=Math.sin(t*4.2+d.phase)>0.1;
      const scale=visible&&flicker?0.08+Math.random()*0.04:0;
      dummy.position.set(d.x+Math.cos(t*d.speed+d.phase)*d.radius,terrainH(d.x,d.z)+d.baseY+Math.sin(t*0.7+d.phase)*0.6,d.z+Math.sin(t*d.speed*0.8+d.phase+1)*d.radius);
      dummy.scale.setScalar(scale); dummy.updateMatrix();
      ref.current!.setMatrixAt(i,dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate=true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined,undefined,COUNT]}>
      <sphereGeometry args={[1,8,6]}/>
      <meshBasicMaterial color="#AAFF44" transparent opacity={0.85}/>
    </instancedMesh>
  );
}

// ─── Dense grass blades ───────────────────────────────────────────────────────
export function DenseGrass({ windStr = 0 }: { windStr?: number }) {
  const shortRef = useRef<THREE.InstancedMesh>(null);
  const medRef   = useRef<THREE.InstancedMesh>(null);
  const SHORT_N  = 1800;
  const MED_N    = 1200;

  const blades = useMemo(() => {
    const scatter = (n: number) => {
      const arr: { x: number; z: number; rot: number; ph: number; h: number }[] = [];
      let tries = 0;
      while (arr.length < n && tries++ < n * 10) {
        const x = (Math.random()-0.5)*100, z = (Math.random()-0.5)*100;
        const r = Math.sqrt(x*x+z*z);
        if (r < 7.5 || r > 48 || pathness(x,z) < 0.55) continue;
        arr.push({ x, z, rot: Math.random()*Math.PI*2, ph: Math.random()*Math.PI*2, h: 0.9+Math.random()*0.4 });
      }
      return arr;
    };
    return { short: scatter(SHORT_N), med: scatter(MED_N) };
  }, []);

  const sc = useMemo(() => [new THREE.Color('#2A5C14'),new THREE.Color('#306818'),new THREE.Color('#246010'),new THREE.Color('#387020')],[]);
  const mc = useMemo(() => [new THREE.Color('#327020'),new THREE.Color('#3A7A24'),new THREE.Color('#2E6618'),new THREE.Color('#40801C')],[]);

  useFrame(({clock}) => {
    const t=clock.elapsedTime, dummy=new THREE.Object3D();
    if (shortRef.current) {
      blades.short.forEach((b,i)=>{
        const h=0.10*b.h, wind=Math.sin(t*2.0+b.x*0.32+b.ph)*windStr*0.065;
        dummy.position.set(b.x,terrainH(b.x,b.z)+h*0.5,b.z);
        dummy.rotation.set(wind,b.rot,0); dummy.scale.set(0.019,h,0.019);
        dummy.updateMatrix(); shortRef.current!.setMatrixAt(i,dummy.matrix);
        shortRef.current!.setColorAt(i,sc[i%sc.length]);
      });
      shortRef.current.instanceMatrix.needsUpdate=true;
      if(shortRef.current.instanceColor) shortRef.current.instanceColor.needsUpdate=true;
    }
    if (medRef.current) {
      blades.med.forEach((b,i)=>{
        const h=0.175*b.h, wind=Math.sin(t*1.7+b.x*0.28+b.ph+0.7)*windStr*0.095;
        dummy.position.set(b.x,terrainH(b.x,b.z)+h*0.5,b.z);
        dummy.rotation.set(wind,b.rot,0); dummy.scale.set(0.024,h,0.024);
        dummy.updateMatrix(); medRef.current!.setMatrixAt(i,dummy.matrix);
        medRef.current!.setColorAt(i,mc[i%mc.length]);
      });
      medRef.current.instanceMatrix.needsUpdate=true;
      if(medRef.current.instanceColor) medRef.current.instanceColor.needsUpdate=true;
    }
  });

  return (
    <>
      <instancedMesh ref={shortRef} args={[undefined,undefined,SHORT_N]}>
        <coneGeometry args={[0.5,1,3,2]}/><meshToonMaterial side={THREE.DoubleSide}/>
      </instancedMesh>
      <instancedMesh ref={medRef} args={[undefined,undefined,MED_N]}>
        <coneGeometry args={[0.5,1,3,3]}/><meshToonMaterial side={THREE.DoubleSide}/>
      </instancedMesh>
    </>
  );
}

// Preload all models for faster first-visit
export function preloadWorldModels() {
  const models = [
    'BirchTree_1','BirchTree_3','MapleTree_1','MapleTree_2','MapleTree_3',
    'Resource_PineTree','DeadTree_1','Environment_PalmTree_1',
    'Rock','Rock_Group','Deer','Fox','Wolf','Alpaca','Husky','ShibaInu','Pug','Horse',
    'Prop_Fish_Mackerel','Prop_Fish_Tuna',
    'Bush','Bush_Flowers','Flower_1_Clump','Flower_3_Clump','Logs',
    'Casual_Male','Casual_Female',
  ];
  models.forEach(m => useGLTF.preload(M(m)));
}

// ─── Admin world objects — renders GLTF models placed in admin sandbox ───────
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
      .then(({ data }) => { if (data) setObjects(data); });
  }, []);

  return (
    <Suspense fallback={null}>
      {objects.map(obj => (
        <AdminModelInstance key={obj.id} obj={obj} />
      ))}
    </Suspense>
  );
}

// ─── Snow particle system ────────────────────────────────────────────────────
function SnowSystem() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const COUNT = 800;
  const flakes = useMemo(() => Array.from({ length: COUNT }, () => ({
    x: (Math.random() - 0.5) * 120,
    z: (Math.random() - 0.5) * 120,
    y: 2 + Math.random() * 22,
    speed: 0.6 + Math.random() * 1.2,
    drift: (Math.random() - 0.5) * 0.3,
    ph: Math.random() * Math.PI * 2,
    size: 0.04 + Math.random() * 0.09,
  })), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ clock }, delta) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    flakes.forEach((f, i) => {
      f.y -= f.speed * delta;
      f.x += Math.sin(t * 0.4 + f.ph) * 0.01;
      if (f.y < terrainH(f.x, f.z)) {
        f.y = 18 + Math.random() * 6;
        f.x = (Math.random() - 0.5) * 120;
        f.z = (Math.random() - 0.5) * 120;
      }
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

// ─── Snow cover — white cap on terrain ───────────────────────────────────────
function SnowCover() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.12, 0]}>
      <circleGeometry args={[46, 64]} />
      <meshBasicMaterial color="#DFF0FF" transparent opacity={0.35} />
    </mesh>
  );
}

// ─── Rain streak system ───────────────────────────────────────────────────────
function RainSystem({ windStr = 0 }: { windStr?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const COUNT = 600;
  const drops = useMemo(() => Array.from({ length: COUNT }, () => ({
    x: (Math.random() - 0.5) * 110,
    z: (Math.random() - 0.5) * 110,
    y: 2 + Math.random() * 18,
    speed: 8 + Math.random() * 6,
    ph: Math.random() * Math.PI * 2,
  })), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((_, delta) => {
    if (!ref.current) return;
    drops.forEach((d, i) => {
      d.y -= d.speed * delta;
      d.x += windStr * delta * 3;
      if (d.y < 0) {
        d.y = 16 + Math.random() * 6;
        d.x = (Math.random() - 0.5) * 110;
        d.z = (Math.random() - 0.5) * 110;
      }
      dummy.position.set(d.x, d.y, d.z);
      dummy.rotation.set(windStr * 0.4, 0, 0);
      dummy.scale.set(0.012, 0.22, 0.012);
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

// ─── Autumn leaf system — drifting leaf sprites ────────────────────────────
function AutumnLeaves({ leafColor }: { leafColor: string }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const COUNT = 260;
  const leaves = useMemo(() => Array.from({ length: COUNT }, () => ({
    x: (Math.random() - 0.5) * 90,
    z: (Math.random() - 0.5) * 90,
    y: 1 + Math.random() * 14,
    speed: 0.4 + Math.random() * 0.7,
    spin: (Math.random() - 0.5) * 2,
    driftX: (Math.random() - 0.5) * 0.8,
    driftZ: (Math.random() - 0.5) * 0.8,
    ph: Math.random() * Math.PI * 2,
    size: 0.08 + Math.random() * 0.14,
    rot: Math.random() * Math.PI * 2,
  })), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(leafColor), [leafColor]);

  useFrame(({ clock }, delta) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    leaves.forEach((l, i) => {
      l.y -= l.speed * delta;
      l.x += Math.sin(t * 0.5 + l.ph) * l.driftX * delta;
      l.z += Math.cos(t * 0.4 + l.ph) * l.driftZ * delta;
      l.rot += l.spin * delta;
      if (l.y < terrainH(l.x, l.z)) {
        l.y = 8 + Math.random() * 10;
        l.x = (Math.random() - 0.5) * 90;
        l.z = (Math.random() - 0.5) * 90;
      }
      dummy.position.set(l.x, l.y, l.z);
      dummy.rotation.set(l.rot * 0.5, l.rot, l.rot * 0.3);
      dummy.scale.setScalar(l.size);
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
      ref.current!.setColorAt(i, color.clone().multiplyScalar(0.7 + Math.random() * 0.4));
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

// ─── Fog planes — low-lying volumetric fog ───────────────────────────────────
function FogSystem({ density = 0.4 }: { density?: number }) {
  const refs = [useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null)];

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    refs.forEach((r, i) => {
      if (!r.current) return;
      r.current.position.x = Math.sin(t * 0.05 + i * 2.1) * 8;
      r.current.position.z = Math.cos(t * 0.04 + i * 1.7) * 8;
      (r.current.material as THREE.MeshBasicMaterial).opacity = density * (0.12 + Math.sin(t * 0.3 + i) * 0.04);
    });
  });

  return (
    <>
      {refs.map((r, i) => (
        <mesh key={i} ref={r} rotation={[-Math.PI / 2, 0, i * 1.3]} position={[0, 0.4 + i * 0.3, 0]}>
          <planeGeometry args={[90, 90]} />
          <meshBasicMaterial color="#C8E8D8" transparent opacity={density * 0.15} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      ))}
    </>
  );
}

// ─── Wind particles ───────────────────────────────────────────────────────────
function WindParticles({ strength = 0.5 }: { strength?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const COUNT = 120;
  const particles = useMemo(() => Array.from({ length: COUNT }, () => ({
    x: (Math.random() - 0.5) * 100,
    z: (Math.random() - 0.5) * 100,
    y: 0.5 + Math.random() * 5,
    speed: 3 + Math.random() * 5,
    ph: Math.random() * Math.PI * 2,
    length: 0.4 + Math.random() * 1.2,
  })), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((_, delta) => {
    if (!ref.current) return;
    particles.forEach((p, i) => {
      p.x += p.speed * strength * delta * 2;
      if (p.x > 55) { p.x = -55; p.z = (Math.random() - 0.5) * 100; }
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(0, 0, Math.PI / 2);
      dummy.scale.set(p.length, 0.018, 0.018);
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

// ─── Spring blossom petals — pink petal rain from trees ───────────────────
function SpringBlossoms() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const COUNT = 200;
  const petals = useMemo(() => Array.from({ length: COUNT }, () => ({
    x: (Math.random() - 0.5) * 80,
    z: (Math.random() - 0.5) * 80,
    y: 2 + Math.random() * 12,
    speed: 0.3 + Math.random() * 0.5,
    driftX: (Math.random() - 0.5) * 0.4,
    ph: Math.random() * Math.PI * 2,
    rot: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 1.5,
    size: 0.06 + Math.random() * 0.08,
  })), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ clock }, delta) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    petals.forEach((p, i) => {
      p.y -= p.speed * delta;
      p.x += Math.sin(t * 0.6 + p.ph) * p.driftX * delta;
      p.rot += p.spin * delta;
      if (p.y < 0) {
        p.y = 8 + Math.random() * 8;
        p.x = (Math.random() - 0.5) * 80;
        p.z = (Math.random() - 0.5) * 80;
      }
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(p.rot * 0.4, p.rot, 0);
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

// ─── Master seasonal weather system ──────────────────────────────────────────
export function SeasonalWeatherSystem({ season }: { season: SeasonState }) {
  return (
    <>
      {season.snowOn    && <SnowSystem />}
      {season.snowOn    && <SnowCover />}
      {season.rainOn    && <RainSystem windStr={season.windStr} />}
      {season.leavesOn  && <AutumnLeaves leafColor={season.leafColor} />}
      {season.windStr > 0.25 && <WindParticles strength={season.windStr} />}
      {season.fogDensity > 0  && <FogSystem density={season.fogDensity} />}
      {season.season === 'spring' && !season.rainOn && <SpringBlossoms />}
    </>
  );
}
