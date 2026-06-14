'use client';
// Shared full-screen countdown overlay used before launching a GPS
// (Spirit chat "Start my GPS" and Goal DNA "Quick clone").
// Sequence per WORKSHOP_SPEC §9: 3 "Get ready..." -> 2 "Almost there..."
// -> 1 "Let's go..." -> 0 "Let's GO" (held 800ms before completing).
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const COUNTDOWN_LABELS: Record<number, string> = {
  3: 'Get ready...', 2: 'Almost there...', 1: "Let's go...", 0: "Let's GO",
};

export function CountdownOverlay({ onComplete }: { onComplete: () => void }) {
  const [count, setCount] = useState(3);
  useEffect(() => {
    const delay = count > 0 ? 900 : 800;
    const t = setTimeout(() => {
      if (count > 0) setCount(c => c - 1);
      else onComplete();
    }, delay);
    return () => clearTimeout(t);
  }, [count, onComplete]);

  const isGo = count <= 0;

  return (
    <motion.div className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at center, #1A0A2E 0%, var(--v-bg) 100%)' }}>
      <div className="text-center">
        <AnimatePresence mode="wait">
          <motion.div key={count}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.6, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center mx-auto"
            style={{ width: 120, height: 120, borderRadius: '50%', border: `3px solid ${isGo ? '#22C55E' : '#7C3AED'}` }}>
            <span className={isGo ? 'text-2xl font-black' : 'text-6xl font-black'}
              style={{ color: isGo ? '#22C55E' : '#A78BFA', textShadow: isGo ? '0 0 60px rgba(34,197,94,0.8)' : '0 0 60px rgba(124,58,237,0.8)' }}>
              {isGo ? "Let's GO 🚀" : count}
            </span>
          </motion.div>
        </AnimatePresence>
        <motion.p key={`label-${count}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="mt-4 text-sm font-bold" style={{ color: 'rgba(255,255,255,0.7)' }}>
          {COUNTDOWN_LABELS[count]}
        </motion.p>
      </div>
    </motion.div>
  );
}
