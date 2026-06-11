'use client';
// GPS with no goalId → load the user's primary active goal and redirect to it.
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function GpsIndexPage() {
  const router = useRouter();
  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/village/workshop/chat'); return; }
      const { data } = await (supabase as any)
        .from('goals').select('id').eq('user_id', user.id).eq('status', 'active')
        .order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (data?.id) router.replace(`/village/workshop/gps/${data.id}`);
      else router.replace('/village/workshop/chat');
    })();
  }, [router]);

  return (
    <div style={{ height: '100dvh', background: '#0a1220', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#7a92b0', fontSize: 13 }}>Loading your GPS…</p>
    </div>
  );
}
