import { getData } from "../data/loadData";
import type { Enchant, Gem, Item, Magic, Modifier } from "../data/schemas";

/**
 * Find an item from the ID.
 * @param id The ID of the item to find
 * @returns A Promise that resolves to either the item if found or null if not found.
 */
export async function findItemById(id: string): Promise<Item | null> {
  const itemData = (await getData()).items;
  const item = itemData[id];

  return item ?? null;
}

/**
 * Find an enchant from the ID
 * @param id The ID of the enchant to find
 * @returns A Promise that resolves to either the enchant if found or null if not found
 */
export async function findEnchantById(id: string): Promise<Enchant | null> {
  const enchantData = (await getData()).enchants;
  const enchant = enchantData[id];

  return enchant ?? null;
}

/**
 * Find a modifier from the ID
 * @param id The ID of the modifier to find
 * @returns A Promise that resolves to either the modifier if found or null if not found
 */
export async function findModifierById(id: string): Promise<Modifier | null> {
  const modifierData = (await getData()).modifiers;
  const modifier = modifierData[id];

  return modifier ?? null;
}

/**
 * Find a modifier from the ID
 * @param id The ID of the gem to find
 * @returns A Promise that resolves to either the gem if found or null if not found
 */
export async function findGemById(id: string): Promise<Gem | null> {
  const gemData = (await getData()).gems;
  const gem = gemData[id];

  return gem ?? null;
}

/**
 * Find an enchant from the name
 * @param name The name of the enchant to find
 * @returns A Promise that resolves to either the enchant if found or null if not found
 */
export async function findEnchantByName(name: string): Promise<Enchant | null> {
  const enchantData = (await getData()).enchants;
  const enchant = Object.values(enchantData).find(
    (ench) => ench.name.toLowerCase() === name.toLowerCase()
  );

  return enchant ?? null;
}

/**
 * Find a modifier from the name
 * @param name The name of the modifier to find
 * @returns A Promise that resolves to either the modifier if found or null if not found
 */
export async function findModifierByName(
  name: string
): Promise<Modifier | null> {
  const modifierData = (await getData()).modifiers;
  const modifier = Object.values(modifierData).find(
    (mod) => mod.name.toLowerCase() === name.toLowerCase()
  );

  return modifier ?? null;
}

export async function findMagicByName(name: string): Promise<Magic | null> {
  const magicData = (await getData()).magics;
  const magic = magicData.find(
    (m) => m.name.toLowerCase() === name.toLowerCase()
  );

  return magic ?? null;
}
