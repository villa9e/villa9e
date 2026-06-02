# Village Bank — Complete Build Specification
# Source: User vision document. DO NOT delete or modify without updating the corresponding code.
# Last updated: 2026-06-01

## What It Is
"The LinkedIn of finance." Full personal and professional financial operating system — banking, investing, collective funds, lending, compliance, budgeting, goal tracking, and a financial social layer. Three user types: everyday users, professional investors/fund managers, bankers/financial professionals.

## Color System
### Day mode
- Page bg: #F2F7FA (cool blue-white, distinct from platform default)
- Card surface: #FFFFFF
- Card border: #C8DCE8
- Primary text: #0A1F2E (deep teal-navy)
- Secondary text: #3A5A6E
- Tertiary: #7A9AAE
- Primary action: #0A5F8A (deep teal)
- Success: #1D9E75
- Positive amounts: #0F6E56
- Negative amounts: #A32D2D
- AI card: #EAF3DE bg, #27500A text
- Compliance banner: #EAF3DE bg, #639922 border

### Night mode
- Page bg: #060F18
- Card surface: #0E1E2E
- Card border: #1A3040
- Primary text: #EEF4F8
- Primary action: #2A9FCC

## Navigation — 5 tabs
1. Home — complete financial dashboard
2. Move — send, receive, pay, transfer
3. Invest — stocks, crypto, portfolio
4. Village Fund — collective micro-trusts
5. More — financing, budget, goals, financial profile, statements

## APIs Required
- **Unit BaaS** — banking, ACH, debit cards, FDIC accounts, direct deposit, RTP instant payments
- **Alpaca Securities** — stocks (FINRA registered, SIPC member)
- **Coinbase Prime** — crypto
- **Polygon blockchain** — smart contracts, Village Fund, crypto loans
- **Persona** — KYC identity verification (free tier 500 verifications)
- **Plaid** (already in env) — account connection, balance sync
- **DocuSeal** — e-signatures (already planned)
- **OpenLaw** — legal document generation
- **Hardhat + Ethers.js** — smart contract compilation and deployment
- **Stripe Atlas** — LLC formation ($500 per fund, split among founding members)
- **Alpha Vantage / Polygon.io** — market news and data
- **Victory Native** — charts (open source)

## Pages to Build

### Page 1 — Bank Home Dashboard
- Total balance card (deep teal `#0A5F8A` background, always dark even in day mode)
- Balance breakdown: Available / Pending
- Net worth toggle (expands to show assets minus liabilities)
- Account pills (one per connected account)
- Quick actions: Send / Receive / Deposit / Finance (+ Pro Tools for verified professionals)
- AI financial insight card (green AI card, reads all account data)
- Spending snapshot (horizontal bar chart by category)
- Connected accounts list
- Recent transactions (10 most recent, across all accounts)
- Village Financial Network preview (horizontal avatar strip of financial connections)

### Page 2 — Send Money
- Compliance banner (always visible on all financial action screens)
- Recipient search (Village users via Meilisearch, external bank routing/account)
- KYC verified badge on Village users
- Amount entry with numpad + currency toggle (USD/BTC/ETH/MATIC)
- Speed selector: Standard (free, ACH 1-3 days) | Instant ($0.25, RTP seconds)
- Crypto transfer with Ethers.js, gas fee shown before submit
- Review and confirm screen

### Page 3 — Receive Money
- QR code display encoding Village payment URL
- Account details (routing + account number) with copy/hide
- Request specific amount toggle (regenerates QR with amount encoded)
- Wallet address for crypto

### Page 4 — Invest
- Portfolio value card (deep teal background, sparkline chart via Victory Native)
- Stocks tab / Crypto tab
- Holdings list (Alpaca for stocks, Coinbase Prime for crypto)
- Watchlist with add-from-search
- Discover: Trending / Top Movers / AI suggested (local Ollama, informational only)
- Asset detail page: price chart (OHLC via Alpaca, 1D/1W/1M/3M/1Y/All), stats, news, buy/sell
- Order flow: Market | Limit, shares or dollars, review, submit to Alpaca
- PDT warning (auto-enforced by Alpaca)

