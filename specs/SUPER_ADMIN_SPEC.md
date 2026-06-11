# VILLAGE SUPER ADMIN DASHBOARD — SPECIFICATION

> Logged 2026-06-10. The command center — every metric, user, transaction, content, goal,
> and coin in one place, **interpreted by Spirit AI as the organization's strategic
> intelligence layer.** Not a metrics dashboard — an organizational brain. Spirit acts as
> the CEO's chief of staff: reads everything, synthesizes, flags, tells you what to do.

## Routes
`/admin` (Spirit briefing home), `/admin/users`, `/admin/content`, `/admin/goals`,
`/admin/revenue`, `/admin/vico`, `/admin/ads`, `/admin/trading-post`, `/admin/wellness`,
`/admin/spaces`, `/admin/pavilion`, `/admin/notifications`, `/admin/moderation`,
`/admin/settings`, `/admin/spirit`. Restricted to founding team, 2FA, immutable audit trail.

## Color (Bloomberg-terminal × modern SaaS, professional)
Day: page #F2F4FA, sidebar #0A1628 navy (dark sidebar on light page = authority), sidebar
text #8AACCC, active #FFFFFF on #1A3050, card #FFFFFF, border #DEE3F0, primary #0033CC,
**Spirit accent #534AB7**, success #1D9E75, warning #EF9F27, danger #E24B4A, +delta
#0F6E56, −delta #A32D2D. Night: page #080E1C, sidebar #060C18, card #0E1828, border #162035.

## Layout
Top bar (52px) + 220px dark navy sidebar (fixed left) + **persistent 320px Spirit briefing
panel on the RIGHT of every page** (a co-pilot, not a drawer — reads the current page and
offers analysis/warnings/recommendations specific to that data) + main content.
Top bar: teepee+Admin, global search, three health dots (app/payments/blockchain), admin
avatar. Alert strip (amber/red) when Spirit flags something urgent.
Sidebar sections: Intelligence (Spirit briefing, Reports), People (Users, Moderation),
Product (Goals/GPS, Content, Pavilion, Trading Post, Wellness, Spaces), Economy (Revenue,
ViCo, Ads), Platform (Notifications, Settings, Spirit config). Live count badges (red).

## Page 1 — Spirit Briefing (home, most important)
**Morning briefing card** (#534AB7): Spirit avatar + date; **executive summary** in natural
language (3–5 sentences, not bullets) — e.g. "Village crossed 10,000 DAU yesterday, +23%
WoW driven by @maya_creates' viral post (14,000 OoWops). GPS completions +18%. Two things
need attention: 47 items in the moderation queue, and tonight's burn will be the largest
ever (~12,400 $VICO) — prepare a community announcement." Then 3 prioritized action items
(red/amber/blue urgency dots + View links). **"Ask Spirit anything"** input — answers in
the right panel + updates main content.
**Live platform pulse** — 6 tiles, 30s refresh: DAU, active goals, $VLG today, content
today, revenue today, active live events.
**Weekly scorecard** (Mondays) — 7 rows (one per section), Spirit one-sentence summary +
key metric + trend, expandable.
**Trend alerts** — >2σ anomalies with Spirit's hypothesis + recommended investigation.
**Right panel** — page-aware analysis + confidence indicator ("High confidence — 847 data
points" / "Moderate — monitor 7 more days"). Always-present Ask Spirit field.

## Page 2 — Users
Tiles: total, DAU, MAU, DAU/MAU ratio (engagement health), new today. Spirit context on
ratio. Cohort table (handle, join, top section, active goals, $VLG, tier, status, last
active) + filters + bulk actions. User detail panel = everything Spirit knows (profile,
goals, $VLG history, content, bank counts only, wellness opt-in, Spirit's risk summary).
Admin actions: DM, bonus $VLG, suspend, ban, flag, reset, view content. Retention/churn
analysis: cohort curves, churn-risk segments + per-user hypothesis, re-engagement recs.

## Page 3 — Goals & GPS
**Goal funnel** waterfall: Spirit chat opened → discovery done → GPS generated → countdown
→ first sprint → first complete → second complete → goal complete (counts, %, avg time,
drop-off in amber). Spirit analysis of biggest drop-off + recommended nudge. Category
performance table (active, completion rate, GVS, probability, weeks, $VLG; flags <30%).
Spirit-as-AI analytics: avg probability at launch, probability calibration accuracy,
action-level distribution, goal-intersection detection rate.

## Page 4 — Revenue
MRR + growth, stacked breakdown by source. **Milestone tracker**: "$10K MRR → ViCo
on-chain", "$1M MRR → Village Chain" progress bars + Spirit ETA + prep advice. Spirit
financial advice (e.g. "ads = 68% of revenue → concentration risk → prioritize Pavilion
subscriptions").

## Page 5 — ViCo economy
6 tiles: $VLG today, conversions today, phase, pool remaining %, next burn, circulating.
Spirit economy summary. **Fraud detection**: anomalous earn rates, repeated proofs, high
earn + low genuine engagement → flagged with confidence score. **Economy simulation tool**:
model changes ("increase sprint reward 50→75?") → Spirit projects distribution, phase
exhaustion, completion effect — governance modeling before DAO proposals.

## Page 6 — Moderation
Queue (red urgent / amber review / blue informational) with content preview, poster, Spirit
reason (rule citation) + confidence + recommended action. Actions: Approve/Remove/Warn/
Suspend/Escalate (reasoning required for Warn+). Fraud investigations from the slash system.

## Page 7 — Spirit config
Personality: briefing frequency, analysis depth, escalation thresholds per metric, focus
areas. Knowledge base: mission/values/targets/strategic priorities/competitor context
(editable; Spirit incorporates into all analysis). Editable mission statement + target
metrics.

## APIs
`GET /api/admin/spirit/briefing` → {summary, actionItems, sectionAnalysis, alerts};
`POST /api/admin/spirit/ask` {question} → {answer, relatedData, confidence}.

**Philosophy:** intelligence embedded, not bolted on — the difference between a dashboard
that shows 200 numbers and one that tells you the 3 things that matter today.
See [[project-villa9e-vision-log]], SPIRIT_TOURS_SPEC.md.
