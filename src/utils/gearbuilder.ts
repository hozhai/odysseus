import type { Player, Slot } from "@src-types";
import {
  getData,
  getEmojis,
  type Enchant,
  type Gem,
  type Item,
  type MainType,
  type Modifier,
} from "@data";
import Fuse from "fuse.js/basic";
import {
  ActionRow,
  Button,
  ButtonStyle,
  ComponentType,
  Container,
  Formatter,
  Section,
  Separator,
  TextDisplay,
  type TopLevelComponents,
  type ComponentContext,
} from "seyfert";
import type { ComponentsV2Components } from "@/types/seyfert";
import {
  createEmptyPlayer,
  emojiTextToResolvable,
  emojiToEnchant,
  emojiToModifier,
  FightingStylesEnum,
  fsToEmoji,
  findEnchantById,
  findGemById,
  findItemById,
  findModifierById,
  itemEnchantToEmoji,
  itemGemToEmoji,
  itemModifierToEmoji,
  magicToEmoji,
  MagicsEnum,
} from "@utils";
import { findItemByName } from "@utils";
import {
  EMBED_FOOTER,
  EMPTY_ACCESSORY_ID,
  EMPTY_CHESTPLATE_ID,
  EMPTY_ENCHANTMENT_ID,
  EMPTY_GEM_ID,
  EMPTY_MODIFIER_ID,
  EMPTY_PANTS_ID,
} from "@constants";
import {
  containsEmoji,
  emojiToFsEnum,
  emojiToGem,
  emojiToMagicEnum,
} from "@utils";

export async function findItemsFromQuery(
  query: string,
  mainType: MainType
): Promise<Item[]> {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) {
    return [];
  }

  const items = (await getData()).items;

  const fuse = new Fuse(Object.values(items), {
    keys: ["name"],
  });

  return fuse
    .search(normalizedQuery)
    .filter((result) => result.item.mainType === mainType)
    .slice(0, 5)
    .map(({ item }) => item);
}

export async function findEnchantsFromQuery(query: string): Promise<Enchant[]> {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) {
    return [];
  }

  const enchants = (await getData()).enchants;

  const fuse = new Fuse(Object.values(enchants), {
    keys: ["name"],
  });

  return fuse
    .search(normalizedQuery)
    .slice(0, 5)
    .map(({ item }) => item);
}

export async function findGemsFromQuery(query: string): Promise<Gem[]> {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) {
    return [];
  }

  const gems = (await getData()).gems;

  const fuse = new Fuse(Object.values(gems), {
    keys: ["name"],
  });

  return fuse
    .search(normalizedQuery)
    .slice(0, 5)
    .map(({ item }) => item);
}

export async function findModifiersFromQuery(
  query: string,
  validModifiers: string[]
): Promise<Modifier[]> {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) {
    return [];
  }

  const modifiers = (await getData()).modifiers;

  const fuse = new Fuse(Object.values(modifiers), {
    keys: ["name"],
  });

  return fuse
    .search(normalizedQuery)
    .slice(0, 5)
    .filter(({ item }) => validModifiers.includes(item.name))
    .map(({ item }) => item);
}

async function parseSlotFromComponentRaw(
  raw: string,
  emptyItemId: string,
  level: number
): Promise<Slot> {
  const [itemName, enchantEmoji, modifierEmoji, gemEmojis] = raw
    .split("\n")
    .map((line) => line.split(": ")[1]?.trim());

  const itemId = (await findItemByName(itemName ?? ""))?.id ?? emptyItemId;
  const gemIds = (
    await Promise.all(
      gemEmojis
        ?.split(" ")
        .map(
          async (gemEmoji) =>
            (await emojiToGem(emojiTextToResolvable(gemEmoji)))?.id ??
            EMPTY_GEM_ID
        ) ?? []
    )
  ).filter((gem_id) => gem_id !== EMPTY_GEM_ID);
  const enchantId =
    (await emojiToEnchant(emojiTextToResolvable(enchantEmoji ?? null)))?.id ??
    EMPTY_ENCHANTMENT_ID;
  const modifierId =
    (await emojiToModifier(emojiTextToResolvable(modifierEmoji ?? null)))?.id ??
    EMPTY_MODIFIER_ID;

  return {
    itemId,
    gemIds,
    enchantId,
    modifierId,
    level,
  };
}

