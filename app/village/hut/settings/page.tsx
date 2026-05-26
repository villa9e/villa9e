'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const LANGUAGES = [{ code: 'en', label: 'English' }, { code: 'es', label: 'Español' }, { code: 'zh', label: '中文 (Mandarin)' }];

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [spirit, setSpirit]   = useState<any>(null);
  const [form, setForm] = useState({ username: '', bio: '', language: 'en', morning_check_in_time: '08:00', evening_check_in_time: '20:00', do_not_disturb: false });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data: p }, { data: s }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('spirit_configs').select('*').eq('user_id', user.id).single(),
      ]);
      setProfile(p); setSpirit(s);
      setForm(f => ({
        ...f,
        username: p?.username ?? '',
        bio:      p?.bio ?? '',
        language: p?.language ?? 'en',
        morning_check_in_time: s?.morning_check_in_time ?? '08:00',
        evening_check_in_time: s?.evening_check_in_time ?? '20:00',
        do_not_disturb: s?.do_not_disturb ?? false,
      }));
    }
    load();
  }, []);

  async function save() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await Promise.all([
        supabase.from('profiles').update({ username: form.username, bio: form.bio, language: form.language }).eq('id', user.id),
        supabase.from('spirit_configs').upsert({
          user_id: user.id,
          morning_check_in_time: form.morning_check_in_time,
          evening_check_in_time: form.evening_check_in_time,
          do_not_disturb: form.do_not_disturb,
        }, { onConflict: 'user_id' }),
      ]);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
    setSaving(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  const Section = ({ title, children }: any) => (
    <div className="village-card space-y-4">
      <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wide">{title}</h2>
      {children}
    </div>
  );

  const Field = ({ label, children }: any) => (
    <div>
      <label className="text-xs font-medium text-gray-500 mb-1 block">{label}</label>
      {children}
    </div>
  );

  const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-village-blue";

  return (
    <div className="min-h-screen bg-village-bg">
      <div className="bg-gray-800 text-white px-6 py-4 flex items-center gap-3">
        <Link href="/village/hut" className="text-xl">←</Link>
        <span className="text-2xl">⚙️</span>
        <h1 className="text-xl font-bold">Settings</h1>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <Section title="Profile">
          <Field label="Username">
            <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} className={inputCls} placeholder="@username" />
          </Field>
          <Field label="Bio">
            <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} className={`${inputCls} resize-none`} rows={3} placeholder="Tell the village about yourself…" />
          </Field>
          <Field label="Language">
            <div className="grid grid-cols-3 gap-2">
              {LANGUAGES.map(lang => (
                <button key={lang.code} onClick={() => setForm(f => ({ ...f, language: lang.code }))}
                  className={`py-2 rounded-xl text-sm font-medium border-2 transition-all ${form.language === lang.code ? 'border-village-blue bg-blue-50 text-village-blue' : 'border-gray-100 text-gray-600'}`}>
                  {lang.label}
                </button>
              ))}
            </div>
          </Field>
        </Section>

        <Section title="Spirit Check-Ins">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Morning check-in">
              <input type="time" value={form.morning_check_in_time} onChange={e => setForm(f => ({ ...f, morning_check_in_time: e.target.value }))} className={inputCls} />
            </Field>
            <Field label="Evening check-in">
              <input type="time" value={form.evening_check_in_time} onChange={e => setForm(f => ({ ...f, evening_check_in_time: e.target.value }))} className={inputCls} />
            </Field>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-sm">Do Not Disturb</p>
              <p className="text-xs text-gray-400">Pause all Spirit notifications</p>
            </div>
            <button onClick={() => setForm(f => ({ ...f, do_not_disturb: !f.do_not_disturb }))}
              className={`relative w-12 h-6 rounded-full transition-colors ${form.do_not_disturb ? 'bg-village-blue' : 'bg-gray-200'}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.do_not_disturb ? 'translate-x-6' : ''}`} />
            </button>
          </div>
        </Section>

        <Section title="Your Village">
          <div className="space-y-1">
            {[
              { href: '/village/hut/data-locker',      icon: '🔐', label: 'Data Locker',         desc: 'Control your data & earnings' },
              { href: '/village/personality-maze',      icon: '🏰', label: 'Personality Maze',     desc: 'Discover your archetype' },
              { href: '/village/discover',              icon: '🔍', label: 'Discover Villagers',   desc: 'Find your matches' },
              { href: '/messages',                      icon: '💬', label: 'Messages',             desc: 'Direct messages' },
              { href: '/notifications',                 icon: '🔔', label: 'Notifications',        desc: 'Your activity feed' },
            ].map(item => (
              <Link key={item.href} href={item.href} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <span className="text-xl">{item.icon}</span>
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
                <span className="text-gray-300">›</span>
              </Link>
            ))}
          </div>
        </Section>

        <Section title="About">
          <div className="text-center space-y-1">
            <p className="text-village-blue font-bold text-lg">villa9e</p>
            <p className="text-xs text-gray-400">Version 1.0.0 — Phase 1 MVP</p>
            <p className="text-xs text-gray-400">© 2026 Legaci Jackson. villa9e is a Legaci Jackson product.</p>
          </div>
        </Section>

        <button onClick={save} disabled={saving}
          className="village-btn-primary w-full py-4 text-base disabled:opacity-50">
          {saving ? 'Saving…' : saved ? '✅ Saved!' : 'Save Settings'}
        </button>

        <button onClick={signOut} className="w-full border border-red-100 text-red-400 rounded-xl py-3 hover:bg-red-50 transition-colors text-sm">
          Sign out
        </button>
      </div>
    </div>
  );
}
