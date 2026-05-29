'use client';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─── Module-level 2-step toon gradient map ────────────────────────────────────
// Creates the flat cartoon shading style (shadow + bright, hard edge between)
// Initialized lazily on first component mount, shared across all instances
let _gradMap: THREE.DataTexture | null = null;
function getGradMap(): THREE.DataTexture {
  if (!_gradMap) {
    const data = new Uint8Array([90, 255]);           // shadow | bright
    _gradMap = new THREE.DataTexture(data, 2, 1, THREE.RedFormat);
    _gradMap.magFilter = THREE.NearestFilter;
    _gradMap.minFilter = THREE.NearestFilter;
    _gradMap.needsUpdate = true;
  }
  return _gradMap;
}

// Backface outline material — shared, always black
let _outlineMat: THREE.MeshBasicMaterial | null = null;
function getOutlineMat(): THREE.MeshBasicMaterial {
  if (!_outlineMat) {
    _outlineMat = new THREE.MeshBasicMaterial({ color: '#0A0500', side: THREE.BackSide });
  }
  return _outlineMat;
}

// ─── Outlined mesh — renders BackSide first (outline), then fill ──────────────
// This creates an ink outline effect identical to the cartoon references
function OL({
  children, scale = 1.062,
}: {
  children: React.ReactNode;
  scale?: number;
}) {
  return (
    <group>
      {/* Outline layer — BackSide renders the outline color behind the fill */}
      <group scale={scale}>
        {children}
        {/* Override material to outline */}
        <primitive object={getOutlineMat()} attach="material" />
      </group>
      {/* Fill layer */}
      {children}
    </group>
  );
}

// Simpler approach: explicit outline + fill meshes for key shapes
function OutlinedSphere({
  args, color, gradMap, oScale = 1.065,
}: {
  args: [number, number, number];
  color: string;
  gradMap: THREE.DataTexture;
  oScale?: number;
}) {
  return (
    <group>
      <mesh scale={oScale}>
        <sphereGeometry args={args} />
        <primitive object={getOutlineMat()} attach="material" />
      </mesh>
      <mesh>
        <sphereGeometry args={args} />
        <meshToonMaterial color={color} gradientMap={gradMap} />
      </mesh>
    </group>
  );
}

