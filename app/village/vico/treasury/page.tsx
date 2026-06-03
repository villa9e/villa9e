'use client';
import Link from 'next/link';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { ViCoNav } from '@/components/vico/ViCoNav';
import { MOCK_TREASURY_TRANSACTIONS, MOCK_SUPPLY } from '@/lib/vico/mockData';

const ALLOCATIONS = [
  { label: 'Community Grants',      amount: 1200000, color: '#534AB7', pct: 55.9 },
  { label: 'Staking Rewards Reserve', amount: 648320, color: '#1D9E75', pct: 30.2 },
  { label: 'Liquidity',              amount: 300000,  color: '#BA7517', pct: 14.0 },
];
const TOTAL_TREASURY = 2148320;

function daysAgoLabel(days: number) {
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days === 7) return '1 week ago';
  if (days === 14) return '2 weeks ago';
  return `${days} days ago`;
}

export default function TreasuryPage() {
  const isNight = useVillageTheme(s => s.theme) === 'night';

  const pageBg    = isNight ? '#100E1E' : '#F8F7FF';
  const heroBg    = '#085041'; // always deep teal
  const cardBg    = isNight ? '#1C1830' : '#FFFFFF';
  const cardBorder = isNight ? '0.5px solid #2E2A4A' : '0.5px solid #DDDAF8';
  const textPrimary   = isNight ? '#E8E4FF' : '#1A1640';
  const textSecondary = isNight ? '#9B96C8' : '#534AB7';
  const textMuted     = isNight ? '#6B6490' : '#7B78A8';
  const supply = MOCK_SUPPLY;

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
            ${(TOTAL_TREASURY / 1e6).toFixed(3).replace(/\.?0+$/, '')}M
          </div>
          <div style={{ color: 'rgba(180,230,210,0.8)', fontSize: 13, marginTop: 2 }}>
            {TOTAL_TREASURY.toLocaleString()} $VICO · Updated 3 hrs ago
          </div>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        <ViCoNav />

        {/* Allocations */}
        <div style={{ background: cardBg, border: cardBorder, borderRadius: 12, padding: '16px', marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: textPrimary, marginBottom: 14 }}>Allocation</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {ALLOCATIONS.map(alloc => (
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {MOCK_TREASURY_TRANSACTIONS.map((txn, i) => (
              <div key={txn.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 0',
                borderBottom: i < MOCK_TREASURY_TRANSACTIONS.length - 1
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
                    <div style={{ fontSize: 10, color: textMuted, marginTop: 2 }}>{daysAgoLabel(txn.days_ago)}</div>
                  </div>
                </div>
                <div style={{
                  fontSize: 13, fontWeight: 700,
                  color: txn.direction === 'in' ? '#1D9E75' : '#E24B4A',
                  textAlign: 'right', flexShrink: 0,
                }}>
                  {txn.direction === 'in' ? '+' : '-'}{txn.amount.toLocaleString()}
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
              { label: 'Circulating',       value: `${(supply.circulating / 1e6).toFixed(1)}M $VICO`, color: '#7F77DD'   },
              { label: 'Burned',            value: `${(supply.burned / 1e6).toFixed(1)}M $VICO`,      color: '#E24B4A'   },
              { label: 'Community Pool',    value: `${(supply.community_pool / 1e6).toFixed(1)}M $VICO`, color: '#1D9E75' },
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
              10% of weekly ad revenue is burned. Staking rewards draw from the reserve. Community pool distributes over Year 2–4.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
