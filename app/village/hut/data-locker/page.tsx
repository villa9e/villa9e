'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const DATA_CATEGORIES = [
  { key: 'share_goals',     label: 'Goal Categories',      desc: 'Which goal types you\'re working on',     est: '$1–3/mo',  risk: 'low' },
  { key: 'share_behavior',  label: 'Active Goal Steps',    desc: 'What step you\'re currently on',          est: '$3–8/mo',  risk: 'medium' },
  { key: 'share_purchases', label: 'Purchase Behavior',    desc: 'Resources you buy through villa9e links', est: '$2–5/mo',  risk: 'medium' },
  { key: 'share_health',    label: 'Health & Wellness',    desc: 'Mood check-ins and wellness habits',      est: '$1–3/mo',  risk: 'low' },
  { key: 'share_location',  label: 'Location (city only)', desc: 'Your city for local business targeting',  est: '$0.50–1/mo',risk:'low' },
  { key: 'share_interests', label: 'Interests & Skills',   desc: 'Categories from your skill profile',     est: '$1–2/mo',  risk: 'low' },
];

const riskColor = { low: 'text-green-600 bg-green-50', medium: 'text-amber-600 bg-amber-50', high: 'text-red-600 bg-red-50' };

export default function DataLockerPage() {
  const [settings, setSettings] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [consentLevel, setConsentLevel] = useState<'locked' | 'anonymous_only' | 'full_monetization'>('locked');
  const supabase = createClient();

  useEffect(() => { load(); }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('data_locker_settings').select('*').eq('user_id', user.id).single();
    if (data) { setSettings(data); setConsentLevel(data.consent_level); }
  }

  async function save() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('data_locker_settings').upsert({ user_id: user.id, consent_level: consentLevel, ...settings }, { onConflict: 'user_id' });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  function toggleCategory(key: string) {
    setSettings((s: any) => ({ ...s, [key]: !s?.[key] }));
  }

  const totalEst = DATA_CATEGORIES.filter(c => settings?.[c.key]).reduce((sum, c) => sum + parseFloat(c.est.split('–')[1] || c.est.split('$')[1] || '0'), 0);

  return (
    <div className="min-h-screen bg-village-bg">
      <div className="bg-gray-900 text-white px-6 py-4 flex items-center gap-3">
        <Link href="/village/hut" className="text-xl">←</Link>
        <span className="text-2xl">🔐</span>
        <div>
          <h1 className="text-xl font-bold leading-tight">Data Locker</h1>
          <p className="text-gray-400 text-xs">Your data. Your choice. Your earnings.</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Spirit intro */}
        <div className="village-card bg-gradient-to-br from-gray-900 to-gray-800 text-white">
          <div className="flex gap-3">
            <span className="text-2xl flex-shrink-0">🌿</span>
            <div>
              <p className="font-bold text-sm mb-1">Spirit says:</p>
              <p className="text-gray-300 text-sm leading-relaxed">
                "Your data belongs to you. Right now it's locked — no one can use it for advertising. That means you're protected, but you're also leaving money on the table.
                <br /><br />
                Here's the deal: villa9e earns from advertising whether your data is locked or not. But if you unlock it, you get 15% of what your data earns."
              </p>
            </div>
          </div>
        </div>

        {/* Consent level */}
        <div className="village-card">
          <h2 className="font-bold mb-4">Choose Your Level</h2>
          <div className="space-y-3">
            {[
              { value: 'locked',           icon: '🔒', label: 'Fully Locked',       desc: 'No personal data used. Contextual ads only. You earn $0.', earn: '$0' },
              { value: 'anonymous_only',   icon: '👤', label: 'Anonymous Only',     desc: 'Goal categories shared, no personal identifiers. Earns some.', earn: '~$1–3/mo' },
              { value: 'full_monetization',icon: '💰', label: 'Full Monetization',  desc: 'Granular sharing — you choose which categories. Maximum earnings.', earn: `~$${totalEst.toFixed(0)}/mo est.` },
            ].map(opt => (
              <button key={opt.value} onClick={() => setConsentLevel(opt.value as any)}
                className={`w-full flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all ${consentLevel === opt.value ? 'border-village-blue bg-blue-50' : 'border-gray-100 hover:border-gray-200'}`}>
                <span className="text-2xl flex-shrink-0">{opt.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-sm">{opt.label}</p>
                    <span className="text-xs font-bold text-green-600">{opt.earn}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Category toggles (only shown for full_monetization) */}
        {consentLevel === 'full_monetization' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="village-card">
            <h2 className="font-bold mb-1">Choose What to Share</h2>
            <p className="text-xs text-gray-500 mb-4">Toggle categories individually. You can change this anytime.</p>
            <div className="space-y-3">
              {DATA_CATEGORIES.map(cat => (
                <div key={cat.key} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{cat.label}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${riskColor[cat.risk as keyof typeof riskColor]}`}>{cat.risk}</span>
                    </div>
                    <p className="text-xs text-gray-400">{cat.desc}</p>
                    <p className="text-xs text-green-600 font-medium">{cat.est}/mo</p>
                  </div>
                  <button
                    onClick={() => toggleCategory(cat.key)}
                    className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${settings?.[cat.key] ? 'bg-village-blue' : 'bg-gray-200'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings?.[cat.key] ? 'translate-x-6' : ''}`} />
                  </button>
                </div>
              ))}
            </div>
            {totalEst > 0 && (
              <div className="mt-4 bg-green-50 border border-green-100 rounded-2xl p-3 text-center">
                <p className="text-xs text-gray-500">Estimated monthly earnings</p>
                <p className="text-2xl font-bold text-green-600">${totalEst.toFixed(0)}/mo</p>
                <p className="text-xs text-gray-400">Paid to your $VLG wallet. Varies by goal activity.</p>
              </div>
            )}
          </motion.div>
        )}

        {/* What we never share */}
        <div className="village-card border border-gray-100">
          <h3 className="font-bold text-sm mb-2">🛡️ What We NEVER Share</h3>
          <ul className="text-xs text-gray-500 space-y-1">
            {['Your name or email address','Exact GPS location','Health records or medical data','Financial account numbers','Private journal entries','Direct messages'].map(item => (
              <li key={item} className="flex items-center gap-2"><span className="text-green-500">✓</span>{item}</li>
            ))}
          </ul>
        </div>

        <button onClick={save} disabled={saving} className="village-btn-primary w-full py-4 text-base disabled:opacity-50">
          {saving ? 'Saving…' : saved ? '✅ Saved!' : '🔐 Save Data Locker Settings'}
        </button>
      </div>
    </div>
  );
}
