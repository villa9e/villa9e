'use client';
import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { AnimatePresence, motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

const VillageMap3DOverlay = dynamic(() => import('./VillageMap3D'), { ssr: false, loading: () => null });
import { createClient } from '@/lib/supabase/client';
import { useWeather } from '@/lib/theme/useWeather';
import { useSpiritVoice } from '@/components/village/SpiritVoiceProvider';
import { VillageSound } from '@/lib/sounds/village';
import { useSkySystem } from '@/lib/world/useSkySystem';
import { SpiritFigure } from '@/components/spirit/SpiritFigure';
import type { SpiritVariantId } from '@/components/spirit/SpiritFigure';
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';
import {
  WorkshopBuilding, DreamLineBuilding, TradingPostBuilding, BankBuilding,
  ZenBuilding, TribesBuilding, HospitalBuilding, HutBuilding, SpiritShrine,
} from './VillageBuildings';

// ─── Building scale factor — buildings are 2.8× bigger than their geometry ───
const BUILDING_SCALE = 2.8;

// ─── Location data — positions spread for larger scaled buildings ─────────────
// Collision sizes are geometry × BUILDING_SCALE
const LOCATIONS = [
  { id: 'workshop',     label: 'Workshop',     href: '/village/workshop',     pos: [-22, 0, -16] as [number,number,number], color: '#E8770A', size: [10, 11, 10] as [number,number,number] },
  { id: 'dreamline',   label: 'Dream Line',   href: '/village/dreamline',    pos: [ 22, 0, -16] as [number,number,number], color: '#7C3AED', size: [10, 10, 10] as [number,number,number] },
  { id: 'trading-post',label: 'Trading Post', href: '/village/trading-post', pos: [-22, 0,  16] as [number,number,number], color: '#059669', size: [10,  9, 10] as [number,number,number] },
  { id: 'bank',         label: 'Bank',         href: '/village/bank',         pos: [ 22, 0,  16] as [number,number,number], color: '#D97706', size: [10, 11, 10] as [number,number,number] },
  { id: 'zen',          label: 'Zen',          href: '/village/zen',           pos: [-30, 0,   0] as [number,number,number], color: '#0D9488', size: [10,  9, 10] as [number,number,number] },
  { id: 'tribes',       label: 'Tribes',       href: '/village/tribes',        pos: [ 30, 0,   0] as [number,number,number], color: '#BE185D', size: [10, 10, 10] as [number,number,number] },
  { id: 'hospital',     label: 'Hospital',     href: '/village/hospital',      pos: [  0, 0, -28] as [number,number,number], color: '#16A34A', size: [10, 10, 10] as [number,number,number] },
  { id: 'hut',          label: 'My Hut',       href: '/village/hut',           pos: [  0, 0,  26] as [number,number,number], color: '#EA580C', size: [ 9,  9,  9] as [number,number,number] },
];

// ─── Radial crescent menu — monotone SVG icons ───────────────────────────────
// Using simple Unicode symbols that read as flat/monotone
const MENU_ITEMS = [
  { id: 'messages', icon: '◉', label: 'Messages', href: '/messages',               svg: 'M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z' },
  { id: 'goal',     icon: '◎', label: 'New Goal',  href: '/village/workshop/chat',  svg: 'M12 2a10 10 0 100 20 10 10 0 000-20zm0 14l-4-4 1.4-1.4 2.6 2.6 5.6-5.6L19 9l-7 7z' },
  { id: 'studio',  icon: '◌', label: 'Create',    href: '/village/studio',        svg: 'M12 15.5A3.5 3.5 0 018.5 12 3.5 3.5 0 0112 8.5a3.5 3.5 0 013.5 3.5 3.5 3.5 0 01-3.5 3.5m7.43-2.92c.04-.36.07-.73.07-1.08s-.03-.73-.07-1.08l2.32-1.82c.21-.16.27-.46.13-.7l-2.2-3.82c-.13-.25-.42-.33-.67-.25l-2.74 1.1c-.57-.44-1.18-.8-1.85-1.08l-.4-2.91C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.4 2.91c-.67.28-1.28.64-1.85 1.08L4.52 5.3c-.25-.09-.54 0-.67.25L1.65 9.36c-.14.25-.08.54.13.7l2.32 1.82c-.04.35-.07.72-.07 1.08s.03.73.07 1.08L1.78 16.08c-.21.16-.27.46-.13.7l2.2 3.82c.13.25.42.33.67.25l2.74-1.1c.57.44 1.18.8 1.85 1.08l.4 2.91c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.4-2.91c.67-.28 1.28-.64 1.85-1.08l2.74 1.1c.25.09.54 0 .67-.25l2.2-3.82c.14-.25.08-.54-.13-.7l-2.32-1.82z' },
  { id: 'map',     icon: '◈', label: 'Map',       href: null,                     svg: 'M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z' },
  { id: 'settings',icon: '◇', label: 'Settings',  href: '/village/hut/settings',  svg: 'M12 15.5A3.5 3.5 0 018.5 12 3.5 3.5 0 0112 8.5a3.5 3.5 0 013.5 3.5 3.5 3.5 0 01-3.5 3.5m7.43-2.92c.04-.36.07-.73.07-1.08s-.03-.73-.07-1.08l2.32-1.82c.21-.16.27-.46.13-.7l-2.2-3.82c-.13-.25-.42-.33-.67-.25l-2.74 1.1c-.57-.44-1.18-.8-1.85-1.08l-.4-2.91C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.4 2.91c-.67.28-1.28.64-1.85 1.08L4.52 5.3c-.25-.09-.54 0-.67.25L1.65 9.36c-.14.25-.08.54.13.7l2.32 1.82c-.04.35-.07.72-.07 1.08s.03.73.07 1.08L1.78 16.08c-.21.16-.27.46-.13.7l2.2 3.82c.13.25.42.33.67.25l2.74-1.1c.57.44 1.18.8 1.85 1.08l.4 2.91c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.4-2.91c.67-.28 1.28-.64 1.85-1.08l2.74 1.1c.25.09.54 0 .67-.25l2.2-3.82c.14-.25.08-.54-.13-.7l-2.32-1.82z' },
] as const;
type MenuId = typeof MENU_ITEMS[number]['id'];

// Crescent arc above the avatar head (angles in degrees, 0=right, CCW positive)
// Positions relative to avatar head center, radius 78px
// R=130 → chord between adjacent icons at 25° spacing = 2*130*sin(12.5°) ≈ 56px
// Button size = 44px → 12px gap between icons, no overlap
const CRESCENT_R = 130;
const CRESCENT_ANGLES_DEG = [140, 115, 90, 65, 40];
const CRESCENT_POSITIONS = CRESCENT_ANGLES_DEG.map(deg => {
  const rad = (deg * Math.PI) / 180;
  return { x: Math.cos(rad) * CRESCENT_R, y: -Math.sin(rad) * CRESCENT_R };
});

const SPIRIT_POS: [number,number,number] = [0, 0, 0];

// ─── Sun position from altitude/azimuth ──────────────────────────────────────
// ─── HUDBridge — projects 3D avatar head to 2D screen coords every frame ─────
// Updates DOM element directly (no setState) to avoid 60fps re-renders
function HUDBridge({
  playerPos,
  avatarDivRef,
  spiritDivRef,
}: {
  playerPos: React.MutableRefObject<THREE.Vector3>;
  avatarDivRef: React.MutableRefObject<HTMLDivElement | null>;
  spiritDivRef: React.MutableRefObject<HTMLDivElement | null>;
}) {
  const { camera, size } = useThree();
  useFrame(() => {
    // Avatar head position
    const headWorld = playerPos.current.clone();
    headWorld.y += 2.3;
    headWorld.project(camera);
    const ax = Math.round((headWorld.x * 0.5 + 0.5) * size.width);
    const ay = Math.round((headWorld.y * -0.5 + 0.5) * size.height);
    if (avatarDivRef.current) {
      avatarDivRef.current.style.left = `${ax}px`;
      avatarDivRef.current.style.top  = `${ay}px`;
    }
    // Spirit position (floats behind player)
    const spiritWorld = playerPos.current.clone();
    spiritWorld.x -= Math.sin(playerPos.current.x * 0.1) * 0.8;
    spiritWorld.y += 2.8;
    spiritWorld.z += 1.2;
    spiritWorld.project(camera);
    const sx = Math.round((spiritWorld.x * 0.5 + 0.5) * size.width);
    const sy = Math.round((spiritWorld.y * -0.5 + 0.5) * size.height);
    if (spiritDivRef.current) {
      spiritDivRef.current.style.left = `${sx}px`;
      spiritDivRef.current.style.top  = `${sy}px`;
    }
  });
  return null;
}

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

function hexToColor(hex: string): THREE.Color {
  return new THREE.Color(hex);
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
      {/* Glow halo — high-poly for smooth gradient */}
      <mesh>
        <sphereGeometry args={[isNight ? 1.35 : 3.2, 32, 24]} />
        <meshBasicMaterial color={sunColor} transparent opacity={0.10} />
      </mesh>
      {/* Inner halo — tighter, brighter */}
      <mesh>
        <sphereGeometry args={[isNight ? 0.95 : 2.2, 28, 20]} />
        <meshBasicMaterial color={sunColor} transparent opacity={0.18} />
      </mesh>
      {/* Body disc */}
      <mesh ref={bodyRef}>
        <sphereGeometry args={[isNight ? 0.82 : 1.85, 32, 24]} />
        <meshBasicMaterial color={isNight ? '#F4F8FF' : sunColor} />
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

// ─── River water texture (canvas-based, animated UV) ─────────────────────────
function createRiverTexture(waterColor: string, shimColor: string): THREE.CanvasTexture {
  const W = 512, H = 256;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Base water fill
  ctx.fillStyle = waterColor;
  ctx.fillRect(0, 0, W, H);

  // Flowing current lines — horizontal sinusoidal waves
  for (let row = 0; row < 24; row++) {
    const y0 = (row / 24) * H;
    const amp = 3 + Math.sin(row * 1.3) * 2;
    const freq = 0.025 + Math.sin(row) * 0.008;
    ctx.beginPath();
    ctx.strokeStyle = `rgba(255,255,255,${0.06 + Math.random() * 0.08})`;
    ctx.lineWidth = 1.2;
    for (let x = 0; x <= W; x += 2) {
      const y = y0 + Math.sin(x * freq + row) * amp;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Foam patches near banks
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    ctx.fillStyle = `rgba(255,255,255,${0.04 + Math.random() * 0.06})`;
    ctx.beginPath();
    ctx.ellipse(x, y, 18 + Math.random() * 30, 3 + Math.random() * 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Sky reflection shimmer
  ctx.fillStyle = shimColor;
  ctx.globalAlpha = 0.15;
  ctx.fillRect(W * 0.3, 0, W * 0.4, H);
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1.5, 3);
  return tex;
}

// ─── Procedural river audio (Web Audio API pink noise + filters) ──────────────
function createRiverAudio(): { gain: GainNode; ctx: AudioContext } | null {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const master = audioCtx.createGain();
    master.gain.value = 0;
    master.connect(audioCtx.destination);

    // Pink noise generator
    function pinkNoise() {
      const len = audioCtx.sampleRate * 3;
      const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
      const d = buf.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + w * 0.0555179;
        b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.96900 * b2 + w * 0.1538520;
        b3 = 0.86650 * b3 + w * 0.3104856;
        b4 = 0.55000 * b4 + w * 0.5329522;
        b5 = -0.7616 * b5 - w * 0.0168980;
        d[i] = (b0+b1+b2+b3+b4+b5+b6+w*0.5362) / 6.5;
        b6 = w * 0.115926;
      }
      const src = audioCtx.createBufferSource();
      src.buffer = buf; src.loop = true; return src;
    }

    // Layer 1 — deep river rumble
    const base = pinkNoise();
    const lp = audioCtx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 700; lp.Q.value = 0.5;
    const g1 = audioCtx.createGain(); g1.gain.value = 0.55;
    base.connect(lp); lp.connect(g1); g1.connect(master); base.start();

    // Layer 2 — water surface chatter
    const mid = pinkNoise();
    const bp = audioCtx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 0.8;
    const g2 = audioCtx.createGain(); g2.gain.value = 0.22;
    mid.connect(bp); bp.connect(g2); g2.connect(master); mid.start();

    // Layer 3 — high splash detail
    const hi = pinkNoise();
    const hp = audioCtx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 3500;
    const g3 = audioCtx.createGain(); g3.gain.value = 0.08;
    hi.connect(hp); hp.connect(g3); g3.connect(master); hi.start();

    // LFO — gentle current variation
    const lfo = audioCtx.createOscillator();
    lfo.frequency.value = 0.12;
    const lfog = audioCtx.createGain(); lfog.gain.value = 0.12;
    lfo.connect(lfog); lfog.connect(master.gain); lfo.start();

    return { gain: master, ctx: audioCtx };
  } catch { return null; }
}

// ─── River with animated flow + positional audio ──────────────────────────────
function River({ skyState, playerPos }: {
  skyState: any;
  playerPos: React.MutableRefObject<THREE.Vector3>;
}) {
  const shimmerRef = useRef<THREE.Mesh>(null);
  const flowTex    = useRef<THREE.CanvasTexture | null>(null);
  const flowTex2   = useRef<THREE.CanvasTexture | null>(null);
  const matRef     = useRef<THREE.MeshBasicMaterial>(null);
  const mat2Ref    = useRef<THREE.MeshBasicMaterial>(null);
  const audioRef   = useRef<{ gain: GainNode; ctx: AudioContext } | null>(null);
  const audioReady = useRef(false);

  const isNight  = skyState?.phase === 'night' || skyState?.phase === 'dusk' || skyState?.phase === 'dawn';
  const isGolden = skyState?.phase === 'golden' || skyState?.phase === 'sunrise' || skyState?.phase === 'sunset';

  const waterColor  = isNight ? '#1A2E4A' : isGolden ? '#A06820' : '#2A88BA';
  const shimColor   = isNight ? '#3A5A8A' : isGolden ? '#FFB347' : '#87CEEB';

  // Build / rebuild texture when phase changes
  useEffect(() => {
    if (typeof document === 'undefined') return;
    flowTex.current  = createRiverTexture(waterColor, shimColor);
    flowTex2.current = createRiverTexture(waterColor, shimColor);
    if (matRef.current) { matRef.current.map = flowTex.current; matRef.current.needsUpdate = true; }
    if (mat2Ref.current){ mat2Ref.current.map = flowTex2.current; mat2Ref.current.needsUpdate = true; }
  }, [waterColor, shimColor]);

  // River audio disabled per product decision
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _audioDisabled = audioReady;

  useFrame(state => {
    const t = state.clock.elapsedTime;

    // Animate UV offset — two layers at different speeds for parallax
    if (flowTex.current) {
      flowTex.current.offset.set(0, -(t * 0.18) % 1);
      flowTex.current.needsUpdate = true;
    }
    if (flowTex2.current) {
      flowTex2.current.offset.set(0.5, -(t * 0.28) % 1);
      flowTex2.current.needsUpdate = true;
    }

    // Shimmer band scrolls upstream
    if (shimmerRef.current) {
      shimmerRef.current.position.z = -16 + ((t * 2.5) % 36);
      (shimmerRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.08 + Math.sin(t * 3.5) * 0.06;
    }

    // River audio disabled
  });

  return (
    <group>
      {/* ── Main channel — layer 1 (slower flow) ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0.15]} position={[-17, 0.06, 0]}>
        <planeGeometry args={[3.5, 38, 10, 1]} />
        <meshBasicMaterial ref={matRef} color={waterColor} map={flowTex.current ?? undefined}
          transparent opacity={0.82} />
      </mesh>

      {/* ── Layer 2 — faster surface detail ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0.15]} position={[-17, 0.08, 0]}>
        <planeGeometry args={[2.6, 36, 8, 1]} />
        <meshBasicMaterial ref={mat2Ref} color={shimColor} map={flowTex2.current ?? undefined}
          transparent opacity={0.28} />
      </mesh>

      {/* ── Foam edge along banks ── */}
      {[-0.9, 0.9].map((side, i) => (
        <mesh key={i} rotation={[-Math.PI/2, 0, 0.15]} position={[-17 + side * 1.1, 0.09, 0]}>
          <planeGeometry args={[0.35, 36, 4, 1]} />
          <meshBasicMaterial color="#FFFFFF" transparent opacity={0.18} />
        </mesh>
      ))}

      {/* ── Moving shimmer band (light reflection) ── */}
      <mesh ref={shimmerRef} rotation={[-Math.PI / 2, 0, 0.15]} position={[-17, 0.1, -18]}>
        <planeGeometry args={[2.4, 5, 4, 1]} />
        <meshBasicMaterial color="#FFFFFF" transparent opacity={0.09} />
      </mesh>

      {/* ── River banks — sandy mud ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0.15]} position={[-19.2, 0.03, 0]}>
        <planeGeometry args={[1.8, 38, 4, 1]} />
        <meshToonMaterial color={isNight ? '#3A2E1A' : '#9A7850'} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0.15]} position={[-14.8, 0.03, 0]}>
        <planeGeometry args={[1.8, 38, 4, 1]} />
        <meshToonMaterial color={isNight ? '#3A2E1A' : '#9A7850'} />
      </mesh>

      {/* ── Riverside reeds / tall grass ── */}
      {[
        [-15.4, 0.08, -10], [-15.2, 0.08, -4], [-15.6, 0.08, 3], [-15.3, 0.08, 9],
        [-18.6, 0.08, -7], [-18.4, 0.08, 1], [-18.8, 0.08, 7],
      ].map((pos, i) => (
        <group key={i} position={pos as [number,number,number]}>
          {[0, 0.3, -0.3].map((dx, j) => (
            <mesh key={j} position={[dx * 0.4, 0, 0]}>
              <coneGeometry args={[0.04, 0.55 + Math.random() * 0.3, 4]} />
              <meshToonMaterial color={isNight ? '#2A4A2A' : '#4A7A2A'} />
            </mesh>
          ))}
        </group>
      ))}

      {/* ── River stones with water ripple rings ── */}
      {[
        [-16.5, 0.1, -9], [-17.4, 0.1, -3], [-16.8, 0.1, 4],
        [-17.2, 0.1, 11], [-16.3, 0.1, -1], [-17.6, 0.1, 7],
      ].map((pos, i) => (
        <group key={i} position={pos as [number,number,number]}>
          <mesh castShadow>
            <sphereGeometry args={[0.18 + Math.sin(i * 1.7) * 0.08, 8, 6]} />
            <meshToonMaterial color={isNight ? '#5A5040' : '#8A8070'} />
          </mesh>
          {/* Ripple ring around stone */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <ringGeometry args={[0.28, 0.38, 16]} />
            <meshBasicMaterial color="#FFFFFF" transparent opacity={0.15} />
          </mesh>
        </group>
      ))}

      {/* ── Small waterfall cascade at one end ── */}
      <group position={[-17, 0.25, -16]}>
        <mesh rotation={[0.4, 0.15, 0]}>
          <planeGeometry args={[1.8, 0.9, 4, 6]} />
          <meshBasicMaterial color={shimColor} transparent opacity={0.55} />
        </mesh>
        {/* Splash pool */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0.6]}>
          <circleGeometry args={[0.9, 16]} />
          <meshBasicMaterial color="#FFFFFF" transparent opacity={0.25} />
        </mesh>
      </group>
    </group>
  );
}

// ─── Distinct building router — Fortnite-standard polygon architecture ────────
const BUILDING_MAP: Record<string, React.FC<{ hover: boolean }>> = {
  workshop:       WorkshopBuilding,
  dreamline:      DreamLineBuilding,
  'trading-post': TradingPostBuilding,
  bank:           BankBuilding,
  zen:            ZenBuilding,
  tribes:         TribesBuilding,
  hospital:       HospitalBuilding,
  hut:            HutBuilding,
  spirit:         SpiritShrine,
};

function Building({
  loc, onEnter, isNear,
}: {
  loc: typeof LOCATIONS[0];
  onEnter: (href: string, label: string) => void;
  isNear: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const [x,, z]  = loc.pos;
  const ArchComp = BUILDING_MAP[loc.id];
  // Door hinge pivot — swings open when player is near
  const doorRef  = useRef<THREE.Group>(null);
  const glowRef  = useRef<THREE.Mesh>(null);

  useFrame(state => {
    // Door swings inward (−Y axis rotation = opens toward player at +Z)
    if (doorRef.current) {
      const target = isNear ? -Math.PI * 0.75 : 0;
      doorRef.current.rotation.y = THREE.MathUtils.lerp(doorRef.current.rotation.y, target, 0.055);
    }
    // Entrance glow pulses when near
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = isNear
        ? 0.22 + Math.sin(state.clock.elapsedTime * 3) * 0.1
        : 0;
    }
  });

  // Scale the shadow circle to match building scale
  const shadowR = 6.5;

  return (
    <group position={[x, 0, z]}>
      {/* Large ground shadow */}
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[shadowR, 48]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.07} />
      </mesh>

      {/* Entrance glow ring — pulses when player nearby */}
      <mesh ref={glowRef} rotation={[-Math.PI/2, 0, 0]} position={[0, 0.04, shadowR * 0.45]}>
        <ringGeometry args={[2.5, 3.8, 40]} />
        <meshBasicMaterial color={loc.color} transparent opacity={0} />
      </mesh>

      {/* Building geometry at 2.8× scale */}
      <group
        scale={BUILDING_SCALE}
        onPointerUp={e => { e.stopPropagation(); onEnter(loc.href, loc.label); }}
        onPointerOver={() => { setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
      >
        {ArchComp && <ArchComp hover={hovered} />}

        {/* ── Animated door — hinge at left edge, opens inward ── */}
        {/* Door frame */}
        <mesh position={[0, -0.52, 1.76]} castShadow>
          <boxGeometry args={[1.15, 2.35, 0.12, 2, 4, 1]} />
          <meshToonMaterial color={loc.color} />
        </mesh>
        {/* Hinge group — pivot left edge of door */}
        <group position={[-0.575, -0.52, 1.82]}>
          <group ref={doorRef}>
            {/* Door panel (offset right from hinge so it swings from left edge) */}
            <mesh position={[0.575, 0, 0.04]} castShadow>
              <boxGeometry args={[1.15, 2.2, 0.07, 2, 4, 1]} />
              <meshToonMaterial color={loc.color} />
            </mesh>
            {/* Door handle */}
            <mesh position={[1.02, 0, 0.1]}>
              <sphereGeometry args={[0.065, 12, 10]} />
              <meshToonMaterial color="#D4A820" />
            </mesh>
          </group>
        </group>
        {/* Door threshold step */}
        <mesh position={[0, -1.68, 1.85]}>
          <boxGeometry args={[1.3, 0.08, 0.55, 2, 1, 1]} />
          <meshToonMaterial color="#8B6914" />
        </mesh>
      </group>

      {/* Hover ring at ground level */}
      {(hovered || isNear) && (
        <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.06, 0]}>
          <ringGeometry args={[shadowR - 0.6, shadowR + 0.4, 48]} />
          <meshBasicMaterial color={loc.color} transparent opacity={isNear ? 0.55 : 0.35} />
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
    const g = new THREE.CylinderGeometry(0.2, 0.38, 1.3, 20, 4);
    g.computeVertexNormals();
    return g;
  }, []);
  const canopyGeo = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(1.0, 3);
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
        <icosahedronGeometry args={[0.65, 3]} />
        <meshToonMaterial color="#22C55E" />
      </mesh>
      <mesh position={[-0.4, 1.3, -0.3]} castShadow>
        <icosahedronGeometry args={[0.6, 3]} />
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
            <sphereGeometry args={[0.18, 14, 10]} />
            <meshToonMaterial color="#78716C" />
          </mesh>
        );
      })}
      {/* Outer flame cone — high poly, animated */}
      <mesh ref={flameRef} geometry={flameGeo} position={[0, 0.55, 0]}>
        <meshBasicMaterial color="#FF6020" transparent opacity={0.88} />
      </mesh>
      {/* Inner bright core */}
      <mesh position={[0, 0.45, 0]}>
        <coneGeometry args={[0.13, 0.38, 20, 4]} />
        <meshBasicMaterial color="#FFD040" transparent opacity={0.92} />
      </mesh>
      {/* Ember glow at base */}
      <mesh position={[0, 0.28, 0]}>
        <sphereGeometry args={[0.22, 20, 14]} />
        <meshBasicMaterial color="#FF4400" transparent opacity={0.45} />
      </mesh>
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
        <planeGeometry args={[130, 130, 60, 60]} />
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

