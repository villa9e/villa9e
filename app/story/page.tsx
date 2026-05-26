'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStoryMode } from '@/lib/storyMode/useStoryMode';

// /story — starts story mode and redirects to the map
export default function StoryPage() {
  const router = useRouter();
  const { startStoryMode, reset } = useStoryMode();

  useEffect(() => {
    reset();
    startStoryMode();
    router.replace('/village/map');
  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4 animate-pulse">🌀</div>
        <p className="text-white/50 text-sm font-mono">Entering village…</p>
      </div>
    </div>
  );
}
