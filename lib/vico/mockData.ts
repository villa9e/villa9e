// ViCo Governance mock data — used until DB migration is deployed

export const MOCK_PROPOSALS = [
  {
    id: 'vip-003',
    vip_number: 3,
    title: 'Increase OoWop earning rate from 5 to 8 $VLG',
    category: 'earnings',
    status: 'active',
    description:
      'This proposal seeks to increase the $VLG earning rate per OoWop from 5 to 8 tokens. As Village activity grows, the current rate undervalues community curation. Increasing the rate rewards active members who surface quality content and strengthens the feedback loop between engagement and governance participation.',
    execution_plan:
      'If passed: update the vlg_earn_rates table entry for action_type = "oowop" from rate 5 to rate 8. Change takes effect at the start of the next weekly epoch (Monday 00:00 UTC). No smart contract changes required — rate is read from DB by the reward engine.',
    supporting_url: 'https://village.notion.so/vip-003-oowop-rate',
    discussion_starts_at: '2026-05-31T00:00:00Z',
    voting_starts_at: '2026-06-01T00:00:00Z',
    voting_ends_at: '2026-06-08T00:00:00Z',
    votes_for: 1825,
    votes_against: 672,
    votes_abstain: 43,
    total_eligible_voters: 847,
  },
  {
    id: 'vip-002',
    vip_number: 2,
    title: 'Add Real Estate Investing as GPS goal category',
    category: 'goal-category',
    status: 'passed',
    description:
      'Add "Real Estate Investing" as an official GPS goal category. Real estate is consistently the top requested goal type among Village members (43% of user surveys). This enables the GPS engine to surface relevant content, mentors, and milestone templates for this path.',
    execution_plan:
      'Meilisearch index update to add "real-estate-investing" to goal_categories enum. New goal template set deployed to GPS engine. Rollout within 72 hours of vote confirmation.',
    supporting_url: null,
    discussion_starts_at: '2026-05-10T00:00:00Z',
    voting_starts_at: '2026-05-13T00:00:00Z',
    voting_ends_at: '2026-05-20T00:00:00Z',
    votes_for: 2184,
    votes_against: 216,
    votes_abstain: 38,
    total_eligible_voters: 712,
    execution_tx_hash: '0x4f3a...c891',
  },
  {
    id: 'vip-001',
    vip_number: 1,
    title: 'Allocate 50,000 $VICO from treasury for ecosystem grants',
    category: 'treasury',
    status: 'passed',
    description:
      'Allocate 50,000 $VICO from the Community Grants allocation to fund the first round of Village Ecosystem Grants. Grants support builders creating tools, content, and infrastructure that benefits Village members.',
    execution_plan:
      'Multi-sig transaction from treasury wallet to grants escrow contract. Grant committee (5 elected Elders) reviews applications over 30-day window. Disbursements tracked publicly on Village Chain.',
    supporting_url: null,
    discussion_starts_at: '2026-04-20T00:00:00Z',
    voting_starts_at: '2026-04-23T00:00:00Z',
    voting_ends_at: '2026-04-30T00:00:00Z',
    votes_for: 1876,
    votes_against: 530,
    votes_abstain: 84,
    total_eligible_voters: 623,
    execution_tx_hash: '0xa1b2...f774',
  },
];

export const MOCK_COMMENTS = {
  'vip-003': [
    {
      id: 'c1',
      user: { username: 'MarcusB', initials: 'MB', tier: 'elder' },
      content:
        'Strongly support. The current 5 $VLG rate was set when active users were under 500. Now that we\'re at 12k+, increasing the rate is necessary to maintain meaningful curation incentives. The math checks out — total weekly VLG emissions increase by ~4,200 tokens at current OoWop velocity, well within budget.',
      oowop_count: 34,
      created_at: '2026-06-01T14:22:00Z',
    },
    {
      id: 'c2',
      user: { username: 'DrAishaT', initials: 'AT', tier: 'elder' },
      content:
        'I\'d suggest a phased approach: 6 $VLG first, then re-evaluate after 30 days. Jumping straight to 8 could cause a short-term OoWop farming spike. Either way I\'m voting For — the direction is right.',
      oowop_count: 21,
      created_at: '2026-06-01T16:45:00Z',
    },
    {
      id: 'c3',
      user: { username: 'JordanC', initials: 'JC', tier: 'elder' },
      content:
        'The farming concern is real but the rate limiter already caps OoWops per user per day at 50. Even at 8 $VLG that\'s 400 max per user daily — same as before proportionally. Vote For.',
      oowop_count: 18,
      created_at: '2026-06-02T09:10:00Z',
    },
  ],
  'vip-002': [
    {
      id: 'c4',
      user: { username: 'MayaK', initials: 'MK', tier: 'elder' },
      content: 'This was the most requested feature in the Q1 survey. Passed overwhelmingly. Ready to see the templates drop.',
      oowop_count: 28,
      created_at: '2026-05-14T11:00:00Z',
    },
    {
      id: 'c5',
      user: { username: 'DevinR', initials: 'DR', tier: 'elder' },
      content: 'Great proposal. Would love to see multifamily specifically as a sub-category in the next iteration.',
      oowop_count: 12,
      created_at: '2026-05-15T08:30:00Z',
    },
  ],
  'vip-001': [
    {
      id: 'c6',
      user: { username: 'MarcusB', initials: 'MB', tier: 'elder' },
      content: 'The grants program is live. First cohort of 8 builders selected. Details on DreamLine this week.',
      oowop_count: 45,
      created_at: '2026-05-01T10:00:00Z',
    },
  ],
};

