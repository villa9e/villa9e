# ON-CHAIN ACTION VERIFICATION + GOAL VALUE SCORE (GVS) — SPEC

> Logged 2026-06-10. Two linked systems: (1) Proof of Growth — every verified Sprint
> action writes an immutable Growth Receipt on-chain; (2) the Goal Value Score — goals
> earn $VLG proportional to their real difficulty, not a flat rate.

## PART 1 — Proof of Growth (on-chain verification)

**Concept:** Bitcoin = Proof of Work. The Village = **Proof of Growth** — cryptographic
evidence that real human effort/learning/achievement was completed and verified. Every
verified action = a **Growth Receipt** (a hash on-chain). Proof content (photo/video/doc)
stays off-chain in Nextcloud; only the SHA-256 hash of the proof goes on-chain. Nothing
personally identifiable on-chain — only a pseudonymous wallet + hashes.

**On-chain GrowthReceipt:** receiptId, walletAddress, goalHash, sprintHash, actionHash,
proofHash (sha256 of file), verificationMethod (0 photo…4 text), actionLevel (1 Wayfinder…
3 Trailblazer), spiritConfidence (0–100, min 70 to pass), **rigorScore (0–100)**,
vlgEarned, **gvsAtGoalLevel**, timestamp, isPublic.

**AchievementCredential** (issued on full goal completion): wallet, credentialHash,
credentialType, category, actionsVerified, sprintsCompleted, completedAt, **gvsScore**,
**totalVlgEarned**, isPublic. Credentials are endorsable by any member.

**Contract:** `VillageGrowthLedger.sol` — `storeGrowthReceipt()`, `issueCredential()`,
`endorseCredential()`, `verifyProofHash()`, `getWalletReceipts/Credentials()`,
`getGrowthSummary()`, `batchStoreReceipts()` (≤20 per tx for gas). Server-authorized.
Deploy Polygon first, Village Chain later.

**Verification flow:** submit proof → Nextcloud → Spirit AI reviews (vision analysis,
relevance, duplicate/metadata/AI-gen detection) assigns confidence ≥70 → compute
proofHash + goal/sprint/action hashes (keccak256) → call ledger contract → DB copy +
credit VLG → UI shows "Verified on-chain" + tx link to explorer. On goal completion →
auto-issue Achievement Credential (Spirit extracts skill tags + experience summary).

**DB:** `growth_receipts`, `achievement_credentials`, `credential_endorsements`,
`trading_post_verifications`, `audit_log`. (Full DDL in source.)

**Trading Post integration — experience as currency:** deal creators attach Achievement
Credentials to deals. Investors tap a team member → see verified on-chain credentials
(goal, GVS, actions, sprints, skill tags, AI summary, rarity, endorsements). "The
blockchain is the resume." `VerificationWidget` reusable component reads chain directly.
Deal smart contracts embed creator credential IDs → due diligence on-chain.

**Profile/Hut achievements page** (`/village/hut/{username}/achievements`): summary line
("124 verified actions · 16 sprints · 4 goals · 892 $VLG on-chain"), "Verify on-chain"
button → explorer, credential cards (skill tags, AI summary, per-action receipts with tx
hashes, endorse button), privacy toggle per credential (Public/Tribe/Private).

**Daily ViCo audit (n8n):** every VLG credit cross-checked against an on-chain receipt;
mismatches flagged for investigation; audit log publicly readable. Explorer (Big Dipper
extension) decodes hashes to human-readable: `/wallet/{addr}`, `/receipt/{id}`,
`/credential/{id}`, `/audit`.

**User-facing language:** plain, never technical — "Your proof is saved permanently on
the Village Chain. No one can take this achievement away from you." / "This creator has
124 verified actions on-chain… This is not a resume — this is proof."

---

## PART 2 — Goal Value Score (GVS) — dynamic earning

**The problem:** a flat 500 $VLG for every goal means "drink more water" = "launch a
SaaS company" → farming incentive, destroys ViCo as a store of value. Bitcoin uses mining
difficulty. ViCo needs the equivalent: harder goals produce more ViCo.

### Five dimensions (0–100 each, scored by Spirit's Wave 1/2 agents)

