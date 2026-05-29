'use client';
import { useRef, useState, useEffect, useMemo, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { AvatarConfig } from '@/lib/avatar/config';
import { SKIN_TONE_MAP, HAIR_COLOR_MAP, SHIRT_COLOR_MAP, resolveCharacterURL } from '@/lib/avatar/config';

// ─── Props ────────────────────────────────────────────────────────────────────
export interface PlayerCharacterProps {
  position:      THREE.Vector3;
  rotation?:     number;
  posRef?:       React.MutableRefObject<THREE.Vector3>;
  rotRef?:       React.MutableRefObject<number>;
  skinColor?:    string;
  hairColor?:    string;
  shirtColor?:   string;
  avatarConfig?: AvatarConfig;
  isLocal?:      boolean;
  username?:     string;
  isMovingRef?:  React.MutableRefObject<boolean>;
}

// ─── Simple procedural avatar — always visible, no loading required ───────────
// Clean capsule body with colored zones: hair, face, shirt, pants, shoes
function ProceduralAvatar({
  position, rotation = 0, posRef, rotRef, skinColor = '#A86030',
  hairColor = '#0C0700', shirtColor = '#2563EB', isMovingRef, username,
}: PlayerCharacterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const ph = useRef(Math.random() * Math.PI * 2);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t      = clock.elapsedTime;
    const p      = ph.current;
    const moving = isMovingRef?.current ?? false;

    if (posRef?.current) groupRef.current.position.copy(posRef.current);
    else                 groupRef.current.position.copy(position);
    if (rotRef?.current !== undefined) groupRef.current.rotation.y = rotRef.current;
    else if (rotation !== undefined)   groupRef.current.rotation.y = rotation;

    const breathe = moving ? Math.abs(Math.sin(t * 5.5 + p)) * 0.04 : Math.sin(t * 1.2 + p) * 0.012;
    groupRef.current.position.y += breathe;
  });

  const sk = new THREE.Color(skinColor);
  const hc = new THREE.Color(hairColor);
  const sh = new THREE.Color(shirtColor);
  const pt = new THREE.Color('#1A2A3A');  // pants
  const shoe = new THREE.Color('#1A1A1A');

  return (
    <group ref={groupRef} position={position}>
      {/* Shadow disc */}
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.28, 20]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.25} />
      </mesh>

      {/* Shoes */}
      <mesh position={[-0.09, 0.06, 0.04]}>
        <boxGeometry args={[0.12, 0.07, 0.18]} />
        <meshToonMaterial color={shoe} />
      </mesh>
      <mesh position={[0.09, 0.06, 0.04]}>
        <boxGeometry args={[0.12, 0.07, 0.18]} />
        <meshToonMaterial color={shoe} />
      </mesh>

      {/* Legs */}
      <mesh position={[-0.09, 0.36, 0]}>
        <capsuleGeometry args={[0.09, 0.44, 4, 8]} />
        <meshToonMaterial color={pt} />
      </mesh>
      <mesh position={[0.09, 0.36, 0]}>
        <capsuleGeometry args={[0.09, 0.44, 4, 8]} />
        <meshToonMaterial color={pt} />
      </mesh>

      {/* Torso */}
      <mesh position={[0, 0.78, 0]}>
        <capsuleGeometry args={[0.16, 0.38, 6, 10]} />
        <meshToonMaterial color={sh} />
      </mesh>

      {/* Arms */}
      <mesh position={[-0.24, 0.78, 0]} rotation={[0, 0, 0.25]}>
        <capsuleGeometry args={[0.072, 0.34, 4, 8]} />
        <meshToonMaterial color={sh} />
      </mesh>
      <mesh position={[0.24, 0.78, 0]} rotation={[0, 0, -0.25]}>
        <capsuleGeometry args={[0.072, 0.34, 4, 8]} />
        <meshToonMaterial color={sh} />
      </mesh>

      {/* Neck */}
      <mesh position={[0, 1.08, 0]}>
        <capsuleGeometry args={[0.06, 0.08, 4, 8]} />
        <meshToonMaterial color={sk} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 1.26, 0]}>
        <sphereGeometry args={[0.18, 16, 14]} />
        <meshToonMaterial color={sk} />
      </mesh>

      {/* Hair cap */}
      <mesh position={[0, 1.36, -0.01]}>
        <sphereGeometry args={[0.185, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <meshToonMaterial color={hc} />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.065, 1.27, 0.165]}>
        <sphereGeometry args={[0.028, 8, 6]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>
      <mesh position={[0.065, 1.27, 0.165]}>
        <sphereGeometry args={[0.028, 8, 6]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>
      <mesh position={[-0.065, 1.27, 0.185]}>
        <sphereGeometry args={[0.018, 6, 5]} />
        <meshBasicMaterial color="#1A0A00" />
      </mesh>
      <mesh position={[0.065, 1.27, 0.185]}>
        <sphereGeometry args={[0.018, 6, 5]} />
        <meshBasicMaterial color="#1A0A00" />
      </mesh>

      {/* Username label ring */}
      {username && (
        <mesh position={[0, 1.6, 0]}>
          <torusGeometry args={[0.22, 0.02, 8, 24]} />
          <meshBasicMaterial color="#7C3AED" transparent opacity={0.7} />
        </mesh>
      )}
    </group>
  );
}

