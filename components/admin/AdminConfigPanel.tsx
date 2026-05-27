'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

interface Props {
  open:    boolean;
  onClose: () => void;
  config:  Record<string, any>;
  onSave:  (key: string, value: any) => Promise<void>;
  token:   string | null;
}

const TABS = [
  { id: 'brand',        icon: '🎨', label: 'Brand'     },
  { id: 'content',      icon: '📝', label: 'Content'   },
  { id: 'village',      icon: '🏡', label: 'Village'   },
  { id: 'spirit',       icon: '🌿', label: 'Spirit'    },
  { id: 'announce',     icon: '📢', label: 'Banners'   },
  { id: 'users',        icon: '👥', label: 'Users'     },
  { id: 'pages',        icon: '🗂️', label: 'Pages'     },
];

// Reusable field components
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, multiline = false }: { value: string; onChange: (v: string) => void; multiline?: boolean }) {
  const base = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    color: '#F0EBE0',
    fontSize: '13px',
    padding: '10px 12px',
    width: '100%',
    outline: 'none',
    fontFamily: 'inherit',
    resize: 'vertical' as const,
  };
  if (multiline) return <textarea value={value} onChange={e => onChange(e.target.value)} rows={3} style={base} />;
  return <input type="text" value={value} onChange={e => onChange(e.target.value)} style={base} />;
}

function NumberInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      value={value}
      onChange={e => onChange(parseFloat(e.target.value))}
      style={{
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '10px',
        color: '#F0EBE0',
        fontSize: '13px',
        padding: '10px 12px',
        width: '100%',
        outline: 'none',
      }}
    />
  );
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ width: '44px', height: '44px', borderRadius: '10px', border: 'none', cursor: 'pointer', padding: '2px' }}
      />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '10px',
          color: '#F0EBE0',
          fontSize: '13px',
          padding: '10px 12px',
          width: '100%',
          outline: 'none',
          fontFamily: 'monospace',
        }}
      />
      <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: value, flexShrink: 0, border: '1px solid rgba(255,255,255,0.2)' }} />
    </div>
  );
}

function SaveBtn({ onClick, saving, saved }: { onClick: () => void; saving: boolean; saved: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      style={{
        background:    saved ? 'rgba(34,197,94,0.2)' : '#1877F2',
        color:         saved ? '#4ADE80' : '#fff',
        border:        'none',
        borderRadius:  '10px',
        padding:       '10px 20px',
        fontSize:      '13px',
        fontWeight:    700,
        cursor:        saving ? 'not-allowed' : 'pointer',
        opacity:       saving ? 0.6 : 1,
        transition:    'all 0.2s',
      }}
    >
      {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save'}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 style={{ color: 'rgba(255,255,255,0.25)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 0 }}>
        {title}
      </h3>
      <div className="space-y-4 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        {children}
      </div>
    </div>
  );
}

// ── Tab panels ─────────────────────────────────────────────────────────────

function BrandTab({ config, onSave }: { config: Record<string, any>; onSave: (k: string, v: any) => Promise<void> }) {
  const [primary, setPrimary]   = useState(config['brand.primary_color']   ?? '#1877F2');
  const [tagline, setTagline]   = useState(config['brand.tagline']         ?? 'It takes a village.');
  const [accent, setAccent]     = useState(config['brand.accent_color']    ?? '#E8770A');
  const [fire, setFire]         = useState(config['brand.night_fire_color']?? '#FF6B2B');
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);

  async function save() {
    setSaving(true);
    await Promise.all([
      onSave('brand.primary_color', primary),
      onSave('brand.tagline', tagline),
      onSave('brand.accent_color', accent),
      onSave('brand.night_fire_color', fire),
    ]);
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2500);
  }

  useEffect(() => {
    // Live preview: apply primary color to CSS variable
    document.documentElement.style.setProperty('--admin-primary', primary);
  }, [primary]);

  return (
    <div className="space-y-6">
      <Section title="Colors">
        <Field label="Primary Blue"><ColorInput value={primary} onChange={setPrimary} /></Field>
        <Field label="Day Accent (Orange)"><ColorInput value={accent} onChange={setAccent} /></Field>
        <Field label="Night Fire Glow"><ColorInput value={fire} onChange={setFire} /></Field>
      </Section>
      <Section title="Copy">
        <Field label="Tagline"><TextInput value={tagline} onChange={setTagline} /></Field>
      </Section>
      <div className="flex justify-end">
        <SaveBtn onClick={save} saving={saving} saved={saved} />
      </div>
    </div>
  );
}

