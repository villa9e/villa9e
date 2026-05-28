'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getScoreTier } from '@/lib/village/score';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';

export default function VLGWalletPage() {
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';
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
    return '🏕️';
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

        {/* VLG Redemption — Early Access */}
        {totalVlg >= 500 && (
          <RedeemVLGCard totalVlg={totalVlg} isNight={isNight} />
        )}

        {/* Phase info */}
        <div className="village-card" style={{ borderColor: isNight ? 'rgba(251,191,36,0.2)' : '#fde68a', background: isNight ? 'rgba(251,191,36,0.07)' : '#fffbeb' }}>
          <div className="flex gap-3">
            <span className="text-2xl">⏳</span>
            <div>
              <p className="font-bold" style={{ color: isNight ? '#fbbf24' : '#92400e' }}>Phase 1 — Points Mode</p>
              <p className="text-xs mt-0.5 leading-relaxed" style={{ color: isNight ? '#d97706' : '#b45309' }}>
                $VLG is a non-tradeable points system until Phase 3 (50,000+ villagers). Every VLG you earn now converts to real tradeable $VLG tokens at Phase 3 — founding villagers get a 500 VLG bonus airdrop on top.
              </p>
            </div>
          </div>
        </div>

        {/* How to earn */}
        <div className="village-card">
          <h2 className="font-bold mb-3 village-text">How to Earn $VLG</h2>
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
                  <p className="text-xs village-text-muted">{item.action}</p>
                </div>
                <span className="text-xs font-bold text-green-600">{item.vlg}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction history */}
        <div className="village-card">
          <h2 className="font-bold mb-3 village-text">Transaction History</h2>
          {txns.length === 0 ? (
            <p className="text-center text-sm village-text-sub py-4">No transactions yet. Start completing goals to earn $VLG!</p>
          ) : (
            <div className="space-y-2">
              {txns.map(t => (
                <div key={t.id} className="flex items-center gap-3 py-2 border-b border-[var(--v-card-border)] last:border-0">
                  <span className="text-xl">{txnIcon(t.transaction_type ?? t.description ?? '')}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium village-text">{t.description || t.transaction_type?.replace(/_/g, ' ')}</p>
                    <p className="text-xs village-text-sub">{new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
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

function RedeemVLGCard({ totalVlg, isNight }: { totalVlg: number; isNight: boolean }) {
  const [amount, setAmount]   = useState(500);
  const [email, setEmail]     = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const MIN = 500;
  const RATE = 0.01; // $0.01 per VLG in Phase 1 early access
  const usd = (amount * RATE).toFixed(2);

  async function submit() {
    if (amount < MIN || !email.trim() || submitting) return;
    setSubmitting(true);
    await fetch('/api/vlg/redeem', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, payout_email: email }),
    }).catch(() => {});
    setSubmitting(false);
    setSubmitted(true);
  }

  if (submitted) return (
    <div className="village-card text-center space-y-2 py-6">
      <div className="text-4xl">✅</div>
      <p className="font-bold" style={{ color: isNight ? '#F0EBE0' : '#1E1B4B' }}>Redemption Requested</p>
      <p className="text-xs" style={{ color: isNight ? '#4A4F72' : '#6B7280' }}>
        Your request for ${usd} will be processed within 5–7 business days via PayPal/Stripe.
      </p>
    </div>
  );

  return (
    <div className="village-card space-y-3" style={{ borderColor: '#1877F220' }}>
      <div className="flex items-center gap-2">
        <span className="text-xl">💸</span>
        <div>
          <p className="font-bold text-sm" style={{ color: isNight ? '#F0EBE0' : '#1E1B4B' }}>
            Redeem VLG — Early Access
          </p>
          <p className="text-xs" style={{ color: isNight ? '#4A4F72' : '#6B7280' }}>
            Minimum 500 VLG · Rate: $0.01/VLG in Phase 1
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input type="number" min={MIN} max={Math.floor(totalVlg)} value={amount}
          onChange={e => setAmount(Math.min(Math.floor(totalVlg), Math.max(MIN, parseInt(e.target.value) || MIN)))}
          className="flex-1 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
          style={{ background: isNight ? '#0A0B12' : '#F8FAFF', border: `1px solid ${isNight ? '#1E2240' : '#E0E7FF'}`, color: isNight ? '#F0EBE0' : '#1E1B4B' }} />
        <span className="font-black text-lg" style={{ color: '#1877F2' }}>= ${usd}</span>
      </div>
      <input type="email" placeholder="PayPal or Stripe email for payout" value={email}
        onChange={e => setEmail(e.target.value)}
        className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none"
        style={{ background: isNight ? '#0A0B12' : '#F8FAFF', border: `1px solid ${isNight ? '#1E2240' : '#E0E7FF'}`, color: isNight ? '#F0EBE0' : '#1E1B4B' }} />
      <button onClick={submit} disabled={submitting || amount < MIN || !email.trim()}
        className="w-full py-3 rounded-2xl font-bold text-white text-sm disabled:opacity-50"
        style={{ background: '#1877F2' }}>
        {submitting ? 'Submitting…' : `Request Payout of $${usd}`}
      </button>
      <p className="text-xs text-center" style={{ color: isNight ? '#4A4F72' : '#9CA3AF' }}>
        Full conversion at Phase 3 launch (50K+ villagers). Early access rate may change.
      </p>
    </div>
  );
}
