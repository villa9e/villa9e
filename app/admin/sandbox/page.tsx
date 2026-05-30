'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';

const WorldBuilder = dynamic(
  () => import('@/components/admin/WorldBuilder').then(m => m.WorldBuilder),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center bg-[#040A06]">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse">🌍</div>
          <p className="text-[#4ADE80] font-black text-lg">World Builder</p>
          <p className="text-[#2A5A2A] text-sm mt-1">Loading 881 models…</p>
        </div>
      </div>
    ),
  }
);

export default function WorldBuilderPage() {
  const router  = useRouter();
  const [ready, setReady]  = useState(false);
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
      <div className="fixed inset-0 bg-[#040A06] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">{authed ? '🌍' : '🔐'}</div>
          <p className="text-[#4ADE80] text-sm">{authed ? 'Loading builder…' : 'Checking access…'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#040A06] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2 bg-[#040A06] border-b border-[#1A3A1A]/60 shrink-0 z-10">
        <button
          onClick={() => router.push('/village/map')}
          className="text-[#2A5A2A] hover:text-[#4ADE80] text-xs transition-colors"
        >
          ← Back to Village
        </button>
        <span className="text-[#1A3A1A]">·</span>
        <span className="text-[#4ADE80] font-black text-sm">World Builder</span>
        <span className="text-[#0D2A14] bg-[#0A1A0A] border border-[#1A3A1A] text-[9px] px-2 py-0.5 rounded font-bold uppercase">
          Admin
        </span>
        <span className="text-[#1A3A1A] ml-auto text-[10px]">
          881 models available
        </span>
      </div>

      {/* Builder fills rest */}
      <div className="flex-1 overflow-hidden">
        <WorldBuilder />
      </div>
    </div>
  );
}
