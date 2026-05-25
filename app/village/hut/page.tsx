'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function HutPage() {
  const [profile, setProfile] = useState<any>(null);
  const [skills, setSkills] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      const { data: s } = await supabase.from('user_skills').select('*').eq('user_id', user.id);
      setProfile(p);
      setSkills(s || []);
    }
    load();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  return (
    <div className="min-h-screen bg-village-bg">
      <div className="bg-amber-500 text-white px-6 py-4 flex items-center gap-3">
        <Link href="/village/map" className="text-xl">←</Link>
        <span className="text-2xl">🏠</span>
        <h1 className="text-xl font-bold">The Hut</h1>
      </div>

      <div className="max-w-lg mx-auto p-6 space-y-4">
        {/* Profile card */}
        <div className="village-card text-center">
          <div className="w-20 h-20 rounded-full bg-village-blue/10 flex items-center justify-center text-3xl mx-auto mb-3">
            {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full rounded-full object-cover" /> : '👤'}
          </div>
          <h2 className="text-xl font-bold">@{profile?.username || 'villager'}</h2>
          <p className="text-gray-500 text-sm">{profile?.display_name || 'New Villager'}</p>
          <div className="flex justify-center gap-6 mt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-village-blue">{profile?.village_score || 0}</p>
              <p className="text-xs text-gray-400">village Score</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{skills.filter(s => s.rating >= 7).length}</p>
              <p className="text-xs text-gray-400">Skillsets</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-500">0</p>
              <p className="text-xs text-gray-400">Goals</p>
            </div>
          </div>
        </div>

        {/* Skills */}
        {skills.length > 0 && (
          <div className="village-card">
            <h3 className="font-bold mb-3">My Skills</h3>
            <div className="space-y-2">
              {skills.map(skill => (
                <div key={skill.id} className="flex items-center justify-between">
                  <span className="text-sm">{skill.skill_name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-100 rounded-full h-2">
                      <div className="h-2 rounded-full village-gradient" style={{ width: `${(skill.rating / 9) * 100}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 w-4">{skill.rating}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={signOut} className="w-full border border-gray-200 rounded-xl py-3 text-gray-500 hover:bg-gray-50 transition-colors text-sm">
          Sign out
        </button>
      </div>
    </div>
  );
}
