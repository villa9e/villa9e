'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type VillageTheme = 'day' | 'night';
type OverlayTheme = 'white' | 'black';

interface ThemeStore {
  theme:            VillageTheme;
  overlayTheme:     OverlayTheme;
  virtualVillage:   boolean;
  setTheme:              (t: VillageTheme) => void;
  toggle:                () => void;
  toggleOverlay:         () => void;
  toggleVirtualVillage:  () => void;
}

export const useVillageTheme = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme:          'day',
      overlayTheme:   'white',
      virtualVillage: false,
      setTheme: (theme) => {
        set({ theme });
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', theme);
        }
      },
      toggle: () => {
        const next = get().theme === 'day' ? 'night' : 'day';
        set({ theme: next });
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', next);
        }
      },
      toggleOverlay: () => {
        set(s => ({ overlayTheme: s.overlayTheme === 'white' ? 'black' : 'white' }));
      },
      toggleVirtualVillage: () => {
        set(s => ({ virtualVillage: !s.virtualVillage }));
      },
    }),
    {
      name: 'villa9e-theme',
      onRehydrateStorage: () => (state) => {
        if (state && typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', state.theme);
        }
      },
    }
  )
);

// villa9e brand colors (from official logo assets)
export const BRAND = {
  navy:  '#1A2DBF',  // Navy Blue  — use for icons on white/light backgrounds
  royal: '#2D63F5',  // Royal Blue — use for primary CTAs and accents
} as const;

// Helper: returns white on dark bg, navy on light bg
export function iconColor(isNight: boolean) {
  return isNight ? '#FFFFFF' : BRAND.navy;
}

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
  bg:           'bg-[#111827]',
  surface:      'bg-[#1F2937]',
  card:         'bg-[#1F2937] border-[#374151]',
  cardHover:    'hover:bg-[#253047]',
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

// Use a plain string-keyed type so DAY and NIGHT both satisfy it
export type ThemeTokens = {
  bg:           string;
  surface:      string;
  card:         string;
  cardHover:    string;
  text:         string;
  textMuted:    string;
  textSubtle:   string;
  border:       string;
  accent:       string;
  accentText:   string;
  accentBg:     string;
  header:       string;
  headerText:   string;
  pill:         string;
  input:        string;
  divider:      string;
  glow:         string;
};

export function useThemeTokens(): ThemeTokens {
  const theme = useVillageTheme(s => s.theme);
  return (theme === 'day' ? DAY : NIGHT) as ThemeTokens;
}
