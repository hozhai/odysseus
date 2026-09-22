import {
  COLOR_COMMON,
  COLOR_EXOTIC,
  COLOR_RARE,
  COLOR_UNCOMMON,
  EMBED_COLOR_ERROR,
  EMBED_FOOTER,
  EMPTY_CHESTPLATE_ID,
  EMPTY_ENCHANTMENT_ID,
  EMPTY_MODIFIER_ID,
} from "../constants";
import type { Enchant, Gem, Item, Modifier, Rarity, Slot } from "../types";
import { getData } from "../data/load";
import { ComponentContext, Embed, InMessageEmbed } from "seyfert";
import { formatTotalStats, slotToTotalStats } from "./stats";
import {
  componentEmojiToText,
  emojiToEnchant,
  emojiToGem,
  emojiToModifier,
  itemEnchantToEmoji,
  itemGemToEmoji,
  itemModifierToEmoji,
  textToEmoji,
} from ".";

/**
 * Gets the color of a rarity given the rarity.
 * @param rarity A rarity that can be "Common", "Uncommon", "Rare", or "Exotic" (case-sensitive)
 * @returns A hexadecimal number
 */
export function getRarityColor(rarity: Rarity): number {
  switch (rarity) {
    case "Common":
      return COLOR_COMMON;
    case "Uncommon":
      return COLOR_UNCOMMON;
    case "Rare":
      return COLOR_RARE;
    case "Exotic":
      return COLOR_EXOTIC;
  }
}

export async function parseEmbedIntoSlot(
  embed: InMessageEmbed | undefined
): Promise<Slot> {
  const slot: Slot = {
    item_id: EMPTY_CHESTPLATE_ID,
    gem_ids: [],
    enchant_id: EMPTY_ENCHANTMENT_ID,
    modifier_id: EMPTY_MODIFIER_ID,
    level: 170,
  };

  if (!embed) {
    return slot;
  }

  const item_id = embed.title?.split(" | ")[1];

  const fieldMap = new Map(embed.fields?.map((f) => [f.name, f.value]) ?? []);

  const level = Number(fieldMap.get("Level") ?? 170);
  const gemEmojis =
    fieldMap
      .get("Gem(s)")
      ?.split(" ")
      .filter((gem) => gem !== "") ?? [];
  const enchantEmoji = fieldMap.get("Enchant") ?? "";
  const modifierEmoji = fieldMap.get("Modifier") ?? "";

  const gems = await Promise.all(
    gemEmojis.map(async (text) => {
      const emoji = textToEmoji(text);
      const gem = await emojiToGem(emoji);
      return gem?.id;
    })
  );

  const enchant = await emojiToEnchant(textToEmoji(enchantEmoji));

  const modifier = await emojiToModifier(textToEmoji(modifierEmoji));

  if (item_id) {
    slot.item_id = item_id;
  }

  if (gems.filter((id) => id !== undefined).length !== 0) {
    slot.gem_ids = gems.filter((id) => id !== undefined);
  }

  if (enchant?.id) {
    slot.enchant_id = enchant.id;
  }

  if (modifier?.id) {
    slot.modifier_id = modifier.id;
  }

  if (Number.isFinite(level)) {
    slot.level = level;
  }

  return slot;
}

export async function slotIntoEmbed(
  ctx: ComponentContext,
  slot: Slot
): Promise<Embed> {
  const item = await findItemById(slot.item_id);

  if (!item) {
    return new Embed()
      .setAuthor({
        name: ctx.author.username,
        iconUrl: ctx.author.avatarURL(),
      })
      .setColor(EMBED_COLOR_ERROR)
      .setFooter({ text: EMBED_FOOTER })
      .setDescription(
        "Error: the item passed from item_select_enchant to slotIntoEmbed seems to not be valid. Please report this to the developer."
      );
  }

  const totalStats = await slotToTotalStats(slot);
  const formattedStats = formatTotalStats(totalStats);

  const embed = new Embed()
    .setAuthor({
      name: ctx.author.username,
      iconUrl: ctx.author.avatarURL(),
    })
    .setThumbnail(item.imageId)
    .setTitle(`${item.name} | ${item.id}`)
    .setColor(getRarityColor(item.rarity))
    .setFooter({ text: EMBED_FOOTER });

  const fields = [
    {
      name: "Description",
      value: item.legend,
    },
    {
      name: "Stats",
      value: formattedStats,
    },
    {
      name: "Type",
      value: item.mainType,
      inline: true,
    },
    {
      name: "Subtype",
      value: item.subType ?? "None",
      inline: true,
    },
    {
      name: "Rarity",
      value: item.rarity,
      inline: true,
    },
  ];

  const enchant = await findEnchantById(slot.enchant_id);

  if (enchant !== null && enchant.id !== EMPTY_ENCHANTMENT_ID) {
    fields.push({
      name: "Enchant",
      value: componentEmojiToText(itemEnchantToEmoji(enchant)),
      inline: true,
    });
  }

  const modifier = await findModifierById(slot.modifier_id);

  if (modifier !== null && modifier.id !== EMPTY_MODIFIER_ID) {
    fields.push({
      name: "Modifier",
      value: componentEmojiToText(itemModifierToEmoji(modifier)),
      inline: true,
    });
  }

  const gems = (
    await Promise.all(
      slot.gem_ids.map(async (gem_id) => await findGemById(gem_id))
    )
  ).filter((gem) => gem !== null);

  if (gems.length !== 0) {
    const gemEmojis = gems
      .map((gem) => componentEmojiToText(itemGemToEmoji(gem)))
      .join(" ");

    fields.push({
      name: "Gem(s)",
      value: gemEmojis,
      inline: true,
    });
  }

  embed.addFields(fields);

  return embed;
}

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