function OutlinedCapsule({
  args, color, gradMap, oScale = 1.065,
}: {
  args: [number, number, number, number];
  color: string;
  gradMap: THREE.DataTexture;
  oScale?: number;
}) {
  return (
    <group>
      <mesh scale={oScale}>
        <capsuleGeometry args={args} />
        <primitive object={getOutlineMat()} attach="material" />
      </mesh>
      <mesh>
        <capsuleGeometry args={args} />
        <meshToonMaterial color={color} gradientMap={gradMap} />
      </mesh>
    </group>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
export interface PlayerCharacterProps {
  position:     THREE.Vector3;
  rotation?:    number;
  posRef?:      React.MutableRefObject<THREE.Vector3>;
  rotRef?:      React.MutableRefObject<number>;
  skinColor?:   string;
  hairColor?:   string;
  shirtColor?:  string;
  isLocal?:     boolean;
  username?:    string;
  isMovingRef?: React.MutableRefObject<boolean>;
}

// Derive shadow tone of a color (slightly darker)
function shadowOf(hex: string): string {
  const c = new THREE.Color(hex);
  c.multiplyScalar(0.72);
  return `#${c.getHexString()}`;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function PlayerCharacter({
  position, rotation = 0,
  posRef, rotRef,
  skinColor  = '#C88550',
  hairColor  = '#0C0700',
  shirtColor = '#2563EB',
  isLocal    = false,
  isMovingRef,
}: PlayerCharacterProps) {

  const root    = useRef<THREE.Group>(null);
  const upper   = useRef<THREE.Group>(null);
  const headGrp = useRef<THREE.Group>(null);
  const lLeg    = useRef<THREE.Group>(null);
  const rLeg    = useRef<THREE.Group>(null);
  const lArm    = useRef<THREE.Group>(null);
  const rArm    = useRef<THREE.Group>(null);
  const ph      = useRef(Math.random() * Math.PI * 2);

  const gradMap = useMemo(() => getGradMap(), []);

  // Derived colors
  const skinShadow  = shadowOf(skinColor);
  const hairShadow  = shadowOf(hairColor);
  const shirtShadow = shadowOf(shirtColor);
  const lipColor    = useMemo(() => {
    const c = new THREE.Color(skinColor);
    return `#${new THREE.Color(c.r * 0.65, c.g * 0.35, c.b * 0.32).getHexString()}`;
  }, [skinColor]);

  const PANTS    = '#1E2D3D';
  const SHOES    = '#0D0F14';
  const SOLE     = '#EAECEF';
  const OUTLINE  = '#0A0500';

  useFrame(({ clock }) => {
    if (!root.current) return;
    const t     = clock.elapsedTime;
    const p     = ph.current;
    const moving = isMovingRef?.current ?? false;
    const s     = moving ? 1.0 : 0.0;
    const freq  = 5.4;

    if (posRef?.current) root.current.position.copy(posRef.current);
    else                 root.current.position.copy(position);
    if (rotRef?.current !== undefined) root.current.rotation.y = rotRef.current;
    else                               root.current.rotation.y = rotation;

    // Legs
    const sw = s * Math.sin(t * freq + p) * 0.44;
    if (lLeg.current) lLeg.current.rotation.x =  sw;
    if (rLeg.current) rLeg.current.rotation.x = -sw;

    // Arms counter-swing
    const aw = s * Math.sin(t * freq + p + Math.PI) * 0.22;
    if (lArm.current) lArm.current.rotation.x =  aw;
    if (rArm.current) rArm.current.rotation.x = -aw;

    // Upper body — stays at y=1.02 + subtle bob + lateral sway
    if (upper.current) {
      upper.current.position.y = 1.02 + (moving
        ? Math.abs(Math.sin(t * freq * 2 + p)) * 0.012
        : Math.sin(t * 1.05 + p) * 0.004);
      upper.current.rotation.z = s * Math.sin(t * freq + p) * 0.024;
    }

    // Head — stays at y=0.66 relative to upper + gentle bob
    if (headGrp.current) {
      headGrp.current.position.y = 0.66 + (moving
        ? Math.abs(Math.sin(t * freq * 2 + p)) * 0.012
        : Math.sin(t * 0.82 + p) * 0.003);
    }
  });

  return (
    <group ref={root} position={position}>

      {/* Ground shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
        <circleGeometry args={[0.26, 28]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.28} />
      </mesh>

      {/* ═══════════════ LEFT LEG ═══════════════ */}
      <group ref={lLeg} position={[-0.1, 0.72, 0]}>
        {/* Outline */}
        <mesh position={[0, -0.17, 0]} scale={1.07}>
          <capsuleGeometry args={[0.092, 0.24, 6, 18]} />
          <meshBasicMaterial color={OUTLINE} side={THREE.BackSide} />
        </mesh>
        {/* Fill */}
        <mesh position={[0, -0.17, 0]}>
          <capsuleGeometry args={[0.092, 0.24, 6, 18]} />
          <meshToonMaterial color={PANTS} gradientMap={gradMap} />
        </mesh>
        <mesh position={[0, -0.36, 0]} scale={1.07}>
          <sphereGeometry args={[0.096, 16, 12]} />
          <meshBasicMaterial color={OUTLINE} side={THREE.BackSide} />
        </mesh>
        <mesh position={[0, -0.36, 0]}>
          <sphereGeometry args={[0.096, 16, 12]} />
          <meshToonMaterial color={PANTS} gradientMap={gradMap} />
        </mesh>
        <mesh position={[0, -0.53, 0]} scale={1.07}>
          <capsuleGeometry args={[0.08, 0.2, 6, 16]} />
          <meshBasicMaterial color={OUTLINE} side={THREE.BackSide} />
        </mesh>
        <mesh position={[0, -0.53, 0]}>
          <capsuleGeometry args={[0.08, 0.2, 6, 16]} />
          <meshToonMaterial color={PANTS} gradientMap={gradMap} />
        </mesh>
        {/* Shoe */}
        <mesh position={[0.01, -0.74, 0.038]} scale={1.06}>
          <boxGeometry args={[0.162, 0.108, 0.255, 2, 1, 3]} />
          <meshBasicMaterial color={OUTLINE} side={THREE.BackSide} />
        </mesh>
        <mesh position={[0.01, -0.74, 0.038]}>
          <boxGeometry args={[0.162, 0.108, 0.255, 2, 1, 3]} />
          <meshToonMaterial color={SHOES} gradientMap={gradMap} />
        </mesh>
        <mesh position={[0.01, -0.745, 0.152]}>
          <sphereGeometry args={[0.086, 16, 12]} />
          <meshToonMaterial color={SHOES} gradientMap={gradMap} />
        </mesh>
        <mesh position={[0.01, -0.782, 0.038]}>
          <boxGeometry args={[0.17, 0.022, 0.268]} />
          <meshBasicMaterial color={SOLE} />
        </mesh>
      </group>

      {/* ═══════════════ RIGHT LEG ═══════════════ */}
      <group ref={rLeg} position={[0.1, 0.72, 0]}>
        <mesh position={[0, -0.17, 0]} scale={1.07}>
          <capsuleGeometry args={[0.092, 0.24, 6, 18]} />
          <meshBasicMaterial color={OUTLINE} side={THREE.BackSide} />
        </mesh>
        <mesh position={[0, -0.17, 0]}>
          <capsuleGeometry args={[0.092, 0.24, 6, 18]} />
          <meshToonMaterial color={PANTS} gradientMap={gradMap} />
        </mesh>
        <mesh position={[0, -0.36, 0]} scale={1.07}>
          <sphereGeometry args={[0.096, 16, 12]} />
          <meshBasicMaterial color={OUTLINE} side={THREE.BackSide} />
        </mesh>
        <mesh position={[0, -0.36, 0]}>
          <sphereGeometry args={[0.096, 16, 12]} />
          <meshToonMaterial color={PANTS} gradientMap={gradMap} />
        </mesh>
        <mesh position={[0, -0.53, 0]} scale={1.07}>
          <capsuleGeometry args={[0.08, 0.2, 6, 16]} />
          <meshBasicMaterial color={OUTLINE} side={THREE.BackSide} />
        </mesh>
        <mesh position={[0, -0.53, 0]}>
          <capsuleGeometry args={[0.08, 0.2, 6, 16]} />
          <meshToonMaterial color={PANTS} gradientMap={gradMap} />
        </mesh>
        <mesh position={[-0.01, -0.74, 0.038]} scale={1.06}>
          <boxGeometry args={[0.162, 0.108, 0.255, 2, 1, 3]} />
          <meshBasicMaterial color={OUTLINE} side={THREE.BackSide} />
        </mesh>
        <mesh position={[-0.01, -0.74, 0.038]}>
          <boxGeometry args={[0.162, 0.108, 0.255, 2, 1, 3]} />
          <meshToonMaterial color={SHOES} gradientMap={gradMap} />
        </mesh>
        <mesh position={[-0.01, -0.745, 0.152]}>
          <sphereGeometry args={[0.086, 16, 12]} />
          <meshToonMaterial color={SHOES} gradientMap={gradMap} />
        </mesh>
        <mesh position={[-0.01, -0.782, 0.038]}>
          <boxGeometry args={[0.17, 0.022, 0.268]} />
          <meshBasicMaterial color={SOLE} />
        </mesh>
      </group>

      {/* ═══════════════ UPPER BODY ═══════════════ */}
      <group ref={upper} position={[0, 1.02, 0]}>

        {/* Hips */}
        <mesh position={[0, -0.22, 0]} scale={1.06}>
          <capsuleGeometry args={[0.138, 0.1, 6, 18]} />
          <meshBasicMaterial color={OUTLINE} side={THREE.BackSide} />
        </mesh>
        <mesh position={[0, -0.22, 0]}>
          <capsuleGeometry args={[0.138, 0.1, 6, 18]} />
          <meshToonMaterial color={PANTS} gradientMap={gradMap} />
        </mesh>

        {/* Belt */}
        <mesh position={[0, -0.138, 0]}>
          <cylinderGeometry args={[0.145, 0.145, 0.042, 26, 1, true]} />
          <meshBasicMaterial color="#0A0A0A" />
        </mesh>
        <mesh position={[0, -0.138, 0.147]}>
          <boxGeometry args={[0.058, 0.034, 0.01]} />
          <meshBasicMaterial color="#C9A020" />
        </mesh>

        {/* Torso */}
        <mesh position={[0, 0.09, 0]} scale={[1.06, 1.06, 1.04]}>
          <capsuleGeometry args={[0.178, 0.3, 8, 22]} />
          <meshBasicMaterial color={OUTLINE} side={THREE.BackSide} />
        </mesh>
        <mesh position={[0, 0.09, 0]} scale={[1, 1, 0.88]}>
          <capsuleGeometry args={[0.178, 0.3, 8, 22]} />
          <meshToonMaterial color={shirtColor} gradientMap={gradMap} />
        </mesh>

        {/* Collar */}
        <mesh position={[0, 0.315, 0.09]}>
          <torusGeometry args={[0.076, 0.017, 7, 22, Math.PI * 1.15]} />
          <meshBasicMaterial color="#F5F5FF" />
        </mesh>

        {/* ── LEFT ARM ── */}
        <group ref={lArm} position={[-0.235, 0.21, 0]}>
          {/* Shoulder */}
          <mesh position={[-0.04, 0, 0]} scale={1.07}>
            <sphereGeometry args={[0.098, 18, 14]} />
            <meshBasicMaterial color={OUTLINE} side={THREE.BackSide} />
          </mesh>
          <mesh position={[-0.04, 0, 0]}>
            <sphereGeometry args={[0.098, 18, 14]} />
            <meshToonMaterial color={shirtColor} gradientMap={gradMap} />
          </mesh>
          {/* Upper arm */}
          <mesh position={[-0.06, -0.18, 0]} rotation={[0, 0, 0.14]} scale={1.07}>
            <capsuleGeometry args={[0.078, 0.21, 6, 18]} />
            <meshBasicMaterial color={OUTLINE} side={THREE.BackSide} />
          </mesh>
          <mesh position={[-0.06, -0.18, 0]} rotation={[0, 0, 0.14]}>
            <capsuleGeometry args={[0.078, 0.21, 6, 18]} />
            <meshToonMaterial color={shirtColor} gradientMap={gradMap} />
          </mesh>
          {/* Forearm */}
          <mesh position={[-0.08, -0.5, 0]} rotation={[0, 0, 0.08]} scale={1.07}>
            <capsuleGeometry args={[0.067, 0.2, 6, 16]} />
            <meshBasicMaterial color={OUTLINE} side={THREE.BackSide} />
          </mesh>
          <mesh position={[-0.08, -0.5, 0]} rotation={[0, 0, 0.08]}>
            <capsuleGeometry args={[0.067, 0.2, 6, 16]} />
            <meshToonMaterial color={skinColor} gradientMap={gradMap} />
          </mesh>
          {/* Hand */}
          <mesh position={[-0.086, -0.685, 0]} scale={1.07}>
            <sphereGeometry args={[0.082, 18, 14]} />
            <meshBasicMaterial color={OUTLINE} side={THREE.BackSide} />
          </mesh>
          <mesh position={[-0.086, -0.685, 0]}>
            <sphereGeometry args={[0.082, 18, 14]} />
            <meshToonMaterial color={skinColor} gradientMap={gradMap} />
          </mesh>
        </group>

        {/* ── RIGHT ARM ── */}
        <group ref={rArm} position={[0.235, 0.21, 0]}>
          <mesh position={[0.04, 0, 0]} scale={1.07}>
            <sphereGeometry args={[0.098, 18, 14]} />
            <meshBasicMaterial color={OUTLINE} side={THREE.BackSide} />
          </mesh>
          <mesh position={[0.04, 0, 0]}>
            <sphereGeometry args={[0.098, 18, 14]} />
            <meshToonMaterial color={shirtColor} gradientMap={gradMap} />
          </mesh>
          <mesh position={[0.06, -0.18, 0]} rotation={[0, 0, -0.14]} scale={1.07}>
            <capsuleGeometry args={[0.078, 0.21, 6, 18]} />
            <meshBasicMaterial color={OUTLINE} side={THREE.BackSide} />
          </mesh>
          <mesh position={[0.06, -0.18, 0]} rotation={[0, 0, -0.14]}>
            <capsuleGeometry args={[0.078, 0.21, 6, 18]} />
            <meshToonMaterial color={shirtColor} gradientMap={gradMap} />
          </mesh>
          <mesh position={[0.08, -0.5, 0]} rotation={[0, 0, -0.08]} scale={1.07}>
            <capsuleGeometry args={[0.067, 0.2, 6, 16]} />
            <meshBasicMaterial color={OUTLINE} side={THREE.BackSide} />
          </mesh>
          <mesh position={[0.08, -0.5, 0]} rotation={[0, 0, -0.08]}>
            <capsuleGeometry args={[0.067, 0.2, 6, 16]} />
            <meshToonMaterial color={skinColor} gradientMap={gradMap} />
          </mesh>
          <mesh position={[0.086, -0.685, 0]} scale={1.07}>
            <sphereGeometry args={[0.082, 18, 14]} />
            <meshBasicMaterial color={OUTLINE} side={THREE.BackSide} />
          </mesh>
          <mesh position={[0.086, -0.685, 0]}>
            <sphereGeometry args={[0.082, 18, 14]} />
            <meshToonMaterial color={skinColor} gradientMap={gradMap} />
          </mesh>
        </group>

        {/* Neck */}
        <mesh position={[0, 0.43, 0]} scale={1.06}>
          <capsuleGeometry args={[0.079, 0.09, 6, 16]} />
          <meshBasicMaterial color={OUTLINE} side={THREE.BackSide} />
        </mesh>
        <mesh position={[0, 0.43, 0]}>
          <capsuleGeometry args={[0.079, 0.09, 6, 16]} />
          <meshToonMaterial color={skinColor} gradientMap={gradMap} />
        </mesh>

        {/* ═══════════════════════════════════════════════════════
            HEAD — Big cartoon head (38% of 2-unit total height)
            Outline: BackSide scaled sphere behind the fill sphere
        ═══════════════════════════════════════════════════════ */}
        <group ref={headGrp} position={[0, 0.66, 0]}>

          {/* Head outline */}
          <mesh scale={[1.062, 1.068, 1.055]}>
            <sphereGeometry args={[0.38, 48, 36]} />
            <meshBasicMaterial color={OUTLINE} side={THREE.BackSide} />
          </mesh>
          {/* Head fill — slightly oval */}
          <mesh scale={[1.0, 1.06, 0.96]}>
            <sphereGeometry args={[0.38, 48, 36]} />
            <meshToonMaterial color={skinColor} gradientMap={gradMap} />
          </mesh>

          {/* Jaw softening — rounds the chin */}
          <mesh position={[0, -0.14, 0.04]} scale={[0.9, 0.44, 0.85]}>
            <sphereGeometry args={[0.38, 32, 24]} />
            <meshToonMaterial color={skinColor} gradientMap={gradMap} />
          </mesh>

          {/* Cheek puff left */}
          <mesh position={[-0.235, 0.0, 0.265]} scale={[0.55, 0.48, 0.52]}>
            <sphereGeometry args={[0.38, 22, 16]} />
            <meshToonMaterial color={skinColor} gradientMap={gradMap} />
          </mesh>
          {/* Cheek puff right */}
          <mesh position={[0.235, 0.0, 0.265]} scale={[0.55, 0.48, 0.52]}>
            <sphereGeometry args={[0.38, 22, 16]} />
            <meshToonMaterial color={skinColor} gradientMap={gradMap} />
          </mesh>

          {/* ══════════════════════════════════
              HAIR — Big bold cartoon afro
              Outline: scale 1.045 BackSide
          ══════════════════════════════════ */}
          {/* Hair outline */}
          <mesh position={[0, 0.1, -0.02]} scale={[1.042, 1.036, 1.036]}>
            <sphereGeometry args={[0.41, 38, 28]} />
            <meshBasicMaterial color={OUTLINE} side={THREE.BackSide} />
          </mesh>
          {/* Hair main mass */}
          <mesh position={[0, 0.1, -0.02]}>
            <sphereGeometry args={[0.41, 38, 28]} />
            <meshToonMaterial color={hairColor} gradientMap={gradMap} />
          </mesh>
          {/* Left lobe outline */}
          <mesh position={[-0.13, 0.07, -0.03]} scale={[0.89, 0.855, 0.89]}>
            <sphereGeometry args={[0.41, 30, 22]} />
            <meshBasicMaterial color={OUTLINE} side={THREE.BackSide} />
          </mesh>
          <mesh position={[-0.13, 0.07, -0.03]} scale={[0.86, 0.83, 0.86]}>
            <sphereGeometry args={[0.41, 30, 22]} />
            <meshToonMaterial color={hairColor} gradientMap={gradMap} />
          </mesh>
          {/* Right lobe */}
          <mesh position={[0.13, 0.07, -0.03]} scale={[0.89, 0.855, 0.89]}>
            <sphereGeometry args={[0.41, 30, 22]} />
            <meshBasicMaterial color={OUTLINE} side={THREE.BackSide} />
          </mesh>
          <mesh position={[0.13, 0.07, -0.03]} scale={[0.86, 0.83, 0.86]}>
            <sphereGeometry args={[0.41, 30, 22]} />
            <meshToonMaterial color={hairColor} gradientMap={gradMap} />
          </mesh>
          {/* Back */}
          <mesh position={[0, 0.06, -0.11]} scale={[0.91, 0.89, 0.89]}>
            <sphereGeometry args={[0.41, 30, 22]} />
            <meshToonMaterial color={hairColor} gradientMap={gradMap} />
          </mesh>
          {/* Hairline front */}
          <mesh position={[0, -0.15, 0.34]}>
            <torusGeometry args={[0.152, 0.025, 7, 26, Math.PI * 0.88]} />
            <meshToonMaterial color={hairColor} gradientMap={gradMap} />
          </mesh>
          {/* Sideburns */}
          <mesh position={[-0.36, -0.135, 0.105]}>
            <sphereGeometry args={[0.065, 12, 9]} />
            <meshToonMaterial color={hairColor} gradientMap={gradMap} />
          </mesh>
          <mesh position={[0.36, -0.135, 0.105]}>
            <sphereGeometry args={[0.065, 12, 9]} />
            <meshToonMaterial color={hairColor} gradientMap={gradMap} />
          </mesh>

          {/* ═══════════ EARS ═══════════ */}
          {/* Left ear */}
          <mesh position={[-0.37, -0.02, 0]} scale={1.06}>
            <sphereGeometry args={[0.08, 16, 12]} />
            <meshBasicMaterial color={OUTLINE} side={THREE.BackSide} />
          </mesh>
          <mesh position={[-0.37, -0.02, 0]}>
            <sphereGeometry args={[0.08, 16, 12]} />
            <meshToonMaterial color={skinColor} gradientMap={gradMap} />
          </mesh>
          {/* Right ear */}
          <mesh position={[0.37, -0.02, 0]} scale={1.06}>
            <sphereGeometry args={[0.08, 16, 12]} />
            <meshBasicMaterial color={OUTLINE} side={THREE.BackSide} />
          </mesh>
          <mesh position={[0.37, -0.02, 0]}>
            <sphereGeometry args={[0.08, 16, 12]} />
            <meshToonMaterial color={skinColor} gradientMap={gradMap} />
          </mesh>

          {/* ═══════════════════════════════════════════════════
              FACE — cartoon references have:
              · Large ALMOND eyes (oval, not circular)
              · Very large iris filling most of the eye
              · Bold, arched eyebrows
              · Tiny nose (just a hint)
              · Wide cartoon smile

              Head center = [0,0,0] in this group
              Face surface at z = 0.38 * 0.96 = 0.365
              Eyes at y = +0.01, x = ±0.122
          ═══════════════════════════════════════════════════ */}

          {/* ── LEFT EYE — almond shape via oval scale ── */}
          {/* Eye socket shadow */}
          <mesh position={[-0.122, 0.01, 0.335]} scale={[1, 0.76, 1]}>
            <sphereGeometry args={[0.118, 22, 16]} />
            <meshToonMaterial color={skinShadow} gradientMap={gradMap} />
          </mesh>
          {/* Sclera (white) — almond scaled */}
          <mesh position={[-0.122, 0.01, 0.352]} scale={[1, 0.76, 1]}>
            <sphereGeometry args={[0.106, 22, 16]} />
            <meshBasicMaterial color="#FFFCF0" />
          </mesh>
          {/* Iris — fills most of the eye */}
          <mesh position={[-0.122, 0.01, 0.416]}>
            <circleGeometry args={[0.076, 28]} />
            <meshBasicMaterial color="#140C06" />
          </mesh>
          {/* Iris color ring */}
          <mesh position={[-0.122, 0.01, 0.415]}>
            <torusGeometry args={[0.06, 0.016, 8, 28]} />
            <meshBasicMaterial color="#5A2E10" />
          </mesh>
          {/* Pupil */}
          <mesh position={[-0.122, 0.01, 0.418]}>
            <circleGeometry args={[0.042, 22]} />
            <meshBasicMaterial color="#040100" />
          </mesh>
          {/* Main catchlight — large, top-left */}
          <mesh position={[-0.142, 0.034, 0.421]}>
            <circleGeometry args={[0.022, 10]} />
            <meshBasicMaterial color="#FFFFFF" />
          </mesh>
          {/* Small secondary catchlight */}
          <mesh position={[-0.106, 0.001, 0.421]}>
            <circleGeometry args={[0.011, 8]} />
            <meshBasicMaterial color="rgba(255,255,255,0.75)" transparent opacity={0.75} />
          </mesh>
          {/* Top lash bar — bold, cartoon style */}
          <mesh position={[-0.122, 0.075, 0.366]} scale={[1.0, 0.3, 1]}>
            <capsuleGeometry args={[0.052, 0.1, 5, 12]} />
            <meshBasicMaterial color={OUTLINE} />
          </mesh>
          {/* Bottom lash hint */}
          <mesh position={[-0.122, -0.055, 0.362]} scale={[1.0, 0.2, 1]}>
            <capsuleGeometry args={[0.042, 0.085, 4, 10]} />
            <meshBasicMaterial color={OUTLINE} transparent opacity={0.55} />
          </mesh>

          {/* ── RIGHT EYE ── */}
          <mesh position={[0.122, 0.01, 0.335]} scale={[1, 0.76, 1]}>
            <sphereGeometry args={[0.118, 22, 16]} />
            <meshToonMaterial color={skinShadow} gradientMap={gradMap} />
          </mesh>
          <mesh position={[0.122, 0.01, 0.352]} scale={[1, 0.76, 1]}>
            <sphereGeometry args={[0.106, 22, 16]} />
            <meshBasicMaterial color="#FFFCF0" />
          </mesh>
          <mesh position={[0.122, 0.01, 0.416]}>
            <circleGeometry args={[0.076, 28]} />
            <meshBasicMaterial color="#140C06" />
          </mesh>
          <mesh position={[0.122, 0.01, 0.415]}>
            <torusGeometry args={[0.06, 0.016, 8, 28]} />
            <meshBasicMaterial color="#5A2E10" />
          </mesh>
          <mesh position={[0.122, 0.01, 0.418]}>
            <circleGeometry args={[0.042, 22]} />
            <meshBasicMaterial color="#040100" />
          </mesh>
          <mesh position={[0.142, 0.034, 0.421]}>
            <circleGeometry args={[0.022, 10]} />
            <meshBasicMaterial color="#FFFFFF" />
          </mesh>
          <mesh position={[0.106, 0.001, 0.421]}>
            <circleGeometry args={[0.011, 8]} />
            <meshBasicMaterial color="rgba(255,255,255,0.75)" transparent opacity={0.75} />
          </mesh>
          <mesh position={[0.122, 0.075, 0.366]} scale={[1.0, 0.3, 1]}>
            <capsuleGeometry args={[0.052, 0.1, 5, 12]} />
            <meshBasicMaterial color={OUTLINE} />
          </mesh>
          <mesh position={[0.122, -0.055, 0.362]} scale={[1.0, 0.2, 1]}>
            <capsuleGeometry args={[0.042, 0.085, 4, 10]} />
            <meshBasicMaterial color={OUTLINE} transparent opacity={0.55} />
          </mesh>

          {/* ── EYEBROWS — bold, arched ── */}
          {/* Left — outer arch */}
          <mesh position={[-0.16, 0.163, 0.35]} rotation={[0, 0, 0.38]}>
            <capsuleGeometry args={[0.018, 0.052, 5, 10]} />
            <meshBasicMaterial color={hairColor} />
          </mesh>
          {/* Left — inner tail */}
          <mesh position={[-0.105, 0.175, 0.352]} rotation={[0, 0, 0.12]}>
            <capsuleGeometry args={[0.015, 0.038, 5, 8]} />
            <meshBasicMaterial color={hairColor} />
          </mesh>
          {/* Right — outer arch */}
          <mesh position={[0.16, 0.163, 0.35]} rotation={[0, 0, -0.38]}>
            <capsuleGeometry args={[0.018, 0.052, 5, 10]} />
            <meshBasicMaterial color={hairColor} />
          </mesh>
          {/* Right — inner tail */}
          <mesh position={[0.105, 0.175, 0.352]} rotation={[0, 0, -0.12]}>
            <capsuleGeometry args={[0.015, 0.038, 5, 8]} />
            <meshBasicMaterial color={hairColor} />
          </mesh>

          {/* ── NOSE — cartoon minimal (just the tip) ── */}
          <mesh position={[0, -0.022, 0.382]}>
            <sphereGeometry args={[0.034, 14, 10]} />
            <meshToonMaterial color={skinShadow} gradientMap={gradMap} />
          </mesh>
          <mesh position={[-0.038, -0.034, 0.37]}>
            <sphereGeometry args={[0.022, 10, 8]} />
            <meshToonMaterial color={skinShadow} gradientMap={gradMap} />
          </mesh>
          <mesh position={[0.038, -0.034, 0.37]}>
            <sphereGeometry args={[0.022, 10, 8]} />
            <meshToonMaterial color={skinShadow} gradientMap={gradMap} />
          </mesh>

          {/* ── MOUTH — wide cartoon smile ── */}
          {/* Upper lip left arc */}
          <mesh position={[-0.032, -0.105, 0.368]} rotation={[0.06, 0, 0.22]}>
            <torusGeometry args={[0.036, 0.015, 8, 18, Math.PI * 0.7]} />
            <meshBasicMaterial color={lipColor} />
          </mesh>
          {/* Upper lip right arc */}
          <mesh position={[0.032, -0.105, 0.368]} rotation={[0.06, 0, -0.22]}>
            <torusGeometry args={[0.036, 0.015, 8, 18, Math.PI * 0.7]} />
            <meshBasicMaterial color={lipColor} />
          </mesh>
          {/* Lower lip — fuller */}
          <mesh position={[0, -0.128, 0.369]} rotation={[-0.1, 0, Math.PI]}>
            <torusGeometry args={[0.054, 0.02, 8, 22, Math.PI * 0.64]} />
            <meshBasicMaterial color={lipColor} />
          </mesh>
          {/* Mouth line — hard dark arc for cartoon look */}
          <mesh position={[0, -0.115, 0.371]}>
            <capsuleGeometry args={[0.004, 0.114, 4, 10]} />
            <meshBasicMaterial color={OUTLINE} />
          </mesh>
          {/* Mouth corners */}
          <mesh position={[-0.064, -0.11, 0.364]}>
            <sphereGeometry args={[0.016, 10, 8]} />
            <meshBasicMaterial color={lipColor} />
          </mesh>
          <mesh position={[0.064, -0.11, 0.364]}>
            <sphereGeometry args={[0.016, 10, 8]} />
            <meshBasicMaterial color={lipColor} />
          </mesh>
          {/* Teeth hint */}
          <mesh position={[0, -0.112, 0.368]}>
            <boxGeometry args={[0.068, 0.016, 0.006]} />
            <meshBasicMaterial color="#F8F4F0" />
          </mesh>

          {/* ── CHEEK BLUSH ── */}
          <mesh position={[-0.248, -0.038, 0.296]} rotation={[0, 0.42, 0]}>
            <circleGeometry args={[0.076, 16]} />
            <meshBasicMaterial color="#E87068" transparent opacity={0.18} />
          </mesh>
          <mesh position={[0.248, -0.038, 0.296]} rotation={[0, -0.42, 0]}>
            <circleGeometry args={[0.076, 16]} />
            <meshBasicMaterial color="#E87068" transparent opacity={0.18} />
          </mesh>

        </group>{/* /headGrp */}
      </group>{/* /upper */}
    </group>
  );
}
