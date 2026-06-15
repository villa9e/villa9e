'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { ViCoNav } from '@/components/vico/ViCoNav';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '@/lib/vico/constants';

type Proposal = {
  id: string;
  vip_number: number;
  title: string;
  category: string;
  display_status: string;
  votes_for: number;
  votes_against: number;
  votes_abstain: number;
  voting_ends_at: string;
  execution_tx_hash: string | null;
};

type TabFilter = 'Active' | 'Passed' | 'Rejected' | 'All';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  discussion: { bg: '#FFF3DC', text: '#BA7517' },
  active:   { bg: '#E8F7F1', text: '#1D9E75' },
  passed:   { bg: '#EEF1FE', text: '#534AB7' },
  rejected: { bg: '#FEE8E8', text: '#C0392B' },
  executed: { bg: '#EEF1FE', text: '#534AB7' },
};

const STATUS_NIGHT: Record<string, { bg: string; text: string }> = {
  discussion: { bg: 'rgba(186,117,23,0.18)', text: '#E0B05C' },
  active:   { bg: 'rgba(29,158,117,0.15)', text: '#4CD4A0' },
  passed:   { bg: 'rgba(127,119,221,0.2)', text: '#A9A3F0' },
  rejected: { bg: 'rgba(226,75,74,0.15)',  text: '#F08080' },
  executed: { bg: 'rgba(127,119,221,0.2)', text: '#A9A3F0' },
};