// ─── GLTF character — tries to load a real 3D character ──────────────────────
function GLTFCharacter({
  url, position, rotation = 0, posRef, rotRef,
  skinColor, hairColor, shirtColor, isMovingRef,
}: {
  url: string; position: THREE.Vector3; rotation?: number;
  posRef?: React.MutableRefObject<THREE.Vector3>;
  rotRef?: React.MutableRefObject<number>;
  skinColor?: string; hairColor?: string; shirtColor?: string;
  isMovingRef?: React.MutableRefObject<boolean>;
}) {
  const groupRef  = useRef<THREE.Group>(null);
  const mixerRef  = useRef<THREE.AnimationMixer | null>(null);
  const idleRef   = useRef<THREE.AnimationAction | null>(null);
  const walkRef   = useRef<THREE.AnimationAction | null>(null);
  const wasMoving = useRef(false);

  const { scene, animations } = useGLTF(url);

  const cloned = useMemo(() => {
    const clone = scene.clone(true);
    const gradData = new Uint8Array([90, 255]);
    const gradMap  = new THREE.DataTexture(gradData, 2, 1, THREE.RedFormat);
    gradMap.magFilter = THREE.NearestFilter;
    gradMap.minFilter = THREE.NearestFilter;
    gradMap.needsUpdate = true;

    const skinC  = skinColor  ? new THREE.Color(skinColor)  : null;
    const hairC  = hairColor  ? new THREE.Color(hairColor)  : null;
    const shirtC = shirtColor ? new THREE.Color(shirtColor) : null;

    clone.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      mesh.castShadow = true; mesh.receiveShadow = true;

      const applyToon = (mat: THREE.Material) => {
        const src = mat as any;
        const baseColor: THREE.Color = src.color ?? new THREE.Color('#FFFFFF');
        const baseMap: THREE.Texture | null = src.map ?? null;
        const name = mat.name.toLowerCase();
        let color = baseColor.clone();

        if (skinC && (name.includes('skin') || name.includes('body') || name.includes('face') || name.includes('head')))
          color = skinC.clone();
        else if (hairC && (name.includes('hair') || name.includes('eyebrow') || name.includes('lash')))
          color = hairC.clone();
        else if (shirtC && (name.includes('shirt') || name.includes('cloth') || name.includes('top') || name.includes('jacket') || name.includes('outfit')))
          color = shirtC.clone();

        return new THREE.MeshToonMaterial({ color, map: baseMap, gradientMap: gradMap });
      };

      if (Array.isArray(mesh.material)) mesh.material = mesh.material.map(applyToon);
      else mesh.material = applyToon(mesh.material);
    });
    return clone;
  }, [scene, skinColor, hairColor, shirtColor]);

  useEffect(() => {
    if (!animations?.length || !cloned) return;
    const mixer = new THREE.AnimationMixer(cloned);
    mixerRef.current = mixer;
    const findAnim = (...names: string[]) =>
      animations.find(a => names.some(n => a.name.toLowerCase().includes(n.toLowerCase())));
    const idle = findAnim('idle', 'stand', 'breathing', 'TPose');
    const walk = findAnim('walk', 'run', 'Walk', 'Run');
    if (idle) { idleRef.current = mixer.clipAction(idle); idleRef.current.play(); }
    if (walk) { walkRef.current = mixer.clipAction(walk); }
    return () => { mixer.stopAllAction(); mixerRef.current = null; };
  }, [animations, cloned]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const moving = isMovingRef?.current ?? false;
    if (posRef?.current) groupRef.current.position.copy(posRef.current);
    else                 groupRef.current.position.copy(position);
    if (rotRef?.current !== undefined) groupRef.current.rotation.y = rotRef.current;
    else                               groupRef.current.rotation.y = rotation;

    if (mixerRef.current) {
      if (moving !== wasMoving.current) {
        wasMoving.current = moving;
        if (moving) { idleRef.current?.fadeOut(0.22); walkRef.current?.reset().fadeIn(0.22).play(); }
        else        { walkRef.current?.fadeOut(0.22); idleRef.current?.reset().fadeIn(0.22).play(); }
      }
      mixerRef.current.update(delta);
    }
  });

  return (
    <group ref={groupRef} position={position} scale={1.0}>
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.005, 0]}>
        <circleGeometry args={[0.3, 24]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.22} />
      </mesh>
      <primitive object={cloned} />
    </group>
  );
}

