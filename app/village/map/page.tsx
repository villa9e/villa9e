'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';

const LOCATIONS = [
  { id: 'hut',          emoji: '🏠', label: 'The Hut',       desc: 'Your home base',        href: '/village/hut',          x: 50, y: 30, color: '#F59E0B' },
  { id: 'workshop',     emoji: '🔨', label: 'Workshop',      desc: 'Set goals & skills',    href: '/village/workshop',     x: 20, y: 50, color: '#1877F2' },
  { id: 'dreamline',    emoji: '✨', label: 'Dream Line',    desc: 'Social progress feed',  href: '/village/dreamline',    x: 80, y: 50, color: '#8B5CF6' },
  { id: 'trading-post', emoji: '🏪', label: 'Trading Post',  desc: 'Skills marketplace',    href: '/village/trading-post', x: 35, y: 70, color: '#10B981' },
  { id: 'bank',         emoji: '🏦', label: 'Bank',          desc: 'Fund your goals',       href: '/village/bank',         x: 65, y: 70, color: '#F97316' },
  { id: 'zen',          emoji: '🧘', label: 'Zen Space',     desc: 'Wellness sanctuary',    href: '/village/zen',          x: 20, y: 30, color: '#06B6D4' },
  { id: 'tribes',       emoji: '👥', label: 'Tribes',        desc: 'Your project teams',    href: '/village/tribes',       x: 80, y: 30, color: '#EC4899' },
  { id: 'spaces',       emoji: '📅', label: 'Spaces',        desc: 'Holistic calendar',     href: '/village/spaces',       x: 50, y: 70, color: '#6366F1' },
];

export default function VillageMapPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E8F4FD] to-[#F0F9FF] relative overflow-hidden">
      {/* Sky gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-100 via-sky-50 to-green-50" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full village-gradient flex items-center justify-center">
            <span className="text-lg">⛺</span>
          </div>
          <span className="font-bold text-village-blue text-lg">villa9e</span>
        </div>
        <Link href="/village/hut" className="w-9 h-9 rounded-full bg-white shadow flex items-center justify-center">
          <span>👤</span>
        </Link>
      </div>

      {/* Map */}
      <div className="relative z-10 flex-1 px-4" style={{ height: 'calc(100vh - 80px)' }}>
        <p className="text-center text-gray-500 text-sm mb-4">Tap a location to enter</p>

        <div className="relative w-full h-[75vh] max-w-lg mx-auto">
          {/* Ground/grass */}
          <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-green-200 to-green-50 rounded-3xl" />

          {/* Paths */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {LOCATIONS.map(loc => (
              <line key={loc.id} x1="50" y1="50" x2={loc.x} y2={loc.y}
                stroke="#D1FAE5" strokeWidth="0.5" strokeDasharray="1,1" />
            ))}
          </svg>

          {/* Central plaza */}
          <div className="absolute" style={{ left: '45%', top: '45%' }}>
            <div className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center">
              <span className="text-lg">🌳</span>
            </div>
          </div>

          {/* Location nodes */}
          {LOCATIONS.map((loc, i) => (
            <motion.div
              key={loc.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.08, type: 'spring', stiffness: 200 }}
              className="absolute"
              style={{ left: `${loc.x}%`, top: `${loc.y}%`, transform: 'translate(-50%, -50%)' }}
            >
              <Link href={loc.href}>
                <motion.div
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex flex-col items-center gap-1 cursor-pointer"
                >
                  <div
                    className="w-14 h-14 rounded-2xl shadow-lg flex items-center justify-center text-2xl"
                    style={{ backgroundColor: loc.color + '20', border: `2px solid ${loc.color}` }}
                  >
                    {loc.emoji}
                  </div>
                  <div className="bg-white/90 backdrop-blur-sm rounded-lg px-2 py-0.5 text-center shadow-sm">
                    <p className="text-xs font-semibold text-gray-800 whitespace-nowrap">{loc.label}</p>
                    <p className="text-[10px] text-gray-400 whitespace-nowrap hidden sm:block">{loc.desc}</p>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
