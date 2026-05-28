'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─── Skin palette ─────────────────────────────────────────────────────────────
export const SKIN_TONES: Record<string, string> = {
  porcelain: '#F8DCC8',
  beige:     '#E8C4A0',
  olive:     '#C89A70',
  tan:       '#A07040',
  medium:    '#8D5524',
  deep:      '#6A3A18',
  rich:      '#4A2210',
  ebony:     '#2D1008',
};

const HAIR   = '#100800';
const SHOES  = '#0D0F14';
const SHIRT  = '#1E3A8A';  // navy
const PANTS  = '#1F2937';  // charcoal
const LIP    = '#6B2E22';

export interface PlayerCharacterProps {
  position:    THREE.Vector3;
  rotation?:   number;
  posRef?:     React.MutableRefObject<THREE.Vector3>;
  rotRef?:     React.MutableRefObject<number>;
  skinColor?:  string;
  isLocal?:    boolean;
  username?:   string;
  isMovingRef?: React.MutableRefObject<boolean>;
}

export function PlayerCharacter({
  position,
  rotation = 0,
  posRef,
  rotRef,
  skinColor = '#8D5524',
  isLocal   = false,
  username,
  isMovingRef,
}: PlayerCharacterProps) {
  const rootRef      = useRef<THREE.Group>(null);
  const upperRef     = useRef<THREE.Group>(null);
  const headRef      = useRef<THREE.Group>(null);
  const leftLegRef   = useRef<THREE.Group>(null);
  const rightLegRef  = useRef<THREE.Group>(null);
  const leftArmRef   = useRef<THREE.Group>(null);
  const rightArmRef  = useRef<THREE.Group>(null);
  const phase        = useRef(Math.random() * Math.PI * 2);

  useFrame(({ clock }) => {
    if (!rootRef.current) return;
    const t      = clock.elapsedTime;
    const ph     = phase.current;
    const moving = isMovingRef?.current ?? false;
    const speed  = moving ? 1.0 : 0.0;
    const freq   = 5.6;

    // ── Sync world position & rotation ──
    if (posRef?.current) rootRef.current.position.copy(posRef.current);
    else                 rootRef.current.position.copy(position);
    if (rotRef?.current !== undefined) rootRef.current.rotation.y = rotRef.current;
    else if (rotation !== undefined)   rootRef.current.rotation.y = rotation;

    // ── Leg swing ──
    const swing = speed * Math.sin(t * freq + ph) * 0.50;
    if (leftLegRef.current)  leftLegRef.current.rotation.x  =  swing;
    if (rightLegRef.current) rightLegRef.current.rotation.x = -swing;

    // ── Arm counter-swing ──
    const armSwing = speed * Math.sin(t * freq + ph + Math.PI) * 0.28;
    if (leftArmRef.current)  leftArmRef.current.rotation.x  =  armSwing;
    if (rightArmRef.current) rightArmRef.current.rotation.x = -armSwing;

    // ── Upper body sway + idle breathe ──
    if (upperRef.current) {
      upperRef.current.rotation.z = speed * Math.sin(t * freq + ph) * 0.032;
      upperRef.current.position.y = moving
        ? Math.abs(Math.sin(t * freq * 2 + ph)) * 0.016
        : Math.sin(t * 1.1 + ph) * 0.006; // gentle breathing
    }

    // ── Head bob ──
    if (headRef.current) {
      headRef.current.position.y = moving
        ? 0 + Math.abs(Math.sin(t * freq * 2 + ph)) * 0.016
        : 0;
    }
  });

  return (
    <group ref={rootRef} position={position}>

      {/* ── Ground shadow ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <circleGeometry args={[0.29, 28]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.22} />
      </mesh>

      {/* ── LEFT LEG — pivot at hip joint ── */}
      <group ref={leftLegRef} position={[-0.108, 0.78, 0]}>
        {/* Upper leg */}
        <mesh position={[0, -0.175, 0]}>
          <capsuleGeometry args={[0.088, 0.23, 8, 16]} />
          <meshToonMaterial color={PANTS} />
        </mesh>
        {/* Knee */}
        <mesh position={[0, -0.365, 0]}>
          <sphereGeometry args={[0.09, 16, 12]} />
          <meshToonMaterial color={PANTS} />
        </mesh>
        {/* Lower leg */}
        <mesh position={[0, -0.535, 0]}>
          <capsuleGeometry args={[0.076, 0.21, 8, 16]} />
          <meshToonMaterial color={PANTS} />
        </mesh>
        {/* Shoe body */}
        <mesh position={[0.01, -0.715, 0.042]}>
          <boxGeometry args={[0.152, 0.095, 0.235, 2, 1, 3]} />
          <meshToonMaterial color={SHOES} />
        </mesh>
        {/* Shoe rounded toe */}
        <mesh position={[0.01, -0.715, 0.148]}>
          <sphereGeometry args={[0.088, 14, 10]} />
          <meshToonMaterial color={SHOES} />
        </mesh>
        {/* Sole trim */}
        <mesh position={[0.01, -0.755, 0.042]}>
          <boxGeometry args={[0.16, 0.022, 0.25, 2, 1, 3]} />
          <meshToonMaterial color="#CCCCCC" />
        </mesh>
      </group>

      {/* ── RIGHT LEG ── */}
      <group ref={rightLegRef} position={[0.108, 0.78, 0]}>
        <mesh position={[0, -0.175, 0]}>
          <capsuleGeometry args={[0.088, 0.23, 8, 16]} />
          <meshToonMaterial color={PANTS} />
        </mesh>
        <mesh position={[0, -0.365, 0]}>
          <sphereGeometry args={[0.09, 16, 12]} />
          <meshToonMaterial color={PANTS} />
        </mesh>
        <mesh position={[0, -0.535, 0]}>
          <capsuleGeometry args={[0.076, 0.21, 8, 16]} />
          <meshToonMaterial color={PANTS} />
        </mesh>
        <mesh position={[-0.01, -0.715, 0.042]}>
          <boxGeometry args={[0.152, 0.095, 0.235, 2, 1, 3]} />
          <meshToonMaterial color={SHOES} />
        </mesh>
        <mesh position={[-0.01, -0.715, 0.148]}>
          <sphereGeometry args={[0.088, 14, 10]} />
          <meshToonMaterial color={SHOES} />
        </mesh>
        <mesh position={[-0.01, -0.755, 0.042]}>
          <boxGeometry args={[0.16, 0.022, 0.25, 2, 1, 3]} />
          <meshToonMaterial color="#CCCCCC" />
        </mesh>
      </group>

      {/* ── UPPER BODY — sway parent ── */}
      <group ref={upperRef} position={[0, 1.02, 0]}>

        {/* Hips / belt area */}
        <mesh position={[0, -0.22, 0]}>
          <capsuleGeometry args={[0.132, 0.1, 8, 18]} />
          <meshToonMaterial color={PANTS} />
        </mesh>
        {/* Belt */}
        <mesh position={[0, -0.13, 0]}>
          <cylinderGeometry args={[0.138, 0.138, 0.045, 24, 1, true]} />
          <meshToonMaterial color="#0A0A0A" />
        </mesh>
        {/* Belt buckle */}
        <mesh position={[0, -0.13, 0.14]}>
          <boxGeometry args={[0.055, 0.038, 0.012]} />
          <meshToonMaterial color="#C0A020" />
        </mesh>

        {/* Torso — shirt */}
        <mesh position={[0, 0.1, 0]}>
          <capsuleGeometry args={[0.17, 0.3, 10, 20]} />
          <meshToonMaterial color={SHIRT} />
        </mesh>
        {/* Chest detail — shirt texture bands */}
        <mesh position={[0, 0.06, 0.172]}>
          <boxGeometry args={[0.28, 0.25, 0.01, 2, 3, 1]} />
          <meshToonMaterial color="#1A3278" />
        </mesh>
        {/* Collar */}
        <mesh position={[0, 0.32, 0.085]}>
          <torusGeometry args={[0.077, 0.02, 8, 22, Math.PI * 1.15]} />
          <meshToonMaterial color="#F0F0F0" />
        </mesh>

        {/* ── LEFT ARM — pivot at shoulder ── */}
        <group ref={leftArmRef} position={[-0.225, 0.22, 0]}>
          {/* Shoulder cap */}
          <mesh position={[-0.038, 0, 0]}>
            <sphereGeometry args={[0.092, 18, 14]} />
            <meshToonMaterial color={SHIRT} />
          </mesh>
          {/* Upper arm */}
          <mesh position={[-0.055, -0.165, 0]} rotation={[0, 0, 0.16]}>
            <capsuleGeometry args={[0.074, 0.2, 8, 16]} />
            <meshToonMaterial color={SHIRT} />
          </mesh>
          {/* Elbow */}
          <mesh position={[-0.072, -0.325, 0]}>
            <sphereGeometry args={[0.074, 16, 12]} />
            <meshToonMaterial color={skinColor} />
          </mesh>
          {/* Forearm */}
          <mesh position={[-0.078, -0.465, 0]} rotation={[0, 0, 0.09]}>
            <capsuleGeometry args={[0.063, 0.185, 8, 16]} />
            <meshToonMaterial color={skinColor} />
          </mesh>
          {/* Wrist */}
          <mesh position={[-0.082, -0.602, 0]}>
            <sphereGeometry args={[0.065, 14, 10]} />
            <meshToonMaterial color={skinColor} />
          </mesh>
          {/* Hand — palm */}
          <mesh position={[-0.084, -0.655, 0]}>
            <sphereGeometry args={[0.076, 18, 14]} />
            <meshToonMaterial color={skinColor} />
          </mesh>
          {/* Thumb */}
          <mesh position={[-0.044, -0.664, 0.044]} rotation={[0.35, 0, 0.55]}>
            <capsuleGeometry args={[0.026, 0.055, 6, 10]} />
            <meshToonMaterial color={skinColor} />
          </mesh>
          {/* Finger mass */}
          <mesh position={[-0.084, -0.71, 0.022]} rotation={[0.2, 0, 0.05]}>
            <capsuleGeometry args={[0.044, 0.04, 6, 12]} />
            <meshToonMaterial color={skinColor} />
          </mesh>
        </group>

        {/* ── RIGHT ARM ── */}
        <group ref={rightArmRef} position={[0.225, 0.22, 0]}>
          <mesh position={[0.038, 0, 0]}>
            <sphereGeometry args={[0.092, 18, 14]} />
            <meshToonMaterial color={SHIRT} />
          </mesh>
          <mesh position={[0.055, -0.165, 0]} rotation={[0, 0, -0.16]}>
            <capsuleGeometry args={[0.074, 0.2, 8, 16]} />
            <meshToonMaterial color={SHIRT} />
          </mesh>
          <mesh position={[0.072, -0.325, 0]}>
            <sphereGeometry args={[0.074, 16, 12]} />
            <meshToonMaterial color={skinColor} />
          </mesh>
          <mesh position={[0.078, -0.465, 0]} rotation={[0, 0, -0.09]}>
            <capsuleGeometry args={[0.063, 0.185, 8, 16]} />
            <meshToonMaterial color={skinColor} />
          </mesh>
          <mesh position={[0.082, -0.602, 0]}>
            <sphereGeometry args={[0.065, 14, 10]} />
            <meshToonMaterial color={skinColor} />
          </mesh>
          <mesh position={[0.084, -0.655, 0]}>
            <sphereGeometry args={[0.076, 18, 14]} />
            <meshToonMaterial color={skinColor} />
          </mesh>
          <mesh position={[0.044, -0.664, 0.044]} rotation={[0.35, 0, -0.55]}>
            <capsuleGeometry args={[0.026, 0.055, 6, 10]} />
            <meshToonMaterial color={skinColor} />
          </mesh>
          <mesh position={[0.084, -0.71, 0.022]} rotation={[0.2, 0, -0.05]}>
            <capsuleGeometry args={[0.044, 0.04, 6, 12]} />
            <meshToonMaterial color={skinColor} />
          </mesh>
        </group>

        {/* ── NECK ── */}
        <mesh position={[0, 0.43, 0]}>
          <capsuleGeometry args={[0.075, 0.09, 8, 16]} />
          <meshToonMaterial color={skinColor} />
        </mesh>

        {/* ── HEAD — pivot for bob ── */}
        <group ref={headRef} position={[0, 0.73, 0]}>

          {/* Head base */}
          <mesh castShadow>
            <sphereGeometry args={[0.278, 34, 26]} />
            <meshToonMaterial color={skinColor} />
          </mesh>

          {/* ── HAIR — Natural Coily Afro ── */}
          {/* Main volume */}
          <mesh position={[0, 0.072, -0.01]}>
            <sphereGeometry args={[0.306, 30, 22]} />
            <meshToonMaterial color={HAIR} />
          </mesh>
          {/* Left lobe — makes it wider */}
          <mesh position={[-0.09, 0.055, -0.02]} scale={[0.82, 0.78, 0.82]}>
            <sphereGeometry args={[0.3, 24, 18]} />
            <meshToonMaterial color={HAIR} />
          </mesh>
          {/* Right lobe */}
          <mesh position={[0.09, 0.055, -0.02]} scale={[0.82, 0.78, 0.82]}>
            <sphereGeometry args={[0.3, 24, 18]} />
            <meshToonMaterial color={HAIR} />
          </mesh>
          {/* Back roundness */}
          <mesh position={[0, 0.06, -0.05]} scale={[0.88, 0.92, 0.88]}>
            <sphereGeometry args={[0.3, 24, 18]} />
            <meshToonMaterial color={HAIR} />
          </mesh>
          {/* Hairline front edge */}
          <mesh position={[0, -0.115, 0.245]}>
            <torusGeometry args={[0.115, 0.025, 8, 22, Math.PI * 0.85]} />
            <meshToonMaterial color={HAIR} />
          </mesh>
          {/* Sideburn left */}
          <mesh position={[-0.25, -0.105, 0.08]}>
            <sphereGeometry args={[0.058, 12, 9]} />
            <meshToonMaterial color={HAIR} />
          </mesh>
          {/* Sideburn right */}
          <mesh position={[0.25, -0.105, 0.08]}>
            <sphereGeometry args={[0.058, 12, 9]} />
            <meshToonMaterial color={HAIR} />
          </mesh>

          {/* ── EARS ── */}
          {/* Left ear */}
          <mesh position={[-0.272, -0.018, 0]}>
            <sphereGeometry args={[0.071, 16, 12]} />
            <meshToonMaterial color={skinColor} />
          </mesh>
          {/* Left ear inner */}
          <mesh position={[-0.29, -0.018, 0.01]}>
            <sphereGeometry args={[0.04, 12, 8]} />
            <meshToonMaterial color={skinColor === '#F8DCC8' ? '#E8A898' : skinColor} />
          </mesh>
          {/* Right ear */}
          <mesh position={[0.272, -0.018, 0]}>
            <sphereGeometry args={[0.071, 16, 12]} />
            <meshToonMaterial color={skinColor} />
          </mesh>
          <mesh position={[0.29, -0.018, 0.01]}>
            <sphereGeometry args={[0.04, 12, 8]} />
            <meshToonMaterial color={skinColor === '#F8DCC8' ? '#E8A898' : skinColor} />
          </mesh>

          {/* ── LEFT EYE ── */}
          {/* Sclera (white) */}
          <mesh position={[-0.091, 0.038, 0.248]}>
            <sphereGeometry args={[0.068, 20, 16]} />
            <meshToonMaterial color="#FFFEF6" />
          </mesh>
          {/* Iris */}
          <mesh position={[-0.091, 0.038, 0.279]}>
            <circleGeometry args={[0.044, 22]} />
            <meshBasicMaterial color="#2C1A0E" side={THREE.FrontSide} />
          </mesh>
          {/* Pupil */}
          <mesh position={[-0.091, 0.038, 0.281]}>
            <circleGeometry args={[0.024, 16]} />
            <meshBasicMaterial color="#050201" />
          </mesh>
          {/* Main catchlight */}
          <mesh position={[-0.076, 0.052, 0.283]}>
            <circleGeometry args={[0.01, 8]} />
            <meshBasicMaterial color="#FFFFFF" />
          </mesh>
          {/* Secondary catchlight */}
          <mesh position={[-0.101, 0.026, 0.283]}>
            <circleGeometry args={[0.006, 6]} />
            <meshBasicMaterial color="#FFFFFFBB" transparent opacity={0.7} />
          </mesh>
          {/* Upper eyelid */}
          <mesh position={[-0.091, 0.064, 0.269]} rotation={[0.22, 0, 0]}>
            <capsuleGeometry args={[0.036, 0.07, 6, 14]} />
            <meshToonMaterial color={skinColor} />
          </mesh>
          {/* Lower eyelid shadow */}
          <mesh position={[-0.091, 0.014, 0.265]}>
            <capsuleGeometry args={[0.028, 0.065, 5, 12]} />
            <meshBasicMaterial color="#00000022" transparent opacity={0.15} />
          </mesh>

          {/* ── RIGHT EYE ── */}
          <mesh position={[0.091, 0.038, 0.248]}>
            <sphereGeometry args={[0.068, 20, 16]} />
            <meshToonMaterial color="#FFFEF6" />
          </mesh>
          <mesh position={[0.091, 0.038, 0.279]}>
            <circleGeometry args={[0.044, 22]} />
            <meshBasicMaterial color="#2C1A0E" side={THREE.FrontSide} />
          </mesh>
          <mesh position={[0.091, 0.038, 0.281]}>
            <circleGeometry args={[0.024, 16]} />
            <meshBasicMaterial color="#050201" />
          </mesh>
          <mesh position={[0.106, 0.052, 0.283]}>
            <circleGeometry args={[0.01, 8]} />
            <meshBasicMaterial color="#FFFFFF" />
          </mesh>
          <mesh position={[0.078, 0.026, 0.283]}>
            <circleGeometry args={[0.006, 6]} />
            <meshBasicMaterial color="#FFFFFFBB" transparent opacity={0.7} />
          </mesh>
          <mesh position={[0.091, 0.064, 0.269]} rotation={[0.22, 0, 0]}>
            <capsuleGeometry args={[0.036, 0.07, 6, 14]} />
            <meshToonMaterial color={skinColor} />
          </mesh>
          <mesh position={[0.091, 0.014, 0.265]}>
            <capsuleGeometry args={[0.028, 0.065, 5, 12]} />
            <meshBasicMaterial color="#00000022" transparent opacity={0.15} />
          </mesh>

          {/* ── EYEBROWS — arched, expressive ── */}
          <mesh position={[-0.091, 0.118, 0.264]} rotation={[0, 0, 0.24]}>
            <capsuleGeometry args={[0.013, 0.068, 6, 12]} />
            <meshBasicMaterial color={HAIR} />
          </mesh>
          <mesh position={[0.091, 0.118, 0.264]} rotation={[0, 0, -0.24]}>
            <capsuleGeometry args={[0.013, 0.068, 6, 12]} />
            <meshBasicMaterial color={HAIR} />
          </mesh>

          {/* ── NOSE ── */}
          {/* Bridge */}
          <mesh position={[0, 0.022, 0.264]}>
            <sphereGeometry args={[0.024, 12, 9]} />
            <meshToonMaterial color={skinColor} />
          </mesh>
          {/* Tip */}
          <mesh position={[0, -0.02, 0.273]}>
            <sphereGeometry args={[0.036, 16, 12]} />
            <meshToonMaterial color={skinColor} />
          </mesh>
          {/* Left nostril */}
          <mesh position={[-0.035, -0.027, 0.262]}>
            <sphereGeometry args={[0.023, 12, 9]} />
            <meshToonMaterial color={skinColor} />
          </mesh>
          {/* Right nostril */}
          <mesh position={[0.035, -0.027, 0.262]}>
            <sphereGeometry args={[0.023, 12, 9]} />
            <meshToonMaterial color={skinColor} />
          </mesh>
          {/* Nostril openings (dark) */}
          <mesh position={[-0.028, -0.038, 0.268]}>
            <circleGeometry args={[0.012, 8]} />
            <meshBasicMaterial color="#1A0800" />
          </mesh>
          <mesh position={[0.028, -0.038, 0.268]}>
            <circleGeometry args={[0.012, 8]} />
            <meshBasicMaterial color="#1A0800" />
          </mesh>

          {/* ── MOUTH / LIPS ── */}
          {/* Lip line / philtrum */}
          <mesh position={[0, -0.066, 0.268]}>
            <capsuleGeometry args={[0.005, 0.016, 5, 8]} />
            <meshBasicMaterial color={LIP} />
          </mesh>
          {/* Upper lip — cupid's bow */}
          <mesh position={[-0.022, -0.075, 0.266]} rotation={[0.06, 0, 0.18]}>
            <torusGeometry args={[0.026, 0.014, 8, 16, Math.PI * 0.72]} />
            <meshToonMaterial color={LIP} />
          </mesh>
          <mesh position={[0.022, -0.075, 0.266]} rotation={[0.06, 0, -0.18]}>
            <torusGeometry args={[0.026, 0.014, 8, 16, Math.PI * 0.72]} />
            <meshToonMaterial color={LIP} />
          </mesh>
          {/* Lower lip — full */}
          <mesh position={[0, -0.096, 0.268]} rotation={[-0.1, 0, Math.PI]}>
            <torusGeometry args={[0.044, 0.018, 8, 20, Math.PI * 0.68]} />
            <meshToonMaterial color="#7A3828" />
          </mesh>
          {/* Smile corners */}
          <mesh position={[-0.056, -0.08, 0.264]}>
            <sphereGeometry args={[0.014, 8, 7]} />
            <meshToonMaterial color={LIP} />
          </mesh>
          <mesh position={[0.056, -0.08, 0.264]}>
            <sphereGeometry args={[0.014, 8, 7]} />
            <meshToonMaterial color={LIP} />
          </mesh>

          {/* ── CHEEK BLUSH ── */}
          <mesh position={[-0.162, -0.008, 0.232]} rotation={[0, 0.25, 0]}>
            <circleGeometry args={[0.056, 16]} />
            <meshBasicMaterial color="#E07060" transparent opacity={0.14} />
          </mesh>
          <mesh position={[0.162, -0.008, 0.232]} rotation={[0, -0.25, 0]}>
            <circleGeometry args={[0.056, 16]} />
            <meshBasicMaterial color="#E07060" transparent opacity={0.14} />
          </mesh>

          {/* ── CHIN definition ── */}
          <mesh position={[0, -0.205, 0.22]}>
            <sphereGeometry args={[0.072, 14, 10]} />
            <meshToonMaterial color={skinColor} />
          </mesh>

        </group>{/* /headRef */}
      </group>{/* /upperRef */}
    </group>
  );
}
