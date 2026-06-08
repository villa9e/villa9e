# Villa9e — Vision vs. Code Audit & Live-Readiness Plan
Generated 2026-06-07. Five parallel deep-dive audits compared every spec in `/specs` line-by-line against the actual code.

## How to read this
Every spec'd feature was classified into exactly one of:
- **not built** — no code exists
- **built-bug** — code exists but is broken / mock-data-only / half-wired / throws
- **built-fully-working** — works on real data, has rough edges for production
- **built-live-ready** — ships today as-is

**Headline number: zero features across all 11 specs were classified as `built-live-ready`.**

---

## THE ONE FACT THAT EXPLAINS MOST OF THIS AUDIT

**Migrations 035–043 were never run against the live Supabase database.** Confirmed via direct REST queries returning 404 for `bank_accounts`, `bank_transactions`, `data_sharing_preferences`, `data_access_audit`, and (by the same pattern) `merchant_accounts`, `ad_campaigns`, `vico_governance_proposals`, `pavilion_*`, etc.

This single fact downgrades almost every "looks complete" feature built since those migrations were authored — the tables their APIs query don't exist in production. `supabase/RUN_PENDING_035_043.sql` (already created this session) fixes the table-existence problem — but **running it will not fix most of the audit findings**, because the deeper problem is architectural (see next section).

## THE SECOND FACT: PERVASIVE MOCK-DATA-AS-FINAL-UI

Independent of the migration issue, a single anti-pattern dominates every domain audited: **beautifully laid-out screens wired to hardcoded `MOCK_*`/`useState` constants instead of the real (often already-built!) Supabase/API layer.** Examples found in every single domain:
- Bank: Invest, Village Fund, Budget, Goals, Financing, Direct Deposit, Statements, Financial Profile — all static arrays
- Data Locker: Permissions, Earnings, Marketplace, Audit, Export, Delete — all local React state, zero persistence
- Workshop: Skill Stream, Templates, OoWop/Save/Skip rail buttons — local-only
- Merchant/Ads: literally every page — confirmed via grep, **zero** `supabase`/`fetch` calls in 8 merchant pages and 9 ads pages
- ViCo Governance: 6 polished pages import `lib/vico/mockData.ts` and never call their own 6 working API routes
- Pavilion: every list (events, courses, creators, related content) is `MOCK_*`
- Avatar Studio: NFT mint is a `setTimeout` fake; photo-match is a "coming soon" stub
- Platform core: Spaces mock event fallback, Pavilion home page mock arrays, Profile highlights mock fallback

**This means the typical remediation is "wire the button to the API that already exists," not "build the feature from scratch."** That is good news — much of the hard design/backend work is already done; it's sitting there orphaned.

---

## DOMAIN-BY-DOMAIN SCORECARD

| Domain | not built | built-bug | built-fully-working | built-live-ready |
|---|---|---|---|---|
| Platform Core (Spaces/Wellness/Trading Post/Pavilion/Profile/Spirit/Create/Nav) | ~6 major | ~8 major | ~6 major | 0 |
| Bank | ~17 | ~38 | ~14 | ~2 (cosmetic only) |
| Data Locker | ~9 | ~28 | ~11 | ~1 (color system) |
| Workshop + Tasks | ~14 | ~38 | ~16 | 0 |
| Merchant Network | 9 | 17 | 2 (cosmetic) | 0 |
| Ads Manager | 11 | 13 | 0 | 0 |
| Avatar Studio | ~3 | ~12 | ~6 | 0 |
| Chain Explorer | ~17 of 19 | ~2 | 0 | 0 |
| Pavilion | ~11 | ~9 | ~1 | 0 |
| ViCo Governance | 1 | ~9 | ~3 | 1 (color system) |

**Chain Explorer is essentially 0% built** — it's a separate planned product (`explorer.village.com`) with 12 routes / 13 API endpoints / a cache layer, none of which exist. What's live (`/village/bank/blockchain`) is a different, real, working feature (wallet/ledger view) that happens to link out to the non-existent explorer domain and to a dead internal route (`/burn`).

---

## CRITICAL LAUNCH-BLOCKING BUGS (fix these regardless of sequencing)

