'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface StoryStatus {
  hasStory: boolean;
  isLive: boolean;
  isOnline: boolean;
}

export function useStoryStatus(userId: string) {
  const [status, setStatus] = useState<StoryStatus>({ hasStory: false, isLive: false, isOnline: false });

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    (async () => {
      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('is_live, is_online')
        .eq('id', userId)
        .single();

      const { data: stories } = await (supabase as any)
        .from('stories')
        .select('id')
        .eq('user_id', userId)
        .gt('expires_at', new Date().toISOString())
        .limit(1);

      setStatus({
        hasStory: (stories?.length ?? 0) > 0,
        isLive: profile?.is_live ?? false,
        isOnline: profile?.is_online ?? false,
      });
    })();
  }, [userId]);

  return status;
}

export function getRingColor(status: StoryStatus): string {
  if (status.isLive) return '#E24B4A';   // red — highest priority
  if (status.hasStory) return '#1D9E75';  // green
  if (status.isOnline) return '#2952E8';  // royal blue
  return '#0033CC';                        // navy — offline
}
