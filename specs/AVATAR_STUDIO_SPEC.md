# Avatar Studio — Complete Specification
# Source: User vision document. DO NOT delete or modify without updating code.
# Last updated: 2026-06-03

## What Already Exists
- Full-screen Three.js canvas (@react-three/fiber + @react-three/drei)
- 36 local GLTF model files (18 character types × 2 body types) in /public/models/gltf/
- MeshToonMaterial cartoon shading
- Runtime recoloring by mesh name (skin, hair, outfit)
- OrbitControls for 3D navigation
- Config saved to Supabase profiles.avatar_config as JSON
- RPMAvatar3D.tsx for rendering avatars with idle/walk animations

## What Needs to Be Built
- Hair style selector (hair_id field exists, no UI)
- Accessory selector (accessory_id field exists, no UI)
- Face customization (eyes, brows, facial hair, morph targets)
- Expression and animation preview
- AI photo-to-avatar generation (MediaPipe, on-device)
- NFT minting to Village Chain (ERC-721)
- Avatar presence: Office meeting room, Trigger screen, DreamLine, Workshop
- Avatar badges linked to achievements
- Mobile touch controls

## Routes
/village/hut/avatar — Builder (home)
/village/hut/avatar/gallery — Browse/manage multiple avatars
/village/hut/avatar/expressions — Expression + animation editor
/village/hut/avatar/nft — Mint as NFT

## Page 1 — Avatar Builder (/village/hut/avatar)
Full-screen immersive. Teepee button only nav. Background: #E8EEFF→#F5F0FF→#EFF8FF gradient.

