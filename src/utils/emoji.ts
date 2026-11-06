import type { APIMessageComponentEmoji } from "seyfert/lib/types";
import { getData } from "@data";
import {
  EMPTY_ENCHANTMENT_ID,
  EMPTY_GEM_ID,
  EMPTY_MODIFIER_ID,
} from "@constants";
import { Formatter } from "seyfert";
import type { EmojiResolvable } from "seyfert/lib/common";
import type { Enchant, Gem, Modifier } from "@data";
import { getEmojis } from "@/data/loadEmojis";

/**
 * Turns an enchant item type to a APIMessageComponentEmoji
 * @param enchantItem
 */
export async function itemEnchantToEmoji(
  enchantItem: Enchant
): Promise<EmojiResolvable | null> {
  const enchantEmojis = (await getEmojis()).enchants;

  return enchantEmojis[enchantItem.name] ?? null;
}

export async function itemModifierToEmoji(
  modifierItem: Modifier
): Promise<EmojiResolvable | null> {
  const modEmojis = (await getEmojis()).modifiers;

  return modEmojis[modifierItem.name] ?? null;
}

export async function itemGemToEmoji(
  gemItem: Gem
): Promise<EmojiResolvable | null> {
  const gemEmojis = (await getEmojis()).gems;

  return gemEmojis[gemItem.name] ?? null;
}

export async function magicToEmoji(
  magicName: string
): Promise<EmojiResolvable | null> {
  const magicEmojis = (await getEmojis()).gems;

  return magicEmojis[magicName] ?? null;
}

export async function fsToEmoji(
  fsName: string
): Promise<EmojiResolvable | null> {
  const fsEmojis = (await getEmojis()).fightingStyles;

  return fsEmojis[fsName] ?? null;
}

export async function emojiToGem(
  emoji: EmojiResolvable | null
): Promise<Gem | null> {
  const gemsData = (await getData()).gems;

  if (emoji === null) {
    return gemsData[EMPTY_GEM_ID] ?? null;
  }

  const emojiText =
    typeof emoji === "string"
      ? emoji
      : Formatter.emojiMention(
          emoji.id ?? "",
          emoji.name ?? "",
          emoji.animated
        );

  for (const gem of Object.values(gemsData)) {
    const gemEmoji = await itemGemToEmoji(gem);
    if (gemEmoji === emojiText) {
      return gem;
    }
  }

  return null;
}

export async function emojiToEnchant(
  emoji: EmojiResolvable | null
): Promise<Enchant | null> {
  const enchantData = (await getData()).enchants;

  if (emoji == null) {
    return enchantData[EMPTY_ENCHANTMENT_ID] ?? null;
  }

  const emojiText =
    typeof emoji === "string"
      ? emoji
      : Formatter.emojiMention(
          emoji.id ?? "",
          emoji.name ?? "",
          emoji.animated
        );

  for (const enchant of Object.values(enchantData)) {
    const enchantEmoji = await itemEnchantToEmoji(enchant);
    if (enchantEmoji === emojiText) {
      return enchant;
    }
  }

  return null;
}

export async function emojiToModifier(
  emoji: EmojiResolvable | null
): Promise<Modifier | null> {
  const modifierData = (await getData()).modifiers;

  if (emoji == null) {
    return modifierData[EMPTY_MODIFIER_ID] ?? null;
  }

  const emojiText =
    typeof emoji === "string"
      ? emoji
      : Formatter.emojiMention(
          emoji.id ?? "",
          emoji.name ?? "",
          emoji.animated
        );

  for (const modifier of Object.values(modifierData)) {
    const modifierEmoji = await itemModifierToEmoji(modifier);

    if (modifierEmoji === emojiText) {
      return modifier;
    }
  }

  return null;
}

/**
 * Turns a APIMessageComponentEmoji into an emoji in string format
 * @param emoji The emoji in APIMessageComponentEmoji format
 * @returns An emoji in the <animated:name:id> format
 */
export function componentEmojiToText(
  emoji: APIMessageComponentEmoji | null
): string {
  if (!emoji) {
    return "";
  }
  return `<${emoji.animated ? "a" : ""}:${emoji.name}:${emoji.id}>`;
}

/**
 * Turns an emoji in string format into an EmojiResolvable
 * @param text The emoji text
 * @returns An EmojiResolvable type
 */
export function emojiTextToResolvable(
  text: string | null
): EmojiResolvable | null {
  if (!text) return null;

  const match = text.match(/<(a?):([a-zA-Z0-9_]+):([0-9]+)>/g);

  if (!match) return null;

  const [, animated, name, id] = match;
  return {
    animated: animated === "a",
    name: name,
    id: id,
  };
}
