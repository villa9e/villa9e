// Model catalog — Quaternius CC0 + KayKit Forest Nature Pack GLTF models
// Organized by category for the world builder palette

export type ModelCategory =
  | 'buildings_residential'
  | 'buildings_civic'
  | 'buildings_military'
  | 'buildings_economy'
  | 'buildings_special'
  | 'nature_trees'
  | 'nature_bushes'
  | 'nature_plants'
  | 'nature_grass'
  | 'nature_rocks'
  | 'nature_terrain'
  | 'nature_water'
  | 'ground_tiles'
  | 'animals'
  | 'characters'
  | 'props_containers'
  | 'props_weapons'
  | 'props_items'
  | 'props_nautical'
  | 'infrastructure';

export interface CatalogModel {
  id:           string;
  label:        string;
  url:          string;
  category:     ModelCategory;
  defaultScale: number;
  yOffset:      number;
  emoji:        string;
  isBuilding?:  boolean;   // shows on map, generates trail
  tags?:        string[];  // searchable tags
}

const G = (name: string) => `/models/gltf/${name}.gltf`;

export const MODEL_CATALOG: CatalogModel[] = [

  // ── RESIDENTIAL BUILDINGS ────────────────────────────────────────────────
  { id:'house_fa1_l1',   label:'House A Level 1',    url:G('Houses_FirstAge_1_Level1'),  category:'buildings_residential', defaultScale:1.0, yOffset:0, emoji:'🏠', isBuilding:true },
  { id:'house_fa1_l2',   label:'House A Level 2',    url:G('Houses_FirstAge_1_Level2'),  category:'buildings_residential', defaultScale:1.0, yOffset:0, emoji:'🏠', isBuilding:true },
  { id:'house_fa1_l3',   label:'House A Level 3',    url:G('Houses_FirstAge_1_Level3'),  category:'buildings_residential', defaultScale:1.0, yOffset:0, emoji:'🏠', isBuilding:true },
  { id:'house_fa2_l1',   label:'House B Level 1',    url:G('Houses_FirstAge_2_Level1'),  category:'buildings_residential', defaultScale:1.0, yOffset:0, emoji:'🏘️', isBuilding:true },
  { id:'house_fa2_l2',   label:'House B Level 2',    url:G('Houses_FirstAge_2_Level2'),  category:'buildings_residential', defaultScale:1.0, yOffset:0, emoji:'🏘️', isBuilding:true },
  { id:'house_fa2_l3',   label:'House B Level 3',    url:G('Houses_FirstAge_2_Level3'),  category:'buildings_residential', defaultScale:1.0, yOffset:0, emoji:'🏘️', isBuilding:true },
  { id:'house_fa3_l1',   label:'House C Level 1',    url:G('Houses_FirstAge_3_Level1'),  category:'buildings_residential', defaultScale:1.0, yOffset:0, emoji:'🏡', isBuilding:true },
  { id:'house_fa3_l2',   label:'House C Level 2',    url:G('Houses_FirstAge_3_Level2'),  category:'buildings_residential', defaultScale:1.0, yOffset:0, emoji:'🏡', isBuilding:true },
  { id:'house_fa3_l3',   label:'House C Level 3',    url:G('Houses_FirstAge_3_Level3'),  category:'buildings_residential', defaultScale:1.0, yOffset:0, emoji:'🏡', isBuilding:true },
  { id:'house_sa1_l1',   label:'Modern House A L1',  url:G('Houses_SecondAge_1_Level1'), category:'buildings_residential', defaultScale:1.0, yOffset:0, emoji:'🏠', isBuilding:true },
  { id:'house_sa1_l2',   label:'Modern House A L2',  url:G('Houses_SecondAge_1_Level2'), category:'buildings_residential', defaultScale:1.0, yOffset:0, emoji:'🏠', isBuilding:true },
  { id:'house_sa1_l3',   label:'Modern House A L3',  url:G('Houses_SecondAge_1_Level3'), category:'buildings_residential', defaultScale:1.0, yOffset:0, emoji:'🏠', isBuilding:true },
  { id:'house_sa2_l1',   label:'Modern House B L1',  url:G('Houses_SecondAge_2_Level1'), category:'buildings_residential', defaultScale:1.0, yOffset:0, emoji:'🏘️', isBuilding:true },
  { id:'house_sa2_l2',   label:'Modern House B L2',  url:G('Houses_SecondAge_2_Level2'), category:'buildings_residential', defaultScale:1.0, yOffset:0, emoji:'🏘️', isBuilding:true },
  { id:'house_sa2_l3',   label:'Modern House B L3',  url:G('Houses_SecondAge_2_Level3'), category:'buildings_residential', defaultScale:1.0, yOffset:0, emoji:'🏘️', isBuilding:true },
  { id:'house_sa3_l1',   label:'Modern House C L1',  url:G('Houses_SecondAge_3_Level1'), category:'buildings_residential', defaultScale:1.0, yOffset:0, emoji:'🏡', isBuilding:true },
  { id:'house_sa3_l2',   label:'Modern House C L2',  url:G('Houses_SecondAge_3_Level2'), category:'buildings_residential', defaultScale:1.0, yOffset:0, emoji:'🏡', isBuilding:true },
  { id:'house_sa3_l3',   label:'Modern House C L3',  url:G('Houses_SecondAge_3_Level3'), category:'buildings_residential', defaultScale:1.0, yOffset:0, emoji:'🏡', isBuilding:true },
  { id:'env_house1',     label:'Env House 1',        url:G('Environment_House1'),        category:'buildings_residential', defaultScale:1.0, yOffset:0, emoji:'🏠', isBuilding:true },
  { id:'env_house2',     label:'Env House 2',        url:G('Environment_House2'),        category:'buildings_residential', defaultScale:1.0, yOffset:0, emoji:'🏠', isBuilding:true },
  { id:'env_house3',     label:'Env House 3',        url:G('Environment_House3'),        category:'buildings_residential', defaultScale:1.0, yOffset:0, emoji:'🏠', isBuilding:true },
  { id:'tower_fa',       label:'Tower House',        url:G('TowerHouse_FirstAge'),       category:'buildings_residential', defaultScale:1.0, yOffset:0, emoji:'🏰', isBuilding:true },
  { id:'tower_sa',       label:'Modern Tower House', url:G('TowerHouse_SecondAge'),      category:'buildings_residential', defaultScale:1.0, yOffset:0, emoji:'🏰', isBuilding:true },

  // ── CIVIC BUILDINGS ──────────────────────────────────────────────────────
  { id:'temple_fa_l1',   label:'Temple Level 1',     url:G('Temple_FirstAge_Level1'),    category:'buildings_civic', defaultScale:1.0, yOffset:0, emoji:'⛩️', isBuilding:true },
  { id:'temple_fa_l2',   label:'Temple Level 2',     url:G('Temple_FirstAge_Level2'),    category:'buildings_civic', defaultScale:1.0, yOffset:0, emoji:'⛩️', isBuilding:true },
  { id:'temple_fa_l3',   label:'Temple Level 3',     url:G('Temple_FirstAge_Level3'),    category:'buildings_civic', defaultScale:1.0, yOffset:0, emoji:'⛩️', isBuilding:true },
  { id:'temple_sa_l1',   label:'Grand Temple L1',    url:G('Temple_SecondAge_Level1'),   category:'buildings_civic', defaultScale:1.0, yOffset:0, emoji:'🏛️', isBuilding:true },
  { id:'temple_sa_l2',   label:'Grand Temple L2',    url:G('Temple_SecondAge_Level2'),   category:'buildings_civic', defaultScale:1.0, yOffset:0, emoji:'🏛️', isBuilding:true },
  { id:'temple_sa_l3',   label:'Grand Temple L3',    url:G('Temple_SecondAge_Level3'),   category:'buildings_civic', defaultScale:1.0, yOffset:0, emoji:'🏛️', isBuilding:true },
  { id:'townctr_fa_l1',  label:'Town Center L1',     url:G('TownCenter_FirstAge_Level1'),category:'buildings_civic', defaultScale:1.0, yOffset:0, emoji:'🏙️', isBuilding:true },
  { id:'townctr_fa_l2',  label:'Town Center L2',     url:G('TownCenter_FirstAge_Level2'),category:'buildings_civic', defaultScale:1.0, yOffset:0, emoji:'🏙️', isBuilding:true },
  { id:'townctr_fa_l3',  label:'Town Center L3',     url:G('TownCenter_FirstAge_Level3'),category:'buildings_civic', defaultScale:1.0, yOffset:0, emoji:'🏙️', isBuilding:true },
  { id:'townctr_sa_l1',  label:'City Center L1',     url:G('TownCenter_SecondAge_Level1'),category:'buildings_civic', defaultScale:1.0, yOffset:0, emoji:'🌆', isBuilding:true },
  { id:'townctr_sa_l2',  label:'City Center L2',     url:G('TownCenter_SecondAge_Level2'),category:'buildings_civic', defaultScale:1.0, yOffset:0, emoji:'🌆', isBuilding:true },
  { id:'townctr_sa_l3',  label:'City Center L3',     url:G('TownCenter_SecondAge_Level3'),category:'buildings_civic', defaultScale:1.0, yOffset:0, emoji:'🌆', isBuilding:true },
  { id:'wonder_fa_l1',   label:'Wonder L1',          url:G('Wonder_FirstAge_Level1'),    category:'buildings_civic', defaultScale:1.2, yOffset:0, emoji:'🗿', isBuilding:true },
  { id:'wonder_fa_l2',   label:'Wonder L2',          url:G('Wonder_FirstAge_Level2'),    category:'buildings_civic', defaultScale:1.2, yOffset:0, emoji:'🗿', isBuilding:true },
  { id:'wonder_fa_l3',   label:'Wonder L3',          url:G('Wonder_FirstAge_Level3'),    category:'buildings_civic', defaultScale:1.2, yOffset:0, emoji:'🗿', isBuilding:true },
  { id:'wonder_sa_l1',   label:'Grand Wonder L1',    url:G('Wonder_SecondAge_Level1'),   category:'buildings_civic', defaultScale:1.2, yOffset:0, emoji:'🏟️', isBuilding:true },
  { id:'wonder_sa_l2',   label:'Grand Wonder L2',    url:G('Wonder_SecondAge_Level2'),   category:'buildings_civic', defaultScale:1.2, yOffset:0, emoji:'🏟️', isBuilding:true },
  { id:'wonder_sa_l3',   label:'Grand Wonder L3',    url:G('Wonder_SecondAge_Level3'),   category:'buildings_civic', defaultScale:1.2, yOffset:0, emoji:'🏟️', isBuilding:true },

  // ── ECONOMY BUILDINGS ────────────────────────────────────────────────────
  { id:'market_fa_l1',   label:'Market Level 1',     url:G('Market_FirstAge_Level1'),    category:'buildings_economy', defaultScale:1.0, yOffset:0, emoji:'🏪', isBuilding:true },
  { id:'market_fa_l2',   label:'Market Level 2',     url:G('Market_FirstAge_Level2'),    category:'buildings_economy', defaultScale:1.0, yOffset:0, emoji:'🏪', isBuilding:true },
  { id:'market_fa_l3',   label:'Market Level 3',     url:G('Market_FirstAge_Level3'),    category:'buildings_economy', defaultScale:1.0, yOffset:0, emoji:'🏪', isBuilding:true },
  { id:'market_sa_l1',   label:'Grand Market L1',    url:G('Market_SecondAge_Level1'),   category:'buildings_economy', defaultScale:1.0, yOffset:0, emoji:'🏬', isBuilding:true },
  { id:'market_sa_l2',   label:'Grand Market L2',    url:G('Market_SecondAge_Level2'),   category:'buildings_economy', defaultScale:1.0, yOffset:0, emoji:'🏬', isBuilding:true },
  { id:'market_sa_l3',   label:'Grand Market L3',    url:G('Market_SecondAge_Level3'),   category:'buildings_economy', defaultScale:1.0, yOffset:0, emoji:'🏬', isBuilding:true },
  { id:'storage_fa_l1',  label:'Storage L1',         url:G('Storage_FirstAge_Level1'),   category:'buildings_economy', defaultScale:1.0, yOffset:0, emoji:'🏗️', isBuilding:true },
  { id:'storage_fa_l2',  label:'Storage L2',         url:G('Storage_FirstAge_Level2'),   category:'buildings_economy', defaultScale:1.0, yOffset:0, emoji:'🏗️', isBuilding:true },
  { id:'storage_fa_l3',  label:'Storage L3',         url:G('Storage_FirstAge_Leve3'),    category:'buildings_economy', defaultScale:1.0, yOffset:0, emoji:'🏗️', isBuilding:true },
  { id:'storage_sa_l1',  label:'Warehouse L1',       url:G('Storage_SecondAge_Level1'),  category:'buildings_economy', defaultScale:1.0, yOffset:0, emoji:'🏭', isBuilding:true },
  { id:'storage_sa_l2',  label:'Warehouse L2',       url:G('Storage_SecondAge_Level2'),  category:'buildings_economy', defaultScale:1.0, yOffset:0, emoji:'🏭', isBuilding:true },
  { id:'storage_sa_l3',  label:'Warehouse L3',       url:G('Storage_SecondAge_Level3'),  category:'buildings_economy', defaultScale:1.0, yOffset:0, emoji:'🏭', isBuilding:true },
  { id:'farm_fa_l1',     label:'Farm L1',            url:G('Farm_FirstAge_Level1'),      category:'buildings_economy', defaultScale:1.0, yOffset:0, emoji:'🌾', isBuilding:true },
  { id:'farm_fa_l2',     label:'Farm L2',            url:G('Farm_FirstAge_Level2'),      category:'buildings_economy', defaultScale:1.0, yOffset:0, emoji:'🌾', isBuilding:true },
  { id:'farm_fa_l3',     label:'Farm L3',            url:G('Farm_FirstAge_Level3'),      category:'buildings_economy', defaultScale:1.0, yOffset:0, emoji:'🌾', isBuilding:true },
  { id:'farm_wheat_l1',  label:'Wheat Farm L1',      url:G('Farm_FirstAge_Level1_Wheat'),category:'buildings_economy', defaultScale:1.0, yOffset:0, emoji:'🌾', isBuilding:true },
  { id:'sawmill',        label:'Sawmill',            url:G('Environment_Sawmill'),       category:'buildings_economy', defaultScale:1.0, yOffset:0, emoji:'🪚', isBuilding:true },
  { id:'windmill_fa',    label:'Windmill',           url:G('Windmill_FirstAge'),         category:'buildings_economy', defaultScale:1.0, yOffset:0, emoji:'🌬️', isBuilding:true },
  { id:'windmill_sa',    label:'Grand Windmill',     url:G('Windmill_SecondAge'),        category:'buildings_economy', defaultScale:1.0, yOffset:0, emoji:'🌬️', isBuilding:true },
  { id:'mine',           label:'Mine',               url:G('Mine'),                      category:'buildings_economy', defaultScale:1.0, yOffset:0, emoji:'⛏️', isBuilding:true },
  { id:'port_fa_l1',     label:'Port L1',            url:G('Port_FirstAge_Level1'),      category:'buildings_economy', defaultScale:1.0, yOffset:0, emoji:'⚓', isBuilding:true },
  { id:'port_fa_l2',     label:'Port L2',            url:G('Port_FirstAge_Level2'),      category:'buildings_economy', defaultScale:1.0, yOffset:0, emoji:'⚓', isBuilding:true },
  { id:'port_fa_l3',     label:'Port L3',            url:G('Port_FirstAge_Level3'),      category:'buildings_economy', defaultScale:1.0, yOffset:0, emoji:'⚓', isBuilding:true },

  // ── MILITARY BUILDINGS ───────────────────────────────────────────────────
  { id:'barracks_fa_l1', label:'Barracks L1',        url:G('Barracks_FirstAge_Level1'),  category:'buildings_military', defaultScale:1.0, yOffset:0, emoji:'⚔️', isBuilding:true },
  { id:'barracks_fa_l2', label:'Barracks L2',        url:G('Barracks_FirstAge_Level2'),  category:'buildings_military', defaultScale:1.0, yOffset:0, emoji:'⚔️', isBuilding:true },
  { id:'barracks_fa_l3', label:'Barracks L3',        url:G('Barracks_FirstAge_Level3'),  category:'buildings_military', defaultScale:1.0, yOffset:0, emoji:'⚔️', isBuilding:true },
  { id:'archery_fa_l1',  label:'Archery L1',         url:G('Archery_FirstAge_Level1'),   category:'buildings_military', defaultScale:1.0, yOffset:0, emoji:'🏹', isBuilding:true },
  { id:'archery_fa_l2',  label:'Archery L2',         url:G('Archery_FirstAge_Level2'),   category:'buildings_military', defaultScale:1.0, yOffset:0, emoji:'🏹', isBuilding:true },
  { id:'archery_fa_l3',  label:'Archery L3',         url:G('Archery_FirstAge_Level3'),   category:'buildings_military', defaultScale:1.0, yOffset:0, emoji:'🏹', isBuilding:true },
  { id:'watchtwr_fa_l1', label:'Watch Tower L1',     url:G('WatchTower_FirstAge_Level1'),category:'buildings_military', defaultScale:1.0, yOffset:0, emoji:'🗼', isBuilding:true },
  { id:'watchtwr_fa_l2', label:'Watch Tower L2',     url:G('WatchTower_FirstAge_Level2'),category:'buildings_military', defaultScale:1.0, yOffset:0, emoji:'🗼', isBuilding:true },
  { id:'watchtwr_fa_l3', label:'Watch Tower L3',     url:G('WatchTower_FirstAge_Level3'),category:'buildings_military', defaultScale:1.0, yOffset:0, emoji:'🗼', isBuilding:true },
  { id:'wall_fa',        label:'Wall',               url:G('Wall_FirstAge'),             category:'buildings_military', defaultScale:1.0, yOffset:0, emoji:'🧱' },
  { id:'wall_tower_fa',  label:'Wall Tower',         url:G('WallTowers_FirstAge'),       category:'buildings_military', defaultScale:1.0, yOffset:0, emoji:'🏰' },
  { id:'wall_door_fa',   label:'Wall Door',          url:G('WallTowers_Door_FirstAge'),  category:'buildings_military', defaultScale:1.0, yOffset:0, emoji:'🚪' },

  // ── SPECIAL BUILDINGS ────────────────────────────────────────────────────
  { id:'wonderwall_fa',  label:'Wonder Wall',        url:G('WonderWalls_FirstAge'),      category:'buildings_special', defaultScale:1.2, yOffset:0, emoji:'✨', isBuilding:true },
  { id:'wonderwall_sa',  label:'Grand Wonder Wall',  url:G('WonderWalls_SecondAge'),     category:'buildings_special', defaultScale:1.2, yOffset:0, emoji:'✨', isBuilding:true },
  { id:'dock_fa',        label:'Dock',               url:G('Dock_FirstAge'),             category:'buildings_special', defaultScale:1.0, yOffset:0, emoji:'⚓', isBuilding:true },
  { id:'dock_env',       label:'Dock (Nature)',      url:G('Environment_Dock'),          category:'buildings_special', defaultScale:1.0, yOffset:0, emoji:'⚓' },
  { id:'dock_broken',    label:'Broken Dock',        url:G('Environment_Dock_Broken'),   category:'buildings_special', defaultScale:1.0, yOffset:0, emoji:'⚓' },
  { id:'dock_pole',      label:'Dock Pole',          url:G('Environment_Dock_Pole'),     category:'buildings_special', defaultScale:1.0, yOffset:0, emoji:'🪝' },

  // ── NATURE: TREES ────────────────────────────────────────────────────────
  { id:'birch1', label:'Birch Tree 1',  url:G('BirchTree_1'),         category:'nature_trees', defaultScale:1.0, yOffset:0, emoji:'🌳' },
  { id:'birch2', label:'Birch Tree 2',  url:G('BirchTree_2'),         category:'nature_trees', defaultScale:1.0, yOffset:0, emoji:'🌳' },
  { id:'birch3', label:'Birch Tree 3',  url:G('BirchTree_3'),         category:'nature_trees', defaultScale:1.0, yOffset:0, emoji:'🌳' },
  { id:'birch4', label:'Birch Tree 4',  url:G('BirchTree_4'),         category:'nature_trees', defaultScale:1.0, yOffset:0, emoji:'🌳' },
  { id:'birch5', label:'Birch Tree 5',  url:G('BirchTree_5'),         category:'nature_trees', defaultScale:1.0, yOffset:0, emoji:'🌳' },
  { id:'maple1', label:'Maple Tree 1',  url:G('MapleTree_1'),         category:'nature_trees', defaultScale:1.0, yOffset:0, emoji:'🍁' },
  { id:'maple2', label:'Maple Tree 2',  url:G('MapleTree_2'),         category:'nature_trees', defaultScale:1.0, yOffset:0, emoji:'🍁' },
  { id:'maple3', label:'Maple Tree 3',  url:G('MapleTree_3'),         category:'nature_trees', defaultScale:1.0, yOffset:0, emoji:'🍁' },
  { id:'maple4', label:'Maple Tree 4',  url:G('MapleTree_4'),         category:'nature_trees', defaultScale:1.0, yOffset:0, emoji:'🍁' },
  { id:'maple5', label:'Maple Tree 5',  url:G('MapleTree_5'),         category:'nature_trees', defaultScale:1.0, yOffset:0, emoji:'🍁' },
  { id:'pine',   label:'Pine Tree',     url:G('Resource_PineTree'),   category:'nature_trees', defaultScale:1.0, yOffset:0, emoji:'🌲' },
  { id:'pineG',  label:'Pine Group',    url:G('Resource_PineTree_Group'),category:'nature_trees', defaultScale:1.0, yOffset:0, emoji:'🌲' },
  { id:'pineGC', label:'Pine Group Cut',url:G('Resource_PineTree_Group_Cut'),category:'nature_trees', defaultScale:1.0, yOffset:0, emoji:'🌲' },
  { id:'res_t1', label:'Resource Tree 1',url:G('Resource_Tree1'),     category:'nature_trees', defaultScale:1.0, yOffset:0, emoji:'🌳' },
  { id:'res_t2', label:'Resource Tree 2',url:G('Resource_Tree2'),     category:'nature_trees', defaultScale:1.0, yOffset:0, emoji:'🌳' },
  { id:'res_tG', label:'Tree Group',    url:G('Resource_Tree_Group'), category:'nature_trees', defaultScale:1.0, yOffset:0, emoji:'🌳' },
  { id:'dead1',  label:'Dead Tree 1',   url:G('DeadTree_1'),          category:'nature_trees', defaultScale:1.0, yOffset:0, emoji:'🪵' },
  { id:'dead2',  label:'Dead Tree 2',   url:G('DeadTree_2'),          category:'nature_trees', defaultScale:1.0, yOffset:0, emoji:'🪵' },
  { id:'dead3',  label:'Dead Tree 3',   url:G('DeadTree_3'),          category:'nature_trees', defaultScale:1.0, yOffset:0, emoji:'🪵' },
  { id:'dead4',  label:'Dead Tree 4',   url:G('DeadTree_4'),          category:'nature_trees', defaultScale:1.0, yOffset:0, emoji:'🪵' },
  { id:'dead5',  label:'Dead Tree 5',   url:G('DeadTree_5'),          category:'nature_trees', defaultScale:1.0, yOffset:0, emoji:'🪵' },
  { id:'palm1',  label:'Palm Tree 1',   url:G('Environment_PalmTree_1'),category:'nature_trees', defaultScale:1.0, yOffset:0, emoji:'🌴' },
  { id:'palm2',  label:'Palm Tree 2',   url:G('Environment_PalmTree_2'),category:'nature_trees', defaultScale:1.0, yOffset:0, emoji:'🌴' },
  { id:'palm3',  label:'Palm Tree 3',   url:G('Environment_PalmTree_3'),category:'nature_trees', defaultScale:1.0, yOffset:0, emoji:'🌴' },

  // ── NATURE: PLANTS & GROUND ─────────────────────────────────────────────
  { id:'bush',         label:'Bush',           url:G('Bush'),          category:'nature_plants', defaultScale:1.0, yOffset:0, emoji:'🌿' },
  { id:'bushF',        label:'Bush w/ Flowers', url:G('Bush_Flowers'), category:'nature_plants', defaultScale:1.0, yOffset:0, emoji:'🌸' },
  { id:'bushL',        label:'Bush Large',      url:G('Bush_Large'),   category:'nature_plants', defaultScale:1.2, yOffset:0, emoji:'🌿' },
  { id:'bushLF',       label:'Large Bush w/ Flowers',url:G('Bush_Large_Flowers'),category:'nature_plants', defaultScale:1.2, yOffset:0, emoji:'🌸' },
  { id:'bushS',        label:'Bush Small',      url:G('Bush_Small'),   category:'nature_plants', defaultScale:0.8, yOffset:0, emoji:'🌿' },
  { id:'bushSF',       label:'Small Bush w/ Flowers',url:G('Bush_Small_Flowers'),category:'nature_plants', defaultScale:0.8, yOffset:0, emoji:'🌸' },
  { id:'fl1',          label:'Flower Clump 1',  url:G('Flower_1_Clump'),category:'nature_plants', defaultScale:1.0, yOffset:0, emoji:'🌼' },
  { id:'fl2',          label:'Flower Clump 2',  url:G('Flower_2_Clump'),category:'nature_plants', defaultScale:1.0, yOffset:0, emoji:'🌺' },
  { id:'fl3',          label:'Flower Clump 3',  url:G('Flower_3_Clump'),category:'nature_plants', defaultScale:1.0, yOffset:0, emoji:'🌸' },
  { id:'fl4',          label:'Flower Clump 4',  url:G('Flower_4_Clump'),category:'nature_plants', defaultScale:1.0, yOffset:0, emoji:'🌻' },
  { id:'fl5',          label:'Flower Clump 5',  url:G('Flower_5_Clump'),category:'nature_plants', defaultScale:1.0, yOffset:0, emoji:'🌹' },
  { id:'grass_lg',     label:'Grass Large',     url:G('Grass_Large'),  category:'nature_plants', defaultScale:1.0, yOffset:0, emoji:'🌾' },
  { id:'grass_lgx',    label:'Grass Extruded',  url:G('Grass_Large_Extruded'),category:'nature_plants', defaultScale:1.0, yOffset:0, emoji:'🌾' },
  { id:'grass_sm',     label:'Grass Small',     url:G('Grass_Small'),  category:'nature_plants', defaultScale:1.0, yOffset:0, emoji:'🌾' },
  { id:'logs',         label:'Logs',            url:G('Logs'),         category:'nature_plants', defaultScale:1.0, yOffset:0, emoji:'🪵' },

  // ── NATURE: TERRAIN ──────────────────────────────────────────────────────
  { id:'mtn',          label:'Mountain',        url:G('Mountain_Single'),       category:'nature_terrain', defaultScale:2.0, yOffset:0, emoji:'⛰️' },
  { id:'mtnLg',        label:'Mountain Large',  url:G('MountainLarge_Single'),  category:'nature_terrain', defaultScale:2.0, yOffset:0, emoji:'🏔️' },
  { id:'mtnG1',        label:'Mountain Group 1',url:G('Mountain_Group_1'),      category:'nature_terrain', defaultScale:2.0, yOffset:0, emoji:'🏔️' },
  { id:'mtnG2',        label:'Mountain Group 2',url:G('Mountain_Group_2'),      category:'nature_terrain', defaultScale:2.0, yOffset:0, emoji:'🏔️' },
  { id:'cliff1',       label:'Cliff 1',         url:G('Environment_Cliff1'),    category:'nature_terrain', defaultScale:1.5, yOffset:0, emoji:'🪨' },
  { id:'cliff2',       label:'Cliff 2',         url:G('Environment_Cliff2'),    category:'nature_terrain', defaultScale:1.5, yOffset:0, emoji:'🪨' },
  { id:'cliff3',       label:'Cliff 3',         url:G('Environment_Cliff3'),    category:'nature_terrain', defaultScale:1.5, yOffset:0, emoji:'🪨' },
  { id:'cliff4',       label:'Cliff 4',         url:G('Environment_Cliff4'),    category:'nature_terrain', defaultScale:1.5, yOffset:0, emoji:'🪨' },
  { id:'rock',         label:'Rock',            url:G('Rock'),                  category:'nature_terrain', defaultScale:1.0, yOffset:0, emoji:'🪨' },
  { id:'rockG',        label:'Rock Group',      url:G('Rock_Group'),            category:'nature_terrain', defaultScale:1.0, yOffset:0, emoji:'🪨' },
  { id:'env_r1',       label:'Env Rock 1',      url:G('Environment_Rock_1'),    category:'nature_terrain', defaultScale:1.0, yOffset:0, emoji:'🪨' },
  { id:'env_r2',       label:'Env Rock 2',      url:G('Environment_Rock_2'),    category:'nature_terrain', defaultScale:1.0, yOffset:0, emoji:'🪨' },
  { id:'env_r3',       label:'Env Rock 3',      url:G('Environment_Rock_3'),    category:'nature_terrain', defaultScale:1.0, yOffset:0, emoji:'🪨' },
  { id:'env_r4',       label:'Env Rock 4',      url:G('Environment_Rock_4'),    category:'nature_terrain', defaultScale:1.0, yOffset:0, emoji:'🪨' },
  { id:'env_r5',       label:'Env Rock 5',      url:G('Environment_Rock_5'),    category:'nature_terrain', defaultScale:1.0, yOffset:0, emoji:'🪨' },
  { id:'res_r1',       label:'Resource Rock 1', url:G('Resource_Rock_1'),       category:'nature_terrain', defaultScale:1.0, yOffset:0, emoji:'🪨' },
  { id:'res_r2',       label:'Resource Rock 2', url:G('Resource_Rock_2'),       category:'nature_terrain', defaultScale:1.0, yOffset:0, emoji:'🪨' },
  { id:'res_r3',       label:'Resource Rock 3', url:G('Resource_Rock_3'),       category:'nature_terrain', defaultScale:1.0, yOffset:0, emoji:'🪨' },
  { id:'res_gold1',    label:'Gold Ore 1',      url:G('Resource_Gold_1'),       category:'nature_terrain', defaultScale:1.0, yOffset:0, emoji:'⚡' },
  { id:'res_gold2',    label:'Gold Ore 2',      url:G('Resource_Gold_2'),       category:'nature_terrain', defaultScale:1.0, yOffset:0, emoji:'⚡' },
  { id:'res_gold3',    label:'Gold Ore 3',      url:G('Resource_Gold_3'),       category:'nature_terrain', defaultScale:1.0, yOffset:0, emoji:'⚡' },
  { id:'lg_bones',     label:'Large Bones',     url:G('Environment_LargeBones'),category:'nature_terrain', defaultScale:1.0, yOffset:0, emoji:'💀' },
  { id:'skulls',       label:'Skulls',          url:G('Environment_Skulls'),    category:'nature_terrain', defaultScale:1.0, yOffset:0, emoji:'💀' },

  // ── ANIMALS ──────────────────────────────────────────────────────────────
  { id:'deer',   label:'Deer',      url:G('Deer'),    category:'animals', defaultScale:1.0, yOffset:0, emoji:'🦌' },
  { id:'wolf',   label:'Wolf',      url:G('Wolf'),    category:'animals', defaultScale:1.0, yOffset:0, emoji:'🐺' },
  { id:'fox',    label:'Fox',       url:G('Fox'),     category:'animals', defaultScale:0.9, yOffset:0, emoji:'🦊' },
  { id:'stag',   label:'Stag',      url:G('Stag'),    category:'animals', defaultScale:1.0, yOffset:0, emoji:'🦌' },
  { id:'bull',   label:'Bull',      url:G('Bull'),    category:'animals', defaultScale:1.0, yOffset:0, emoji:'🐂' },
  { id:'cow',    label:'Cow',       url:G('Cow'),     category:'animals', defaultScale:1.0, yOffset:0, emoji:'🐄' },
  { id:'donkey', label:'Donkey',    url:G('Donkey'),  category:'animals', defaultScale:1.0, yOffset:0, emoji:'🫏' },
  { id:'alpaca', label:'Alpaca',    url:G('Alpaca'),  category:'animals', defaultScale:1.0, yOffset:0, emoji:'🦙' },
  { id:'horse',  label:'Horse',     url:G('Horse'),   category:'animals', defaultScale:1.0, yOffset:0, emoji:'🐴' },
  { id:'horseW', label:'White Horse',url:G('Horse_White'),category:'animals', defaultScale:1.0, yOffset:0, emoji:'🐴' },
  { id:'husky',  label:'Husky',     url:G('Husky'),   category:'animals', defaultScale:0.8, yOffset:0, emoji:'🐕' },
  { id:'pug',    label:'Pug',       url:G('Pug'),     category:'animals', defaultScale:0.7, yOffset:0, emoji:'🐶' },
  { id:'shiba',  label:'Shiba Inu', url:G('ShibaInu'),category:'animals', defaultScale:0.8, yOffset:0, emoji:'🐕' },

  // ── CHARACTERS ───────────────────────────────────────────────────────────
  { id:'casual_m',    label:'Casual Male',       url:G('Casual_Male'),         category:'characters', defaultScale:1.0, yOffset:0, emoji:'👤' },
  { id:'casual_f',    label:'Casual Female',     url:G('Casual_Female'),       category:'characters', defaultScale:1.0, yOffset:0, emoji:'👤' },
  { id:'casual2_m',   label:'Casual 2 Male',     url:G('Casual2_Male'),        category:'characters', defaultScale:1.0, yOffset:0, emoji:'👤' },
  { id:'casual2_f',   label:'Casual 2 Female',   url:G('Casual2_Female'),      category:'characters', defaultScale:1.0, yOffset:0, emoji:'👤' },
  { id:'casual3_m',   label:'Casual 3 Male',     url:G('Casual3_Male'),        category:'characters', defaultScale:1.0, yOffset:0, emoji:'👤' },
  { id:'casual3_f',   label:'Casual 3 Female',   url:G('Casual3_Female'),      category:'characters', defaultScale:1.0, yOffset:0, emoji:'👤' },
  { id:'worker_m',    label:'Worker Male',        url:G('Worker_Male'),         category:'characters', defaultScale:1.0, yOffset:0, emoji:'👷' },
  { id:'worker_f',    label:'Worker Female',      url:G('Worker_Female'),       category:'characters', defaultScale:1.0, yOffset:0, emoji:'👷' },
  { id:'kimono_m',    label:'Kimono Male',        url:G('Kimono_Male'),         category:'characters', defaultScale:1.0, yOffset:0, emoji:'👘' },
  { id:'kimono_f',    label:'Kimono Female',      url:G('Kimono_Female'),       category:'characters', defaultScale:1.0, yOffset:0, emoji:'👘' },
  { id:'doctor_my',   label:'Doctor Male',        url:G('Doctor_Male_Young'),   category:'characters', defaultScale:1.0, yOffset:0, emoji:'🩺' },
  { id:'doctor_fy',   label:'Doctor Female',      url:G('Doctor_Female_Young'), category:'characters', defaultScale:1.0, yOffset:0, emoji:'🩺' },
  { id:'doctor_mo',   label:'Senior Doctor M',    url:G('Doctor_Male_Old'),     category:'characters', defaultScale:1.0, yOffset:0, emoji:'🩺' },
  { id:'doctor_fo',   label:'Senior Doctor F',    url:G('Doctor_Female_Old'),   category:'characters', defaultScale:1.0, yOffset:0, emoji:'🩺' },
  { id:'suit_m',      label:'Suit Male',          url:G('Suit_Male'),           category:'characters', defaultScale:1.0, yOffset:0, emoji:'👔' },
  { id:'suit_f',      label:'Suit Female',        url:G('Suit_Female'),         category:'characters', defaultScale:1.0, yOffset:0, emoji:'👔' },
  { id:'oldclassy_m', label:'Old Classy Male',    url:G('OldClassy_Male'),      category:'characters', defaultScale:1.0, yOffset:0, emoji:'🎩' },
  { id:'oldclassy_f', label:'Old Classy Female',  url:G('OldClassy_Female'),    category:'characters', defaultScale:1.0, yOffset:0, emoji:'🎩' },
  { id:'chef_m',      label:'Chef Male',          url:G('Chef_Male'),           category:'characters', defaultScale:1.0, yOffset:0, emoji:'👨‍🍳' },
  { id:'chef_f',      label:'Chef Female',        url:G('Chef_Female'),         category:'characters', defaultScale:1.0, yOffset:0, emoji:'👩‍🍳' },
  { id:'monk',        label:'Monk',               url:G('Monk'),                category:'characters', defaultScale:1.0, yOffset:0, emoji:'🧘' },
  { id:'cleric',      label:'Cleric',             url:G('Cleric'),              category:'characters', defaultScale:1.0, yOffset:0, emoji:'⛪' },
  { id:'ranger',      label:'Ranger',             url:G('Ranger'),              category:'characters', defaultScale:1.0, yOffset:0, emoji:'🏹' },
  { id:'warrior',     label:'Warrior',            url:G('Warrior'),             category:'characters', defaultScale:1.0, yOffset:0, emoji:'⚔️' },
  { id:'elf',         label:'Elf',                url:G('Elf'),                 category:'characters', defaultScale:1.0, yOffset:0, emoji:'🧝' },
  { id:'wizard',      label:'Wizard',             url:G('Wizard'),              category:'characters', defaultScale:1.0, yOffset:0, emoji:'🧙' },
  { id:'witch',       label:'Witch',              url:G('Witch'),               category:'characters', defaultScale:1.0, yOffset:0, emoji:'🧙‍♀️' },
  { id:'ninja_m',     label:'Ninja Male',         url:G('Ninja_Male'),          category:'characters', defaultScale:1.0, yOffset:0, emoji:'🥷' },
  { id:'ninja_f',     label:'Ninja Female',       url:G('Ninja_Female'),        category:'characters', defaultScale:1.0, yOffset:0, emoji:'🥷' },
  { id:'cowboy_m',    label:'Cowboy Male',        url:G('Cowboy_Male'),         category:'characters', defaultScale:1.0, yOffset:0, emoji:'🤠' },
  { id:'cowboy_f',    label:'Cowboy Female',      url:G('Cowboy_Female'),       category:'characters', defaultScale:1.0, yOffset:0, emoji:'🤠' },
  { id:'pirate_m',    label:'Pirate Male',        url:G('Pirate_Male'),         category:'characters', defaultScale:1.0, yOffset:0, emoji:'🏴‍☠️' },
  { id:'pirate_f',    label:'Pirate Female',      url:G('Pirate_Female'),       category:'characters', defaultScale:1.0, yOffset:0, emoji:'🏴‍☠️' },
  { id:'viking_m',    label:'Viking Male',        url:G('Viking_Male'),         category:'characters', defaultScale:1.0, yOffset:0, emoji:'🪖' },
  { id:'viking_f',    label:'Viking Female',      url:G('Viking_Female'),       category:'characters', defaultScale:1.0, yOffset:0, emoji:'🪖' },
  { id:'goblin_m',    label:'Goblin Male',        url:G('Goblin_Male'),         category:'characters', defaultScale:0.9, yOffset:0, emoji:'👺' },
  { id:'goblin_f',    label:'Goblin Female',      url:G('Goblin_Female'),       category:'characters', defaultScale:0.9, yOffset:0, emoji:'👺' },
  { id:'zombie_m',    label:'Zombie Male',        url:G('Zombie_Male'),         category:'characters', defaultScale:1.0, yOffset:0, emoji:'🧟' },
  { id:'zombie_f',    label:'Zombie Female',      url:G('Zombie_Female'),       category:'characters', defaultScale:1.0, yOffset:0, emoji:'🧟‍♀️' },
  { id:'shark_char',  label:'Shark Character',    url:G('Characters_Shark'),    category:'characters', defaultScale:1.0, yOffset:0, emoji:'🦈' },

  // ── PROPS: CONTAINERS ────────────────────────────────────────────────────
  { id:'barrel',   label:'Barrel',       url:G('Barrel'),           category:'props_containers', defaultScale:1.0, yOffset:0, emoji:'🛢️' },
  { id:'p_barrel', label:'Prop Barrel',  url:G('Prop_Barrel'),      category:'props_containers', defaultScale:1.0, yOffset:0, emoji:'🛢️' },
  { id:'crate',    label:'Crate',        url:G('Crate'),            category:'props_containers', defaultScale:1.0, yOffset:0, emoji:'📦' },
  { id:'crate2',   label:'Crate Stack',  url:G('Crate_Big_Stack2'), category:'props_containers', defaultScale:1.0, yOffset:0, emoji:'📦' },
  { id:'crate_s1', label:'Crate Stack 1',url:G('Crate_Stack1'),     category:'props_containers', defaultScale:1.0, yOffset:0, emoji:'📦' },
  { id:'crate_s2', label:'Crate Stack 2',url:G('Crate_Stack2'),     category:'props_containers', defaultScale:1.0, yOffset:0, emoji:'📦' },
  { id:'chest_c',  label:'Chest Closed', url:G('Prop_Chest_Closed'),category:'props_containers', defaultScale:0.9, yOffset:0, emoji:'📫' },
  { id:'chest_g',  label:'Gold Chest',   url:G('Prop_Chest_Gold'),  category:'props_containers', defaultScale:0.9, yOffset:0, emoji:'💰' },
  { id:'bucket',   label:'Bucket',       url:G('Prop_Bucket'),      category:'props_containers', defaultScale:0.8, yOffset:0, emoji:'🪣' },
  { id:'fishBkt',  label:'Fish Bucket',  url:G('Prop_Bucket_Fishes'),category:'props_containers', defaultScale:0.9, yOffset:0, emoji:'🪣' },
  { id:'goldbag',  label:'Gold Bag',     url:G('Prop_GoldBag'),     category:'props_containers', defaultScale:0.8, yOffset:0, emoji:'💰' },
  { id:'coins',    label:'Coins',        url:G('Prop_Coins'),       category:'props_containers', defaultScale:0.8, yOffset:0, emoji:'🪙' },

  // ── PROPS: WEAPONS & ITEMS ───────────────────────────────────────────────
  { id:'cannon',   label:'Cannon',       url:G('Prop_Cannon'),      category:'props_weapons', defaultScale:1.0, yOffset:0, emoji:'💣' },
  { id:'bomb',     label:'Bomb',         url:G('Prop_Bomb'),        category:'props_weapons', defaultScale:0.8, yOffset:0, emoji:'💣' },
  { id:'anchor',   label:'Anchor',       url:G('Prop_Anchor'),      category:'props_weapons', defaultScale:1.0, yOffset:0, emoji:'⚓' },
  { id:'sword1',   label:'Sword 1',      url:G('Weapon_Sword_1'),   category:'props_weapons', defaultScale:0.8, yOffset:0, emoji:'⚔️' },
  { id:'sword2',   label:'Sword 2',      url:G('Weapon_Sword_2'),   category:'props_weapons', defaultScale:0.8, yOffset:0, emoji:'⚔️' },
  { id:'axe',      label:'Axe',          url:G('Weapon_Axe'),       category:'props_weapons', defaultScale:0.8, yOffset:0, emoji:'🪓' },
  { id:'dagger',   label:'Dagger',       url:G('Weapon_Dagger'),    category:'props_weapons', defaultScale:0.7, yOffset:0, emoji:'🗡️' },
  { id:'lute',     label:'Lute',         url:G('Weapon_Lute'),      category:'props_weapons', defaultScale:0.8, yOffset:0, emoji:'🪕' },

  // ── PROPS: ITEMS ─────────────────────────────────────────────────────────
  { id:'fish1',    label:'Fish Mackerel',url:G('Prop_Fish_Mackerel'),category:'props_items', defaultScale:0.8, yOffset:0, emoji:'🐟' },
  { id:'fish2',    label:'Fish Tuna',    url:G('Prop_Fish_Tuna'),   category:'props_items', defaultScale:0.8, yOffset:0, emoji:'🐟' },
  { id:'bottle1',  label:'Bottle 1',     url:G('Prop_Bottle_1'),    category:'props_items', defaultScale:0.8, yOffset:0, emoji:'🍾' },
  { id:'bottle2',  label:'Bottle 2',     url:G('Prop_Bottle_2'),    category:'props_items', defaultScale:0.8, yOffset:0, emoji:'🍾' },
  { id:'skull',    label:'Skull',        url:G('Prop_Skull'),       category:'props_items', defaultScale:0.8, yOffset:0, emoji:'💀' },

  // ── INFRASTRUCTURE ────────────────────────────────────────────────────────
  { id:'ship_lg',  label:'Large Ship',   url:G('Ship_Large'),   category:'infrastructure', defaultScale:1.0, yOffset:-1, emoji:'🚢' },
  { id:'ship_sm',  label:'Small Ship',   url:G('Ship_Small'),   category:'infrastructure', defaultScale:1.0, yOffset:-1, emoji:'⛵' },

  // ── KAYKIT FOREST: TREES ─────────────────────────────────────────────────
  { id:'kk_tree1a', label:'Forest Tree 1A', url:G('Tree_1_A_Color1'), category:'nature_trees', defaultScale:1.5, yOffset:0, emoji:'🌲', tags:['kaykit','forest','tree'] },
  { id:'kk_tree1b', label:'Forest Tree 1B', url:G('Tree_1_B_Color1'), category:'nature_trees', defaultScale:1.5, yOffset:0, emoji:'🌲', tags:['kaykit','forest','tree'] },
  { id:'kk_tree1c', label:'Forest Tree 1C', url:G('Tree_1_C_Color1'), category:'nature_trees', defaultScale:1.5, yOffset:0, emoji:'🌲', tags:['kaykit','forest','tree'] },
  { id:'kk_tree2a', label:'Forest Tree 2A', url:G('Tree_2_A_Color1'), category:'nature_trees', defaultScale:1.5, yOffset:0, emoji:'🌳', tags:['kaykit','forest','tree'] },
  { id:'kk_tree2b', label:'Forest Tree 2B', url:G('Tree_2_B_Color1'), category:'nature_trees', defaultScale:1.5, yOffset:0, emoji:'🌳', tags:['kaykit','forest','tree'] },
  { id:'kk_tree2c', label:'Forest Tree 2C', url:G('Tree_2_C_Color1'), category:'nature_trees', defaultScale:1.5, yOffset:0, emoji:'🌳', tags:['kaykit','forest','tree'] },
  { id:'kk_tree2d', label:'Forest Tree 2D', url:G('Tree_2_D_Color1'), category:'nature_trees', defaultScale:1.5, yOffset:0, emoji:'🌳', tags:['kaykit','forest','tree'] },
  { id:'kk_tree2e', label:'Forest Tree 2E', url:G('Tree_2_E_Color1'), category:'nature_trees', defaultScale:1.5, yOffset:0, emoji:'🌳', tags:['kaykit','forest','tree'] },
  { id:'kk_tree3a', label:'Forest Tree 3A', url:G('Tree_3_A_Color1'), category:'nature_trees', defaultScale:1.5, yOffset:0, emoji:'🌲', tags:['kaykit','forest','tree'] },
  { id:'kk_tree3b', label:'Forest Tree 3B', url:G('Tree_3_B_Color1'), category:'nature_trees', defaultScale:1.5, yOffset:0, emoji:'🌲', tags:['kaykit','forest','tree'] },
  { id:'kk_tree3c', label:'Forest Tree 3C', url:G('Tree_3_C_Color1'), category:'nature_trees', defaultScale:1.5, yOffset:0, emoji:'🌲', tags:['kaykit','forest','tree'] },
  { id:'kk_tree4a', label:'Forest Tree 4A', url:G('Tree_4_A_Color1'), category:'nature_trees', defaultScale:2.0, yOffset:0, emoji:'🌳', tags:['kaykit','forest','tree'] },
  { id:'kk_tree4b', label:'Forest Tree 4B', url:G('Tree_4_B_Color1'), category:'nature_trees', defaultScale:2.0, yOffset:0, emoji:'🌳', tags:['kaykit','forest','tree'] },
  { id:'kk_tree4c', label:'Forest Tree 4C', url:G('Tree_4_C_Color1'), category:'nature_trees', defaultScale:2.0, yOffset:0, emoji:'🌳', tags:['kaykit','forest','tree'] },
  { id:'kk_bare1a', label:'Bare Tree 1A',   url:G('Tree_Bare_1_A_Color1'), category:'nature_trees', defaultScale:1.5, yOffset:0, emoji:'🪵', tags:['kaykit','bare','winter','tree'] },
  { id:'kk_bare1b', label:'Bare Tree 1B',   url:G('Tree_Bare_1_B_Color1'), category:'nature_trees', defaultScale:1.5, yOffset:0, emoji:'🪵', tags:['kaykit','bare','winter','tree'] },
  { id:'kk_bare1c', label:'Bare Tree 1C',   url:G('Tree_Bare_1_C_Color1'), category:'nature_trees', defaultScale:1.5, yOffset:0, emoji:'🪵', tags:['kaykit','bare','winter','tree'] },
  { id:'kk_bare2a', label:'Bare Tree 2A',   url:G('Tree_Bare_2_A_Color1'), category:'nature_trees', defaultScale:1.5, yOffset:0, emoji:'🪵', tags:['kaykit','bare','winter','tree'] },
  { id:'kk_bare2b', label:'Bare Tree 2B',   url:G('Tree_Bare_2_B_Color1'), category:'nature_trees', defaultScale:1.5, yOffset:0, emoji:'🪵', tags:['kaykit','bare','winter','tree'] },
  { id:'kk_bare2c', label:'Bare Tree 2C',   url:G('Tree_Bare_2_C_Color1'), category:'nature_trees', defaultScale:1.5, yOffset:0, emoji:'🪵', tags:['kaykit','bare','winter','tree'] },

  // ── KAYKIT FOREST: BUSHES ────────────────────────────────────────────────
  { id:'kk_bush1a', label:'Bush 1A',   url:G('Bush_1_A_Color1'), category:'nature_bushes', defaultScale:1.2, yOffset:0, emoji:'🌿', tags:['kaykit','bush','shrub'] },
  { id:'kk_bush1b', label:'Bush 1B',   url:G('Bush_1_B_Color1'), category:'nature_bushes', defaultScale:1.2, yOffset:0, emoji:'🌿', tags:['kaykit','bush','shrub'] },
  { id:'kk_bush1c', label:'Bush 1C',   url:G('Bush_1_C_Color1'), category:'nature_bushes', defaultScale:1.2, yOffset:0, emoji:'🌿', tags:['kaykit','bush','shrub'] },
  { id:'kk_bush1d', label:'Bush 1D',   url:G('Bush_1_D_Color1'), category:'nature_bushes', defaultScale:1.2, yOffset:0, emoji:'🌿', tags:['kaykit','bush','shrub'] },
  { id:'kk_bush1e', label:'Bush 1E',   url:G('Bush_1_E_Color1'), category:'nature_bushes', defaultScale:1.2, yOffset:0, emoji:'🌿', tags:['kaykit','bush'] },
  { id:'kk_bush1f', label:'Bush 1F',   url:G('Bush_1_F_Color1'), category:'nature_bushes', defaultScale:1.2, yOffset:0, emoji:'🌿', tags:['kaykit','bush'] },
  { id:'kk_bush1g', label:'Bush 1G',   url:G('Bush_1_G_Color1'), category:'nature_bushes', defaultScale:1.2, yOffset:0, emoji:'🌿', tags:['kaykit','bush'] },
  { id:'kk_bush2a', label:'Bush 2A',   url:G('Bush_2_A_Color1'), category:'nature_bushes', defaultScale:1.2, yOffset:0, emoji:'🌿', tags:['kaykit','bush'] },
  { id:'kk_bush2b', label:'Bush 2B',   url:G('Bush_2_B_Color1'), category:'nature_bushes', defaultScale:1.2, yOffset:0, emoji:'🌿', tags:['kaykit','bush'] },
  { id:'kk_bush2c', label:'Bush 2C',   url:G('Bush_2_C_Color1'), category:'nature_bushes', defaultScale:1.2, yOffset:0, emoji:'🌿', tags:['kaykit','bush'] },
  { id:'kk_bush2d', label:'Bush 2D',   url:G('Bush_2_D_Color1'), category:'nature_bushes', defaultScale:1.2, yOffset:0, emoji:'🌿', tags:['kaykit','bush'] },
  { id:'kk_bush2e', label:'Bush 2E',   url:G('Bush_2_E_Color1'), category:'nature_bushes', defaultScale:1.2, yOffset:0, emoji:'🌿', tags:['kaykit','bush'] },
  { id:'kk_bush2f', label:'Bush 2F',   url:G('Bush_2_F_Color1'), category:'nature_bushes', defaultScale:1.2, yOffset:0, emoji:'🌿', tags:['kaykit','bush'] },
  { id:'kk_bush3a', label:'Bush 3A',   url:G('Bush_3_A_Color1'), category:'nature_bushes', defaultScale:1.3, yOffset:0, emoji:'🌿', tags:['kaykit','bush','large'] },
  { id:'kk_bush3b', label:'Bush 3B',   url:G('Bush_3_B_Color1'), category:'nature_bushes', defaultScale:1.3, yOffset:0, emoji:'🌿', tags:['kaykit','bush','large'] },
  { id:'kk_bush3c', label:'Bush 3C',   url:G('Bush_3_C_Color1'), category:'nature_bushes', defaultScale:1.3, yOffset:0, emoji:'🌿', tags:['kaykit','bush','large'] },
  { id:'kk_bush4a', label:'Bush 4A',   url:G('Bush_4_A_Color1'), category:'nature_bushes', defaultScale:1.3, yOffset:0, emoji:'🌿', tags:['kaykit','bush','large'] },
  { id:'kk_bush4b', label:'Bush 4B',   url:G('Bush_4_B_Color1'), category:'nature_bushes', defaultScale:1.3, yOffset:0, emoji:'🌿', tags:['kaykit','bush','large'] },
  { id:'kk_bush4c', label:'Bush 4C',   url:G('Bush_4_C_Color1'), category:'nature_bushes', defaultScale:1.3, yOffset:0, emoji:'🌿', tags:['kaykit','bush','large'] },
  { id:'kk_bush4d', label:'Bush 4D',   url:G('Bush_4_D_Color1'), category:'nature_bushes', defaultScale:1.3, yOffset:0, emoji:'🌿', tags:['kaykit','bush','large'] },
  { id:'kk_bush4e', label:'Bush 4E',   url:G('Bush_4_E_Color1'), category:'nature_bushes', defaultScale:1.3, yOffset:0, emoji:'🌿', tags:['kaykit','bush','large'] },
  { id:'kk_bush4f', label:'Bush 4F',   url:G('Bush_4_F_Color1'), category:'nature_bushes', defaultScale:1.3, yOffset:0, emoji:'🌿', tags:['kaykit','bush','large'] },

  // ── KAYKIT FOREST: GRASS ─────────────────────────────────────────────────
  { id:'kk_grass1a', label:'Grass 1A', url:G('Grass_1_A_Color1'), category:'nature_grass', defaultScale:1.0, yOffset:0, emoji:'🌾', tags:['kaykit','grass','ground'] },
  { id:'kk_grass1b', label:'Grass 1B', url:G('Grass_1_B_Color1'), category:'nature_grass', defaultScale:1.0, yOffset:0, emoji:'🌾', tags:['kaykit','grass'] },
  { id:'kk_grass1c', label:'Grass 1C', url:G('Grass_1_C_Color1'), category:'nature_grass', defaultScale:1.0, yOffset:0, emoji:'🌾', tags:['kaykit','grass'] },
  { id:'kk_grass1d', label:'Grass 1D', url:G('Grass_1_D_Color1'), category:'nature_grass', defaultScale:1.0, yOffset:0, emoji:'🌾', tags:['kaykit','grass'] },
  { id:'kk_grass2a', label:'Grass 2A', url:G('Grass_2_A_Color1'), category:'nature_grass', defaultScale:1.0, yOffset:0, emoji:'🌾', tags:['kaykit','grass'] },
  { id:'kk_grass2b', label:'Grass 2B', url:G('Grass_2_B_Color1'), category:'nature_grass', defaultScale:1.0, yOffset:0, emoji:'🌾', tags:['kaykit','grass'] },
  { id:'kk_grass2c', label:'Grass 2C', url:G('Grass_2_C_Color1'), category:'nature_grass', defaultScale:1.0, yOffset:0, emoji:'🌾', tags:['kaykit','grass'] },
  { id:'kk_grass2d', label:'Grass 2D', url:G('Grass_2_D_Color1'), category:'nature_grass', defaultScale:1.0, yOffset:0, emoji:'🌾', tags:['kaykit','grass'] },

  // ── KAYKIT FOREST: ROCKS ─────────────────────────────────────────────────
  { id:'kk_rock1a', label:'Rock 1A', url:G('Rock_1_A_Color1'), category:'nature_rocks', defaultScale:1.0, yOffset:0, emoji:'🪨', tags:['kaykit','rock','stone'] },
  { id:'kk_rock1b', label:'Rock 1B', url:G('Rock_1_B_Color1'), category:'nature_rocks', defaultScale:1.0, yOffset:0, emoji:'🪨', tags:['kaykit','rock','stone'] },
  { id:'kk_rock1c', label:'Rock 1C', url:G('Rock_1_C_Color1'), category:'nature_rocks', defaultScale:1.0, yOffset:0, emoji:'🪨', tags:['kaykit','rock','stone'] },
  { id:'kk_rock1d', label:'Rock 1D', url:G('Rock_1_D_Color1'), category:'nature_rocks', defaultScale:1.0, yOffset:0, emoji:'🪨', tags:['kaykit','rock','stone'] },
  { id:'kk_rock1e', label:'Rock 1E', url:G('Rock_1_E_Color1'), category:'nature_rocks', defaultScale:1.0, yOffset:0, emoji:'🪨', tags:['kaykit','rock','stone'] },
  { id:'kk_rock1f', label:'Rock 1F', url:G('Rock_1_F_Color1'), category:'nature_rocks', defaultScale:1.0, yOffset:0, emoji:'🪨', tags:['kaykit','rock','stone'] },
  { id:'kk_rock1g', label:'Rock 1G', url:G('Rock_1_G_Color1'), category:'nature_rocks', defaultScale:1.0, yOffset:0, emoji:'🪨', tags:['kaykit','rock','stone'] },
  { id:'kk_rock2a', label:'Rock 2A', url:G('Rock_2_A_Color1'), category:'nature_rocks', defaultScale:1.2, yOffset:0, emoji:'🪨', tags:['kaykit','rock','boulder'] },
  { id:'kk_rock2b', label:'Rock 2B', url:G('Rock_2_B_Color1'), category:'nature_rocks', defaultScale:1.2, yOffset:0, emoji:'🪨', tags:['kaykit','rock','boulder'] },
  { id:'kk_rock2c', label:'Rock 2C', url:G('Rock_2_C_Color1'), category:'nature_rocks', defaultScale:1.2, yOffset:0, emoji:'🪨', tags:['kaykit','rock','boulder'] },
  { id:'kk_rock2d', label:'Rock 2D', url:G('Rock_2_D_Color1'), category:'nature_rocks', defaultScale:1.2, yOffset:0, emoji:'🪨', tags:['kaykit','rock','boulder'] },
  { id:'kk_rock2e', label:'Rock 2E', url:G('Rock_2_E_Color1'), category:'nature_rocks', defaultScale:1.2, yOffset:0, emoji:'🪨', tags:['kaykit','rock','boulder'] },
  { id:'kk_rock3a', label:'Rock 3A', url:G('Rock_3_A_Color1'), category:'nature_rocks', defaultScale:1.5, yOffset:0, emoji:'🪨', tags:['kaykit','rock','large'] },
  { id:'kk_rock3b', label:'Rock 3B', url:G('Rock_3_B_Color1'), category:'nature_rocks', defaultScale:1.5, yOffset:0, emoji:'🪨', tags:['kaykit','rock','large'] },
  { id:'kk_rock3c', label:'Rock 3C', url:G('Rock_3_C_Color1'), category:'nature_rocks', defaultScale:1.5, yOffset:0, emoji:'🪨', tags:['kaykit','rock','large'] },

  // ── GROUND TILES ─────────────────────────────────────────────────────────
  // Procedural flat plane tiles the user can place to define terrain patches
  // These are rendered as colored flat meshes, not GLTF models
  // We use a special marker URL so LiveAdminObjects renders them as planes
  { id:'tile_grass',  label:'Grass Tile',   url:'/models/tiles/grass.tile',   category:'ground_tiles', defaultScale:4, yOffset:-0.02, emoji:'🟩', tags:['ground','tile','grass'] },
  { id:'tile_dirt',   label:'Dirt Tile',    url:'/models/tiles/dirt.tile',    category:'ground_tiles', defaultScale:4, yOffset:-0.02, emoji:'🟫', tags:['ground','tile','dirt'] },
  { id:'tile_sand',   label:'Sand Tile',    url:'/models/tiles/sand.tile',    category:'ground_tiles', defaultScale:4, yOffset:-0.02, emoji:'🟨', tags:['ground','tile','sand','beach'] },
  { id:'tile_stone',  label:'Stone Path',   url:'/models/tiles/stone.tile',   category:'ground_tiles', defaultScale:4, yOffset:-0.02, emoji:'⬜', tags:['ground','tile','stone','path'] },
  { id:'tile_water',  label:'Water Tile',   url:'/models/tiles/water.tile',   category:'ground_tiles', defaultScale:4, yOffset:-0.05, emoji:'🟦', tags:['ground','tile','water','river','lake'] },
  { id:'tile_mud',    label:'Mud/Swamp',    url:'/models/tiles/mud.tile',     category:'ground_tiles', defaultScale:4, yOffset:-0.02, emoji:'🟤', tags:['ground','tile','mud','swamp'] },
  { id:'tile_snow',   label:'Snow',         url:'/models/tiles/snow.tile',    category:'ground_tiles', defaultScale:4, yOffset:-0.01, emoji:'⬜', tags:['ground','tile','snow','winter'] },
];

