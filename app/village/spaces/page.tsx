'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function SpacesPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', location: '', start_time: '', end_time: '', event_type: 'personal' });
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => { loadEvents(); }, []);

  async function loadEvents() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const now = new Date().toISOString();
    const { data } = await supabase.from('calendar_events').select('*').eq('creator_id', user.id).gte('end_time', now).order('start_time').limit(20);
    setEvents(data ?? []);
  }

  async function createEvent() {
    if (!form.title.trim() || !form.start_time) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('calendar_events').insert({
        creator_id:  user.id,
        title:       form.title,
        description: form.description,
        location:    form.location,
        start_time:  new Date(form.start_time).toISOString(),
        end_time:    form.end_time ? new Date(form.end_time).toISOString() : new Date(new Date(form.start_time).getTime() + 3600000).toISOString(),
        event_type:  form.event_type,
      });
      loadEvents();
      setShowCreate(false);
      setForm({ title: '', description: '', location: '', start_time: '', end_time: '', event_type: 'personal' });
    }
    setSaving(false);
  }

  const typeColors: Record<string,string> = {
    goal_step: 'bg-orange-100 text-orange-700',
    tribe_meeting: 'bg-pink-100 text-pink-700',
    personal: 'bg-blue-100 text-blue-700',
    public: 'bg-green-100 text-green-700',
  };

  return (
    <div className="min-h-screen bg-village-bg">
      <div className="bg-indigo-600 text-white px-6 py-4 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/village/map" className="text-xl">←</Link>
        <span className="text-2xl">📅</span>
        <div className="flex-1">
          <h1 className="text-xl font-bold leading-tight">Spaces</h1>
          <p className="text-indigo-200 text-xs">Every event is a full experience</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="bg-white text-indigo-700 rounded-full px-3 py-1 text-sm font-bold">
          + Event
        </button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between"><h2 className="text-xl font-bold">Create Event</h2><button onClick={() => setShowCreate(false)} className="text-gray-400 text-2xl">×</button></div>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Event title" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Location or video link" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500">Start</label>
                <input type="datetime-local" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
              <div>
                <label className="text-xs text-gray-500">End</label>
                <input type="datetime-local" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
            </div>
            <select value={form.event_type} onChange={e => setForm(f => ({ ...f, event_type: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
              <option value="personal">Personal</option>
              <option value="goal_step">Goal Step</option>
              <option value="tribe_meeting">Tribe Meeting</option>
              <option value="public">Public Event</option>
            </select>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description, agenda, notes…" rows={3} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
            <button onClick={createEvent} disabled={saving || !form.title.trim()} className="w-full bg-indigo-600 text-white rounded-full py-3 font-bold hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Creating…' : '📅 Create Event'}
            </button>
          </motion.div>
        </div>
      )}

      <div className="max-w-2xl mx-auto p-4 space-y-3">
        {events.map((ev, i) => {
          const start = new Date(ev.start_time);
          return (
            <motion.div key={ev.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="village-card hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 text-center bg-indigo-50 rounded-2xl p-2 min-w-[52px]">
                  <p className="text-xs text-indigo-400 font-medium">{start.toLocaleString('en-US', { month: 'short' }).toUpperCase()}</p>
                  <p className="text-2xl font-bold text-indigo-600 leading-none">{start.getDate()}</p>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold">{ev.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${typeColors[ev.event_type] || typeColors.personal}`}>{ev.event_type.replace('_', ' ')}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    {ev.location && ` · ${ev.location}`}
                  </p>
                  {ev.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{ev.description}</p>}
                </div>
              </div>
            </motion.div>
          );
        })}

        {events.length === 0 && (
          <div className="text-center py-16">
            <p className="text-5xl mb-3">📅</p>
            <p className="text-gray-500 mb-2">No upcoming events.</p>
            <p className="text-sm text-gray-400 mb-6">Spaces treats every event as a full experience — mindset prep, agenda, AI debrief.</p>
            <button onClick={() => setShowCreate(true)} className="village-btn-primary">+ Create First Event</button>
          </div>
        )}
      </div>
    </div>
  );
}