### Page 5 — Village Fund (Micro-Trusts)
- Reg D / Reg CF compliance banner
- Portfolio summary card
- My funds list (each fund: name, members, AUM, MTD return, focus, performance chart)
- Fund detail: holdings, members, transaction log, governance/votes, documents
- Fund creation flow (6 steps): details → invite → KYC → LLC formation (Stripe Atlas) → legal docs (OpenLaw + DocuSeal) → smart contract deployment (Hardhat → Polygon)
- Contribution, Vote, Distributions actions per fund
- Smart contract: contribution logic, voting logic, distribution logic, exit logic

### Page 6 — Budget and Spending
- Month summary card (teal, progress bar turns amber at 80%, red at 100%)
- Category budget cards with progress bars
- Merchant insights (AI groups by merchant, "You spent $847 at Amazon")
- Recurring transactions (AI auto-identifies subscriptions, cancel link)
- Cash flow timeline (30-day paired bar chart: income green, spending teal)

### Page 7 — Financial Goals
- Overview card (total saved vs target, goals on/off track, earliest completion)
- Goal cards: progress bar, monthly contribution, projected completion, AI suggestion
- Goal creation flow: category grid → details (target, date, contribution) → automation toggle → AI monitoring toggle

### Page 8 — Financing and Lending (Unit bank partner)
- Eligibility AI card (soft pull preview, no score impact)
- Personal loan card (Unit, APR range, use cases)
- Village business loan card (requires verified Trading Post activity)
- Crypto-backed loan card (collateral = crypto holdings, no credit check, Polygon smart contract)
- Credit builder card (secured, reports to all 3 bureaus via Unit)
- Application flow: pre-qual (soft) → full application (hard, with consent checkbox) → DocuSeal signing

### Page 9 — Direct Deposit
- Village Bank account card: routing number, account number (Unit via Evolve Bank)
- Employer setup instructions
- Direct deposit form PDF download (DocuSeal template)
- Mobile check deposit (camera with guided overlay, MICR line extraction, Unit RDC)
- Deposit history

### Page 10 — Financial Profile
- Banner + avatar header
- Professional identity: title, credentials, verified badge row
- Stats: network size, Village Funds, Trading Post deals
- FINRA BrokerCheck integration for Series licenses
- Track record (blockchain-verified Village Fund performance, deal outcomes)
- Financial activity feed (public: new fund, deal closed, goal completed)
- Store shortcut if has Trading Post eStore

### Page 11 — AI Financial Chat
- Disclaimer banner (permanent, non-dismissible: "Not a licensed financial advisor")
- AI opens proactively with specific data summary
- Matrix-style chat interface
- Can do: explain transactions, project goals, explain terms, summarize funds/deals, flag patterns
- Cannot do: recommend securities, predict prices, give tax advice, guarantee outcomes
- Suggested questions (3 pills, updated daily)

### Page 12 — Statements and Tax Documents
- Monthly statements (PDF download, Unit + Village Bank formatting)
- Annual summaries
- 1099 forms (Unit generated)
- 1099-B from Alpaca for investment sales
- Year-end CSV export (TurboTax/H&R Block compatible)

## Data Flow
User action → n8n → partner API (Unit/Alpaca/Coinbase/Polygon) → result → n8n → Supabase + Nextcloud → screen update
Blockchain layer: all smart contract actions (Village Fund contributions, votes, distributions, crypto loans) on Polygon, immutable.

## Spirit Connection
Spirit must have read access to:
- Account balances and 30-day trend
- Transaction history and category patterns
- Investment portfolio performance
- Village Fund returns
- Budget progress and goal projections
- Active loans and credit profile
Spirit uses this to power the AI insight card, the AI financial chat, and pre-appointment health briefs when financial stress is detected.
