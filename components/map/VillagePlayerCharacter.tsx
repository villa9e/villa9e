'use client';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─── Skin tones ───────────────────────────────────────────────────────────────
export const SKIN_TONES: Record<string, string> = {
  porcelain: '#FCECD8',
  beige:     '#F1C89A',
  olive:     '#D4A57A',
  tan:       '#C08050',
  medium:    '#A0623C',
  deep:      '#7A4228',
  rich:      '#5A2E18',
  ebony:     '#3A1C0C',
};

// ─── Constants ────────────────────────────────────────────────────────────────
const HAIR_DARK = '#0E0800';
const SHOE_COL  = '#111827';
const PANT_COL  = '#1F2937';
const SHIRT_COL = '#2563EB';

// Derive a slightly darker shade for lips/shadow from skin color
function darken(hex: string, amount = 0.25): string {
  const c = new THREE.Color(hex);
  c.r = Math.max(0, c.r - amount * 0.7);
  c.g = Math.max(0, c.g - amount * 0.8);
  c.b = Math.max(0, c.b - amount * 0.9);
  return `#${c.getHexString()}`;
}

export interface PlayerCharacterProps {
  position:     THREE.Vector3;
  rotation?:    number;
  posRef?:      React.MutableRefObject<THREE.Vector3>;
  rotRef?:      React.MutableRefObject<number>;
  skinColor?:   string;
  isLocal?:     boolean;
  username?:    string;
  isMovingRef?: React.MutableRefObject<boolean>;
}

