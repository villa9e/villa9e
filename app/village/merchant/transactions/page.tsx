'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';

// ── Icons ────────────────────────────────────────────────────────────────────
function DownloadIcon() { return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>; }
function FilterIcon() { return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>; }
function RefundIcon() { return <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 10h10a8 8 0 018 8v2M3 10l6 6M3 10l6-6" /></svg>; }
function ExternalIcon() { return <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>; }
function ChevronDownIcon() { return <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>; }


const METHOD_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  qr:      { bg: '#EF9F2722', color: '#EF9F27', label: 'QR' },
  link:    { bg: '#2952E822', color: '#2952E8', label: 'Link' },
  invoice: { bg: '#7C3AED22', color: '#7C3AED', label: 'Invoice' },
  estore:  { bg: '#1D9E7522', color: '#1D9E75', label: 'eStore' },
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  completed: { bg: '#1D9E7522', color: '#1D9E75' },
  pending:   { bg: '#EF9F2722', color: '#EF9F27' },
  refunded:  { bg: '#E0505022', color: '#E05050' },
  failed:    { bg: '#88888822', color: '#888888' },
};

export default function MerchantTransactionsPage() {
  const isNight = useVillageTheme(s => s.theme) === 'night';
  const supabase = createClient();
  const [allTxs, setAllTxs] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filterMethod, setFilterMethod] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMinAmount, setFilterMinAmount] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: acct } = await (supabase as any).from('merchant_accounts').select('id').eq('user_id', user.id).maybeSingle();
      if (!acct) return;
      const { data: rows } = await (supabase as any)
        .from('merchant_transactions').select('*').eq('merchant_id', acct.id)
        .order('created_at', { ascending: false }).limit(500);
      setAllTxs((rows ?? []).map((t: any) => ({
        id: t.id,
        date: t.created_at?.slice(0, 16).replace('T', ' ') ?? '',
        customer: t.customer_handle ?? t.customer_display_name ?? 'Guest',
        desc: t.description ?? '',
        vico: Number(t.vico_amount),
        usd: Number(t.usd_at_time ?? (Number(t.vico_amount) * 0.10)),
        method: t.payment_method,
        status: t.status,
        hash: t.chain_tx_hash ?? null,
      })));
    })();
  }, []);

  const pageBg      = isNight ? '#1A1400' : '#FFFBF2';
  const heroBg      = '#412402';
  const cardBg      = isNight ? '#221A00' : '#FFFFFF';
  const cardBorder  = isNight ? '1px solid #3A2800' : '1px solid #F0D9B0';
  const textPrimary = isNight ? '#F5E6C8' : '#2D1A00';
  const textMuted   = isNight ? '#9B7A3A' : '#8B6230';
  const accent      = '#EF9F27';
  const inputStyle  = {
    width: '100%', padding: '9px 11px', borderRadius: 8,
    border: isNight ? '1px solid #3A2800' : '1px solid #F0D9B0',
    background: isNight ? '#2C1E00' : '#FFFDF5',
    color: textPrimary, fontSize: 12, outline: 'none', boxSizing: 'border-box' as const,
  };

  const filtered = allTxs.filter(tx => {
    if (filterMethod !== 'all' && tx.method !== filterMethod) return false;
    if (filterStatus !== 'all' && tx.status !== filterStatus) return false;
    if (filterMinAmount && tx.vico < parseFloat(filterMinAmount)) return false;
    if (filterDateFrom && tx.date < filterDateFrom) return false;
    if (filterDateTo && tx.date.slice(0, 10) > filterDateTo) return false;
    return true;
  });

  const totalVico = filtered.filter(t => t.status === 'completed').reduce((s, t) => s + t.vico, 0);
  const totalUsd  = filtered.filter(t => t.status === 'completed').reduce((s, t) => s + t.usd, 0);
  const totalTx   = filtered.length;
  const pending   = filtered.filter(t => t.status === 'pending').length;

  const SUMMARY = [
    { label: 'Total VICO', value: `${totalVico.toLocaleString()}` },
    { label: 'USD Equiv', value: `$${totalUsd.toFixed(2)}` },
    { label: 'Transactions', value: totalTx.toString() },
    { label: 'Pending', value: pending.toString() },
  ];

  return (
    <div style={{ minHeight: '100vh', background: pageBg, paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: heroBg, padding: '52px 20px 20px', position: 'relative' }}>
        <Link href="/village/merchant" style={{
          position: 'absolute', top: 16, left: 16,
          display: 'flex', alignItems: 'center', gap: 6,
          color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 14,
        }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Merchant
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ color: 'white', fontSize: 22, fontWeight: 800 }}>Transactions</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 4 }}>{totalTx} results</div>
          </div>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px',
            background: 'rgba(255,255,255,0.12)', borderRadius: 8, border: 'none', cursor: 'pointer',
            color: 'white', fontSize: 12, fontWeight: 600,
          }}>
            <DownloadIcon /> Export CSV
          </button>
        </div>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        {/* Summary tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
          {SUMMARY.map(s => (
            <div key={s.label} style={{ background: cardBg, border: cardBorder, borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ fontSize: 10, color: textMuted, marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: textPrimary }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Filter row */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button onClick={() => setShowFilters(!showFilters)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px',
            borderRadius: 9, border: cardBorder, background: cardBg,
            color: textMuted, fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>
            <FilterIcon /> Filters <ChevronDownIcon />
          </button>
          <select style={{ ...inputStyle, flex: 1, width: 'auto' }} value={filterMethod} onChange={e => setFilterMethod(e.target.value)}>
            <option value="all">All methods</option>
            <option value="qr">QR</option>
            <option value="link">Payment Link</option>
            <option value="invoice">Invoice</option>
          </select>
          <select style={{ ...inputStyle, flex: 1, width: 'auto' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="all">All status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        {showFilters && (
          <div style={{ background: cardBg, border: cardBorder, borderRadius: 12, padding: '14px', marginBottom: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: textMuted, marginBottom: 4 }}>Date from</label>
                <input type="date" style={inputStyle} value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: textMuted, marginBottom: 4 }}>Date to</label>
                <input type="date" style={inputStyle} value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: textMuted, marginBottom: 4 }}>Min amount (VICO)</label>
                <input type="number" style={inputStyle} placeholder="0" value={filterMinAmount} onChange={e => setFilterMinAmount(e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* Transaction list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(tx => {
            const method = METHOD_COLORS[tx.method] ?? METHOD_COLORS.qr;
            const status = STATUS_COLORS[tx.status] ?? STATUS_COLORS.pending;
            return (
              <div key={tx.id} style={{ background: cardBg, border: cardBorder, borderRadius: 12, padding: '13px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: textPrimary }}>{tx.customer}</span>
                      <span style={{ padding: '2px 6px', borderRadius: 5, fontSize: 9, fontWeight: 700, background: method.bg, color: method.color }}>{method.label}</span>
                    </div>
                    <div style={{ fontSize: 11, color: textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.desc}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 10 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: textPrimary }}>{tx.vico} <span style={{ fontSize: 10, color: accent }}>VICO</span></div>
                    <div style={{ fontSize: 11, color: textMuted }}>${tx.usd.toFixed(2)}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: textMuted }}>{tx.date}</span>
                    <span style={{ padding: '2px 7px', borderRadius: 5, fontSize: 9, fontWeight: 700, background: status.bg, color: status.color }}>
                      {tx.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {tx.hash && (
                      <button style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 6, border: cardBorder, background: 'transparent', color: textMuted, cursor: 'pointer', fontSize: 10 }}>
                        {tx.hash.slice(0, 8)} <ExternalIcon />
                      </button>
                    )}
                    {tx.status === 'completed' && (
                      <button style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 6, border: `1px solid #E0505044`, background: 'transparent', color: '#E05050', cursor: 'pointer', fontSize: 10, fontWeight: 600 }}>
                        <RefundIcon /> Refund
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: textMuted, fontSize: 14 }}>
              {allTxs.length === 0 ? 'No transactions yet.' : 'No transactions match your filters.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
