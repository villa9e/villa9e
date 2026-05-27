'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';

export default function ReferralsPage() {
  const [profile, setProfile]   = useState<any>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [earnings, setEarnings]   = useState(0);
  const [copied, setCopied]       = useState(false);
  const supabase = createClient();
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';

  const bg      = isNight ? '#0A0B12' : '#FFFBF0';
  const cardBg  = isNight ? '#12152A' : '#FFFFFF';
  const border  = isNight ? '#1E2240' : '#FED7AA';
  const text    = isNight ? '#F0EBE0' : '#1A0A00';
  const muted   = isNight ? '#4A4F72' : '#78350F';
  const accent  = isNight ? '#FBBF24' : '#D97706';

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: p }, { data: r }, { data: txns }] = await Promise.all([
        supabase.from('profiles').select('username, village_score').eq('id', user.id).single(),
        (supabase as any).from('referrals')
          .select('*, profiles!referred_id(username, village_score, created_at, score_tier)')
          .eq('referrer_id', user.id)
          .order('created_at', { ascending: false }),
        supabase.from('wallet_transactions').select('amount').eq('user_id', user.id).ilike('reason', '%REFER%'),
      ]);

      setProfile(p);
      setReferrals(r ?? []);
      setEarnings(txns?.reduce((sum: number, t: any) => sum + parseFloat(t.amount ?? 0), 0) ?? 0);
    }
    load();
  }, []);

  const referralLink = profile ? `https://villa9e.app/join/${profile.username}` : '';

  async function copyLink() {
    if (!referralLink) return;
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function shareOn(platform: string) {
    const msg = `Join me on villa9e — a GPS system for your goals. It takes a village. ${referralLink}`;
    if (platform === 'Twitter')   window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(msg)}`, '_blank');
    if (platform === 'Instagram') navigator.clipboard.writeText(msg);
    if (platform === 'Text')      window.open(`sms:?body=${encodeURIComponent(msg)}`);
  }

  return (
    <div className="min-h-screen" style={{ background: bg }}>
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 border-b"
        style={{ background: isNight ? '#0A0B12' : '#D97706', borderColor: border }}>
        <Link href="/village/hut" className="text-xl" style={{ color: isNight ? muted : 'rgba(255,255,255,0.8)' }}>←</Link>
        <span className="text-2xl">👥</span>
        <div className="flex-1">
          <h1 className="text-lg font-black leading-tight" style={{ color: isNight ? text : '#fff' }}>Referrals</h1>
          <p className="text-xs" style={{ color: isNight ? muted : 'rgba(255,255,255,0.65)' }}>Grow the village · Earn $VLG together</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Referral link card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5" style={{ background: cardBg, border: `1px solid ${border}` }}>
          <p className="font-bold mb-1" style={{ color: text }}>Your Referral Link</p>
          <p className="text-xs mb-3" style={{ color: muted }}>Share this link. When someone joins, you both earn 100 $VLG.</p>
          <div className="flex gap-2">
            <div className="flex-1 rounded-xl border px-3 py-2 text-xs font-mono truncate"
              style={{ background: isNight ? '#0D1020' : '#FFF8EE', border: `1px solid ${border}`, color: muted }}>
              {referralLink || 'Loading…'}
            </div>
            <button onClick={copyLink}
              className="rounded-xl px-4 py-2 text-sm font-bold flex-shrink-0 transition-colors"
              style={{ background: accent, color: '#fff' }}>
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
          <div className="flex gap-3 mt-3">
            {['Twitter', 'Instagram', 'Text'].map(platform => (
              <button key={platform} onClick={() => shareOn(platform)}
                className="flex-1 text-xs rounded-xl py-2 transition-colors"
                style={{ border: `1px solid ${border}`, color: muted, background: isNight ? '#0D1020' : '#FFFBF0' }}>
                {platform === 'Twitter' ? '🐦' : platform === 'Instagram' ? '📸' : '💬'} {platform}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: referrals.length, label: 'Referred', color: accent },
            { value: earnings.toFixed(0), label: '$VLG Earned', color: '#22C55E' },
            { value: (referrals.length * 100).toLocaleString(), label: 'VLG Pending', color: '#1877F2' },
          ].map(stat => (
            <motion.div key={stat.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl p-3 text-center" style={{ background: cardBg, border: `1px solid ${border}` }}>
              <p className="text-2xl font-black" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-xs mt-0.5" style={{ color: muted }}>{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* How it works */}
        <div className="rounded-2xl p-5" style={{ background: cardBg, border: `1px solid ${border}` }}>
          <h2 className="font-bold mb-4 text-sm" style={{ color: text }}>How It Works</h2>
          <div className="space-y-4">
            {[
              { icon: '🔗', title: 'Share your link',  desc: 'Anyone who clicks your link is tagged to you' },
              { icon: '👤', title: 'They join',         desc: 'Counted the moment they create their account' },
              { icon: '✊',  title: 'Both earn',         desc: 'You get +100 VLG, they get +100 VLG as a welcome bonus' },
              { icon: '👑', title: 'Founding bonus',    desc: 'First 1,000 villagers earn an extra 500 VLG at Phase 3' },
            ].map((s, i) => (
              <motion.div key={s.title} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }} className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0">{s.icon}</span>
                <div>
                  <p className="font-semibold text-sm" style={{ color: text }}>{s.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: muted }}>{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Referral leaderboard-style list */}
        {referrals.length > 0 ? (
          <div className="rounded-2xl p-5" style={{ background: cardBg, border: `1px solid ${border}` }}>
            <h2 className="font-bold mb-3 text-sm" style={{ color: text }}>
              Villagers You Invited ({referrals.length})
            </h2>
            <div className="space-y-2">
              {referrals.map((r: any) => (
                <div key={r.id} className="flex items-center gap-3 py-2 border-b last:border-0" style={{ borderColor: border }}>
                  <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: isNight ? '#1A1F3A' : '#FFF8EE', border: `1px solid ${border}` }}>
                    👤
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: text }}>
                      @{r.profiles?.username ?? 'Villager'}
                    </p>
                    <p className="text-xs" style={{ color: muted }}>
                      {r.profiles?.score_tier ?? 'Seedling'} · Joined{' '}
                      {new Date(r.profiles?.created_at ?? r.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-xs font-bold" style={{ color: '#22C55E' }}>+100 VLG</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-10" style={{ color: muted }}>
            <p className="text-4xl mb-3">👥</p>
            <p className="font-semibold" style={{ color: text }}>No referrals yet</p>
            <p className="text-sm mt-1">Share your link to grow your village and earn $VLG.</p>
          </div>
        )}
      </div>
    </div>
  );
}