async function parseMagicFsRaw(
  raw: string
): Promise<[MagicsEnum[], FightingStylesEnum[]]> {
  const emojis = raw.split(" ");
  const magics: MagicsEnum[] = [];
  const fs: FightingStylesEnum[] = [];

  for (const emoji of emojis) {
    const possibleMagicEnum = await emojiToMagicEnum(emoji);
    const possibleFsEnum = await emojiToFsEnum(emoji);

    if (possibleMagicEnum !== null) {
      magics.push(possibleMagicEnum);
      continue;
    }

    if (possibleFsEnum !== null) {
      fs.push(possibleFsEnum);
    }
  }

  return [magics, fs];
}

export async function parseGearbuilderComponentsIntoPlayer(
  components: ComponentsV2Components
): Promise<Player> {
  const emojis = await getEmojis();
  const itemFallbackText =
    "Item: Unset\nEnchant: Unset\nModifier: Unset\nGem(s): Unset";

  const player = createEmptyPlayer();
  const container = components[0];

  if (!container || container.type !== ComponentType.Container) return player;

  const sections = container.components.filter(
    (component) => component.type === ComponentType.Section
  );

  // components[1] is the second textdisplay in each section
  // (which has the data)
  const accessoryOneRaw =
    sections[0]?.components[1]?.content ?? itemFallbackText;
  const accessoryTwoRaw =
    sections[1]?.components[1]?.content ?? itemFallbackText;
  const accessoryThreeRaw =
    sections[2]?.components[1]?.content ?? itemFallbackText;
  const chestplateRaw = sections[3]?.components[1]?.content ?? itemFallbackText;
  const pantsRaw = sections[4]?.components[1]?.content ?? itemFallbackText;

  const magicFsRaw =
    sections[5]?.components[1]?.content ??
    Formatter.emojiMention(
      emojis.magics["Acid"]?.id ?? "",
      emojis.magics["Acid"]?.name ?? ""
    ) ??
    "";
  const levelRaw = sections[6]?.components[1]?.content;
  const statAllocationRaw =
    sections[7]?.components[1]?.content ?? "🟨 0 🟦 0 🟥 0 ⬜️ 0";

  player.level = Number(levelRaw ?? 175);

  const level = Math.floor(player.level / 10) * 10;
  player.accessories = await Promise.all([
    parseSlotFromComponentRaw(accessoryOneRaw, EMPTY_ACCESSORY_ID, level),
    parseSlotFromComponentRaw(accessoryTwoRaw, EMPTY_ACCESSORY_ID, level),
    parseSlotFromComponentRaw(accessoryThreeRaw, EMPTY_ACCESSORY_ID, level),
  ]);
  player.chestplate = await parseSlotFromComponentRaw(
    chestplateRaw,
    EMPTY_CHESTPLATE_ID,
    level
  );
  player.boots = await parseSlotFromComponentRaw(
    pantsRaw,
    EMPTY_PANTS_ID,
    level
  );

  const [magics, fs] = await parseMagicFsRaw(magicFsRaw);

  player.magics = magics;
  player.fightingStyles = fs;

  const [spiritPoints, magicPoints, strengthPoints, weaponPoints] =
    statAllocationRaw.split(" ").filter((char) => !containsEmoji(char));

  player.vitalityPoints = Number(spiritPoints ?? 0);
  player.magicPoints = Number(magicPoints ?? 0);
  player.strengthPoints = Number(strengthPoints ?? 0);
  player.weaponPoints = Number(weaponPoints ?? 0);

  return player;
}

export function serializeTopLevelComponent(
  component: TopLevelComponents
): ComponentsV2Components[number] {
  switch (component.type) {
    case ComponentType.ActionRow:
    case ComponentType.Container:
    case ComponentType.File:
    case ComponentType.Label:
    case ComponentType.MediaGallery:
    case ComponentType.Section:
    case ComponentType.Separator:
    case ComponentType.TextDisplay:
      return component.toJSON() as ComponentsV2Components[number];
    default:
      throw new Error(
        `Unsupported top-level message component type: ${component.type}`
      );
  }
}