1. **Complexity** — skill domains, external dependencies, technical depth, originality.
   (0 = trivial, 50 = run a 5K, 100 = funded startup / licensed profession / degree.)
2. **Effort** — standardized total hours: <10h →0–20, 10–50 →20–40, 50–200 →40–60,
   200–500 →60–80, 500+ →80–100.
3. **Verification Rigor** — fraud resistance, weighted avg of action rigor levels:
   L1 text 10, L2 photo 25, L3 video 40, L4 social URL 60, L5 document 75, L6
   biometric/transactional 90, L7 third-party verified 100.
4. **Impact** — life change/contribution from Phase-2 success criteria: habits 10–30,
   skills 30–50, financial 40–60, career/business 50–75, income-generating 60–85,
   community impact 70–90, transformational 80–100.
5. **Completion Rarity** — global attempt→completion rate (scarcity mechanism):
   >60% →10–20, 40–60% →20–40, 20–40% →40–60, 10–20% →60–75, 5–10% →75–85, <5% →85–100.

### Formula

```
GVS = Complexity×0.20 + Effort×0.25 + VerificationRigor×0.20 + Impact×0.20 + CompletionRarity×0.15
```

Effort weighted highest (ViCo = proof of real work); rarity smallest but most powerful
differentiator (scarcity). Computed during Generating (Wave 2), shown on GPS Ready card,
**locked at GPS launch** and written to the first on-chain receipt.

### Earning

```
BASE_GOAL_REWARD = 100
multiplier = 0.5 + (GVS/100)*9.5      // 0.5x → 10x
goalReward = round(100 * multiplier)
```

GVS 10→145, 30→335, 50→525, 70→715, 90→905, 100→1000 $VLG (goal completion alone).

**Sprint reward:** base 20 × effort multiplier (hours/20, cap 3x) × rigor multiplier
(0.5+avgRigor/100*1.5) × position bonus (sprintNumber*5%), capped 200.
**Action reward:** rigor base {text 3, photo 6, video 10, social 14, document 18,
biometric 24, third_party 30} × effort multiplier (1 + min(days,14)/14, max 2x).

### Worked examples (total $VLG across actions + sprints + goal)

- 30-day journaling: GVS ~13 → ~265 $VLG total.
- Run a 5K: GVS ~33 → ~864 $VLG.
- Get a job in tech: GVS ~61 → ~1,381 $VLG.
- Launch a profitable online course ($5K/mo): GVS ~79 → ~2,302 $VLG (~23 $VICO Phase 1).
- Build a funded startup (Series A, 2 yrs): GVS 95 → ~25,452 $VLG (2+ full conversions).

### Anti-gaming

GVS computed by Spirit from the goal + global DB (847 similar goals) — not user input.
High rigor requires hard-to-fake proof. Rarity is objective. Effort recalculated from
actual completion time (fast completion of "high-effort" goal → fraud flag). GVS locked
at launch — can't retroactively reclassify.

### GPS Ready card shows GVS

Five dimension bars + projected earnings (sprint actions / sprint completions / goal
completion / total) + "~X $VICO if converted today" + "harder than Y% of Village goals."

### DB + contract additions

`goals`: gvs_complexity, gvs_effort, gvs_verification_rigor, gvs_impact,
gvs_completion_rarity, gvs_total, gvs_multiplier, projected_total_vlg, actual_total_vlg.
`sprint_actions`: rigor_score, effort_days_actual, vlg_rate.
`sprints`: sprint_value_score, vlg_rate.
GrowthReceipt += rigorScore, gvsAtGoalLevel. AchievementCredential += gvsScore, totalVlgEarned.

### To build

`spirit/gvs_calculator.js` (Wave 2), `spirit/action_valuation.js` + `spirit/sprint_valuation.js`
(Wave 3), migrations, contract struct updates, GPS Ready GVS UI, per-action VLG display,
credential GVS display, Trading Post creator GVS on credential cards.

**Principle:** ViCo is not earned equally because human effort and achievement are not
equal. The GVS makes ViCo mathematically honest. See [[project-villa9e-vision-log]],
VICO_COIN_SPEC.md, CHAIN_EXPLORER_SPEC.md.
