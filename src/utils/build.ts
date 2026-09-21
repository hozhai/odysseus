import { CommandContext, Embed } from "seyfert";
import {
  EMPTY_BOOTS_ID,
  EMPTY_CHESTPLATE_ID,
  EMPTY_ENCHANTMENT_ID,
  EMPTY_MODIFIER_ID,
} from "../constants";
import { type Player, type Slot } from "../types";
import type { APIEmbedField } from "seyfert/lib/types";

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

export function unhashBuildCode(code: string): Player {
  const slotCodeArray = code.split("|").map((section) => section.split(","));

  if (slotCodeArray.length < 8) {
    throw new Error(
      `Invalid build code format: expected at least 8 sections, got ${slotCodeArray.length}`
    );
  }

  const player = createEmptyPlayer();
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
    6
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

export function parsePlayerIntoEmbed(
  ctx: CommandContext,
  player: Player
): Embed {
  const embed = new Embed();

  embed.setTitle(`${ctx.author.username}'s build`);

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

  const magicFsString = "";

  player.magics.forEach((_magic) => {
    // todo
  });

  fields.push({
    name: "Magics/Fighting Styles",
    value: magicFsString,
    inline: true,
  });

  embed.setFields(fields);

  return embed;
}