async function slotToRaw(slot: Slot): Promise<string> {
  const item = (await findItemById(slot.itemId)) ?? null;
  const itemName = item?.name ?? "Unset";

  const enchant = (await findEnchantById(slot.enchantId)) ?? null;
  const enchantEmoji =
    enchant && enchant.id !== EMPTY_ENCHANTMENT_ID
      ? await itemEnchantToEmoji(enchant)
      : null;

  const modifier = (await findModifierById(slot.modifierId)) ?? null;
  const modifierEmoji = modifier ? await itemModifierToEmoji(modifier) : null;

  const gemEmojis = (
    await Promise.all(
      slot.gemIds.map(async (gemId) => {
        const gem = await findGemById(gemId);
        return gem ? await itemGemToEmoji(gem) : null;
      })
    )
  )
    .filter((emoji): emoji is string => emoji !== null)
    .join(" ");

  return [
    `Item: ${itemName === "None" ? "Unset" : itemName}`,
    `Enchant: ${(enchantEmoji as string) ?? "Unset"}`,
    `Modifier: ${(modifierEmoji as string) ?? "Unset"}`,
    `Gem(s): ${gemEmojis || "Unset"}`,
  ].join("\n");
}

export async function parsePlayerIntoGearbuilderComponents(
  player: Player,
  authorUsername: string
) {
  const magicEmojis = (await getEmojis()).magics;
  const defaultMagicEmoji = magicEmojis["Acid"];

  if (!defaultMagicEmoji) {
    throw new Error(
      "Default Acid emoji not found while parsing player into GearBuilder components."
    );
  }

  const accessoryRows = await Promise.all(
    player.accessories.map(async (accessory) => await slotToRaw(accessory))
  );

  const magicFsText = (
    await Promise.all([
      ...player.magics.map(async (magic: MagicsEnum) =>
        magicToEmoji(MagicsEnum[magic] ?? "Acid")
      ),
      ...player.fightingStyles.map(async (fightingStyle: FightingStylesEnum) =>
        fsToEmoji(FightingStylesEnum[fightingStyle] ?? "BasicCombat")
      ),
    ])
  )
    .filter(
      (emoji): emoji is string => typeof emoji === "string" && emoji.length > 0
    )
    .join(" ");

  const component = new Container().addComponents(
    new TextDisplay().setContent(`## Gearbuilder`),
    new Section()
      .setComponents(
        new TextDisplay().setContent("Accessory:"),
        new TextDisplay().setContent(
          accessoryRows[0] ??
            "Item: Unset\nEnchant: Unset\nModifier: Unset\nGem(s): Unset"
        )
      )
      .setAccessory(
        new Button()
          .setLabel("Modify")
          .setStyle(ButtonStyle.Secondary)
          .setCustomId("gb_choose_acc_1")
      ),
    new Section()
      .setComponents(
        new TextDisplay().setContent("Accessory:"),
        new TextDisplay().setContent(
          accessoryRows[1] ??
            "Item: Unset\nEnchant: Unset\nModifier: Unset\nGem(s): Unset"
        )
      )
      .setAccessory(
        new Button()
          .setLabel("Modify")
          .setStyle(ButtonStyle.Secondary)
          .setCustomId("gb_choose_acc_2")
      ),
    new Section()
      .setComponents(
        new TextDisplay().setContent("Accessory:"),
        new TextDisplay().setContent(
          accessoryRows[2] ??
            "Item: Unset\nEnchant: Unset\nModifier: Unset\nGem(s): Unset"
        )
      )
      .setAccessory(
        new Button()
          .setLabel("Modify")
          .setStyle(ButtonStyle.Secondary)
          .setCustomId("gb_choose_acc_3")
      ),
    new Section()
      .setComponents(
        new TextDisplay().setContent("Chestplate:"),
        new TextDisplay().setContent(await slotToRaw(player.chestplate))
      )
      .setAccessory(
        new Button()
          .setLabel("Modify")
          .setStyle(ButtonStyle.Secondary)
          .setCustomId("gb_choose_chest")
      ),
    new Section()
      .setComponents(
        new TextDisplay().setContent("Pants:"),
        new TextDisplay().setContent(await slotToRaw(player.boots))
      )
      .setAccessory(
        new Button()
          .setLabel("Modify")
          .setStyle(ButtonStyle.Secondary)
          .setCustomId("gb_choose_pants")
      ),
    new Separator(),
    new Section()
      .setComponents(
        new TextDisplay().setContent("Stat Allocation"),
        new TextDisplay().setContent(
          `🟨 ${player.vitalityPoints} 🟦 ${player.magicPoints} 🟥 ${player.strengthPoints} ⬜️ ${player.weaponPoints}`
        )
      )
      .setAccessory(
        new Button()
          .setLabel("Modify")
          .setStyle(ButtonStyle.Secondary)
          .setCustomId("gb_modify_statalloc")
      ),
    new Section()
      .setComponents(
        new TextDisplay().setContent("Magic/Fighting Styles"),
        new TextDisplay().setContent(
          magicFsText ||
            `${Formatter.emojiMention(defaultMagicEmoji.id, defaultMagicEmoji.name)}`
        )
      )
      .setAccessory(
        new Button()
          .setLabel("Modify")
          .setStyle(ButtonStyle.Secondary)
          .setCustomId("gb_modify_magicfs")
      ),
    new Section()
      .setComponents(
        new TextDisplay().setContent("Player Level"),
        new TextDisplay().setContent(String(player.level || 175))
      )
      .setAccessory(
        new Button()
          .setLabel("Modify")
          .setStyle(ButtonStyle.Secondary)
          .setCustomId("gb_modify_level")
      ),
    new Separator(),
    new ActionRow().addComponents(
      new Button()
        .setLabel("Get Stats")
        .setStyle(ButtonStyle.Success)
        .setCustomId("gb_get")
    ),
    new TextDisplay().setContent(
      `-# ${EMBED_FOOTER} | Command executed by \`${authorUsername}\``
    )
  );

  return component;
}

