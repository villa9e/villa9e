'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { ViCoNav } from '@/components/vico/ViCoNav';

const MOCK_USER_STAKED = 5000;
const REQUIRED_STAKE   = 10000;
const NEXT_VIP         = 'VIP-004';

const CATEGORIES = [
  { value: 'earnings',       label: 'Earnings Rate' },
  { value: 'treasury',       label: 'Treasury' },
  { value: 'goal-category',  label: 'Goal Category' },
  { value: 'feature',        label: 'Feature' },
  { value: 'policy',         label: 'Policy' },
  { value: 'other',          label: 'Other' },
];

const CATEGORY_PLACEHOLDERS: Record<string, { desc: string; exec: string }> = {
  earnings: {
    desc: 'Describe which earning rate you want to change, why the current rate is too low or high, and what data or reasoning supports this change. Include current rate and proposed rate.',
    exec: 'If passed: update vlg_earn_rates table for [action_type] from [current] to [proposed]. Change takes effect at the start of the next weekly epoch (Monday 00:00 UTC).',
  },
  treasury: {
    desc: 'Describe what treasury funds you want to allocate, to whom, for what purpose, and how the outcome will be measured. Include amount in $VICO.',
    exec: 'If passed: multi-sig transaction from treasury wallet to [destination]. Grant committee reviews applications over [X]-day window. Disbursements tracked publicly on Village Chain.',
  },
  'goal-category': {
    desc: 'Describe the new goal category, why Village members need it, and how many members have requested it. Include evidence from surveys or community posts.',
    exec: 'If passed: update Meilisearch goal_categories index and deploy new GPS milestone templates within 72 hours of vote confirmation.',
  },
  feature: {
    desc: 'Describe the feature, the problem it solves, and who it benefits. Include mockups or references if available. Explain what Village resources are needed.',
    exec: 'If passed: create AppFlowy task tagged [feature name] and assign to product team. Target sprint: [sprint number]. Community update on DreamLine upon completion.',
  },
  policy: {
    desc: 'Describe the policy change, current behavior vs proposed behavior, why this change benefits the Village, and any potential downsides you have considered.',
    exec: 'If passed: update governing_rules table and publish policy update on DreamLine. Effective date: [X] days after execution.',
  },
  other: {
    desc: 'Clearly describe what you are proposing, why it matters to the Village, and what outcome you expect.',
    exec: 'Describe the specific steps to implement this proposal if it passes.',
  },
};

