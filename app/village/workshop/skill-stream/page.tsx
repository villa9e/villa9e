'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const SKILL_CATEGORIES = [
  'All','USDA Grants','Microlending','Business Strategy','Marketing','Design','Tech','Finance','Wellness','Music','Real Estate','Fitness',
];

export default function SkillStreamPage() {
  const [videos, setVideos] = useState<any[]>([]);
  const [category, setCategory] = useState('All');
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => { loadSkillsAndVideos(); }, [category]);

  async function loadSkillsAndVideos() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: s } = await supabase.from('user_skills').select('skill_name,rating_category').eq('user_id', user.id);
      const painPoints = s?.filter(sk => sk.rating_category === 'pain_point').map(sk => sk.skill_name) ?? [];
      setUserSkills(painPoints);
    }
    const searchQuery = category === 'All' ? 'goal setting productivity entrepreneur skills' : `${category} tutorial skills`;
    const videos = await searchYoutube(searchQuery);
    setVideos(videos);
    setLoading(false);
  }

  async function searchYoutube(query: string) {
    try {
      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}&max=12`);
      if (!res.ok) return getMockVideos(query);
      return await res.json();
    } catch { return getMockVideos(query); }
  }

  function getMockVideos(query: string) {
    return [
      { id: 'dQw4w9WgXcQ', title: `How to master ${query} — Complete Guide`, channel: 'Skills Academy', views: '1.2M views', duration: '14:32', thumbnail: `https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg` },
      { id: 'jNQXAC9IVRw', title: `${query} for beginners in 2026`, channel: 'Learn Fast', views: '847K views', duration: '9:15', thumbnail: `https://img.youtube.com/vi/jNQXAC9IVRw/mqdefault.jpg` },
      { id: 'M7lc1UVf-VE', title: `Advanced ${query} strategies`, channel: 'Pro Skills', views: '234K views', duration: '22:48', thumbnail: `https://img.youtube.com/vi/M7lc1UVf-VE/mqdefault.jpg` },
    ];
  }

  return (
    <div className="min-h-screen bg-village-bg">
      <div className="bg-orange-500 text-white px-6 py-4 flex items-center gap-3">
        <Link href="/village/workshop" className="text-xl">←</Link>
        <span className="text-2xl">📺</span>
        <div>
          <h1 className="text-xl font-bold leading-tight">Skill Stream</h1>
          <p className="text-orange-100 text-xs">Learn what your goals require</p>
        </div>
      </div>

      {userSkills.length > 0 && (
        <div className="bg-orange-50 border-b border-orange-100 px-4 py-2">
          <p className="text-xs text-orange-700 font-medium">📍 Recommended for your pain points: {userSkills.slice(0,3).join(' · ')}</p>
        </div>
      )}

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 px-4 py-3 bg-white border-b border-gray-100">
        {SKILL_CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${category === cat ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {cat}
          </button>
        ))}
      </div>

      <div className="max-w-2xl mx-auto p-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1,2,3,4].map(i => <div key={i} className="bg-gray-100 rounded-2xl h-40 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {videos.map((v, i) => (
              <motion.div key={v.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="village-card overflow-hidden p-0">
                <div className="relative">
                  <img src={v.thumbnail} alt={v.title} className="w-full aspect-video object-cover" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                  <span className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">{v.duration}</span>
                  <button
                    onClick={() => setPlaying(playing === v.id ? null : v.id)}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow">
                      <span className="text-orange-500 text-lg ml-0.5">{playing === v.id ? '⏸' : '▶'}</span>
                    </div>
                  </button>
                </div>
                {playing === v.id && (
                  <div className="p-1">
                    <iframe
                      src={`https://www.youtube.com/embed/${v.id}?autoplay=1`}
                      className="w-full aspect-video rounded-xl"
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                    />
                  </div>
                )}
                <div className="p-3">
                  <p className="font-medium text-xs line-clamp-2">{v.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{v.channel} · {v.views}</p>
                  <button className="mt-2 text-xs text-orange-500 font-medium hover:underline">
                    ✊ Triple-tap to request mentor
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
