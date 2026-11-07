import { CommandContext, Embed } from "seyfert";
import {
  EMBED_COLOR_DEFAULT,
  EMPTY_BOOTS_ID,
  EMPTY_CHESTPLATE_ID,
  EMPTY_ENCHANTMENT_ID,
  EMPTY_MODIFIER_ID,
} from "@constants";
import { type Player, type Slot } from "@src-types";
import type { APIEmbedField } from "seyfert/lib/types";
import { fsToEmoji, magicToEmoji } from "@utils";
import type { EmojiResolvable } from "seyfert/lib/common";

export enum MagicsEnum {
  Acid = 0,
  Ash = 1,
  Crystal = 2,
  Earth = 3,
  Explosion = 4,
  Fire = 5,
  Glass = 6,
  Ice = 7,
  Light = 8,
  Lightning = 9,
  Magma = 10,
  Metal = 11,
  Plasma = 12,
  Poison = 13,
  Sand = 14,
  Shadow = 15,
  Snow = 16,
  Water = 17,
  Wind = 18,
  Wood = 19,
}

export enum FightingStylesEnum {
  BasicCombat = 20,
  Boxing = 21,
  IronLeg = 22,
  CannonFist = 23,
  PowderFist = 24,
  SailorStyle = 25,
  ThermoFist = 26,
  VanishingStyle = 27,
}

export function createEmptyPlayer(): Player {
  const player: Player = {
    level: 0,
    vitalityPoints: 0,
    magicPoints: 0,
    strengthPoints: 0,
    weaponPoints: 0,
    magics: [],
    fightingStyles: [],
    accessories: [],
    chestplate: {
      item_id: EMPTY_CHESTPLATE_ID,
      gem_ids: [],
      enchant_id: EMPTY_ENCHANTMENT_ID,
      modifier_id: EMPTY_MODIFIER_ID,
      level: 0,
    },
    boots: {
      item_id: EMPTY_BOOTS_ID,
      gem_ids: [],
      enchant_id: EMPTY_ENCHANTMENT_ID,
      modifier_id: EMPTY_MODIFIER_ID,
      level: 0,
    },
  };

  return player;
}

export function unhashBuildCode(code: string | undefined): Player {
  const player = createEmptyPlayer();

  if (!code) {
    return player;
  }

  const slotCodeArray = code.split("|").map((section) => section.split(","));

  if (slotCodeArray.length < 8) {
    throw new Error(
      `Invalid build code format: expected at least 8 sections, got ${slotCodeArray.length}`
    );
  }

  const stats = getRequiredSection(slotCodeArray, 0);

  if (stats.length < 5) {
    throw new Error(
      `Invalid stats section: expected 5 values, got ${stats.length}`
    );
  }

  const parseInteger = (value: string, description: string): number => {
    if (!/^-?\d+$/.test(value)) {
      throw new Error(`Failed to parse ${description}: ${value}`);
    }

    return Number(value);
  };

  player.level = parseInteger(stats[0] ?? "", "player level");
  player.vitalityPoints = parseInteger(stats[1] ?? "", "vitality points");
  player.magicPoints = parseInteger(stats[2] ?? "", "magic points");
  player.strengthPoints = parseInteger(stats[3] ?? "", "strength points");
  player.weaponPoints = parseInteger(stats[4] ?? "", "weapon points");

  const magicIndexes = parseIndexes(
    getRequiredSection(slotCodeArray, 1),
    "magic",
    20
  );
  player.magics = magicIndexes;

  const fightingStyleIndexes = parseIndexes(
    getRequiredSection(slotCodeArray, 2),
    "fighting style",
    8
  );
  player.fightingStyles = fightingStyleIndexes.map((index) => index + 20);

  player.accessories = [
    parseItemSlot(getRequiredSection(slotCodeArray, 3)),
    parseItemSlot(getRequiredSection(slotCodeArray, 4)),
    parseItemSlot(getRequiredSection(slotCodeArray, 5)),
  ];
  player.chestplate = parseItemSlot(getRequiredSection(slotCodeArray, 6));
  player.boots = parseItemSlot(getRequiredSection(slotCodeArray, 7));

  return player;
}

function getRequiredSection(sections: string[][], index: number): string[] {
  const section = sections[index];
  if (!section) {
    throw new Error(`Invalid build code: missing section ${index}`);
  }

  return section;
}

function parseIndexes(
  values: string[],
  description: string,
  maxExclusive: number
): number[] {
  if (values.length === 0 || values[0] === "") {
    return [];
  }

  return values
    .filter((value) => value !== "")
    .map((value) => {
      if (!/^\d+$/.test(value)) {
        throw new Error(`Failed to parse ${description} index: ${value}`);
      }

      const index = Number(value);
      if (index >= maxExclusive) {
        throw new Error(`Invalid ${description} index: ${index}`);
      }

      return index;
    });
}

function parseItemSlot(values: string[]): Slot {
  if (values.length < 4) {
    throw new Error(
      `Invalid item slot: expected at least 4 values, got ${values.length}`
    );
  }

  const levelValue = values[values.length - 1] ?? "";
  if (!/^\d+$/.test(levelValue)) {
    throw new Error(`Failed to parse item level: ${levelValue}`);
  }

  return {
    item_id: values[0] ?? "",
    enchant_id: values[1] || EMPTY_ENCHANTMENT_ID,
    modifier_id: values[2] || EMPTY_MODIFIER_ID,
    gem_ids: values.slice(3, -1).filter((id) => id !== ""),
    level: Number(levelValue),
  };
}

