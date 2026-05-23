import {
  ActionRow,
  Button,
  Command,
  CommandContext,
  createStringOption,
  Declare,
  Embed,
  Options,
} from "seyfert";
import { getData } from "../data/load";
import type { TotalStats } from "../types";
import { EMBED_FOOTER, MAX_LEVEL } from "../constants";
import { formatTotalStats, getScalingMultiplier } from "../utils";
import { getRarityColor } from "../utils";
import { ButtonStyle } from "seyfert/lib/types";

const options = {
  name: createStringOption({
    description: "The name of the item to search for",
    required: true,
    autocomplete: async (interaction) => {
      const itemsData = (await getData()).items;
      const focus = interaction.getInput();
      const response = Object.values(itemsData)
        .filter(
          (val) =>
            val.name.toLowerCase().includes(focus.toLowerCase()) &&
            val.name !== "None" &&
            val.mainType !== "Ship" &&
            val.mainType !== "Gem" &&
            val.mainType !== "Enchant" &&
            val.mainType !== "Hull Armor" &&
            val.mainType !== "Siege Weapon" &&
            val.mainType !== "Deckhand" &&
            val.mainType !== "Ram"
        )
        .slice(0, 25)
        .map((val) => ({ name: val.name, value: val.id }));

      return interaction.respond(response);
    },
  }),
};

@Declare({
  name: "item",
  description: "Gets the stats of an item given its name.",
})
@Options(options)
export default class ItemCommand extends Command {
  override async run(ctx: CommandContext<typeof options>) {
    const response = ctx.options.name;
    const itemsData = (await getData()).items;
    const item = itemsData[response];

    if (!item) {
      await ctx.write({
        content: `Selected item does not exist: ${response}`,
      });
      return;
    }

    const scaling = item?.scaling ?? {};

    const totalStats: TotalStats = {
      power: Math.floor(
        (scaling.power ?? 0) * MAX_LEVEL * getScalingMultiplier("power")
      ),
      defense: Math.floor(
        (scaling.defense ?? 0) * MAX_LEVEL * getScalingMultiplier("defense")
      ),
      agility: Math.floor(
        (scaling.agility ?? 0) * MAX_LEVEL * getScalingMultiplier("other")
      ),
      attackSpeed: Math.floor(
        (scaling.attackSpeed ?? 0) * MAX_LEVEL * getScalingMultiplier("other")
      ),
      attackSize: Math.floor(
        (scaling.attackSize ?? 0) * MAX_LEVEL * getScalingMultiplier("other")
      ),
      intensity: Math.floor(
        (scaling.intensity ?? 0) * MAX_LEVEL * getScalingMultiplier("other")
      ),
      regeneration: Math.floor(
        (scaling.regeneration ?? 0) * MAX_LEVEL * getScalingMultiplier("other")
      ),
      piercing: Math.floor(
        (scaling.piercing ?? 0) * MAX_LEVEL * getScalingMultiplier("other")
      ),
      resistance: Math.floor(
        (scaling.resistance ?? 0) * MAX_LEVEL * getScalingMultiplier("other")
      ),
      insanity: 0,
      warding: scaling.warding ?? 0,
      drawback: scaling.drawback ?? 0,
    };

    const formattedStats = formatTotalStats(totalStats);

    const embed = new Embed()
      .setAuthor({
        name: ctx.author.username,
        iconUrl: ctx.author.avatarURL(),
      })
      .setThumbnail(item.imageId)
      .setTitle(`${item.name} | ${item.id}`)
      .setFields([
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
      ])
      .setColor(getRarityColor(item.rarity))
      .setFooter({ text: EMBED_FOOTER });

    const components = [
      new Button()
        .setLabel("Add Enchant")
        .setCustomId("item_set_enchant")
        .setStyle(ButtonStyle.Secondary),
    ];

    if (item.validModifiers) {
      components.push(
        new Button()
          .setLabel("Add Modifier")
          .setCustomId("item_set_modifier")
          .setStyle(ButtonStyle.Secondary)
      );
    }

    if (item.gemNo) {
      components.push(
        new Button()
          .setLabel("Add Gems")
          .setCustomId("item_set_gems")
          .setStyle(ButtonStyle.Secondary)
      );
    }

    const row = new ActionRow().setComponents(components);

    await ctx.write({
      embeds: [embed],
      components: [row],
    });
  }
}
