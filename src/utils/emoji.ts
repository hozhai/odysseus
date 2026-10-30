import type { APIMessageComponentEmoji } from "seyfert/lib/types";
import { getData } from "../data/loadData";
import {
  EMPTY_ENCHANTMENT_ID,
  EMPTY_GEM_ID,
  EMPTY_MODIFIER_ID,
} from "../constants";
import { FightingStylesEnum, MagicsEnum } from "./build";
import { Formatter } from "seyfert";
import type { EmojiResolvable } from "seyfert/lib/common";
import type { Enchant, Gem, Modifier } from "../data/schemas";

/**
 * Turns an enchant item type to a APIMessageComponentEmoji
 * @param enchantItem
 */
export function itemEnchantToEmoji(
  enchantItem: Enchant
): EmojiResolvable | null {
  switch (enchantItem.name) {
    case "Deadeye":
      return Formatter.emojiMention("1393732132588752946", "agile");
    case "Brisk":
      return Formatter.emojiMention("1393732137315733564", "brisk");
    case "Enhanced":
      return Formatter.emojiMention("1393732142772781076", "enhanced");
    case "Amplified":
      return Formatter.emojiMention("1393732134249828422", "amplified");
    case "Powerful":
      return Formatter.emojiMention("1393732190595973180", "powerful");
    case "Hasty":
      return Formatter.emojiMention("1393732148699332718", "hasty");
    case "Strong":
      return Formatter.emojiMention("1393732208673685615", "strong");
    case "Nimble":
      return Formatter.emojiMention("1393732189136359656", "nimble");
    case "Hard":
      return Formatter.emojiMention("1393732146514100334", "hard");
    case "Bursting":
      return Formatter.emojiMention("1393732138754375801", "bursting");
    case "Healing":
      return Formatter.emojiMention("1393732150288711690", "healing");
    case "Piercing":
      return Formatter.emojiMention("1393732154491408507", "piercing");
    case "Charged":
      return Formatter.emojiMention("1393732140533026846", "charged");
    case "Explosive":
      return Formatter.emojiMention("1393732144869806151", "explosive");
    case "Armored":
      return Formatter.emojiMention("1393732135604584489", "armored");
    case "Virtuous":
      return Formatter.emojiMention("1393732213480099940", "virtuous");
    case "Swift":
      return Formatter.emojiMention("1393732211379011624", "swift");
    case "Resilience":
      return Formatter.emojiMention("1393732207155216404", "resilience");
    default:
      return null;
  }
}

export function itemModifierToEmoji(
  modifierItem: Modifier
): EmojiResolvable | null {
  switch (modifierItem.name) {
    case "Abyssal":
      return Formatter.emojiMention("1393733751279718591", "abyssal");
    case "Archaic":
      return Formatter.emojiMention("1393733752877744178", "archaic");
    case "Atlantean Essence":
      return Formatter.emojiMention("1393733755088404665", "atlantean");
    case "Blasted":
      return Formatter.emojiMention("1393733757537882144", "blasted");
    case "Crystalline":
      return Formatter.emojiMention("1393733759114936443", "crystalline");
    case "Drowned":
      return Formatter.emojiMention("1393733760670896128", "drowned");
    case "Frozen":
      return Formatter.emojiMention("1393733762541682870", "frozen");
    case "Sandy":
      return Formatter.emojiMention("1393733763938386000", "sandy");
    case "Superheated":
      return Formatter.emojiMention("1393733766517887006", "superheated");
    default:
      return null;
  }
}

export function itemGemToEmoji(gemItem: Gem): EmojiResolvable | null {
  switch (gemItem.name) {
    case "Defense Gem":
      return Formatter.emojiMention("1393733031927349268", "defensegem");
    case "Power Gem":
      return Formatter.emojiMention("1393733189289115710", "powergem");
    case "Attack Speed Gem":
      return Formatter.emojiMention("1393733075699105943", "attackspeedgem");
    case "Attack Size Gem":
      return Formatter.emojiMention("1393733045210845336", "attacksizegem");
    case "Agility Gem":
      return Formatter.emojiMention("1393733033659469926", "agilitygem");
    case "Intensity Gem":
      return Formatter.emojiMention("1393733041079324734", "intensitygem");
    case "Lapiz Lazuli":
      return Formatter.emojiMention("1393733050508251177", "lapislazuli");
    case "Larimar":
      return Formatter.emojiMention("1393733187091435520", "larimar");
    case "Agate":
      return Formatter.emojiMention("1393733030019076177", "agate");
    case "Malachite":
      return Formatter.emojiMention("1393733054895231077", "malachite");
    case "Candelaria":
      return Formatter.emojiMention("1393733039049408657", "candelaria");
    case "Morenci":
      return Formatter.emojiMention("1393733059039465562", "morenci");
    case "Painite":
      return Formatter.emojiMention("1393733069969817762", "painite");
    case "Kyanite":
      return Formatter.emojiMention("1393733049115611136", "kyanite");
    case "Variscite":
      return Formatter.emojiMention("1393733193798123560", "variscite");
    case "Perfect Azurite":
      return Formatter.emojiMention("1393733037447184394", "azurite");
    case "Perfect Aventurine":
      return Formatter.emojiMention("1393733035450699910", "aventurine");
    case "Perfect Fire Opal":
      return Formatter.emojiMention("1393733046792093837", "fireopal");
    default:
      return null;
  }
}