// Category metadata for the UI
export const CATEGORY_META: Record<ModelCategory, { label: string; emoji: string; description: string }> = {
  buildings_residential: { label: 'Houses',      emoji: '🏠', description: 'Homes and residences' },
  buildings_civic:       { label: 'Civic',        emoji: '🏛️', description: 'Temples, town centers, wonders' },
  buildings_economy:     { label: 'Economy',      emoji: '🏪', description: 'Markets, farms, mills, ports' },
  buildings_military:    { label: 'Military',     emoji: '⚔️', description: 'Towers, walls, barracks' },
  buildings_special:     { label: 'Special',      emoji: '✨', description: 'Docks, wonders, special structures' },
  nature_trees:          { label: 'Trees',        emoji: '🌳', description: 'Birch, maple, pine, palm, bare (KayKit + Quaternius)' },
  nature_bushes:         { label: 'Bushes',       emoji: '🌿', description: 'Bushes — KayKit Forest Pack' },
  nature_plants:         { label: 'Plants',       emoji: '🌸', description: 'Flowers, logs, foliage' },
  nature_grass:          { label: 'Grass',        emoji: '🌾', description: 'Grass clumps and patches — KayKit' },
  nature_rocks:          { label: 'Rocks',        emoji: '🪨', description: 'Rocks and boulders — KayKit Forest' },
  nature_terrain:        { label: 'Terrain',      emoji: '⛰️', description: 'Mountains, cliffs, ore deposits' },
  nature_water:          { label: 'Water',        emoji: '🌊', description: 'Rivers, ponds, water features' },
  ground_tiles:          { label: 'Ground',       emoji: '🟫', description: 'Grass, dirt, sand, stone ground tiles' },
  animals:               { label: 'Animals',      emoji: '🦌', description: 'Wildlife — roam automatically when placed' },
  characters:            { label: 'People',       emoji: '👤', description: 'NPCs — idle head movement when placed' },
  props_containers:      { label: 'Containers',   emoji: '📦', description: 'Barrels, crates, chests' },
  props_weapons:         { label: 'Weapons',      emoji: '⚔️', description: 'Decorative weapons' },
  props_items:           { label: 'Items',        emoji: '🎒', description: 'Fish, bottles, skulls' },
  props_nautical:        { label: 'Nautical',     emoji: '⚓', description: 'Anchors, cannons, ships' },
  infrastructure:        { label: 'Ships',        emoji: '🚢', description: 'Ships and vessels' },
};

