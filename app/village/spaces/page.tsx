'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { VillageHeader } from '@/components/village/VillageHeader';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';

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
  const [myRsvps, setMyRsvps] = useState<Record<string, string>>({});  // event_id → status
  const [rsvpCounts, setRsvpCounts] = useState<Record<string, number>>({});
  const supabase = createClient();

  useEffect(() => { loadEvents(); loadWeather(); }, []);

  async function loadRsvps(eventIds: string[], userId: string) {
    if (!eventIds.length) return;
    const { data: mine } = await (supabase as any)
      .from('event_rsvps').select('event_id, status').eq('user_id', userId).in('event_id', eventIds);
    const myMap: Record<string, string> = {};
    (mine ?? []).forEach((r: any) => { myMap[r.event_id] = r.status; });
    setMyRsvps(myMap);
    // Count "going" RSVPs per event
    const counts: Record<string, number> = {};
    await Promise.all(eventIds.map(async id => {
      const { count } = await (supabase as any)
        .from('event_rsvps').select('id', { count: 'exact', head: true })
        .eq('event_id', id).eq('status', 'going');
      counts[id] = count ?? 0;
    }));
    setRsvpCounts(counts);
  }

  async function rsvp(eventId: string, status: 'going'|'maybe'|'not_going') {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const current = myRsvps[eventId];
    if (current === status) {
      // Undo RSVP
      await (supabase as any).from('event_rsvps').delete().eq('event_id', eventId).eq('user_id', user.id);
      setMyRsvps(prev => { const n = { ...prev }; delete n[eventId]; return n; });
      if (status === 'going') setRsvpCounts(prev => ({ ...prev, [eventId]: Math.max(0, (prev[eventId] ?? 1) - 1) }));
    } else {
      await (supabase as any).from('event_rsvps').upsert(
        { event_id: eventId, user_id: user.id, status },
        { onConflict: 'event_id,user_id' }
      );
      const waGoing = current === 'going';
      const nowGoing = status === 'going';
      setMyRsvps(prev => ({ ...prev, [eventId]: status }));
      setRsvpCounts(prev => ({
        ...prev,
        [eventId]: (prev[eventId] ?? 0) + (nowGoing ? 1 : 0) - (waGoing ? 1 : 0),
      }));
    }
  }

  async function loadEvents() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const now = new Date().toISOString();
    const { data } = await (supabase as any)
      .from('calendar_events')
      .select('*')
      .eq('creator_id', user.id)
      .gte('end_time', now)
      .order('start_time')
      .limit(30);
    const evs = data ?? [];
    setEvents(evs);
    if (evs.length > 0) {
      loadRsvps(evs.map((e: any) => e.id), user.id);
    }
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

    // Try real OAuth sync first
    try {
      const res = await fetch('/api/integrations/google-calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: event.id }),
      });
      const data = await res.json();

      if (data.ok) {
        setGcalSynced(true);
        setGcalSyncing(false);
        setTimeout(() => setGcalSynced(false), 4000);
        return;
      }

      if (data.error === 'not_connected') {
        // Redirect to OAuth flow
        window.location.href = `/api/integrations/google-calendar/auth?return_to=/village/spaces`;
        return;
      }
    } catch { /* fall through to URL approach */ }

    // Fallback: open Google Calendar URL for manual add
    const start = new Date(event.start_time);
    const end = new Date(event.end_time ?? new Date(start.getTime() + 3600000));
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${fmt(start)}/${fmt(end)}&details=${encodeURIComponent(event.description ?? '')}&location=${encodeURIComponent(event.location ?? '')}`;
    window.open(gcalUrl, '_blank');
    setGcalSynced(true);
    setGcalSyncing(false);
    setTimeout(() => setGcalSynced(false), 3000);
  }

  const upcomingToday = events.filter(e => {
    const d = new Date(e.start_time);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  const { theme } = useVillageTheme();
  const isNight  = theme === 'night';
  const bg       = isNight ? '#0A0B12' : '#F5F3FF';
  const cardBg   = isNight ? '#12152A' : '#FFFFFF';
  const border   = isNight ? '#1E2240' : '#DDD6FE';
  const textMain = isNight ? '#F0EBE0' : '#1E1B4B';
  const textMute = isNight ? '#4A4F72' : '#6D28D9';
  const accent   = isNight ? '#818CF8' : '#4F46E5';

  return (
    <div className="min-h-screen" style={{ background: bg }}>
      <div className="sticky top-0 z-20 flex items-center gap-2 px-4 py-3 border-b"
        style={{ background: isNight ? '#0E1020' : accent, borderColor: isNight ? '#1E2240' : 'transparent' }}>
        <Link href="/village/map" className="text-xl text-white">←</Link>
        <span className="text-2xl">📅</span>
        <div className="flex-1">
          <h1 className="text-lg font-black text-white">Spaces</h1>
          <p className="text-xs text-white/60">Every event is a full experience</p>
        </div>
        <Link href="/village/spaces/discover" className="text-white/70 text-sm mr-1">🌍</Link>
        <button onClick={() => setShowCreate(true)}
          className="rounded-full px-3 py-1.5 text-sm font-bold"
          style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
          + Event
        </button>
      </div>

      {/* Event detail drawer */}
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              className="rounded-3xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto"
              style={{ background: cardBg, border: `1px solid ${border}` }}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-bold text-xl" style={{ color: textMain }}>{selected.title}</h2>
                  <p className="text-sm mt-0.5" style={{ color: textMute }}>
                    {new Date(selected.start_time).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    {' · '}
                    {new Date(selected.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <button onClick={() => { setSelected(null); setSpiritPrep(''); setAgenda(''); }} className="text-2xl leading-none" style={{ color: textMute }}>×</button>
              </div>

              {selected.location && (
                <div className="flex items-center gap-2 text-sm" style={{ color: textMute }}>
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
                  <p className="text-sm leading-relaxed" style={{ color: textMain }}>{spiritPrep}</p>
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
              <div className="rounded-2xl p-4" style={{ background: isNight ? '#0A0B12' : '#F9FAFB', border: `1px solid ${border}` }}>
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
                  <pre className="text-xs whitespace-pre-wrap font-sans leading-relaxed" style={{ color: textMain }}>{agenda}</pre>
                ) : agendaLoading ? (
                  <p className="text-xs" style={{ color: textMute }}>Building agenda…</p>
                ) : (
                  <p className="text-xs" style={{ color: textMute }}>Click "Generate" to get an AI-crafted agenda for this event.</p>
                )}
              </div>

              {/* Google Calendar sync */}
              <button onClick={() => syncToGoogleCalendar(selected)} disabled={gcalSyncing}
                className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded-2xl py-3 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50">
                <span className="text-lg">📆</span>
                {gcalSynced ? '✓ Added to Google Calendar' : gcalSyncing ? 'Opening…' : 'Add to Google Calendar'}
              </button>

              {selected.description && (
                <div className="text-sm border-t pt-3" style={{ color: textMute, borderColor: border }}>
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
              className="rounded-3xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto"
              style={{ background: cardBg, border: `1px solid ${border}` }}>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold" style={{ color: textMain }}>Create Event</h2>
                <button onClick={() => setShowCreate(false)} className="text-2xl" style={{ color: textMute }}>×</button>
              </div>
              {[
                { key: 'title', placeholder: 'Event title', type: 'text' },
                { key: 'location', placeholder: 'Location or video link', type: 'text' },
              ].map(f => (
                <input key={f.key} value={(form as any)[f.key]}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder} type={f.type}
                  className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                  style={{ background: isNight ? '#0A0B12' : '#F5F3FF', border: `1px solid ${border}`, color: textMain }} />
              ))}
              <div className="grid grid-cols-2 gap-3">
                {[['Start', 'start_time'], ['End', 'end_time']].map(([label, key]) => (
                  <div key={key}>
                    <label className="text-xs" style={{ color: textMute }}>{label}</label>
                    <input type="datetime-local" value={(form as any)[key]}
                      onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                      className="mt-1 w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
                      style={{ background: isNight ? '#0A0B12' : '#F5F3FF', border: `1px solid ${border}`, color: textMain }} />
                  </div>
                ))}
              </div>
              <select value={form.event_type} onChange={e => setForm(f => ({ ...f, event_type: e.target.value }))}
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                style={{ background: isNight ? '#0A0B12' : '#F5F3FF', border: `1px solid ${border}`, color: textMain }}>
                <option value="personal">Personal</option>
                <option value="goal_step">Goal Step</option>
                <option value="tribe_meeting">Tribe Meeting</option>
                <option value="public">Public Event</option>
              </select>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Description, agenda, notes…" rows={3}
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none resize-none"
                style={{ background: isNight ? '#0A0B12' : '#F5F3FF', border: `1px solid ${border}`, color: textMain }} />
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
              <p className="text-xs" style={{ color: textMute }}>{weather.city} · {weather.humidity}% humidity · {weather.wind} mph wind</p>
            </div>
          </motion.div>
        )}

        {/* Today's events highlight */}
        {upcomingToday.length > 0 && (
          <div>
            <h2 className="font-bold text-xs uppercase tracking-widest mb-2" style={{ color: textMute }}>TODAY</h2>
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
                    {ev.location && <p className="text-xs" style={{ color: textMute }}>📍 {ev.location}</p>}
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
            <h2 className="font-bold text-xs uppercase tracking-widest mb-2" style={{ color: textMute }}>UPCOMING</h2>
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
                      <p className="text-xs mt-0.5" style={{ color: textMute }}>
                        {start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        {ev.location && ` · ${ev.location}`}
                      </p>
                      {ev.description && <p className="text-xs mt-1 line-clamp-1" style={{ color: textMute }}>{ev.description}</p>}
                      {/* RSVP buttons for public/tribe events */}
                      {ev.event_type !== 'personal' && (
                        <div className="flex gap-1.5 mt-2" onClick={e => e.stopPropagation()}>
                          {(['going', 'maybe', 'not_going'] as const).map(s => (
                            <button key={s} onClick={() => rsvp(ev.id, s)}
                              className="text-xs px-2.5 py-1 rounded-full font-medium transition-all"
                              style={{
                                background: myRsvps[ev.id] === s ? (s === 'going' ? '#059669' : s === 'maybe' ? '#D97706' : '#DC2626') : (isNight ? '#1E2240' : '#F3F4F6'),
                                color:      myRsvps[ev.id] === s ? '#fff' : textMute,
                              }}>
                              {s === 'going' ? `✓ Going${rsvpCounts[ev.id] ? ` (${rsvpCounts[ev.id]})` : ''}` : s === 'maybe' ? '? Maybe' : '✕ No'}
                            </button>
                          ))}
                        </div>
                      )}
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
            <p className="mb-2" style={{ color: textMute }}>No upcoming events.</p>
            <p className="text-sm mb-6" style={{ color: textMute }}>Spaces treats every event as a full experience — Spirit mindset prep, AI agenda, Google Calendar sync.</p>
            <button onClick={() => setShowCreate(true)} className="village-btn-primary">+ Create First Event</button>
          </div>
        )}
      </div>
    </div>
  );
}
