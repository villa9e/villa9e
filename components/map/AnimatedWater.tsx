'use client';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─── Animated water shader ────────────────────────────────────────────────────
const WATER_VERT = `
uniform float uTime;
uniform float uWaveHeight;
uniform float uWaveSpeed;
varying vec2 vUv;
varying float vElevation;

float wave(vec2 pos, float freq, float speed, float offset) {
  return sin(pos.x * freq + uTime * speed + offset) *
         cos(pos.y * freq * 0.8 + uTime * speed * 0.9 + offset * 1.3);
}

void main() {
  vUv = uv;
  vec3 pos = position;
  float elevation = 0.0;
  elevation += wave(pos.xz, 0.8, uWaveSpeed, 0.0) * uWaveHeight;
  elevation += wave(pos.xz, 1.6, uWaveSpeed * 1.4, 2.1) * uWaveHeight * 0.5;
  elevation += wave(pos.xz, 3.2, uWaveSpeed * 0.7, 4.5) * uWaveHeight * 0.25;
  pos.y += elevation;
  vElevation = elevation;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const WATER_FRAG = `
uniform float uTime;
uniform vec3 uColorDeep;
uniform vec3 uColorShallow;
uniform float uOpacity;
varying vec2 vUv;
varying float vElevation;

void main() {
  float ripple1 = sin(vUv.x * 12.0 - uTime * 1.2) * 0.5 + 0.5;
  float ripple2 = sin(vUv.y * 10.0 + uTime * 0.9) * 0.5 + 0.5;
  float ripple3 = sin((vUv.x + vUv.y) * 8.0 - uTime * 1.6) * 0.5 + 0.5;
  float pattern = (ripple1 + ripple2 + ripple3) / 3.0;

  float depth = (vElevation + 0.05) * 10.0;
  depth = clamp(depth, 0.0, 1.0);

  vec3 color = mix(uColorDeep, uColorShallow, pattern * 0.5 + depth * 0.3);

  // Specular highlight
  float spec = pow(pattern * ripple3, 4.0) * 0.4;
  color += vec3(spec);

  // Foam at high points
  float foam = smoothstep(0.04, 0.06, vElevation);
  color = mix(color, vec3(1.0), foam * 0.3);

  gl_FragColor = vec4(color, uOpacity);
}
`;

interface AnimatedWaterProps {
  position?: [number, number, number];
  size?: [number, number];
  type?: 'ocean' | 'river' | 'tile' | 'waterfall';
  color?: string;
}

export function AnimatedWaterPlane({
  position = [0, 0, 0],
  size = [10, 10],
  type = 'tile',
  color,
}: AnimatedWaterProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const PRESETS = {
    ocean:     { deep: '#0A3A6E', shallow: '#1A9EC0', waveH: 0.08, waveS: 0.5, opacity: 0.82, segs: 32 },
    river:     { deep: '#1565C0', shallow: '#42A5F5', waveH: 0.04, waveS: 0.8, opacity: 0.75, segs: 24 },
    waterfall: { deep: '#0D47A1', shallow: '#64B5F6', waveH: 0.12, waveS: 1.4, opacity: 0.70, segs: 20 },
    tile:      { deep: '#1565C0', shallow: '#29B6F6', waveH: 0.04, waveS: 0.6, opacity: 0.80, segs: 16 },
  };
  const p = PRESETS[type];

  const uniforms = useMemo(() => ({
    uTime:         { value: 0 },
    uWaveHeight:   { value: p.waveH },
    uWaveSpeed:    { value: p.waveS },
    uColorDeep:    { value: new THREE.Color(p.deep) },
    uColorShallow: { value: new THREE.Color(p.shallow) },
    uOpacity:      { value: p.opacity },
  }), [type]);

  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader:   WATER_VERT,
    fragmentShader: WATER_FRAG,
    uniforms,
    transparent: true,
    side: THREE.FrontSide,
    depthWrite: false,
  }), [uniforms]);

  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.elapsedTime;
  });

  return (
    <mesh ref={meshRef} position={position} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[size[0], size[1], p.segs, p.segs]} />
      <primitive object={material} />
    </mesh>
  );
}

// ─── River segment — flows along a path ────────────────────────────────────────
const RIVER_FRAG = `
uniform float uTime;
uniform vec3 uColorDeep;
uniform vec3 uColorShallow;
uniform float uOpacity;
varying vec2 vUv;

