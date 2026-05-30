import type { Item, Modifier, Slot, TotalStats } from "../types";
import type { statType } from "../types";
import {
  MAX_LEVEL,
  ATL_POWER_CAP,
  ATL_DEFENSE_CAP,
  ATL_AGILITY_CAP,
  ATL_ATTACK_SIZE_CAP,
  ATL_ATTACK_SPEED_CAP,
  ATL_INTENSITY_CAP,
} from "../constants";
import {
  findEnchantById,
  findGemById,
  findItemById,
  findModifierById,
} from "./item.ts";

/**
 * formatTotalStats formats the TotalStats passed into it by prepending an appropriate
 * emoji and appending a new line to each stat.
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

export function getImbuePieceMultiplier(item: Item): number {
  const name = item.name.toLowerCase();
  if (
    item.mainType === "Chestplate" ||
    name.includes("arcsphere") ||
    name.includes("bracelet")
  ) {
    return 1.0;
  }
  return 0.75;
}

export function getImbueStatMultiplier(
  imbue: string,
  statType: statType
): number {
  switch (imbue) {
    case "acid":
      return statType === "piercing" ? 1.0 : 0.0;

    case "ash":
      if (statType === "attackSize") return 0.75;
      if (statType === "power") return 0.25;
      return 0.0;

    case "crystal":
      if (statType === "defense") return 0.5;
      if (statType === "intensity") return 0.5;
      return 0.0;

    case "earth":
      if (statType === "defense") return 0.75;
      if (statType === "attackSize") return 0.25;
      return 0.0;

    case "explosion":
      return statType === "attackSize" ? 1.0 : 0.0;

    case "fire":
      return statType === "power" ? 1.0 : 0.0;

    case "glass":
      if (statType === "power") return 1.25;
      if (statType === "defense") return -0.25;
      return 0.0;

    case "ice":
      if (statType === "defense") return 0.25;
      if (statType === "resistance") return 0.75;
      return 0.0;

    case "light":
      if (statType === "attackSpeed") return 1.25;
      if (statType === "attackSize") return -0.25;
      return 0.0;

    case "lightning":
      if (statType === "attackSpeed") return 0.75;
      if (statType === "agility") return 0.25;
      return 0.0;

    case "magma":
      if (statType === "power") return 0.5;
      if (statType === "attackSize") return 0.5;
      return 0.0;

    case "metal":
      if (statType === "defense") return 1.0;
      if (statType === "agility") return -0.25;
      if (statType === "resistance") return 0.25;
      return 0.0;

    case "plasma":
      if (statType === "power") return 0.75;
      if (statType === "intensity") return 0.25;
      return 0.0;

    case "poison":
      if (statType === "power") return 0.75;
      if (statType === "piercing") return 0.25;
      return 0.0;

    case "sand":
      return statType === "intensity" ? 1.0 : 0.0;

    case "shadow":
      if (statType === "power") return 0.5;
      if (statType === "attackSpeed") return 0.5;
      return 0.0;

    case "snow":
      if (statType === "attackSpeed") return 0.25;
      if (statType === "attackSize") return 0.75;
      return 0.0;

    case "water":
      if (statType === "intensity") return 0.25;
      if (statType === "attackSize") return 0.75;
      return 0.0;

    case "wind":
      if (statType === "agility") return 0.25;
      if (statType === "attackSize") return 0.25;
      if (statType === "attackSpeed") return 0.5;
      return 0.0;

    case "wood":
      if (statType === "power") return 0.25;
      if (statType === "defense") return 0.75;
      return 0.0;

    case "basic":
      if (statType === "power") return 0.5;
      if (statType === "intensity") return 0.5;
      return 0.0;

    case "boxing":
      if (statType === "agility") return 0.5;
      if (statType === "resistance") return 0.5;
      return 0.0;

    case "cannon fist":
      if (statType === "piercing") return 0.5;
      if (statType === "intensity") return 0.5;
      return 0.0;

    case "iron leg":
      if (statType === "attackSpeed") return -0.25;
      if (statType === "power") return 0.5;
      if (statType === "resistance") return 0.75;
      return 0.0;

    case "sailor style":
      if (statType === "attackSize") return 0.5;
      if (statType === "power") return 0.5;
      return 0.0;

    case "thermo fist":
      if (statType === "attackSpeed") return 0.75;
      if (statType === "intensity") return 0.5;
      if (statType === "attackSize") return -0.25;
      return 0.0;

    default:
      return 0.0;
  }
}

export function getImbueCategoryMultiplier(statType: statType): number {
  switch (statType) {
    case "defense":
      return 0.334;
    case "power":
      return 0.285716;
    default:
      return 0.595;
  }
}

export function detectImbue(item: Item): string | null {
  const name = item.name.toLowerCase();

  const candidates: Array<[string, string]> = [
    ["acid", "acid"],
    ["ash", "ash"],
    ["crystal", "crystal"],
    ["earth", "earth"],
    ["explosion", "explosion"],
    ["fire", "fire"],
    ["glass", "glass"],
    ["ice", "ice"],
    ["lightning", "lightning"],
    ["light", "light"],
    ["magma", "magma"],
    ["metal", "metal"],
    ["plasma", "plasma"],
    ["poison", "poison"],
    ["sand", "sand"],
    ["shadow", "shadow"],
    ["snow", "snow"],
    ["water", "water"],
    ["wind", "wind"],
    ["wood", "wood"],
    ["basic combat", "basic"],
    ["boxing", "boxing"],
    ["cannon fist", "cannon fist"],
    ["iron leg", "iron leg"],
    ["sailor style", "sailor style"],
    ["thermo fist", "thermo fist"],
  ];

  for (const [needle, key] of candidates) {
    if (name.includes(needle)) return key;
  }

  return null;
}

export function createEmptyTotalStats(): TotalStats {
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

  return totalStats;
}

export function calculateItemStats(item: Item | null): TotalStats {
  const totalStats = createEmptyTotalStats();

  if (!item) return totalStats;

  const imbue = detectImbue(item) ?? "None";

  totalStats.power +=
    Math.floor(
      (item?.scaling?.power ?? 0) * MAX_LEVEL * getScalingMultiplier("power")
    ) +
    Math.floor(
      getImbueStatMultiplier(imbue, "power") *
        getImbuePieceMultiplier(item) *
        getImbueCategoryMultiplier("power") *
        getScalingMultiplier("power") *
        MAX_LEVEL
    );

  totalStats.defense +=
    Math.floor(
      (item?.scaling?.defense ?? 0) *
        MAX_LEVEL *
        getScalingMultiplier("defense")
    ) +
    Math.floor(
      getImbueStatMultiplier(imbue, "defense") *
        getImbuePieceMultiplier(item) *
        getImbueCategoryMultiplier("defense") *
        getScalingMultiplier("defense") *
        MAX_LEVEL
    );

  totalStats.agility +=
    Math.floor(
      (item?.scaling?.agility ?? 0) *
        MAX_LEVEL *
        getScalingMultiplier("agility")
    ) +
    Math.floor(
      getImbueStatMultiplier(imbue, "agility") *
        getImbuePieceMultiplier(item) *
        getImbueCategoryMultiplier("agility") *
        getScalingMultiplier("agility") *
        MAX_LEVEL
    );

  totalStats.attackSpeed +=
    Math.floor(
      (item?.scaling?.attackSpeed ?? 0) *
        MAX_LEVEL *
        getScalingMultiplier("attackSpeed")
    ) +
    Math.floor(
      getImbueStatMultiplier(imbue, "attackSpeed") *
        getImbuePieceMultiplier(item) *
        getImbueCategoryMultiplier("attackSpeed") *
        getScalingMultiplier("attackSpeed") *
        MAX_LEVEL
    );

  totalStats.attackSize +=
    Math.floor(
      (item?.scaling?.attackSize ?? 0) *
        MAX_LEVEL *
        getScalingMultiplier("attackSize")
    ) +
    Math.floor(
      getImbueStatMultiplier(imbue, "attackSize") *
        getImbuePieceMultiplier(item) *
        getImbueCategoryMultiplier("attackSize") *
        getScalingMultiplier("attackSize") *
        MAX_LEVEL
    );

  totalStats.intensity +=
    Math.floor(
      (item?.scaling?.intensity ?? 0) *
        MAX_LEVEL *
        getScalingMultiplier("intensity")
    ) +
    Math.floor(
      getImbueStatMultiplier(imbue, "intensity") *
        getImbuePieceMultiplier(item) *
        getImbueCategoryMultiplier("intensity") *
        getScalingMultiplier("intensity") *
        MAX_LEVEL
    );

  totalStats.regeneration +=
    Math.floor(
      (item?.scaling?.regeneration ?? 0) *
        MAX_LEVEL *
        getScalingMultiplier("regeneration")
    ) +
    Math.floor(
      getImbueStatMultiplier(imbue, "regeneration") *
        getImbuePieceMultiplier(item) *
        getImbueCategoryMultiplier("regeneration") *
        getScalingMultiplier("regeneration") *
        MAX_LEVEL
    );

  // we skip insanity because there is currently no item
  // that has insanity scaling nor flat insanity increases

  totalStats.piercing +=
    Math.floor(
      (item?.scaling?.piercing ?? 0) *
        MAX_LEVEL *
        getScalingMultiplier("piercing")
    ) +
    Math.floor(
      getImbueStatMultiplier(imbue, "piercing") *
        getImbuePieceMultiplier(item) *
        getImbueCategoryMultiplier("piercing") *
        getScalingMultiplier("piercing") *
        MAX_LEVEL
    );

  totalStats.resistance +=
    Math.floor(
      (item?.scaling?.resistance ?? 0) *
        MAX_LEVEL *
        getScalingMultiplier("resistance")
    ) +
    Math.floor(
      getImbueStatMultiplier(imbue, "resistance") *
        getImbuePieceMultiplier(item) *
        getImbueCategoryMultiplier("resistance") *
        getScalingMultiplier("resistance") *
        MAX_LEVEL
    );

  // we do not multiply warding by the scaling multiplier because
  // it comes already with the actual value in the item data
  totalStats.warding += item?.scaling?.warding ?? 0;

  // same with drawback
  totalStats.drawback += item?.scaling?.drawback ?? 0;

  return totalStats;
}

export async function calculateGemStats(
  gem_ids: string[]
): Promise<TotalStats> {
  const gems = (
    await Promise.all(gem_ids.map(async (id) => await findGemById(id)))
  ).filter((item) => item !== null);

  const totalStats = createEmptyTotalStats();

  gems.forEach((gem) => {
    totalStats.power += gem.power ?? 0;
    totalStats.defense += gem.defense ?? 0;
    totalStats.agility += gem.agility ?? 0;
    totalStats.attackSpeed += gem.attackSpeed ?? 0;
    totalStats.attackSize += gem.attackSize ?? 0;
    totalStats.intensity += gem.intensity ?? 0;
    totalStats.regeneration += gem.regeneration ?? 0;
    // we skip insanity; there are no insanity gems
    totalStats.piercing += gem.piercing ?? 0;
    totalStats.resistance += gem.resistance ?? 0;
    // also skip warding for the same reason
    totalStats.drawback += gem.drawback ?? 0;
  });

  return totalStats;
}

export async function calculateEnchantStats(
  enchant_id: string
): Promise<TotalStats> {
  const enchant = await findEnchantById(enchant_id);

  const totalStats = createEmptyTotalStats();

  if (!enchant) {
    return totalStats;
  }

  const multiplier = MAX_LEVEL / 10;

  totalStats.power +=
    (enchant.enchantTypes?.gear?.powerIncrement ?? 0) * multiplier;

  totalStats.defense +=
    (enchant.enchantTypes?.gear?.defenseIncrement ?? 0) * multiplier;

  totalStats.agility +=
    (enchant.enchantTypes?.gear?.agilityIncrement ?? 0) * multiplier;

  totalStats.attackSpeed +=
    (enchant.enchantTypes?.gear?.attackSpeedIncrement ?? 0) * multiplier;

  totalStats.attackSize +=
    (enchant.enchantTypes?.gear?.attackSizeIncrement ?? 0) * multiplier;

  totalStats.intensity +=
    (enchant.enchantTypes?.gear?.intensityIncrement ?? 0) * multiplier;

  totalStats.regeneration +=
    (enchant.enchantTypes?.gear?.regenerationIncrement ?? 0) * multiplier;

  // skip insanity

  totalStats.piercing +=
    (enchant.enchantTypes?.gear?.piercingIncrement ?? 0) * multiplier;

  totalStats.resistance +=
    (enchant.enchantTypes?.gear?.resistanceIncrement ?? 0) * multiplier;

  totalStats.warding += (enchant.enchantTypes?.gear?.warding ?? 0) * multiplier;

  // skip drawback

  return totalStats;
}

export function calculateAtlanteanEssence(
  item_stats: TotalStats,
  atl: Modifier
): TotalStats {
  const totalStats = createEmptyTotalStats();

  // alt essence always gives 1 insanity regardless
  totalStats.insanity += 1;

  const multiplier = MAX_LEVEL / 10;

  if (item_stats.power === 0) {
    totalStats.power += Math.min(
      Math.floor((atl.powerIncrement ?? 0) * multiplier),
      ATL_POWER_CAP
    );
  } else if (item_stats.defense === 0) {
    totalStats.defense += Math.min(
      Math.floor((atl.defenseIncrement ?? 0) * multiplier),
      ATL_DEFENSE_CAP
    );
  } else if (item_stats.attackSize === 0) {
    totalStats.attackSize += Math.min(
      Math.floor((atl.attackSizeIncrement ?? 0) * multiplier),
      ATL_ATTACK_SIZE_CAP
    );
  } else if (item_stats.attackSpeed === 0) {
    totalStats.attackSpeed += Math.min(
      Math.floor((atl.attackSpeedIncrement ?? 0) * multiplier),
      ATL_ATTACK_SPEED_CAP
    );
  } else if (item_stats.agility === 0) {
    totalStats.agility += Math.min(
      Math.floor((atl.agilityIncrement ?? 0) * multiplier),
      ATL_AGILITY_CAP
    );
  } else if (item_stats.intensity === 0) {
    totalStats.intensity += Math.min(
      Math.floor((atl.intensityIncrement ?? 0) * multiplier),
      ATL_INTENSITY_CAP
    );
  } else {
    // if all stats are present, roll back to power
    totalStats.power += Math.min(
      Math.floor((atl.powerIncrement ?? 0) * multiplier),
      13
    );
  }

  return totalStats;
}

export async function calculateModifierStats(
  modifier_id: string,
  item_stats: TotalStats
): Promise<TotalStats> {
  const modifier = await findModifierById(modifier_id);

  const totalStats = createEmptyTotalStats();

  if (!modifier) {
    return totalStats;
  }

  // atlantean essence calculation
  if (modifier.id === "AAu") {
    return calculateAtlanteanEssence(item_stats, modifier);
  }

  const multiplier = MAX_LEVEL / 10;

  totalStats.power += (modifier.powerIncrement ?? 0) * multiplier;
  totalStats.defense += (modifier.defenseIncrement ?? 0) * multiplier;
  totalStats.agility += (modifier.agilityIncrement ?? 0) * multiplier;
  totalStats.attackSpeed += (modifier.attackSpeedIncrement ?? 0) * multiplier;
  totalStats.attackSize += (modifier.attackSizeIncrement ?? 0) * multiplier;
  totalStats.intensity += (modifier.intensityIncrement ?? 0) * multiplier;
  totalStats.regeneration += (modifier.regenerationIncrement ?? 0) * multiplier;
  // skip insanity
  totalStats.piercing += (modifier.piercingIncrement ?? 0) * multiplier;
  totalStats.resistance += (modifier.resistanceIncrement ?? 0) * multiplier;
  // skip warding
  // skip drawback

  return totalStats;
}

export async function slotToTotalStats(slot: Slot): Promise<TotalStats> {
  const totalStats = createEmptyTotalStats();

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

  const gemsTotalStats = await calculateGemStats(slot.gem_ids);

  totalStats.power += gemsTotalStats.power;
  totalStats.defense += gemsTotalStats.defense;
  totalStats.agility += gemsTotalStats.agility;
  totalStats.attackSpeed += gemsTotalStats.attackSpeed;
  totalStats.attackSize += gemsTotalStats.attackSize;
  totalStats.intensity += gemsTotalStats.intensity;
  totalStats.regeneration += gemsTotalStats.regeneration;
  totalStats.insanity += gemsTotalStats.insanity; // should skip this too but ehhh nahh.
  totalStats.piercing += gemsTotalStats.piercing; // edit: i think i should skip a lot of these but nahhh
  totalStats.resistance += gemsTotalStats.resistance;
  totalStats.warding += gemsTotalStats.warding;
  totalStats.drawback += gemsTotalStats.drawback;

  const enchantTotalStats = await calculateEnchantStats(slot.enchant_id);

  totalStats.power += enchantTotalStats.power;
  totalStats.defense += enchantTotalStats.defense;
  totalStats.agility += enchantTotalStats.agility;
  totalStats.attackSpeed += enchantTotalStats.attackSpeed;
  totalStats.attackSize += enchantTotalStats.attackSize;
  totalStats.intensity += enchantTotalStats.intensity;
  totalStats.regeneration += enchantTotalStats.regeneration;
  totalStats.insanity += enchantTotalStats.insanity;
  totalStats.piercing += enchantTotalStats.piercing;
  totalStats.resistance += enchantTotalStats.resistance;
  totalStats.warding += enchantTotalStats.warding;
  totalStats.drawback += enchantTotalStats.drawback;

  const modifierTotalStats = await calculateModifierStats(
    slot.modifier_id,
    totalStats
  );

  totalStats.power += modifierTotalStats.power;
  totalStats.defense += modifierTotalStats.defense;
  totalStats.agility += modifierTotalStats.agility;
  totalStats.attackSpeed += modifierTotalStats.attackSpeed;
  totalStats.attackSize += modifierTotalStats.attackSize;
  totalStats.intensity += modifierTotalStats.intensity;
  totalStats.regeneration += modifierTotalStats.regeneration;
  totalStats.insanity += modifierTotalStats.insanity;
  totalStats.piercing += modifierTotalStats.piercing;
  totalStats.resistance += modifierTotalStats.resistance;
  totalStats.warding += modifierTotalStats.warding;
  totalStats.drawback += modifierTotalStats.drawback;

  return totalStats;
}
