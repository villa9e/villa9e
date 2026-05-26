'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VillageSound } from '@/lib/sounds/village';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';

interface OoWopButtonProps {
  count:        number;
  hasGiven?:    boolean;
  onGive:       () => Promise<void>;
  size?:        'sm' | 'md' | 'lg';
  showValidation?: boolean;
  oowopsNeeded?: number;
  giverWeight?:  number;  // 1.0 normal, 1.25 platinum
}

const PARTICLES = ['★', '✦', '·', '◆', '✸', '⬡'];

export function OoWopButton({
  count, hasGiven = false, onGive,
  size = 'md', showValidation, oowopsNeeded = 3, giverWeight = 1.0,
}: OoWopButtonProps) {
  const [given, setGiven]   = useState(hasGiven);
  const [loading, setLoading] = useState(false);
  const [burst, setBurst]   = useState(false);
  const isValidated = count >= oowopsNeeded;
  const { theme } = useVillageTheme();
  const isNight   = theme === 'night';

  const sizes = {
    sm: { btn: 'text-sm px-2.5 py-1', icon: 'text-base' },
    md: { btn: 'text-sm px-3 py-1.5', icon: 'text-xl' },
    lg: { btn: 'text-base px-4 py-2',  icon: 'text-2xl' },
  };

  async function handleClick() {
    if (given || loading) return;
    setLoading(true);
    VillageSound.tap();
    try {
      await onGive();
      setGiven(true);
      setBurst(true);
      VillageSound.oowop();
      setTimeout(() => setBurst(false), 700);
    } finally {
      setLoading(false);
    }
  }

  const btnBg = given
    ? (isNight ? '#2D1F00' : '#FEF9C3')
    : (isNight ? '#0D1A2D' : '#EFF6FF');
  const btnColor = given
    ? '#F59E0B'
    : (isNight ? '#60A5FA' : '#1877F2');
  const btnBorder = given
    ? '#F59E0B40'
    : (isNight ? '#1E2240' : '#DBEAFE');

  return (
    <div className="flex items-center gap-2">
      <motion.button
        onClick={handleClick}
        disabled={given || loading}
        whileHover={!given ? { scale: 1.08 } : {}}
        whileTap={!given ? { scale: 0.88 } : {}}
        className={`relative flex items-center gap-1.5 rounded-full font-semibold transition-all ${sizes[size].btn}`}
        style={{ background: btnBg, color: btnColor, border: `1px solid ${btnBorder}` }}
      >
        {/* Fist */}
        <motion.span
          className={sizes[size].icon}
          animate={burst ? { scale: [1, 1.6, 0.9, 1.1, 1], rotate: [0, -20, 20, -10, 0] } : {}}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          ✊
        </motion.span>
        <span>{loading ? '…' : given ? "OoWop'd!" : 'OoWop'}</span>

        {/* Platinum indicator */}
        {giverWeight > 1 && (
          <span className="text-xs font-black" style={{ color: '#FFD700' }}>✦</span>
        )}

        {/* Burst particles */}
        <AnimatePresence>
          {burst && (
            <div className="absolute inset-0 pointer-events-none overflow-visible">
              {PARTICLES.map((p, i) => (
                <motion.span
                  key={i}
                  className="absolute font-bold"
                  style={{
                    left: '50%', top: '50%',
                    color: ['#FFD700', '#1877F2', '#FF6B2B', '#22C55E', '#EC4899', '#8B5CF6'][i],
                    fontSize: `${8 + i * 2}px`,
                  }}
                  initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                  animate={{
                    opacity: 0,
                    x: Math.cos((i / PARTICLES.length) * Math.PI * 2) * 40,
                    y: Math.sin((i / PARTICLES.length) * Math.PI * 2) * 40,
                    scale: 0,
                  }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                >
                  {p}
                </motion.span>
              ))}
            </div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Count + validation badge */}
      <div className="flex items-center gap-1.5">
        <span className={`font-bold ${sizes[size].btn.includes('text-sm') ? 'text-sm' : 'text-base'}`}
          style={{ color: given ? '#F59E0B' : (isNight ? '#4A4F72' : '#6B7280') }}>
          {count}
        </span>
        {showValidation && (
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{
              background: isValidated ? (isNight ? '#0D2D1A' : '#DCFCE7') : (isNight ? '#1E2240' : '#F3F4F6'),
              color:      isValidated ? '#16A34A' : (isNight ? '#4A4F72' : '#9CA3AF'),
            }}>
            {isValidated ? '✓ Validated' : `${count}/${oowopsNeeded}`}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Validation Celebration ─────────────────────────────────────────────────

export function OoWopValidationCelebration({ onDismiss }: { onDismiss: () => void }) {
  const { theme } = useVillageTheme();
  const isNight   = theme === 'night';

  useEffect(() => {
    VillageSound.validated();
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, []);

  const rings = [0, 1, 2];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
      onClick={onDismiss}
    >
      {/* Ring pulses */}
      {rings.map(i => (
        <motion.div
          key={i}
          className="absolute rounded-full border-2"
          style={{ borderColor: isNight ? '#FFB84D' : '#F59E0B' }}
          initial={{ width: 80, height: 80, opacity: 0.8 }}
          animate={{ width: 300, height: 300, opacity: 0 }}
          transition={{ duration: 1.5, delay: i * 0.4, ease: 'easeOut', repeat: Infinity, repeatDelay: 0.8 }}
        />
      ))}

      <motion.div
        initial={{ scale: 0.4, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.5, opacity: 0 }}
        transition={{ type: 'spring', damping: 12 }}
        className="relative rounded-3xl p-8 text-center max-w-xs mx-4 shadow-2xl"
        style={{
          background: isNight ? '#0E1020' : '#FFFFFF',
          border: `2px solid ${isNight ? '#FFB84D' : '#F59E0B'}`,
        }}
        onClick={e => e.stopPropagation()}
      >
        <motion.div
          animate={{ rotate: [0, -15, 15, -10, 10, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-7xl mb-4"
        >
          ✊
        </motion.div>

        <h2 className="text-2xl font-black mb-2" style={{ color: isNight ? '#FFB84D' : '#D97706' }}>
          Step Validated!
        </h2>
        <p className="text-sm leading-relaxed mb-5"
          style={{ color: isNight ? '#C8C3B8' : '#6B7280' }}>
          The village believes in you.<br />Your becoming is real. Keep going. 🔥
        </p>
        <button onClick={onDismiss}
          className="w-full rounded-full py-3 font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #1877F2, #8B5CF6)' }}>
          Continue →
        </button>
      </motion.div>
    </motion.div>
  );
}
