import {
  Command,
  CommandContext,
  createStringOption,
  Declare,
  Embed,
  Options,
} from "seyfert";
import { getData } from "../data/load";
import type { TotalStats } from "../types";
import { EMBED_FOOTER } from "../constants";
import { calculateItemStats, formatTotalStats } from "../utils";
import { getRarityColor } from "../utils";

const options = {
  name: createStringOption({
    description: "The name of the item to search for.",
    required: true,
    autocomplete: async (interaction) => {
      const itemsData = (await getData()).items;
      const focus = interaction.getInput();
      const response = Object.values(itemsData)
        .filter(
          (val) =>
            val.name.toLowerCase().includes(focus.toLowerCase()) &&
            val.name !== "None"
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
        content: `Selected item does not exist! Item: ${response}`,
      });
      return;
    }

    const totalStats: TotalStats = calculateItemStats(item);

    const formattedStats = formatTotalStats(totalStats);

    const embed = new Embed()
      .setAuthor({
        name: ctx.author.username,
        iconUrl: ctx.author.avatarURL(),
      })
      .setThumbnail(item.imageId)
      .setTitle(`${item.name} | ${item.id}`)
      .setColor(getRarityColor(item.rarity))
      .setFooter({ text: EMBED_FOOTER })
      .setFields([
        {
          name: "Description",
          value: item.legend,
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
        {
          name: "Stats",
          value: formattedStats,
        },
      ]);

    // const components = [
    //   new Button()
    //     .setLabel("Set Enchant")
    //     .setCustomId("item_set_enchant")
    //     .setStyle(ButtonStyle.Secondary),
    // ];

    // if (item.validModifiers) {
    //   components.push(
    //     new Button()
    //       .setLabel("Set Modifier")
    //       .setCustomId("item_set_modifier")
    //       .setStyle(ButtonStyle.Secondary)
    //   );
    // }

    // if (item.gemNo) {
    //   components.push(
    //     new Button()
    //       .setLabel("Set Gems")
    //       .setCustomId("item_set_gems")
    //       .setStyle(ButtonStyle.Secondary)
    //   );
    // }

    // const row = new ActionRow().setComponents(components);

    await ctx.write({
      embeds: [embed],
      // components: [row],
    });
  }
}
