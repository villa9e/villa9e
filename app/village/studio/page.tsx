'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { awardScore } from '@/lib/village/score';

const TEMPLATES = [
  { id: 'goal_progress', emoji: '📍', name: 'Goal Progress', desc: 'Show your journey', platform: ['Dream Line', 'Instagram', 'TikTok'] },
  { id: 'oowop_celebration', emoji: '✊', name: 'OoWop Moment', desc: 'Step validated celebration', platform: ['Dream Line', 'Instagram Stories'] },
  { id: 'quote_reel', emoji: '✨', name: 'Quote Card', desc: 'Inspiration + your story', platform: ['All platforms'] },
  { id: 'milestone', emoji: '🏆', name: 'Milestone Drop', desc: 'Big achievement post', platform: ['Dream Line', 'TikTok'] },
];

const FORMATS = [
  { id: 'square', label: '1:1 Square', desc: 'Instagram feed', icon: '⬜' },
  { id: 'story', label: '9:16 Story', desc: 'TikTok/Reels/Stories', icon: '📱' },
  { id: 'landscape', label: '16:9 Wide', desc: 'YouTube/Twitter', icon: '🖥️' },
];

export default function CreatorStudioPage() {
  const [tab, setTab] = useState<'create' | 'tips' | 'my-content'>('create');
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);
  const [selectedFormat, setSelectedFormat] = useState(FORMATS[1]);
  const [text, setText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<any>(null);
  const [videoStatus, setVideoStatus] = useState<string>('');
  const [tips, setTips] = useState<any>(null);
  const [tipsLoading, setTipsLoading] = useState(false);
  const [engagementData, setEngagementData] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const supabase = createClient();

  // Accelerometer engagement sensing
  const engagementRef = useRef({ motionEvents: 0, startTime: Date.now() });

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: p } = await supabase.from('profiles').select('username, personality_type, village_score').eq('id', user.id).single();
      setProfile(p);

      // Load engagement data from recent posts
      const { data: posts } = await supabase.from('dream_line_posts')
        .select('oowop_count, comment_count, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (posts?.length) {
        const avgOoWops = posts.reduce((s, p) => s + (p.oowop_count ?? 0), 0) / posts.length;
        const avgComments = posts.reduce((s, p) => s + (p.comment_count ?? 0), 0) / posts.length;
        setEngagementData({ oowop_rate: Math.round(avgOoWops * 10), comment_rate: Math.round(avgComments * 10), avg_watch_time: 0 });
      }
    }
    load();

    // Listen for device motion (engagement proxy)
    if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
      const handleMotion = () => { engagementRef.current.motionEvents++; };
      window.addEventListener('devicemotion', handleMotion, { passive: true });
      return () => window.removeEventListener('devicemotion', handleMotion);
    }
  }, []);

  async function generateVideo() {
    if (!text.trim()) { alert('Add your message first.'); return; }
    setGenerating(true);
    setGeneratedVideo(null);
    setVideoStatus('Generating your video…');

    const res = await fetch('/api/studio/generate-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template: selectedTemplate.id,
        content: {
          text,
          username: profile?.username ?? 'villager',
          goal_title: text,
          metric: '75',
          duration: selectedFormat.id === 'story' ? 15 : 10,
        },
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setVideoStatus('Video is processing…');

      // Poll for completion
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        if (attempts > 20) { clearInterval(poll); setVideoStatus('Taking longer than expected. Check back soon.'); return; }

        const statusRes = await fetch(`/api/studio/video-status?id=${data.movie_id}`);
        if (statusRes.ok) {
          const status = await statusRes.json();
          if (status.url) {
            clearInterval(poll);
            setGeneratedVideo(status);
            setVideoStatus('Ready! Download or share.');
            await awardScore('DREAM_LINE_POST'); // Award VLG for creating content
          }
        }
      }, 5000);
    } else {
      setVideoStatus('Generation failed. Try again.');
    }
    setGenerating(false);
  }

  async function getTips() {
    setTipsLoading(true);
    setTips(null);
    const res = await fetch('/api/studio/content-tips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content_type: 'dream_line_post',
        goal_category: 'general',
        engagement_data: engagementData,
        platform: 'dream_line',
      }),
    });
    if (res.ok) setTips(await res.json());
    setTipsLoading(false);
  }

  const PRIORITY_COLOR: Record<string, string> = { high: 'text-red-600 bg-red-50', medium: 'text-amber-600 bg-amber-50', low: 'text-green-600 bg-green-50' };

  return (
    <div className="min-h-screen bg-village-bg">
      <div className="bg-gradient-to-r from-purple-700 to-village-blue text-white px-6 py-4 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/village/workshop" className="text-xl">←</Link>
        <span className="text-2xl">🎬</span>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Creator Studio</h1>
          <p className="text-purple-200 text-xs">Make content that moves people</p>
        </div>
        {profile?.village_score >= 500 && (
          <span className="text-xs bg-white/20 rounded-full px-2 py-0.5">Pro Creator</span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex bg-white border-b border-gray-100 sticky top-[72px] z-10">
        {([['create', '🎬 Create'], ['tips', '💡 AI Tips'], ['my-content', '📊 My Content']] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === t ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* CREATE TAB */}
        {tab === 'create' && (
          <>
            <div className="village-card">
              <h2 className="font-bold mb-3">Choose Template</h2>
              <div className="grid grid-cols-2 gap-2">
                {TEMPLATES.map(t => (
                  <button key={t.id} onClick={() => setSelectedTemplate(t)}
                    className={`p-3 rounded-2xl text-left border-2 transition-all ${selectedTemplate.id === t.id ? 'border-purple-500 bg-purple-50' : 'border-gray-100 hover:border-purple-200'}`}>
                    <p className="text-2xl mb-1">{t.emoji}</p>
                    <p className="font-bold text-sm">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.desc}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {t.platform.map(p => <span key={p} className="text-xs bg-gray-100 rounded-full px-2 py-0.5">{p}</span>)}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="village-card">
              <h2 className="font-bold mb-3">Format</h2>
              <div className="grid grid-cols-3 gap-2">
                {FORMATS.map(f => (
                  <button key={f.id} onClick={() => setSelectedFormat(f)}
                    className={`p-3 rounded-xl text-center border-2 transition-all ${selectedFormat.id === f.id ? 'border-purple-500 bg-purple-50' : 'border-gray-100 hover:border-purple-200'}`}>
                    <p className="text-xl mb-1">{f.icon}</p>
                    <p className="font-bold text-xs">{f.label}</p>
                    <p className="text-xs text-gray-400">{f.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="village-card">
              <h2 className="font-bold mb-2">Your Message</h2>
              <textarea value={text} onChange={e => setText(e.target.value)}
                placeholder="What's your story? Goal update, milestone, insight..."
                rows={3} maxLength={200}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none" />
              <p className="text-xs text-gray-400 mt-1 text-right">{text.length}/200</p>
            </div>

            <button onClick={generateVideo} disabled={generating || !text.trim()}
              className="w-full bg-gradient-to-r from-purple-700 to-village-blue text-white rounded-2xl py-4 font-bold text-lg disabled:opacity-50 hover:opacity-90 transition-opacity">
              {generating ? '⏳ Generating…' : '🎬 Generate Video'}
            </button>

            {videoStatus && (
              <div className="village-card bg-purple-50 border border-purple-200">
                <p className="text-sm text-purple-700 font-medium">{videoStatus}</p>
              </div>
            )}

            {generatedVideo?.url && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="village-card">
                <p className="font-bold mb-3">🎬 Your Video is Ready!</p>
                <video src={generatedVideo.url} controls className="w-full rounded-2xl mb-3" />
                <div className="flex gap-3">
                  <a href={generatedVideo.url} download className="flex-1 bg-village-blue text-white rounded-full py-2.5 text-sm font-bold text-center hover:bg-blue-700">
                    ⬇ Download
                  </a>
                  <button onClick={() => {
                    navigator.clipboard.writeText(generatedVideo.url);
                  }} className="flex-1 border border-gray-200 text-gray-600 rounded-full py-2.5 text-sm font-medium hover:bg-gray-50">
                    📋 Copy Link
                  </button>
                </div>
              </motion.div>
            )}
          </>
        )}

        {/* TIPS TAB */}
        {tab === 'tips' && (
          <>
            <div className="village-card bg-gradient-to-br from-purple-50 to-blue-50">
              <div className="flex items-start gap-3">
                <span className="text-3xl">🤖</span>
                <div>
                  <p className="font-bold text-purple-700">AI Creator Coach</p>
                  <p className="text-sm text-gray-600 mt-0.5">
                    Analyzes your recent posts and village score to give you specific, actionable content tips.
                  </p>
                </div>
              </div>
              {engagementData && (
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white rounded-xl p-2 text-center">
                    <p className="font-bold text-village-blue">{engagementData.oowop_rate ?? 0}%</p>
                    <p className="text-gray-400">OoWop Rate</p>
                  </div>
                  <div className="bg-white rounded-xl p-2 text-center">
                    <p className="font-bold text-purple-600">{engagementData.comment_rate ?? 0}%</p>
                    <p className="text-gray-400">Comment Rate</p>
                  </div>
                </div>
              )}
            </div>

            <button onClick={getTips} disabled={tipsLoading}
              className="w-full bg-gradient-to-r from-purple-700 to-village-blue text-white rounded-2xl py-4 font-bold disabled:opacity-50">
              {tipsLoading ? '🤖 Analyzing your content…' : '💡 Get My Content Tips'}
            </button>

            {tips && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                <div className="village-card">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold">Content Health</p>
                    <span className={`text-sm font-bold ${(tips.score ?? 0) >= 70 ? 'text-green-600' : (tips.score ?? 0) >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                      {tips.score ?? 0}/100
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{tips.summary}</p>
                  <p className={`text-xs mt-1 font-medium ${tips.trend === 'rising' ? 'text-green-600' : tips.trend === 'declining' ? 'text-red-500' : 'text-gray-500'}`}>
                    {tips.trend === 'rising' ? '↑ Rising' : tips.trend === 'declining' ? '↓ Needs attention' : '→ Steady'}
                  </p>
                </div>

                {(tips.tips ?? []).map((tip: any, i: number) => (
                  <div key={i} className="village-card">
                    <div className="flex items-start gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold mt-0.5 flex-shrink-0 ${PRIORITY_COLOR[tip.priority] ?? PRIORITY_COLOR.low}`}>
                        {tip.priority}
                      </span>
                      <div>
                        <p className="font-bold text-sm">{tip.title}</p>
                        <p className="text-xs text-gray-600 mt-1">{tip.body}</p>
                        {tip.example && (
                          <div className="mt-2 bg-gray-50 rounded-xl px-3 py-2 text-xs text-gray-700 italic">
                            "{tip.example}"
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {tips.next_best_content && (
                  <div className="village-card bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
                    <p className="text-xs font-bold text-amber-700 mb-1">🎯 Create This Next</p>
                    <p className="text-sm text-gray-800">{tips.next_best_content}</p>
                  </div>
                )}
              </motion.div>
            )}
          </>
        )}

        {/* MY CONTENT TAB */}
        {tab === 'my-content' && (
          <div className="space-y-3">
            <div className="village-card bg-gradient-to-br from-purple-50 to-blue-50">
              <p className="text-sm text-gray-600">
                Your Dream Line posts + engagement data. Create consistently to build your audience in the village.
              </p>
            </div>
            <Link href="/village/dreamline" className="village-card flex items-center gap-3 hover:shadow-md transition-shadow block">
              <span className="text-2xl">✨</span>
              <div>
                <p className="font-bold text-sm">Dream Line</p>
                <p className="text-xs text-gray-400">View and manage your posts</p>
              </div>
              <span className="text-gray-300 text-xl ml-auto">›</span>
            </Link>
            <Link href="/village/workshop/skill-stream" className="village-card flex items-center gap-3 hover:shadow-md transition-shadow block">
              <span className="text-2xl">📺</span>
              <div>
                <p className="font-bold text-sm">Skill Stream</p>
                <p className="text-xs text-gray-400">Learn from top creators in your niche</p>
              </div>
              <span className="text-gray-300 text-xl ml-auto">›</span>
            </Link>
            <div className="village-card">
              <p className="font-bold text-sm mb-2">📈 Content Stats</p>
              {engagementData ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Avg OoWops/post</span><span className="font-bold">{(engagementData.oowop_rate / 10).toFixed(1)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Avg Comments/post</span><span className="font-bold">{(engagementData.comment_rate / 10).toFixed(1)}</span></div>
                </div>
              ) : (
                <p className="text-xs text-gray-400">Post on the Dream Line to see your stats.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