function ContentTab({ config, onSave }: { config: Record<string, any>; onSave: (k: string, v: any) => Promise<void> }) {
  const [heroTitle, setHeroTitle]     = useState(config['home.hero.title']        ?? '');
  const [heroSub, setHeroSub]         = useState(config['home.hero.subtitle']     ?? '');
  const [ctaPrimary, setCtaPrimary]   = useState(config['home.hero.cta_primary']  ?? '');
  const [ctaSec, setCtaSec]           = useState(config['home.hero.cta_secondary']?? '');
  const [foundMax, setFoundMax]       = useState(config['home.founding.max']      ?? 1000);
  const [foundBonus, setFoundBonus]   = useState(config['home.founding.bonus']    ?? 500);
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);

  async function save() {
    setSaving(true);
    await Promise.all([
      onSave('home.hero.title', heroTitle),
      onSave('home.hero.subtitle', heroSub),
      onSave('home.hero.cta_primary', ctaPrimary),
      onSave('home.hero.cta_secondary', ctaSec),
      onSave('home.founding.max', foundMax),
      onSave('home.founding.bonus', foundBonus),
    ]);
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="space-y-6">
      <Section title="Homepage Hero">
        <Field label="Hero Title"><TextInput value={heroTitle} onChange={setHeroTitle} /></Field>
        <Field label="Hero Subtitle"><TextInput value={heroSub} onChange={setHeroSub} multiline /></Field>
        <Field label="Primary CTA"><TextInput value={ctaPrimary} onChange={setCtaPrimary} /></Field>
        <Field label="Secondary CTA"><TextInput value={ctaSec} onChange={setCtaSec} /></Field>
      </Section>
      <Section title="Founding Villager Program">
        <Field label="Max Founding Villagers"><NumberInput value={foundMax} onChange={setFoundMax} /></Field>
        <Field label="Launch Bonus ($VLG)"><NumberInput value={foundBonus} onChange={setFoundBonus} /></Field>
      </Section>
      <div className="flex justify-end">
        <SaveBtn onClick={save} saving={saving} saved={saved} />
      </div>
    </div>
  );
}

function VillageTab({ config, onSave }: { config: Record<string, any>; onSave: (k: string, v: any) => Promise<void> }) {
  const [goalStep, setGoalStep]       = useState(config['village.vlg_per_goal_step']    ?? 25);
  const [oowop, setOowop]             = useState(config['village.vlg_per_oowop']        ?? 10);
  const [checkin, setCheckin]         = useState(config['village.vlg_per_checkin']      ?? 10);
  const [referral, setReferral]       = useState(config['village.vlg_per_referral']     ?? 100);
  const [onboarding, setOnboarding]   = useState(config['village.vlg_onboarding']       ?? 50);
  const [oowopMult, setOowopMult]     = useState(config['village.score_oowop_weight']   ?? 1.5);
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);

  async function save() {
    setSaving(true);
    await Promise.all([
      onSave('village.vlg_per_goal_step', goalStep),
      onSave('village.vlg_per_oowop', oowop),
      onSave('village.vlg_per_checkin', checkin),
      onSave('village.vlg_per_referral', referral),
      onSave('village.vlg_onboarding', onboarding),
      onSave('village.score_oowop_weight', oowopMult),
    ]);
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="space-y-6">
      <Section title="$VLG Token Rewards">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Per Goal Step"><NumberInput value={goalStep} onChange={setGoalStep} /></Field>
          <Field label="Per OoWop Given"><NumberInput value={oowop} onChange={setOowop} /></Field>
          <Field label="Per Check-In"><NumberInput value={checkin} onChange={setCheckin} /></Field>
          <Field label="Per Referral"><NumberInput value={referral} onChange={setReferral} /></Field>
          <Field label="Onboarding Bonus"><NumberInput value={onboarding} onChange={setOnboarding} /></Field>
        </div>
      </Section>
      <Section title="Score Mechanics">
        <Field label="OoWop Score Multiplier"><NumberInput value={oowopMult} onChange={setOowopMult} /></Field>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>
          Multiplier applied to score events triggered by OoWops. 1.0 = no bonus.
        </p>
      </Section>
      <div className="flex justify-end">
        <SaveBtn onClick={save} saving={saving} saved={saved} />
      </div>
    </div>
  );
}

