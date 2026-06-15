// ViCo Governance shared constants — single source of truth for tiers,
// category labels/colors, and governance rule thresholds.

export const TIER_BREAKDOWN = [
  { label: 'Settler',       key: 'settler', range: '0–499 $VICO',       min: 0,     max: 499,         color: '#B8B4D8' },
  { label: 'Pioneer',       key: 'pioneer', range: '500–1,999 $VICO',   min: 500,   max: 1999,        color: '#7F77DD' },
  { label: 'Builder',       key: 'builder', range: '2,000–9,999 $VICO', min: 2000,  max: 9999,        color: '#534AB7' },
  { label: 'Village Elder', key: 'elder',   range: '10,000+ $VICO',     min: 10000, max: 1e15,        color: '#26215C' },
] as const;

export function tierFor(staked: number) {
  return TIER_BREAKDOWN.find(t => staked >= t.min && staked <= t.max) ?? TIER_BREAKDOWN[0];
}

export const CATEGORY_LABELS: Record<string, string> = {
  earnings:        'Earnings',
  treasury:        'Treasury',
  'goal-category': 'Goal Category',
  feature:         'Feature',
  policy:          'Policy',
  other:           'Other',
};

export const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  earnings:        { bg: '#E8F7F1', text: '#1D9E75' },
  treasury:        { bg: '#EEF1FE', text: '#534AB7' },
  'goal-category': { bg: '#FFF3DC', text: '#BA7517' },
  feature:         { bg: '#E8F4FE', text: '#0A6FA8' },
  policy:          { bg: '#FEE8E8', text: '#C0392B' },
  other:           { bg: '#F0F0F0', text: '#666666' },
};

export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  liquidity:        'Liquidity Pool',
  revenue:          'Revenue',
  'staking-reward': 'Staking Rewards',
  grant:            'Community Grants',
  burn:             'Burned (Deflationary)',
};

export function displayStatus(p: { status: string; voting_starts_at: string; voting_ends_at: string; votes_for: number; votes_against: number }): string {
  const now = Date.now();
  const votingStarts = new Date(p.voting_starts_at).getTime();
  const votingEnds = new Date(p.voting_ends_at).getTime();

  if (p.status === 'executed' || p.status === 'rejected') return p.status;
  if (now < votingStarts) return 'discussion';
  if (now <= votingEnds) return 'active';
  return p.votes_for > p.votes_against ? 'passed' : 'rejected';
}

export const GOVERNANCE_RULES = {
  MIN_STAKE_TO_VOTE: 2000,
  MIN_STAKE_TO_PROPOSE: 10000,
  ELDER_STAKE: 10000,
  DISCUSSION_DAYS: 3,
  VOTING_DAYS: 7,
  PASS_THRESHOLD_PCT: 60,
};
