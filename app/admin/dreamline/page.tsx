'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const ADMIN_EMAIL = 'elitehousemusic@gmail.com';

const ALGORITHMS = [
  { value: 'chronological', label: 'Chronological', desc: 'Newest posts first. No ranking.' },
  { value: 'engagement', label: 'Engagement-First', desc: 'Most OoWops and comments rise to top.' },
  { value: 'mission_scored', label: 'Mission-Scored', desc: 'Posts ranked by alignment with villa9e mission.' },
  { value: 'hybrid', label: 'Hybrid', desc: 'Weighted blend of recency, OoWops, and mission score.' },
];

export default function DreamLineAdminPage() {
  const [authed, setAuthed] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [queue, setQueue] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [newBoost, setNewBoost] = useState('');
  const [newSuppress, setNewSuppress] = useState('');
  const [activeTab, setActiveTab] = useState<'config' | 'queue' | 'stats'>('config');
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email === ADMIN_EMAIL) {
        setAuthed(true);
        loadData();
      }
    });
  }, []);

  async function loadData() {
    const [{ data: cfg }, { data: q }, { data: posts }] = await Promise.all([
      (supabase as any).from('dreamline_config').select('*').eq('id', 1).single(),
      (supabase as any).from('content_review_queue').select('*, dream_line_posts(content, user_id, mission_score, profiles(username))').eq('status', 'pending').order('created_at', { ascending: false }).limit(20),
      (supabase as any).from('dream_line_posts').select('mission_score, is_hidden, created_at').limit(500),
    ]);
    setConfig(cfg ?? {
      algorithm: 'mission_scored', mission_score_minimum: 50, auto_hide_below: 20,
      boost_keywords: [], suppress_keywords: [], require_video_check: false,
      oowop_weight: 0.4, recency_weight: 0.3, mission_weight: 0.3,
    });
    setQueue(q ?? []);

    if (posts) {
      const avg = posts.reduce((s: number, p: any) => s + (p.mission_score ?? 75), 0) / (posts.length || 1);
      const hidden = posts.filter((p: any) => p.is_hidden).length;
      const below50 = posts.filter((p: any) => (p.mission_score ?? 75) < 50).length;
      setStats({ total: posts.length, avg: Math.round(avg), hidden, below50, queue: q?.length ?? 0 });
    }
  }

  async function saveConfig() {
    setSaving(true);
    await (supabase as any).from('dreamline_config').upsert({ ...config, id: 1, updated_at: new Date().toISOString() });
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2500);
  }

  async function reviewPost(queueId: string, postId: string, action: 'approved' | 'rejected') {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await (supabase as any).from('content_review_queue').update({ status: action, reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq('id', queueId);
    if (action === 'rejected') {
      await (supabase as any).from('dream_line_posts').update({ is_hidden: true, hidden_reason: 'Admin review: rejected' }).eq('id', postId);
    } else {
      await (supabase as any).from('dream_line_posts').update({ is_hidden: false }).eq('id', postId);
    }
    setQueue(prev => prev.filter(q => q.id !== queueId));
    setStats((s: any) => ({ ...s, queue: Math.max(0, (s.queue ?? 1) - 1) }));
  }

  function addKeyword(type: 'boost_keywords' | 'suppress_keywords', value: string) {
    if (!value.trim()) return;
    setConfig((c: any) => ({ ...c, [type]: [...(c[type] ?? []), value.trim().toLowerCase()] }));
    if (type === 'boost_keywords') setNewBoost(''); else setNewSuppress('');
  }

  function removeKeyword(type: 'boost_keywords' | 'suppress_keywords', word: string) {
    setConfig((c: any) => ({ ...c, [type]: (c[type] ?? []).filter((k: string) => k !== word) }));
  }

  if (!authed) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center"><p className="text-4xl mb-4">🔒</p><p className="text-gray-500">Admin access only.</p></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-purple-700 text-white px-6 py-4 flex items-center gap-3">
        <Link href="/admin" className="text-xl">←</Link>
        <span className="text-2xl">✨</span>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Dream Line Controls</h1>
          <p className="text-purple-200 text-xs">Algorithm · Mission Moderation · Content Review</p>
        </div>
        {stats.queue > 0 && (
          <div className="bg-red-500 text-white rounded-full px-3 py-1 text-sm font-bold">
            {stats.queue} in queue
          </div>
        )}
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-5 gap-0 bg-white border-b border-gray-100">
        {[
          { label: 'Total Posts', value: stats.total ?? 0, color: 'text-gray-700' },
          { label: 'Avg Score', value: `${stats.avg ?? 0}%`, color: 'text-village-blue' },
          { label: 'Hidden', value: stats.hidden ?? 0, color: 'text-red-500' },
          { label: 'Below 50', value: stats.below50 ?? 0, color: 'text-amber-500' },
          { label: 'Review Queue', value: stats.queue ?? 0, color: 'text-purple-600' },
        ].map(s => (
          <div key={s.label} className="text-center py-4 border-r border-gray-100 last:border-0">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white">
        {([['config', '⚙️ Algorithm'], ['queue', `📋 Review Queue${stats.queue > 0 ? ` (${stats.queue})` : ''}`], ['stats', '📊 Stats']] as const).map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === tab ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Config tab */}
        {activeTab === 'config' && config && (
          <>
            {/* Algorithm selector */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="font-bold mb-4">Feed Algorithm</h2>
              <div className="grid grid-cols-2 gap-3">
                {ALGORITHMS.map(algo => (
                  <button key={algo.value} onClick={() => setConfig((c: any) => ({ ...c, algorithm: algo.value }))}
                    className={`text-left p-4 rounded-2xl border-2 transition-all ${config.algorithm === algo.value ? 'border-purple-600 bg-purple-50' : 'border-gray-100 hover:border-purple-200'}`}>
                    <p className="font-bold text-sm">{algo.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{algo.desc}</p>
                  </button>
                ))}
              </div>

              {config.algorithm === 'hybrid' && (
                <div className="mt-4 grid grid-cols-3 gap-4">
                  {[
                    { key: 'oowop_weight', label: 'OoWop Weight' },
                    { key: 'recency_weight', label: 'Recency Weight' },
                    { key: 'mission_weight', label: 'Mission Weight' },
                  ].map(w => (
                    <div key={w.key}>
                      <label className="text-xs font-medium text-gray-500">{w.label}: {Math.round((config[w.key] ?? 0) * 100)}%</label>
                      <input type="range" min="0" max="100" value={Math.round((config[w.key] ?? 0) * 100)}
                        onChange={e => setConfig((c: any) => ({ ...c, [w.key]: parseFloat(e.target.value) / 100 }))}
                        className="w-full mt-1" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Mission score controls */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="font-bold mb-4">Mission Alignment Thresholds</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Minimum score to show in feed: <span className="text-purple-600 font-bold">{config.mission_score_minimum}%</span>
                  </label>
                  <input type="range" min="0" max="100" value={config.mission_score_minimum}
                    onChange={e => setConfig((c: any) => ({ ...c, mission_score_minimum: parseInt(e.target.value) }))}
                    className="w-full mt-2" />
                  <p className="text-xs text-gray-400 mt-1">Posts below this score are hidden from the feed but visible to the author.</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Auto-hide below: <span className="text-red-500 font-bold">{config.auto_hide_below}%</span>
                  </label>
                  <input type="range" min="0" max="100" value={config.auto_hide_below}
                    onChange={e => setConfig((c: any) => ({ ...c, auto_hide_below: parseInt(e.target.value) }))}
                    className="w-full mt-2" />
                  <p className="text-xs text-gray-400 mt-1">Posts scoring below this are sent to review queue automatically.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-50">
                <button onClick={() => setConfig((c: any) => ({ ...c, require_video_check: !c.require_video_check }))}
                  className={`relative w-12 h-6 rounded-full transition-colors ${config.require_video_check ? 'bg-purple-600' : 'bg-gray-200'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${config.require_video_check ? 'translate-x-6' : ''}`} />
                </button>
                <div>
                  <p className="font-medium text-sm">Require Video Intelligence check before publishing</p>
                  <p className="text-xs text-gray-400">Analyzes video URLs in posts before they appear in feed.</p>
                </div>
              </div>
            </div>

            {/* Keyword controls */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="font-bold mb-4">Keyword Modifiers</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-green-700 mb-2">🚀 Boost Keywords</p>
                  <p className="text-xs text-gray-400 mb-3">Posts containing these words rank higher in mission-scored + hybrid modes.</p>
                  <div className="flex gap-2 mb-2">
                    <input value={newBoost} onChange={e => setNewBoost(e.target.value)} onKeyDown={e => e.key === 'Enter' && addKeyword('boost_keywords', newBoost)}
                      placeholder="Add keyword…" className="flex-1 border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                    <button onClick={() => addKeyword('boost_keywords', newBoost)} className="bg-green-600 text-white rounded-xl px-3 py-1.5 text-sm font-bold">+</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(config.boost_keywords ?? []).map((k: string) => (
                      <span key={k} className="flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 rounded-full px-3 py-1 text-xs">
                        {k}
                        <button onClick={() => removeKeyword('boost_keywords', k)} className="text-green-400 hover:text-green-700 ml-1">×</button>
                      </span>
                    ))}
                    {(config.boost_keywords ?? []).length === 0 && <p className="text-xs text-gray-400">No boost keywords set.</p>}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-amber-700 mb-2">⬇️ Suppress Keywords</p>
                  <p className="text-xs text-gray-400 mb-3">Posts with these words rank lower (not hidden, just deprioritized).</p>
                  <div className="flex gap-2 mb-2">
                    <input value={newSuppress} onChange={e => setNewSuppress(e.target.value)} onKeyDown={e => e.key === 'Enter' && addKeyword('suppress_keywords', newSuppress)}
                      placeholder="Add keyword…" className="flex-1 border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                    <button onClick={() => addKeyword('suppress_keywords', newSuppress)} className="bg-amber-500 text-white rounded-xl px-3 py-1.5 text-sm font-bold">+</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(config.suppress_keywords ?? []).map((k: string) => (
                      <span key={k} className="flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-3 py-1 text-xs">
                        {k}
                        <button onClick={() => removeKeyword('suppress_keywords', k)} className="text-amber-400 hover:text-amber-700 ml-1">×</button>
                      </span>
                    ))}
                    {(config.suppress_keywords ?? []).length === 0 && <p className="text-xs text-gray-400">No suppress keywords set.</p>}
                  </div>
                </div>
              </div>
            </div>

            <button onClick={saveConfig} disabled={saving}
              className="w-full bg-purple-600 text-white rounded-2xl py-4 font-bold text-lg hover:bg-purple-700 disabled:opacity-50 transition-colors">
              {saving ? 'Saving…' : saved ? '✅ Saved!' : '💾 Save Algorithm Config'}
            </button>
          </>
        )}

        {/* Review queue tab */}
        {activeTab === 'queue' && (
          <div className="space-y-4">
            {queue.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-4xl mb-2">✅</p>
                <p>Review queue is empty. All content meets mission standards.</p>
              </div>
            ) : queue.map(item => (
              <div key={item.id} className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-bold text-sm">@{item.dream_line_posts?.profiles?.username ?? 'Unknown'}</p>
                    <p className="text-xs text-gray-400">{new Date(item.created_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-bold ${item.mission_score < 30 ? 'text-red-500' : item.mission_score < 50 ? 'text-amber-500' : 'text-gray-500'}`}>
                      Mission Score: {item.mission_score}%
                    </span>
                    {item.reason && <p className="text-xs text-gray-400 mt-0.5">{item.reason}</p>}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-700 mb-4 line-clamp-3">
                  {item.dream_line_posts?.content}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => reviewPost(item.id, item.post_id, 'approved')}
                    className="flex-1 bg-green-600 text-white rounded-xl py-2.5 text-sm font-bold hover:bg-green-700">
                    ✓ Approve — Show in Feed
                  </button>
                  <button onClick={() => reviewPost(item.id, item.post_id, 'rejected')}
                    className="flex-1 bg-red-50 text-red-600 rounded-xl py-2.5 text-sm font-bold hover:bg-red-100 border border-red-200">
                    ✗ Reject — Hide Post
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats tab */}
        {activeTab === 'stats' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="font-bold mb-4">Mission Alignment Overview</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-50">
                <span className="text-sm text-gray-600">Current algorithm</span>
                <span className="font-bold text-purple-600">{config?.algorithm}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-50">
                <span className="text-sm text-gray-600">Average mission score</span>
                <span className="font-bold text-village-blue">{stats.avg ?? 0}%</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-50">
                <span className="text-sm text-gray-600">Total posts</span>
                <span className="font-bold">{stats.total ?? 0}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-50">
                <span className="text-sm text-gray-600">Hidden posts</span>
                <span className="font-bold text-red-500">{stats.hidden ?? 0}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-gray-600">Posts below 50% mission score</span>
                <span className="font-bold text-amber-500">{stats.below50 ?? 0}</span>
              </div>
            </div>
            <Link href="/admin" className="mt-6 block text-center text-sm text-purple-600 hover:underline">
              ← Back to Admin Dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
