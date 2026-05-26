'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { getScoreTier } from '@/lib/village/score';
import { PlaidConnect } from '@/components/bank/PlaidConnect';
import { VillageHeader } from '@/components/village/VillageHeader';
import { useVillageTheme, useThemeTokens } from '@/lib/theme/useVillageTheme';

export default function BankPage() {
  const [wallet, setWallet]   = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [txns, setTxns]       = useState<any[]>([]);
  const supabase = createClient();
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data: w }, { data: p }, { data: tx }] = await Promise.all([
        (supabase as any).from('village_wallets').select('*').eq('user_id', user.id).single(),
        (supabase as any).from('profiles').select('village_score,score_tier').eq('id', user.id).single(),
        (supabase as any).from('wallet_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
      ]);
      setWallet(w); setProfile(p); setTxns(tx ?? []);
    }
    load();
  }, []);

  const tier = getScoreTier(profile?.village_score ?? 0);

  const bg       = isNight ? '#0A0B12'  : '#FFFBF0';
  const cardBg   = isNight ? '#12152A'  : '#FFFFFF';
  const border   = isNight ? '#1E2240'  : '#FDE68A';
  const textMain = isNight ? '#F0EBE0'  : '#2D1F0E';
  const textMute = isNight ? '#4A4F72'  : '#8B6F47';
  const accentDay   = '#F59E0B';
  const accentNight = '#FFB84D';
  const accent = isNight ? accentNight : accentDay;

  const cardStyle = (borderOverride?: string): React.CSSProperties => ({
    background: cardBg,
    border: `1px solid ${borderOverride ?? border}`,
    borderRadius: '20px',
    padding: '16px',
  });

  const FINANCING_OPTIONS = [
    { icon: '💰', title: 'Self-Fund',          desc: 'Set a personal budget for your goal',                           tag: 'Available',   available: true },
    { icon: '🤝', title: 'Fundraise',           desc: 'Launch a public crowdfunding campaign',                         tag: 'Available',   available: true },
    { icon: '🏦', title: 'village Financing',   desc: 'Apply for a line of credit (requires Elder tier)',             tag: (profile?.village_score ?? 0) >= 1000 ? 'Eligible' : 'Elder required', available: (profile?.village_score ?? 0) >= 1000 },
    { icon: '📈', title: 'Compound Investing',  desc: 'Open a brokerage — Zero Risk to Nebu hedge (7–12%)',          tag: 'Phase 2',     available: false },
    { icon: '🧑‍💼', title: 'Accredited Investor', desc: 'Get matched with an investor at the Trading Post',            tag: 'Phase 2',     available: false },
  ];

  return (
    <div className="min-h-screen" style={{ background: bg }}>
      {isNight && (
        <div className="fixed inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,184,77,0.06) 0%, transparent 60%)' }} />
      )}

      <VillageHeader title="village Bank" subtitle="Wallet · Funding · Investing" icon="🏦" accentColor={isNight ? '#92400E' : '#D97706'} />

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* VLG Wallet hero */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl p-6 relative overflow-hidden"
          style={{ background: isNight ? 'linear-gradient(135deg, #1A1200 0%, #2D1F00 100%)' : 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 60%, #FCD34D 100%)' }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20"
            style={{ background: accent, filter: 'blur(40px)', transform: 'translate(30%, -30%)' }} />
          <p className="text-xs font-bold uppercase tracking-widest mb-1 opacity-70" style={{ color: isNight ? '#FFB84D' : '#78350F' }}>
            village Wallet · Phase 1 Points
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-4xl font-black" style={{ color: isNight ? '#FFB84D' : '#FFFFFF' }}>
              {parseFloat(wallet?.vlg_balance ?? 0).toFixed(2)}
            </span>
            <span className="text-lg opacity-70" style={{ color: isNight ? '#FFB84D' : '#fff' }}>$VLG</span>
          </div>
          <p className="text-xs mt-2 opacity-60" style={{ color: isNight ? '#FFB84D' : '#fff' }}>
            Converts to real tradeable $VLG at Phase 3 (50k+ villagers)
          </p>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <p className="text-xs opacity-70" style={{ color: isNight ? '#FFB84D' : '#fff' }}>Total Earned</p>
              <p className="font-bold" style={{ color: isNight ? '#FFB84D' : '#fff' }}>
                {parseFloat(wallet?.total_earned_vlg ?? 0).toFixed(2)} VLG
              </p>
            </div>
            <div className="rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <p className="text-xs opacity-70" style={{ color: isNight ? '#FFB84D' : '#fff' }}>Data Earnings</p>
              <p className="font-bold" style={{ color: isNight ? '#FFB84D' : '#fff' }}>
                ${parseFloat(wallet?.total_data_earnings ?? 0).toFixed(2)}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Plaid bank connect */}
        <div style={{ ...cardStyle(isNight ? '#2D1F00' : '#FDE68A'), background: isNight ? '#1A1200' : '#FFFBEB' }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-bold text-sm" style={{ color: textMain }}>Connect Your Bank</p>
              <p className="text-xs mt-0.5" style={{ color: textMute }}>Verify income and check balance for goal budgeting. Powered by Plaid.</p>
            </div>
            <PlaidConnect onSuccess={(inst) => console.log('Connected:', inst)} />
          </div>
        </div>

        {/* Village score tier */}
        <div style={cardStyle()}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs" style={{ color: textMute }}>village Score Tier</p>
              <p className="font-black text-lg" style={{ color: accent }}>{tier.label}</p>
            </div>
            <div className="text-right">
              <p className="text-xs" style={{ color: textMute }}>Score</p>
              <p className="text-2xl font-black" style={{ color: '#1877F2' }}>{profile?.village_score ?? 0}</p>
            </div>
          </div>
          <div className="mt-3 text-xs space-y-1" style={{ color: textMute }}>
            <p>🏦 Credit line at: <span style={{ color: textMain, fontWeight: 600 }}>Elder tier (1,000 pts)</span></p>
            <p>📉 Higher score = lower interest rate</p>
          </div>
        </div>

        {/* Crowdfunding banner */}
        <Link href="/village/bank/crowdfunding">
          <motion.div whileHover={{ scale: 1.01 }} className="rounded-2xl p-4 cursor-pointer flex items-center justify-between"
            style={{ background: 'linear-gradient(135deg, #1877F2 0%, #4F46E5 100%)' }}>
            <div>
              <p className="font-bold text-white">🤝 Crowdfunding</p>
              <p className="text-xs text-blue-200 mt-0.5">Fund your goal · Back a villager · 0% platform fee</p>
            </div>
            <span className="text-3xl text-white/60">›</span>
          </motion.div>
        </Link>

        {/* Financing options */}
        <div>
          <h2 className="font-black mb-3" style={{ color: textMain }}>Financing Options</h2>
          <div className="space-y-2.5">
            {FINANCING_OPTIONS.map((opt, i) => (
              <motion.div key={opt.title} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                className="flex items-start gap-3 rounded-2xl p-4"
                style={{
                  background: cardBg,
                  border: `1px solid ${opt.available ? (isNight ? '#2D1F00' : '#FDE68A') : border}`,
                  opacity: opt.tag === 'Phase 2' ? 0.6 : 1,
                }}>
                <span className="text-2xl">{opt.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm" style={{ color: textMain }}>{opt.title}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: opt.available ? (isNight ? '#2D1F00' : '#FEF9C3') : (isNight ? '#1E2240' : '#F3F4F6'), color: opt.available ? accent : textMute }}>
                      {opt.tag}
                    </span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: textMute }}>{opt.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Transaction history */}
        {txns.length > 0 && (
          <div style={cardStyle()}>
            <h2 className="font-black mb-3" style={{ color: textMain }}>Recent Transactions</h2>
            <div className="space-y-2">
              {txns.map(tx => (
                <div key={tx.id} className="flex items-center justify-between py-2"
                  style={{ borderBottom: `1px solid ${border}` }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: textMain }}>{tx.description || tx.transaction_type}</p>
                    <p className="text-xs" style={{ color: textMute }}>{new Date(tx.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className="font-bold text-sm" style={{ color: tx.direction === 'credit' ? '#16A34A' : '#DC2626' }}>
                    {tx.direction === 'credit' ? '+' : '-'}{parseFloat(tx.amount).toFixed(2)} {tx.token_type}
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
