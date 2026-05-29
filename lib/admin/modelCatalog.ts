// All GLTF models available for admin sandbox placement
// Organized by category for the sidebar palette

export type ModelCategory =
  | 'trees'
  | 'rocks'
  | 'vegetation'
  | 'animals'
  | 'buildings'
  | 'props'
  | 'terrain'
  | 'characters'
  | 'water';

export interface CatalogModel {
  id:       string;
  label:    string;
  url:      string;
  category: ModelCategory;
  defaultScale: number;
  yOffset:  number;       // lift above terrain
  emoji:    string;
}

const M = (name: string) => `/models/gltf/${name}.gltf`;

export const MODEL_CATALOG: CatalogModel[] = [
  // ── Trees ──────────────────────────────────────────────────────────────────
  { id:'birch1',   label:'Birch Tree 1',     url:M('BirchTree_1'),            category:'trees',      defaultScale:1.0, yOffset:0, emoji:'🌳' },
  { id:'birch2',   label:'Birch Tree 2',     url:M('BirchTree_2'),            category:'trees',      defaultScale:1.0, yOffset:0, emoji:'🌳' },
  { id:'birch3',   label:'Birch Tree 3',     url:M('BirchTree_3'),            category:'trees',      defaultScale:1.0, yOffset:0, emoji:'🌳' },
  { id:'birch4',   label:'Birch Tree 4',     url:M('BirchTree_4'),            category:'trees',      defaultScale:1.0, yOffset:0, emoji:'🌳' },
  { id:'birch5',   label:'Birch Tree 5',     url:M('BirchTree_5'),            category:'trees',      defaultScale:1.0, yOffset:0, emoji:'🌳' },
  { id:'maple1',   label:'Maple Tree 1',     url:M('MapleTree_1'),            category:'trees',      defaultScale:1.0, yOffset:0, emoji:'🍁' },
  { id:'maple2',   label:'Maple Tree 2',     url:M('MapleTree_2'),            category:'trees',      defaultScale:1.0, yOffset:0, emoji:'🍁' },
  { id:'maple3',   label:'Maple Tree 3',     url:M('MapleTree_3'),            category:'trees',      defaultScale:1.0, yOffset:0, emoji:'🍁' },
  { id:'maple4',   label:'Maple Tree 4',     url:M('MapleTree_4'),            category:'trees',      defaultScale:1.0, yOffset:0, emoji:'🍁' },
  { id:'maple5',   label:'Maple Tree 5',     url:M('MapleTree_5'),            category:'trees',      defaultScale:1.0, yOffset:0, emoji:'🍁' },
  { id:'pine1',    label:'Pine Tree',        url:M('Resource_PineTree'),      category:'trees',      defaultScale:1.0, yOffset:0, emoji:'🌲' },
  { id:'pineG',    label:'Pine Group',       url:M('Resource_PineTree_Group'),category:'trees',      defaultScale:1.0, yOffset:0, emoji:'🌲' },
  { id:'dead1',    label:'Dead Tree 1',      url:M('DeadTree_1'),             category:'trees',      defaultScale:1.0, yOffset:0, emoji:'🪵' },
  { id:'dead2',    label:'Dead Tree 2',      url:M('DeadTree_2'),             category:'trees',      defaultScale:1.0, yOffset:0, emoji:'🪵' },
  { id:'dead3',    label:'Dead Tree 3',      url:M('DeadTree_3'),             category:'trees',      defaultScale:1.0, yOffset:0, emoji:'🪵' },
  { id:'palm1',    label:'Palm Tree 1',      url:M('Environment_PalmTree_1'), category:'trees',      defaultScale:1.0, yOffset:0, emoji:'🌴' },
  { id:'palm2',    label:'Palm Tree 2',      url:M('Environment_PalmTree_2'), category:'trees',      defaultScale:1.0, yOffset:0, emoji:'🌴' },
  { id:'palm3',    label:'Palm Tree 3',      url:M('Environment_PalmTree_3'), category:'trees',      defaultScale:1.0, yOffset:0, emoji:'🌴' },

  // ── Rocks / Terrain ───────────────────────────────────────────────────────
  { id:'rock',     label:'Rock',             url:M('Rock'),                   category:'rocks',      defaultScale:1.0, yOffset:0,    emoji:'🪨' },
  { id:'rockG',    label:'Rock Group',       url:M('Rock_Group'),             category:'rocks',      defaultScale:1.0, yOffset:0,    emoji:'🪨' },
  { id:'envR1',    label:'Env Rock 1',       url:M('Environment_Rock_1'),     category:'rocks',      defaultScale:1.0, yOffset:0,    emoji:'🪨' },
  { id:'envR2',    label:'Env Rock 2',       url:M('Environment_Rock_2'),     category:'rocks',      defaultScale:1.0, yOffset:0,    emoji:'🪨' },
  { id:'envR3',    label:'Env Rock 3',       url:M('Environment_Rock_3'),     category:'rocks',      defaultScale:1.0, yOffset:0,    emoji:'🪨' },
  { id:'resR1',    label:'Resource Rock 1',  url:M('Resource_Rock_1'),        category:'rocks',      defaultScale:1.0, yOffset:0,    emoji:'🪨' },
  { id:'resR2',    label:'Resource Rock 2',  url:M('Resource_Rock_2'),        category:'rocks',      defaultScale:1.0, yOffset:0,    emoji:'🪨' },
  { id:'uiRock',   label:'UI Rocks',         url:M('UI_Rocks'),               category:'rocks',      defaultScale:1.0, yOffset:0,    emoji:'🪨' },
  { id:'cliff1',   label:'Cliff 1',          url:M('Environment_Cliff1'),     category:'terrain',    defaultScale:1.5, yOffset:0,    emoji:'⛰️' },
  { id:'cliff2',   label:'Cliff 2',          url:M('Environment_Cliff2'),     category:'terrain',    defaultScale:1.5, yOffset:0,    emoji:'⛰️' },
  { id:'cliff3',   label:'Cliff 3',          url:M('Environment_Cliff3'),     category:'terrain',    defaultScale:1.5, yOffset:0,    emoji:'⛰️' },
  { id:'cliff4',   label:'Cliff 4',          url:M('Environment_Cliff4'),     category:'terrain',    defaultScale:1.5, yOffset:0,    emoji:'⛰️' },
  { id:'mtn',      label:'Mountain',         url:M('Mountain_Single'),        category:'terrain',    defaultScale:2.0, yOffset:0,    emoji:'🏔️' },
  { id:'mtnLg',    label:'Mountain Large',   url:M('MountainLarge_Single'),   category:'terrain',    defaultScale:2.0, yOffset:0,    emoji:'🏔️' },
  { id:'mtnGrp1',  label:'Mountain Group 1', url:M('Mountain_Group_1'),       category:'terrain',    defaultScale:2.0, yOffset:0,    emoji:'🏔️' },
  { id:'mtnGrp2',  label:'Mountain Group 2', url:M('Mountain_Group_2'),       category:'terrain',    defaultScale:2.0, yOffset:0,    emoji:'🏔️' },

  // ── Vegetation ────────────────────────────────────────────────────────────
  { id:'bush',     label:'Bush',             url:M('Bush'),                   category:'vegetation', defaultScale:1.0, yOffset:0, emoji:'🌿' },
  { id:'bushF',    label:'Bush w/ Flowers',  url:M('Bush_Flowers'),           category:'vegetation', defaultScale:1.0, yOffset:0, emoji:'🌸' },
  { id:'bushL',    label:'Bush Large',       url:M('Bush_Large'),             category:'vegetation', defaultScale:1.2, yOffset:0, emoji:'🌿' },
  { id:'bushS',    label:'Bush Small',       url:M('Bush_Small'),             category:'vegetation', defaultScale:0.8, yOffset:0, emoji:'🌿' },
  { id:'fl1',      label:'Flower Clump 1',   url:M('Flower_1_Clump'),         category:'vegetation', defaultScale:1.0, yOffset:0, emoji:'🌼' },
  { id:'fl2',      label:'Flower Clump 2',   url:M('Flower_2_Clump'),         category:'vegetation', defaultScale:1.0, yOffset:0, emoji:'🌺' },
  { id:'fl3',      label:'Flower Clump 3',   url:M('Flower_3_Clump'),         category:'vegetation', defaultScale:1.0, yOffset:0, emoji:'🌸' },
  { id:'fl4',      label:'Flower Clump 4',   url:M('Flower_4_Clump'),         category:'vegetation', defaultScale:1.0, yOffset:0, emoji:'🌻' },
  { id:'fl5',      label:'Flower Clump 5',   url:M('Flower_5_Clump'),         category:'vegetation', defaultScale:1.0, yOffset:0, emoji:'🌹' },
  { id:'grass',    label:'Grass Large',      url:M('Grass_Large'),            category:'vegetation', defaultScale:1.0, yOffset:0, emoji:'🌾' },
  { id:'grassS',   label:'Grass Small',      url:M('Grass_Small'),            category:'vegetation', defaultScale:1.0, yOffset:0, emoji:'🌾' },
  { id:'logs',     label:'Logs',             url:M('Logs'),                   category:'vegetation', defaultScale:1.0, yOffset:0, emoji:'🪵' },

  // ── Animals ───────────────────────────────────────────────────────────────
  { id:'deer',     label:'Deer',             url:M('Deer'),                   category:'animals',    defaultScale:1.0, yOffset:0, emoji:'🦌' },
  { id:'wolf',     label:'Wolf',             url:M('Wolf'),                   category:'animals',    defaultScale:1.0, yOffset:0, emoji:'🐺' },
  { id:'fox',      label:'Fox',              url:M('Fox'),                    category:'animals',    defaultScale:0.9, yOffset:0, emoji:'🦊' },
  { id:'alpaca',   label:'Alpaca',           url:M('Alpaca'),                 category:'animals',    defaultScale:1.0, yOffset:0, emoji:'🦙' },
  { id:'horse',    label:'Horse',            url:M('Horse'),                  category:'animals',    defaultScale:1.0, yOffset:0, emoji:'🐴' },
  { id:'husky',    label:'Husky',            url:M('Husky'),                  category:'animals',    defaultScale:0.8, yOffset:0, emoji:'🐕' },
  { id:'pug',      label:'Pug',              url:M('Pug'),                    category:'animals',    defaultScale:0.7, yOffset:0, emoji:'🐶' },
  { id:'shiba',    label:'Shiba Inu',        url:M('ShibaInu'),               category:'animals',    defaultScale:0.8, yOffset:0, emoji:'🐕' },

  // ── Buildings / Structures ────────────────────────────────────────────────
  { id:'house1',   label:'House 1',          url:M('Environment_House1'),     category:'buildings',  defaultScale:1.0, yOffset:0, emoji:'🏠' },
  { id:'house2',   label:'House 2',          url:M('Environment_House2'),     category:'buildings',  defaultScale:1.0, yOffset:0, emoji:'🏠' },
  { id:'house3',   label:'House 3',          url:M('Environment_House3'),     category:'buildings',  defaultScale:1.0, yOffset:0, emoji:'🏘️' },
  { id:'houseFA1', label:'FirstAge House 1', url:M('Houses_FirstAge_1_Level1'),category:'buildings', defaultScale:1.0, yOffset:0, emoji:'🏛️' },
  { id:'houseFA2', label:'FirstAge House 2', url:M('Houses_FirstAge_2_Level1'),category:'buildings', defaultScale:1.0, yOffset:0, emoji:'🏛️' },
  { id:'houseSA',  label:'SecondAge House',  url:M('Houses_SecondAge_1_Level1'),category:'buildings',defaultScale:1.0, yOffset:0, emoji:'🏛️' },
  { id:'tower',    label:'Tower House',      url:M('TowerHouse_FirstAge'),    category:'buildings',  defaultScale:1.0, yOffset:0, emoji:'🏰' },
  { id:'watchTwr', label:'Watch Tower',      url:M('WatchTower_FirstAge_Level1'),category:'buildings',defaultScale:1.0, yOffset:0, emoji:'🗼' },
  { id:'market1',  label:'Market (Old)',     url:M('Market_FirstAge_Level1'), category:'buildings',  defaultScale:1.0, yOffset:0, emoji:'🏪' },
  { id:'market2',  label:'Market (New)',     url:M('Market_SecondAge_Level1'),category:'buildings',  defaultScale:1.0, yOffset:0, emoji:'🏪' },
  { id:'temple1',  label:'Temple (Old)',     url:M('Temple_FirstAge_Level1'), category:'buildings',  defaultScale:1.0, yOffset:0, emoji:'⛩️' },
  { id:'temple2',  label:'Temple (New)',     url:M('Temple_SecondAge_Level1'),category:'buildings',  defaultScale:1.0, yOffset:0, emoji:'⛩️' },
  { id:'sawmill',  label:'Sawmill',          url:M('Environment_Sawmill'),    category:'buildings',  defaultScale:1.0, yOffset:0, emoji:'🏗️' },
  { id:'windmill', label:'Windmill',         url:M('Windmill_FirstAge'),      category:'buildings',  defaultScale:1.0, yOffset:0, emoji:'🏭' },
  { id:'dock',     label:'Dock',             url:M('Environment_Dock'),       category:'buildings',  defaultScale:1.0, yOffset:0, emoji:'⚓' },
  { id:'dockPole', label:'Dock Pole',        url:M('Environment_Dock_Pole'),  category:'buildings',  defaultScale:1.0, yOffset:0, emoji:'🪝' },

  // ── Props ─────────────────────────────────────────────────────────────────
  { id:'barrel',   label:'Barrel',           url:M('Barrel'),                 category:'props',      defaultScale:1.0, yOffset:0, emoji:'🛢️' },
  { id:'pBarrel',  label:'Prop Barrel',      url:M('Prop_Barrel'),            category:'props',      defaultScale:1.0, yOffset:0, emoji:'🛢️' },
  { id:'crate',    label:'Crate',            url:M('Crate'),                  category:'props',      defaultScale:1.0, yOffset:0, emoji:'📦' },
  { id:'crate2',   label:'Crate Stack',      url:M('Crate_Big_Stack2'),       category:'props',      defaultScale:1.0, yOffset:0, emoji:'📦' },
  { id:'chest',    label:'Gold Chest',       url:M('Prop_Chest_Gold'),        category:'props',      defaultScale:0.9, yOffset:0, emoji:'💰' },
  { id:'fish1',    label:'Fish (Mackerel)',   url:M('Prop_Fish_Mackerel'),     category:'props',      defaultScale:0.8, yOffset:0, emoji:'🐟' },
  { id:'fish2',    label:'Fish (Tuna)',       url:M('Prop_Fish_Tuna'),         category:'props',      defaultScale:0.8, yOffset:0, emoji:'🐟' },
  { id:'fishBkt',  label:'Fish Bucket',      url:M('Prop_Bucket_Fishes'),     category:'props',      defaultScale:0.9, yOffset:0, emoji:'🪣' },
];

export const CATEGORIES: { id: ModelCategory; label: string; emoji: string }[] = [
  { id:'trees',      label:'Trees',      emoji:'🌳' },
  { id:'rocks',      label:'Rocks',      emoji:'🪨' },
  { id:'terrain',    label:'Terrain',    emoji:'⛰️' },
  { id:'vegetation', label:'Plants',     emoji:'🌿' },
  { id:'animals',    label:'Animals',    emoji:'🦌' },
  { id:'buildings',  label:'Buildings',  emoji:'🏛️' },
  { id:'props',      label:'Props',      emoji:'📦' },
];

export function getCategoryModels(cat: ModelCategory): CatalogModel[] {
  return MODEL_CATALOG.filter(m => m.category === cat);
}
