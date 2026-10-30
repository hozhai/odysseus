export interface Player {
  level: number;
  vitalityPoints: number;
  magicPoints: number;
  strengthPoints: number;
  weaponPoints: number;
  magics: MagicsEnum[];
  fightingStyles: FightingStylesEnum[];
  accessories: Slot[];
  chestplate: Slot;
  boots: Slot;
}

export interface Slot {
  item_id: string;
  gem_ids: string[];
  enchant_id: string;
  modifier_id: string;
  level: number;
}

export interface TotalStats {
  power: number;
  defense: number;
  agility: number;
  attackSpeed: number;
  attackSize: number;
  intensity: number;
  regeneration: number;
  piercing: number;
  resistance: number;
  insanity: number;
  warding: number;
  drawback: number;
}

export interface WikiSearchResult {
  title: string;
  description: string;
  url: string;
}