void main() {
  float flow = fract(vUv.y - uTime * 0.4);
  float ripple = sin(vUv.x * 20.0) * 0.5 + 0.5;
  float foam = smoothstep(0.9, 1.0, ripple) * smoothstep(0.05, 0.0, vUv.x) + smoothstep(0.9, 1.0, ripple) * smoothstep(0.95, 1.0, vUv.x);
  float depth = sin(vUv.x * 3.14159) * 0.8 + 0.2;
  vec3 color = mix(uColorDeep, uColorShallow, flow * 0.3 + ripple * 0.2 + depth * 0.3);
  color += vec3(foam * 0.4);
  gl_FragColor = vec4(color, uOpacity);
}
`;

export function RiverSegment({
  from, to, width = 2,
}: { from: THREE.Vector3; to: THREE.Vector3; width?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const dir   = new THREE.Vector3().subVectors(to, from);
  const len   = dir.length();
  const mid   = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);
  const angle = Math.atan2(dir.x, dir.z);

  const uniforms = useMemo(() => ({
    uTime:         { value: 0 },
    uColorDeep:    { value: new THREE.Color('#1565C0') },
    uColorShallow: { value: new THREE.Color('#42A5F5') },
    uOpacity:      { value: 0.80 },
  }), []);

  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader:   'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: RIVER_FRAG,
    uniforms,
    transparent: true,
    depthWrite: false,
  }), []);

  useFrame(({ clock }) => { uniforms.uTime.value = clock.elapsedTime; });

  return (
    <mesh ref={meshRef} position={[mid.x, mid.y + 0.03, mid.z]} rotation={[-Math.PI/2, 0, angle]} receiveShadow>
      <planeGeometry args={[width, len, 4, 16]} />
      <primitive object={mat} />
    </mesh>
  );
}

// ─── Waterfall plane — vertical cascading water ───────────────────────────────
const FALL_VERT = `
uniform float uTime;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec3 pos = position;
  pos.x += sin(vUv.y * 8.0 + uTime * 2.0) * 0.04;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;
const FALL_FRAG = `
uniform float uTime;
varying vec2 vUv;
void main() {
  float fall = fract(vUv.y + uTime * 0.8);
  float streak = sin(vUv.x * 30.0) * 0.5 + 0.5;
  float alpha = mix(0.4, 0.75, streak) * smoothstep(0.0, 0.1, fall) * smoothstep(1.0, 0.8, fall);
  vec3 color = mix(vec3(0.3, 0.7, 0.95), vec3(0.8, 0.92, 1.0), streak);
  gl_FragColor = vec4(color, alpha);
}
`;

export function WaterfallPlane({
  position = [0, 2, 0],
  size = [4, 4],
}: { position?: [number, number, number]; size?: [number, number] }) {
  const ref = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: FALL_VERT, fragmentShader: FALL_FRAG,
    uniforms, transparent: true, depthWrite: false, side: THREE.DoubleSide,
  }), []);
  useFrame(({ clock }) => { uniforms.uTime.value = clock.elapsedTime; });
  return (
    <mesh ref={ref} position={position}>
      <planeGeometry args={[size[0], size[1], 8, 24]} />
      <primitive object={mat} />
      {/* Mist at base */}
      <mesh position={[0, -size[1]/2, 0.1]}>
        <planeGeometry args={[size[0] * 1.5, size[1] * 0.3, 4, 4]} />
        <meshBasicMaterial color="#A0D0FF" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>
    </mesh>
  );
}
