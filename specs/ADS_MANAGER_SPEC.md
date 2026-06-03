# Village Ads Manager — Complete Specification
# Source: User vision document. DO NOT delete or modify without updating code.
# Last updated: 2026-06-02

## What It Is
Facebook Ads Manager for The Village ecosystem. Native sponsored content — not banner ads. Appears in DreamLine, Workshop, Trading Post, alongside profiles. Three-tier hierarchy: Campaign → Ad Set → Ad.

## Access Points
- Teepee menu "Ads" item → /village/ads
- Create flow "Increase views" → Boost fast path
- Create flow "Only show as ad" → Full campaign flow
- Post `...` menu → "Boost post" → Boost fast path
- Trading Post / eStore areas
- User profile settings

## Route Structure
/village/ads — Dashboard
/village/ads/campaigns — All campaigns
/village/ads/campaigns/create — Creation flow (7 steps)
/village/ads/campaigns/[id] — Campaign detail
/village/ads/adsets/[id] — Ad set detail
/village/ads/ads/[id] — Ad detail
/village/ads/audiences — Saved audiences
/village/ads/creatives — Creative library
/village/ads/billing — Billing
/village/ads/analytics — Full reporting
/village/ads/pixels — Village Pixel
/village/ads/policy — Ad Policy Center

## Page 1 — Dashboard
- Account overview card (dark teal-navy bg, total spend, period selector)
- Stat tiles: Reach, Impressions, Clicks
- Line chart: daily spend (Victory Native)
- Active campaigns list: name, objective pill, status dot, metrics, spend/budget bar, pause toggle
- Performance snapshot: 8-metric grid
- AI recommendations card (green, Spirit-powered)
- Quick links: Create / Audiences / Billing / Analytics

## Campaign Creation — 7 Steps
Step 1: Objective (6 cards: Awareness/Traffic/Engagement/Video views/Leads/Sales), special ad categories toggle, CBO toggle, A/B test toggle
Step 2: Budget & schedule (daily vs lifetime, dates, bid strategy: highest volume/cost cap/bid cap)
Step 3: Ad Set (audience: Core/Custom/Lookalike, location, demographics age 13-65+, detailed interests, connections, audience size estimator dial)
Step 4: Placements (Auto recommended, Manual: DreamLine feed/Workshop feed/Market browse/Deals feed/Profile suggested/Stories/In-video overlay)
Step 5: Creative (identity, format: video/image/carousel/text, upload/editor, copy fields, CTA selector, preview panel, multiple ad variations)
Step 6: Review (full summary, policy check, edit links)
Step 7: Publish (enters review queue, AI reviews 1-24hr)

## Audience Types
Core: location + age + gender + language + interests + connections
Custom: content engagers, eStore/profile visitors, Pixel events, CSV upload, Bank payment recipients (opt-in)
Lookalike: 1%/2%/5%/10% similarity from any custom audience

## Placements
- DreamLine feed: full-screen vertical video, "Sponsored" label, all rail buttons active
- Workshop feed: GPS-action-matched, mission score calculated, relevance required
- Market browse: sponsored store/product card
- Deals feed: sponsored deal card, extra review required
- Profile suggested: "People you may know" section
- Stories: 9:16, 15s max
- In-video overlay: bottom 20%, 6s, non-skippable, lower CPM

## Boost Post Fast Path (3 steps)
Step 1: Goal (views / OoWops+comments / profile visits / eStore visits)
Step 2: Audience (lookalike / manual basic / followers only)
Step 3: Budget slider ($1-$1000/day) + duration (1/7/14/30 days)
"Boost now" — instant for previously published posts

## Village Pixel
JS snippet for external sites. Standard events: PageView, ViewContent, Search, AddToCart, InitiateCheckout, AddPaymentInfo, Purchase, Lead, CompleteRegistration, Contact. Custom conversions from URL rules. Test events tool. Pixel → Custom Audience creation.

## Analytics
Report builder: 25+ metric columns, breakdowns by time/age/gender/placement/platform/section/geo. Funnel visualization. Competitive benchmarks. Attribution settings (1-day/7-day click/view).

## Billing
Payment methods (Village Bank balance or card). Billing threshold ($25 default, auto-increases). Monthly invoicing. Spending limit. Tax info. Receipt PDFs via DocuSeal.

## AI Optimization (Spirit-powered)
Daily recommendations: budget reallocation, audience fatigue detection, creative refresh prompts, learning phase alerts, placement optimization, scheduling suggestions.

## Policy
Prohibited: illegal, discriminatory, tobacco, weapons, adult, misleading claims, MLM schemes.
Restricted with disclosure: financial services, healthcare, alcohol, subscriptions.
No political ads ever.
Appeals: 1 per rejection, human review 48hr.

## Open Source Stack
PostHog (event tracking), Metabase (reporting), n8n (automation), AppFlowy (data), Ollama+LLaMA3 (AI recommendations + policy scan), Meilisearch (interest taxonomy), DocuSeal (receipts), Unit BaaS (Bank spend), Polygon ($VLG future).

## Connections to rest of Village
- Workshop: GPS-action-matched placements (highest relevance)
- DreamLine: primary high-volume placement
- Market: sponsored store/product cards
- Bank: Financial Profile verified professionals run compliant financial ads
- Create: "Increase views" / "Only show as ad" buttons
- $VLG future: earn tokens through Workshop → spend on ad credits
