# Pavilion — Complete Specification
# Source: User vision document. DO NOT delete or modify without updating code.
# Last updated: 2026-06-03

## What It Is
Netflix + Twitch + Eventbrite + Clubhouse on open source infrastructure. Three content pillars:
1. Live events — concerts, webinars, masterclasses, virtual venues with backstage/greenroom/stage
2. On-demand library — public domain + free-licensed films + creator originals + subscriptions
3. Creator subscriptions — monthly membership model (85% to creator, 15% Village)

## Color System
Day: page bg #F0EFF8 (lavender), card white, card border #DDD9F5, accent #7F77DD purple, live badge #E24B4A red, ticket badge #EF9F27 amber
Night: page bg #0F0E1C (deep purple-navy — cinematic default), card #1A1830, border #2A2845, accent #AFA9EC

## Routes
/village/pavilion — home
/village/pavilion/live — live events hub
/village/pavilion/live/[eventId] — live event room
/village/pavilion/live/[eventId]/backstage — host + speakers only
/village/pavilion/browse — on-demand library
/village/pavilion/browse/[category] — category page
/village/pavilion/watch/[contentId] — video player
/village/pavilion/creators — creator discovery
/village/pavilion/creators/[handle] — creator channel
/village/pavilion/subscriptions — user's subscriptions
/village/pavilion/tickets — user's tickets
/village/pavilion/upload — creator upload
/village/pavilion/host — event creation

## Home Screen (Netflix-style)
- Hero: full-bleed 100vw × 56vw, auto-playing muted preview, 3-5 rotating items
- Content rows (horizontal scroll): Happening now, Your upcoming events, Continue watching, Because you're working on [GPS goal], Trending in The Village, New releases, Free to watch, Popular in [city], Creator originals, Creator channel rows (for subscriptions)
- Personalization: GPS goal signals, viewing history, DreamLine engagement, tickets, trending, time of day

## Card Types
- Standard content (2:3 poster, 120×180px): thumbnail, badge overlays, progress bar
- Landscape (16:9, 220×124px): for featured/events
- Event card: viewer count, countdown, price

## Pre-loaded Free Content Library
Source 1: Internet Archive API — public domain films, documentaries, animation, educational
  Filter: >1,000 downloads, has rating, valid video file. Sort by downloads desc.
Source 2: Wikimedia Commons — CC-BY/CC-BY-SA licensed educational + cultural
Source 3: Open Culture (manual curation + n8n RSS monitor)
Source 4: Vimeo free content API — CC licensed creator content
Source 5: YouTube public embeds (BBC, National Geographic, TED, university OCW)

Editorial curation algorithm:
- IMDb trending → surface Pavilion equivalents
- YouTube documentary trending → related Pavilion content
- DreamLine content references (AI keyword detection) → boost related Pavilion content
- Box Office Mojo new releases → thematically related free alternatives

## Live Event System

### 3 Zones
Zone 1: Green room (Jitsi, private, speakers only, pre-show)
Zone 2: Backstage (speakers visible to each other, audience sees "Starting soon")
Zone 3: Stage (visible to all ticket holders)

### Backstage Control Panel
- Left: On stage now (grid of video feeds, drag to reorder, mute/remove)
- Right: Waiting in backstage (Bring to stage button)
- Center: Stage preview + Go live/End button + recording toggle + layout selector
- Layout options: Spotlight, Gallery, Presenter, Duo, Solo, Custom
- Audience management: viewer count, engagement, chat moderation, slow mode, invite from audience

### Audience Experience
- Video.js + HLS, auto-quality (360p/720p/1080p)
- Reactions: raised fist/fire/heart/clapping/mind-blown — all real-time via Matrix
- $VICO tipping: 10/25/50/100/250/$custom → instant to creator wallet → chat announcement
- Chat (Matrix real-time), Q&A tab (upvote-sorted questions), Watch party side-channel

### Event Creation (6 steps)
1. Basics: name, description, event type, GPS goal category, Group GPS launch toggle
2. Date, capacity, max on-stage speakers
3. Ticketing: free or paid via Pretix (auto-syncs to Trading Post Market)
4. Speakers: invite by @handle, assign roles (Host/Co-host/Speaker/Performer/Moderator)
5. Artwork upload + Village AI thumbnail generation if none uploaded
6. Technical: browser (MediaSoup) / OBS (RTMP URL+key) / Professional encoder