export function PlayerCharacter({
  position,
  rotation  = 0,
  posRef,
  rotRef,
  skinColor = '#A0623C',
  isLocal   = false,
  username,
  isMovingRef,
}: PlayerCharacterProps) {
  const rootRef     = useRef<THREE.Group>(null);
  const upperRef    = useRef<THREE.Group>(null);
  const headRef     = useRef<THREE.Group>(null);
  const leftLegG    = useRef<THREE.Group>(null);
  const rightLegG   = useRef<THREE.Group>(null);
  const leftArmG    = useRef<THREE.Group>(null);
  const rightArmG   = useRef<THREE.Group>(null);
  const phase       = useRef(Math.random() * Math.PI * 2);

  const lipColor   = darken(skinColor, 0.22);
  const noseTip    = darken(skinColor, 0.04);
  const earInner   = darken(skinColor, 0.08);

  // ── Materials — phong for realistic shading, basic for iris/pupils ──
  const skinMat = useMemo(() => new THREE.MeshPhongMaterial({
    color:    skinColor,
    specular: '#2A1408',
    shininess: 28,
  }), [skinColor]);

  const shirtMat = useMemo(() => new THREE.MeshPhongMaterial({
    color:    SHIRT_COL,
    specular: '#0A0A18',
    shininess: 12,
  }), []);

  const pantMat = useMemo(() => new THREE.MeshPhongMaterial({
    color:    PANT_COL,
    specular: '#080808',
    shininess: 8,
  }), []);

  const shoeMat = useMemo(() => new THREE.MeshPhongMaterial({
    color:    SHOE_COL,
    specular: '#222222',
    shininess: 40,
  }), []);

  const hairMat = useMemo(() => new THREE.MeshPhongMaterial({
    color:    HAIR_DARK,
    specular: '#1A1008',
    shininess: 18,
  }), []);

  useFrame(({ clock }) => {
    if (!rootRef.current) return;
    const t     = clock.elapsedTime;
    const ph    = phase.current;
    const moving = isMovingRef?.current ?? false;
    const speed  = moving ? 1.0 : 0.0;
    const freq   = 5.4;

    // Position & rotation
    if (posRef?.current) rootRef.current.position.copy(posRef.current);
    else                 rootRef.current.position.copy(position);
    if (rotRef?.current !== undefined) rootRef.current.rotation.y = rotRef.current;
    else if (rotation !== undefined)   rootRef.current.rotation.y = rotation;

    // Leg swing
    const sw = speed * Math.sin(t * freq + ph) * 0.48;
    if (leftLegG.current)  leftLegG.current.rotation.x  =  sw;
    if (rightLegG.current) rightLegG.current.rotation.x = -sw;

    // Arm counter-swing
    const as = speed * Math.sin(t * freq + ph + Math.PI) * 0.26;
    if (leftArmG.current)  leftArmG.current.rotation.x  =  as;
    if (rightArmG.current) rightArmG.current.rotation.x = -as;

    // Upper body: stays at y=1.02, slight lateral sway
    if (upperRef.current) {
      upperRef.current.position.y  = 1.02 + (moving
        ? Math.abs(Math.sin(t * freq * 2 + ph)) * 0.014
        : Math.sin(t * 1.1 + ph) * 0.005);
      upperRef.current.rotation.z = speed * Math.sin(t * freq + ph) * 0.028;
    }

    // Head: stays at y=0.73 relative to upper, gentle bob
    if (headRef.current) {
      headRef.current.position.y = 0.73 + (moving
        ? Math.abs(Math.sin(t * freq * 2 + ph)) * 0.014
        : Math.sin(t * 0.85 + ph) * 0.004);
    }
  });

  return (
    <group ref={rootRef} position={position}>

      {/* Ground shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]}>
        <circleGeometry args={[0.3, 24]} />
        <meshBasicMaterial color="#000" transparent opacity={0.25} />
      </mesh>

      {/* ── LEFT LEG — pivot at hip ── */}
      <group ref={leftLegG} position={[-0.11, 0.76, 0]}>
        {/* Thigh */}
        <mesh position={[0, -0.18, 0]}>
          <capsuleGeometry args={[0.09, 0.25, 6, 14]} />
          <primitive object={pantMat} attach="material" />
        </mesh>
        {/* Knee */}
        <mesh position={[0, -0.375, 0]}>
          <sphereGeometry args={[0.092, 14, 10]} />
          <primitive object={pantMat} attach="material" />
        </mesh>
        {/* Calf */}
        <mesh position={[0, -0.545, 0]}>
          <capsuleGeometry args={[0.078, 0.21, 6, 14]} />
          <primitive object={pantMat} attach="material" />
        </mesh>
        {/* Ankle */}
        <mesh position={[0, -0.705, 0]}>
          <sphereGeometry args={[0.075, 12, 9]} />
          <primitive object={shoeMat} attach="material" />
        </mesh>
        {/* Shoe body */}
        <mesh position={[0.01, -0.745, 0.038]}>
          <boxGeometry args={[0.155, 0.1, 0.24, 2, 1, 3]} />
          <primitive object={shoeMat} attach="material" />
        </mesh>
        {/* Rounded toe */}
        <mesh position={[0.01, -0.745, 0.15]}>
          <sphereGeometry args={[0.085, 12, 8]} />
          <primitive object={shoeMat} attach="material" />
        </mesh>
        {/* White sole trim */}
        <mesh position={[0.01, -0.782, 0.038]}>
          <boxGeometry args={[0.162, 0.022, 0.252]} />
          <meshBasicMaterial color="#E0E0E0" />
        </mesh>
      </group>

      {/* ── RIGHT LEG ── */}
      <group ref={rightLegG} position={[0.11, 0.76, 0]}>
        <mesh position={[0, -0.18, 0]}>
          <capsuleGeometry args={[0.09, 0.25, 6, 14]} />
          <primitive object={pantMat} attach="material" />
        </mesh>
        <mesh position={[0, -0.375, 0]}>
          <sphereGeometry args={[0.092, 14, 10]} />
          <primitive object={pantMat} attach="material" />
        </mesh>
        <mesh position={[0, -0.545, 0]}>
          <capsuleGeometry args={[0.078, 0.21, 6, 14]} />
          <primitive object={pantMat} attach="material" />
        </mesh>
        <mesh position={[0, -0.705, 0]}>
          <sphereGeometry args={[0.075, 12, 9]} />
          <primitive object={shoeMat} attach="material" />
        </mesh>
        <mesh position={[-0.01, -0.745, 0.038]}>
          <boxGeometry args={[0.155, 0.1, 0.24, 2, 1, 3]} />
          <primitive object={shoeMat} attach="material" />
        </mesh>
        <mesh position={[-0.01, -0.745, 0.15]}>
          <sphereGeometry args={[0.085, 12, 8]} />
          <primitive object={shoeMat} attach="material" />
        </mesh>
        <mesh position={[-0.01, -0.782, 0.038]}>
          <boxGeometry args={[0.162, 0.022, 0.252]} />
          <meshBasicMaterial color="#E0E0E0" />
        </mesh>
      </group>

      {/* ── UPPER BODY — sway parent ── */}
      <group ref={upperRef} position={[0, 1.02, 0]}>

        {/* Hips */}
        <mesh position={[0, -0.24, 0]}>
          <capsuleGeometry args={[0.135, 0.11, 6, 16]} />
          <primitive object={pantMat} attach="material" />
        </mesh>

        {/* Belt */}
        <mesh position={[0, -0.145, 0]}>
          <cylinderGeometry args={[0.142, 0.142, 0.042, 22, 1, true]} />
          <meshBasicMaterial color="#0A0A0A" />
        </mesh>
        <mesh position={[0, -0.145, 0.145]}>
          <boxGeometry args={[0.058, 0.036, 0.01]} />
          <meshBasicMaterial color="#B8920A" />
        </mesh>

        {/* Torso — shirt */}
        <mesh position={[0, 0.1, 0]}>
          <capsuleGeometry args={[0.172, 0.31, 8, 18]} />
          <primitive object={shirtMat} attach="material" />
        </mesh>
        {/* Shirt collar V-neck */}
        <mesh position={[0, 0.335, 0.09]}>
          <torusGeometry args={[0.075, 0.019, 7, 20, Math.PI * 1.1]} />
          <meshBasicMaterial color="#F0F0F8" />
        </mesh>

        {/* ── LEFT ARM — pivot at shoulder ── */}
        <group ref={leftArmG} position={[-0.228, 0.23, 0]}>
          {/* Shoulder cap */}
          <mesh position={[-0.038, 0, 0]}>
            <sphereGeometry args={[0.094, 16, 12]} />
            <primitive object={shirtMat} attach="material" />
          </mesh>
          {/* Upper arm */}
          <mesh position={[-0.058, -0.175, 0]} rotation={[0, 0, 0.15]}>
            <capsuleGeometry args={[0.076, 0.205, 6, 14]} />
            <primitive object={shirtMat} attach="material" />
          </mesh>
          {/* Elbow */}
          <mesh position={[-0.076, -0.345, 0]}>
            <sphereGeometry args={[0.076, 14, 10]} />
            <primitive object={skinMat} attach="material" />
          </mesh>
          {/* Forearm */}
          <mesh position={[-0.082, -0.488, 0]} rotation={[0, 0, 0.09]}>
            <capsuleGeometry args={[0.065, 0.19, 6, 14]} />
            <primitive object={skinMat} attach="material" />
          </mesh>
          {/* Wrist */}
          <mesh position={[-0.086, -0.635, 0]}>
            <sphereGeometry args={[0.067, 12, 9]} />
            <primitive object={skinMat} attach="material" />
          </mesh>
          {/* Palm */}
          <mesh position={[-0.088, -0.695, 0]}>
            <sphereGeometry args={[0.079, 16, 12]} />
            <primitive object={skinMat} attach="material" />
          </mesh>
          {/* Thumb */}
          <mesh position={[-0.048, -0.706, 0.048]} rotation={[0.38, 0, 0.52]}>
            <capsuleGeometry args={[0.028, 0.055, 5, 8]} />
            <primitive object={skinMat} attach="material" />
          </mesh>
          {/* Finger mass */}
          <mesh position={[-0.088, -0.748, 0.024]} rotation={[0.2, 0, 0]}>
            <capsuleGeometry args={[0.045, 0.04, 5, 10]} />
            <primitive object={skinMat} attach="material" />
          </mesh>
        </group>

        {/* ── RIGHT ARM ── */}
        <group ref={rightArmG} position={[0.228, 0.23, 0]}>
          <mesh position={[0.038, 0, 0]}>
            <sphereGeometry args={[0.094, 16, 12]} />
            <primitive object={shirtMat} attach="material" />
          </mesh>
          <mesh position={[0.058, -0.175, 0]} rotation={[0, 0, -0.15]}>
            <capsuleGeometry args={[0.076, 0.205, 6, 14]} />
            <primitive object={shirtMat} attach="material" />
          </mesh>
          <mesh position={[0.076, -0.345, 0]}>
            <sphereGeometry args={[0.076, 14, 10]} />
            <primitive object={skinMat} attach="material" />
          </mesh>
          <mesh position={[0.082, -0.488, 0]} rotation={[0, 0, -0.09]}>
            <capsuleGeometry args={[0.065, 0.19, 6, 14]} />
            <primitive object={skinMat} attach="material" />
          </mesh>
          <mesh position={[0.086, -0.635, 0]}>
            <sphereGeometry args={[0.067, 12, 9]} />
            <primitive object={skinMat} attach="material" />
          </mesh>
          <mesh position={[0.088, -0.695, 0]}>
            <sphereGeometry args={[0.079, 16, 12]} />
            <primitive object={skinMat} attach="material" />
          </mesh>
          <mesh position={[0.048, -0.706, 0.048]} rotation={[0.38, 0, -0.52]}>
            <capsuleGeometry args={[0.028, 0.055, 5, 8]} />
            <primitive object={skinMat} attach="material" />
          </mesh>
          <mesh position={[0.088, -0.748, 0.024]} rotation={[0.2, 0, 0]}>
            <capsuleGeometry args={[0.045, 0.04, 5, 10]} />
            <primitive object={skinMat} attach="material" />
          </mesh>
        </group>

        {/* ── NECK ── */}
        <mesh position={[0, 0.448, 0]}>
          <capsuleGeometry args={[0.078, 0.095, 6, 14]} />
          <primitive object={skinMat} attach="material" />
        </mesh>

        {/* ── HEAD — bob parent ── */}
        <group ref={headRef} position={[0, 0.73, 0]}>

          {/* ── HEAD BASE — slightly oval (taller than wide) ── */}
          <mesh scale={[1, 1.06, 0.96]}>
            <sphereGeometry args={[0.285, 34, 26]} />
            <primitive object={skinMat} attach="material" />
          </mesh>

          {/* Jaw definition — slight widening at jaw line */}
          <mesh position={[0, -0.12, 0]} scale={[1.02, 0.4, 0.96]}>
            <sphereGeometry args={[0.285, 28, 20]} />
            <primitive object={skinMat} attach="material" />
          </mesh>

          {/* ── HAIR — Natural Coily Afro with detail ── */}
          {/* Main volume — tight afro */}
          <mesh position={[0, 0.09, -0.01]} scale={[1, 1.02, 0.98]}>
            <sphereGeometry args={[0.312, 32, 24]} />
            <primitive object={hairMat} attach="material" />
          </mesh>
          {/* Left lobe */}
          <mesh position={[-0.1, 0.06, -0.02]} scale={[0.84, 0.8, 0.84]}>
            <sphereGeometry args={[0.312, 26, 20]} />
            <primitive object={hairMat} attach="material" />
          </mesh>
          {/* Right lobe */}
          <mesh position={[0.1, 0.06, -0.02]} scale={[0.84, 0.8, 0.84]}>
            <sphereGeometry args={[0.312, 26, 20]} />
            <primitive object={hairMat} attach="material" />
          </mesh>
          {/* Back fill */}
          <mesh position={[0, 0.06, -0.06]} scale={[0.9, 0.94, 0.9]}>
            <sphereGeometry args={[0.312, 26, 20]} />
            <primitive object={hairMat} attach="material" />
          </mesh>
          {/* Hairline — front curve */}
          <mesh position={[0, -0.125, 0.25]}>
            <torusGeometry args={[0.115, 0.024, 7, 22, Math.PI * 0.88]} />
            <primitive object={hairMat} attach="material" />
          </mesh>
          {/* Sideburns */}
          <mesh position={[-0.258, -0.11, 0.075]}>
            <sphereGeometry args={[0.056, 10, 8]} />
            <primitive object={hairMat} attach="material" />
          </mesh>
          <mesh position={[0.258, -0.11, 0.075]}>
            <sphereGeometry args={[0.056, 10, 8]} />
            <primitive object={hairMat} attach="material" />
          </mesh>

          {/* ── EARS ── */}
          {/* Left ear — full anatomy */}
          <group position={[-0.278, -0.02, 0]}>
            <mesh>
              <sphereGeometry args={[0.075, 16, 12]} />
              <primitive object={skinMat} attach="material" />
            </mesh>
            {/* Ear canal indent */}
            <mesh position={[0.04, 0, 0]}>
              <sphereGeometry args={[0.038, 10, 8]} />
              <primitive object={skinMat} attach="material" />
            </mesh>
          </group>
          {/* Right ear */}
          <group position={[0.278, -0.02, 0]}>
            <mesh>
              <sphereGeometry args={[0.075, 16, 12]} />
              <primitive object={skinMat} attach="material" />
            </mesh>
            <mesh position={[-0.04, 0, 0]}>
              <sphereGeometry args={[0.038, 10, 8]} />
              <primitive object={skinMat} attach="material" />
            </mesh>
          </group>

          {/* ── FOREHEAD — subtle brow ridge ── */}
          <mesh position={[0, 0.14, 0.245]}>
            <capsuleGeometry args={[0.155, 0.1, 5, 16]} />
            <primitive object={skinMat} attach="material" />
          </mesh>

          {/* ── LEFT EYE — large, expressive ── */}
          <group position={[-0.092, 0.052, 0.0]}>
            {/* Eye socket shadow */}
            <mesh position={[0, 0, 0.245]}>
              <sphereGeometry args={[0.078, 18, 14]} />
              <meshPhongMaterial color={darken(skinColor, 0.06)} specular="#000" shininess={5} />
            </mesh>
            {/* Sclera (white) */}
            <mesh position={[0, 0, 0.26]}>
              <sphereGeometry args={[0.068, 18, 14]} />
              <meshPhongMaterial color="#FFFCF5" specular="#CCCCCC" shininess={60} />
            </mesh>
            {/* Iris — rich brown */}
            <mesh position={[0, 0, 0.289]}>
              <circleGeometry args={[0.046, 22]} />
              <meshBasicMaterial color="#2C1A0A" />
            </mesh>
            {/* Pupil */}
            <mesh position={[0, 0, 0.291]}>
              <circleGeometry args={[0.025, 16]} />
              <meshBasicMaterial color="#060200" />
            </mesh>
            {/* Main catchlight — top-left */}
            <mesh position={[-0.012, 0.016, 0.294]}>
              <circleGeometry args={[0.011, 8]} />
              <meshBasicMaterial color="#FFFFFF" />
            </mesh>
            {/* Secondary catchlight — bottom-right */}
            <mesh position={[0.01, -0.01, 0.294]}>
              <circleGeometry args={[0.006, 6]} />
              <meshBasicMaterial color="rgba(255,255,255,0.65)" transparent opacity={0.65} />
            </mesh>
            {/* Upper eyelid */}
            <mesh position={[0, 0.055, 0.272]} rotation={[0.24, 0, 0]} scale={[1, 0.4, 1]}>
              <capsuleGeometry args={[0.04, 0.075, 5, 12]} />
              <primitive object={skinMat} attach="material" />
            </mesh>
            {/* Lower eyelid */}
            <mesh position={[0, -0.038, 0.272]} rotation={[-0.12, 0, 0]} scale={[1, 0.35, 1]}>
              <capsuleGeometry args={[0.034, 0.065, 5, 10]} />
              <primitive object={skinMat} attach="material" />
            </mesh>
            {/* Lash line — top */}
            <mesh position={[0, 0.06, 0.274]} rotation={[0, 0, 0]}>
              <boxGeometry args={[0.085, 0.01, 0.004]} />
              <meshBasicMaterial color={HAIR_DARK} />
            </mesh>
          </group>

          {/* ── RIGHT EYE ── */}
          <group position={[0.092, 0.052, 0.0]}>
            <mesh position={[0, 0, 0.245]}>
              <sphereGeometry args={[0.078, 18, 14]} />
              <meshPhongMaterial color={darken(skinColor, 0.06)} specular="#000" shininess={5} />
            </mesh>
            <mesh position={[0, 0, 0.26]}>
              <sphereGeometry args={[0.068, 18, 14]} />
              <meshPhongMaterial color="#FFFCF5" specular="#CCCCCC" shininess={60} />
            </mesh>
            <mesh position={[0, 0, 0.289]}>
              <circleGeometry args={[0.046, 22]} />
              <meshBasicMaterial color="#2C1A0A" />
            </mesh>
            <mesh position={[0, 0, 0.291]}>
              <circleGeometry args={[0.025, 16]} />
              <meshBasicMaterial color="#060200" />
            </mesh>
            <mesh position={[0.012, 0.016, 0.294]}>
              <circleGeometry args={[0.011, 8]} />
              <meshBasicMaterial color="#FFFFFF" />
            </mesh>
            <mesh position={[-0.01, -0.01, 0.294]}>
              <circleGeometry args={[0.006, 6]} />
              <meshBasicMaterial color="rgba(255,255,255,0.65)" transparent opacity={0.65} />
            </mesh>
            <mesh position={[0, 0.055, 0.272]} rotation={[0.24, 0, 0]} scale={[1, 0.4, 1]}>
              <capsuleGeometry args={[0.04, 0.075, 5, 12]} />
              <primitive object={skinMat} attach="material" />
            </mesh>
            <mesh position={[0, -0.038, 0.272]} rotation={[-0.12, 0, 0]} scale={[1, 0.35, 1]}>
              <capsuleGeometry args={[0.034, 0.065, 5, 10]} />
              <primitive object={skinMat} attach="material" />
            </mesh>
            <mesh position={[0, 0.06, 0.274]}>
              <boxGeometry args={[0.085, 0.01, 0.004]} />
              <meshBasicMaterial color={HAIR_DARK} />
            </mesh>
          </group>

          {/* ── EYEBROWS — arched, natural shape ── */}
          {/* Left eyebrow — 3 segments for arch */}
          <mesh position={[-0.108, 0.128, 0.265]} rotation={[0, 0, 0.28]}>
            <capsuleGeometry args={[0.012, 0.044, 5, 10]} />
            <meshBasicMaterial color={HAIR_DARK} />
          </mesh>
          <mesh position={[-0.068, 0.138, 0.268]} rotation={[0, 0, 0.08]}>
            <capsuleGeometry args={[0.011, 0.032, 5, 8]} />
            <meshBasicMaterial color={HAIR_DARK} />
          </mesh>
          {/* Right eyebrow */}
          <mesh position={[0.108, 0.128, 0.265]} rotation={[0, 0, -0.28]}>
            <capsuleGeometry args={[0.012, 0.044, 5, 10]} />
            <meshBasicMaterial color={HAIR_DARK} />
          </mesh>
          <mesh position={[0.068, 0.138, 0.268]} rotation={[0, 0, -0.08]}>
            <capsuleGeometry args={[0.011, 0.032, 5, 8]} />
            <meshBasicMaterial color={HAIR_DARK} />
          </mesh>

          {/* ── NOSE — full bridge + tip + nostrils ── */}
          {/* Bridge top */}
          <mesh position={[0, 0.04, 0.267]}>
            <sphereGeometry args={[0.022, 12, 9]} />
            <primitive object={skinMat} attach="material" />
          </mesh>
          {/* Bridge mid */}
          <mesh position={[0, 0.01, 0.273]}>
            <sphereGeometry args={[0.026, 12, 9]} />
            <primitive object={skinMat} attach="material" />
          </mesh>
          {/* Tip */}
          <mesh position={[0, -0.022, 0.28]}>
            <sphereGeometry args={[0.038, 16, 12]} />
            <meshPhongMaterial color={noseTip} specular="#0A0A0A" shininess={20} />
          </mesh>
          {/* Left alar wing */}
          <mesh position={[-0.04, -0.03, 0.268]}>
            <sphereGeometry args={[0.026, 12, 9]} />
            <primitive object={skinMat} attach="material" />
          </mesh>
          {/* Right alar wing */}
          <mesh position={[0.04, -0.03, 0.268]}>
            <sphereGeometry args={[0.026, 12, 9]} />
            <primitive object={skinMat} attach="material" />
          </mesh>
          {/* Nostril left */}
          <mesh position={[-0.032, -0.042, 0.272]}>
            <circleGeometry args={[0.013, 8]} />
            <meshBasicMaterial color="#1A0800" />
          </mesh>
          {/* Nostril right */}
          <mesh position={[0.032, -0.042, 0.272]}>
            <circleGeometry args={[0.013, 8]} />
            <meshBasicMaterial color="#1A0800" />
          </mesh>

          {/* ── MOUTH — full lips with philtrum ── */}
          {/* Philtrum groove */}
          <mesh position={[0, -0.068, 0.272]}>
            <capsuleGeometry args={[0.005, 0.016, 4, 6]} />
            <meshBasicMaterial color={darken(skinColor, 0.12)} />
          </mesh>
          {/* Upper lip — cupid's bow shape — left arc */}
          <mesh position={[-0.026, -0.079, 0.271]} rotation={[0.06, 0, 0.22]}>
            <torusGeometry args={[0.028, 0.014, 7, 16, Math.PI * 0.7]} />
            <meshPhongMaterial color={lipColor} specular="#1A0808" shininess={35} />
          </mesh>
          {/* Upper lip — right arc */}
          <mesh position={[0.026, -0.079, 0.271]} rotation={[0.06, 0, -0.22]}>
            <torusGeometry args={[0.028, 0.014, 7, 16, Math.PI * 0.7]} />
            <meshPhongMaterial color={lipColor} specular="#1A0808" shininess={35} />
          </mesh>
          {/* Lower lip — fuller */}
          <mesh position={[0, -0.099, 0.272]} rotation={[-0.1, 0, Math.PI]}>
            <torusGeometry args={[0.046, 0.018, 8, 20, Math.PI * 0.66]} />
            <meshPhongMaterial color={darken(lipColor, -0.04)} specular="#1A0808" shininess={40} />
          </mesh>
          {/* Mouth corners */}
          <mesh position={[-0.058, -0.082, 0.267]}>
            <sphereGeometry args={[0.015, 8, 6]} />
            <meshPhongMaterial color={lipColor} specular="#0A0808" shininess={25} />
          </mesh>
          <mesh position={[0.058, -0.082, 0.267]}>
            <sphereGeometry args={[0.015, 8, 6]} />
            <meshPhongMaterial color={lipColor} specular="#0A0808" shininess={25} />
          </mesh>
          {/* Mouth line — slight smile */}
          <mesh position={[0, -0.088, 0.273]} rotation={[0, 0, 0]}>
            <capsuleGeometry args={[0.003, 0.1, 4, 8]} />
            <meshBasicMaterial color={darken(lipColor, 0.15)} />
          </mesh>

          {/* ── CHEEK BLUSH — subtle, realistic ── */}
          <mesh position={[-0.168, -0.012, 0.236]} rotation={[0, 0.25, 0]}>
            <circleGeometry args={[0.06, 14]} />
            <meshBasicMaterial color="#E07868" transparent opacity={0.12} />
          </mesh>
          <mesh position={[0.168, -0.012, 0.236]} rotation={[0, -0.25, 0]}>
            <circleGeometry args={[0.06, 14]} />
            <meshBasicMaterial color="#E07868" transparent opacity={0.12} />
          </mesh>

          {/* ── CHIN ── */}
          <mesh position={[0, -0.225, 0.218]}>
            <sphereGeometry args={[0.075, 14, 10]} />
            <primitive object={skinMat} attach="material" />
          </mesh>

        </group>{/* /headRef */}
      </group>{/* /upperRef */}
    </group>
  );
}
