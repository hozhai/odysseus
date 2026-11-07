import type { Slot, statType, TotalStats } from "@src-types";
import {
  MAX_LEVEL,
  ATL_POWER_CAP,
  ATL_DEFENSE_CAP,
  ATL_AGILITY_CAP,
  ATL_ATTACK_SIZE_CAP,
  ATL_ATTACK_SPEED_CAP,
  ATL_INTENSITY_CAP,
  ATL_ID,
  MISC_ATL_IDS,
} from "@constants";
import {
  findEnchantById,
  findGemById,
  findItemById,
  findModifierById,
  floorTo1,
} from "@utils";
import type { Item } from "@data";

/**
 * formatTotalStats formats the TotalStats passed into it by prepending an appropriate
 * emoji and appending a new line to each stat.
 * @param stats The total stats
 * @returns {string} A String with the stats formatted with their respective emojis
 */
export function formatTotalStats(stats: TotalStats): string {
  const normalizedStat = (value: number | undefined): number => value ?? 0;

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
      return 0.315;
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

export function getImbueMultiplier(statType: statType): number {
  switch (statType) {
    case "defense":
      return 0.22345;
    case "power":
      return 0.19575;
    default:
      return 0.4;
  }
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

  totalStats.power += floorTo1(
    (item?.scaling?.power ?? 0) * MAX_LEVEL * getScalingMultiplier("power") +
      getImbueStatMultiplier(imbue, "power") *
        getScalingMultiplier("power") *
        getImbuePieceMultiplier(item) *
        getImbueMultiplier("power") *
        1.5 *
        MAX_LEVEL
  );

  totalStats.defense += floorTo1(
    (item?.scaling?.defense ?? 0) *
      MAX_LEVEL *
      getScalingMultiplier("defense") +
      getImbueStatMultiplier(imbue, "defense") *
        getImbuePieceMultiplier(item) *
        getScalingMultiplier("defense") *
        getImbueMultiplier("defense") *
        1.5 *
        MAX_LEVEL
  );

  totalStats.agility += floorTo1(
    (item?.scaling?.agility ?? 0) *
      MAX_LEVEL *
      getScalingMultiplier("agility") +
      getImbueStatMultiplier(imbue, "agility") *
        getImbuePieceMultiplier(item) *
        getScalingMultiplier("agility") *
        getImbueMultiplier("agility") *
        1.5 *
        MAX_LEVEL
  );

  totalStats.attackSpeed += floorTo1(
    (item?.scaling?.attackSpeed ?? 0) *
      MAX_LEVEL *
      getScalingMultiplier("attackSpeed") +
      getImbueStatMultiplier(imbue, "attackSpeed") *
        getImbuePieceMultiplier(item) *
        getScalingMultiplier("attackSpeed") *
        getImbueMultiplier("attackSpeed") *
        1.5 *
        MAX_LEVEL
  );

  totalStats.attackSize += floorTo1(
    (item?.scaling?.attackSize ?? 0) *
      MAX_LEVEL *
      getScalingMultiplier("attackSize") +
      getImbueStatMultiplier(imbue, "attackSize") *
        getImbuePieceMultiplier(item) *
        getScalingMultiplier("attackSize") *
        getImbueMultiplier("attackSize") *
        1.5 *
        MAX_LEVEL
  );

  totalStats.intensity += floorTo1(
    (item?.scaling?.intensity ?? 0) *
      MAX_LEVEL *
      getScalingMultiplier("intensity") +
      getImbueStatMultiplier(imbue, "intensity") *
        getImbuePieceMultiplier(item) *
        getScalingMultiplier("intensity") *
        getImbueMultiplier("intensity") *
        1.5 *
        MAX_LEVEL
  );

  totalStats.regeneration += floorTo1(
    (item?.scaling?.regeneration ?? 0) *
      MAX_LEVEL *
      getScalingMultiplier("regeneration") +
      getImbueStatMultiplier(imbue, "regeneration") *
        getImbuePieceMultiplier(item) *
        getScalingMultiplier("regeneration") *
        getImbueMultiplier("regeneration") *
        1.5 *
        MAX_LEVEL
  );

  // we skip insanity because there is currently no item
  // that has insanity scaling nor flat insanity increases

  totalStats.piercing += floorTo1(
    (item?.scaling?.piercing ?? 0) *
      MAX_LEVEL *
      getScalingMultiplier("piercing") +
      getImbueStatMultiplier(imbue, "piercing") *
        getImbuePieceMultiplier(item) *
        getScalingMultiplier("piercing") *
        getImbueMultiplier("piercing") *
        1.5 *
        MAX_LEVEL
  );

  totalStats.resistance += floorTo1(
    (item?.scaling?.resistance ?? 0) *
      MAX_LEVEL *
      getScalingMultiplier("resistance") +
      getImbueStatMultiplier(imbue, "resistance") *
        getImbuePieceMultiplier(item) *
        getScalingMultiplier("resistance") *
        getImbueMultiplier("resistance") *
        1.5 *
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

  // warding does not need any type of flooring as it will always be an integer
  totalStats.warding += (enchant.enchantTypes?.gear?.warding ?? 0) * multiplier;

  // skip drawback

  return totalStats;
}

export async function calculateAtlanteanEssence(
  item_stats: TotalStats
): Promise<TotalStats> {
  const totalStats = createEmptyTotalStats();
  const atl = await findModifierById(ATL_ID);

  if (!atl) {
    throw Error("Atlantean Essence modifier item not found in modifiers.yaml");
  }

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
      ATL_POWER_CAP
    );
  }

  return totalStats;
}

