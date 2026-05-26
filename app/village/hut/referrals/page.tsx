'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ReferralsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [earnings, setEarnings] = useState(0);
  const [copied, setCopied] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: p }, { data: r }, { data: txns }] = await Promise.all([
        supabase.from('profiles').select('username, village_score').eq('id', user.id).single(),
        supabase.from('referrals').select('*, profiles!referred_id(username, village_score, created_at, score_tier)').eq('referrer_id', user.id).order('created_at', { ascending: false }),
        supabase.from('wallet_transactions').select('amount').eq('user_id', user.id).ilike('reason', '%REFER%'),
      ]);

      setProfile(p);
      setReferrals(r ?? []);
      setEarnings(txns?.reduce((sum, t) => sum + parseFloat(t.amount ?? 0), 0) ?? 0);
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

  return (
    <div className="min-h-screen bg-village-bg">
      <div className="bg-amber-500 text-white px-6 py-4 flex items-center gap-3">
        <Link href="/village/hut" className="text-xl">←</Link>
        <span className="text-2xl">👥</span>
        <div>
          <h1 className="text-xl font-bold leading-tight">Referrals</h1>
          <p className="text-amber-100 text-xs">Grow the village · Earn $VLG together</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Referral link */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="village-card bg-gradient-to-br from-amber-50 to-orange-50">
          <p className="font-bold mb-1">Your Referral Link</p>
          <p className="text-xs text-gray-500 mb-3">Share this link. When someone joins, you both earn 100 $VLG.</p>
          <div className="flex gap-2">
            <div className="flex-1 bg-white rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-600 truncate font-mono text-xs">
              {referralLink || 'Loading…'}
            </div>
            <button onClick={copyLink} className="bg-amber-500 text-white rounded-xl px-4 py-2 text-sm font-bold flex-shrink-0 hover:bg-amber-600">
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
          <div className="flex gap-3 mt-3">
            {['Twitter', 'Instagram', 'Text'].map(platform => (
              <button key={platform} onClick={() => {
                const msg = `Join me on villa9e — a GPS system for your goals. It takes a village. ${referralLink}`;
                if (platform === 'Twitter') window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(msg)}`, '_blank');
                if (platform === 'Instagram') navigator.clipboard.writeText(msg);
                if (platform === 'Text') window.open(`sms:?body=${encodeURIComponent(msg)}`);
              }} className="flex-1 text-xs border border-gray-200 rounded-xl py-2 hover:bg-gray-50">
                {platform === 'Twitter' ? '🐦' : platform === 'Instagram' ? '📸' : '💬'} {platform}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="village-card text-center">
            <p className="text-3xl font-bold text-amber-500">{referrals.length}</p>
            <p className="text-xs text-gray-400">Villagers Referred</p>
          </div>
          <div className="village-card text-center">
            <p className="text-3xl font-bold text-green-600">{earnings.toFixed(0)}</p>
            <p className="text-xs text-gray-400">$VLG Earned</p>
          </div>
          <div className="village-card text-center">
            <p className="text-3xl font-bold text-village-blue">{(referrals.length * 100).toLocaleString()}</p>
            <p className="text-xs text-gray-400">VLG Pending</p>
          </div>
        </div>

        {/* How it works */}
        <div className="village-card">
          <h2 className="font-bold mb-3">How It Works</h2>
          <div className="space-y-3">
            {[
              { step: '1', text: 'Share your link', detail: 'Anyone who clicks your link is tagged to you', icon: '🔗' },
              { step: '2', text: 'They join', detail: 'Counted the moment they create an account', icon: '👤' },
              { step: '3', text: 'Both earn', detail: 'You get +100 VLG, they get +100 VLG as a bonus', icon: '✊' },
              { step: '4', text: 'Founding bonus', detail: 'First 1,000 villagers get extra 500 VLG at Phase 3', icon: '👑' },
            ].map(s => (
              <div key={s.step} className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0">{s.icon}</span>
                <div>
                  <p className="font-medium text-sm">{s.text}</p>
                  <p className="text-xs text-gray-400">{s.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Referred villagers */}
        {referrals.length > 0 && (
          <div className="village-card">
            <h2 className="font-bold mb-3">Villagers You Invited ({referrals.length})</h2>
            <div className="space-y-2">
              {referrals.map(r => (
                <div key={r.id} className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-sm">👤</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">@{r.profiles?.username ?? 'Villager'}</p>
                    <p className="text-xs text-gray-400">{r.profiles?.score_tier ?? 'Seedling'} · Joined {new Date(r.profiles?.created_at ?? r.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className="text-xs font-bold text-green-600">+100 VLG</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {referrals.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <p className="text-4xl mb-2">👥</p>
            <p className="font-medium">No referrals yet.</p>
            <p className="text-sm mt-1">Share your link to grow your village and earn $VLG.</p>
          </div>
        )}
      </div>
    </div>
  );
}