1. **Profile pages show the wrong user's data.** `app/village/[username]/page.tsx` redirects to `/village/hut?userId=X`, but `app/village/hut/page.tsx` ignores the `userId` param and always loads `auth.getUser()`'s own profile. Visiting anyone else's profile shows your own. No Follow/Message buttons exist either — confirms this is currently a self-view-only page masquerading as a public profile.
   - File: `app/village/hut/page.tsx:614,701`

2. **Action verification can't actually mark actions complete.** `app/api/actions/[id]/verify/route.ts` writes `status`, `verified_at`, `verification_method`, `verification_data` to `sprint_actions` — columns that **don't exist** in the migrated schema (only `id, sprint_id, goal_step_id, title, day_of_week, completed, completed_at, order_index`). The core "do action → verify with proof → earn $VLG → progress" loop — the heart of the entire Workshop engine — silently fails or errors today.
   - File: `app/api/actions/[id]/verify/route.ts:161-168` vs. migrations 013/016

3. **Merchant API code and merchant SQL migration use different column names for the same tables.** `merchant_accounts` has `business_name/lat/lng/status/location_type` in the migration; every API route queries `store_name/latitude/longitude/is_active/has_physical_location`. Even after running migration 039, every merchant endpoint throws "column does not exist."
   - Files: `supabase/migrations/039_merchant_network.sql` vs. `app/api/merchant/{onboarding,dashboard,map,payment}/route.ts`

4. **Data Locker wellness toggle writes to a column that doesn't exist.** Frontend/API use `share_wellness`; the migration defines `share_wellness_metrics`. Toggle can never persist correctly even post-migration.
   - Files: `app/village/locker/page.tsx:11` vs `supabase/migrations/040_data_locker.sql:14`

5. **AI Financial Advisor's headline promise — "reads your real account data" — is fabricated.** `getMockFinancialSummary()` feeds hardcoded numbers (`totalBalance: 24487`, etc.) into an otherwise well-engineered Claude pipeline, in both the proactive opening message and the chat itself.
   - Files: `app/api/bank/advisor/opening/route.ts:7-22`, `app/village/bank/advisor/page.tsx:12-17`

6. **Sprint-completion celebration calls two API routes that don't exist** (`/api/sprints/next`, `/api/badges/unlock`) and shows a hardcoded "+50 $VLG" while the actual award call passes `p_vlg: 0` — breaking the spec's "$VLG must feel proportionally earned" principle (sprint completion can pay less than a single action).
   - File: `app/village/workshop/sprint/[id]/page.tsx:294,305,396` + `app/api/sprints/route.ts` PATCH handler

7. **Spirit is not actually the unified cross-section intelligence the spec promises.** `fetchSpiritContext()` only pulls `profiles/spirit_configs/goals/spirit_patterns/spirit_collective/spirit_memories` — no wellness, financial, Trading Post, or Spaces data. Each section (Bank advisor, Wellness chat, Spaces prep) builds its own siloed mini-prompt instead. The platform's central "ONE AI layer" premise doesn't exist in code.
   - File: `lib/claude/spirit.ts:209-285`

---

## RECOMMENDED PATH TO LIVE-READY

Given that the dominant problem is "real backend exists, frontend uses mock data instead," the fastest, lowest-risk path to launch readiness is a **wiring pass**, not a rebuild. Sequenced by leverage (cheapest fixes that unblock the most value, first):

### Phase 0 — Unblock the database (1 session)
1. Run `supabase/RUN_PENDING_035_043.sql` in the Supabase SQL Editor (already generated this session).
2. Fix the two confirmed schema/code name-mismatches BEFORE running anything that depends on them:
   - `merchant_accounts`: either rename migration columns to match API code (`business_name`→`store_name` etc.) or rewrite the 5 merchant API routes to match the migration. Pick ONE source of truth — recommend keeping the migration's names (already RLS-policied) and fixing the 5 API routes.
   - Data Locker: rename `share_wellness_metrics` → `share_wellness` in migration 040 (or vice-versa in the 2 call sites) before running it.
   - `sprint_actions`: author a small migration adding `status, verified_at, verification_method, verification_data, description, estimated_days` columns (or change the verify route to use the existing `completed`/`completed_at` columns — simpler, less migration risk).
