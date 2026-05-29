'use client';
import { useRef, useState, useEffect, useMemo, Suspense } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { generateAvatarSVG } from '@/lib/avatar/svgString';
import type { AvatarConfig } from '@/lib/avatar/config';
import { SKIN_TONE_MAP, HAIR_COLOR_MAP, SHIRT_COLOR_MAP, resolveCharacterURL } from '@/lib/avatar/config';

// ─── Flat 2-step toon gradient map for GLTF characters ───────────────────────
let _gradMap: THREE.DataTexture | null = null;
function getGradMap(): THREE.DataTexture {
  if (!_gradMap) {
    const data = new Uint8Array([90, 255]);
    _gradMap = new THREE.DataTexture(data, 2, 1, THREE.RedFormat);
    _gradMap.magFilter = THREE.NearestFilter;
    _gradMap.minFilter = THREE.NearestFilter;
    _gradMap.needsUpdate = true;
  }
  return _gradMap;
}

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

const DEFAULT_CFG: AvatarConfig = {
  skin_id: 's5', hair_id: 'h1', hair_color_id: 'c1', outfit_id: 'o2', accessory_id: 'a0',
};

// ─── SVG → canvas texture hook ────────────────────────────────────────────────
function useSVGTexture(svgString: string): THREE.CanvasTexture | null {
  const [tex, setTex] = useState<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    const W = 280, H = 440;
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url  = URL.createObjectURL(blob);
    const img  = new Image();

    img.onload = () => {
      const canvas  = document.createElement('canvas');
      canvas.width  = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(img, 0, 0, W, H);
      URL.revokeObjectURL(url);
      const t = new THREE.CanvasTexture(canvas);
      t.needsUpdate = true;
      setTex(t);
    };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [svgString]);

  return tex;
}

