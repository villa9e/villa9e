# Village Chain Explorer — Complete Specification
# Source: User vision document. DO NOT delete or modify without updating code.
# Last updated: 2026-06-03

## What It Is
Public transparency layer of The Village blockchain economy. Every $VICO transaction, Growth Receipt, Achievement Credential, DAO vote, merchant payment, buyback-and-burn — publicly readable in plain human language. Built for people, not developers.

Lives at explorer.village.com. Phase 1: Polygon filtered to Village contracts. Phase 2: Big Dipper extended with Village modules on native Village Chain.

## Color System
Day: page bg #F5F6FA, card white, border #E0E4F0, primary blue #0033CC, purple #534AB7, teal #1D9E75, amber #EF9F27, hash text #185FA5 (always tappable links), hero bg #0033CC
Night: page bg #0A0D1A, card #111828, border #1E2840, primary #4D72FF, hash text #85B7EB

## Routes (explorer.village.com)
/ — Explorer home
/address/{wallet} — Wallet overview
/receipt/{receiptId} — Growth Receipt detail
/credential/{id} — Achievement Credential detail
/tx/{hash} — Raw transaction detail
/block/{number} — Block detail
/token/vico — $VICO token overview
/burn — Buyback-and-burn dashboard
/governance — Governance vote records
/merchants — Merchant transaction directory
/audit — ViCo distribution daily audit
/leaderboard — Top earners and achievers

## Global Navigation
- Left: Village teepee + "Chain Explorer" wordmark
- Center: Search bar (primary nav — handles all format types)
- Right: Network badge + health dot + latest block display
No sidebar — reference tool, not nav-heavy.

## Search Intelligence
Routes by input format:
- 0x...42chars → wallet address → /address/{wallet}
- @handle → resolve to wallet → /address/{wallet}
- 0x...66chars → transaction → /tx/{hash}
- receipt_... → /receipt/{id}
- cred_... → /credential/{id}
- Integer → /block/{number}
- Merchant name/@handle → filtered wallet view
- Plain text → Meilisearch across all human-readable fields

## Page 1 — Home
- Blue hero: network name, live ticker (latest block, TPS, total burned, total Growth Receipts)
- Prominent search bar (52px height)
- Live activity feed: real-time on-chain events every 5s in plain English
  Examples: "@maya verified Sprint action · +10 $VLG", "Weekly burn: 8,400 $VICO", "@rob completed goal · +798 $VLG"
- Stat grid (6 tiles): total txs, total receipts, total credentials, total burned (amber), active Elders, merchant payments
- Quick access cards: Burn dashboard / Achievement records / Governance votes / Audit log
- Recent blocks table (last 5)

## Page 2 — Wallet Overview (/address/{wallet})
- Identity card: avatar+@handle if linked Village account, else identicon. $VICO balance (amber), USD equiv, staking tier, View on Village app link, full address with copy
- Summary stats: Total Receipts, Total Credentials, Total $VICO received, Total $VICO sent
- Tabs: Activity | Growth Receipts | Credentials | Token Transfers | Governance | Merchant
- Activity tab: unified chronological feed, all event types, infinite scroll, filters
- Growth Receipts tab: stats at top (total actions, $VLG earned, verification method breakdown), receipt cards with goal, action, sprint ref, verification method, Spirit confidence, $VLG earned
- Credentials tab: certificate cards with goal, stats row, skill tags, AI experience summary, on-chain proof
- Token Transfers tab: table with received (teal) / sent (amber) / burned (red) color coding
- Governance tab: votes cast + proposals submitted
- Merchant tab: $VICO received as merchant with summary

## Page 3 — Growth Receipt Detail (/receipt/{receiptId})
- Purple hero card: Receipt ID (monospace), "Verified on Village Chain" teal badge, timestamp
- "What was accomplished" section:
  - Goal title + category badge + action level badge
  - Specific action title + Sprint reference
  - Verification method with icon + Spirit AI confidence score (colored bar)
  - $VLG earned (amber 24px) + rigor score explanation
- Technical verification section:
  - proofHash in full monospace + plain-language explanation
  - "Verify your own file" tool: drag file → SHA-256 computed CLIENT-SIDE → compare → "Match ✓" or "No match ✗"
  - Raw on-chain data table (all hashes, block number, tx hash, timestamp)

## Page 4 — Achievement Credential Detail (/credential/{id})
- Certificate card (480px centered, white, formal):
  - Village teepee logo top center
  - "Certificate of Achievement"
  - User @handle or display name in 22px
  - Goal title + category color
  - "Verified across N Sprint actions and N Sprints"
  - GVS score with 5-dimension bars
  - Completion date, credential ID in monospace, QR code
  - Village blue seal bottom right
  - Download PDF button (DocuSeal) + Share button
