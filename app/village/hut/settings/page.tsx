'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'zh', label: '中文' },
];

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [form, setForm] = useState({
    username: '', bio: '', language: 'en',
    morning_check_in_time: '08:00',
    evening_check_in_time: '20:00',
    do_not_disturb: false,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const supabase = createClient();
  const { theme, toggle, overlayTheme, toggleOverlay } = useVillageTheme();
  const isNight = theme === 'night';

  const bg     = isNight ? '#0A0B12' : '#F8F9FF';
  const card   = isNight ? '#0D1020' : '#FFFFFF';
  const border = isNight ? '#1A1F3A' : '#E0E7FF';
  const text   = isNight ? '#F0EBE0' : '#1E1B4B';
  const muted  = isNight ? '#4A4F72' : '#6B7280';
  const inputBg = isNight ? '#12152A' : '#F0F4FF';

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data: p }, { data: s }] = await Promise.all([
        (supabase as any).from('profiles').select('*').eq('id', user.id).single(),
        (supabase as any).from('spirit_configs').select('*').eq('user_id', user.id).single(),
      ]);
      setProfile(p);
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
        (supabase as any).from('profiles')
          .update({ username: form.username, bio: form.bio, language: form.language })
          .eq('id', user.id),
        (supabase as any).from('spirit_configs').upsert({
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

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    setUploading(true);
    const fd = new FormData();
    fd.append('avatar', file);
    const res = await fetch('/api/profile/avatar', { method: 'POST', body: fd });
    if (res.ok) {
      const { url } = await res.json();
      setProfile((p: any) => p ? { ...p, avatar_url: url } : p);
    }
    setUploading(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  const inputCls: React.CSSProperties = {
    background: inputBg,
    border: `1px solid ${border}`,
    color: text,
    width: '100%',
    borderRadius: '12px',
    padding: '10px 14px',
    fontSize: '14px',
    outline: 'none',
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="rounded-2xl p-4 space-y-4" style={{ background: card, border: `1px solid ${border}` }}>
      <h2 className="font-bold text-xs uppercase tracking-widest" style={{ color: muted }}>{title}</h2>
      {children}
    </div>
  );

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label className="text-xs font-semibold mb-1.5 block" style={{ color: muted }}>{label}</label>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen pb-28" style={{ background: bg }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 py-3.5 flex items-center gap-3"
        style={{ background: isNight ? 'rgba(10,11,18,0.92)' : 'rgba(248,249,255,0.92)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${border}` }}>
        <Link href="/village/hut" className="text-xl" style={{ color: muted }}>←</Link>
        <span className="text-2xl">⚙️</span>
        <h1 className="text-lg font-black flex-1" style={{ color: text }}>Settings</h1>
        {/* Day/Night toggle */}
        <button onClick={toggle}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
          style={{ background: isNight ? 'rgba(255,107,43,0.15)' : 'rgba(24,119,242,0.1)', color: isNight ? '#FF8C4A' : '#1877F2', border: `1px solid ${isNight ? 'rgba(255,107,43,0.3)' : 'rgba(24,119,242,0.2)'}` }}>
          {isNight ? '☀️ Day' : '🌙 Night'}
        </button>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-3">
        <Section title="Profile">
          {/* Avatar upload */}
          <div className="flex items-center gap-4">
            <label className="cursor-pointer relative group flex-shrink-0">
              <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center"
                style={{ background: isNight ? '#1E2240' : '#E8EDFF' }}>
                {(avatarPreview || profile?.avatar_url) ? (
                  <img src={avatarPreview || profile.avatar_url} className="w-full h-full object-cover" alt="Avatar" />
                ) : (
                  <span className="text-3xl">👤</span>
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity">
                  <span className="text-white text-xs font-bold">{uploading ? '…' : 'Edit'}</span>
                </div>
              </div>
              <input type="file" accept="image/*" onChange={uploadAvatar} className="hidden" disabled={uploading} />
            </label>
            <div>
              <p className="font-bold text-sm" style={{ color: text }}>@{profile?.username}</p>
              <p className="text-xs mt-0.5" style={{ color: muted }}>Tap photo to change avatar</p>
            </div>
          </div>

          <Field label="Username">
            <input
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              style={inputCls}
              placeholder="@username"
            />
          </Field>
          <Field label="Bio">
            <textarea
              value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              style={{ ...inputCls, resize: 'none' }}
              rows={3}
              placeholder="Tell the village about yourself…"
            />
          </Field>
          <Field label="Language">
            <div className="grid grid-cols-3 gap-2">
              {LANGUAGES.map(lang => (
                <button key={lang.code} onClick={() => setForm(f => ({ ...f, language: lang.code }))}
                  className="py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    border: `2px solid ${form.language === lang.code ? '#1877F2' : border}`,
                    background: form.language === lang.code ? 'rgba(24,119,242,0.1)' : 'transparent',
                    color: form.language === lang.code ? '#60a5fa' : muted,
                  }}>
                  {lang.label}
                </button>
              ))}
            </div>
          </Field>
        </Section>

        <Section title="Spirit Check-Ins">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Morning">
              <input type="time" value={form.morning_check_in_time}
                onChange={e => setForm(f => ({ ...f, morning_check_in_time: e.target.value }))}
                style={inputCls} />
            </Field>
            <Field label="Evening">
              <input type="time" value={form.evening_check_in_time}
                onChange={e => setForm(f => ({ ...f, evening_check_in_time: e.target.value }))}
                style={inputCls} />
            </Field>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm" style={{ color: text }}>Do Not Disturb</p>
              <p className="text-xs mt-0.5" style={{ color: muted }}>Pause all Spirit notifications</p>
            </div>
            <button onClick={() => setForm(f => ({ ...f, do_not_disturb: !f.do_not_disturb }))}
              className="relative w-12 h-6 rounded-full transition-colors flex-shrink-0"
              style={{ background: form.do_not_disturb ? '#1877F2' : border }}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.do_not_disturb ? 'translate-x-6' : ''}`} />
            </button>
          </div>
        </Section>

        <Section title="Your Village">
          <div className="space-y-0.5">
            {[
              { href: '/village/hut/data-locker',  icon: '🔐', label: 'Data Locker',       desc: 'Control your data & earnings' },
              { href: '/village/personality-maze', icon: '🏰', label: 'Personality Maze',   desc: 'Discover your archetype' },
              { href: '/village/discover',          icon: '🔍', label: 'Discover Villagers', desc: 'Find your matches' },
              { href: '/messages',                  icon: '💬', label: 'Messages',           desc: 'Direct messages' },
              { href: '/notifications',             icon: '🔔', label: 'Notifications',      desc: 'Your activity feed' },
              { href: '/leaderboard',               icon: '🏆', label: 'Leaderboard',        desc: 'Top villagers this season' },
            ].map(item => (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-3 p-3 rounded-xl transition-colors"
                style={{ color: text }}
                onMouseEnter={e => (e.currentTarget.style.background = isNight ? 'rgba(255,255,255,0.04)' : 'rgba(24,119,242,0.04)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span className="text-xl">{item.icon}</span>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{item.label}</p>
                  <p className="text-xs" style={{ color: muted }}>{item.desc}</p>
                </div>
                <span style={{ color: muted }}>›</span>
              </Link>
            ))}
          </div>
        </Section>

        <Section title="Display">
          {/* Map building overlay color */}
          <div className="flex items-center justify-between p-3 rounded-xl"
            style={{ background: isNight ? 'rgba(255,255,255,0.03)' : 'rgba(24,119,242,0.03)', border: `1px solid ${border}` }}>
            <div>
              <p className="font-semibold text-sm" style={{ color: text }}>Building Overlay</p>
              <p className="text-xs" style={{ color: muted }}>Background when entering a building in the village</p>
            </div>
            <button onClick={toggleOverlay}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all"
              style={{
                background: overlayTheme === 'white' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)',
                color:      overlayTheme === 'white' ? '#1E1B4B' : '#F0EBE0',
                border:     `1px solid ${border}`,
              }}>
              {overlayTheme === 'white' ? '⬜ White' : '⬛ Black'}
            </button>
          </div>
        </Section>

        <Section title="About">
          <div className="text-center space-y-1.5">
            <p className="font-black text-xl" style={{ color: '#1877F2' }}>villa9e</p>
            <p className="text-xs" style={{ color: muted }}>Version 1.0.0 · Phase 1 MVP</p>
            <p className="text-xs" style={{ color: muted }}>© 2026 Legaci Jackson. A Legaci Jackson product.</p>
          </div>
        </Section>

        <button onClick={save} disabled={saving}
          className="w-full py-4 rounded-2xl font-black text-base text-white transition-all disabled:opacity-50"
          style={{ background: saved ? '#22C55E' : '#1877F2' }}>
          {saving ? 'Saving…' : saved ? '✅ Saved!' : 'Save Settings'}
        </button>

        <button onClick={signOut}
          className="w-full py-3 rounded-xl text-sm font-medium transition-colors"
          style={{ border: `1px solid rgba(239,68,68,0.3)`, color: '#ef4444', background: 'rgba(239,68,68,0.05)' }}>
          Sign out
        </button>
      </div>
    </div>
  );
}