// ─── GLTF character — loads a real 3D character with animation blending ───────
function GLTFCharacter({
  url, position, rotation = 0, posRef, rotRef,
  skinColor, hairColor, shirtColor, isMovingRef,
}: {
  url: string;
  position: THREE.Vector3;
  rotation?: number;
  posRef?: React.MutableRefObject<THREE.Vector3>;
  rotRef?: React.MutableRefObject<number>;
  skinColor?: string;
  hairColor?: string;
  shirtColor?: string;
  isMovingRef?: React.MutableRefObject<boolean>;
}) {
  const groupRef   = useRef<THREE.Group>(null);
  const mixerRef   = useRef<THREE.AnimationMixer | null>(null);
  const idleRef    = useRef<THREE.AnimationAction | null>(null);
  const walkRef    = useRef<THREE.AnimationAction | null>(null);
  const wasMoving  = useRef(false);
  const ph         = useRef(Math.random() * Math.PI * 2);

  const { scene, animations } = useGLTF(url);

  // Clone and apply toon shading + color overrides
  const cloned = useMemo(() => {
    const clone = scene.clone(true);
    const gradMap = getGradMap();

    // Color targets from skin/hair/shirt
    const skinC  = skinColor  ? new THREE.Color(skinColor)  : null;
    const hairC  = hairColor  ? new THREE.Color(hairColor)  : null;
    const shirtC = shirtColor ? new THREE.Color(shirtColor) : null;

    clone.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      mesh.castShadow    = true;
      mesh.receiveShadow = true;

      const applyToon = (mat: THREE.Material) => {
        const src = mat as any;
        const baseColor: THREE.Color = src.color ?? new THREE.Color('#FFFFFF');
        const baseMap: THREE.Texture | null = src.map ?? null;

        // Heuristic name matching for material zones
        const name = mat.name.toLowerCase();
        let color = baseColor.clone();

        if (skinC && (name.includes('skin') || name.includes('body') || name.includes('face') || name.includes('head'))) {
          color = skinC.clone();
        } else if (hairC && (name.includes('hair') || name.includes('eyebrow') || name.includes('lash'))) {
          color = hairC.clone();
        } else if (shirtC && (name.includes('shirt') || name.includes('cloth') || name.includes('top') || name.includes('jacket') || name.includes('outfit'))) {
          color = shirtC.clone();
        }

        return new THREE.MeshToonMaterial({ color, map: baseMap, gradientMap: gradMap });
      };

      if (Array.isArray(mesh.material)) {
        mesh.material = mesh.material.map(applyToon);
      } else {
        mesh.material = applyToon(mesh.material);
      }
    });

    return clone;
  }, [scene, skinColor, hairColor, shirtColor]);

  // Set up animation mixer
  useEffect(() => {
    if (!animations?.length || !cloned) return;
    const mixer = new THREE.AnimationMixer(cloned);
    mixerRef.current = mixer;

    const findAnim = (...names: string[]) =>
      animations.find(a => names.some(n => a.name.toLowerCase().includes(n.toLowerCase())));

    const idle = findAnim('idle', 'stand', 'breathing', 'Idle', 'TPose');
    const walk = findAnim('walk', 'run', 'Walk', 'Run', 'jog');

    if (idle) { idleRef.current = mixer.clipAction(idle); idleRef.current.play(); }
    if (walk) { walkRef.current = mixer.clipAction(walk); }

    return () => { mixer.stopAllAction(); mixerRef.current = null; };
  }, [animations, cloned]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const t      = _;
    const moving = isMovingRef?.current ?? false;

    if (posRef?.current) groupRef.current.position.copy(posRef.current);
    else                 groupRef.current.position.copy(position);
    if (rotRef?.current !== undefined) groupRef.current.rotation.y = rotRef.current;
    else                               groupRef.current.rotation.y = rotation;

    // Transition animations
    if (mixerRef.current) {
      if (moving !== wasMoving.current) {
        wasMoving.current = moving;
        if (moving) {
          idleRef.current?.fadeOut(0.22);
          walkRef.current?.reset().fadeIn(0.22).play();
        } else {
          walkRef.current?.fadeOut(0.22);
          idleRef.current?.reset().fadeIn(0.22).play();
        }
      }
      mixerRef.current.update(delta);
    }
  });

  return (
    <group ref={groupRef} position={position} scale={1.0}>
      {/* Ground shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <circleGeometry args={[0.3, 24]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.22} />
      </mesh>
      <primitive object={cloned} />
    </group>
  );
}

// ─── Billboard avatar — SVG sprite (fallback when no GLTF file is present) ───
function BillboardAvatar({
  position, rotation = 0, posRef, rotRef, avatarConfig, isMovingRef,
}: {
  position: THREE.Vector3;
  rotation?: number;
  posRef?: React.MutableRefObject<THREE.Vector3>;
  rotRef?: React.MutableRefObject<number>;
  avatarConfig: AvatarConfig;
  isMovingRef?: React.MutableRefObject<boolean>;
}) {
  const groupRef  = useRef<THREE.Group>(null);
  const spriteRef = useRef<THREE.Sprite>(null);
  const ph        = useRef(Math.random() * Math.PI * 2);

  const svgString = useMemo(() => generateAvatarSVG(avatarConfig, 140, 220), [
    avatarConfig.skin_id,
    avatarConfig.hair_id,
    avatarConfig.hair_color_id,
    avatarConfig.outfit_id,
    avatarConfig.accessory_id,
  ]);

  const texture = useSVGTexture(svgString);

  const spriteMat = useMemo(() => new THREE.SpriteMaterial({
    transparent: true, depthWrite: false, sizeAttenuation: true,
  }), []);

  useEffect(() => {
    if (texture) { spriteMat.map = texture; spriteMat.needsUpdate = true; }
  }, [texture, spriteMat]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t      = clock.elapsedTime;
    const p      = ph.current;
    const moving = isMovingRef?.current ?? false;

    if (posRef?.current) groupRef.current.position.copy(posRef.current);
    else                 groupRef.current.position.copy(position);
    if (rotRef?.current !== undefined) {}
    else if (rotation !== undefined)   {}

    if (spriteRef.current) {
      spriteRef.current.position.y = 1.1 + (moving
        ? Math.abs(Math.sin(t * 5.4 + p)) * 0.06
        : Math.sin(t * 1.1 + p) * 0.015);
      if (moving) spriteMat.rotation = Math.sin(t * 5.4 + p) * 0.04;
      else        spriteMat.rotation *= 0.85;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]}>
        <circleGeometry args={[0.28, 24]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.22} />
      </mesh>
      <sprite ref={spriteRef} material={spriteMat} position={[0, 1.1, 0]} scale={[2.2, 2.2, 1]} />
    </group>
  );
}

// ─── GLTFLoader wrapper — tries to load GLTF, falls back to billboard ─────────
// Checks each avatar URL in order of preference
function GLTFWithFallback(props: PlayerCharacterProps & { cfg: AvatarConfig }) {
  const [failedUrls, setFailedUrls] = useState<Set<string>>(new Set());
  // Primary URL from avatar config character_type + body_type
  const primaryUrl = resolveCharacterURL(props.cfg);
  // Fallbacks in case the primary can't load
  const fallbackUrls = [
    '/models/gltf/Casual_Male.gltf',
    '/models/gltf/Casual2_Male.gltf',
  ].filter(u => u !== primaryUrl);
  const urls = [primaryUrl, ...fallbackUrls];
  const url  = urls.find(u => !failedUrls.has(u));

  if (!url) {
    return (
      <BillboardAvatar
        position={props.position}
        rotation={props.rotation}
        posRef={props.posRef}
        rotRef={props.rotRef}
        avatarConfig={props.cfg}
        isMovingRef={props.isMovingRef}
      />
    );
  }

  return (
    <Suspense fallback={
      <BillboardAvatar
        position={props.position}
        avatarConfig={props.cfg}
        isMovingRef={props.isMovingRef}
      />
    }>
      <GLTFTryLoad
        {...props}
        url={url}
        onFail={() => setFailedUrls(prev => new Set([...prev, url]))}
      />
    </Suspense>
  );
}

function GLTFTryLoad(props: PlayerCharacterProps & {
  cfg: AvatarConfig; url: string; onFail: () => void;
}) {
  useEffect(() => {
    // Test if the GLB file actually exists
    fetch(props.url, { method: 'HEAD' })
      .then(r => { if (!r.ok) props.onFail(); })
      .catch(() => props.onFail());
  }, [props.url]);

  return (
    <GLTFCharacter
      url={props.url}
      position={props.position}
      rotation={props.rotation}
      posRef={props.posRef}
      rotRef={props.rotRef}
      skinColor={props.skinColor}
      hairColor={props.hairColor}
      shirtColor={props.shirtColor}
      isMovingRef={props.isMovingRef}
    />
  );
}

// ─── Main exported component ──────────────────────────────────────────────────
export function PlayerCharacter(props: PlayerCharacterProps) {
  const cfg = useMemo<AvatarConfig>(() => {
    if (props.avatarConfig) return props.avatarConfig;
    return DEFAULT_CFG;
  }, [props.avatarConfig]);

  // Use real GLTF character with SVG billboard fallback while loading
  return <GLTFWithFallback {...props} cfg={cfg} />;
}
