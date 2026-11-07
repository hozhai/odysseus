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
import {
  FightingStylesEnum,
  fsNameToEnum,
  magicNameToEnum,
  type MagicsEnum,
} from "./build";

/**
 * Turns an enchant item type to the corresponding emoji
 * @param enchantItem
 * @returns An EmojiResolvable or null if emoji is not found
 */
export async function itemEnchantToEmoji(
  enchantItem: Enchant
): Promise<EmojiResolvable | null> {
  const enchantEmojis = (await getEmojis()).enchants;
  const emoji = enchantEmojis[enchantItem.name];

  return emoji ? Formatter.emojiMention(emoji.id, emoji.name) : null;
}

export async function itemModifierToEmoji(
  modifierItem: Modifier
): Promise<EmojiResolvable | null> {
  const modEmojis = (await getEmojis()).modifiers;
  const emoji = modEmojis[modifierItem.name];

  return emoji ? Formatter.emojiMention(emoji.id, emoji.name) : null;
}

export async function itemGemToEmoji(
  gemItem: Gem
): Promise<EmojiResolvable | null> {
  const gemEmojis = (await getEmojis()).gems;
  const emoji = gemEmojis[gemItem.name];

  return emoji ? Formatter.emojiMention(emoji.id, emoji.name) : null;
}

export async function magicToEmoji(
  magicName: string
): Promise<EmojiResolvable | null> {
  const magicEmojis = (await getEmojis()).magics;
  const emoji = magicEmojis[magicName];

  return emoji ? Formatter.emojiMention(emoji.id, emoji.name) : null;
}

export async function fsToEmoji(
  fsName: string
): Promise<EmojiResolvable | null> {
  const fsEmojis = (await getEmojis()).fightingStyles;
  const emoji = fsEmojis[fsName];

  return emoji ? Formatter.emojiMention(emoji.id, emoji.name) : null;
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

export async function emojiToMagicEnum(
  emoji: EmojiResolvable | null
): Promise<MagicsEnum | null> {
  if (!emoji) return null;

  const magicEmojis = (await getEmojis()).magics;

  const emojiText =
    typeof emoji === "string"
      ? emoji
      : Formatter.emojiMention(
          emoji.id ?? "",
          emoji.name ?? "",
          emoji.animated
        );

  for (const [key, value] of Object.entries(magicEmojis)) {
    if (Formatter.emojiMention(value.id, value.name) === emojiText) {
      return magicNameToEnum(key);
    }
  }

  return null;
}

export async function emojiToFsEnum(
  emoji: EmojiResolvable | null
): Promise<FightingStylesEnum | null> {
  if (!emoji) return null;

  const fsEmojis = (await getEmojis()).fightingStyles;

  const emojiText =
    typeof emoji === "string"
      ? emoji
      : Formatter.emojiMention(
          emoji.id ?? "",
          emoji.name ?? "",
          emoji.animated
        );

  for (const [key, value] of Object.entries(fsEmojis)) {
    if (Formatter.emojiMention(value.id, value.name) === emojiText) {
      return fsNameToEnum(key);
    }
  }

  return null;
}

export function emojiResolvableToText(emoji: EmojiResolvable): EmojiResolvable {
  if (typeof emoji === "string") return emoji;

  return Formatter.emojiMention(
    emoji.id ?? "",
    emoji.name ?? "",
    emoji.animated
  );
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
 * @returns An EmojiResolvable object type
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

export function containsEmoji(str: string): boolean {
  return /\p{Extended_Pictographic}/gu.test(str);
}