function statusLabel(status: string) {
  if (status === 'executed') return 'Passed';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function votePct(proposal: Proposal) {
  const total = proposal.votes_for + proposal.votes_against + proposal.votes_abstain;
  if (total === 0) return { forPct: 0, againstPct: 0, total };
  return {
    forPct: Math.round((proposal.votes_for / total) * 100),
    againstPct: Math.round((proposal.votes_against / total) * 100),
    total,
  };
}

function daysUntil(dateStr: string) {
  const ms = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export default function ProposalsPage() {
  const isNight = useVillageTheme(s => s.theme) === 'night';
  const [tab, setTab] = useState<TabFilter>('Active');
  const [proposals, setProposals] = useState<Proposal[] | null>(null);

  const pageBg    = isNight ? '#100E1E' : '#F8F7FF';
  const heroBg    = isNight ? '#1A1640' : '#26215C';
  const cardBg    = isNight ? '#1C1830' : '#FFFFFF';
  const cardBorder = isNight ? '0.5px solid #2E2A4A' : '0.5px solid #DDDAF8';
  const textPrimary   = isNight ? '#E8E4FF' : '#1A1640';
  const textMuted     = isNight ? '#6B6490' : '#7B78A8';
  const tabActiveBg   = isNight ? '#7F77DD' : '#534AB7';

  useEffect(() => {
    fetch('/api/vico/proposals').then(r => r.json()).then(d => setProposals(d.proposals ?? []));
  }, []);

  const filtered = (proposals ?? []).filter(p => {
    if (tab === 'All') return true;
    if (tab === 'Active') return p.display_status === 'active' || p.display_status === 'discussion';
    if (tab === 'Passed') return p.display_status === 'passed' || p.display_status === 'executed';
    if (tab === 'Rejected') return p.display_status === 'rejected';
    return true;
  });

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
          <span style={{ color: 'white', fontSize: 14, fontWeight: 600 }}>Proposals</span>
        </div>
        <div style={{ color: 'white', fontSize: 22, fontWeight: 800 }}>Village Proposals</div>
        <div style={{ color: 'rgba(196,192,255,0.7)', fontSize: 12, marginTop: 4 }}>
          VIP = Village Improvement Proposal
        </div>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        <ViCoNav />

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 6, marginBottom: 16,
          background: cardBg, border: cardBorder, borderRadius: 10, padding: 4,
        }}>
          {(['Active', 'Passed', 'Rejected', 'All'] as TabFilter[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: '7px 0', borderRadius: 7,
                border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                background: tab === t ? tabActiveBg : 'transparent',
                color: tab === t ? 'white' : textMuted,
                transition: 'all 0.15s',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Proposal cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {proposals === null && (
            <div style={{ textAlign: 'center', color: textMuted, padding: '40px 0', fontSize: 14 }}>Loading…</div>
          )}
          {proposals !== null && filtered.length === 0 && (
            <div style={{ textAlign: 'center', color: textMuted, padding: '40px 0', fontSize: 14 }}>
              No proposals in this category yet.
            </div>
          )}
          {filtered.map(proposal => {
            const { forPct, againstPct } = votePct(proposal);
            const catColor = CATEGORY_COLORS[proposal.category] ?? { bg: '#F0F0F0', text: '#666' };
            const catColorNight = { bg: `${catColor.text}22`, text: catColor.text };
            const statusColor = isNight
              ? (STATUS_NIGHT[proposal.display_status] ?? { bg: '#333', text: '#aaa' })
              : (STATUS_COLORS[proposal.display_status] ?? { bg: '#eee', text: '#666' });
            const isActive = proposal.display_status === 'active';

            return (
              <Link
                key={proposal.id}
                href={`/village/vico/proposals/${proposal.id}`}
                style={{ textDecoration: 'none' }}
              >
                <div style={{
                  background: cardBg,
                  border: cardBorder,
                  borderLeft: isActive ? '1.5px solid #7F77DD' : cardBorder,
                  borderRadius: 12,
                  padding: '14px 14px 12px',
                  cursor: 'pointer',
                }}>
                  {/* Top row: VIP + category + status */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: isNight ? '#9B96C8' : '#534AB7' }}>
                      VIP-{String(proposal.vip_number).padStart(3, '0')}
                    </span>
                    <span style={{
                      padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600,
                      background: isNight ? catColorNight.bg : catColor.bg,
                      color: isNight ? catColorNight.text : catColor.text,
                    }}>
                      {CATEGORY_LABELS[proposal.category]}
                    </span>
                    <span style={{ flex: 1 }} />
                    <span style={{
                      padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                      background: statusColor.bg, color: statusColor.text,
                    }}>
                      {statusLabel(proposal.display_status)}
                    </span>
                  </div>

                  {/* Title */}
                  <div style={{ fontSize: 14, fontWeight: 700, color: textPrimary, marginBottom: 10, lineHeight: 1.4 }}>
                    {proposal.title}
                  </div>

                  {/* Vote progress bar */}
                  <div style={{ marginBottom: 6 }}>
                    <div style={{ height: 6, borderRadius: 3, background: isNight ? '#2E2A4A' : '#EEEDFE', overflow: 'hidden', display: 'flex' }}>
                      <div style={{ width: `${forPct}%`, background: '#1D9E75', borderRadius: '3px 0 0 3px' }} />
                      <div style={{ width: `${againstPct}%`, background: '#E24B4A', borderRadius: forPct === 0 ? '3px' : '0 3px 3px 0' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                      <span style={{ fontSize: 11, color: '#1D9E75', fontWeight: 600 }}>{forPct}% For</span>
                      <span style={{ fontSize: 11, color: '#E24B4A', fontWeight: 600 }}>{againstPct}% Against</span>
                    </div>
                  </div>

                  {/* Footer */}
                  {isActive && (
                    <div style={{ fontSize: 11, color: textMuted, marginTop: 4 }}>
                      Ends in {daysUntil(proposal.voting_ends_at)} days
                    </div>
                  )}
                  {proposal.display_status === 'discussion' && (
                    <div style={{ fontSize: 11, color: textMuted, marginTop: 4 }}>
                      Voting opens in {daysUntil(proposal.voting_ends_at) - 7 > 0 ? daysUntil(proposal.voting_ends_at) - 7 : 0} days
                    </div>
                  )}
                  {(proposal.display_status === 'passed' || proposal.display_status === 'executed') && proposal.execution_tx_hash && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                      <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span style={{ fontSize: 11, color: '#1D9E75', fontWeight: 500 }}>Executed on-chain</span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Submit CTA */}
        <div style={{ marginTop: 20 }}>
          <Link href="/village/vico/submit" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '14px', background: isNight ? '#7F77DD' : '#534AB7',
            borderRadius: 12, color: 'white', fontSize: 13, fontWeight: 600, textDecoration: 'none',
          }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 4v16m8-8H4" />
            </svg>
            Submit a Proposal
          </Link>
        </div>
      </div>
    </div>
  );
}