export function magicToEmoji(magic: MagicsEnum): EmojiResolvable | null {
  switch (magic) {
    case MagicsEnum.Acid:
      return Formatter.emojiMention("1393706537419145378", "acid");
    case MagicsEnum.Ash:
      return Formatter.emojiMention("1393706539273162842", "ash");
    case MagicsEnum.Crystal:
      return Formatter.emojiMention("1393706540850090064", "crystal");
    case MagicsEnum.Earth:
      return Formatter.emojiMention("1393706543157088307", "earth");
    case MagicsEnum.Explosion:
      return Formatter.emojiMention("1393706544926949516", "explosion");
    case MagicsEnum.Fire:
      return Formatter.emojiMention("1393706546453544980", "fire");
    case MagicsEnum.Glass:
      return Formatter.emojiMention("1393706547950915666", "glass");
    case MagicsEnum.Ice:
      return Formatter.emojiMention("1393706549716717628", "ice");
    case MagicsEnum.Light:
      return Formatter.emojiMention("1393706551495233629", "light");
    case MagicsEnum.Lightning:
      return Formatter.emojiMention("1393706553650974831", "lightning");
    case MagicsEnum.Magma:
      return Formatter.emojiMention("1393706555572224030", "magma");
    case MagicsEnum.Metal:
      return Formatter.emojiMention("1393706594142916808", "metal");
    case MagicsEnum.Plasma:
      return Formatter.emojiMention("1393706559401365674", "plasma");
    case MagicsEnum.Poison:
      return Formatter.emojiMention("1393706598400135238", "poison");
    case MagicsEnum.Sand:
      return Formatter.emojiMention("1393706514249810062", "sand");
    case MagicsEnum.Shadow:
      return Formatter.emojiMention("1393706515747180596", "shadow");
    case MagicsEnum.Snow:
      return Formatter.emojiMention("1393706517718372402", "snow");
    case MagicsEnum.Water:
      return Formatter.emojiMention("1393706519442489446", "water");
    case MagicsEnum.Wind:
      return Formatter.emojiMention("1393706520889397360", "wind");
    case MagicsEnum.Wood:
      return Formatter.emojiMention("1393706523032682619", "wood");
    default:
      return null;
  }
}

export function fsToEmoji(fs: FightingStylesEnum): EmojiResolvable | null {
  switch (fs) {
    case FightingStylesEnum.BasicCombat:
      return Formatter.emojiMention("1393706037227556864", "basiccombat");
    case FightingStylesEnum.Boxing:
      return Formatter.emojiMention("1393706038892560626", "boxing");
    case FightingStylesEnum.IronLeg:
      return Formatter.emojiMention("1393706043057504378", "ironleg");
    case FightingStylesEnum.CannonFist:
      return Formatter.emojiMention("1393706041124061386", "cannonfist");
    case FightingStylesEnum.PowderFist:
      return Formatter.emojiMention("1393706044743483402", "powderfist");
    case FightingStylesEnum.SailorStyle:
      return Formatter.emojiMention("1393706011428393031", "sailorstyle");
    case FightingStylesEnum.ThermoFist:
      return Formatter.emojiMention("1393706015010324572", "thermofist");
    case FightingStylesEnum.VanishingStyle:
      return Formatter.emojiMention("1393706016486457374", "vanishingstyle");
    default:
      return null;
  }
}

export async function emojiToGem(
  emoji: EmojiResolvable | null
): Promise<Gem | null> {
  const gemsData = (await getData()).gems;

  if (emoji === null) {
    return gemsData[EMPTY_GEM_ID] ?? null;
  }

  const gem = Object.values(gemsData).find((gem) => {
    const gemEmoji = itemGemToEmoji(gem);
    return (
      gemEmoji ===
      (typeof emoji === "string"
        ? emoji
        : Formatter.emojiMention(
            emoji.id ?? "",
            emoji.name ?? "",
            emoji.animated
          ))
    );
  });

  return gem ?? null;
}

export async function emojiToEnchant(
  emoji: EmojiResolvable | null
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
        enchantEmoji ===
        (typeof emoji === "string"
          ? emoji
          : Formatter.emojiMention(
              emoji.id ?? "",
              emoji.name ?? "",
              emoji.animated
            ))
      );
    });

  return enchant ?? null;
}

export async function emojiToModifier(
  emoji: EmojiResolvable | null
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
        modifierEmoji ===
        (typeof emoji === "string"
          ? emoji
          : Formatter.emojiMention(
              emoji.id ?? "",
              emoji.name ?? "",
              emoji.animated
            ))
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
