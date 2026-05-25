'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { getScoreTier } from '@/lib/village/score';

export default function BankPage() {
  const [wallet, setWallet] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [txns, setTxns] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data: w }, { data: p }, { data: t }] = await Promise.all([
        supabase.from('village_wallets').select('*').eq('user_id', user.id).single(),
        supabase.from('profiles').select('village_score,score_tier').eq('id', user.id).single(),
        supabase.from('wallet_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
      ]);
      setWallet(w); setProfile(p); setTxns(t ?? []);
    }
    load();
  }, []);

  const tier = getScoreTier(profile?.village_score ?? 0);

  const FINANCING_OPTIONS = [
    { icon: '💰', title: 'Self-Fund', desc: 'Set a personal budget for your goal', tag: 'Available', color: 'border-green-200 bg-green-50' },
    { icon: '🤝', title: 'Fundraise', desc: 'Launch a public crowdfunding campaign', tag: 'Available', color: 'border-blue-200 bg-blue-50' },
    { icon: '🏦', title: 'village Financing', desc: 'Apply for a line of credit (requires Elder tier)', tag: (profile?.village_score ?? 0) >= 1000 ? 'Eligible' : 'Elder tier required', color: 'border-purple-200 bg-purple-50' },
    { icon: '📈', title: 'Compound Investing', desc: 'Open a brokerage — Zero Risk to Nebu hedge (7–12%)', tag: 'Phase 2', color: 'border-amber-200 bg-amber-50' },
    { icon: '🧑‍💼', title: 'Accredited Investor', desc: 'Get matched with an accredited investor at the Trading Post', tag: 'Phase 2', color: 'border-indigo-200 bg-indigo-50' },
  ];

  return (
    <div className="min-h-screen bg-village-bg">
      <div className="bg-amber-500 text-white px-6 py-4 flex items-center gap-3">
        <Link href="/village/map" className="text-xl">←</Link>
        <span className="text-2xl">🏦</span>
        <div>
          <h1 className="text-xl font-bold leading-tight">village Bank</h1>
          <p className="text-amber-100 text-xs">Your wallet · Funding · Investing</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* VLG Wallet */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="village-gradient rounded-3xl p-6 text-white">
          <p className="text-blue-200 text-xs font-medium uppercase tracking-wide">village Wallet · Phase 1 Points</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-4xl font-bold">{parseFloat(wallet?.vlg_balance ?? 0).toFixed(2)}</span>
            <span className="text-blue-200 text-lg">$VLG</span>
          </div>
          <p className="text-blue-200 text-xs mt-2">Converts to real tradeable $VLG at Phase 3 (50k+ villagers)</p>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-white/10 rounded-2xl p-3">
              <p className="text-blue-200 text-xs">Total Earned</p>
              <p className="text-white font-bold">{parseFloat(wallet?.total_earned_vlg ?? 0).toFixed(2)} VLG</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-3">
              <p className="text-blue-200 text-xs">Data Earnings</p>
              <p className="text-white font-bold">${parseFloat(wallet?.total_data_earnings ?? 0).toFixed(2)}</p>
            </div>
          </div>
        </motion.div>

        {/* Score tier & credit eligibility */}
        <div className="village-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">village Score Tier</p>
              <p className={`font-bold text-lg ${tier.color}`}>{tier.label}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Score</p>
              <p className="text-2xl font-bold text-village-blue">{profile?.village_score ?? 0}</p>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-500 space-y-1">
            <p>🏦 Credit line available at: <span className="font-medium text-gray-700">Elder tier (1,000 pts)</span></p>
            <p>📉 Higher score = lower credit interest rate</p>
          </div>
        </div>

        {/* Financing options */}
        <div>
          <h2 className="font-bold mb-3">Financing Options</h2>
          <div className="space-y-3">
            {FINANCING_OPTIONS.map((opt, i) => (
              <motion.div key={opt.title} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                className={`village-card border ${opt.color} flex items-start gap-3`}>
                <span className="text-2xl flex-shrink-0">{opt.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm">{opt.title}</p>
                    <span className="text-xs bg-white/80 px-2 py-0.5 rounded-full border">{opt.tag}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Transaction history */}
        {txns.length > 0 && (
          <div className="village-card">
            <h2 className="font-bold mb-3">Recent Transactions</h2>
            <div className="space-y-2">
              {txns.map(t => (
                <div key={t.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{t.description || t.transaction_type}</p>
                    <p className="text-xs text-gray-400">{new Date(t.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`font-bold text-sm ${t.direction === 'credit' ? 'text-green-600' : 'text-red-500'}`}>
                    {t.direction === 'credit' ? '+' : '-'}{parseFloat(t.amount).toFixed(2)} {t.token_type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
