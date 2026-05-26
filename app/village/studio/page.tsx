'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { VillageSound } from '@/lib/sounds/village';
import { VIDEO_TEMPLATES, type TemplateId } from '@/lib/studio/videoTemplates';

type StudioTab = 'create' | 'tips' | 'affiliates' | 'my-content';

// ─── In-browser video preview (Framer Motion composition) ────────────────────
function VideoPreview({
  templateId, data, aspectRatio,
}: { templateId: TemplateId; data: Record<string, any>; aspectRatio: '9:16' | '1:1' | '16:9' }) {
  const template = VIDEO_TEMPLATES[templateId];
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setFrame(f => f + 1), 100);
    return () => clearInterval(interval);
  }, []);

  const dims = aspectRatio === '9:16'
    ? { w: 180, h: 320 }
    : aspectRatio === '1:1'
    ? { w: 240, h: 240 }
    : { w: 320, h: 180 };

  const t = frame / 10;  // seconds elapsed

  return (
    <div className="relative rounded-2xl overflow-hidden flex-shrink-0 mx-auto"
      style={{ width: dims.w, height: dims.h, background: '#0A0B12' }}>

      {/* Background glow */}
      <motion.div className="absolute inset-0"
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 3, repeat: Infinity }}
        style={{ background: `radial-gradient(circle at 50% 40%, ${template.accentColor}20 0%, transparent 70%)` }} />

      {/* Scan lines */}
      <div className="absolute inset-0 pointer-events-none opacity-5"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.3) 2px, rgba(255,255,255,0.3) 3px)' }} />

      {/* Animated content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-3 text-center">
        <motion.div
          animate={{ scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          className="text-4xl mb-2"
        >
          {template.emoji}
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="font-black text-white text-xs leading-tight mb-1"
          style={{ fontSize: '11px' }}
        >
          {data[template.fields[0]?.key] || template.fields[0]?.placeholder || template.name}
        </motion.p>

        {template.fields[1] && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-xs"
            style={{ color: template.accentColor, fontSize: '10px' }}
          >
            {data[template.fields[1].key] || template.fields[1].placeholder}
          </motion.p>
        )}
      </div>

      {/* Brand bar */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-2 py-1.5"
        style={{ background: 'rgba(0,0,0,0.6)' }}>
        <span className="text-white/70 font-bold" style={{ fontSize: '9px' }}>⛺ villa9e</span>
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-1.5 h-1.5 rounded-full bg-red-500"
        />
      </div>
    </div>
  );
}

