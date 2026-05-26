'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function DiscoverEventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [rsvped, setRsvped] = useState<Set<string>>(new Set());
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);

      const now = new Date().toISOString();
      const { data } = await supabase
        .from('calendar_events')
        .select('*, profiles!calendar_events_creator_id_fkey(username, village_score)')
        .eq('event_type', 'public')
        .gte('start_time', now)
        .order('start_time')
        .limit(30);

      setEvents(data ?? []);

      if (user) {
        const { data: myRsvps } = await supabase
          .from('event_rsvps')
          .select('event_id')
          .eq('user_id', user.id);
        if (myRsvps) setRsvped(new Set(myRsvps.map(r => r.event_id)));
      }
    }
    load();
  }, []);

  async function rsvp(eventId: string) {
    if (!userId) return;
    if (rsvped.has(eventId)) {
      await supabase.from('event_rsvps').delete().eq('event_id', eventId).eq('user_id', userId);
      setRsvped(prev => { const s = new Set(prev); s.delete(eventId); return s; });
    } else {
      await supabase.from('event_rsvps').insert({ event_id: eventId, user_id: userId, status: 'going' });
      setRsvped(prev => new Set([...prev, eventId]));
    }
  }

  const grouped = events.reduce((acc: Record<string, any[]>, ev) => {
    const date = new Date(ev.start_time).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    if (!acc[date]) acc[date] = [];
    acc[date].push(ev);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-village-bg">
      <div className="bg-indigo-600 text-white px-6 py-4 flex items-center gap-3">
        <Link href="/village/spaces" className="text-xl">←</Link>
        <span className="text-2xl">🌍</span>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Public Events</h1>
          <p className="text-indigo-200 text-xs">Village-wide gatherings</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {Object.keys(grouped).length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-5xl mb-3">📅</p>
            <p className="font-medium">No public events yet.</p>
            <p className="text-sm mt-1 mb-6">Create a public event in Spaces to invite the whole village.</p>
            <Link href="/village/spaces" className="village-btn-primary">Back to Spaces</Link>
          </div>
        ) : (
          Object.entries(grouped).map(([date, dayEvents]) => (
            <div key={date}>
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">{date}</h2>
              <div className="space-y-3">
                {dayEvents.map((ev, i) => {
                  const start = new Date(ev.start_time);
                  const isGoing = rsvped.has(ev.id);
                  return (
                    <motion.div key={ev.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      className="village-card">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-indigo-50 rounded-2xl flex flex-col items-center justify-center">
                          <p className="text-xs text-indigo-400 font-medium leading-none">
                            {start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).split(' ')[1]}
                          </p>
                          <p className="text-sm font-bold text-indigo-600 leading-none">
                            {start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                          </p>
                        </div>
                        <div className="flex-1">
                          <p className="font-bold">{ev.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-gray-400">by @{ev.profiles?.username}</p>
                            {ev.location && <p className="text-xs text-gray-400">· 📍 {ev.location}</p>}
                          </div>
                          {ev.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{ev.description}</p>}
                        </div>
                      </div>
                      <button onClick={() => rsvp(ev.id)}
                        className={`mt-3 w-full rounded-full py-2.5 text-sm font-bold transition-colors ${
                          isGoing
                            ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}>
                        {isGoing ? '✓ Going' : 'RSVP — I\'m Going'}
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