export default function SubmitProposalPage() {
  const isNight = useVillageTheme(s => s.theme) === 'night';

  const pageBg    = isNight ? '#100E1E' : '#F8F7FF';
  const heroBg    = isNight ? '#1A1640' : '#26215C';
  const cardBg    = isNight ? '#1C1830' : '#FFFFFF';
  const cardBorder = isNight ? '0.5px solid #2E2A4A' : '0.5px solid #DDDAF8';
  const textPrimary   = isNight ? '#E8E4FF' : '#1A1640';
  const textSecondary = isNight ? '#9B96C8' : '#534AB7';
  const textMuted     = isNight ? '#6B6490' : '#7B78A8';
  const inputBg       = isNight ? '#120F22' : '#FAFAFE';
  const inputBorder   = `1px solid ${isNight ? '#3C3870' : '#DDDAF8'}`;
  const btnBg         = isNight ? '#7F77DD' : '#534AB7';

  const [category, setCategory] = useState('');
  const [title, setTitle]       = useState(NEXT_VIP + ': ');
  const [description, setDesc]  = useState('');
  const [execPlan, setExecPlan] = useState('');
  const [url, setUrl]           = useState('');
  const [preview, setPreview]   = useState(false);

  const needsMoreStake = MOCK_USER_STAKED < REQUIRED_STAKE;
  const stakeShortfall = REQUIRED_STAKE - MOCK_USER_STAKED;

  const placeholders = category ? CATEGORY_PLACEHOLDERS[category] : CATEGORY_PLACEHOLDERS.other;
  const descOk   = description.trim().length >= 100;
  const execOk   = execPlan.trim().length > 0;
  const formOk   = category && title.trim().length > 10 && descOk && execOk;
  const canSubmit = formOk && !needsMoreStake;

  const inputStyle = {
    width: '100%', borderRadius: 8, border: inputBorder,
    background: inputBg, color: textPrimary, fontSize: 13,
    padding: '10px 12px', boxSizing: 'border-box' as const,
    fontFamily: 'inherit', outline: 'none',
  };

  return (
    <div style={{ minHeight: '100vh', background: pageBg, paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: heroBg, padding: '52px 20px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Link href="/village/vico/proposals" style={{
            color: 'rgba(255,255,255,0.7)', textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: 4, fontSize: 14,
          }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Proposals
          </Link>
        </div>
        <div style={{ color: 'white', fontSize: 22, fontWeight: 800 }}>Submit a Proposal</div>
        <div style={{ color: 'rgba(196,192,255,0.7)', fontSize: 12, marginTop: 4 }}>
          Next VIP number: <strong style={{ color: 'white' }}>{NEXT_VIP}</strong>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        <ViCoNav />

        {/* Eligibility check */}
        <div style={{
          background: needsMoreStake
            ? (isNight ? 'rgba(226,75,74,0.1)' : '#FEF0EE')
            : (isNight ? 'rgba(29,158,117,0.12)' : '#E8F7F1'),
          border: `1px solid ${needsMoreStake ? '#E24B4A44' : '#1D9E7544'}`,
          borderRadius: 12, padding: '14px 16px', marginBottom: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none"
              stroke={needsMoreStake ? '#E24B4A' : '#1D9E75'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {needsMoreStake
                ? <><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></>
                : <polyline points="20 6 9 17 4 12"/>
              }
            </svg>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: needsMoreStake ? '#E24B4A' : '#1D9E75', marginBottom: 2 }}>
                {needsMoreStake ? 'Not yet eligible to submit' : 'Eligible to submit'}
              </div>
              <div style={{ fontSize: 11, color: textMuted, lineHeight: 1.5 }}>
                Your stake: <strong>{MOCK_USER_STAKED.toLocaleString()} $VICO</strong>
                {needsMoreStake
                  ? ` · Need ${stakeShortfall.toLocaleString()} more $VICO to reach 10,000 minimum`
                  : ` · Meets 10,000 $VICO requirement`
                }
              </div>
            </div>
          </div>
          {needsMoreStake && (
            <Link href="/village/bank/blockchain" style={{
              display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 10,
              fontSize: 11, fontWeight: 700, color: '#E24B4A', textDecoration: 'none',
            }}>
              Stake more $VICO at the Bank →
            </Link>
          )}
        </div>

        {/* Form */}
        {!preview ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Category */}
            <div style={{ background: cardBg, border: cardBorder, borderRadius: 12, padding: '16px' }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: textSecondary, marginBottom: 8 }}>
                CATEGORY *
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                style={{ ...inputStyle, appearance: 'none' as const }}
              >
                <option value="">Select a category</option>
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div style={{ background: cardBg, border: cardBorder, borderRadius: 12, padding: '16px' }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: textSecondary, marginBottom: 8 }}>
                TITLE *
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={`${NEXT_VIP}: Your proposal title`}
                style={inputStyle}
              />
              <div style={{ fontSize: 10, color: textMuted, marginTop: 6 }}>
                VIP number is auto-populated. Keep the title concise and descriptive.
              </div>
            </div>

            {/* Description */}
            <div style={{ background: cardBg, border: cardBorder, borderRadius: 12, padding: '16px' }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: textSecondary, marginBottom: 8 }}>
                DESCRIPTION * <span style={{ fontWeight: 400, color: textMuted }}>(min 100 characters)</span>
              </label>
              <textarea
                value={description}
                onChange={e => setDesc(e.target.value)}
                placeholder={placeholders.desc}
                rows={6}
                style={{ ...inputStyle, resize: 'none' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{ fontSize: 10, color: descOk ? '#1D9E75' : textMuted }}>
                  {description.length} characters {descOk ? '✓' : `(${100 - description.length} more needed)`}
                </span>
              </div>
            </div>

            {/* Execution plan */}
            <div style={{ background: cardBg, border: cardBorder, borderRadius: 12, padding: '16px' }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: textSecondary, marginBottom: 8 }}>
                EXECUTION PLAN * <span style={{ fontWeight: 400, color: textMuted }}>(required)</span>
              </label>
              <textarea
                value={execPlan}
                onChange={e => setExecPlan(e.target.value)}
                placeholder={placeholders.exec}
                rows={5}
                style={{ ...inputStyle, resize: 'none' }}
              />
              <div style={{ fontSize: 10, color: textMuted, marginTop: 6 }}>
                Be specific: list the exact system changes, tables, timelines, and parties responsible.
              </div>
            </div>

            {/* Supporting URL */}
            <div style={{ background: cardBg, border: cardBorder, borderRadius: 12, padding: '16px' }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: textSecondary, marginBottom: 8 }}>
                SUPPORTING LINK <span style={{ fontWeight: 400, color: textMuted }}>(optional)</span>
              </label>
              <input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://notion.so/your-research..."
                style={inputStyle}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => formOk && setPreview(true)}
                disabled={!formOk}
                style={{
                  flex: 1, padding: '13px', borderRadius: 10,
                  border: `1px solid ${formOk ? btnBg : (isNight ? '#3C3870' : '#DDDAF8')}`,
                  background: 'transparent',
                  color: formOk ? btnBg : textMuted,
                  fontSize: 13, fontWeight: 600, cursor: formOk ? 'pointer' : 'not-allowed',
                }}
              >
                Preview
              </button>
              <button
                disabled={!canSubmit}
                style={{
                  flex: 2, padding: '13px', borderRadius: 10, border: 'none',
                  background: canSubmit ? btnBg : (isNight ? '#2A2640' : '#D8D5F0'),
                  color: canSubmit ? 'white' : textMuted,
                  fontSize: 13, fontWeight: 700, cursor: canSubmit ? 'pointer' : 'not-allowed',
                }}
              >
                {needsMoreStake
                  ? `Need ${stakeShortfall.toLocaleString()} more $VICO to submit`
                  : 'Submit Proposal'
                }
              </button>
            </div>
          </div>
        ) : (
          /* Preview */
          <div>
            <div style={{
              background: isNight ? 'rgba(29,158,117,0.1)' : '#E8F7F1',
              border: '1px solid #1D9E7544', borderRadius: 10, padding: '10px 14px', marginBottom: 14,
              fontSize: 12, color: '#1D9E75', fontWeight: 600,
            }}>
              Preview mode — this is how your proposal will appear to voters.
            </div>

            <div style={{ background: cardBg, border: cardBorder, borderRadius: 12, padding: '16px', marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: textSecondary, fontWeight: 700, marginBottom: 6 }}>{NEXT_VIP} · {category}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: textPrimary, marginBottom: 12 }}>{title}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: textSecondary, marginBottom: 6 }}>Description</div>
              <div style={{ fontSize: 13, color: textPrimary, lineHeight: 1.65, marginBottom: 14 }}>{description}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: textSecondary, marginBottom: 6 }}>Execution Plan</div>
              <div style={{ fontSize: 13, color: textPrimary, lineHeight: 1.65 }}>{execPlan}</div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setPreview(false)}
                style={{
                  flex: 1, padding: '13px', borderRadius: 10,
                  border: `1px solid ${isNight ? '#3C3870' : '#DDDAF8'}`,
                  background: 'transparent', color: textMuted,
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Edit
              </button>
              <button
                disabled={!canSubmit}
                style={{
                  flex: 2, padding: '13px', borderRadius: 10, border: 'none',
                  background: canSubmit ? btnBg : (isNight ? '#2A2640' : '#D8D5F0'),
                  color: canSubmit ? 'white' : textMuted,
                  fontSize: 13, fontWeight: 700, cursor: canSubmit ? 'pointer' : 'not-allowed',
                }}
              >
                {needsMoreStake
                  ? `Need ${stakeShortfall.toLocaleString()} more $VICO`
                  : 'Submit Proposal'
                }
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
