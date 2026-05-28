-- ── Spirit settings expansion ──────────────────────────────────────────────
-- Adds multi-tradition support (up to 3) and custom glow color

ALTER TABLE spirit_configs ADD COLUMN IF NOT EXISTS spiritual_systems TEXT[] DEFAULT '{}';
ALTER TABLE spirit_configs ADD COLUMN IF NOT EXISTS spirit_glow_color TEXT DEFAULT '#3B82F6';

-- Migrate any existing single spiritual_system into the array
UPDATE spirit_configs
SET spiritual_systems = ARRAY[spiritual_system]
WHERE spiritual_system IS NOT NULL
  AND spiritual_system != 'Secular'
  AND (spiritual_systems IS NULL OR array_length(spiritual_systems, 1) IS NULL);
