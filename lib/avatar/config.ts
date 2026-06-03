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

// Character types map to specific GLTF model files in /public/models/gltf/
export type CharacterType =
  | 'casual'    | 'casual2'   | 'casual3'
  | 'worker'    | 'doctor'    | 'kimono'
  | 'ninja'     | 'pirate'    | 'cowboy'
  | 'chef'      | 'elf'       | 'knight'
  | 'suit'      | 'soldier'   | 'wizard'
  | 'witch'     | 'rogue'     | 'warrior';

export type BodyType = 'male' | 'female';

export type SkinUndertone = 'cool' | 'neutral' | 'warm';

export interface AvatarConfig {
  skin_id:                string;
  hair_id:                string;
  hair_color_id:          string;
  outfit_id:              string;
  accessory_id:           string;
  character_type?:        CharacterType;
  body_type?:             BodyType;
  // --- New fields added in Avatar Studio v2 ---
  skin_undertone:         SkinUndertone;
  face_width:             number;
  eye_size:               number;
  nose_shape:             number;
  jaw_shape:              number;
  facial_hair_id:         string;
  face_accessory_id:      string;
  hat_id:                 string;
  jewelry_id:             string;
  background_scene_id:    string;
  default_idle_animation: string;
  makeup_lip:             string;
  makeup_eye:             string;
}

export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  skin_id:                's5',
  hair_id:                'straight',
  hair_color_id:          'c1',
  outfit_id:              'o2',
  accessory_id:           'a0',
  character_type:         'casual',
  body_type:              'male',
  skin_undertone:         'neutral',
  face_width:             50,
  eye_size:               50,
  nose_shape:             50,
  jaw_shape:              50,
  facial_hair_id:         'none',
  face_accessory_id:      'none',
  hat_id:                 'none',
  jewelry_id:             'none',
  background_scene_id:    'gradient',
  default_idle_animation: 'standard_idle',
  makeup_lip:             'none',
  makeup_eye:             'none',
};

// Resolve character_type + body_type → GLTF URL
export function resolveCharacterURL(cfg: Partial<AvatarConfig>): string {
  const type = cfg.character_type ?? 'casual';
  const body = cfg.body_type ?? 'male';
  const suffix = body === 'female' ? 'Female' : 'Male';

  const MAP: Record<CharacterType, string> = {
    casual:  `/models/gltf/Casual_${suffix}.gltf`,
    casual2: `/models/gltf/Casual2_${suffix}.gltf`,
    casual3: `/models/gltf/Casual3_${suffix}.gltf`,
    worker:  `/models/gltf/Worker_${suffix}.gltf`,
    doctor:  `/models/gltf/Doctor_${suffix}_Young.gltf`,
    kimono:  `/models/gltf/Kimono_${suffix}.gltf`,
    ninja:   `/models/gltf/Ninja_${suffix}.gltf`,
    pirate:  `/models/gltf/Pirate_${suffix}.gltf`,
    cowboy:  `/models/gltf/Cowboy_${suffix}.gltf`,
    chef:    `/models/gltf/Chef_${suffix}.gltf`,
    elf:     `/models/gltf/Elf.gltf`,
    knight:  `/models/gltf/Knight_Male.gltf`,
    suit:    `/models/gltf/Suit_${suffix}.gltf`,
    soldier: `/models/gltf/BlueSoldier_${suffix}.gltf`,
    wizard:  `/models/gltf/Wizard.gltf`,
    witch:   `/models/gltf/Witch.gltf`,
    rogue:   `/models/gltf/Rogue.gltf`,
    warrior: `/models/gltf/Warrior.gltf`,
  };
  return MAP[type] ?? `/models/gltf/Casual_${suffix}.gltf`;
}

// Resolve avatar config → hex colors for the 3D character
export function resolveAvatarColors(cfg: Partial<AvatarConfig>) {
  return {
    skinColor:  SKIN_TONE_MAP[cfg.skin_id   ?? 's5'] ?? '#A86030',
    hairColor:  HAIR_COLOR_MAP[cfg.hair_color_id ?? 'c1'] ?? '#0C0700',
    shirtColor: SHIRT_COLOR_MAP[cfg.outfit_id ?? 'o2'] ?? '#2563EB',
  };
}
