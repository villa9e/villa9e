'use client';
// GPS index — load the user's most recent active goal and redirect to its map.
// If no active goal exists yet, show a clear empty state with a CTA to create one.
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import WorkshopTabBar from '@/components/village/WorkshopTabBar';
import Link from 'next/link';

export default function GpsIndexPage() {
  const router  = useRouter();
  const [ready, setReady]   = useState(false);
  const [noGoal, setNoGoal] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/sign-in'); return; }

      const { data } = await (supabase as any)
        .from('goals').select('id, gps_stage').eq('user_id', user.id)
        .eq('status', 'active').order('created_at', { ascending: false }).limit(1).maybeSingle();

      if (data?.id) {
        router.replace(`/village/workshop/gps/${data.id}`);
      } else {
        setNoGoal(true);
        setReady(true);
      }
    })();
  }, [router]);

  if (!ready) {
    return (
      <div style={{ height: '100dvh', background: '#0a1220', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#7a92b0', fontSize: 13 }}>Loading your GPS…</p>
      </div>
    );
  }

  return (
    <div style={{ height: '100dvh', background: '#0a1220', display: 'flex', flexDirection: 'column' }}>
      {/* empty state */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 32px', gap: 16 }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#0d1626', border: '1px solid #2a3a55', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
          🗺
        </div>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#E1F5EE', textAlign: 'center' }}>
          No active goal yet
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: '#7a92b0', textAlign: 'center', lineHeight: 1.6, maxWidth: 280 }}>
          Create a SMART goal and activate GPS to see your turn-by-turn route and start mining $VLG.
        </p>
        <Link href="/village/workshop/chat"
          style={{ marginTop: 8, background: '#534AB7', border: 'none', borderRadius: 12, padding: '12px 24px', color: '#EEEDFE', fontSize: 14, fontWeight: 600, textDecoration: 'none', cursor: 'pointer' }}>
          Talk to Spirit
        </Link>
      </div>

      <WorkshopTabBar active="GPS" />
    </div>
  );
}