// Village pages the user can link to items
export const VILLAGE_PAGES = [
  { id: '/village/map',          label: 'Village Map',      emoji: '🗺️' },
  { id: '/village/workshop',     label: 'Workshop',         emoji: '🔨' },
  { id: '/village/dreamline',    label: 'Dream Line',       emoji: '✨' },
  { id: '/village/bank',         label: 'Bank',             emoji: '🏦' },
  { id: '/village/trading-post', label: 'Trading Post',     emoji: '🤝' },
  { id: '/village/tribes',       label: 'Tribes',           emoji: '👥' },
  { id: '/village/zen',          label: 'Zen Garden',       emoji: '🌿' },
  { id: '/village/hospital',     label: 'Wellness Center',  emoji: '🏥' },
  { id: '/village/spirit',       label: 'Spirit',           emoji: '🌀' },
  { id: '/village/hut',          label: 'My Hut',           emoji: '🏠' },
  { id: '/village/pavilion',     label: 'Pavilion',         emoji: '🎭' },
  { id: '/village/studio',       label: 'Studio',           emoji: '🎬' },
  { id: '/village/blockchain',   label: 'VLG Ledger',       emoji: '⛓️' },
  { id: '/village/discover',     label: 'Discover',         emoji: '🔍' },
  { id: '/village/spaces',       label: 'Spaces',           emoji: '🌐' },
  { id: '/admin',                label: 'Admin Dashboard',  emoji: '⚙️' },
  { id: '/admin/sandbox',        label: 'World Builder',    emoji: '🌍' },
] as const;

