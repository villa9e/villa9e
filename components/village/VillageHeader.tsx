'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';

interface VillageHeaderProps {
  title: string;
  subtitle?: string;
  icon: string;
  backHref?: string;
  accentColor?: string;  // hex for day, falls back to theme fire for night
}

export function VillageHeader({ title, subtitle, icon, backHref = '/village/map', accentColor }: VillageHeaderProps) {
  const { theme, toggle } = useVillageTheme();
  const isNight = theme === 'night';

  const dayBg  = accentColor ?? '#E8770A';
  const nightBg = '#0E1020';

  return (
    <div
      className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 border-b"
      style={{
        background:   isNight ? nightBg : dayBg,
        borderColor:  isNight ? '#1E2240' : 'transparent',
      }}
    >
      <Link href={backHref} className="text-xl opacity-80 hover:opacity-100 transition-opacity" style={{ color: isNight ? '#F0EBE0' : '#fff' }}>←</Link>
      <span className="text-2xl">{icon}</span>
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-black leading-tight" style={{ color: isNight ? '#F0EBE0' : '#fff' }}>{title}</h1>
        {subtitle && <p className="text-xs opacity-70 truncate" style={{ color: isNight ? '#7A7FA8' : '#fff' }}>{subtitle}</p>}
      </div>

      {/* Day / Night toggle */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={toggle}
        className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
        style={{ background: isNight ? '#1E2240' : 'rgba(255,255,255,0.2)' }}
        title={isNight ? 'Switch to Day' : 'Switch to Night'}
      >
        <span className="text-base">{isNight ? '☀️' : '🌙'}</span>
      </motion.button>
    </div>
  );
}
