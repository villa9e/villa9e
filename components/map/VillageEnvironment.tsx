'use client';
import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  createGrassTexture, createDirtPathTexture,
} from './VillageTextures';

// ─── Terrain height function — exported so movement loop can snap player to surface
export function terrainH(x: number, z: number): number {
  const r      = Math.sqrt(x * x + z * z);
  const flatten = Math.max(0, 1 - r / 14) * 0.92;        // flat center courtyard
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

// How close is this point to any village path? Returns 0=path, 1=off path
const PATH_ENDPOINTS: [number, number][] = [
  [-22, -16], [22, -16], [-22, 16], [22, 16],
  [-34, -8],  [30, 0],   [0, -28],  [0, 26],
];
function pathness(x: number, z: number): number {
  let minDist = Infinity;
  for (const [bx, bz] of PATH_ENDPOINTS) {
    // Closest point on segment from origin to building
    const t    = Math.max(0, Math.min(1, (x * bx + z * bz) / (bx * bx + bz * bz)));
    const px   = bx * t, pz = bz * t;
    const dist = Math.sqrt((x - px) ** 2 + (z - pz) ** 2);
    if (dist < minDist) minDist = dist;
  }
  return Math.min(1, minDist / 2.5);
}

// ─── Terrain — heightmapped ground with vertex colors ─────────────────────────
export function VillageTerrain({ isNight }: { isNight: boolean }) {
  const geometry = useMemo(() => {
    const SEGS  = 100;
    const SIZE  = 130;
    const geo   = new THREE.PlaneGeometry(SIZE, SIZE, SEGS, SEGS);
    geo.rotateX(-Math.PI / 2);

    const pos    = geo.attributes.position as THREE.BufferAttribute;
    const colors: number[] = [];

    // Grass colors (day/night)
    const grassD = new THREE.Color(isNight ? '#1E3018' : '#3D6B2A');
    const grassL = new THREE.Color(isNight ? '#283C20' : '#4D7B38');
    const pathC  = new THREE.Color(isNight ? '#3C2E1E' : '#8C7050');
    const soilC  = new THREE.Color(isNight ? '#180E06' : '#2A1A08');
    const centC  = new THREE.Color(isNight ? '#2A1E10' : '#5A4030');
    const riverC = new THREE.Color(isNight ? '#141E2C' : '#2E5870');

    for (let i = 0; i < pos.count; i++) {
      const wx = pos.getX(i);
      const wz = pos.getZ(i);

      // Lift terrain
      pos.setY(i, terrainH(wx, wz));

      // Vertex color
      const pn     = pathness(wx, wz);
      const rDist  = Math.abs(wx + 17);  // river is at x≈-17
      const centerR = Math.sqrt(wx * wx + wz * wz);
      const isRiver = rDist < 4.5 && Math.abs(wz) < 18;

      let c: THREE.Color;
      if (isRiver && rDist < 3.5) {
        c = riverC.clone();
      } else if (centerR < 8) {
        c = centC.clone().lerp(grassD, centerR / 8);
      } else if (pn < 0.4) {
        c = pathC.clone().lerp(grassD, pn / 0.4);
      } else {
        const t = (Math.sin(wx * 0.3 + wz * 0.2) * 0.5 + 0.5);
        c = grassD.clone().lerp(grassL, t);
        // Dark soil patches under tree spots
        if (Math.sin(wx * 0.18) * Math.cos(wz * 0.16) > 0.5) {
          c.lerp(soilC, 0.4);
        }
      }
      colors.push(c.r, c.g, c.b);
    }

    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, [isNight]);

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshToonMaterial vertexColors side={THREE.FrontSide} />
    </mesh>
  );
}

// ─── Stone path pebbles radiating from center to buildings ────────────────────
export function StonePaths({ isNight }: { isNight: boolean }) {
  const stoneColor = isNight ? '#2A2420' : '#8A7060';
  const mortarColor = isNight ? '#1E1810' : '#6A5848';

  return (
    <group>
      {PATH_ENDPOINTS.map(([bx, bz], bi) => {
        const steps = 14;
        return Array.from({ length: steps }, (_, si) => {
          const t    = (si + 0.5) / steps;
          const x    = bx * t + (Math.sin(si * 1.8 + bi) * 0.6);
          const z    = bz * t + (Math.cos(si * 1.5 + bi * 0.7) * 0.6);
          const y    = terrainH(x, z) + 0.04;
          const w    = 0.45 + Math.sin(si * 2.3) * 0.12;
          const rot  = Math.sin(si * 0.9 + bi) * 0.3;
          return (
            <group key={`${bi}-${si}`} position={[x, y, z]}>
              <mesh rotation={[-Math.PI / 2, rot, 0]}>
                <boxGeometry args={[w + 0.15, w, 0.08, 1, 1, 1]} />
                <meshToonMaterial color={stoneColor} />
              </mesh>
              {/* Mossy gap fill */}
              <mesh rotation={[-Math.PI / 2, rot + 0.15, 0]} position={[0.22, 0, 0.01]}>
                <circleGeometry args={[0.1, 6]} />
                <meshToonMaterial color={isNight ? '#1C2C14' : '#4A7030'} />
              </mesh>
            </group>
          );
        });
      })}
    </group>
  );
}

// ─── Baobab tree — the signature tree of the African savanna ──────────────────
function BaobabTree({ pos, scale = 1, windPhase = 0, windStr = 0 }: {
  pos: [number, number, number]; scale?: number; windPhase?: number; windStr?: number;
}) {
  const canopyRef = useRef<THREE.Group>(null);
  const groundY   = terrainH(pos[0], pos[2]);

  useFrame(({ clock }) => {
    if (!canopyRef.current) return;
    const t = clock.elapsedTime;
    canopyRef.current.rotation.z = Math.sin(t * 0.6 + windPhase) * windStr * 0.022;
    canopyRef.current.rotation.x = Math.sin(t * 0.4 + windPhase + 1) * windStr * 0.012;
  });

  return (
    <group position={[pos[0], groundY, pos[2]]} scale={scale}>
      {/* Roots — spreading base */}
      {[0, 72, 144, 216, 288].map((deg, i) => {
        const a = (deg * Math.PI) / 180;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.55, -0.05, Math.sin(a) * 0.55]}
            rotation={[0.35, a, 0.1]}>
            <boxGeometry args={[0.18, 0.5, 0.12, 2, 3, 1]} />
            <meshToonMaterial color="#3D2810" />
          </mesh>
        );
      })}
      {/* Main trunk — bottle shaped (wide belly) */}
      <mesh position={[0, 1.1, 0]} castShadow>
        <cylinderGeometry args={[0.55, 0.7, 2.2, 18, 5]} />
        <meshToonMaterial color="#4A3018" />
      </mesh>
      {/* Upper trunk — narrows */}
      <mesh position={[0, 2.55, 0]} castShadow>
        <cylinderGeometry args={[0.32, 0.55, 1.0, 16, 4]} />
        <meshToonMaterial color="#3D2810" />
      </mesh>
      {/* Trunk texture rings */}
      {[0.5, 1.0, 1.5, 2.0].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <cylinderGeometry args={[0.7 - y * 0.08, 0.7 - y * 0.08, 0.06, 18, 1, true]} />
          <meshToonMaterial color="#2D1E0C" />
        </mesh>
      ))}
      {/* Branch network */}
      {[[-0.3, 3.05, 0.1, 0, 0, 0.45],
        [0.28, 3.0, -0.15, 0, 0, -0.42],
        [0.05, 3.15, 0.25, 0.28, 0, 0.1],
        [-0.1, 3.1, -0.22, -0.22, 0, -0.08],
      ].map(([x, y, z, rx, ry, rz], i) => (
        <mesh key={i} position={[x, y, z] as [number,number,number]}
          rotation={[rx, ry, rz] as [number,number,number]} castShadow>
          <cylinderGeometry args={[0.06, 0.14, 0.95, 10, 3]} />
          <meshToonMaterial color="#3A2808" />
        </mesh>
      ))}
      {/* Canopy — multi-sphere fluffy cluster */}
      <group ref={canopyRef} position={[0, 3.2, 0]}>
        <mesh position={[0, 0.3, 0]} castShadow>
          <sphereGeometry args={[1.12, 22, 16]} />
          <meshToonMaterial color="#2D5E1A" />
        </mesh>
        <mesh position={[-0.5, 0.1, 0.3]}>
          <sphereGeometry args={[0.78, 18, 14]} />
          <meshToonMaterial color="#336A20" />
        </mesh>
        <mesh position={[0.55, 0.05, -0.25]}>
          <sphereGeometry args={[0.72, 18, 14]} />
          <meshToonMaterial color="#285818" />
        </mesh>
        <mesh position={[0.25, 0.5, 0.45]}>
          <sphereGeometry args={[0.65, 16, 12]} />
          <meshToonMaterial color="#336A20" />
        </mesh>
        <mesh position={[-0.3, 0.55, -0.35]}>
          <sphereGeometry args={[0.6, 16, 12]} />
          <meshToonMaterial color="#2D5E1A" />
        </mesh>
        {/* Fruit clusters — red small spheres */}
        {[[-0.6, -0.1, 0.6], [0.65, 0, -0.5], [0.1, -0.2, 0.8]].map((p, i) => (
          <mesh key={i} position={p as [number,number,number]}>
            <sphereGeometry args={[0.1, 10, 8]} />
            <meshToonMaterial color="#CC4422" />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// ─── Acacia tree — flat spreading canopy ──────────────────────────────────────
function AcaciaTree({ pos, scale = 1, windPhase = 0 }: {
  pos: [number, number, number]; scale?: number; windPhase?: number;
}) {
  const canopyRef = useRef<THREE.Group>(null);
  const groundY   = terrainH(pos[0], pos[2]);

  useFrame(({ clock }) => {
    if (!canopyRef.current) return;
    const t = clock.elapsedTime;
    canopyRef.current.rotation.z = Math.sin(t * 0.55 + windPhase) * 0.018;
  });

  return (
    <group position={[pos[0], groundY, pos[2]]} scale={scale}>
      {/* Trunk — slender */}
      <mesh position={[0, 1.0, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.18, 2.0, 12, 4]} />
        <meshToonMaterial color="#5A3A18" />
      </mesh>
      {/* Main branch fork */}
      <mesh position={[0, 2.1, 0]} castShadow>
        <sphereGeometry args={[0.18, 12, 9]} />
        <meshToonMaterial color="#4A3010" />
      </mesh>
      {/* Radiating branches — flat spread */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
        const a  = (deg * Math.PI) / 180;
        const l  = 0.7 + (i % 2) * 0.2;
        return (
          <mesh key={i}
            position={[Math.cos(a) * l * 0.5, 2.15, Math.sin(a) * l * 0.5]}
            rotation={[0.28, a, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.09, l, 8, 2]} />
            <meshToonMaterial color="#4A3010" />
          </mesh>
        );
      })}
      {/* Flat canopy — umbrella shape */}
      <group ref={canopyRef} position={[0, 2.35, 0]}>
        <mesh scale={[1, 0.28, 1]} castShadow>
          <sphereGeometry args={[1.4, 22, 14]} />
          <meshToonMaterial color="#3A7025" />
        </mesh>
        <mesh position={[0, 0.08, 0]} scale={[1.12, 0.18, 1.12]}>
          <sphereGeometry args={[1.3, 20, 12]} />
          <meshToonMaterial color="#4A8030" />
        </mesh>
      </group>
    </group>
  );
}

// ─── Palm tree — curved tropical trunk ───────────────────────────────────────
function PalmTree({ pos, scale = 1, windPhase = 0 }: {
  pos: [number, number, number]; scale?: number; windPhase?: number;
}) {
  const leavesRef = useRef<THREE.Group>(null);
  const groundY   = terrainH(pos[0], pos[2]);
  const lean      = useRef([(Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2]);

  useFrame(({ clock }) => {
    if (!leavesRef.current) return;
    const t = clock.elapsedTime;
    leavesRef.current.rotation.z = lean.current[0] + Math.sin(t * 0.7 + windPhase) * 0.04;
    leavesRef.current.rotation.x = lean.current[1] + Math.sin(t * 0.5 + windPhase + 1) * 0.025;
  });

  return (
    <group position={[pos[0], groundY, pos[2]]} scale={scale}>
      {/* Curved trunk — 5 segments with slight lean */}
      {[0, 1, 2, 3, 4].map(i => (
        <mesh key={i} position={[lean.current[0] * i * 0.18, 0.5 + i * 0.7, lean.current[1] * i * 0.12]}
          rotation={[lean.current[1] * 0.05 * i, 0, lean.current[0] * 0.06 * i]}
          castShadow>
          <cylinderGeometry args={[0.072 - i * 0.008, 0.1 - i * 0.008, 0.75, 10, 2]} />
          <meshToonMaterial color={i % 2 === 0 ? '#6A4520' : '#5A3A18'} />
        </mesh>
      ))}
      {/* Trunk top */}
      <group ref={leavesRef}
        position={[lean.current[0] * 0.9, 3.9, lean.current[1] * 0.6]}>
        {/* Palm leaves — radiating arcs */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
          const a  = (deg * Math.PI) / 180;
          const tiltX = Math.cos(a + Math.PI / 2) * 0.6;
          const tiltZ = Math.sin(a) * 0.35;
          return (
            <group key={i} rotation={[tiltX * 0.5, a, tiltZ]}>
              <mesh position={[0, 0.55, 0]}>
                <boxGeometry args={[0.12, 1.1, 0.05, 2, 5, 1]} />
                <meshToonMaterial color="#2D5E18" />
              </mesh>
              {/* Leaf fronds */}
              {[-0.22, -0.1, 0.1, 0.22].map((ox, j) => (
                <mesh key={j} position={[ox, 0.38 + Math.abs(ox) * 0.3, 0]}
                  rotation={[0, 0, ox * 1.8]}>
                  <boxGeometry args={[0.14, 0.6, 0.02, 1, 3, 1]} />
                  <meshToonMaterial color={j % 2 === 0 ? '#3A7020' : '#2D5E18'} />
                </mesh>
              ))}
            </group>
          );
        })}
        {/* Coconut cluster */}
        {[[-0.15, -0.1, 0.15], [0.14, -0.08, -0.1], [0, -0.12, 0.2]].map((p, i) => (
          <mesh key={i} position={p as [number,number,number]}>
            <sphereGeometry args={[0.12, 12, 9]} />
            <meshToonMaterial color="#4A3818" />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// ─── Flower patch — instanced wildflowers ────────────────────────────────────
export function FlowerPatches({ windStr = 0 }: { windStr?: number }) {
  const stemRef   = useRef<THREE.InstancedMesh>(null);
  const petalRef  = useRef<THREE.InstancedMesh>(null);
  const COUNT     = 280;

  const flowers = useMemo(() => {
    const arr: { x: number; z: number; rot: number; color: THREE.Color; scale: number }[] = [];
    const FLOWER_COLORS = [
      '#FFD700', '#FF6B6B', '#C084FC', '#FFFFFF', '#FF9F40', '#7DD3FC',
      '#F9A8D4', '#86EFAC', '#FDE68A', '#E879F9',
    ];
    for (let i = 0; i < COUNT; i++) {
      let x: number, z: number;
      // Scatter avoiding paths and center
      do {
        x = (Math.random() - 0.5) * 100;
        z = (Math.random() - 0.5) * 100;
      } while (Math.sqrt(x * x + z * z) < 8 || pathness(x, z) < 0.55);

      arr.push({
        x, z,
        rot:   Math.random() * Math.PI * 2,
        color: new THREE.Color(FLOWER_COLORS[Math.floor(Math.random() * FLOWER_COLORS.length)]),
        scale: 0.55 + Math.random() * 0.6,
      });
    }
    return arr;
  }, []);

  useFrame(({ clock }) => {
    if (!stemRef.current || !petalRef.current) return;
    const t     = clock.elapsedTime;
    const dummy = new THREE.Object3D();

    flowers.forEach((f, i) => {
      const sway = Math.sin(t * 1.2 + i * 0.45) * windStr * 0.06;
      const y    = terrainH(f.x, f.z);
      dummy.position.set(f.x, y + 0.06 * f.scale, f.z);
      dummy.rotation.set(sway, f.rot, 0);
      dummy.scale.setScalar(f.scale);
      dummy.updateMatrix();
      stemRef.current!.setMatrixAt(i, dummy.matrix);

      dummy.position.set(f.x, y + 0.16 * f.scale, f.z);
      dummy.rotation.set(sway * 0.5, f.rot, 0);
      dummy.scale.setScalar(f.scale * 0.9);
      dummy.updateMatrix();
      petalRef.current!.setMatrixAt(i, dummy.matrix);
      petalRef.current!.setColorAt(i, f.color);
    });

    stemRef.current.instanceMatrix.needsUpdate  = true;
    petalRef.current.instanceMatrix.needsUpdate = true;
    if (petalRef.current.instanceColor) petalRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <>
      <instancedMesh ref={stemRef} args={[undefined, undefined, COUNT]}>
        <cylinderGeometry args={[0.018, 0.022, 0.18, 6, 2]} />
        <meshToonMaterial color="#3A6A1A" />
      </instancedMesh>
      <instancedMesh ref={petalRef} args={[undefined, undefined, COUNT]}>
        <sphereGeometry args={[0.1, 10, 7]} />
        <meshToonMaterial color="#FFFFFF" />
      </instancedMesh>
    </>
  );
}

// ─── Stone lanterns along paths ───────────────────────────────────────────────
export function StoneLanterns({ isNight }: { isNight: boolean }) {
  const glowRef = useRef<THREE.InstancedMesh>(null);
  const LANTERN_POSITIONS: [number, number, number][] = [
    [-7, 0, -5.5], [7, 0, -5.5], [-5.5, 0, 7], [5.5, 0, 7],
    [-11, 0, -9],  [11, 0, -9],  [-9, 0, 11],   [9, 0, 11],
    [-15, 0, -11], [15, 0, -11], [-13, 0, 14],   [13, 0, 14],
  ];

  useFrame(({ clock }) => {
    if (!glowRef.current || !isNight) return;
    const t     = clock.elapsedTime;
    const dummy = new THREE.Object3D();
    LANTERN_POSITIONS.forEach((p, i) => {
      const y = terrainH(p[0], p[2]);
      dummy.position.set(p[0], y + 1.12, p[2]);
      const flicker = 0.9 + Math.sin(t * 3.2 + i * 1.7) * 0.12;
      dummy.scale.setScalar(flicker);
      dummy.updateMatrix();
      glowRef.current!.setMatrixAt(i, dummy.matrix);
    });
    glowRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {LANTERN_POSITIONS.map((p, i) => {
        const y = terrainH(p[0], p[2]);
        return (
          <group key={i} position={[p[0], y, p[2]]}>
            {/* Base plinth */}
            <mesh position={[0, 0.14, 0]}>
              <cylinderGeometry args={[0.18, 0.22, 0.28, 8, 2]} />
              <meshToonMaterial color="#7A6858" />
            </mesh>
            {/* Shaft */}
            <mesh position={[0, 0.55, 0]}>
              <cylinderGeometry args={[0.1, 0.14, 0.55, 8, 3]} />
              <meshToonMaterial color="#6A5848" />
            </mesh>
            {/* Cap */}
            <mesh position={[0, 0.86, 0]}>
              <cylinderGeometry args={[0.2, 0.12, 0.1, 8, 1]} />
              <meshToonMaterial color="#5A4838" />
            </mesh>
            {/* Lantern body */}
            <mesh position={[0, 1.08, 0]}>
              <boxGeometry args={[0.3, 0.32, 0.3, 2, 2, 2]} />
              <meshToonMaterial color="#5A4838" />
            </mesh>
            {/* Light glow fill */}
            <mesh position={[0, 1.08, 0]}>
              <boxGeometry args={[0.24, 0.26, 0.24, 1, 1, 1]} />
              <meshToonMaterial color={isNight ? '#FFB840' : '#FFF4C0'} transparent opacity={isNight ? 0.7 : 0.15} />
            </mesh>
            {/* Roof cap */}
            <mesh position={[0, 1.26, 0]}>
              <coneGeometry args={[0.22, 0.18, 8, 2]} />
              <meshToonMaterial color="#4A3828" />
            </mesh>
          </group>
        );
      })}
      {/* Glow halos at night */}
      {isNight && (
        <instancedMesh ref={glowRef} args={[undefined, undefined, LANTERN_POSITIONS.length]}>
          <sphereGeometry args={[0.35, 12, 8]} />
          <meshBasicMaterial color="#FFB840" transparent opacity={0.12} />
        </instancedMesh>
      )}
    </group>
  );
}

// ─── Fireflies — animated glowing orbs at dusk/night ─────────────────────────
export function Fireflies({ visible }: { visible: boolean }) {
  const ref   = useRef<THREE.InstancedMesh>(null);
  const COUNT = 55;

  const data = useMemo(() => Array.from({ length: COUNT }, (_, i) => ({
    x:      (Math.random() - 0.5) * 60,
    z:      (Math.random() - 0.5) * 60,
    baseY:  1.2 + Math.random() * 2.4,
    speed:  0.3 + Math.random() * 0.5,
    phase:  Math.random() * Math.PI * 2,
    radius: 1.5 + Math.random() * 3.0,
    on:     Math.random() > 0.3,
  })), []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t     = clock.elapsedTime;
    const dummy = new THREE.Object3D();

    data.forEach((d, i) => {
      const groundY = terrainH(d.x, d.z);
      const flicker = Math.sin(t * 4.2 + d.phase) > 0.1;
      const scale   = visible && flicker ? 0.08 + Math.random() * 0.04 : 0;

      dummy.position.set(
        d.x + Math.cos(t * d.speed + d.phase) * d.radius,
        groundY + d.baseY + Math.sin(t * 0.7 + d.phase) * 0.6,
        d.z + Math.sin(t * d.speed * 0.8 + d.phase + 1) * d.radius,
      );
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, COUNT]}>
      <sphereGeometry args={[1, 8, 6]} />
      <meshBasicMaterial color="#AAFF44" transparent opacity={0.85} />
    </instancedMesh>
  );
}

// ─── Rock clusters — scattered organic stone formations ───────────────────────
export function RockClusters() {
  const clusters = useMemo(() => {
    const arr: { x: number; z: number; rocks: { ox: number; oz: number; oy: number; rx: number; ry: number; rz: number; s: number }[] }[] = [];
    const POSITIONS: [number, number][] = [
      [-28, -20], [25, 20], [-18, 22], [28, -15],
      [5, -24],   [-8, 28], [32, 10],  [-30, 8],
      [18, -26],  [-24, 14],
    ];
    POSITIONS.forEach(([x, z]) => {
      const rocks = Array.from({ length: 3 + Math.floor(Math.random() * 3) }, (_, i) => ({
        ox: (Math.random() - 0.5) * 1.4,
        oz: (Math.random() - 0.5) * 1.4,
        oy: Math.random() * 0.08,
        rx: (Math.random() - 0.5) * 0.6,
        ry: Math.random() * Math.PI,
        rz: (Math.random() - 0.5) * 0.5,
        s:  0.2 + Math.random() * 0.45,
      }));
      arr.push({ x, z, rocks });
    });
    return arr;
  }, []);

  return (
    <group>
      {clusters.map((c, ci) => {
        const gy = terrainH(c.x, c.z);
        return (
          <group key={ci} position={[c.x, gy, c.z]}>
            {c.rocks.map((r, ri) => (
              <mesh key={ri}
                position={[r.ox, r.oy, r.oz]}
                rotation={[r.rx, r.ry, r.rz]}
                scale={r.s}
                castShadow>
                <dodecahedronGeometry args={[0.55, 0]} />
                <meshToonMaterial color={ri % 2 === 0 ? '#7A7068' : '#6A6058'} />
              </mesh>
            ))}
            {/* Moss patches between rocks */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
              <circleGeometry args={[0.6, 12]} />
              <meshToonMaterial color="#3A5828" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// ─── Mushroom clusters — decorative detail near trees ────────────────────────
function MushroomCluster({ pos }: { pos: [number, number, number] }) {
  const y = terrainH(pos[0], pos[2]);
  const caps = [
    { ox: 0, oz: 0, h: 0.22, r: 0.14, color: '#DC2626' },
    { ox: 0.18, oz: 0.12, h: 0.14, r: 0.09, color: '#EF4444' },
    { ox: -0.15, oz: 0.16, h: 0.18, r: 0.1, color: '#CC2020' },
  ];
  return (
    <group position={[pos[0], y, pos[2]]}>
      {caps.map((c, i) => (
        <group key={i} position={[c.ox, 0, c.oz]}>
          <mesh position={[0, c.h / 2, 0]}>
            <cylinderGeometry args={[0.022, 0.028, c.h, 8, 2]} />
            <meshToonMaterial color="#E8DCC8" />
          </mesh>
          <mesh position={[0, c.h + 0.02, 0]} scale={[1, 0.65, 1]}>
            <sphereGeometry args={[c.r, 12, 8]} />
            <meshToonMaterial color={c.color} />
          </mesh>
          {/* Spots */}
          <mesh position={[0, c.h + c.r * 0.4, c.r * 0.6]}>
            <circleGeometry args={[0.022, 6]} />
            <meshBasicMaterial color="#FFFFFF" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ─── Full tree system — baobabs, acacias, palms scattered across the world ────
export function TreeSystem({ windStr = 0 }: { windStr?: number }) {
  return (
    <group>
      {/* ── Baobabs — 12 signature trees ── */}
      <BaobabTree pos={[-12,0,-8]}   scale={1.05} windPhase={0}    windStr={windStr} />
      <BaobabTree pos={[11, 0,-7]}   scale={0.9}  windPhase={1.2}  windStr={windStr} />
      <BaobabTree pos={[-11,0,9]}    scale={1.1}  windPhase={2.4}  windStr={windStr} />
      <BaobabTree pos={[10, 0,8]}    scale={0.95} windPhase={0.8}  windStr={windStr} />
      <BaobabTree pos={[-32,0,-20]}  scale={1.2}  windPhase={1.5}  windStr={windStr} />
      <BaobabTree pos={[28, 0,-22]}  scale={1.0}  windPhase={2.8}  windStr={windStr} />
      <BaobabTree pos={[-28,0,22]}   scale={1.15} windPhase={0.4}  windStr={windStr} />
      <BaobabTree pos={[26, 0,24]}   scale={1.0}  windPhase={3.1}  windStr={windStr} />
      <BaobabTree pos={[0,  0,-38]}  scale={1.3}  windPhase={1.8}  windStr={windStr} />
      <BaobabTree pos={[-38,0,-5]}   scale={1.0}  windPhase={0.6}  windStr={windStr} />
      <BaobabTree pos={[38, 0,5]}    scale={1.1}  windPhase={2.2}  windStr={windStr} />
      <BaobabTree pos={[0,  0,38]}   scale={1.05} windPhase={1.0}  windStr={windStr} />

      {/* ── Acacias — 10 flat-top trees ── */}
      <AcaciaTree pos={[-18,0,-4]}  scale={1.0} windPhase={0.3}  />
      <AcaciaTree pos={[18, 0,-5]}  scale={0.9} windPhase={1.4}  />
      <AcaciaTree pos={[-16,0,12]}  scale={1.1} windPhase={2.5}  />
      <AcaciaTree pos={[16, 0,13]}  scale={0.95}windPhase={0.9}  />
      <AcaciaTree pos={[-24,0,-30]} scale={1.2} windPhase={1.7}  />
      <AcaciaTree pos={[24, 0,-28]} scale={1.0} windPhase={2.9}  />
      <AcaciaTree pos={[-24,0,30]}  scale={1.1} windPhase={0.5}  />
      <AcaciaTree pos={[22, 0,32]}  scale={1.05}windPhase={3.2}  />
      <AcaciaTree pos={[-40,0,15]}  scale={0.85}windPhase={1.1}  />
      <AcaciaTree pos={[40, 0,-15]} scale={0.9} windPhase={2.0}  />

      {/* ── Palms — 8 along river edge & scattered ── */}
      <PalmTree pos={[-19,0,-12]} scale={1.1} windPhase={0.2}  />
      <PalmTree pos={[-20,0,-5]}  scale={0.95}windPhase={1.6}  />
      <PalmTree pos={[-18,0,4]}   scale={1.05}windPhase={2.7}  />
      <PalmTree pos={[-19,0,12]}  scale={0.9} windPhase={0.7}  />
      <PalmTree pos={[-15,0,-20]} scale={1.0} windPhase={3.0}  />
      <PalmTree pos={[-15,0,20]}  scale={1.1} windPhase={1.3}  />
      <PalmTree pos={[35, 0,28]}  scale={0.9} windPhase={2.1}  />
      <PalmTree pos={[30, 0,-30]} scale={1.0} windPhase={0.4}  />

      {/* ── Outer forest ring — dense baobabs ── */}
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2;
        const r = 44 + Math.sin(i * 2.1) * 4;
        return (
          <BaobabTree
            key={`outer-${i}`}
            pos={[Math.cos(a) * r, 0, Math.sin(a) * r]}
            scale={0.75 + Math.sin(i * 1.3) * 0.2}
            windPhase={i * 0.8}
            windStr={windStr}
          />
        );
      })}

      {/* ── Mushroom clusters near trees ── */}
      <MushroomCluster pos={[-12.5, 0, -9.5]} />
      <MushroomCluster pos={[11.5, 0, -8]}    />
      <MushroomCluster pos={[-11, 0, 10.5]}   />
      <MushroomCluster pos={[10.5, 0, 9]}     />
    </group>
  );
}

// ─── Sacred fire — center bonfire with animated flames ────────────────────────
export function SacredFire() {
  const flame1 = useRef<THREE.Mesh>(null);
  const flame2 = useRef<THREE.Mesh>(null);
  const flame3 = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;

    // Core flame
    if (flame1.current) {
      flame1.current.scale.set(
        0.8 + Math.sin(t * 5.2) * 0.18,
        1 + Math.sin(t * 6.1) * 0.22,
        0.8 + Math.cos(t * 4.8) * 0.14,
      );
      flame1.current.rotation.y = t * 1.8;
    }
    // Mid flame
    if (flame2.current) {
      flame2.current.scale.set(
        0.7 + Math.sin(t * 7.1 + 1) * 0.2,
        1 + Math.sin(t * 5.5 + 0.5) * 0.28,
        0.7 + Math.cos(t * 6.3 + 1) * 0.16,
      );
      flame2.current.rotation.y = -t * 2.2;
    }
    // Outer flame
    if (flame3.current) {
      flame3.current.scale.set(
        0.9 + Math.sin(t * 4.4 + 2) * 0.15,
        1 + Math.sin(t * 7.2 + 1) * 0.18,
        0.9 + Math.cos(t * 5.0 + 2) * 0.12,
      );
      flame3.current.rotation.y = t * 1.1;
    }
    // Ground glow pulse
    if (glowRef.current) {
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.14 + Math.sin(t * 3.5) * 0.06;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Stone fire ring */}
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.72, 0.14, Math.sin(a) * 0.72]}
            rotation={[0.1, a, 0.05]}>
            <dodecahedronGeometry args={[0.16, 0]} />
            <meshToonMaterial color={i % 2 === 0 ? '#5A4838' : '#4A3828'} />
          </mesh>
        );
      })}
      {/* Log base */}
      <mesh position={[0.2, 0.1, 0]} rotation={[0, 0.6, 0.25]}>
        <cylinderGeometry args={[0.07, 0.1, 1.0, 10, 2]} />
        <meshToonMaterial color="#3D2410" />
      </mesh>
      <mesh position={[-0.2, 0.1, 0]} rotation={[0, -0.4, -0.28]}>
        <cylinderGeometry args={[0.07, 0.1, 1.0, 10, 2]} />
        <meshToonMaterial color="#3D2410" />
      </mesh>
      <mesh position={[0, 0.08, 0.2]} rotation={[0.3, 1.2, 0]}>
        <cylinderGeometry args={[0.065, 0.09, 0.9, 10, 2]} />
        <meshToonMaterial color="#4A2C14" />
      </mesh>
      {/* Coal bed — embers */}
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.38, 16]} />
        <meshToonMaterial color="#CC3300" />
      </mesh>
      {/* Outer flame */}
      <mesh ref={flame3} position={[0, 0.48, 0]}>
        <coneGeometry args={[0.42, 0.95, 18, 6]} />
        <meshToonMaterial color="#E85000" transparent opacity={0.72} />
      </mesh>
      {/* Mid flame */}
      <mesh ref={flame2} position={[0, 0.6, 0]}>
        <coneGeometry args={[0.28, 0.85, 16, 5]} />
        <meshToonMaterial color="#FF7A00" transparent opacity={0.82} />
      </mesh>
      {/* Core flame */}
      <mesh ref={flame1} position={[0, 0.72, 0]}>
        <coneGeometry args={[0.18, 0.72, 14, 4]} />
        <meshToonMaterial color="#FFD040" transparent opacity={0.92} />
      </mesh>
      {/* Hot tip */}
      <mesh position={[0, 1.28, 0]}>
        <coneGeometry args={[0.06, 0.28, 10, 3]} />
        <meshToonMaterial color="#FFEE80" transparent opacity={0.85} />
      </mesh>
      {/* Ground glow ring */}
      <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[2.2, 36]} />
        <meshBasicMaterial color="#FF6820" transparent opacity={0.14} />
      </mesh>
      {/* Ember sparks — small rising dots */}
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} position={[
          Math.cos(i * 0.8) * 0.15,
          0.3 + (i % 3) * 0.25,
          Math.sin(i * 0.8) * 0.15,
        ]}>
          <sphereGeometry args={[0.022, 6, 4]} />
          <meshBasicMaterial color="#FF9900" />
        </mesh>
      ))}
    </group>
  );
}

// ─── Dense grass blades — 3 layers with wind animation ───────────────────────
// Each layer uses an InstancedMesh with cone geometry (tapering blade shape)
// Blades are scattered avoiding paths, center courtyard, and world boundary
export function DenseGrass({ windStr = 0 }: { windStr?: number }) {
  const shortRef = useRef<THREE.InstancedMesh>(null);
  const medRef   = useRef<THREE.InstancedMesh>(null);
  const tallRef  = useRef<THREE.InstancedMesh>(null);

  const SHORT_N = 1800;
  const MED_N   = 1400;
  const TALL_N  = 700;

  // Pre-compute blade positions — expensive, only runs once
  const blades = useMemo(() => {
    function scatter(n: number, minR: number, pathThresh: number) {
      const arr: { x: number; z: number; rot: number; ph: number; h: number; w: number }[] = [];
      let tries = 0;
      while (arr.length < n && tries < n * 12) {
        tries++;
        const x = (Math.random() - 0.5) * 108;
        const z = (Math.random() - 0.5) * 108;
        const r = Math.sqrt(x * x + z * z);
        if (r < minR || r > 52 || pathness(x, z) < pathThresh) continue;
        arr.push({
          x, z,
          rot: Math.random() * Math.PI * 2,
          ph:  Math.random() * Math.PI * 2,
          h:   0.9 + Math.random() * 0.4,  // height scale relative
          w:   0.9 + Math.random() * 0.3,  // width scale relative
        });
      }
      return arr;
    }
    return {
      short: scatter(SHORT_N, 7.5, 0.55),
      med:   scatter(MED_N,   7.0, 0.52),
      tall:  scatter(TALL_N,  7.0, 0.58),
    };
  }, []);

  // Color palettes per layer
  const shortColors = useMemo(() => [
    new THREE.Color('#2A5C14'), new THREE.Color('#306818'),
    new THREE.Color('#246010'), new THREE.Color('#387020'),
    new THREE.Color('#266214'),
  ], []);
  const medColors = useMemo(() => [
    new THREE.Color('#327020'), new THREE.Color('#3A7A24'),
    new THREE.Color('#2E6618'), new THREE.Color('#40801C'),
  ], []);
  const tallColors = useMemo(() => [
    new THREE.Color('#429028'), new THREE.Color('#4A9830'),
    new THREE.Color('#3A8824'), new THREE.Color('#5AA034'),
    new THREE.Color('#7AB840'), // yellower tips on tallest
  ], []);

  useFrame(({ clock }) => {
    const t     = clock.elapsedTime;
    const dummy = new THREE.Object3D();

    // ── Short blades — tight clusters, minimal sway ──
    if (shortRef.current) {
      blades.short.forEach((b, i) => {
        const gY   = terrainH(b.x, b.z);
        const wind = Math.sin(t * 2.0 + b.x * 0.32 + b.ph) * windStr * 0.065;
        const h    = 0.10 * b.h;
        dummy.position.set(b.x, gY + h * 0.5, b.z);
        dummy.rotation.set(wind, b.rot, 0);
        dummy.scale.set(0.019 * b.w, h, 0.019 * b.w);
        dummy.updateMatrix();
        shortRef.current!.setMatrixAt(i, dummy.matrix);
        shortRef.current!.setColorAt(i, shortColors[i % shortColors.length]);
      });
      shortRef.current.instanceMatrix.needsUpdate = true;
      if (shortRef.current.instanceColor) shortRef.current.instanceColor.needsUpdate = true;
    }

    // ── Medium blades ──
    if (medRef.current) {
      blades.med.forEach((b, i) => {
        const gY   = terrainH(b.x, b.z);
        const wind = Math.sin(t * 1.7 + b.x * 0.28 + b.ph + 0.7) * windStr * 0.095;
        const h    = 0.175 * b.h;
        dummy.position.set(b.x, gY + h * 0.5, b.z);
        dummy.rotation.set(wind, b.rot, 0);
        dummy.scale.set(0.024 * b.w, h, 0.024 * b.w);
        dummy.updateMatrix();
        medRef.current!.setMatrixAt(i, dummy.matrix);
        medRef.current!.setColorAt(i, medColors[i % medColors.length]);
      });
      medRef.current.instanceMatrix.needsUpdate = true;
      if (medRef.current.instanceColor) medRef.current.instanceColor.needsUpdate = true;
    }

    // ── Tall blades — most visible sway ──
    if (tallRef.current) {
      blades.tall.forEach((b, i) => {
        const gY   = terrainH(b.x, b.z);
        const wind = Math.sin(t * 1.4 + b.x * 0.25 + b.ph + 1.4) * windStr * 0.14;
        const h    = 0.265 * b.h;
        dummy.position.set(b.x, gY + h * 0.5, b.z);
        dummy.rotation.set(wind, b.rot, 0);
        dummy.scale.set(0.028 * b.w, h, 0.028 * b.w);
        dummy.updateMatrix();
        tallRef.current!.setMatrixAt(i, dummy.matrix);
        tallRef.current!.setColorAt(i, tallColors[i % tallColors.length]);
      });
      tallRef.current.instanceMatrix.needsUpdate = true;
      if (tallRef.current.instanceColor) tallRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <>
      {/* Short blades — triangular cone, 3 radial segments */}
      <instancedMesh ref={shortRef} args={[undefined, undefined, SHORT_N]}>
        <coneGeometry args={[0.5, 1, 3, 2]} />
        <meshToonMaterial side={THREE.DoubleSide} />
      </instancedMesh>

      {/* Medium blades */}
      <instancedMesh ref={medRef} args={[undefined, undefined, MED_N]}>
        <coneGeometry args={[0.5, 1, 3, 3]} />
        <meshToonMaterial side={THREE.DoubleSide} />
      </instancedMesh>

      {/* Tall blades — 4 radial segments for slight oval cross-section */}
      <instancedMesh ref={tallRef} args={[undefined, undefined, TALL_N]}>
        <coneGeometry args={[0.4, 1, 4, 4]} />
        <meshToonMaterial side={THREE.DoubleSide} />
      </instancedMesh>
    </>
  );
}

// ─── Wildflower patches — clusters of 3-5 flowers at specific spots ───────────
// More detailed than FlowerPatches — each cluster has stems + petal rings
export function WildflowerClusters() {
  const CLUSTER_SPOTS: [number, number][] = [
    [-8, -12], [9, -10], [-10, 14], [12, 10],
    [-20, -25], [18, -24], [-22, 26], [20, 28],
    [5, -18], [-6, 20], [28, -10], [-26, 12],
    [14, -32], [-12, 32], [0, -20], [0, 22],
  ];

  const PETALS = [
    { color: '#FFD700', center: '#FF8C00' }, // sunflower
    { color: '#FF6B6B', center: '#CC2020' }, // red poppy
    { color: '#C084FC', center: '#7C3AED' }, // lavender
    { color: '#FFFFFF', center: '#FFE040' }, // daisy
    { color: '#FF9F40', center: '#DD6600' }, // marigold
    { color: '#F9A8D4', center: '#BE185D' }, // pink blossom
    { color: '#86EFAC', center: '#16A34A' }, // small green
    { color: '#7DD3FC', center: '#0284C7' }, // blue cornflower
  ];

  return (
    <group>
      {CLUSTER_SPOTS.map(([cx, cz], ci) => {
        const palette = PETALS[ci % PETALS.length];
        const gy      = terrainH(cx, cz);
        return (
          <group key={ci} position={[cx, gy, cz]}>
            {Array.from({ length: 3 + (ci % 3) }, (_, fi) => {
              const fx  = (Math.random() - 0.5) * 1.2;
              const fz  = (Math.random() - 0.5) * 1.2;
              const fh  = 0.18 + Math.random() * 0.14;
              const fgy = terrainH(cx + fx, cz + fz) - gy;
              return (
                <group key={fi} position={[fx, fgy, fz]}>
                  {/* Stem */}
                  <mesh position={[0, fh * 0.45, 0]}>
                    <cylinderGeometry args={[0.014, 0.018, fh * 0.9, 6, 2]} />
                    <meshToonMaterial color="#3A7020" />
                  </mesh>
                  {/* Leaf on stem */}
                  <mesh position={[0.04, fh * 0.35, 0]} rotation={[0, 0, 0.55]}>
                    <boxGeometry args={[0.12, 0.04, 0.05, 2, 1, 1]} />
                    <meshToonMaterial color="#3A6820" />
                  </mesh>
                  {/* Petals — 6 around center */}
                  {Array.from({ length: 6 }, (_, pi) => {
                    const pa = (pi / 6) * Math.PI * 2;
                    const pr = 0.065 + Math.random() * 0.025;
                    return (
                      <mesh key={pi} position={[Math.cos(pa) * pr, fh, Math.sin(pa) * pr]} scale={[1, 0.55, 1]}>
                        <sphereGeometry args={[0.048, 8, 6]} />
                        <meshToonMaterial color={palette.color} />
                      </mesh>
                    );
                  })}
                  {/* Center disc */}
                  <mesh position={[0, fh, 0]}>
                    <sphereGeometry args={[0.038, 10, 7]} />
                    <meshToonMaterial color={palette.center} />
                  </mesh>
                </group>
              );
            })}
          </group>
        );
      })}
    </group>
  );
}
