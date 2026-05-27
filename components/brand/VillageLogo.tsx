'use client';
import { motion } from 'framer-motion';

interface VillageLogoProps {
  size?: number;
  variant?: 'circle' | 'flat';
  /** Animates the shadow rotating around the tent like a sun cycle */
  animated?: boolean;
  className?: string;
}

/**
 * villa9e teepee logo — two crossing poles, dark door, flat long shadow.
 * variant="circle" — white tent on brand-blue circle (app icon style)
 * variant="flat"   — blue tent on white with gray shadow (standalone)
 */
export function VillageLogo({ size = 48, variant = 'circle', animated = false, className }: VillageLogoProps) {
  if (variant === 'flat') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 90"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        {/* Flat long shadow — light gray, offset right+down */}
        <polygon
          points="50,18 86,74 100,90 60,90 14,74"
          fill="#C8D0DC"
          opacity="0.55"
        />
        {/* Base ground line shadow */}
        <rect x="14" y="74" width="80" height="4" rx="2" fill="#C8D0DC" opacity="0.45" />

        {/* Tent body */}
        <polygon points="50,18 86,74 14,74" fill="#1877F2" />

        {/* Door triangle (darker blue) */}
        <polygon points="50,50 63,74 37,74" fill="#1255C4" />

        {/* Left pole — goes up-right from apex */}
        <line x1="47" y1="18" x2="55" y2="4"  stroke="#1877F2" strokeWidth="4" strokeLinecap="round" />
        {/* Right pole — goes up-left from apex, crossing the left one */}
        <line x1="53" y1="18" x2="45" y2="4"  stroke="#1877F2" strokeWidth="4" strokeLinecap="round" />

        {/* Base horizontal bar */}
        <line x1="10" y1="74" x2="90" y2="74" stroke="#1877F2" strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }

  // variant === 'circle' — white tent on brand-blue circle
  const ShadowGroup = animated ? motion.g : 'g';
  const shadowProps = animated
    ? { animate: { rotate: 360 }, transition: { duration: 8, repeat: Infinity, ease: 'linear' } }
    : {};

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <clipPath id={`v9-clip-${size}`}>
          <circle cx="50" cy="50" r="50" />
        </clipPath>
      </defs>

      {/* Blue circle background */}
      <circle cx="50" cy="50" r="50" fill="#1877F2" />

      {/* Shadow — static long shadow or animated sun-orbit */}
      <g clipPath={`url(#v9-clip-${size})`}>
        {animated ? (
          <g transform="translate(50, 73)">
            <ShadowGroup {...(shadowProps as any)}>
              <polygon points="-22,0 22,0 38,55 -38,55" fill="#0E3A8C" opacity="0.82" />
            </ShadowGroup>
          </g>
        ) : (
          <polygon
            points="50,24 84,76 100,100 28,100 16,76"
            fill="#1255C4"
            opacity="0.7"
          />
        )}
      </g>

      {/* Tent body — white, always on top of shadow */}
      <g clipPath={`url(#v9-clip-${size})`}>
        <polygon points="50,20 86,73 14,73" fill="white" />
        <polygon points="50,51 62,73 38,73" fill="#1565C0" />
      </g>

      {/* Poles */}
      <line x1="47" y1="20" x2="55" y2="6"  stroke="white" strokeWidth="3" strokeLinecap="round" />
      <line x1="53" y1="20" x2="45" y2="6"  stroke="white" strokeWidth="3" strokeLinecap="round" />

      {/* Base bar */}
      <line x1="12" y1="73" x2="88" y2="73" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
