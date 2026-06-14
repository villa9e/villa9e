'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

// ── Types ─────────────────────────────────────────────────────────────────────
type EnergyType = 'high' | 'focused' | 'creative' | 'energize' | 'calm';

const ENERGY_COLORS: Record<EnergyType, string> = {
  high: '#7C3AED',
  focused: '#2952E8',
  creative: '#D97706',
  energize: '#059669',
  calm: '#475569',
};

const ENERGY_LABELS: Record<EnergyType, string> = {
  high: 'High Performance',
  focused: 'Focused',
  creative: 'Creative',
  energize: 'Energize',
  calm: 'Calm',
};

interface TriggerProfile {
  energy: EnergyType;
  label: string;
  affirmation: string;
  music: string;
  movement: string;
  breathwork: string;
  environment: string;
  duration: number;
}

const DEFAULT_PROFILES: TriggerProfile[] = [
  {
    energy: 'high',
    label: 'High Performance',
    affirmation: 'I am prepared, confident, and ready to deliver at my best. This moment is mine.',
    music: 'Power Mode',
    movement: 'Power pose 60 sec · shoulder rolls · shake out',
    breathwork: '4-4-4 box breathing — 4 in, hold, 4 out',
    environment: 'Clear desk · get water · silence phone · stand up',
    duration: 15,
  },
  {
    energy: 'focused',
    label: 'Focused',
    affirmation: 'My mind is clear. Distractions fall away. I produce work that matters.',
    music: 'Deep Focus',
    movement: 'Shake out tension · roll neck · stretch arms',
    breathwork: '4-4-4 breathing — 4 counts in, hold, out',
    environment: 'Close tabs · get water · silence phone',
    duration: 10,
  },
  {
    energy: 'creative',
    label: 'Creative',
    affirmation: 'Creativity flows through me freely. I trust the process and explore without limits.',
    music: 'Creative Flow',
    movement: 'Loosen up · stretch · move freely for 60 sec',
    breathwork: 'Box breathing — 4 in, 4 hold, 4 out, 4 hold',
    environment: 'Clear clutter · natural light · ambient sound',
    duration: 10,
  },
  {
    energy: 'energize',
    label: 'Energize',
    affirmation: 'My body is capable and strong. Every rep, every stride — I grow.',
    music: 'Energy Boost',
    movement: 'Dynamic warm-up: leg swings, arm circles, hip rolls',
    breathwork: 'Power breathing — 3 deep breaths, exhale strong',
    environment: 'Fill water bottle · lace up · silence phone',
    duration: 5,
  },
  {
    energy: 'calm',
    label: 'Calm',
    affirmation: 'I am present and grounded. I meet this moment with openness and grace.',
    music: 'Ambient Calm',
    movement: 'Ground your feet · feel the floor beneath you',
    breathwork: '4-7-8 — breathe in 4, hold 7, exhale 8',
    environment: 'Dim lights · quiet space · sit comfortably',
    duration: 10,
  },
];

// ── Tab Icon ──────────────────────────────────────────────────────────────────
function TabIcon({ icon, label, active, onTap }: { icon: React.ReactNode; label: string; active: boolean; onTap: () => void }) {
  return (
    <button onClick={onTap} style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
      padding: '10px 0', color: active ? '#7C3AED' : 'rgba(255,255,255,0.35)',
      background: 'transparent', border: 'none',
      borderTop: active ? '2px solid #7C3AED' : '2px solid transparent', cursor: 'pointer',
    }}>
      {icon}
      <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.04em' }}>{label.toUpperCase()}</span>
    </button>
  );
}

// ── Field input styling ─────────────────────────────────────────────────────
const fieldInputStyle: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10, padding: '8px 10px', fontSize: 13, color: '#fff', outline: 'none',
  fontFamily: 'inherit', boxSizing: 'border-box',
};

