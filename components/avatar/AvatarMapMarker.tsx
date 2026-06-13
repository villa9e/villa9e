'use client';
import { useRef, useEffect, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import {
  SKIN_TONE_MAP, HAIR_COLOR_MAP, SHIRT_COLOR_MAP,
  type AvatarConfig, resolveCharacterURL,
} from '@/lib/avatar/config';

// ─── Walking character ──────────────────────────────────────────────────────
// Loads the user's chosen GLTF, recolors it to match their Avatar Studio
// config, and crossfades between the model's baked Idle/Walk clips based on
// the `isWalking` flag.
function WalkingCharacter({ config, isWalking }: { config: AvatarConfig; isWalking: boolean }) {
  const url = resolveCharacterURL(config);
  const { scene, animations } = useGLTF(url);

  const skinColor  = SKIN_TONE_MAP[config.skin_id]        ?? '#A86030';
  const hairColor  = HAIR_COLOR_MAP[config.hair_color_id] ?? '#0C0700';
  const shirtColor = SHIRT_COLOR_MAP[config.outfit_id]    ?? '#2563EB';

  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const idleRef  = useRef<THREE.AnimationAction | null>(null);
  const walkRef  = useRef<THREE.AnimationAction | null>(null);
  const wasWalking = useRef(false);

  const cloned = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      const applyToon = (mat: THREE.Material) => {
        const src = mat as any;
        const name = (mat.name ?? '').toLowerCase();
        let color = (src.color ?? new THREE.Color('#FFFFFF')).clone();
        if (name.includes('skin') || name.includes('body') || name.includes('face') || name.includes('head'))
          color = new THREE.Color(skinColor);
        else if (name.includes('hair') || name.includes('eyebrow') || name.includes('lash'))
          color = new THREE.Color(hairColor);
        else if (name.includes('shirt') || name.includes('cloth') || name.includes('top') || name.includes('jacket') || name.includes('outfit'))
          color = new THREE.Color(shirtColor);
        return new THREE.MeshToonMaterial({ color, map: src.map ?? null });
      };
      if (Array.isArray(mesh.material)) mesh.material = mesh.material.map(applyToon);
      else mesh.material = applyToon(mesh.material);
    });
    return clone;
  }, [scene, skinColor, hairColor, shirtColor]);

  useEffect(() => {
    if (!animations?.length) return;
    const mixer = new THREE.AnimationMixer(cloned);
    mixerRef.current = mixer;

    const idle = animations.find(a => /idle/i.test(a.name));
    const walk = animations.find(a => /^walk$/i.test(a.name)) ?? animations.find(a => /walk/i.test(a.name));

    if (idle) { idleRef.current = mixer.clipAction(idle); idleRef.current.play(); }
    if (walk) walkRef.current = mixer.clipAction(walk);

    return () => { mixer.stopAllAction(); };
  }, [animations, cloned]);

  useFrame((_, delta) => {
    const mixer = mixerRef.current;
    if (!mixer) return;
    if (isWalking !== wasWalking.current) {
      wasWalking.current = isWalking;
      if (isWalking) { idleRef.current?.fadeOut(0.15); walkRef.current?.reset().fadeIn(0.15).play(); }
      else { walkRef.current?.fadeOut(0.15); idleRef.current?.reset().fadeIn(0.15).play(); }
    }
    mixer.update(delta);
  });

  return (
    <group position={[0, -0.55, 0]}>
      <primitive object={cloned} />
    </group>
  );
}

// ─── Map marker ─────────────────────────────────────────────────────────────
// A tiny 3D viewport showing the user's custom avatar standing (or walking)
// at their "you are here" position on the GPS map.
export default function AvatarMapMarker({ config, isWalking }: { config: AvatarConfig; isWalking: boolean }) {
  return (
    <Canvas
      camera={{ position: [0, 0.35, 2.1], fov: 32 }}
      gl={{ alpha: true, antialias: true }}
      style={{ background: 'transparent', pointerEvents: 'none' }}
      dpr={[1, 1.5]}
    >
      <ambientLight intensity={1.1} />
      <directionalLight position={[2, 4, 3]} intensity={1.3} />
      <Suspense fallback={null}>
        <WalkingCharacter config={config} isWalking={isWalking} />
      </Suspense>
    </Canvas>
  );
}
