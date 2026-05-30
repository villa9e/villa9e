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
  // Directional flow (scrolls in +X direction)
  vec2 flowUv = vec2(vUv.x - uTime * 0.12, vUv.y);
  vec2 flowUv2 = vec2(vUv.x - uTime * 0.09, vUv.y + uTime * 0.06);

  float ripple1 = sin(flowUv.x * 14.0) * sin(flowUv.y * 10.0) * 0.5 + 0.5;
  float ripple2 = sin(flowUv2.x * 9.0 + 1.2) * sin(flowUv2.y * 12.0 - 0.8) * 0.5 + 0.5;
  float ripple3 = sin((flowUv.x + flowUv.y) * 7.0) * 0.5 + 0.5;
  float pattern = (ripple1 * 0.4 + ripple2 * 0.35 + ripple3 * 0.25);

  // Depth: center of tile is deeper (darker), edges lighter
  float edgeDist = 2.0 * length(vUv - 0.5);
  float depth    = 1.0 - smoothstep(0.0, 1.0, edgeDist);

  // Volume illusion: deep center dark, shallow edges light + animated ripple
  vec3 color = mix(uColorShallow, uColorDeep, depth * 0.7);
  color      = mix(color, uColorShallow, pattern * 0.35);

  // Surface specular (white glints)
  float spec = pow(max(ripple1 * ripple2, 0.0), 6.0) * 0.55;
  color     += vec3(spec * 0.9, spec, spec);

  // Shore foam at edges
  float foam = smoothstep(0.75, 0.95, edgeDist) * 0.5;
  foam      += smoothstep(0.04, 0.07, vElevation) * 0.35;
  color      = mix(color, vec3(0.95, 0.98, 1.0), foam);

  // Caustic-like shimmer
  float caustic = sin(flowUv.x * 22.0 + uTime * 2.0) * sin(flowUv.y * 18.0 - uTime * 1.5) * 0.5 + 0.5;
  color        += vec3(caustic * 0.05 * depth);

  gl_FragColor = vec4(color, uOpacity * (0.85 + depth * 0.1));
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
    ocean:     { deep: '#0A3A6E', shallow: '#1A9EC0', waveH: 0.12, waveS: 0.5, opacity: 0.88, segs: 40 },
    river:     { deep: '#1565C0', shallow: '#42A5F5', waveH: 0.06, waveS: 0.9, opacity: 0.82, segs: 28 },
    waterfall: { deep: '#0D47A1', shallow: '#64B5F6', waveH: 0.15, waveS: 1.6, opacity: 0.75, segs: 24 },
    tile:      { deep: '#0D47A1', shallow: '#29B6F6', waveH: 0.06, waveS: 0.7, opacity: 0.88, segs: 24 },
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
