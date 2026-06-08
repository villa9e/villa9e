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

### Phase 5 — Spirit Unification (the platform's actual differentiator)

Bug #7 above ("Spirit is not actually the unified cross-section intelligence the spec promises") isn't a bug to patch — it's the single biggest gap between what villa9e *is* and what it's *supposed to be*. The spec's whole premise is "ONE AI companion who knows you completely, not eleven chatbots wearing different hats." Phase 5 closes that gap. This phase is sequenced last because it depends on Phases 0-2 having real data flowing through every domain — Spirit can't "know everything" if Bank, Workshop, Wellness, and Locker are still serving mock data.

#### 5.1 — Spirit must be wired into every part of the app
Today, `fetchSpiritContext()` (`lib/claude/spirit.ts:209-285`) only loads `profiles/spirit_configs/goals/spirit_patterns/spirit_collective/spirit_memories`. Meanwhile Bank Advisor, Wellness chat, and Spaces meeting-prep each spin up their own siloed Claude calls with their own hand-rolled mini-context. The fix:
- Replace every section-local Spirit invocation (Bank advisor opening/chat, Wellness check-in, Spaces prep, Merchant insights, Goal recalibration, Action verification, etc.) with calls through **one shared context-assembly layer** — extend `fetchSpiritContext()` to pull from every domain table (bank accounts/transactions/budgets, wellness check-ins/wearable data, locker preferences, merchant activity, governance votes, Pavilion watch history, Trading Post connections) and pass that unified object into every Claude invocation regardless of which screen triggered it.
- Each section keeps its own *system-prompt flavor* (the advisor sounds like an advisor, the trainer sounds like a trainer) but draws from the *same underlying knowledge of the user*. One mind, many voices — not many minds.

#### 5.2 — Spirit must know everything all at once
"All at once" means real-time, cross-domain awareness — not eleven separate memories that never talk to each other:
- Consolidate `spirit_memories`, `spirit_patterns`, and `spirit_collective` into a single retrieval pass per conversation (already has the FTS index from migration 016 — `spirit_memories_fts` — extend it to index across all domains, not just chat history).
- When the user mentions a goal in a Bank conversation, Spirit should already know about the related Workshop sprint, the wellness pattern that's blocking progress, and the $VLG balance that funds it — because it's one continuous context, not four conversations that happen to share a UI shell.
- This is the direct fix for bug #7 and turns "Spirit knows you" from marketing copy into an architectural fact.

#### 5.3 — Spirit must have access to the internet
Spirit currently operates as a closed system — it can reason over what's in the database but can't look anything up. To be a genuine life-coach/assistant/best-friend, it needs real-world grounding:
- Wire web search/fetch capability into the Claude tool-use loop (Anthropic's web search tool, or a scoped fetch proxy) so Spirit can answer "what's the best protein powder for my goals," "what's the news on X," "find me a recipe for Y," pull current prices, verify a claim, etc. — in real time, not from frozen training data.
- Scope and log this carefully: rate-limit per user, log queries for the audit trail (the platform already has `data_access_audit` infrastructure — reuse it), and make the "Spirit searched the web for this" attribution visible to the user so trust isn't eroded by invisible lookups.
- This single capability is what elevates Spirit from "smart chatbot over your data" to "companion who can actually help you navigate the world."

#### 5.4 — Spirit's role: best friend, assistant, life coach, trainer — with a hard licensing boundary
The user's framing is the right one and should be encoded directly into Spirit's system prompt and behavior tree: **Spirit can be anything to the user that doesn't require a professional regulated license or certification — unless Spirit can pass that license/certification exam as well as or better than a human professional.**
- For unregulated roles (friend, accountability partner, habit coach, workout planner, study buddy, creative collaborator, financial-literacy educator) — Spirit should engage fully and proactively, no hedging, no "consult a professional" disclaimers that add nothing.
- For regulated roles (medical diagnosis, therapy/mental-health treatment, legal advice, financial/investment advice requiring a fiduciary license, tax preparation) — the bar is explicit: Spirit either (a) demonstrably passes the relevant licensing/board exam at or above human-professional level — in which case it can confidently advise within that scope and say so — or (b) it stays in an educational/supportive role and makes a warm, non-bureaucratic handoff to a real licensed professional. No mealy-mouthed "I'm not a doctor" boilerplate; either Spirit has earned the right to speak with authority, or it openly says "this one needs a human with a license, and here's how I can support you while you find one."
- This becomes a concrete engineering task: build (or source) the relevant licensing-exam benchmarks (USMLE for medical, bar exam for legal, CFP/Series 65 for financial planning, etc.), evaluate Spirit's current model against them, and gate each "regulated" capability behind a passing benchmark score — re-run the benchmark whenever the underlying model is upgraded.

#### 5.5 — Spirit's moral compass core: the 77 Commandments
Every layer of Spirit's personality system (the 50+ layers documented in `lib/claude/spirit.ts`) must sit on top of, and never override, the **77 Commandments** (full text in the user's `spirit_77_commandments` reference). Concretely:
- The Commandments become the top-level system-prompt layer — loaded first, immutable, and referenced in every response-generation pass, not just a "personality flavor" the user can configure away.
- Build a lightweight pre-response check (or a Claude self-critique pass) that flags any draft response that would conflict with a Commandment before it's sent — the same pattern as the existing verification-confidence scoring in `actions/[id]/verify`, applied to Spirit's own outputs.
- This is what makes "Spirit is your best friend" trustworthy rather than just charming — the friendliness is built on an incorruptible moral floor, not on top of an empty personality shell.

