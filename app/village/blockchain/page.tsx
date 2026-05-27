'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';

const EVENT_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  OOWOP:         { icon: '✊', label: 'OoWop',          color: '#7C3AED' },
  GOAL_COMPLETE: { icon: '🏆', label: 'Goal Complete',  color: '#F59E0B' },
  DEAL:          { icon: '🤝', label: 'Deal',           color: '#059669' },
  DATA_CONSENT:  { icon: '🔐', label: 'Data Consent',  color: '#1877F2' },
  CHECKIN:       { icon: '🌿', label: 'Check-In',       color: '#22C55E' },
  EARN:          { icon: '🪙', label: 'VLG Earned',     color: '#F59E0B' },
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

  const bg     = isNight ? '#060810' : '#F8FAFF';
  const cardBg = isNight ? '#0D1020' : '#FFFFFF';
  const border = isNight ? '#1A1F3A' : '#E0E7FF';
  const text   = isNight ? '#F0EBE0' : '#1E1B4B';
  const muted  = isNight ? '#4A4F72' : '#6B7280';

  useEffect(() => {
    load();
  }, [filter]);

  async function load() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    // Load ledger entries
    let q = (supabase as any).from('blockchain_ledger').select('*').order('entry_index', { ascending: false }).limit(50);
    if (filter !== 'ALL') q = q.eq('event_type', filter);
    const { data } = await q;
    setEntries(data ?? []);

    // Load stats
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

    // Load user's linked wallet
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
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 border-b"
        style={{ background: isNight ? '#060810' : '#fff', borderColor: border }}>
        <Link href="/village/hut/vlg-wallet" className="text-xl" style={{ color: muted }}>←</Link>
        <div className="flex-1">
          <h1 className="font-black text-base" style={{ color: text }}>Village Blockchain</h1>
          <p className="text-xs" style={{ color: muted }}>$VLG · Polygon Network · Public Ledger</p>
        </div>
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
          style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
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

        {/* Token info */}
        <div className="rounded-2xl p-4 space-y-3"
          style={{ background: 'linear-gradient(135deg,rgba(24,119,242,0.08),rgba(124,58,237,0.08))', border: `1px solid rgba(24,119,242,0.2)` }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-black text-sm" style={{ color: text }}>$VLG — Village Token</p>
              <p className="text-xs" style={{ color: muted }}>ERC-20 · Polygon Network · 100M Max Supply</p>
            </div>
            <div className="text-right">
              <p className="font-black text-lg" style={{ color: '#1877F2' }}>Phase 1</p>
              <p className="text-xs" style={{ color: muted }}>Points → Token at 50K users</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: 'Community Pool', pct: '60%', color: '#1877F2' },
              { label: 'Ecosystem',      pct: '20%', color: '#7C3AED' },
              { label: 'Team + Foundation', pct: '20%', color: '#F59E0B' },
            ].map(t => (
              <div key={t.label} className="rounded-xl p-2" style={{ background: isNight ? '#0D1020' : '#fff' }}>
                <p className="font-black text-sm" style={{ color: t.color }}>{t.pct}</p>
                <p className="text-xs" style={{ color: muted }}>{t.label}</p>
              </div>
            ))}
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
            Link a Polygon/Ethereum wallet to receive $VLG when Phase 3 launches.
            {myWallet && <span style={{ color: '#22C55E' }}> ✓ Linked: {myWallet.slice(0, 6)}…{myWallet.slice(-4)}</span>}
          </p>
          {!myWallet && (
            <div className="flex gap-2">
              <input value={walletInput} onChange={e => setWalletInput(e.target.value)}
                placeholder="0x... (Polygon/Ethereum address)"
                className="flex-1 rounded-xl px-3 py-2.5 text-xs font-mono focus:outline-none"
                style={{ background: isNight ? '#0A0B12' : '#F8FAFF', border: `1px solid ${border}`, color: text }} />
              <button onClick={linkWallet} disabled={linking || linked}
                className="px-4 rounded-xl text-xs font-bold text-white disabled:opacity-50"
                style={{ background: '#1877F2' }}>
                {linking ? '…' : linked ? '✓' : 'Link'}
              </button>
            </div>
          )}
        </div>

        {/* Event filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
          {['ALL', ...Object.keys(EVENT_CONFIG)].map(ev => (
            <button key={ev} onClick={() => setFilter(ev)}
              className="flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-full transition-all"
              style={{
                background: filter === ev ? '#1877F2' : (isNight ? '#1E2240' : '#EEF2FF'),
                color:      filter === ev ? '#fff' : muted,
              }}>
              {ev === 'ALL' ? 'All Events' : EVENT_CONFIG[ev]?.icon + ' ' + EVENT_CONFIG[ev]?.label}
            </button>
          ))}
        </div>

        {/* Ledger */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: muted }}>
            Recent Ledger Entries — {loading ? '…' : `${entries.length} shown`}
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
                    <span className="text-xs" style={{ color: muted }}>
                      #{entry.entry_index}
                    </span>
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

        {/* Deployment info */}
        <div className="rounded-2xl p-4 space-y-2 text-xs" style={{ background: cardBg, border: `1px solid ${border}` }}>
          <p className="font-bold" style={{ color: text }}>Deployment Roadmap</p>
          {[
            { phase: '1 (Now)',   status: '✅', desc: 'Supabase ledger with SHA-256 chaining — tamper-evident' },
            { phase: '2 (Beta)', status: '🔄', desc: 'Deploy VLGToken.sol to Polygon Mumbai testnet' },
            { phase: '3 (50K+)', status: '⏳', desc: 'Mainnet Polygon deployment — full on-chain $VLG' },
            { phase: '4 (Scale)',status: '⏳', desc: 'Exchange listings — CEX + DEX (Uniswap, QuickSwap)' },
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