3. Re-run the table-existence check script (`.select('*').limit(1)` pattern, not the misleading `head:true` count) to confirm all expected tables now resolve.

### Phase 1 — Fix the critical-path bugs (1-2 sessions)
Fix items #1, #2, #5, #6, #7 from the "Critical launch-blocking bugs" list above. These are the ones that break core promises (your own profile, your own goal-completion loop, Spirit's "knows everything about you" pitch) regardless of which features you choose to launch with.

### Phase 2 — The wiring pass, domain by domain (the bulk of the work)
For each domain, the pattern is the same: **delete the `MOCK_*`/local-`useState` data source, replace with the `fetch()`/`useEffect` call to the API route that (in most cases) already exists and works.** Suggested order by ROI:

1. **ViCo Governance** (highest ROI — *the API layer is the best-built of any domain audited*; 6 working routes sit completely unused by their 6 polished pages). Wire `page.tsx`/`proposals/page.tsx`/`proposals/[id]/page.tsx`/`submit/page.tsx`/`treasury/page.tsx`/`elders/page.tsx` to `/api/governance/*`. Decide whether to enforce the 2,000-$VICO vote-minimum server-side (currently commented out) or keep "anyone can vote for now" as the spec allows pre-Year-2.
2. **Workshop core loop** — fix the `sprint_actions` schema mismatch (Phase 1), then: wire OoWop/Save/Skip rail buttons to real persistence (`card_interactions` table doesn't exist — needs a small migration), add server-side per-card-per-user OoWop dedup, fix the Templates page's `use_count`→`clone_count` column reference, unify the two parallel GPS pipelines (chat's cosmetic wave-animation + single-shot Claude call vs. the real `runGPSPipeline`/`lib/claude/gps.ts` invoked from Goal Detail) into one.
3. **Bank** — wire Invest/Goals/Budget/Financing/Direct Deposit/Statements pages to their real (already-built) API counterparts where they exist; replace the AI Advisor's mock financial summary with real account/transaction queries; replace hardcoded routing/account numbers on Receive and Direct Deposit with the user's real `bank_accounts` row; fix the `BankBottomNav` no-op stub or formally retire the spec's "5 tabs" requirement in favor of the global teepee nav (recommend updating the spec — the global-nav choice is reasonable).
4. **Data Locker** — wire Permissions/Earnings/Marketplace/Audit/Export/Delete pages to `/api/locker/preferences` and the (already-designed, RLS-policied) `data_sharing_preferences`/`data_access_audit`/`data_earnings`/`data_sales` tables; wire the inert "Confirm"/"Download"/"Schedule"/"Delete" buttons to real handlers; wire consent-timestamp persistence (`consent_*_at` columns exist, nothing writes to them).
5. **Merchant Network** — fix schema mismatch (Phase 0), then wire all 8 pages (currently 100% mock/local-state) to the genuinely well-built orphaned API routes (`onboarding`, `dashboard`, `map`, `payment`, `payment/[sessionId]/confirm`); build the missing customer-facing `/pay/[merchantHandle]` flow (backend session routes already exist); create the referenced-but-missing `vico.js` payment-button script.
6. **Ads Manager** — this is the least-built of the "should be ready" domains: only 4 of 11 spec'd tables exist (and are never queried by any code), every page is mock/local-state, and none of the 10 integration wires (Bank payment, $VICO credits, GPS targeting, Pixel tracking, AI optimization, etc.) exist. Treat this as a near-from-scratch build — recommend deprioritizing until the rest of the platform is live, since ad revenue requires an existing user base anyway.
7. **Pavilion** — wire the home/browse/creators pages off `MOCK_*` arrays onto real Supabase queries (partial real query exists in `page.tsx` but only for `pavilion_shows`); the spec's actual data model (9 `pavilion_*` tables: events/content/subscriptions/tips/watch-history/series) doesn't exist — only the older, simpler `pavilion_shows` does. Decide: extend the existing simple schema to support the spec'd feature set, or treat Pavilion's full vision as a post-launch Phase 2 and ship a trimmed "shows + creators" version on the current schema. The entire live-event-room/backstage system (the spec's centerpiece, 3 of 13 routes) doesn't exist at all and would be a substantial build (MediaSoup/Jitsi/Video.js/HLS stack).
8. **Avatar Studio** — the builder UI persists a working config to `profiles.avatar_config` (a real win); the gap is that almost none of the customization (hair/face/accessories/animations) actually changes the rendered 3D mesh — it's "selectable but inert." Decide whether full 3D customization is a launch requirement or a post-launch enhancement; if launch-required, this needs the missing open-source stack (gltf-avatar-threejs, MediaPipe, Mixamo) — a substantial 3D-engineering effort. NFT minting and photo-match are honestly labeled "coming soon" — fine to ship as-is.
9. **Chain Explorer** — essentially an entirely separate product (standalone site, 12 routes, 13 APIs, search/cache layer) that hasn't been started. Recommend treating as a Phase 2/Year 2 deliverable (consistent with the in-app blockchain page's own "Phase 1: Polygon — coming Year 2" roadmap) and removing/fixing the two dead links that currently point at it (`explorer.village.com` external link, `/village/bank/blockchain/burn` internal 404).

### Phase 3 — Platform-level cross-cutting work (parallel-izable, lower urgency)
- Build the actual cross-section data flows the spec's "ONE system, nothing siloed" premise depends on: Office meetings → Spaces tasks/calendar, Tribe connections surfacing across sections, Market course completions → Pavilion unlocks. Currently these are aspirational copy with no backing code.
- Rebuild the global radial nav to match the spec'd 180° crescent-arc geometry (current implementation is a different, simpler horizontal-pill design that works fine functionally — recommend updating the spec to match the shipped design rather than rebuilding, unless the arc UX is considered essential to brand identity).
- Wellness Layers 5 (health records/FHIR/telehealth) and 6 (local AI via Ollama+BioMistral) are 100% unbuilt, and Layer 6's "ALL LOCAL, never external" requirement is actively violated (cloud Claude is used). These are large, infra-heavy builds — recommend explicitly deferring to post-launch and updating user-facing copy/spec to not over-promise FHIR/local-AI at v1.
- Trigger system's "AI dynamically adjusts based on your wellness data" and "fires automatically before calendar events" — currently 100% static lookup tables with manual launch. This is the section's signature differentiator per spec; recommend prioritizing the auto-fire scheduling (simpler — a cron/notification job) before the AI-adjustment logic (harder — needs real wearable data flowing first, which depends on Layer 1 wearable integration that also doesn't exist).

### Phase 4 — Final hardening pass (after wiring)
- Replace every hardcoded "fake PDF" (`.txt` blob downloads in Statements/Direct-Deposit/My-Data/Audit-Log) with real document generation or a DocuSeal integration.
- Replace every fake QR code (Receive page, Merchant Payments) with real QR encoding.
- Add loading/empty/error states to any newly-wired page that lacks them (most already have the pattern from the Bank page fix earlier this session — replicate it).
- Run a full `npm run build` + `tsc --noEmit` + Playwright smoke pass across every route once wiring is complete.

---

## WHAT'S GENUINELY GOOD AND SHOULD BE PRESERVED AS-IS
Don't let "zero live-ready" obscure that a lot of excellent work exists — it's just disconnected:
- ViCo Governance API layer + schema (best-built backend in the audit)
- Workshop's `lib/claude/gps.ts` 7-agent GPS pipeline and `actions/[id]/verify` AI verification logic (genuinely sophisticated Claude vision/text verification — just needs its DB writes fixed)
- Bank's transfer/investments APIs, Spirit/Advisor system prompts (CAN/CANNOT framing matches spec almost verbatim)
- Data Locker's category copy and migration 040 schema design (RLS, GDPR-reference trigger)
- Merchant's dashboard/map/payment APIs (real Claude insights, real Haversine math, real session flow)
- The Leaflet/OpenStreetMap merchant map integration (genuinely real, matches spec pixel-for-pixel)
- `lib/claude/spirit.ts` personality/archetype/tradition-layer system (50+ layers — rich and on-spec)
- Creator camera/editor flow (1700+ lines, closely matches spec, mostly real)
- Trading Post (Deals/Market/Tribe/Office) — the most complete section in the platform-core audit
- Blockchain ledger (`015_blockchain_ledger.sql`) — real, SHA-256 chained, RLS-enabled, live-queried

These are the foundations to build the wiring pass on top of — not areas that need rework.
