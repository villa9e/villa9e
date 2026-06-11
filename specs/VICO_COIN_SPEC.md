# VICO — VILLA9E COIN — COMPLETE SPECIFICATION

> Logged 2026-06-10. The core token economics of The Village. Supersedes scattered
> ViCo references. Built fully from day one, activated by revenue milestones.

## The one sentence (positioning)

> "ViCo is the first currency you mine with your own progress — every goal you
> complete, every skill you build, every life you improve earns you ownership of
> the platform that made it possible."

> "For the first time in history, your personal growth has a price — and it belongs
> to you."

Bitcoin solved trusted third parties controlling **money**. ViCo solves trusted
third parties controlling **the value you create with your time, attention, and
personal growth.** On The Village the value you create flows back to you.

---

## The 15 resolved design answers

1. **When to activate revenue backing:** not at 1,000 users — at **$10,000 MRR**
   (real commerce). Three phases: Phase 0 pre-revenue (free $VLG, no burn, $VICO not
   on-chain); Phase 1 revenue ignition at $10K MRR (deploy contracts to Polygon, open
   conversions, begin buyback-burn); Phase 2 Village Chain at sustained $1M MRR.
2. **Supply:** **33,000,000 $VICO, fixed forever.** ("Never more ViCo than years
   since Jesus walked the earth.") At $100/coin = $3.3B cap; $1,000 = $33B; $10,000 = $330B.
3. **Mining language:** goal completions ARE mining — make explicit in onboarding
   ("You are the mining rig. Your growth is the proof of work."). UI: "Block mined.
   +50 $VLG", "Goal mined. +500 $VLG."
4. **Buyback & burn:** **20% of all Village revenue** auto buys + burns $VICO (BNB
   model). Burn address `0x000...dEaD`. Weekly, public, on-chain verifiable.
5. **Premium features:** NOT subscriptions — **Proof-of-Stake Access.** Stake $VICO
   (locked, still yours, earns 5% APY) to unlock tiers. Removes supply, rewards
   believers, no cash obligation, not a subscription under consumer law.
6. **Village Funds** can allocate up to **20%** to $VICO (member-voted).
7–8. **Blockchain:** launch on **Polygon**, build **Village Chain** (Cosmos SDK +
   CometBFT, native $VICO gas, EVM-compatible, IBC), migrate at $1M MRR + 100K users.
9. **Tutorial:** explains mining concept in plain language, no jargon in product UI.
10. **Penalty:** fraud → investigation gate (72h) → reversal / 50% slash / 100% burn
   + ban for severe/repeat. Due process mandatory and appealable.
11. **Founding team mines too:** first GPS goal for every founder is "Build and launch
   the Village super app." Verified with GitHub commits, designs, legal docs, app store.
12. **Governance:** hybrid → progressive DAO handoff over 5 years (company control Y1–2,
   Elder proposals Y2, all-holder votes Y3, full DAO Y5, Uniswap model). 5% vote cap.
13. **Trading Post:** full $VICO integration — multi-currency deals, eStore pricing,
   P2P trades, $VICO as deal consideration (tokenized-equity style).
14. **Reserve asset:** progressive path to businesses/orgs/Funds holding $VICO as
   treasury ("Communities hold $VICO the way central banks hold gold").
15. **One sentence:** (above).

---

## Supply distribution (33,000,000 $VICO)

| Allocation | Amount | % | Purpose | Lock-up |
|---|---|---|---|---|
| Community mining pool | 13,200,000 | 40% | $VLG → $VICO conversions | Released as users convert |
| Ecosystem grants | 3,300,000 | 10% | Creators/devs building on Village | Milestone-based |
| Development treasury | 4,950,000 | 15% | Engineering, ops, infra | Multi-sig, 4-yr release |
| Founding team | 3,300,000 | 10% | Founders | 2-yr cliff, 3-yr vest |
| Strategic reserve | 4,950,000 | 15% | Listings, partnerships, stability | DAO-governed Y2+ |
| Liquidity provision | 3,300,000 | 10% | DEX pools at launch | Locked 1 year |

Founders get 10% not 15% — they earn the rest through the platform like every user.

---

## Conversion phases (halving schedule)

Community pool = 13.2M, split into 4 phases of 3.3M. Conversion rate = VLG per VICO
(rises each phase = less VICO per VLG over time):

| Phase | Threshold | Rate | 10,000 $VLG converts to |
|---|---|---|---|
| 1 | first 3.3M | 100 | 100 $VICO |
| 2 | next 3.3M | 200 | 50 $VICO |
| 3 | next 3.3M | 400 | 25 $VICO |
| 4 | final 3.3M | 800 | 12.5 $VICO |

Minimum conversion: 10,000 $VLG. Early completers earn the most — the Bitcoin early-holder dynamic.

---

## Staking tiers (Proof-of-Stake Access)

| Tier | Staked | Benefits |
|---|---|---|
| Settler | 0 | Full standard app, $VLG earning, basic Spirit |
| Pioneer | 100 $VICO | Spirit Pro, Wellness Pro, advanced analytics |
| Builder | 500 $VICO | Pioneer + priority deal badge, featured Market, premium Triggers |
| Village Elder | 2,000 $VICO | Builder + DAO voting, community calls, early access, verified badge |

Staking earns +5% APY in $VICO from the strategic reserve.

---

## Buyback & burn mechanics

Revenue → burn: 20% of Ads spend, 20% of Market fees, 20% of Bank fees, 20% of
premium/subscription revenue, 20% of Village Fund fees, 100% of slash penalties,
2.5% of ViCo NFT secondary sales.

Execution: n8n tracks revenue in real time; weekly it converts the 20% USD allocation
to MATIC, buys $VICO from the DEX pool (the buyback), sends it to `0x000...dEaD` (the
burn), records on-chain. Public dashboard at village.com/burn (total burned, circulating
supply, tx links, next-burn countdown).

---

## Smart contracts (Polygon first, Village Chain later)

- **VICOToken.sol** — ERC-20, MAX_SUPPLY 33,000,000e18, `burn()`, `circulatingSupply()`,
  `totalBurned`. Entire supply minted to distribution contract.
- **VICODistribution.sol** — community pool 13.2M, 4 phase thresholds, conversion rates
  [100,200,400,800], `getCurrentPhase()`, `getConversionRate()`, `convert()` (server-authorized).
- **VICOStaking.sol** — `stake()`, `unstake()` (5% APY), `slash()` (slash authority
  multisig, sends slashed tokens to burn address). MIN_STAKE_TO_VOTE 2,000.
- **VICOBuybackBurn.sol** — `executeBuybackBurn()` swaps MATIC→VICO on Uniswap V3 and
  burns it (executor-authorized = n8n).

(Full Solidity in the source vision doc; preserve constants and signatures exactly.)

---

## $VLG earning rate table (base rates — see GVS spec for dynamic multipliers)

Workshop: sprint_action_verified 10, sprint_complete 50, goal_complete 500 (base —
now GVS-scaled), template_cloned 5, oowop_received 0.5 (cap 100/day/video),
oowop_given 1, first_gps_created 25, streaks 30/150, content views 10/50/200/1000,
content_workshop_matched 100, content_viral_oowop_10k 500.
Wellness: daily_checkin 1, streaks 10/50, journal 1, wearable_connected 25,
telehealth 20, wellness_goal 100, weekly_digest 5.
Trading Post: deal_published 100, deal_match 25, smart_contract_signed 200,
estore_sale 2% of value, coaching_session 40, tribe_connection 2, testimonial 10.
Bank: account_connected 50, direct_deposit 100, financial_goal_created 20,
financial_goal_reached 200, fund_contribution 1%, credit_builder_6mo 300,
first_vico_conversion 500.
Spaces: trigger_created 10, trigger_completed 5, ten_triggers_week 25.
Profile: profile_completed 50, first_credential 75, referral_joined 50,
referral_first_sprint 100, referral_first_conversion 200.
DreamLine: video_80pct 0.5, daily_15min 2, early_oowop_viral 10.

(Full `VLG_EARN_RATES` object in source — preserve.)

---

## Database schema (key tables)

`vico_wallets` (custodial/non_custodial, polygon + village_chain address, vico_balance,
vlg_balance, staked_vico, staking_tier), `vlg_transactions`, `vico_conversions`
(phase, rate, tx_hash), `vico_burns` (revenue_buyback/slash/nft, circulating_after),
`vico_stakes`, `vico_slash_investigations`, `burn_schedule`, `vico_governance_proposals`,
`vico_votes`. (Full DDL in source vision doc.)

---

## API routes

`POST /api/vico/convert`, `GET /api/vico/balance/:userId`, `POST /api/vico/stake`,
`POST /api/vico/unstake`, `GET /api/vico/burn-stats` (public), `POST /api/vico/buyback-burn`
(n8n weekly), `GET /api/vico/phase`, `POST /api/vico/earn` (internal), 
`GET /api/vico/transactions/:userId`, slash + governance routes.

---

## Village Chain (Phase 2, Cosmos SDK)

Chain id `village-1`, native $VICO, 2s blocks, CometBFT PoS, 21→100 validators,
min validator stake 10,000 $VICO. Modules: bank, staking, gov, distribution, slashing,
ibc, evm (Cosmos EVM), feegrant (Village pays new-user gas), authz. Custom modules:
x/vico-earn, x/vico-burn, x/village-id, x/gps-proof. IBC to Polygon/Cosmos Hub/Osmosis/
Ethereum(Axelar). Explorer: Big Dipper. Migration: snapshot Polygon balances → 1:1 swap
contract, 90-day window.

---

## Launch checklist

Phase 0 (build): VLG schema + earning everywhere, balance/history UI, 4 contracts on
Mumbai testnet, wallet flow, conversion UI, audit (Certik/OpenZeppelin), legal opinion,
burn dashboard, onboarding tutorial, n8n buyback-burn.
Phase 1 ($10K MRR): deploy to Polygon mainnet, publish + verify contracts, publish
audit, DEX pool + 1-yr liquidity lock, enable conversions, announce, first burn.
Phase 2 ($1M MRR): Cosmos SDK project, custom modules, testnet → 21 validators →
mainnet, swap contract, migrate, Tier-3 listings, Big Dipper.

See also [[project-villa9e-vision-log]], GROWTH_VERIFICATION_GVS_SPEC.md (Proof of Growth
+ dynamic earning), VICO_GOVERNANCE_SPEC.md, VICO_INVESTOR_ECONOMICS.md.
