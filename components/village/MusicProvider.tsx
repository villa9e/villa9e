'use client';
import React, { createContext, useContext } from 'react';
import { useVillageMusic } from '@/lib/music/useVillageMusic';
import type { MusicState } from '@/lib/music/useVillageMusic';

type MusicCtx = ReturnType<typeof useVillageMusic>;
const Ctx = createContext<MusicCtx | null>(null);

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const music = useVillageMusic();
  return <Ctx.Provider value={music}>{children}</Ctx.Provider>;
}

export function useMusic(): MusicCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useMusic must be inside MusicProvider');
  return ctx;
}
