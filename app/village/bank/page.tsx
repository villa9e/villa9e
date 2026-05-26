'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { getScoreTier } from '@/lib/village/score';
import { PlaidConnect } from '@/components/bank/PlaidConnect';
import { VillageHeader } from '@/components/village/VillageHeader';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { VillageSound } from '@/lib/sounds/village';

type BankTab = 'wallet' | 'earn' | 'fund' | 'credit';

const TIER_THRESHOLDS = [
  { tier: 'seedling', label: 'Seedling', min: 0,    max: 99,   color: '#86EFAC', perks: ['Village access', 'Dream Line posting', 'Goal GPS (3 goals)'] },
  { tier: 'grower',   label: 'Grower',   min: 100,  max: 499,  color: '#4ADE80', perks: ['5 active goals', 'Trading Post', 'Tribe creation'] },
  { tier: 'builder',  label: 'Builder',  min: 500,  max: 999,  color: '#1877F2', perks: ['Unlimited goals', 'Creator Studio', 'Priority Dream Line'] },
  { tier: 'elder',    label: 'Elder',    min: 1000, max: 4999, color: '#8B5CF6', perks: ['Village credit line', 'Accredited investor match', 'Score multiplier 1.5×'] },
  { tier: 'legend',   label: 'Legend',   min: 5000, max: Infinity, color: '#FFD700', perks: ['Everything', '$VLG bonus at Phase 3', 'Founding status'] },
];

const HOW_TO_EARN = [
  { action: 'Complete a GPS step',    vlg: 10,  icon: '📍' },
  { action: 'Get 3 OoWops (validated)',vlg: 30, icon: '✊' },
  { action: 'Give an OoWop',          vlg: 5,   icon: '✊' },
  { action: 'Post to Dream Line',     vlg: 5,   icon: '✨' },
  { action: 'Daily mindful moment',   vlg: 5,   icon: '🧘' },
  { action: 'Refer a villager',       vlg: 50,  icon: '🤝' },
  { action: 'Complete a goal',        vlg: 200, icon: '🏆' },
];