- What this credential represents (AI-generated prose, stored on-chain)
- Skill tags grouped by category: Technical / Business / Personal development / Creative
- Growth Receipts supporting this credential (collapsed, ordered by sprint)
- Endorsements: count, each with @handle, tier badge, wallet, timestamp, tx hash
- "Endorse this credential" button (Village login required, Elder endorsements highlighted)

## Page 5 — $VICO Token (/token/vico)
- Token hero: logo, name, current price (CoinGecko API), 24h change, 7-day sparkline
- Key metrics: total supply (33M, always), circulating, total burned (amber highlighted), holders, transfers, market cap
- Supply breakdown: stacked bar with 6 colored segments matching allocation table
- Token unlock timeline: vesting events as future dates
- Conversion phases timeline: Phase 1-4, each with progress bar, rate, % complete
- Rich list: top 50 holders, ranked, @handle if linked, balance %, staking tier, last active, "5% cap applied" badge

## Page 6 — Burn Dashboard (/burn)
- Dark hero (#2C1800): "Total $VICO burned forever" in 40px white, progress bar (moves only right, never left)
- Burn rate stats: lifetime / this week / this month / projected annual
- Weekly burn history chart: 52-week bar chart showing upward trend
- Per-transaction list: date, $VICO burned (amber), USD value, revenue source breakdown %, tx hash, "Burned forever" teal badge
- Revenue source breakdown is KEY: proves burn is from real platform revenue (Ads/Market/Bank/Subscriptions)
- Burn verification section: explanation of 0x...dEaD burn address, "Verify burn address" link

## Page 7 — Governance Records (/governance)
- Stats: total proposals, passed, rejected, total votes
- Voter participation rate
- Proposal table: VIP#, category, title, status, votes for %, total votes, proposer, dates
- Vote records per proposal: every wallet, vote choice, voting power, tx hash

## Page 8 — Daily Audit Log (/audit)
- Today's result: "All clear ✓" teal or "N issues flagged" amber
- Methodology explanation: daily midnight audit, all $VLG credits vs on-chain Growth Receipts
- Audit history table: date, credits checked, mismatches, status, audit tx hash (audit itself written on-chain)
- Flagged items (historical): full public disclosure including resolution

## Page 9 — Merchant Directory (/merchants)
- Summary stats: total merchants, total $VICO transacted, total transactions, weekly volume
- Searchable merchant list: name, @handle, category, verified badge, lifetime $VICO received, transaction count, join date

## Big Dipper Extension (Phase 2 — Village Chain)
Big Dipper base: block explorer, tx detail, validators, staking, IBC, governance, token holders.
Village custom modules (as Big Dipper plugins, open source):
1. Growth Receipt decoder — VillageGrowthLedger events → human-readable receipt pages
2. Achievement Credential renderer — certificate design from AchievementCredential struct
3. Burn tracker — VICOBuybackBurn events → burn dashboard
4. Human-readable activity feed — all Village contract events → plain English
5. @handle resolution — wallet addresses → @handles via Village API
6. GPS category labeling — goal hashes → human-readable category names

## Database Schema (Cache Layer)
explorer_receipts_cache, explorer_credentials_cache, explorer_burn_cache, explorer_stats_cache (refreshed every 60s), explorer_search_index (incremental real-time updates, full rebuild weekly)

## API Routes
GET /api/explorer/search?q={query}
GET /api/explorer/live-feed (SSE stream)
GET /api/explorer/stats
GET /api/explorer/address/{wallet} + tabs
GET /api/explorer/receipt/{receiptId}
GET /api/explorer/credential/{credentialId}
POST /api/explorer/verify-hash
GET /api/explorer/burn/stats + history
GET /api/explorer/token/vico
GET /api/explorer/governance/proposals
GET /api/explorer/audit/latest + history
GET /api/explorer/merchants/list
GET /api/explorer/leaderboard?type=earners|achievers|elders

## Open Source Stack
Big Dipper (Cosmos explorer), Ethers.js (on-chain reads), Meilisearch (full-text search), Next.js (SSR), Victory Native/D3 (charts), DocuSeal (credential PDFs), CoinGecko API ($VICO price), n8n (audit automation + cache refresh), PostgreSQL (cache layer)

## The Explorer's Purpose
Not for developers — for people. Proves work was done. Proves burn happened. Proves votes passed. Proves every $VLG credit is backed by real on-chain proof.
"Not 'trust us.' Look for yourself. It is all right there. Every action. Every goal. Every coin. Every vote. Every burn. Permanently. Publicly. In plain language."
