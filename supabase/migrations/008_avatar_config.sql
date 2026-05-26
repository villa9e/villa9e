-- Migration 008: Avatar configuration stored on profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_config JSONB DEFAULT '{
  "skin_id": "s4",
  "hair_id": "h1",
  "hair_color_id": "c1",
  "outfit_id": "o1",
  "accessory_id": "a0"
}'::jsonb;

SELECT 'Migration 008: avatar_config column added to profiles.' AS status;
