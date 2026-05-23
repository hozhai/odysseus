import type { Item, Slot, TotalStats } from "../types";
import type { statType } from "../types";
import { MAX_LEVEL } from "../constants";
import { findItemById } from "./item.ts";

/**
 * formatTotalStats formats the TotalStats passed into it by prepending an appropriate
 * emoji and appeding a new line to each stat.
 * @param stats The total stats
 * @returns {string} A String with the stats formatted with their respective emojis
 */
export function formatTotalStats(stats: TotalStats): string {
  const normalizedStat = (value: number | undefined): number =>
    Number.isFinite(value) ? Math.floor(value ?? 0) : 0;

  const statEntries: Array<[string, number]> = [
    ["<:power:1392363667059904632>", normalizedStat(stats.power)],
    ["<:defense:1392364201262977054>", normalizedStat(stats.defense)],
    ["<:agility:1392364894573297746>", normalizedStat(stats.agility)],
    ["<:attackspeed:1392364933722804274>", normalizedStat(stats.attackSpeed)],
    ["<:attacksize:1392364917616807956>", normalizedStat(stats.attackSize)],
    ["<:intensity:1392365008049934377>", normalizedStat(stats.intensity)],
    ["<:regeneration:1392365064010469396>", normalizedStat(stats.regeneration)],
    ["<:piercing:1392365031705808986>", normalizedStat(stats.piercing)],
    ["<:resistance:1393458741009186907>", normalizedStat(stats.resistance)],
    ["<:drawback:1392364965905563698>", normalizedStat(stats.drawback)],
    ["<:warding:1392366478560596039>", normalizedStat(stats.warding)],
    ["<:insanity:1392364984658301031>", normalizedStat(stats.insanity)],
  ];

  const result = statEntries
    .filter(([, value]) => value !== 0)
    .map(([emoji, value]) => `${emoji} ${value}`)
    .join("\n");

  return result || "No stats";
}

export function getScalingMultiplier(statType: statType) {
  switch (statType) {
    case "defense":
      return 2.7;
    case "power":
      return 0.35;
    default:
      return 0.5;
  }
}

export function calculateItemStats(item: Item | null): TotalStats {
  const totalStats: TotalStats = {
    power: 0,
    defense: 0,
    agility: 0,
    attackSpeed: 0,
    attackSize: 0,
    intensity: 0,
    regeneration: 0,
    insanity: 0,
    piercing: 0,
    resistance: 0,
    warding: 0,
    drawback: 0,
  };

  if (!item) return totalStats;

  totalStats.power += Math.floor(
    (item?.scaling?.power ?? 0) * MAX_LEVEL * getScalingMultiplier("power")
  );

  totalStats.defense += Math.floor(
    (item?.scaling?.defense ?? 0) * MAX_LEVEL * getScalingMultiplier("defense")
  );

  totalStats.agility += Math.floor(
    (item?.scaling?.agility ?? 0) * MAX_LEVEL * getScalingMultiplier("other")
  );

  totalStats.attackSpeed += Math.floor(
    (item?.scaling?.attackSpeed ?? 0) *
      MAX_LEVEL *
      getScalingMultiplier("other")
  );

  totalStats.attackSize += Math.floor(
    (item?.scaling?.attackSize ?? 0) * MAX_LEVEL * getScalingMultiplier("other")
  );

  totalStats.intensity += Math.floor(
    (item?.scaling?.intensity ?? 0) * MAX_LEVEL * getScalingMultiplier("other")
  );

  totalStats.regeneration += Math.floor(
    (item?.scaling?.regeneration ?? 0) *
      MAX_LEVEL *
      getScalingMultiplier("other")
  );

  // we skip insanity because there is currently no item
  // that has insanity scaling

  totalStats.piercing += Math.floor(
    (item?.scaling?.piercing ?? 0) * MAX_LEVEL * getScalingMultiplier("other")
  );

  totalStats.resistance += Math.floor(
    (item?.scaling?.resistance ?? 0) * MAX_LEVEL * getScalingMultiplier("other")
  );

  // we do not multiply warding by the scaling multiplier because
  // it comes already with the actual value in the item data
  totalStats.warding += item?.scaling?.warding ?? 0;

  // same with drawback
  totalStats.drawback += item?.scaling?.drawback ?? 0;

  return totalStats;
}

export async function slotToTotalStats(slot: Slot): Promise<TotalStats> {
  const totalStats: TotalStats = {
    power: 0,
    defense: 0,
    agility: 0,
    attackSpeed: 0,
    attackSize: 0,
    intensity: 0,
    regeneration: 0,
    insanity: 0,
    piercing: 0,
    resistance: 0,
    warding: 0,
    drawback: 0,
  };

  const item = await findItemById(slot.item_id);
  const itemTotalStats = calculateItemStats(item);

  totalStats.power += itemTotalStats.power;
  totalStats.defense += itemTotalStats.defense;
  totalStats.agility += itemTotalStats.agility;
  totalStats.attackSpeed += itemTotalStats.attackSpeed;
  totalStats.attackSize += itemTotalStats.attackSize;
  totalStats.intensity += itemTotalStats.intensity;
  totalStats.regeneration += itemTotalStats.regeneration;
  totalStats.insanity += itemTotalStats.insanity; // should skip this but ehhh nahh.
  totalStats.piercing += itemTotalStats.piercing;
  totalStats.resistance += itemTotalStats.resistance;
  totalStats.warding += itemTotalStats.warding;
  totalStats.drawback += itemTotalStats.drawback;

  /*
    TODO:
    - create function calculateGemStats(gem_ids: string[]): TotalStats
    - create function calculateEnchantStats(enchant: string): TotalStats
    - create function calculateModifierStats(modifier: string): TotalStats
    */

  return totalStats;
}