function SpiritTab({ config, onSave }: { config: Record<string, any>; onSave: (k: string, v: any) => Promise<void> }) {
  const [maxTokens, setMaxTokens]       = useState(config['spirit.max_tokens']                   ?? 600);
  const [morningQ, setMorningQ]         = useState(config['spirit.checkin_question_morning']      ?? '');
  const [eveningQ, setEveningQ]         = useState(config['spirit.checkin_question_evening']      ?? '');
  const [saving, setSaving]             = useState(false);
  const [saved, setSaved]               = useState(false);

  async function save() {
    setSaving(true);
    await Promise.all([
      onSave('spirit.max_tokens', maxTokens),
      onSave('spirit.checkin_question_morning', morningQ),
      onSave('spirit.checkin_question_evening', eveningQ),
    ]);
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="space-y-6">
      <Section title="AI Settings">
        <Field label="Max Response Tokens (higher = longer responses)">
          <NumberInput value={maxTokens} onChange={setMaxTokens} />
        </Field>
      </Section>
      <Section title="Daily Check-In Questions">
        <Field label="Morning Question"><TextInput value={morningQ} onChange={setMorningQ} multiline /></Field>
        <Field label="Evening Question"><TextInput value={eveningQ} onChange={setEveningQ} multiline /></Field>
      </Section>
      <div className="flex justify-end">
        <SaveBtn onClick={save} saving={saving} saved={saved} />
      </div>
    </div>
  );
}

