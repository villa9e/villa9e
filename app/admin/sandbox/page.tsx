'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';

// Load the heavy 3D sandbox only on client (no SSR)
const WorldSandbox = dynamic(
  () => import('@/components/admin/WorldSandbox').then(m => m.WorldSandbox),
  { ssr: false, loading: () => (
    <div className="flex-1 flex items-center justify-center text-[#4ADE80]">
      <div className="text-center">
        <div className="text-4xl mb-4">🌍</div>
        <div className="text-lg font-medium">Loading World Editor...</div>
        <div className="text-sm text-[#4A7A4A] mt-2">Initializing 3D canvas</div>
      </div>
    </div>
  )}
);

export default function AdminSandboxPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace('/login'); return; }

      // Check admin role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, email')
        .eq('id', user.id)
        .single();

      const isAdmin =
        profile?.role === 'admin' ||
        user.email === 'admin@villa9e.app' ||
        user.email === 'elitehousemusic@gmail.com';

      if (!isAdmin) { router.replace('/village/map'); return; }
      setAuthorized(true);
      setChecking(false);
    });
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen bg-[#060E08] flex items-center justify-center text-[#4ADE80]">
        <div className="text-center">
          <div className="text-3xl mb-3">🔐</div>
          <div>Checking authorization...</div>
        </div>
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <div className="fixed inset-0 bg-[#060E08] flex flex-col">
      {/* Header bar */}
      <div className="flex items-center justify-between px-5 py-3 bg-[#0A1A0A] border-b border-[#1A3A1A]/60 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/village/map')}
            className="text-[#4A7A4A] hover:text-[#4ADE80] text-sm transition-colors"
          >
            ← Village
          </button>
          <div className="h-4 w-px bg-[#1A3A1A]" />
          <span className="text-[#C8E8C8] font-bold">World Sandbox</span>
          <span className="text-[#4A7A4A] text-xs bg-[#0D1A0F] px-2 py-0.5 rounded">Admin</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-[#4A7A4A]">
          <span>92 models available</span>
          <span>·</span>
          <span>Left-drag to orbit · Right-drag to pan · Scroll to zoom</span>
        </div>
      </div>

      {/* Sandbox fills remaining height */}
      <div className="flex-1 overflow-hidden">
        <WorldSandbox />
      </div>
    </div>
  );
}