export const MOCK_ELDERS = [
  { id: 'e1',  username: 'Marcus B.',    initials: 'MB', staked: 245000, cap_applied: true,  proposals: 3, participation: 100.0 },
  { id: 'e2',  username: 'Dr. Aisha T.', initials: 'AT', staked: 180000, cap_applied: true,  proposals: 1, participation: 87.5 },
  { id: 'e3',  username: 'Jordan C.',    initials: 'JC', staked: 95000,  cap_applied: false, proposals: 2, participation: 91.3 },
  { id: 'e4',  username: 'Maya K.',      initials: 'MK', staked: 62000,  cap_applied: false, proposals: 0, participation: 100.0 },
  { id: 'e5',  username: 'Devin R.',     initials: 'DR', staked: 48500,  cap_applied: false, proposals: 1, participation: 75.0 },
  { id: 'e6',  username: 'Priya S.',     initials: 'PS', staked: 31200,  cap_applied: false, proposals: 0, participation: 87.5 },
  { id: 'e7',  username: 'Kwame A.',     initials: 'KA', staked: 18750,  cap_applied: false, proposals: 1, participation: 62.5 },
  { id: 'e8',  username: 'Tasha M.',     initials: 'TM', staked: 14300,  cap_applied: false, proposals: 0, participation: 100.0 },
  { id: 'e9',  username: 'Leon W.',      initials: 'LW', staked: 11900,  cap_applied: false, proposals: 0, participation: 50.0 },
  { id: 'e10', username: 'Simone L.',    initials: 'SL', staked: 10200,  cap_applied: false, proposals: 0, participation: 75.0 },
];

export const MOCK_TREASURY_TRANSACTIONS = [
  { id: 't1', description: 'Staking rewards paid — Week 8',          amount: 45000,  direction: 'out', type: 'staking-reward',   days_ago: 3 },
  { id: 't2', description: 'Ad revenue inflow — Week 8',             amount: 12400,  direction: 'in',  type: 'revenue',          days_ago: 3 },
  { id: 't3', description: 'VIP-001 Ecosystem grant disbursement',   amount: 50000,  direction: 'out', type: 'grant',            days_ago: 7 },
  { id: 't4', description: 'Weekly burn — 10% ad revenue',           amount: 8200,   direction: 'out', type: 'burn',             days_ago: 7 },
  { id: 't5', description: 'Initial liquidity provision',            amount: 300000, direction: 'out', type: 'liquidity',        days_ago: 14 },
];

export const MOCK_USER_GOVERNANCE = {
  staked_vico: 5000,
  tier: 'pioneer',
  tier_label: 'Pioneer',
  voting_power: 5000,
  proposals_submitted: 0,
  votes_cast: 2,
  participation_rate: 100,
};

export const MOCK_STATS = {
  active_proposals: 3,
  village_elders: 847,
  total_votes_cast: 124830,
  treasury_usd: 2148320,
};

export const MOCK_SUPPLY = {
  total: 33000000,
  circulating: 28400000,
  burned: 4600000,
  community_pool: 6700000,
};

export const TIER_BREAKDOWN = [
  { label: 'Settler',      range: '0–499 $VICO',       color: '#B8B4D8', users: 12847 },
  { label: 'Pioneer',      range: '500–1,999 $VICO',   color: '#7F77DD', users: 3201  },
  { label: 'Builder',      range: '2,000–9,999 $VICO', color: '#534AB7', users: 612   },
  { label: 'Village Elder',range: '10,000+ $VICO',     color: '#26215C', users: 235   },
];

export const CATEGORY_LABELS: Record<string, string> = {
  earnings:       'Earnings',
  treasury:       'Treasury',
  'goal-category':'Goal Category',
  feature:        'Feature',
  policy:         'Policy',
  other:          'Other',
};

export const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  earnings:       { bg: '#E8F7F1', text: '#1D9E75' },
  treasury:       { bg: '#EEF1FE', text: '#534AB7' },
  'goal-category':{ bg: '#FFF3DC', text: '#BA7517' },
  feature:        { bg: '#E8F4FE', text: '#0A6FA8' },
  policy:         { bg: '#FEE8E8', text: '#C0392B' },
  other:          { bg: '#F0F0F0', text: '#666666' },
};
