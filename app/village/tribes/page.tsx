'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

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

  return (
    <div className="min-h-screen bg-village-bg">
      <div className="bg-pink-600 text-white px-6 py-4 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/village/map" className="text-xl">←</Link>
        <span className="text-2xl">👥</span>
        <div className="flex-1">
          <h1 className="text-xl font-bold leading-tight">Tribes</h1>
          <p className="text-pink-100 text-xs">Your project teams & communities</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="bg-white text-pink-700 rounded-full px-3 py-1 text-sm font-bold">
          + Create
        </button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between"><h2 className="text-xl font-bold">Create a Tribe</h2><button onClick={() => setShowCreate(false)} className="text-gray-400 text-2xl">×</button></div>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Tribe name (e.g. 'The EP Squad')" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400" />
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What is this tribe working toward?" rows={3} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none" />
            <button onClick={createTribe} disabled={saving || !form.name.trim()} className="w-full bg-pink-600 text-white rounded-full py-3 font-bold hover:bg-pink-700 disabled:opacity-50">
              {saving ? 'Creating…' : '👥 Create Tribe'}
            </button>
          </motion.div>
        </div>
      )}

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {tribes.map((tribe, i) => (
          <motion.div key={tribe.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="village-card hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-pink-100 flex items-center justify-center text-2xl">👥</div>
              <div className="flex-1">
                <p className="font-bold">{tribe.name}</p>
                {tribe.description && <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{tribe.description}</p>}
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-gray-400">{tribe.tribe_members?.length ?? 0} members</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${tribe.project_status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{tribe.project_status}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button className="flex-1 bg-pink-50 text-pink-700 rounded-full py-2 text-xs font-bold hover:bg-pink-100">📋 Tasks</button>
              <button className="flex-1 bg-blue-50 text-village-blue rounded-full py-2 text-xs font-bold hover:bg-blue-100">📹 Meet</button>
              <button className="flex-1 bg-gray-50 text-gray-600 rounded-full py-2 text-xs font-bold hover:bg-gray-100">💬 Chat</button>
            </div>
          </motion.div>
        ))}

        {tribes.length === 0 && (
          <div className="text-center py-16">
            <p className="text-5xl mb-3">👥</p>
            <p className="text-gray-500 mb-2">No tribes yet.</p>
            <p className="text-sm text-gray-400 mb-6">Tribes form when you add people to a goal. Create one to collaborate on anything.</p>
            <button onClick={() => setShowCreate(true)} className="village-btn-primary">+ Create My First Tribe</button>
          </div>
        )}
      </div>
    </div>
  );
}
