import { randomUUIDv7 } from "bun";
import { TotalStats } from "../types/data";
import { statType } from "../types";

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
