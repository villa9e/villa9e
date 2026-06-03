'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { BackButton } from '@/components/village/BackButton';

const EVENT_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  OOWOP:         { icon: '✊', label: 'OoWop',          color: '#7C3AED' },
  GOAL_COMPLETE: { icon: '🏆', label: 'Goal Complete',  color: '#F59E0B' },
  DEAL:          { icon: '🤝', label: 'Deal',           color: '#059669' },
  DATA_CONSENT:  { icon: '🔐', label: 'Data Consent',  color: '#1877F2' },
  CHECKIN:       { icon: '🌿', label: 'Check-In',       color: '#22C55E' },
  EARN:          { icon: '🪙', label: 'ViCo Earned',    color: '#F59E0B' },
  TRANSFER:      { icon: '↗️', label: 'Transfer',       color: '#6366F1' },
};

export default function BlockchainPage() {
  const [entries, setEntries]   = useState<any[]>([]);
  const [stats, setStats]       = useState<any>({});
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('ALL');
  const [walletInput, setWalletInput] = useState('');
  const [linking, setLinking]   = useState(false);
  const [linked, setLinked]     = useState(false);
  const [myWallet, setMyWallet] = useState('');
  const supabase = createClient();
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';

  const bg     = isNight ? 'var(--v-bg)' : '#F8FAFF';
  const cardBg = isNight ? '#0D1020' : '#FFFFFF';
  const border = isNight ? '#1A1F3A' : '#E0E7FF';
  const text   = isNight ? '#F0EBE0' : '#1E1B4B';
  const muted  = isNight ? '#4A4F72' : '#6B7280';

  useEffect(() => { load(); }, [filter]);

  async function load() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    let q = (supabase as any).from('blockchain_ledger').select('*').order('entry_index', { ascending: false }).limit(50);
    if (filter !== 'ALL') q = q.eq('event_type', filter);
    const { data } = await q;
    setEntries(data ?? []);

    const [
      { count: total },
      { count: oowops },
      { count: goals },
      { count: deals },
    ] = await Promise.all([
      (supabase as any).from('blockchain_ledger').select('id', { count: 'exact', head: true }),
      (supabase as any).from('blockchain_ledger').select('id', { count: 'exact', head: true }).eq('event_type', 'OOWOP'),
      (supabase as any).from('blockchain_ledger').select('id', { count: 'exact', head: true }).eq('event_type', 'GOAL_COMPLETE'),
      (supabase as any).from('blockchain_ledger').select('id', { count: 'exact', head: true }).eq('event_type', 'DEAL'),
    ]);
    setStats({ total, oowops, goals, deals });

    if (user) {
      const { data: w } = await (supabase as any).from('user_wallets').select('wallet_address').eq('user_id', user.id).single();
      if (w?.wallet_address) setMyWallet(w.wallet_address);
    }

    setLoading(false);
  }

  async function linkWallet() {
    if (!walletInput.match(/^0x[a-fA-F0-9]{40}$/) || linking) return;
    setLinking(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await (supabase as any).from('user_wallets').upsert({ user_id: user.id, wallet_address: walletInput, wallet_type: 'polygon' });
      setMyWallet(walletInput);
      setLinked(true);
    }
    setLinking(false);
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: bg }}>
      <BackButton to="/village/bank" />

      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 border-b"
        style={{ background: isNight ? 'var(--v-bg)' : '#fff', borderColor: border, paddingTop: 56 }}>
        <div className="flex-1">
          <h1 className="font-black text-base" style={{ color: text }}>Village Blockchain</h1>
          <p className="text-xs" style={{ color: muted }}>$ViCo · Polygon Network · Public Ledger</p>
        </div>
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
          style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
          Live
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Total Txns', val: (stats.total ?? 0).toLocaleString(), color: '#1877F2' },
            { label: 'OoWops',     val: (stats.oowops ?? 0).toLocaleString(), color: '#7C3AED' },
            { label: 'Goals',      val: (stats.goals ?? 0).toLocaleString(), color: '#F59E0B' },
            { label: 'Deals',      val: (stats.deals ?? 0).toLocaleString(), color: '#059669' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-3 text-center" style={{ background: cardBg, border: `1px solid ${border}` }}>
              <p className="text-base font-black" style={{ color: s.color }}>{s.val}</p>
              <p className="text-[10px]" style={{ color: muted }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* ViCo token info */}
        <div className="rounded-2xl p-4 space-y-3"
          style={{ background: 'linear-gradient(135deg,rgba(24,119,242,0.08),rgba(124,58,237,0.08))', border: `1px solid rgba(24,119,242,0.2)` }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-black text-sm" style={{ color: text }}>$ViCo — Villa9e Coin</p>
              <p className="text-xs" style={{ color: muted }}>ERC-20 · Polygon Network · 33M Fixed Supply</p>
            </div>
            <div className="text-right">
              <p className="font-black text-lg" style={{ color: '#1877F2' }}>Phase 1</p>
              <p className="text-xs" style={{ color: muted }}>Points → Token at $10K MRR</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: 'Community Mining', pct: '40%', color: '#1877F2' },
              { label: 'Ecosystem',        pct: '25%', color: '#7C3AED' },
              { label: 'Team + Reserve',   pct: '35%', color: '#F59E0B' },
            ].map(t => (
              <div key={t.label} className="rounded-xl p-2" style={{ background: isNight ? '#0D1020' : '#fff' }}>
                <p className="font-black text-sm" style={{ color: t.color }}>{t.pct}</p>
                <p className="text-xs" style={{ color: muted }}>{t.label}</p>
              </div>
            ))}
          </div>

          {/* Burn stats */}
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '10px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 14 }}>🔥</span>
              <span style={{ fontSize: 11, fontWeight: 900, color: '#EF4444', letterSpacing: '0.06em' }}>WEEKLY BUYBACK-AND-BURN</span>
            </div>
            <p style={{ fontSize: 12, color: muted }}>20% of all platform revenue automatically buys and burns $ViCo every Sunday. <Link href="/village/bank/blockchain/burn" style={{ color: '#1877F2', fontWeight: 700 }}>View burn dashboard →</Link></p>
          </div>

          <a href="https://polygonscan.com" target="_blank" rel="noopener noreferrer"
            className="text-xs font-bold" style={{ color: '#1877F2', textDecoration: 'none' }}>
            View on PolygonScan → (contract address TBD at Phase 3)
          </a>
        </div>

        {/* Link wallet */}
        <div className="rounded-2xl p-4 space-y-3" style={{ background: cardBg, border: `1px solid ${border}` }}>
          <p className="font-bold text-sm" style={{ color: text }}>🔗 Link Your Wallet</p>
          <p className="text-xs" style={{ color: muted }}>
            Link a Polygon/Ethereum wallet to receive $ViCo when Phase 1 launches.
            {myWallet && <span style={{ color: '#22C55E' }}> ✓ Linked: {myWallet.slice(0, 6)}…{myWallet.slice(-4)}</span>}
          </p>
          {!myWallet && (
            <div className="flex gap-2">
              <input value={walletInput} onChange={e => setWalletInput(e.target.value)}
                placeholder="0x... (Polygon/Ethereum address)"
                className="flex-1 rounded-xl px-3 py-2.5 text-xs font-mono focus:outline-none"
                style={{ background: isNight ? 'var(--v-bg)' : '#F8FAFF', border: `1px solid ${border}`, color: text }} />
              <button onClick={linkWallet} disabled={linking || linked}
                className="px-4 rounded-xl text-xs font-bold text-white disabled:opacity-50"
                style={{ background: '#1877F2' }}>
                {linking ? '…' : linked ? '✓' : 'Link'}
              </button>
            </div>
          )}
        </div>

        {/* VLG → ViCo conversion shortcut */}
        <Link href="/village/bank/vico-convert" style={{ display: 'block', textDecoration: 'none' }}>
          <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg,#1877F2,#7C3AED)' }}>
            <p className="font-black text-white text-sm mb-1">Convert $VLG → $ViCo</p>
            <p className="text-xs text-white/70">Phase 1: 10,000 $VLG = 100 $ViCo. Rate halves each phase.</p>
          </div>
        </Link>

        {/* Event filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
          {['ALL', ...Object.keys(EVENT_CONFIG)].map(ev => (
            <button key={ev} onClick={() => setFilter(ev)}
              className="flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-full transition-all"
              style={{
                background: filter === ev ? '#1877F2' : (isNight ? 'rgba(255,255,255,0.06)' : '#EEF2FF'),
                color:      filter === ev ? '#fff' : muted,
              }}>
              {ev === 'ALL' ? 'All Events' : EVENT_CONFIG[ev]?.icon + ' ' + EVENT_CONFIG[ev]?.label}
            </button>
          ))}
        </div>

        {/* Ledger */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: muted }}>
            Public Ledger — {loading ? '…' : `${entries.length} shown`}
          </p>
          <div className="space-y-2">
            {entries.map((entry, i) => {
              const ec = EVENT_CONFIG[entry.event_type] ?? { icon: '📌', label: entry.event_type, color: '#6B7280' };
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="rounded-2xl p-3 space-y-1.5"
                  style={{ background: cardBg, border: `1px solid ${border}` }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{ec.icon}</span>
                    <span className="text-xs font-bold flex-1" style={{ color: ec.color }}>{ec.label}</span>
                    {entry.amount_vlg > 0 && (
                      <span className="text-xs font-black" style={{ color: '#F59E0B' }}>+{entry.amount_vlg} VLG</span>
                    )}
                    <span className="text-xs" style={{ color: muted }}>#{entry.entry_index}</span>
                  </div>
                  <p className="text-xs font-mono break-all" style={{ color: muted }}>
                    Hash: {entry.block_hash?.slice(0, 16)}…{entry.block_hash?.slice(-8)}
                  </p>
                  <p className="text-xs" style={{ color: muted }}>
                    {new Date(entry.created_at).toLocaleString()}
                    {entry.on_chain_tx && <span style={{ color: '#1877F2' }}> · On-chain ✓</span>}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {!loading && entries.length === 0 && (
            <div className="text-center py-12" style={{ color: muted }}>
              <p className="text-4xl mb-3">⛓️</p>
              <p className="font-bold" style={{ color: text }}>No entries yet</p>
              <p className="text-xs mt-1">The ledger records every OoWop, goal, deal, and data consent.</p>
            </div>
          )}
        </div>

        {/* Deployment roadmap */}
        <div className="rounded-2xl p-4 space-y-2 text-xs" style={{ background: cardBg, border: `1px solid ${border}` }}>
          <p className="font-bold" style={{ color: text }}>ViCo Deployment Roadmap</p>
          {[
            { phase: '0 (Now)',    status: '✅', desc: 'Supabase ledger with SHA-256 chaining — tamper-evident. $VLG points accumulating.' },
            { phase: '1 ($10K MRR)', status: '🔄', desc: 'Deploy ViCo smart contracts to Polygon. Open $VLG → $ViCo conversions.' },
            { phase: '2 (Beta)',  status: '⏳', desc: 'Staking tiers, governance proposals, DAO voting for Village Elders.' },
            { phase: '3 ($1M MRR)',status: '⏳', desc: 'Village Chain launch (Cosmos SDK). Migrate from Polygon. Exchange listings.' },
          ].map(r => (
            <div key={r.phase} className="flex items-start gap-2">
              <span>{r.status}</span>
              <div>
                <span className="font-semibold" style={{ color: text }}>Phase {r.phase}: </span>
                <span style={{ color: muted }}>{r.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