export function collectGemSearchResults(
  ctx: ComponentContext<"Button">,
  responseMessage: ComponentContext<"Button">["message"],
  originalMessageId: string,
  slotId: 1 | 2 | 3 | "chest" | "pants",
  gemIndex: number,
  gemCount: number
) {
  ctx.client.collectors.create({
    event: "messageCreate",
    filter: (message) => message.author.id === ctx.author.id,
    idle: 1000 * 60,
    timeout: 1000 * 60 * 10,
    run: async (message, stop) => {
      stop();
      await message.delete();

      const query = message.content;
      const gems = await findGemsFromQuery(query);

      if (gems.length === 0) {
        const retryButton = new Button()
          .setLabel(`Try another search for Gem ${gemIndex}/${gemCount}`)
          .setCustomId(
            `gb_retry_gem_${slotId}_${originalMessageId}_${gemIndex}`
          )
          .setStyle(ButtonStyle.Primary);

        await responseMessage.edit({
          content: `You searched for \`${query}\`. No gem matched your query - please try again.`,
          components: [new ActionRow().addComponents(retryButton)],
        });
        return;
      }

      const resultButtons = gems.map((gem, index) =>
        new Button()
          .setLabel(`#${index + 1}`)
          .setCustomId(
            `gb_proceed_gem_${slotId}_${originalMessageId}_${gem.id}_${gemIndex}`
          )
          .setStyle(ButtonStyle.Secondary)
      );

      await responseMessage.edit({
        content: `You searched for \`${query}\`. Select a result:\n${gems
          .map((gem, index) => `#${index + 1} - ${gem.name}`)
          .join("\n")}`,
        components: [new ActionRow().addComponents(...resultButtons)],
      });
    },
    onRunError: (_arg, error, stop) => {
      stop();
      ctx.client.logger.warn(JSON.stringify(error, null, 2));
    },
  });
}
