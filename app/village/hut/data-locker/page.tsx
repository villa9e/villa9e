'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { VillageSound } from '@/lib/sounds/village';

const DATA_CATEGORIES = [
  { key: 'share_goals',     label: 'Goal Categories',        desc: 'Which goal types you work on',            earn: 2.50, risk: 'low'    },
  { key: 'share_behavior',  label: 'Active Goal Steps',      desc: 'What steps you complete and when',        earn: 5.00, risk: 'medium' },
  { key: 'share_purchases', label: 'Purchase Behavior',      desc: 'Resources you buy via villa9e links',     earn: 3.50, risk: 'medium' },
  { key: 'share_health',    label: 'Health & Wellness',      desc: 'Mood check-ins and wellness habits',      earn: 2.00, risk: 'low'    },
  { key: 'share_location',  label: 'Location (city only)',   desc: 'Your city for local opportunity matching',earn: 0.75, risk: 'low'    },
  { key: 'share_interests', label: 'Interests & Skills',     desc: 'Categories from your skill profile',      earn: 1.50, risk: 'low'    },
];

const RISK_STYLE: Record<string, { text: string; bg: string }> = {
  low:    { text: '#16A34A', bg: '#DCFCE7' },
  medium: { text: '#D97706', bg: '#FEF9C3' },
};

