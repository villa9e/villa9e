import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function ReferralPage({ params }: { params: { username: string } }) {
  const supabase = createServerClient();
  const { data: referrer } = await supabase.from('profiles').select('id,username,display_name,village_score,score_tier').eq('username', params.username).single();

  // Store referral in cookie (read on onboarding complete)
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect('/village/map'); // Already logged in

  return (
    <div className="min-h-screen village-gradient flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl max-w-md w-full p-8 text-center shadow-2xl">
        <div className="w-20 h-20 rounded-full village-gradient flex items-center justify-center mx-auto mb-4 animate-float">
          <span className="text-4xl">⛺</span>
        </div>
        <h1 className="text-3xl font-bold text-village-blue">villa9e</h1>
        <p className="text-gray-500 text-sm mt-1 mb-6">It takes a village.</p>

        {referrer ? (
          <div className="bg-blue-50 rounded-2xl p-4 mb-6 border border-blue-100">
            <p className="text-sm text-gray-600">
              <span className="font-bold text-village-blue">@{referrer.username}</span>
              {referrer.display_name ? ` (${referrer.display_name})` : ''} invited you to the village!
            </p>
            <p className="text-xs text-gray-400 mt-1">Your referrer earns 100 $VLG when you join and set your first goal.</p>
          </div>
        ) : (
          <p className="text-gray-500 mb-6">Join the village — a GPS system for your goals.</p>
        )}

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
