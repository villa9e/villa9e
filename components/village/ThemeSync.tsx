'use client';
import { useEffect } from 'react';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';

// Syncs the Zustand theme to the HTML data-theme attribute on every render.
// Ensures CSS variables for night mode activate on initial page load from localStorage.
export function ThemeSync() {
  const theme = useVillageTheme(s => s.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return null;
}
