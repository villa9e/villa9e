'use client';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─── Skin tone palette ────────────────────────────────────────────────────────
export const SKIN_TONES: Record<string, string> = {
  porcelain:  '#FDE8D0',
  beige:      '#F2C9A0',
  golden:     '#E8A870',
  tan:        '#C88550',
  medium:     '#A86030',
  warm:       '#8A4820',
  deep:       '#6A3018',
  ebony:      '#3E1C0A',
};

// Derive complementary tones from base skin
function skin(hex: string, lightness = 0): string {
  const c = new THREE.Color(hex);
  c.r = Math.min(1, Math.max(0, c.r + lightness * 0.08));
  c.g = Math.min(1, Math.max(0, c.g + lightness * 0.06));
  c.b = Math.min(1, Math.max(0, c.b + lightness * 0.04));
  return `#${c.getHexString()}`;
}

function lip(hex: string): string {
  const c = new THREE.Color(hex);
  return `#${new THREE.Color(c.r * 0.78, c.g * 0.48, c.b * 0.40).getHexString()}`;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const HAIR     = '#0C0700';
const SHIRT    = '#3B82F6';   // Bitmoji-blue
const PANTS    = '#1E3A5F';
const SHOES    = '#111827';
const SOLE     = '#F3F4F6';

// ─── Props ───────────────────────────────────────────────────────────────────
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

// ─── Component ────────────────────────────────────────────────────────────────
export function PlayerCharacter({
  position, rotation = 0,
  posRef, rotRef,
  skinColor  = '#A86030',
  hairColor  = HAIR,
  shirtColor = SHIRT,
  isLocal    = false,
  isMovingRef,
}: PlayerCharacterProps) {

  const root     = useRef<THREE.Group>(null);
  const upper    = useRef<THREE.Group>(null);
  const headGrp  = useRef<THREE.Group>(null);
  const lLeg     = useRef<THREE.Group>(null);
  const rLeg     = useRef<THREE.Group>(null);
  const lArm     = useRef<THREE.Group>(null);
  const rArm     = useRef<THREE.Group>(null);
  const ph       = useRef(Math.random() * Math.PI * 2);

  // ── Materials — created once per skin/hair/shirt change ──
  const mSkin = useMemo(() => new THREE.MeshPhongMaterial({
    color: skinColor, specular: '#180808', shininess: 22,
  }), [skinColor]);

  const mSkinD = useMemo(() => new THREE.MeshPhongMaterial({
    color: skin(skinColor, -1.2), specular: '#100404', shininess: 14,
  }), [skinColor]);

  const mSkinL = useMemo(() => new THREE.MeshPhongMaterial({
    color: skin(skinColor, +0.6), specular: '#200A0A', shininess: 30,
  }), [skinColor]);

  const mHair = useMemo(() => new THREE.MeshPhongMaterial({
    color: hairColor, specular: '#120A02', shininess: 28,
  }), [hairColor]);

  const mShirt = useMemo(() => new THREE.MeshPhongMaterial({
    color: shirtColor, specular: '#080820', shininess: 15,
  }), [shirtColor]);

  const mPants = useMemo(() => new THREE.MeshPhongMaterial({
    color: PANTS, specular: '#040810', shininess: 10,
  }), []);

  const mShoe = useMemo(() => new THREE.MeshPhongMaterial({
    color: SHOES, specular: '#282828', shininess: 45,
  }), []);

  const mLip = useMemo(() => new THREE.MeshPhongMaterial({
    color: lip(skinColor), specular: '#0A0404', shininess: 38,
  }), [skinColor]);

  const mWhite = useMemo(() => new THREE.MeshPhongMaterial({
    color: '#FEF9F0', specular: '#CCBBAA', shininess: 80,
  }), []);

  const mIris = useMemo(() => new THREE.MeshBasicMaterial({ color: '#1A0E06' }), []);
  const mPupil = useMemo(() => new THREE.MeshBasicMaterial({ color: '#030100' }), []);
  const mCatchL = useMemo(() => new THREE.MeshBasicMaterial({ color: '#FFFFFF' }), []);
  const mHairD = useMemo(() => new THREE.MeshBasicMaterial({ color: hairColor }), [hairColor]);
  const mSkinB = useMemo(() => new THREE.MeshBasicMaterial({ color: skin(skinColor, -0.5) }), [skinColor]);
  const mSole  = useMemo(() => new THREE.MeshBasicMaterial({ color: SOLE }), []);

  useFrame(({ clock }) => {
    if (!root.current) return;
    const t      = clock.elapsedTime;
    const p      = ph.current;
    const moving = isMovingRef?.current ?? false;
    const s      = moving ? 1.0 : 0.0;
    const freq   = 5.2;

    // Sync position & rotation
    if (posRef?.current) root.current.position.copy(posRef.current);
    else                 root.current.position.copy(position);
    if (rotRef?.current !== undefined) root.current.rotation.y = rotRef.current;
    else                               root.current.rotation.y = rotation;

    // Leg swing
    const sw = s * Math.sin(t * freq + p) * 0.45;
    if (lLeg.current) lLeg.current.rotation.x =  sw;
    if (rLeg.current) rLeg.current.rotation.x = -sw;

    // Arm counter-swing
    const aw = s * Math.sin(t * freq + p + Math.PI) * 0.24;
    if (lArm.current) lArm.current.rotation.x =  aw;
    if (rArm.current) rArm.current.rotation.x = -aw;

    // Upper body: base at y=1.02 + subtle vertical bob + sway
    if (upper.current) {
      upper.current.position.y = 1.02 + (moving
        ? Math.abs(Math.sin(t * freq * 2 + p)) * 0.012
        : Math.sin(t * 1.05 + p) * 0.004);
      upper.current.rotation.z = s * Math.sin(t * freq + p) * 0.025;
    }

    // Head: base at y=0.66 relative to upper + gentle bob
    if (headGrp.current) {
      headGrp.current.position.y = 0.66 + (moving
        ? Math.abs(Math.sin(t * freq * 2 + p)) * 0.012
        : Math.sin(t * 0.82 + p) * 0.003);
    }
  });

  // ─── Geometry — pre-computed high-segment counts ──────────────────────────
  // All major shapes use 32+ radial segments for smooth silhouettes

  return (
    <group ref={root} position={position}>

      {/* ── Ground shadow ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <circleGeometry args={[0.28, 32]} />
        <meshBasicMaterial color="#000" transparent opacity={0.22} />
      </mesh>

      {/* ════════════════════════════════════════════════════
          LEFT LEG  — pivot at hip joint
      ════════════════════════════════════════════════════ */}
      <group ref={lLeg} position={[-0.1, 0.72, 0]}>
        {/* Thigh */}
        <mesh position={[0, -0.17, 0]}>
          <capsuleGeometry args={[0.092, 0.24, 8, 22]} />
          <primitive object={mPants} attach="material" />
        </mesh>
        {/* Knee */}
        <mesh position={[0, -0.36, 0]}>
          <sphereGeometry args={[0.096, 20, 16]} />
          <primitive object={mPants} attach="material" />
        </mesh>
        {/* Calf */}
        <mesh position={[0, -0.53, 0]}>
          <capsuleGeometry args={[0.08, 0.2, 8, 20]} />
          <primitive object={mPants} attach="material" />
        </mesh>
        {/* Ankle */}
        <mesh position={[0, -0.69, 0]}>
          <sphereGeometry args={[0.078, 18, 14]} />
          <primitive object={mShoe} attach="material" />
        </mesh>
        {/* Shoe */}
        <mesh position={[0.01, -0.73, 0.036]}>
          <boxGeometry args={[0.158, 0.105, 0.25, 3, 1, 4]} />
          <primitive object={mShoe} attach="material" />
        </mesh>
        {/* Rounded toe */}
        <mesh position={[0.01, -0.73, 0.148]}>
          <sphereGeometry args={[0.088, 18, 14]} />
          <primitive object={mShoe} attach="material" />
        </mesh>
        {/* Sole */}
        <mesh position={[0.01, -0.775, 0.036]}>
          <boxGeometry args={[0.165, 0.02, 0.262]} />
          <primitive object={mSole} attach="material" />
        </mesh>
      </group>

      {/* ════════════════════════════════════════════════════
          RIGHT LEG
      ════════════════════════════════════════════════════ */}
      <group ref={rLeg} position={[0.1, 0.72, 0]}>
        <mesh position={[0, -0.17, 0]}>
          <capsuleGeometry args={[0.092, 0.24, 8, 22]} />
          <primitive object={mPants} attach="material" />
        </mesh>
        <mesh position={[0, -0.36, 0]}>
          <sphereGeometry args={[0.096, 20, 16]} />
          <primitive object={mPants} attach="material" />
        </mesh>
        <mesh position={[0, -0.53, 0]}>
          <capsuleGeometry args={[0.08, 0.2, 8, 20]} />
          <primitive object={mPants} attach="material" />
        </mesh>
        <mesh position={[0, -0.69, 0]}>
          <sphereGeometry args={[0.078, 18, 14]} />
          <primitive object={mShoe} attach="material" />
        </mesh>
        <mesh position={[-0.01, -0.73, 0.036]}>
          <boxGeometry args={[0.158, 0.105, 0.25, 3, 1, 4]} />
          <primitive object={mShoe} attach="material" />
        </mesh>
        <mesh position={[-0.01, -0.73, 0.148]}>
          <sphereGeometry args={[0.088, 18, 14]} />
          <primitive object={mShoe} attach="material" />
        </mesh>
        <mesh position={[-0.01, -0.775, 0.036]}>
          <boxGeometry args={[0.165, 0.02, 0.262]} />
          <primitive object={mSole} attach="material" />
        </mesh>
      </group>

      {/* ════════════════════════════════════════════════════
          UPPER BODY — sway parent, holds torso + arms + neck + head
      ════════════════════════════════════════════════════ */}
      <group ref={upper} position={[0, 1.02, 0]}>

        {/* Hips */}
        <mesh position={[0, -0.22, 0]}>
          <capsuleGeometry args={[0.138, 0.1, 8, 22]} />
          <primitive object={mPants} attach="material" />
        </mesh>

        {/* Belt */}
        <mesh position={[0, -0.135, 0]}>
          <cylinderGeometry args={[0.145, 0.145, 0.04, 28, 1, true]} />
          <meshBasicMaterial color="#0A0A0A" />
        </mesh>

        {/* Chest / torso — slightly wider at shoulders */}
        <mesh position={[0, 0.09, 0]} scale={[1, 1, 0.88]}>
          <capsuleGeometry args={[0.178, 0.3, 10, 24]} />
          <primitive object={mShirt} attach="material" />
        </mesh>

        {/* Shirt lower hem */}
        <mesh position={[0, -0.07, 0]}>
          <cylinderGeometry args={[0.182, 0.182, 0.04, 28, 1, true]} />
          <primitive object={mShirt} attach="material" />
        </mesh>

        {/* Collar — v-neck style */}
        <mesh position={[0, 0.31, 0.092]}>
          <torusGeometry args={[0.078, 0.018, 8, 24, Math.PI * 1.15]} />
          <meshBasicMaterial color="#F5F5FF" />
        </mesh>

        {/* ── LEFT ARM ── */}
        <group ref={lArm} position={[-0.235, 0.21, 0]}>
          {/* Shoulder sphere */}
          <mesh position={[-0.04, 0, 0]}>
            <sphereGeometry args={[0.098, 22, 16]} />
            <primitive object={mShirt} attach="material" />
          </mesh>
          {/* Upper arm */}
          <mesh position={[-0.06, -0.18, 0]} rotation={[0, 0, 0.14]}>
            <capsuleGeometry args={[0.078, 0.21, 8, 20]} />
            <primitive object={mShirt} attach="material" />
          </mesh>
          {/* Elbow */}
          <mesh position={[-0.078, -0.36, 0]}>
            <sphereGeometry args={[0.078, 18, 14]} />
            <primitive object={mSkin} attach="material" />
          </mesh>
          {/* Forearm */}
          <mesh position={[-0.084, -0.505, 0]} rotation={[0, 0, 0.08]}>
            <capsuleGeometry args={[0.067, 0.2, 8, 18]} />
            <primitive object={mSkin} attach="material" />
          </mesh>
          {/* Wrist */}
          <mesh position={[-0.088, -0.658, 0]}>
            <sphereGeometry args={[0.068, 16, 12]} />
            <primitive object={mSkin} attach="material" />
          </mesh>
          {/* Hand */}
          <mesh position={[-0.09, -0.718, 0]}>
            <sphereGeometry args={[0.082, 20, 16]} />
            <primitive object={mSkin} attach="material" />
          </mesh>
          {/* Thumb */}
          <mesh position={[-0.048, -0.73, 0.05]} rotation={[0.35, 0, 0.50]}>
            <capsuleGeometry args={[0.028, 0.056, 6, 10]} />
            <primitive object={mSkin} attach="material" />
          </mesh>
          {/* Fingers */}
          <mesh position={[-0.09, -0.77, 0.025]} rotation={[0.18, 0, 0]}>
            <capsuleGeometry args={[0.046, 0.042, 6, 12]} />
            <primitive object={mSkin} attach="material" />
          </mesh>
        </group>

        {/* ── RIGHT ARM ── */}
        <group ref={rArm} position={[0.235, 0.21, 0]}>
          <mesh position={[0.04, 0, 0]}>
            <sphereGeometry args={[0.098, 22, 16]} />
            <primitive object={mShirt} attach="material" />
          </mesh>
          <mesh position={[0.06, -0.18, 0]} rotation={[0, 0, -0.14]}>
            <capsuleGeometry args={[0.078, 0.21, 8, 20]} />
            <primitive object={mShirt} attach="material" />
          </mesh>
          <mesh position={[0.078, -0.36, 0]}>
            <sphereGeometry args={[0.078, 18, 14]} />
            <primitive object={mSkin} attach="material" />
          </mesh>
          <mesh position={[0.084, -0.505, 0]} rotation={[0, 0, -0.08]}>
            <capsuleGeometry args={[0.067, 0.2, 8, 18]} />
            <primitive object={mSkin} attach="material" />
          </mesh>
          <mesh position={[0.088, -0.658, 0]}>
            <sphereGeometry args={[0.068, 16, 12]} />
            <primitive object={mSkin} attach="material" />
          </mesh>
          <mesh position={[0.09, -0.718, 0]}>
            <sphereGeometry args={[0.082, 20, 16]} />
            <primitive object={mSkin} attach="material" />
          </mesh>
          <mesh position={[0.048, -0.73, 0.05]} rotation={[0.35, 0, -0.50]}>
            <capsuleGeometry args={[0.028, 0.056, 6, 10]} />
            <primitive object={mSkin} attach="material" />
          </mesh>
          <mesh position={[0.09, -0.77, 0.025]} rotation={[0.18, 0, 0]}>
            <capsuleGeometry args={[0.046, 0.042, 6, 12]} />
            <primitive object={mSkin} attach="material" />
          </mesh>
        </group>

        {/* Neck */}
        <mesh position={[0, 0.43, 0]}>
          <capsuleGeometry args={[0.08, 0.09, 8, 18]} />
          <primitive object={mSkin} attach="material" />
        </mesh>

        {/* ════════════════════════════════════════════════════
            HEAD GROUP — bob animation parent
            HEAD RADIUS: 0.38 units = 38% of 2.0 unit total height
            This creates the iconic cartoon "big head" proportion
        ════════════════════════════════════════════════════ */}
        <group ref={headGrp} position={[0, 0.66, 0]}>

          {/* ── HEAD BASE — smooth round sphere ── */}
          {/* Slightly oval: wider across, slightly taller, slightly shallower */}
          <mesh scale={[1.0, 1.05, 0.95]}>
            <sphereGeometry args={[0.38, 48, 36]} />
            <primitive object={mSkin} attach="material" />
          </mesh>

          {/* Jaw rounding — softens the chin area */}
          <mesh position={[0, -0.15, 0.04]} scale={[0.92, 0.5, 0.85]}>
            <sphereGeometry args={[0.38, 36, 28]} />
            <primitive object={mSkin} attach="material" />
          </mesh>

          {/* Forehead — slight brow-ridge volume */}
          <mesh position={[0, 0.18, 0.3]} scale={[0.85, 0.3, 0.5]}>
            <sphereGeometry args={[0.38, 28, 20]} />
            <primitive object={mSkin} attach="material" />
          </mesh>

          {/* Cheek volume — chubby cheeks give the cartoon look */}
          <mesh position={[-0.22, 0.0, 0.26]} scale={[0.58, 0.52, 0.55]}>
            <sphereGeometry args={[0.38, 24, 18]} />
            <primitive object={mSkinL} attach="material" />
          </mesh>
          <mesh position={[0.22, 0.0, 0.26]} scale={[0.58, 0.52, 0.55]}>
            <sphereGeometry args={[0.38, 24, 18]} />
            <primitive object={mSkinL} attach="material" />
          </mesh>

          {/* ── HAIR — Big natural afro ── */}
          {/* Main afro mass — significantly larger than head for cartoon scale */}
          <mesh position={[0, 0.1, -0.02]} scale={[1.0, 0.98, 0.94]}>
            <sphereGeometry args={[0.41, 40, 30]} />
            <primitive object={mHair} attach="material" />
          </mesh>
          {/* Left lobe */}
          <mesh position={[-0.12, 0.07, -0.03]} scale={[0.86, 0.82, 0.86]}>
            <sphereGeometry args={[0.41, 34, 26]} />
            <primitive object={mHair} attach="material" />
          </mesh>
          {/* Right lobe */}
          <mesh position={[0.12, 0.07, -0.03]} scale={[0.86, 0.82, 0.86]}>
            <sphereGeometry args={[0.41, 34, 26]} />
            <primitive object={mHair} attach="material" />
          </mesh>
          {/* Back lobe — fills behind head */}
          <mesh position={[0, 0.06, -0.1]} scale={[0.9, 0.88, 0.88]}>
            <sphereGeometry args={[0.41, 34, 26]} />
            <primitive object={mHair} attach="material" />
          </mesh>
          {/* Hairline front curve — covers forehead boundary */}
          <mesh position={[0, -0.15, 0.33]}>
            <torusGeometry args={[0.15, 0.026, 8, 28, Math.PI * 0.9]} />
            <primitive object={mHair} attach="material" />
          </mesh>
          {/* Sideburn left */}
          <mesh position={[-0.355, -0.14, 0.1]}>
            <sphereGeometry args={[0.068, 14, 11]} />
            <primitive object={mHair} attach="material" />
          </mesh>
          {/* Sideburn right */}
          <mesh position={[0.355, -0.14, 0.1]}>
            <sphereGeometry args={[0.068, 14, 11]} />
            <primitive object={mHair} attach="material" />
          </mesh>

          {/* ── EARS ── */}
          <group position={[-0.365, -0.02, 0]}>
            <mesh>
              <sphereGeometry args={[0.082, 20, 16]} />
              <primitive object={mSkin} attach="material" />
            </mesh>
            {/* Inner ear */}
            <mesh position={[0.045, 0, 0]}>
              <sphereGeometry args={[0.046, 14, 11]} />
              <primitive object={mSkinD} attach="material" />
            </mesh>
          </group>
          <group position={[0.365, -0.02, 0]}>
            <mesh>
              <sphereGeometry args={[0.082, 20, 16]} />
              <primitive object={mSkin} attach="material" />
            </mesh>
            <mesh position={[-0.045, 0, 0]}>
              <sphereGeometry args={[0.046, 14, 11]} />
              <primitive object={mSkinD} attach="material" />
            </mesh>
          </group>

          {/* ════════════════════════════════════════════════
              FACE FEATURES
              Head radius = 0.38
              Face forward = +Z
              Eye centers at y=+0.022, x=±0.13, z≈0.36 (on surface)
          ════════════════════════════════════════════════ */}

          {/* ── LEFT EYE ── */}
          {/* Eye socket — slight depth shadow */}
          <mesh position={[-0.13, 0.022, 0.34]}>
            <sphereGeometry args={[0.116, 24, 18]} />
            <primitive object={mSkinD} attach="material" />
          </mesh>
          {/* Sclera — white sphere, protruding */}
          <mesh position={[-0.13, 0.022, 0.355]}>
            <sphereGeometry args={[0.104, 24, 18]} />
            <primitive object={mWhite} attach="material" />
          </mesh>
          {/* Iris — large, fills most of eye (cartoon look) */}
          <mesh position={[-0.13, 0.022, 0.415]}>
            <circleGeometry args={[0.072, 28]} />
            <meshBasicMaterial color="#1E1208" />
          </mesh>
          {/* Color iris ring (warm brown) */}
          <mesh position={[-0.13, 0.022, 0.414]}>
            <torusGeometry args={[0.056, 0.016, 8, 28]} />
            <meshBasicMaterial color="#5C3218" />
          </mesh>
          {/* Pupil */}
          <mesh position={[-0.13, 0.022, 0.417]}>
            <circleGeometry args={[0.04, 22]} />
            <primitive object={mPupil} attach="material" />
          </mesh>
          {/* Main catchlight — large, top-left */}
          <mesh position={[-0.148, 0.044, 0.42]}>
            <circleGeometry args={[0.018, 10]} />
            <primitive object={mCatchL} attach="material" />
          </mesh>
          {/* Small secondary catchlight */}
          <mesh position={[-0.116, 0.001, 0.42]}>
            <circleGeometry args={[0.009, 8]} />
            <meshBasicMaterial color="rgba(255,255,255,0.7)" transparent opacity={0.7} />
          </mesh>
          {/* Upper eyelid — gives depth */}
          <mesh position={[-0.13, 0.075, 0.366]} rotation={[0.3, 0, 0]} scale={[1, 0.38, 1]}>
            <capsuleGeometry args={[0.048, 0.092, 6, 14]} />
            <primitive object={mSkin} attach="material" />
          </mesh>
          {/* Lower eyelid */}
          <mesh position={[-0.13, -0.04, 0.36]} rotation={[-0.15, 0, 0]} scale={[1, 0.28, 1]}>
            <capsuleGeometry args={[0.04, 0.08, 5, 12]} />
            <primitive object={mSkin} attach="material" />
          </mesh>
          {/* Top lash bar */}
          <mesh position={[-0.13, 0.082, 0.368]}>
            <boxGeometry args={[0.112, 0.012, 0.005]} />
            <primitive object={mHairD} attach="material" />
          </mesh>

          {/* ── RIGHT EYE ── */}
          <mesh position={[0.13, 0.022, 0.34]}>
            <sphereGeometry args={[0.116, 24, 18]} />
            <primitive object={mSkinD} attach="material" />
          </mesh>
          <mesh position={[0.13, 0.022, 0.355]}>
            <sphereGeometry args={[0.104, 24, 18]} />
            <primitive object={mWhite} attach="material" />
          </mesh>
          <mesh position={[0.13, 0.022, 0.415]}>
            <circleGeometry args={[0.072, 28]} />
            <meshBasicMaterial color="#1E1208" />
          </mesh>
          <mesh position={[0.13, 0.022, 0.414]}>
            <torusGeometry args={[0.056, 0.016, 8, 28]} />
            <meshBasicMaterial color="#5C3218" />
          </mesh>
          <mesh position={[0.13, 0.022, 0.417]}>
            <circleGeometry args={[0.04, 22]} />
            <primitive object={mPupil} attach="material" />
          </mesh>
          <mesh position={[0.148, 0.044, 0.42]}>
            <circleGeometry args={[0.018, 10]} />
            <primitive object={mCatchL} attach="material" />
          </mesh>
          <mesh position={[0.116, 0.001, 0.42]}>
            <circleGeometry args={[0.009, 8]} />
            <meshBasicMaterial color="rgba(255,255,255,0.7)" transparent opacity={0.7} />
          </mesh>
          <mesh position={[0.13, 0.075, 0.366]} rotation={[0.3, 0, 0]} scale={[1, 0.38, 1]}>
            <capsuleGeometry args={[0.048, 0.092, 6, 14]} />
            <primitive object={mSkin} attach="material" />
          </mesh>
          <mesh position={[0.13, -0.04, 0.36]} rotation={[-0.15, 0, 0]} scale={[1, 0.28, 1]}>
            <capsuleGeometry args={[0.04, 0.08, 5, 12]} />
            <primitive object={mSkin} attach="material" />
          </mesh>
          <mesh position={[0.13, 0.082, 0.368]}>
            <boxGeometry args={[0.112, 0.012, 0.005]} />
            <primitive object={mHairD} attach="material" />
          </mesh>

          {/* ── EYEBROWS — thick, arched, expressive ── */}
          {/* Left brow — inner third */}
          <mesh position={[-0.155, 0.155, 0.348]} rotation={[0, 0, 0.35]}>
            <capsuleGeometry args={[0.016, 0.052, 6, 12]} />
            <primitive object={mHairD} attach="material" />
          </mesh>
          {/* Left brow — outer third */}
          <mesh position={[-0.105, 0.168, 0.352]} rotation={[0, 0, 0.12]}>
            <capsuleGeometry args={[0.014, 0.04, 6, 10]} />
            <primitive object={mHairD} attach="material" />
          </mesh>
          {/* Right brow — inner */}
          <mesh position={[0.155, 0.155, 0.348]} rotation={[0, 0, -0.35]}>
            <capsuleGeometry args={[0.016, 0.052, 6, 12]} />
            <primitive object={mHairD} attach="material" />
          </mesh>
          {/* Right brow — outer */}
          <mesh position={[0.105, 0.168, 0.352]} rotation={[0, 0, -0.12]}>
            <capsuleGeometry args={[0.014, 0.04, 6, 10]} />
            <primitive object={mHairD} attach="material" />
          </mesh>

          {/* ── NOSE — cartoon simple, just tip ── */}
          {/* Nose bridge (very subtle) */}
          <mesh position={[0, 0.02, 0.366]}>
            <sphereGeometry args={[0.022, 12, 9]} />
            <primitive object={mSkin} attach="material" />
          </mesh>
          {/* Nose tip — slightly darker, rounded */}
          <mesh position={[0, -0.025, 0.376]}>
            <sphereGeometry args={[0.036, 16, 12]} />
            <primitive object={mSkinD} attach="material" />
          </mesh>
          {/* Left alar */}
          <mesh position={[-0.044, -0.032, 0.364]}>
            <sphereGeometry args={[0.026, 12, 9]} />
            <primitive object={mSkin} attach="material" />
          </mesh>
          {/* Right alar */}
          <mesh position={[0.044, -0.032, 0.364]}>
            <sphereGeometry args={[0.026, 12, 9]} />
            <primitive object={mSkin} attach="material" />
          </mesh>
          {/* Nostril left */}
          <mesh position={[-0.035, -0.044, 0.37]}>
            <circleGeometry args={[0.012, 8]} />
            <primitive object={mSkinB} attach="material" />
          </mesh>
          {/* Nostril right */}
          <mesh position={[0.035, -0.044, 0.37]}>
            <circleGeometry args={[0.012, 8]} />
            <primitive object={mSkinB} attach="material" />
          </mesh>

          {/* ── MOUTH — big cartoon smile ── */}
          {/* Upper lip — cupid's bow, left arc */}
          <mesh position={[-0.03, -0.1, 0.364]} rotation={[0.08, 0, 0.24]}>
            <torusGeometry args={[0.033, 0.015, 8, 18, Math.PI * 0.7]} />
            <primitive object={mLip} attach="material" />
          </mesh>
          {/* Upper lip — right arc */}
          <mesh position={[0.03, -0.1, 0.364]} rotation={[0.08, 0, -0.24]}>
            <torusGeometry args={[0.033, 0.015, 8, 18, Math.PI * 0.7]} />
            <primitive object={mLip} attach="material" />
          </mesh>
          {/* Lower lip — fuller, rounder */}
          <mesh position={[0, -0.122, 0.366]} rotation={[-0.12, 0, Math.PI]}>
            <torusGeometry args={[0.052, 0.019, 8, 22, Math.PI * 0.65]} />
            <primitive object={mLip} attach="material" />
          </mesh>
          {/* Mouth corners */}
          <mesh position={[-0.065, -0.104, 0.36]}>
            <sphereGeometry args={[0.016, 10, 8]} />
            <primitive object={mLip} attach="material" />
          </mesh>
          <mesh position={[0.065, -0.104, 0.36]}>
            <sphereGeometry args={[0.016, 10, 8]} />
            <primitive object={mLip} attach="material" />
          </mesh>
          {/* Smile line — dark mouth gap */}
          <mesh position={[0, -0.113, 0.368]}>
            <capsuleGeometry args={[0.004, 0.112, 4, 10]} />
            <meshBasicMaterial color={skin(skinColor, -2.0)} />
          </mesh>
          {/* Teeth hint — white strip visible in smile */}
          <mesh position={[0, -0.11, 0.366]}>
            <boxGeometry args={[0.065, 0.015, 0.006]} />
            <meshBasicMaterial color="#F8F4F0" />
          </mesh>

          {/* ── CHEEK BLUSH — warm glow ── */}
          <mesh position={[-0.24, -0.04, 0.3]} rotation={[0, 0.38, 0]}>
            <circleGeometry args={[0.075, 16]} />
            <meshBasicMaterial color="#E87868" transparent opacity={0.16} />
          </mesh>
          <mesh position={[0.24, -0.04, 0.3]} rotation={[0, -0.38, 0]}>
            <circleGeometry args={[0.075, 16]} />
            <meshBasicMaterial color="#E87868" transparent opacity={0.16} />
          </mesh>

          {/* ── CHIN ── */}
          <mesh position={[0, -0.265, 0.268]}>
            <sphereGeometry args={[0.08, 18, 14]} />
            <primitive object={mSkin} attach="material" />
          </mesh>

        </group>{/* /headGrp */}
      </group>{/* /upper */}
    </group>
  );
}