## Creator Channels
- Hero banner, subscriber count, total views, follow/subscribe
- Tabs: Videos | Live events | Series | Playlists | About
- Subscription tiers: up to 3, priced in USD/VICO (10% VICO discount optional)
- Benefits: early access, exclusive content, backstage, Office channel, monthly live, download, creator OoWop
- Revenue split: 85% creator, 15% Village (better than all competitors)

## $VLG Earning from Content
- Watch 25%: 1 $VLG (viewer), creator earns per view
- Watch 50%: 2 $VLG cumulative
- Watch 75%: 3 $VLG cumulative
- Watch 100%: 4 $VLG cumulative
- Live event: creator earns 5 $VLG per verified viewer per 30 min
- Viewers earn 0.5 $VLG per complete video watched
- OoWop on video: 1 $VLG for viewer, 0.5 $VLG for creator

## Video Player (Video.js custom)
- Play/pause, skip 10s, volume, seek bar with chapter markers
- Subtitles: Whisper AI auto-generated on upload, SRT format
- Multi-language via OpenSubtitles for pre-loaded content
- Speed: 0.75x/1x/1.25x/1.5x/2x
- Action row: add to watchlist, like, dislike, share, download (subscribers), OoWop
- GPS connection card: "This relates to your [goal]. Added to Workshop Skill Stream."
- Related content (Meilisearch similarity)

## GPS Integration
1. Live event → Workshop: during event = "Live now" card in feed, after event = recording scored for Skill Stream
2. Group GPS launch: overlay at end of event, all who opt in start same GPS goal simultaneously, shared Tribe group created → cohort accountability
3. "Save to Workshop" deep link from any content page
4. Content tagged to GPS category → Skill Stream for matching sprint actions

## Ads Manager Updates
Add 2 new placements to Step 4:
- Pavilion pre-roll: 15s non-skippable or 30s skippable after 5s, relevant to content category
- Pavilion event listing: sponsored event card in live hub and home live row

## Database Schema
pavilion_events (id, host_user_id, title, event_type, gps_category, group_gps_enabled, status, scheduled_at, capacity, rtmp_stream_key, hls_stream_url, is_recording_enabled, recording_content_id, viewer_count_peak, tips_received_vico, vlg_earned)
pavilion_event_speakers (id, event_id, user_id, role, status)
pavilion_event_attendees (id, event_id, user_id, ticket_id, watch_duration_seconds, tips_sent_vico)
pavilion_creator_subscriptions (id, creator_user_id, subscriber_user_id, tier_id, status, price_usd/vico, billing_cycle)
pavilion_subscription_tiers (id, creator_user_id, name, price_usd, price_vico_discount_pct, benefits JSONB, max_subscribers)
pavilion_watch_history (id, user_id, content_id, progress_seconds, completion_pct, vlg_earned_25/50/75/100 booleans)
pavilion_tips (id, event_id, sender_user_id, recipient_user_id, vico_amount, chain_tx_hash)
pavilion_series (id, creator_user_id, title, total_episodes, is_complete, gps_categories)
pavilion_content (id, title, type, source, source_id, thumbnail_url, backdrop_url, video_url, duration_seconds, release_year, genres, gps_categories, is_free, license_type, avg_rating, view_count, completion_rate, creator_user_id)

## Open Source Stack
MediaSoup (SFU live streaming), Jitsi (green room/backstage), nginx-rtmp-module (OBS ingest), Video.js + HLS.js (player), FFmpeg (transcoding), Whisper (auto-captions), PeerTube (video storage/CDN), Pretix (ticketing), Matrix/Synapse (live chat), Internet Archive API, Vimeo API, YouTube Data API, OpenSubtitles, Meilisearch (content search), Nextcloud (recordings/uploads), Leaflet.js (venue map for hybrid events), n8n (automation), Ollama+LLaMA3 (recommendations+scoring)

## The Pavilion Promise
Other platforms extract from creators and viewers. Pavilion:
- Creators earn $VLG when work is genuinely watched
- Viewers earn $VLG for completing content
- Live tips go directly to performer in real time
- 85% subscription revenue to creator
- Library starts with greatest free films in human history
- Watching a masterclass immediately launches a GPS goal
"Netflix is an end destination. Pavilion is a starting line."
