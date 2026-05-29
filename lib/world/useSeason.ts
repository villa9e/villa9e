'use client';
import { useMemo } from 'react';
import { useWeather } from '@/lib/theme/useWeather';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export interface SeasonState {
  season:      Season;
  label:       string;
  snowOn:      boolean;   // show snow cover + falling snow
  rainOn:      boolean;   // show rain streaks
  leavesOn:    boolean;   // show falling autumn leaves
  windStr:     number;    // 0–1 wind strength
  fogDensity:  number;    // 0–1 fog amount
  leafColor:   string;    // autumn leaf tint
  treeColorMod: number;   // -1 (winter bare) to +1 (spring lush)
  ambientBoost: number;   // +/- ambient light adjustment
}

function monthToSeason(month: number): Season {
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
}

export function useSeason(): SeasonState {
  const { mood } = useWeather();
  const month = new Date().getMonth(); // 0-indexed

  return useMemo(() => {
    // Weather mood overrides season appearance
    const forcedSnow  = mood === 'snowy' || mood === 'cold';
    const forcedRain  = mood === 'rainy' || mood === 'stormy' || mood === 'night_rain';
    const forcedWind  = mood === 'windy';
    const forcedFog   = mood === 'foggy';
    const forcedLeaves= mood === 'autumn';
    const baseSeason  = monthToSeason(month);

    const season = forcedLeaves ? 'autumn' : forcedSnow ? 'winter' : baseSeason;

    const windStr =
      forcedWind     ? 0.9 :
      mood === 'stormy' ? 0.75 :
      mood === 'breezy' ? 0.3 :
      season === 'spring' ? 0.25 :
      season === 'winter' ? 0.4 :
      0.15;

    const fogDensity =
      forcedFog     ? 0.8 :
      mood === 'cloudy' ? 0.2 :
      mood === 'stormy' ? 0.45 :
      season === 'winter' ? 0.15 :
      0;

    const leafColor =
      mood === 'autumn'  ? '#C84A00' :
      season === 'autumn'? '#D4600A' :
      season === 'spring'? '#F472B6' :
      '#A0522D';

    const treeColorMod =
      season === 'spring' ? 0.6 :
      season === 'summer' ? 1.0 :
      season === 'autumn' ? -0.3 :
      -0.8;

    const ambientBoost =
      mood === 'sunny'  ? 0.2 :
      mood === 'stormy' ? -0.3 :
      mood === 'cloudy' ? -0.1 :
      0;

    const labels: Record<Season, string> = {
      spring: 'Spring', summer: 'Summer', autumn: 'Autumn', winter: 'Winter',
    };

    return {
      season,
      label:       labels[season],
      snowOn:      forcedSnow || season === 'winter',
      rainOn:      forcedRain,
      leavesOn:    forcedLeaves || season === 'autumn',
      windStr,
      fogDensity,
      leafColor,
      treeColorMod,
      ambientBoost,
    };
  }, [mood, month]);
}
