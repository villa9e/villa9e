// Items in villa9e that require VLG token purchase
// Add new gated items here — the VLGGate component reads this registry

export type GatedItemCategory =
  | 'avatar_accessory'
  | 'hut_decoration'
  | 'village_emote'
  | 'pavilion_ticket'
  | 'tribe_perks'
  | 'seasonal_effect';

export interface GatedItem {
  id:          string;
  label:       string;
  description: string;
  price:       number;   // VLG tokens
  category:    GatedItemCategory;
  emoji:       string;
  preview?:    string;   // URL or emoji for preview
  exclusive?:  boolean;  // One-time purchase
  seasonal?:   boolean;  // Only available in certain seasons
  season?:     'spring' | 'summer' | 'autumn' | 'winter';
}

export const GATED_ITEMS: GatedItem[] = [
  // ── Avatar accessories ──────────────────────────────────────────────────────
  { id:'acc_crown_gold',   label:'Gold Crown',       description:'Gleaming crown for your avatar',          price:  50, category:'avatar_accessory', emoji:'👑', exclusive: false },
  { id:'acc_wings',        label:'Angel Wings',      description:'White feather wings — you earned them',   price: 120, category:'avatar_accessory', emoji:'🪽', exclusive: false },
  { id:'acc_halo',         label:'Halo Ring',        description:'Floating golden halo over your head',     price:  80, category:'avatar_accessory', emoji:'😇', exclusive: false },
  { id:'acc_dragon_aura',  label:'Dragon Aura',      description:'Flame aura surrounds your avatar',        price: 200, category:'avatar_accessory', emoji:'🐉', exclusive: true  },
  { id:'acc_star_trail',   label:'Star Trail',       description:'Starlight particles trail behind you',    price: 150, category:'avatar_accessory', emoji:'⭐', exclusive: false },
  { id:'acc_ankh_lg',      label:'Ankh of Life',     description:'Sacred ankh pendant — legacy symbol',    price:  60, category:'avatar_accessory', emoji:'☥', exclusive: false },
  { id:'acc_crown_diamond',label:'Diamond Crown',    description:'The rarest crown in the village',         price: 500, category:'avatar_accessory', emoji:'💎', exclusive: true  },

  // ── Hut decorations ─────────────────────────────────────────────────────────
  { id:'hut_tapestry_kente', label:'Kente Tapestry',  description:'Authentic Kente woven wall art',         price:  40, category:'hut_decoration', emoji:'🪢' },
  { id:'hut_fountain',       label:'Stone Fountain',   description:'Flowing water feature for your hut',    price:  90, category:'hut_decoration', emoji:'⛲' },
  { id:'hut_sacred_fire',    label:'Sacred Fire Pit',  description:'Eternal flame in your hut courtyard',   price:  70, category:'hut_decoration', emoji:'🔥' },
  { id:'hut_golden_arch',    label:'Golden Arch Door', description:'Ornate golden arch entrance',           price: 130, category:'hut_decoration', emoji:'🏛️' },
  { id:'hut_garden_zen',     label:'Mini Zen Garden',  description:'Sand garden with raked patterns',       price:  55, category:'hut_decoration', emoji:'🪨' },
  { id:'hut_music_sphere',   label:'Music Sphere',     description:'Ambient sound sphere plays your vibe',  price:  85, category:'hut_decoration', emoji:'🎵' },

  // ── Village emotes ──────────────────────────────────────────────────────────
  { id:'emote_bow',       label:'Bow Emote',     description:'Deep respectful bow animation',              price:  20, category:'village_emote', emoji:'🙇' },
  { id:'emote_dance',     label:'Victory Dance', description:'Celebrate with a full dance sequence',       price:  35, category:'village_emote', emoji:'💃' },
  { id:'emote_meditate',  label:'Meditate',      description:'Sit in lotus position with glow effect',     price:  30, category:'village_emote', emoji:'🧘' },
  { id:'emote_salute',    label:'Royal Salute',  description:'Formal salute to tribe leaders',             price:  25, category:'village_emote', emoji:'🫡' },
  { id:'emote_fireworks', label:'Launch Fireworks', description:'Burst of fireworks from your avatar',     price:  60, category:'village_emote', emoji:'🎆', exclusive: false },

  // ── Seasonal items ──────────────────────────────────────────────────────────
  { id:'seasonal_sakura', label:'Cherry Blossom Aura', description:'Pink petals surround you all spring', price: 100, category:'seasonal_effect', emoji:'🌸', seasonal:true, season:'spring' },
  { id:'seasonal_snow',   label:'Snow Globe Effect',   description:'Personal snow globe follows you',     price: 100, category:'seasonal_effect', emoji:'❄️', seasonal:true, season:'winter' },
  { id:'seasonal_fall',   label:'Autumn Leaf Swirl',   description:'Fall leaves spiral around your avatar',price:100, category:'seasonal_effect', emoji:'🍂', seasonal:true, season:'autumn' },
  { id:'seasonal_sun',    label:'Solar Glow',          description:'Sun rays radiate from your avatar',   price: 100, category:'seasonal_effect', emoji:'☀️', seasonal:true, season:'summer' },

  // ── Tribe perks ─────────────────────────────────────────────────────────────
  { id:'tribe_banner',   label:'Custom Tribe Banner', description:'Design your tribe's banner for the village map', price: 150, category:'tribe_perks', emoji:'🚩' },
  { id:'tribe_territory',label:'Territory Marker',    description:'Plant your tribe's marker in a forest zone',     price: 200, category:'tribe_perks', emoji:'🏴', exclusive: false },
  { id:'tribe_hall',     label:'Tribe Hall Upgrade',  description:'Unlock larger meeting room for your tribe',      price: 300, category:'tribe_perks', emoji:'🏛️', exclusive: true },
];

export function getItemsByCategory(cat: GatedItemCategory): GatedItem[] {
  return GATED_ITEMS.filter(i => i.category === cat);
}

export function getItemById(id: string): GatedItem | undefined {
  return GATED_ITEMS.find(i => i.id === id);
}
