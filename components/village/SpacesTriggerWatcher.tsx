'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { EnergyType } from '@/lib/spaces/utils';

interface WatchedEvent {
  id: string;
  title: string;
  start_time: string;
  energy_type: EnergyType;
  trigger_min: number;
  trigger_enabled: boolean;
  affirmation?: string;
  trigger_playlist?: string;
}

const FIRED_KEY = 'spaces_triggers_fired';

function loadFired(): Set<string> {
  try {
    return new Set(JSON.parse(sessionStorage.getItem(FIRED_KEY) ?? '[]'));
  } catch {
    return new Set();
  }
}

function markFired(id: string) {
  const fired = loadFired();
  fired.add(id);
  try { sessionStorage.setItem(FIRED_KEY, JSON.stringify([...fired])); } catch {}
}

// Auto-fires the Trigger flow shortly before a calendar event starts.
// Polls upcoming events with trigger_enabled and, once
// `now >= start_time - trigger_min`, navigates to /village/spaces/trigger.
export default function SpacesTriggerWatcher() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [events, setEvents] = useState<WatchedEvent[]>([]);
  const userIdRef = useRef('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) userIdRef.current = user.id;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadUpcoming() {
      const userId = userIdRef.current;
      if (!userId) return;
      const from = new Date();
      const to = new Date(from.getTime() + 4 * 60 * 60 * 1000);
      const { data } = await (supabase as any)
        .from('calendar_events')
        .select('id,title,start_time,energy_type,trigger_min,trigger_enabled,affirmation,trigger_playlist')
        .eq('creator_id', userId)
        .eq('trigger_enabled', true)
        .gte('start_time', from.toISOString())
        .lte('start_time', to.toISOString())
        .order('start_time');
      if (!cancelled && data) setEvents(data);
    }

    const initial = setTimeout(loadUpcoming, 1500);
    const refresh = setInterval(loadUpcoming, 5 * 60 * 1000);
    return () => { cancelled = true; clearTimeout(initial); clearInterval(refresh); };
  }, []);

  useEffect(() => {
    const check = setInterval(() => {
      if (pathname?.startsWith('/village/spaces/trigger')) return;
      const now = Date.now();
      const fired = loadFired();
      for (const e of events) {
        if (fired.has(e.id)) continue;
        const start = new Date(e.start_time).getTime();
        const fireAt = start - (e.trigger_min ?? 10) * 60000;
        if (now >= fireAt && now < start) {
          markFired(e.id);
          const qs = new URLSearchParams({
            eventId: e.id,
            eventTitle: e.title,
            energyType: e.energy_type ?? 'focused',
            duration: String(e.trigger_min ?? 10),
          });
          if (e.affirmation) qs.set('affirmation', e.affirmation);
          if (e.trigger_playlist) qs.set('playlist', e.trigger_playlist);
          router.push(`/village/spaces/trigger?${qs.toString()}`);
          break;
        }
      }
    }, 20000);
    return () => clearInterval(check);
  }, [events, pathname, router]);

  return null;
}