// ─── Main exported component ──────────────────────────────────────────────────
// Shows the procedural avatar immediately, then upgrades to GLTF when loaded
export function PlayerCharacter(props: PlayerCharacterProps) {
  const cfg       = props.avatarConfig;
  const skinColor  = cfg ? (SKIN_TONE_MAP[cfg.skin_id]            ?? '#A86030') : (props.skinColor  ?? '#A86030');
  const hairColor  = cfg ? (HAIR_COLOR_MAP[cfg.hair_color_id]     ?? '#0C0700') : (props.hairColor  ?? '#0C0700');
  const shirtColor = cfg ? (SHIRT_COLOR_MAP[cfg.outfit_id]        ?? '#2563EB') : (props.shirtColor ?? '#2563EB');

  const gltfUrl = cfg ? resolveCharacterURL(cfg) : '/models/gltf/Casual_Male.gltf';
  const [gltfFailed, setGltfFailed] = useState(false);

  // Test if GLTF file exists before trying to load it
  useEffect(() => {
    fetch(gltfUrl, { method: 'HEAD' })
      .then(r => { if (!r.ok) setGltfFailed(true); })
      .catch(() => setGltfFailed(true));
  }, [gltfUrl]);

  // Always show procedural avatar as base
  // Overlay GLTF on top when it loads (GLTF wins visually since it renders last)
  return (
    <>
      {/* Always-visible procedural avatar */}
      <ProceduralAvatar
        {...props}
        skinColor={skinColor}
        hairColor={hairColor}
        shirtColor={shirtColor}
      />

      {/* GLTF upgrade layer — hides procedural when loaded */}
      {!gltfFailed && (
        <Suspense fallback={null}>
          <GLTFCharacter
            url={gltfUrl}
            position={props.position}
            rotation={props.rotation}
            posRef={props.posRef}
            rotRef={props.rotRef}
            skinColor={skinColor}
            hairColor={hairColor}
            shirtColor={shirtColor}
            isMovingRef={props.isMovingRef}
          />
        </Suspense>
      )}
    </>
  );
}