#### 5.6 — Goals must be engineered for sustainability, modeled on the shea butter blueprint
The user provided a detailed real-world template — indigenous West African shea butter production — as the gold-standard example of what a "fully sustainable goal" looks like, and wants this DNA built directly into the Workshop/GPS goal-creation engine so that **every goal Spirit helps a user build is regenerative by design, not "less bad" by accident.**

**The reference model (shea butter's zero-waste lifecycle):**
Wild harvesting (no deforestation; the entire fruit is used) → traditional extraction (boil → dry → crack → roast → mill → whip → purify) → systemic environmental benefit (the shea parklands sequester an estimated 1.5 million tons of CO₂ per year, the trees' root systems form a natural barrier against desertification, and every byproduct of the process — husks, shells, boil-water, bad kernels, slurry residue — is repurposed as fertilizer, animal feed, fuel, or building material). Nothing leaves the system as waste; everything that comes out of one step becomes the input to another.

**The cascading-loops example to encode as a literal pattern in the goal engine** (5 steps, each output feeding the next):
1. *Passive Harvesting* — fruit pulp eaten, husks composted back into the soil
2. *Thermal Parboiling* — the water used to boil the nuts becomes liquid fertilizer
3. *Shell Cracking* — cracked shells become mulch, road-surfacing material, or plaster; rejected kernels become lighting oil
4. *Roasting / Milling / Kneading* — leftover slurry residue is pressed into biomass fuel cakes that supply up to half the thermal energy needed for the *next* batch's roasting — the system partially powers itself
5. *Final Solidification* — the finished product is packaged in biodegradable material; net waste output: zero

**The driving philosophy to encode as Spirit's "sustainability lens" — Eco-Holism and Reciprocity, three pillars:**
1. **"Seven Generations" Outlook** — long-horizon systems thinking; a goal is judged not by this quarter's outcome but by whether the system it creates is still healthy generations from now. Spirit should prompt users to ask "will this still be working — and still be good for the people and places around it — long after I've moved on?"
2. **Interconnectedness** — every output of a plan must have a destination. If a goal produces something with no home (financial waste, wasted time, discarded relationships, environmental harm), that's treated as a *design flaw in the goal*, not an acceptable side effect — and Spirit should flag it and help redesign around it.
3. **Active Stewardship** — go beyond "minimize harm" to actively put more back than you take (the shea harvesters intentionally leave a portion of seeds ungathered to regenerate the parkland). Spirit should help users build a "give-back" component into goals as a default, not an afterthought.

**The "Operational DNA" — a 4-part framework Spirit applies when helping a user *structure* any goal:**
1. **Biomimetic Design — "Design Out the Concept of Waste"**: structure the goal so that nothing it produces is disposable by nature (e.g., instead of "save $X by cutting expenses," design a goal that converts what would've been wasted — time, subscriptions, unused skills — directly into the thing being built).
2. **Industrial Symbiosis**: look for ways the goal's outputs can directly fuel another part of the user's life (e.g., a fitness goal's discipline becomes the engine for a study habit; a side-business goal's customer conversations become networking that feeds a career goal).
3. **Value-Stream Cascading**: when something the user has is degrading or being phased out (an old skill, an underused asset, a fading relationship), help them route it to its next-highest practical use before discarding it — mirroring "degraded EV battery → home storage → mineral recycling, never straight to landfill."
4. **Regenerative Bottom Lines**: redefine "success" for every goal from "I didn't make things worse" (net-zero) to "I made the system — my health, my finances, my relationships, my community — measurably better than when I started" (net-positive). This becomes a literal field in the goal data model: not just a completion checkbox, but a "what's better now than before?" reflection Spirit asks for at goal completion.

**Engineering implementation:**
- Add a "sustainability lens" pass to the GPS pipeline (`lib/claude/gps.ts`) — when Spirit helps draft a goal, it runs the draft through the four Operational DNA questions and the three Eco-Holism pillars before finalizing the plan, the same way the pipeline already runs its existing 7-agent passes.
- Surface this in the UI as a visible "this goal is built to give back" badge or summary — so users see and feel the difference between a goal Spirit drafted with this lens and a generic checklist.
- Extend the goal data model with a lightweight "regenerative loop" field — what does this goal's output feed into? — so Spirit can proactively suggest cascading connections between a user's *existing* goals (a literal implementation of "industrial symbiosis" at the personal level).

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
