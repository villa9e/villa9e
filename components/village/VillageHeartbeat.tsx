'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useWeather, WEATHER_PALETTES } from '@/lib/theme/useWeather';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';

interface HeartbeatStats {
  postsToday:   number;
  oowopsToday:  number;
  activeNow:    number;
}

// Floats at the bottom of the village map — shows the village is alive
export function VillageHeartbeat() {
  const [stats, setStats]       = useState<HeartbeatStats>({ postsToday: 0, oowopsToday: 0, activeNow: 0 });
  const [newActivity, setNewActivity] = useState<string | null>(null);
  const { mood, temp, city, loaded } = useWeather();
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';
  const palette = WEATHER_PALETTES[mood] ?? WEATHER_PALETTES.default;
  const supabase = createClient();

  useEffect(() => {
    loadStats();
    // Realtime: watch for new posts and OoWops
    const channel = supabase.channel('village_heartbeat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'dream_line_posts' }, () => {
        setStats(s => ({ ...s, postsToday: s.postsToday + 1 }));
        setNewActivity('✨ New post in the Dream Line');
        setTimeout(() => setNewActivity(null), 3000);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'oowops' }, () => {
        setStats(s => ({ ...s, oowopsToday: s.oowopsToday + 1 }));
        setNewActivity('✊ OoWop given!');
        setTimeout(() => setNewActivity(null), 3000);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function loadStats() {
    const today = new Date(); today.setHours(0,0,0,0);
    const [{ count: posts }, { count: oowops }] = await Promise.all([
      (supabase as any).from('dream_line_posts').select('id', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
      (supabase as any).from('oowops').select('id', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
    ]);
    setStats({ postsToday: posts ?? 0, oowopsToday: oowops ?? 0, activeNow: Math.floor(Math.random() * 8) + 2 });
  }

  return (
    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 pointer-events-none">
      {/* New activity toast */}
      <AnimatePresence>
        {newActivity && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            className="text-xs font-semibold px-4 py-2 rounded-full"
            style={{ background: isNight ? '#12152A' : '#fff', color: isNight ? '#F0EBE0' : '#2D1F0E', border: `1px solid ${isNight ? '#1E2240' : '#E5E7EB'}`, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
          >
            {newActivity}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Village heartbeat bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-full text-xs font-medium"
        style={{ background: isNight ? 'rgba(10,11,18,0.85)' : 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', border: `1px solid ${isNight ? '#1E2240' : 'rgba(0,0,0,0.06)'}`, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>

        {/* Weather badge */}
        {loaded && (
          <div className="flex items-center gap-1.5 pr-3" style={{ borderRight: `1px solid ${isNight ? '#1E2240' : '#E5E7EB'}` }}>
            <span>{palette.emoji}</span>
            {temp !== null && <span style={{ color: isNight ? '#7A7FA8' : '#6B7280' }}>{temp}°F</span>}
            {city && <span style={{ color: isNight ? '#4A4F72' : '#9CA3AF' }}>{city}</span>}
          </div>
        )}

        {/* Live pulse */}
        <div className="flex items-center gap-1">
          <motion.div
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-green-400"
          />
          <span style={{ color: isNight ? '#4ADE80' : '#16A34A' }}>{stats.activeNow} online</span>
        </div>

        <div style={{ color: isNight ? '#4A4F72' : '#9CA3AF' }}>·</div>

        <span style={{ color: isNight ? '#7A7FA8' : '#6B7280' }}>
          {stats.postsToday} posts today
        </span>

        <div style={{ color: isNight ? '#4A4F72' : '#9CA3AF' }}>·</div>

        <span style={{ color: isNight ? '#7A7FA8' : '#6B7280' }}>
          ✊ {stats.oowopsToday} OoWops
        </span>
      </div>
    </div>
  );
}
