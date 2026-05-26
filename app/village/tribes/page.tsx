'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { VillageHeader } from '@/components/village/VillageHeader';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';

export default function TribesPage() {
  const [tribes, setTribes] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => { loadTribes(); supabase.auth.getUser().then(({ data: { user } }) => setUserId(user?.id ?? null)); }, []);

  async function loadTribes() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('tribe_members')
      .select('tribe_id, tribes(*, tribe_members(user_id))')
      .eq('user_id', user.id);
    setTribes(data?.map((d: any) => d.tribes).filter(Boolean) ?? []);
  }

  async function createTribe() {
    if (!form.name.trim()) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: tribe } = await supabase.from('tribes').insert({ name: form.name, description: form.description, creator_id: user.id }).select().single();
      if (tribe) {
        await supabase.from('tribe_members').insert({ tribe_id: tribe.id, user_id: user.id, role: 'founder' });
        loadTribes();
        setShowCreate(false);
        setForm({ name: '', description: '' });
      }
    }
    setSaving(false);
  }

  const { theme } = useVillageTheme();
  const isNight  = theme === 'night';
  const bg       = isNight ? '#0A0B12' : '#FFF0F8';
  const cardBg   = isNight ? '#12152A' : '#FFFFFF';
  const border   = isNight ? '#1E2240' : '#FBCFE8';
  const textMain = isNight ? '#F0EBE0' : '#2D0D1F';
  const textMute = isNight ? '#4A4F72' : '#9D174D';
  const accent   = isNight ? '#F472B6' : '#DB2777';

  return (
    <div className="min-h-screen" style={{ background: bg }}>
      <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 border-b"
        style={{ background: isNight ? '#12152A' : accent, borderColor: isNight ? '#1E2240' : 'transparent' }}>
        <a href="/village/map" className="text-xl" style={{ color: isNight ? '#F0EBE0' : '#fff' }}>←</a>
        <span className="text-2xl">👥</span>
        <div className="flex-1">
          <h1 className="text-lg font-black" style={{ color: isNight ? '#F0EBE0' : '#fff' }}>Tribes</h1>
          <p className="text-xs opacity-70" style={{ color: isNight ? '#7A7FA8' : '#fff' }}>Your project teams & communities</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="rounded-full px-3 py-1 text-sm font-bold"
          style={{ background: isNight ? '#1E2240' : 'rgba(255,255,255,0.2)', color: '#fff' }}>
          + Create
        </button>
        <button onClick={() => {}} className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: isNight ? '#1E2240' : 'rgba(255,255,255,0.15)' }}>
          <span className="text-base">☀️</span>
        </button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md p-6 space-y-4 rounded-3xl"
            style={{ background: cardBg, border: `1px solid ${border}` }}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black" style={{ color: textMain }}>Create a Tribe</h2>
              <button onClick={() => setShowCreate(false)} className="text-2xl" style={{ color: textMute }}>×</button>
            </div>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Tribe name (e.g. 'The EP Squad')"
              className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
              style={{ background: isNight ? '#0A0B12' : '#FFF0F8', border: `1px solid ${border}`, color: textMain }} />
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="What is this tribe working toward?" rows={3}
              className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none resize-none"
              style={{ background: isNight ? '#0A0B12' : '#FFF0F8', border: `1px solid ${border}`, color: textMain }} />
            <button onClick={createTribe} disabled={saving || !form.name.trim()}
              className="w-full rounded-full py-3 font-bold transition-colors disabled:opacity-50"
              style={{ background: accent, color: '#fff' }}>
              {saving ? 'Creating…' : '👥 Create Tribe'}
            </button>
          </motion.div>
        </div>
      )}

      <div className="max-w-2xl mx-auto p-4 space-y-3">
        {tribes.map((tribe, i) => (
          <Link key={tribe.id} href={`/village/tribes/${tribe.id}`}>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="rounded-2xl p-4 cursor-pointer transition-all"
              style={{ background: cardBg, border: `1px solid ${border}` }}>
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: isNight ? '#1E2240' : '#FCE7F3' }}>👥</div>
                <div className="flex-1">
                  <p className="font-bold" style={{ color: textMain }}>{tribe.name}</p>
                  {tribe.description && <p className="text-sm mt-0.5 line-clamp-2" style={{ color: textMute }}>{tribe.description}</p>}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs" style={{ color: textMute }}>{tribe.tribe_members?.length ?? 0} members</span>
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: isNight ? '#0D2D1A' : '#DCFCE7', color: '#16A34A' }}>
                      {tribe.project_status ?? 'active'}
                    </span>
                  </div>
                </div>
                <span className="text-xl" style={{ color: textMute }}>›</span>
              </div>
              <div className="flex gap-2 mt-3">
                {[{ label: '📋 Tasks', color: accent }, { label: '💬 Chat', color: '#1877F2' }, { label: '👥 Members', color: textMute }].map(tab => (
                  <span key={tab.label} className="flex-1 text-center rounded-full py-2 text-xs font-bold"
                    style={{ background: isNight ? '#0A0B12' : '#FDF2F8', color: tab.color }}>
                    {tab.label}
                  </span>
                ))}
              </div>
            </motion.div>
          </Link>
        ))}

        {tribes.length === 0 && (
          <div className="text-center py-16">
            <p className="text-5xl mb-3">👥</p>
            <p className="mb-2" style={{ color: textMute }}>No tribes yet.</p>
            <p className="text-sm mb-6" style={{ color: isNight ? '#4A4F72' : '#BE185D' }}>Tribes form when you collaborate on goals. Create one to build together.</p>
            <button onClick={() => setShowCreate(true)}
              className="rounded-full px-6 py-3 font-bold text-white"
              style={{ background: accent }}>
              + Create My First Tribe
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
