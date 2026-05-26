'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getScoreTier } from '@/lib/village/score';

export default function VLGWalletPage() {
  const [wallet, setWallet]   = useState<any>(null);
  const [txns, setTxns]       = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data: w }, { data: t }, { data: p }] = await Promise.all([
        supabase.from('village_wallets').select('*').eq('user_id', user.id).single(),
        supabase.from('wallet_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
        supabase.from('profiles').select('village_score,score_tier,is_founding_villager').eq('id', user.id).single(),
      ]);
      setWallet(w); setTxns(t ?? []); setProfile(p);
    }
    load();
  }, []);

  const tier     = getScoreTier(profile?.village_score ?? 0);
  const totalVlg = parseFloat(wallet?.vlg_balance ?? 0);

  const txnIcon = (type: string) => {
    if (type.includes('GOAL') || type.includes('STEP')) return '📍';
    if (type.includes('OOWOP')) return '✊';
    if (type.includes('ONBOARD')) return '🎉';
    if (type.includes('MINDFUL')) return '🧘';
    if (type.includes('POST')) return '✨';
    if (type.includes('REFER')) return '👥';
    if (type.includes('MEDAL')) return '🏆';
    if (type.includes('DEAL')) return '🤝';
    return '⛺';
  };

  return (
    <div className="min-h-screen bg-village-bg">
      <div className="village-gradient text-white px-6 py-4 flex items-center gap-3">
        <Link href="/village/hut" className="text-xl">←</Link>
        <span className="text-2xl">💰</span>
        <div>
          <h1 className="text-xl font-bold">$VLG Wallet</h1>
          <p className="text-blue-100 text-xs">village Token · Phase 1 Points</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Balance card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="village-gradient rounded-3xl p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-blue-200 text-xs">Total Balance</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-5xl font-bold">{totalVlg.toFixed(2)}</span>
                <span className="text-blue-200 text-xl">$VLG</span>
              </div>
            </div>
            {profile?.is_founding_villager && (
              <div className="bg-white/20 rounded-2xl px-3 py-2 text-center">
                <p className="text-xs text-blue-100">Founding</p>
                <p className="text-lg">👑</p>
                <p className="text-xs text-blue-100">Villager</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 mt-5">
            <div className="bg-white/10 rounded-2xl p-3">
              <p className="text-blue-200 text-xs">Total Earned</p>
              <p className="font-bold">{parseFloat(wallet?.total_earned_vlg ?? 0).toFixed(2)}</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-3">
              <p className="text-blue-200 text-xs">Score</p>
              <p className="font-bold">{profile?.village_score ?? 0}</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-3">
              <p className="text-blue-200 text-xs">Tier</p>
              <p className="font-bold text-sm">{tier.label.split(' ')[1]}</p>
            </div>
          </div>
        </motion.div>

        {/* Phase info */}
        <div className="village-card border border-amber-200 bg-amber-50">
          <div className="flex gap-3">
            <span className="text-2xl">⏳</span>
            <div>
              <p className="font-bold text-amber-800">Phase 1 — Points Mode</p>
              <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                $VLG is a non-tradeable points system until Phase 3 (50,000+ villagers). Every VLG you earn now converts to real tradeable $VLG tokens at Phase 3 — founding villagers get a 500 VLG bonus airdrop on top.
              </p>
            </div>
          </div>
        </div>

        {/* How to earn */}
        <div className="village-card">
          <h2 className="font-bold mb-3">How to Earn $VLG</h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: '📍', action: 'Complete a goal step', vlg: '+10' },
              { icon: '✊', action: 'Give an OoWop', vlg: '+7' },
              { icon: '✊', action: 'Receive an OoWop', vlg: '+10' },
              { icon: '🧘', action: 'Daily Mindful Moment', vlg: '+5' },
              { icon: '✨', action: 'Post on Dream Line', vlg: '+10' },
              { icon: '👥', action: 'Refer a villager', vlg: '+100' },
              { icon: '🥇', action: 'Complete a goal (Gold)', vlg: '+200' },
              { icon: '🏆', action: 'Earn Platinum', vlg: '+500' },
            ].map(item => (
              <div key={item.action} className="flex items-center gap-2 py-1.5">
                <span className="text-lg">{item.icon}</span>
                <div className="flex-1">
                  <p className="text-xs text-gray-600">{item.action}</p>
                </div>
                <span className="text-xs font-bold text-green-600">{item.vlg}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction history */}
        <div className="village-card">
          <h2 className="font-bold mb-3">Transaction History</h2>
          {txns.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-4">No transactions yet. Start completing goals to earn $VLG!</p>
          ) : (
            <div className="space-y-2">
              {txns.map(t => (
                <div key={t.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <span className="text-xl">{txnIcon(t.transaction_type ?? t.description ?? '')}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{t.description || t.transaction_type?.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-gray-400">{new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <span className={`font-bold text-sm ${t.direction === 'credit' ? 'text-green-600' : 'text-red-500'}`}>
                    {t.direction === 'credit' ? '+' : '-'}{parseFloat(t.amount ?? 0).toFixed(2)} {t.token_type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
