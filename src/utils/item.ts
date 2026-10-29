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
import type { Rarity, Slot } from "../types";
import { ComponentContext, Embed, InMessageEmbed } from "seyfert";
import { formatTotalStats, slotToTotalStats } from "./stats";
import {
  emojiTextToResolvable,
  emojiToEnchant,
  emojiToGem,
  emojiToModifier,
  findEnchantById,
  findGemById,
  findItemById,
  findModifierById,
  itemEnchantToEmoji,
  itemGemToEmoji,
  itemModifierToEmoji,
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
      const emoji = emojiTextToResolvable(text);
      const gem = await emojiToGem(emoji);
      return gem?.id;
    })
  );

  const enchant = await emojiToEnchant(emojiTextToResolvable(enchantEmoji));

  const modifier = await emojiToModifier(emojiTextToResolvable(modifierEmoji));

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
      value: (itemEnchantToEmoji(enchant) as string) ?? "",
      inline: true,
    });
  }

  const modifier = await findModifierById(slot.modifier_id);

  if (modifier !== null && modifier.id !== EMPTY_MODIFIER_ID) {
    fields.push({
      name: "Modifier",
      value: (itemModifierToEmoji(modifier) as string) ?? "",
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
      .map((gem) => itemGemToEmoji(gem) as string)
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
