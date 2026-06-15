'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { ViCoNav } from '@/components/vico/ViCoNav';
import { GOVERNANCE_RULES } from '@/lib/vico/constants';

type Overview = {
  stats: {
    active_proposals: number;
    village_elders: number;
    total_votes_cast: number;
    treasury_vico: number;
    treasury_usd: number;
  };
  supply: {
    total: number;
    circulating: number;
    burned: number;
    community_pool: number;
    price_usd: number;
  };
  governance: {
    vico_balance: number;
    staked_vico: number;
    tier: string;
    tier_label: string;
    voting_power: number;
    voting_power_cap: number;
    cap_applied: boolean;
    proposals_submitted: number;
    votes_cast: number;
    participation_rate: number;
  } | null;
  tier_breakdown: { label: string; key: string; range: string; color: string; users: number }[];
};

export default function ViCoOverviewPage() {
  const isNight = useVillageTheme(s => s.theme) === 'night';
  const [data, setData] = useState<Overview | null>(null);

  const pageBg    = isNight ? '#100E1E' : '#F8F7FF';
  const heroBg    = isNight ? '#1A1640' : '#26215C';
  const cardBg    = isNight ? '#1C1830' : '#FFFFFF';
  const cardBorder = isNight ? '0.5px solid #2E2A4A' : '0.5px solid #DDDAF8';
  const textPrimary   = isNight ? '#E8E4FF' : '#1A1640';
  const textSecondary = isNight ? '#9B96C8' : '#534AB7';
  const textMuted     = isNight ? '#6B6490' : '#7B78A8';
  const btnBg         = isNight ? '#7F77DD' : '#534AB7';

  useEffect(() => {
    fetch('/api/vico/overview')
      .then(r => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (!data) {
    return (
      <div style={{ minHeight: '100vh', background: pageBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: textMuted, fontSize: 13 }}>Loading governance data…</div>
      </div>
    );
  }

  const { stats: s, supply, governance: u, tier_breakdown } = data;

  const STATS = [
    { label: 'Active Proposals', value: s.active_proposals.toString(),                 icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { label: 'Village Elders',   value: s.village_elders.toLocaleString(),             icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
    { label: 'Total Votes Cast', value: s.total_votes_cast.toLocaleString(),           icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
    { label: 'Treasury',         value: `$${(s.treasury_usd/1e6).toFixed(2)}M`,        icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
  ];

  const tierColor = tier_breakdown.find(t => t.key === u?.tier)?.color ?? '#534AB7';

  return (
    <div style={{ minHeight: '100vh', background: pageBg, paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: heroBg, padding: '52px 20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <Link href="/village" style={{
            color: 'rgba(255,255,255,0.7)', textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: 4, fontSize: 14,
          }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Village
          </Link>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>/</span>
          <span style={{ color: 'white', fontSize: 14, fontWeight: 600 }}>ViCo Governance</span>
        </div>

        {/* Token hero */}
        <div style={{ marginBottom: 4 }}>
          <span style={{
            display: 'inline-block', padding: '3px 10px',
            background: 'rgba(127,119,221,0.3)', borderRadius: 6,
            color: '#C4C0FF', fontSize: 11, fontWeight: 700, letterSpacing: 1,
            marginBottom: 10,
          }}>
            $VICO
          </span>
          <div style={{ color: 'white', fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>
            {supply.total.toLocaleString()}
          </div>
          <div style={{ color: 'rgba(196,192,255,0.8)', fontSize: 13, marginTop: 2 }}>
            {(supply.circulating / 1e6).toFixed(2)}M circulating · {(supply.burned / 1e6).toFixed(2)}M burned
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 16px 0' }}>
        <ViCoNav />

        {/* Stats 2x2 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          {STATS.map(stat => (
            <div key={stat.label} style={{
              background: cardBg, border: cardBorder, borderRadius: 12,
              padding: '14px 14px 12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
                  stroke={textSecondary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={stat.icon} />
                </svg>
                <span style={{ fontSize: 11, color: textMuted, fontWeight: 500 }}>{stat.label}</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: textPrimary, letterSpacing: -0.5 }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* User governance status */}
        {u ? (
          <div style={{ background: cardBg, border: cardBorder, borderRadius: 12, padding: '16px 16px 14px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: textPrimary }}>Your Governance Status</span>
              <span style={{
                padding: '3px 10px', borderRadius: 20,
                background: `${tierColor}22`, color: tierColor,
                fontSize: 11, fontWeight: 700,
              }}>
                {u.tier_label}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {[
                { label: 'Staked $VICO', value: u.staked_vico.toLocaleString() },
                { label: 'Voting Power', value: u.voting_power.toLocaleString() },
                { label: 'Participation', value: `${u.participation_rate}%` },
                { label: 'Proposals', value: u.proposals_submitted.toString() },
                { label: 'Votes Cast', value: u.votes_cast.toString() },
                { label: 'Wallet $VICO', value: u.vico_balance.toLocaleString() },
              ].map(item => (
                <div key={item.label}>
                  <div style={{ fontSize: 10, color: textMuted, marginBottom: 2 }}>{item.label}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: textPrimary }}>{item.value}</div>
                </div>
              ))}
            </div>
            {u.cap_applied && (
              <div style={{ marginTop: 10, fontSize: 11, color: '#E24B4A' }}>
                Your voting power is capped at {u.voting_power_cap.toLocaleString()} $VICO.
              </div>
            )}
            <div style={{ marginTop: 14, borderTop: cardBorder, paddingTop: 12 }}>
              <Link href="/village/bank/blockchain" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', background: btnBg, borderRadius: 8,
                color: 'white', fontSize: 12, fontWeight: 600, textDecoration: 'none',
              }}>
                Stake More $VICO
                <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ background: cardBg, border: cardBorder, borderRadius: 12, padding: '16px', marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: textPrimary, marginBottom: 6 }}>Your Governance Status</div>
            <div style={{ fontSize: 12, color: textMuted, marginBottom: 10 }}>
              Sign in to see your $VICO balance, staking tier, and voting power.
            </div>
            <Link href="/login" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', background: btnBg, borderRadius: 8,
              color: 'white', fontSize: 12, fontWeight: 600, textDecoration: 'none',
            }}>
              Sign In
            </Link>
          </div>
        )}

        {/* How governance works */}
        <div style={{ background: cardBg, border: cardBorder, borderRadius: 12, padding: '16px', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: textPrimary, marginBottom: 12 }}>
            How Governance Works
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', label: 'Min stake to vote', value: `${GOVERNANCE_RULES.MIN_STAKE_TO_VOTE.toLocaleString()} $VICO` },
              { icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', label: 'Min stake to propose', value: `${GOVERNANCE_RULES.MIN_STAKE_TO_PROPOSE.toLocaleString()} $VICO` },
              { icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', label: 'Discussion period', value: `${GOVERNANCE_RULES.DISCUSSION_DAYS} days` },
              { icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', label: 'Voting period', value: `${GOVERNANCE_RULES.VOTING_DAYS} days` },
              { icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Passing threshold', value: `${GOVERNANCE_RULES.PASS_THRESHOLD_PCT}% For` },
              { icon: 'M13 10V3L4 14h7v7l9-11h-7z', label: 'Max voting power', value: `${(u?.voting_power_cap ?? 100000).toLocaleString()} $VICO` },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
                    stroke={textSecondary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={row.icon} />
                  </svg>
                  <span style={{ fontSize: 12, color: textMuted }}>{row.label}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: textPrimary }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tier breakdown */}
        <div style={{ background: cardBg, border: cardBorder, borderRadius: 12, padding: '16px', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: textPrimary, marginBottom: 12 }}>Tier Breakdown</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tier_breakdown.map(tier => (
              <div key={tier.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: tier.color }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: textPrimary }}>{tier.label}</span>
                  <span style={{ fontSize: 11, color: textMuted }}>{tier.range}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: textSecondary }}>{tier.users.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Info banner */}
        <div style={{
          background: isNight ? 'rgba(127,119,221,0.12)' : '#EEEDFE',
          border: `1px solid ${isNight ? '#3C3470' : '#C8C3F4'}`,
          borderRadius: 12, padding: '14px 16px',
        }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#7F77DD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
            </svg>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: isNight ? '#C4C0FF' : '#3C3489', marginBottom: 4 }}>
                ViCo Governance is live
              </div>
              <div style={{ fontSize: 12, color: isNight ? '#9B96C8' : '#5C58A8', lineHeight: 1.5 }}>
                Your stake and participation are recorded on every action. $VICO mints automatically as you earn $VLG — stake it to vote and unlock proposal rights.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
