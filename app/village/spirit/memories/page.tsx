'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';

const MEMORY_TYPE_CONFIG: Record<string, { emoji: string; label: string; color: string }> = {
  conversation:     { emoji: '💬', label: 'Conversations',    color: '#1877F2' },
  goal_set:         { emoji: '🎯', label: 'Goals Set',        color: '#E8770A' },
  step_completed:   { emoji: '✅', label: 'Steps Done',       color: '#22C55E' },
  pattern:          { emoji: '📊', label: 'Patterns',         color: '#8B5CF6' },
  check_in:         { emoji: '🌅', label: 'Check-ins',        color: '#0D9488' },
  milestone:        { emoji: '🏁', label: 'Milestones',       color: '#FFD700' },
  insight:          { emoji: '💡', label: 'Insights',         color: '#F59E0B' },
  archetype_update: { emoji: '🧬', label: 'Archetype',        color: '#EC4899' },
};

export default function SpiritMemoriesPage() {
  const [memories, setMemories]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState<string | null>(null);
  const [deleting, setDeleting]   = useState<string | null>(null);
  const [patterns, setPatterns]   = useState<any>(null);
  const supabase = createClient();
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';

  const bg     = isNight ? '#060810' : '#F0F4FF';
  const card   = isNight ? '#0D1020' : '#FFFFFF';
  const border = isNight ? '#1A1F3A' : '#E0E7FF';
  const text   = isNight ? '#F0EBE0' : '#1E1B4B';
  const muted  = isNight ? '#4A4F72' : '#6D28D9';

  useEffect(() => {
    load();
  }, [filter]);

  async function load() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let q = (supabase as any)
      .from('spirit_memories')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(80);

    if (filter) q = q.eq('memory_type', filter);

    const [{ data: mems }, { data: pat }] = await Promise.all([
      q,
      (supabase as any).from('spirit_patterns').select('*').eq('user_id', user.id).single(),
    ]);

    setMemories(mems ?? []);
    setPatterns(pat);
    setLoading(false);
  }

  async function deleteMemory(id: string) {
    setDeleting(id);
    await (supabase as any).from('spirit_memories').delete().eq('id', id);
    setMemories(prev => prev.filter(m => m.id !== id));
    setDeleting(null);
  }

  const types = Array.from(new Set(memories.map(m => m.memory_type)));
  const importanceBar = (importance: number) => (
    <div className="flex gap-0.5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="h-1.5 w-1.5 rounded-full"
          style={{ background: i < importance ? '#1877F2' : 'rgba(255,255,255,0.1)' }} />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen pb-24" style={{ background: bg }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 py-3 flex items-center gap-3"
        style={{ background: isNight ? 'rgba(6,8,16,0.92)' : 'rgba(240,244,255,0.92)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${border}` }}>
        <Link href="/village/spirit" className="text-xl" style={{ color: muted }}>←</Link>
        <span className="text-2xl">🧠</span>
        <div className="flex-1">
          <h1 className="text-lg font-black" style={{ color: text }}>Spirit Memory</h1>
          <p className="text-xs" style={{ color: muted }}>What Spirit knows about you</p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
          style={{ background: 'rgba(24,119,242,0.1)', color: '#60a5fa' }}>
          {memories.length} memories
        </span>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">

        {/* Patterns overview */}
        {patterns && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-4"
            style={{ background: isNight ? 'rgba(24,119,242,0.08)' : 'rgba(24,119,242,0.05)', border: `1px solid rgba(24,119,242,0.2)` }}>
            <p className="font-black text-sm mb-3" style={{ color: '#60a5fa' }}>🌀 Spirit's Understanding of You</p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                { label: 'Goals set',          value: patterns.goals_set ?? 0 },
                { label: 'Goals completed',     value: patterns.goals_completed ?? 0 },
                { label: 'OoWops given',        value: patterns.oowops_given ?? 0 },
                { label: 'Streak (days)',        value: patterns.streak_days ?? 0 },
                { label: 'Spirit sessions',     value: patterns.spirit_calls_total ?? 0 },
                { label: 'Growth velocity',     value: `${patterns.growth_velocity ?? 0}/mo` },
              ].map(stat => (
                <div key={stat.label} className="flex items-center justify-between">
                  <span style={{ color: muted }}>{stat.label}</span>
                  <span className="font-bold" style={{ color: text }}>{stat.value}</span>
                </div>
              ))}
            </div>
            {patterns.primary_strength && (
              <div className="mt-3 pt-3" style={{ borderTop: `1px solid rgba(24,119,242,0.15)` }}>
                <p className="text-xs" style={{ color: muted }}>
                  <span className="font-bold" style={{ color: '#60a5fa' }}>Strength:</span> {patterns.primary_strength}
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Filter pills */}
        {types.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setFilter(null)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{ background: !filter ? '#1877F2' : (isNight ? 'rgba(255,255,255,0.06)' : '#F0F4FF'), color: !filter ? '#fff' : muted, border: `1px solid ${!filter ? '#1877F2' : border}` }}>
              All
            </button>
            {types.map(type => {
              const cfg = MEMORY_TYPE_CONFIG[type] ?? { emoji: '📝', label: type, color: '#6B7280' };
              return (
                <button key={type} onClick={() => setFilter(filter === type ? null : type)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5"
                  style={{ background: filter === type ? cfg.color : (isNight ? 'rgba(255,255,255,0.06)' : '#F0F4FF'), color: filter === type ? '#fff' : muted, border: `1px solid ${filter === type ? cfg.color : border}` }}>
                  <span>{cfg.emoji}</span>
                  {cfg.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Memories list */}
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: card }} />
          ))
        ) : memories.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-3">🧠</p>
            <p className="font-bold text-sm mb-1" style={{ color: text }}>No memories yet</p>
            <p className="text-xs" style={{ color: muted }}>Chat with Spirit, complete goals, and do check-ins to build your memory.</p>
            <Link href="/village/spirit"
              className="inline-block mt-4 px-5 py-2.5 rounded-full text-xs font-black text-white"
              style={{ background: '#1877F2' }}>
              Talk to Spirit →
            </Link>
          </div>
        ) : (
          <AnimatePresence>
            {memories.map((mem, i) => {
              const cfg = MEMORY_TYPE_CONFIG[mem.memory_type] ?? { emoji: '📝', label: mem.memory_type, color: '#6B7280' };
              return (
                <motion.div key={mem.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 40, scale: 0.95 }}
                  transition={{ delay: Math.min(i * 0.03, 0.4) }}
                  className="rounded-2xl p-4"
                  style={{ background: card, border: `1px solid ${border}` }}>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                      style={{ background: cfg.color + '20' }}>
                      {cfg.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ background: cfg.color + '15', color: cfg.color }}>
                          {cfg.label}
                        </span>
                        <span className="text-xs" style={{ color: muted }}>
                          {new Date(mem.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: text }}>{mem.content}</p>
                      <div className="mt-2">
                        {importanceBar(mem.importance ?? 5)}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteMemory(mem.id)}
                      disabled={deleting === mem.id}
                      className="text-xs px-2 py-1 rounded-lg transition-colors flex-shrink-0 disabled:opacity-40"
                      style={{ color: isNight ? '#3A3F5A' : '#D1D5DB', background: 'transparent' }}
                      title="Remove this memory">
                      {deleting === mem.id ? '…' : '×'}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}

        {/* Privacy note */}
        <p className="text-center text-xs py-2" style={{ color: isNight ? '#1A2030' : '#C4B5FD' }}>
          These memories help Spirit personalize guidance for you. You control them.
        </p>
      </div>
    </div>
  );
}
