'use client';
import { useEffect, useRef } from 'react';
import { useWeather, classifyWeather, WEATHER_PALETTES } from '@/lib/theme/useWeather';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { createClient } from '@/lib/supabase/client';

export function WeatherProvider({ children }: { children: React.ReactNode }) {
  const { setWeather } = useWeather();
  const { setTheme } = useVillageTheme();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    // Auto day/night based on real clock — always applies regardless of location
    const hour = new Date().getHours();
    const isNightTime = hour < 6 || hour >= 20;
    setTheme(isNightTime ? 'night' : 'day');

    async function tryWeather() {
      // Check if user has enabled location sharing in Data Locker
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setWeather({ mood: 'default', loaded: true });
        return;
      }

      const { data: locker } = await (supabase as any)
        .from('data_locker_settings')
        .select('share_location')
        .eq('user_id', user.id)
        .single();

      // If user hasn't enabled location sharing, don't request geolocation
      if (!locker?.share_location) {
        setWeather({ mood: 'default', loaded: true });
        return;
      }

      // Request geolocation — user has explicitly consented via Data Locker
      if (!('geolocation' in navigator)) {
        setWeather({ mood: 'default', loaded: true });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async pos => {
          try {
            const { latitude: lat, longitude: lon } = pos.coords;
            const res = await fetch(`/api/spaces/weather?lat=${lat}&lon=${lon}`);
            if (!res.ok) { setWeather({ mood: 'default', loaded: true }); return; }
            const data = await res.json();
            if (!data.weather?.[0]) { setWeather({ mood: 'default', loaded: true }); return; }

            const weatherId   = data.weather[0].id as number;
            const tempK       = data.main?.temp ?? 293;
            const tempF       = Math.round((tempK - 273.15) * 9 / 5 + 32);
            const description = data.weather[0].description as string;
            const city        = data.name as string;
            const month       = new Date().getMonth();
            const mood        = classifyWeather(weatherId, tempF, isNightTime, month);

            setWeather({ mood, temp: tempF, description, city, loaded: true });

            // Save location_city back to profile if they shared it
            if (city) {
              await (supabase as any).from('profiles')
                .update({ location_city: city })
                .eq('id', user.id);
            }
          } catch {
            setWeather({ mood: 'default', loaded: true });
          }
        },
        () => setWeather({ mood: 'default', loaded: true }),
        { timeout: 6000, maximumAge: 600_000 }
      );
    }

    tryWeather();
  }, []);

  return <>{children}</>;
}

export function useWeatherAmbient() {
  const { mood, temp, description, city } = useWeather();
  const palette = WEATHER_PALETTES[mood] ?? WEATHER_PALETTES.default;
  return { mood, temp, description, city, emoji: palette.emoji, palette };
}
