# ViCo Governance — Complete Specification
# Source: User vision document. DO NOT delete or modify without updating code.
# Last updated: 2026-06-03

## What This Is
Community ownership layer of The Village. $VICO holders govern earning rates, treasury spending, feature priorities, platform policy. Lives Year 2 but built functional from day one.

Core principle: the community that built the platform's value controls how that value is deployed.

## Routes
/village/vico — overview
/village/vico/proposals — all proposals with filters
/village/vico/proposals/[id] — proposal + vote + discussion
/village/vico/submit — submit proposal
/village/vico/treasury — DAO treasury and supply mechanics
/village/vico/elders — Elder leaderboard

Pre-Year-2: voting and submission show "launching Year 2" state. Overview, treasury, leaderboard fully functional.

## Color System
### Day mode
- Page bg: #F8F7FF (barely-there purple tint)
- Hero card: #26215C deep purple
- Card border: 0.5px solid #DDDAF8
- Active proposal accent: 1.5px solid #7F77DD left border
- Section label: #534AB7
- Elder badge: #EEEDFE fill, #3C3489 text
- Vote for: #1D9E75 teal
- Vote against: #E24B4A red
- Treasury hero: #085041 deep teal
- Primary button: #534AB7 purple

### Night mode
- Page bg: #100E1E
- Hero card: #1A1640
- Card surface: #1C1830
- Card border: 0.5px solid #2E2A4A
- Primary button: #7F77DD

## Screen 1 — Overview (/village/vico)
- Hero card (#26215C): $VICO total supply, circulating/burned counts (live from contract)
- Stats: Active proposals, Village Elders count, Total votes cast, Treasury balance
- User governance status: staked amount, tier pill, voting power, proposals submitted, participation rate
- "How governance works" plain-language card: minimums, periods, thresholds

## Screen 2 — Proposals (/village/vico/proposals)
- 4 filter tabs: Active | Passed | Rejected | All
- Proposal cards: VIP number + category pill, title, status pill, vote progress bar, percentage breakdown
- Active: 1.5px left border in #7F77DD
- Passed: teal on-chain execution confirmation + tx hash link

## Screen 3 — Individual Proposal (/village/vico/proposals/[id])
- Full description + execution plan section
- Vote tally card: dual-color progress bar, threshold status line
- Vote buttons: For (teal) / Against (red) / Abstain (gray) — equal width
- Voting power display + on-chain finality warning
- Confirmation modal before vote submitted
- Discussion thread: sorted by OoWop count (community curates best arguments to top)
- Comment OoWop button (any tier), comment input (Elder only)
- Non-Elder lock card: explains path to Elder tier, never says "you cannot"

## Screen 4 — Submit Proposal (/village/vico/submit)
- Eligibility check: user stake vs 10,000 $VICO minimum
- Form: category selector, title (VIP number auto-populated), description (100 char min), execution plan (required), supporting URL
- Category-specific placeholder text
- Preview button before submission

## Screen 5 — Treasury (/village/vico/treasury)
- Hero card (#085041): balance from contract, refreshed every 5 min
- Allocation bars: Community grants (purple) / Staking rewards (teal) / Liquidity (amber)
- Recent treasury transactions: outflows red, inflows teal
- Supply mechanics: total/burned/circulating/phases from smart contracts

## Screen 6 — Village Elders (/village/vico/elders)
- Leaderboard: avatar, username, Elder badge, staked VICO, proposals count, participation rate
- User's own row: blue left border + "You" label
- Sort: most staked / most proposals / highest participation
- Tier breakdown card: Settler/Pioneer/Builder/Village Elder counts

## Governance Rules
- Min stake to vote: 2,000 $VICO
- Min stake to propose: 10,000 $VICO
- Discussion period: 3 days
- Voting period: 7 days
- Pass threshold: 60%
- Max voting power cap: 5% of circulating supply per wallet

## Smart Contract — VICOGovernance.sol
- Reads staking from VICOStaking.totalStakedByUser()
- getVotingPower(): min(staked, circulating × 5%)
- castVote(): checks stake, period, no double-vote
- isPassed(): votes_for/total_votes >= 60%
- Emits VoteCast event for each vote
- On-chain proposal hash = keccak256 of proposal content

## Database Tables
```sql
vico_governance_proposals (id, vip_number UNIQUE, proposer_user_id, title, category, description, execution_plan, supporting_url, status, discussion_starts_at, voting_starts_at, voting_ends_at, votes_for, votes_against, votes_abstain, total_eligible_voters, on_chain_proposal_id, execution_tx_hash)
vico_votes (id, proposal_id, user_id, wallet_address, vote, voting_power, on_chain_tx_hash, voted_at)
vico_governance_comments (id, proposal_id, user_id, content, oowop_count, created_at)
vico_governance_comment_oowops (id, comment_id, user_id, UNIQUE(comment_id, user_id))
vico_treasury_allocations (id, week_ending UNIQUE, community_grants_balance, staking_rewards_balance, liquidity_balance, total_balance)
vico_treasury_transactions (id, transaction_type, amount, direction in|out, vip_number, chain_tx_hash)
```

## API Routes
GET /api/governance/overview — proposal counts, elder count, treasury, user status
GET /api/governance/proposals — paginated with status filter
GET /api/governance/proposals/:id — full proposal + comments sorted by oowop_count
POST /api/governance/proposals — create (requires 10k staked)
POST /api/governance/vote — cast vote (requires 2k staked), writes on-chain + DB
POST /api/governance/comments — post comment (Elder only)
POST /api/governance/comments/:id/oowop — any tier
GET /api/governance/treasury — allocations + transactions + supply
GET /api/governance/elders — paginated with sort

## n8n Automations
1. Proposal lifecycle: every 30min, discussion→voting at voting_starts_at, voting→result at voting_ends_at, notify Elders
2. Execution workflow per category: earning rates → vlg_earn_rates table, treasury → multi-sig request, goal categories → Meilisearch, features → AppFlowy task
3. Weekly treasury snapshot: Sunday midnight, reads contracts, writes vico_treasury_allocations
4. Elder notifications on new proposals

## Integrations
- Bank → Wallet → staking balance + tier
- Bank → "Stake more" links to governance entry
- DreamLine: passed proposals = special announcement card type
- Profile/Hut: Elder badge from staking_tier = 'elder'
- Notifications: Elder alerts for new proposals
- Village Chain explorer: every tx hash links out
