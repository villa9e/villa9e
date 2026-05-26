'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type VillageTheme = 'day' | 'night';

interface ThemeStore {
  theme: VillageTheme;
  setTheme: (t: VillageTheme) => void;
  toggle: () => void;
}

export const useVillageTheme = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'day',
      setTheme: (theme) => set({ theme }),
      toggle: () => set({ theme: get().theme === 'day' ? 'night' : 'day' }),
    }),
    { name: 'villa9e-theme' }
  )
);

// Theme token maps — use these in components
export const DAY = {
  bg:           'bg-[#FFF8EE]',
  surface:      'bg-[#FFFDF7]',
  card:         'bg-white border-[#F0E6D3]',
  cardHover:    'hover:bg-[#FFF5E6]',
  text:         'text-[#2D1F0E]',
  textMuted:    'text-[#8B6F47]',
  textSubtle:   'text-[#B8965A]',
  border:       'border-[#F0E6D3]',
  accent:       '#E8770A',
  accentText:   'text-[#E8770A]',
  accentBg:     'bg-[#E8770A]',
  header:       'bg-[#E8770A]',
  headerText:   'text-white',
  pill:         'bg-[#FFF3DC] text-[#E8770A] border-[#F0D9A8]',
  input:        'bg-white border-[#F0E6D3] text-[#2D1F0E] placeholder:text-[#C4A882]',
  divider:      'border-[#F0E6D3]',
  glow:         'rgba(232, 119, 10, 0.15)',
} as const;

export const NIGHT = {
  bg:           'bg-[#0A0B12]',
  surface:      'bg-[#0E1020]',
  card:         'bg-[#12152A] border-[#1E2240]',
  cardHover:    'hover:bg-[#161A30]',
  text:         'text-[#F0EBE0]',
  textMuted:    'text-[#7A7FA8]',
  textSubtle:   'text-[#4A4F72]',
  border:       'border-[#1E2240]',
  accent:       '#FF6B2B',
  accentText:   'text-[#FF6B2B]',
  accentBg:     'bg-[#FF6B2B]',
  header:       'bg-[#0E1020]',
  headerText:   'text-[#F0EBE0]',
  pill:         'bg-[#FF6B2B]/15 text-[#FF8C4A] border-[#FF6B2B]/30',
  input:        'bg-[#0A0B12] border-[#1E2240] text-[#F0EBE0] placeholder:text-[#3A3F5A]',
  divider:      'border-[#1E2240]',
  glow:         'rgba(255, 107, 43, 0.12)',
} as const;

export type ThemeTokens = typeof DAY;

export function useThemeTokens(): ThemeTokens {
  const theme = useVillageTheme(s => s.theme);
  return theme === 'day' ? DAY : NIGHT;
}