export async function calculateModifierStats(
  modifier_id: string,
  itemStats: TotalStats
): Promise<TotalStats> {
  const modifier = await findModifierById(modifier_id);

  const totalStats = createEmptyTotalStats();

  if (!modifier) {
    return totalStats;
  }

  // atlantean essence calculation
  if (modifier.id === ATL_ID) {
    return calculateAtlanteanEssence(itemStats);
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

  if (MISC_ATL_IDS.includes(modifier_id)) {
    const combinedTotalStats = createEmptyTotalStats();

    combinedTotalStats.power += totalStats.power + itemStats.power;
    combinedTotalStats.defense += totalStats.defense + itemStats.defense;
    combinedTotalStats.agility += totalStats.agility + itemStats.agility;
    combinedTotalStats.attackSpeed +=
      totalStats.attackSpeed + itemStats.attackSpeed;
    combinedTotalStats.attackSize +=
      totalStats.attackSize + itemStats.attackSize;
    combinedTotalStats.intensity += totalStats.intensity + itemStats.intensity;
    combinedTotalStats.regeneration +=
      totalStats.regeneration + itemStats.regeneration;
    // skip insanity
    combinedTotalStats.piercing += totalStats.piercing + itemStats.piercing;
    combinedTotalStats.resistance +=
      totalStats.resistance + itemStats.resistance;
    // skip warding
    // skip drawback

    const atlanteanStats = await calculateAtlanteanEssence(combinedTotalStats);

    totalStats.power += atlanteanStats.power;
    totalStats.defense += atlanteanStats.defense;
    totalStats.agility += atlanteanStats.agility;
    totalStats.attackSpeed += atlanteanStats.attackSpeed;
    totalStats.attackSize += atlanteanStats.attackSize;
    totalStats.intensity += atlanteanStats.intensity;
    // skip regeneration
    totalStats.insanity += atlanteanStats.insanity; // don't skip insanity
    // skip piercing
    // skip resistance
    // skip warding
    // skip drawback
  }

  return totalStats;
}

export async function slotToTotalStats(slot: Slot): Promise<TotalStats> {
  const totalStats = createEmptyTotalStats();

  const item = await findItemById(slot.itemId);
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

  const gemsTotalStats = await calculateGemStats(slot.gemIds);

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

  const enchantTotalStats = await calculateEnchantStats(slot.enchantId);

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
    slot.modifierId,
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

  totalStats.power = floorTo1(totalStats.power);
  totalStats.defense = floorTo1(totalStats.defense);
  totalStats.agility = floorTo1(totalStats.agility);
  totalStats.attackSpeed = floorTo1(totalStats.attackSpeed);
  totalStats.attackSize = floorTo1(totalStats.attackSize);
  totalStats.intensity = floorTo1(totalStats.intensity);
  totalStats.regeneration = floorTo1(totalStats.regeneration);
  // skip insanity
  totalStats.piercing = floorTo1(totalStats.piercing);
  totalStats.resistance = floorTo1(totalStats.resistance);
  // skip warding
  // skip drawback

  return totalStats;
}