Top bar (floating, rgba(10,10,20,0.6) blur):
- Back → /village/hut
- "Avatar Studio" center
- Auto-rotate toggle, Preview button, Save button (Village blue #0033CC)

7 tabs (expanded from current 4): Style | Skin | Hair | Face | Outfit | Accessories | Animations

### Tab 1 — Style (enhanced)
- Body type: Male / Female / Non-binary
- 18 character styles in 3-col grid with preview thumbnails
- Photo match button: opens front camera, MediaPipe Face Mesh analyzes on-device, suggests closest skin tone + 2-3 matching styles. No photo stored.

### Tab 2 — Skin (enhanced)
- 8 skin tone swatches
- Undertone selector: Cool / Neutral / Warm (shader-level hue shift, 24 effective variants)
- Makeup layer: 4 lip color swatches + 4 eye shadow options

### Tab 3 — Hair (fully built out)
- Hair style selector: 4-col scrollable grid, 16 styles (Short/Medium/Long/Special categories)
  Styles: buzz, crop, fade, tapered, textured, wavy, side-part, layered, straight, curly, braids, locs, mohawk, afro, updo, bun
- Hair styles as separate GLB files using gltf-avatar-threejs switchable skin system
- Hair color: 8 swatches + custom hex input

### Tab 4 — Face (NEW)
- 4 morph target sliders: face width, eye size, nose shape, jaw shape (0-100)
- Facial hair grid: none/stubble/short beard/full beard/mustache/goatee (male + non-binary)
- Face accessories: none/glasses (3)/earrings (3)/face markings (tribal/scar/freckles)

### Tab 5 — Outfit (enhanced)
- 8 color swatches (existing)
- Sub-tabs: Top / Bottom / Shoes (4-6 options each, separate GLB meshes)
- Complete sets row: Casual / Professional / Athletic / Village Formal

### Tab 6 — Accessories (NEW)
- Hats: none/cap forward/cap backward/beanie/crown (locked: complete 5 GPS goals)/hood
- Jewelry: none/necklace (3 styles)/bracelet/watch
- Achievement badges (float near avatar, locked until earned):
  - "First goal" teal shield (first GPS goal verified)
  - "Village Elder" gold crown (2,000 $VICO staked)
  - "OoWop Legend" golden fist (10,000 OoWops received)
  - "Sprint Master" lightning bolt (50 sprints completed)
  Locked badges show grayed silhouette + lock icon + unlock description
- Background scene (profile pic mode only): village square/office/galaxy/mountain/city/gradient

### Tab 7 — Animations (NEW)
- Default idle selector: standard idle/confident stand/casual lean/thinking/ready stance/celebration loop
- Reaction animations preview: wave/thumbs up/clap/point/shrug/fist pump
- Sprint completion animation (unlocks at first sprint completion)
- All animations from Mixamo free tier, baked as GLB in /public/animations/

Bottom bar: Preview pill | 48px live avatar preview circle | "Save and use" button

## Page 2 — Avatar Gallery (/village/hut/avatar/gallery)
- 2-col grid of avatar cards: preview PNG, nickname, status badge
- Status: Active profile / Office avatar / Workshop avatar / Saved
- Context assignment tap menu: Profile picture / DreamLine / Workshop / Office / Trading Post
- Create new button (floating bottom right)

## Page 3 — Expressions Editor (/village/hut/avatar/expressions)
- 8 expression thumbnails: Neutral/Happy/Excited/Focused/Thinking/Proud/Grateful/Determined
- Morph target blends on face mesh
- "Set as default" option
- DreamLine expression mapping toggle (auto-shifts expression per post type)

## Page 4 — NFT Mint (/village/hut/avatar/nft)
4-step flow:
1. Preview: 1024×1024 render with background scene
2. Metadata: NFT name + description
3. Mint cost: 5 $VICO (~$0.50-$5). Plain-language explanation.
4. Confirm: OpenZeppelin ERC-721 via Ethers.js → Polygon
- Config JSON stored on Nextcloud/IPFS
- Uniqueness: keccak256 config hash checked on-chain, reverts if duplicate
- After mint: chain icon badge on gallery card

## Avatar Presence (6 locations)
1. Profile: toggle real photo ↔ avatar PNG. Story ring works on PNG.
2. DreamLine post header: avatar PNG (expression-linked if mapping enabled). 8 expression PNGs pre-rendered on save.
3. Office meeting room camera-off: 3D avatar via PrivacyPuppet. MediaPipe Face Mesh drives head tracking/jaw/eye (consent required). Falls back to idle animation.
4. Trigger screen: 80px animated circle top-right, plays ready stance. Fist pump at "Let's GO".
5. Sprint completion: avatar center of celebration overlay, plays sprint celebration animation, confetti, achievement badge floating nearby.
6. OoWop reaction: 32px avatar fist pump replaces generic fist fly-up. Comment bubble shows Thinking expression.

## Database Schema Additions (migration 038_avatar_studio.sql)
```sql
-- Extend avatar_configs (or create as separate table if profiles.avatar_config isn't enough)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_config_v2 JSONB;
-- Fields: nickname, skin_undertone, hair_id, face_width, eye_size, nose_shape, jaw_shape,
--   facial_hair_id, makeup_lip_color, makeup_eye_shadow, hat_id, jewelry_id, badge_ids[],
--   background_scene_id, default_idle_animation, default_expression, expression_mapping_enabled,
--   is_profile_avatar, is_dreamline_avatar, is_workshop_avatar, is_office_avatar,
--   preview_png_url, expression_pngs JSONB, is_minted, nft_token_id, nft_chain_tx_hash,
--   nft_metadata_url, config_hash

CREATE TABLE IF NOT EXISTS avatar_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  badge_id VARCHAR(50) UNIQUE,
  name VARCHAR(100), description TEXT,
  unlock_type VARCHAR(30), unlock_threshold INT,
  icon_url TEXT, is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS avatar_badge_unlocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id VARCHAR(50) REFERENCES avatar_badges(badge_id),
  unlocked_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Open Source Stack
- @react-three/fiber, @react-three/drei, three — already in codebase
- gltf-avatar-threejs — switchable hair/clothes/accessories on shared skeleton (new dep)
- @mediapipe/face_mesh — on-device face detection for photo match (new dep)
- @tensorflow/tfjs — face landmark detection (new dep)
- PrivacyPuppet — head tracking/jaw/eye for Office avatar (new dep)
- OpenZeppelin ERC-721 — NFT contract (smart contract layer)
- Ethers.js — already in stack
- Mixamo (free offline) — animations baked as GLB
- MakeHuman + MPFB2 — additional diverse base models (offline tool)
