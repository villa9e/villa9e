'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

const ADMIN_EMAILS = ['elitehousemusic@gmail.com', 'admin@villa9e.app'];

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({});
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentGoals, setRecentGoals] = useState<any[]>([]);
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      // Check hardcoded admin emails OR is_super_admin flag in DB
      const isEmailAdmin = ADMIN_EMAILS.includes(user.email ?? '');
      if (isEmailAdmin) {
        setAuthed(true);
        loadData();
        setLoading(false);
        return;
      }
      const { data: profile } = await (supabase as any).from('profiles').select('is_super_admin').eq('id', user.id).single();
      if (profile?.is_super_admin) {
        setAuthed(true);
        loadData();
      }
      setLoading(false);
    }
    checkAuth();
  }, []);

  async function loadData() {
    const [
      { count: userCount },
      { count: goalCount },
      { count: stepCount },
      { count: oowopCount },
      { count: postCount },
      { data: users },
      { data: goals },
      { data: top },
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('goals').select('id', { count: 'exact', head: true }),
      supabase.from('goal_steps').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase.from('oowops').select('id', { count: 'exact', head: true }),
      supabase.from('dream_line_posts').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('username, email, village_score, score_tier, created_at, is_founding_villager, founding_villager_number').order('created_at', { ascending: false }).limit(10),
      supabase.from('goals').select('title, probability_score, status, created_at, profiles(username)').order('created_at', { ascending: false }).limit(10),
      supabase.from('profiles').select('username, village_score, score_tier, is_founding_villager').order('village_score', { ascending: false }).limit(10),
    ]);

    setStats({ users: userCount, goals: goalCount, steps: stepCount, oowops: oowopCount, posts: postCount });
    setRecentUsers(users ?? []);
    setRecentGoals(goals ?? []);
    setTopUsers(top ?? []);
  }

  const statCards = [
    { label: 'Villagers', value: stats.users ?? 0, icon: '👥', color: 'from-blue-500 to-indigo-500' },
    { label: 'Goals Created', value: stats.goals ?? 0, icon: '📍', color: 'from-orange-400 to-amber-400' },
    { label: 'Steps Completed', value: stats.steps ?? 0, icon: '✓', color: 'from-green-500 to-emerald-500' },
    { label: 'OoWops Given', value: stats.oowops ?? 0, icon: '✊', color: 'from-blue-600 to-blue-800' },
    { label: 'Dream Line Posts', value: stats.posts ?? 0, icon: '✨', color: 'from-purple-500 to-pink-500' },
  ];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-4xl animate-pulse">⚙️</div>
    </div>
  );

  if (!authed) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-4xl mb-4">🔒</p>
        <p className="text-gray-500">Admin access only.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gray-900 text-white px-6 py-4 flex items-center gap-3">
        <span className="text-2xl">⚙️</span>
        <div>
          <h1 className="text-xl font-bold">villa9e Admin</h1>
          <p className="text-gray-400 text-xs">Legaci Jackson — Founder Dashboard</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {statCards.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className={`rounded-2xl bg-gradient-to-br ${s.color} text-white p-4`}>
              <p className="text-2xl mb-1">{s.icon}</p>
              <p className="text-3xl font-bold">{s.value.toLocaleString()}</p>
              <p className="text-white/70 text-xs">{s.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top users */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="font-bold mb-3">🏆 Top Villagers</h2>
            <div className="space-y-2">
              {topUsers.map((u, i) => (
                <div key={u.username} className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-sm font-bold text-gray-400 w-5">{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">@{u.username}</p>
                    {u.is_founding_villager && <span className="text-xs text-amber-600">👑 Founding</span>}
                  </div>
                  <span className="text-sm font-bold text-village-blue">{u.village_score}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent users */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="font-bold mb-3">👤 New Villagers</h2>
            <div className="space-y-2">
              {recentUsers.map(u => (
                <div key={u.username} className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium">@{u.username}</p>
                    <p className="text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className="text-xs text-gray-500">{u.score_tier}</span>
                </div>
              ))}
              {recentUsers.length === 0 && <p className="text-sm text-gray-400">No users yet.</p>}
            </div>
          </div>

          {/* Recent goals */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="font-bold mb-3">📍 Recent Goals</h2>
            <div className="space-y-2">
              {recentGoals.map((g, i) => (
                <div key={i} className="py-1.5 border-b border-gray-50 last:border-0">
                  <p className="text-sm font-medium line-clamp-1">{g.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-gray-400">@{(g as any).profiles?.username}</p>
                    <span className="text-xs text-orange-500">{g.probability_score}%</span>
                  </div>
                </div>
              ))}
              {recentGoals.length === 0 && <p className="text-sm text-gray-400">No goals yet.</p>}
            </div>
          </div>
        </div>

        {/* Admin tools */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-bold mb-3">Admin Tools</h2>
          <div className="flex flex-wrap gap-3">
            {[
              { label: '✨ Dream Line Controls', url: '/admin/dreamline', internal: true },
              { label: '🌍 World Sandbox', url: '/admin/sandbox', internal: true },
            ].map(tool => (
              <a key={tool.label} href={tool.url}
                className="text-sm bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-4 py-2 rounded-xl transition-colors font-medium">
                {tool.label}
              </a>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-bold mb-3">External Links</h2>
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'Supabase Dashboard', url: 'https://app.supabase.com/project/zjhsggnmwvwlhiocmfrn' },
              { label: 'GitHub Repo', url: 'https://github.com/villa9e/villa9e' },
              { label: 'PostHog Analytics', url: 'https://us.posthog.com/project/440359' },
              { label: 'Stripe Dashboard', url: 'https://dashboard.stripe.com' },
              { label: 'Vercel Deploy', url: 'https://vercel.com' },
              { label: 'OneSignal', url: 'https://dashboard.onesignal.com' },
            ].map(link => (
              <a key={link.label} href={link.url} target="_blank" rel="noreferrer"
                className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl transition-colors">
                {link.label} ↗
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
