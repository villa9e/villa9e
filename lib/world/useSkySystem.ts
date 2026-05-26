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
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    async function init() {
      // Try to get user's stored location from profile
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await (supabase as any)
          .from('profiles')
          .select('location_lat,location_lng')
          .eq('id', user.id)
          .single();

        if (profile?.location_lat && profile?.location_lng) {
          const lat = parseFloat(profile.location_lat);
          const lon = parseFloat(profile.location_lng);
          setCoords({ lat, lon });
          const today = new Date();
          const times = getSunTimes(today, lat, lon);
          setSunTimes(times);
        }
      }
    }

    // Check if we can get geolocation (only if user consented via Data Locker)
    init();

    // Update sky every 30 seconds
    function update() {
      const now = new Date();
      const lat  = coords?.lat ?? 37.7749;  // Default SF if no location
      const lon  = coords?.lon ?? -122.4194;
      const { altitude } = getSunPosition(now, lat, lon);
      const sky  = computeSkyState(now, sunTimes, altitude);
      setSkyState(sky);
    }

    update();
    intervalRef.current = setInterval(update, 30_000);
    return () => clearInterval(intervalRef.current);
  }, [coords?.lat, coords?.lon, sunTimes]);

  return { skyState, sunTimes, coords, mood };
}