function AnnounceTab({ config, onSave }: { config: Record<string, any>; onSave: (k: string, v: any) => Promise<void> }) {
  const [text, setText]   = useState(config['announcements.banner_text']  ?? '');
  const [color, setColor] = useState(config['announcements.banner_color'] ?? '#1877F2');
  const [link, setLink]   = useState(config['announcements.banner_link']  ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  async function save() {
    setSaving(true);
    await Promise.all([
      onSave('announcements.banner_text', text || null),
      onSave('announcements.banner_color', color),
      onSave('announcements.banner_link', link || null),
    ]);
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="space-y-6">
      <Section title="Site-wide Banner">
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px' }}>
          Appears at the top of every page. Leave blank to hide.
        </p>
        <Field label="Banner Text"><TextInput value={text} onChange={setText} multiline /></Field>
        <Field label="Banner Color"><ColorInput value={color} onChange={setColor} /></Field>
        <Field label="Banner Link (optional)"><TextInput value={link} onChange={setLink} /></Field>

        {/* Live preview */}
        {text && (
          <div className="rounded-xl px-4 py-3 text-sm font-medium text-white text-center" style={{ background: color }}>
            {text}
          </div>
        )}
      </Section>
      <div className="flex justify-end">
        <SaveBtn onClick={save} saving={saving} saved={saved} />
      </div>
    </div>
  );
}

function UsersTab({ token }: { token: string | null }) {
  const [search, setSearch]   = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function doSearch() {
    if (!search.trim()) return;
    setLoading(true);
    const { data } = await (supabase as any)
      .from('profiles')
      .select('id, username, display_name, email, village_score, score_tier, is_super_admin, created_at')
      .or(`username.ilike.%${search}%,display_name.ilike.%${search}%`)
      .limit(10);
    setResults(data ?? []);
    setLoading(false);
  }

  async function adjustScore(userId: string, delta: number) {
    await (supabase as any).rpc('award_village_score', { p_user_id: userId, p_points: delta, p_reason: 'Admin adjustment' });
    doSearch();
  }

  async function toggleAdmin(userId: string, current: boolean) {
    await (supabase as any).from('profiles').update({ is_super_admin: !current }).eq('id', userId);
    doSearch();
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && doSearch()}
          placeholder="Search username or name…"
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px',
            color: '#F0EBE0',
            fontSize: '13px',
            padding: '10px 12px',
            outline: 'none',
          }}
        />
        <button onClick={doSearch} style={{ background: '#1877F2', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
          {loading ? '…' : 'Search'}
        </button>
      </div>

      <div className="space-y-2">
        {results.map(u => (
          <div key={u.id} className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-white">@{u.username}</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>
                  {u.display_name} · {u.score_tier} · {u.village_score?.toLocaleString()} VLG
                  {u.is_super_admin && <span style={{ color: '#F59E0B', marginLeft: 6 }}>★ Admin</span>}
                </p>
              </div>
              <button
                onClick={() => toggleAdmin(u.id, u.is_super_admin)}
                style={{ fontSize: '11px', color: u.is_super_admin ? '#EF4444' : '#60A5FA', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 700 }}
              >
                {u.is_super_admin ? 'Remove Admin' : 'Make Admin'}
              </button>
            </div>
            <div className="flex gap-2">
              {[-100, -25, +25, +100, +500].map(delta => (
                <button
                  key={delta}
                  onClick={() => adjustScore(u.id, delta)}
                  style={{
                    fontSize: '11px', fontWeight: 700, border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer',
                    background: delta > 0 ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                    color:      delta > 0 ? '#4ADE80' : '#F87171',
                  }}
                >
                  {delta > 0 ? `+${delta}` : delta} VLG
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PagesTab() {
  const PAGES = [
    { path: '/village/map',        label: 'Village Map',      icon: '🗺️' },
    { path: '/village/workshop',   label: 'Workshop',         icon: '🔨' },
    { path: '/village/dreamline',  label: 'Dream Line',       icon: '✨' },
    { path: '/village/bank',       label: 'Bank',             icon: '🏦' },
    { path: '/village/trading-post',label:'Trading Post',     icon: '🤝' },
    { path: '/village/tribes',     label: 'Tribes',           icon: '👥' },
    { path: '/village/zen',        label: 'Zen',              icon: '🌿' },
    { path: '/village/hospital',   label: 'Hospital',         icon: '🏥' },
    { path: '/village/spirit',     label: 'Spirit',           icon: '🌀' },
    { path: '/village/hut',        label: 'My Hut',           icon: '🏠' },
    { path: '/admin',              label: 'Admin Dashboard',  icon: '⚙️' },
  ];

  return (
    <div className="space-y-2">
      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', marginBottom: 8 }}>
        Click any page to open it for editing. Use Edit Mode in the admin bar to click-edit inline.
      </p>
      {PAGES.map(p => (
        <a
          key={p.path}
          href={p.path}
          className="flex items-center gap-3 rounded-xl px-4 py-3 transition-all"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', textDecoration: 'none' }}
        >
          <span className="text-lg">{p.icon}</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">{p.label}</p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>{p.path}</p>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>→</span>
        </a>
      ))}
    </div>
  );
}

// ── Main panel ─────────────────────────────────────────────────────────────
export function AdminConfigPanel({ open, onClose, config, onSave, token }: Props) {
  const [activeTab, setActiveTab] = useState('brand');

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[10000]"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 bottom-0 z-[10001] flex flex-col"
            style={{ width: '420px', maxWidth: '95vw', background: '#0D0F1E', borderLeft: '1px solid rgba(255,255,255,0.08)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <div>
                <h2 className="text-base font-black text-white">Admin Config</h2>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>villa9e visual editor</p>
              </div>
              <button onClick={onClose} style={{ color: 'rgba(255,255,255,0.4)', background: 'transparent', border: 'none', fontSize: '22px', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-3 py-2 overflow-x-auto border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold flex-shrink-0 transition-all"
                  style={{
                    background: activeTab === t.id ? 'rgba(24,119,242,0.2)' : 'transparent',
                    color:      activeTab === t.id ? '#60A5FA' : 'rgba(255,255,255,0.4)',
                    border:     activeTab === t.id ? '1px solid rgba(24,119,242,0.3)' : '1px solid transparent',
                  }}
                >
                  <span>{t.icon}</span> {t.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
              {activeTab === 'brand'    && <BrandTab    config={config} onSave={onSave} />}
              {activeTab === 'content'  && <ContentTab  config={config} onSave={onSave} />}
              {activeTab === 'village'  && <VillageTab  config={config} onSave={onSave} />}
              {activeTab === 'spirit'   && <SpiritTab   config={config} onSave={onSave} />}
              {activeTab === 'announce' && <AnnounceTab config={config} onSave={onSave} />}
              {activeTab === 'users'    && <UsersTab    token={token} />}
              {activeTab === 'pages'    && <PagesTab />}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
