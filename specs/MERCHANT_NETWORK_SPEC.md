# ViCo Merchant Network — Complete Specification
# Source: User vision document. DO NOT delete or modify without updating code.
# Last updated: 2026-06-03

## What It Is
Bridge between Village's internal economy and real world. Village creators/sellers accept $VICO as payment from customers — both Village members and general public.
Phase 1: Village member merchants. Phase 2 (Year 2-3): external businesses.

## Color System
Day: page bg #FFFBF2 (warm off-white), hero #412402, accent #EF9F27, card border #F0D9B0, button #BA7517
Night: page bg #1A1400, hero #2C1800, card #221A00, button #EF9F27 text #412402

## Routes
/village/merchant — home (onboarding if new)
/village/merchant/dashboard — dashboard
/village/merchant/payments — QR / Embed / Payment Links
/village/merchant/invoices — invoice generation + history
/village/merchant/transactions — transaction history
/village/merchant/settings — settings, payout preferences
/village/merchant/map — in-app merchant discovery map
/village/merchant/onboarding — new merchant setup

## Onboarding (5 steps)
1. Business identity: name, type (6 cards: creator/retail/service/events/food/other), category, location (physical address or online-only), website
2. Link Trading Post eStore (optional, bidirectional — eStore gets verified badge, merchant gets Sales from eStore line item)
3. Payout preference: Hold $VICO (amber) | Auto-convert to USD (teal) | Bank account selector | Min threshold
4. Verification: business registration, license, tax ID, or social proof — AI document review (same system as credentials)
5. Launch: merchant QR preview, 3 action buttons

## Dashboard
- Hero (#412402 bg): total $VICO received, USD equivalent (CoinGecko), transaction stats
- Stat grid: total received, USD equiv, transaction count, unique customers
- Payout status: Hold (balance + hold pill) or Convert (threshold progress bar)
- Recent transactions: 5 rows with customer avatar, amount, description, method icon, status
- Merchant map preview card
- AI merchant insights (Spirit-powered, green AI card)

## Payments Page (3 tabs)

### QR Code
- 240×240 QR with Village teepee logo centered
- Fixed amount vs customer-enters toggle
- Currency display: $VICO or USD (converts at current rate)
- Download PNG (1200×1200) + Print kit ZIP (card/tent/sticker/poster)

### Embed (Web Payment Button)
3 style variants: Standard (amber), Dark (deep amber), Outline (white/amber border)
HTML snippet with vico.js script tag. data-merchant, data-amount, data-currency, data-description attributes.
Deep link to Village app OR web payment page for non-app users.
Shopify + WooCommerce plugin cards.

### Payment Links
- Create: description, amount (optional), expiry, one-time toggle
- URL format: pay.village.com/{merchantHandle}/{linkId}
- Active links list with: copy, share, QR code, deactivate

## Invoices
- Customer field (Village @handle or email)
- Line items with quantity × unit price = line total
- Tax rate optional
- Currency in $VICO or USD (USD shows $VICO equivalent at creation time)
- Send via Village notification or email
- Tabs: Unpaid | Paid | All
- n8n reminders: due date + 7 days after due

## Transaction History
- Filters: date range, payment method, customer, status, min amount
- CSV export (QuickBooks/Wave/FreshBooks compatible)
- Table: date/time, customer, description, $VICO, USD at time, method, status, tx ID
- Refund button per transaction
- On-chain tx hash link

## Merchant Settings
- Business profile: name, type, category, location, hours, description, photo
- Verification: status, documents, add more
- Payout: Hold | Convert | Split (slider 0-100% VICO) + bank account + threshold
- Tax: EIN/SSN (encrypted), tax rate, year-end summary PDF
- Notifications: per-payment, daily summary, weekly report, invoice due, new customer
- Danger zone: deactivate or close account

## Merchant Map
- Leaflet.js + OpenStreetMap (no Google Maps)
- Custom pin: 32px amber circle, teepee icon, teal checkmark for verified
- Bottom sheet on pin tap: photo, name, category, distance, hours, rating, 3 buttons (Pay now / View profile / Get directions)
- Filter strip: All / Nearby / Online / category filters / Verified only
- List view toggle (online-only merchants only appear here, not on map)
- Search by name/category/location

## Customer Payment Flow (4 steps)
1. Payment screen: merchant avatar+name+verified badge, $VICO amount (amber 28px), USD equiv, wallet balance
2. "Pay X $VICO" button + biometric auth (Face ID/fingerprint)
3. Processing (1-3s): teepee pulsing, on-chain transaction, auto-convert if set
4. Confirmation: teal checkmark, tx ID, "View receipt" (DocuSeal PDF) + "Share receipt"
Receipt: merchant name+verification, date/time, amounts, tx ID, chain hash, QR to explorer

## Verified $VICO Merchant Badge
Appears in 5 places after business verification:
- Trading Post eStore: teal checkmark + "$VICO accepted" below store name
- Tribe connection card: alongside role badges
- Village Profile: credentials section
- Payment receipts: header
- Merchant map: pin checkmark + bottom sheet

## Payment Button Technical Spec (vico.js)
Single JS file, no dependencies. Reads data-* attributes from button element.
Detects Village app via UserAgent → deep link, otherwise → popup payment window.
URL: pay.village.com/{merchantHandle}?{params}

## Database Schema
merchant_accounts, merchant_verification_documents, merchant_payment_links, merchant_invoices, merchant_transactions

Key fields:
- merchant_accounts: payout_preference (hold|convert|split), payout_split_vico_pct, is_verified, merchant_handle UNIQUE, lat/lng for map
- merchant_transactions: payment_method (qr|web_button|payment_link|invoice|estore), payout_action (held|converted|split), chain_tx_hash

## API Routes
POST /api/merchant/onboarding
GET /api/merchant/dashboard
GET /api/merchant/qr
GET /api/merchant/embed-code
POST /api/merchant/payment-links
POST /api/merchant/invoices
POST /api/merchant/payment (public, called by web button)
POST /api/merchant/payment/:sessionId/confirm
GET /api/merchant/map
GET /pay/:merchantHandle (public payment page)

## n8n Automations
1. Payment processing: on-chain transfer → auto-convert if set → receipt PDF → notifications
2. Invoice reminders: daily 9am, checks due_at, sends reminder, overdue +7 days
3. Merchant map update: on settings change, geocode via OpenStreetMap Nominatim, update lat/lng + Meilisearch
4. Weekly digest: Sunday 8am, AI insights, n/n change
5. Verified badge sync: on is_verified=true, update eStore + profile + notification

## Open Source Stack
Leaflet.js (map), OpenStreetMap/Nominatim (tiles+geocoding), Ethers.js (transactions), WalletConnect (web payments), DocuSeal (receipts), n8n (automation), Meilisearch (merchant search), Ollama+LLaMA3 (insights), Unit BaaS (USD conversion), ntfy (notifications)

## ViCo Economy Role
Every $VICO payment = demand. Fixed supply + demand = price pressure.
Virtuous loop: complete goals → earn $VLG → convert to $VICO → spend at merchants → merchants hold or convert → buyback-and-burn reduces supply → early goal-completers rewarded.
Merchant network is the demand side of the ViCo economy made real.
