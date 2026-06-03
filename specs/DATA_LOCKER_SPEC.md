# Village Data Locker — Complete Specification
# Source: User vision document. DO NOT delete or modify without updating code.
# Last updated: 2026-06-03

## The One Sentence
"You own your data — lock it for free, share it for profit, and audit every access forever."

## The Philosophy
Every platform treats user data as a resource to extract. The Village treats it as property to respect. This is a property rights feature, not a privacy feature. Users are the data owner — they see what exists, decide who accesses it, and earn when they share it.

The Village = data broker that works FOR the user. Village takes 30%, users get 70%.

## Color System
Day: page bg #F2FAF8 (teal tint), hero #085041 deep teal, locked state #04342C/#1D9E75/#9FE1CB, shared state #412402/#EF9F27/#FAC775
Night: page bg #060F0D, card #0C1A17, border #0F2820

## Routes
/village/locker — Home
/village/locker/my-data — Full data inventory
/village/locker/permissions — Sharing permissions per category
/village/locker/earnings — Data earnings history
/village/locker/marketplace — Data request marketplace
/village/locker/export — Download your data
/village/locker/delete — Delete your data
/village/locker/audit — Who accessed your data

Accessed from: Profile settings, Bank (data earnings deposit), global settings.

## Page 1 — Home
- Hero (#085041): "Your data. Your choice. Your earnings." with data categories count + earnings to date
- Privacy meter: 16px thick horizontal bar, teal=private left, amber=shared right, dot shows current position, "X of 12 categories shared · $X.XX/month estimated"
- Spirit recommendations: personalized sharing suggestions with earnings estimates
- 12-category grid: each card has icon + name + lock/unlock toggle + estimated monthly earnings

## The 12 Data Categories (NEVER share raw data — only aggregated anonymized signals)
1. GPS goals & progress — goal categories, sprint rates, probability scores (NOT goal titles)
2. Content engagement — OoWop patterns, watch completion, skip behavior (NOT post content)
3. Location data — general region/city only (NOT precise GPS, NOT home/work address)
4. Wellness metrics — health engagement patterns (NOT raw biometrics)
5. Financial behavior — spending category patterns (NOT balances or amounts)
6. Commerce behavior — Market categories browsed/purchased (NOT transaction amounts)
7. Social graph — connection count/categories (NOT identities of connections)
8. Goal content interests — Skill Stream categories (NOT personal goal details)
9. Entertainment preferences — Pavilion categories/viewing patterns (NOT viewing history)
10. Behavioral patterns — time-of-day usage, session frequency (NOT calendar content)
11. $VLG earning patterns — which activities, earning rates (NOT wallet balance/transactions)
12. Communication patterns — messaging frequency (NOT message content. EVER.)

## Page 2 — My Data
- Complete data inventory, section by section (Workshop/DreamLine/Create/Trading Post/Bank/Wellness/Spaces/Pavilion/Profile)
- Design principle: if user can't see it here, Village doesn't have it
- Download: JSON/CSV/PDF, GDPR-compliant, DocuSeal for PDF
- Selective export option

## Page 3 — Sharing Permissions
- Per-category cards: what IS included (specific), what is NEVER included (specific), who can buy (categories only, never company names), earnings estimate range
- Confirmation modal: specific plain-language text per category, earnings estimate, "Yes share" vs "Keep private"
- Global controls: Share everything | Lock everything | Data minimization mode (Spirit selects optimal config)

## Page 4 — Earnings
- Hero (#412402 amber): lifetime earnings + this month + "Deposited to Village Bank"
- 12-month bar chart (amber bars + trend line)
- Breakdown by category with earnings contribution
- Plain-language "How earnings work" explainer
- Payout preference toggle: USD → Village Bank | $VICO → ViCo wallet +15% bonus
- VS other platforms comparison: "What Facebook/Google/TikTok earn from your data vs what Village pays you"

## Page 5 — Data Marketplace
- Active data requests: buyer category (NEVER company name), data segments, price + per-user share, eligibility badge, potential earnings, Accept/Decline
- Historical requests: completed purchases the user participated in
- Buyer verification: approved use cases + prohibited (law enforcement without order, political targeting, discriminatory profiling, resale, re-identification)
- "Buyer trust standards" link

## Page 6 — Audit Log
- Every access chronological: date/time, who accessed, what category, purpose, legal basis
- Village internal vs approved buyer filter
- Export audit log as PDF
- Statement: "If you locked it, this log stays empty forever. That's the evidence our practices match our promises."

## Page 7 — Export
- Portable format (GDPR data portability)
- Selective export by category
- Scheduled monthly exports via email

## Page 8 — Deletion
- Delete specific categories (30-day removal, may affect features)
- Delete all data + account option
- Plain-language per scenario (note: on-chain Achievement Credentials can't be deleted — anonymized but permanent on blockchain)
- GDPR Article 17 reference number issued

## Revenue Economics (30/70 split)
Village: 30% (anonymization infrastructure, buyer verification, legal compliance)
Users: 70% direct (70% > Brave's BAT 30-40% > everyone else's 0%)

Minimum payout: $1.00 (carries forward if not reached)
Payment by: 5th of following month
$VICO payout bonus: +15%

## Data Anonymization Pipeline (3 stages before any commercial use)
1. Individual anonymization: strip/hash all PII (name, email, @handle, device ID, IP, precise location)
2. K-anonymity: minimum 1,000 users per attribute combination (prevents re-identification)
3. Differential privacy noise: calibrated statistical noise on numerical fields (preserves statistical utility, prevents exact extraction)

## Database Schema
data_sharing_preferences (user_id UNIQUE, 12 share_* booleans DEFAULT false, payout_preference, data_minimization_mode)
data_earnings (user_id, sale_id, amount_usd, amount_vico, vico_bonus_applied, categories_contributed, payout_status)
data_sales (buyer_category, buyer_id INTERNAL ONLY, data_categories, targeting_criteria, revenue split fields, anonymization_stage_completed, k_anonymity_threshold)
data_access_audit (user_id, accessor_type, accessor_name, data_category, access_purpose, legal_basis, sale_id)
data_deletion_requests (user_id, categories_to_delete, delete_account, status, gdpr_reference)
approved_data_buyers (buyer_internal_id UNIQUE, buyer_category, use_case_approved, use_case_prohibited[], gdpr_compliant, ccpa_compliant)

## Regulatory Compliance
GDPR: right to access (My Data), erasure (Delete), portability (Export), object (any category lockable anytime), explicit consent per category
CCPA: right to know, opt-out of sale, non-discrimination (locked users = same app experience), delete
COPPA: under-18 cannot share, default locked, explanation shown
Consent architecture: sharing toggle + confirmation modal = valid GDPR/CCPA consent
Data retention max: 3 years for inactive accounts, then auto-delete

## Connections to Rest of Village
- Bank: data earnings as line item in transaction history, "Data earnings" card on Bank home
- ViCo wallet: $VICO payout deposits here with "Data earnings" label
- Spirit AI: more precise recommendations when user shares more data; private users use session-only context
- Ads Manager: shared data powers targeting → ad revenue → buyback-and-burn → benefits $VICO holders including data sharers
- Onboarding: introduced after account creation, default = locked, Spirit explains in 2 sentences
- Profile: "Data Locker" link in settings, badge when new earning opportunities available
- Spirit tour: 5 steps explaining the system

## Spirit Tour Steps
1. Hero spotlight: "Every piece of data The Village holds about you lives here. You control all of it."
2. Privacy meter at 0%: "By default, everything is locked. Village cannot use your data commercially unless you say yes."
3. Earnings spotlight: "When you choose to share, you earn a direct cut of the revenue. This is your data."
4. Audit link: "The audit log shows every access. If you locked it, that log stays empty forever."
5. Navigate to My Data: "Tap any category to see exactly what we know about you."
