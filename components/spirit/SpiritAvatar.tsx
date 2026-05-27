'use client';
import { Suspense, useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { useFrame } from '@react-three/fiber';
import { SpiritFigure, type SpiritVariantId } from './SpiritFigure';
import * as THREE from 'three';

interface SpiritAvatarProps {
  variant?: SpiritVariantId;
  size?: number;       // px size of the canvas
  animated?: boolean;
}

function MiniSpiritScene({ variant }: { variant: SpiritVariantId }) {
  return (
    <>
      <ambientLight intensity={0.9} color="#C8D8FF" />
      <directionalLight position={[1, 2, 2]} intensity={1.3} color="#FFFFFF" />
      <directionalLight position={[-1, 1, -1]} intensity={0.3} color="#B0C4FF" />
      <SpiritFigure variant={variant} selected={false} scale={0.78} />
    </>
  );
}

export function SpiritAvatar({ variant = 'blue', size = 48, animated = true }: SpiritAvatarProps) {
  return (
    <div style={{ width: size, height: size, flexShrink: 0 }}>
      <Canvas
        camera={{ position: [0, 0.1, 3.2], fov: 44 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'default' }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <MiniSpiritScene variant={variant} />
        </Suspense>
      </Canvas>
    </div>
  );
}

// Static 2D CSS fallback for use in SSR / non-canvas contexts
export function SpiritAvatarStatic({ variant = 'blue', size = 40 }: { variant?: SpiritVariantId; size?: number }) {
  const colors: Record<SpiritVariantId, { body: string; glow: string }> = {
    blue:  { body: '#6BA8FF', glow: '#3B82F6' },
    white: { body: '#E8ECFF', glow: '#94A3B8' },
    dark:  { body: '#1E1B3A', glow: '#4C1D95' },
  };
  const c = colors[variant];

  return (
    <div
      style={{
        width: size,
        height: size * 1.1,
        borderRadius: '50% 50% 45% 45%',
        background: `radial-gradient(circle at 40% 35%, ${c.body}, ${c.glow})`,
        flexShrink: 0,
        position: 'relative',
        boxShadow: `0 4px 16px ${c.glow}50`,
      }}
    >
      {/* Eyes */}
      {[-1, 1].map(side => (
        <div
          key={side}
          style={{
            position: 'absolute',
            width: size * 0.18,
            height: size * 0.2,
            borderRadius: '50%',
            background: '#0A0A12',
            top: '38%',
            left: side === -1 ? '28%' : '54%',
          }}
        >
          <div style={{
            position: 'absolute',
            width: '35%', height: '35%',
            borderRadius: '50%', background: '#fff',
            top: '10%', left: '8%',
          }} />
        </div>
      ))}
    </div>
  );
}
