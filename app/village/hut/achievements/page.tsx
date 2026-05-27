'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';

const RARITY_CONFIG: Record<string, { label: string; color: string; glow: string }> = {
  legendary: { label: 'Legendary', color: '#F59E0B', glow: 'rgba(245,158,11,0.3)' },
  epic:      { label: 'Epic',      color: '#8B5CF6', glow: 'rgba(139,92,246,0.25)' },
  rare:      { label: 'Rare',      color: '#3B82F6', glow: 'rgba(59,130,246,0.2)' },
  common:    { label: 'Common',    color: '#6B7280', glow: 'rgba(107,114,128,0.15)' },
};

export default function AchievementsPage() {
  const [earned, setEarned]     = useState<any[]>([]);
  const [all, setAll]           = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all'); // all | goals | habits | community | spirit | special
  const supabase = createClient();
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';

  const bg      = isNight ? '#0A0B12' : '#F8FAFF';
  const cardBg  = isNight ? '#12152A' : '#FFFFFF';
  const border  = isNight ? '#1E2240' : '#E0E7FF';
  const text    = isNight ? '#F0EBE0' : '#1E1B4B';
  const muted   = isNight ? '#4A4F72' : '#6B7280';

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: earnedData }, { data: allData }] = await Promise.all([
        (supabase as any).from('user_achievements')
          .select('achievement_id, earned_at, achievements(*)')
          .eq('user_id', user.id),
        (supabase as any).from('achievements').select('*').order('rarity'),
      ]);

      const earnedSet = new Set((earnedData ?? []).map((e: any) => e.achievement_id));
      setEarned(earnedData ?? []);
      // Merge: mark each achievement as earned/not
      setAll((allData ?? []).map((a: any) => ({
        ...a,
        earned: earnedSet.has(a.id),
        earned_at: (earnedData ?? []).find((e: any) => e.achievement_id === a.id)?.earned_at,
      })));
      setLoading(false);
    }
    load();
  }, []);

  const CATEGORIES = ['all', 'goals', 'habits', 'community', 'spirit', 'special'];

  const filtered = all.filter(a => filter === 'all' || a.category === filter);
  const earnedCount = all.filter(a => a.earned).length;
  const totalVlg    = earned.reduce((sum, e) => sum + (e.achievements?.points ?? 0), 0);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: bg }}>
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen pb-24" style={{ background: bg }}>
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 border-b"
        style={{ background: isNight ? '#0A0B12' : '#fff', borderColor: border }}>
        <Link href="/village/hut" className="text-xl" style={{ color: muted }}>←</Link>
        <div className="flex-1">
          <h1 className="font-black text-base" style={{ color: text }}>Achievements</h1>
          <p className="text-xs" style={{ color: muted }}>{earnedCount}/{all.length} earned · {totalVlg.toLocaleString()} VLG from badges</p>
        </div>
        <div className="text-2xl">🏆</div>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3 px-4 pt-4 pb-2">
        {[
          { label: 'Earned', val: earnedCount, color: '#1877F2' },
          { label: 'Remaining', val: all.length - earnedCount, color: muted },
          { label: 'VLG Earned', val: `+${totalVlg}`, color: '#F59E0B' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-3 text-center" style={{ background: cardBg, border: `1px solid ${border}` }}>
            <p className="text-xl font-black" style={{ color: s.color }}>{s.val}</p>
            <p className="text-xs" style={{ color: muted }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto px-4 py-2 pb-3" style={{ scrollbarWidth: 'none' }}>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)}
            className="flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-full capitalize transition-all"
            style={{
              background: filter === cat ? '#1877F2' : (isNight ? '#1E2240' : '#EEF2FF'),
              color:      filter === cat ? '#fff' : muted,
            }}>
            {cat}
          </button>
        ))}
      </div>

      {/* Badge grid */}
      <div className="px-4 grid grid-cols-2 gap-3">
        {filtered.map((ach, i) => {
          const r = RARITY_CONFIG[ach.rarity ?? 'common'];
          return (
            <motion.div
              key={ach.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-2xl p-4 space-y-2 relative"
              style={{
                background:  ach.earned ? cardBg : (isNight ? '#080912' : '#F3F4F6'),
                border:      `1px solid ${ach.earned ? r.color + '40' : border}`,
                boxShadow:   ach.earned ? `0 0 16px ${r.glow}` : 'none',
                opacity:     ach.earned ? 1 : 0.5,
              }}
            >
              {/* Earned indicator */}
              {ach.earned && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs"
                  style={{ background: '#22C55E' }}>✓</div>
              )}

              <div className="text-4xl">{ach.icon}</div>

              <div>
                <p className="font-black text-sm" style={{ color: ach.earned ? text : muted }}>
                  {ach.title}
                </p>
                <p className="text-xs leading-relaxed mt-0.5" style={{ color: muted }}>
                  {ach.description}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: r.color + '15', color: r.color }}>
                  {r.label}
                </span>
                <span className="text-xs font-bold" style={{ color: '#F59E0B' }}>
                  +{ach.points} VLG
                </span>
              </div>

              {ach.earned && ach.earned_at && (
                <p className="text-xs" style={{ color: muted }}>
                  Earned {new Date(ach.earned_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                </p>
              )}
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16" style={{ color: muted }}>
          <p className="text-4xl mb-3">🏆</p>
          <p className="font-bold" style={{ color: text }}>No achievements in this category yet</p>
        </div>
      )}
    </div>
  );
}
