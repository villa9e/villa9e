# Village Ads Manager — Complete Specification
# Source: User vision document (detailed version). DO NOT delete or modify without updating code.
# Last updated: 2026-06-03

## What It Is
Facebook Ads Manager for The Village ecosystem. Native sponsored content — not banner ads. Three-tier hierarchy: Campaign → Ad Set → Ad.

## Color System
### Day mode
- Page bg: #F4F7FC cool blue-white
- Sidebar bg: #FFFFFF
- Card surface: #FFFFFF, border: #D8E4F0
- Primary action: #0033CC Village brand blue
- Metric text: #0A1A4A deep navy
- Secondary text: #3A5570, tertiary: #7A9AB0
- Success delta: #0F6E56, warning: #BA7517, danger: #A32D2D
- Chart bar default: #B5D4F4, active: #0033CC
- AI card: #EAF3DE bg, #639922 border, #27500A text
- Pill active: #E6F1FB fill, #0C447C text
- Pill learning: #FAEEDA fill, #633806 text
- Toggle on: #0033CC, off: #C8D8E8

### Night mode
- Page bg: #0E1620, sidebar: #111C2C, card: #162030, border: #253545
- Primary: #4D72FF
- AI card: #04342C, #1D9E75 border, #9FE1CB text
- Chart bar default: #1E3A5C, active: #4D72FF

## Layout
Desktop-first portal. 220px fixed sidebar + full-width main content. Mobile: sidebar collapses to hamburger drawer.

## Access Points
- Teepee radial menu "Ads" → /village/ads
- Post `...` menu → "Increase views" → Boost fast path
- Create flow "Only show as ad" → Full campaign creation
- Trading Post / eStore areas
- User profile settings

## Routes
/village/ads — Dashboard
/village/ads/campaigns — All campaigns table
/village/ads/campaigns/create — 7-step creation flow
/village/ads/campaigns/[id] — Campaign detail
/village/ads/adsets/[id] — Ad set detail
/village/ads/ads/[id] — Ad detail
/village/ads/audiences — Saved audiences library
/village/ads/creatives — Creative library
/village/ads/billing — Billing
/village/ads/analytics — Full reporting
/village/ads/pixels — Village Pixel
/village/ads/policy — Ad Policy Center
/village/ads/boost — Boost post fast path

