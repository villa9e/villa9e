'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';

interface XPData {
  total_xp:        number;
  current_level:   number;
  xp_to_next_level:number;
  streak_days:     number;
}

// XP thresholds per level
const LEVEL_NAMES: Record<number, string> = {
  1:  'Seedling',   2:  'Sprout',   3:  'Grower',
  4:  'Builder',    5:  'Maker',    6:  'Achiever',
  7:  'Champion',   8:  'Elder',    9:  'Legend',
  10: 'Godlike',
};

const LEVEL_EMOJIS: Record<number, string> = {
  1: '🌱', 2: '🌿', 3: '🌲', 4: '🔨', 5: '⚒️',
  6: '🏆', 7: '⚡', 8: '🌟', 9: '👑', 10: '🔱',
};

export function XPBar({ userId }: { userId: string }) {
  const [xp, setXp]         = useState<XPData | null>(null);
  const [levelUp, setLevelUp] = useState<number | null>(null);
  const supabase = createClient();
  const { theme } = useVillageTheme();
  const isNight  = theme === 'night';

  useEffect(() => {
    loadXP();
    // Listen for XP updates
    const channel = supabase.channel(`xp_${userId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'user_xp', filter: `user_id=eq.${userId}` }, p => {
        const prev = xp?.current_level;
        const next = (p.new as any).current_level;
        setXp(p.new as XPData);
        if (prev && next > prev) setLevelUp(next);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  async function loadXP() {
    const { data } = await (supabase as any).from('user_xp').select('*').eq('user_id', userId).single();
    if (data) setXp(data);
  }

  if (!xp) return null;

  const pct = Math.min(100, Math.round((xp.total_xp % xp.xp_to_next_level) / xp.xp_to_next_level * 100));
  const levelName = LEVEL_NAMES[xp.current_level] ?? 'Village Member';
  const levelEmoji = LEVEL_EMOJIS[xp.current_level] ?? '✨';
  const nextLevelName = LEVEL_NAMES[xp.current_level + 1] ?? 'Legendary';

  return (
    <>
      {/* Level-up celebration */}
      <AnimatePresence>
        {levelUp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            onClick={() => setLevelUp(null)}
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-center p-8 rounded-3xl max-w-xs w-full mx-4"
              style={{ background: isNight ? '#12152A' : '#fff', border: '2px solid #FFD700' }}
            >
              <div className="text-7xl mb-4">{LEVEL_EMOJIS[levelUp] ?? '🌟'}</div>
              <h2 className="text-2xl font-black" style={{ color: '#FFD700' }}>Level Up!</h2>
              <p className="font-bold text-lg mt-1" style={{ color: isNight ? '#F0EBE0' : '#1E1B4B' }}>
                You are now a {LEVEL_NAMES[levelUp]}
              </p>
              <p className="text-sm mt-2" style={{ color: isNight ? '#7A7FA8' : '#6B7280' }}>
                The village recognizes your becoming.
              </p>
              <button onClick={() => setLevelUp(null)}
                className="mt-6 w-full rounded-full py-2.5 font-bold text-white"
                style={{ background: '#1877F2' }}>
                Keep Going →
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* XP bar */}
      <div className="px-4 py-2" style={{ borderBottom: `1px solid ${isNight ? '#1E2240' : '#EDE9FE'}` }}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <span className="text-base">{levelEmoji}</span>
            <span className="text-xs font-bold" style={{ color: isNight ? '#F0EBE0' : '#1E1B4B' }}>
              Lv {xp.current_level} · {levelName}
            </span>
            {xp.streak_days > 0 && (
              <span className="text-xs font-semibold" style={{ color: '#F97316' }}>
                🔥 {xp.streak_days}d
              </span>
            )}
          </div>
          <span className="text-xs" style={{ color: isNight ? '#4A4F72' : '#9CA3AF' }}>
            {xp.xp_to_next_level - (xp.total_xp % xp.xp_to_next_level)} XP to {nextLevelName}
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: isNight ? '#1E2240' : '#EDE9FE' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #1877F2, #8B5CF6)' }}
          />
        </div>
      </div>
    </>
  );
}

// Award XP + store Spirit memory after key actions
export async function awardXP(
  userId: string,
  xpAmount: number,
  reason: string
): Promise<{ leveled_up: boolean; new_level: number }> {
  const supabase = createClient();
  const { data: current } = await (supabase as any)
    .from('user_xp')
    .select('total_xp, current_level, xp_to_next_level')
    .eq('user_id', userId)
    .single();

  if (!current) return { leveled_up: false, new_level: 1 };

  const newTotal    = (current.total_xp ?? 0) + xpAmount;
  const threshold   = current.xp_to_next_level ?? 100;
  const leveled_up  = newTotal >= (current.current_level * threshold);
  const new_level   = leveled_up ? (current.current_level ?? 1) + 1 : (current.current_level ?? 1);
  const next_thresh = new_level * threshold;

  await (supabase as any).from('user_xp').update({
    total_xp:          newTotal,
    current_level:     new_level,
    xp_to_next_level:  leveled_up ? next_thresh : threshold,
    last_activity_date: new Date().toISOString().slice(0, 10),
  }).eq('user_id', userId);

  return { leveled_up, new_level };
}