export default function BankPage() {
  const [wallet, setWallet]   = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [txns, setTxns]       = useState<any[]>([]);
  const [dataLocker, setDataLocker] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<BankTab>('wallet');
  const [newTxn, setNewTxn]   = useState<any>(null); // for real-time animation
  const supabase = createClient();
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';

  const bg       = isNight ? '#0A0B12' : '#FFFBF0';
  const cardBg   = isNight ? '#12152A' : '#FFFFFF';
  const border   = isNight ? '#1E2240' : '#FDE68A';
  const textMain = isNight ? '#F0EBE0' : '#2D1F0E';
  const textMute = isNight ? '#4A4F72' : '#8B6F47';
  const accent   = isNight ? '#FFB84D' : '#D97706';

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [{ data: w }, { data: p }, { data: tx }, { data: dl }] = await Promise.all([
      (supabase as any).from('village_wallets').select('*').eq('user_id', user.id).single(),
      (supabase as any).from('profiles').select('village_score,score_tier,score_multiplier,is_founding_villager').eq('id', user.id).single(),
      (supabase as any).from('wallet_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(25),
      (supabase as any).from('data_locker_settings').select('*').eq('user_id', user.id).single(),
    ]);

    setWallet(w); setProfile(p); setTxns(tx ?? []); setDataLocker(dl);

    // Realtime: watch for new transactions
    const channel = supabase.channel(`wallet_${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'wallet_transactions', filter: `user_id=eq.${user.id}` }, p => {
        const tx = p.new as any;
        setTxns(prev => [tx, ...prev]);
        setNewTxn(tx);
        VillageSound.stepComplete();
        setWallet((w: any) => w ? { ...w, vlg_balance: parseFloat(w.vlg_balance) + (tx.direction === 'credit' ? parseFloat(tx.amount) : -parseFloat(tx.amount)) } : w);
        setTimeout(() => setNewTxn(null), 3000);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }

  const tier = getScoreTier(profile?.village_score ?? 0);
  const score = profile?.village_score ?? 0;
  const currentTierData = TIER_THRESHOLDS.find(t => score >= t.min && score <= t.max) ?? TIER_THRESHOLDS[0];
  const nextTierData = TIER_THRESHOLDS[TIER_THRESHOLDS.indexOf(currentTierData) + 1];
  const tierPct = nextTierData ? Math.round(((score - currentTierData.min) / (nextTierData.min - currentTierData.min)) * 100) : 100;

  const vlg = parseFloat(wallet?.vlg_balance ?? 0);
  const vlgDisplay = vlg >= 1000 ? `${(vlg / 1000).toFixed(2)}K` : vlg.toFixed(2);

  const TABS: [BankTab, string, string][] = [
    ['wallet', '💰', 'Wallet'],
    ['earn',   '📈', 'Earn VLG'],
    ['fund',   '🤝', 'Fund Goals'],
    ['credit', '🏦', 'Credit'],
  ];

  return (
    <div className="min-h-screen" style={{ background: bg }}>
      {isNight && (
        <div className="fixed inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,184,77,0.05) 0%, transparent 60%)' }} />
      )}

      <VillageHeader title="village Bank" subtitle="Wallet · Funding · Credit" icon="🏦"
        accentColor={isNight ? '#92400E' : '#D97706'} />

      {/* New transaction toast */}
      <AnimatePresence>
        {newTxn && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg text-sm font-bold"
            style={{ background: '#16A34A', color: '#fff' }}>
            +{parseFloat(newTxn.amount).toFixed(2)} {newTxn.token_type} earned ✓
          </motion.div>
        )}
      </AnimatePresence>

      {/* VLG Hero card */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl p-6 relative overflow-hidden mb-4"
          style={{ background: isNight ? 'linear-gradient(135deg, #1A1200, #2D1F00)' : 'linear-gradient(135deg, #F59E0B, #FBBF24, #FCD34D)' }}>
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-20 pointer-events-none"
            style={{ background: accent, filter: 'blur(50px)', transform: 'translate(30%, -30%)' }} />
          <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-1" style={{ color: isNight ? '#FFB84D' : '#78350F' }}>
            $VLG Balance · Phase 1 Points
          </p>
          <motion.div
            key={vlgDisplay}
            initial={{ scale: 1.1, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-baseline gap-2"
          >
            <span className="text-5xl font-black" style={{ color: isNight ? '#FFB84D' : '#fff' }}>{vlgDisplay}</span>
            <span className="text-xl opacity-70" style={{ color: isNight ? '#FFB84D' : '#fff' }}>$VLG</span>
          </motion.div>
          <p className="text-xs mt-2 opacity-50" style={{ color: isNight ? '#FFB84D' : '#fff' }}>
            Converts to real $VLG at Phase 3 (50k+ villagers)
          </p>
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[
              { label: 'Total Earned', value: `${parseFloat(wallet?.total_earned_vlg ?? 0).toFixed(0)} VLG` },
              { label: 'Data Earnings', value: `$${parseFloat(wallet?.total_data_earnings ?? 0).toFixed(2)}` },
              { label: 'Score', value: `${score} pts` },
            ].map(s => (
              <div key={s.label} className="rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.12)' }}>
                <p className="text-xs opacity-60" style={{ color: isNight ? '#FFB84D' : '#fff' }}>{s.label}</p>
                <p className="font-black" style={{ color: isNight ? '#FFB84D' : '#fff' }}>{s.value}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Tab bar */}
        <div className="flex rounded-2xl overflow-hidden mb-4" style={{ background: cardBg, border: `1px solid ${border}` }}>
          {TABS.map(([tab, icon, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="flex-1 py-3 text-sm font-bold transition-all flex flex-col items-center gap-0.5"
              style={{
                background: activeTab === tab ? accent : 'transparent',
                color:      activeTab === tab ? '#fff' : textMute,
              }}>
              <span>{icon}</span>
              <span className="text-xs">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-8 space-y-3">

        {/* WALLET TAB */}
        {activeTab === 'wallet' && (
          <>
            {/* Plaid */}
            <div className="rounded-2xl p-4 flex items-start justify-between gap-3"
              style={{ background: isNight ? '#1A1200' : '#FFFBEB', border: `1px solid ${isNight ? '#2D1F00' : '#FDE68A'}` }}>
              <div>
                <p className="font-bold text-sm" style={{ color: textMain }}>Connect Your Bank</p>
                <p className="text-xs mt-0.5" style={{ color: textMute }}>Verify income for goal budgeting. Powered by Plaid.</p>
                {wallet?.plaid_connected && <p className="text-xs mt-1 text-green-500">✓ Bank connected · {wallet.plaid_institution}</p>}
              </div>
              <PlaidConnect onSuccess={() => load()} />
            </div>

            {/* Transaction history */}
            <div className="rounded-2xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${border}` }}>
              <div className="px-4 py-3 border-b" style={{ borderColor: border }}>
                <p className="font-black text-sm" style={{ color: textMain }}>Transaction History</p>
              </div>
              {txns.length === 0 && (
                <div className="text-center py-8" style={{ color: textMute }}>
                  <p className="text-2xl mb-2">📊</p>
                  <p className="text-sm">No transactions yet. Complete steps to earn!</p>
                </div>
              )}
              {txns.map((tx, i) => (
                <motion.div key={tx.id}
                  initial={i === 0 ? { background: isNight ? '#1A2D1A' : '#ECFDF5' } : {}}
                  animate={{ background: 'transparent' }}
                  transition={{ duration: 1.5 }}
                  className="flex items-center justify-between px-4 py-3 border-b last:border-0"
                  style={{ borderColor: border }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: textMain }}>
                      {tx.description || tx.transaction_type?.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs" style={{ color: textMute }}>
                      {new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className="font-black text-sm" style={{ color: tx.direction === 'credit' ? '#16A34A' : '#DC2626' }}>
                    {tx.direction === 'credit' ? '+' : '-'}{parseFloat(tx.amount).toFixed(2)} {tx.token_type}
                  </span>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {/* EARN TAB */}
        {activeTab === 'earn' && (
          <>
            <div className="rounded-2xl p-4" style={{ background: cardBg, border: `1px solid ${border}` }}>
              <p className="font-black text-sm mb-3" style={{ color: textMain }}>Ways to Earn $VLG</p>
              <div className="space-y-2">
                {HOW_TO_EARN.map(item => (
                  <div key={item.action} className="flex items-center justify-between py-2 border-b last:border-0"
                    style={{ borderColor: border }}>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{item.icon}</span>
                      <span className="text-sm" style={{ color: textMain }}>{item.action}</span>
                    </div>
                    <span className="font-black text-sm" style={{ color: accent }}>+{item.vlg} VLG</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Data Locker earnings */}
            <div className="rounded-2xl p-4" style={{ background: cardBg, border: `1px solid ${border}` }}>
              <div className="flex items-center justify-between mb-3">
                <p className="font-black text-sm" style={{ color: textMain }}>Data Locker Earnings</p>
                <Link href="/village/hut/data-locker" className="text-xs font-bold" style={{ color: '#1877F2' }}>Manage →</Link>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="rounded-xl p-3 text-center" style={{ background: isNight ? '#0A0B12' : '#FFF8EE' }}>
                  <p className="text-xs" style={{ color: textMute }}>This Month</p>
                  <p className="font-black text-lg" style={{ color: accent }}>
                    ${parseFloat(dataLocker?.monthly_earnings ?? 0).toFixed(2)}
                  </p>
                </div>
                <div className="rounded-xl p-3 text-center" style={{ background: isNight ? '#0A0B12' : '#FFF8EE' }}>
                  <p className="text-xs" style={{ color: textMute }}>Total Earned</p>
                  <p className="font-black text-lg" style={{ color: accent }}>
                    ${parseFloat(dataLocker?.total_earnings ?? 0).toFixed(2)}
                  </p>
                </div>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: textMute }}>
                {dataLocker?.share_goals || dataLocker?.share_behavior
                  ? 'You\'re sharing data — earning from anonymized insights that improve village experiences.'
                  : 'Enable data sharing in your Data Locker to start earning from your anonymized behavioral data.'}
              </p>
            </div>
          </>
        )}

        {/* FUND TAB */}
        {activeTab === 'fund' && (
          <>
            <Link href="/village/bank/crowdfunding">
              <motion.div whileHover={{ scale: 1.01 }} className="rounded-2xl p-5 cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #1877F2, #4F46E5)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-black text-white text-lg">🤝 Crowdfunding</p>
                    <p className="text-blue-200 text-sm mt-0.5">Fund your goal · Back a villager · 0% platform fee</p>
                  </div>
                  <span className="text-3xl text-white/60">›</span>
                </div>
              </motion.div>
            </Link>

            <div className="rounded-2xl p-4" style={{ background: cardBg, border: `1px solid ${border}` }}>
              <p className="font-black text-sm mb-3" style={{ color: textMain }}>Financing Options</p>
              {[
                { icon: '💰', title: 'Self-Fund',        desc: 'Set a personal budget for your goal',           tag: 'Available', available: true },
                { icon: '🤝', title: 'Fundraise',        desc: 'Launch a crowdfunding campaign',                tag: 'Available', available: true },
                { icon: '🏦', title: 'Village Credit',   desc: 'Credit line (Elder tier required)',             tag: score >= 1000 ? 'Eligible ✓' : `${1000 - score} pts needed`, available: score >= 1000 },
                { icon: '📈', title: 'Compound Investing',desc: 'Brokerage — Nebu hedge 7–12%',                  tag: 'Phase 2', available: false },
                { icon: '🧑‍💼', title: 'Accredited Match', desc: 'Match with an investor at Trading Post',       tag: 'Phase 2', available: false },
              ].map(opt => (
                <div key={opt.title} className="flex items-start gap-3 py-3 border-b last:border-0"
                  style={{ borderColor: border, opacity: opt.tag === 'Phase 2' ? 0.5 : 1 }}>
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
                </div>
              ))}
            </div>
          </>
        )}

        {/* CREDIT TAB */}
        {activeTab === 'credit' && (
          <>
            {/* Current tier */}
            <div className="rounded-2xl p-5" style={{ background: cardBg, border: `1px solid ${border}` }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs" style={{ color: textMute }}>Your Tier</p>
                  <p className="font-black text-2xl" style={{ color: currentTierData.color }}>{currentTierData.label}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs" style={{ color: textMute }}>Village Score</p>
                  <p className="font-black text-2xl" style={{ color: '#1877F2' }}>{score}</p>
                </div>
              </div>

              {nextTierData && (
                <>
                  <div className="flex justify-between text-xs mb-1" style={{ color: textMute }}>
                    <span>{currentTierData.label}</span>
                    <span>{nextTierData.label} at {nextTierData.min} pts</span>
                  </div>
                  <div className="h-3 rounded-full overflow-hidden mb-2" style={{ background: isNight ? '#1E2240' : '#FDE68A' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${tierPct}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, ${currentTierData.color}, ${nextTierData.color})` }} />
                  </div>
                  <p className="text-xs" style={{ color: textMute }}>
                    {nextTierData.min - score} pts to {nextTierData.label} · {tierPct}% there
                  </p>
                </>
              )}
            </div>

            {/* Tier progression */}
            <div className="rounded-2xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${border}` }}>
              <div className="px-4 py-3 border-b" style={{ borderColor: border }}>
                <p className="font-black text-sm" style={{ color: textMain }}>All Tiers & Perks</p>
              </div>
              {TIER_THRESHOLDS.map(t => {
                const isActive = t.tier === currentTierData.tier;
                const isUnlocked = score >= t.min;
                return (
                  <div key={t.tier} className="flex items-start gap-3 px-4 py-3 border-b last:border-0"
                    style={{ borderColor: border, opacity: isUnlocked ? 1 : 0.4 }}>
                    <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ background: t.color }} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm" style={{ color: isActive ? t.color : textMain }}>{t.label}</p>
                        {isActive && <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: t.color + '20', color: t.color }}>Current</span>}
                        <span className="text-xs ml-auto" style={{ color: textMute }}>{t.min}+ pts</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {t.perks.map(perk => (
                          <span key={perk} className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: isNight ? '#1E2240' : '#F3F4F6', color: isUnlocked ? textMain : textMute }}>
                            {isUnlocked ? '✓' : '○'} {perk}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
