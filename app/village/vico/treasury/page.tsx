'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { ViCoNav } from '@/components/vico/ViCoNav';

type Allocation = { label: string; amount: number; pct: number; color: string };
type Transaction = {
  id: string;
  transaction_type: string;
  description: string;
  amount: number;
  direction: 'in' | 'out';
  created_at: string;
};
type TreasuryData = {
  total_treasury: number;
  total_treasury_usd: number;
  allocations: Allocation[];
  transactions: Transaction[];
  supply: { total: number; circulating: number; burned: number; community_pool: number; price_usd: number };
};

function timeAgo(dateStr: string) {
  const ms = Date.now() - new Date(dateStr).getTime();
  const hrs = Math.floor(ms / (1000 * 60 * 60));
  if (hrs < 1) return 'Just now';
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? '' : 's'} ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return '1 week ago';
  return `${weeks} weeks ago`;
}

export default function TreasuryPage() {
  const isNight = useVillageTheme(s => s.theme) === 'night';
  const [data, setData] = useState<TreasuryData | null>(null);

  const pageBg    = isNight ? '#100E1E' : '#F8F7FF';
  const heroBg    = '#085041'; // always deep teal
  const cardBg    = isNight ? '#1C1830' : '#FFFFFF';
  const cardBorder = isNight ? '0.5px solid #2E2A4A' : '0.5px solid #DDDAF8';
  const textPrimary   = isNight ? '#E8E4FF' : '#1A1640';
  const textMuted     = isNight ? '#6B6490' : '#7B78A8';

  useEffect(() => {
    fetch('/api/vico/treasury').then(r => r.json()).then(setData);
  }, []);

  if (!data) {
    return (
      <div style={{ minHeight: '100vh', background: pageBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: textMuted, fontSize: 13 }}>Loading treasury…</div>
      </div>
    );
  }

  const { total_treasury, allocations, transactions, supply } = data;

  return (
    <div style={{ minHeight: '100vh', background: pageBg, paddingBottom: 80 }}>
      {/* Hero */}
      <div style={{ background: heroBg, padding: '52px 20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Link href="/village/vico" style={{
            color: 'rgba(255,255,255,0.7)', textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: 4, fontSize: 14,
          }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            ViCo
          </Link>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>/</span>
          <span style={{ color: 'white', fontSize: 14, fontWeight: 600 }}>Treasury</span>
        </div>
        <div style={{ marginBottom: 4 }}>
          <span style={{
            display: 'inline-block', padding: '3px 10px',
            background: 'rgba(255,255,255,0.15)', borderRadius: 6,
            color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: 700, letterSpacing: 1,
            marginBottom: 10,
          }}>
            VICO TREASURY
          </span>
          <div style={{ color: 'white', fontSize: 30, fontWeight: 800, letterSpacing: -0.5 }}>
            {(total_treasury / 1e6).toFixed(2)}M $VICO
          </div>
          <div style={{ color: 'rgba(180,230,210,0.8)', fontSize: 13, marginTop: 2 }}>
            {total_treasury.toLocaleString()} $VICO · ${(data.total_treasury_usd / 1e6).toFixed(2)}M
          </div>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        <ViCoNav />

        {/* Allocations */}
        <div style={{ background: cardBg, border: cardBorder, borderRadius: 12, padding: '16px', marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: textPrimary, marginBottom: 14 }}>Allocation</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {allocations.map(alloc => (
              <div key={alloc.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: alloc.color }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: textPrimary }}>{alloc.label}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: textPrimary }}>
                    {alloc.amount.toLocaleString()} $VICO
                  </span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: isNight ? '#2E2A4A' : '#EEEDFE', overflow: 'hidden' }}>
                  <div style={{ width: `${alloc.pct}%`, height: '100%', background: alloc.color, borderRadius: 4 }} />
                </div>
                <div style={{ fontSize: 10, color: textMuted, marginTop: 4 }}>{alloc.pct}% of treasury</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent transactions */}
        <div style={{ background: cardBg, border: cardBorder, borderRadius: 12, padding: '16px', marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: textPrimary, marginBottom: 12 }}>Recent Transactions</div>
          {transactions.length === 0 && (
            <div style={{ textAlign: 'center', color: textMuted, fontSize: 12, padding: '12px 0' }}>No transactions yet.</div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {transactions.map((txn, i) => (
              <div key={txn.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 0',
                borderBottom: i < transactions.length - 1
                  ? (isNight ? '0.5px solid #2E2A4A' : '0.5px solid #EEEDFE')
                  : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: txn.direction === 'in'
                      ? 'rgba(29,158,117,0.12)'
                      : 'rgba(226,75,74,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
                      stroke={txn.direction === 'in' ? '#1D9E75' : '#E24B4A'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      {txn.direction === 'in'
                        ? <path d="M12 19V5M5 12l7-7 7 7"/>
                        : <path d="M12 5v14M5 12l7 7 7-7"/>
                      }
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: textPrimary, lineHeight: 1.3 }}>{txn.description}</div>
                    <div style={{ fontSize: 10, color: textMuted, marginTop: 2 }}>{timeAgo(txn.created_at)}</div>
                  </div>
                </div>
                <div style={{
                  fontSize: 13, fontWeight: 700,
                  color: txn.direction === 'in' ? '#1D9E75' : '#E24B4A',
                  textAlign: 'right', flexShrink: 0,
                }}>
                  {txn.direction === 'in' ? '+' : '-'}{Number(txn.amount).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Supply mechanics */}
        <div style={{ background: cardBg, border: cardBorder, borderRadius: 12, padding: '16px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: textPrimary, marginBottom: 12 }}>Supply Mechanics</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'Total Supply',      value: `${(supply.total / 1e6).toFixed(0)}M $VICO`,       color: textPrimary },
              { label: 'Circulating',       value: `${(supply.circulating / 1e6).toFixed(2)}M $VICO`, color: '#7F77DD'   },
              { label: 'Burned',            value: `${(supply.burned / 1e6).toFixed(2)}M $VICO`,      color: '#E24B4A'   },
              { label: 'Community Pool',    value: `${(supply.community_pool / 1e6).toFixed(2)}M $VICO`, color: '#1D9E75' },
            ].map(item => (
              <div key={item.label} style={{
                background: isNight ? 'rgba(255,255,255,0.04)' : '#F8F7FF',
                borderRadius: 8, padding: '12px',
              }}>
                <div style={{ fontSize: 10, color: textMuted, marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: item.color }}>{item.value}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 8, background: isNight ? 'rgba(127,119,221,0.1)' : '#EEEDFE' }}>
            <div style={{ fontSize: 11, color: isNight ? '#9B96C8' : '#534AB7', lineHeight: 1.55 }}>
              $VICO mints automatically as members earn $VLG. Burns shrink total supply; community grants draw down the Community Pool.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
