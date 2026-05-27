'use client';
import type { SpiritVariantId } from './SpiritFigure';

// Pure CSS Spirit avatar — no Three.js, safe for SSR/loading fallbacks
export function SpiritAvatarStatic({ variant = 'blue', size = 40 }: { variant?: SpiritVariantId; size?: number }) {
  const colors: Record<SpiritVariantId, { body: string; glow: string; eye: string }> = {
    blue:  { body: '#6BA8FF', glow: '#3B82F6', eye: '#0A0A12' },
    white: { body: '#E8ECFF', glow: '#94A3B8', eye: '#0A0A12' },
    dark:  { body: '#1E1B3A', glow: '#4C1D95', eye: '#E8E8FF' },
  };
  const c = colors[variant];

  return (
    <div style={{
      width: size, height: size * 1.15, flexShrink: 0, position: 'relative',
      borderRadius: '50% 50% 42% 42%',
      background: `radial-gradient(circle at 38% 32%, ${c.body}, ${c.glow})`,
      boxShadow: `0 4px 16px ${c.glow}50`,
    }}>
      {/* Eyes */}
      {[-1, 1].map(side => (
        <div key={side} style={{
          position: 'absolute',
          width: size * 0.18, height: size * 0.2,
          borderRadius: '50%',
          background: c.eye,
          top: '36%',
          left: side === -1 ? '26%' : '52%',
        }}>
          <div style={{
            position: 'absolute', width: '35%', height: '35%',
            borderRadius: '50%', background: '#fff',
            top: '10%', left: '8%',
          }} />
        </div>
      ))}
      {/* Smile */}
      <div style={{
        position: 'absolute',
        width: size * 0.22, height: size * 0.07,
        borderBottom: `${size * 0.025}px solid ${c.eye}`,
        borderRadius: '0 0 50% 50%',
        top: '60%', left: '38%',
      }} />
      {/* Feet */}
      {[-1, 1].map(side => (
        <div key={side} style={{
          position: 'absolute',
          width: size * 0.2, height: size * 0.14,
          borderRadius: '50%',
          background: c.body,
          bottom: '-5%', left: side === -1 ? '22%' : '52%',
        }} />
      ))}
    </div>
  );
}