// App features that can be added to any item
export const APP_FEATURES = [
  { id: 'goal_creation',   label: 'Create Goal',         emoji: '🎯', description: 'Opens goal creation flow' },
  { id: 'tribe_join',      label: 'Join Tribe',          emoji: '👥', description: 'Opens tribe joining interface' },
  { id: 'spirit_chat',     label: 'Chat with Spirit',    emoji: '🌀', description: 'Opens Spirit AI coach' },
  { id: 'marketplace',     label: 'Shop',                emoji: '🛍️', description: 'Opens the VLG marketplace' },
  { id: 'telehealth',      label: 'Book Appointment',    emoji: '🏥', description: 'Opens telehealth booking' },
  { id: 'event_create',    label: 'Host Event',          emoji: '🎭', description: 'Create a Pavilion event' },
  { id: 'vlg_earn',        label: 'Earn VLG',            emoji: '⬡',  description: 'Opens VLG earning tasks' },
  { id: 'skill_stream',    label: 'Skill Stream',        emoji: '📚', description: 'Opens skill learning feed' },
  { id: 'meditation',      label: 'Breathwork',          emoji: '🧘', description: 'Opens breathwork session' },
  { id: 'journal',         label: 'Journal',             emoji: '📖', description: 'Opens daily journal' },
  { id: 'affirmation',     label: 'Daily Affirmation',   emoji: '☀️',  description: 'Shows affirmation' },
  { id: 'oowop',           label: 'Give OoWop',          emoji: '✊', description: 'Send appreciation' },
  { id: 'collaborative_goal', label: 'Start Collab Goal',emoji: '🤝', description: 'Start a goal with someone' },
  { id: 'leaderboard',     label: 'Leaderboard',         emoji: '🏆', description: 'Opens village leaderboard' },
  { id: 'data_locker',     label: 'Data Locker',         emoji: '🔒', description: 'Opens data privacy center' },
] as const;

export function searchModels(query: string): CatalogModel[] {
  if (!query.trim()) return MODEL_CATALOG;
  const q = query.toLowerCase();
  return MODEL_CATALOG.filter(m =>
    m.label.toLowerCase().includes(q) ||
    m.category.includes(q) ||
    m.emoji.includes(q) ||
    (m.tags ?? []).some(t => t.includes(q))
  );
}

export function getByCategory(cat: ModelCategory): CatalogModel[] {
  return MODEL_CATALOG.filter(m => m.category === cat);
}
