/* === ITEM === */

import { Rarity } from "./item";

export interface Item {
    id: string;
    name: string;
    legend: string;
    mainType: string;
    rarity: Rarity;
    imageId: string;
    deleted: boolean;
    subType?: string | null;
    gemNo?: number | null;
    minLevel?: number | null;
    maxLevel?: number | null;
    statType?: string | null;
    validModifiers?: string[] | null;

    scaling?: Scaling | null;

    enchantTypes?: EnchantTypes | null;

    powerIncrement?: number | null;
    defenseIncrement?: number | null;
    agilityIncrement?: number | null;
    attackSpeedIncrement?: number | null;
    attackSizeIncrement?: number | null;
    intensityIncrement?: number | null;
    regenerationIncrement?: number | null;
    piercingIncrement?: number | null;
    resistanceIncrement?: number | null;

    insanity?: number | null;
    warding?: number | null;
    agility?: number | null;
    attackSize?: number | null;
    defense?: number | null;
    drawback?: number | null;
    power?: number | null;
    attackSpeed?: number | null;
    intensity?: number | null;
    piercing?: number | null;
    regeneration?: number | null;
    resistance?: number | null;
}

export interface Scaling {
    power?: number | null;
    defense?: number | null;
    agility?: number | null;
    attackSpeed?: number | null;
    attackSize?: number | null;
    intensity?: number | null;
    regeneration?: number | null;
    piercing?: number | null;
    resistance?: number | null;
    warding?: number | null;
    drawback?: number | null;
}

export interface EnchantTypes {
    gear?: GearEnchantStats | null;
}

export interface GearEnchantStats {
    powerIncrement?: number | null;
    defenseIncrement?: number | null;
    // Range
    agilityIncrement?: number | null;
    attackSpeedIncrement?: number | null;
    attachSizeIncrement?: number | null;
    // Haste
    intensityIncrement?: number | null;
    regenerationIncrement?: number | null;
    piercingIncrement?: number | null;
    resistanceIncrement?: number | null;
}

/* === WEAPON === */

export interface Weapon {
    name: string;
    legend: string;
    rarity: string;
    imageId: string;
    damage: number;
    speed: number;
    size: number;
    specialEffect: string;
    defense?: number | null;
    blockingPower?: number | null;
    weight?: number | null;
}

/* === NON-DATABASE TYPES === */

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

export enum MagicsEnum {
    Acid = 0,
    Ash = 1,
    Crystal = 2,
    Earth = 3,
    Explosion = 4,
    Fire = 5,
    Glass = 6,
    Ice = 7,
    Light = 8,
    Lightning = 9,
    Magma = 10,
    Metal = 11,
    Plasma = 12,
    Poison = 13,
    Sand = 14,
    Shadow = 15,
    Snow = 16,
    Water = 17,
    Wind = 18,
    Wood = 19,
}

export enum FightingStylesEnum {
    BasicCombat = 20,
    Boxing = 21,
    IronLeg = 22,
    CannonFist = 23,
    SailorStyle = 24,
    ThermoFist = 25,
}

export interface WikiSearchResult {
    title: string;
    description: string;
    url: string;
}

/* === MAGIC DATA === */

export interface Magic {
    name: string;
    legend: string;
    imageId: string;
    unimbued: UnimbuedStats;
    imbued: ImbuedStats;
    specialEffect: string;
    clash: Clash;
}

export interface UnimbuedStats {
    damage: number;
    speed: number;
    size: number;
}

export interface ImbuedStats {
    damage: number;
    speed: number;
    size: ImbuedSize;
}

export interface ImbuedSize {
    conjurer: number;
    warlock: number;
}

export interface Clash {
    over: string[];
    neutral: string[];
    under: string[];
}

/* === BOT DATA === */

type Items = Record<string, Item>;
type Weapons = Weapon[];
type Magics = Magic[];

export interface BotData {
    items: Items;
    weapons: Weapons;
    magics: Magics;
}
