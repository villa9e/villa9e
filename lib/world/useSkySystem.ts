'use client';
import { useState, useEffect, useRef } from 'react';
import { getSunPosition, getSunTimes, computeSkyState, type SkyState, type SunTimes } from './sunCalc';
import { useWeather } from '@/lib/theme/useWeather';
import { createClient } from '@/lib/supabase/client';

export function useSkySystem() {
  const [skyState, setSkyState]   = useState<SkyState | null>(null);
  const [sunTimes, setSunTimes]   = useState<SunTimes | null>(null);
  const [coords, setCoords]       = useState<{ lat: number; lon: number } | null>(null);
  const { mood } = useWeather();

  // Refs so update() always reads latest values without stale closure
  const coordsRef   = useRef<{ lat: number; lon: number } | null>(null);
  const sunTimesRef = useRef<SunTimes | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  // Keep refs in sync
  useEffect(() => { coordsRef.current = coords; }, [coords]);
  useEffect(() => { sunTimesRef.current = sunTimes; }, [sunTimes]);

  function update() {
    try {
      const now = new Date();
      const lat  = coordsRef.current?.lat ?? 37.7749;   // SF fallback
      const lon  = coordsRef.current?.lon ?? -122.4194;
      const { altitude } = getSunPosition(now, lat, lon);
      const sky  = computeSkyState(now, sunTimesRef.current, altitude);
      setSkyState(sky);
    } catch (e) {
      // On any calculation error, use clock-based fallback
      try {
        const now = new Date();
        const fallback = computeSkyState(now, null, 30);
        setSkyState(fallback);
      } catch { /* silent */ }
    }
  }

  // Run immediately on mount so sky is correct from the first frame
  useEffect(() => {
    update();

    // Load user location from profile (async, updates coords)
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      (supabase as any)
        .from('profiles')
        .select('location_lat,location_lng')
        .eq('id', user.id)
        .single()
        .then(({ data }: any) => {
          if (data?.location_lat && data?.location_lng) {
            const lat = parseFloat(data.location_lat);
            const lon = parseFloat(data.location_lng);
            setCoords({ lat, lon });
            // Compute sun times for user's actual location
            try {
              const times = getSunTimes(new Date(), lat, lon);
              setSunTimes(times);
              // Update sky immediately with accurate data
              const { altitude } = getSunPosition(new Date(), lat, lon);
              setSkyState(computeSkyState(new Date(), times, altitude));
            } catch { /* use fallback */ }
          }
        })
        .catch(() => { /* no location, clock fallback stays */ });
    });

    // Update sky every 60 seconds (day/night cycle doesn't need sub-minute precision)
    intervalRef.current = setInterval(update, 60_000);
    return () => clearInterval(intervalRef.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { skyState, sunTimes, coords, mood };
}