export default function CreatorStudioPage() {
  const [tab, setTab]                   = useState<StudioTab>('create');
  const [selectedTemplateId, setSelectedTemplateId] = useState<TemplateId>('goal_recap');
  const [templateData, setTemplateData] = useState<Record<string, any>>({});
  const [generating, setGenerating]     = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<any>(null);
  const [videoStatus, setVideoStatus]   = useState('');
  const [tips, setTips]                 = useState<any>(null);
  const [tipsLoading, setTipsLoading]   = useState(false);
  const [affiliates, setAffiliates]     = useState<any[]>([]);
  const [myContent, setMyContent]       = useState<any[]>([]);
  const [profile, setProfile]           = useState<any>(null);
  const [engagementData, setEngagementData] = useState<any>(null);
  const engagementRef = useRef({ motionEvents: 0 });
  const supabase = createClient();
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';

  const bg       = isNight ? '#0A0B12' : '#F5F0FF';
  const cardBg   = isNight ? '#12152A' : '#FFFFFF';
  const border   = isNight ? '#1E2240' : '#E9D5FF';
  const textMain = isNight ? '#F0EBE0' : '#1E1B4B';
  const textMute = isNight ? '#4A4F72' : '#6D28D9';
  const accent   = '#7C3AED';

  const selectedTemplate = VIDEO_TEMPLATES[selectedTemplateId];

  useEffect(() => {
    loadProfile();
    // Accelerometer for engagement sensing
    if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
      const handler = () => { engagementRef.current.motionEvents++; };
      window.addEventListener('devicemotion', handler, { passive: true });
      return () => window.removeEventListener('devicemotion', handler);
    }
  }, []);

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [{ data: p }, { data: posts }] = await Promise.all([
      (supabase as any).from('profiles').select('username, personality_type, village_score, avatar_config').eq('id', user.id).single(),
      (supabase as any).from('dream_line_posts').select('oowop_count, comment_count, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
    ]);
    setProfile(p);

    if (posts?.length) {
      const avgOoWops  = posts.reduce((a: number, p: any) => a + (p.oowop_count || 0), 0) / posts.length;
      const avgComments = posts.reduce((a: number, p: any) => a + (p.comment_count || 0), 0) / posts.length;
      setEngagementData({ posts: posts.length, avg_oowops: avgOoWops.toFixed(1), avg_comments: avgComments.toFixed(1) });
    }

    // Load my content
    const { data: myPosts } = await (supabase as any).from('dream_line_posts')
      .select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(6);
    setMyContent(myPosts ?? []);
  }

  async function generateVideo() {
    if (!Object.values(templateData).some(v => v)) return;
    setGenerating(true);
    setGeneratedVideo(null);
    setVideoStatus('Sending to JSON2Video…');

    try {
      const payload = selectedTemplate.json2video(templateData);
      const res = await fetch('/api/studio/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template: payload, template_id: selectedTemplateId }),
      });
      const data = await res.json();
      if (data.id || data.movie) {
        setGeneratedVideo(data);
        setVideoStatus('Rendering…');
        VillageSound.notification();
        // Poll for completion
        pollVideo(data.id ?? data.movie?.id);
      } else {
        setVideoStatus('Error — try again');
      }
    } catch {
      setVideoStatus('Error generating video');
    }
    setGenerating(false);
  }

  async function pollVideo(id: string) {
    const interval = setInterval(async () => {
      const res = await fetch(`/api/studio/video-status?id=${id}`);
      const data = await res.json();
      if (data.status === 'done' || data.url) {
        setGeneratedVideo(data);
        setVideoStatus('');
        clearInterval(interval);
        VillageSound.stepComplete();
      } else if (data.status === 'error') {
        setVideoStatus('Render failed');
        clearInterval(interval);
      }
    }, 3000);
  }

  async function fetchTips() {
    setTipsLoading(true);
    try {
      const res = await fetch('/api/studio/content-tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          archetype: profile?.personality_type,
          engagement_data: engagementData,
          motion_events: engagementRef.current.motionEvents,
        }),
      });
      const data = await res.json();
      setTips(data);
    } catch { /* silent */ }
    setTipsLoading(false);
  }

  async function fetchAffiliates() {
    // Load affiliate content recommendations based on this user's goals and engagement
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: goals } = await (supabase as any).from('goals')
      .select('title, category').eq('user_id', user.id).eq('status', 'active').limit(3);

    // Get affiliate-eligible providers from Trading Post
    const { data: providers } = await (supabase as any).from('provider_profiles')
      .select('*, profiles(username)')
      .eq('verification_status', 'approved')
      .eq('is_active', true)
      .limit(8);

    setAffiliates(providers ?? []);
  }

  useEffect(() => {
    if (tab === 'affiliates') fetchAffiliates();
    if (tab === 'tips') fetchTips();
  }, [tab]);

  const TABS: [StudioTab, string, string][] = [
    ['create',     '🎬', 'Create'],
    ['tips',       '💡', 'AI Tips'],
    ['affiliates', '🤝', 'Affiliates'],
    ['my-content', '📊', 'My Content'],
  ];

  return (
    <div className="min-h-screen" style={{ background: bg }}>
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 border-b"
        style={{ background: isNight ? '#0E1020' : accent, borderColor: isNight ? '#1E2240' : 'transparent' }}>
        <Link href="/village/workshop" className="text-xl text-white">←</Link>
        <span className="text-2xl">🎬</span>
        <div className="flex-1">
          <h1 className="font-black text-white text-base">Creator Studio</h1>
          <p className="text-white/60 text-xs">Make content · Get AI tips · Track your impact</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b" style={{ background: cardBg, borderColor: border }}>
        {TABS.map(([id, icon, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className="flex-1 py-3 text-sm font-bold transition-all flex flex-col items-center gap-0.5"
            style={{
              color: tab === id ? accent : textMute,
              borderBottom: tab === id ? `2px solid ${accent}` : '2px solid transparent',
            }}>
            <span>{icon}</span>
            <span className="text-xs">{label}</span>
          </button>
        ))}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 pb-8">

        {/* ── CREATE TAB ── */}
        {tab === 'create' && (
          <div className="space-y-4">
            {/* Template picker */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: textMute }}>Choose Template</p>
              <div className="grid grid-cols-3 gap-2">
                {(Object.values(VIDEO_TEMPLATES)).map(tmpl => (
                  <motion.button key={tmpl.id} whileTap={{ scale: 0.95 }}
                    onClick={() => { setSelectedTemplateId(tmpl.id); setTemplateData({}); VillageSound.tap(); }}
                    className="rounded-2xl p-3 flex flex-col items-center gap-1 transition-all text-center"
                    style={{
                      background: selectedTemplateId === tmpl.id ? `${tmpl.accentColor}18` : cardBg,
                      border: `2px solid ${selectedTemplateId === tmpl.id ? tmpl.accentColor : border}`,
                    }}>
                    <span className="text-2xl">{tmpl.emoji}</span>
                    <span className="text-xs font-bold leading-tight" style={{ color: selectedTemplateId === tmpl.id ? tmpl.accentColor : textMute }}>
                      {tmpl.name}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Template form + preview side by side */}
            <div className="flex gap-4 items-start">
              {/* Form */}
              <div className="flex-1 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: textMute }}>
                  {selectedTemplate.name} — {selectedTemplate.duration}s · {selectedTemplate.aspectRatio}
                </p>
                {selectedTemplate.fields.map(field => (
                  <div key={field.key}>
                    <label className="text-xs font-semibold block mb-1" style={{ color: textMute }}>
                      {field.label}{field.required && ' *'}
                    </label>
                    {field.type === 'select' ? (
                      <select
                        value={templateData[field.key] ?? ''}
                        onChange={e => setTemplateData(d => ({ ...d, [field.key]: e.target.value }))}
                        className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                        style={{ background: isNight ? '#0A0B12' : '#F5F0FF', border: `1px solid ${border}`, color: textMain }}>
                        <option value="">Select…</option>
                        {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : field.type === 'number' ? (
                      <input type="number"
                        value={templateData[field.key] ?? ''}
                        onChange={e => setTemplateData(d => ({ ...d, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                        className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                        style={{ background: isNight ? '#0A0B12' : '#F5F0FF', border: `1px solid ${border}`, color: textMain }} />
                    ) : (
                      <input type="text"
                        value={templateData[field.key] ?? ''}
                        onChange={e => setTemplateData(d => ({ ...d, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                        className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                        style={{ background: isNight ? '#0A0B12' : '#F5F0FF', border: `1px solid ${border}`, color: textMain }} />
                    )}
                  </div>
                ))}
              </div>

              {/* Preview */}
              <div className="flex-shrink-0">
                <p className="text-xs font-bold text-center mb-2" style={{ color: textMute }}>Preview</p>
                <VideoPreview
                  templateId={selectedTemplateId}
                  data={templateData}
                  aspectRatio={selectedTemplate.aspectRatio}
                />
              </div>
            </div>

            {/* Generate button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={generateVideo}
              disabled={generating}
              className="w-full py-4 rounded-2xl font-black text-white text-base transition-all disabled:opacity-50"
              style={{ background: `linear-gradient(135deg, ${accent}, #1877F2)` }}>
              {generating ? '⟳ Generating…' : '🎬 Render Video'}
            </motion.button>
            {videoStatus && <p className="text-center text-sm" style={{ color: textMute }}>{videoStatus}</p>}

            {/* Generated video result */}
            {generatedVideo?.url && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl p-4 space-y-3"
                style={{ background: cardBg, border: `1px solid ${border}` }}>
                <p className="font-black text-sm" style={{ color: textMain }}>✅ Video Ready!</p>
                <video src={generatedVideo.url} controls className="w-full rounded-xl" />
                <div className="flex gap-2">
                  <a href={generatedVideo.url} download
                    className="flex-1 text-center py-2.5 rounded-full font-bold text-white text-sm"
                    style={{ background: accent }}>
                    Download MP4
                  </a>
                  <button onClick={async () => {
                    // Share to Dream Line
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                      await (supabase as any).from('dream_line_posts').insert({
                        user_id: user.id,
                        content: `🎬 New ${selectedTemplate.name} — ${templateData[selectedTemplate.fields[0]?.key] ?? ''}`,
                        visibility: 'public',
                        media_url: generatedVideo.url,
                      });
                      VillageSound.post();
                    }
                  }}
                    className="flex-1 text-center py-2.5 rounded-full font-bold text-sm"
                    style={{ background: isNight ? '#1E2240' : '#EDE9FE', color: accent }}>
                    Share to Dream Line
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* ── AI TIPS TAB ── */}
        {tab === 'tips' && (
          <div className="space-y-4">
            <div className="rounded-2xl p-4" style={{ background: cardBg, border: `1px solid ${border}` }}>
              <p className="font-black text-sm mb-1" style={{ color: textMain }}>Your Engagement Stats</p>
              {engagementData ? (
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: 'Posts', value: engagementData.posts },
                    { label: 'Avg OoWops', value: engagementData.avg_oowops },
                    { label: 'Avg Comments', value: engagementData.avg_comments },
                  ].map(s => (
                    <div key={s.label} className="rounded-xl py-2" style={{ background: isNight ? '#0A0B12' : '#F5F0FF' }}>
                      <p className="font-black text-lg" style={{ color: accent }}>{s.value}</p>
                      <p className="text-xs" style={{ color: textMute }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm" style={{ color: textMute }}>Post to Dream Line to see your stats.</p>
              )}
            </div>

            {tipsLoading ? (
              <div className="text-center py-8" style={{ color: textMute }}>
                <div className="text-3xl mb-2 animate-pulse">💡</div>
                <p className="text-sm">Spirit is analyzing your content…</p>
              </div>
            ) : tips ? (
              <div className="space-y-3">
                {(tips.tips ?? [tips]).map((tip: any, i: number) => (
                  <div key={i} className="rounded-2xl p-4" style={{ background: cardBg, border: `1px solid ${border}` }}>
                    <p className="font-bold text-sm mb-1" style={{ color: accent }}>{tip.title ?? `Tip ${i + 1}`}</p>
                    <p className="text-sm leading-relaxed" style={{ color: isNight ? '#C8C3B8' : '#374151' }}>{tip.body ?? tip}</p>
                  </div>
                ))}
              </div>
            ) : (
              <button onClick={fetchTips}
                className="w-full py-4 rounded-2xl font-black text-white"
                style={{ background: `linear-gradient(135deg, ${accent}, #1877F2)` }}>
                💡 Get Spirit's Content Tips
              </button>
            )}
          </div>
        )}

        {/* ── AFFILIATES TAB ── */}
        {tab === 'affiliates' && (
          <div className="space-y-4">
            <div className="rounded-2xl p-4" style={{ background: cardBg, border: `1px solid ${border}` }}>
              <p className="font-black text-sm mb-1" style={{ color: textMain }}>Content + Service Recommendations</p>
              <p className="text-xs leading-relaxed" style={{ color: textMute }}>
                Based on your goals and engagement, these verified providers offer services that could accelerate your journey. Feature them in your content and earn affiliate credits.
              </p>
            </div>

            {affiliates.length === 0 ? (
              <div className="text-center py-10" style={{ color: textMute }}>
                <p className="text-3xl mb-2">🤝</p>
                <p className="text-sm">Loading affiliate recommendations…</p>
              </div>
            ) : affiliates.map((prov, i) => (
              <motion.div key={prov.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="rounded-2xl p-4" style={{ background: cardBg, border: `1px solid ${border}` }}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: isNight ? '#1E2240' : '#EDE9FE' }}>
                    🩺
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm" style={{ color: textMain }}>{prov.display_name}</p>
                    <p className="text-xs" style={{ color: textMute }}>{prov.specialty ?? prov.credential_type}</p>
                    {prov.session_rate && (
                      <p className="text-xs mt-0.5 font-semibold" style={{ color: accent }}>${prov.session_rate}/session</p>
                    )}
                  </div>
                  <Link href={`/villager/${prov.profiles?.username}`}
                    className="text-xs px-3 py-1.5 rounded-full font-bold"
                    style={{ background: accent, color: '#fff' }}>
                    Feature
                  </Link>
                </div>
              </motion.div>
            ))}

            <div className="rounded-2xl p-4" style={{ background: cardBg, border: `1px solid ${border}` }}>
              <p className="font-bold text-sm mb-2" style={{ color: textMain }}>Are you a professional?</p>
              <p className="text-xs mb-3" style={{ color: textMute }}>Get verified and open your storefront in the Trading Post. Creators can feature your services to their audience.</p>
              <Link href="/village/hospital/join"
                className="block text-center py-2.5 rounded-full font-bold text-white text-sm"
                style={{ background: accent }}>
                Apply as a Verified Professional →
              </Link>
            </div>
          </div>
        )}

        {/* ── MY CONTENT TAB ── */}
        {tab === 'my-content' && (
          <div className="space-y-3">
            {myContent.length === 0 ? (
              <div className="text-center py-10" style={{ color: textMute }}>
                <p className="text-3xl mb-2">📊</p>
                <p className="text-sm">No content yet. Post to Dream Line or create a video.</p>
              </div>
            ) : myContent.map((post, i) => (
              <div key={post.id} className="rounded-2xl p-4" style={{ background: cardBg, border: `1px solid ${border}` }}>
                <p className="text-sm line-clamp-2 mb-2" style={{ color: textMain }}>{post.content}</p>
                <div className="flex items-center gap-3 text-xs" style={{ color: textMute }}>
                  <span>✊ {post.oowop_count || 0} OoWops</span>
                  <span>💬 {post.comment_count || 0} Comments</span>
                  <span className="ml-auto">{new Date(post.created_at).toLocaleDateString()}</span>
                </div>
                {/* Engagement bar */}
                <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: isNight ? '#1E2240' : '#EDE9FE' }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, ((post.oowop_count || 0) / 10) * 100)}%`, background: accent }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
