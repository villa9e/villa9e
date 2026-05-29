'use client';
import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { generateAvatarSVG } from '@/lib/avatar/svgString';
import type { AvatarConfig } from '@/lib/avatar/config';

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

// ─── Default config for backwards compatibility ────────────────────────────────
const DEFAULT_CFG: AvatarConfig = {
  skin_id: 's5', hair_id: 'h1', hair_color_id: 'c1', outfit_id: 'o2', accessory_id: 'a0',
};

// ─── Convert SVG string → canvas texture (async) ─────────────────────────────
function useSVGTexture(svgString: string): THREE.CanvasTexture | null {
  const [tex, setTex] = useState<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    const W = 280, H = 440;
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url  = URL.createObjectURL(blob);
    const img  = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(img, 0, 0, W, H);
      URL.revokeObjectURL(url);

      const t = new THREE.CanvasTexture(canvas);
      t.needsUpdate = true;
      t.premultiplyAlpha = true;
      setTex(t);
    };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;

    return () => URL.revokeObjectURL(url);
  }, [svgString]);

  return tex;
}

// ─── Billboard avatar — sprite that always faces the camera ───────────────────
// This renders the exact same SVG illustration from the avatar builder
// directly in the 3D world, so builder preview = in-world appearance.
export function PlayerCharacter({
  position, rotation = 0,
  posRef, rotRef,
  avatarConfig,
  skinColor, hairColor, shirtColor,
  isLocal    = false,
  isMovingRef,
}: PlayerCharacterProps) {

  const groupRef  = useRef<THREE.Group>(null);
  const spriteRef = useRef<THREE.Sprite>(null);
  const shadowRef = useRef<THREE.Mesh>(null);
  const ph        = useRef(Math.random() * Math.PI * 2);
  const { camera } = useThree();

  // Resolve config — either from explicit config object, or from color props,
  // or default. This keeps backward-compat with callers that pass skinColor etc.
  const cfg = useMemo<AvatarConfig>(() => {
    if (avatarConfig) return avatarConfig;
    // Map raw colors back to nearest config IDs isn't trivial,
    // so if no config, use a sensible default that reflects the skin tone
    return DEFAULT_CFG;
  }, [avatarConfig]);

  // Generate SVG string (pure, no React)
  const svgString = useMemo(() => generateAvatarSVG(cfg, 140, 220), [
    cfg.skin_id, cfg.hair_id, cfg.hair_color_id, cfg.outfit_id, cfg.accessory_id,
  ]);

  // Convert SVG → canvas texture
  const texture = useSVGTexture(svgString);

  // ── SpriteMaterial ──
  const spriteMat = useMemo(() => {
    const m = new THREE.SpriteMaterial({
      transparent: true,
      depthWrite:  false,
      sizeAttenuation: true,
    });
    return m;
  }, []);

  // Apply texture when ready
  useEffect(() => {
    if (texture && spriteMat) {
      spriteMat.map = texture;
      spriteMat.needsUpdate = true;
    }
  }, [texture, spriteMat]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t      = clock.elapsedTime;
    const ph_    = ph.current;
    const moving = isMovingRef?.current ?? false;

    // Sync world position
    if (posRef?.current) groupRef.current.position.copy(posRef.current);
    else                 groupRef.current.position.copy(position);

    // Sprites auto-face camera — rotation only for shadow
    if (shadowRef.current) {
      shadowRef.current.rotation.y = rotRef?.current ?? rotation;
    }

    // Subtle walk bob on the sprite Y
    if (spriteRef.current) {
      const bob = moving
        ? Math.abs(Math.sin(t * 5.4 + ph_)) * 0.06
        : Math.sin(t * 1.1 + ph_) * 0.015;
      spriteRef.current.position.y = 1.1 + bob;

      // Slight left-right lean while walking
      if (moving) {
        spriteRef.current.material.rotation = Math.sin(t * 5.4 + ph_) * 0.04;
      } else {
        spriteRef.current.material.rotation *= 0.85;
      }
    }

    // Shadow squash while walking
    if (shadowRef.current) {
      const squash = moving
        ? 0.88 + Math.abs(Math.sin(t * 5.4 + ph_)) * 0.14
        : 1.0;
      shadowRef.current.scale.set(squash * 0.3, 1, squash * 0.3);
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Ground shadow — ellipse on terrain */}
      <mesh ref={shadowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]}>
        <circleGeometry args={[1, 20]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.22} />
      </mesh>

      {/* Billboard sprite — always faces camera, size matches character height */}
      {spriteMat && (
        <sprite ref={spriteRef} material={spriteMat} position={[0, 1.1, 0]} scale={[2.2, 2.2, 1]}>
        </sprite>
      )}
    </group>
  );
}