// ── Profile Card ──────────────────────────────────────────────────────────────
function ProfileCard({ profile, expanded, onToggle, onSave }: {
  profile: TriggerProfile;
  expanded: boolean;
  onToggle: () => void;
  onSave: (next: TriggerProfile) => Promise<void>;
}) {
  const color = ENERGY_COLORS[profile.energy];
  const [draft, setDraft] = useState<TriggerProfile>(profile);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setDraft(profile); }, [profile]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(profile);

  function setField<K extends keyof TriggerProfile>(key: K, value: TriggerProfile[K]) {
    setDraft(d => ({ ...d, [key]: value }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    await onSave(draft);
    setSaving(false);
    setSaved(true);
  }

  return (
    <div style={{ marginBottom: 8, borderRadius: 16, overflow: 'hidden', border: `1px solid ${expanded ? color + '40' : 'rgba(255,255,255,0.07)'}`, background: 'rgba(255,255,255,0.04)' }}>
      <button onClick={onToggle} style={{
        width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 16px', background: 'transparent', border: 'none', cursor: 'pointer',
      }}>
        {/* Color dot */}
        <div style={{ width: 36, height: 36, borderRadius: 12, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <div style={{ width: 10, height: 10, borderRadius: 5, background: color }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{profile.label}</p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', marginTop: 2 }}>{profile.duration} min · {profile.music}</p>
        </div>
        <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
        </motion.div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${color}20` }}>

              {/* Affirmation */}
              <div style={{ padding: '12px 0 10px' }}>
                <p style={{ fontSize: 9, fontWeight: 900, color: color, letterSpacing: '0.07em', marginBottom: 6 }}>AFFIRMATION</p>
                <textarea value={draft.affirmation} onChange={e => setField('affirmation', e.target.value)} rows={3}
                  style={{ ...fieldInputStyle, fontStyle: 'italic', resize: 'vertical', lineHeight: 1.5 }} />
              </div>

              {/* Music */}
              <div style={{ paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.07em', marginBottom: 5 }}>MUSIC</p>
                <input value={draft.music} onChange={e => setField('music', e.target.value)} style={fieldInputStyle} />
              </div>

              {/* Detail rows */}
              {([
                { label: 'MOVEMENT', key: 'movement' as const },
                { label: 'BREATHWORK', key: 'breathwork' as const },
                { label: 'ENVIRONMENT', key: 'environment' as const },
              ]).map(row => (
                <div key={row.label} style={{ paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <p style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.07em', marginBottom: 5 }}>{row.label}</p>
                  <input value={draft[row.key]} onChange={e => setField(row.key, e.target.value)} style={fieldInputStyle} />
                </div>
              ))}

              {/* Duration */}
              <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.07em', marginBottom: 8 }}>DURATION</p>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[5, 10, 15, 20].map(m => (
                    <button key={m} onClick={() => setField('duration', m)} style={{
                      flex: 1, padding: '8px 0', borderRadius: 10, fontWeight: 800, fontSize: 12, border: 'none', cursor: 'pointer',
                      background: draft.duration === m ? color : 'rgba(255,255,255,0.06)',
                      color: draft.duration === m ? '#fff' : 'rgba(255,255,255,0.45)',
                    }}>
                      {m} min
                    </button>
                  ))}
                </div>
              </div>

              {/* Save */}
              <button onClick={handleSave} disabled={!dirty || saving} style={{
                marginTop: 14, width: '100%', padding: '11px 0', borderRadius: 12, fontWeight: 900, fontSize: 13,
                border: 'none', cursor: dirty && !saving ? 'pointer' : 'default',
                background: dirty ? color : 'rgba(255,255,255,0.06)',
                color: dirty ? '#fff' : 'rgba(255,255,255,0.3)',
              }}>
                {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save changes'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [userId, setUserId] = useState('');
  const [defaultDuration, setDefaultDuration] = useState<5 | 10 | 15>(10);
  const [expandedProfile, setExpandedProfile] = useState<EnergyType | null>(null);
  const [profiles, setProfiles] = useState<TriggerProfile[]>(DEFAULT_PROFILES);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  useEffect(() => {
    if (!userId) return;
    (supabase as any).from('trigger_profiles').select('*').eq('user_id', userId).order('created_at')
      .then(({ data }: { data: any[] | null }) => {
        if (!data || data.length === 0) return;
        setProfiles(prev => prev.map(p => {
          const db = data.find((d: any) => d.energy_type === p.energy);
          if (!db) return p;
          return {
            ...p,
            affirmation: db.affirmation || p.affirmation,
            music: db.playlist || p.music,
            movement: db.movement || p.movement,
            breathwork: db.breathwork || p.breathwork,
            environment: db.environment || p.environment,
            duration: db.duration_min || p.duration,
          };
        }));
        const def = data.find((d: any) => d.is_default);
        if (def?.duration_min) setDefaultDuration(def.duration_min);
      });
  }, [userId]);

  async function saveDefaultDuration(min: 5 | 10 | 15) {
    setDefaultDuration(min);
    if (userId) {
      await (supabase as any).from('trigger_profiles').update({ duration_min: min }).eq('user_id', userId).eq('is_default', true);
    }
  }

  async function saveProfile(next: TriggerProfile) {
    setProfiles(prev => prev.map(p => p.energy === next.energy ? next : p));
    if (!userId) return;
    await (supabase as any).from('trigger_profiles').upsert({
      user_id: userId,
      energy_type: next.energy,
      name: next.label,
      affirmation: next.affirmation,
      playlist: next.music,
      movement: next.movement,
      breathwork: next.breathwork,
      environment: next.environment,
      duration_min: next.duration,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,energy_type' });
  }

  return (
    <div style={{ background: '#080E24', minHeight: '100vh', color: '#fff', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20, display: 'flex', alignItems: 'center',
        padding: '14px 16px', background: 'rgba(8,14,36,0.96)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <button onClick={() => router.push('/village/spaces')} style={{
          width: 36, height: 36, borderRadius: 18, background: 'rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', marginRight: 10,
        }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <p style={{ fontSize: 20, fontWeight: 900, flex: 1, letterSpacing: '-0.01em' }}>Settings</p>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px 88px' }}>

        {/* ── Trigger Defaults ── */}
        <p style={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.07em', marginBottom: 12 }}>TRIGGER DEFAULTS</p>

        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: '16px', marginBottom: 28 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.65)', marginBottom: 14 }}>Default prep window</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {([5, 10, 15] as const).map(m => (
              <button key={m} onClick={() => saveDefaultDuration(m)} style={{
                flex: 1, padding: '11px 0', borderRadius: 12, fontWeight: 900, fontSize: 15, border: 'none', cursor: 'pointer',
                background: defaultDuration === m ? '#7C3AED' : 'rgba(255,255,255,0.06)',
                color: defaultDuration === m ? '#fff' : 'rgba(255,255,255,0.45)',
                boxShadow: defaultDuration === m ? '0 2px 12px rgba(124,58,237,0.35)' : 'none',
              }}>
                {m} min
              </button>
            ))}
          </div>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', marginTop: 12, lineHeight: 1.4 }}>
            AI may override this based on your wellness data — poor sleep extends to 15 min, high HRV shortens to 5 min.
          </p>
        </div>

        {/* ── Trigger Profiles ── */}
        <p style={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.07em', marginBottom: 12 }}>TRIGGER PROFILES</p>

        {profiles.map(p => (
          <ProfileCard
            key={p.energy}
            profile={p}
            expanded={expandedProfile === p.energy}
            onToggle={() => setExpandedProfile(prev => prev === p.energy ? null : p.energy)}
            onSave={saveProfile}
          />
        ))}

        {/* ── Notifications ── */}
        <p style={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.07em', marginTop: 28, marginBottom: 12 }}>NOTIFICATIONS</p>
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, overflow: 'hidden' }}>
          {[
            { label: 'Trigger alerts', sub: 'Notify when Trigger fires', on: true },
            { label: 'Daily schedule', sub: 'Morning briefing at 7:00 AM', on: true },
            { label: 'Task reminders', sub: 'Alert 30 min before due', on: false },
          ].map((item, i) => (
            <div key={item.label} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
              borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{item.label}</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', marginTop: 2 }}>{item.sub}</p>
              </div>
              <div style={{
                width: 44, height: 24, borderRadius: 12, position: 'relative', flexShrink: 0,
                background: item.on ? '#7C3AED' : 'rgba(255,255,255,0.1)',
              }}>
                <div style={{
                  position: 'absolute', top: 2, width: 20, height: 20, borderRadius: 10, background: '#fff',
                  left: item.on ? 22 : 2, transition: 'left 0.2s',
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* ── About ── */}
        <p style={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.07em', marginTop: 28, marginBottom: 12 }}>ABOUT</p>
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: '16px' }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
            Spaces is your personal performance OS. The Trigger system primes you mentally and physically before every event — turning ordinary preparation into deliberate activation.
          </p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 10 }}>Spaces v1.0 · villa9e</p>
        </div>
      </div>

      {/* Bottom Nav */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(8,14,36,0.97)', borderTop: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', paddingBottom: 'env(safe-area-inset-bottom, 0px)', zIndex: 30,
      }}>
        <TabIcon label="Home" active={false} onTap={() => router.push('/village/spaces')}
          icon={<svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>}
        />
        <TabIcon label="Calendar" active={false} onTap={() => router.push('/village/spaces')}
          icon={<svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>}
        />
        <TabIcon label="Tasks" active={false} onTap={() => router.push('/village/spaces/tasks')}
          icon={<svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>}
        />
        <TabIcon label="Settings" active={true} onTap={() => {}}
          icon={<svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>}
        />
      </div>
    </div>
  );
}
