'use client';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface VillageLogoProps {
  size?: number;
  /**
   * circle — white tent icon on transparent (for dark backgrounds, e.g. onboarding)
   * royal  — blue tent on white circle on royal blue square (app icon style)
   * blue   — blue tent on white circle (for light backgrounds)
   */
  variant?: 'circle' | 'royal' | 'blue' | 'flat';
  animated?: boolean;
  className?: string;
}

const SRC: Record<string, string> = {
  circle: '/village-icon-white.png',   // White transparent icon — dark bg use
  royal:  '/village-logo-royal-circle.png', // Blue square + white circle + blue tent
  blue:   '/village-logo-blue-circle.png',  // Blue tent on white circle
  flat:   '/village-logo-blue-circle.png',
};

export function VillageLogo({ size = 48, variant = 'circle', animated = false, className }: VillageLogoProps) {
  const src = SRC[variant] ?? SRC.circle;

  const img = (
    <Image
      src={src}
      width={size}
      height={size}
      alt="villa9e"
      className={className}
      style={{ display: 'block', objectFit: 'contain' }}
      priority
    />
  );

  if (!animated) return img;

  return (
    <motion.div
      className={className}
      animate={{ filter: ['drop-shadow(0 0 8px rgba(24,119,242,0.4))', 'drop-shadow(0 0 24px rgba(24,119,242,0.8))', 'drop-shadow(0 0 8px rgba(24,119,242,0.4))'] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      style={{ display: 'inline-block', width: size, height: size }}
    >
      {img}
    </motion.div>
  );
}