export async function parsePlayerIntoEmbed(
  ctx: CommandContext,
  player: Player
): Promise<Embed> {
  const embed = new Embed();

  embed.setTitle(`${ctx.author.username}'s build`);
  embed.setColor(EMBED_COLOR_DEFAULT);

  const fields: APIEmbedField[] = [];

  fields.push({
    name: "Level",
    value: player.level.toString(),
    inline: true,
  });

  fields.push({
    name: "Stat Allocation",
    value: `🟨 ${player.vitalityPoints} 🟦 ${player.magicPoints} 🟥 ${player.strengthPoints} ⬜️ ${player.weaponPoints}`,
    inline: true,
  });

  let magicFsString = "";

  for (const magic of player.magics) {
    const magicEmoji: EmojiResolvable | null = await magicToEmoji(
      magicEnumToName(magic as MagicsEnum)
    );
    if (!magicEmoji) continue;
    magicFsString += magicEmoji as string;
  }

  for (const fs of player.fightingStyles) {
    const fsEmoji: EmojiResolvable | null = await fsToEmoji(
      fsEnumToName(fs as FightingStylesEnum)
    );
    if (!fsEmoji) continue;
    magicFsString += fsEmoji as string;
  }

  fields.push({
    name: "Magics/Fighting Styles",
    value: magicFsString,
    inline: true,
  });

  embed.setFields(fields);

  return embed;
}

function magicEnumToName(magic: MagicsEnum): string {
  switch (magic) {
    case MagicsEnum.Acid:
      return "Acid";
    case MagicsEnum.Ash:
      return "Ash";
    case MagicsEnum.Crystal:
      return "Crystal";
    case MagicsEnum.Earth:
      return "Earth";
    case MagicsEnum.Explosion:
      return "Explosion";
    case MagicsEnum.Fire:
      return "Fire";
    case MagicsEnum.Glass:
      return "Glass";
    case MagicsEnum.Ice:
      return "Ice";
    case MagicsEnum.Light:
      return "Light";
    case MagicsEnum.Lightning:
      return "Lightning";
    case MagicsEnum.Magma:
      return "Magma";
    case MagicsEnum.Metal:
      return "Metal";
    case MagicsEnum.Plasma:
      return "Plasma";
    case MagicsEnum.Poison:
      return "Poison";
    case MagicsEnum.Sand:
      return "Sand";
    case MagicsEnum.Shadow:
      return "Shadow";
    case MagicsEnum.Snow:
      return "Snow";
    case MagicsEnum.Water:
      return "Water";
    case MagicsEnum.Wind:
      return "Wind";
    case MagicsEnum.Wood:
      return "Wood";
  }
}

function fsEnumToName(fs: FightingStylesEnum): string {
  switch (fs) {
    case FightingStylesEnum.BasicCombat:
      return "Basic Combat";
    case FightingStylesEnum.Boxing:
      return "Boxing";
    case FightingStylesEnum.IronLeg:
      return "Iron Leg";
    case FightingStylesEnum.CannonFist:
      return "Cannon Fist";
    case FightingStylesEnum.PowderFist:
      return "Powder Fist";
    case FightingStylesEnum.SailorStyle:
      return "Sailor Style";
    case FightingStylesEnum.ThermoFist:
      return "Thermo Fist";
    case FightingStylesEnum.VanishingStyle:
      return "Vanishing Style";
  }
}

export function magicNameToEnum(name: string): MagicsEnum | null {
  switch (name) {
    case "Acid":
      return MagicsEnum.Acid;
    case "Ash":
      return MagicsEnum.Ash;
    case "Crystal":
      return MagicsEnum.Crystal;
    case "Earth":
      return MagicsEnum.Earth;
    case "Explosion":
      return MagicsEnum.Explosion;
    case "Fire":
      return MagicsEnum.Fire;
    case "Glass":
      return MagicsEnum.Glass;
    case "Ice":
      return MagicsEnum.Ice;
    case "Light":
      return MagicsEnum.Light;
    case "Lightning":
      return MagicsEnum.Lightning;
    case "Magma":
      return MagicsEnum.Magma;
    case "Metal":
      return MagicsEnum.Metal;
    case "Plasma":
      return MagicsEnum.Plasma;
    case "Poison":
      return MagicsEnum.Poison;
    case "Sand":
      return MagicsEnum.Sand;
    case "Shadow":
      return MagicsEnum.Shadow;
    case "Snow":
      return MagicsEnum.Snow;
    case "Water":
      return MagicsEnum.Water;
    case "Wind":
      return MagicsEnum.Wind;
    case "Wood":
      return MagicsEnum.Wood;
    default:
      return null;
  }
}

export function fsNameToEnum(name: string): FightingStylesEnum | null {
  switch (name) {
    case "Basic Combat":
      return FightingStylesEnum.BasicCombat;
    case "Boxing":
      return FightingStylesEnum.Boxing;
    case "Iron Leg":
      return FightingStylesEnum.IronLeg;
    case "Cannon Fist":
      return FightingStylesEnum.CannonFist;
    case "Powder Fist":
      return FightingStylesEnum.PowderFist;
    case "Sailor Style":
      return FightingStylesEnum.SailorStyle;
    case "Thermo Fist":
      return FightingStylesEnum.ThermoFist;
    case "Vanishing Style":
      return FightingStylesEnum.VanishingStyle;
    default:
      return null;
  }
}
