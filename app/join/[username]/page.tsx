'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function ReferralPage({ params }: { params: { username: string } }) {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Save referrer for use at onboarding completion
    localStorage.setItem('villa9e_referrer', params.username);

    // If already logged in, redirect to map
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.push('/village/map');
    });
  }, [params.username]);

  return (
    <div className="min-h-screen village-gradient flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl max-w-md w-full p-8 text-center shadow-2xl">
        <div className="w-20 h-20 rounded-full village-gradient flex items-center justify-center mx-auto mb-4 animate-float">
          <span className="text-4xl">⛺</span>
        </div>
        <h1 className="text-3xl font-bold text-village-blue">villa9e</h1>
        <p className="text-gray-500 text-sm mt-1 mb-6">It takes a village.</p>

        <div className="bg-blue-50 rounded-2xl p-4 mb-6 border border-blue-100">
          <p className="text-sm text-gray-600">
            <span className="font-bold text-village-blue">@{params.username}</span>{' '}
            invited you to the village!
          </p>
          <p className="text-xs text-gray-400 mt-1">You both earn +100 $VLG when you join and complete onboarding.</p>
        </div>

        <Link href={`/signup?ref=${params.username}`} className="village-btn-primary block w-full mb-3">
          🏡 Join the Village
        </Link>
        <Link href="/login" className="text-sm text-gray-400 hover:text-gray-600">
          Already a villager? Sign in
        </Link>

        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          {[['🗺️','Goal GPS'],['✊','OoWops'],['🌿','Spirit AI']].map(([icon,label]) => (
            <div key={label as string} className="text-xs text-gray-500">
              <p className="text-2xl mb-1">{icon}</p>
              <p>{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
