import { APIMessageComponentEmoji } from "seyfert/lib/types";
import {
  COLOR_COMMON,
  COLOR_EXOTIC,
  COLOR_RARE,
  COLOR_UNCOMMON,
} from "../constants";
import { Rarity, Slot } from "../types";
import { InMessageEmbed } from "seyfert";

/**
 * Get's the color of a rarity given the rarity.
 *
 * @param rarity A rarity that can be "Common", "Uncommon", "Rare", or "Exotic" (case-sensitive)
 * @returns {number} A hexadecimal number
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

/**
 *
 * @param enchant
 * @returns { APIMessageComponentEmoji}
 */
export function itemEnchantToEmoji(
  enchant: string,
): APIMessageComponentEmoji | null {
  switch (enchant) {
    case "Deadeye":
      return { name: "agile", id: "1393732132588752946" };
    case "Brisk":
      return { name: "brisk", id: "1393732137315733564" };
    case "Enhanced":
      return { name: "enhanced", id: "1393732142772781076" };
    case "Amplified":
      return { name: "amplified", id: "1393732134249828422" };
    case "Powerful":
      return { name: "powerful", id: "1393732190595973180" };
    case "Hasty":
      return { name: "hasty", id: "1393732148699332718" };
    case "Strong":
      return { name: "strong", id: "1393732208673685615" };
    case "Nimble":
      return { name: "nimble", id: "1393732189136359656" };
    case "Hard":
      return { name: "hard", id: "1393732146514100334" };
    case "Bursting":
      return { name: "bursting", id: "1393732138754375801" };
    case "Healing":
      return { name: "healing", id: "1393732150288711690" };
    case "Piercing":
      return { name: "piercing", id: "1393732154491408507" };
    case "Charged":
      return { name: "charged", id: "1393732140533026846" };
    case "Explosive":
      return { name: "explosive", id: "1393732144869806151" };
    case "Armored":
      return { name: "armored", id: "1393732135604584489" };
    case "Virtuous":
      return { name: "virtuous", id: "1393732213480099940" };
    case "Swift":
      return { name: "swift", id: "1393732211379011624" };
    case "Resilience":
      return { name: "resilience", id: "1393732207155216404" };
    default:
      return null;
  }
}

function parseEmbedIntoItem(embed: InMessageEmbed): Slot {
  const item_id = embed.title.split(" | ")[1];
  const gemEmojis = embed.fields
    .find((field) => field.name === "Gems")
    ?.value.split(" ");
  const enchantEmoji = embed.fields.find(
    (field) => field.name === "Enchant",
  )?.value;
  const modifierEmoji = embed.fields.find(
    (field) => field.name === "Modifier",
  )?.value;

  // TODO
}
