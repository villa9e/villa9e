'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import { VillageHeader } from '@/components/village/VillageHeader';

const WorldBuilder = dynamic(
  () => import('@/components/admin/WorldBuilder').then(m => m.WorldBuilder),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse">🌍</div>
          <p className="text-gray-700 font-black text-lg">World Builder</p>
          <p className="text-gray-400 text-sm mt-1">Loading models…</p>
        </div>
      </div>
    ),
  }
);

export default function WorldBuilderPage() {
  const router  = useRouter();
  const [ready, setReady]   = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace('/login'); return; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_super_admin')
        .eq('id', user.id)
        .single();

      const isAdmin =
        (profile as any)?.is_super_admin === true ||
        user.email === 'admin@villa9e.app' ||
        user.email === 'elitehousemusic@gmail.com';

      if (!isAdmin) { router.replace('/village/map'); return; }
      setAuthed(true);
      setReady(true);
    });
  }, [router]);

  if (!ready) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">{authed ? '🌍' : '🔐'}</div>
          <p className="text-gray-500 text-sm">{authed ? 'Loading builder…' : 'Checking access…'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-white">
      {/* Same white+gold header as the rest of the village */}
      <VillageHeader
        title="World Builder"
        subtitle="Sandbox — drag, build, publish"
        icon="🌍"
        backHref="/village/map"
        actions={
          <span className="text-[10px] font-bold px-2 py-1 rounded-full"
            style={{ background: 'rgba(212,175,55,0.12)', color: '#B8860B', border: '1px solid rgba(212,175,55,0.3)' }}>
            Admin
          </span>
        }
      />

      {/* Builder — pb-[68px] leaves room for the white bottom nav */}
      <div className="flex-1 overflow-hidden" style={{ paddingBottom: 68 }}>
        <WorldBuilder />
      </div>
    </div>
  );
}
