'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { ViCoNav } from '@/components/vico/ViCoNav';
import { MOCK_ELDERS, TIER_BREAKDOWN } from '@/lib/vico/mockData';

type SortKey = 'staked' | 'proposals' | 'participation';

const CURRENT_USER_ID = 'none'; // mock: current user is not in Elder list

export default function EldersPage() {
  const isNight = useVillageTheme(s => s.theme) === 'night';
  const [sortKey, setSortKey] = useState<SortKey>('staked');

  const pageBg    = isNight ? '#100E1E' : '#F8F7FF';
  const heroBg    = isNight ? '#1A1640' : '#26215C';
  const cardBg    = isNight ? '#1C1830' : '#FFFFFF';
  const cardBorder = isNight ? '0.5px solid #2E2A4A' : '0.5px solid #DDDAF8';
  const textPrimary   = isNight ? '#E8E4FF' : '#1A1640';
  const textSecondary = isNight ? '#9B96C8' : '#534AB7';
  const textMuted     = isNight ? '#6B6490' : '#7B78A8';

  const sorted = [...MOCK_ELDERS].sort((a, b) => {
    if (sortKey === 'staked')        return b.staked - a.staked;
    if (sortKey === 'proposals')     return b.proposals - a.proposals;
    if (sortKey === 'participation') return b.participation - a.participation;
    return 0;
  });

  const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: 'staked',        label: 'Most Staked'     },
    { key: 'proposals',     label: 'Most Proposals'  },
    { key: 'participation', label: 'Participation'   },
  ];

  function getParticipationColor(pct: number) {
    if (pct >= 90) return '#1D9E75';
    if (pct >= 60) return '#BA7517';
    return '#E24B4A';
  }

  return (
    <div style={{ minHeight: '100vh', background: pageBg, paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: heroBg, padding: '52px 20px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
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
          <span style={{ color: 'white', fontSize: 14, fontWeight: 600 }}>Village Elders</span>
        </div>
        <div style={{ color: 'white', fontSize: 22, fontWeight: 800 }}>Village Elders</div>
        <div style={{ color: 'rgba(196,192,255,0.7)', fontSize: 12, marginTop: 6, lineHeight: 1.6 }}>
          847 active Elders · 2,000+ $VICO staked · Max 5% voting power per wallet
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        <ViCoNav />

        {/* Sort bar */}
        <div style={{
          display: 'flex', gap: 6, marginBottom: 14,
          background: cardBg, border: cardBorder, borderRadius: 10, padding: 4,
        }}>
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.key}
              onClick={() => setSortKey(opt.key)}
              style={{
                flex: 1, padding: '7px 0', borderRadius: 7,
                border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                background: sortKey === opt.key ? (isNight ? '#7F77DD' : '#534AB7') : 'transparent',
                color: sortKey === opt.key ? 'white' : textMuted,
                transition: 'all 0.15s',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Leaderboard */}
        <div style={{ background: cardBg, border: cardBorder, borderRadius: 12, marginBottom: 14, overflow: 'hidden' }}>
          {sorted.map((elder, index) => {
            const isCurrentUser = elder.id === CURRENT_USER_ID;
            return (
              <div
                key={elder.id}
                style={{
                  display: 'flex', alignItems: 'center', padding: '14px 14px',
                  borderLeft: isCurrentUser ? '1.5px solid #1A2DBF' : 'none',
                  borderBottom: index < sorted.length - 1
                    ? (isNight ? '0.5px solid #2E2A4A' : '0.5px solid #F0EEFF')
                    : 'none',
                  background: isCurrentUser
                    ? (isNight ? 'rgba(26,45,191,0.1)' : 'rgba(26,45,191,0.04)')
                    : 'transparent',
                }}
              >
                {/* Rank */}
                <div style={{
                  width: 24, textAlign: 'center', fontSize: 11, fontWeight: 700,
                  color: index < 3 ? (['#FFD700','#C0C0C0','#CD7F32'][index]) : textMuted,
                  flexShrink: 0, marginRight: 10,
                }}>
                  {index + 1}
                </div>

                {/* Avatar */}
                <div style={{
                  width: 36, height: 36, borderRadius: 18, flexShrink: 0,
                  background: isNight ? '#3C3489' : '#534AB7',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: 12, fontWeight: 700, marginRight: 10,
                }}>
                  {elder.initials}
                </div>

                {/* Name + badges */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                    <span style={{
                      fontSize: 13, fontWeight: 700, color: textPrimary,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {elder.username}
                    </span>
                    {isCurrentUser && (
                      <span style={{
                        padding: '1px 5px', borderRadius: 4,
                        background: '#1A2DBF22', color: '#1A2DBF',
                        fontSize: 9, fontWeight: 700,
                      }}>You</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                    <span style={{
                      padding: '1px 6px', borderRadius: 4, fontSize: 9, fontWeight: 700,
                      background: isNight ? '#3C3489' : '#EEEDFE',
                      color: isNight ? '#A9A3F0' : '#3C3489',
                    }}>Village Elder</span>
                    {elder.cap_applied && (
                      <span style={{
                        padding: '1px 6px', borderRadius: 4, fontSize: 9, fontWeight: 600,
                        background: isNight ? 'rgba(226,75,74,0.15)' : '#FEF0EE',
                        color: '#E24B4A',
                      }}>5% cap</span>
                    )}
                    <span style={{ fontSize: 10, color: textMuted }}>{elder.proposals}p</span>
                  </div>
                </div>

                {/* Stats */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: textPrimary }}>
                    {elder.staked >= 1000
                      ? `${(elder.staked / 1000).toFixed(elder.staked >= 100000 ? 0 : 1)}K`
                      : elder.staked.toLocaleString()
                    }
                  </div>
                  <div style={{ fontSize: 9, color: textMuted, marginBottom: 2 }}>$VICO</div>
                  <div style={{
                    fontSize: 11, fontWeight: 700,
                    color: getParticipationColor(elder.participation),
                  }}>
                    {elder.participation}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tier breakdown */}
        <div style={{ background: cardBg, border: cardBorder, borderRadius: 12, padding: '16px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: textPrimary, marginBottom: 12 }}>Tier Breakdown</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {TIER_BREAKDOWN.map(tier => {
              const maxUsers = 12847; // Settler count for bar scale
              const barWidth = Math.round((tier.users / maxUsers) * 100);
              return (
                <div key={tier.label}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: tier.color }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: textPrimary }}>{tier.label}</span>
                      <span style={{ fontSize: 11, color: textMuted }}>{tier.range}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: textSecondary }}>
                      {tier.users.toLocaleString()}
                    </span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: isNight ? '#2E2A4A' : '#EEEDFE', overflow: 'hidden' }}>
                    <div style={{ width: `${barWidth}%`, height: '100%', background: tier.color, borderRadius: 3 }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 14, padding: '10px 12px', borderRadius: 8, background: isNight ? 'rgba(127,119,221,0.1)' : '#EEEDFE' }}>
            <div style={{ fontSize: 11, color: isNight ? '#9B96C8' : '#534AB7', lineHeight: 1.55 }}>
              Become a Village Elder by staking 10,000+ $VICO. Elders can submit proposals, post in governance discussions, and join the grant committee.
            </div>
            <Link href="/village/bank/blockchain" style={{
              display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8,
              fontSize: 11, fontWeight: 700, color: isNight ? '#7F77DD' : '#534AB7', textDecoration: 'none',
            }}>
              Stake more at the Bank →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
