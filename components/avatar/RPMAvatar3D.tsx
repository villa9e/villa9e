'use client';
import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface RPMAvatar3DProps {
  avatarUrl:    string;
  position:     THREE.Vector3;
  rotation?:    number;
  posRef?:      React.MutableRefObject<THREE.Vector3>;
  rotRef?:      React.MutableRefObject<number>;
  isLocal?:     boolean;
  isMovingRef?: React.MutableRefObject<boolean>;
  scale?:       number;
}

// ─── RPM Avatar 3D ────────────────────────────────────────────────────────────
// Loads a Ready Player Me .glb avatar and renders it in the 3D village world.
// Supports walk/idle animations if the GLB includes them (RPM halfbody includes
// a pre-built set; fullbody avatars can be paired with Mixamo animations).
export function RPMAvatar3D({
  avatarUrl, position, rotation = 0,
  posRef, rotRef, isLocal = false, isMovingRef, scale = 1,
}: RPMAvatar3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const ph       = useRef(Math.random() * Math.PI * 2);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const idleRef  = useRef<THREE.AnimationAction | null>(null);
  const walkRef  = useRef<THREE.AnimationAction | null>(null);
  const wasMoving = useRef(false);

  const { scene, animations } = useGLTF(avatarUrl);

  // Clone the scene so multiple instances can share the same GLB cache
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    // Apply toon materials to give it the cartoon look consistent with the world
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map(m => {
            const toon = new THREE.MeshToonMaterial({
              color: (m as any).color ?? '#FFFFFF',
              map:   (m as any).map ?? null,
            });
            return toon;
          });
        } else {
          const m = mesh.material as any;
          mesh.material = new THREE.MeshToonMaterial({
            color: m.color ?? '#FFFFFF',
            map:   m.map ?? null,
          });
        }
        mesh.castShadow    = true;
        mesh.receiveShadow = true;
      }
    });
    return clone;
  }, [scene]);

  // Set up animation mixer if animations exist in the GLB
  useEffect(() => {
    if (!animations?.length || !clonedScene) return;
    const mixer = new THREE.AnimationMixer(clonedScene);
    mixerRef.current = mixer;

    // RPM avatars include these animation names
    const idle = animations.find(a =>
      /idle|Idle|IDLE/.test(a.name)
    );
    const walk = animations.find(a =>
      /walk|Walk|WALK|run|Run|RUN/.test(a.name)
    );

    if (idle) {
      idleRef.current = mixer.clipAction(idle);
      idleRef.current.play();
    }
    if (walk) {
      walkRef.current = mixer.clipAction(walk);
    }

    return () => { mixer.stopAllAction(); };
  }, [animations, clonedScene]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Sync position & rotation
    if (posRef?.current) groupRef.current.position.copy(posRef.current);
    else                 groupRef.current.position.copy(position);
    if (rotRef?.current !== undefined) groupRef.current.rotation.y = rotRef.current;
    else                               groupRef.current.rotation.y = rotation;

    const moving = isMovingRef?.current ?? false;

    // Transition between idle and walk animations
    if (mixerRef.current) {
      if (moving !== wasMoving.current) {
        wasMoving.current = moving;
        if (moving) {
          idleRef.current?.fadeOut(0.2);
          walkRef.current?.reset().fadeIn(0.2).play();
        } else {
          walkRef.current?.fadeOut(0.2);
          idleRef.current?.reset().fadeIn(0.2).play();
        }
      }
      mixerRef.current.update(delta);
    }
  });

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* Ground shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <circleGeometry args={[0.28, 24]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.22} />
      </mesh>
      <primitive object={clonedScene} />
    </group>
  );
}

// Preload hint — call this early to warm the GLB cache
export function preloadRPMAvatar(url: string) {
  if (url) useGLTF.preload(url);
}