## Dashboard (Page 1)
- Account overview card (#0033CC bg day): total spend, period selector, Reach/Impressions/Clicks tiles, daily spend sparkline
- Metric tiles: Reach/Impressions/CTR/CPM with period delta
- AI recommendations card (green)
- Spend chart: bar chart with hover tooltips
- Active campaigns list: toggle, name, objective, status dot, spend/budget bar, CTR
- Recommendations panel

## Campaign Creation — 7 Steps
All steps with progress indicator (done=teal check, active=blue, pending=gray)

Step 1: Objective cards (6: Awareness/Traffic/Engagement/Video views/Leads/Sales), special ad categories, CBO toggle, A/B test toggle
Step 2: Budget (daily/lifetime, amount, dates, bid strategy: highest volume/cost cap/bid cap). Estimated results card.
Step 3: Audience — Core (location, age 13-65 dual slider, gender, language, interests from Village goal taxonomy, GPS stage targeting, connections) / Custom (Village activity, Pixel, CSV, Bank transactions opt-in) / Lookalike (1-10%). Live audience size estimator dial.
Step 4: Placements — Auto (recommended) or Manual (8 placements with CPM ranges)
Step 5: Creative — identity, format (video/image/carousel/text), upload or select from published posts, primary text (2200 chars, up to 5 versions), headline (40), description (30), CTA dropdown, live preview panel with placement toggle
Step 6: Review — full summary, AI policy check, edit links per section, payment summary
Step 7: Publish confirmation → review queue (1-24hr) → back to dashboard

## All Campaigns Table
Columns: Toggle | Name+objective | Status | Budget | Spent | Reach | CTR | Results | Actions
Sortable. Bulk select + bulk actions. Campaign detail as accordion or side panel with tabs: Overview/Ad Sets/Ads/Breakdown.

## Ad Placements (10 locations)
1. DreamLine feed: every 4th post, "Sponsored" label, all rail buttons active, OoWop earns $VLG
2. Workshop feed: every 5th card, requires goal category match, "Sponsored" replaces action banner
3. DreamLine stories: 9:16, 15s max, skip after 2s
4. Trading Post Market browse: every 3rd featured store + every 6th product tile
5. Trading Post Deals feed: 8th card then every 10th, financial services disclosure required
6. Profile suggested: "People you may know" sections
7. In-video overlay: bottom 18%, appears at 5s mark, 6s duration, dismissible
8. Workshop Skill Stream: every 8th card, educational content required
9. Bank section: between AI insight and accounts (financial goals targeting, compliance required)
10. Wellness section: between check-in and Today cards (health goal targeting, FDA disclaimer required)

## Boost Post Fast Path (3 steps)
Goal → Audience → Budget slider ($1-$1000/day) + duration (1/7/14/30d) → "Boost now"
Immediate for published posts after policy scan.

## Audiences Library
Tabs: Saved / Custom / Lookalike. Cards with size, dates, performance, action buttons.

## Creative Library
Grid with filters. Performance pills (green 5%+, amber 3-5%). AI insights: top performer, fatigue flags, unused creatives.

## Analytics (Page 7)
- Top metrics row (selectable for chart)
- Performance line/bar chart per campaign
- Placement performance breakdown table
- Audience insights: age bars, gender donut, top GPS goal categories
- Conversion funnel: Impression → Visit → Lead → Purchase
- Custom report builder: 25+ metric checkboxes, breakdowns, CSV export
- Attribution settings: 1-day click, 7-day click (default), view windows

## Village Pixel
JS snippet for external sites. 10 standard events. Test events tool (live stream). Custom conversions from URL rules. Pixel → Custom Audience creation with time windows.

## Billing
Payment: Village Bank balance, card, $VICO wallet (WalletConnect). Billing threshold ($25 default, auto-increases). Spending limit. Billing history with PDF receipts (DocuSeal). Tax info.

## AI Optimization Layer (Spirit-powered, daily)
- Budget reallocation across ad sets
- Audience fatigue detection (frequency > 8)
- Creative refresh prompts (CTR drop > 40% over 3 weeks)
- Learning phase alerts (< 50 events in 7 days)
- Placement optimization
- Scheduling suggestions

## 10 Integration Wires
1. Create flow → Boost path (pre-loaded content)
2. Bank account → ad spend payment (Unit BaaS, shows in Bank transaction history)
3. $VICO wallet → ad credits (100 $VICO = $10, 90% retired 10% burned)
4. Workshop GPS goals → audience targeting (most powerful targeting option)
5. Trading Post eStore → ad destination picker
6. Village Pixel → conversion tracking (n8n matches to Village users via hashed email)
7. AI layer → daily recommendations (Ollama + LLaMA3)
8. Content moderation → ad approval (Spirit AI reviews, policy violations flagged)
9. OoWops on ads → $VLG earn (advertiser absorbs cost, keeps OoWop mechanic intact)
10. ViCo burn from ad revenue: 20% of ad revenue → weekly buyback-and-burn

## Database Schema (migration 037_ads_manager.sql)
ad_accounts, campaigns, ad_sets, ads, creative_library, saved_audiences, campaign_metrics_daily, pixel_events, ad_billing_transactions, campaign_ai_recommendations, ad_policy_violations

Key tables:
- campaigns: objective, status (draft|in_review|active|learning|paused|completed|rejected), budget_type, cbo_enabled, bid_strategy
- ad_sets: targeting JSONB, placements text[], estimated_daily_reach range
- ads: format, primary_text_variants[], policy_check_status
- campaign_metrics_daily: impressions, reach, clicks, CTR, CPM, spend, oowops, video_views, conversions
- pixel_events: matched_user_id, attributed_campaign_id

## Open Source Stack
PostHog (analytics), Metabase (dashboards), n8n (automation), Ollama+LLaMA3 (AI), Meilisearch (interest taxonomy), AppFlowy (data), Nextcloud (creatives), DocuSeal (receipts), BTCPay ($VICO), Unit BaaS (card/bank), Ethers.js ($VICO wallet)
