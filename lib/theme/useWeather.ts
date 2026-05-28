'use client';
import { create } from 'zustand';

export type WeatherMood =
  | 'sunny'      // Hot, clear — Day Paradise full blast
  | 'golden'     // Warm, partly cloudy — golden hour glow
  | 'cloudy'     // Overcast, mild — muted, moody
  | 'rainy'      // Rain — cool blues, cozy
  | 'stormy'     // Thunderstorm — dark dramatic purples
  | 'snowy'      // Snow — icy whites, ethereal blue
  | 'foggy'      // Fog — soft, ghostly greens
  | 'hot'        // Very hot — tropical, vivid
  | 'cold'       // Very cold — deep blues, frost
  | 'spring'     // Spring — soft pinks, new greens
  | 'autumn'     // Fall — amber, rust, orange
  | 'night_clear'// Clear night — stars, deep indigo
  | 'night_rain' // Rainy night — dark navy, soft blue glow
  | 'windy'      // Windy — grey-blue, fast clouds
  | 'breezy'     // Light wind — pleasant, soft greens
  | 'default';   // Fallback

interface WeatherState {
  mood:        WeatherMood;
  temp:        number | null;   // °F
  description: string;
  emoji:       string;
  city:        string;
  loaded:      boolean;
  setWeather:  (data: Partial<WeatherState>) => void;
}

export const useWeather = create<WeatherState>((set) => ({
  mood:        'default',
  temp:        null,
  description: '',
  emoji:       '⛺',
  city:        '',
  loaded:      false,
  setWeather:  (data) => set(data),
}));

// Weather mood → color palette overlay
export const WEATHER_PALETTES: Record<WeatherMood, {
  bgOverlay:   string;   // rgba CSS for ambient glow overlay
  cardTint:    string;   // subtle card tint
  accentShift: string;   // slight accent color shift
  emoji:       string;
  ambientClass: string;  // extra CSS class for body
}> = {
  sunny:      { bgOverlay: 'rgba(251,191,36,0.08)',  cardTint: 'rgba(251,191,36,0.04)', accentShift: '#F59E0B', emoji: '☀️',  ambientClass: 'weather-sunny' },
  golden:     { bgOverlay: 'rgba(245,158,11,0.10)',  cardTint: 'rgba(245,158,11,0.04)', accentShift: '#F97316', emoji: '🌤️',  ambientClass: 'weather-golden' },
  cloudy:     { bgOverlay: 'rgba(148,163,184,0.08)', cardTint: 'rgba(148,163,184,0.03)',accentShift: '#94A3B8', emoji: '☁️',  ambientClass: 'weather-cloudy' },
  rainy:      { bgOverlay: 'rgba(59,130,246,0.08)',  cardTint: 'rgba(59,130,246,0.03)', accentShift: '#3B82F6', emoji: '🌧️',  ambientClass: 'weather-rainy' },
  stormy:     { bgOverlay: 'rgba(109,40,217,0.12)',  cardTint: 'rgba(109,40,217,0.05)', accentShift: '#7C3AED', emoji: '⛈️',  ambientClass: 'weather-stormy' },
  snowy:      { bgOverlay: 'rgba(186,230,253,0.12)', cardTint: 'rgba(186,230,253,0.06)',accentShift: '#7DD3FC', emoji: '❄️',  ambientClass: 'weather-snowy' },
  foggy:      { bgOverlay: 'rgba(134,239,172,0.06)', cardTint: 'rgba(134,239,172,0.03)',accentShift: '#4ADE80', emoji: '🌫️',  ambientClass: 'weather-foggy' },
  hot:        { bgOverlay: 'rgba(239,68,68,0.08)',   cardTint: 'rgba(239,68,68,0.03)',  accentShift: '#EF4444', emoji: '🌡️',  ambientClass: 'weather-hot' },
  cold:       { bgOverlay: 'rgba(96,165,250,0.10)',  cardTint: 'rgba(96,165,250,0.04)', accentShift: '#60A5FA', emoji: '🥶',  ambientClass: 'weather-cold' },
  spring:     { bgOverlay: 'rgba(244,114,182,0.07)', cardTint: 'rgba(244,114,182,0.03)',accentShift: '#EC4899', emoji: '🌸',  ambientClass: 'weather-spring' },
  autumn:     { bgOverlay: 'rgba(234,88,12,0.09)',   cardTint: 'rgba(234,88,12,0.04)',  accentShift: '#EA580C', emoji: '🍂',  ambientClass: 'weather-autumn' },
  night_clear:{ bgOverlay: 'rgba(99,102,241,0.08)',  cardTint: 'rgba(99,102,241,0.03)', accentShift: '#818CF8', emoji: '🌙',  ambientClass: 'weather-night-clear' },
  night_rain: { bgOverlay: 'rgba(30,64,175,0.10)',   cardTint: 'rgba(30,64,175,0.04)',  accentShift: '#3B82F6', emoji: '🌧️',  ambientClass: 'weather-night-rain' },
  windy:      { bgOverlay: 'rgba(100,116,139,0.09)', cardTint: 'rgba(100,116,139,0.04)',accentShift: '#64748B', emoji: '💨',  ambientClass: 'weather-windy' },
  breezy:     { bgOverlay: 'rgba(134,239,172,0.07)', cardTint: 'rgba(134,239,172,0.03)',accentShift: '#4ADE80', emoji: '🌬️',  ambientClass: 'weather-breezy' },
  default:    { bgOverlay: 'rgba(24,119,242,0.06)',  cardTint: 'rgba(24,119,242,0.02)', accentShift: '#1877F2', emoji: '🏡',  ambientClass: '' },
};

// Convert OpenWeatherMap data to a WeatherMood
export function classifyWeather(
  weatherId: number,
  temp: number,   // °F
  isNight: boolean,
  month: number   // 0-11
): WeatherMood {
  // Thunderstorm
  if (weatherId >= 200 && weatherId < 300) return 'stormy';
  // Drizzle / Rain
  if (weatherId >= 300 && weatherId < 600) return isNight ? 'night_rain' : 'rainy';
  // Snow
  if (weatherId >= 600 && weatherId < 700) return 'snowy';
  // Fog / Mist
  if (weatherId >= 700 && weatherId < 800) return 'foggy';

  // Clear sky
  if (weatherId === 800) {
    if (isNight) return 'night_clear';
    if (temp >= 90) return 'hot';
    if (temp <= 32) return 'cold';
    if (temp >= 75) return 'sunny';
    // Check season
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'golden';
  }

  // Clouds
  if (weatherId >= 801) {
    if (isNight) return 'night_clear';
    if (temp <= 32) return 'cold';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'cloudy';
  }

  return 'default';
}
