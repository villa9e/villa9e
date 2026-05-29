// ─── Avatar configuration maps ────────────────────────────────────────────────
// Shared between the avatar builder page and the 3D village world

export const SKIN_TONE_MAP: Record<string, string> = {
  s1: '#FDE8D0',
  s2: '#F2C9A0',
  s3: '#E8A870',
  s4: '#C88550',
  s5: '#A86030',
  s6: '#8A4820',
  s7: '#6A3018',
  s8: '#3E1C0A',
};

export const HAIR_COLOR_MAP: Record<string, string> = {
  c1: '#0C0700',
  c2: '#3D1E08',
  c3: '#7A3A10',
  c4: '#B87830',
  c5: '#E8C060',
  c6: '#9B59B6',
  c7: '#2980B9',
  c8: '#E74C3C',
};

export const SHIRT_COLOR_MAP: Record<string, string> = {
  o1: '#D97706',
  o2: '#2563EB',
  o3: '#16A34A',
  o4: '#DC2626',
  o5: '#7C3AED',
  o6: '#92400E',
  o7: '#0F766E',
  o8: '#DB2777',
};

export interface AvatarConfig {
  skin_id:       string;
  hair_id:       string;
  hair_color_id: string;
  outfit_id:     string;
  accessory_id:  string;
}

export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  skin_id:       's5',
  hair_id:       'h1',
  hair_color_id: 'c1',
  outfit_id:     'o2',
  accessory_id:  'a0',
};

// Resolve avatar config → hex colors for the 3D character
export function resolveAvatarColors(cfg: Partial<AvatarConfig>) {
  return {
    skinColor:  SKIN_TONE_MAP[cfg.skin_id   ?? 's5'] ?? '#A86030',
    hairColor:  HAIR_COLOR_MAP[cfg.hair_color_id ?? 'c1'] ?? '#0C0700',
    shirtColor: SHIRT_COLOR_MAP[cfg.outfit_id ?? 'o2'] ?? '#2563EB',
  };
}
