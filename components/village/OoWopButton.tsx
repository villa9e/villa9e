'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface OoWopButtonProps {
  count: number;
  hasGiven?: boolean;
  onGive: () => Promise<void>;
  size?: 'sm' | 'md' | 'lg';
  showValidation?: boolean;
  oowopsNeeded?: number;
}

export function OoWopButton({ count, hasGiven = false, onGive, size = 'md', showValidation, oowopsNeeded = 3 }: OoWopButtonProps) {
  const [given, setGiven] = useState(hasGiven);
  const [loading, setLoading] = useState(false);
  const [burst, setBurst] = useState(false);
  const isValidated = count >= oowopsNeeded;

  const sizeMap = { sm: 'text-sm', md: 'text-base', lg: 'text-lg' };
  const iconSize = { sm: 'text-lg', md: 'text-2xl', lg: 'text-3xl' };

  async function handleClick() {
    if (given || loading) return;
    setLoading(true);
    try {
      await onGive();
      setGiven(true);
      setBurst(true);
      setTimeout(() => setBurst(false), 600);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <motion.button
        onClick={handleClick}
        disabled={given || loading}
        whileHover={!given ? { scale: 1.1 } : {}}
        whileTap={!given ? { scale: 0.9 } : {}}
        className={`relative flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-all font-medium ${sizeMap[size]} ${
          given
            ? 'bg-yellow-50 text-yellow-600 cursor-default'
            : 'bg-blue-50 text-village-blue hover:bg-blue-100 cursor-pointer'
        } ${loading ? 'opacity-60' : ''}`}
      >
        {/* Fist icon */}
        <motion.span
          className={iconSize[size]}
          animate={burst ? { scale: [1, 1.5, 1], rotate: [0, -15, 15, 0] } : {}}
          transition={{ duration: 0.4 }}
          style={{ filter: given ? 'sepia(1) saturate(3) hue-rotate(10deg)' : 'none' }}
        >
          ✊
        </motion.span>
        <span>{given ? 'OoWop'd!' : 'OoWop!'}</span>

        {/* Burst particles */}
        <AnimatePresence>
          {burst && (
            <div className="absolute inset-0 pointer-events-none">
              {['★', '✦', '·', '◆'].map((p, i) => (
                <motion.span
                  key={i}
                  className="absolute text-yellow-400 text-xs"
                  style={{ left: '50%', top: '50%' }}
                  initial={{ opacity: 1, x: 0, y: 0 }}
                  animate={{
                    opacity: 0,
                    x: (Math.cos((i / 4) * Math.PI * 2) * 30),
                    y: (Math.sin((i / 4) * Math.PI * 2) * 30),
                  }}
                  transition={{ duration: 0.5 }}
                >
                  {p}
                </motion.span>
              ))}
            </div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Count + validation */}
      <div className="flex items-center gap-1.5">
        <span className={`font-semibold ${sizeMap[size]} ${given ? 'text-yellow-600' : 'text-gray-600'}`}>
          {count}
        </span>

        {showValidation && (
          <div className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            isValidated
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-500'
          }`}>
            {isValidated ? '✓ Validated' : `${count}/${oowopsNeeded}`}
          </div>
        )}
      </div>
    </div>
  );
}

// Validated step celebration overlay
export function OoWopValidationCelebration({ onDismiss }: { onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onDismiss}
    >
      <motion.div
        initial={{ scale: 0.5, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.5, opacity: 0 }}
        className="bg-white rounded-3xl p-8 text-center max-w-sm mx-4 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-6xl mb-4"
        >
          ✊
        </motion.div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Step Validated!</h2>
        <p className="text-gray-500 mb-6">The village believes in you. Keep going! 🔥</p>
        <button onClick={onDismiss} className="village-btn-primary w-full">
          Continue →
        </button>
      </motion.div>
    </motion.div>
  );
}