// ─── Rain + wind particle system ─────────────────────────────────────────────
function RainSystem({ intensity = 0, windAngle = 0 }: { intensity?: number; windAngle?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const COUNT = Math.floor(intensity * 600);

  const drops = useMemo(() => Array.from({ length: 600 }, () => ({
    x: (Math.random() - 0.5) * 50,
    y: Math.random() * 20 + 2,
    z: (Math.random() - 0.5) * 50,
    speed: 8 + Math.random() * 6,
    phase: Math.random() * 20,
  })), []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(state => {
    if (!ref.current || COUNT === 0) return;
    const t = state.clock.elapsedTime;
    const windX = Math.sin(windAngle) * intensity * 0.4;
    const windZ = Math.cos(windAngle) * intensity * 0.2;

    drops.forEach((d, i) => {
      if (i >= COUNT) { dummy.scale.setScalar(0); dummy.updateMatrix(); ref.current!.setMatrixAt(i, dummy.matrix); return; }
      const elapsed = (t * d.speed + d.phase) % 22;
      dummy.position.set(
        d.x + windX * elapsed,
        d.y - elapsed,
        d.z + windZ * elapsed,
      );
      dummy.scale.set(1, 1, 1);
      dummy.rotation.set(intensity * 0.3, 0, -windAngle * 0.25);
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
    (ref.current.material as THREE.MeshBasicMaterial).opacity = 0.25 + intensity * 0.35;
  });

  if (intensity < 0.1) return null;

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, 600]}>
      <capsuleGeometry args={[0.015, 0.28, 2, 4]} />
      <meshBasicMaterial color="#C8E8FF" transparent opacity={0.4} />
    </instancedMesh>
  );
}

// ─── Wind-animated grass blades ───────────────────────────────────────────────
function WindGrass({ windStrength = 0, isNight = false }: { windStrength?: number; isNight?: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const blades = useMemo(() => Array.from({ length: 300 }, () => ({
    x: (Math.random() - 0.5) * 48,
    z: (Math.random() - 0.5) * 48,
    scale: 0.3 + Math.random() * 0.4,
    phase: Math.random() * Math.PI * 2,
    speed: 0.8 + Math.random() * 1.2,
  })), []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(state => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    blades.forEach((b, i) => {
      const sway = Math.sin(t * b.speed + b.phase) * (0.08 + windStrength * 0.35);
      dummy.position.set(b.x, 0.12 * b.scale, b.z);
      dummy.rotation.set(sway, b.phase, sway * 0.4);
      dummy.scale.setScalar(b.scale);
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, 300]}>
      <coneGeometry args={[0.04, 0.28, 3]} />
      <meshToonMaterial color={isNight ? '#1A3A1A' : '#4A8A2A'} />
    </instancedMesh>
  );
}

// ─── Dense forest ring around the village ────────────────────────────────────
function ForestRing({ windStrength = 0, isNight = false }: { windStrength?: number; isNight?: boolean }) {
  const trees = useMemo(() => {
    const result: { x: number; z: number; h: number; r: number; type: string; phase: number }[] = [];
    const types = ['tall', 'broad', 'conifer', 'palm', 'baobab'];
    for (let i = 0; i < 100; i++) {
      const angle  = (i / 100) * Math.PI * 2 + Math.random() * 0.15;
      const radius = 40 + Math.random() * 14;
      result.push({
        x:     Math.cos(angle) * radius,
        z:     Math.sin(angle) * radius,
        h:     3 + Math.random() * 6,
        r:     0.7 + Math.random() * 1.6,
        type:  types[Math.floor(Math.random() * types.length)],
        phase: Math.random() * Math.PI * 2,
      });
    }
    // Interior forest patches — fill between center and ring
    for (let i = 0; i < 40; i++) {
      const angle  = Math.random() * Math.PI * 2;
      const radius = 32 + Math.random() * 8;
      result.push({
        x:     Math.cos(angle) * radius,
        z:     Math.sin(angle) * radius,
        h:     2.5 + Math.random() * 3,
        r:     0.5 + Math.random() * 0.8,
        type:  types[Math.floor(Math.random() * types.length)],
        phase: Math.random() * Math.PI * 2,
      });
    }
    return result;
  }, []);

  const trunkColor  = isNight ? '#2A1A0A' : '#5A3520';
  const leaf1 = isNight ? '#0A1F0A' : '#2D5A1A';
  const leaf2 = isNight ? '#122A12' : '#3D7A2A';
  const leaf3 = isNight ? '#0D1F0D' : '#4A8A35';

  return (
    <group>
      {trees.map((tree, i) => (
        <WindTree
          key={i}
          pos={[tree.x, 0, tree.z]}
          h={tree.h}
          r={tree.r}
          type={tree.type}
          phase={tree.phase}
          windStrength={windStrength}
          trunkColor={trunkColor}
          leafColors={[leaf1, leaf2, leaf3]}
          isNight={isNight}
        />
      ))}
    </group>
  );
}

function WindTree({
  pos, h, r, type, phase, windStrength, trunkColor, leafColors, isNight,
}: {
  pos: [number,number,number]; h: number; r: number; type: string;
  phase: number; windStrength: number; trunkColor: string;
  leafColors: string[]; isNight: boolean;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame(state => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const sway = Math.sin(t * 0.7 + phase) * (0.015 + windStrength * 0.06);
    ref.current.rotation.x = sway;
    ref.current.rotation.z = Math.sin(t * 0.5 + phase + 1) * sway * 0.6;
  });

  const trunkR = Math.max(0.08, r * 0.14);

  return (
    <group position={pos}>
      {/* Trunk */}
      <mesh castShadow>
        <cylinderGeometry args={[trunkR * 0.7, trunkR, h * 0.55, 16, 4]} />
        <meshToonMaterial color={trunkColor} />
      </mesh>
      {/* Root buttresses */}
      {[0, 1, 2].map(i => (
        <mesh key={i} position={[Math.cos(i * 2.1) * trunkR * 1.5, -h * 0.22, Math.sin(i * 2.1) * trunkR * 1.5]}
          rotation={[0, i * 2.1, 0.5]} castShadow>
          <boxGeometry args={[trunkR * 0.5, h * 0.18, trunkR * 0.25, 1, 2, 1]} />
          <meshToonMaterial color={trunkColor} />
        </mesh>
      ))}
      {/* Canopy layers */}
      <group ref={ref} position={[0, h * 0.38, 0]}>
        {type === 'conifer' ? (
          // Conical fir tree
          [0, 0.35, 0.65].map((yOff, li) => (
            <mesh key={li} position={[0, yOff * h * 0.6, 0]} castShadow>
              <coneGeometry args={[r * (1.1 - li * 0.25), h * 0.38, 24, 3]} />
              <meshToonMaterial color={leafColors[li]} />
            </mesh>
          ))
        ) : type === 'palm' ? (
          // Palm fronds
          Array.from({ length: 7 }).map((_, fi) => {
            const a = (fi / 7) * Math.PI * 2;
            return (
              <mesh key={fi} position={[Math.cos(a) * r * 0.5, h * 0.1, Math.sin(a) * r * 0.5]}
                rotation={[0.6, a, 0.3]} castShadow>
                <capsuleGeometry args={[0.05, r * 1.1, 6, 14]} />
                <meshToonMaterial color={leafColors[0]} />
              </mesh>
            );
          })
        ) : type === 'baobab' ? (
          // Massive rounded crown
          [0, 0.2, -0.15].map((yOff, li) => (
            <mesh key={li} position={[(li - 1) * r * 0.3, yOff * r, 0]} castShadow>
              <sphereGeometry args={[r * (0.85 + li * 0.1), 20, 16]} />
              <meshToonMaterial color={leafColors[li % 3]} />
            </mesh>
          ))
        ) : type === 'broad' ? (
          // Broad deciduous — layered spheres
          [
            [0, 0, 0, r],
            [r * 0.55, r * 0.15, 0, r * 0.7],
            [-r * 0.55, r * 0.15, 0, r * 0.7],
            [0, r * 0.4, r * 0.3, r * 0.65],
            [0, r * 0.55, -r * 0.25, r * 0.6],
          ].map(([dx, dy, dz, sr], li) => (
            <mesh key={li} position={[dx, dy, dz]} castShadow>
              <sphereGeometry args={[sr, 18, 14]} />
              <meshToonMaterial color={leafColors[li % 3]} />
            </mesh>
          ))
        ) : (
          // Tall — elongated oval canopy
          [0, 0.3].map((yOff, li) => (
            <mesh key={li} position={[0, yOff * r * 0.8, 0]} castShadow>
              <sphereGeometry args={[r * (1 - li * 0.2), 20, 16]} />
              <meshToonMaterial color={leafColors[li]} />
            </mesh>
          ))
        )}
      </group>
      {/* Undergrowth ferns */}
      {[0, 1, 2].map(fi => {
        const a = (fi / 3) * Math.PI * 2 + phase;
        return (
          <mesh key={fi} position={[Math.cos(a) * r * 0.8, -h * 0.24, Math.sin(a) * r * 0.8]}>
            <sphereGeometry args={[0.15 + r * 0.08, 10, 8]} />
            <meshToonMaterial color={leafColors[2]} />
          </mesh>
        );
      })}
    </group>
  );
}

// ─── Leaf/debris particles blowing in wind ────────────────────────────────────
function WindParticles({ windStrength = 0, windAngle = 0 }: { windStrength?: number; windAngle?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const COUNT = 80;
  const particles = useMemo(() => Array.from({ length: COUNT }, () => ({
    x: (Math.random() - 0.5) * 40,
    y: 0.3 + Math.random() * 4,
    z: (Math.random() - 0.5) * 40,
    speed: 0.5 + Math.random() * 2,
    phase: Math.random() * 20,
    tumble: Math.random() * Math.PI * 2,
  })), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(state => {
    if (!ref.current || windStrength < 0.15) { ref.current && (ref.current.count = 0); return; }
    ref.current.count = Math.floor(windStrength * COUNT);
    const t  = state.clock.elapsedTime;
    const wx = Math.sin(windAngle) * windStrength * 3;
    const wz = Math.cos(windAngle) * windStrength * 1.5;
    particles.forEach((p, i) => {
      if (i >= ref.current!.count) return;
      const elapsed = (t * p.speed + p.phase) % 30;
      dummy.position.set(
        ((p.x + wx * elapsed) % 40) - 20,
        p.y + Math.sin(elapsed + p.tumble) * 0.5,
        ((p.z + wz * elapsed) % 40) - 20,
      );
      dummy.rotation.set(elapsed * 2, elapsed * 3, elapsed);
      dummy.scale.setScalar(0.06 + Math.random() * 0.06);
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, COUNT]}>
      <planeGeometry args={[1, 1]} />
      <meshToonMaterial color="#6B8C2A" transparent opacity={0.7} />
    </instancedMesh>
  );
}

// ─── Player character ──────────────────────────────────────────────────────────
// ── Memoji-style avatar geometry (module-level, shared across instances) ────
// All organic — spheres and capsules only, no hard angles
const AV_HEAD   = new THREE.SphereGeometry(0.44, 36, 26);
const AV_EYE    = new THREE.SphereGeometry(0.052, 14, 10);
const AV_NOSE   = new THREE.SphereGeometry(0.055, 14, 10);
const AV_NECK   = new THREE.CylinderGeometry(0.155, 0.185, 0.22, 24, 2);
const AV_BODY   = new THREE.SphereGeometry(0.48, 30, 22);
const AV_SHLD   = new THREE.SphereGeometry(0.26, 22, 16);
const AV_ARM    = new THREE.CapsuleGeometry(0.115, 0.20, 6, 18);
const AV_HAND   = new THREE.SphereGeometry(0.12, 18, 14);
const AV_THIGH  = new THREE.CapsuleGeometry(0.13, 0.22, 6, 16);
const AV_FOOT   = new THREE.SphereGeometry(0.135, 20, 14);

function PlayerCharacter({
  position, rotation, skinColor, isLocal, username, isMovingRef,
  posRef, rotRef,
}: {
  position: THREE.Vector3;
  rotation: number;
  skinColor: string;
  isLocal: boolean;
  username?: string;
  isMovingRef?: React.MutableRefObject<boolean>;
  // Live refs for local player so useFrame always reads current values
  posRef?: React.MutableRefObject<THREE.Vector3>;
  rotRef?: React.MutableRefObject<number>;
}) {
  const groupRef  = useRef<THREE.Group>(null);
  const armLPivot = useRef<THREE.Group>(null);
  const armRPivot = useRef<THREE.Group>(null);
  const legLPivot = useRef<THREE.Group>(null);
  const legRPivot = useRef<THREE.Group>(null);
  const bodyRef   = useRef<THREE.Mesh>(null);

  const shirt = isLocal ? '#1877F2' : '#E8770A';
  const pant  = isLocal ? '#1E3A5F' : '#3D1F00';
  const shoe  = '#111827';
  const hat   = isLocal ? '#0D4FA8' : '#BF5500';

  useFrame(state => {
    if (!groupRef.current) return;

    // Use live refs if provided (local player), else use prop snapshots (remote players)
    const targetPos = posRef ? posRef.current : position;
    const targetRot = rotRef ? rotRef.current : rotation;

    groupRef.current.position.lerp(targetPos, 0.18);

    // Shortest-path rotation lerp to avoid spinning the long way around
    let rotDiff = targetRot - groupRef.current.rotation.y;
    while (rotDiff >  Math.PI) rotDiff -= Math.PI * 2;
    while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
    groupRef.current.rotation.y += rotDiff * 0.18;

    const t   = state.clock.elapsedTime;
    const mov = isMovingRef ? isMovingRef.current : false;
    const swing = mov ? Math.sin(t * 6.5) * 0.48 : 0;

    if (armLPivot.current) armLPivot.current.rotation.x = THREE.MathUtils.lerp(armLPivot.current.rotation.x, -swing * 0.45, 0.2);
    if (armRPivot.current) armRPivot.current.rotation.x = THREE.MathUtils.lerp(armRPivot.current.rotation.x,  swing * 0.45, 0.2);
    if (legLPivot.current) legLPivot.current.rotation.x = THREE.MathUtils.lerp(legLPivot.current.rotation.x,  swing * 0.85, 0.2);
    if (legRPivot.current) legRPivot.current.rotation.x = THREE.MathUtils.lerp(legRPivot.current.rotation.x, -swing * 0.85, 0.2);
    groupRef.current.rotation.z = mov ? Math.sin(t * 6.5) * 0.04 : 0;
    groupRef.current.position.y = targetPos.y + (mov ? Math.abs(Math.sin(t * 6.5 * 2)) * 0.025 : 0);
  });

  return (
    <group ref={groupRef} position={position}>

      {/* ── BEANIE HAT ───────────────────────────────────────────────── */}
      <group position={[0, 2.09, 0]}>
        {/* Hat cuff ring */}
        <mesh>
          <cylinderGeometry args={[0.44, 0.45, 0.14, 32, 1]} />
          <meshToonMaterial color={hat} />
        </mesh>
        {/* Hat dome — smooth partial sphere */}
        <mesh position={[0, 0.14, 0]}>
          <sphereGeometry args={[0.44, 32, 22, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
          <meshToonMaterial color={hat} />
        </mesh>
        {/* Pom-pom on top */}
        <mesh position={[0, 0.42, 0]}>
          <sphereGeometry args={[0.1, 16, 12]} />
          <meshToonMaterial color="#FFFFFF" />
        </mesh>
      </group>

      {/* ── HEAD ─────────────────────────────────────────────────────── */}
      <group position={[0, 1.68, 0]}>
        {/* Main rounded head — large and dominant */}
        <mesh geometry={AV_HEAD} castShadow>
          <meshToonMaterial color={skinColor} />
        </mesh>
        {/* Hair — smooth dark cap under the hat */}
        <mesh position={[0, -0.02, -0.04]}>
          <sphereGeometry args={[0.425, 30, 18, 0, Math.PI * 2, Math.PI * 0.42, Math.PI * 0.26]} />
          <meshToonMaterial color="#1A0800" />
        </mesh>
        {/* Left ear — round nub */}
        <mesh position={[0.425, -0.03, 0]} scale={[0.5, 0.72, 0.5]}>
          <sphereGeometry args={[0.12, 16, 12]} />
          <meshToonMaterial color={skinColor} />
        </mesh>
        {/* Right ear */}
        <mesh position={[-0.425, -0.03, 0]} scale={[0.5, 0.72, 0.5]}>
          <sphereGeometry args={[0.12, 16, 12]} />
          <meshToonMaterial color={skinColor} />
        </mesh>
        {/* Left eye — solid black dot (Memoji style) */}
        <mesh geometry={AV_EYE} position={[0.148, 0.055, 0.38]} scale={[1, 1.1, 0.45]}>
          <meshBasicMaterial color="#111111" />
        </mesh>
        {/* Right eye */}
        <mesh geometry={AV_EYE} position={[-0.148, 0.055, 0.38]} scale={[1, 1.1, 0.45]}>
          <meshBasicMaterial color="#111111" />
        </mesh>
        {/* Left eye catch light (white glint) */}
        <mesh position={[0.162, 0.076, 0.398]}>
          <sphereGeometry args={[0.016, 8, 6]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>
        {/* Right eye catch light */}
        <mesh position={[-0.134, 0.076, 0.398]}>
          <sphereGeometry args={[0.016, 8, 6]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>
        {/* Nose — single soft bump, centered */}
        <mesh geometry={AV_NOSE} position={[0, -0.035, 0.432]} scale={[0.75, 0.65, 0.48]}>
          <meshToonMaterial color={skinColor} />
        </mesh>
        {/* Smile — two tiny corner dots */}
        <mesh position={[0.09, -0.115, 0.422]}>
          <sphereGeometry args={[0.022, 10, 8]} />
          <meshBasicMaterial color="#5A1A0A" />
        </mesh>
        <mesh position={[-0.09, -0.115, 0.422]}>
          <sphereGeometry args={[0.022, 10, 8]} />
          <meshBasicMaterial color="#5A1A0A" />
        </mesh>
        {/* Smile arc — tiny torus segment */}
        <mesh position={[0, -0.128, 0.422]} rotation={[0.1, 0, 0]}>
          <torusGeometry args={[0.072, 0.016, 8, 14, Math.PI * 0.72]} />
          <meshBasicMaterial color="#5A1A0A" />
        </mesh>
        {/* Left cheek blush */}
        <mesh position={[0.25, -0.06, 0.36]} scale={[1.6, 0.7, 0.18]}>
          <sphereGeometry args={[0.09, 16, 10]} />
          <meshBasicMaterial color="#FF9898" transparent opacity={0.55} />
        </mesh>
        {/* Right cheek blush */}
        <mesh position={[-0.25, -0.06, 0.36]} scale={[1.6, 0.7, 0.18]}>
          <sphereGeometry args={[0.09, 16, 10]} />
          <meshBasicMaterial color="#FF9898" transparent opacity={0.55} />
        </mesh>
      </group>

      {/* ── NECK — short, smooth ──────────────────────────────────────── */}
      <mesh geometry={AV_NECK} position={[0, 1.17, 0]}>
        <meshToonMaterial color={skinColor} />
      </mesh>

      {/* ── BODY — puffy rounded pillow shape ────────────────────────── */}
      <group position={[0, 0.92, 0]}>
        {/* Main inflated shirt — ovoid shape */}
        <mesh ref={bodyRef} geometry={AV_BODY} scale={[1.14, 1.08, 0.96]} castShadow>
          <meshToonMaterial color={shirt} />
        </mesh>
        {/* Left shoulder — smooth rounded extension of body */}
        <mesh geometry={AV_SHLD} position={[0.48, 0.14, 0]} scale={[1, 0.9, 0.85]}>
          <meshToonMaterial color={shirt} />
        </mesh>
        {/* Right shoulder */}
        <mesh geometry={AV_SHLD} position={[-0.48, 0.14, 0]} scale={[1, 0.9, 0.85]}>
          <meshToonMaterial color={shirt} />
        </mesh>
        {/* Bottom hip rounding — smooth transition to legs */}
        <mesh position={[0, -0.34, 0]} scale={[1.06, 0.68, 0.9]}>
          <sphereGeometry args={[0.44, 26, 18]} />
          <meshToonMaterial color={pant} />
        </mesh>
      </group>

      {/* ── LEFT ARM — pivot at shoulder ─────────────────────────────── */}
      <group ref={armLPivot} position={[0.58, 1.04, 0]}>
        {/* Arm — single puffy capsule (no hard elbow) */}
        <mesh geometry={AV_ARM} position={[0, -0.16, 0]} castShadow>
          <meshToonMaterial color={shirt} />
        </mesh>
        {/* Rounded hand */}
        <mesh geometry={AV_HAND} position={[0, -0.38, 0]}>
          <meshToonMaterial color={skinColor} />
        </mesh>
      </group>

      {/* ── RIGHT ARM — mirror ────────────────────────────────────────── */}
      <group ref={armRPivot} position={[-0.58, 1.04, 0]}>
        <mesh geometry={AV_ARM} position={[0, -0.16, 0]} castShadow>
          <meshToonMaterial color={shirt} />
        </mesh>
        <mesh geometry={AV_HAND} position={[0, -0.38, 0]}>
          <meshToonMaterial color={skinColor} />
        </mesh>
      </group>

      {/* ── LEFT LEG — pivot at hip ───────────────────────────────────── */}
      <group ref={legLPivot} position={[0.18, 0.52, 0]}>
        {/* Thigh — smooth capsule */}
        <mesh geometry={AV_THIGH} position={[0, -0.18, 0]} castShadow>
          <meshToonMaterial color={pant} />
        </mesh>
        {/* Shoe — rounded blob foot (no hard angles) */}
        <mesh geometry={AV_FOOT} position={[0.02, -0.44, 0.08]} scale={[1, 0.72, 1.45]} castShadow>
          <meshToonMaterial color={shoe} />
        </mesh>
        {/* Shoe sole highlight */}
        <mesh position={[0.02, -0.49, 0.08]} scale={[1.05, 0.28, 1.5]}>
          <sphereGeometry args={[0.13, 16, 10]} />
          <meshToonMaterial color="#2A2A2A" />
        </mesh>
      </group>

      {/* ── RIGHT LEG — mirror ───────────────────────────────────────── */}
      <group ref={legRPivot} position={[-0.18, 0.52, 0]}>
        <mesh geometry={AV_THIGH} position={[0, -0.18, 0]} castShadow>
          <meshToonMaterial color={pant} />
        </mesh>
        <mesh geometry={AV_FOOT} position={[-0.02, -0.44, 0.08]} scale={[1, 0.72, 1.45]} castShadow>
          <meshToonMaterial color={shoe} />
        </mesh>
        <mesh position={[-0.02, -0.49, 0.08]} scale={[1.05, 0.28, 1.5]}>
          <sphereGeometry args={[0.13, 16, 10]} />
          <meshToonMaterial color="#2A2A2A" />
        </mesh>
      </group>

      {/* Name tag for remote players */}
      {!isLocal && username && (
        <mesh position={[0, 2.55, 0]}>
          <planeGeometry args={[1.1, 0.30]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.65} />
        </mesh>
      )}
    </group>
  );
}

// ─── Third-person camera controller ───────────────────────────────────────────
function CameraFollow({
  targetPos, cameraZoom, cameraAzimuth,
}: {
  targetPos: React.MutableRefObject<THREE.Vector3>;
  cameraZoom: React.MutableRefObject<number>;
  cameraAzimuth: React.MutableRefObject<number>;
}) {
  const { camera, gl } = useThree();
  const lerpedLook   = useRef(new THREE.Vector3());
  const smoothedZoom = useRef(cameraZoom.current);

  // Mouse wheel zoom (desktop)
  useEffect(() => {
    const canvas = gl.domElement;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Scrolling down (deltaY > 0) = zoom out (increase distance)
      cameraZoom.current = Math.max(6, Math.min(36, cameraZoom.current + e.deltaY * 0.02));
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [gl.domElement, cameraZoom]);

  useFrame(() => {
    // Smooth the zoom so it eases rather than snapping
    smoothedZoom.current = THREE.MathUtils.lerp(smoothedZoom.current, cameraZoom.current, 0.1);

    const dist = smoothedZoom.current;
    const az   = cameraAzimuth.current;
    const offset = new THREE.Vector3(
      Math.sin(az) * dist,
      dist * 0.58,
      Math.cos(az) * dist,
    );
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
      <sphereGeometry args={[0.055, 10, 8]} />
      <meshBasicMaterial color={isNight ? '#FFE840' : '#FFFFFF'} transparent />
    </instancedMesh>
  );
}

// ─── Scene lighting that responds to sky state ────────────────────────────────
function SceneLighting({ skyState }: { skyState: any }) {
  const sunRef  = useRef<THREE.DirectionalLight>(null);
  const fillRef = useRef<THREE.DirectionalLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);

  const isNight  = skyState?.phase === 'night' || skyState?.phase === 'dusk' || skyState?.phase === 'dawn';
  const isGolden = skyState?.phase === 'golden' || skyState?.phase === 'sunset';

  useFrame(() => {
    if (!skyState) return;
    const [sx, sy, sz] = sunPosFromAngles(skyState.sunAltitude, skyState.sunAzimuth, 60);
    const amb = skyState.ambientIntensity ?? 0.65;

    if (sunRef.current) {
      sunRef.current.position.set(sx, Math.max(sy, 1.5), sz);
      sunRef.current.intensity = Math.max(0.08, amb * 2.2);
      sunRef.current.color.set(skyState.sunColor ?? '#FFF5D0');
    }
    if (fillRef.current) {
      // Fill comes from the opposite-ish side — cool sky tone
      fillRef.current.position.set(-sx * 0.6, Math.max(sy * 0.7, 6), -sz * 0.6);
      fillRef.current.intensity = Math.max(0.02, amb * 0.5);
      fillRef.current.color.set(isNight ? '#3050C0' : isGolden ? '#FF9944' : '#BDE0FF');
    }
    if (hemiRef.current) {
      hemiRef.current.intensity = Math.max(0.15, amb * 0.75);
      (hemiRef.current as any).color.set(isNight ? '#1A2550' : isGolden ? '#FF8833' : '#7BBFDC');
      (hemiRef.current as any).groundColor.set(isNight ? '#0C0F18' : '#3D5A25');
    }
  });

  const initPos = sunPosFromAngles(skyState?.sunAltitude ?? 45, skyState?.sunAzimuth ?? 180, 60);
  const amb0    = skyState?.ambientIntensity ?? 0.65;

  return (
    <>
      {/* Hemisphere — sky above, earth below — richest ambient */}
      <hemisphereLight
        ref={hemiRef}
        args={[
          isNight ? '#1A2550' : '#7BBFDC',
          isNight ? '#0C0F18' : '#3D5A25',
          amb0 * 0.75,
        ]}
      />

      {/* Primary sun — main key light, casts crisp soft shadows */}
      <directionalLight
        ref={sunRef}
        position={initPos}
        intensity={Math.max(0.1, amb0 * 2.2)}
        color={skyState?.sunColor ?? '#FFF5D0'}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={90}
        shadow-camera-left={-55}
        shadow-camera-right={55}
        shadow-camera-top={55}
        shadow-camera-bottom={-55}
        shadow-bias={-0.0003}
        shadow-normalBias={0.02}
      />

      {/* Fill light — opposite side, no shadows, cool/warm tone */}
      <directionalLight
        ref={fillRef}
        position={[-15, 18, 10]}
        intensity={amb0 * 0.45}
        color={isNight ? '#3050C0' : '#BDE0FF'}
      />

      {/* Ground bounce light — subtle warm upfill */}
      <directionalLight
        position={[0, -10, 0]}
        intensity={isNight ? 0.03 : 0.1}
        color={isNight ? '#1A1A2A' : '#D0C898'}
      />

      {/* Sacred fire — central village glow, warm orange */}
      <pointLight
        position={[0, 1.8, 0]}
        intensity={isNight ? 4.0 : 1.2}
        color="#FF7020"
        distance={16}
        decay={2}
        castShadow={false}
      />

      {/* Village accent lights — give depth/warmth to each quadrant */}
      <pointLight position={[-9, 1.5, -5]}  intensity={isNight ? 1.5 : 0.18} color="#4488FF" distance={13} decay={2} />
      <pointLight position={[ 9, 1.5, -5]}  intensity={isNight ? 1.2 : 0.14} color="#8855FF" distance={13} decay={2} />
      <pointLight position={[-9, 1.5,  5]}  intensity={isNight ? 1.0 : 0.12} color="#44FFBB" distance={13} decay={2} />
      <pointLight position={[ 9, 1.5,  5]}  intensity={isNight ? 1.3 : 0.15} color="#FFB040" distance={13} decay={2} />

      {/* Night-only moon/backlight for dramatic rim lighting */}
      {isNight && (
        <directionalLight position={[-22, 28, -22]} intensity={0.4} color="#C8DCFF" />
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
  playerPos, playerRot, isMoving, remotePlayers, onEnterBuilding, skyState, spiritVariant,
  cameraZoom, cameraAzimuth, weather, nearBuildingId,
  avatarDivRef, spiritDivRef, onAvatarTap, onSpiritTap,
}: {
  playerPos: React.MutableRefObject<THREE.Vector3>;
  playerRot: React.MutableRefObject<number>;
  isMoving: React.MutableRefObject<boolean>;
  remotePlayers: RemotePlayer[];
  onEnterBuilding: (href: string, label: string) => void;
  skyState: any;
  spiritVariant: SpiritVariantId;
  cameraZoom: React.MutableRefObject<number>;
  cameraAzimuth: React.MutableRefObject<number>;
  weather?: { rain?: number; wind?: number; windAngle?: number };
  nearBuildingId: string | null;
  avatarDivRef: React.MutableRefObject<HTMLDivElement | null>;
  spiritDivRef: React.MutableRefObject<HTMLDivElement | null>;
  onAvatarTap: () => void;
  onSpiritTap: () => void;
}) {
  const isNight = skyState?.phase === 'night' || skyState?.phase === 'dusk' || skyState?.phase === 'dawn';
  const starsVisible = skyState?.phase === 'night' || skyState?.phase === 'dawn';
  const rainIntensity  = weather?.rain  ?? 0;
  const windStrength   = weather?.wind  ?? 0;
  const windAngle      = weather?.windAngle ?? 0;

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

      {/* Atmospheric fog — forest mist + rain visibility */}
      <fog attach="fog" args={[
        isNight ? '#0A1218' : (rainIntensity > 0.3 ? '#A8B8C8' : '#C8E4D0'),
        rainIntensity > 0.5 ? 14 : isNight ? 28 : 38,
        rainIntensity > 0.5 ? 40 : isNight ? 80 : 100,
      ]} />

      {/* Physics world — ground floor + building colliders */}
      <Physics gravity={[0, -9.81, 0]} colliders={false}>
        {/* Static ground plane */}
        <RigidBody type="fixed">
          <CuboidCollider args={[30, 0.1, 30]} position={[0, -0.1, 0]} />
        </RigidBody>

        {/* Building static colliders — exact bounds per location */}
        {LOCATIONS.map(loc => {
          const [bx, , bz] = loc.pos;
          const [bw, bh, bd] = loc.size;
          return (
            <RigidBody key={loc.id} type="fixed">
              <CuboidCollider args={[bw / 2 + 0.4, bh / 2, bd / 2 + 0.4]} position={[bx, bh / 2, bz]} />
            </RigidBody>
          );
        })}
      </Physics>

      {/* Ground */}
      <Ground isNight={isNight} />

      {/* River — animated flow + positional audio */}
      <River skyState={skyState} playerPos={playerPos} />

      {/* Sacred fire */}
      <SacredFire />

      {/* Fire ground glow only — Spirit companion follows the player now */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <circleGeometry args={[1.2, 32]} />
        <meshBasicMaterial color="#FF6020" transparent opacity={0.06} />
      </mesh>

      {/* Buildings */}
      {LOCATIONS.map(loc => (
        <Building key={loc.id} loc={loc} onEnter={onEnterBuilding} isNear={nearBuildingId === loc.id} />
      ))}

      {/* Tribal village forest — dense ring + interior trees */}
      <ForestRing windStrength={windStrength} isNight={isNight} />

      {/* Wind-animated grass */}
      <WindGrass windStrength={windStrength} isNight={isNight} />

      {/* Rain system — responds to weather */}
      <RainSystem intensity={rainIntensity} windAngle={windAngle} />

      {/* Wind-blown leaf/debris particles */}
      {windStrength > 0.2 && <WindParticles windStrength={windStrength} windAngle={windAngle} />}

      {/* Original baobab trees — inner village */}
      {[
        [-10, 0, -6], [-9, 0, -2], [-10, 0, 2], [-9, 0, 6],
        [10,  0, -6], [9,  0, -1], [10,  0, 3], [9,  0, 7],
      ].map((pos, i) => (
        <BaobabTree key={i} pos={pos as [number,number,number]} scale={0.7 + Math.sin(i*1.4)*0.2} />
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

      {/* Local player — tap to open crescent menu */}
      <group onPointerUp={e => { e.stopPropagation(); onAvatarTap(); }}>
        <PlayerCharacter
          position={playerPos.current}
          rotation={playerRot.current}
          posRef={playerPos}
          rotRef={playerRot}
          skinColor="#8D5524"
          isLocal={true}
          isMovingRef={isMoving}
        />
      </group>

      {/* Spirit companion — smaller, floats behind player, glows */}
      <SpiritCompanion playerPos={playerPos} spiritVariant={spiritVariant} onTap={onSpiritTap} />

      {/* Camera follow */}
      <CameraFollow targetPos={playerPos} cameraZoom={cameraZoom} cameraAzimuth={cameraAzimuth} />

      {/* HUDBridge — projects screen positions for DOM overlays */}
      <HUDBridge playerPos={playerPos} avatarDivRef={avatarDivRef} spiritDivRef={spiritDivRef} />

      {/* Fireflies */}
      <Fireflies count={isNight ? 35 : 12} isNight={isNight} />
    </>
  );
}

// ─── Virtual joystick (mobile) ────────────────────────────────────────────────
// ─── Spirit companion — small, follows player, luminescent glow ───────────────
function SpiritCompanion({
  playerPos, spiritVariant, onTap,
}: {
  playerPos: React.MutableRefObject<THREE.Vector3>;
  spiritVariant: SpiritVariantId;
  onTap: () => void;
}) {
  const groupRef  = useRef<THREE.Group>(null);
  const glowRef   = useRef<THREE.Mesh>(null);
  const floatPhase = useRef(Math.random() * Math.PI * 2);

  useFrame(state => {
    if (!groupRef.current) return;
    const t   = state.clock.elapsedTime;
    const ph  = floatPhase.current;

    // Float lazily behind player
    const targetX = playerPos.current.x - Math.sin(playerPos.current.x * 0.05 + t * 0.3) * 1.5;
    const targetZ = playerPos.current.z + 2.2;
    const targetY = 1.8 + Math.sin(t * 0.9 + ph) * 0.18;

    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 0.04);
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.06);
    groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetZ, 0.04);
    groupRef.current.rotation.y = t * 0.4;

    // Pulse the glow
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.15 + Math.sin(t * 1.6 + ph) * 0.08;
      glowRef.current.scale.setScalar(1 + Math.sin(t * 1.2) * 0.06);
    }
  });

  return (
    <group
      ref={groupRef}
      position={[playerPos.current.x, 1.8, playerPos.current.z + 2.2]}
      onPointerUp={e => { e.stopPropagation(); onTap(); }}
    >
      {/* Outer luminescent glow sphere */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.55, 24, 18]} />
        <meshBasicMaterial color="#60A5FA" transparent opacity={0.15} />
      </mesh>
      {/* Mid glow ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.45, 0.06, 10, 32]} />
        <meshBasicMaterial color="#7C3AED" transparent opacity={0.35} />
      </mesh>
      {/* Spirit figure — scaled down to 0.55 */}
      <group scale={0.55}>
        <SpiritFigure variant={spiritVariant} scale={1} index={0} />
      </group>
    </group>
  );
}

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
// ─── Side Drawer — slides in from right, swipe-right to close ────────────────
function SideDrawer({
  href, title, isNight, onClose, onFullPage,
}: {
  href: string;
  title: string;
  isNight: boolean;
  onClose: () => void;
  onFullPage: () => void;
}) {
  const touchStartX = useRef(0);
  const [dragX, setDragX] = useState(0);
  const dragging = useRef(false);

  const glassBg   = isNight ? 'rgba(6,8,18,0.90)' : 'rgba(240,244,255,0.90)';
  const glassEdge = isNight ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)';
  const headerBg  = isNight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.45)';
  const textColor = isNight ? '#F0EBE0' : '#1E1B4B';
  const mutedCol  = isNight ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)';

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    dragging.current = true;
  }
  function onTouchMove(e: React.TouchEvent) {
    if (!dragging.current) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    if (dx > 0) setDragX(Math.min(dx, 220));
  }
  function onTouchEnd(e: React.TouchEvent) {
    dragging.current = false;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx > 90) { onClose(); }
    else { setDragX(0); }
  }

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex justify-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onClose}
    >
      {/* Backdrop — semi-transparent so 3D world is faintly visible */}
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }} />

      {/* Drawer panel */}
      <motion.div
        className="relative flex flex-col h-full"
        style={{ width: 'min(88vw, 480px)', willChange: 'transform' }}
        initial={{ x: '100%' }}
        animate={{ x: dragX }}
        exit={{ x: '100%' }}
        transition={dragging.current
          ? { duration: 0 }
          : { type: 'spring', damping: 26, stiffness: 240 }}
        onClick={e => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Glass panel */}
        <div className="flex flex-col h-full" style={{ background: glassBg, backdropFilter: 'blur(28px) saturate(160%)', borderLeft: `1px solid ${glassEdge}` }}>
          {/* Swipe handle hint */}
          <div style={{ position: 'absolute', left: -5, top: '50%', transform: 'translateY(-50%)', width: 4, height: 48, borderRadius: 2, background: mutedCol }} />

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
            style={{ background: headerBg, borderBottom: `1px solid ${glassEdge}`, backdropFilter: 'blur(8px)' }}>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 transition-all active:scale-90"
              style={{ background: mutedCol, color: textColor, border: 'none', cursor: 'pointer' }}
            >
              ×
            </button>
            <span className="flex-1 font-black text-sm truncate" style={{ color: textColor }}>{title}</span>
            <button
              onClick={onFullPage}
              className="text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0 transition-all active:scale-95"
              style={{ background: 'rgba(24,119,242,0.14)', color: '#1877F2', border: '1px solid rgba(24,119,242,0.25)', cursor: 'pointer' }}
            >
              Full ↗
            </button>
          </div>

          {/* Content iframe */}
          <iframe
            src={href}
            className="flex-1 border-none"
            style={{ width: '100%', background: 'transparent' }}
            title={title}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function VillageWorld3D({ onNavigate }: { onNavigate?: (href: string, label: string) => void }) {
  const router       = useRouter();
  const supabase     = createClient();
  const { toggleVoice, voiceEnabled } = useSpiritVoice();
  const { mood } = useWeather();
  const { skyState } = useSkySystem();

  // Day/night for UI styling — menus and drawer adapt to sky phase
  const isNightUI = skyState?.phase === 'night' || skyState?.phase === 'dusk' || skyState?.phase === 'dawn';

  // ── Side drawer ────────────────────────────────────────────────────────────
  const [drawer, setDrawer] = useState<{ href: string; title: string } | null>(null);

  // Derive weather from mood palette
  const weatherData = useMemo(() => {
    const isRainy  = mood === 'stormy' || mood === 'rainy';
    const isWindy  = mood === 'stormy' || mood === 'windy';
    return {
      rain:      isRainy ? (mood === 'stormy' ? 0.9 : 0.55) : 0,
      wind:      isWindy ? (mood === 'stormy' ? 0.85 : 0.45) : (mood === 'breezy' ? 0.2 : 0.05),
      windAngle: Math.random() * Math.PI * 2,  // stable per session
    };
  }, [mood]);

  const [spiritVariant, setSpiritVariant] = useState<SpiritVariantId>('blue');
  const playerPos    = useRef(new THREE.Vector3(0, 0, 9));
  const playerRot    = useRef(0);
  const moveInput    = useRef({ dx: 0, dy: 0 });
  const isMoving     = useRef(false);
  const keys         = useRef<Set<string>>(new Set());
  const cameraZoom   = useRef(14);
  const cameraAzimuth = useRef(0);
  const gestureRef   = useRef({ lastDist: 0, lastMidX: 0, active: false });

  const [remotePlayers, setRemotePlayers]   = useState<RemotePlayer[]>([]);
  const [nearBuilding, setNearBuilding]     = useState<{ id: string; href: string; label: string } | null>(null);
  const [enterPrompt, setEnterPrompt]       = useState(false);
  const nearBuildingRef = useRef<{ id: string; href: string; label: string } | null>(null);

  // ── Avatar crescent menu ──────────────────────────────────────────────────
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const avatarDivRef = useRef<HTMLDivElement | null>(null);

  // ── Spirit companion menu ─────────────────────────────────────────────────
  const [spiritMenuOpen, setSpiritMenuOpen] = useState(false);
  const spiritDivRef = useRef<HTMLDivElement | null>(null);

  // ── Map overlay (triggered from avatar menu) ──────────────────────────────
  const [showMapOverlay, setShowMapOverlay] = useState(false);

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
    const down = (e: KeyboardEvent) => {
      keys.current.add(e.key);
      // Spacebar enters nearby building (desktop shortcut)
      if (e.key === ' ' && nearBuildingRef.current) {
        e.preventDefault();
        handleEnterBuilding(nearBuildingRef.current.href, nearBuildingRef.current.label);
      }
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  // ── Movement loop ─────────────────────────────────────────────────────────
  useEffect(() => {
    const SPEED = 0.13;

    const loop = setInterval(() => {
      let dx = moveInput.current.dx;
      let dz = moveInput.current.dy;

      if (keys.current.has('w') || keys.current.has('ArrowUp'))    dz = -1;
      if (keys.current.has('s') || keys.current.has('ArrowDown'))  dz =  1;
      if (keys.current.has('a') || keys.current.has('ArrowLeft'))  dx = -1;
      if (keys.current.has('d') || keys.current.has('ArrowRight')) dx =  1;

      isMoving.current = dx !== 0 || dz !== 0;

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
        if (nx < -38) blocked = true;
        if (Math.abs(nx) > 40 || Math.abs(nz) > 38) blocked = true;

        if (!blocked) {
          playerPos.current.set(nx, 0, nz);
          playerRot.current = Math.atan2(dx, dz);
        }

        let nearest: { id: string; href: string; label: string; dist: number } | null = null;
        for (const loc of LOCATIONS) {
          const [bx,,bz] = loc.pos;
          const dist = Math.sqrt((playerPos.current.x-bx)**2 + (playerPos.current.z-bz)**2);
          if (dist < 8.5 && (!nearest || dist < nearest.dist)) {
            nearest = { id: loc.id, href: loc.href, label: loc.label, dist };
          }
        }
        nearBuildingRef.current = nearest;
        setNearBuilding(nearest);
        setEnterPrompt(!!nearest);
      } else {
        nearBuildingRef.current = null;
        setNearBuilding(null);
        setEnterPrompt(false);
      }
    }, 16);

    return () => clearInterval(loop);
  }, []);

  // Single-focus: close everything before opening anything new
  function openDrawer(href: string, title: string) {
    setShowMapOverlay(false);
    setAvatarMenuOpen(false);
    setSpiritMenuOpen(false);
    setDrawer({ href, title });
  }

  function handleEnterBuilding(href: string, label: string) {
    VillageSound.tap();
    openDrawer(href, label);
  }

  const handleAvatarMenuAction = useCallback((id: MenuId, href: string | null) => {
    setAvatarMenuOpen(false);
    VillageSound.tap();
    if (id === 'map') {
      setDrawer(null); // close any open drawer first
      setShowMapOverlay(true);
      return;
    }
    if (href) openDrawer(href, MENU_ITEMS.find(m => m.id === id)?.label ?? '');
  }, []);

  const SPIRIT_ITEMS = [
    { id: 'spirit-chat', label: 'Talk to Spirit',     href: '/village/spirit',           svg: 'M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z' },
    { id: 'spirit-mute', label: voiceEnabled ? 'Mute' : 'Unmute', href: null,            svg: voiceEnabled ? 'M16.5 12A4.5 4.5 0 0014 7.97v1.79l2.48 2.48c.01-.08.02-.16.02-.24zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06A8.99 8.99 0 0011.07 19H11v-4.73L6.27 9H3V7.97c0 .01 0 .01 0 0L4.27 3zM12 4L9.91 6.09 12 8.18V4z' : 'M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z' },
    { id: 'spirit-gear', label: 'Spirit Settings',   href: '/village/spirit/settings',   svg: 'M12 15.5A3.5 3.5 0 018.5 12 3.5 3.5 0 0112 8.5a3.5 3.5 0 013.5 3.5 3.5 3.5 0 01-3.5 3.5m7.43-2.92c.04-.36.07-.73.07-1.08s-.03-.73-.07-1.08l2.32-1.82c.21-.16.27-.46.13-.7l-2.2-3.82c-.13-.25-.42-.33-.67-.25l-2.74 1.1c-.57-.44-1.18-.8-1.85-1.08l-.4-2.91C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.4 2.91c-.67.28-1.28.64-1.85 1.08L4.52 5.3c-.25-.09-.54 0-.67.25L1.65 9.36c-.14.25-.08.54.13.7l2.32 1.82c-.04.35-.07.72-.07 1.08s.03.73.07 1.08L1.78 16.08c-.21.16-.27.46-.13.7l2.2 3.82c.13.25.42.33.67.25l2.74-1.1c.57.44 1.18.8 1.85 1.08l.4 2.91c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.4-2.91c.67-.28 1.28-.64 1.85-1.08l2.74 1.1c.25.09.54 0 .67-.25l2.2-3.82c.14-.25.08-.54-.13-.7l-2.32-1.82z' },
  ] as const;

  function handleTwoFingerStart(e: React.TouchEvent) {
    if (e.touches.length !== 2) return;
    const t0 = e.touches[0], t1 = e.touches[1];
    const dx = t0.clientX - t1.clientX;
    const dy = t0.clientY - t1.clientY;
    gestureRef.current.lastDist = Math.sqrt(dx * dx + dy * dy);
    gestureRef.current.lastMidX = (t0.clientX + t1.clientX) / 2;
    gestureRef.current.active   = true;
  }

  function handleTwoFingerMove(e: React.TouchEvent) {
    if (e.touches.length !== 2 || !gestureRef.current.active) return;
    const t0 = e.touches[0], t1 = e.touches[1];
    const dx   = t0.clientX - t1.clientX;
    const dy   = t0.clientY - t1.clientY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const midX = (t0.clientX + t1.clientX) / 2;

    // Pinch → zoom: fingers together = zoom in (smaller distance), spread = zoom out
    // distDelta > 0 means fingers got closer → camera should come closer (decrease zoom)
    const distDelta = gestureRef.current.lastDist - dist;
    cameraZoom.current = Math.max(6, Math.min(36, cameraZoom.current - distDelta * 0.07));

    // Horizontal two-finger drag → orbit camera around player
    const midDelta = midX - gestureRef.current.lastMidX;
    cameraAzimuth.current += midDelta * 0.006;

    gestureRef.current.lastDist = dist;
    gestureRef.current.lastMidX = midX;
  }

  function handleTwoFingerEnd() {
    gestureRef.current.active = false;
  }

  // Sky background color transitions with the sky state
  const isNight = skyState?.phase === 'night' || skyState?.phase === 'dusk' || skyState?.phase === 'dawn';
  const bgColor = skyState?.skyTop ?? (isNight ? '#080912' : '#6AAEDC');

  return (
    <div
      className="w-full h-full relative"
      style={{ touchAction: 'none' }}
      onTouchStart={handleTwoFingerStart}
      onTouchMove={handleTwoFingerMove}
      onTouchEnd={handleTwoFingerEnd}
    >
      {/* ── 3D Canvas ──────────────────────────────────────────────── */}
      <Canvas
        shadows={{ type: THREE.PCFSoftShadowMap }}
        gl={{
          antialias: false,
          powerPreference: 'high-performance',
          pixelRatio: Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 1.5),
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
        }}
        style={{ background: bgColor, transition: 'background 4s ease' }}
        performance={{ min: 0.5 }}
        camera={{ position: [0, 8, 12], fov: 58, near: 0.1, far: 200 }}
      >
        <WorldScene
          playerPos={playerPos}
          playerRot={playerRot}
          isMoving={isMoving}
          remotePlayers={remotePlayers}
          onEnterBuilding={handleEnterBuilding}
          skyState={skyState}
          spiritVariant={spiritVariant}
          cameraZoom={cameraZoom}
          cameraAzimuth={cameraAzimuth}
          weather={weatherData}
          nearBuildingId={nearBuilding?.id ?? null}
          avatarDivRef={avatarDivRef}
          spiritDivRef={spiritDivRef}
          onAvatarTap={() => { setAvatarMenuOpen(m => !m); setSpiritMenuOpen(false); }}
          onSpiritTap={() => { setSpiritMenuOpen(m => !m); setAvatarMenuOpen(false); }}
        />
      </Canvas>

      {/* ── Avatar crescent menu — positioned over avatar head ─────── */}
      <div
        ref={avatarDivRef}
        style={{ position: 'absolute', pointerEvents: 'none', transform: 'translate(-50%, -50%)' }}
      >
        <AnimatePresence>
          {avatarMenuOpen && MENU_ITEMS.map((item, i) => {
            const cp = CRESCENT_POSITIONS[i];
            // Day/night responsive colors
            const btnBg  = isNightUI ? 'rgba(8,10,22,0.94)' : 'rgba(240,244,255,0.94)';
            const btnBdr = isNightUI ? 'rgba(255,255,255,0.18)' : 'rgba(30,27,75,0.18)';
            const iconFill = isNightUI ? 'rgba(255,255,255,0.92)' : 'rgba(30,27,75,0.88)';
            return (
              <motion.button
                key={item.id}
                initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                animate={{ x: cp.x, y: cp.y, scale: 1, opacity: 1 }}
                exit={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                whileHover={{ scale: 1.22 }}
                whileTap={{ scale: 0.90 }}
                transition={{ type: 'spring', stiffness: 480, damping: 28, delay: i * 0.045 }}
                style={{
                  position: 'absolute',
                  pointerEvents: 'all',
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: btnBg,
                  border: `1.5px solid ${btnBdr}`,
                  backdropFilter: 'blur(20px)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: 'translate(-50%,-50%)',
                  boxShadow: isNightUI ? '0 4px 24px rgba(0,0,0,0.7)' : '0 4px 20px rgba(0,0,0,0.25)',
                }}
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(8);
                  handleAvatarMenuAction(item.id as MenuId, item.href as string | null);
                }}
                onPointerEnter={() => { if (navigator.vibrate) navigator.vibrate(4); }}
                title={item.label}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill={iconFill} xmlns="http://www.w3.org/2000/svg">
                  <path d={item.svg} />
                </svg>
              </motion.button>
            );
          })}
        </AnimatePresence>
        {/* Tap-target ring on the avatar — invisible but clickable */}
        <button
          style={{
            position: 'absolute',
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'all',
          }}
          onClick={() => { setAvatarMenuOpen(m => !m); setSpiritMenuOpen(false); }}
        />
      </div>

      {/* ── Spirit companion menu — 3 items above Spirit ───────────── */}
      <div
        ref={spiritDivRef}
        style={{ position: 'absolute', pointerEvents: 'none', transform: 'translate(-50%, -50%)' }}
      >
        <AnimatePresence>
          {spiritMenuOpen && SPIRIT_ITEMS.map((item, i) => {
            const angles = [135, 90, 45];
            const a = (angles[i] * Math.PI) / 180;
            const r = 60;
            const sx = Math.cos(a) * r;
            const sy = -Math.sin(a) * r;
            return (
              <motion.button
                key={item.id}
                initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                animate={{ x: sx, y: sy, scale: 1, opacity: 1 }}
                exit={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 500, damping: 28, delay: i * 0.06 }}
                style={{
                  position: 'absolute',
                  pointerEvents: 'all',
                  width: 42,
                  height: 42,
                  borderRadius: '50%',
                  background: isNightUI ? 'rgba(8,10,22,0.94)' : 'rgba(240,244,255,0.94)',
                  border: `1.5px solid ${isNightUI ? 'rgba(167,139,250,0.4)' : 'rgba(124,58,237,0.3)'}`,
                  backdropFilter: 'blur(16px)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: 'translate(-50%,-50%)',
                  boxShadow: '0 0 20px rgba(124,58,237,0.5)',
                }}
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(8);
                  setSpiritMenuOpen(false);
                  VillageSound.tap();
                  if (item.id === 'spirit-mute') { toggleVoice(); return; }
                  if (item.href) setDrawer({ href: item.href, title: item.label });
                }}
                onPointerEnter={() => { if (navigator.vibrate) navigator.vibrate(4); }}
                title={item.label}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill={isNightUI ? 'rgba(167,139,250,0.95)' : 'rgba(124,58,237,0.9)'} xmlns="http://www.w3.org/2000/svg">
                  <path d={item.svg} />
                </svg>
              </motion.button>
            );
          })}
        </AnimatePresence>
        {/* Tap-target on Spirit */}
        <button
          style={{
            position: 'absolute',
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'all',
          }}
          onClick={() => { setSpiritMenuOpen(m => !m); setAvatarMenuOpen(false); }}
        />
      </div>

      {/* ── Village Map overlay — triggered from avatar menu ─────────── */}
      <AnimatePresence>
        {showMapOverlay && (
          <motion.div
            key="map-overlay"
            initial={{ scale: 0.15, opacity: 0, y: '40%' }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.1, opacity: 0, y: '50%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="fixed inset-0 z-50 flex flex-col"
            style={{ background: '#0a0e1a', transformOrigin: 'center 80%' }}
          >
            <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
              style={{ background: 'rgba(0,0,0,0.6)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <button
                onClick={() => setShowMapOverlay(false)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-xl"
                style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}
              >
                ←
              </button>
              <span className="text-white font-black text-base flex-1">🗺️ Village Map</span>
            </div>
            <div className="flex-1 relative">
              <VillageMap3DOverlay />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Virtual joystick (mobile) ──────────────────────────────── */}
      <VirtualJoystick onMove={(dx, dy) => { moveInput.current = { dx, dy }; }} />

      {/* ── Enter building prompt ──────────────────────────────────── */}
      {enterPrompt && nearBuilding && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-10">
          <motion.button
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            onClick={() => handleEnterBuilding(nearBuilding.href, nearBuilding.label)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-white"
            style={{ background: 'linear-gradient(135deg,#1877F2,#7C3AED)', boxShadow: '0 0 30px rgba(24,119,242,0.5)' }}>
            <span>↑</span> Enter {nearBuilding.label}
            <span className="hidden sm:inline text-xs font-normal opacity-60 ml-1">[Space]</span>
          </motion.button>
        </div>
      )}

      {/* ── Sky phase indicator ────────────────────────────────────── */}
      {skyState && (
        <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-full text-xs font-semibold capitalize"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', color: skyState.sunColor, border: `1px solid ${skyState.sunColor}30` }}>
          {skyState.phase} · {skyState.sunAltitude > 0 ? `☀ ${skyState.sunAltitude.toFixed(0)}°` : '🌙'}
        </div>
      )}

      {/* ── Online players count ───────────────────────────────────── */}
      {remotePlayers.length > 0 && (
        <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', color: '#4ADE80' }}>
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          {remotePlayers.length + 1} online
        </div>
      )}

      {/* ── Controls hint ─────────────────────────────────────────── */}
      <div className="absolute bottom-6 right-4 z-10 text-xs rounded-full px-3 py-1.5"
        style={{ background: 'rgba(0,0,0,0.4)', color: 'rgba(255,255,255,0.5)' }}>
        <span className="hidden sm:inline">WASD · Scroll zoom · Tap avatar for menu</span>
        <span className="sm:hidden">Joystick · Pinch zoom · Tap avatar</span>
      </div>

      {/* ── Slide-in Drawer ──────────────────────────────────────── */}
      <AnimatePresence>
        {drawer && (
          <SideDrawer
            key={drawer.href}
            href={drawer.href}
            title={drawer.title}
            isNight={isNightUI}
            onClose={() => setDrawer(null)}
            onFullPage={() => { router.push(drawer.href); setDrawer(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
