import type { APIMessageComponentEmoji } from "seyfert/lib/types";
import { type Enchant, type Gem, type Modifier } from "../types";
import { getData } from "../data/load";
import {
  EMPTY_ENCHANTMENT_ID,
  EMPTY_GEM_ID,
  EMPTY_MODIFIER_ID,
} from "../constants";
import { FightingStylesEnum, MagicsEnum } from "./build";

/**
 * Turns an enchant item type to a APIMessageComponentEmoji
 * @param enchantItem
 * @returns { APIMessageComponentEmoji}
 */
export function itemEnchantToEmoji(
  enchantItem: Enchant
): APIMessageComponentEmoji | null {
  switch (enchantItem.name) {
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

export function itemModifierToEmoji(
  modifierItem: Modifier
): APIMessageComponentEmoji | null {
  switch (modifierItem.name) {
    case "Abyssal":
      return { name: "abyssal", id: "1393733751279718591" };
    case "Archaic":
      return { name: "archaic", id: "1393733752877744178" };
    case "Atlantean Essence":
      return { name: "atlantean", id: "1393733755088404665" };
    case "Blasted":
      return { name: "blasted", id: "1393733757537882144" };
    case "Crystalline":
      return { name: "crystalline", id: "1393733759114936443" };
    case "Drowned":
      return { name: "drowned", id: "1393733760670896128" };
    case "Frozen":
      return { name: "frozen", id: "1393733762541682870" };
    case "Sandy":
      return { name: "sandy", id: "1393733763938386000" };
    case "Superheated":
      return { name: "superheated", id: "1393733766517887006" };
    default:
      return null;
  }
}

export function itemGemToEmoji(gemItem: Gem): APIMessageComponentEmoji | null {
  switch (gemItem.name) {
    case "Defense Gem":
      return { name: "defensegem", id: "1393733031927349268" };
    case "Power Gem":
      return { name: "powergem", id: "1393733189289115710" };
    case "Attack Speed Gem":
      return { name: "attackspeedgem", id: "1393733075699105943" };
    case "Attack Size Gem":
      return { name: "attacksizegem", id: "1393733045210845336" };
    case "Agility Gem":
      return { name: "agilitygem", id: "1393733033659469926" };
    case "Intensity Gem":
      return { name: "intensitygem", id: "1393733041079324734" };
    case "Lapiz Lazuli":
      return { name: "lapislazuli", id: "1393733050508251177" };
    case "Larimar":
      return { name: "larimar", id: "1393733187091435520" };
    case "Agate":
      return { name: "agate", id: "1393733030019076177" };
    case "Malachite":
      return { name: "malachite", id: "1393733054895231077" };
    case "Candelaria":
      return { name: "candelaria", id: "1393733039049408657" };
    case "Morenci":
      return { name: "morenci", id: "1393733059039465562" };
    case "Painite":
      return { name: "painite", id: "1393733069969817762" };
    case "Kyanite":
      return { name: "kyanite", id: "1393733049115611136" };
    case "Variscite":
      return { name: "variscite", id: "1393733193798123560" };
    case "Perfect Azurite":
      return { name: "azurite", id: "1393733037447184394" };
    case "Perfect Aventurine":
      return { name: "aventurine", id: "1393733035450699910" };
    case "Perfect Fire Opal":
      return { name: "fireopal", id: "1393733046792093837" };
    default:
      return null;
  }
}

export function magicToEmoji(
  magic: MagicsEnum
): APIMessageComponentEmoji | null {
  switch (magic) {
    case MagicsEnum.Acid:
      return { name: "acid", id: "1393706537419145378" };
    case MagicsEnum.Ash:
      return { name: "ash", id: "1393706539273162842" };
    case MagicsEnum.Crystal:
      return { name: "crystal", id: "1393706540850090064" };
    case MagicsEnum.Earth:
      return { name: "earth", id: "1393706543157088307" };
    case MagicsEnum.Explosion:
      return { name: "explosion", id: "1393706544926949516" };
    case MagicsEnum.Fire:
      return { name: "fire", id: "1393706546453544980" };
    case MagicsEnum.Glass:
      return { name: "glass", id: "1393706547950915666" };
    case MagicsEnum.Ice:
      return { name: "ice", id: "1393706549716717628" };
    case MagicsEnum.Light:
      return { name: "light", id: "1393706551495233629" };
    case MagicsEnum.Lightning:
      return { name: "lightning", id: "1393706553650974831" };
    case MagicsEnum.Magma:
      return { name: "magma", id: "1393706555572224030" };
    case MagicsEnum.Metal:
      return { name: "metal", id: "1393706594142916808" };
    case MagicsEnum.Plasma:
      return { name: "plasma", id: "1393706559401365674" };
    case MagicsEnum.Poison:
      return { name: "poison", id: "1393706598400135238" };
    case MagicsEnum.Sand:
      return { name: "sand", id: "1393706514249810062" };
    case MagicsEnum.Shadow:
      return { name: "shadow", id: "1393706515747180596" };
    case MagicsEnum.Snow:
      return { name: "snow", id: "1393706517718372402" };
    case MagicsEnum.Water:
      return { name: "water", id: "1393706519442489446" };
    case MagicsEnum.Wind:
      return { name: "wind", id: "1393706520889397360" };
    case MagicsEnum.Wood:
      return { name: "wood", id: "1393706523032682619" };
    default:
      return null;
  }
}

export function fsToEmoji(
  fs: FightingStylesEnum
): APIMessageComponentEmoji | null {
  switch (fs) {
    case FightingStylesEnum.BasicCombat:
      return { name: "basiccombat", id: "1393706037227556864" };
    case FightingStylesEnum.Boxing:
      return { name: "boxing", id: "1393706038892560626" };
    case FightingStylesEnum.IronLeg:
      return { name: "ironleg", id: "1393706043057504378" };
    case FightingStylesEnum.CannonFist:
      return { name: "cannonfist", id: "1393706041124061386" };
    case FightingStylesEnum.PowderFist:
      return { name: "powderfist", id: "1393706044743483402" };
    case FightingStylesEnum.SailorStyle:
      return { name: "sailorstyle", id: "1393706011428393031" };
    case FightingStylesEnum.ThermoFist:
      return { name: "thermofist", id: "1393706015010324572" };
    case FightingStylesEnum.VanishingStyle:
      return { name: "vanishingstyle", id: "1393706016486457374" };
    default:
      return null;
  }
}

export function textToEmoji(
  emojiText: string
): APIMessageComponentEmoji | null {
  if (emojiText === "" || !emojiText) {
    return null;
  }

  const name_and_id = emojiText
    .substring(1, emojiText.length - 1)
    .split(":")
    .slice(1);

  return { name: name_and_id[0], id: name_and_id[1] };
}

export async function emojiToGem(
  emoji: APIMessageComponentEmoji | null
): Promise<Gem | null> {
  const gemsData = (await getData()).gems;

  if (emoji == null) {
    return gemsData[EMPTY_GEM_ID] ?? null;
  }

  const gem = Object.values(gemsData).find((gem) => {
    const gemEmoji = itemGemToEmoji(gem);
    return (
      gemEmoji?.name === emoji.name && (!emoji.id || gemEmoji?.id === emoji.id)
    );
  });

  return gem ?? null;
}

export async function emojiToEnchant(
  emoji: APIMessageComponentEmoji | null
): Promise<Enchant | null> {
  const enchantData = (await getData()).enchants;

  if (emoji == null) {
    return (
      Object.values(enchantData).filter(
        (val) => val.id === EMPTY_ENCHANTMENT_ID
      )[0] ?? null
    );
  }

  const enchant = Object.values(enchantData)
    .filter((val) => val.mainType === "Enchant")
    .find((enchant) => {
      const enchantEmoji = itemEnchantToEmoji(enchant);
      return (
        enchantEmoji?.name === emoji.name &&
        (!emoji.id || enchantEmoji?.id === emoji.id)
      );
    });

  return enchant ?? null;
}

export async function emojiToModifier(
  emoji: APIMessageComponentEmoji | null
): Promise<Modifier | null> {
  const modifierData = (await getData()).modifiers;

  if (emoji == null) {
    return (
      Object.values(modifierData).filter(
        (val) => val.id === EMPTY_MODIFIER_ID
      )[0] ?? null
    );
  }

  const modifier = Object.values(modifierData)
    .filter((val) => val.mainType === "Modifier")
    .find((modifier) => {
      const modifierEmoji = itemModifierToEmoji(modifier);
      return (
        modifierEmoji?.name === emoji.name &&
        (!emoji.id || modifierEmoji?.id === emoji.id)
      );
    });

  return modifier ?? null;
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
