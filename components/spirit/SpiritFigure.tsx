'use client';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const SPIRIT_VARIANTS = [
  {
    id: 'blue' as const,
    label: 'Spirit Blue',
    color: '#6BA8FF',
    bodyDark: '#4A85E8',
    emissive: '#1A3A8F',
    eyeColor: '#0A0A12',
    glowColor: '#3B82F6',
    desc: 'The default Spirit — calm, curious, and connected.',
  },
  {
    id: 'white' as const,
    label: 'Spirit White',
    color: '#E8ECFF',
    bodyDark: '#BCC5E8',
    emissive: '#8892B0',
    eyeColor: '#0A0A12',
    glowColor: '#94A3B8',
    desc: 'Pure presence — light, open, and clear-minded.',
  },
  {
    id: 'dark' as const,
    label: 'Spirit Dark',
    color: '#1E1B3A',
    bodyDark: '#0F0C20',
    emissive: '#3B1FA8',
    eyeColor: '#0A0A12',
    glowColor: '#4C1D95',
    desc: 'Deep soul — wise, protective, and powerful.',
  },
] as const;

export type SpiritVariantId = typeof SPIRIT_VARIANTS[number]['id'];

interface SpiritFigureProps {
  variant: SpiritVariantId;
  selected?: boolean;
  hovered?: boolean;
  index?: number;     // for staggered float timing
  scale?: number;
}

export function SpiritFigure({ variant, selected = false, hovered = false, index = 0, scale = 1 }: SpiritFigureProps) {
  const groupRef = useRef<THREE.Group>(null);
  const glowRef  = useRef<THREE.Mesh>(null);
  const v = SPIRIT_VARIANTS.find(s => s.id === variant) ?? SPIRIT_VARIANTS[0];

  // Body geometry — capsule stretched vertically, flattened in Z
  const bodyGeo = useMemo(() => {
    const g = new THREE.CapsuleGeometry(0.42, 0.28, 20, 28);
    g.computeVertexNormals();
    return g;
  }, []);

  // Eye geometry
  const eyeGeo = useMemo(() => {
    const g = new THREE.SphereGeometry(0.105, 16, 14);
    g.computeVertexNormals();
    return g;
  }, []);

  // Eye highlight geometry
  const hlGeo = useMemo(() => {
    const g = new THREE.SphereGeometry(0.034, 8, 6);
    g.computeVertexNormals();
    return g;
  }, []);

  // Smile: a partial torus arc
  const smileGeo = useMemo(() => {
    const g = new THREE.TorusGeometry(0.085, 0.013, 8, 18, Math.PI * 0.68);
    g.computeVertexNormals();
    return g;
  }, []);

  // Foot geometry
  const footGeo = useMemo(() => {
    const g = new THREE.SphereGeometry(0.11, 12, 10);
    g.computeVertexNormals();
    return g;
  }, []);

  useFrame(state => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime + index * 1.1;
    groupRef.current.position.y = Math.sin(t * 1.15) * 0.045;
    groupRef.current.rotation.y = Math.sin(t * 0.55) * 0.07;

    // Glow pulse when selected
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = selected ? 0.22 + Math.sin(t * 2) * 0.1 : 0;
    }
  });

  const targetScale = selected ? scale * 1.08 : hovered ? scale * 1.03 : scale;

  return (
    <group ref={groupRef} scale={targetScale}>
      {/* ── Body ── */}
      <mesh geometry={bodyGeo} scale={[1, 1, 0.82]} castShadow>
        <meshToonMaterial color={v.color} emissive={v.emissive} emissiveIntensity={0.08} />
      </mesh>

      {/* ── Body depth shading overlay (bottom-back) ── */}
      <mesh scale={[0.98, 0.98, 0.80]} position={[0, -0.05, -0.02]}>
        <capsuleGeometry args={[0.41, 0.26, 16, 20]} />
        <meshToonMaterial color={v.bodyDark} transparent opacity={0.22} />
      </mesh>

      {/* ── Left eye ── */}
      <group position={[-0.175, 0.22, 0.33]}>
        <mesh geometry={eyeGeo} castShadow>
          <meshToonMaterial color={v.eyeColor} />
        </mesh>
        {/* Primary highlight */}
        <mesh geometry={hlGeo} position={[-0.038, 0.038, 0.08]}>
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>
        {/* Secondary smaller highlight */}
        <mesh position={[0.025, -0.02, 0.09]}>
          <sphereGeometry args={[0.018, 6, 5]} />
          <meshBasicMaterial color="#FFFFFF" transparent opacity={0.7} />
        </mesh>
      </group>

      {/* ── Right eye ── */}
      <group position={[0.175, 0.22, 0.33]}>
        <mesh geometry={eyeGeo} castShadow>
          <meshToonMaterial color={v.eyeColor} />
        </mesh>
        <mesh geometry={hlGeo} position={[-0.038, 0.038, 0.08]}>
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>
        <mesh position={[0.025, -0.02, 0.09]}>
          <sphereGeometry args={[0.018, 6, 5]} />
          <meshBasicMaterial color="#FFFFFF" transparent opacity={0.7} />
        </mesh>
      </group>

      {/* ── Smile ── */}
      {/* Rotate so the arc curves downward (happy) */}
      <mesh geometry={smileGeo} position={[0.042, 0.065, 0.35]} rotation={[0, 0, Math.PI + 0.18]} castShadow>
        <meshToonMaterial color={v.eyeColor} />
      </mesh>

      {/* ── Left foot ── */}
      <mesh geometry={footGeo} position={[-0.145, -0.62, 0.05]} scale={[1, 0.72, 0.82]} castShadow>
        <meshToonMaterial color={v.color} emissive={v.emissive} emissiveIntensity={0.05} />
      </mesh>

      {/* ── Right foot ── */}
      <mesh geometry={footGeo} position={[0.145, -0.62, 0.05]} scale={[1, 0.72, 0.82]} castShadow>
        <meshToonMaterial color={v.color} emissive={v.emissive} emissiveIntensity={0.05} />
      </mesh>

      {/* ── Ground glow circle ── */}
      <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.78, 0]}>
        <circleGeometry args={[0.42, 32]} />
        <meshBasicMaterial color={v.glowColor} transparent opacity={0} />
      </mesh>

      {/* ── Selection ring ── */}
      {selected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.8, 0]}>
          <ringGeometry args={[0.38, 0.50, 32]} />
          <meshBasicMaterial color={v.glowColor} transparent opacity={0.55} />
        </mesh>
      )}
    </group>
  );
}