export default function DataLockerPage() {
  const [settings, setSettings]   = useState<any>(null);
  const [wallet, setWallet]        = useState<any>(null);
  const [saving, setSaving]        = useState(false);
  const [saved, setSaved]          = useState(false);
  const [consentLevel, setConsentLevel] = useState<'locked'|'anonymous_only'|'full_monetization'>('locked');
  const supabase = createClient();
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';

  const bg       = isNight ? '#0A0B12' : '#F0FDF4';
  const cardBg   = isNight ? '#12152A' : '#FFFFFF';
  const border   = isNight ? '#1E2240' : '#BBF7D0';
  const textMain = isNight ? '#F0EBE0' : '#052E16';
  const textMute = isNight ? '#4A4F72' : '#166534';
  const accent   = isNight ? '#34D399' : '#059669';

  useEffect(() => { load(); }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [{ data: s }, { data: w }] = await Promise.all([
      (supabase as any).from('data_locker_settings').select('*').eq('user_id', user.id).single(),
      (supabase as any).from('village_wallets').select('total_data_earnings').eq('user_id', user.id).single(),
    ]);
    if (s) { setSettings(s); setConsentLevel(s.consent_level ?? 'locked'); }
    else setSettings({ share_goals: false, share_behavior: false, share_purchases: false, share_health: false, share_location: false, share_interests: false });
    setWallet(w);
  }

  async function save() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await (supabase as any).from('data_locker_settings').upsert(
        { user_id: user.id, consent_level: consentLevel, ...settings },
        { onConflict: 'user_id' }
      );
      VillageSound.stepComplete();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
    setSaving(false);
  }

  function toggle(key: string) {
    setSettings((s: any) => ({ ...s, [key]: !s?.[key] }));
    VillageSound.tap();
  }

  const enabledEarnings = DATA_CATEGORIES.filter(c => settings?.[c.key]).reduce((sum, c) => sum + c.earn, 0);
  const totalDataEarned = parseFloat(wallet?.total_data_earnings ?? 0);

  return (
    <div className="min-h-screen" style={{ background: bg }}>
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 border-b"
        style={{ background: isNight ? '#0E1020' : '#fff', borderColor: border }}>
        <Link href="/village/hut" className="text-xl" style={{ color: textMute }}>←</Link>
        <span className="text-2xl">🔐</span>
        <div className="flex-1">
          <h1 className="font-black text-base" style={{ color: textMain }}>Data Locker</h1>
          <p className="text-xs" style={{ color: textMute }}>Your data. Your choice. Your earnings.</p>
        </div>
        {totalDataEarned > 0 && (
          <div className="text-right">
            <p className="font-black text-sm" style={{ color: accent }}>${totalDataEarned.toFixed(2)}</p>
            <p className="text-xs" style={{ color: textMute }}>earned</p>
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">

        {/* Spirit intro */}
        <div className="rounded-2xl p-5 flex gap-3"
          style={{ background: isNight ? '#0D1820' : '#ECFDF5', border: `1px solid ${isNight ? '#1A3D2F' : '#A7F3D0'}` }}>
          <span className="text-2xl flex-shrink-0">🌿</span>
          <div>
            <p className="font-bold text-sm mb-1.5" style={{ color: accent }}>Spirit says:</p>
            <p className="text-sm leading-relaxed" style={{ color: textMute }}>
              "Your data belongs to you — always. Right now it&apos;s locked. No one touches it. But here&apos;s the truth: villa9e earns from anonymized village-wide data regardless. The question is whether <em>you</em> get 15% of what your data earns. You choose."
            </p>
          </div>
        </div>

        {/* Consent level selector */}
        <div className="rounded-2xl p-4" style={{ background: cardBg, border: `1px solid ${border}` }}>
          <p className="font-black text-sm mb-3" style={{ color: textMain }}>Choose Your Level</p>
          <div className="space-y-2.5">
            {[
              { value: 'locked',            icon: '🔒', label: 'Fully Locked',        desc: 'No personal data used. Full privacy. Earns $0.',    earn: '$0/mo' },
              { value: 'anonymous_only',    icon: '👤', label: 'Anonymous Only',      desc: 'Goal categories only, zero identifiers.',          earn: '~$1–3/mo' },
              { value: 'full_monetization', icon: '💰', label: 'Full Monetization',   desc: 'You choose exactly what to share. Maximum earnings.', earn: `~$${enabledEarnings.toFixed(0)}/mo` },
            ].map(opt => (
              <button key={opt.value} onClick={() => { setConsentLevel(opt.value as any); VillageSound.tap(); }}
                className="w-full flex items-start gap-3 p-4 rounded-2xl text-left transition-all"
                style={{
                  background: consentLevel === opt.value ? (isNight ? '#0D2D1A' : '#ECFDF5') : 'transparent',
                  border: `2px solid ${consentLevel === opt.value ? accent : border}`,
                }}>
                <span className="text-2xl">{opt.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-sm" style={{ color: textMain }}>{opt.label}</p>
                    <span className="font-bold text-sm" style={{ color: accent }}>{opt.earn}</span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: textMute }}>{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Category toggles */}
        <AnimatePresence>
          {consentLevel === 'full_monetization' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="rounded-2xl p-4 overflow-hidden" style={{ background: cardBg, border: `1px solid ${border}` }}>
              <p className="font-black text-sm mb-1" style={{ color: textMain }}>Choose What to Share</p>
              <p className="text-xs mb-4" style={{ color: textMute }}>Toggle individually. Change anytime. Higher risk = higher earnings.</p>

              <div className="space-y-3">
                {DATA_CATEGORIES.map(cat => {
                  const rStyle = RISK_STYLE[cat.risk] ?? RISK_STYLE.low;
                  const on = !!settings?.[cat.key];
                  return (
                    <div key={cat.key} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm" style={{ color: textMain }}>{cat.label}</p>
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                            style={{ color: rStyle.text, background: isNight ? rStyle.text + '20' : rStyle.bg }}>
                            {cat.risk}
                          </span>
                        </div>
                        <p className="text-xs" style={{ color: textMute }}>{cat.desc}</p>
                        <p className="text-xs font-bold" style={{ color: accent }}>+${cat.earn.toFixed(2)}/mo</p>
                      </div>
                      {/* Toggle switch */}
                      <button onClick={() => toggle(cat.key)}
                        className="relative w-12 h-6 rounded-full flex-shrink-0 transition-colors"
                        style={{ background: on ? accent : (isNight ? '#1E2240' : '#E5E7EB') }}>
                        <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                          style={{ transform: on ? 'translateX(24px)' : 'translateX(0)' }} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {enabledEarnings > 0 && (
                <div className="mt-4 rounded-2xl p-4 text-center"
                  style={{ background: isNight ? '#0D2D1A' : '#ECFDF5', border: `1px solid ${isNight ? '#1A3D2F' : '#A7F3D0'}` }}>
                  <p className="text-xs mb-1" style={{ color: textMute }}>Estimated monthly earnings</p>
                  <p className="text-3xl font-black" style={{ color: accent }}>${enabledEarnings.toFixed(2)}/mo</p>
                  <p className="text-xs mt-1" style={{ color: textMute }}>Paid to your $VLG wallet. Actual earnings vary with village activity.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* What we never share */}
        <div className="rounded-2xl p-4" style={{ background: cardBg, border: `1px solid ${border}` }}>
          <p className="font-black text-sm mb-2" style={{ color: textMain }}>🛡️ What We NEVER Share</p>
          <div className="space-y-1">
            {['Your name or email address', 'Exact GPS location', 'Health records or diagnoses', 'Financial account numbers', 'Private journal entries', 'Direct messages'].map(item => (
              <div key={item} className="flex items-center gap-2 text-xs">
                <span style={{ color: accent }}>✓</span>
                <span style={{ color: textMute }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <button onClick={save} disabled={saving}
          className="w-full py-4 rounded-2xl font-black text-white text-base disabled:opacity-50 transition-all"
          style={{ background: `linear-gradient(135deg, ${accent}, #1877F2)` }}>
          {saving ? 'Saving…' : saved ? '✅ Saved!' : '🔐 Save Data Locker Settings'}
        </button>
      </div>
    </div>
  );
}
