'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const TYPE_COLORS: Record<string, string> = {
  goal_step: 'bg-orange-100 text-orange-700',
  tribe_meeting: 'bg-pink-100 text-pink-700',
  personal: 'bg-blue-100 text-blue-700',
  public: 'bg-green-100 text-green-700',
};

export default function SpacesPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState({ title: '', description: '', location: '', start_time: '', end_time: '', event_type: 'personal' });
  const [saving, setSaving] = useState(false);
  const [weather, setWeather] = useState<any>(null);
  const [spiritPrep, setSpiritPrep] = useState('');
  const [prepLoading, setPrepLoading] = useState(false);
  const [agenda, setAgenda] = useState('');
  const [agendaLoading, setAgendaLoading] = useState(false);
  const [gcalSyncing, setGcalSyncing] = useState(false);
  const [gcalSynced, setGcalSynced] = useState(false);
  const supabase = createClient();

  useEffect(() => { loadEvents(); loadWeather(); }, []);

  async function loadEvents() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const now = new Date().toISOString();
    const { data } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('creator_id', user.id)
      .gte('end_time', now)
      .order('start_time')
      .limit(30);
    setEvents(data ?? []);
  }

  async function loadWeather() {
    try {
      const res = await fetch('/api/spaces/weather');
      if (res.ok) setWeather(await res.json());
    } catch { /* silent — weather is a bonus */ }
  }

  async function createEvent() {
    if (!form.title.trim() || !form.start_time) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const endTime = form.end_time
        ? new Date(form.end_time).toISOString()
        : new Date(new Date(form.start_time).getTime() + 3600000).toISOString();

      await supabase.from('calendar_events').insert({
        creator_id:  user.id,
        title:       form.title,
        description: form.description,
        location:    form.location,
        start_time:  new Date(form.start_time).toISOString(),
        end_time:    endTime,
        event_type:  form.event_type,
      });
      loadEvents();
      setShowCreate(false);
      setForm({ title: '', description: '', location: '', start_time: '', end_time: '', event_type: 'personal' });
    }
    setSaving(false);
  }

  async function getSpiritPrep(event: any) {
    setSelected(event);
    setSpiritPrep('');
    setPrepLoading(true);
    try {
      const res = await fetch('/api/spaces/spirit-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_title: event.title, event_type: event.event_type, start_time: event.start_time }),
      });
      const data = await res.json();
      setSpiritPrep(data.message ?? '');
    } catch { setSpiritPrep('Focus on your intention for this event. Show up present and prepared.'); }
    setPrepLoading(false);
  }

  async function generateAgenda(event: any) {
    setAgendaLoading(true);
    setAgenda('');
    try {
      const res = await fetch('/api/spaces/agenda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event }),
      });
      const data = await res.json();
      setAgenda(data.agenda ?? '');
    } catch { setAgenda('Unable to generate agenda. Add your own notes below.'); }
    setAgendaLoading(false);
  }

  async function syncToGoogleCalendar(event: any) {
    setGcalSyncing(true);
    // Build Google Calendar URL (no OAuth needed for personal quick-add)
    const start = new Date(event.start_time);
    const end = new Date(event.end_time ?? new Date(start.getTime() + 3600000));
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${fmt(start)}/${fmt(end)}&details=${encodeURIComponent(event.description ?? '')}&location=${encodeURIComponent(event.location ?? '')}`;
    window.open(gcalUrl, '_blank');
    setGcalSyncing(false);
    setGcalSynced(true);
    setTimeout(() => setGcalSynced(false), 3000);
  }

  const upcomingToday = events.filter(e => {
    const d = new Date(e.start_time);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  return (
    <div className="min-h-screen bg-village-bg">
      <div className="bg-indigo-600 text-white px-6 py-4 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/village/map" className="text-xl">←</Link>
        <span className="text-2xl">📅</span>
        <div className="flex-1">
          <h1 className="text-xl font-bold leading-tight">Spaces</h1>
          <p className="text-indigo-200 text-xs">Every event is a full experience</p>
        </div>
        <Link href="/village/spaces/discover" className="text-indigo-200 text-sm mr-1">🌍 Public</Link>
        <button onClick={() => setShowCreate(true)} className="bg-white text-indigo-700 rounded-full px-3 py-1.5 text-sm font-bold">
          + Event
        </button>
      </div>

      {/* Event detail drawer */}
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-bold text-xl">{selected.title}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {new Date(selected.start_time).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    {' · '}
                    {new Date(selected.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <button onClick={() => { setSelected(null); setSpiritPrep(''); setAgenda(''); }} className="text-gray-400 text-2xl leading-none">×</button>
              </div>

              {selected.location && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>📍</span> {selected.location}
                </div>
              )}

              {/* Spirit prep */}
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span>🌿</span>
                  <p className="font-bold text-sm text-indigo-700">Spirit Pre-Event Prep</p>
                </div>
                {spiritPrep ? (
                  <p className="text-sm text-gray-700 leading-relaxed">{spiritPrep}</p>
                ) : prepLoading ? (
                  <div className="flex items-center gap-2 text-sm text-indigo-400">
                    <span className="animate-spin">⟳</span> Spirit is preparing your mindset…
                  </div>
                ) : (
                  <button onClick={() => getSpiritPrep(selected)} className="text-sm text-indigo-600 font-medium hover:text-indigo-800">
                    Tap to get Spirit's prep for this event →
                  </button>
                )}
              </div>

              {/* AI Agenda */}
              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span>📋</span>
                    <p className="font-bold text-sm">AI Agenda</p>
                  </div>
                  {!agenda && !agendaLoading && (
                    <button onClick={() => generateAgenda(selected)} className="text-xs text-indigo-600 font-medium">Generate →</button>
                  )}
                </div>
                {agenda ? (
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap font-sans leading-relaxed">{agenda}</pre>
                ) : agendaLoading ? (
                  <p className="text-xs text-gray-400">Building agenda…</p>
                ) : (
                  <p className="text-xs text-gray-400">Click "Generate" to get an AI-crafted agenda for this event.</p>
                )}
              </div>

              {/* Google Calendar sync */}
              <button onClick={() => syncToGoogleCalendar(selected)} disabled={gcalSyncing}
                className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded-2xl py-3 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50">
                <span className="text-lg">📆</span>
                {gcalSynced ? '✓ Added to Google Calendar' : gcalSyncing ? 'Opening…' : 'Add to Google Calendar'}
              </button>

              {selected.description && (
                <div className="text-sm text-gray-600 border-t border-gray-100 pt-3">
                  {selected.description}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create event modal */}
      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Create Event</h2>
                <button onClick={() => setShowCreate(false)} className="text-gray-400 text-2xl">×</button>
              </div>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Event title"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Location or video link"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Start</label>
                  <input type="datetime-local" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                    className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">End</label>
                  <input type="datetime-local" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
                    className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
              </div>
              <select value={form.event_type} onChange={e => setForm(f => ({ ...f, event_type: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                <option value="personal">Personal</option>
                <option value="goal_step">Goal Step</option>
                <option value="tribe_meeting">Tribe Meeting</option>
                <option value="public">Public Event</option>
              </select>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Description, agenda, notes…" rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
              <button onClick={createEvent} disabled={saving || !form.title.trim() || !form.start_time}
                className="w-full bg-indigo-600 text-white rounded-full py-3 font-bold hover:bg-indigo-700 disabled:opacity-50">
                {saving ? 'Creating…' : '📅 Create Event'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Weather card */}
        {weather && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="village-card bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center gap-4">
            <span className="text-4xl">{weather.icon}</span>
            <div>
              <p className="font-bold">{weather.temp}° · {weather.condition}</p>
              <p className="text-xs text-gray-500">{weather.city} · {weather.humidity}% humidity · {weather.wind} mph wind</p>
            </div>
          </motion.div>
        )}

        {/* Today's events highlight */}
        {upcomingToday.length > 0 && (
          <div>
            <h2 className="font-bold text-sm text-gray-500 mb-2">TODAY</h2>
            {upcomingToday.map((ev, i) => (
              <motion.div key={ev.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                onClick={() => getSpiritPrep(ev)}
                className="village-card mb-3 cursor-pointer hover:shadow-md transition-shadow border border-indigo-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {new Date(ev.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm">{ev.title}</p>
                    {ev.location && <p className="text-xs text-gray-400">📍 {ev.location}</p>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[ev.event_type] || TYPE_COLORS.personal}`}>
                    {ev.event_type.replace('_', ' ')}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* All upcoming */}
        {events.filter(e => !upcomingToday.includes(e)).length > 0 && (
          <div>
            <h2 className="font-bold text-sm text-gray-500 mb-2">UPCOMING</h2>
            {events.filter(e => !upcomingToday.includes(e)).map((ev, i) => {
              const start = new Date(ev.start_time);
              return (
                <motion.div key={ev.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  onClick={() => getSpiritPrep(ev)}
                  className="village-card mb-3 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 text-center bg-indigo-50 rounded-2xl p-2 min-w-[52px]">
                      <p className="text-xs text-indigo-400 font-medium">{start.toLocaleString('en-US', { month: 'short' }).toUpperCase()}</p>
                      <p className="text-2xl font-bold text-indigo-600 leading-none">{start.getDate()}</p>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold">{ev.title}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${TYPE_COLORS[ev.event_type] || TYPE_COLORS.personal}`}>
                          {ev.event_type.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        {ev.location && ` · ${ev.location}`}
                      </p>
                      {ev.description && <p className="text-xs text-gray-400 mt-1 line-clamp-1">{ev.description}</p>}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {events.length === 0 && (
          <div className="text-center py-16">
            <p className="text-5xl mb-3">📅</p>
            <p className="text-gray-500 mb-2">No upcoming events.</p>
            <p className="text-sm text-gray-400 mb-6">Spaces treats every event as a full experience — Spirit mindset prep, AI agenda, Google Calendar sync.</p>
            <button onClick={() => setShowCreate(true)} className="village-btn-primary">+ Create First Event</button>
          </div>
        )}
      </div>
    </div>
  );
}
