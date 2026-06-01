'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { BackButton } from '@/components/village/BackButton';
import { useSpiritVoice } from '@/components/village/SpiritVoiceProvider';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'zh', label: '中文' },
];

function GearIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

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
  const { theme, toggle, virtualVillage, toggleVirtualVillage } = useVillageTheme();
  const { voiceGender, setGender, voiceEnabled, toggleVoice } = useSpiritVoice();
  const isNight = theme === 'night';

  const bg      = isNight ? '#111827' : '#F8F9FF';
  const card    = isNight ? '#1F2937' : '#FFFFFF';
  const border  = isNight ? '#374151' : '#E0E7FF';
  const text    = isNight ? '#F0EBE0' : '#1E1B4B';
  const muted   = isNight ? '#9CA3AF' : '#6B7280';
  const inputBg = isNight ? '#111827' : '#F0F4FF';

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

  const villageLinks = [
    {
      href: '/village/hut/data-locker',
      icon: (
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>
      ),
      label: 'Data Locker', desc: 'Control your data & earnings',
    },
    {
      href: '/village/personality-maze',
      icon: (
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
      ),
      label: 'Personality Maze', desc: 'Discover your archetype',
    },
    {
      href: '/village/discover',
      icon: (
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      ),
      label: 'Discover Villagers', desc: 'Find your matches',
    },
    {
      href: '/leaderboard',
      icon: (
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
      ),
      label: 'Leaderboard', desc: 'Top villagers this season',
    },
  ];

  return (
    <div className="min-h-screen pb-28" style={{ background: bg }}>
      <BackButton to="/village/hut" />
      {/* Header */}
      <div className="sticky top-0 z-20 pl-14 pr-4 py-3.5 flex items-center gap-3"
        style={{ background: isNight ? 'rgba(17,24,39,0.92)' : 'rgba(248,249,255,0.92)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${border}` }}>
        <span style={{ color: text }}><GearIcon /></span>
        <h1 className="text-lg font-black flex-1" style={{ color: text }}>Settings</h1>
        <button onClick={toggle}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
          style={{ background: isNight ? 'rgba(255,107,43,0.15)' : 'rgba(24,119,242,0.1)', color: isNight ? '#FF8C4A' : '#1877F2', border: `1px solid ${isNight ? 'rgba(255,107,43,0.3)' : 'rgba(24,119,242,0.2)'}` }}>
          {isNight ? (
            <svg width={12} height={12} viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          ) : (
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
          )}
          {isNight ? ' Day' : ' Night'}
        </button>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-3">
        <Section title="Profile">
          <div className="flex items-center gap-4">
            <label className="cursor-pointer relative group flex-shrink-0">
              <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center"
                style={{ background: isNight ? '#374151' : '#E8EDFF' }}>
                <img src={avatarPreview || profile?.avatar_url || '/default-avatar.png'} className="w-full h-full object-cover" alt="Avatar" />
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

          {/* Spirit Voice */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm" style={{ color: text }}>Spirit Voice</p>
              <p className="text-xs mt-0.5" style={{ color: muted }}>Choose how Spirit sounds to you</p>
            </div>
            <div className="flex rounded-xl overflow-hidden" style={{ border: `1px solid ${border}` }}>
              {(['female', 'male'] as const).map(g => (
                <button key={g} onClick={() => setGender(g)}
                  className="px-4 py-1.5 text-xs font-bold capitalize transition-colors"
                  style={{
                    background: voiceGender === g ? '#1A2DBF' : 'transparent',
                    color: voiceGender === g ? 'white' : muted,
                  }}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Voice On/Off */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm" style={{ color: text }}>Voice Enabled</p>
              <p className="text-xs mt-0.5" style={{ color: muted }}>Spirit speaks aloud during check-ins</p>
            </div>
            <button onClick={toggleVoice}
              className="relative w-12 h-6 rounded-full transition-colors flex-shrink-0"
              style={{ background: voiceEnabled ? '#1A2DBF' : border }}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${voiceEnabled ? 'translate-x-6' : ''}`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm" style={{ color: text }}>Do Not Disturb</p>
              <p className="text-xs mt-0.5" style={{ color: muted }}>Pause all Spirit notifications</p>
            </div>
            <button onClick={() => setForm(f => ({ ...f, do_not_disturb: !f.do_not_disturb }))}
              className="relative w-12 h-6 rounded-full transition-colors flex-shrink-0"
              style={{ background: form.do_not_disturb ? '#1A2DBF' : border }}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.do_not_disturb ? 'translate-x-6' : ''}`} />
            </button>
          </div>
        </Section>

        <Section title="Your Village">
          <div className="space-y-0.5">
            {villageLinks.map(item => (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-3 p-3 rounded-xl transition-colors"
                style={{ color: text }}
                onMouseEnter={e => (e.currentTarget.style.background = isNight ? 'rgba(255,255,255,0.04)' : 'rgba(24,119,242,0.04)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ color: isNight ? 'white' : '#1A2DBF' }}>{item.icon}</span>
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
          <div className="flex items-center justify-between p-3 rounded-xl"
            style={{ background: isNight ? 'rgba(255,255,255,0.03)' : 'rgba(24,119,242,0.03)', border: `1px solid ${border}` }}>
            <div>
              <p className="font-semibold text-sm" style={{ color: text }}>Virtual Village</p>
              <p className="text-xs" style={{ color: muted }}>Show the 3D world on the map instead of the default view</p>
            </div>
            <button onClick={toggleVirtualVillage}
              className="relative w-12 h-6 rounded-full transition-colors flex-shrink-0"
              style={{ background: virtualVillage ? '#1877F2' : border }}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${virtualVillage ? 'translate-x-6' : ''}`} />
            </button>
          </div>
        </Section>

        <button onClick={save} disabled={saving}
          className="w-full py-4 rounded-2xl font-black text-base text-white transition-all disabled:opacity-50"
          style={{ background: saved ? '#22C55E' : '#1877F2' }}>
          {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Settings'}
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
